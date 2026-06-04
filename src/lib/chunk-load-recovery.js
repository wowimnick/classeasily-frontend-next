/** sessionStorage key — one automatic reload per tab session for stale chunk HTML */
export const CHUNK_RELOAD_SESSION_KEY = "ce_chunk_reload_attempted";

const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
];

/**
 * True for Next.js / Turbopack stale-chunk errors after deploy or cache mismatch.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
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
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Drop noisy chunk-load events from Sentry (handled via reload for real users).
 */
export function shouldDropChunkLoadSentryEvent(event) {
  const message =
    event?.exception?.values?.[0]?.value ||
    event?.message ||
    event?.logentry?.message ||
    "";
  return isChunkLoadError(message);
}
