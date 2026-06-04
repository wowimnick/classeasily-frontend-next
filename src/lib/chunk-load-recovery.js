/** sessionStorage key: set before a deploy-mismatch reload, cleared after successful load */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|Loading CSS chunk/i;

/**
 * Detect Next.js / Turbopack stale-deployment chunk failures.
 * @param {unknown} error
 */
export function isChunkLoadError(error) {
  if (error == null) return false;
  if (typeof error === "string") return CHUNK_ERROR_PATTERN.test(error);
  const message = error?.message;
  if (typeof message === "string" && CHUNK_ERROR_PATTERN.test(message)) return true;
  const name = error?.name;
  return typeof name === "string" && CHUNK_ERROR_PATTERN.test(name);
}

/**
 * @param {unknown} eventOrReason
 */
export function getChunkLoadErrorMessage(eventOrReason) {
  if (eventOrReason == null) return "";
  if (typeof eventOrReason === "string") return eventOrReason;
  if (typeof eventOrReason?.message === "string") return eventOrReason.message;
  if (typeof eventOrReason?.reason !== "undefined") {
    return getChunkLoadErrorMessage(eventOrReason.reason);
  }
  return String(eventOrReason);
}

/**
 * One automatic reload per tab session when a stale chunk is requested.
 * @param {Storage | null | undefined} storage
 * @returns {{ shouldReload: boolean }}
 */
export function planChunkLoadRecovery(storage) {
  if (!storage) return { shouldReload: true };
  try {
    if (storage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return { shouldReload: false };
    }
    storage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    return { shouldReload: true };
  } catch {
    return { shouldReload: true };
  }
}

export function clearChunkReloadSession(storage) {
  if (!storage) return;
  try {
    storage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Register global handlers for stale chunk errors (post-deploy tab recovery).
 * @param {{ reload?: () => void, storage?: Storage | null }} [options]
 * @returns {() => void} cleanup
 */
export function installChunkLoadRecovery(options = {}) {
  if (typeof window === "undefined") return () => {};

  const reload =
    options.reload ??
    (() => {
      window.location.reload();
    });
  const storage = options.storage ?? window.sessionStorage;

  const onChunkFailure = () => {
    const { shouldReload } = planChunkLoadRecovery(storage);
    if (shouldReload) reload();
  };

  const handleError = (event) => {
    const message = getChunkLoadErrorMessage(event?.error ?? event?.message);
    if (!isChunkLoadError(message) && !isChunkLoadError(event?.error)) return;
    onChunkFailure();
  };

  const handleRejection = (event) => {
    if (!isChunkLoadError(event?.reason)) return;
    onChunkFailure();
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
  };
}

/**
 * Drop expected deploy-mismatch chunk errors from Sentry (recovery handles real users).
 * @param {import('@sentry/nextjs').ErrorEvent} event
 */
export function shouldDropChunkLoadSentryEvent(event) {
  const value =
    event?.exception?.values?.[0]?.value ||
    event?.message ||
    "";
  return isChunkLoadError(value);
}
