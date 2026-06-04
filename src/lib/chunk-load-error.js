const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|Loading CSS chunk \d+ failed|ChunkLoadError/i;

/**
 * Detect Next.js / Turbopack stale-chunk failures after a deployment.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }

  const message = error.message || String(error);
  if (CHUNK_LOAD_ERROR_PATTERN.test(message)) {
    return true;
  }

  const causeMessage = error.cause?.message;
  return typeof causeMessage === "string" && CHUNK_LOAD_ERROR_PATTERN.test(causeMessage);
}

/**
 * Reload once per tab session so users recover after a deploy without Sentry noise.
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt a reload.
  }

  window.location.reload();
  return true;
}

/**
 * Attempt recovery when a chunk load error is detected.
 */
export function handleChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  return recoverFromChunkLoadError();
}

/**
 * Global listeners for chunk errors thrown outside React error boundaries.
 */
export function registerChunkLoadErrorRecovery() {
  if (typeof window === "undefined") return;

  const onError = (event) => {
    if (handleChunkLoadError(event.error ?? event.message)) {
      event.preventDefault?.();
    }
  };

  const onUnhandledRejection = (event) => {
    if (handleChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
}

export function shouldDropChunkLoadErrorFromSentry(event, hint) {
  if (isChunkLoadError(hint?.originalException)) {
    return true;
  }

  const exceptionValue = event?.exception?.values?.[0]?.value;
  return typeof exceptionValue === "string" && isChunkLoadError(exceptionValue);
}
