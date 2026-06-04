const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-load-reload";

/**
 * Detect Next.js / Turbopack stale-chunk failures after a deployment.
 * These are usually harmless for crawlers or recoverable for real users via reload.
 */
export function isChunkLoadError(message) {
  if (typeof message !== "string" || !message) {
    return false;
  }

  return (
    message.includes("Failed to load chunk") ||
    message.includes("ChunkLoadError") ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Loading CSS chunk [\d]+ failed/i.test(message)
  );
}

export function isChunkLoadSentryEvent(event) {
  const exceptionMessage = event?.exception?.values?.[0]?.value;
  if (typeof exceptionMessage === "string" && isChunkLoadError(exceptionMessage)) {
    return true;
  }

  const eventMessage = event?.message;
  if (typeof eventMessage === "string" && isChunkLoadError(eventMessage)) {
    return true;
  }

  return false;
}

function reloadOnceForChunkError() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt one reload.
  }

  window.location.reload();
  return true;
}

/**
 * Recover from stale JS/CSS chunks by reloading once per tab session.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    } catch {
      // Ignore storage failures on successful load.
    }
  });

  window.addEventListener("error", (event) => {
    if (!isChunkLoadError(event.message)) {
      return;
    }
    reloadOnceForChunkError();
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason?.message || reason?.toString?.() || "";

    if (!isChunkLoadError(message)) {
      return;
    }

    if (reloadOnceForChunkError()) {
      event.preventDefault?.();
    }
  });
}
