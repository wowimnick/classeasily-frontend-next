/** Session key: one automatic full reload per tab session after a stale chunk failure. */
export const CHUNK_LOAD_RELOAD_SESSION_KEY = "ce_chunk_load_reload_attempted";

const CHUNK_LOAD_MESSAGE_RE =
  /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError/i;

const BOT_USER_AGENT_RE =
  /googlebot|googleother|bingbot|yandexbot|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|embedly|quora link preview|rogerbot|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot/i;

/** @param {string | undefined | null} message */
export function isChunkLoadErrorMessage(message) {
  return typeof message === "string" && CHUNK_LOAD_MESSAGE_RE.test(message);
}

/**
 * @param {import("@sentry/core").Event} event
 */
export function isChunkLoadSentryEvent(event) {
  const direct = event?.message;
  if (isChunkLoadErrorMessage(direct)) return true;

  const exceptions = event?.exception?.values;
  if (!Array.isArray(exceptions)) return false;

  return exceptions.some((entry) =>
    isChunkLoadErrorMessage(entry?.value || entry?.type),
  );
}

/**
 * Crawlers often execute partial JS and hit stale Turbopack chunks after deploys.
 * @param {import("@sentry/core").Event} event
 */
export function isBotSentryEvent(event) {
  const tags = event?.tags;
  const browserName =
    (Array.isArray(tags)
      ? tags.find(([key]) => key === "browser.name")?.[1]
      : tags?.["browser.name"]) || event?.contexts?.browser?.name;

  if (typeof browserName === "string" && BOT_USER_AGENT_RE.test(browserName)) {
    return true;
  }

  const userAgent = event?.request?.headers?.["User-Agent"];
  return typeof userAgent === "string" && BOT_USER_AGENT_RE.test(userAgent);
}

/**
 * Drop noisy chunk-load events; keep events when auto-reload already failed.
 * @param {import("@sentry/core").Event} event
 */
export function shouldDropChunkLoadSentryEvent(event) {
  if (!isChunkLoadSentryEvent(event)) return false;
  if (isBotSentryEvent(event)) return true;

  if (typeof sessionStorage === "undefined") return false;
  return !sessionStorage.getItem(CHUNK_LOAD_RELOAD_SESSION_KEY);
}

/**
 * One-shot reload when a tab still references chunks from a prior Vercel deployment.
 */
export function setupChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const tryReloadOnce = () => {
    if (sessionStorage.getItem(CHUNK_LOAD_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_LOAD_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  };

  window.addEventListener(
    "error",
    (event) => {
      if (!isChunkLoadErrorMessage(event.message)) return;
      tryReloadOnce();
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason?.message ||
      (typeof reason === "string" ? reason : String(reason ?? ""));
    if (!isChunkLoadErrorMessage(message)) return;
    tryReloadOnce();
  });
}
