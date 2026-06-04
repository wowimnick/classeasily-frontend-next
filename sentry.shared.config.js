import {
  isChunkLoadError,
  isLikelyBotSentryEvent,
} from "./src/lib/chunkLoadRecovery.js";

/** Drop noisy, usually non-actionable chunk load failures in Sentry. */
export const CHUNK_LOAD_IGNORE_ERRORS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
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
      if (!isChunkLoadError(original)) {
        return event;
      }
      // Crawlers often hit stale chunk URLs during deploys; not actionable.
      if (isLikelyBotSentryEvent(event)) {
        return null;
      }
      // Real users get an automatic reload; suppress the first report.
      return null;
    },
  };
}
