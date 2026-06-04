/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

/** Session key: one automatic reload per tab after a stale-chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /failed to load chunk|loading chunk \d+ failed|chunkloaderror/i;

/** User agents Sentry tags as bot/crawler traffic (not actionable app bugs). */
const BOT_BROWSER_TAGS = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
]);

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
 * True when the message looks like a Next.js / Turbopack stale deployment chunk miss.
 */
export function isChunkLoadErrorMessage(message) {
  if (typeof message !== "string" || !message) {
    return false;
  }
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

/**
 * Extract a human-readable message from a Sentry event or Error-like value.
 */
export function getErrorMessageFromUnknown(error) {
  if (!error) {
    return "";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}

/**
 * True when Sentry event metadata indicates a crawler rather than a real user session.
 */
export function isLikelyBotSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (typeof browserTag === "string" && BOT_BROWSER_TAGS.has(browserTag)) {
    return true;
  }
  const browserName = event?.contexts?.browser?.name;
  if (typeof browserName === "string" && BOT_BROWSER_TAGS.has(browserName)) {
    return true;
  }
  return false;
}

/**
 * Patterns for Sentry ignoreErrors — stale chunk loads after deploy are not app defects.
 */
export function getChunkLoadIgnorePatterns() {
  return [CHUNK_LOAD_ERROR_PATTERN];
}

/**
 * Drop stale chunk-load noise (especially crawlers during deploy). Real users get an
 * automatic reload from setupChunkLoadRecovery() before this runs in most cases.
 */
export function sentryBeforeSend(event, hint) {
  const exceptionValue = event?.exception?.values?.[0]?.value;
  const hintMessage = getErrorMessageFromUnknown(hint?.originalException);
  const message = exceptionValue || hintMessage || event?.message || "";

  if (!isChunkLoadErrorMessage(message)) {
    return event;
  }

  if (isLikelyBotSentryEvent(event)) {
    return null;
  }

  // After deploy, a one-time reload fixes real users; remaining reports are not actionable.
  return null;
}

/**
 * Register window listeners that reload once when a stale JS chunk fails to load.
 * Call only in the browser (instrumentation-client.js).
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const attemptReload = (message) => {
    if (!isChunkLoadErrorMessage(message)) {
      return;
    }
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      // Private mode / blocked storage — still try reload once per handler invocation.
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    const message =
      event?.message || getErrorMessageFromUnknown(event?.error);
    attemptReload(message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptReload(getErrorMessageFromUnknown(event?.reason));
  });
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
    ignoreErrors: getChunkLoadIgnorePatterns(),
    beforeSend: sentryBeforeSend,
  };
}
