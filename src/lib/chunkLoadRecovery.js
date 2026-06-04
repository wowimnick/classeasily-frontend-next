import { CHUNK_LOAD_ERROR_PATTERN } from "./sentryFilters";

const RELOAD_GUARD_KEY = "ce-chunk-reload-attempted";

function messageLooksLikeChunkFailure(message) {
  return CHUNK_LOAD_ERROR_PATTERN.test(String(message || ""));
}

function tryRecoverFromChunkFailure() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return;
  }
  if (sessionStorage.getItem(RELOAD_GUARD_KEY)) {
    return;
  }
  sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
  window.location.reload();
}

/**
 * After a Vercel deploy, clients can keep an old HTML shell that references
 * removed chunk hashes. One guarded reload usually fixes the session.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    if (messageLooksLikeChunkFailure(event.message)) {
      tryRecoverFromChunkFailure();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason?.message ||
      (typeof reason === "string" ? reason : "") ||
      String(reason ?? "");
    if (messageLooksLikeChunkFailure(message)) {
      tryRecoverFromChunkFailure();
    }
  });
}
