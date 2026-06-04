import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  isLikelyBot,
  tryRecoverFromChunkLoadError,
} from "@/lib/sentry-chunk-errors";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (isLikelyBot()) {
      if (context) console.warn(context, error);
      else console.warn(error);
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
