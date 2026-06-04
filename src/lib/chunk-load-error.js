/** sessionStorage key: one automatic reload per tab session on chunk mismatch */
export const CHUNK_RELOAD_STORAGE_KEY = "classeasily:chunk-reload-attempted";

export function getChunkLoadErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isChunkLoadError(error) {
  const message = getChunkLoadErrorMessage(error);
  return (
    /Failed to load chunk/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /dynamically imported module/i.test(message)
  );
}

export function isCrawlerUserAgent(userAgent = "") {
  if (!userAgent) return false;
  return /googlebot|google-other|bingbot|yandex|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|embedly|outbrain|pinterestbot|applebot|wget|curl\/|python-requests|headless/i.test(
    userAgent,
  );
}

export function isCrawlerSentryEvent(event) {
  if (!event) return false;
  if (event.tags?.browser === "GoogleOther") return true;
  if (event.contexts?.browser?.name === "GoogleOther") return true;
  const ua =
    event.request?.headers?.["User-Agent"] ||
    event.request?.headers?.["user-agent"] ||
    "";
  return isCrawlerUserAgent(ua);
}

/**
 * Drop Turbopack/Webpack chunk mismatch noise from Sentry. Real users get an auto-reload.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const error = hint?.originalException;
  const message =
    getChunkLoadErrorMessage(error) ||
    (typeof event?.message === "string" ? event.message : "") ||
    (typeof event?.title === "string" ? event.title : "");
  return isChunkLoadError(error) || isChunkLoadError(message);
}

export function attemptChunkLoadRecovery() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still try one reload
  }
  window.location.reload();
  return true;
}

export function clearChunkReloadGuard() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function installChunkLoadRecoveryListeners() {
  if (typeof window === "undefined") return;

  const onFailure = (error) => {
    if (isChunkLoadError(error)) {
      attemptChunkLoadRecovery();
    }
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}
