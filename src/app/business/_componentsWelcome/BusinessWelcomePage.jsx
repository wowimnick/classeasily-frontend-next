"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
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
  Calculator,
  PiggyBank,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  BookOpen,
  BarChart,
  DollarSign,
  CreditCard,
  Briefcase,
  Sparkles,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

// Import components (adjust paths as needed)
import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// --- Global Animations & Styles ---

const GlobalStyle = createGlobalStyle`
  :root {
    --glass-border: 1px solid rgba(255, 255, 255, 0.4);
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    --primary-color: #222222;
    --accent-red: #dc2626;
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Styled Components ---

const PageWrapper = styled.div`
  position: relative;
  background-color: #ffffff;
  color: #222222;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  overflow-x: hidden;

  /* Apple-style subtle mesh background */
  &::before {
    content: "";
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
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
  max-width: 1100px; /* Slightly tighter container for compact look */
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
  min-height: 85vh;
  padding-top: 140px;
  padding-bottom: 60px;
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

const HeroVisualContainer = styled(GlassCard)`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);

  img {
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    width: 100%;
    height: auto;
    object-fit: cover;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #1d1d1f;

  span {
    background: linear-gradient(135deg, #222, #555);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.125rem; /* ~18px */
  color: #6e6e73; /* Apple gray */
  max-width: 460px;
  margin-bottom: 32px;
  line-height: 1.5;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 0.95rem; /* ~15px on mobile */
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
  font-size: 0.95rem;
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

// --- Dashboard / Features Section ---
const DashboardSection = styled.section`
  padding: 5rem 0;
  position: relative;
`;

const TabsWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 32px 0;
  flex-wrap: wrap;
`;

const TabButton = styled(motion.button)`
  padding: 10px 20px;
  background: ${(props) =>
    props.$active ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.5)"};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid
    ${(props) => (props.$active ? "transparent" : "rgba(0,0,0,0.05)")};
  border-radius: 99px;
  color: ${(props) => (props.$active ? "#ffffff" : "#6e6e73")};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 0.85rem; /* Compact */

  &:hover {
    background: ${(props) =>
      props.$active ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.8)"};
  }
`;

const EmblaWrapper = styled(GlassCard)`
  border-radius: 20px;
  overflow: hidden;
  padding: 8px; /* Internal frame */
  background: rgba(255, 255, 255, 0.5);
`;

const EmblaContainer = styled.div`
  display: flex;
  border-radius: 16px;
  overflow: hidden;
`;

const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
  position: relative;
  width: 100%;

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 12px;
  }
`;

// --- Cost & Comparison Section ---
const TwoColumnSection = styled.section`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  padding: 80px 0;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 60px 0;
  }
`;

const StickyRightColumn = styled.div`
  position: sticky;
  top: 140px;
  height: auto;
`;

const SectionHeader = styled.div`
  margin-bottom: 32px;
  text-align: ${(props) => (props.$center ? "center" : "left")};
`;

const SectionEyebrow = styled.p`
  color: #007aff; /* Apple Blue or Accent Red */
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
  font-size: 1.05rem; /* ~17px desktop */
  color: #6e6e73;
  line-height: 1.5;
  max-width: ${(props) => (props.$center ? "600px" : "100%")};
  margin: ${(props) => (props.$center ? "0 auto" : "0")};

  @media (max-width: 768px) {
    font-size: 0.9rem; /* ~14px mobile */
  }
`;

const ContentBlock = styled.div`
  margin-bottom: 100px;
  &:last-child {
    margin-bottom: 0;
  }
`;

// --- Modern Glass Ledger ---
const SavingsLedger = styled(GlassCard)`
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
`;

const LedgerRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  &.total {
    background: rgba(220, 38, 38, 0.03); /* Subtle tint */
    margin-top: 0;
  }
`;

const LedgerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LedgerIconBox = styled.div`
  background: #fff;
  color: #1d1d1f;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
`;

const LedgerTextContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const LedgerTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
`;

const LedgerDesc = styled.p`
  font-size: 0.8rem;
  color: #6e6e73;
  margin: 2px 0 0;
`;

const LedgerAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1d1d1f;
  font-variant-numeric: tabular-nums;

  &.highlight {
    color: #dc2626;
    font-size: 1.15rem;
    font-weight: 700;
  }
`;

