const CHUNK_RELOAD_KEY = "ce_chunk_reload";

/** Matches Next.js / Turbopack / webpack chunk load failures after deploys or stale caches. */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to load chunk") ||
    normalized.includes("loading chunk") ||
    normalized.includes("chunkloaderror") ||
    normalized.includes("dynamically imported module")
  );
}

/**
 * After a Vercel deploy, clients with stale HTML may request old chunk hashes (404).
 * Reload once so the browser picks up the current deployment's assets.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptRecovery = (error) => {
    if (!isChunkLoadError(error)) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    attemptRecovery(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    attemptRecovery(event.reason);
  });
}
