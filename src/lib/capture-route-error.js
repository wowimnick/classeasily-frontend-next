import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error) && tryRecoverFromChunkLoadError()) {
    return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }

  if (isChunkLoadError(error)) {
    return;
  }

  Sentry.captureException(error);
}
