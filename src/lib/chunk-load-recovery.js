/** sessionStorage key: one automatic reload per tab session after a stale chunk failure */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

/**
 * Detect Next.js / Turbopack chunk load failures (stale HTML after deploy, CDN 404, etc.).
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (error == null) return false;

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error?.message === "string"
          ? error.message
          : String(error);

  if (!message) return false;

  return (
    /Failed to load chunk/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /dynamically imported module/i.test(message)
  );
}

/**
 * Drop chunk-load noise in Sentry; recovery reload handles real users during deploys.
 * @param {import("@sentry/types").Event} event
 * @returns {import("@sentry/types").Event | null}
 */
export function filterChunkLoadSentryEvent(event) {
  const exception = event?.exception?.values?.[0];
  const message = exception?.value || event?.message || "";
  return isChunkLoadError({ message }) ? null : event;
}

/**
 * Attempt a single full-page reload when a stale JS chunk cannot be fetched.
 * @param {unknown} error
 * @param {{ reload?: () => void; storage?: Storage | null }} [options]
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError(error, options = {}) {
  if (!isChunkLoadError(error)) return false;

  const hasTestHooks = options.storage != null || options.reload != null;
  if (typeof window === "undefined" && !hasTestHooks) return false;

  const storage =
    options.storage ??
    (typeof window !== "undefined" ? window.sessionStorage : null);
  if (storage?.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;

  try {
    storage?.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Private mode / blocked storage — still attempt reload once.
  }

  const reload =
    options.reload ??
    (typeof window !== "undefined"
      ? () => window.location.reload()
      : null);
  if (!reload) return false;

  reload();
  return true;
}

/**
 * Register global listeners and clear the reload guard after a successful load.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onError = (event) => {
    tryRecoverFromChunkLoadError(event.error ?? event.message);
  };

  const onRejection = (event) => {
    tryRecoverFromChunkLoadError(event.reason);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  window.addEventListener("load", () => {
    try {
      window.sessionStorage?.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // ignore
    }
  });
}
