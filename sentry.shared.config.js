import {
  registerChunkLoadRecovery,
  shouldDropChunkLoadSentryEvent,
} from "./src/lib/sentry-chunk-errors.js";

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
      if (shouldDropChunkLoadSentryEvent(event, hint)) {
        return null;
      }
      return event;
    },
  };
}

/** Client-only: reload once when a stale JS chunk fails after deploy. */
export function initClientSentryExtras() {
  if (typeof window === "undefined") return;
  registerChunkLoadRecovery();
}
