import { isChunkLoadError } from "./src/lib/is-chunk-load-error.js";

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

/**
 * Drop transient deploy-time chunk failures — not actionable app bugs.
 */
export function shouldDropSentryEvent(event) {
  const exceptionValues = event?.exception?.values;
  if (!exceptionValues?.length) return false;

  return exceptionValues.some((entry) =>
    isChunkLoadError(entry.value || entry.type || ""),
  );
}

export function getBaseSentryOptions({ client = false } = {}) {
  const dsn = getSentryDsn();
  if (!dsn) {
    return null;
  }
  const options = {
    dsn,
    environment: getSentryEnvironment(),
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    enabled: true,
  };

  if (client) {
    options.ignoreErrors = [
      /^Failed to load chunk/i,
      /^Loading chunk \d+ failed/i,
      /ChunkLoadError/i,
    ];
    options.beforeSend = (event) =>
      shouldDropSentryEvent(event) ? null : event;
  }

  return options;
}
