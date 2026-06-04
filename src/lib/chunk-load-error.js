const CHUNK_RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\da-f]+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

/**
 * True when the error is a Next.js / Turbopack stale chunk fetch failure
 * (common after deploys or with cached HTML referencing removed assets).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";
  const name = typeof error === "object" && error.name ? error.name : "";

  const haystack = `${name} ${message}`;
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(haystack));
}

/**
 * Reload once per tab session so users pick up assets from the current deploy.
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  } catch {
    // Private mode / blocked storage — still attempt one reload.
  }

  window.location.reload();
  return true;
}

/**
 * Register a global handler for unhandled chunk load failures (e.g. lazy routes).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleChunkFailure = (message) => {
    if (!isChunkLoadError(message)) return;
    tryRecoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event?.message || event?.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event?.reason);
  });
}
