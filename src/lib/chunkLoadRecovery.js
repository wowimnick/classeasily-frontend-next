/** sessionStorage key — timestamp (ms) of the last automatic chunk-error reload */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-ts";

/** Minimum gap between automatic reloads for repeated chunk failures */
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_LOAD_ERROR_RE =
  /Failed to load chunk|ChunkLoadError|Loading chunk \d+ failed|Loading CSS chunk \d+ failed/i;

/**
 * True when the error matches Next.js / Turbopack dynamic import chunk failures
 * (common after a deployment when HTML references stale chunk hashes).
 */
export function isChunkLoadError(error) {
  if (error == null) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || (typeof error?.toString === "function" ? error.toString() : "");
  return CHUNK_LOAD_ERROR_RE.test(message || "");
}

export function shouldReloadForChunkError(now, lastReloadTs) {
  if (lastReloadTs == null || lastReloadTs === "") return true;
  const parsed = Number(lastReloadTs);
  if (Number.isNaN(parsed)) return true;
  return now - parsed > CHUNK_RELOAD_COOLDOWN_MS;
}

export function getChunkReloadTimestamp(storage) {
  try {
    return storage?.getItem?.(CHUNK_RELOAD_SESSION_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setChunkReloadTimestamp(storage, now = Date.now()) {
  try {
    storage?.setItem?.(CHUNK_RELOAD_SESSION_KEY, String(now));
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Reload once per cooldown window so users pick up fresh chunks after a deploy.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError({
  error,
  reload,
  storage,
  now = Date.now(),
} = {}) {
  if (!isChunkLoadError(error)) return false;

  const last = getChunkReloadTimestamp(storage);
  if (!shouldReloadForChunkError(now, last)) return false;

  setChunkReloadTimestamp(storage, now);
  reload?.();
  return true;
}

/** Crawlers that execute JS poorly and generate unactionable chunk-load noise. */
export function isKnownCrawlerUserAgent(userAgent) {
  if (!userAgent) return false;
  return /GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|LinkedInBot|Twitterbot|SemrushBot/i.test(
    userAgent
  );
}

/**
 * Drop Sentry events we cannot act on (crawlers) or that trigger an automatic reload.
 */
export function shouldDropSentryEvent(event, hint, { storage, now = Date.now() } = {}) {
  const ua =
    event?.request?.headers?.["User-Agent"] ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (isKnownCrawlerUserAgent(ua)) return true;

  const err = hint?.originalException ?? hint?.syntheticException;
  if (!isChunkLoadError(err)) return false;

  const last = getChunkReloadTimestamp(storage);
  return shouldReloadForChunkError(now, last);
}

export function registerChunkLoadRecoveryListeners({
  windowRef = typeof window !== "undefined" ? window : undefined,
  storage = typeof sessionStorage !== "undefined" ? sessionStorage : null,
  reload = () => windowRef?.location?.reload?.(),
} = {}) {
  if (!windowRef?.addEventListener) return () => {};

  const onError = (event) => {
    tryRecoverFromChunkLoadError({
      error: event?.error ?? event?.message,
      reload,
      storage,
    });
  };

  const onRejection = (event) => {
    tryRecoverFromChunkLoadError({
      error: event?.reason,
      reload,
      storage,
    });
  };

  windowRef.addEventListener("error", onError);
  windowRef.addEventListener("unhandledrejection", onRejection);

  return () => {
    windowRef.removeEventListener("error", onError);
    windowRef.removeEventListener("unhandledrejection", onRejection);
  };
}
