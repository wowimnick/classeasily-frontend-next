"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Check,
  X,
  ArrowRight,
  BookOpen,
  BarChart,
  DollarSign,
  Briefcase,
  Zap,
  Globe,
  Calendar,
  Users,
  Layout,
  ChevronRight,
} from "lucide-react";

// Import components (adjust paths as needed)
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
`;

// --- Styled Components ---

const PageWrapper = styled.div`
  position: relative;
  background-color: #ffffff;
  color: #222222;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;

  /* Apple-style subtle mesh background */
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

// --- Glassmorphism Card Mixin ---
const GlassCard = styled(motion.div)`
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 24px;
`;

// --- Hero Section ---
const HeroSection = styled.section`
  min-height: 60vh;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  align-items: center;
  position: relative;

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

const HeroTextContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 1024px) {
    align-items: center;
  }
`;

const HeroVisualContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3.1;
  border-radius: 24px;
  box-shadow: rgb(0 0 0 / 1%) 0px 20px 20px 0px;
  overflow: hidden;

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
    background: #1d1d1f;
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
`;

// --- Dashboard / Mockups Section ---
const DashboardSection = styled.section`
  padding: 4rem 0 !important;
  position: relative;
`;

const MockupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 48px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

const MockupItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MockupImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #f5f5f7;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  img {
    object-fit: cover;
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

// --- Redesigned Cost & Comparison Section ---
const ValuePropSection = styled.section`
  padding: 80px 0;
`;

const GridThree = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ValueCard = styled(GlassCard)`
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.6);
`;

const IconCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: #f81e3e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
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

// --- Comparison Table ---
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
  }
`;

const ComparisonHeader = styled(ComparisonRow)`
  background: rgba(0, 0, 0, 0.02);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6e6e73;
  font-weight: 600;
`;

const ComparisonFeature = styled.div`
  font-weight: 600;
  color: #1d1d1f;
  font-size: 14px;
`;

const ComparisonValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: ${(props) => (props.$good ? "#10b981" : "#6e6e73")};
  font-weight: ${(props) => (props.$good ? "600" : "400")};

  /* Special Highlight Text */
  ${(props) =>
    props.$highlight &&
    `
    color: #f81e3e;
    font-weight: 700;
  `}

  @media (max-width: 600px) {
    justify-content: flex-start;
    width: 100%;
    padding-left: 12px;
    border-left: 2px solid ${(props) => (props.$good ? "#10b981" : "#e5e7eb")};
  }
`;

// --- Tier Section (Redesigned - No Cards) ---
const TierSection = styled.section`
  padding: 80px 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(248, 30, 62, 0.03) 100%
  );
`;

const TierContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: flex-start;
  gap: 20px;
  margin-top: 60px;

  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
`;

const TierColumn = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  flex: 1;

  @media (max-width: 900px) {
    width: 100%;
    padding: 0;
  }
`;

const TierHeader = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TierIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(props) => props.$bg || "#f5f5f7"};
  color: ${(props) => props.$color || "#1d1d1f"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
`;

const TierTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1d1d1f;
`;

const TierPrice = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => props.$color || "#6e6e73"};
  background: rgba(0, 0, 0, 0.04);
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
`;

const TierList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TierListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const TierSeparator = styled.div`
  height: 200px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.1),
    transparent
  );
  align-self: center;

  @media (max-width: 900px) {
    display: none; // Hide vertical lines on mobile
  }
`;

const MobileArrow = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    justify-content: center;
    color: #d1d5db;
    transform: rotate(90deg);
  }
`;

const DesktopArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  padding-top: 80px;

  @media (max-width: 900px) {
    display: none;
  }
`;

// --- Testimonials ---
const TestimonialsSection = styled.section`
  padding: 80px 0;
`;

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TestimonialCard = styled(GlassCard)`
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const QuoteText = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: #1d1d1f;
  margin-bottom: 24px;
  font-weight: 500;
`;

const AuthorBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorImg = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: #eee;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #1d1d1f;
  font-size: 0.9rem;
