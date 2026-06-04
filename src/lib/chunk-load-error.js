/** sessionStorage key: set when we auto-reload once after a stale chunk failure */
export const CHUNK_LOAD_RELOAD_KEY = "ce-chunk-load-reload";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const BOT_USER_AGENT =
  /GoogleOther|Googlebot|AdsBot-Google|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|SemrushBot|AhrefsBot|Applebot/i;

/**
 * True when the error is a Next.js / Turbopack dynamic import chunk failure,
 * usually after a Vercel deployment while the tab still has stale HTML.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;

  const message =
    typeof error === "string"
      ? error
      : error.message || String(error);

  return CHUNK_LOAD_MESSAGE.test(message);
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENT.test(userAgent);
}

/**
 * Attempt a single hard reload for real users. Returns true when the error was
 * handled (reload scheduled or crawler — no Sentry noise).
 */
export function tryRecoverFromChunkLoadError(error, { userAgent, storage, location } = {}) {
  if (!isChunkLoadError(error)) return false;

  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (isCrawlerUserAgent(ua)) {
    return true;
  }

  const store = storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  const loc = location ?? (typeof window !== "undefined" ? window.location : null);

  if (!store || !loc) {
    return false;
  }

  if (!store.getItem(CHUNK_LOAD_RELOAD_KEY)) {
    store.setItem(CHUNK_LOAD_RELOAD_KEY, "1");
    loc.reload();
    return true;
  }

  store.removeItem(CHUNK_LOAD_RELOAD_KEY);
  return false;
}

/** Drop first-hit chunk errors in Sentry; report only after reload did not help. */
export function shouldReportChunkLoadErrorToSentry(error, { userAgent, storage } = {}) {
  if (!isChunkLoadError(error)) return true;

  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (isCrawlerUserAgent(ua)) {
    return false;
  }

  const store = storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  return Boolean(store?.getItem(CHUNK_LOAD_RELOAD_KEY));
}

export function clearChunkLoadReloadFlag(storage) {
  const store = storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  store?.removeItem(CHUNK_LOAD_RELOAD_KEY);
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onError = (event) => {
    const err = event.error ?? event.message;
    if (tryRecoverFromChunkLoadError(err)) {
      event.preventDefault?.();
    }
  };

  const onRejection = (event) => {
    if (tryRecoverFromChunkLoadError(event.reason)) {
      event.preventDefault?.();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  window.addEventListener(
    "load",
    () => {
      clearChunkLoadReloadFlag();
    },
    { once: true },
  );
}
