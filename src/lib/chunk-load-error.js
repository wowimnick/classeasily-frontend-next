/** sessionStorage key: one automatic reload per tab session after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (usually stale HTML after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || (typeof error.toString === "function" ? error.toString() : "");

  if (!message) return false;

  return (
    /Failed to load chunk/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /ChunkLoadError/i.test(error.name || "")
  );
}

/**
 * Reload once so the browser picks up the current deployment's chunk manifest.
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** Clear the reload guard after a successful page load. */
export function clearChunkReloadSessionFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // ignore quota / privacy mode errors
  }
}

/**
 * Drop chunk-load noise from Sentry (transient deploy/cache issues; real users auto-reload).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;

  const exceptionMessage = event?.exception?.values?.[0]?.value;
  if (isChunkLoadError(exceptionMessage)) return true;

  return isChunkLoadError(event?.message);
}
