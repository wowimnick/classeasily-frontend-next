/**
 * Next.js / Turbopack chunk load failures after a Vercel deployment usually mean
 * the browser (or a crawler) is running HTML from an older build that references
 * chunks that no longer exist. Recover with a one-time reload and avoid Sentry noise.
 */

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE_RE =
  /failed to load chunk|loading chunk \d+ failed|chunkloaderror/i;

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") {
    return CHUNK_LOAD_MESSAGE_RE.test(error);
  }
  if (typeof error !== "object") return false;

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  const name =
    "name" in error && typeof error.name === "string" ? error.name : "";

  return (
    CHUNK_LOAD_MESSAGE_RE.test(message) ||
    name === "ChunkLoadError"
  );
}

/**
 * @param {import("@sentry/nextjs").ErrorEvent} event
 * @param {import("@sentry/nextjs").EventHint} hint
 * @returns {import("@sentry/nextjs").ErrorEvent | null}
 */
export function filterChunkLoadSentryEvent(event, hint) {
  if (shouldDropChunkLoadSentryEvent(event, hint)) {
    return null;
  }
  return event;
}

/**
 * @param {import("@sentry/nextjs").ErrorEvent | undefined} event
 * @param {import("@sentry/nextjs").EventHint | undefined} hint
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  if (isChunkLoadError(hint?.originalException)) {
    return true;
  }

  const values = event?.exception?.values;
  if (!Array.isArray(values)) return false;

  return values.some((ex) =>
    isChunkLoadError({
      message: typeof ex.value === "string" ? ex.value : "",
      name: typeof ex.type === "string" ? ex.type : "",
    }),
  );
}

/** Register global handlers that reload once when a stale chunk fails to load. */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  const maybeRecover = (reason) => {
    if (!isChunkLoadError(reason)) return;
    reloadOnce();
  };

  window.addEventListener("unhandledrejection", (event) => {
    maybeRecover(event.reason);
  });

  window.addEventListener("error", (event) => {
    maybeRecover(event.error ?? event.message);
  });
}
