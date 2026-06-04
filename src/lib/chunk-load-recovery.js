/** Session flag set before a one-time hard reload after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\da-f]+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk [\da-f]+ failed/i,
];

/**
 * Returns true when the message looks like a Next.js / webpack stale-chunk failure.
 */
export function isChunkLoadError(message) {
  if (!message || typeof message !== "string") {
    return false;
  }
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function getErrorMessage(error) {
  if (!error) {
    return "";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message || String(error);
  }
  if (typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}

/**
 * One-time full page reload after a deployment/chunk mismatch (common on long-lived tabs).
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
  } catch {
    // Private mode / blocked storage — still attempt a single reload.
  }

  window.location.reload();
  return true;
}

/**
 * Listen for chunk load failures and reload once so users pick up the latest build.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const handleChunkFailure = (message) => {
    if (!isChunkLoadError(message)) {
      return;
    }
    tryRecoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.message || getErrorMessage(event.error));
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(getErrorMessage(event.reason));
  });
}
