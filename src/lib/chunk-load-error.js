/** SessionStorage key — set when we auto-reload after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "classeasily-chunk-reload";

const CHUNK_LOAD_ERROR_RE =
  /(?:Loading chunk [\d]+ failed|Failed to load chunk|ChunkLoadError)/i;

/** Known crawlers that execute JS but cannot recover via a client reload. */
const BOT_USER_AGENT_RE =
  /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i;

/**
 * Returns true for webpack / Turbopack dynamic-import chunk failures, usually
 * caused by a stale tab after a new Vercel deployment.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const message =
    typeof error === "string" ? error : error.message || String(error);
  return CHUNK_LOAD_ERROR_RE.test(message);
}

export function isBotUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return BOT_USER_AGENT_RE.test(userAgent);
}

/**
 * Reload once per browser session when a stale chunk fails after deployment.
 * Returns true if a reload was triggered (caller should suppress reporting).
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    return false;
  }
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}