// --- Glass Comparison Table ---
const ComparisonTableWrapper = styled(GlassCard)`
  padding: 0;
  background: rgba(255, 255, 255, 0.7);
`;

const ComparisonRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 18px 24px;
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

const ComparisonFeature = styled.div`
  font-weight: 500;
  color: #1d1d1f;
  font-size: 0.9rem;
`;

const ComparisonValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: ${(props) => (props.$good ? "#10b981" : "#6e6e73")};
  font-weight: ${(props) => (props.$good ? "600" : "400")};
  justify-content: center;

  @media (max-width: 600px) {
    justify-content: flex-start;
    width: 100%;
    padding-left: 12px;
    border-left: 2px solid ${(props) => (props.$good ? "#10b981" : "#e5e7eb")};
  }
`;

// --- Visual CSS-only Graphic for Comparison ---
const SavingsVisualCard = styled(GlassCard)`
  padding: 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8),
    rgba(255, 255, 255, 0.4)
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  min-height: 400px;
`;

const VisualCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e31c5f, #ff758c);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(227, 28, 95, 0.3);
  animation: ${float} 6s ease-in-out infinite;
`;

const VisualLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
`;

const VisualSub = styled.div`
  font-size: 0.8rem;
  color: #6e6e73;
`;

// --- Tier Section ---
const TierSection = styled.section`
  padding: 80px 0;
`;

const TierCard = styled(GlassCard)`
  background: rgba(255, 255, 255, 0.7);
  overflow: hidden;
`;

const TierTable = styled.div`
  width: 100%;
`;

const TierRow = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:first-child {
    background: rgba(0, 0, 0, 0.02);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6e6e73;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1.25rem;
    border-bottom: 4px solid rgba(0, 0, 0, 0.02);

    &:first-child {
      display: none;
    }
  }
`;

const TierCell = styled.div`
  text-align: ${(props) => (props.$align === "left" ? "left" : "center")};
  font-weight: ${(props) => (props.$bold ? "600" : "400")};
  color: ${(props) => (props.$bold ? "#1d1d1f" : "#4b5563")};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.$align === "left" ? "flex-start" : "center"};
  gap: 0.5rem;

  @media (max-width: 768px) {
    justify-content: space-between;
    width: 100%;
    font-size: 0.85rem;

    &::before {
      content: attr(data-label);
      font-weight: 600;
      color: #9ca3af;
      font-size: 0.8rem;
    }
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
  font-size: 0.95rem;
  line-height: 1.6;
`;

