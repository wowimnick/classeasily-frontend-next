import { CHUNK_LOAD_ERROR_RE, isCrawlerUserAgent } from "../../sentry.shared.config.js";

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * After a deployment, users with a stale HTML shell may fail to load old chunks.
 * Reload once per tab session so they pick up the new asset manifest (skip crawlers).
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const maybeReloadForChunkFailure = (message) => {
    if (!message || !CHUNK_LOAD_ERROR_RE.test(message)) {
      return;
    }
    if (isCrawlerUserAgent(navigator.userAgent)) {
      return;
    }
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    maybeReloadForChunkFailure(event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "";
    maybeReloadForChunkFailure(message);
  });
}
