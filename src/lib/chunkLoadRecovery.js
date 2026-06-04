/** sessionStorage key — cleared naturally when the tab closes. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /(?:Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|dynamically imported module)/i;

/** Known crawler / bot browser names reported by Sentry. */
const BOT_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Baiduspider",
  "YandexBot",
  "Applebot",
  "facebookexternalhit",
  "HeadlessChrome",
]);

/**
 * Returns true when `error` looks like a stale JS chunk / dynamic import failure.
 * @param {unknown} error
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }
  const message = error?.message;
  if (typeof message === "string" && CHUNK_LOAD_ERROR_PATTERN.test(message)) {
    return true;
  }
  const name = error?.name;
  return name === "ChunkLoadError";
}

/**
 * Returns true when Sentry event metadata indicates a crawler rather than a user.
 * @param {import('@sentry/core').Event} event
 */
export function isLikelyBotSentryEvent(event) {
  const browserName =
    event?.contexts?.browser?.name ||
    event?.tags?.["browser.name"] ||
    event?.tags?.browser;
  if (typeof browserName === "string" && BOT_BROWSER_NAMES.has(browserName)) {
    return true;
  }
  const userAgent = event?.request?.headers?.["User-Agent"];
  if (typeof userAgent === "string") {
    return /googlebot|bingbot|baiduspider|yandexbot|applebot|facebookexternalhit|headlesschrome/i.test(
      userAgent,
    );
  }
  return false;
}

/**
 * Hard-reload once per tab session when a chunk fails to load (common after deploys).
 * Returns true when a reload was triggered.
 */
export function reloadOnceForChunkError() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    return false;
  }
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

/**
 * Registers global listeners that recover from transient chunk load failures.
 * Safe to call multiple times — listeners are registered once.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined" || window.__ceChunkLoadRecoveryInstalled) {
    return;
  }
  window.__ceChunkLoadRecoveryInstalled = true;

  const handleChunkFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    reloadOnceForChunkError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
