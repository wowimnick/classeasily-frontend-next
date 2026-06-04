/**
 * Detect and recover from stale Next.js / Turbopack chunk loads after a deploy.
 * Users (or crawlers) with an old HTML shell may request JS chunks that no longer exist.
 */

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|dynamically imported module/i;

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }
  const message = error?.message;
  if (typeof message === "string" && CHUNK_LOAD_ERROR_PATTERN.test(message)) {
    return true;
  }
  const name = error?.name;
  return name === "ChunkLoadError";
}

/**
 * Reload once per tab session so a persistent failure does not loop forever.
 * @param {{ storage?: Storage | null }} [options]
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery(options = {}) {
  if (typeof window === "undefined") return false;

  const storage =
    options.storage ??
    (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  if (storage?.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    return false;
  }

  try {
    storage?.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
  } catch {
    // Private mode / blocked storage — still try one reload.
  }

  window.location.reload();
  return true;
}

/**
 * Register global listeners for chunk load failures (call from instrumentation-client).
 */
export function registerChunkLoadRecoveryListeners() {
  if (typeof window === "undefined") return;

  const handleFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    attemptChunkLoadRecovery();
  };

  window.addEventListener("error", (event) => {
    handleFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleFailure(event.reason);
  });
}
