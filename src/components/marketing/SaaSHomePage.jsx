"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styled, { ThemeProvider, css } from "styled-components";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CreditCard,
  Globe,
  LayoutGrid,
  Puzzle,
  ShieldCheck,
  Smartphone,
  Users,
  Code2,
  MousePointerClick,
  LineChart,
  Palette,
} from "lucide-react";
import { PLANS } from "@/lib/subscriptionPlans";
import {
  marketingTheme as t,
  REGISTER_HREF,
  PRICING_HREF,
  SUPPORT_EMAIL,
} from "./tokens";
import { ButtonLink } from "./primitives";
import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";
import LiveWeekChart from "./LiveWeekChart";
import {
  GlowRoot,
  Magnetic,
  TiltFollow,
  usePointerFxEnabled,
  usePointerVars,
} from "./pointerFx";

const pointerGlow = css`
  --mx: 50%;
  --my: 0%;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  &::after {
    content: "";
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      200px circle at var(--mx) var(--my),
      rgba(252, 64, 86, 0.16),
      transparent 58%
    );
    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: 0;
  }
  &:hover::after {
    opacity: 1;
  }
  > * {
    position: relative;
    z-index: 1;
  }
  @media (prefers-reduced-motion: reduce), (pointer: coarse) {
    &::after {
      display: none;
    }
  }
`;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const Page = styled.div`
  font-family: ${t.fonts.body};
  color: ${t.colors.text};
  background: #fff;
`;

const LandingContainer = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

const LandingSection = styled.section`
  padding: 72px 0;
  background: ${(p) => p.$bg || "transparent"};
  position: relative;

  @media (max-width: 768px) {
    padding: 64px 0;
  }
`;

const PillLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.2s ease;
  ${(p) =>
    p.$variant === "primary"
      ? css`
          background: ${t.colors.primary};
          color: #fff;
          &:hover {
            background: ${t.colors.primaryHover};
            transform: translateY(-1px);
            box-shadow: ${t.shadows.md};
            color: #fff;
          }
        `
      : css`
          background: rgba(10, 37, 64, 0.04);
          color: ${t.colors.dark};
          &:hover {
            background: rgba(10, 37, 64, 0.08);
            color: ${t.colors.dark};
          }
        `}
`;

const GhostLink = styled.a`
  font-weight: 600;
  color: ${t.colors.dark};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover {
    color: ${t.colors.primary};
  }
`;

const Kicker = styled.p`
  color: ${t.colors.primary};
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
`;

const Display = styled.h2`
  font-size: 40px;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: ${t.colors.dark};
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Body = styled.p`
  font-size: 18px;
  color: ${t.colors.text};
  line-height: 1.65;
  margin: 0;
  max-width: ${(p) => p.$max || "none"};
`;

