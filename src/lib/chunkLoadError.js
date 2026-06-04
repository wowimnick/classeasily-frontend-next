/** sessionStorage key — one automatic reload per tab session after a chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * Detect Next.js / Turbopack chunk load failures (stale assets after deploy, network blips).
 */
export function isChunkLoadError(error) {
  if (error == null) return false;

  if (typeof error === "string") {
    return /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i.test(
      error,
    );
  }

  const name = error.name;
  if (name === "ChunkLoadError") return true;

  const message = error.message;
  if (typeof message !== "string") return false;

  return /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i.test(
    message,
  );
}

/**
 * Reload once per session so users pick up fresh chunk hashes after a deployment.
 * Returns true when a reload was triggered.
 */
export function tryRecoverFromChunkLoadError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;

  try {
    if (window.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    window.sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable (bots, strict privacy mode)
  }

  window.location.reload();
  return true;
}

/** Register global listeners so lazy-loaded route chunks recover without hitting error UI. */
export function registerChunkLoadErrorRecovery() {
  if (typeof window === "undefined") return;

  const handle = (error) => {
    tryRecoverFromChunkLoadError(error);
  };

  window.addEventListener("unhandledrejection", (event) => {
    handle(event.reason);
  });

  window.addEventListener("error", (event) => {
    handle(event.error ?? event.message);
  });
}