`;

const AuthorRole = styled.span`
  font-size: 0.8rem;
  color: #6e6e73;
`;

// --- FAQ ---
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

const FAQAnswer = styled(motion.div)`
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

  // --- Data ---
  const { mockupItems, comparisonData, growthPathData, faqData, testimonials } =
    useMemo(
      () => ({
        // Top 3 features for Mockups
        mockupItems: [
          {
            title: "Bookings",
            description:
              "Visualize trends, pinpoint popular experiences, and optimize your schedule.",
            image: "https://i.imgur.com/DMdHsU5.png",
            delay: 0,
          },
          {
            title: "Insights",
            description:
              "Track every dollar. Visualize growth trends and instantly identify profitable time slots.",
            image: "https://i.imgur.com/v93lOsv.png",
            delay: 0.1,
          },
          {
            title: "Earnings",
            description:
              "Get paid with confidence. Track earnings in real-time and access clear payout history.",
            image: "https://i.imgur.com/tOAgKBg.png",
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
        // New Data Structure for No-Card Tier Section
        growthPathData: [
          {
            title: "Import Only",
            price: "Free",
            icon: <Users size={24} />,
            iconBg: "#f3f4f6",
            iconColor: "#6b7280",
            features: [
              "Import existing CRM contacts",
              "Basic guest notes",
              "Manual scheduling",
              "Standard profile page",
            ],
          },
          {
            title: "Widget",
            price: "~6% Fees",
            icon: <Layout size={24} />,
            iconBg: "#e0f2fe",
            iconColor: "#0284c7",
            features: [
              "Embeddable booking widget",
              "Automated reminders",
              "Secure payment processing",
              "Calendar syncing",
            ],
          },
          {
            title: "Marketplace",
            price: "~17% Fees",
            icon: <Globe size={24} />,
            iconBg: "#fee2e2",
            iconColor: "#f81e3e",
            features: [
              "Full marketplace listing",
              "Active marketing & discovery",
              "SEO optimization",
              "Priority support",
              "Next-day payouts",
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
            avatar: "https://randomuser.me/api/portraits/women/45.jpg",
          },
          {
            text: "The exposure is incredible. My weekend cooking workshops are booked out weeks in advance.",
            author: "Carlos G.",
            title: "Culinary Host",
            avatar: "https://randomuser.me/api/portraits/men/23.jpg",
          },
          {
            text: "Finally, a platform that doesn't charge me a monthly fee just to exist. I only pay when I actually earn.",
            author: "Sophie T.",
            title: "Art Instructor",
            avatar: "https://randomuser.me/api/portraits/women/52.jpg",
          },
        ],
      }),
      []
    );

  // --- Callbacks ---
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
    <PageWrapper>
      <GlobalStyle />
      <ExploreHeader showOptionsWrapper={false} />

      <main>
        {/* --- Hero --- */}
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
                  Turn your passion into a business. Join thousands of hosts who
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
                <Image
                  src="/Frame 1597880366.svg"
                  alt="Host Dashboard Preview"
                  fill
                  priority
                />
              </HeroVisualContainer>
            </HeroGrid>
          </SectionContainer>
        </HeroSection>

        {/* --- Dashboard Mockups Section (Redesigned) --- */}
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

            <MockupGrid>
              {mockupItems.map((item, index) => (
                <MockupItem
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.5 }}
                >
                  <MockupImageWrapper>
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
              ))}
            </MockupGrid>
          </SectionContainer>
        </DashboardSection>

        {/* --- Value & Comparison Section --- */}
        <ValuePropSection>
          <SectionContainer>
            <SectionHeader $center>
              <SectionEyebrow>WHY CHOOSE US</SectionEyebrow>
              <SectionTitle>Built for your bottom line</SectionTitle>
              <SectionSubtitle $center>
                We only succeed when you do. Experience a fairer way to host.
              </SectionSubtitle>
            </SectionHeader>

            <GridThree>
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
                  Keep 100% of your earnings minus standard processing fees. We
                  don't charge you to exist on our platform.
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
                  <ComparisonValue $good={false}>{row.others}</ComparisonValue>
                  <ComparisonValue $good={true} $highlight={row.highlight}>
                    {row.classEasily}
                  </ComparisonValue>
                </ComparisonRow>
              ))}
            </ComparisonTableWrapper>
          </SectionContainer>
        </ValuePropSection>

        {/* --- Tier Section (Redesigned - Growth Path) --- */}
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

            <TierContainer>
              {/* Column 1 */}
              <TierColumn>
                <TierHeader>
                  <TierIconWrapper
                    $bg={growthPathData[0].iconBg}
                    $color={growthPathData[0].iconColor}
                  >
                    {growthPathData[0].icon}
                  </TierIconWrapper>
                  <TierTitle>{growthPathData[0].title}</TierTitle>
                  <TierPrice $color={growthPathData[0].iconColor}>
                    {growthPathData[0].price}
                  </TierPrice>
                </TierHeader>
                <TierList>
                  {growthPathData[0].features.map((feat, i) => (
                    <TierListItem key={i}>
                      <Check size={16} color="#9ca3af" /> {feat}
                    </TierListItem>
                  ))}
                </TierList>
              </TierColumn>

              <DesktopArrow>
                <ChevronRight size={24} />
              </DesktopArrow>
              <MobileArrow>
                <ChevronRight size={24} />
              </MobileArrow>

              {/* Column 2 */}
              <TierColumn>
                <TierHeader>
                  <TierIconWrapper
                    $bg={growthPathData[1].iconBg}
                    $color={growthPathData[1].iconColor}
                  >
                    {growthPathData[1].icon}
                  </TierIconWrapper>
                  <TierTitle>{growthPathData[1].title}</TierTitle>
                  <TierPrice $color={growthPathData[1].iconColor}>
                    {growthPathData[1].price}
                  </TierPrice>
                </TierHeader>
                <TierList>
                  {growthPathData[1].features.map((feat, i) => (
                    <TierListItem key={i}>
                      <Check size={16} color="#0284c7" /> {feat}
                    </TierListItem>
                  ))}
                </TierList>
              </TierColumn>

              <DesktopArrow>
                <ChevronRight size={24} />
              </DesktopArrow>
              <MobileArrow>
                <ChevronRight size={24} />
              </MobileArrow>

              {/* Column 3 */}
              <TierColumn>
                <TierHeader>
                  <TierIconWrapper
                    $bg={growthPathData[2].iconBg}
                    $color={growthPathData[2].iconColor}
                  >
                    {growthPathData[2].icon}
                  </TierIconWrapper>
                  <TierTitle>{growthPathData[2].title}</TierTitle>
                  <TierPrice $color={growthPathData[2].iconColor}>
                    {growthPathData[2].price}
                  </TierPrice>
                </TierHeader>
                <TierList>
                  {growthPathData[2].features.map((feat, i) => (
                    <TierListItem key={i}>
                      <Check size={16} color="#f81e3e" /> {feat}
                    </TierListItem>
                  ))}
                </TierList>
              </TierColumn>
            </TierContainer>
          </SectionContainer>
        </TierSection>

        {/* --- Testimonials --- */}
        <TestimonialsSection>
          <SectionContainer>
            <SectionHeader $center>
              <SectionTitle>Hosts love us</SectionTitle>
            </SectionHeader>
            <TestimonialGrid>
              {testimonials.map((t, i) => (
                <TestimonialCard
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <QuoteText>&ldquo;{t.text}&rdquo;</QuoteText>
                  <AuthorBlock>
                    <AuthorImg>
                      <Image
                        src={t.avatar}
                        alt={t.author}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </AuthorImg>
                    <AuthorDetails>
                      <AuthorName>{t.author}</AuthorName>
                      <AuthorRole>{t.title}</AuthorRole>
                    </AuthorDetails>
                  </AuthorBlock>
                </TestimonialCard>
              ))}
            </TestimonialGrid>
          </SectionContainer>
        </TestimonialsSection>

        {/* --- FAQ --- */}
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
  );
};

export default memo(BusinessWelcomePage);
