"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle } from "styled-components";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { Plus, Minus, Check, X, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

// Import components
import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";
import ExploreHeader from "@/components/explore/ExploreHeader";

// --- Global Animations & Styles ---

const GlobalStyle = createGlobalStyle`
  :root {
    --glass-border: 1px solid rgba(255, 255, 255, 0.4);
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    --primary-color: #222222;
    --accent-red: #f81e3e; 
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// --- Styled Components ---

const PageWrapper = styled.div`
  position: relative;
  background-color: #ffffff;
  color: #222222;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
        circle at 15% 50%,
        rgba(255, 200, 200, 0.15),
        transparent 25%
      ),
      radial-gradient(
        circle at 85% 30%,
        rgba(200, 220, 255, 0.15),
        transparent 25%
      );
    z-index: 0;
    pointer-events: none;
  }
`;

const SectionContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

// Change motion.div to m.div for LazyMotion
const GlassCard = styled(m.div)`
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 24px;
`;

const HeroSection = styled.section`
  min-height: 60vh;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  align-items: center;
  position: relative;
  /* Prevent layout shift during font load */
  contain: content;

  @media (max-width: 1024px) {
    padding-top: 120px;
    min-height: auto;
    text-align: center;
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  align-items: center;
  gap: 4rem;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

const HeroTextContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 1024px) {
    align-items: center;
  }
`;

const HeroVisualContainer = styled(m.div)`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3.1;
  border-radius: 24px;
  box-shadow: rgb(0 0 0 / 1%) 0px 20px 20px 0px;
  overflow: hidden;
  /* Hardware acceleration for smoother reveal */
  transform: translateZ(0);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #1d1d1f;
`;

const HeroSubtitle = styled.p`
  font-size: 1.125rem;
  color: #6e6e73;
  max-width: 460px;
  margin-bottom: 32px;
  line-height: 1.5;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const StartButton = styled.button`
  background: transparent;
  color: #1d1d1f;
  border: 2px solid #1d1d1f;
  height: 48px;
  padding: 0 32px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: #f81e3e;
    border-color: #f81e3e;
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const DashboardSection = styled.section`
  padding: 4rem 0 !important;
  position: relative;
`;

const MockupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 48px;
  position: relative;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

const MockupItem = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: default;
`;

const MockupImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 9/10;
  border-radius: 16px;
  overflow: hidden;

  img {
    object-fit: cover;
    object-position: top center;
    transition: object-position 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
    will-change: object-position;
  }

  @media (hover: hover) {
    &:hover img {
      object-position: bottom center;
    }
  }
`;

const MockupTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
`;

const MockupDesc = styled.p`
  font-size: 0.95rem;
  color: #6e6e73;
  line-height: 1.5;
  margin: 0;
`;

const ValuePropSection = styled.section`
  padding: 80px 0;

  @media (max-width: 768px) {
    padding: 60px 0;
  }
`;

