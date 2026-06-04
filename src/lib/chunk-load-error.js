/** Matches Turbopack and webpack dynamic import chunk failures. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const BOT_USER_AGENT_PATTERN =
  /googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|applebot|semrushbot|ahrefsbot|petalbot|bytespider/i;

const BOT_BROWSER_TAGS = new Set([
  "googlebot",
  "googleother",
  "bingbot",
  "yandexbot",
  "duckduckbot",
]);

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) {
    return false;
  }

  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }

  const message =
    (typeof error.message === "string" && error.message) || String(error);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

/**
 * @param {string | undefined | null} userAgent
 * @returns {boolean}
 */
export function isLikelyBotUserAgent(userAgent) {
  if (!userAgent) {
    return false;
  }

  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

/**
 * @param {import("@sentry/core").Event | undefined} event
 * @returns {boolean}
 */
export function isLikelyBotSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (
    typeof browserTag === "string" &&
    BOT_BROWSER_TAGS.has(browserTag.toLowerCase())
  ) {
    return true;
  }

  const browserName = event?.contexts?.browser?.name;
  if (
    typeof browserName === "string" &&
    BOT_BROWSER_TAGS.has(browserName.toLowerCase())
  ) {
    return true;
  }

  if (typeof navigator !== "undefined") {
    return isLikelyBotUserAgent(navigator.userAgent);
  }

  return false;
}

/**
 * @param {import("@sentry/core").Event | undefined} event
 * @param {{ originalException?: unknown } | undefined} hint
 * @returns {boolean}
 */
export function shouldDropChunkLoadErrorFromSentry(event, hint) {
  const error = hint?.originalException;
  const message = typeof event?.message === "string" ? event.message : "";

  if (!isChunkLoadError(error) && !CHUNK_LOAD_ERROR_PATTERN.test(message)) {
    return false;
  }

  if (isLikelyBotSentryEvent(event)) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    return !window.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    return Boolean(window.__ceChunkReloadAttempted);
  }
}

/**
 * Reload once after a post-deploy chunk mismatch for real users.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const attemptRecovery = (error) => {
    if (!isChunkLoadError(error)) {
      return;
    }

    if (isLikelyBotUserAgent(navigator.userAgent)) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return;
      }
      window.sessionStorage.setItem(
        CHUNK_RELOAD_SESSION_KEY,
        String(Date.now()),
      );
    } catch {
      if (window.__ceChunkReloadAttempted) {
        return;
      }
      window.__ceChunkReloadAttempted = true;
    }

    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptRecovery(event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptRecovery(event.reason);
  });
}
