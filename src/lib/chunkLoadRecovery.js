/** Session flag: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
];

/** Known crawler / preview bots that should not trigger Sentry noise for deploy skew. */
const BOT_USER_AGENT_PATTERN =
  /googlebot|googleother|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

/**
 * Returns true when the value looks like a Next.js / Turbopack stale-chunk load failure.
 * @param {unknown} error
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.toString?.() || "";
  if (!message) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * @param {string | undefined} userAgent
 */
export function isLikelyBotUserAgent(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

/**
 * Decide whether a Sentry error event for a chunk failure should be dropped.
 * @param {Record<string, unknown> | undefined} event
 * @param {unknown} originalException
 */
export function shouldDropChunkLoadSentryEvent(event, originalException) {
  if (!isChunkLoadError(originalException)) return false;

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.contexts?.browser?.name ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (isLikelyBotUserAgent(userAgent)) return true;

  if (typeof sessionStorage !== "undefined") {
    const reloadAttempted = sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
    // First failure: we reload and suppress noise. Second failure: still report.
    if (!reloadAttempted) return true;
  }

  return false;
}

/**
 * Registers global handlers that reload once when a stale JS chunk cannot be fetched
 * (common after Vercel deploys while a tab still has an older HTML shell).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptRecovery = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  };

  window.addEventListener(
    "error",
    (event) => {
      const candidate = event.error ?? event.message;
      if (isChunkLoadError(candidate) && attemptRecovery()) {
        event.preventDefault?.();
      }
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason) && attemptRecovery()) {
      event.preventDefault?.();
    }
  });
}
