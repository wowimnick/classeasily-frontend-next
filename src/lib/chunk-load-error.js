const CHUNK_LOAD_MESSAGE_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
  /importing a module script failed/i,
];

export const CHUNK_RELOAD_STORAGE_KEY = "classeasily:chunk-reload-attempted";

/**
 * True when a dynamic import / Next.js chunk failed to load (common after deploys).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || (typeof error.toString === "function" ? error.toString() : "");
  const name = typeof error === "object" && error !== null ? error.name || "" : "";

  return CHUNK_LOAD_MESSAGE_PATTERNS.some(
    (pattern) => pattern.test(message) || pattern.test(name),
  );
}

/**
 * Reload the page once per tab session after a chunk failure so users pick up the latest build.
 * Returns true when a reload was triggered.
 */
export function reloadOnceAfterChunkFailure() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(Date.now()));
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}

/**
 * Client-only: attempt a one-shot reload when the error is a stale chunk load.
 */
export function recoverFromChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  return reloadOnceAfterChunkFailure();
}

/**
 * Register global handlers so chunk failures reload before error boundaries report them.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onUnhandledRejection = (event) => {
    const reason = event?.reason;
    if (!isChunkLoadError(reason)) return;
    if (recoverFromChunkLoadError(reason)) {
      event.preventDefault?.();
    }
  };

  const onError = (event) => {
    const candidate = event?.error ?? event?.message;
    if (!isChunkLoadError(candidate)) return;
    recoverFromChunkLoadError(candidate);
  };

  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onError);
}

export const sentryChunkLoadIgnorePatterns = [
  /^Failed to load chunk/i,
  /^Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];
