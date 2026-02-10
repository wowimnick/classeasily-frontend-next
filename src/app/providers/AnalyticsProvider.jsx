"use client";

// Google Analytics/GTM removed; analytics via Vercel + PostHog only.
// Passthrough to avoid changing provider tree.
export default function AnalyticsProvider({ children }) {
  return <>{children}</>;
}
