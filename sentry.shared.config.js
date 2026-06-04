import {
  isChunkLoadError,
  shouldSuppressChunkLoadErrorInSentry,
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
      const original = hint?.originalException;
      if (shouldSuppressChunkLoadErrorInSentry(original)) {
        return null;
      }
      const message =
        (typeof original === "string" ? original : null) ||
        event?.exception?.values?.[0]?.value;
      if (
        typeof message === "string" &&
        isChunkLoadError(message) &&
        typeof window !== "undefined" &&
        shouldSuppressChunkLoadErrorInSentry({ message })
      ) {
        return null;
      }
      return event;
    },
  };
}
