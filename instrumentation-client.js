import posthog from "posthog-js";

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
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    // Add session recording config with data masking
    session_recording: {
      maskTextSelector: ".user-email, .phone-number, .student-name",
      blockSelector: ".payment-details, .private-messages",
    },
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.js is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
