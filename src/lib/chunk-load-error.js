/** Matches Next.js / Turbopack dynamic import chunk failures after a new deployment. */
export const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError/i;

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

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
    return (
      CHUNK_LOAD_ERROR_PATTERN.test(value.message) ||
      (value.cause instanceof Error &&
        CHUNK_LOAD_ERROR_PATTERN.test(value.cause.message))
    );
  }
  if (typeof value === "object" && "message" in value) {
    const message = String(value.message ?? "");
    return CHUNK_LOAD_ERROR_PATTERN.test(message);
  }
  return CHUNK_LOAD_ERROR_PATTERN.test(String(value));
}

/**
 * Drop transient deployment-mismatch chunk errors from Sentry (not actionable app bugs).
 *
 * @param {import("@sentry/core").Event | null} event
 * @param {import("@sentry/core").EventHint} [hint]
 * @returns {boolean}
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  if (!event) return false;

  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;

  const exceptions = event.exception?.values ?? [];
  for (const entry of exceptions) {
    if (isChunkLoadError(entry?.value)) return true;
    if (entry?.type && entry?.value) {
      if (isChunkLoadError(`${entry.type}: ${entry.value}`)) return true;
    }
  }

  return isChunkLoadError(event.message);
}

/**
 * After a Vercel deploy, cached HTML can reference removed chunks. Reload once to fetch fresh assets.
 * Safe on the server (no-op) and guarded against infinite reload loops.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const maybeReload = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const onError = (event) => {
    if (isChunkLoadError(event?.message) || isChunkLoadError(event?.error)) {
      maybeReload();
    }
  };

  const onUnhandledRejection = (event) => {
    if (isChunkLoadError(event?.reason)) {
      maybeReload();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  window.addEventListener(
    "load",
    () => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
      } catch {
        /* ignore */
      }
    },
    { once: true },
  );
}
