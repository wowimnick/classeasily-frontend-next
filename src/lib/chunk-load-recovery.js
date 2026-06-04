/** Session key: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/** Next.js / Turbopack messages when HTML references JS removed by a new deploy. */
const STALE_CHUNK_MESSAGE_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\w-]+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk [\w-]+ failed/i,
];

export function isStaleChunkLoadMessage(message) {
  if (typeof message !== "string" || !message) {
    return false;
  }
  return STALE_CHUNK_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function isStaleChunkLoadError(error) {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return isStaleChunkLoadMessage(error);
  }
  if (isStaleChunkLoadMessage(error.message)) {
    return true;
  }
  if (error.cause && isStaleChunkLoadError(error.cause)) {
    return true;
  }
  return false;
}

export function shouldAttemptChunkReload(storage) {
  try {
    return storage?.getItem(CHUNK_RELOAD_SESSION_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markChunkReloadAttempted(storage) {
  try {
    storage?.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable (private mode, SSR)
  }
}

function messageFromUnhandledRejection(reason) {
  if (!reason) {
    return "";
  }
  if (typeof reason === "string") {
    return reason;
  }
  if (reason instanceof Error) {
    return reason.message || String(reason);
  }
  return String(reason);
}

/**
 * Reload once when a deploy left the browser with HTML that references missing chunks.
 * Returns true when a reload was scheduled (caller should avoid reporting to Sentry).
 */
export function tryRecoverFromStaleChunkLoad(
  message,
  { storage = typeof sessionStorage !== "undefined" ? sessionStorage : null, reload = () => window.location.reload() } = {},
) {
  if (!isStaleChunkLoadMessage(message) || !shouldAttemptChunkReload(storage)) {
    return false;
  }
  markChunkReloadAttempted(storage);
  reload();
  return true;
}

export function getChunkLoadSentryOptions() {
  return {
    ignoreErrors: STALE_CHUNK_MESSAGE_PATTERNS,
    beforeSend(event) {
      const message = event?.exception?.values?.[0]?.value || event?.message || "";
      if (isStaleChunkLoadMessage(message)) {
        return null;
      }
      return event;
    },
  };
}

/**
 * Register global listeners for stale chunk failures (production client bootstrap).
 */
export function registerChunkLoadRecovery(
  target = typeof window !== "undefined" ? window : null,
) {
  if (!target?.addEventListener) {
    return;
  }

  const storage = target.sessionStorage;

  target.addEventListener("error", (event) => {
    const message = event?.message || event?.error?.message || "";
    tryRecoverFromStaleChunkLoad(message, { storage, reload: () => target.location.reload() });
  });

  target.addEventListener("unhandledrejection", (event) => {
    const message = messageFromUnhandledRejection(event?.reason);
    tryRecoverFromStaleChunkLoad(message, { storage, reload: () => target.location.reload() });
  });
}
