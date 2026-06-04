/**
 * Recover from stale Next.js / Turbopack chunks after a deployment.
 * Browsers (or crawlers) with cached HTML can request chunk URLs that no longer exist.
 */

export const CHUNK_RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERN =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|Importing a module script failed/i;

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_ERROR_PATTERN.test(error);
  const name = typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : String(error);
  return name === "ChunkLoadError" || CHUNK_ERROR_PATTERN.test(message);
}

/**
 * @param {import("@sentry/core").Event} event
 * @returns {boolean}
 */
export function isChunkLoadSentryEvent(event) {
  const value = event?.exception?.values?.[0]?.value ?? "";
  return CHUNK_ERROR_PATTERN.test(String(value));
}

/**
 * Reload once per tab session so users pick up the latest deployment assets.
 * @returns {boolean} True when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)) {
    return false;
  }
  sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  window.location.reload();
  return true;
}

/**
 * Register global handlers for chunk load failures (client-only).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    const err = event.error ?? event.message;
    if (isChunkLoadError(err)) {
      tryRecoverFromChunkLoadError();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      tryRecoverFromChunkLoadError();
    }
  });
}

/**
 * Drop stale-chunk noise from Sentry; attempt one recovery reload first.
 * @returns {import("@sentry/core").Event | null}
 */
export function sentryBeforeSendChunkFilter(event, hint) {
  const original = hint?.originalException;
  if (!isChunkLoadError(original) && !isChunkLoadSentryEvent(event)) {
    return event;
  }

  if (typeof window !== "undefined") {
    tryRecoverFromChunkLoadError();
  }

  return null;
}
