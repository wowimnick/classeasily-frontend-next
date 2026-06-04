/** sessionStorage key: timestamp (ms) of the last chunk-failure reload attempt */
export const CHUNK_RELOAD_TS_KEY = "ce-chunk-reload-ts";

/** Minimum ms between automatic reload attempts after a chunk load failure */
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_LOAD_ERROR_RE =
  /(?:Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|dynamically imported module)/i;

const CRAWLER_UA_RE =
  /bot|crawler|spider|googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|linkedinbot|twitterbot|applebot|semrush|ahrefs/i;

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_ERROR_RE.test(error);
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_LOAD_ERROR_RE.test(message);
}

/**
 * @param {string | undefined | null} userAgent
 * @returns {boolean}
 */
export function isLikelyCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_UA_RE.test(userAgent);
}

/**
 * @param {{ tags?: Record<string, string> }} [event]
 * @param {string | undefined} [userAgent]
 * @returns {boolean}
 */
export function isLikelyCrawler(event, userAgent) {
  const browserTag = event?.tags?.browser || event?.tags?.["browser.name"];
  if (browserTag === "GoogleOther") return true;
  return isLikelyCrawlerUserAgent(userAgent);
}

/**
 * Extract a human-readable message from a Sentry event + hint pair.
 * @param {import("@sentry/core").Event} event
 * @param {{ originalException?: unknown }} [hint]
 * @returns {string}
 */
export function getChunkErrorMessageFromSentryEvent(event, hint) {
  const fromHint = hint?.originalException;
  if (typeof fromHint === "string") return fromHint;
  if (fromHint instanceof Error && fromHint.message) return fromHint.message;
  const value = event.exception?.values?.[0]?.value;
  return typeof value === "string" ? value : "";
}

/**
 * Whether a chunk-load Sentry event should be dropped (crawler noise or recoverable).
 * @param {import("@sentry/core").Event} event
 * @param {{ originalException?: unknown }} [hint]
 * @param {{ userAgent?: string, now?: number, storage?: Pick<Storage, "getItem" | "setItem"> }} [options]
 * @returns {boolean}
 */
export function shouldDropChunkLoadSentryEvent(event, hint, options = {}) {
  const message = getChunkErrorMessageFromSentryEvent(event, hint);
  if (!CHUNK_LOAD_ERROR_RE.test(message)) return false;

  const userAgent = options.userAgent;
  if (isLikelyCrawler(event, userAgent)) return true;

  const storage = options.storage;
  if (!storage) return false;

  const now = options.now ?? Date.now();
  const lastAttemptRaw = storage.getItem(CHUNK_RELOAD_TS_KEY);
  if (!lastAttemptRaw) return true;

  const lastAttempt = parseInt(lastAttemptRaw, 10);
  if (Number.isNaN(lastAttempt)) return true;

  return now - lastAttempt < CHUNK_RELOAD_COOLDOWN_MS;
}

/**
 * Attempt a one-time page reload after a chunk load failure (post-deploy stale cache).
 * @param {{ storage?: Pick<Storage, "getItem" | "setItem">, reload?: () => void, now?: number }} [options]
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadReload(options = {}) {
  const storage = options.storage;
  const reload = options.reload ?? (() => window.location.reload());
  const now = options.now ?? Date.now();

  if (!storage) return false;

  const lastAttemptRaw = storage.getItem(CHUNK_RELOAD_TS_KEY);
  if (lastAttemptRaw) {
    const lastAttempt = parseInt(lastAttemptRaw, 10);
    if (!Number.isNaN(lastAttempt) && now - lastAttempt < CHUNK_RELOAD_COOLDOWN_MS) {
      return false;
    }
  }

  try {
    storage.setItem(CHUNK_RELOAD_TS_KEY, String(now));
  } catch {
    return false;
  }

  reload();
  return true;
}

/**
 * Register global handlers that reload once when a lazy chunk fails to load.
 * Safe to call multiple times; listeners are registered once.
 */
let chunkLoadRecoveryInstalled = false;

export function installChunkLoadRecovery() {
  if (typeof window === "undefined" || chunkLoadRecoveryInstalled) return;
  chunkLoadRecoveryInstalled = true;

  const storage = window.sessionStorage;

  const onFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    if (isLikelyCrawlerUserAgent(navigator.userAgent)) return;
    attemptChunkLoadReload({ storage });
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}
