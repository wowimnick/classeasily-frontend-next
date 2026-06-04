/** sessionStorage key — cleared on successful navigation after reload */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (common after deploys).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.name || String(error);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

/**
 * Reload once per tab session so users pick up fresh chunks after a deployment.
 * @returns {boolean} true when a reload was triggered
 */
export function reloadOnceForStaleChunks() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Register global handlers for chunk load failures.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    reloadOnceForStaleChunks();
  };

  window.addEventListener("error", (event) => {
    handleFailure(event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleFailure(event.reason);
  });
}

/**
 * Sentry beforeSend hook: reload once on stale chunks; suppress first occurrence only.
 * @returns {object|null} null drops the event
 */
export function handleChunkLoadBeforeSend(event, hint) {
  const original = hint?.originalException;
  const message =
    (typeof original === "string" && original) ||
    original?.message ||
    event?.message ||
    "";
  if (!isChunkLoadError(message)) return event;

  if (typeof window === "undefined") return event;

  try {
    if (!sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
      window.location.reload();
      return null;
    }
  } catch {
    return null;
  }

  return event;
}
