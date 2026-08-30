"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styled, { ThemeProvider, css } from "styled-components";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  LayoutGrid,
  Puzzle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import PlanCards from "@/components/plans/PlanCards";
import {
  marketingTheme as t,
  REGISTER_HREF,
  PRICING_HREF,
  SUPPORT_EMAIL,
} from "./tokens";
import MarketingHeader, { MarketingSheet } from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";
import AnimatedHeadline from "./AnimatedHeadline";
import AnimatedFaq from "./AnimatedFaq";
import TestimonialsClient from "@/app/(homepage)/_components/TestimonialsClient";
import testimonialStyles from "@/app/(homepage)/_components/Testimonials.module.css";

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
  background: #f2f2f4;
  min-height: 100vh;
`;

const LandingContainer = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

const SLANT = 48;
const HERO_SLANT = 36;
const HERO_PAD_BOTTOM = 36;
const HERO_PAD_BOTTOM_SM = 32;

function slantClip(flip, height) {
  return flip
    ? `polygon(0 0, 100% 0, 100% calc(100% - ${height}px), 0 100%)`
    : `polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - ${height}px))`;
}

const slantedBottom = (height, flip, layer) => css`
  clip-path: ${slantClip(flip, height)};
  margin-bottom: -${height}px;
  z-index: ${layer};
`;

const SlantEdgeSvg = styled.svg`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: ${(p) => p.$height}px;
  display: block;
  pointer-events: none;
  z-index: 3;
  transform: ${(p) => (p.$flip ? "scaleX(-1)" : "none")};
`;

function SlantEdge({ flip = false, height = SLANT }) {
  return (
    <SlantEdgeSvg
      viewBox={`0 0 1440 ${height}`}
      preserveAspectRatio="none"
      $height={height}
      $flip={flip}
      aria-hidden
    >
      <line
        x1="0"
        y1="1"
        x2="1440"
        y2={height - 1}
        stroke="rgba(252,64,86,0.14)"
        strokeWidth="1.7"
        vectorEffect="non-scaling-stroke"
      />
    </SlantEdgeSvg>
  );
}

const LandingSection = styled.section`
  padding: ${(p) => `${p.$padTop ?? 72}px 0 ${(p.$padBottom ?? 72) + (p.$slant || 0)}px`};
  background: ${(p) => p.$bg || "transparent"};
  position: relative;
  ${(p) => p.$slant && slantedBottom(p.$slant, p.$flip, p.$layer || 1)}

  @media (max-width: 768px) {
    padding: ${(p) =>
      `${p.$padTop ?? 64}px 0 ${(p.$padBottom ?? 64) + (p.$slant || 0)}px`};
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
          background: rgba(0, 0, 0, 0.04);
          color: ${t.colors.dark};
          &:hover {
            background: rgba(0, 0, 0, 0.08);
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

const HeroWrapper = styled.section`
  margin-top: -4.25rem;
  margin-bottom: -${HERO_SLANT}px;
  padding: calc(4.25rem + 28px) 0 ${HERO_PAD_BOTTOM + HERO_SLANT}px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  z-index: 5;
  clip-path: ${slantClip(false, HERO_SLANT)};
  background: #fff;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23000000' fill-opacity='0.06'/%3E%3C/svg%3E");
  background-size: 24px 24px;

  @media (max-width: 968px) {
    align-items: flex-start;
  }

  @media (max-width: 640px) {
    margin-top: -4.25rem;
    padding: calc(4.25rem + 20px) 0 ${HERO_PAD_BOTTOM_SM + HERO_SLANT}px;
    display: block;
  }
`;

const HeroGradientLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  -webkit-mask-image: radial-gradient(
    ellipse 120% 110% at 32% 48%,
    #000 58%,
    transparent 100%
  );
  mask-image: radial-gradient(
    ellipse 120% 110% at 32% 48%,
    #000 58%,
    transparent 100%
  );
`;

const HeroGradientStrip = styled.div`
  position: absolute;
  left: -32%;
  width: 164%;
  height: 72vh;
  min-height: 420px;
  top: 58%;
  transform: translateY(-50%) rotate(150deg);

  @media (max-width: 640px) {
    display: none;
  }
`;

const HeroGradientCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  display: block;
  --gradient-color-1: #f5f5f5;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #ffffff;
  --gradient-color-4: #f5f5f5;
`;

const HeroContainer = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(380px, 1.2fr) minmax(0, 1fr);
  align-items: center;
  gap: 28px 40px;
  position: relative;
  z-index: 1;
  width: 100%;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 28px;
    text-align: center;
  }
`;

const HeroCopy = styled.div`
  max-width: 680px;
  width: 100%;
  position: relative;
  z-index: 2;

  @media (max-width: 968px) {
    max-width: 720px;
    margin: 0 auto;
  }
`;

const HeroH1 = styled.h1`
  font-size: clamp(40px, 4.4vw, 56px);
  margin: 0 0 18px;
  letter-spacing: -0.045em;
  line-height: 1.08;
  color: ${t.colors.dark};
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 40px;
    margin-bottom: 16px;
  }
  @media (max-width: 640px) {
    font-size: 32px;
  }
