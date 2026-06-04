/** Session flag: one automatic reload per tab session after a stale chunk failure. */
export const STALE_CHUNK_RELOAD_SESSION_KEY = "ce-stale-chunk-reload";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/** User agents that commonly cache HTML across deploys; chunk errors are not actionable. */
const CRAWLER_UA_PATTERN =
  /Googlebot|GoogleOther|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot/i;

/**
 * True when the error is a Next.js / Turbopack stale JS chunk load failure
 * (typically after a Vercel deploy while the tab still has old HTML).
 */
export function isStaleChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.name || String(error);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_PATTERN.test(userAgent);
}

/**
 * Reload once so the browser fetches fresh HTML and matching chunk hashes.
 * @returns {boolean} true if a reload was triggered
 */
export function reloadOnceForStaleChunk() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(STALE_CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(STALE_CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

function handleStaleChunkFailure(error) {
  if (!isStaleChunkLoadError(error)) return;
  reloadOnceForStaleChunk();
}

/**
 * Listen for chunk load failures that bypass Sentry's beforeSend (e.g. unhandled rejections).
 */
export function setupStaleChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    handleStaleChunkFailure(event?.error ?? event?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleStaleChunkFailure(event?.reason);
  });
}

/**
 * Sentry beforeSend: recover real users silently; drop crawler noise; report if reload failed.
 */
export function staleChunkLoadBeforeSend(event, hint) {
  const error = hint?.originalException;
  if (!isStaleChunkLoadError(error)) {
    return event;
  }

  if (typeof navigator !== "undefined" && isCrawlerUserAgent(navigator.userAgent)) {
    return null;
  }

  if (typeof window === "undefined") {
    return event;
  }

  try {
    if (!sessionStorage.getItem(STALE_CHUNK_RELOAD_SESSION_KEY)) {
      reloadOnceForStaleChunk();
      return null;
    }
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_SESSION_KEY);
  } catch {
    reloadOnceForStaleChunk();
    return null;
  }

  return event;
}
