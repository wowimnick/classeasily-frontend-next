/** sessionStorage key — cleared after a successful page load */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
  /importing a module script failed/i,
];

/**
 * Detect Next.js / webpack / Turbopack chunk load failures after a deploy.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.reason?.message || String(error);
  const name = error?.name || error?.reason?.name || "";

  if (name === "ChunkLoadError") return true;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Reload the page once per tab session when a stale chunk is detected.
 * Returns true if a reload was triggered.
 */
export function reloadOnceForChunkError() {
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

/**
 * Register global listeners and clear the reload guard after a successful load.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onChunkError = (error) => {
    if (!isChunkLoadError(error)) return;
    reloadOnceForChunkError();
  };

  window.addEventListener("error", (event) => {
    onChunkError(event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onChunkError(event.reason);
  });

  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // ignore
    }
  });
}
