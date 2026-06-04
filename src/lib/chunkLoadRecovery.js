/** sessionStorage key — set before a one-time hard reload on stale chunk errors */
export const CHUNK_RELOAD_STORAGE_KEY = "ce:chunk-reload-attempted";

/**
 * Detect Next.js / Turbopack dynamic import chunk failures (common after deploys).
 */
export function isChunkLoadError(error) {
  if (error == null) return false;
  const message =
    typeof error === "string"
      ? error
      : typeof error?.message === "string"
        ? error.message
        : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("failed to load chunk") ||
    lower.includes("loading chunk") ||
    lower.includes("chunkloaderror") ||
    lower.includes("dynamically imported module")
  );
}

/**
 * @param {import("@sentry/core").Event} event
 */
export function isChunkLoadSentryEvent(event) {
  if (!event) return false;
  if (isChunkLoadError(event.message)) return true;
  const values = event.exception?.values;
  if (!values?.length) return false;
  return values.some(
    (entry) =>
      isChunkLoadError(entry.value) ||
      isChunkLoadError(entry.type) ||
      entry.type === "ChunkLoadError",
  );
}

/** Crawlers often keep stale HTML across deploys; not actionable in Sentry. */
export function isLikelyCrawlerBrowser(browserName) {
  if (!browserName || typeof browserName !== "string") return false;
  const name = browserName.toLowerCase();
  return (
    name === "googleother" ||
    name.includes("bot") ||
    name.includes("crawler") ||
    name.includes("spider")
  );
}

/**
 * One hard reload per tab session when a stale chunk 404s after a deployment.
 * @returns {"recover" | "report" | "none"}
 */
export function handleChunkLoadFailure({
  reload = () => {
    if (typeof window !== "undefined") window.location.reload();
  },
  storage =
    typeof sessionStorage !== "undefined" ? sessionStorage : null,
} = {}) {
  if (!storage) return "none";
  if (storage.getItem(CHUNK_RELOAD_STORAGE_KEY)) return "report";
  storage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  reload();
  return "recover";
}

/** @deprecated Use handleChunkLoadFailure */
export function tryRecoverFromChunkLoadError(options = {}) {
  const action = handleChunkLoadFailure(options);
  if (action === "recover") return { recovered: true, reason: "reloading" };
  if (action === "report") return { recovered: false, reason: "already-reloaded" };
  return { recovered: false, reason: "no-storage" };
}

/** Clear reload guard after a successful full page load. */
export function clearChunkReloadAttempt(storage = sessionStorage) {
  try {
    storage?.removeItem(CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    // Private mode / blocked storage
  }
}

/**
 * @param {import("@sentry/core").Event} event
 * @param {unknown} originalException
 */
export function shouldDropChunkLoadSentryEvent(event, originalException) {
  if (!isChunkLoadSentryEvent(event) && !isChunkLoadError(originalException)) {
    return false;
  }

  const browser =
    event?.tags?.["browser.name"] ||
    event?.tags?.browser ||
    event?.contexts?.browser?.name;
  if (isLikelyCrawlerBrowser(browser)) {
    return true;
  }

  if (typeof sessionStorage === "undefined") {
    return true;
  }

  // After one reload, still failing — allow Sentry to capture the persistent case.
  return !sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
}

export function registerChunkLoadRecoveryHandlers({
  windowRef = typeof window !== "undefined" ? window : undefined,
  storage = typeof sessionStorage !== "undefined" ? sessionStorage : null,
} = {}) {
  if (!windowRef) return;

  const onError = (event) => {
    const candidate = event?.error ?? event?.message;
    if (!isChunkLoadError(candidate)) return;
    handleChunkLoadFailure({ storage });
  };

  const onRejection = (event) => {
    if (!isChunkLoadError(event?.reason)) return;
    event.preventDefault?.();
    handleChunkLoadFailure({ storage });
  };

  windowRef.addEventListener("error", onError);
  windowRef.addEventListener("unhandledrejection", onRejection);
  windowRef.addEventListener("load", () => clearChunkReloadAttempt(storage), {
    once: true,
  });
}
