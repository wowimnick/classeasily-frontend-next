/** Matches Next.js / Turbopack lazy-chunk load failures after deploys or network blips. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
]);

const CRAWLER_UA_PATTERN =
  /googlebot|google-other|bingbot|baiduspider|yandexbot|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

/**
 * @param {import('@sentry/nextjs').ErrorEvent | undefined} event
 */
export function isChunkLoadError(event) {
  const message =
    event?.message ||
    event?.exception?.values?.[0]?.value ||
    event?.exception?.values?.[0]?.type ||
    "";
  return CHUNK_LOAD_ERROR_PATTERN.test(String(message));
}

/**
 * @param {import('@sentry/nextjs').ErrorEvent | undefined} event
 */
export function isCrawlerTraffic(event) {
  const browserName = event?.tags?.["browser.name"] || event?.tags?.browser;
  if (
    typeof browserName === "string" &&
    CRAWLER_BROWSER_NAMES.has(browserName)
  ) {
    return true;
  }

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    "";
  return CRAWLER_UA_PATTERN.test(String(userAgent));
}

/**
 * Drop Sentry events that are not actionable (crawler chunk failures).
 * Real-user chunk errors are kept so deploy-transition impact stays visible.
 *
 * @param {import('@sentry/nextjs').ErrorEvent | undefined} event
 */
export function shouldDropSentryEvent(event) {
  return isChunkLoadError(event) && isCrawlerTraffic(event);
}
