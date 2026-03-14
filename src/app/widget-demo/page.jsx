"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";

const PageWrap = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
`;

const Subtitle = styled.p`
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 14px;
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
 * Inner content that uses useSearchParams - must be wrapped in Suspense
 * so Next.js can prerender the route and avoid blocking.
 */
function WidgetDemoContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get("key");
  const apiBase = searchParams.get("base") || "";

  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;
    const scriptUrl = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    if (!scriptUrl) return;
    const existing = document.getElementById("ce-widget-script");
    if (existing) return;

    const cssUrl = scriptUrl.replace(/\.js$/i, ".css");
    const linkId = "ce-widget-styles";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = cssUrl;
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.id = "ce-widget-script";
    script.src = scriptUrl;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
      document.getElementById(linkId)?.remove();
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <ErrorWrap>
        <p>Missing <code>key</code> query parameter (widget API key).</p>
        <p>Use: /widget-demo?key=YOUR_WIDGET_API_KEY</p>
      </ErrorWrap>
    );
  }

  const fullApiBase = apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";

  return (
    <PageWrap>
      <div
        id="classeasily-booking-widget"
        data-widget-api-key={apiKey}
        {...(fullApiBase ? { "data-api-base": fullApiBase } : {})}
      />
    </PageWrap>
  );
}

/**
 * Standalone page for widget preview.
 * Query: key=widget_api_key (required). Optional: base=API_BASE_URL
 * Loads the widget script and mounts it in the div with data-widget-api-key.
 */
export default function WidgetDemoPage() {
  return (
    <Suspense fallback={<FallbackWrap>Loading…</FallbackWrap>}>
      <WidgetDemoContent />
    </Suspense>
  );
}
