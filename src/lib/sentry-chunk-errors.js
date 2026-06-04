/** Matches Next.js / Turbopack dynamic import failures after a new deployment. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed/i;

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CRAWLER_BROWSER_TAGS = new Set(["GoogleOther"]);

const CRAWLER_UA_PATTERN =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|ia_archiver|duckduckbot/i;

export function messageLooksLikeChunkLoadError(message) {
  if (!message || typeof message !== "string") return false;
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function getExceptionMessageFromEvent(event) {
  const values = event?.exception?.values;
  if (!Array.isArray(values)) return "";
  return values.map((v) => v?.value || "").join(" ");
}

export function isChunkLoadSentryEvent(event) {
  return messageLooksLikeChunkLoadError(getExceptionMessageFromEvent(event));
}

export function isKnownCrawlerSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (typeof browserTag === "string" && CRAWLER_BROWSER_TAGS.has(browserTag)) {
    return true;
  }
  const ua =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    "";
  return CRAWLER_UA_PATTERN.test(ua);
}

/**
 * Drop noisy chunk-load events (deploy skew, crawlers). After one client reload,
 * report again so persistent failures are still visible.
 */
export function shouldDropChunkLoadSentryEvent(event) {
  if (!isChunkLoadSentryEvent(event)) return false;
  if (isKnownCrawlerSentryEvent(event)) return true;

  if (typeof window !== "undefined") {
    try {
      if (!sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return true;
    } catch {
      return true;
    }
  }

  return false;
}

export function createSentryBeforeSend() {
  return (event) => (shouldDropChunkLoadSentryEvent(event) ? null : event);
}

function tryReloadOnceForChunkError() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return;
  }
  window.location.reload();
}

/**
 * Recover real users stuck on stale HTML after a Vercel deployment (one reload per tab).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onChunkFailure = (message) => {
    if (!messageLooksLikeChunkLoadError(message)) return;
    tryReloadOnceForChunkError();
  };

  window.addEventListener("error", (event) => {
    onChunkFailure(event?.message || "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const message =
      (reason && typeof reason === "object" && reason.message) ||
      (typeof reason === "string" ? reason : String(reason ?? ""));
    onChunkFailure(message);
  });
}
