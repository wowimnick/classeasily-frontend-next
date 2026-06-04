/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

/** sessionStorage key: set before a one-time reload after a chunk load failure. */
export const CHUNK_RELOAD_SESSION_KEY = "classeasily-chunk-reload";

const CHUNK_LOAD_ERROR_PATTERN =
  /(?:loading chunk \d+ failed|failed to load chunk|chunkloaderror)/i;

const CRAWLER_USER_AGENT_PATTERN =
  /googlebot|googleother|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot/i;

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isChunkLoadError(error) {
  return CHUNK_LOAD_ERROR_PATTERN.test(getErrorMessage(error));
}

export function isCrawlerUserAgent(userAgent = "") {
  return CRAWLER_USER_AGENT_PATTERN.test(userAgent);
}

/**
 * Drop chunk-load noise from crawlers and from the first failure we auto-recover via reload.
 */
export function shouldDropChunkLoadErrorEvent(event, hint, { userAgent } = {}) {
  const original = hint?.originalException;
  const message =
    getErrorMessage(original) ||
    event?.exception?.values?.[0]?.value ||
    "";

  if (!CHUNK_LOAD_ERROR_PATTERN.test(message)) {
    return false;
  }

  const resolvedUserAgent =
    userAgent ||
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    "";

  if (isCrawlerUserAgent(resolvedUserAgent)) {
    return true;
  }

  if (typeof sessionStorage !== "undefined") {
    // First failure triggers a reload; only report if reload did not fix it.
    return !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
  }

  return false;
}

export function createSentryBeforeSend(existingBeforeSend) {
  return (event, hint) => {
    if (shouldDropChunkLoadErrorEvent(event, hint)) {
      return null;
    }
    if (existingBeforeSend) {
      return existingBeforeSend(event, hint);
    }
    return event;
  };
}

/** One-time full page reload when a stale JS chunk fails to load after deployment. */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const attemptRecovery = (error) => {
    if (!isChunkLoadError(error)) {
      return false;
    }

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return false;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  };

  window.addEventListener("error", (event) => {
    if (attemptRecovery(event.error ?? event.message)) {
      event.preventDefault?.();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (attemptRecovery(event.reason)) {
      event.preventDefault?.();
    }
  });
}

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
