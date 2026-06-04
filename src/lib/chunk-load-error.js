/** sessionStorage key: set when we auto-reload after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk/i,
];

/**
 * True when the error is a Next.js / Turbopack stale-deployment chunk mismatch.
 * These occur when cached HTML references JS chunks removed after a new deploy.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.reason?.message || String(error);

  if (typeof message !== "string" || !message) return false;

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Reload once so the browser fetches HTML/assets from the current deployment.
 * Returns true when a reload was triggered.
 */
export function tryReloadOnceOnChunkError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Private mode / blocked storage — still attempt one reload.
  }

  window.location.reload();
  return true;
}

function extractErrorFromEvent(event) {
  if (!event) return null;
  if (event.reason !== undefined) return event.reason;
  if (event.error !== undefined) return event.error;
  return event;
}

/**
 * Listen for chunk load failures and recover with a single hard reload.
 * Clears the reload guard after a successful navigation.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return () => {};

  const onChunkFailure = (event) => {
    const error = extractErrorFromEvent(event);
    if (!isChunkLoadError(error)) return;

    if (tryReloadOnceOnChunkError()) {
      event?.preventDefault?.();
    }
  };

  window.addEventListener("unhandledrejection", onChunkFailure);
  window.addEventListener("error", onChunkFailure);

  const clearReloadGuard = () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // ignore
    }
  };
  window.addEventListener("load", clearReloadGuard);

  return () => {
    window.removeEventListener("unhandledrejection", onChunkFailure);
    window.removeEventListener("error", onChunkFailure);
    window.removeEventListener("load", clearReloadGuard);
  };
}
