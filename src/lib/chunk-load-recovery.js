/** sessionStorage key — cleared after a successful full page load */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/** Browsers that commonly report chunk failures without real user impact */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "YandexBot",
  "Applebot",
]);

const CHUNK_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk \d+ failed/i,
];

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error?.message === "string"
          ? error.message
          : "";
  if (!message) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * @param {import("@sentry/core").Event} event
 * @returns {boolean}
 */
export function isCrawlerChunkLoadSentryEvent(event) {
  const message = event.exception?.values?.[0]?.value ?? "";
  if (!isChunkLoadError(message)) return false;

  const browserTag = event.tags?.browser ?? event.tags?.["browser.name"];
  if (typeof browserTag === "string" && CRAWLER_BROWSER_NAMES.has(browserTag)) {
    return true;
  }

  const userAgent =
    event.request?.headers?.["User-Agent"] ??
    event.request?.headers?.["user-agent"];
  if (typeof userAgent === "string") {
    if (/googlebot|bingbot|yandexbot|applebot/i.test(userAgent)) {
      return true;
    }
  }

  return false;
}

/**
 * Reload once when a stale deployment left the page referencing missing chunks.
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;

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

/**
 * Register client-side listeners for Turbopack/Webpack chunk load failures.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onLoad = () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  };
  window.addEventListener("load", onLoad);

  const handleFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    attemptChunkLoadRecovery();
  };

  window.addEventListener("error", (event) => {
    handleFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleFailure(event.reason);
  });
}