`;

const HeroP = styled.p`
  font-size: 20px;
  margin: 0 0 24px;
  color: ${t.colors.text};
  line-height: 1.55;
  max-width: 640px;

  @media (max-width: 968px) {
    margin-left: auto;
    margin-right: auto;
    max-width: 560px;
  }

  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
`;

const HeroButtons = styled(ButtonGroup)`
  justify-content: flex-start;

  a {
    padding: 14px 28px;
    font-size: 17px;
  }

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const HeroTrust = styled.p`
  margin: 14px 0 0;
  color: ${t.colors.text};
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;

  @media (max-width: 968px) {
    text-align: center;
  }
`;

const HeroVisual = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  align-self: end;
  min-width: 0;
  overflow: visible;
  /* Sit the shot on the slant: cancel hero padding, then lift so the
     image center (≈70% across the viewport) lands on the clip line. */
  margin-bottom: calc(
    -${HERO_PAD_BOTTOM + HERO_SLANT}px + var(--shot-lift, ${HERO_SLANT * 0.3}px)
  );

  > div {
    flex-shrink: 0;
    width: max-content;
    max-width: none;
  }

  @media (max-width: 968px) {
    justify-content: center;
    margin-bottom: calc(
      -${HERO_PAD_BOTTOM_SM + HERO_SLANT}px + var(--shot-lift, ${HERO_SLANT * 0.5}px)
    );
  }
`;

const HeroShot = styled.div`
  width: min(46vw, 682px);
  max-width: none;
  transform: rotate(atan(calc(-1 * ${HERO_SLANT}px / 100vw)));
  transform-origin: bottom center;

  img {
    width: 100%;
    max-width: none;
    height: auto;
    display: block;
  }

  @media (max-width: 968px) {
    width: min(50vw, 525px);
  }
