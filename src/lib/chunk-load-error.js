const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk [\w-]+ failed|ChunkLoadError/i;

const CRAWLER_BROWSER =
  /^(GoogleOther|Googlebot|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot)/i;

const CRAWLER_USER_AGENT =
  /googlebot|google-other|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|applebot/i;

/**
 * True when the error is a Next.js / Turbopack dynamic import chunk failure
 * (common after deploy when HTML and chunk hashes are out of sync).
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message =
    typeof error === "string"
      ? error
      : error?.message || error?.value || String(error);
  return CHUNK_LOAD_MESSAGE.test(message);
}

export function isCrawlerBrowserName(browserName) {
  if (!browserName || typeof browserName !== "string") return false;
  return CRAWLER_BROWSER.test(browserName.trim());
}

export function isCrawlerUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return CRAWLER_USER_AGENT.test(userAgent);
}

function getBrowserNameFromSentryEvent(event) {
  const tagBrowser = event?.tags?.browser;
  if (typeof tagBrowser === "string") return tagBrowser;
  return event?.contexts?.browser?.name || "";
}

/**
 * Drop noisy chunk-load events (crawlers, or after we already tried a reload).
 */
export function shouldDropChunkLoadSentryEvent(event) {
  const exception = event?.exception?.values?.[0];
  const message = exception?.value || event?.message || "";
  if (!isChunkLoadError(message)) return false;

  if (isCrawlerBrowserName(getBrowserNameFromSentryEvent(event))) {
    return true;
  }

  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1") {
        return true;
      }
      if (isCrawlerUserAgent(window.navigator?.userAgent || "")) {
        return true;
      }
    } catch {
      // sessionStorage may be unavailable in restricted contexts
    }
  }

  return false;
}

function tryReloadForStaleChunks() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1") {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

function handleChunkFailure(reason) {
  if (!isChunkLoadError(reason)) return;
  if (
    isCrawlerUserAgent(
      typeof window !== "undefined" ? window.navigator?.userAgent : "",
    )
  ) {
    return;
  }
  tryReloadForStaleChunks();
}

/**
 * Recover real users after a deployment by reloading once when a stale chunk 404s.
 */
export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    const candidate = event?.error ?? event?.message;
    handleChunkFailure(candidate);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleChunkFailure(event?.reason);
  });
}
