/** sessionStorage key: set when we auto-reload once after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const CRAWLER_USER_AGENT =
  /googlebot|googleother|google-other|storebot-google|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|slackbot|linkedinbot|embedly|outbrain|pinterest|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

const CRAWLER_BROWSER_TAG = /googleother|googlebot|bingbot|yandexbot|duckduckbot/i;

/**
 * True when the error is a Next.js / Turbopack dynamic import chunk failure
 * (usually stale HTML after a deployment).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";
  return CHUNK_LOAD_MESSAGE.test(message);
}

export function isLikelyCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_USER_AGENT.test(userAgent);
}

/** Uses Sentry event tags when the browser SDK has classified the client. */
export function isCrawlerSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (browserTag && CRAWLER_BROWSER_TAG.test(String(browserTag))) {
    return true;
  }
  const browserName = event?.contexts?.browser?.name;
  if (browserName && CRAWLER_BROWSER_TAG.test(String(browserName))) {
    return true;
  }
  return false;
}

/**
 * Whether a chunk-load failure should be reported to Sentry.
 * Crawlers and in-flight auto-reloads are dropped to reduce noise.
 */
export function shouldReportChunkLoadErrorToSentry({
  error,
  event,
  reloadAlreadyAttempted = false,
  reloadScheduled = false,
  userAgent,
} = {}) {
  if (!isChunkLoadError(error) && !isChunkLoadSentryEvent(event)) {
    return true;
  }
  if (reloadScheduled || reloadAlreadyAttempted) {
    return false;
  }
  if (isCrawlerSentryEvent(event)) {
    return false;
  }
  if (isLikelyCrawlerUserAgent(userAgent)) {
    return false;
  }
  return true;
}

export function isChunkLoadSentryEvent(event) {
  const values = event?.exception?.values;
  if (Array.isArray(values)) {
    for (const entry of values) {
      if (entry?.value && CHUNK_LOAD_MESSAGE.test(entry.value)) {
        return true;
      }
    }
  }
  if (event?.message && CHUNK_LOAD_MESSAGE.test(String(event.message))) {
    return true;
  }
  return false;
}
