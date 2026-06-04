import { isChunkLoadErrorMessage } from "../../sentry.shared.config.js";

const RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * After a Vercel deploy, long-lived tabs can reference removed JS chunks.
 * Reload once so the browser picks up the new asset manifest.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (message) => {
    if (!isChunkLoadErrorMessage(message)) return;
    if (sessionStorage.getItem(RELOAD_SESSION_KEY)) return;
    sessionStorage.setItem(RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event?.message ?? event?.error?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    tryRecover(reason?.message ?? (typeof reason === "string" ? reason : ""));
  });

  window.addEventListener("load", () => {
    sessionStorage.removeItem(RELOAD_SESSION_KEY);
  });
}
