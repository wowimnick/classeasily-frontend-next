import * as Sentry from "@sentry/nextjs";
import {
  attemptChunkLoadRecovery,
  isChunkLoadError,
} from "@/lib/chunk-load-recovery";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (attemptChunkLoadRecovery()) {
      return;
    }
    console.warn(
      context ? `${context} stale chunk (reload already attempted)` : "Stale chunk load",
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
