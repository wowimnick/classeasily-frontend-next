const CHUNK_RELOAD_SESSION_KEY = "chunk-load-reload-attempted";

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const BOT_BROWSER_PATTERN =
  /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i;

/**
 * Detect Next.js / Turbopack lazy-chunk failures (common after deployments).
 */
export function isChunkLoadError(error) {
  if (error == null) return false;

  if (typeof error === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(error);
  }

  const name = error.name || "";
  const message = error.message || String(error);
  return name === "ChunkLoadError" || CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Private browsing or disabled storage — skip persistence.
  }
}

/**
 * Reload once per session so stale HTML picks up the current deployment's chunks.
 * Returns true when a reload was triggered.
 */
export function recoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  if (hasAttemptedChunkReload()) return false;

  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

function getSentryErrorMessage(event) {
  const exception = event?.exception?.values?.[0];
  return exception?.value || event?.message || "";
}

function getSentryBrowserTag(event) {
  return event?.tags?.browser || event?.contexts?.browser?.name || "";
}

/**
 * Drop noisy chunk-load events we auto-recover from, or that come from crawlers.
 */
export function shouldSuppressChunkLoadErrorForSentry(event) {
  const message = getSentryErrorMessage(event);
  if (!isChunkLoadError({ message })) return false;

  const browser = String(getSentryBrowserTag(event));
  if (BOT_BROWSER_PATTERN.test(browser)) return true;

  // First failure in this session: we reload silently instead of paging on-call.
  return !hasAttemptedChunkReload();
}

export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleChunkFailure = (error) => {
    if (!isChunkLoadError(error)) return;
    recoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
