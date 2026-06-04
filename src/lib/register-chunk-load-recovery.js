import { isChunkLoadError } from "./is-chunk-load-error";

const RELOAD_FLAG_KEY = "ce-chunk-reload-attempted";

/**
 * Reload once when a stale JS chunk fails to load (common during Vercel deploys).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (error) => {
    if (!isChunkLoadError(error)) return;
    if (sessionStorage.getItem(RELOAD_FLAG_KEY)) return;

    sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(event.reason);
  });
}
