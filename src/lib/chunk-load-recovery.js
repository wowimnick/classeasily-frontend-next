import { isChunkLoadError } from "./sentry-filters";

const RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

function getErrorMessage(reason) {
  if (!reason) return "";
  if (typeof reason === "string") return reason;
  return reason.message || String(reason);
}

/**
 * After a Vercel deploy, long-lived tabs can reference purged chunks.
 * Reload once so the browser picks up the current deployment manifest.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = (message) => {
    if (!isChunkLoadError(message)) return;
    if (sessionStorage.getItem(RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptReload(event.message || getErrorMessage(event.error));
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptReload(getErrorMessage(event.reason));
  });

  window.addEventListener("load", () => {
    sessionStorage.removeItem(RELOAD_SESSION_KEY);
  });
}
