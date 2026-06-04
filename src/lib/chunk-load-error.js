/**
 * Next.js / Turbopack chunk load failures after a deployment often surface as
 * "Failed to load chunk …" when cached HTML references stale chunk hashes.
 * Real users recover with a one-time reload; crawlers should not pollute Sentry.
 */

const CHUNK_ERROR_PATTERNS = [
  "Failed to load chunk",
  "Loading chunk",
  "ChunkLoadError",
];

const CRAWLER_BROWSER_TAGS = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
]);

const RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

export function getChunkLoadErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "";
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isChunkLoadError(message) {
  if (!message) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function isCrawlerContext(tags = {}, userAgent = "") {
  const browserName = tags["browser.name"] || tags.browser;
  if (browserName && CRAWLER_BROWSER_TAGS.has(String(browserName))) {
    return true;
  }
  if (userAgent && /bot|crawl|spider|googleother/i.test(userAgent)) {
    return true;
  }
  return false;
}

export function isLikelyCrawlerUserAgent(userAgent = "") {
  if (!userAgent) return false;
  return /bot|crawl|spider|googleother/i.test(userAgent);
}

/**
 * Drop chunk-load noise from crawlers (e.g. GoogleOther fetching /explore
 * with a stale HTML shell after a Vercel deployment).
 */
export function shouldSuppressChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    getChunkLoadErrorMessage(original) ||
    event?.exception?.values?.[0]?.value ||
    event?.message ||
    "";

  if (!isChunkLoadError(message)) {
    return false;
  }

  const tags = event?.tags || {};
  const requestUa = event?.request?.headers?.["User-Agent"] || "";
  return isCrawlerContext(tags, requestUa);
}

/**
 * One-time full page reload when a real user's tab has stale chunk references.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (message) => {
    if (!isChunkLoadError(message)) return;
    if (isLikelyCrawlerUserAgent(typeof navigator !== "undefined" ? navigator.userAgent : "")) {
      return;
    }
    try {
      if (sessionStorage.getItem(RELOAD_STORAGE_KEY)) return;
      sessionStorage.setItem(RELOAD_STORAGE_KEY, "1");
    } catch {
      // sessionStorage may be unavailable; still attempt reload once per tab
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.message || "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(getChunkLoadErrorMessage(event.reason));
  });
}
