/**
 * Detect and recover from stale Next.js / Turbopack chunk load failures after deploys.
 * When HTML from an older deployment references removed `/_next/static/chunks/*` files,
 * the runtime throws "Failed to load chunk …". A one-time reload fetches fresh assets.
 */

export const STALE_CHUNK_RELOAD_KEY = "ce-stale-chunk-reload";

/** Minimum ms between automatic reload attempts (prevents reload loops). */
export const STALE_CHUNK_RELOAD_COOLDOWN_MS = 10_000;

const STALE_CHUNK_MESSAGE =
  /(?:failed to load chunk|loading chunk \d+ failed|chunkloaderror|loading css chunk \d+ failed)/i;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isStaleChunkLoadError(value) {
  if (value == null) return false;
  if (typeof value === "string") return STALE_CHUNK_MESSAGE.test(value);
  if (value instanceof Error) {
    return (
      STALE_CHUNK_MESSAGE.test(value.message || "") ||
      STALE_CHUNK_MESSAGE.test(String(value.name || ""))
    );
  }
  if (typeof value === "object" && "message" in value) {
    return isStaleChunkLoadError(String(value.message));
  }
  return false;
}

/**
 * @param {unknown} reason
 * @returns {string}
 */
export function getStaleChunkErrorMessage(reason) {
  if (reason instanceof Error) return reason.message || reason.name || "";
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object" && "message" in reason) {
    return String(reason.message);
  }
  return "";
}

/**
 * @param {typeof window | undefined} win
 * @param {number} [now]
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromStaleChunk(win = typeof window !== "undefined" ? window : undefined, now = Date.now()) {
  if (!win?.sessionStorage) return false;

  const lastReload = win.sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY);
  if (lastReload) {
    const elapsed = now - Number(lastReload);
    if (!Number.isNaN(elapsed) && elapsed < STALE_CHUNK_RELOAD_COOLDOWN_MS) {
      return false;
    }
  }

  win.sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, String(now));
  win.location.reload();
  return true;
}

/**
 * Clear reload guard after a successful full page load.
 * @param {typeof window | undefined} [win]
 */
export function clearStaleChunkReloadGuard(win = typeof window !== "undefined" ? window : undefined) {
  try {
    win?.sessionStorage?.removeItem(STALE_CHUNK_RELOAD_KEY);
  } catch {
    // sessionStorage may be unavailable in restricted contexts
  }
}

/**
 * @param {typeof window | undefined} [win]
 */
export function installStaleChunkRecovery(win = typeof window !== "undefined" ? window : undefined) {
  if (!win?.addEventListener) return;

  const onFailure = (reason) => {
    if (!isStaleChunkLoadError(getStaleChunkErrorMessage(reason))) return;
    tryRecoverFromStaleChunk(win);
  };

  win.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  win.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}

/**
 * Drop first-occurrence stale chunk noise in Sentry; report if reload did not help.
 * @param {import('@sentry/nextjs').ErrorEvent} event
 * @param {import('@sentry/nextjs').EventHint} hint
 * @returns {import('@sentry/nextjs').ErrorEvent | null}
 */
export function sentryBeforeSendForStaleChunks(event, hint) {
  const original = hint?.originalException;
  const message =
    getStaleChunkErrorMessage(original) ||
    event.message ||
    event.exception?.values?.[0]?.value ||
    "";

  if (!isStaleChunkLoadError(message)) {
    return event;
  }

  if (typeof window === "undefined" || !window.sessionStorage) {
    return event;
  }

  const lastReload = window.sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY);
  if (!lastReload) {
    return null;
  }

  const elapsed = Date.now() - Number(lastReload);
  if (!Number.isNaN(elapsed) && elapsed < STALE_CHUNK_RELOAD_COOLDOWN_MS) {
    return null;
  }

  return event;
}
