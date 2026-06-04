/** Session flag to avoid infinite reload loops after a chunk load failure. */
export const CHUNK_RELOAD_SESSION_KEY = "sentry-chunk-reload-attempted";

const CHUNK_LOAD_ERROR_RE =
  /Failed to load chunk|Loading chunk [\da-f]+ failed|ChunkLoadError/i;

const CRAWLER_UA_RE =
  /Googlebot|GoogleOther|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|Bytespider|YandexBot/i;

/**
 * True when the error is a Next.js / Turbopack stale-chunk failure (common right after deploy).
 */
export function isChunkLoadErrorMessage(message) {
  if (!message || typeof message !== "string") return false;
  return CHUNK_LOAD_ERROR_RE.test(message);
}

export function isChunkLoadSentryEvent(event, hint) {
  const fromException = event?.exception?.values?.[0]?.value;
  const fromHint = hint?.originalException?.message;
  const fromMessage = event?.message;
  return [fromException, fromHint, fromMessage].some((m) =>
    isChunkLoadErrorMessage(typeof m === "string" ? m : String(m ?? "")),
  );
}

export function isKnownCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_RE.test(userAgent);
}

export function isKnownCrawlerSentryEvent(event) {
  const browserTag = event?.tags?.browser ?? event?.tags?.["browser.name"];
  if (browserTag && isKnownCrawlerUserAgent(String(browserTag))) return true;
  const ua = event?.request?.headers?.["User-Agent"];
  return isKnownCrawlerUserAgent(ua);
}

/**
 * Drop transient chunk-load errors from Sentry. They usually mean HTML and JS chunks
 * came from different deployments (or a crawler hit mid-deploy), not an app defect.
 */
export function sentryBeforeSend(event, hint) {
  if (isChunkLoadSentryEvent(event, hint)) {
    return null;
  }
  return event;
}

function shouldRecoverFromChunkMessage(message) {
  if (!isChunkLoadErrorMessage(message)) return false;
  if (typeof navigator === "undefined") return false;
  if (isKnownCrawlerUserAgent(navigator.userAgent)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }
  return true;
}

/**
 * One-shot full page reload when a real user's tab still references evicted chunks.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      const message = event?.message || event?.error?.message || "";
      if (!shouldRecoverFromChunkMessage(message)) return;
      window.location.reload();
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const message =
      (reason && typeof reason === "object" && reason.message) ||
      (typeof reason === "string" ? reason : String(reason ?? ""));
    if (!shouldRecoverFromChunkMessage(message)) return;
    window.location.reload();
  });
}
