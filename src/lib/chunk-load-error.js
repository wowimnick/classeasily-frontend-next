/** sessionStorage key: one automatic reload per tab session on chunk mismatch */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const BOT_USER_AGENT =
  /Googlebot|GoogleOther|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|facebookexternalhit|Twitterbot|LinkedInBot|Bytespider/i;

/**
 * True when the error is a Next.js / Turbopack dynamic import chunk failure
 * (common after deploy when HTML and chunk hashes are out of sync).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error?.name === "ChunkLoadError") return true;
  const message =
    typeof error === "string"
      ? error
      : error?.message || (typeof error?.toString === "function" ? error.toString() : "");
  return CHUNK_LOAD_MESSAGE.test(message);
}

export function isLikelyBotUserAgent(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
) {
  return BOT_USER_AGENT.test(userAgent || "");
}

/**
 * Reload once per session so real users recover after a deployment without
 * spamming Sentry. Returns true when a reload was triggered.
 */
export function reloadOnceOnChunkLoadError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Private mode / blocked storage: still attempt one reload.
  }
  window.location.reload();
  return true;
}

/**
 * Handle a chunk load failure: skip bots, reload real users once, suppress Sentry noise.
 */
export function handleChunkLoadError(error) {
  if (!isChunkLoadError(error)) return { handled: false, reloaded: false };
  if (isLikelyBotUserAgent()) return { handled: true, reloaded: false };
  const reloaded = reloadOnceOnChunkLoadError();
  return { handled: true, reloaded };
}

/** Drop chunk-load errors from Sentry — transient deploy mismatch or bot crawl. */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;
  const message = event?.exception?.values?.[0]?.value || event?.message || "";
  return isChunkLoadError(message);
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (error) => {
    handleChunkLoadError(error);
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}
