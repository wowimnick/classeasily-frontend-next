/** sessionStorage key: one automatic reload per tab session after a chunk load failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_PATTERNS = [
  /Loading chunk [\d]+ failed/i,
  /Failed to load chunk/i,
  /ChunkLoadError/i,
  /Loading CSS chunk [\d]+ failed/i,
  /dynamically imported module/i,
];

/**
 * True when the error is a Next.js / Turbopack stale-chunk failure (common right after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(error));
  }
  if (error?.name === "ChunkLoadError") return true;
  const message = error?.message || String(error);
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Crawlers often request HTML from an older deployment and then fail on missing chunks.
 */
export function isLikelyCrawlerClient(userAgent) {
  const ua =
    userAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "") ||
    "";
  return /Googlebot|Google-InspectionTool|Storebot-Google|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(
    ua,
  );
}

export function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
  } catch {
    return false;
  }
}

export function markChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Reload once per session so users pick up assets from the current deployment.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (hasAttemptedChunkReload()) return false;
  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

/**
 * Listen for chunk failures that never reach a React error boundary.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (error) => {
    tryRecoverFromChunkLoadError(error);
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}

/**
 * Drop noisy crawler chunk errors; suppress the first user hit while we auto-reload.
 */
export function sentryBeforeSendChunkFilter(event, hint) {
  const error = hint?.originalException;
  if (!isChunkLoadError(error)) return event;

  const browserTag = event?.tags?.browser;
  if (browserTag === "GoogleOther" || isLikelyCrawlerClient()) {
    return null;
  }

  if (!hasAttemptedChunkReload()) {
    return null;
  }

  return event;
}
