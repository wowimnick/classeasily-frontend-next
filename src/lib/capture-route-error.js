import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "@/lib/sentry-filters";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }

  if (isChunkLoadError(error) && tryRecoverFromChunkLoadError(error)) {
    return;
  }

  Sentry.captureException(error);
}
