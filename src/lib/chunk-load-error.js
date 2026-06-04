const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (common after deploys).
 */
export function isChunkLoadError(errorOrMessage) {
  if (!errorOrMessage) return false;

  if (typeof errorOrMessage === "string") {
    return matchesChunkLoadMessage(errorOrMessage);
  }

  if (errorOrMessage?.name === "ChunkLoadError") return true;

  const message = errorOrMessage?.message;
  if (typeof message === "string" && matchesChunkLoadMessage(message)) {
    return true;
  }

  return matchesChunkLoadMessage(String(errorOrMessage));
}

function matchesChunkLoadMessage(message) {
  return (
    /Failed to load chunk/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

/**
 * Reload once per tab session so users recover after a deployment without an error loop.
 */
export function tryReloadForChunkLoadError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt a single reload.
  }

  window.location.reload();
  return true;
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleChunkFailure = (errorOrMessage) => {
    if (!isChunkLoadError(errorOrMessage)) return;
    tryReloadForChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
