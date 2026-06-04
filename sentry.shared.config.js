/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

/** Matches Next.js / Turbopack dynamic import chunk failures. */
export const CHUNK_LOAD_ERROR_RE =
  /Failed to load chunk|Loading chunk \d+ failed/i;

const CRAWLER_USER_AGENT_RE =
  /Googlebot|GoogleOther|Google-InspectionTool|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot|Bytespider|YandexBot/i;

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

/**
 * @param {string | undefined} userAgent
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_USER_AGENT_RE.test(userAgent);
}

/**
 * @param {string | undefined} browserTag Sentry `browser` tag value
 */
export function isCrawlerBrowserTag(browserTag) {
  if (!browserTag) {
    return false;
  }
  return browserTag === "GoogleOther" || /bot|crawler|spider/i.test(browserTag);
}

/**
 * Drop crawler-only noise from chunk load failures (common on /explore after deploys).
 *
 * @param {import('@sentry/core').Event} event
 * @param {import('@sentry/core').EventHint} [hint]
 */
export function shouldDropSentryEvent(event, hint) {
  const exceptionValue =
    event.exception?.values?.[0]?.value ||
    (hint?.originalException instanceof Error
      ? hint.originalException.message
      : typeof hint?.originalException === "string"
        ? hint.originalException
        : "") ||
    event.message ||
    "";

  if (!CHUNK_LOAD_ERROR_RE.test(exceptionValue)) {
    return false;
  }

  if (isCrawlerBrowserTag(event.tags?.browser)) {
    return true;
  }

  const userAgent =
    event.request?.headers?.["User-Agent"] ||
    event.request?.headers?.["user-agent"] ||
    "";

  return isCrawlerUserAgent(userAgent);
}

export function getSentryBeforeSend() {
  return (event, hint) => (shouldDropSentryEvent(event, hint) ? null : event);
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
    beforeSend: getSentryBeforeSend(),
  };
}
