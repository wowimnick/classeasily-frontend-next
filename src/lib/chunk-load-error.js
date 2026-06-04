/** Session flag to avoid infinite reload loops after a chunk load failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-once";

const CHUNK_LOAD_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
];

const CRAWLER_UA_PATTERNS = [
  /googlebot/i,
  /googleother/i,
  /bingbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /duckduckbot/i,
  /slurp/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /embedly/i,
  /prerender/i,
  /headlesschrome/i,
];

function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isChunkLoadError(error) {
  const message = getErrorMessage(error);
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Reload once per tab session when a stale JS chunk fails to load (common after deploy).
 * @returns {boolean} true if a reload was triggered
 */
export function tryReloadOnceForChunkError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    /* sessionStorage blocked; still attempt one reload */
  }
  window.location.reload();
  return true;
}

/**
 * Early client listeners so chunk failures recover before route error UI renders.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handle = (value) => {
    if (!isChunkLoadError(value)) return;
    if (isCrawlerUserAgent(navigator.userAgent)) return;
    tryReloadOnceForChunkError();
  };

  window.addEventListener("error", (event) => {
    handle(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    handle(event.reason);
  });
}

/**
 * Drop noisy chunk-load events (crawlers + post-deploy stale tabs we auto-reload).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const error = hint?.originalException;
  const message = event?.message || getErrorMessage(error);
  if (!isChunkLoadError(error) && !isChunkLoadError(message)) {
    return false;
  }

  const userAgent =
    (typeof navigator !== "undefined" && navigator.userAgent) ||
    event?.request?.headers?.["User-Agent"] ||
    "";

  if (isCrawlerUserAgent(userAgent)) return true;

  const browserName =
    event?.tags?.browser?.value ||
    event?.contexts?.browser?.name ||
    event?.contexts?.browser?.browser;
  if (browserName && isCrawlerUserAgent(String(browserName))) return true;

  return true;
}
