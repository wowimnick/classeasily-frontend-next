import * as Sentry from "@sentry/nextjs";
import { shouldDropChunkLoadSentryEvent } from "@/lib/chunk-load-errors";
import {
  hasAttemptedChunkReload,
  tryRecoverFromChunkLoadError,
} from "@/lib/chunk-load-recovery";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (tryRecoverFromChunkLoadError(error)) {
    return;
  }

  if (
    shouldDropChunkLoadSentryEvent(error, {
      reloadAttempted: hasAttemptedChunkReload(),
    })
  ) {
    if (context) {
      console.warn(context, error);
    }
    return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
