/** sessionStorage key: set when we auto-reload once after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/**
 * Detect Next.js / Turbopack stale-chunk failures after a deployment.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }
  if (error.name === "ChunkLoadError") return true;
  const message = error.message || "";
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

function hasAlreadyAttemptedChunkReload() {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markChunkReloadAttempted() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable in some embedded contexts.
  }
}

/**
 * Reload once so the browser picks up the current deployment's chunk manifest.
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (hasAlreadyAttemptedChunkReload()) return false;

  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

/**
 * Clear the reload guard after a successful navigation so future deploys can recover.
 */
export function clearChunkReloadAttemptFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Listen for chunk load failures that bypass React error boundaries.
 */
export function registerChunkLoadErrorRecovery() {
  if (typeof window === "undefined") return;

  clearChunkReloadAttemptFlag();

  const onUnhandledRejection = (event) => {
    if (tryRecoverFromChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  };

  const onError = (event) => {
    const candidate = event.error ?? event.message;
    if (tryRecoverFromChunkLoadError(candidate)) {
      event.preventDefault();
    }
  };

  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onError);
}

/**
 * Drop first-occurrence chunk load noise; report only when auto-reload did not help.
 */
export function createChunkLoadAwareBeforeSend(existingBeforeSend) {
  return (event, hint) => {
    const error = hint?.originalException;
    if (isChunkLoadError(error)) {
      if (!hasAlreadyAttemptedChunkReload()) {
        tryRecoverFromChunkLoadError(error);
        return null;
      }
    }

    if (typeof existingBeforeSend === "function") {
      return existingBeforeSend(event, hint);
    }
    return event;
  };
}
