import {
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "./chunk-load-errors";

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

export function hasAttemptedChunkReload() {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearChunkReloadAttempt() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // Ignore private browsing / disabled storage.
  }
}

function markChunkReloadAttempted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Ignore private browsing / disabled storage.
  }
}

/**
 * Reload once per page load when a stale JS chunk fails (common after deploys).
 * Returns true when a reload was initiated.
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (isCrawlerUserAgent()) return false;
  if (hasAttemptedChunkReload()) return false;

  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  clearChunkReloadAttempt();

  const onUnhandledRejection = (event) => {
    if (tryRecoverFromChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  };

  const onError = (event) => {
    const candidate = event.error || event.message;
    if (tryRecoverFromChunkLoadError(candidate)) {
      event.preventDefault();
    }
  };

  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onError);
}

export function createChunkLoadBeforeSend() {
  return (event, hint) => {
    const error = hint?.originalException;
    if (
      shouldDropChunkLoadSentryEvent(error, {
        reloadAttempted: hasAttemptedChunkReload(),
      })
    ) {
      return null;
    }
    return event;
  };
}
