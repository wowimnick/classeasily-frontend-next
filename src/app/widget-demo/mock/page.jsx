"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styled, { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
`;

const LAYOUTS = [
  { id: "inline", label: "Inline", description: "Widget embedded in the page" },
  { id: "modal", label: "Modal", description: "Button opens booking in a modal" },
  { id: "floating", label: "Floating button", description: "Fixed button opens booking" },
  { id: "trigger", label: "Custom button", description: "Your own button opens the widget" },
];

/* ── Tokens ── */
const C = {
  sand:    "#f5f0e8",
  cream:   "#fdfaf5",
  stone:   "#e8e0d0",
  bark:    "#c4a882",
  amber:   "#b07d3e",
  earth:   "#7a5c35",
  ink:     "#1e1a14",
  charcoal:"#3d352a",
  mist:    "#8a7f72",
  fog:     "#b5ad9e",
  white:   "#ffffff",
  accent:  "#d4763b",
};

/* ── Layout ── */
const PageWrap = styled.div`
  min-height: 100vh;
  background: ${C.cream};
  font-family: 'DM Sans', system-ui, sans-serif;
  color: ${C.ink};
`;

/* ── Header ── */
const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  background: ${C.cream};
  border-bottom: 1px solid ${C.stone};
`;

const HeaderInner = styled.div`
  max-width: 75rem;
  margin: 0 auto;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  @media (min-width: 640px) { padding: 0 2rem; }
`;

const Logo = styled.span`
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${C.ink};
`;

const LogoAccent = styled.span`
  color: ${C.accent};
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${C.mist};
  & > span {
    cursor: pointer;
    transition: color 0.15s;
    &:hover { color: ${C.ink}; }
  }
`;

const HeaderCTA = styled.button`
  display: none;
  @media (min-width: 640px) { display: block; }
  padding: 0.5rem 1.25rem;
  border-radius: 2rem;
  border: 1.5px solid ${C.ink};
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: ${C.ink};
  cursor: pointer;
  transition: all 0.18s;
  &:hover {
    background: ${C.ink};
    color: ${C.white};
  }
`;

/* ── Main ── */
const Main = styled.main`
  max-width: 75rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  @media (min-width: 640px) { padding: 2.5rem 2rem 5rem; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 2rem;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: ${C.mist};
  text-decoration: none;
  transition: color 0.15s;
  &:hover { color: ${C.charcoal}; }
`;

const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0.875rem 1.125rem;
  border-radius: 10px;
  border: 1px solid ${C.bark}44;
  background: ${C.sand};
  font-size: 0.8125rem;
  color: ${C.earth};
  line-height: 1.5;
`;

const BannerDot = styled.span`
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${C.accent};
  margin-top: 5px;
`;

/* ── Layout Switcher ── */
const SwitcherRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const SwitcherLabel = styled.span`
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${C.fog};
  margin-right: 0.25rem;
`;

const LayoutTab = styled.button`
  padding: 0.4rem 0.875rem;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$active ? C.ink : C.stone)};
  background: ${(p) => (p.$active ? C.ink : "transparent")};
  color: ${(p) => (p.$active ? C.white : C.charcoal)};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: ${C.ink};
    background: ${(p) => (p.$active ? C.ink : C.sand)};
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${C.stone};
  margin: ${(p) => p.$my || "1.5rem"} 0;
`;

/* ── Content Grid ── */
const Grid = styled.div`
  display: grid;
  gap: 2.5rem;
  @media (min-width: 1020px) {
    grid-template-columns: ${(p) => (p.$inlineFullWidth ? "1fr" : "1fr 360px")};
    gap: 3.5rem;
  }
`;

const ContentCol = styled.div``;

/* ── Hero Image ── */
const HeroImage = styled.div`
  position: relative;
  height: 320px;
  border-radius: 1.25rem;
  overflow: hidden;
  background: linear-gradient(160deg, #c8b89a 0%, #9e8060 40%, #6b5040 100%);
  @media (min-width: 640px) { height: 400px; }
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(20,14,8,0.5) 0%, transparent 55%);
`;

const HeroTags = styled.div`
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  display: flex;
  gap: 0.5rem;
`;

const Tag = styled.span`
  padding: 0.3rem 0.75rem;
  border-radius: 2rem;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.25);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: ${C.white};
`;

const HeroImageLabel = styled.div`
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-style: italic;
  color: rgba(255,255,255,0.82);
`;

/* ── Title & Meta ── */
const Category = styled.p`
  margin-top: 1.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${C.accent};
`;

const Title = styled.h1`
  margin-top: 0.375rem;
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: ${C.ink};
  @media (min-width: 640px) { font-size: 2.375rem; }
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.875rem;
`;

const Stars = styled.span`
  display: flex;
  gap: 2px;
  color: ${C.amber};
  font-size: 0.875rem;
`;

const RatingText = styled.span`
  font-size: 0.875rem;
  color: ${C.mist};
`;

const Lead = styled.p`
  margin-top: 1rem;
  color: ${C.charcoal};
  font-size: 1rem;
  line-height: 1.7;
  font-weight: 300;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const MetaItem = styled.div`
  padding: 0.875rem;
  border-radius: 10px;
  border: 1px solid ${C.stone};
  background: ${C.sand};
`;

