/** Matches Next.js / Turbopack lazy chunk load failures. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const CRAWLER_BROWSER_NAMES =
  /^(GoogleOther|Googlebot|HeadlessChrome|PhantomJS)$/i;

const CRAWLER_UA_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot|SemrushBot|AhrefsBot|MJ12bot|PetalBot/i;

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

export function isChunkLoadError(errorOrMessage) {
  if (!errorOrMessage) return false;
  const message =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage?.message || String(errorOrMessage);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

/**
 * Returns true when Sentry event metadata indicates a search/social crawler.
 */
export function isCrawlerSentryEvent(event) {
  const tags = event?.tags || {};
  const browserName = tags["browser.name"] || tags.browser?.name;
  if (browserName && CRAWLER_BROWSER_NAMES.test(String(browserName))) {
    return true;
  }

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"];
  if (userAgent && CRAWLER_UA_PATTERN.test(String(userAgent))) {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return CRAWLER_UA_PATTERN.test(navigator.userAgent);
  }

  return false;
}

/**
 * Drop noisy chunk-load errors from crawlers; keep real user reports.
 */
export function shouldDropSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    event?.message ||
    original?.message ||
    (typeof original === "string" ? original : "");
  if (!isChunkLoadError(message)) {
    return false;
  }
  return isCrawlerSentryEvent(event);
}

/**
 * Reload once after a chunk load failure (stale tab after deploy).
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError(errorOrMessage) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(errorOrMessage)) return false;
  if (isCrawlerSentryEvent({})) return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onError = (event) => {
    if (tryRecoverFromChunkLoadError(event?.message || event?.error)) {
      event.preventDefault?.();
    }
  };

  const onRejection = (event) => {
    if (tryRecoverFromChunkLoadError(event?.reason)) {
      event.preventDefault?.();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
}
