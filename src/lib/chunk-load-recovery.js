/**
 * Detect stale Next.js/Turbopack chunk failures (common right after a Vercel deploy)
 * and recover real users with a one-time reload. Crawler traffic is ignored.
 */

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-load-reload-attempted";

const CHUNK_LOAD_MESSAGE_RE =
  /(?:failed to load chunk|loading chunk \d+ failed|chunkloaderror)/i;

/** User agents that commonly hit stale chunks without benefiting from a reload. */
const CRAWLER_UA_RE =
  /googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot/i;

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

export function isChunkLoadError(error) {
  const message = getErrorMessage(error);
  if (CHUNK_LOAD_MESSAGE_RE.test(message)) return true;
  const name = error?.name || "";
  return name === "ChunkLoadError";
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_RE.test(userAgent);
}

export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    getErrorMessage(original) ||
    event?.message ||
    event?.title ||
    "";
  if (!isChunkLoadError(original) && !CHUNK_LOAD_MESSAGE_RE.test(message)) {
    return false;
  }

  if (typeof navigator !== "undefined" && isCrawlerUserAgent(navigator.userAgent)) {
    return true;
  }

  const browserName = event?.tags?.["browser.name"] || event?.contexts?.browser?.name;
  if (browserName && isCrawlerUserAgent(String(browserName))) {
    return true;
  }

  if (typeof sessionStorage !== "undefined") {
    const reloadAttempted = sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
    if (!reloadAttempted) {
      return true;
    }
  }

  return false;
}

export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (isCrawlerUserAgent(navigator.userAgent)) return false;

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

function handleGlobalError(event) {
  const reason = event?.reason ?? event?.error;
  tryRecoverFromChunkLoadError(reason);
}

/**
 * Register window listeners for chunk load failures. Safe to call once per page load.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", handleGlobalError);
  window.addEventListener("unhandledrejection", handleGlobalError);
}
