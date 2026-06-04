import {
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
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

/**
 * Drop stale chunk-load noise (deploy skew + crawlers). Real users get one auto-reload first.
 */
export function sentryBeforeSend(event, hint) {
  const original = hint?.originalException;
  const message =
    (typeof original?.message === "string" && original.message) ||
    event?.message ||
    "";
  const errorLike = original || (message ? { message } : null);

  if (errorLike && isChunkLoadError(errorLike)) {
    const browserName = event?.tags?.["browser.name"] || event?.contexts?.browser?.name;
    if (browserName && isLikelyCrawlerUserAgent(String(browserName))) {
      return null;
    }
    const ua =
      event?.request?.headers?.["User-Agent"] ||
      event?.request?.headers?.["user-agent"] ||
      "";
    if (ua && isLikelyCrawlerUserAgent(String(ua))) {
      return null;
    }
  }

  return event;
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
    beforeSend: sentryBeforeSend,
  };
}
