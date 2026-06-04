/**
 * Recover from stale Next.js/Turbopack chunk URLs after a deployment.
 * Browsers (or crawlers) with cached HTML may request JS chunks that no longer exist.
 */

export const CHUNK_RELOAD_STORAGE_KEY = "ce-chunk-reload-attempted";

/** Fallback when sessionStorage is unavailable (SSR, tests, private mode). */
let inMemoryChunkReloadAttempted = false;

/** @param {unknown} error */
export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

/** @param {unknown} error */
export function isChunkLoadError(error) {
  const message = getErrorMessage(error);
  const cause =
    typeof error === "object" && error !== null && "cause" in error
      ? getErrorMessage(error.cause)
      : "";
  const combined = `${message} ${cause}`.toLowerCase();

  return (
    combined.includes("failed to load chunk") ||
    combined.includes("loading chunk") ||
    combined.includes("chunkloaderror") ||
    combined.includes("loading css chunk") ||
    /\/_next\/static\/chunks\//.test(combined)
  );
}

/** @param {string | undefined | null} userAgent */
export function isLikelyBotUserAgent(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("googlebot") ||
    ua.includes("bingbot") ||
    ua.includes("yandexbot") ||
    ua.includes("baiduspider") ||
    ua.includes("duckduckbot") ||
    ua.includes("slurp") ||
    ua.includes("facebookexternalhit") ||
    ua.includes("twitterbot") ||
    ua.includes("linkedinbot") ||
    ua.includes("applebot") ||
    ua.includes("semrushbot") ||
    ua.includes("ahrefsbot") ||
    ua.includes("petalbot") ||
    ua.includes("headlesschrome")
  );
}

/** @param {import("@sentry/core").Event} event */
export function isLikelyBotFromSentryEvent(event) {
  const browserTag = event?.tags?.browser;
  if (browserTag === "GoogleOther") return true;

  const browserName = event?.contexts?.browser?.name;
  if (browserName === "GoogleOther") return true;

  const userAgent = event?.request?.headers?.["User-Agent"];
  return isLikelyBotUserAgent(
    typeof userAgent === "string" ? userAgent : undefined,
  );
}

export function hasRecentlyAttemptedChunkReload() {
  if (typeof sessionStorage !== "undefined") {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === "1") {
        return true;
      }
    } catch {
      // Fall through to in-memory flag.
    }
  }
  return inMemoryChunkReloadAttempted;
}

export function markChunkReloadAttempted() {
  inMemoryChunkReloadAttempted = true;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
  } catch {
    // Private browsing or blocked storage — in-memory flag still applies.
  }
}

/** Reset reload state — intended for tests only. */
export function resetChunkReloadAttemptedForTests() {
  inMemoryChunkReloadAttempted = false;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures in tests.
  }
}

/**
 * Reload once so the browser picks up the latest deployment assets.
 * @param {unknown} error
 * @returns {boolean} true when a reload was triggered
 */
export function attemptChunkLoadRecovery(error) {
  if (typeof globalThis.window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  if (isLikelyBotUserAgent(globalThis.navigator?.userAgent)) return false;
  if (hasRecentlyAttemptedChunkReload()) return false;

  markChunkReloadAttempted();
  globalThis.window.location.reload();
  return true;
}

/** @param {import("@sentry/core").Event} event */
export function shouldDropChunkLoadSentryEvent(event) {
  const exception = event?.exception?.values?.[0];
  const message = exception?.value || event?.message || "";
  if (!isChunkLoadError({ message })) return false;

  // Crawlers often keep stale HTML; not actionable and already handled as noise.
  if (isLikelyBotFromSentryEvent(event)) return true;

  // First failure in this tab: auto-reload handles it. Report only if reload did not help.
  return !hasRecentlyAttemptedChunkReload();
}

/** @param {unknown} reason */
function handleUnhandledRejection(reason) {
  attemptChunkLoadRecovery(reason);
}

/** @param {ErrorEvent} event */
function handleWindowError(event) {
  attemptChunkLoadRecovery(event.error ?? event.message);
}

export function registerChunkLoadRecoveryHandlers() {
  if (typeof globalThis.window === "undefined") return () => {};

  globalThis.window.addEventListener("error", handleWindowError);
  globalThis.window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    globalThis.window.removeEventListener("error", handleWindowError);
    globalThis.window.removeEventListener(
      "unhandledrejection",
      handleUnhandledRejection,
    );
  };
}
