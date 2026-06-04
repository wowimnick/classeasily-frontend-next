const CHUNK_RELOAD_SESSION_KEY = "classeasily-chunk-reload";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|Loading CSS chunk|ChunkLoadError/i;

/**
 * Returns a combined message string from an error-like value.
 */
export function getChunkLoadErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;

  return [
    error.message,
    error.name,
    error.cause?.message,
    error.cause?.name,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Detects Next.js / Turbopack / webpack chunk load failures after deploys.
 */
export function isChunkLoadError(error) {
  return CHUNK_LOAD_ERROR_PATTERN.test(getChunkLoadErrorMessage(error));
}

/**
 * Reload once per tab when stale JS chunks fail to load (common after Vercel deploys).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (error) => {
    if (!isChunkLoadError(error)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;

    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(event.reason);
  });
}

/**
 * Drop transient chunk load errors from Sentry — auto-reload handles recovery.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  if (isChunkLoadError(hint?.originalException)) {
    return true;
  }

  const value = event?.exception?.values?.[0]?.value ?? "";
  return isChunkLoadError(value);
}
