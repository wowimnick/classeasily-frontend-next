import {
  CHUNK_RELOAD_SESSION_KEY,
  isBotChunkLoadSentryEvent,
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "./src/lib/chunk-load-recovery.js";

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
      if (isBotChunkLoadSentryEvent(event)) {
        return null;
      }
      const original = hint?.originalException;
      if (!isChunkLoadError(original)) {
        return event;
      }
      if (
        typeof window !== "undefined" &&
        sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)
      ) {
        return event;
      }
      if (typeof window !== "undefined") {
        tryRecoverFromChunkLoadError();
      }
      return null;
    },
  };
}
