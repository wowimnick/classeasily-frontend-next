/** Session marker set immediately before a one-time hard reload for stale JS chunks. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

/** Matches Next.js / Turbopack dynamic import chunk failures after deploys. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const BOT_BROWSER_PATTERN = /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot/i;

/**
 * @param {unknown} error
 * @returns {boolean}
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
  return typeof name === "string" && CHUNK_LOAD_ERROR_PATTERN.test(name);
}

/**
 * @param {import("@sentry/core").Event} event
 * @returns {boolean}
 */
export function isBotChunkLoadSentryEvent(event) {
  const message = event.exception?.values?.[0]?.value ?? "";
  if (!CHUNK_LOAD_ERROR_PATTERN.test(message)) return false;
  const browser =
    event.tags?.browser ??
    event.contexts?.browser?.name ??
    event.request?.headers?.["User-Agent"];
  return typeof browser === "string" && BOT_BROWSER_PATTERN.test(browser);
}

/**
 * One-time hard reload when a tab still references chunks from a previous deploy.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

/**
 * Registers global handlers so chunk failures recover before error boundaries report.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onChunkFailure = (error) => {
    if (!isChunkLoadError(error)) return false;
    return tryRecoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    if (onChunkFailure(event.error)) {
      event.preventDefault();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (onChunkFailure(event.reason)) {
      event.preventDefault();
    }
  });

  // Successful load after a recovery reload — allow future deploy mismatches.
  window.addEventListener("load", () => {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  });
}
