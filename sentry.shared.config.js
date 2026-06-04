/**
 * Shared Sentry options for client, server, and edge runtimes.
 */
import { isChunkLoadMessage } from "./src/lib/chunk-load-recovery.js";

/** Turbopack/webpack chunk failures after deploys or for non-JS crawlers. */
const CHUNK_LOAD_IGNORE_PATTERNS = [
  /^Failed to load chunk\b/i,
  /^Loading chunk\b/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

const BOT_USER_AGENT_RE =
  /googlebot|googleother|adsbot-google|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

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

/** @param {string | undefined} browserTag */
export function isKnownCrawlerBrowser(browserTag) {
  if (!browserTag) {
    return false;
  }
  return BOT_USER_AGENT_RE.test(browserTag);
}

/** @param {{ tags?: Record<string, string>, request?: { headers?: Record<string, string> } }} event */
export function isLikelyCrawlerEvent(event) {
  const browserTag = event.tags?.browser ?? event.tags?.["browser.name"];
  if (isKnownCrawlerBrowser(browserTag)) {
    return true;
  }

  const userAgent =
    event.request?.headers?.["User-Agent"] ??
    event.request?.headers?.["user-agent"];
  if (typeof userAgent === "string" && BOT_USER_AGENT_RE.test(userAgent)) {
    return true;
  }

  return false;
}

/** @param {{ exception?: { values?: Array<{ value?: string }> }, message?: string }} event */
export function isChunkLoadSentryEvent(event) {
  const message = event.exception?.values?.[0]?.value ?? event.message ?? "";
  if (isChunkLoadMessage(message)) {
    return true;
  }
  return CHUNK_LOAD_IGNORE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Drop noisy chunk-load errors (deploy skew / crawlers). Real users get an auto-reload
 * via setupChunkLoadRecovery() in instrumentation-client.js.
 */
export function sentryBeforeSend(event, _hint) {
  if (!event) {
    return null;
  }
  if (!isChunkLoadSentryEvent(event)) {
    return event;
  }
  if (isLikelyCrawlerEvent(event)) {
    return null;
  }
  // Transient post-deploy chunk mismatch — recovery handles real users.
  return null;
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

export function getClientSentryOptions() {
  const base = getBaseSentryOptions();
  if (!base) {
    return null;
  }
  return {
    ...base,
    ignoreErrors: CHUNK_LOAD_IGNORE_PATTERNS,
    beforeSend: sentryBeforeSend,
  };
}
