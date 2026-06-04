/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

const CHUNK_LOAD_ERROR_PATTERNS = [
  /^Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /^ChunkLoadError/i,
];

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
  /googlebot|google-other|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|discordbot|whatsapp/i;

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
 * Detect Next.js / Turbopack chunk load failures after a deployment.
 */
export function isChunkLoadError(error) {
  if (!error) {
    return false;
  }
  const message =
    typeof error === "string"
      ? error
      : error.message || (typeof error.toString === "function" ? error.toString() : "");
  if (!message) {
    return false;
  }
  if (error.name === "ChunkLoadError") {
    return true;
  }
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Drop crawler-driven chunk errors and other transient deploy-mismatch noise.
 */
export function shouldDropSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) {
    return true;
  }

  const value = event?.exception?.values?.[0]?.value || event?.message || "";
  if (isChunkLoadError(value)) {
    return true;
  }

  const browserName = event?.tags?.["browser.name"] || event?.tags?.browser;
  if (browserName && CRAWLER_BROWSER_NAMES.has(String(browserName))) {
    return true;
  }

  const userAgent = event?.request?.headers?.["User-Agent"];
  if (userAgent && CRAWLER_UA_PATTERN.test(userAgent)) {
    return true;
  }

  return false;
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
    ignoreErrors: CHUNK_LOAD_ERROR_PATTERNS,
    beforeSend(event, hint) {
      if (shouldDropSentryEvent(event, hint)) {
        return null;
      }
      return event;
    },
  };
}
