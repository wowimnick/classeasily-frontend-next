const CHUNK_RELOAD_KEY = "ce-chunk-load-reload";

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\d]+ failed/i,
  /Loading CSS chunk [\d]+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

/**
 * Detect Next.js / Turbopack chunk load failures (common after deployments when
 * cached HTML references JS chunks that no longer exist on the new deployment).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";

  if (!message) return false;

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/** Clear the one-shot reload guard after a successful page load. */
export function clearChunkLoadReloadFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // sessionStorage may be unavailable (private mode, blocked storage)
  }
}

/**
 * Reload once to fetch fresh HTML/chunk manifests after a deployment mismatch.
 * Returns true when a reload was triggered.
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Register global handlers so chunk failures outside React error boundaries
 * still trigger a single automatic reload.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  clearChunkLoadReloadFlag();

  const handleChunkError = (error) => {
    if (isChunkLoadError(error)) {
      recoverFromChunkLoadError();
    }
  };

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkError(event.reason);
  });

  window.addEventListener("error", (event) => {
    handleChunkError(event.error || event.message);
  });
}
