const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
  /dynamically imported module/i,
];

const CRAWLER_UA_PATTERN =
  /googlebot|googleother|google-inspectiontool|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot/i;

/**
 * True when `value` looks like a Next.js / Turbopack stale-chunk load failure.
 */
export function isChunkLoadError(value) {
  if (!value) return false;

  if (typeof value === "string") {
    return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(value));
  }

  const name = value.name || "";
  if (name === "ChunkLoadError") return true;

  const message = value.message || String(value);
  if (CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  const cause = value.cause;
  if (cause && cause !== value) {
    return isChunkLoadError(cause);
  }

  return false;
}

/**
 * Detect common search / preview crawlers that execute JS poorly and should not
 * drive chunk-load Sentry noise.
 */
export function isCrawlerUserAgent(userAgent) {
  const ua =
    userAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;
  return CRAWLER_UA_PATTERN.test(ua);
}

/**
 * Whether a chunk-load error should be dropped from Sentry ingestion.
 */
export function shouldDropChunkLoadSentryEvent(
  error,
  { reloadAttempted, userAgent } = {},
) {
  if (!isChunkLoadError(error)) return false;
  if (isCrawlerUserAgent(userAgent)) return true;
  return !reloadAttempted;
}
