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
 * Production-style demo: one loader script (creates widget iframe) and a button
 * that calls openClasseasilyBooking(). Matches how businesses embed on Wix, WordPress, etc.
 */
function WidgetDemoContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get("key");
  const apiBase = searchParams.get("base") || "";
  const scriptUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL : "";
  const fullApiBase = apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";
  const loaderUrl = scriptUrl ? scriptUrl.replace(/\/widget\.js$/i, "/loader.js") : "";

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
      {/* Same as production: one loader script; it creates the widget iframe and exposes openClasseasilyBooking(). */}
      {loaderUrl && (
        <Script
          id="ce-loader"
          src={loaderUrl}
          strategy="afterInteractive"
          data-api-key={apiKey}
          data-api-base={fullApiBase}
        />
      )}
      <p style={{ marginTop: 24, marginBottom: 8, fontSize: 14, color: "#6b7280" }}>
        Your button — opens the booking modal (calls <code>openClasseasilyBooking()</code>):
      </p>
      <button
        type="button"
        onClick={() => typeof window !== "undefined" && window.openClasseasilyBooking?.()}
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
 * Widget demo: loader + openClasseasilyBooking(), same as production embed. Query: key (required), base (optional).
 */
export default function WidgetDemoPage() {
  return (
    <Suspense fallback={<FallbackWrap>Loading…</FallbackWrap>}>
      <WidgetDemoContent />
    </Suspense>
  );
}
