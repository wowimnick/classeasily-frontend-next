/** sessionStorage key: set when we auto-reload once after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/**
 * True when Next/Turbopack could not fetch a code-split chunk (common after deploys).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const message = typeof error.message === "string" ? error.message : String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

/**
 * Heuristic for crawlers that often hit stale assets during deploys (not actionable in Sentry).
 */
export function isLikelyCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return /Googlebot|GoogleOther|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|SemrushBot|AhrefsBot|Applebot/i.test(
    userAgent,
  );
}

/**
 * Reload the page once per tab session so users pick up fresh chunks after a deployment.
 * @returns {boolean} true if a reload was triggered
 */
export function reloadPageOnceForChunkError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** Clear the reload guard after a successful navigation (call from client instrumentation). */
export function clearChunkReloadGuard() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Whether this error should be dropped from Sentry (recoverable deploy mismatch or crawler noise).
 */
export function shouldSuppressChunkLoadReport(error, userAgent) {
  if (!isChunkLoadError(error)) return false;
  if (isLikelyCrawlerUserAgent(userAgent)) return true;
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}
