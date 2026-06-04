/** @typedef {import("@sentry/core").Event} SentryEvent */
/** @typedef {import("@sentry/core").EventHint} SentryEventHint */

export const CHUNK_RELOAD_STORAGE_KEY = "sentry-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const CRAWLER_PATTERN =
  /GoogleOther|Googlebot|Google-InspectionTool|bingbot|Baiduspider|YandexBot|facebookexternalhit|Slurp|DuckDuckBot|ia_archiver|SemrushBot|AhrefsBot/i;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isChunkLoadError(value) {
  if (!value) return false;
  if (typeof value === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(value);
  }
  if (value instanceof Error) {
    return (
      CHUNK_LOAD_ERROR_PATTERN.test(value.message) ||
      (value.cause instanceof Error &&
        CHUNK_LOAD_ERROR_PATTERN.test(value.cause.message))
    );
  }
  if (typeof value === "object" && value !== null && "message" in value) {
    const message = /** @type {{ message?: unknown }} */ (value).message;
    return typeof message === "string" && CHUNK_LOAD_ERROR_PATTERN.test(message);
  }
  return false;
}

/**
 * @param {string | undefined} value
 * @returns {boolean}
 */
export function isCrawlerUserAgent(value) {
  if (!value) return false;
  return CRAWLER_PATTERN.test(value);
}

/**
 * @param {SentryEvent} event
 * @returns {boolean}
 */
export function isCrawlerSentryEvent(event) {
  const browserTag = event.tags?.browser;
  if (typeof browserTag === "string" && CRAWLER_PATTERN.test(browserTag)) {
    return true;
  }
  const browserName = event.contexts?.browser?.name;
  if (typeof browserName === "string" && CRAWLER_PATTERN.test(browserName)) {
    return true;
  }
  const userAgent = event.request?.headers?.["User-Agent"];
  return isCrawlerUserAgent(
    typeof userAgent === "string" ? userAgent : undefined,
  );
}

/**
 * Drop crawler chunk-load noise; suppress first-chunk-error for users when a reload will run.
 *
 * @param {SentryEvent} event
 * @param {SentryEventHint} [hint]
 * @returns {boolean}
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const exceptionValues = event.exception?.values ?? [];
  const exceptionMessage = exceptionValues[0]?.value ?? "";
  const isChunkError =
    isChunkLoadError(original) ||
    isChunkLoadError(exceptionMessage) ||
    isChunkLoadError(event.message);

  if (!isChunkError) {
    return false;
  }

  if (isCrawlerSentryEvent(event)) {
    return true;
  }

  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) !== "1") {
        return true;
      }
    } catch {
      // sessionStorage may be unavailable in private mode; still report.
    }
  }

  return false;
}

/**
 * @param {SentryEvent} event
 * @param {SentryEventHint} [hint]
 * @returns {SentryEvent | null}
 */
export function sentryBeforeSend(event, hint) {
  if (shouldDropChunkLoadSentryEvent(event, hint)) {
    return null;
  }
  return event;
}

/**
 * After a deploy, stale HTML can reference removed chunks. Reload once for real users.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = (value) => {
    if (!isChunkLoadError(value)) return;
    if (isCrawlerUserAgent(navigator.userAgent)) return;

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === "1") {
        return;
      }
      sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
    } catch {
      return;
    }

    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptReload(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptReload(event.reason);
  });
}
