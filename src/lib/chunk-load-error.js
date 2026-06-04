/** Patterns for Next.js / Turbopack dynamic import failures after a new deployment. */
export const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
];

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * @param {unknown} errorOrMessage
 * @returns {boolean}
 */
export function isChunkLoadError(errorOrMessage) {
  const message =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage?.message || String(errorOrMessage ?? "");
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Reload once when a stale bundle references missing chunks (common during Vercel deploys).
 * Uses sessionStorage to avoid infinite reload loops.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (errorOrMessage) => {
    if (!isChunkLoadError(errorOrMessage)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.message || event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(event.reason);
  });

  window.addEventListener("load", () => {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  });
}
