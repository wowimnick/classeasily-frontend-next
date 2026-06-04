/** sessionStorage key: set when we auto-reload once after a stale chunk failure */
export const CHUNK_RECOVERY_STORAGE_KEY = "ce-chunk-reload-attempted";

const CHUNK_ERROR_MESSAGE =
  /(?:failed to load chunk|loading chunk \d+ failed|chunkloaderror|dynamically imported module)/i;

const CRAWLER_USER_AGENT =
  /(?:googlebot|googleother|adsbot-google|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot)/i;

/**
 * True when `error` is a Next.js / Turbopack / webpack stale-chunk load failure.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error.message || error.toString?.() || "";
  if (CHUNK_ERROR_MESSAGE.test(message)) return true;
  const name = typeof error === "object" ? error.name : "";
  return name === "ChunkLoadError";
}

/**
 * True for known search / preview crawlers that often keep stale HTML after deploys.
 */
export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_USER_AGENT.test(userAgent);
}

/**
 * Sentry event payloads use `exception.values[].value` instead of Error.message.
 */
export function isChunkLoadSentryEvent(event) {
  const values = event?.exception?.values;
  if (!Array.isArray(values)) return false;
  return values.some((entry) => {
    const type = entry?.type || "";
    const value = entry?.value || "";
    return (
      type === "ChunkLoadError" ||
      CHUNK_ERROR_MESSAGE.test(value) ||
      CHUNK_ERROR_MESSAGE.test(`${type}: ${value}`)
    );
  });
}

/**
 * Reload once per tab session so users recover after a deployment without an infinite loop.
 * @returns {boolean} true when a reload was triggered
 */
export function tryRecoverFromChunkLoadError() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RECOVERY_STORAGE_KEY, "1");
  } catch {
    // Private mode / blocked storage: still attempt one reload.
  }

  window.location.reload();
  return true;
}

/** Clear the one-shot reload guard after a successful full page load. */
export function clearChunkRecoveryAttempt() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RECOVERY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Whether a chunk-load failure should be suppressed (crawler noise or first-shot reload).
 * @param {{ userAgent?: string, hasRecoveryAttempt?: boolean }} [options]
 */
export function shouldSuppressChunkLoadReport(options = {}) {
  const userAgent =
    options.userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (isCrawlerUserAgent(userAgent)) {
    return true;
  }

  if (options.hasRecoveryAttempt) {
    return false;
  }

  if (typeof window !== "undefined") {
    try {
      if (!sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY)) {
        tryRecoverFromChunkLoadError();
        return true;
      }
    } catch {
      // fall through to report persistent chunk failures
    }
  }

  return false;
}

/**
 * Decide whether a chunk-load error should be dropped before sending to Sentry.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  const isChunk =
    isChunkLoadError(original) || isChunkLoadSentryEvent(event);
  if (!isChunk) return false;

  let hasRecoveryAttempt = false;
  if (typeof window !== "undefined") {
    try {
      hasRecoveryAttempt = Boolean(
        sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY),
      );
    } catch {
      hasRecoveryAttempt = false;
    }
  }

  return shouldSuppressChunkLoadReport({ hasRecoveryAttempt });
}
