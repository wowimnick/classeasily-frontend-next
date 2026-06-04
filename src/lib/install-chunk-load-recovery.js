import {
  CHUNK_RELOAD_SESSION_KEY,
  clearChunkReloadAttempt,
  isChunkLoadError,
  markChunkReloadAttempted,
} from "./chunk-load-error";

function tryRecoverFromChunkError(reason) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(reason)) return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1") {
      clearChunkReloadAttempt();
      return false;
    }
    markChunkReloadAttempted();
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

function handleChunkFailure(reason) {
  tryRecoverFromChunkError(reason);
}

/**
 * Register global handlers so real users recover after a deploy without filing Sentry noise.
 * Safe to call multiple times (guarded by a window flag).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  if (window.__ceChunkLoadRecoveryInstalled) return;
  window.__ceChunkLoadRecoveryInstalled = true;

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
