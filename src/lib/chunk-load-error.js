/** Session flag so we only auto-reload once per tab after a chunk load failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
];

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (common after deploy).
 */
export function isChunkLoadError(error) {
  if (error == null) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || (typeof error.toString === "function" ? error.toString() : "");
  const name = typeof error === "object" && error !== null ? error.name || "" : "";

  return CHUNK_LOAD_PATTERNS.some(
    (pattern) => pattern.test(message) || (name && pattern.test(name)),
  );
}

/**
 * Reload the page once to pick up assets from the current deployment.
 * @returns {boolean} true if a reload was triggered
 */
export function reloadForChunkError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt one reload
  }

  window.location.reload();
  return true;
}
