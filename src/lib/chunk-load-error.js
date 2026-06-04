const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

/**
 * True when an error is a Next.js / Turbopack stale-deployment chunk failure.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (typeof error === "string") return CHUNK_LOAD_MESSAGE.test(error);
  const message = error.message || "";
  const name = error.name || "";
  return CHUNK_LOAD_MESSAGE.test(message) || name === "ChunkLoadError";
}

/**
 * Reload once per tab session so users pick up assets from the current deployment.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Listen for chunk load failures and auto-reload before route error boundaries fire.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (error) => {
    if (isChunkLoadError(error)) tryRecoverFromChunkLoadError();
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}

export const chunkLoadIgnoreErrors = [
  /^Failed to load chunk/i,
  /^Loading chunk \d+ failed/i,
  "ChunkLoadError",
];
