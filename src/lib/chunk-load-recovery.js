/** sessionStorage key: set when we auto-reload after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
];

/**
 * True when the error is a Next.js / webpack / turbopack stale chunk load failure
 * (common right after a Vercel deployment when HTML and chunk hashes diverge).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);

  if (CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  const cause = error.cause;
  if (cause && cause !== error) {
    return isChunkLoadError(cause);
  }

  return false;
}

/**
 * Reload once per tab session so users pick up the latest deployment assets.
 * Returns true when a reload was triggered.
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}

function handleChunkLoadFailure(error) {
  if (!isChunkLoadError(error)) return;
  recoverFromChunkLoadError();
}

/**
 * Register global listeners for chunk load failures (window error + unhandled rejections).
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "load",
    () => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
      } catch {
        /* ignore */
      }
    },
    { once: true },
  );

  window.addEventListener("error", (event) => {
    handleChunkLoadFailure(event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkLoadFailure(event.reason);
  });
}
