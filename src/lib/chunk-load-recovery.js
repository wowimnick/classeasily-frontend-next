/** Session flag: we already tried one hard reload for a stale chunk mismatch. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /(?:Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError)/i;

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_MESSAGE.test(error);
  if (error instanceof Error) {
    if (CHUNK_LOAD_MESSAGE.test(error.message)) return true;
    const cause = error.cause;
    if (cause instanceof Error && CHUNK_LOAD_MESSAGE.test(cause.message)) {
      return true;
    }
  }
  return false;
}

/**
 * Heuristic for crawlers and automated clients (not real users).
 * @returns {boolean}
 */
export function isLikelyBotUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return /googlebot|google-inspectiontool|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i.test(
    userAgent,
  );
}

/**
 * Sentry tags Google crawlers as browser "GoogleOther".
 * @param {import("@sentry/core").Event} event
 * @returns {boolean}
 */
export function isLikelyBotSentryEvent(event) {
  const browser = event?.tags?.browser ?? event?.contexts?.browser?.name;
  if (browser === "GoogleOther") return true;
  const ua =
    event?.request?.headers?.["User-Agent"] ??
    event?.request?.headers?.["user-agent"];
  return isLikelyBotUserAgent(typeof ua === "string" ? ua : "");
}

/**
 * Drop noisy chunk-load errors (bots + post-deploy stale tabs we auto-reload).
 * @param {import("@sentry/core").Event | null} event
 * @param {{ originalException?: unknown }} [hint]
 * @returns {import("@sentry/core").Event | null}
 */
export function filterChunkLoadSentryEvent(event, hint) {
  if (!event) return event;
  const original = hint?.originalException;
  const message =
    (original instanceof Error && original.message) ||
    event.message ||
    event.exception?.values?.[0]?.value ||
    "";
  if (!isChunkLoadError(message) && !isChunkLoadError(original)) {
    return event;
  }
  if (isLikelyBotSentryEvent(event)) return null;
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return null;
    } catch {
      /* sessionStorage may be unavailable */
    }
  }
  return event;
}

/**
 * Reload once when Turbopack/Webpack cannot fetch a JS chunk (common after deploy).
 * @param {unknown} error
 * @returns {boolean} true if a reload was scheduled
 */
export function recoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (isLikelyBotUserAgent(navigator.userAgent)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Register global handlers for stale chunk errors after a deployment.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    recoverFromChunkLoadError(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (recoverFromChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });
}
