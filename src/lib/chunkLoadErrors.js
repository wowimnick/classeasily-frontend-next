/**
 * Detect Next.js / Turbopack stale-chunk load failures (common after deploys or for crawlers).
 */

const CHUNK_LOAD_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /dynamically imported module/i,
];

export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") {
    return false;
  }
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

export function isChunkLoadSentryEvent(event) {
  const values = event?.exception?.values;
  if (!Array.isArray(values)) {
    return false;
  }
  return values.some((entry) => isChunkLoadErrorMessage(entry?.value));
}

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

/**
 * Reload once when a stale JS chunk fails to load so users pick up the latest deploy.
 * Skips repeat reload loops and does nothing during SSR.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const maybeReload = (message) => {
    if (!isChunkLoadErrorMessage(message)) {
      return;
    }
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    maybeReload(event?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason?.message || reason?.toString?.();
    maybeReload(message);
  });
}
