import {
  isChunkLoadErrorMessage,
  isCrawlerUserAgent,
} from "../../sentry.shared.config.js";

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * After a deploy, long-lived tabs can reference stale chunk URLs. Reload once per
 * session so real users recover; skip crawlers and avoid reload loops.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const maybeReloadForChunkError = (message) => {
    if (!isChunkLoadErrorMessage(message)) return;
    if (isCrawlerUserAgent(navigator.userAgent)) return;
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;

    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    maybeReloadForChunkError(event.message || "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason && typeof reason === "object" && "message" in reason
        ? String(reason.message)
        : String(reason ?? "");
    maybeReloadForChunkError(message);
  });
}
