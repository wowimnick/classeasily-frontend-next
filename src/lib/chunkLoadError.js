/** sessionStorage key — one automatic reload per tab session after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
  /dynamically imported module/i,
];

/**
 * True when the error is a Next.js / Turbopack stale-chunk or network chunk failure.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || String(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Reload the page once per session to pick up assets from the current deployment.
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
  } catch {
    // Private mode / blocked storage — still try one reload
  }

  window.location.reload();
  return true;
}

/**
 * Listen for chunk load failures and auto-reload once (common after Vercel deploys).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (error, event) => {
    if (!isChunkLoadError(error)) return;
    if (attemptChunkLoadRecovery() && event?.preventDefault) {
      event.preventDefault();
    }
  };

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason, event);
  });

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message, event);
  });
}
