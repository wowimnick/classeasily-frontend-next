import * as Sentry from "@sentry/nextjs";
import { shouldCaptureException } from "./sentry-error-filters";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  if (shouldCaptureException(error)) {
    Sentry.captureException(error);
  }
}
