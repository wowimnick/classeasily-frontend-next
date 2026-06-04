import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
  tryRecoverChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    tryRecoverChunkLoadError(error);
    if (
      shouldDropChunkLoadSentryEvent(
        { exception: { values: [{ value: error?.message }] } },
        { originalException: error },
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
