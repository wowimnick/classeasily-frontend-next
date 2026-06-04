import * as Sentry from "@sentry/nextjs";
import {
  attemptDeploymentChunkRecovery,
  isDeploymentChunkLoadError,
} from "@/lib/deployment-chunk-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isDeploymentChunkLoadError(error)) {
    attemptDeploymentChunkRecovery();
    return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
