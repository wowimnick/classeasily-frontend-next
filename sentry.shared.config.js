import {
  getChunkReloadSessionKey,
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
} from "./src/lib/chunkLoadRecovery.js";

const CHUNK_LOAD_IGNORE_ERRORS = [
  "Failed to load chunk",
  "Loading chunk",
  "ChunkLoadError",
  "dynamically imported module",
];

function getPrimaryExceptionMessage(event) {
  return event?.exception?.values?.[0]?.value || event?.message || "";
}

function isChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) {
    return true;
  }

  const message = getPrimaryExceptionMessage(event);
  return CHUNK_LOAD_IGNORE_ERRORS.some((fragment) => message.includes(fragment));
}

function shouldDropChunkLoadSentryEvent(event, hint) {
  if (!isChunkLoadSentryEvent(event, hint)) {
    return false;
  }

  const browserName =
    event?.tags?.browser ||
    event?.contexts?.browser?.name ||
    event?.request?.headers?.["User-Agent"];

  if (isLikelyCrawlerUserAgent(String(browserName || ""))) {
    return true;
  }

  if (typeof sessionStorage !== "undefined") {
    try {
      if (!sessionStorage.getItem(getChunkReloadSessionKey())) {
        return true;
      }
    } catch {
      // If storage is unavailable, prefer dropping noisy deploy-time chunk errors.
      return true;
    }
  }

  return false;
}

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
      if (shouldDropChunkLoadSentryEvent(event, hint)) {
        return null;
      }
      return event;
    },
  };
}