function DiagonalDivider({ fromBg = "#f8fafc", toBg = "#ffffff", flip = false }) {
  return (
    <div
      style={{
        lineHeight: 0,
        background: toBg,
        display: "block",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 1440 52"
        preserveAspectRatio="none"
        width="100%"
        height="52"
        style={{ display: "block", transform: flip ? "scaleX(-1)" : "none" }}
      >
        <path d="M0,0 L1440,0 L0,52 Z" fill={fromBg} />
        <line
          x1="0"
          y1="0"
          x2="1440"
          y2="52"
          stroke="rgba(252,64,86,0.14)"
          strokeWidth="1.7"
        />
      </svg>
    </div>
  );
}

const HeroWrapper = styled.section`
  --mx: 72%;
  --my: 40%;
  padding: 120px 0 88px;
  position: relative;
  overflow: hidden;
  background: #fff;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%230a2540' fill-opacity='0.06'/%3E%3C/svg%3E");
  background-size: 24px 24px;

  @media (max-width: 640px) {
    padding: 100px 0 0;
  }
`;

const HeroSpotlight = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(
      560px circle at var(--mx) var(--my),
      rgba(252, 64, 86, 0.16),
      transparent 56%
    ),
    radial-gradient(
      280px circle at calc(var(--mx) + 90px) calc(var(--my) + 50px),
      rgba(10, 37, 64, 0.08),
      transparent 50%
    );
  opacity: 0;
  transition: opacity 0.35s ease;
  ${HeroWrapper}:hover & {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce), (pointer: coarse) {
    display: none;
  }
`;

const HeroGradientStrip = styled.div`
  position: absolute;
  left: -10%;
  width: 120%;
  height: 150px;
  top: 50%;
  transform: translateY(-50%) rotate(150deg);
  z-index: 0;
  overflow: hidden;
  border-radius: 4px;

  @media (max-width: 640px) {
    display: none;
  }
`;

const HeroGradientCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #f5f5f5;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #ffffff;
  --gradient-color-4: #f5f5f5;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  position: relative;
  z-index: 1;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
`;

const HeroH1 = styled.h1`
  font-size: 50px;
  margin: 0 0 14px;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: ${t.colors.dark};
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 34px;
  }
  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const HeroP = styled.p`
  font-size: 16px;
  margin: 0 0 26px;
  color: ${t.colors.text};
  line-height: 1.65;
  max-width: 500px;

  @media (max-width: 968px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-start;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const MOCK_THEMES = [
  { primary: "#fc4056", fade: "#fff0f3", chrome: "#0A2540" },
  { primary: "#2563EB", fade: "#EFF6FF", chrome: "#1E3A8A" },
  { primary: "#0f766e", fade: "#ecfdf5", chrome: "#134e4a" },
];

const MARCH = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31,
];
const AVAIL = new Set([5, 6, 7, 12, 13, 14, 19, 20, 21, 26, 27, 28]);

function WidgetCalendarMock({ theme }) {
  const [hoverDay, setHoverDay] = useState(14);
  const day = hoverDay;
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(day - 1) % 7];

  return (
    <div
      style={{
        background: theme.fade,
        borderRadius: 20,
        padding: 16,
        boxShadow: t.shadows.lg,
        border: "1px solid rgba(10,37,64,0.06)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            background: theme.chrome,
            color: "#fff",
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#fc4056",
            }}
          />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ffce48",
            }}
          />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ marginLeft: 8, opacity: 0.8 }}>yoursite.com</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 0,
          }}
        >
          <div style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: t.colors.dark,
                marginBottom: 10,
              }}
            >
              March 2026
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                fontSize: 10,
                color: t.colors.textLight,
                marginBottom: 6,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={`${d}-${i}`} style={{ textAlign: "center" }}>
                  {d}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {MARCH.map((d) => {
                const on = AVAIL.has(d);
                const sel = d === day;
                return (
                  <div
                    key={d}
                    onPointerEnter={() => on && setHoverDay(d)}
                    style={{
                      height: 26,
                      borderRadius: 7,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: on ? 700 : 500,
                      cursor: on ? "pointer" : "default",
                      background: sel
                        ? theme.primary
                        : on
                          ? theme.fade
                          : "transparent",
                      color: sel ? "#fff" : on ? t.colors.dark : "#cbd5e1",
                      transform: sel ? "scale(1.08)" : "none",
                      transition: "transform 0.15s ease, background 0.15s ease",
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            style={{
              padding: 16,
              borderLeft: "1px solid #f1f5f9",
              background: "#fafbfc",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.colors.dark,
                marginBottom: 8,
              }}
            >
              {dow}, Mar {day}
            </div>
            {["10:00 AM · 4 left", "2:00 PM · 2 left"].map((slot) => (
              <div
                key={slot}
                style={{
                  fontSize: 12,
                  padding: "8px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  marginBottom: 8,
                  background: "#fff",
                  color: t.colors.dark,
                  fontWeight: 600,
                }}
              >
                {slot}
              </div>
            ))}
            <div
              style={{
                marginTop: 4,
                background: theme.primary,
                color: "#fff",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Reserve · $65
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ThemeDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 18px;
`;

const ThemeDot = styled.button`
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: ${(p) => (p.$active ? t.colors.primary : "#CBD5E1")};
  transform: scale(${(p) => (p.$active ? 1.4 : 1)});
  cursor: pointer;
  transition: all 0.35s ease;
`;

const HeroMobileImageWrap = styled.div`
  width: 100%;
  @media (max-width: 640px) {
    width: 100vw;
    position: relative;
    left: 50%;
    margin-left: -50vw;
  }
`;

function useIsMobile(bp = 640) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    setV(mq.matches);
    const fn = (e) => setV(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [bp]);
  return v;
}

function Hero() {
  const [idx, setIdx] = useState(0);
  const isMobile = useIsMobile(640);
  const fx = usePointerFxEnabled();
  const heroRef = usePointerVars(!fx);

  useEffect(() => {
    const id = "home-hero-gradient-canvas";
    const tmr = setTimeout(() => {
      import("stripe-gradient")
        .then(({ Gradient }) => {
          const canvas = document.getElementById(id);
          if (!canvas?.getContext) return;
          const gradient = new Gradient();
          gradient.initGradient(`#${id}`);
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(tmr);
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setIdx((i) => (i + 1) % MOCK_THEMES.length),
      7000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <HeroWrapper ref={heroRef}>
      <HeroSpotlight />
      <HeroGradientStrip>
        <HeroGradientCanvas id="home-hero-gradient-canvas" data-transition-in />
      </HeroGradientStrip>
      <LandingContainer>
        <HeroGrid>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp}>
              <HeroH1>Take bookings on your site.</HeroH1>
            </motion.div>
            <motion.div variants={fadeUp}>
              <HeroP>
                Booking and CRM software for small businesses. Easy to set up,
                priced for small teams, without the bloat of enterprise tools.
                Embed a widget — customers book without leaving your brand.
              </HeroP>
            </motion.div>
            <motion.div variants={fadeUp}>
              <ButtonGroup>
                <Magnetic>
                  <PillLink href={REGISTER_HREF} $variant="primary">
                    Get started <ArrowRight size={16} />
                  </PillLink>
                </Magnetic>
                <PillLink href={PRICING_HREF} $variant="secondary">
                  See pricing
                </PillLink>
              </ButtonGroup>
            </motion.div>
          </motion.div>
          <div>
            {isMobile ? (
              <HeroMobileImageWrap>
                <Image
                  src="/widgetmobilephone.webp"
                  alt="Booking widget on a phone — pick a date and book in seconds"
                  width={640}
                  height={1280}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  priority
                />
              </HeroMobileImageWrap>
            ) : (
              <>
                <TiltFollow max={8}>
                  <WidgetCalendarMock theme={MOCK_THEMES[idx]} />
                </TiltFollow>
                <ThemeDots>
                  {MOCK_THEMES.map((_, i) => (
                    <ThemeDot
                      key={i}
                      $active={i === idx}
                      aria-label={`Theme ${i + 1}`}
                      onClick={() => setIdx(i)}
                    />
                  ))}
                </ThemeDots>
              </>
            )}
          </div>
        </HeroGrid>
      </LandingContainer>
    </HeroWrapper>
  );
}

const ValuePropsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 568px) {
    grid-template-columns: 1fr;
  }
`;

const VPItem = styled(motion.div)`
  ${pointerGlow}
  padding: 20px 16px;
  border-radius: 16px;
  h3 {
    font-size: 16px;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${t.colors.dark};
  }
  p {
    margin: 0;
    font-size: 15px;
    color: ${t.colors.text};
    line-height: 1.55;
  }
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureStack = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const FeatureRow = styled.div`
  h4 {
    font-size: 16px;
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${t.colors.dark};
  }
  p {
    margin: 0;
    color: ${t.colors.text};
    font-size: 15px;
    line-height: 1.55;
  }
`;

const ListGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 568px) {
    grid-template-columns: 1fr;
  }
`;

const ListColumn = styled(motion.div)`
  h4 {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 10px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
    color: ${t.colors.dark};
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    line-height: 1.4;
    color: ${t.colors.text};
  }
`;

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled(motion.div)`
  ${pointerGlow}
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid ${t.colors.border};
`;

const Audiences = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 36px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const AudienceCard = styled(motion.article)`
  ${pointerGlow}
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid ${t.colors.border};
  h3 {
    margin: 0 0 8px;
    color: ${t.colors.dark};
    font-size: 18px;
  }
  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
  }
`;

const Platforms = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
`;

const PlatformChip = styled.span`
  padding: 8px 14px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid ${t.colors.border};
  font-size: 13px;
  font-weight: 700;
  color: ${t.colors.dark};
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 48px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled(motion.article)`
  ${pointerGlow}
  border-radius: 18px;
  padding: 22px 22px 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: ${(p) =>
    p.$featured
      ? "linear-gradient(170deg, #fff 0%, rgba(255,230,160,0.55) 32%, rgba(255,185,120,0.42) 54%, rgba(155,170,255,0.38) 76%, #fff 100%)"
      : "#fff"};
  border: ${(p) => (p.$featured ? "none" : "1px solid #E4E4E7")};
  box-shadow: ${(p) =>
    p.$featured ? "0 16px 48px rgba(0,0,0,0.13)" : "none"};
`;

const PlanName = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  color: ${t.colors.dark};
`;

const PlanPrice = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: ${t.colors.dark};
  letter-spacing: -0.03em;
  span {
    font-size: 14px;
    font-weight: 600;
    color: ${t.colors.textLight};
  }
`;

const FaqList = styled.div`
  max-width: 720px;
  margin: 40px auto 0;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
`;

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0A2540",
            lineHeight: 1.4,
          }}
        >
          {q}
        </span>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: open ? "#0A2540" : "#F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 16,
              lineHeight: 1,
              color: open ? "#fff" : "#64748B",
              display: "block",
              transform: open ? "rotate(45deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            +
          </span>
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 24px 18px",
            fontSize: 14,
            color: "#425466",
            lineHeight: 1.7,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

const Quotes = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 36px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Quote = styled.blockquote`
  ${pointerGlow}
  margin: 0;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid ${t.colors.border};
  p {
    margin: 0 0 16px;
    color: ${t.colors.dark};
    font-size: 16px;
    line-height: 1.5;
  }
  footer {
    font-size: 13px;
    color: ${t.colors.textLight};
    font-weight: 600;
  }
`;

const FAQ_ITEMS = [
  {
    q: "Do I need a developer to add the widget?",
    a: "No. Copy two lines of code from your dashboard and paste them into any page. It works on Wix, Squarespace, Shopify, WordPress, Webflow, and plain HTML.",
  },
  {
    q: "Can I embed on Wix, Shopify, or Squarespace?",
    a: "Yes. Paste the booking widget on Wix, Shopify, Squarespace, or a custom site. Customers book without leaving your brand.",
  },
  {
    q: "Will it slow down my website?",
    a: "The widget script loads asynchronously so it never blocks your page. It only fully loads when a visitor interacts with the booking button.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. You pick a monthly plan and a small per-booking commission. Stripe’s card processing fees are separate and paid to Stripe.",
  },
  {
    q: "How does the commission work?",
    a: "You pay a flat monthly fee (Basic $29 / Growth $49 / Advanced $89) plus a percentage of each booking. On Growth, a $100 booking is $3.00 in ClassEasily commission. Stripe processing is separate.",
  },
  {
    q: "Do my customers book on my site or on ClassEasily?",
    a: "On your site. The widget lives on your pages. You manage bookings, customers, and payouts from the ClassEasily dashboard.",
  },
  {
    q: "Is the checkout secure?",
    a: "Yes. Payments are processed by Stripe, which is PCI DSS Level 1 certified. Card details never touch our servers.",
  },
  {
    q: "How long does setup take?",
    a: "Create an account, pick a plan, embed the widget — you can take bookings the same day.",
  },
];

const HOW = [
  {
    n: "01",
    icon: Code2,
    title: "Embed the widget",
    body: "Paste one snippet on your site. Match your colors, choose popup or inline.",
  },
  {
    n: "02",
    icon: MousePointerClick,
    title: "Customers book",
    body: "They pick a time and pay on your website. Confirmations go out automatically.",
  },
  {
    n: "03",
    icon: LineChart,
    title: "You run the business",
    body: "Capacity, customers, memberships, and payouts live in one dashboard.",
  },
];

export default function SaaSHomePage() {
  const themeRef = useRef(0);
  const [, bump] = useState(0);
  const cycleTheme = useCallback((i) => {
    themeRef.current = i;
    bump((n) => n + 1);
  }, []);

  return (
    <ThemeProvider theme={t}>
      <Page>
        <MarketingHeader />
        <main>
          <Hero />

          <DiagonalDivider fromBg="#fafbfc" toBg="#fafbfc" />

          <LandingSection $bg="#fafbfc">
            <LandingContainer>
              <ValuePropsGrid
                as={motion.div}
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <GlowRoot as={VPItem} variants={fadeUp}>
                  <h3>
                    <Puzzle size={20} color="#fc4056" /> Booking on your site
                  </h3>
                  <p>
                    Add a booking button or inline calendar to Wix, Shopify,
                    Squarespace, or a custom site. Customers never leave your
                    brand.
                  </p>
                </GlowRoot>
                <GlowRoot as={VPItem} variants={fadeUp}>
                  <h3>
                    <CreditCard size={20} color="#fc4056" /> Apple Pay and cards
                  </h3>
                  <p>
                    Checkout with Apple Pay, Google Pay, or any major card. We
                    handle payments; you get one payout to your bank.
                  </p>
                </GlowRoot>
                <GlowRoot as={VPItem} variants={fadeUp}>
                  <h3>
                    <LayoutGrid size={20} color="#fc4056" /> Your site, your brand
                  </h3>
                  <p>
                    Match colors and fonts. Popup with your own button, or embed
                    inline. Domain whitelist keeps the embed on your site only.
                  </p>
                </GlowRoot>
                <GlowRoot as={VPItem} variants={fadeUp}>
                  <h3>
                    <Users size={20} color="#fc4056" /> Lightweight CRM
                  </h3>
                  <p>
                    Every booker lands in a customer list. See history, follow
                    up, and run memberships without a second tool.
                  </p>
                </GlowRoot>
              </ValuePropsGrid>
            </LandingContainer>
          </LandingSection>

          <DiagonalDivider fromBg="#fafbfc" toBg="#ffffff" flip />

          <LandingSection $bg="#fff">
            <LandingContainer>
              <SplitGrid>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Kicker>Payments guests trust</Kicker>
                  <Display>Frictionless, secure checkout</Display>
                  <Body>
                    Accept Apple Pay, Google Pay, and all major credit cards.
                    Stripe handles security and compliance. You get a unified
                    payout to your bank. Whitelist your domains, embed the
                    snippet, and start taking money the same day.
                  </Body>
                  <div style={{ marginTop: 24 }}>
                    <GhostLink href="/business/help/">
                      View integration docs <ArrowRight size={16} />
                    </GhostLink>
                  </div>
                  <FeatureStack>
                    <FeatureRow>
                      <h4>
                        <CreditCard size={20} color="#fc4056" /> Digital wallets
                      </h4>
                      <p>
                        One-tap checkout with Apple Pay and Google Pay — the
                        flow customers already expect.
                      </p>
                    </FeatureRow>
                    <FeatureRow>
                      <h4>
                        <ShieldCheck size={20} color="#fc4056" /> All major cards
                      </h4>
                      <p>
                        Visa, Mastercard, Amex, and more. One dashboard instead
                        of a second payment stack.
                      </p>
                    </FeatureRow>
                  </FeatureStack>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TiltFollow max={7}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 350,
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src="/methods.jpeg"
                        alt="Accepted payment methods including Apple Pay, Google Pay, and cards"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          borderRadius: 16,
                        }}
                      />
                    </div>
                  </TiltFollow>
                </motion.div>
              </SplitGrid>
            </LandingContainer>
          </LandingSection>

          <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" flip />

          <LandingSection $bg="#fff" id="features">
            <LandingContainer>
              <SplitGrid>
                <div>
                  <TiltFollow max={8}>
                    <WidgetCalendarMock
                      theme={MOCK_THEMES[themeRef.current % MOCK_THEMES.length]}
                    />
                  </TiltFollow>
                  <ThemeDots>
                    {MOCK_THEMES.map((_, i) => (
                      <ThemeDot
                        key={i}
                        $active={i === themeRef.current}
                        onClick={() => cycleTheme(i)}
                      />
                    ))}
                  </ThemeDots>
                </div>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Kicker>Looks like you</Kicker>
                  <Display>Brand it in a few clicks</Display>
                  <Body>
                    Colors, fonts, popup or inline. Pin the widget to one class
                    on Growth and Advanced — useful for landing pages and ads.
                    Preview themes the way your customers will see them.
                  </Body>
                  <FeatureStack>
                    <FeatureRow>
                      <h4>
                        <Palette size={20} color="#fc4056" /> Colors and fonts
                      </h4>
                      <p>
                        Match the widget to your site so it doesn’t look like a
                        third-party checkout.
                      </p>
                    </FeatureRow>
                    <FeatureRow>
                      <h4>
                        <Smartphone size={20} color="#fc4056" /> Popup or inline
                      </h4>
                      <p>
                        Trigger from your own button, or drop a calendar onto a
                        dedicated booking page.
                      </p>
                    </FeatureRow>
                    <FeatureRow>
                      <h4>
                        <Globe size={20} color="#fc4056" /> Domain whitelist
                      </h4>
                      <p>
                        The embed only loads on sites you approve — not on
                        random pages that copy your snippet.
                      </p>
                    </FeatureRow>
                  </FeatureStack>
                  <Platforms>
                    {["Wix", "Shopify", "Squarespace", "WordPress", "Webflow", "Custom"].map(
                      (name) => (
                        <PlatformChip key={name}>{name}</PlatformChip>
                      ),
                    )}
                  </Platforms>
                </motion.div>
              </SplitGrid>
            </LandingContainer>
          </LandingSection>

          <DiagonalDivider fromBg="#ffffff" toBg="#f8fafc" />

          <LandingSection $bg="#f8fafc">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                style={{ marginBottom: 32 }}
              >
                <Kicker>What you get</Kicker>
                <Display>One system for bookings and customers</Display>
                <Body $max="720px">
                  Widget on your site so visitors book there. Dashboard for
                  schedule, payments, memberships, and follow-up. No marketplace
                  listing required.
                </Body>
              </motion.div>
              <ListGrid
                as={motion.div}
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <ListColumn variants={fadeUp}>
                  <h4>Widget</h4>
                  <ul>
                    <li>
                      <Check size={14} color="#fc4056" /> Embed on any site
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Popup or inline
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Brand colors & fonts
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Domain whitelist
                    </li>
                  </ul>
                </ListColumn>
                <ListColumn variants={fadeUp}>
                  <h4>Scheduling</h4>
                  <ul>
                    <li>
                      <Check size={14} color="#fc4056" /> Sessions and capacity
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> One calendar
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Pin a class (Growth+)
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Automated reminders
                    </li>
                  </ul>
                </ListColumn>
                <ListColumn variants={fadeUp}>
                  <h4>Payments</h4>
                  <ul>
                    <li>
                      <Check size={14} color="#fc4056" /> Visa, Mastercard, Amex
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Apple Pay & Google Pay
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Payouts via Stripe Connect
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Promo codes (Growth+)
                    </li>
                  </ul>
                </ListColumn>
                <ListColumn variants={fadeUp}>
                  <h4>CRM</h4>
                  <ul>
                    <li>
                      <Check size={14} color="#fc4056" /> Customer list
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Booking history
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Memberships (Growth+)
                    </li>
                    <li>
                      <Check size={14} color="#fc4056" /> Branded emails (Growth+)
                    </li>
                  </ul>
                </ListColumn>
              </ListGrid>
            </LandingContainer>
          </LandingSection>

          <DiagonalDivider fromBg="#f8fafc" toBg="#ffffff" flip />

          <LandingSection $bg="#fff" id="how-it-works">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                style={{ textAlign: "center" }}
              >
                <Kicker>How it works</Kicker>
                <Display>Live in three steps.</Display>
              </motion.div>
              <Steps>
                {HOW.map((s) => (
                  <GlowRoot
                    as={Step}
                    key={s.n}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: t.colors.primary,
                        marginBottom: 10,
                      }}
                    >
                      {s.n}
                    </div>
                    <s.icon size={22} color={t.colors.dark} />
                    <h3
                      style={{
                        color: t.colors.dark,
                        margin: "12px 0 8px",
                        fontSize: 18,
                      }}
                    >
                      {s.title}
                    </h3>
                    <p style={{ margin: 0, lineHeight: 1.55 }}>{s.body}</p>
                  </GlowRoot>
                ))}
              </Steps>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                style={{ marginBottom: 28 }}
              >
                <Kicker>Dashboard</Kicker>
                <Display>A week of bookings, under your cursor.</Display>
                <Body $max="560px">
                  Move across the chart. Saturday fills up. That is the view
                  from your dashboard — not a marketplace listing.
                </Body>
              </motion.div>
              <LiveWeekChart />
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fafbfc">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                style={{ textAlign: "center" }}
              >
                <Kicker>Built for small teams</Kicker>
                <Display>If you take appointments, this fits.</Display>
                <Body $max="560px" style={{ margin: "0 auto" }}>
                  We started with local studios and still work closely with
                  them. The product is for any appointment-based business that
                  wants bookings without enterprise software.
                </Body>
              </motion.div>
              <Audiences>
                <GlowRoot
                  as={AudienceCard}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <h3>Studios & classes</h3>
                  <p>
                    Yoga, pottery, fitness, workshops. Capacity, wait-free
                    booking, and memberships on Growth+.
                  </p>
                </GlowRoot>
                <GlowRoot
                  as={AudienceCard}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <h3>Tutors & coaches</h3>
                  <p>
                    Sessions with a public booking page that still looks like
                    your brand — not a generic marketplace.
                  </p>
                </GlowRoot>
                <GlowRoot
                  as={AudienceCard}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <h3>Salons & appointments</h3>
                  <p>
                    Collect payment when they book. Keep the customer
                    relationship on your site and in your list.
                  </p>
                </GlowRoot>
              </Audiences>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff" id="pricing-preview">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Kicker>Pricing</Kicker>
                <Display>Simple, commission-based plans</Display>
                <Body $max="560px">
                  A flat monthly fee plus a small commission per booking — no
                  setup fee, no hidden processor to bolt on.
                </Body>
                <p
                  style={{
                    fontSize: 14,
                    color: "#94a3b8",
                    maxWidth: 560,
                    margin: "8px 0 0",
                    fontWeight: 500,
                  }}
                >
                  Growth and Advanced include memberships — recurring plans and
                  member management.
                </p>
              </motion.div>
              <PriceGrid>
                {PLANS.map((plan) => (
                  <GlowRoot as={PlanCard} key={plan.id} $featured={plan.featured}>
                    {plan.featured && (
                      <span
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          background: "#fff0f3",
                          color: t.colors.primary,
                          padding: "4px 8px",
                          borderRadius: 999,
                        }}
                      >
                        Most popular
                      </span>
                    )}
                    <PlanName>{plan.name}</PlanName>
                    <PlanPrice>
                      ${plan.price}
                      <span> /mo CAD</span>
                    </PlanPrice>
                    <p style={{ fontSize: 14, margin: "8px 0 16px" }}>
                      {plan.commission}% per booking
                    </p>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "0 0 20px",
                        flex: 1,
                      }}
                    >
                      {(plan.features || []).slice(0, 5).map((f) => (
                        <li
                          key={f.label}
                          style={{
                            display: "flex",
                            gap: 8,
                            fontSize: 13,
                            marginBottom: 8,
                            color: t.colors.dark,
                          }}
                        >
                          <Check size={14} color={t.colors.primary} />
                          {f.label}
                        </li>
                      ))}
                    </ul>
                    <ButtonLink
                      href={`${REGISTER_HREF}?plan=${plan.id}`}
                      $variant={plan.featured ? "primary" : "secondary"}
                      style={{ width: "100%" }}
                    >
                      Get started
                    </ButtonLink>
                  </GlowRoot>
                ))}
              </PriceGrid>
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <GhostLink href={PRICING_HREF}>
                  See full plan comparison <ArrowRight size={16} />
                </GhostLink>
              </div>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                style={{ textAlign: "center" }}
              >
                <Kicker>FAQ</Kicker>
                <Display>Common questions</Display>
              </motion.div>
              <FaqList>
                {FAQ_ITEMS.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </FaqList>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#f8fafc">
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                style={{ textAlign: "center" }}
              >
                <Kicker>Customers</Kicker>
                <Display>What owners say.</Display>
              </motion.div>
              <Quotes>
                <GlowRoot as={Quote}>
                  <p>
                    “We stopped sending people off-site to book. It just lives
                    on our website now.”
                  </p>
                  <footer>Maya, studio owner</footer>
                </GlowRoot>
                <GlowRoot as={Quote}>
                  <p>
                    “Setup was the part I was dreading. It was not that. We were
                    taking bookings the same day.”
                  </p>
                  <footer>James, tutor</footer>
                </GlowRoot>
                <GlowRoot as={Quote}>
                  <p>
                    “I needed payments, memberships, and a customer list —
                    without an enterprise contract.”
                  </p>
                  <footer>Priya, salon owner</footer>
                </GlowRoot>
              </Quotes>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff" style={{ paddingBottom: 96 }}>
            <LandingContainer>
              <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
                <Display>Ready when you are.</Display>
                <Body $max="520px" style={{ margin: "0 auto 28px" }}>
                  Create an account, pick a plan, embed the widget. You can take
                  bookings the same day.
                </Body>
                <ButtonGroup style={{ justifyContent: "center" }}>
                  <Magnetic>
                    <PillLink href={REGISTER_HREF} $variant="primary">
                      Get started <ArrowRight size={16} />
                    </PillLink>
                  </Magnetic>
                  <GhostLink href={`mailto:${SUPPORT_EMAIL}`}>Talk to us</GhostLink>
                </ButtonGroup>
              </div>
            </LandingContainer>
          </LandingSection>
        </main>
        <MarketingFooter />
      </Page>
    </ThemeProvider>
  );
}
