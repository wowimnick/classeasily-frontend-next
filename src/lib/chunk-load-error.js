/** sessionStorage key prefix — one reload attempt per pathname after a deploy. */
export const CHUNK_RELOAD_KEY_PREFIX = "ce-chunk-reload:";

/**
 * True when Next.js / Turbopack failed to fetch a code-split chunk (common after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";
  const name = typeof error === "object" && error.name ? error.name : "";
  return (
    /Failed to load chunk/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    name === "ChunkLoadError"
  );
}

function chunkReloadStorageKey() {
  if (typeof window === "undefined") return null;
  return `${CHUNK_RELOAD_KEY_PREFIX}${window.location.pathname}`;
}

/**
 * Reload once per pathname so users pick up assets from the latest deployment.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;

  const key = chunkReloadStorageKey();
  if (!key || sessionStorage.getItem(key)) return false;

  sessionStorage.setItem(key, "1");
  window.location.reload();
  return true;
}

/**
 * Register global handlers for chunk load failures that never reach a route error boundary.
 */
export function registerChunkLoadRecoveryListeners() {
  if (typeof window === "undefined") return;

  const handle = (error) => {
    if (tryRecoverFromChunkLoadError(error)) return;
  };

  window.addEventListener("error", (event) => {
    handle(event.error ?? { message: event.message });
  });

  window.addEventListener("unhandledrejection", (event) => {
    handle(event.reason);
  });
}
