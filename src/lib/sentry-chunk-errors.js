/** Session key: one automatic reload per tab session after a stale chunk failure. */
const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Loading chunk [\d]+ failed|Failed to load chunk|ChunkLoadError|Loading CSS chunk [\d]+ failed/i;

const BOT_USER_AGENT =
  /Googlebot|Google-InspectionTool|GoogleOther|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|Embedly|ia_archiver/i;

const BOT_BROWSER_TAGS = new Set([
  "GoogleOther",
  "Googlebot",
  "Google Bot",
  "Bingbot",
]);

/**
 * True when the error is a Next.js / Turbopack stale chunk load failure.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message = error.message || String(error);
  return CHUNK_LOAD_MESSAGE.test(message) || error.name === "ChunkLoadError";
}

/**
 * Client-only: detect crawlers that often hit stale HTML after deploys.
 */
export function isLikelyBot() {
  if (typeof navigator === "undefined") return false;
  return BOT_USER_AGENT.test(navigator.userAgent);
}

function isBotFromSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (browserTag && BOT_BROWSER_TAGS.has(browserTag)) return true;

  const browserName = event?.contexts?.browser?.name;
  if (browserName && BOT_BROWSER_TAGS.has(browserName)) return true;

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.request?.headers?.["user-agent"] ||
    "";
  return BOT_USER_AGENT.test(userAgent);
}

/**
 * Drop chunk-load noise from crawlers in Sentry (beforeSend).
 */
export function shouldDropChunkLoadEvent(event, hint) {
  const error = hint?.originalException;
  if (!isChunkLoadError(error) && !CHUNK_LOAD_MESSAGE.test(event?.message || "")) {
    return false;
  }
  return isBotFromSentryEvent(event);
}

/**
 * Reload once so real users pick up fresh chunks after a deployment.
 * @returns {true} if a reload was started
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
 * Listen for chunk failures before React error boundaries report them.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleChunkFailure = (error) => {
    if (!isChunkLoadError(error) || isLikelyBot()) return;
    tryRecoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error ?? event);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}

export function sentryBeforeSend(event, hint) {
  if (shouldDropChunkLoadEvent(event, hint)) {
    return null;
  }
  return event;
}
