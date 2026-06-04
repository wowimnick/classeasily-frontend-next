/**
 * Recover from stale JS chunks after a deployment (Turbopack / webpack dynamic import).
 * Reloads once per tab session to avoid infinite loops.
 */
export const CHUNK_RELOAD_SESSION_KEY = "ce_chunk_reload_attempted";

/** @param {unknown} value */
export function isChunkLoadMessage(value) {
  if (typeof value !== "string" || !value) {
    return false;
  }
  const normalized = value.toLowerCase();
  return (
    normalized.includes("failed to load chunk") ||
    normalized.includes("loading chunk") ||
    normalized.includes("chunkloaderror") ||
    normalized.includes("dynamically imported module")
  );
}

export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        return;
      }
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      // sessionStorage may be unavailable in private mode; still attempt one reload
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    if (isChunkLoadMessage(event.message)) {
      reloadOnce();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason && typeof reason.message === "string"
          ? reason.message
          : "";
    if (isChunkLoadMessage(message)) {
      reloadOnce();
    }
  });
}
