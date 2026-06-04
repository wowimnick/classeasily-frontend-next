/** Session flag: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/** Turbopack / webpack dynamic import failures after a new deployment. */
const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\da-f]+ failed/i,
  /ChunkLoadError/i,
];

/**
 * @param {unknown} message
 * @returns {boolean}
 */
export function isChunkLoadError(message) {
  if (message == null) return false;
  const text = typeof message === "string" ? message : String(message);
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * @param {unknown} reason
 * @returns {string | null}
 */
function messageFromReason(reason) {
  if (reason == null) return null;
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "object" && "message" in reason) {
    const msg = reason.message;
    return typeof msg === "string" ? msg : null;
  }
  return String(reason);
}

/**
 * Reload once when a hashed Next.js chunk 404s (common right after Vercel deploy).
 * Real users get a fresh document; bots/crawlers may still fail harmlessly.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = (message) => {
    if (!isChunkLoadError(message)) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptReload(event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptReload(messageFromReason(event.reason));
  });
}
