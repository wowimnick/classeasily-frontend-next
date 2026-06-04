const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\d]+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

/**
 * Returns true when an error looks like a stale JS chunk failed to load
 * (common after deployments when cached HTML references removed chunks).
 */
export function isChunkLoadError(error) {
  if (!error) {
    return false;
  }

  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason || String(error);

  if (typeof message !== "string" || !message) {
    return false;
  }

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Returns true for known crawlers that often hit stale chunk URLs after deploys.
 */
export function isLikelyCrawlerUserAgent(userAgent) {
  if (typeof userAgent !== "string" || !userAgent) {
    return false;
  }

  return /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|LinkedInBot|Twitterbot|Applebot/i.test(
    userAgent,
  );
}

export function getChunkReloadSessionKey() {
  return CHUNK_RELOAD_SESSION_KEY;
}

function hasAlreadyReloadedForChunkError(storage) {
  try {
    return Boolean(storage?.getItem(CHUNK_RELOAD_SESSION_KEY));
  } catch {
    return false;
  }
}

function markChunkReloadAttempted(storage) {
  try {
    storage?.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures (private mode, disabled cookies, etc.).
  }
}

/**
 * Reload once per tab session when a chunk load fails so users pick up the
 * latest deployment assets. Returns true when a reload was triggered.
 */
export function reloadOnceForChunkError({
  storage = typeof sessionStorage !== "undefined" ? sessionStorage : null,
  reload = typeof window !== "undefined" ? () => window.location.reload() : null,
} = {}) {
  if (!reload || hasAlreadyReloadedForChunkError(storage)) {
    return false;
  }

  markChunkReloadAttempted(storage);
  reload();
  return true;
}

function handleChunkLoadFailure(error, options) {
  if (!isChunkLoadError(error)) {
    return false;
  }

  return reloadOnceForChunkError(options);
}

/**
 * Install global listeners that recover from stale chunk references after deploys.
 */
export function installChunkLoadRecovery(options = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onError = (event) => {
    const candidate = event?.error ?? event?.message;
    handleChunkLoadFailure(candidate, options);
  };

  const onUnhandledRejection = (event) => {
    handleChunkLoadFailure(event?.reason, options);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
