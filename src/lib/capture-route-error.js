import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  recoverFromChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (recoverFromChunkLoadError()) {
      return;
    }
    console.warn(
      context ? `${context} chunk load failed after reload` : "Chunk load failed after reload",
      error,
    );
    return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
