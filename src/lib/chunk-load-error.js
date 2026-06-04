const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const BOT_BROWSER_PATTERN =
  /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|facebookexternalhit/i;

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (common after deploys).
 */
export function isChunkLoadError(errorOrMessage) {
  if (!errorOrMessage) return false;
  const message =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage?.message || String(errorOrMessage);
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export function isBotBrowser(browserName) {
  if (!browserName || typeof browserName !== "string") return false;
  return BOT_BROWSER_PATTERN.test(browserName);
}

/**
 * Drop noisy chunk-load events in Sentry once client recovery is installed.
 * Bots are always suppressed; real users are suppressed because we auto-reload.
 */
export function shouldSuppressChunkLoadSentryEvent(event) {
  const exceptionValue = event?.exception?.values?.[0]?.value || "";
  const message = event?.message || "";
  if (!isChunkLoadError(exceptionValue) && !isChunkLoadError(message)) {
    return false;
  }

  const browser =
    event?.tags?.browser ||
    event?.tags?.["browser.name"] ||
    event?.contexts?.browser?.name ||
    "";
  if (isBotBrowser(browser)) return true;

  // Expected after deploy skew; client reload handler addresses real users.
  return true;
}

/**
 * Reload once per tab session when a stale chunk is requested after deployment.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptRecovery = (errorOrMessage) => {
    if (!isChunkLoadError(errorOrMessage)) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptRecovery(event?.error || event?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptRecovery(event?.reason);
  });
}
