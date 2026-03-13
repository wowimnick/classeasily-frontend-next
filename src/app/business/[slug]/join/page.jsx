"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";

const PageWrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  padding: 24px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  &:hover { color: #111; }
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #111;
`;

const ErrorWrap = styled.div`
  padding: 24px;
  color: #b91c1c;
`;

const WidgetWrap = styled.div`
  flex: 1;
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
`;

function JoinPageContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params?.slug;
  const apiKey = searchParams.get("key");
  const apiBase = searchParams.get("base") || "";

  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;
    const scriptUrl = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    if (!scriptUrl) return;
    const existing = document.getElementById("ce-widget-script");
    if (existing) return;

    const cssUrl = scriptUrl.replace(/\.js$/i, ".css");
    const linkId = "ce-widget-join-styles";
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
        <p>Missing widget key. Please use the &quot;Join&quot; button on the business page.</p>
        {slug && <BackLink href={`/business/${slug}`}>← Back to business</BackLink>}
      </ErrorWrap>
    );
  }

  const fullApiBase = apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";

  return (
    <PageWrap>
      {slug && (
        <BackLink href={`/business/${slug}`}>← Back to business</BackLink>
      )}
      <Title>Join membership</Title>
      <p style={{ margin: "0 0 24px 0", color: "#6b7280", fontSize: 14 }}>
        Complete the form below to subscribe.
      </p>
      <WidgetWrap>
        <div
          id="classeasily-booking-widget"
          data-widget-api-key={apiKey}
          {...(fullApiBase ? { "data-api-base": fullApiBase } : {})}
        />
      </WidgetWrap>
    </PageWrap>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<PageWrap>Loading…</PageWrap>}>
      <JoinPageContent />
    </Suspense>
  );
}
