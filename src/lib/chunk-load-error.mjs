/**
 * Detect Next.js / Turbopack dynamic chunk load failures (often after a deploy
 * when the browser still has HTML from the previous build).
 */

const CRAWLER_UA_RE =
  /googlebot|googleother|google-inspectiontool|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|applebot|duckduckbot|semrushbot|ahrefsbot|mj12bot|petalbot|bytespider/i;

export function isCrawlerUserAgent(userAgent) {
  return CRAWLER_UA_RE.test(userAgent || "");
}

export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : String(error.message || error.toString?.() || "");
  const name = typeof error === "object" && error !== null ? error.name : "";
  return (
    name === "ChunkLoadError" ||
    /Failed to load chunk/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

export function shouldDropChunkLoadSentryEvent(event, hint) {
  const error = hint?.originalException;
  if (!isChunkLoadError(error)) return false;

  const tags = event?.tags || {};
  if (tags["browser.name"] === "GoogleOther" || tags.browser === "GoogleOther") {
    return true;
  }

  const headers = event?.request?.headers || {};
  const ua =
    headers["User-Agent"] ||
    headers["user-agent"] ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return isCrawlerUserAgent(ua);
}

const RELOAD_SESSION_KEY = "ce-chunk-reload";

/**
 * Reload once when a chunk fails to load so users pick up assets from the current deploy.
 * Skips crawlers and avoids infinite reload loops.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (error) => {
    if (!isChunkLoadError(error)) return;
    if (isCrawlerUserAgent(navigator.userAgent)) return;
    if (sessionStorage.getItem(RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(event.reason);
  });
}