const GridThree = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;

  @media (max-width: 900px) {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 16px;
    padding-bottom: 24px;
    margin: 0 -20px 40px -20px;
    padding-left: 20px;
    padding-right: 20px;

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const ValueCard = styled(GlassCard)`
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.6);

  @media (max-width: 900px) {
    min-width: 280px;
    max-width: 280px;
    scroll-snap-align: center;
  }
`;

const IconCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: #f81e3e;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ValueTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1d1d1f;
`;

const ValueDesc = styled.p`
  font-size: 14px;
  color: #6e6e73;
  line-height: 1.5;
`;

const SectionHeader = styled.div`
  margin-bottom: 48px;
  text-align: ${(props) => (props.$center ? "center" : "left")};
`;

const SectionEyebrow = styled.p`
  color: #f81e3e;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 700;
  margin-bottom: 12px;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

const SectionSubtitle = styled.p`
  font-size: 1.05rem;
  color: #6e6e73;
  line-height: 1.5;
  max-width: ${(props) => (props.$center ? "600px" : "100%")};
  margin: ${(props) => (props.$center ? "0 auto" : "0")};

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const ComparisonTableWrapper = styled(GlassCard)`
  padding: 0;
  background: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  max-width: 900px;
  margin: 0 auto;
`;

const ComparisonRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 20px 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 24px 20px;
    background: ${(props) =>
      props.$isHeader ? "rgba(0,0,0,0.02)" : "transparent"};
  }
`;

const ComparisonHeader = styled(ComparisonRow)`
  background: rgba(0, 0, 0, 0.02);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6e6e73;
  font-weight: 600;

  @media (max-width: 600px) {
    display: none;
  }
`;

const ComparisonFeature = styled.div`
  font-weight: 600;
  color: #1d1d1f;
  font-size: 14px;

  @media (max-width: 600px) {
    font-size: 1rem;
    margin-bottom: 4px;
  }
`;

const ComparisonValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: ${(props) => (props.$good ? "#10b981" : "#6e6e73")};
  font-weight: ${(props) => (props.$good ? "600" : "400")};

  ${(props) =>
    props.$highlight &&
    `
    color: #f81e3e;
    font-weight: 700;
  `}

  @media (max-width: 600px) {
    justify-content: space-between;
    width: 100%;
    padding-left: 0;
    border-left: none;

    &::before {
      content: attr(data-label);
      font-size: 0.75rem;
      color: #9ca3af;
      text-transform: uppercase;
      font-weight: 600;
    }
  }
`;

const TestimonialsSection = styled.section`
  padding: 60px 0;
  position: relative;
`;

const ReviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 900px) {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 16px;
    padding-bottom: 24px;
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const ReviewItem = styled(m.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  padding: 16px 20px;
  border-radius: 16px;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  @media (max-width: 900px) {
    min-width: 300px;
    max-width: 300px;
    scroll-snap-align: center;
    background: #f9f9fa;
    border: 1px solid rgba(0, 0, 0, 0.03);
  }
`;

const AnimatedIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
  opacity: 0.8;
  transition: opacity 0.3s ease;

  ${ReviewItem}:hover & {
    opacity: 1;
  }
`;

const ReviewText = styled.h4`
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  color: #1d1d1f;
  letter-spacing: -0.01em;
  margin: 0;
`;

const ReviewAuthor = styled.div`
  margin-top: auto;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6e6e73;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-weight: 400;
    color: #9ca3af;
  }
`;

const TierSection = styled.section`
  padding: 60px 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(245, 245, 247, 0.5) 100%
  );
`;

const CleanTierGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  margin-top: 40px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 900px) {
    display: none;
  }
`;

const MobileTabContainer = styled.div`
  display: none;
  width: 100%;
  margin-top: 24px;

  @media (max-width: 900px) {
    display: block;
  }
`;

const TabList = styled.div`
  display: flex;
  background: #f2f2f5;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
  position: relative;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  background: transparent;
  color: ${(props) => (props.$active ? "#1d1d1f" : "#86868b")};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  transition: color 0.2s;
`;

const TabIndicator = styled(m.div)`
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1;
`;

const MobileTabContent = styled(m.div)`
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
`;

const CleanTierColumn = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-right: none;
  }
`;

const TierHeaderSimple = styled.div`
  margin-bottom: 20px;
`;

const TierTitleDisplay = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
`;

const TierPriceDisplay = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => props.$color || "#6e6e73"};
  margin-bottom: 10px;
`;

const TierDescription = styled.p`
  font-size: 0.85rem;
  color: #6e6e73;
  line-height: 1.4;
  margin-bottom: 20px;
  min-height: 38px;

  @media (max-width: 900px) {
    min-height: auto;
  }
`;

const FeatureListClean = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeatureItemClean = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9rem;
  color: #4b5563;
  font-weight: 400;

  svg {
    margin-top: 2px;
    flex-shrink: 0;
    opacity: 0.8;
  }
`;

const FAQSection = styled.section`
  padding: 80px 0;
`;

const FAQContainer = styled(GlassCard)`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.7);

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

const FAQItem = styled.div`
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  &:last-child {
    border-bottom: none;
  }
