import { isChunkLoadError, reloadForChunkError } from "./chunk-load-error";

let installed = false;

function handleChunkFailure(event) {
  const candidate = event?.reason ?? event?.error ?? event;
  if (!isChunkLoadError(candidate)) return;

  if (reloadForChunkError() && typeof event?.preventDefault === "function") {
    event.preventDefault();
  }
}

/**
 * Recover real users after deploys when cached HTML references removed JS chunks.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  window.addEventListener("unhandledrejection", handleChunkFailure);
  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event?.error) || isChunkLoadError(event?.message)) {
      handleChunkFailure(event);
    }
  });
}
