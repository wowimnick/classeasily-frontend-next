import * as Sentry from "@sentry/nextjs";
import {
  attemptChunkLoadRecovery,
  isChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 * Stale JS chunks after deploy trigger a one-time reload instead of Sentry noise.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (context) {
      console.warn(context, error);
    }
    attemptChunkLoadRecovery();
    return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
