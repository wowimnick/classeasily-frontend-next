const CHUNK_RELOAD_KEY = "ce_chunk_reload_attempted";

const CHUNK_LOAD_PATTERNS = [
  /Loading chunk [\d]+ failed/i,
  /Failed to load chunk/i,
  /Loading CSS chunk [\d]+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

export function isChunkLoadError(error) {
  if (!error) return false;
  const name = typeof error === "object" ? error.name : "";
  if (name === "ChunkLoadError") return true;
  const message = getErrorMessage(error);
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

export function shouldReloadForChunkError() {
  if (typeof window === "undefined") return false;
  try {
    return !sessionStorage.getItem(CHUNK_RELOAD_KEY);
  } catch {
    return true;
  }
}

export function markChunkReloadAttempted() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage may be unavailable in embedded contexts
  }
}

export function reloadForChunkError() {
  if (typeof window === "undefined" || !shouldReloadForChunkError()) {
    return false;
  }
  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (error) => {
    if (isChunkLoadError(error)) {
      return reloadForChunkError();
    }
    return false;
  };

  window.addEventListener("error", (event) => {
    if (tryRecover(event.error || event.message)) {
      event.preventDefault();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (tryRecover(event.reason)) {
      event.preventDefault();
    }
  });
}

export function shouldDropChunkLoadErrorFromSentry(event, hint) {
  if (isChunkLoadError(hint?.originalException)) {
    return true;
  }

  const exceptionValue = event?.exception?.values?.[0]?.value;
  if (isChunkLoadError(exceptionValue)) {
    return true;
  }

  return isChunkLoadError(event?.message);
}
