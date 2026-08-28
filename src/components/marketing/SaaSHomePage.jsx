"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styled, { ThemeProvider, css } from "styled-components";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Globe,
  LayoutGrid,
  Puzzle,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
  Palette,
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
import ImagePlaceholder from "./ImagePlaceholder";
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
  min-height: calc(100vh - 76px);
  margin-top: -4.25rem;
  padding: calc(4.25rem + 56px) 0 112px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: #fff;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23000000' fill-opacity='0.06'/%3E%3C/svg%3E");
  background-size: 24px 24px;

  @media (max-width: 640px) {
    min-height: 0;
    margin-top: -4.25rem;
    padding: calc(4.25rem + 28px) 0 64px;
    display: block;
  }
`;

const HeroGradientStrip = styled.div`
  position: absolute;
  left: -20%;
  width: 140%;
  height: 42vh;
  min-height: 280px;
  max-height: 420px;
  top: 46%;
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

const HeroContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
  width: 100%;

  @media (max-width: 640px) {
    padding: 0 20px;
  }
`;

const HeroGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const HeroCopy = styled.div`
  max-width: 920px;
  width: 100%;
`;

const HeroH1 = styled.h1`
  font-size: 68px;
  margin: 0 0 24px;
  letter-spacing: -0.045em;
  line-height: 1.08;
  color: ${t.colors.dark};
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 40px;
    margin-bottom: 18px;
  }
  @media (max-width: 640px) {
    font-size: 32px;
  }
`;

const HeroP = styled.p`
  font-size: 20px;
  margin: 0 auto 16px;
  color: ${t.colors.text};
  line-height: 1.55;
  max-width: 720px;

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
  a {
    padding: 14px 28px;
    font-size: 17px;
  }
`;

const HeroVisual = styled.div`
  width: 100%;
  max-width: 1120px;
  margin-top: 64px;

  @media (max-width: 768px) {
    margin-top: 40px;
  }
`;

function Hero() {
  useEffect(() => {
    const id = "home-hero-gradient-canvas";
    const tmr = setTimeout(() => {
      import("stripe-gradient")
        .then(({ Gradient }) => {
          const canvas = document.getElementById(id);
          if (!canvas?.getContext) return;
          const gradient = new Gradient();
          gradient.initGradient(`#${id}`);
          window.dispatchEvent(new Event("resize"));
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(tmr);
  }, []);

  return (
    <HeroWrapper>
      <HeroGradientStrip>
        <HeroGradientCanvas id="home-hero-gradient-canvas" data-transition-in />
      </HeroGradientStrip>
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
                text="The same tools. A better price."
              />
              <motion.div variants={fadeUp}>
                <HeroP>
                  Scheduling, payments, memberships, and a customer list — the
                  stack the big platforms charge enterprise rates for. Plans
                  from $29 a month.
                </HeroP>
              </motion.div>
              <motion.div variants={fadeUp}>
                <HeroButtons>
                  <PillLink href={REGISTER_HREF} $variant="primary">
                    Get started <ArrowRight size={16} />
                  </PillLink>
                  <PillLink href={PRICING_HREF} $variant="secondary">
                    See pricing
                  </PillLink>
                </HeroButtons>
              </motion.div>
            </motion.div>
          </HeroCopy>
          <HeroVisual>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ImagePlaceholder
                label="Hero image placeholder"
                minHeight="560px"
              />
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
  gap: 40px;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 568px) {
    grid-template-columns: 1fr;
  }
`;

const VPItem = styled(motion.div)`
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
                <VPItem variants={fadeUp}>
                  <h3>
                    <Puzzle size={20} color="#fc4056" /> Booking on your site
                  </h3>
                  <p>
                    Add a booking button or inline calendar to Wix, Shopify,
                    Squarespace, or a custom site. Customers never leave your
                    brand.
                  </p>
                </VPItem>
                <VPItem variants={fadeUp}>
                  <h3>
                    <CreditCard size={20} color="#fc4056" /> Apple Pay and cards
                  </h3>
                  <p>
                    Checkout with Apple Pay, Google Pay, or any major card. We
                    handle payments; you get one payout to your bank.
                  </p>
                </VPItem>
                <VPItem variants={fadeUp}>
                  <h3>
                    <LayoutGrid size={20} color="#fc4056" /> Your site, your brand
                  </h3>
                  <p>
                    Match colors and fonts. Popup with your own button, or embed
                    inline. Domain whitelist keeps the embed on your site only.
                  </p>
                </VPItem>
                <VPItem variants={fadeUp}>
                  <h3>
                    <Users size={20} color="#fc4056" /> Lightweight CRM
                  </h3>
                  <p>
                    Every booker lands in a customer list. See history, follow
                    up, and run memberships without a second tool.
                  </p>
                </VPItem>
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
                </motion.div>
              </SplitGrid>
            </LandingContainer>
          </LandingSection>

          <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" flip />

          <LandingSection $bg="#fff" id="features">
            <LandingContainer>
              <SplitGrid>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <ImagePlaceholder
                    label="Product image placeholder"
                    minHeight="460px"
                  />
                </motion.div>
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
                    Match it to your site so it looks like it belongs there.
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
                    They kept the tools.
                    <br />
                    They{" "}
                    <span className={testimonialStyles.headlineAccent}>
                      cut the bill.
                    </span>
                  </h2>
                  <p className={testimonialStyles.subtext}>
                    Classes, payments, memberships, and a customer list — what
                    the big platforms charge enterprise rates for, from $29 a
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
                <Display>Ready when you are.</Display>
                <Body $max="520px" style={{ margin: "0 auto 28px" }}>
                  Create an account, pick a plan, embed the widget. You can take
                  bookings the same day.
                </Body>
                <ButtonGroup style={{ justifyContent: "center" }}>
                  <PillLink href={REGISTER_HREF} $variant="primary">
                    Get started <ArrowRight size={16} />
                  </PillLink>
                  <GhostLink href={`mailto:${SUPPORT_EMAIL}`}>Talk to us</GhostLink>
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
