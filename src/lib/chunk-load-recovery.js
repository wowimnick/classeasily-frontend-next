/**
 * Detect stale Next.js/Turbopack chunk failures after a deployment and recover
 * with a one-time hard reload. Also helpers for Sentry noise reduction on bots.
 */

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_RE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const BOT_USER_AGENT_RE =
  /googlebot|googleother|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

/** @param {unknown} value */
export function isChunkLoadError(value) {
  if (!value) return false;
  if (typeof value === "string") return CHUNK_LOAD_ERROR_RE.test(value);
  const message =
    typeof value === "object" && value !== null && "message" in value
      ? String(value.message)
      : String(value);
  return CHUNK_LOAD_ERROR_RE.test(message);
}

/** @param {string | undefined | null} userAgent */
export function isLikelyBotUserAgent(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENT_RE.test(userAgent);
}

/**
 * @param {import('@sentry/core').ErrorEvent} event
 * @param {import('@sentry/core').EventHint} hint
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    (original instanceof Error && original.message) ||
    (typeof original === "string" ? original : null) ||
    event.message ||
    event.exception?.values?.[0]?.value ||
    "";
  if (!isChunkLoadError(message)) return false;

  const browserName =
    event.tags?.browser ||
    event.contexts?.browser?.name ||
    event.request?.headers?.["User-Agent"];
  if (typeof browserName === "string" && isLikelyBotUserAgent(browserName)) {
    return true;
  }
  if (browserName === "GoogleOther") return true;

  if (typeof window !== "undefined") {
    if (isLikelyBotUserAgent(window.navigator.userAgent)) return true;
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return true;
  }

  return false;
}

/**
 * Register window listeners for chunk load failures (client-only).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = () => {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  };

  const onChunkFailure = (value) => {
    if (!isChunkLoadError(value)) return;
    attemptReload();
  };

  window.addEventListener("error", (event) => {
    onChunkFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onChunkFailure(event.reason);
  });

  window.addEventListener("load", () => {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  });
}
