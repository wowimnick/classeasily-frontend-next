/** Matches Next.js / Turbopack dynamic import chunk failures after deploys. */
const CHUNK_LOAD_ERROR_PATTERN = /Failed to load chunk/i;

/** Known crawler browser names reported by Sentry. */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "Bingbot",
  "YandexBot",
  "DuckDuckBot",
  "Baiduspider",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
]);

const CRAWLER_UA_PATTERN =
  /googlebot|google-other|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|embedly|pinterest|semrushbot|ahrefsbot|petalbot|applebot|ia_archiver/i;

export function isChunkLoadError(value) {
  if (!value) return false;
  const message =
    typeof value === "string"
      ? value
      : value.message || value.value || String(value);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isCrawlerEvent(event) {
  if (!event) return false;

  const browserTag = event.tags?.browser;
  if (browserTag && CRAWLER_BROWSER_NAMES.has(browserTag)) {
    return true;
  }

  const browserName = event.contexts?.browser?.name;
  if (browserName && CRAWLER_BROWSER_NAMES.has(browserName)) {
    return true;
  }

  const userAgent =
    event.request?.headers?.["User-Agent"] ||
    event.request?.headers?.["user-agent"] ||
    "";
  return CRAWLER_UA_PATTERN.test(userAgent);
}

/**
 * Drop noisy chunk-load errors from crawlers (stale HTML vs purged chunks).
 * Real users are handled by client-side reload recovery instead.
 */
export function shouldDropSentryEvent(event) {
  if (!event) return false;
  const exceptionMessage =
    event.exception?.values?.[0]?.value || event.message || "";
  return isChunkLoadError(exceptionMessage) && isCrawlerEvent(event);
}

export function sentryBeforeSend(event) {
  return shouldDropSentryEvent(event) ? null : event;
}
