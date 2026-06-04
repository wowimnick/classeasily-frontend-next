/** sessionStorage key — set before a one-time hard reload on chunk load failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /(?:Failed to load chunk|Loading chunk \d+ failed|Loading CSS chunk \d+ failed|ChunkLoadError)/i;

/** Bot user agents that commonly hit stale cached HTML after deploys. */
const BOT_BROWSER_TAGS = new Set(["GoogleOther", "Googlebot", "bingbot", "Applebot"]);

/**
 * Returns true when the error is a Next.js / webpack / turbopack chunk load failure.
 * These typically happen when a tab keeps old HTML after a new deployment.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }
  if (error.name === "ChunkLoadError") return true;
  const message = error.message || "";
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isLikelyBotBrowser(browserTag) {
  return BOT_BROWSER_TAGS.has(browserTag);
}

/**
 * Hard-reload once per tab session so the browser picks up fresh chunk URLs.
 * Returns true when a reload was initiated.
 */
export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function hasAttemptedChunkReload() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
  } catch {
    return false;
  }
}

/**
 * Decide whether a chunk load error should be dropped from Sentry.
 * Real users get one auto-reload; bots and post-reload failures are noise.
 */
export function shouldSuppressChunkLoadError(event, error) {
  if (!isChunkLoadError(error)) return false;

  const browserTag = event?.tags?.browser;
  if (isLikelyBotBrowser(browserTag)) return true;

  // First failure triggers reload — suppress until we know recovery failed.
  if (!hasAttemptedChunkReload()) return true;

  return false;
}
