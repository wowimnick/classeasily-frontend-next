/** Session flag: a full reload was already attempted for this tab session. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /(?:failed to load chunk|loading chunk \d+ failed|chunkloaderror)/i;

/** User agents that commonly cache HTML across deploys and cannot recover via reload. */
const CRAWLER_USER_AGENT =
  /googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

export function isLikelyCrawler(userAgent) {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return CRAWLER_USER_AGENT.test(ua);
}

/**
 * Returns true when this Sentry event should be dropped (crawler noise or
 * pre-reload chunk failure we are recovering from automatically).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message =
    original?.message ||
    event?.exception?.values?.[0]?.value ||
    event?.message ||
    "";
  if (!isChunkLoadError(message) && !isChunkLoadError(original)) {
    return false;
  }

  const browserName = event?.tags?.["browser.name"] || event?.tags?.browser;
  if (
    typeof browserName === "string" &&
    /^googleother$/i.test(browserName.trim())
  ) {
    return true;
  }

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (isLikelyCrawler(userAgent)) {
    return true;
  }

  if (typeof sessionStorage !== "undefined") {
    const reloaded = sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
    if (!reloaded) {
      // First occurrence: client will reload; avoid Sentry noise.
      return true;
    }
  }

  return false;
}

/**
 * On stale chunk references (common right after a deploy), reload once so the
 * browser picks up the current build's asset manifest.
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return () => {};

  const tryRecover = (error) => {
    if (!isChunkLoadError(error)) return;
    if (isLikelyCrawler()) return;

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }

    window.location.reload();
  };

  const onError = (event) => {
    tryRecover(event?.error || event?.message);
  };

  const onRejection = (event) => {
    tryRecover(event?.reason);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