const MetaLabel = styled.p`
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${C.fog};
  margin-bottom: 0.25rem;
`;

const MetaValue = styled.p`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${C.ink};
`;

/* ── Sections ── */
const Section = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${C.ink};
  margin-bottom: 0.75rem;
`;

const SectionText = styled.p`
  color: ${C.charcoal};
  font-size: 0.9375rem;
  line-height: 1.75;
  font-weight: 300;
`;

const IncludesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
  @media (min-width: 400px) { grid-template-columns: 1fr 1fr; }
`;

const IncludesItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${C.charcoal};
  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${C.bark};
    flex-shrink: 0;
  }
`;

const HostRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 10px;
  border: 1px solid ${C.stone};
  background: ${C.sand};
`;

const HostAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${C.bark} 0%, ${C.amber} 100%);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 1.125rem;
  color: ${C.white};
`;

const HostInfo = styled.div``;

const HostName = styled.p`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${C.ink};
`;

const HostSub = styled.p`
  font-size: 0.8125rem;
  color: ${C.mist};
  margin-top: 1px;
`;

const VerifiedBadge = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: ${C.earth};
  background: ${C.stone};
  padding: 0.25rem 0.625rem;
  border-radius: 2rem;
`;

/* ── Sidebar / Booking card ── */
const Sidebar = styled.div`
  width: ${(p) => (p.$fullWidth ? "100%" : "auto")};
  @media (min-width: 1020px) {
    position: ${(p) => (p.$fullWidth ? "static" : "sticky")};
    top: 5.5rem;
    align-self: start;
  }
`;

const BookingCard = styled.div`
  border-radius: 1rem;
  border: 1px solid ${C.stone};
  background: ${C.white};
  box-shadow: 0 4px 24px rgba(30,20,10,0.07), 0 1px 2px rgba(30,20,10,0.04);
  overflow: hidden;
`;

const BookingCardTop = styled.div`
  padding: 1.375rem 1.375rem 0;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
`;

const Price = styled.span`
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 700;
  color: ${C.ink};
`;

const PriceSub = styled.span`
  font-size: 0.875rem;
  color: ${C.mist};
`;

const WidgetMount = styled.div`
  min-height: 60px;
  display: ${(p) => (p.$hide ? "none" : "block")};
`;

const FloatingMount = styled.div`
  display: ${(p) => (p.$hide ? "none" : "block")};
  min-height: 0;
  pointer-events: none;
  & > * { pointer-events: auto; }
`;

const TriggerMount = styled.div`
  display: ${(p) => (p.$hide ? "none" : "block")};
  min-height: 0;
`;

const TriggerDemoButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border-radius: 2rem;
  border: none;
  background: ${C.ink};
  color: ${C.white};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transition: all 0.18s;
  &:hover {
    background: ${C.charcoal};
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
`;

const NoKeyWrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: ${C.cream};
`;

const NoKeyCard = styled.div`
  border-radius: 12px;
  border: 1px solid ${C.stone};
  background: ${C.white};
  padding: 2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
`;

const FallbackWrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: ${C.mist};
  background: ${C.cream};
`;

/* ─────────────────────────────────────────── */

function MockPageContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get("key") || "demo";
  const apiBase = searchParams.get("base") || "";
  const layoutParam = searchParams.get("layout");
  const initialLayout = LAYOUTS.some((l) => l.id === layoutParam) ? layoutParam : "inline";
  const [layout, setLayout] = useState(initialLayout);
  const [inlineWidthMode, setInlineWidthMode] = useState("sidebar");

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
    <>
      <GlobalStyles />
      <PageWrap>
        <Header>
          <HeaderInner>
            <Logo>Solara<LogoAccent>.</LogoAccent></Logo>
            <Nav>
              <span>Experiences</span>
              <span>Locations</span>
              <span>About</span>
            </Nav>
            <div />
          </HeaderInner>
        </Header>

        <Main>
          <BackLink
            href={`/widget-demo?key=${encodeURIComponent(apiKey)}${fullApiBase ? `&base=${encodeURIComponent(fullApiBase)}` : ""}`}
          >
            ← All experiences
          </BackLink>

          <Banner>
            <BannerDot />
            <span>
              <strong>Widget layout preview.</strong> Toggle the layouts below to preview your booking
              widget as inline, modal, or floating. All three are preloaded for instant switching.
            </span>
          </Banner>

          <SwitcherRow>
            <SwitcherLabel>Widget layout:</SwitcherLabel>
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
          </SwitcherRow>

          {layout === "inline" && (
            <SwitcherRow>
              <SwitcherLabel>Inline width:</SwitcherLabel>
              <LayoutTab
                type="button"
                $active={inlineWidthMode === "sidebar"}
                onClick={() => setInlineWidthMode("sidebar")}
              >
                Sidebar
              </LayoutTab>
              <LayoutTab
                type="button"
                $active={inlineWidthMode === "full"}
                onClick={() => setInlineWidthMode("full")}
              >
                Full width
              </LayoutTab>
            </SwitcherRow>
          )}

          <Divider $my="1.75rem" />

          <Grid $inlineFullWidth={layout === "inline" && inlineWidthMode === "full"}>
            <ContentCol>
              {/* Hero */}
              <HeroImage>
                <HeroOverlay />
              </HeroImage>

              {/* Title */}
              <Category>Sample Experience</Category>
              <Title>Example Experience</Title>

              <RatingRow>
                <Stars>★★★★★</Stars>
                <RatingText>4.9 · 214 reviews</RatingText>
              </RatingRow>

              <Lead>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod lacinia
                facilisis. Phasellus volutpat nisl eu augue tincidunt, vitae dignissim nulla
                venenatis. Proin fringilla felis at neque interdum, non scelerisque libero auctor.
              </Lead>

              <Divider $my="1.5rem" />

              {/* Meta grid */}
              <MetaGrid>
                <MetaItem>
                  <MetaLabel>Duration</MetaLabel>
                  <MetaValue>2.5 hours</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>From</MetaLabel>
                  <MetaValue>$45 / person</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Group size</MetaLabel>
                  <MetaValue>Max 8 guests</MetaValue>
                </MetaItem>
              </MetaGrid>

              <Divider $my="2rem" />

              {/* What to expect */}
              <Section>
                <SectionTitle>What to expect</SectionTitle>
                <SectionText>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur.
                </SectionText>
              </Section>

              <Divider $my="2rem" />

              {/* What's included */}
              <Section style={{ marginTop: 0 }}>
                <SectionTitle>What&apos;s included</SectionTitle>
                <IncludesList>
                  {[
                    "All equipment",
                    "Safety briefing",
                    "Life jackets",
                    "Dry bags",
                    "Guided instruction",
                    "Post-tour refreshments",
                  ].map((item) => (
                    <IncludesItem key={item}>{item}</IncludesItem>
                  ))}
                </IncludesList>
              </Section>

              <Divider $my="2rem" />

              {/* Cancellation */}
              <Section style={{ marginTop: 0 }}>
                <SectionTitle>Cancellation policy</SectionTitle>
                <SectionText>
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit
                  voluptatem accusantium doloremque laudantium totam rem aperiam.
                </SectionText>
              </Section>

              <Divider $my="2rem" />

              {/* Host */}
              <Section style={{ marginTop: 0 }}>
                <SectionTitle>Your host</SectionTitle>
                <HostRow>
                  <HostAvatar>M</HostAvatar>
                  <HostInfo>
                    <HostName>Marco Delgado</HostName>
                    <HostSub>Certified guide · 7 years experience</HostSub>
                  </HostInfo>
                  <VerifiedBadge>✓ Verified</VerifiedBadge>
                </HostRow>
              </Section>
            </ContentCol>

            {/* Sidebar */}
            <Sidebar $fullWidth={layout === "inline" && inlineWidthMode === "full"}>
              <BookingCard>
                <BookingCardTop>
                  <PriceRow>
                    <Price>$45</Price>
                    <PriceSub>per person</PriceSub>
                  </PriceRow>
                  <RatingRow style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
                    <Stars style={{ fontSize: "0.75rem" }}>★★★★★</Stars>
                    <RatingText style={{ fontSize: "0.8125rem" }}>4.9 · 214 reviews</RatingText>
                  </RatingRow>
                  <Divider $my="0" style={{ marginBottom: "1.25rem" }} />
                </BookingCardTop>

                <WidgetMount $hide={layout !== "inline"}>
                  <div id="ce-widget-mount-inline" {...widgetProps} data-demo-view="inline" />
                </WidgetMount>
                <WidgetMount $hide={layout !== "modal"} style={{ marginLeft: "1rem" }}>
                  <div id="ce-widget-mount-modal" {...widgetProps} data-demo-view="modal" />
                </WidgetMount>
                <WidgetMount $hide={layout !== "trigger"} style={{ padding: "1.25rem 1.375rem 1.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.fog, marginBottom: "1rem" }}>
                    Use your own button to open the widget
                  </div>
                  <TriggerDemoButton
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.ClasseasilyWidget?.open) {
                        window.ClasseasilyWidget.open("ce-widget-mount-trigger");
                      }
                    }}
                  >
                    Book now
                  </TriggerDemoButton>
                  <div id="ce-widget-mount-trigger" {...widgetProps} data-demo-view="modal" />
                </WidgetMount>
              </BookingCard>
            </Sidebar>
          </Grid>

          <FloatingMount $hide={layout !== "floating"}>
            <div id="ce-widget-mount-floating" {...widgetProps} data-demo-view="floating" />
          </FloatingMount>
          <TriggerMount $hide={true}>
            {/* trigger widget is mounted inside the BookingCard above; this element is intentionally hidden */}
          </TriggerMount>
        </Main>
      </PageWrap>
    </>
  );
}

export default function WidgetDemoMockPage() {
  return (
    <Suspense fallback={<FallbackWrap>Loading…</FallbackWrap>}>
      <MockPageContent />
    </Suspense>
  );
}