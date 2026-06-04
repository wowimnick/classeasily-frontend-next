import { isChunkLoadError } from "./src/lib/chunk-load-recovery.js";

/** Transient deployment/cache failures — recovered client-side via auto-reload. */
export const CHUNK_LOAD_IGNORE_ERRORS = [
  /^Failed to load chunk/i,
  /^Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

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
    ignoreErrors: CHUNK_LOAD_IGNORE_ERRORS,
    beforeSend(event, hint) {
      const original = hint?.originalException;
      const message =
        event.exception?.values?.[0]?.value ||
        (original instanceof Error
          ? original.message
          : typeof original === "string"
            ? original
            : "");
      if (isChunkLoadError(message)) {
        return null;
      }
      return event;
    },
  };
}
