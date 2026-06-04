const STALE_CHUNK_RELOAD_KEY = "ce_stale_chunk_reload";

const CHUNK_LOAD_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk [\d]+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
];

/**
 * True when a dynamic import failed because JS chunks no longer match the
 * deployed build (common right after a Vercel deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || (typeof error.toString === "function" ? error.toString() : "");

  if (typeof error === "object" && error.name === "ChunkLoadError") {
    return true;
  }

  if (CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  if (typeof error === "object" && error.cause) {
    return isChunkLoadError(error.cause);
  }

  return false;
}

/**
 * Reload once per tab session so users recover after a deploy without loops.
 * @returns {boolean} true when a reload was triggered
 */
export function reloadOnceForStaleDeployment() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) === "1") {
      return false;
    }
    sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt one reload
  }

  window.location.reload();
  return true;
}

/** Clear the reload guard after a successful full page load. */
export function clearStaleChunkReloadFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY);
  } catch {
    // ignore
  }
}

/**
 * Detect stale chunk errors and reload once. Used by error boundaries and globals.
 * @returns {boolean} true when reload was triggered (caller should skip Sentry)
 */
export function handleStaleChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  return reloadOnceForStaleDeployment();
}
