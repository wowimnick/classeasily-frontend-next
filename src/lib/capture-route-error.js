import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  isLikelyCrawlerClient,
  shouldReportChunkLoadErrorToSentry,
  tryRecoverFromChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (isLikelyCrawlerClient()) {
      if (context) console.warn(context, error);
      return;
    }
    if (tryRecoverFromChunkLoadError()) return;
    if (!shouldReportChunkLoadErrorToSentry()) return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
