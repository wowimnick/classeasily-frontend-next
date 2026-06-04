const CHUNK_LOAD_PATTERNS = [
  /Failed to load chunk/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
];

const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-load-reload";

const CRAWLER_UA_PATTERNS = [
  /googlebot/i,
  /googleother/i,
  /bingbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /duckduckbot/i,
  /slurp/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /embedly/i,
  /pinterest/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /petalbot/i,
];

/**
 * True when the error is a Next.js / Turbopack dynamic chunk load failure
 * (common after a deployment when HTML still references removed chunks).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message = typeof error === "string" ? error : error.message || "";
  const name = typeof error === "string" ? "" : error.name || "";
  return CHUNK_LOAD_PATTERNS.some(
    (pattern) => pattern.test(message) || pattern.test(name),
  );
}

export function isLikelyCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Drop chunk-load noise from crawlers and from sessions where we already
 * attempted a one-time hard reload recovery.
 */
export function shouldDropChunkLoadSentryEvent(event, hint) {
  const originalException = hint?.originalException;
  const error =
    originalException instanceof Error
      ? originalException
      : event?.exception?.values?.[0];
  const message =
    (error && typeof error === "object" && "value" in error
      ? error.value
      : error?.message) || event?.message || "";
  const syntheticError =
    typeof message === "string" ? { message, name: error?.type || "" } : error;

  if (!isChunkLoadError(syntheticError)) return false;

  const browserName =
    event?.tags?.["browser.name"] ||
    event?.contexts?.browser?.name ||
    event?.contexts?.browser?.browser;
  if (browserName === "GoogleOther") return true;

  const userAgent =
    event?.request?.headers?.["User-Agent"] ||
    event?.contexts?.browser?.browser ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (isLikelyCrawlerUserAgent(userAgent)) return true;

  if (typeof sessionStorage !== "undefined") {
    return Boolean(sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY));
  }

  return false;
}

function reloadWithCacheBust() {
  const url = new URL(window.location.href);
  url.searchParams.set("_ce_chunk_reload", String(Date.now()));
  window.location.replace(url.toString());
}

/**
 * On chunk load failure, reload once so the client picks up the current
 * deployment's asset manifest. Prevents infinite reload loops via sessionStorage.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const handleChunkFailure = (error) => {
    if (!isChunkLoadError(error)) return;

    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      return;
    }

    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    reloadWithCacheBust();
  };

  window.addEventListener("error", (event) => {
    handleChunkFailure(event.error ?? new Error(event.message || ""));
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event.reason);
  });
}
