/**
 * Detect and recover from Next.js / Turbopack stale chunk errors after deploys.
 * Crawlers often keep cached HTML that references removed chunk hashes.
 */

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/** Browsers Sentry tags for known crawlers (see issue JAVASCRIPT-NEXTJS-2). */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "facebookexternalhit",
]);

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

export function isChunkLoadError(error, event) {
  const message =
    error?.message ||
    event?.exception?.values?.[0]?.value ||
    event?.message ||
    "";
  return CHUNK_LOAD_MESSAGE.test(String(message));
}

export function getEventBrowserName(event) {
  const tagBrowser = event?.tags?.browser;
  if (typeof tagBrowser === "string" && tagBrowser.length > 0) {
    return tagBrowser;
  }
  return event?.contexts?.browser?.name || null;
}

export function isCrawlerBrowserName(browserName) {
  if (!browserName) return false;
  if (CRAWLER_BROWSER_NAMES.has(browserName)) return true;
  return /bot|crawler|spider|preview/i.test(browserName);
}

/**
 * Drop chunk-load noise from crawlers; keep real-user reports after reload retry.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  if (!isChunkLoadError(hint?.originalException, event)) {
    return false;
  }

  if (isCrawlerBrowserName(getEventBrowserName(event))) {
    return true;
  }

  if (typeof window !== "undefined") {
    try {
      return !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      return false;
    }
  }

  return false;
}

export function getChunkLoadBeforeSend() {
  return (event, hint) =>
    shouldDropChunkLoadSentryEvent(event, hint) ? null : event;
}

function tryReloadForStaleChunks() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  } catch {
    // sessionStorage may be unavailable in strict privacy modes
  }
}

function handleChunkFailurePayload(message) {
  if (CHUNK_LOAD_MESSAGE.test(String(message || ""))) {
    tryReloadForStaleChunks();
  }
}

/**
 * One-shot full page reload when a stale JS chunk fails to load (post-deploy).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    handleChunkFailurePayload(event?.message || event?.error?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    handleChunkFailurePayload(
      reason?.message || (typeof reason === "string" ? reason : ""),
    );
  });
}
