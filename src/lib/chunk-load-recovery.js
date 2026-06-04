/** sessionStorage key — one automatic reload per tab session after a stale chunk. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/** Matches Next.js / Turbopack dynamic import failures after a deployment. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isChunkLoadError(value) {
  if (value == null) return false;
  if (typeof value === "string") {
    return CHUNK_LOAD_ERROR_PATTERN.test(value);
  }
  if (value instanceof Error) {
    if (CHUNK_LOAD_ERROR_PATTERN.test(value.message || "")) return true;
    const cause = value.cause;
    if (cause instanceof Error) {
      return CHUNK_LOAD_ERROR_PATTERN.test(cause.message || "");
    }
  }
  return false;
}

/**
 * @param {import("@sentry/core").Event} event
 * @returns {boolean}
 */
export function isChunkLoadSentryEvent(event) {
  const exceptions = event?.exception?.values;
  if (!Array.isArray(exceptions)) return false;
  return exceptions.some((entry) => isChunkLoadError(entry?.value || entry?.type));
}

/**
 * Register a one-time full page reload when a stale JS chunk fails to load (common
 * right after Vercel deploys while users still have an older HTML shell).
 *
 * @param {typeof window} [win]
 */
export function registerChunkLoadRecovery(win = typeof window !== "undefined" ? window : undefined) {
  if (!win?.addEventListener || !win.sessionStorage) return;

  const maybeRecover = (value) => {
    if (!isChunkLoadError(value)) return;
    if (win.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
    win.sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    win.location.reload();
  };

  win.addEventListener(
    "error",
    (event) => {
      maybeRecover(event?.message || event?.error);
    },
    true,
  );

  win.addEventListener("unhandledrejection", (event) => {
    maybeRecover(event?.reason);
  });
}
