import { isStaleChunkLoadError } from "./sentry-error-filters";

const RELOAD_FLAG = "ce-chunk-reload-attempted";

function errorMessage(reason) {
  if (!reason) return "";
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return reason.message;
  if (typeof reason.message === "string") return reason.message;
  return String(reason);
}

function tryReloadForStaleChunk(message) {
  if (typeof window === "undefined") return;
  if (!isStaleChunkLoadError(message)) return;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    return;
  }
  window.location.reload();
}

/**
 * Recover once when lazy-loaded chunks 404 after a deployment (stale HTML).
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      tryReloadForStaleChunk(event.message || errorMessage(event.error));
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    tryReloadForStaleChunk(errorMessage(event.reason));
  });

  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* ignore */
    }
  });
}
