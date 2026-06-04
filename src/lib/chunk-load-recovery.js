/**
 * Recover from stale Next.js / Turbopack chunks after a deployment.
 * Also helpers to keep crawler noise out of Sentry.
 */

export const CHUNK_RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/** Browsers / UAs that should not drive production error budgets. */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
]);

const CRAWLER_UA_PATTERN =
  /googlebot|googleother|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|petalbot/i;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isChunkLoadError(value) {
  if (!value) return false;
  if (typeof value === "string") return CHUNK_LOAD_MESSAGE.test(value);
  if (value instanceof Error) {
    if (CHUNK_LOAD_MESSAGE.test(value.message)) return true;
    if (value.cause instanceof Error && isChunkLoadError(value.cause)) return true;
  }
  if (typeof value === "object" && value !== null) {
    const message = "message" in value ? String(value.message) : "";
    if (CHUNK_LOAD_MESSAGE.test(message)) return true;
    if ("reason" in value && isChunkLoadError(value.reason)) return true;
  }
  return false;
}

/**
 * @param {string | undefined | null} userAgent
 * @returns {boolean}
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_UA_PATTERN.test(userAgent);
}

/**
 * @param {import("@sentry/types").Event} event
 * @returns {boolean}
 */
export function isCrawlerSentryEvent(event) {
  const browserName =
    event.tags?.["browser.name"] ||
    event.tags?.browser ||
    event.contexts?.browser?.name;
  if (browserName && CRAWLER_BROWSER_NAMES.has(String(browserName))) {
    return true;
  }
  const userAgent =
    event.request?.headers?.["User-Agent"] ||
    event.request?.headers?.["user-agent"] ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return isCrawlerUserAgent(userAgent);
}

/**
 * @returns {boolean}
 */
export function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === "1";
}

/**
 * One hard reload per tab session when a stale chunk is requested.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  if (hasAttemptedChunkReload()) return false;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * @param {import("@sentry/types").Event} event
 * @param {{ originalException?: unknown } | undefined} hint
 * @returns {import("@sentry/types").Event | null}
 */
export function filterSentryEvent(event, hint) {
  if (isCrawlerSentryEvent(event)) return null;

  const original = hint?.originalException;
  const message = event.message || event.exception?.values?.[0]?.value || "";
  if (isChunkLoadError(original) || isChunkLoadError(message)) {
    if (hasAttemptedChunkReload()) {
      return event;
    }
    return null;
  }

  return event;
}

/**
 * Register capture-phase handlers so stale chunks trigger a single reload.
 */
export function initChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleFailure = (value) => {
    if (!isChunkLoadError(value)) return;
    tryRecoverFromChunkLoadError();
  };

  window.addEventListener(
    "error",
    (event) => {
      handleFailure(event.error ?? event.message);
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    handleFailure(event.reason);
  });
}