`;

function Hero() {
  const visualRef = useRef(null);

  useLayoutEffect(() => {
    const visual = visualRef.current;
    const hero = visual?.closest("[data-home-hero]");
    if (!visual || !hero) return;

    const sync = () => {
      const hr = hero.getBoundingClientRect();
      const shot = visual.querySelector("[data-hero-shot]");
      const vr = (shot || visual).getBoundingClientRect();
      if (!hr.width) return;
      const t = (vr.left + vr.width / 2 - hr.left) / hr.width;
      visual.style.setProperty("--shot-lift", `${HERO_SLANT * (1 - t)}px`);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(hero);
    ro.observe(visual);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = "home-hero-gradient-canvas";
    let gradient = null;
    let cancelled = false;
    const tmr = setTimeout(() => {
      import("./HomeHeroGradient")
        .then(({ default: HomeHeroGradient }) => {
          if (cancelled) return;
          const canvas = document.getElementById(id);
          if (!canvas?.getContext) return;
          gradient = new HomeHeroGradient();
          gradient.initGradient(`#${id}`);
          window.dispatchEvent(new Event("resize"));
        })
        .catch(() => {});
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(tmr);
      try {
        gradient?.disconnect?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <HeroWrapper data-home-hero>
      <HeroGradientLayer>
        <HeroGradientStrip>
          <HeroGradientCanvas id="home-hero-gradient-canvas" data-transition-in />
        </HeroGradientStrip>
      </HeroGradientLayer>
      <SlantEdge height={HERO_SLANT} />
      <HeroContainer>
        <HeroGrid>
          <HeroCopy>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <AnimatedHeadline
                as={HeroH1}
                text="Your schedule, payments, and clients. All in one place."
              />
              <motion.div variants={fadeUp}>
                <HeroP>
                  Let customers book and pay directly on your website. Manage
                  appointments, memberships, and client relationships from one
                  straightforward dashboard.
                </HeroP>
              </motion.div>
              <motion.div variants={fadeUp}>
                <HeroButtons>
                  <PillLink href={REGISTER_HREF} $variant="primary">
                    Start taking bookings <ArrowRight size={16} />
                  </PillLink>
                  <PillLink href="/#features" $variant="secondary">
                    See how it works
                  </PillLink>
                </HeroButtons>
                <HeroTrust>
                  From $29/month · No setup fee · First 3 months with no booking
                  fees
                </HeroTrust>
              </motion.div>
            </motion.div>
          </HeroCopy>
          <HeroVisual ref={visualRef}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroShot data-hero-shot>
                <Image
                  src="/Frame 1597880366 2.webp"
                  alt="ClassEasily dashboard"
                  width={5056}
                  height={3392}
                  priority
                  sizes="(max-width: 968px) 50vw, 682px"
                />
              </HeroShot>
            </motion.div>
          </HeroVisual>
        </HeroGrid>
      </HeroContainer>
    </HeroWrapper>
  );
}

const ValuePropsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 568px) {
    grid-template-columns: 1fr;
  }
`;

const VPItem = styled(motion.div)`
  padding: 0 36px;

  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
  }
  &:not(:first-child) {
    border-left: 1px solid ${t.colors.border};
  }

  @media (max-width: 968px) {
    padding: 0 32px;

    &:nth-child(odd) {
      padding-left: 0;
      border-left: none;
    }
    &:nth-child(even) {
      padding-right: 0;
      border-left: 1px solid ${t.colors.border};
    }
    &:nth-child(n + 3) {
      margin-top: 36px;
      padding-top: 36px;
      border-top: 1px solid ${t.colors.border};
    }
  }

  @media (max-width: 568px) {
    padding: 0;
    border-left: none;

    &:nth-child(even) {
      border-left: none;
    }
    &:nth-child(n + 3) {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    &:not(:first-child) {
      margin-top: 28px;
      padding-top: 28px;
      border-top: 1px solid ${t.colors.border};
    }
  }

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
  gap: 72px;
  align-items: center;
  position: relative;

  @media (min-width: 969px) {
    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      background: ${t.colors.border};
    }
  }

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const PaymentsVisual = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: min(100%, 357px);
    max-width: none;
    height: auto;
    display: block;
  }

  @media (max-width: 968px) {
    img {
      width: min(100%, 272px);
      margin-inline: auto;
    }
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

const BrandMasthead = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
  gap: 28px 72px;
  align-items: end;
  padding-bottom: 36px;
  border-bottom: 1px solid ${t.colors.border};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding-bottom: 28px;
  }
`;

const BrandDisplay = styled(Display)`
  margin: 0;
  max-width: 13ch;
  font-size: 46px;

  @media (max-width: 768px) {
    max-width: none;
    font-size: 30px;
  }
`;

const BrandLead = styled(Body)`
  max-width: 38ch;
  padding-bottom: 2px;
