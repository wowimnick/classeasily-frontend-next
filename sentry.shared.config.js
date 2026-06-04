/**
 * Shared Sentry options for client, server, and edge runtimes.
 */

/** Matches Next.js / Turbopack dynamic import chunk failures. */
export const CHUNK_LOAD_ERROR_RE =
  /Loading chunk [\d]+ failed|Failed to load chunk|ChunkLoadError/i;

const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
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
 * True when the error is a stale/missing JS chunk after deploy or cache mismatch.
 */
export function isChunkLoadError(error) {
  if (error == null) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || (typeof error?.toString === "function" ? error.toString() : "");
  return CHUNK_LOAD_ERROR_RE.test(message);
}

/**
 * Known crawlers that partially execute JS and often hit deploy-time chunk 404s.
 */
export function isCrawlerBrowserName(name) {
  if (!name || typeof name !== "string") return false;
  const normalized = name.trim();
  if (CRAWLER_BROWSER_NAMES.has(normalized)) return true;
  return /bot|crawler|spider|slurp/i.test(normalized);
}

/**
 * Drop chunk-load noise from crawlers (not actionable for real users).
 */
export function shouldDropSentryEvent(event, hint) {
  const error = hint?.originalException;
  if (!isChunkLoadError(error)) return false;

  const browserName =
    event?.tags?.["browser.name"] || event?.contexts?.browser?.name || "";
  return isCrawlerBrowserName(browserName);
}

export function getSentryBeforeSend() {
  return (event, hint) => (shouldDropSentryEvent(event, hint) ? null : event);
}

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * One automatic full reload when a chunk fails to load (common after Vercel deploy).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryReload = (error) => {
    if (!isChunkLoadError(error)) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  window.addEventListener("unhandledrejection", (event) => {
    tryReload(event.reason);
  });

  window.addEventListener("error", (event) => {
    tryReload(event.error ?? event.message);
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
    beforeSend: getSentryBeforeSend(),
  };
}
