/** Session flag set before a one-time hard reload after a stale JS chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/**
 * True when the error is a Next.js / Turbopack stale deployment chunk mismatch.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

/**
 * Reload once per tab session so users pick up assets from the latest deploy.
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Listen for chunk load failures and recover with a single hard reload.
 */
export function registerChunkLoadRecoveryListeners() {
  if (typeof window === "undefined") return;

  const handleChunkFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    attemptChunkLoadRecovery();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
