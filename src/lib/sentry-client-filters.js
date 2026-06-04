import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
} from "./chunk-load-recovery.js";

/** Browsers Sentry tags for crawlers that cannot recover from SPA chunk reloads. */
const CRAWLER_BROWSER_TAGS = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Bingbot",
  "YandexBot",
  "DuckDuckBot",
  "Baiduspider",
  "facebookexternalhit",
  "Slurp",
  "ia_archiver",
]);

const CRAWLER_UA_PATTERN =
  /googlebot|google-other|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|slurp|ia_archiver|petalbot/i;

function getExceptionMessage(event) {
  const value = event?.exception?.values?.[0]?.value;
  if (typeof value === "string") {
    return value;
  }
  if (typeof event?.message === "string") {
    return event.message;
  }
  return "";
}

export function isCrawlerSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (typeof browserTag === "string" && CRAWLER_BROWSER_TAGS.has(browserTag)) {
    return true;
  }

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.contexts?.browser?.browser ||
    "";

  return typeof userAgent === "string" && CRAWLER_UA_PATTERN.test(userAgent);
}

function hasAttemptedChunkReload() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
  } catch {
    return false;
  }
}

/**
 * Drop noisy crawler chunk errors and defer reporting until after a reload attempt.
 */
export function beforeSendClientEvent(event, _hint) {
  const message = getExceptionMessage(event);
  if (!isChunkLoadError(message)) {
    return event;
  }

  if (isCrawlerSentryEvent(event)) {
    return null;
  }

  // First chunk failure: recovery handler reloads; only report if reload did not help.
  if (!hasAttemptedChunkReload()) {
    return null;
  }

  return event;
}
