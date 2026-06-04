import { isChunkLoadError } from "./sentry.shared.config.js";

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * After a Vercel deploy, users with stale HTML may request deleted JS chunks.
 * Reload once so the browser picks up the new asset manifest.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const clearReloadGuard = () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // sessionStorage may be unavailable in private mode
    }
  };

  window.addEventListener("load", clearReloadGuard);

  const reloadOnceForStaleChunks = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return false;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      // Fall through to reload even if sessionStorage is blocked.
    }
    window.location.reload();
    return true;
  };

  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event?.error || event?.message)) {
      reloadOnceForStaleChunks();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event?.reason)) {
      reloadOnceForStaleChunks();
    }
  });
}
