/** sessionStorage key set when we auto-reload after a stale chunk failure. */
export const CHUNK_LOAD_RELOAD_KEY = "ce-chunk-load-reload";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|dynamically imported module/i;

/**
 * True when an error is a Next.js / Turbopack stale chunk load failure
 * (typically after a deployment while the tab still has old HTML).
 */
export function isChunkLoadError(errorOrMessage) {
  const message =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage?.message || String(errorOrMessage ?? "");
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

/**
 * Reload once per tab session so users pick up the latest deployment assets.
 * Returns true when a reload was triggered.
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, "1");
  } catch {
    // Private mode / blocked storage — still attempt one reload.
  }

  window.location.reload();
  return true;
}

/**
 * Listen for chunk load failures and reload once to fetch fresh assets.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const handleChunkFailure = (payload) => {
    if (!isChunkLoadError(payload)) {
      return;
    }
    recoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
