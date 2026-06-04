/** Session flag: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_RE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/** Browsers Sentry tags for crawlers that cannot recover via a full reload. */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Slurp",
  "ia_archiver",
]);

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isChunkLoadError(error) {
  return CHUNK_LOAD_ERROR_RE.test(getErrorMessage(error));
}

export function isCrawlerBrowserName(browserName) {
  if (!browserName || typeof browserName !== "string") return false;
  if (CRAWLER_BROWSER_NAMES.has(browserName)) return true;
  return /bot|crawler|spider|slurp/i.test(browserName);
}

export function isCrawlerSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (isCrawlerBrowserName(browserTag)) return true;
  const browserContext = event?.contexts?.browser?.name;
  return isCrawlerBrowserName(browserContext);
}

/**
 * Drop noisy chunk-load errors from crawlers (stale HTML after deploy).
 * Real users get a one-time reload via registerChunkLoadRecovery().
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    getErrorMessage(original) ||
    (typeof event?.message === "string" ? event.message : "");
  if (!isChunkLoadError(message)) return false;
  return isCrawlerSentryEvent(event);
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = (error) => {
    if (!isChunkLoadError(error)) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptReload(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptReload(event.reason);
  });
}
