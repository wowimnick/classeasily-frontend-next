"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";

const LAYOUTS = [
  { id: "inline", label: "Inline", description: "Widget embedded in the page" },
  { id: "modal", label: "Modal", description: "Button opens booking in a modal" },
  { id: "floating", label: "Floating button", description: "Fixed button opens booking" },
];

const PageWrap = styled.div`
  min-height: 100vh;
  background: #fafafa;
  font-family: system-ui, -apple-system, sans-serif;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
`;

const HeaderInner = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
`;

const Logo = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: #4b5563;
  & > span:hover {
    color: #111827;
  }
`;

const Main = styled.main`
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  @media (min-width: 640px) {
    padding: 2.5rem 1.5rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  &:hover {
    color: #374151;
  }
`;

const Banner = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  font-size: 0.875rem;
  color: #92400e;
`;

const LayoutSwitcher = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const LayoutTab = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? "#111827" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#111827" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #111827;
    background: ${(p) => (p.$active ? "#111827" : "#f9fafb")};
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 2rem;
  @media (min-width: 992px) {
    grid-template-columns: 1fr 380px;
  }
`;

const ContentCol = styled.div``;

const ImagePlaceholder = styled.div`
  height: 280px;
  overflow: hidden;
  border-radius: 1rem;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.875rem;
`;

const Title = styled.h1`
  margin-top: 1.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #111827;
  @media (min-width: 640px) {
    font-size: 1.875rem;
  }
`;

const Lead = styled.p`
  margin-top: 0.5rem;
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.5;
`;

const Meta = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const Section = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const SectionText = styled.p`
  margin-top: 0.5rem;
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.6;
`;

const Sidebar = styled.div`
  @media (min-width: 992px) {
    position: sticky;
    top: 6rem;
    align-self: start;
  }
`;

const Card = styled.div`
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
`;

const CardPrice = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
`;

const WidgetMount = styled.div`
  min-height: 60px;
  display: ${(p) => (p.$hide ? "none" : "block")};
`;

const FloatingMount = styled.div`
  display: ${(p) => (p.$hide ? "none" : "block")};
  min-height: 0;
  pointer-events: none;
  & > * {
    pointer-events: auto;
  }
`;

const NoKeyWrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: system-ui, -apple-system, sans-serif;
`;

const NoKeyCard = styled.div`
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 2rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const NoKeyTitle = styled.p`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #1f2937;
`;

const NoKeyHint = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const FallbackWrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  color: #6b7280;
`;

/**
 * Mock experience page with switchable widget layouts (inline, modal, floating).
 * All three widget mounts are in the DOM on load so the widget script mounts and
 * preloads each; we show/hide by layout so switching is instant.
 */
function MockPageContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get("key") || "demo";
  const apiBase = searchParams.get("base") || "";
  const layoutParam = searchParams.get("layout");
  const initialLayout = LAYOUTS.some((l) => l.id === layoutParam) ? layoutParam : "inline";
  const [layout, setLayout] = useState(initialLayout);

  useEffect(() => {
    if (layoutParam && LAYOUTS.some((l) => l.id === layoutParam)) setLayout(layoutParam);
  }, [layoutParam]);

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

  const fullApiBase =
    apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";

  const widgetProps = {
    "data-widget-api-key": apiKey,
    ...(fullApiBase ? { "data-api-base": fullApiBase } : {}),
  };

  return (
    <PageWrap>
      <Header>
        <HeaderInner>
          <Logo>Adventure Co.</Logo>
          <Nav>
            <span>Experiences</span>
            <span>About</span>
            <span>Contact</span>
          </Nav>
        </HeaderInner>
      </Header>

      <Main>
        <BackLink
          href={`/widget-demo?key=${encodeURIComponent(apiKey)}${fullApiBase ? `&base=${encodeURIComponent(fullApiBase)}` : ""}`}
        >
          ← Back to simple preview
        </BackLink>

        <Banner>
          <strong>Experience page demo.</strong> Switch layouts below to see how your booking widget
          appears as inline, in a modal, or as a floating button. All three are preloaded.
        </Banner>

        <LayoutSwitcher>
          {LAYOUTS.map((opt) => (
            <LayoutTab
              key={opt.id}
              type="button"
              $active={layout === opt.id}
              onClick={() => setLayout(opt.id)}
              title={opt.description}
            >
              {opt.label}
            </LayoutTab>
          ))}
        </LayoutSwitcher>

        <Grid>
          <ContentCol>
            <ImagePlaceholder>Experience image</ImagePlaceholder>
            <Title>Sunset Paddleboard Tour</Title>
            <Lead>
              Join us for a relaxing paddleboard session as the sun sets over the water. Perfect for
              beginners and families. All equipment provided — just bring yourself and a sense of
              adventure.
            </Lead>
            <Meta>
              <span>2.5 hours</span>
              <span>•</span>
              <span>From $45 per person</span>
              <span>•</span>
              <span>Max 8 guests</span>
            </Meta>
            <Section>
              <SectionTitle>What to expect</SectionTitle>
              <SectionText>
                Your host will meet you at the dock and get you set up with boards and life jackets.
                After a short safety briefing, you&apos;ll head out on the water. No experience
                necessary — we&apos;ll show you the basics and keep the pace relaxed so you can enjoy
                the views and the company.
              </SectionText>
            </Section>
            <Section>
              <SectionTitle>Good to know</SectionTitle>
              <SectionText>
                Cancellations up to 24 hours before the start time receive a full refund. We run in
                most weather; if we need to reschedule for safety we&apos;ll get in touch the day
                before.
              </SectionText>
            </Section>
          </ContentCol>

          <Sidebar>
            <Card>
              <CardPrice>From $45 / person</CardPrice>
              <WidgetMount $hide={layout !== "inline"}>
                <div id="ce-widget-mount-inline" {...widgetProps} data-demo-view="inline" />
              </WidgetMount>
              <WidgetMount $hide={layout !== "modal"}>
                <div id="ce-widget-mount-modal" {...widgetProps} data-demo-view="modal" />
              </WidgetMount>
            </Card>
          </Sidebar>
        </Grid>

        <FloatingMount $hide={layout !== "floating"}>
          <div id="ce-widget-mount-floating" {...widgetProps} data-demo-view="floating" />
        </FloatingMount>
      </Main>
    </PageWrap>
  );
}

export default function WidgetDemoMockPage() {
  return (
    <Suspense fallback={<FallbackWrap>Loading…</FallbackWrap>}>
      <MockPageContent />
    </Suspense>
  );
}
