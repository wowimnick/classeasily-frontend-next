/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "Bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
]);

const CRAWLER_UA_PATTERN = /bot|crawler|spider|googleother|headless/i;

export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") return false;
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isLikelyCrawlerFromEvent(event) {
  const browser = event?.tags?.browser ?? event?.contexts?.browser?.name;
  if (browser && CRAWLER_BROWSER_NAMES.has(browser)) return true;

  const userAgent =
    event?.request?.headers?.["User-Agent"] ??
    event?.contexts?.browser?.browser;
  if (typeof userAgent === "string" && CRAWLER_UA_PATTERN.test(userAgent)) {
    return true;
  }

  return false;
}

export function getExceptionMessage(event) {
  return event?.exception?.values?.[0]?.value ?? event?.message ?? "";
}

/** Drop crawler-only chunk load failures (not actionable for real users). */
export function shouldDropSentryEvent(event) {
  const message = getExceptionMessage(event);
  if (!isChunkLoadErrorMessage(message)) return false;
  return isLikelyCrawlerFromEvent(event);
}

export function createSentryBeforeSend() {
  return (event) => {
    if (shouldDropSentryEvent(event)) return null;
    return event;
  };
}

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
    beforeSend: createSentryBeforeSend(),
  };
}
