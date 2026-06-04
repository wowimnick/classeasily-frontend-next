import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { getBaseSentryOptions } from "./sentry.shared.config";
import {
  attemptChunkLoadRecovery,
  isChunkLoadError,
  shouldSuppressChunkLoadError,
} from "./src/lib/chunk-load-error.js";

function handleChunkLoadFailure(error) {
  if (!isChunkLoadError(error)) return;
  attemptChunkLoadRecovery();
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    handleChunkLoadFailure(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    handleChunkLoadFailure(event.reason);
  });
}

const sentryOptions = getBaseSentryOptions();
if (sentryOptions) {
  Sentry.init({
    ...sentryOptions,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    beforeSend(event, hint) {
      if (shouldSuppressChunkLoadError(event, hint?.originalException)) {
        return null;
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Only initialize PostHog on production domain
if (
  typeof window !== "undefined" &&
  (window.location.hostname === "classeasily.com" ||
    window.location.hostname === "www.classeasily.com")
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2025-11-30",
    capture_exceptions: false,
    debug: process.env.NODE_ENV === "development",
    session_recording: {
      maskTextSelector: ".user-email, .phone-number, .student-name",
      blockSelector: ".payment-details, .private-messages",
    },
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.js is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
