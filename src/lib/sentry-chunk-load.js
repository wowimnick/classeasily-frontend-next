/** Session flag set when we auto-reload after a stale JS chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-next-chunk-reload";

const CHUNK_LOAD_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
];

/** User agents and Sentry browser tags that indicate crawlers, not real sessions. */
const CRAWLER_BROWSER_TAGS = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
]);

const CRAWLER_UA_PATTERN =
  /googlebot|google-other|googleother|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

/**
 * @param {string | undefined | null} message
 */
export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") {
    return false;
  }
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * @param {unknown} error
 */
export function isChunkLoadError(error) {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return isChunkLoadErrorMessage(error);
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return isChunkLoadErrorMessage(String(error.message));
  }
  return false;
}

/**
 * @param {string | undefined | null} userAgent
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return false;
  }
  return CRAWLER_UA_PATTERN.test(userAgent);
}

/**
 * @param {import("@sentry/core").Event} event
 */
export function isCrawlerFromSentryEvent(event) {
  const browserTag = event?.tags?.browser ?? event?.tags?.["browser.name"];
  if (typeof browserTag === "string" && CRAWLER_BROWSER_TAGS.has(browserTag)) {
    return true;
  }

  const browserName = event?.contexts?.browser?.name;
  if (typeof browserName === "string" && CRAWLER_BROWSER_TAGS.has(browserName)) {
    return true;
  }

  const userAgent =
    event?.request?.headers?.["User-Agent"] ??
    event?.request?.headers?.["user-agent"];
  if (typeof userAgent === "string" && isCrawlerUserAgent(userAgent)) {
    return true;
  }

  if (typeof navigator !== "undefined" && isCrawlerUserAgent(navigator.userAgent)) {
    return true;
  }

  return false;
}

/**
 * Drop noisy chunk-load events (crawlers + first auto-reload attempt for real users).
 *
 * @param {import("@sentry/core").Event | null} event
 * @param {import("@sentry/core").EventHint} hint
 * @returns {import("@sentry/core").Event | null}
 */
export function chunkLoadBeforeSend(event, hint) {
  if (!event) {
    return event;
  }

  const original = hint?.originalException;
  const message =
    (typeof original === "object" &&
      original !== null &&
      "message" in original &&
      String(original.message)) ||
    event.message ||
    "";

  if (!isChunkLoadErrorMessage(message)) {
    return event;
  }

  if (isCrawlerFromSentryEvent(event)) {
    return null;
  }

  // Client-only: suppress the first stale-chunk failure (registerChunkLoadRecovery reloads once).
  if (
    typeof sessionStorage !== "undefined" &&
    !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)
  ) {
    return null;
  }

  return event;
}

/**
 * Reload once when Turbopack/Webpack fails to fetch a stale chunk after deploy.
 * Registered from instrumentation-client.js at app startup.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const attemptReload = () => {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  };

  const handleChunkFailure = (message) => {
    if (!isChunkLoadErrorMessage(message)) {
      return;
    }
    attemptReload();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.message || event.error?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason && typeof reason === "object" && "message" in reason
          ? String(reason.message)
          : "";
    handleChunkFailure(message);
  });
}
