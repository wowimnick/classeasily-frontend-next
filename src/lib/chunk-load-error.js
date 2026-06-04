/** Session flag: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/**
 * True when an error is a Next.js / Turbopack dynamic import chunk failure.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_MESSAGE.test(error);
  const message = error?.message || String(error);
  return CHUNK_LOAD_MESSAGE.test(message) || error?.name === "ChunkLoadError";
}

/**
 * Crawlers often keep HTML from an older deployment and cannot recover via reload.
 */
export function isLikelyCrawlerFromSentryEvent(event) {
  const browser = String(
    event?.tags?.browser ||
      event?.contexts?.browser?.name ||
      event?.contexts?.browser?.browser ||
      "",
  );
  if (/GoogleOther|Googlebot|bingbot|HeadlessChrome|AhrefsBot/i.test(browser)) {
    return true;
  }
  const userAgent = String(
    event?.request?.headers?.["User-Agent"] ||
      event?.request?.headers?.["user-agent"] ||
      "",
  );
  return /googlebot|bingbot|spider|crawler|HeadlessChrome/i.test(userAgent);
}

/**
 * Reload once so users pick up JS chunks from the current deployment.
 * @returns {boolean} true when a reload was triggered
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

/**
 * Listen for chunk load failures that never reach a route error boundary.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onLoad = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  };
  window.addEventListener("load", onLoad);

  const handleFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    recoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    handleFailure(event.reason);
  });
}

/**
 * Decide whether a Sentry client event for a chunk failure should be dropped.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message = event?.message || event?.title || "";
  if (!isChunkLoadError(original) && !isChunkLoadError(message)) {
    return false;
  }
  if (isLikelyCrawlerFromSentryEvent(event)) {
    return true;
  }
  if (typeof window !== "undefined") {
    return !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
  }
  return false;
}
