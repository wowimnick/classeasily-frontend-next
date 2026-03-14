"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";

const PageWrap = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 720px;
  margin: 0 auto;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const FallbackWrap = styled.div`
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const ErrorWrap = styled.div`
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const CustomTriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #ff385b;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(255, 56, 91, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
  :hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 56, 91, 0.45);
  }
  :active {
    transform: translateY(0);
  }
`;

const CodeBlock = styled.pre`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 12px 0 0 0;
  color: #374151;
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

  const handleCustomBookClick = () => {
    if (typeof window !== "undefined" && window.ClasseasilyWidget?.openBooking) {
      window.ClasseasilyWidget.openBooking();
    }
  };

  if (!apiKey) {
    return (
      <ErrorWrap>
        <p>Missing <code>key</code> query parameter (widget API key).</p>
        <p>Use: /widget-demo?key=YOUR_WIDGET_API_KEY</p>
      </ErrorWrap>
    );
  }

  const fullApiBase = apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";

  const widgetProps = fullApiBase ? { "data-api-base": fullApiBase } : {};

  return (
    <PageWrap>
      <Section>
        <SectionTitle>Use your own button</SectionTitle>
        <Subtitle>
          On Wix, Squarespace, or any site where the widget runs inside an iframe, you can use your own &quot;Book now&quot; button.
          Add <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>data-ce-booking-trigger</code> to any
          button or link, include the trigger script on your page, and the booking modal will open fullscreen.
        </Subtitle>
        <CustomTriggerButton type="button" onClick={handleCustomBookClick}>
          Book now
        </CustomTriggerButton>
        <Subtitle style={{ marginTop: 16, marginBottom: 0 }}>
          This button calls <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>ClasseasilyWidget.openBooking()</code>.
          The widget below has no visible button (custom trigger mode).
        </Subtitle>
        {/* Custom-trigger widget: no built-in button, opens via API — mount first so openBooking() targets it */}
        <div
          id="classeasily-booking-widget-custom"
          data-widget-api-key={apiKey}
          data-ce-trigger="custom"
          data-demo-view="modal"
          {...widgetProps}
          style={{ minHeight: 1 }}
        />
      </Section>

      <Section>
        <SectionTitle>Default embed</SectionTitle>
        <Subtitle>
          Widget with its own trigger button. Use this when you don&apos;t need a custom button.
        </Subtitle>
        <div id="classeasily-booking-widget" data-widget-api-key={apiKey} {...widgetProps} />
      </Section>

      <Section>
        <SectionTitle>Setup for your own button (e.g. on Wix)</SectionTitle>
        <Subtitle>
          1) Add your widget embed as usual. 2) Add the trigger script to your page (same origin as the widget). 3) Add{" "}
          <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>data-ce-booking-trigger</code> to any
          button or link. When clicked, the iframe goes fullscreen and the booking modal opens.
        </Subtitle>
        <CodeBlock>{`<!-- After your widget embed, add: -->
<script src="https://YOUR-WIDGET-ORIGIN/trigger.js"><\/script>

<!-- Then any button/link with this attribute opens the booking modal: -->
<button data-ce-booking-trigger>Book now</button>`}</CodeBlock>
      </Section>
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
