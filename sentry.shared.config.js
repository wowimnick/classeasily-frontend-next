import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
  shouldReportChunkLoadErrorToSentry,
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

/**
 * Drop noisy chunk-load errors (crawlers, auto-reload in progress).
 * Import recovery helpers lazily so server bundles do not pull window APIs.
 */
export function createChunkLoadBeforeSend(extra = {}) {
  return (event, hint) => {
    const error = hint?.originalException;
    const isChunk =
      isChunkLoadError(error) || isChunkLoadSentryEvent(event);

    if (!isChunk) {
      return event;
    }

    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : undefined;

    if (
      !shouldReportChunkLoadErrorToSentry({
        error,
        event,
        userAgent,
        reloadScheduled: extra.reloadScheduled?.(),
        reloadAlreadyAttempted: extra.reloadAlreadyAttempted?.(),
      })
    ) {
      return null;
    }

    return event;
  };
}

/** Client-only Sentry init options (beforeSend + shared base). */
export function getClientSentryOptions(recoveryHelpers) {
  const base = getBaseSentryOptions();
  if (!base) {
    return null;
  }
  return {
    ...base,
    beforeSend: createChunkLoadBeforeSend(recoveryHelpers),
  };
}
