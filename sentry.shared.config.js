import { CHUNK_RELOAD_SESSION_KEY, isChunkLoadError } from "./src/lib/chunkLoadRecovery.js";

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
      const error = hint?.originalException;
      if (!isChunkLoadError(error)) {
        return event;
      }
      // First failure: client reloads to fetch fresh HTML/chunk URLs — skip noise.
      // Second failure in the same session: reload did not help — keep the event.
      if (typeof sessionStorage !== "undefined") {
        try {
          if (!sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
            return null;
          }
        } catch {
          // sessionStorage blocked — still report
        }
      }
      return event;
    },
  };
}
