/** Session flag: one automatic full reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const CRAWLER_UA_PATTERNS = [
  /googlebot/i,
  /googleother/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /petalbot/i,
  /headlesschrome/i,
];

/**
 * True when Next/Turbopack failed to fetch a code-split chunk (common after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string" ? error : error.message || String(error);
  const name = typeof error === "object" && error !== null ? error.name : "";
  return name === "ChunkLoadError" || CHUNK_ERROR_MESSAGE.test(message);
}

/**
 * Heuristic for crawlers and automated clients that cannot recover via reload.
 */
export function isLikelyAutomatedClient(userAgent) {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;
  return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

/**
 * Reload once so the browser picks up the current deployment's chunk hashes.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError() {
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
 * Whether this chunk failure should be sent to Sentry (after recovery was attempted).
 */
export function shouldReportChunkLoadErrorToSentry(error, userAgent) {
  if (!isChunkLoadError(error)) return true;
  if (isLikelyAutomatedClient(userAgent)) return false;
  if (typeof sessionStorage === "undefined") return true;
  return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
}

/**
 * Register global handlers to recover from stale chunks before error boundaries run.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    tryRecoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}

/**
 * Sentry beforeSend hook: drop noisy bot chunk errors; defer reporting until reload fails.
 */
export function sentryBeforeSendChunkFilter(event, hint) {
  const error = hint?.originalException;
  if (!isChunkLoadError(error)) return event;

  const browserTag = event?.tags?.browser ?? event?.contexts?.browser?.name;
  if (browserTag === "GoogleOther" || isLikelyAutomatedClient()) {
    return null;
  }

  if (!shouldReportChunkLoadErrorToSentry(error)) {
    tryRecoverFromChunkLoadError();
    return null;
  }

  return event;
}
