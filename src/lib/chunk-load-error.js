/** Session flag: a full reload was already attempted for a stale JS chunk this tab. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE = /failed to load chunk/i;

/** Known crawler / preview-fetch user agents that should not trigger recovery or Sentry noise. */
const CRAWLER_UA =
  /googlebot|googleother|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";
  return CHUNK_LOAD_MESSAGE.test(String(message));
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA.test(userAgent);
}

/**
 * Read crawler signal from a Sentry error event (tags / request headers).
 */
export function isCrawlerSentryEvent(event) {
  const tags = event?.tags ?? {};
  const browser = tags.browser || tags["browser.name"] || "";
  if (typeof browser === "string" && /googleother|googlebot/i.test(browser)) {
    return true;
  }
  const ua =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    "";
  return isCrawlerUserAgent(ua);
}

/**
 * Drop transient Turbopack/Webpack chunk failures from Sentry (crawler noise or post-deploy reload).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (!isChunkLoadError(original)) return false;
  if (isCrawlerSentryEvent(event)) return true;
  if (
    typeof window !== "undefined" &&
    window.sessionStorage?.getItem(CHUNK_RELOAD_SESSION_KEY)
  ) {
    return true;
  }
  return false;
}

/**
 * After a Vercel deploy, cached HTML can reference removed chunk hashes. Reload once for real users.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptRecovery = (error) => {
    if (!isChunkLoadError(error)) return;
    if (isCrawlerUserAgent(navigator.userAgent)) return;

    try {
      if (window.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      window.sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }

    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptRecovery(event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptRecovery(event.reason);
  });
}
