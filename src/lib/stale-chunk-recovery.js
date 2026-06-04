/**
 * Recover from stale JS chunks after a deployment (HTML references old hashes).
 * Turbopack/Next dynamic imports throw when cached pages request missing chunks.
 */

export const STALE_CHUNK_RELOAD_KEY = "ce-stale-chunk-reload";

const STALE_CHUNK_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\w-]+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  const message = error.message || error.toString?.() || "";
  const cause = error.cause?.message;
  return cause ? `${message} ${cause}` : message;
}

export function isStaleChunkLoadError(error) {
  const message = getErrorMessage(error);
  return STALE_CHUNK_PATTERNS.some((pattern) => pattern.test(message));
}

export function hasAttemptedStaleChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

export function markStaleChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, "1");
  } catch {
    /* private browsing / blocked storage */
  }
}

/**
 * Reload once per tab session when a stale chunk is detected.
 * @returns {boolean} true when a reload was triggered
 */
export function attemptStaleChunkRecovery() {
  if (typeof window === "undefined") return false;
  if (hasAttemptedStaleChunkReload()) return false;

  markStaleChunkReloadAttempted();
  window.location.reload();
  return true;
}

function handleStaleChunkError(error) {
  if (!isStaleChunkLoadError(error)) return;
  attemptStaleChunkRecovery();
}

/**
 * Register global handlers for chunk load failures (client-only).
 */
export function installStaleChunkRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    handleStaleChunkError(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleStaleChunkError(event.reason);
  });
}

export function isStaleChunkSentryEvent(event) {
  const values = event?.exception?.values;
  if (!Array.isArray(values)) {
    return isStaleChunkLoadError(event?.message);
  }
  return values.some((entry) =>
    isStaleChunkLoadError(entry?.value || entry?.type),
  );
}
