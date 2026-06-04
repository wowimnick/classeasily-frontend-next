/**
 * Detect Next.js / Turbopack dynamic chunk load failures (common after deploys
 * when a tab still references hashed chunks from a previous build).
 */

export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const CRAWLER_BROWSER_NAMES = new Set([
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
]);

const CRAWLER_UA_SNIPPETS = [
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /petalbot/i,
];

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isChunkLoadError(error) {
  const message = getErrorMessage(error);
  if (CHUNK_LOAD_MESSAGE.test(message)) return true;
  if (error instanceof Error && error.name === "ChunkLoadError") return true;
  return false;
}

/**
 * Bots often hit stale chunk URLs while crawling; these are not actionable app bugs.
 */
export function isCrawlerBrowser(navigatorLike = globalThis.navigator) {
  if (!navigatorLike) return false;
  const browserName =
    typeof navigatorLike.userAgentData?.brands?.[0]?.brand === "string"
      ? navigatorLike.userAgentData.brands.map((b) => b.brand).join(" ")
      : "";
  if (CRAWLER_BROWSER_NAMES.has(browserName)) return true;

  const ua = navigatorLike.userAgent || "";
  return CRAWLER_UA_SNIPPETS.some((pattern) => pattern.test(ua));
}

export function hasAttemptedChunkReload(storageLike = globalThis.sessionStorage) {
  if (!storageLike) return false;
  try {
    return storageLike.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markChunkReloadAttempted(storageLike = globalThis.sessionStorage) {
  if (!storageLike) return;
  try {
    storageLike.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // Private mode / disabled storage — recovery still attempts one reload.
  }
}

export function clearChunkReloadAttempt(storageLike = globalThis.sessionStorage) {
  if (!storageLike) return;
  try {
    storageLike.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns true when the error should not be sent to Sentry.
 */
export function shouldSuppressChunkLoadErrorInSentry(error, options = {}) {
  if (!isChunkLoadError(error)) return false;

  const { navigator: navigatorLike, sessionStorage: storageLike } = options;

  if (isCrawlerBrowser(navigatorLike)) return true;

  // First occurrence: client will hard-reload to pick up the latest deployment.
  if (!hasAttemptedChunkReload(storageLike)) return true;

  return false;
}
