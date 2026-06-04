import {
  isBotUserAgent,
  isChunkLoadError,
  recoverFromChunkLoadError,
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
  };
}

/** Transient chunk failures after deployments — recovered client-side when possible. */
export function getChunkLoadIgnoreErrors() {
  return [
    /^Loading chunk \d+ failed/i,
    /^Failed to load chunk/i,
    /ChunkLoadError/i,
  ];
}

/**
 * Client-only hook: auto-reload once on stale chunks and drop bot/crawler noise.
 */
export function getClientSentryBeforeSend() {
  return (event, hint) => {
    const error = hint?.originalException;
    const message = event?.message || error?.message || "";
    const isChunkError = isChunkLoadError(error) || isChunkLoadError(message);

    if (isChunkError) {
      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "";
      if (isBotUserAgent(userAgent)) {
        return null;
      }
      if (recoverFromChunkLoadError()) {
        return null;
      }
    }

    return event;
  };
}

export function getClientSentryOptions() {
  const base = getBaseSentryOptions();
  if (!base) {
    return null;
  }
  return {
    ...base,
    ignoreErrors: getChunkLoadIgnoreErrors(),
    beforeSend: getClientSentryBeforeSend(),
  };
}
