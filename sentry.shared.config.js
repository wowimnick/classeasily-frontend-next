const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
  /dynamically imported module/i,
];

/** Crawlers that often execute JS partially and produce benign chunk noise. */
const BOT_BROWSER_PATTERNS = [/googleother/i, /googlebot/i, /bingbot/i];

function getEventMessage(event) {
  const exception = event?.exception?.values?.[0];
  return exception?.value || event?.message || "";
}

function isChunkLoadMessage(message) {
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Drop stale-chunk load failures and known crawler noise from Sentry.
 * Real users get an automatic one-time reload via registerChunkLoadRecovery().
 */
export function shouldDropSentryEvent(event, hint) {
  const error = hint?.originalException;
  const message =
    (error instanceof Error ? error.message : "") || getEventMessage(event);

  if (isChunkLoadMessage(message)) {
    return true;
  }

  const browser = event?.tags?.browser || event?.contexts?.browser?.name || "";
  if (
    BOT_BROWSER_PATTERNS.some((pattern) => pattern.test(String(browser))) &&
    isChunkLoadMessage(message)
  ) {
    return true;
  }

  return false;
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
    beforeSend(event, hint) {
      if (shouldDropSentryEvent(event, hint)) {
        return null;
      }
      return event;
    },
  };
}
