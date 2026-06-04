/** Matches Next.js / Turbopack dynamic import chunk failures (often post-deploy). */
const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/** Browsers Sentry tags that indicate crawlers, not real users. */
const CRAWLER_BROWSER_NAMES = new Set([
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

export function getErrorMessage(errorOrMessage) {
  if (!errorOrMessage) return "";
  if (typeof errorOrMessage === "string") return errorOrMessage;
  return errorOrMessage.message || String(errorOrMessage);
}

export function isChunkLoadError(errorOrMessage) {
  return CHUNK_LOAD_ERROR_PATTERN.test(getErrorMessage(errorOrMessage));
}

export function getEventBrowserName(event) {
  const fromTag = event?.tags?.["browser.name"];
  if (fromTag) return fromTag;
  return event?.contexts?.browser?.name || "";
}

export function isLikelyCrawlerEvent(event) {
  const browserName = getEventBrowserName(event);
  if (browserName && CRAWLER_BROWSER_NAMES.has(browserName)) {
    return true;
  }
  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    "";
  if (!userAgent) return false;
  return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot/i.test(
    userAgent,
  );
}

/**
 * Returns true when the event should not be sent to Sentry.
 */
export function shouldDropSentryEvent(event, hint) {
  const original = hint?.originalException;
  const exceptionValue = event?.exception?.values?.[0]?.value;
  const isChunkFailure =
    isChunkLoadError(original) ||
    isChunkLoadError(exceptionValue) ||
    isChunkLoadError(event?.message);

  if (!isChunkFailure) {
    return false;
  }

  // Crawlers often hit stale chunk URLs after deploys; not actionable.
  if (isLikelyCrawlerEvent(event)) {
    return true;
  }

  return false;
}