// --- Main Component ---
const BusinessWelcomePage = () => {
  const router = useRouter();

  // --- State Hooks ---
  const [activeItems, setActiveItems] = useState(new Set(["1"]));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // --- Data ---
  const {
    navigationItems,
    tabContent,
    savingsData,
    comparisonData,
    tierComparisonData,
    faqData,
    testimonials,
  } = useMemo(
    () => ({
      navigationItems: [
        {
          key: "bookings",
          icon: <BookOpen size={18} />,
          label: "Bookings",
        },
        {
          key: "analytics",
          icon: <BarChart size={18} />,
          label: "Insights",
        },
        {
          key: "revenue",
          icon: <DollarSign size={18} />,
          label: "Earnings",
        },
        {
          key: "payouts",
          icon: <CreditCard size={18} />,
          label: "Payouts",
        },
        {
          key: "staff",
          icon: <Briefcase size={18} />,
          label: "Team",
        },
      ],
      tabContent: [
        {
          image: "https://i.imgur.com/v93lOsv.png",
          description:
            "Your command center. Instantly gauge your hosting health with a powerful overview of revenue.",
        },
        {
          image: "https://i.imgur.com/DMdHsU5.png",
          description:
            "Visualize booking trends, pinpoint popular experiences, and optimize your schedule.",
        },
        {
          image: "https://i.imgur.com/tOAgKBg.png",
          description:
            "Track every dollar. Visualize growth trends and instantly identify profitable workshops.",
        },
        {
          image: "https://i.imgur.com/4Mf4uee.png",
          description:
            "Get paid with confidence. Track earnings in real-time and access clear payout history.",
        },
        {
          image: "https://i.imgur.com/ljYW979.png",
          description:
            "Empower your team. Invite co-hosts, manage access roles, and maintain control.",
        },
      ],
      savingsData: [
        {
          icon: <Calculator size={18} />,
          title: "No Setup Costs",
          description: "Zero upfront fees or subscriptions.",
          amount: "$1,200",
        },
        {
          icon: <PiggyBank size={18} />,
          title: "Admin Efficiency",
          description: "Automated bookings save you hours.",
          amount: "$4,800",
        },
        {
          icon: <TrendingUp size={18} />,
          title: "Guest Reach",
          description: "Attract more guests automatically.",
          amount: "$2,000",
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
          feature: "Payment Speed",
          others: "3-5 Days",
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
      tierComparisonData: [
        {
          feature: "Guest CRM Storage",
          imported: true,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Guest Notes",
          imported: true,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Smart Scheduling",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Automated Reminders",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Payment Processing",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Marketing / Discovery",
          imported: false,
          widget: false,
          marketplace: true,
        },
        {
          feature: "Fee Structure",
          imported: "Free",
          widget: "~6%",
          marketplace: "~17%",
        },
      ],
      faqData: [
        {
          key: "1",
          question: "How does hosting work?",
          answer:
            "We connect local experts with guests seeking unique experiences. You list your workshop, set your schedule, and we handle the bookings and payments.",
        },
        {
          key: "2",
          question: "I use other platforms. Can I host here too?",
          answer:
            "Absolutely. Many of our hosts list on multiple platforms. However, our <strong>exclusive partner program</strong> offers lower fees for exclusive hosts.",
        },
        {
          key: "3",
          question: "What experiences can I list?",
          answer:
            "We focus on <strong>interactive workshops</strong>. Pottery, cooking, painting, coding bootcamps, and more.",
        },
        {
          key: "4",
          question: "When do I get paid?",
          answer:
            "Funds are transferred to your connected bank account automatically after the experience is completed.",
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

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => emblaApi.off("select", onSelect).off("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <PageWrapper>
      <GlobalStyle />
      <Header />

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
                  src="/Group 1.svg"
                  alt="Host Dashboard Preview"
                  width={800}
                  height={600}
                  priority
                />
              </HeroVisualContainer>
            </HeroGrid>
          </SectionContainer>
        </HeroSection>

        {/* --- Dashboard Preview --- */}
        <DashboardSection>
          <SectionContainer>
            <SectionHeader $center>
              <SectionEyebrow>HOST TOOLS</SectionEyebrow>
              <SectionTitle>Manage everything in one place</SectionTitle>
              <SectionSubtitle $center>
                From scheduling workshops to tracking your payouts, our
                dashboard gives you the clarity you need.
              </SectionSubtitle>
            </SectionHeader>

            <TabsWrapper>
              {navigationItems.map((item, index) => (
                <TabButton
                  key={item.key}
                  $active={index === selectedIndex}
                  onClick={() => scrollTo(index)}
                >
                  {item.icon}
                  {item.label}
                </TabButton>
              ))}
            </TabsWrapper>

            <EmblaWrapper>
              <EmblaContainer ref={emblaRef}>
                {tabContent.map((content, index) => (
                  <EmblaSlide key={index}>
                    <Image
                      src={content.image}
                      alt={navigationItems[index].label}
                      width={1440}
                      height={900}
                    />
                  </EmblaSlide>
                ))}
              </EmblaContainer>
            </EmblaWrapper>

            <motion.p
              key={selectedIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                marginTop: 24,
                color: "#6e6e73",
                fontSize: "0.95rem",
              }}
            >
              {tabContent[selectedIndex].description}
            </motion.p>
          </SectionContainer>
        </DashboardSection>

        {/* --- Split Section (Savings & Comparison) --- */}
        <SectionContainer>
          <TwoColumnSection>
            <div>
              {/* Cost Block */}
              <ContentBlock>
                <SectionHeader>
                  <SectionEyebrow>EARNINGS</SectionEyebrow>
                  <SectionTitle>Keep more of what you earn</SectionTitle>
                  <SectionSubtitle>
                    No monthly subscriptions. No setup fees. We only make money
                    when you get a booking.
                  </SectionSubtitle>
                </SectionHeader>

                <SavingsLedger>
                  {savingsData.map((item, i) => (
                    <LedgerRow key={i}>
                      <LedgerInfo>
                        <LedgerIconBox>{item.icon}</LedgerIconBox>
                        <LedgerTextContent>
                          <LedgerTitle>{item.title}</LedgerTitle>
                          <LedgerDesc>{item.description}</LedgerDesc>
                        </LedgerTextContent>
                      </LedgerInfo>
                      <LedgerAmount>{item.amount}</LedgerAmount>
                    </LedgerRow>
                  ))}
                  <LedgerRow className="total">
                    <LedgerInfo>
                      <LedgerIconBox
                        style={{ color: "#dc2626", background: "#fff5f5" }}
                      >
                        <Sparkles size={18} />
                      </LedgerIconBox>
                      <LedgerTextContent>
                        <LedgerTitle style={{ color: "#dc2626" }}>
                          Annual Potential Savings
                        </LedgerTitle>
                      </LedgerTextContent>
                    </LedgerInfo>
                    <LedgerAmount className="highlight">$8,000+</LedgerAmount>
                  </LedgerRow>
                </SavingsLedger>
              </ContentBlock>

              {/* Comparison Block */}
              <ContentBlock>
                <SectionHeader>
                  <SectionEyebrow>COMPARISON</SectionEyebrow>
                  <SectionTitle>Fairer than the rest</SectionTitle>
                  <SectionSubtitle>
                    See how our host-first model stacks up against traditional
                    platforms.
                  </SectionSubtitle>
                </SectionHeader>

                <ComparisonTableWrapper>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr",
                      padding: "16px 24px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#999",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>Feature</div>
                    <div style={{ textAlign: "center" }}>Others</div>
                    <div style={{ textAlign: "center", color: "#dc2626" }}>
                      Us
                    </div>
                  </div>
                  {comparisonData.map((row) => (
                    <ComparisonRow key={row.feature}>
                      <ComparisonFeature>{row.feature}</ComparisonFeature>
                      <ComparisonValue $good={false}>
                        {row.others}
                      </ComparisonValue>
                      <ComparisonValue $good={true}>
                        {row.classEasily}
                      </ComparisonValue>
                    </ComparisonRow>
                  ))}
                </ComparisonTableWrapper>
              </ContentBlock>
            </div>

            {/* Sticky Graphic - Replaced Lottie with CSS Visual */}
            <StickyRightColumn>
              <SavingsVisualCard
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <VisualCircle>0%</VisualCircle>
                <VisualLabel>Listing Fees</VisualLabel>
                <VisualSub>
                  You keep 100% of your earnings minus standard processing.
                </VisualSub>
                <div
                  style={{
                    height: 1,
                    width: 60,
                    background: "#ddd",
                    margin: "24px 0",
                  }}
                />
                <VisualLabel>Next Day Payouts</VisualLabel>
                <VisualSub>Cash flow that moves as fast as you do.</VisualSub>
              </SavingsVisualCard>
            </StickyRightColumn>
          </TwoColumnSection>
        </SectionContainer>

        {/* --- Tiers --- */}
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

            <TierCard>
              <TierTable>
                <TierRow>
                  <TierCell $align="left">Feature</TierCell>
                  <TierCell>Import Only</TierCell>
                  <TierCell>Widget</TierCell>
                  <TierCell>Marketplace</TierCell>
                </TierRow>
                {tierComparisonData.map((row) => (
                  <TierRow key={row.feature}>
                    <TierCell $align="left" $bold>
                      {row.feature}
                    </TierCell>
                    <TierCell data-label="Import Only">
                      {row.imported === true ? (
                        <Check size={18} color="#10b981" />
                      ) : row.imported === false ? (
                        <Minus size={18} color="#e5e7eb" />
                      ) : (
                        row.imported
                      )}
                    </TierCell>
                    <TierCell data-label="Widget">
                      {row.widget === true ? (
                        <Check size={18} color="#10b981" />
                      ) : row.widget === false ? (
                        <Minus size={18} color="#e5e7eb" />
                      ) : (
                        row.widget
                      )}
                    </TierCell>
                    <TierCell data-label="Marketplace">
                      {row.marketplace === true ? (
                        <Check size={18} color="#10b981" />
                      ) : row.marketplace === false ? (
                        <Minus size={18} color="#e5e7eb" />
                      ) : (
                        row.marketplace
                      )}
                    </TierCell>
                  </TierRow>
                ))}
              </TierTable>
            </TierCard>
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
