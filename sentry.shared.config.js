import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
  isLikelyCrawlerFromSentryEvent,
} from "./src/lib/chunk-load-error.js";

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

export function shouldDropSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message = event?.exception?.values?.[0]?.value;

  if (
    isChunkLoadError(original) ||
    isChunkLoadError(message) ||
    isChunkLoadSentryEvent(event)
  ) {
    // Crawlers cannot recover via reload; always noise after deploys.
    if (isLikelyCrawlerFromSentryEvent(event)) {
      return true;
    }
    // Real users: recovery reload runs first; drop first-occurrence deploy noise.
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
    beforeSend(event, hint) {
      if (shouldDropSentryEvent(event, hint)) {
        return null;
      }
      return event;
    },
  };
}
