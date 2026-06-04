/** Session key: one automatic reload per tab session for stale JS chunks after deploy. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/**
 * Detect Turbopack / webpack chunk load failures (stale HTML after a Vercel deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }
  const message = error.message || String(error);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

/**
 * Register global handlers that reload once when a stale chunk fails to load.
 * Safe to call only in the browser; no-ops on the server.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // sessionStorage may be unavailable in private mode
    }
  });

  const tryRecover = (error) => {
    if (!isChunkLoadError(error)) return false;

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return false;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return false;
    }

    window.location.reload();
    return true;
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (tryRecover(event.reason)) {
      event.preventDefault();
    }
  });
}

/**
 * Drop transient chunk-load noise from Sentry (handled by auto-reload above).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;

  const message = event?.message || event?.exception?.values?.[0]?.value || "";
  return isChunkLoadError(message);
}
