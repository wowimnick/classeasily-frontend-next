import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  reloadPageOnceForChunkError,
  shouldSuppressChunkLoadReport,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (reloadPageOnceForChunkError()) return;
    if (
      shouldSuppressChunkLoadReport(
        error,
        typeof navigator !== "undefined" ? navigator.userAgent : "",
      )
    ) {
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
