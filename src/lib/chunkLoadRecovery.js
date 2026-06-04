/** sessionStorage key: set when we reload once after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "next-chunk-reload-attempted";

const STALE_CHUNK_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|Loading CSS chunk/i;

const CRAWLER_USER_AGENT =
  /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit/i;

export function getErrorMessage(errorOrMessage) {
  if (typeof errorOrMessage === "string") return errorOrMessage;
  if (!errorOrMessage) return "";
  return errorOrMessage.message || String(errorOrMessage);
}

export function isStaleChunkLoadError(errorOrMessage) {
  return STALE_CHUNK_MESSAGE.test(getErrorMessage(errorOrMessage));
}

export function isKnownCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENT.test(userAgent);
}

function getSentryErrorMessage(event, hint) {
  const fromException = event?.exception?.values?.[0]?.value;
  if (fromException) return fromException;
  const original = hint?.originalException;
  if (typeof original === "string") return original;
  return getErrorMessage(original);
}

/**
 * Drop stale chunk load noise from Sentry when we auto-reload or when a crawler
 * hits a cached HTML page that references removed deployment assets.
 */
export function shouldDropChunkLoadErrorFromSentry(event, hint) {
  const message = getSentryErrorMessage(event, hint);
  if (!isStaleChunkLoadError(message)) return false;

  const browserName =
    event?.tags?.["browser.name"] ||
    event?.contexts?.browser?.name ||
    event?.contexts?.browser?.browser;

  if (browserName === "GoogleOther" || isKnownCrawlerUserAgent(browserName)) {
    return true;
  }

  if (typeof navigator !== "undefined" && isKnownCrawlerUserAgent(navigator.userAgent)) {
    return true;
  }

  // First failure: client will reload once; only report if recovery did not help.
  if (typeof sessionStorage !== "undefined") {
    return !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
  }

  return false;
}

export function tryRecoverFromStaleChunkLoad(errorOrMessage) {
  if (typeof window === "undefined") return false;
  if (!isStaleChunkLoadError(errorOrMessage)) return false;
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;

  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

export function clearChunkReloadAttemptFlag() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  clearChunkReloadAttemptFlag();

  const handle = (event) => {
    const payload = event?.reason ?? event?.error ?? event?.message;
    if (tryRecoverFromStaleChunkLoad(payload)) {
      event?.preventDefault?.();
    }
  };

  window.addEventListener("unhandledrejection", handle);
  window.addEventListener("error", handle);
}
