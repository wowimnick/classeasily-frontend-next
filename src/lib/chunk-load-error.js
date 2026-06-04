const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload";

const CHUNK_LOAD_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk/i,
];

/**
 * True when an error is a Next.js/Turbopack stale-chunk fetch failure after deploy.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const candidates = [
    typeof error === "string" ? error : null,
    error?.message,
    error?.name,
    error?.cause?.message,
    error?.cause?.name,
  ].filter(Boolean);

  return candidates.some((text) =>
    CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(String(text))),
  );
}

/**
 * Drop noisy, usually self-healing chunk errors from Sentry (deploy/cache/bots).
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  if (isChunkLoadError(hint?.originalException)) {
    return true;
  }

  const exceptionValue = event?.exception?.values?.[0]?.value;
  if (isChunkLoadError(exceptionValue)) {
    return true;
  }

  return isChunkLoadError(event?.message);
}

/**
 * Reload once when a stale chunk fails so users pick up the latest deployment.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (error) => {
    if (!isChunkLoadError(error)) return;

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    } catch {
      return;
    }

    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tryRecover(event.reason);
  });
}
