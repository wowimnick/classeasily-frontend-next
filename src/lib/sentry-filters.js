import { isChunkLoadError } from "./chunk-load-recovery.js";

const BOT_BROWSER_NAMES = new Set([
  "GoogleOther",
  "HeadlessChrome",
  "PhantomJS",
]);

const BOT_UA_SNIPPETS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /applebot/i,
  /petalbot/i,
  /semrushbot/i,
  /ahrefsbot/i,
];

function getExceptionMessage(hint) {
  const original = hint?.originalException;
  if (!original) return "";
  if (typeof original === "string") return original;
  if (original instanceof Error) return original.message || "";
  if (typeof original.message === "string") return original.message;
  return "";
}

/** Drop crawler traffic that cannot benefit from client recovery. */
export function isLikelyBot(event) {
  const browserName = event?.tags?.["browser.name"] ?? event?.contexts?.browser?.name;
  if (browserName && BOT_BROWSER_NAMES.has(browserName)) {
    return true;
  }

  const userAgent =
    event?.request?.headers?.["User-Agent"] ??
    event?.request?.headers?.["user-agent"] ??
    event?.contexts?.browser?.user_agent ??
    "";

  if (typeof userAgent === "string" && userAgent) {
    return BOT_UA_SNIPPETS.some((pattern) => pattern.test(userAgent));
  }

  return false;
}

/**
 * Client-side Sentry filter: suppress noisy, expected errors.
 * Returns null to drop the event.
 */
export function sentryBeforeSend(event, hint) {
  if (isLikelyBot(event)) {
    return null;
  }

  const exceptionMessage = getExceptionMessage(hint);
  const eventMessage = typeof event?.message === "string" ? event.message : "";
  const title = typeof event?.title === "string" ? event.title : "";

  if (
    isChunkLoadError(exceptionMessage) ||
    isChunkLoadError(eventMessage) ||
    isChunkLoadError(title)
  ) {
    return null;
  }

  return event;
}
