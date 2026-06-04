const CHUNK_RELOAD_SESSION_KEY = "ce_chunk_reload_attempted";

const CHUNK_LOAD_MESSAGE_RE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|Loading CSS chunk/i;

/** Detect Next.js / Turbopack dynamic import failures after a new deployment. */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_MESSAGE_RE.test(error);
  const message = error?.message;
  const name = error?.name;
  if (typeof message === "string" && CHUNK_LOAD_MESSAGE_RE.test(message)) {
    return true;
  }
  return name === "ChunkLoadError";
}

const CRAWLER_USER_AGENT_RE =
  /Googlebot|GoogleOther|bingbot|Slurp|DuckDuckBot|baiduspider|yandex/i;

/** Known crawlers that often hit stale HTML during deploys (not actionable in Sentry). */
export function isCrawlerClient(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
) {
  return CRAWLER_USER_AGENT_RE.test(userAgent || "");
}

export function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return true;
  return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
}

export function markChunkReloadAttempted() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  }
}

/**
 * Reload once per tab session so users recover after a deploy without an infinite loop.
 * @returns {boolean} true when a reload was triggered
 */
export function reloadOnceForChunkLoadError() {
  if (
    typeof window === "undefined" ||
    isCrawlerClient() ||
    hasAttemptedChunkReload()
  ) {
    return false;
  }
  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

/** Register global listeners for chunk load failures (dynamic import / script tags). */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (error) => {
    if (!isChunkLoadError(error) || isCrawlerClient()) return;
    reloadOnceForChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(event.reason);
  });
}
