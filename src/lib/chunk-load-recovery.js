/**
 * Detect Next.js / Turbopack dynamic import chunk failures (common after deploys).
 */
export const CHUNK_RELOAD_SESSION_KEY = "classeasily:chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Loading chunk [\d]+ failed|Failed to load chunk|ChunkLoadError/i;

/** Browsers Sentry tags for crawlers that cannot benefit from a client reload. */
const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
]);

export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") {
    return false;
  }
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function getExceptionMessage(event) {
  const exceptionValue = event?.exception?.values?.[0];
  if (!exceptionValue) {
    return typeof event?.message === "string" ? event.message : "";
  }
  if (typeof exceptionValue.value === "string" && exceptionValue.value) {
    return exceptionValue.value;
  }
  if (typeof exceptionValue.type === "string") {
    return exceptionValue.type;
  }
  return "";
}

export function isCrawlerBrowserName(browserName) {
  if (!browserName || typeof browserName !== "string") {
    return false;
  }
  return CRAWLER_BROWSER_NAMES.has(browserName);
}

export function isLikelyCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return false;
  }
  return /Googlebot|Google-InspectionTool|bingbot|Slurp|DuckDuckBot|Baiduspider|yandex|facebookexternalhit|Twitterbot|LinkedInBot/i.test(
    userAgent,
  );
}

/**
 * Returns true when the Sentry event should be dropped (noise or handled by recovery).
 */
export function shouldIgnoreChunkLoadSentryEvent(event) {
  const message = getExceptionMessage(event);
  if (!isChunkLoadErrorMessage(message)) {
    return false;
  }

  const browserName =
    event?.tags?.["browser.name"] ||
    event?.tags?.browser ||
    event?.contexts?.browser?.name;
  if (isCrawlerBrowserName(browserName)) {
    return true;
  }

  const userAgent = event?.request?.headers?.["User-Agent"];
  if (isLikelyCrawlerUserAgent(userAgent)) {
    return true;
  }

  return false;
}

function getErrorMessage(errorOrEvent) {
  if (!errorOrEvent) {
    return "";
  }
  if (typeof errorOrEvent === "string") {
    return errorOrEvent;
  }
  if (errorOrEvent.message) {
    return String(errorOrEvent.message);
  }
  if (errorOrEvent.reason?.message) {
    return String(errorOrEvent.reason.message);
  }
  if (typeof errorOrEvent.reason === "string") {
    return errorOrEvent.reason;
  }
  return "";
}

/**
 * Attempt a single hard reload when a stale chunk fails after a deployment.
 * Returns true if a reload was triggered.
 */
export function tryRecoverFromChunkLoadError(errorOrEvent) {
  if (typeof window === "undefined") {
    return false;
  }

  const message = getErrorMessage(errorOrEvent);
  if (!isChunkLoadErrorMessage(message)) {
    return false;
  }

  if (isLikelyCrawlerUserAgent(navigator.userAgent)) {
    return false;
  }

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
 * Register global listeners for chunk load failures (client-only).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const onError = (event) => {
    if (tryRecoverFromChunkLoadError(event.error || event)) {
      event.preventDefault?.();
    }
  };

  const onUnhandledRejection = (event) => {
    if (tryRecoverFromChunkLoadError(event.reason || event)) {
      event.preventDefault?.();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // ignore
    }
  });
}
