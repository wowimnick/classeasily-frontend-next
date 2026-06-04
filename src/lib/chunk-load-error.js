/** sessionStorage key: set when we auto-reload once after a stale chunk failure */
export const CHUNK_RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const CRAWLER_UA =
  /googlebot|googleother|bingbot|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|slackbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|petalbot/i;

/**
 * True when the error is a Next.js / Turbopack dynamic import chunk failure
 * (common after Vercel deploys when cached HTML references removed chunks).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const message = typeof error === "string" ? error : error.message;
  return typeof message === "string" && CHUNK_LOAD_MESSAGE.test(message);
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA.test(userAgent);
}

/**
 * Sentry tags browser as "GoogleOther" for Google crawlers that execute JS.
 */
export function isCrawlerBrowserTag(event) {
  const browser =
    event?.tags?.browser ||
    event?.contexts?.browser?.name ||
    event?.contexts?.browser?.browser;
  return typeof browser === "string" && CRAWLER_UA.test(browser);
}

/**
 * Drop noisy chunk-load events (crawlers, or first reload attempt for real users).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const error = hint?.originalException;
  if (!isChunkLoadError(error)) return false;

  if (isCrawlerBrowserTag(event)) return true;

  if (typeof navigator !== "undefined" && isCrawlerUserAgent(navigator.userAgent)) {
    return true;
  }

  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    return !sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
  }

  return false;
}

/**
 * After a deploy, reload once when a stale chunk fails so users pick up new assets.
 * Crawlers are skipped (they often hit mismatched HTML/JS and cannot be helped by reload).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptRecovery = (error) => {
    if (!isChunkLoadError(error)) return;
    if (isCrawlerUserAgent(navigator.userAgent)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => attemptRecovery(event.error));
  window.addEventListener("unhandledrejection", (event) =>
    attemptRecovery(event.reason),
  );

  window.addEventListener("load", () => {
    window.setTimeout(
      () => sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY),
      60_000,
    );
  });
}
