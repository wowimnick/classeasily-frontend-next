import { isChunkLoadError } from "./sentry-error-filters";

const CHUNK_RELOAD_SESSION_KEY = "ce_chunk_reload_attempted";

/**
 * After a Vercel deploy, long-lived tabs can reference removed chunk hashes.
 * Reload once so the browser picks up the new asset manifest.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = (message) => {
    if (!isChunkLoadError(message)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptReload(event?.message || event?.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptReload(event?.reason);
  });
}
