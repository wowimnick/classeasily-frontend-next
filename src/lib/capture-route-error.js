import * as Sentry from "@sentry/nextjs";
import { handleChunkLoadError, isChunkLoadError } from "@/lib/chunk-load-error";

/**
 * Log and report App Router segment errors to Sentry.
 */
export function captureRouteError(error, context) {
  if (isChunkLoadError(error)) {
    const { handled, reloaded } = handleChunkLoadError(error);
    if (handled && !reloaded) {
      console.warn(context || "Chunk load error (bot or already retried):", error);
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
