"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";

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
  margin-bottom: 2rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  font-size: 0.875rem;
  color: #92400e;
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
  background: #e5e7eb;
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
 * Mock "experience page" – simulates how the widget looks on a real site.
 * Uses same key/base params; loads widget script and mounts in a realistic layout.
 */
function MockPageContent() {
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

  const fullApiBase =
    apiBase || (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";

  if (!apiKey) {
    return (
      <NoKeyWrap>
        <NoKeyCard>
          <NoKeyTitle>Missing widget API key</NoKeyTitle>
          <NoKeyHint>Use: /widget-demo/mock?key=YOUR_WIDGET_API_KEY</NoKeyHint>
        </NoKeyCard>
      </NoKeyWrap>
    );
  }

  return (
    <PageWrap>
      <Header>
        <HeaderInner>
          <Logo>Your Business</Logo>
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
          <strong>Mock page.</strong> This simulates how your widget will look on a real experience
          page. Content below is sample only.
        </Banner>

        <Grid>
          <ContentCol>
            <ImagePlaceholder>Experience image</ImagePlaceholder>
            <Title>Sunset Paddleboard Tour</Title>
            <Lead>
              Join us for a relaxing paddleboard session as the sun sets over the water. Perfect for
              beginners and families. All equipment provided.
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
                necessary — we&apos;ll show you the basics and keep the pace relaxed.
              </SectionText>
            </Section>
          </ContentCol>

          <Sidebar>
            <Card>
              <CardPrice>From $45 / person</CardPrice>
              <div
                id="classeasily-booking-widget"
                data-widget-api-key={apiKey}
                {...(fullApiBase ? { "data-api-base": fullApiBase } : {})}
              />
            </Card>
          </Sidebar>
        </Grid>
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
