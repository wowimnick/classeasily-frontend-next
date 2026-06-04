import * as Sentry from "@sentry/nextjs";
import {
  handleClientChunkLoadFailure,
  isChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error) && handleClientChunkLoadFailure()) {
    return;
  }
  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
