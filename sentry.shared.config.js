import { shouldDropChunkLoadSentryEvent } from "./sentry.chunk-errors.js";

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
  };
}

/** Client-only Sentry options (chunk deploy recovery + noise filtering). */
export function getClientSentryOptions() {
  const base = getBaseSentryOptions();
  if (!base) return null;

  return {
    ...base,
    beforeSend(event) {
      if (shouldDropChunkLoadSentryEvent(event)) {
        return null;
      }
      return event;
    },
  };
}
