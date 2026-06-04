/** sessionStorage key — one automatic reload per tab session on chunk mismatch. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
  /importing a module script failed/i,
];

const CRAWLER_USER_AGENT_PATTERN =
  /Googlebot|Google-InspectionTool|GoogleOther|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|facebookexternalhit|LinkedInBot|Twitterbot|Applebot/i;

/**
 * True when a dynamic import / webpack-turbopack chunk failed to load — usually
 * stale HTML after a Vercel deploy.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || String(error);

  const name = typeof error === "object" && error !== null ? error.name : "";

  return (
    name === "ChunkLoadError" ||
    CHUNK_LOAD_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
  );
}

/** Best-effort crawler detection (Googlebot mobile renders as Nexus 5X + GoogleOther). */
export function isKnownCrawlerUserAgent(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
) {
  return CRAWLER_USER_AGENT_PATTERN.test(userAgent);
}

/**
 * Reload the page once per session to pick up fresh chunk URLs after deploy.
 * @returns {boolean} true when a reload was triggered
 */
export function reloadOnceForChunkError(storage = getSessionStorage()) {
  if (typeof window === "undefined" || !storage) {
    return false;
  }

  if (storage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    return false;
  }

  storage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  window.location.reload();
  return true;
}

function getSessionStorage() {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * Attempt self-healing reload; returns true when the error should not be reported.
 */
export function shouldSuppressChunkLoadError(
  error,
  { userAgent, storage } = {},
) {
  if (!isChunkLoadError(error)) {
    return false;
  }

  if (isKnownCrawlerUserAgent(userAgent)) {
    return true;
  }

  return reloadOnceForChunkError(storage ?? getSessionStorage());
}

/**
 * Sentry beforeSend helper — drop noisy chunk-mismatch events we already handle.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const message = event?.message || event?.exception?.values?.[0]?.value || "";

  if (!isChunkLoadError(original) && !isChunkLoadError(message)) {
    return false;
  }

  const browserTag = event?.tags?.browser || event?.contexts?.browser?.name || "";
  if (/GoogleOther|Googlebot|bingbot|Applebot/i.test(browserTag)) {
    return true;
  }

  const storage = getSessionStorage();
  if (storage && !storage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    reloadOnceForChunkError(storage);
    return true;
  }

  // After one reload attempt, chunk errors are usually still deploy/cache noise.
  return true;
}

/** Register global listeners early (instrumentation-client.js). */
export function registerChunkLoadRecoveryHandlers() {
  if (typeof window === "undefined") {
    return;
  }

  const onFailure = (error) => {
    shouldSuppressChunkLoadError(error);
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}
