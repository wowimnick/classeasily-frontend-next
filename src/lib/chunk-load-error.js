/** Session flag: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/**
 * True when Next.js / Turbopack could not fetch a JS chunk (common after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const message =
    typeof error === "string"
      ? error
      : error.message || String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

/**
 * Crawlers often hit HTML from one deployment and chunks from another; reload does not help.
 */
export function isLikelyCrawler() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot/i.test(
      ua,
    ) || /\bbot\b/i.test(ua)
  );
}

function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Stale chunk failures after deploy are expected; suppress all from Sentry (recovery handles users).
 */
export function shouldSuppressChunkLoadErrorForSentry(error) {
  return isChunkLoadError(error);
}

function tryRecoverFromChunkError(error) {
  if (!isChunkLoadError(error)) return;
  if (isLikelyCrawler()) return;
  if (hasAttemptedChunkReload()) return;
  markChunkReloadAttempted();
  window.location.reload();
}

/**
 * Register global listeners once (instrumentation-client runs on every navigation).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    tryRecoverFromChunkError(event.error ?? { message: event.message });
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecoverFromChunkError(event.reason);
  });
}
