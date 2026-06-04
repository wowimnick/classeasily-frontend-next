/** sessionStorage key: one automatic reload per tab session for stale JS chunks after deploy */
export const CHUNK_RELOAD_SESSION_KEY = "ce-chunk-reload-attempted";

const CHUNK_LOAD_MESSAGE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const BOT_BROWSER_TAGS =
  /GoogleOther|Googlebot|Google-InspectionTool|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot/i;

const BOT_USER_AGENT =
  /Googlebot|Google-InspectionTool|Storebot-Google|GoogleOther|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot/i;

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

export function isChunkLoadError(error) {
  return CHUNK_LOAD_MESSAGE.test(getErrorMessage(error));
}

export function isLikelyBotUserAgent(
  navigatorRef = typeof globalThis !== "undefined"
    ? globalThis.navigator
    : undefined,
) {
  const ua = navigatorRef?.userAgent;
  if (!ua) return false;
  return BOT_USER_AGENT.test(ua);
}

export function isLikelyBotSentryEvent(event) {
  const browserTag = event?.tags?.browser ?? "";
  if (BOT_BROWSER_TAGS.test(String(browserTag))) return true;

  const browserName = event?.contexts?.browser?.name ?? "";
  if (BOT_BROWSER_TAGS.test(String(browserName))) return true;

  const ua = event?.request?.headers?.["User-Agent"] ?? "";
  return BOT_USER_AGENT.test(String(ua));
}

export function isChunkLoadSentryEvent(event, hint) {
  const original = hint?.originalException;
  if (isChunkLoadError(original)) return true;

  const values = event?.exception?.values;
  if (!Array.isArray(values)) return false;
  return values.some((entry) =>
    CHUNK_LOAD_MESSAGE.test(entry?.value || entry?.type || ""),
  );
}

/**
 * Drop bot chunk-load noise; for real users reload once then only report if it persists.
 */
export function filterChunkLoadSentryEvent(event, hint) {
  if (!isChunkLoadSentryEvent(event, hint)) return event;
  if (isLikelyBotSentryEvent(event)) return null;

  if (typeof window === "undefined") return event;

  try {
    if (!sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
      window.location.reload();
      return null;
    }
  } catch {
    window.location.reload();
    return null;
  }

  return event;
}

/**
 * Client-side listener backup (runs before route error boundaries in some cases).
 */
export function reloadOnceForChunkError() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable; still attempt one reload
  }
  window.location.reload();
  return true;
}

export function setupChunkLoadRecoveryListeners() {
  if (typeof window === "undefined") return;

  const handleMessage = (message) => {
    if (!CHUNK_LOAD_MESSAGE.test(message || "")) return;
    if (isLikelyBotUserAgent()) return;
    reloadOnceForChunkError();
  };

  window.addEventListener("error", (event) => {
    handleMessage(event?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    handleMessage(getErrorMessage(reason));
  });
}
