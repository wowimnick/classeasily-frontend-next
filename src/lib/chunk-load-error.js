/** Matches Next.js / Turbopack dynamic import chunk failures after deploys. */
export const CHUNK_LOAD_ERROR_RE =
  /Loading chunk [\d]+ failed|Failed to load chunk|ChunkLoadError/i;

const CRAWLER_UA_RE =
  /Googlebot|Google-InspectionTool|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot|SemrushBot|AhrefsBot|HeadlessChrome/i;

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || (typeof error.toString === "function" ? error.toString() : "");
  return CHUNK_LOAD_ERROR_RE.test(message);
}

export function isLikelyCrawlerClient() {
  if (typeof navigator === "undefined") return false;
  return CRAWLER_UA_RE.test(navigator.userAgent || "");
}

/**
 * One automatic full reload per tab session when a stale JS chunk fails to load.
 * Returns true when a reload was triggered (caller should skip Sentry reporting).
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
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
 * Whether a chunk-load failure should be reported after recovery was attempted.
 */
export function shouldReportChunkLoadErrorToSentry() {
  if (isLikelyCrawlerClient()) return false;
  if (typeof sessionStorage === "undefined") return true;
  try {
    return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
  } catch {
    return true;
  }
}
