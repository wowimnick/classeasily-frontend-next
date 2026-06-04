const CHUNK_RELOAD_KEY = "ce-chunk-reload";

const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
  /dynamically imported module/i,
];

/**
 * Returns true when the error is a Next.js/Turbopack stale-chunk load failure
 * (typically after a deployment while a tab still has old HTML).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Reload once per tab session so a fresh deployment's assets load.
 * Returns true when a reload was triggered.
 */
export function reloadOnceForStaleChunk() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage may be unavailable (private mode, bots); still attempt reload.
  }

  window.location.reload();
  return true;
}

/**
 * Handle chunk load errors: reload once, skip Sentry noise on first attempt.
 * Returns true when the caller should stop (reload triggered or already retried).
 */
export function handleChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  return reloadOnceForStaleChunk();
}

/**
 * Register global listeners so chunk failures reload before error boundaries fire.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (event) => {
    const candidate = event?.reason ?? event?.error ?? event?.message;
    if (handleChunkLoadError(candidate)) {
      event?.preventDefault?.();
    }
  };

  window.addEventListener("unhandledrejection", onFailure);
  window.addEventListener("error", onFailure);
}
