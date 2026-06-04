/** SessionStorage key: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/** Known crawler user agents that often hit stale JS chunks after deploys. */
const CRAWLER_BROWSER =
  /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit/i;

/**
 * True when the error is a Next.js / Turbopack dynamic import chunk failure
 * (typically stale HTML referencing chunks from a previous Vercel deployment).
 */
export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") {
    return false;
  }
  return CHUNK_LOAD_MESSAGE.test(message);
}

export function isChunkLoadError(error) {
  if (!error) {
    return false;
  }
  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);
  return isChunkLoadErrorMessage(message);
}

/**
 * Drop chunk-load noise from crawlers in Sentry; real users are recovered via reload.
 */
export function shouldDropChunkLoadSentryEvent(event) {
  if (!event || !isChunkLoadSentryEvent(event)) {
    return false;
  }
  return isCrawlerSentryEvent(event);
}

export function isChunkLoadSentryEvent(event) {
  const values = event?.exception?.values;
  if (Array.isArray(values)) {
    for (const entry of values) {
      if (isChunkLoadErrorMessage(entry?.value)) {
        return true;
      }
    }
  }
  return isChunkLoadErrorMessage(event?.message);
}

export function isCrawlerSentryEvent(event) {
  const tags = event?.tags;
  let browserName = event?.contexts?.browser?.name || "";

  if (tags && typeof tags === "object") {
    if (Array.isArray(tags)) {
      const browserTag = tags.find(
        (tag) => tag?.[0] === "browser" || tag?.key === "browser",
      );
      browserName =
        (Array.isArray(browserTag) ? browserTag[1] : browserTag?.value) ||
        browserName;
    } else {
      browserName = tags.browser || tags["browser.name"] || browserName;
    }
  }

  return CRAWLER_BROWSER.test(String(browserName));
}

/**
 * Reload once per session when a stale chunk is detected (client-only).
 * @returns {boolean} true if a reload was triggered
 */
export function recoverFromChunkLoadError(error) {
  if (typeof window === "undefined" || !isChunkLoadError(error)) {
    return false;
  }
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const handleFailure = (error) => {
    recoverFromChunkLoadError(error);
  };

  window.addEventListener("error", (event) => {
    handleFailure(event?.error || event?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleFailure(event?.reason);
  });
}
