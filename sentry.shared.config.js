import { isChunkLoadError } from "./src/lib/chunk-load-error.js";

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
    ignoreErrors: [
      /^Failed to load chunk/i,
      /^Loading chunk [\da-f]+ failed/i,
      /^ChunkLoadError/i,
    ],
    beforeSend(event, hint) {
      if (isChunkLoadError(hint?.originalException)) {
        return null;
      }
      const message = event?.message || event?.exception?.values?.[0]?.value;
      if (isChunkLoadError(message)) {
        return null;
      }
      return event;
    },
  };
}
