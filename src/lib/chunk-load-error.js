/** sessionStorage key: set before a one-time full reload after a stale chunk failure */
export const CHUNK_RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE_RE =
  /failed to load chunk|chunkloaderror|loading chunk [\d]+ failed|loading css chunk/i;

/**
 * True when the error is a Next.js / Turbopack stale-chunk failure after deploy.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_MESSAGE_RE.test(error);
  const message = error?.message;
  if (typeof message === "string" && CHUNK_LOAD_MESSAGE_RE.test(message)) {
    return true;
  }
  const name = error?.name;
  return name === "ChunkLoadError";
}

/**
 * Crawlers often hit stale HTML/chunk pairs after deploys; these are not actionable.
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return /googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic-ai|headlesschrome/i.test(
    userAgent,
  );
}

export function getUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

export function hasChunkReloadBeenAttempted() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Reload once after a chunk failure so users pick up the latest deployment assets.
 * @returns {boolean} true when a reload was triggered
 */
export function reloadOnceAfterChunkLoadError() {
  if (typeof window === "undefined") return false;
  if (isCrawlerUserAgent(getUserAgent())) return false;
  if (hasChunkReloadBeenAttempted()) return false;
  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

/**
 * Whether this chunk error should be dropped from Sentry (client-side beforeSend).
 */
export function shouldSuppressChunkLoadErrorInSentry(error) {
  if (!isChunkLoadError(error)) return false;
  if (isCrawlerUserAgent(getUserAgent())) return true;
  return !hasChunkReloadBeenAttempted();
}
