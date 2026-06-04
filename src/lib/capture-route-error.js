import * as Sentry from "@sentry/nextjs";
import { tryRecoverFromChunkLoadError } from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (tryRecoverFromChunkLoadError(error)) {
    return;
  }
  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
