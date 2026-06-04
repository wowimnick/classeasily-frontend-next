/** sessionStorage key — one automatic reload per tab session on chunk mismatch */
export const CHUNK_RELOAD_SESSION_KEY = "ce_chunk_reload_attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|dynamically imported module/i;

/**
 * True when the error is a Next.js / Turbopack stale-chunk failure after deploy.
 */
export function isChunkLoadError(error) {
  if (error == null) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.value || String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

/**
 * Drop noisy chunk-load events in Sentry (usually deploy skew or crawlers).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;

  const values = event?.exception?.values;
  if (!Array.isArray(values)) return false;
  return values.some((entry) => isChunkLoadError(entry?.value));
}

/**
 * Reload once when a chunk fails to load so users pick up the latest deployment.
 */
export function initChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryReloadOnce = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      /* sessionStorage may be unavailable in private mode */
    }
    window.location.reload();
    return true;
  };

  window.addEventListener(
    "error",
    (event) => {
      if (isChunkLoadError(event.error ?? event.message)) {
        tryReloadOnce();
      }
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      tryReloadOnce();
    }
  });
}
