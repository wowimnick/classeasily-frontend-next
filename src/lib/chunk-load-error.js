const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const CRAWLER_UA_PATTERN =
  /googlebot|google-other|googleother|storebot-google|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|slackbot|semrushbot|ahrefsbot|petalbot|applebot|bytespider|rogerbot|discordbot|whatsapp|telegrambot/i;

/**
 * True when an error is a Next.js / Turbopack stale chunk load failure.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";
  return CHUNK_ERROR_PATTERN.test(message);
}

/**
 * Detect known search/social crawlers that often hit stale chunks after deploys.
 */
export function isCrawlerUserAgent(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
) {
  return CRAWLER_UA_PATTERN.test(userAgent);
}

/**
 * Crawler browsers reported by Sentry (e.g. GoogleOther for Google crawlers).
 */
export function isCrawlerBrowserTag(browser) {
  const b = String(browser || "").toLowerCase();
  return (
    b.includes("googlebot") ||
    b === "googleother" ||
    b.includes("bingbot") ||
    b.includes("yandex") ||
    b.includes("baiduspider") ||
    b.includes("duckduckbot") ||
    b.includes("applebot") ||
    b.includes("facebookexternalhit") ||
    b.includes("twitterbot") ||
    b.includes("linkedinbot")
  );
}

/**
 * Reload once per tab session when a stale JS chunk fails after a deployment.
 * Returns true when a reload was triggered.
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt one reload
  }
  window.location.reload();
  return true;
}

/**
 * Drop noisy chunk errors from crawlers in Sentry; keep real-user reports.
 */
export function shouldIgnoreSentryChunkEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    original?.message ||
    event?.message ||
    event?.exception?.values?.[0]?.value ||
    "";
  if (!isChunkLoadError({ message })) return false;

  const browserTag = event?.tags?.browser ?? event?.contexts?.browser?.name;
  if (isCrawlerBrowserTag(browserTag)) return true;

  if (typeof navigator !== "undefined" && isCrawlerUserAgent()) return true;

  return false;
}
