/** Session flag to avoid infinite reload loops after a chunk load failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (often after a deploy).
 */
export function isChunkLoadError(error) {
  if (error == null) {
    return false;
  }

  const message =
    typeof error === "string"
      ? error
      : typeof error.message === "string"
        ? error.message
        : String(error);

  const name = typeof error === "object" && error !== null ? error.name : "";

  return (
    name === "ChunkLoadError" ||
    /Failed to load chunk/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

/**
 * Drop chunk-load noise from Sentry; real users get a one-time reload instead.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  if (isChunkLoadError(hint?.originalException)) {
    return true;
  }

  const exceptionValue = event?.exception?.values?.[0]?.value;
  if (isChunkLoadError(exceptionValue)) {
    return true;
  }

  return isChunkLoadError(event?.message);
}

function tryReloadOnceForChunkError() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return false;
  }

  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

/**
 * Recover from stale cached HTML referencing removed JS chunks (common after deploy).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
      tryReloadOnceForChunkError();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault();
      tryReloadOnceForChunkError();
    }
  });
}
