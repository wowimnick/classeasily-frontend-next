/** Session flag to avoid infinite reload loops after a stale-chunk recovery attempt. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
];

const BOT_UA_PATTERNS = [
  /Googlebot/i,
  /GoogleOther/i,
  /bingbot/i,
  /Slurp/i,
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
];

const BOT_BROWSER_TAGS = /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot/i;

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error
        ? error.cause.message
        : typeof error.cause === "string"
          ? error.cause
          : "";
    return [error.message, cause].filter(Boolean).join(": ");
  }
  return String(error);
}

export function isChunkLoadError(error) {
  const message = getErrorMessage(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function isLikelyBot(userAgent = "") {
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function getSentryErrorMessage(event) {
  const exceptionValue = event?.exception?.values?.[0]?.value;
  if (typeof exceptionValue === "string" && exceptionValue) {
    return exceptionValue;
  }
  if (typeof event?.message === "string") {
    return event.message;
  }
  return "";
}

export function shouldSuppressChunkLoadSentryEvent(event) {
  const message = getSentryErrorMessage(event);
  if (!CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }

  const browserTag = String(event?.tags?.browser ?? "");
  if (BOT_BROWSER_TAGS.test(browserTag)) {
    return true;
  }

  if (typeof navigator !== "undefined" && isLikelyBot(navigator.userAgent)) {
    return true;
  }

  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)
  ) {
    return true;
  }

  return false;
}

export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  if (isLikelyBot(navigator.userAgent)) return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable in private mode; still attempt one reload.
  }

  window.location.reload();
  return true;
}

function extractErrorFromEvent(event) {
  if (event?.reason !== undefined) return event.reason;
  if (event?.error !== undefined) return event.error;
  if (typeof event?.message === "string") return event.message;
  return null;
}

export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return () => {};

  const handleError = (event) => {
    const error = extractErrorFromEvent(event);
    if (!isChunkLoadError(error)) return;
    recoverFromChunkLoadError();
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleError);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleError);
  };
}
