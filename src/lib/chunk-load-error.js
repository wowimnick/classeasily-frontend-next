const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
];

/**
 * True for transient Next.js / Turbopack chunk fetch failures (common after deploys).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";

  if (CHUNK_LOAD_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  const cause = error.cause;
  if (cause && cause !== error) {
    return isChunkLoadError(cause);
  }

  return false;
}

/**
 * Reload once per browser tab session when a stale chunk fails to load.
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined" || !isChunkLoadError(error)) {
    return false;
  }

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

/** Clear the one-shot reload guard after a successful full page load. */
export function clearChunkReloadGuard() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // Ignore private browsing / blocked storage.
  }
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  clearChunkReloadGuard();

  const handleChunkFailure = (event) => {
    const error = event?.reason ?? event?.error ?? event;
    if (tryRecoverFromChunkLoadError(error)) {
      event?.preventDefault?.();
    }
  };

  window.addEventListener("unhandledrejection", handleChunkFailure);
  window.addEventListener("error", handleChunkFailure);
}
