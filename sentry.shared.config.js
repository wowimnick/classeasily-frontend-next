/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/** Browsers Sentry tags for crawlers / headless fetchers (not real users). */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Applebot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
]);

const CRAWLER_UA_PATTERN =
  /googlebot|google-other|googleother|bingbot|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|duckduckbot|yandexbot|baiduspider|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

export function getSentryEnvironment() {
  return (
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
}

export function getSentryDsn() {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";
}

export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") return false;
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_PATTERN.test(userAgent);
}

export function isCrawlerBrowserName(browserName) {
  if (!browserName || typeof browserName !== "string") return false;
  return CRAWLER_BROWSER_NAMES.has(browserName);
}

function getEventErrorMessage(event, hint) {
  const original = hint?.originalException;
  if (original && typeof original === "object" && "message" in original) {
    const msg = original.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  const exceptionValue = event?.exception?.values?.[0]?.value;
  if (typeof exceptionValue === "string" && exceptionValue.length > 0) {
    return exceptionValue;
  }
  if (typeof event?.message === "string") return event.message;
  return "";
}

function getEventBrowserName(event) {
  const tags = event?.tags;
  if (Array.isArray(tags)) {
    const browserTag = tags.find(
      (tag) => Array.isArray(tag) && tag[0] === "browser.name",
    );
    if (browserTag?.[1]) return String(browserTag[1]);
  }
  if (tags && typeof tags === "object" && !Array.isArray(tags)) {
    const name = tags["browser.name"];
    if (name) return String(name);
  }
  const contextBrowser = event?.contexts?.browser?.name;
  if (contextBrowser) return String(contextBrowser);
  return "";
}

/**
 * Drop noisy, non-actionable client errors (e.g. crawlers failing to fetch chunks).
 */
export function shouldDropSentryEvent(event, hint) {
  const message = getEventErrorMessage(event, hint);
  if (!isChunkLoadErrorMessage(message)) return false;

  const browserName = getEventBrowserName(event);
  if (isCrawlerBrowserName(browserName)) return true;

  const requestUa = event?.request?.headers?.["User-Agent"];
  if (requestUa && isCrawlerUserAgent(requestUa)) return true;

  if (
    typeof hint?.originalException === "object" &&
    hint.originalException !== null &&
    "navigator" in hint.originalException
  ) {
    const ua = hint.originalException.navigator?.userAgent;
    if (ua && isCrawlerUserAgent(ua)) return true;
  }

  return false;
}

export function sentryBeforeSend(event, hint) {
  if (shouldDropSentryEvent(event, hint)) return null;
  return event;
}

export function getBaseSentryOptions() {
  const dsn = getSentryDsn();
  if (!dsn) {
    return null;
  }
  return {
    dsn,
    environment: getSentryEnvironment(),
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    enabled: true,
    beforeSend: sentryBeforeSend,
  };
}
