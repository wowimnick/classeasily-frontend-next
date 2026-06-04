/** Session flag to avoid infinite reload loops after a stale-chunk recovery attempt. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE = /Failed to load chunk/i;

const CRAWLER_USER_AGENT =
  /GoogleOther|Googlebot|Google-InspectionTool|bingbot|facebookexternalhit|Twitterbot|LinkedInBot|Slurp|DuckDuckBot|Applebot|YandexBot|Baiduspider/i;

/** Known Sentry browser tags used by crawlers that execute client JS poorly. */
const CRAWLER_BROWSER_TAGS = new Set(["GoogleOther"]);

/**
 * @param {unknown} value Error object or message string
 * @returns {boolean}
 */
export function isChunkLoadError(value) {
  const message =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "message" in value
        ? String(value.message)
        : "";
  return CHUNK_LOAD_MESSAGE.test(message);
}

/**
 * @param {string | undefined | null} userAgent
 * @returns {boolean}
 */
export function isLikelyCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENT.test(userAgent);
}

/**
 * @param {import("@sentry/core").Event} event
 * @param {import("@sentry/core").EventHint} [hint]
 * @returns {boolean}
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const exceptionValue = event?.exception?.values?.[0]?.value;
  const message =
    (original &&
      typeof original === "object" &&
      "message" in original &&
      String(original.message)) ||
    (typeof event?.message === "string" ? event.message : "") ||
    (typeof exceptionValue === "string" ? exceptionValue : "");

  if (!isChunkLoadError(message)) {
    return false;
  }

  const browserTag = event?.tags?.browser;
  if (typeof browserTag === "string" && CRAWLER_BROWSER_TAGS.has(browserTag)) {
    return true;
  }

  const requestUa = event?.request?.headers?.["User-Agent"];
  if (isLikelyCrawlerUserAgent(requestUa)) {
    return true;
  }

  if (
    typeof navigator !== "undefined" &&
    isLikelyCrawlerUserAgent(navigator.userAgent)
  ) {
    return true;
  }

  return false;
}

/**
 * Recover from post-deploy stale Turbopack/Webpack chunks by reloading once.
 * Skips crawlers and avoids reload loops via sessionStorage.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  }

  const maybeRecover = (value) => {
    if (!isChunkLoadError(value)) return;
    if (isLikelyCrawlerUserAgent(navigator.userAgent)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;

    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    maybeRecover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    maybeRecover(event.reason);
  });
}