`;

const BrandSpecs = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 40px 0 0;
  padding: 0;
  list-style: none;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    margin-top: 28px;
  }
`;

const BrandSpec = styled.li`
  margin: 0;
  padding: 0 36px;

  &:first-child {
    padding-left: 0;
  }

  &:last-child {
    padding-right: 0;
  }

  &:not(:first-child) {
    border-left: 1px solid ${t.colors.border};
  }

  @media (max-width: 768px) {
    padding: 0;

    &:not(:first-child) {
      border-left: none;
      padding-top: 24px;
      border-top: 1px solid ${t.colors.border};
    }
  }
`;

const BrandSpecIndex = styled.span`
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${t.colors.primary};
  margin: 0 0 12px;
`;

const BrandSpecTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: ${t.colors.dark};
  margin: 0 0 8px;
`;

const BrandSpecCopy = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: ${t.colors.text};
`;

const BrandPlatforms = styled.p`
  margin: 36px 0 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  color: ${t.colors.dark};

  em {
    font-style: normal;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.45);
    margin-right: 10px;
  }
`;

const PriceGrid = styled.div`
  margin-top: 48px;

  @media (max-width: 800px) {
    margin-top: 32px;
  }
`;

const FaqWrap = styled.div`
  max-width: 720px;
  margin: 40px auto 0;
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

const TrustpilotLogo = () => (
  <svg
    width="88"
    height="22"
    viewBox="0 0 100 24"
    fill="none"
    aria-label="Trustpilot"
  >
    <path
      d="M14.006 18.1411L10.88 19.9991L11.77 16.2461L8.887 13.7001L12.689 13.3751L14.006 9.85812L15.322 13.3751L19.124 13.7001L16.241 16.2461L17.131 19.9991L14.006 18.1411Z"
      fill="#00B67A"
    />
    <text
      x="24"
      y="18"
      fontFamily="Arial, sans-serif"
      fontSize="14"
      fontWeight="bold"
      fill="#000"
    >
      Trustpilot
    </text>
  </svg>
);

const OWNER_QUOTES = [
  {
    id: 1,
    rating: 5,
    date: "12 March 2025",
    quote:
      "Same scheduling, payments, and memberships we had on the expensive platform. The bill is a fraction of what it was.",
    userName: "Maya Chen",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    userTitle: "Studio owner",
  },
  {
    id: 2,
    rating: 5,
    date: "2 July 2025",
    quote:
      "We compared feature lists side by side. ClassEasily had what we actually used — at a price that isn't a second rent payment.",
    userName: "James Ortiz",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    userTitle: "Tutor",
  },
  {
    id: 3,
    rating: 5,
    date: "17 January 2026",
    quote:
      "Payments, memberships, and a customer list in one place. I was paying twice as much for the same stack.",
    userName: "Priya Shah",
    avatarUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
    userTitle: "Salon owner",
  },
  {
    id: 4,
    rating: 5,
    date: "15 August 2025",
    quote:
      "Mindbody-class tools without Mindbody prices. Classes, checkout, and CRM — we didn't give anything up.",
    userName: "Elena Voss",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    userTitle: "Yoga studio",
  },
  {
    id: 5,
    rating: 5,
    date: "19 February 2026",
    quote:
      "I wasn't going to keep paying enterprise rates for a calendar, checkout, and a customer list. This does all three for less.",
    userName: "Marcus Bell",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    userTitle: "Coach",
  },
];

const FEATURED_OWNER = {
  quote:
    "We were paying twice as much for the same scheduling, payments, and memberships. The switch paid for itself the first month.",
  name: "Maya Chen",
  title: "Studio owner",
  avatarUrl:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
};

function OwnerReviewCard({ t, starSize = 14 }) {
  return (
    <article className={testimonialStyles.card}>
      <div className={testimonialStyles.cardHeader}>
        <div className={testimonialStyles.stars}>
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={starSize} fill="#00b67a" stroke="none" />
          ))}
        </div>
        <span className={testimonialStyles.date}>{t.date}</span>
      </div>
      <p className={testimonialStyles.quote}>{t.quote}</p>
      <div className={testimonialStyles.cardFooter}>
        <div className={testimonialStyles.userInfo}>
          <Image
            src={t.avatarUrl}
            alt={t.userName}
            className={testimonialStyles.avatar}
            width={36}
            height={36}
            sizes="36px"
          />
          <div className={testimonialStyles.userDetails}>
            <span className={testimonialStyles.userName}>{t.userName}</span>
            <span className={testimonialStyles.userTitle}>{t.userTitle}</span>
          </div>
        </div>
        <div className={testimonialStyles.trustpilot}>
          <TrustpilotLogo />
        </div>
      </div>
    </article>
  );
}

export default function SaaSHomePage() {
  return (
    <ThemeProvider theme={t}>
      <Page>
        <MarketingHeader />
        <MarketingSheet>
        <main>
          <Hero />

          <LandingSection
            $bg="#fafbfc"
            id="features"
            $padTop={96}
            $padBottom={56}
            $slant={SLANT}
            $flip
            $layer={4}
          >
            <SlantEdge flip height={SLANT} />
            <LandingContainer>
              <ValuePropsGrid
                as={motion.div}
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <VPItem variants={fadeUp}>
                  <h3>
                    <Puzzle size={20} color="#fc4056" /> Keep customers on your
                    website
                  </h3>
                  <p>
                    Accept bookings through a calendar that matches your brand
                    — without redirects or marketplace profiles.
                  </p>
                </VPItem>
                <VPItem variants={fadeUp}>
                  <h3>
                    <CreditCard size={20} color="#fc4056" /> Make checkout
                    effortless
                  </h3>
                  <p>
                    Let customers pay with Apple Pay, Google Pay, or any major
                    card through secure Stripe checkout.
                  </p>
                </VPItem>
                <VPItem variants={fadeUp}>
                  <h3>
                    <Users size={20} color="#fc4056" /> Know every client
                  </h3>
                  <p>
                    Automatically build a client history from every booking,
                    payment, and membership.
                  </p>
                </VPItem>
                <VPItem variants={fadeUp}>
                  <h3>
                    <LayoutGrid size={20} color="#fc4056" /> Run it from one
                    dashboard
                  </h3>
                  <p>
                    Manage availability, bookings, payouts, memberships, and
                    client relationships without stitching together more tools.
                  </p>
                </VPItem>
              </ValuePropsGrid>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff" $slant={SLANT} $flip $layer={3}>
            <SlantEdge flip height={SLANT} />
            <LandingContainer>
              <SplitGrid>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Kicker>Payments built into every booking</Kicker>
                  <Display>Make it easy to book — and easier to get paid.</Display>
                  <Body>
                    Customers can reserve and pay in one smooth checkout with
                    Apple Pay, Google Pay, or any major card. Stripe handles
                    payment security while ClassEasily keeps bookings,
                    customers, and payouts organized in one place.
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
                >
                  <PaymentsVisual>
                    <Image
                      src="/payments-apple-pay.webp"
                      alt="Apple Pay checkout on a phone"
                      width={1661}
                      height={2544}
                      sizes="(max-width: 968px) 272px, 357px"
                    />
                  </PaymentsVisual>
                </motion.div>
              </SplitGrid>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff" $slant={SLANT} $layer={2}>
            <SlantEdge height={SLANT} />
            <LandingContainer>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <BrandMasthead>
                  <motion.div variants={fadeUp}>
                    <Kicker>Your business stays front and center</Kicker>
                    <BrandDisplay>
                      Booking that feels like part of your website.
                    </BrandDisplay>
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <BrandLead>
                      Match your colors and fonts, open booking from your own
                      button, or embed the full calendar on any page. Customers
                      remain inside your brand from discovery through checkout.
                    </BrandLead>
                  </motion.div>
                </BrandMasthead>
                <BrandSpecs>
                  <BrandSpec as={motion.li} variants={fadeUp}>
                    <BrandSpecIndex>01</BrandSpecIndex>
                    <BrandSpecTitle>Colors and fonts</BrandSpecTitle>
                    <BrandSpecCopy>
                      Match the widget to your site so it doesn’t look like a
                      third-party checkout.
                    </BrandSpecCopy>
                  </BrandSpec>
                  <BrandSpec as={motion.li} variants={fadeUp}>
                    <BrandSpecIndex>02</BrandSpecIndex>
                    <BrandSpecTitle>Popup or inline</BrandSpecTitle>
                    <BrandSpecCopy>
                      Trigger from your own button, or drop a calendar onto a
                      dedicated booking page.
                    </BrandSpecCopy>
                  </BrandSpec>
                  <BrandSpec as={motion.li} variants={fadeUp}>
                    <BrandSpecIndex>03</BrandSpecIndex>
                    <BrandSpecTitle>Domain whitelist</BrandSpecTitle>
                    <BrandSpecCopy>
                      The embed only loads on sites you approve — not on
                      random pages that copy your snippet.
                    </BrandSpecCopy>
                  </BrandSpec>
                </BrandSpecs>
                <motion.div variants={fadeUp}>
                  <BrandPlatforms>
                    <em>Works on</em>
                    Wix, Shopify, Squarespace, WordPress, Webflow, and custom
                    sites
                  </BrandPlatforms>
                </motion.div>
              </motion.div>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fafbfc" $slant={SLANT} $flip $layer={1}>
            <SlantEdge flip height={SLANT} />
            <LandingContainer>
              <SplitGrid>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Kicker>Client management included</Kicker>
                  <Display>
                    Every booking builds a stronger client relationship.
                  </Display>
                  <Body>
                    Every customer, booking, payment, and membership contributes
                    to one organized client record. See history at a glance,
                    follow up personally, and give clients more reasons to
                    return.
                  </Body>
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <FeatureStack style={{ marginTop: 0 }}>
                    <FeatureRow>
                      <h4>
                        <Users size={20} color="#fc4056" /> Client history in one
                        place
                      </h4>
                      <p>
                        Quickly understand who booked, what they purchased, and
                        when they last visited.
                      </p>
                    </FeatureRow>
                    <FeatureRow>
                      <h4>
                        <LayoutGrid size={20} color="#fc4056" /> Memberships
                        built in
                      </h4>
                      <p>
                        Offer recurring plans and manage member access without a
                        separate subscription tool.
                      </p>
                    </FeatureRow>
                    <FeatureRow>
                      <h4>
                        <CreditCard size={20} color="#fc4056" /> Bookings and
                        payments connected
                      </h4>
                      <p>
                        Keep customer activity tied to the transactions and
                        payouts behind it.
                      </p>
                    </FeatureRow>
                  </FeatureStack>
                </motion.div>
              </SplitGrid>
            </LandingContainer>
          </LandingSection>

          <LandingSection $bg="#fff" id="pricing-preview" $padTop={120}>
            <LandingContainer>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Kicker>Pricing that grows with you</Kicker>
                <Display>Start lean. Upgrade when business picks up.</Display>
                <Body $max="560px">
                  Plans begin at $29 per month with no setup fee. Choose the
                  booking rate that fits your volume, and change plans as you
                  grow.
                </Body>
                <p
                  style={{
                    fontSize: 14,
                    color: "#000",
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
                <PlanCards
                  hrefForPlan={(plan) => `${REGISTER_HREF}?plan=${plan.id}`}
                />
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
              <FaqWrap>
                <AnimatedFaq items={FAQ_ITEMS} boxed />
              </FaqWrap>
            </LandingContainer>
          </LandingSection>

          <section
            className={testimonialStyles.section}
            aria-labelledby="testimonials-title"
            style={{ background: "#f8fafc", fontFamily: "inherit" }}
          >
            <div className={testimonialStyles.container}>
              <div className={testimonialStyles.grid}>
                <div className={testimonialStyles.leftCol}>
                  <h2
                    id="testimonials-title"
                    className={testimonialStyles.headline}
                  >
                    More time for clients.
                    <br />
                    Less{" "}
                    <span className={testimonialStyles.headlineAccent}>
                      software to manage.
                    </span>
                  </h2>
                  <p className={testimonialStyles.subtext}>
                    Scheduling, payments, memberships, and client management
                    come together in one straightforward platform, from $29 a
                    month.
                  </p>
                  <div className={testimonialStyles.statRow}>
                    <div className={testimonialStyles.stat}>
                      <span className={testimonialStyles.statNum}>$29</span>
                      <span className={testimonialStyles.statLabel}>
                        Starting / mo
                      </span>
                    </div>
                    <div className={testimonialStyles.stat}>
                      <span className={testimonialStyles.statNum}>Same stack</span>
                      <span className={testimonialStyles.statLabel}>
                        Book, pay, CRM
                      </span>
                    </div>
                    <div className={testimonialStyles.stat}>
                      <span className={testimonialStyles.statNum}>$0</span>
                      <span className={testimonialStyles.statLabel}>
                        Setup fee
                      </span>
                    </div>
                  </div>
                </div>

                <div className={testimonialStyles.centerCol} aria-hidden="true">
                  <Image
                    src="/workshop.jpg"
                    alt="Workshop in session"
                    fill
                    sizes="(max-width: 1023px) 60vw, 35vw"
                    className={testimonialStyles.centerImage}
                  />
                  <div className={testimonialStyles.imageOverlay} />
                  <div className={testimonialStyles.imageContent}>
                    <p className={testimonialStyles.imageQuote}>
                      “{FEATURED_OWNER.quote}”
                    </p>
                    <div className={testimonialStyles.imageAuthor}>
                      <Image
                        src={FEATURED_OWNER.avatarUrl}
                        alt={FEATURED_OWNER.name}
                        className={testimonialStyles.imageAvatar}
                        width={38}
                        height={38}
                        sizes="38px"
                      />
                      <div className={testimonialStyles.imageAuthorText}>
                        <span className={testimonialStyles.imageAuthorName}>
                          {FEATURED_OWNER.name}
                        </span>
                        <span className={testimonialStyles.imageAuthorTitle}>
                          {FEATURED_OWNER.title}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={testimonialStyles.rightCol}
                  aria-label="More testimonials"
                >
                  {OWNER_QUOTES.map((t) => (
                    <OwnerReviewCard key={t.id} t={t} />
                  ))}
                </div>
              </div>

              <div className={testimonialStyles.carouselSection}>
                <TestimonialsClient title="What owners say">
                  {OWNER_QUOTES.map((t) => (
                    <OwnerReviewCard key={t.id} t={t} starSize={16} />
                  ))}
                </TestimonialsClient>
              </div>
            </div>
          </section>

          <LandingSection $bg="#fff" style={{ paddingBottom: 96 }}>
            <LandingContainer>
              <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
                <Display>Ready to make booking easier?</Display>
                <Body $max="520px" style={{ margin: "0 auto 28px" }}>
                  Create your account, add your schedule, and publish booking on
                  your website. You can be ready to accept customers today.
                </Body>
                <ButtonGroup style={{ justifyContent: "center" }}>
                  <PillLink href={REGISTER_HREF} $variant="primary">
                    Start taking bookings <ArrowRight size={16} />
                  </PillLink>
                  <GhostLink href={`mailto:${SUPPORT_EMAIL}`}>
                    Talk to our team
                  </GhostLink>
                </ButtonGroup>
              </div>
            </LandingContainer>
          </LandingSection>
        </main>
        <MarketingFooter />
        </MarketingSheet>
      </Page>
    </ThemeProvider>
  );
}
