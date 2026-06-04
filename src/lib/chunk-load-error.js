const CHUNK_LOAD_RELOAD_KEY = "ce-chunk-load-reload";

const CHUNK_LOAD_MESSAGE_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk [\d]+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk [\d]+ failed/i,
];

const NEXT_CHUNK_ASSET_PATTERN = /\/_next\/static\/chunks\//;

/**
 * Detect Next.js / Turbopack chunk load failures (usually stale assets after deploy).
 */
export function isChunkLoadError(errorOrMessage) {
  if (!errorOrMessage) {
    return false;
  }

  const message =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage.message || String(errorOrMessage);

  if (CHUNK_LOAD_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  return errorOrMessage?.name === "ChunkLoadError";
}

export function isNextChunkAssetUrl(url) {
  return typeof url === "string" && NEXT_CHUNK_ASSET_PATTERN.test(url);
}

export function shouldDropChunkLoadSentryEvent(event) {
  const exceptionValues = event?.exception?.values || [];
  for (const exception of exceptionValues) {
    if (isChunkLoadError(exception?.value) || isChunkLoadError(exception)) {
      return true;
    }
  }

  return isChunkLoadError(event?.message);
}

/**
 * Reload once when a lazy chunk fails so users pick up the latest deployment.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const reloadForStaleChunk = () => {
    if (sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY)) {
      return;
    }

    sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    const assetUrl = event?.target?.src || event?.target?.href;

    if (isChunkLoadError(event?.message) || isNextChunkAssetUrl(assetUrl)) {
      reloadForStaleChunk();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event?.reason)) {
      event.preventDefault();
      reloadForStaleChunk();
    }
  });
}
