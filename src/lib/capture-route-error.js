import * as Sentry from "@sentry/nextjs";
import { isChunkLoadError } from "@/lib/chunk-load-error";
import { tryReloadForStaleChunk } from "@/lib/reload-on-stale-chunk";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    if (tryReloadForStaleChunk()) return;
  }

  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  Sentry.captureException(error);
}
