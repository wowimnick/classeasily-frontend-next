const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /failed to load chunk|loading chunk \d+ failed|chunkloaderror|dynamically imported module/i;

function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error.message === "string") return error.message;
  return String(error);
}

/** True when Next/Turbopack failed to fetch a JS chunk (common after deploys). */
export function isChunkLoadError(error) {
  return CHUNK_LOAD_ERROR_PATTERN.test(getErrorMessage(error));
}

/**
 * Reload once so the browser picks up the current deployment's chunks.
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined" || !isChunkLoadError(error)) {
    return false;
  }
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    return false;
  }
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

/** Listen for chunk load failures and auto-reload once per tab session. */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handle = (event) => {
    const error = event?.error ?? event?.reason;
    if (tryRecoverFromChunkLoadError(error)) {
      event.preventDefault?.();
    }
  };

  window.addEventListener("error", handle);
  window.addEventListener("unhandledrejection", handle);
}
