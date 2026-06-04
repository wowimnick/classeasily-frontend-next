/** Session key: one automatic reload per tab after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
];

/** Browser names Sentry tags for non-interactive crawlers (not real users). */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Applebot",
  "PetalBot",
]);

const CRAWLER_UA_MARKERS = [
  "googlebot",
  "google-other",
  "googleother",
  "bingbot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "applebot",
  "petalbot",
  "headlesschrome",
];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isChunkLoadError(value) {
  if (!value) return false;
  if (typeof value === "string") {
    return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(value));
  }
  const name = typeof value.name === "string" ? value.name : "";
  const message = typeof value.message === "string" ? value.message : "";
  return (
    name === "ChunkLoadError" ||
    CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))
  );
}

/**
 * @param {string | undefined | null} userAgent
 * @returns {boolean}
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  const normalized = userAgent.toLowerCase();
  return CRAWLER_UA_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * @param {import("@sentry/core").Event} event
 * @returns {boolean}
 */
export function isCrawlerSentryEvent(event) {
  const tags = event.tags || {};
  const browserName =
    typeof tags["browser.name"] === "string"
      ? tags["browser.name"]
      : typeof tags.browser === "string"
        ? tags.browser
        : "";
  if (browserName && CRAWLER_BROWSER_NAMES.has(browserName)) {
    return true;
  }
  const requestUa =
    typeof event.request?.headers?.["User-Agent"] === "string"
      ? event.request.headers["User-Agent"]
      : typeof event.request?.headers?.["user-agent"] === "string"
        ? event.request.headers["user-agent"]
        : "";
  return isCrawlerUserAgent(requestUa);
}

/**
 * Drop noisy chunk-load errors from crawlers; real users get an auto-reload first.
 *
 * @param {import("@sentry/core").Event | null} event
 * @param {import("@sentry/core").EventHint} hint
 * @returns {import("@sentry/core").Event | null}
 */
export function sentryBeforeSendChunkFilter(event, hint) {
  if (!event) return null;
  const original = hint?.originalException;
  const message = typeof event.message === "string" ? event.message : "";
  if (!isChunkLoadError(original) && !isChunkLoadError(message)) {
    return event;
  }
  if (isCrawlerSentryEvent(event)) {
    return null;
  }
  return event;
}

/**
 * Reload once when Turbopack/webpack chunks 404 after a deployment (stale tab).
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      // sessionStorage may be unavailable; still attempt one reload
    }
    window.location.reload();
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault();
      reloadOnce();
    }
  });

  window.addEventListener(
    "error",
    (event) => {
      const candidate = event.error ?? event.message;
      if (isChunkLoadError(candidate)) {
        reloadOnce();
      }
    },
    true,
  );
}
