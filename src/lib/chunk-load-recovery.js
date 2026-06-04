/** Session key: one automatic reload per tab session after a stale chunk failure. */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
];

/**
 * True when the error is a Next.js / Turbopack stale chunk load failure (common after deploy).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message != null
        ? String(error.message)
        : "";
  const name = error?.name != null ? String(error.name) : "";
  const combined = `${name} ${message}`.trim();
  if (!combined) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(combined));
}

/**
 * Register global handlers that reload once when a stale JS chunk cannot be fetched.
 * Safe for real users after Vercel deploys; bots may still error but are filtered in Sentry.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const attemptReload = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return false;
    }
    window.location.reload();
    return true;
  };

  window.addEventListener("error", (event) => {
    const candidate = event.error ?? { message: String(event.message ?? "") };
    if (isChunkLoadError(candidate)) attemptReload();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) attemptReload();
  });
}

/**
 * Drop expected stale-chunk noise from Sentry after recovery is in place.
 */
export function shouldIgnoreChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;
  const message = event?.message ?? event?.exception?.values?.[0]?.value ?? "";
  return isChunkLoadError({ message: String(message) });
}
