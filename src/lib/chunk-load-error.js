/**
 * Next.js / Turbopack can throw when a tab still references JS chunks from a
 * previous Vercel deployment. Real users recover with a single reload; crawlers
 * often hit this during deploys and are not actionable in Sentry.
 */

export const CHUNK_LOAD_RELOAD_SESSION_KEY = "ce-chunk-load-reload";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\d]+ failed|ChunkLoadError|dynamically imported module/i;

function messageFromUnknown(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || String(value);
  if (typeof value.message === "string") return value.message;
  return String(value);
}

/** True when the error text matches a stale deployment / missing chunk failure. */
export function isChunkLoadError(error) {
  const message = messageFromUnknown(error);
  if (CHUNK_LOAD_MESSAGE.test(message)) return true;

  const stack =
    error instanceof Error
      ? error.stack
      : typeof error?.stack === "string"
        ? error.stack
        : "";
  return CHUNK_LOAD_MESSAGE.test(stack);
}

/** Drop noisy, non-actionable chunk-load events from Sentry ingestion. */
export function shouldDropChunkLoadSentryEvent(event) {
  const values = event?.exception?.values;
  if (!Array.isArray(values)) return false;

  return values.some((entry) => {
    const type = entry?.type || "";
    const value = entry?.value || "";
    return (
      CHUNK_LOAD_MESSAGE.test(`${type} ${value}`) ||
      CHUNK_LOAD_MESSAGE.test(value)
    );
  });
}

function extractErrorFromDomEvent(event) {
  if (!event) return null;
  if (event.reason !== undefined) return event.reason;
  if (event.error instanceof Error) return event.error;
  if (typeof event.message === "string") return event.message;
  return null;
}

/**
 * On the first chunk-load failure in a session, reload once so the browser
 * picks up assets from the current deployment. Clears the guard after success.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(CHUNK_LOAD_RELOAD_SESSION_KEY);
  } catch {
    /* sessionStorage may be unavailable in private mode */
  }

  const handleFailure = (domEvent) => {
    const candidate = extractErrorFromDomEvent(domEvent);
    if (!isChunkLoadError(candidate)) return;

    let alreadyReloaded = false;
    try {
      alreadyReloaded =
        sessionStorage.getItem(CHUNK_LOAD_RELOAD_SESSION_KEY) === "1";
    } catch {
      return;
    }

    if (!alreadyReloaded) {
      try {
        sessionStorage.setItem(CHUNK_LOAD_RELOAD_SESSION_KEY, "1");
      } catch {
        return;
      }
      window.location.reload();
      return;
    }

    try {
      sessionStorage.removeItem(CHUNK_LOAD_RELOAD_SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  window.addEventListener("error", handleFailure);
  window.addEventListener("unhandledrejection", handleFailure);
}
