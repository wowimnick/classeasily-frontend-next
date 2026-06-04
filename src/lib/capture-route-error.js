import * as Sentry from "@sentry/nextjs";
import { handleChunkLoadError } from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 * Stale chunk failures trigger a one-time reload instead of Sentry noise.
 */
export function captureRouteError(error, context) {
  if (handleChunkLoadError(error)) {
    return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
