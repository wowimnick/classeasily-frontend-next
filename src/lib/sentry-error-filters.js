/**
 * Detect Next.js / Turbopack stale chunk load failures (common after deploys).
 */
export function isStaleChunkLoadError(message) {
  if (!message || typeof message !== "string") return false;
  return (
    message.includes("Failed to load chunk") ||
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    /dynamically imported module/i.test(message)
  );
}

/** Known crawler / prefetch bots that should not drive Sentry noise. */
const CRAWLER_UA_RE =
  /googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|whatsapp|applebot|semrushbot|ahrefsbot|petalbot|bytespider/i;

export function isKnownCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_RE.test(userAgent);
}

/**
 * Drop stale chunk errors and crawler-originated client errors from Sentry.
 */
export function beforeSendSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    (typeof original === "object" && original?.message) ||
    event?.message ||
    event?.exception?.values?.[0]?.value ||
    "";

  if (isStaleChunkLoadError(message)) {
    return null;
  }

  if (
    typeof navigator !== "undefined" &&
    isKnownCrawlerUserAgent(navigator.userAgent)
  ) {
    return null;
  }

  return event;
}

export function shouldCaptureException(error) {
  const message = error?.message ?? String(error ?? "");
  if (isStaleChunkLoadError(message)) return false;
  if (typeof navigator !== "undefined" && isKnownCrawlerUserAgent(navigator.userAgent)) {
    return false;
  }
  return true;
}
