import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 * Stale JS chunks after deploy trigger a one-time reload instead of Sentry noise.
 */
export function captureRouteError(error, context) {
  if (tryRecoverFromChunkLoadError(error)) {
    return;
  }

  if (isChunkLoadError(error)) {
    if (context) {
      console.warn(context, error);
    } else {
      console.warn(error);
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
