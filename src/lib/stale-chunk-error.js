/** Session key — timestamp (ms) of the last auto-reload for a stale chunk. */
export const STALE_CHUNK_RELOAD_KEY = "ce-stale-chunk-reload-at";

/** Minimum ms between automatic reloads to avoid infinite refresh loops. */
export const STALE_CHUNK_RELOAD_COOLDOWN_MS = 30_000;

/**
 * True when the error is a Next.js / Turbopack dynamic-import chunk failure
 * after a deployment (HTML references chunk hashes that no longer exist).
 */
export function isStaleChunkLoadError(error) {
  const message =
    (error && typeof error === "object" && "message" in error
      ? error.message
      : null) ?? (typeof error === "string" ? error : "");
  if (!message) return false;
  return (
    /Failed to load chunk/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

function shouldReloadForStaleChunk() {
  if (typeof window === "undefined" || !window.sessionStorage) return false;
  const last = window.sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY);
  if (!last) return true;
  const lastMs = Number.parseInt(last, 10);
  if (!Number.isFinite(lastMs)) return true;
  return Date.now() - lastMs > STALE_CHUNK_RELOAD_COOLDOWN_MS;
}

function reloadForStaleChunk() {
  if (!shouldReloadForStaleChunk()) return;
  window.sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
}

/**
 * On chunk load failure (common right after a Vercel deploy), reload once so
 * the browser picks up the current deployment's asset manifest.
 */
export function installStaleChunkRecovery() {
  if (typeof window === "undefined") return;

  const onError = (event) => {
    const candidate = event?.error ?? event?.message;
    if (isStaleChunkLoadError(candidate)) {
      reloadForStaleChunk();
    }
  };

  const onRejection = (event) => {
    if (isStaleChunkLoadError(event?.reason)) {
      reloadForStaleChunk();
    }
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
}
