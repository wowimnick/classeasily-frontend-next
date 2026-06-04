/** Session flag: a full page reload was already tried for a stale chunk after deploy. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/** Crawlers often keep cached HTML and cannot recover from a deploy-time chunk mismatch. */
const CRAWLER_USER_AGENT =
  /Googlebot|GoogleOther|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot/i;

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_MESSAGE.test(error);
  const message = error?.message;
  if (typeof message === "string" && CHUNK_LOAD_MESSAGE.test(message)) return true;
  const name = error?.name;
  return typeof name === "string" && name === "ChunkLoadError";
}

/**
 * @param {string} [userAgent]
 * @returns {boolean}
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENT.test(userAgent);
}

/**
 * @returns {boolean}
 */
export function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Reload once so the browser picks up the current deployment's chunk manifest.
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;
  if (hasAttemptedChunkReload()) return false;
  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

/**
 * @param {unknown} error
 * @returns {boolean} true when recovery was triggered
 */
export function handleChunkLoadError(error) {
  if (!isChunkLoadError(error)) return false;
  return attemptChunkLoadRecovery();
}

/**
 * Sentry beforeSend: drop noisy deploy-mismatch chunk errors unless reload already failed.
 * @param {import('@sentry/nextjs').ErrorEvent} event
 * @param {{ originalException?: unknown }} [hint]
 * @param {{ userAgent?: string, reloadAttempted?: boolean }} [options]
 * @returns {import('@sentry/nextjs').ErrorEvent | null}
 */
export function filterChunkLoadSentryEvent(event, hint, options = {}) {
  const original = hint?.originalException;
  const message =
    (typeof original === "string" ? original : original?.message) ||
    event?.message ||
    "";

  if (!isChunkLoadError(original) && !isChunkLoadError(message)) {
    return event;
  }

  const userAgent =
    options.userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (userAgent && isCrawlerUserAgent(userAgent)) {
    return null;
  }

  const reloadAttempted =
    options.reloadAttempted ?? hasAttemptedChunkReload();
  if (reloadAttempted) {
    return event;
  }

  return null;
}
