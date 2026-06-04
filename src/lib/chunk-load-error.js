/**
 * Detect Next.js / Turbopack dynamic chunk load failures (common after deploys when
 * cached HTML references removed chunks) and recover or de-noise Sentry.
 */

export const CHUNK_LOAD_ERROR_PATTERN =
  /(?:Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|Importing a module script failed)/i;

/** Browsers Sentry tags for non-interactive crawlers (not real users). */
export const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
]);

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

export function isChunkLoadError(message) {
  if (!message || typeof message !== "string") return false;
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isCrawlerBrowser(browserName) {
  if (!browserName || typeof browserName !== "string") return false;
  return CRAWLER_BROWSER_NAMES.has(browserName);
}

function getEventErrorMessage(event) {
  const exceptionValue = event?.exception?.values?.[0]?.value;
  if (typeof exceptionValue === "string" && exceptionValue) {
    return exceptionValue;
  }
  if (typeof event?.message === "string") {
    return event.message;
  }
  return "";
}

function getEventBrowserName(event) {
  const tagBrowser = event?.tags?.browser;
  if (typeof tagBrowser === "string" && tagBrowser) {
    return tagBrowser;
  }
  const contextBrowser = event?.contexts?.browser?.name;
  if (typeof contextBrowser === "string") {
    return contextBrowser;
  }
  return "";
}

/**
 * Drop Sentry events for crawlers hitting stale chunks after deploy (not actionable).
 */
export function shouldDropChunkLoadSentryEvent(event) {
  const message = getEventErrorMessage(event);
  if (!isChunkLoadError(message)) {
    return false;
  }
  return isCrawlerBrowser(getEventBrowserName(event));
}

/**
 * Reload once per tab session when a chunk fails to load (typical post-deploy fix).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = (message) => {
    if (!isChunkLoadError(message)) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode, etc.)
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptReload(event?.message || "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const message =
      (reason && typeof reason === "object" && reason.message) ||
      (typeof reason === "string" ? reason : "");
    attemptReload(message);
  });
}
