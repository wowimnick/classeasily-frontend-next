/** sessionStorage key: set when we auto-reload once after a chunk load failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (stale HTML after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.reason?.message || String(error);
  if (typeof message !== "string") return false;
  return (
    /Failed to load chunk/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /dynamically imported module/i.test(message)
  );
}

/**
 * One-shot full page reload when cached HTML references JS chunks removed by a new deployment.
 * @returns {boolean} true if a reload was triggered
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Listen for chunk load failures and recover with a single reload per tab session. */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onError = (event) => {
    if (tryRecoverFromChunkLoadError(event?.error || event?.message)) {
      event.preventDefault?.();
    }
  };

  const onUnhandledRejection = (event) => {
    if (tryRecoverFromChunkLoadError(event?.reason)) {
      event.preventDefault?.();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
}
