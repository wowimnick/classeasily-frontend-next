import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  isCrawlerUserAgent,
  tryRecoverFromChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (
      typeof navigator !== "undefined" &&
      isCrawlerUserAgent(navigator.userAgent)
    ) {
      return;
    }
    if (tryRecoverFromChunkLoadError()) {
      return;
    }
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
