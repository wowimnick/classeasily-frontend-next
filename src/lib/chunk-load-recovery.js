import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
} from "./chunk-load-error";

/** Set when a reload is scheduled in this page lifetime (suppresses duplicate Sentry events). */
let chunkReloadScheduled = false;

export function isChunkReloadScheduled() {
  return chunkReloadScheduled;
}

export function hasChunkReloadBeenAttempted() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markChunkReloadAttempted() {
  chunkReloadScheduled = true;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Private mode / blocked storage — still reload once per tab via in-memory flag.
  }
}

function clearChunkReloadAttempted() {
  chunkReloadScheduled = false;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Reload once after a stale chunk failure so users pick up the latest deployment assets.
 * Returns true when a reload was scheduled.
 */
export function recoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (isLikelyCrawlerUserAgent(navigator.userAgent)) return false;
  if (hasChunkReloadBeenAttempted()) return false;

  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

function onWindowError(event) {
  const err = event?.error ?? event?.message;
  recoverFromChunkLoadError(err);
}

function onUnhandledRejection(event) {
  recoverFromChunkLoadError(event?.reason);
}

/**
 * Register global listeners and clear the reload guard after a successful load.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("load", clearChunkReloadAttempted, { once: true });
}
