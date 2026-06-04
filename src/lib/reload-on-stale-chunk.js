const STALE_CHUNK_RELOAD_KEY = "ce_stale_chunk_reload";

/**
 * Reload once per tab session when a stale JS chunk is detected after deploy.
 * Returns true when a reload was initiated.
 */
export function tryReloadForStaleChunk() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY)) {
      return false;
    }
    sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt a single reload.
  }

  window.location.reload();
  return true;
}