`;

const FAQButton = styled.button`
  width: 100%;
  padding: 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  color: #1d1d1f;

  &:hover {
    color: #000;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FAQAnswer = styled(m.div)`
  overflow: hidden;
  color: #6e6e73;
  font-size: 14px;
  line-height: 1.6;
`;

// --- Main Component ---
const BusinessWelcomePage = () => {
  const router = useRouter();

  // --- State Hooks ---
  const [activeItems, setActiveItems] = useState(new Set(["1"]));
  const [hoveredMockup, setHoveredMockup] = useState(null);
  const [activeTierIndex, setActiveTierIndex] = useState(1);

  // --- Data ---
  const { mockupItems, comparisonData, growthPathData, faqData, testimonials } =
    useMemo(
      () => ({
        mockupItems: [
          {
            title: "Bookings",
            description:
              "Visualize trends, pinpoint popular experiences, and optimize your schedule.",
            image: "/Desert Titanium.svg",
            delay: 0,
          },
          {
            title: "Insights",
            description:
              "Track every dollar. Visualize growth trends and instantly identify profitable time slots.",
            image: "/Desert Titanium 3.svg",
            delay: 0.1,
          },
          {
            title: "Earnings",
            description:
              "Get paid with confidence. Track earnings in real-time and access clear payout history.",
            image: "/Desert Titanium 2.svg",
            delay: 0.2,
          },
        ],
        comparisonData: [
          {
            feature: "Commission Rate",
            others: "20-30% + Fees",
            classEasily: "17% All-Inclusive",
            highlight: true,
          },
          {
            feature: "Monthly Subscription",
            others: "$50 - $200/mo",
            classEasily: "Free Forever",
            highlight: true,
          },
          {
            feature: "Payout Speed",
            others: "3-7 Days",
            classEasily: "Next Day",
            highlight: false,
          },
          {
            feature: "Built-in Marketing",
            others: <X size={16} />,
            classEasily: <Check size={16} color="#10b981" />,
            highlight: false,
          },
          {
            feature: "Host Support",
            others: "Email Only",
            classEasily: "24/7 Priority",
            highlight: false,
          },
        ],
        growthPathData: [
          {
            title: "Starter",
            price: "Free",
            description:
              "For managing existing contacts and organizing schedules.",
            iconColor: "#6b7280",
            features: [
              "CRM contact import",
              "Guest notes & tags",
              "Manual scheduling",
              "Basic profile page",
            ],
          },
          {
            title: "Growth",
            price: "~6% Processing",
            description:
              "Booking widgets for your site and automated payments.",
            iconColor: "#0284c7",
            features: [
              "Embeddable widget",
              "Automated SMS reminders",
              "Secure payment processing",
              "Calendar syncing",
            ],
          },
          {
            title: "Partner",
            price: "~17% Marketplace",
            description:
              "Unlock marketplace distribution and we bring you customers.",
            iconColor: "#f81e3e",
            features: [
              "Full marketplace listing",
              "Active marketing campaigns",
              "SEO & Discovery boost",
              "Next-day payouts",
              "Priority support",
            ],
          },
        ],
        faqData: [
          {
            key: "1",
            question: "How does hosting work?",
            answer:
              "We connect local experts with guests seeking <strong>fun experiences</strong>. Whether it's axe throwing, wine tasting, or sushi making, you list it, set your schedule, and we handle the rest.",
          },
          {
            key: "2",
            question: "I use other platforms. Can I host here too?",
            answer:
              "Absolutely. Many of our hosts list on multiple platforms. However, our <strong>exclusive partner program</strong> offers lower fees for exclusive hosts.",
          },
          {
            key: "3",
            question: "What type of experiences can I list?",
            answer:
              "We focus on <strong>social, fun experiences</strong>. Archery, mixology classes, pottery, painting nights, and local tours perform exceptionally well.",
          },
          {
            key: "4",
            question: "When do I get paid?",
            answer:
              "We know cash flow is king for small businesses. Funds are transferred to your connected bank account the <strong>very next day</strong> after the experience is completed.",
          },
        ],
        testimonials: [
          {
            text: "I used to spend hours on spreadsheets. Now I just focus on my pottery students. The platform handles the rest.",
            author: "Linda M.",
            title: "Pottery Host",
            iconSrc: "https://cdn.lordicon.com/jazzayho.json",
          },
          {
            text: "The exposure is incredible. My weekend cooking workshops are booked out weeks in advance.",
            author: "Carlos G.",
            title: "Culinary Host",
            iconSrc: "https://cdn.lordicon.com/xmoniccu.json",
          },
          {
            text: "Finally, a platform that doesn't charge me a monthly fee. I only pay when I actually earn.",
            author: "Sophie T.",
            title: "Art Instructor",
            iconSrc: "https://cdn.lordicon.com/rhmhivzj.json",
          },
        ],
      }),
      []
    );

  const handleNavigate = useCallback(() => {
    router.push("/business/register");
  }, [router]);

  const toggleItem = useCallback((key) => {
    setActiveItems((prev) => {
      const newActive = new Set(prev);
      if (newActive.has(key)) newActive.delete(key);
      else newActive.add(key);
      return newActive;
    });
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <PageWrapper>
        <GlobalStyle />
        <ExploreHeader showOptionsWrapper={false} />

        <main>
          {/* 1. Hero Section */}
          <HeroSection>
            <SectionContainer>
              <HeroGrid>
                <HeroTextContainer
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <HeroTitle>
                    Host experiences,
                    <br />
                    <span>earn on your terms.</span>
                  </HeroTitle>
                  <HeroSubtitle>
                    Turn your passion into a business. Join our other hosts who
                    use our platform to manage bookings, reach more guests, and
                    simplify their life.
                  </HeroSubtitle>
                  <StartButton onClick={handleNavigate}>
                    Become a Host <ArrowRight size={18} />
                  </StartButton>
                </HeroTextContainer>

                <HeroVisualContainer
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {/* OPTIMIZATION: sizes prop added to prevent full res load on mobile */}
                  {/* NOTE: Convert this SVG to WebP for massive LCP improvement */}
                  <Image
                    src="/Frame 1597880366.svg"
                    alt="Host Dashboard Preview"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </HeroVisualContainer>
              </HeroGrid>
            </SectionContainer>
          </HeroSection>

          {/* 2. Value & Comparison */}
          <ValuePropSection>
            <SectionContainer>
              <SectionHeader $center>
                <SectionEyebrow>WHY CHOOSE US</SectionEyebrow>
                <SectionTitle>Built for your bottom line</SectionTitle>
                <SectionSubtitle $center>
                  We only succeed when you do. Experience a fairer way to host.
                </SectionSubtitle>
              </SectionHeader>

              <GridThree className="no-scrollbar">
                <ValueCard>
                  <IconCircle>
                    <lord-icon
                      src="https://cdn.lordicon.com/pmawqxvu.json"
                      trigger="in"
                      state="in-reveal"
                      style={{ width: "44px", height: "44px" }}
                    ></lord-icon>
                  </IconCircle>
                  <ValueTitle>0% Listing Fees</ValueTitle>
                  <ValueDesc>
                    Keep 100% of your earnings minus standard processing fees.
                    We don't charge you to exist on our platform.
                  </ValueDesc>
                </ValueCard>
                <ValueCard>
                  <IconCircle>
                    <lord-icon
                      src="https://cdn.lordicon.com/rhmhivzj.json"
                      trigger="in"
                      state="in-reveal"
                      style={{ width: "44px", height: "44px" }}
                    ></lord-icon>
                  </IconCircle>
                  <ValueTitle>Next Day Payouts</ValueTitle>
                  <ValueDesc>
                    Cash flow matters. Get paid the very next day after your
                    experience completes. No more waiting weeks for funds.
                  </ValueDesc>
                </ValueCard>
                <ValueCard>
                  <IconCircle>
                    <lord-icon
                      src="https://cdn.lordicon.com/mlwdofpz.json"
                      trigger="hover"
                      style={{ width: "44px", height: "44px" }}
                    ></lord-icon>
                  </IconCircle>
                  <ValueTitle>Marketing Included</ValueTitle>
                  <ValueDesc>
                    We actively market your experiences to thousands of local
                    guests looking for something fun to do.
                  </ValueDesc>
                </ValueCard>
              </GridThree>

              <ComparisonTableWrapper>
                <ComparisonHeader>
                  <div>Feature</div>
                  <div style={{ textAlign: "center" }}>Others</div>
                  <div style={{ textAlign: "center", color: "#f81e3e" }}>
                    ClassEasily
                  </div>
                </ComparisonHeader>
                {comparisonData.map((row) => (
                  <ComparisonRow key={row.feature}>
                    <ComparisonFeature>{row.feature}</ComparisonFeature>
                    <ComparisonValue $good={false} data-label="Others">
                      {row.others}
                    </ComparisonValue>
                    <ComparisonValue
                      $good={true}
                      $highlight={row.highlight}
                      data-label="ClassEasily"
                    >
                      {row.classEasily}
                    </ComparisonValue>
                  </ComparisonRow>
                ))}
              </ComparisonTableWrapper>
            </SectionContainer>
          </ValuePropSection>

          {/* 3. Dashboard Mockups */}
          <DashboardSection>
            <SectionContainer>
              <SectionHeader $center>
                <SectionEyebrow>HOST TOOLS</SectionEyebrow>
                <SectionTitle>Manage everything in one place</SectionTitle>
                <SectionSubtitle $center>
                  From scheduling events to tracking your payouts, our dashboard
                  gives you the clarity you need.
                </SectionSubtitle>
              </SectionHeader>

              <MockupGrid onMouseLeave={() => setHoveredMockup(null)}>
                {mockupItems.map((item, index) => {
                  const isHovered = hoveredMockup === index;
                  const isInactive = hoveredMockup !== null && !isHovered;

                  return (
                    <MockupItem
                      key={index}
                      onMouseEnter={() => setHoveredMockup(index)}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      animate={{
                        scale: isHovered ? 1.01 : isInactive ? 0.99 : 1,
                        opacity: isInactive ? 0.3 : 1,
                        y: isHovered ? -10 : 0,
                        filter: isInactive ? "blur(0px)" : "blur(0px)",
                        zIndex: isHovered ? 10 : 0,
                      }}
                      transition={{
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1.0],
                      }}
                    >
                      <MockupImageWrapper>
                        {/* OPTIMIZATION: sizes prop added to avoid large image downloads on mobile */}
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </MockupImageWrapper>
                      <div>
                        <MockupTitle>{item.title}</MockupTitle>
                        <MockupDesc>{item.description}</MockupDesc>
                      </div>
                    </MockupItem>
                  );
                })}
              </MockupGrid>
            </SectionContainer>
          </DashboardSection>

          {/* 4. Testimonials */}
          <TestimonialsSection>
            <SectionContainer>
              <SectionHeader $center>
                <SectionEyebrow>TESTIMONIALS</SectionEyebrow>
                <SectionTitle>What hosts are saying</SectionTitle>
              </SectionHeader>
              <ReviewGrid className="no-scrollbar">
                {testimonials.map((t, i) => (
                  <ReviewItem
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AnimatedIconWrapper>
                      <lord-icon
                        src={t.iconSrc}
                        trigger="hover"
                        style={{ width: "40px", height: "40px" }}
                      ></lord-icon>
                    </AnimatedIconWrapper>
                    <ReviewText>{t.text}</ReviewText>
                    <ReviewAuthor>
                      {t.author} <span>— {t.title}</span>
                    </ReviewAuthor>
                  </ReviewItem>
                ))}
              </ReviewGrid>
            </SectionContainer>
          </TestimonialsSection>

          {/* 5. Tiers / Growth Path */}
          <TierSection>
            <SectionContainer>
              <SectionHeader $center>
                <SectionEyebrow>FLEXIBILITY</SectionEyebrow>
                <SectionTitle>Scale at your own pace</SectionTitle>
                <SectionSubtitle $center>
                  Start with free tools to manage your contacts, or unlock the
                  full marketplace power.
                </SectionSubtitle>
              </SectionHeader>

              {/* Desktop Grid Layout */}
              <CleanTierGrid>
                {growthPathData.map((tier, i) => (
                  <CleanTierColumn key={i}>
                    <TierHeaderSimple>
                      <TierTitleDisplay>{tier.title}</TierTitleDisplay>
                      <TierPriceDisplay $color={tier.iconColor}>
                        {tier.price}
                      </TierPriceDisplay>
                      <TierDescription>{tier.description}</TierDescription>
                    </TierHeaderSimple>
                    <FeatureListClean>
                      {tier.features.map((feat, idx) => (
                        <FeatureItemClean key={idx}>
                          <Check size={16} color={tier.iconColor} />
                          {feat}
                        </FeatureItemClean>
                      ))}
                    </FeatureListClean>
                  </CleanTierColumn>
                ))}
              </CleanTierGrid>

              {/* Mobile Tabbed Layout */}
              <MobileTabContainer>
                <TabList>
                  {growthPathData.map((tier, i) => (
                    <React.Fragment key={i}>
                      {activeTierIndex === i && (
                        <TabIndicator
                          layoutId="tabIndicator"
                          style={{
                            width: `${100 / 3}%`,
                            left: `${(i * 100) / 3}%`,
                          }}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      <TabButton
                        $active={activeTierIndex === i}
                        onClick={() => setActiveTierIndex(i)}
                      >
                        {tier.title}
                      </TabButton>
                    </React.Fragment>
                  ))}
                </TabList>

                <AnimatePresence mode="wait">
                  <MobileTabContent
                    key={activeTierIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TierHeaderSimple>
                      <TierPriceDisplay
                        $color={growthPathData[activeTierIndex].iconColor}
                        style={{
                          marginBottom: 4,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {growthPathData[activeTierIndex].price}
                      </TierPriceDisplay>
                      <TierTitleDisplay style={{ fontSize: "1.6rem" }}>
                        {growthPathData[activeTierIndex].title}
                      </TierTitleDisplay>
                      <TierDescription style={{ marginBottom: 24 }}>
                        {growthPathData[activeTierIndex].description}
                      </TierDescription>
                    </TierHeaderSimple>
                    <FeatureListClean>
                      {growthPathData[activeTierIndex].features.map(
                        (feat, idx) => (
                          <FeatureItemClean
                            key={idx}
                            style={{ fontSize: "1rem", gap: 12 }}
                          >
                            <Check
                              size={20}
                              color={growthPathData[activeTierIndex].iconColor}
                            />
                            {feat}
                          </FeatureItemClean>
                        )
                      )}
                    </FeatureListClean>
                  </MobileTabContent>
                </AnimatePresence>
              </MobileTabContainer>
            </SectionContainer>
          </TierSection>

          {/* 6. FAQ Section */}
          <FAQSection>
            <SectionContainer>
              <SectionHeader $center>
                <SectionTitle>Your questions, answered</SectionTitle>
              </SectionHeader>
              <FAQContainer>
                {faqData.map((item) => {
                  const isOpen = activeItems.has(item.key);
                  return (
                    <FAQItem key={item.key}>
                      <FAQButton onClick={() => toggleItem(item.key)}>
                        {item.question}
                        {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                      </FAQButton>
                      <AnimatePresence>
                        {isOpen && (
                          <FAQAnswer
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div
                              style={{ paddingBottom: 24 }}
                              dangerouslySetInnerHTML={{ __html: item.answer }}
                            />
                          </FAQAnswer>
                        )}
                      </AnimatePresence>
                    </FAQItem>
                  );
                })}
              </FAQContainer>
            </SectionContainer>
          </FAQSection>
        </main>

        <FooterClient />
      </PageWrapper>
    </LazyMotion>
  );
};

export default memo(BusinessWelcomePage);
