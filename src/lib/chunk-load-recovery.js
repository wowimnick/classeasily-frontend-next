/** sessionStorage key — set before a one-time reload after a stale chunk failure. */
export const CHUNK_LOAD_RELOAD_KEY = "ce-chunk-load-reload";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|dynamically imported module/i;

/**
 * True when the error is a Next.js / Turbopack stale-chunk failure after deploy.
 * @param {unknown} error
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error?.message === "string"
          ? error.message
          : String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

/**
 * Reload once so the browser picks up the current deployment's chunk manifest.
 * @returns {boolean} whether a reload was triggered
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, "1");
  } catch {
    /* sessionStorage may be unavailable in private mode */
  }
  window.location.reload();
  return true;
}

/** Clear the reload guard after a successful full page load. */
export function clearChunkLoadReloadGuard() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_LOAD_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {unknown} reason — ErrorEvent.reason or promise rejection reason
 */
export function handleChunkLoadFailure(reason) {
  if (!isChunkLoadError(reason)) return false;
  return tryRecoverFromChunkLoadError();
}

/**
 * Drop stale-chunk noise from Sentry when we auto-reload (or will on next handler).
 * @param {import('@sentry/nextjs').ErrorEvent} event
 */
export function shouldDropChunkLoadSentryEvent(event) {
  const message = event?.exception?.values?.[0]?.value ?? event?.message ?? "";
  return isChunkLoadError(message);
}
