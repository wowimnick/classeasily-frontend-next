import { CHUNK_LOAD_ERROR_RE } from "./src/lib/chunk-load-error.js";

const CRAWLER_BROWSER_RE = /GoogleOther|Googlebot/i;

/**
 * Drop stale-chunk noise from crawlers that keep cached HTML after deploys.
 */
export function filterChunkLoadSentryEvent(event) {
  const message =
    event?.exception?.values?.[0]?.value || event?.message || "";
  if (!CHUNK_LOAD_ERROR_RE.test(message)) return event;

  const browser =
    event?.tags?.browser ||
    event?.contexts?.browser?.name ||
    event?.request?.headers?.["User-Agent"] ||
    "";
  if (CRAWLER_BROWSER_RE.test(String(browser))) return null;

  return event;
}

/**
 * Shared Sentry options for client, server, and edge runtimes.
 */
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
    beforeSend: filterChunkLoadSentryEvent,
  };
}
