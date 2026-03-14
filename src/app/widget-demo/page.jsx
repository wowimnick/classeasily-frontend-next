"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import styled from "styled-components";

const PageWrap = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
`;

const FallbackWrap = styled.div`
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const ErrorWrap = styled.div`
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
`;

/**
 * Same structure as a business page: one hidden widget block + script, and a button
 * that calls ClasseasilyWidget.open(). Demo data (key, base) comes from URL only.
 */
function WidgetDemoContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get("key");
  const apiBase = searchParams.get("base") || "";
  const scriptUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL : "";
  const fullApiBase = apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";

  if (!apiKey) {
    return (
      <ErrorWrap>
        <p>Missing <code>key</code> query parameter (widget API key).</p>
        <p>Use: /widget-demo?key=YOUR_WIDGET_API_KEY</p>
      </ErrorWrap>
    );
  }

  return (
    <PageWrap>
      {/* Same as business page: hidden widget div + script (widget injects CSS). */}
      <div
        id="classeasily-booking-widget"
        data-widget-api-key={apiKey}
        {...(fullApiBase ? { "data-api-base": fullApiBase } : {})}
        style={{ display: "none" }}
      />
      {scriptUrl && <Script src={scriptUrl} strategy="afterInteractive" />}
      {/* Business adds their own button; same pattern. */}
      <p style={{ marginTop: 24, marginBottom: 8, fontSize: 14, color: "#6b7280" }}>
        Your button — opens the booking modal when widget is in Popup mode:
      </p>
      <button
        type="button"
        onClick={() => typeof window !== "undefined" && window.ClasseasilyWidget?.open?.()}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
          color: "#fff",
          background: "#222",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Book now
      </button>
    </PageWrap>
  );
}

/**
 * Widget demo: same embed structure as a business page. Query: key (required), base (optional).
 */
export default function WidgetDemoPage() {
  return (
    <Suspense fallback={<FallbackWrap>Loading…</FallbackWrap>}>
      <WidgetDemoContent />
    </Suspense>
  );
}
