import * as Sentry from "@sentry/nextjs";
import {
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (tryRecoverFromChunkLoadError()) {
      return;
    }
    console.warn(
      context || "Stale chunk load after deploy:",
      error?.message || error,
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
