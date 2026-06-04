import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { getBaseSentryOptions } from "./sentry.shared.config";
import {
  handleChunkLoadError,
  isChunkLoadError,
} from "./src/lib/chunk-load-error.js";

function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const onFailure = (value) => {
    if (isChunkLoadError(value)) {
      handleChunkLoadError(value);
    }
  };

  window.addEventListener("error", (event) => {
    onFailure(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onFailure(event.reason);
  });
}

installChunkLoadRecovery();

const sentryOptions = getBaseSentryOptions();
if (sentryOptions) {
  Sentry.init({
    ...sentryOptions,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
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
