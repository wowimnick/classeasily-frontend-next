// app/business/page.js
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Check,
  X,
  ArrowRight,
  Quote,
  TrendingUp,
  Calculator,
  PiggyBank,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

// Lazy load heavy components
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        borderRadius: "34px",
      }}
    />
  ),
});

const GradientCanvas = dynamic(() => import("@/components/Gradient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        background: "#fff",
      }}
    />
  ),
});

// Import components (adjust paths as needed)
import Header from "@/components/layout/SharedMainClientHeader";
import Footer from "@/components/homepage/Footer";
import { LordIcon } from "@/services/ReactUtils";

// --- Styled Components ---
const PageWrapper = styled.div`
  position: relative;
  isolation: isolate;
  color: #1d1d1f;
`;

const HeroSection = styled.section`
  position: relative;
  min-height: 90vh;
  padding: 8rem 2rem 4rem;
  color: white;
  overflow: hidden;
  display: flex;
  align-items: center;

  &::before {
    content: "";
    position: absolute;
    top: -200px;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("https://bradfrost.com/wp-content/uploads/2017/05/workshop.jpg");
    background-size: cover;
    background-position: center;
    filter: blur(8px) brightness(0.7);
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    padding: 6rem 1rem 4rem;
  }
`;

const HeroGrid = styled.div`
  max-width: 1500px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: 4rem;
  width: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }
`;

const HeroTextContainer = styled(motion.div)`
  @media (max-width: 1024px) {
    order: 2;
  }
`;

const HeroAnimationContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: auto;

  @media (max-width: 1024px) {
    order: 1;
    margin-bottom: 2rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  letter-spacing: -0.035em;
  line-height: 1.1;
  color: #ffffff;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: rgba(255, 255, 255, 0.85);
  max-width: 550px;
  margin-bottom: 2.5rem;
  line-height: 1.6;
  @media (max-width: 1024px) {
    margin: 0 auto 2.5rem;
  }

  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const StartButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  height: 56px;
  padding: 0 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  will-change: transform, box-shadow, background-color;
  &:hover {
    background: #ef4444;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
  }

  @media (max-width: 768px) {
    height: 48px;
    padding: 0 24px;
    font-size: 0.9rem;
  }
`;

const DashboardSection = styled.section`
  padding: 6rem 2rem 8rem;
  background: #ffffff;
  mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);

  @media (max-width: 768px) {
    padding: 4rem 1rem 6rem;
  }
`;

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const TabsContainer = styled(motion.div)`
  display: flex;
  gap: 0.5rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.25rem;
    margin-top: 1.5rem;
  }
`;

const TabButton = styled(motion.button)`
  padding: 0.75rem 1.25rem;
  background: ${(props) => (props.$active ? "#dc2626" : "#ffffff")};
  border: 1px solid ${(props) => (props.$active ? "#dc2626" : "#e5e7eb")};
  border-radius: 12px;
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  &:hover {
    background: ${(props) => (props.$active ? "#ef4444" : "#f9fafb")};
    border-color: ${(props) => (props.$active ? "#ef4444" : "#d1d5db")};
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.25rem;
  }
`;

const EmblaWrapper = styled(motion.div)`
  margin-top: 2.5rem;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    margin-top: 1.5rem;
    border-radius: 12px;
  }
`;

const EmblaContainer = styled.div`
  display: flex;
`;

const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
`;

const TwoColumnSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  padding: 6rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  background: rgba(255, 255, 255, 0);
  justify-items: center;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 4rem 1rem;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8rem;

  @media (max-width: 1024px) {
    gap: 4rem;
  }
`;

const RightColumn = styled.div`
  position: sticky;
  top: 120px;
  height: 795px;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const ContentBlock = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 1024px) {
    min-height: auto;
    padding: 3rem 0;
  }
`;

const SectionHeader = styled(motion.div)`
  margin-bottom: 2.5rem;
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const SectionEyebrow = styled.p`
  color: #dc2626;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const SectionTitle = styled.h2`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1d1d1f;
  line-height: 1.2;
`;

const SectionSubtitle = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #6b7280;
  max-width: 550px;
  line-height: 1.6;
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const AnimationContainer = styled(motion.div)`
  width: fit-content;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 34px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.34);
  overflow: hidden;
`;

const SavingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const SavingsCard = styled.div`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
`;

const CardIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 0.5rem;
`;

const CardDescription = styled.p`
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0 0 0.75rem;
`;

const SavingsAmount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
`;

const ComparisonTableWrapper = styled.div`
  border-radius: 24px;
  overflow: hidden;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.34);
  margin-top: 2rem;
  @media (max-width: 768px) {
    border-radius: 12px;
    margin: 1.5rem 0.5rem 0;
  }
`;

const ComparisonHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  gap: 0.5rem;
  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr 1fr;
    padding: 1.5rem;
    gap: 0;
  }
`;

const HeaderCell = styled.div`
  font-weight: 700;
  color: #1d1d1f;
  text-align: center;
  font-size: clamp(0.75rem, 2vw, 0.95rem);
  &:first-child {
    text-align: left;
  }
`;

const ComparisonRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.2s ease;
  gap: 0.5rem;
  align-items: center;
  &:hover {
    background-color: #f9fafb;
  }
  &:last-child {
    border-bottom: none;
  }
  &.highlight-row {
    background: linear-gradient(
      135deg,
      rgba(220, 38, 38, 0.03) 0%,
      rgba(239, 68, 68, 0.03) 100%
    );
    border-left: 3px solid #dc2626;
    @media (min-width: 768px) {
      background: linear-gradient(
        135deg,
        rgba(220, 38, 38, 0.02) 0%,
        rgba(239, 68, 68, 0.02) 100%
      );
      border-left: 4px solid #dc2626;
    }
  }
  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr 1fr;
    padding: 1.25rem 1.5rem;
    gap: 0;
  }
`;

const FeatureCell = styled.div`
  color: #374151;
  font-weight: 500;
  font-size: clamp(0.7rem, 1.8vw, 0.9rem);
  line-height: 1.3;
  @media (min-width: 768px) {
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const ValueCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: ${(props) => (props.$isPositive ? "#10b981" : "#ef4444")};
  font-size: clamp(0.65rem, 1.6vw, 0.85rem);
  text-align: center;
  line-height: 1.2;
  @media (min-width: 768px) {
    font-size: 0.85rem;
    line-height: 1.3;
  }
`;

const CheckIcon = styled(Check)`
  color: #10b981;
  width: 16px;
  height: 16px;
  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
  }
`;

const XIcon = styled(X)`
  color: #ef4444;
  width: 16px;
  height: 16px;
  @media (min-width: 768px) {
    width: 20px;
    height: 20px;
  }
`;

const TierComparisonSection = styled.section`
  padding: 6rem 2rem;
  @media (max-width: 768px) {
    padding: 4rem 1rem;
  }
`;

const TierComparisonWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const TierTableWrapper = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin-top: 2.5rem;
  @media (max-width: 768px) {
    border-radius: 12px;
  }
`;

const TierTableHeader = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  gap: 1rem;
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const TierHeaderCell = styled.div`
  font-weight: 700;
  color: #1d1d1f;
  text-align: center;
  font-size: clamp(0.7rem, 2vw, 0.9rem);
  line-height: 1.3;
  &:first-child {
    text-align: left;
  }
`;

const TierTableRow = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.2s ease;
  gap: 1rem;
  align-items: center;
  &:hover {
    background-color: #f9fafb;
  }
  &:last-child {
    border-bottom: none;
  }
  @media (min-width: 768px) {
    padding: 1.25rem 1.5rem;
  }
`;

const TierFeatureCell = styled.div`
  color: #374151;
  font-weight: 500;
  font-size: clamp(0.75rem, 1.8vw, 0.9rem);
  line-height: 1.4;
`;

const TierValueCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #374151;
  font-size: clamp(0.75rem, 1.8vw, 0.9rem);
  text-align: center;
`;

const TestimonialsWrapper = styled.section`
  padding: 6rem 2rem 8rem;
  background: #ffffff;
  mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 25%,
    black 100%
  );
  @media (max-width: 768px) {
    padding: 4rem 1rem 6rem;
  }
`;

const TestimonialGrid = styled.div`
  display: grid;
  gap: 2rem;
  max-width: 1200px;
  margin: 3rem auto 0;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const TestimonialCard = styled(motion.div)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-color: rgba(220, 38, 38, 0.2);
  }
`;

const TestimonialText = styled.p`
  font-style: italic;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  position: relative;
  color: #374151;
`;

const TestimonialQuoteIcon = styled(Quote)`
  position: absolute;
  top: -10px;
  left: -15px;
  color: rgba(220, 38, 38, 0.15);
  width: 40px;
  height: 40px;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorAvatarWrapper = styled.div`
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  overflow: hidden;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const AuthorTitle = styled.p`
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
`;

const FAQSection = styled.section`
  padding: 6rem 2rem;
  background-color: white;
  @media (max-width: 768px) {
    padding: 4rem 1rem;
  }
`;

const FAQContainer = styled(motion.div)`
  max-width: 800px;
  margin: 3rem auto 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FAQItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 16px -4px rgba(0, 0, 0, 0.03);
  &:hover {
    border-color: rgba(220, 38, 38, 0.08);
    transform: translateY(-2px);
  }
`;

const FAQHeader = styled(motion.button)`
  width: 100%;
  padding: 1.5rem 2rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const FAQIconWrapper = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
`;

const FAQContentInner = styled.div`
  padding: 0 2rem 1.75rem;
  color: #86868b;
  line-height: 1.7;
`;

const ImageDescription = styled(motion.p)`
  color: #6b7280;
  margin: 2rem auto 0;
  max-width: 700px;
  line-height: 1.6;
  font-size: 1.1rem;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin: 1.5rem auto 0;
    padding: 0 1rem;
  }
`;

// --- Main Component ---
const BusinessWelcomePage = () => {
  const router = useRouter();

  // --- State Hooks ---
  const [activeItems, setActiveItems] = useState(new Set(["1"]));
  const [activeSection, setActiveSection] = useState("cost");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [costAnimationData, setCostAnimationData] = useState(null);
  const [comparisonAnimationData, setComparisonAnimationData] = useState(null);
  const [comparisonAnimationComplete, setComparisonAnimationComplete] =
    useState(false);

  // --- Refs ---
  const costRef = useRef(null);
  const comparisonRef = useRef(null);
  const animationRef = useRef(null);
  const comparisonLottieRef = useRef(null);
  const iconRefs = useRef({});
  const comparisonIntervalRef = useRef(null);

  // --- Data (Memoized for Performance) ---
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
          src: "https://cdn.lordicon.com/abgykmtd.json",
          label: "Bookings",
        },
        {
          key: "booking-trends",
          src: "https://cdn.lordicon.com/lrzdmsmx.json",
          label: "Analytics",
        },
        {
          key: "revenue",
          src: "https://cdn.lordicon.com/dnupukmh.json",
          label: "Revenue",
        },
        {
          key: "payouts",
          src: "https://cdn.lordicon.com/vmztfafm.json",
          label: "Payouts",
        },
        {
          key: "staff",
          src: "https://cdn.lordicon.com/mudwpdhy.json",
          label: "Staff",
        },
      ],
      tabContent: [
        {
          image: "https://i.imgur.com/v93lOsv.png",
          description:
            "This is your command center. Instantly gauge your business's health with a powerful overview of revenue, student growth, and the real-time pulse of daily activity.",
        },
        {
          image: "https://i.imgur.com/DMdHsU5.png",
          description:
            "Unlock powerful insights into what drives your business. Visualize booking trends, pinpoint your most popular classes, and optimize your schedule for maximum engagement and growth.",
        },
        {
          image: "https://i.imgur.com/tOAgKBg.png",
          description:
            "Gain complete command of your finances. Track every dollar from gross to net, visualize your growth trends, and instantly identify your most profitable offerings.",
        },
        {
          image: "https://i.imgur.com/4Mf4uee.png",
          description:
            "Get paid with confidence and complete transparency. Track your earnings in real-time and access a clear, verifiable history of every payout to your account.",
        },
        {
          image: "https://i.imgur.com/ljYW979.png",
          description:
            "Empower your team with confidence. Effortlessly invite staff, manage access with custom roles, and maintain complete control over your business operations from one central hub.",
        },
      ],
      savingsData: [
        {
          icon: <Calculator />,
          title: "No Setup Costs",
          description: "Zero upfront fees or monthly subscriptions.",
          amount: "$1,200+",
        },
        {
          icon: <PiggyBank />,
          title: "Admin Efficiency",
          description: "Automated bookings save you hours of work.",
          amount: "$4,800+",
        },
        {
          icon: <TrendingUp />,
          title: "Increased Revenue",
          description: "Attract more students with our marketing tools.",
          amount: "$2,000+",
        },
      ],
      comparisonData: [
        {
          feature: "Commission Rate",
          others: "20-30% + Other Fees",
          classEasily: "20% All-Inclusive",
          highlight: true,
        },
        {
          feature: "Setup Fees",
          others: "$500 - $2,000",
          classEasily: "Free",
          highlight: true,
        },
        {
          feature: "Monthly Subscription",
          others: "$50 - $200/mo",
          classEasily: "Free",
          highlight: false,
        },
        {
          feature: "Payment Processing",
          others: "3-5 days",
          classEasily: "Next day",
          highlight: false,
        },
        {
          feature: "Built-in Marketing",
          others: <XIcon />,
          classEasily: <CheckIcon />,
          highlight: false,
        },
        {
          feature: "24/7 Support",
          others: <XIcon />,
          classEasily: <CheckIcon />,
          highlight: false,
        },
        {
          feature: "Custom Branding",
          others: "Premium only",
          classEasily: <CheckIcon />,
          highlight: false,
        },
        {
          feature: "Analytics Dashboard",
          others: "Basic",
          classEasily: "Advanced",
          highlight: false,
        },
      ],
      tierComparisonData: [
        {
          feature: "Contact info storage",
          imported: true,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Notes on students",
          imported: true,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Scheduling (timeline/calendar)",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Resource assignment",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Automatic reminders",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Payment processing",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Rescheduling / cancellation",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Attendance tracking",
          imported: false,
          widget: true,
          marketplace: true,
        },
        {
          feature: "Marketing/discovery",
          imported: false,
          widget: false,
          marketplace: true,
        },
        {
          feature: "Fee model",
          imported: "Free",
          widget: "~6%",
          marketplace: "~20%",
        },
      ],
      faqData: [
        {
          key: "1",
          question: "How does ClassEasily work?",
          answer:
            "ClassEasily is a platform that connects local instructors with students seeking classes in their area. Instructors can list their classes, set their availability, and manage bookings through our intuitive dashboard. Students can search for classes, read reviews, and book sessions directly through the platform with seamless payment processing.",
        },
        {
          key: "2",
          question:
            "I'm already working with other online education platforms. Can I work with you, too?",
          answer:
            "Yes, you can certainly work with ClassEasily while maintaining relationships with other platforms. We also offer an <strong>exclusive partnership program</strong> that comes with benefits like priority placement and dedicated support.",
        },
        {
          key: "3",
          question: "What types of classes can I list on ClassEasily?",
          answer:
            "Currently, ClassEasily supports <strong>workshop classes only</strong>. This includes hands-on, in-person workshops such as art, crafts, cooking, and similar experiences. We are expanding to other categories soon!",
        },
        {
          key: "4",
          question: "How do payments and fees work on ClassEasily?",
          answer:
            "We handle all payments through our secure platform (Stripe). Funds are transferred to your account after the class is completed, minus our transparent, all-inclusive <strong>20% service fee</strong>. This fee covers all platform costs, including marketing, payment processing, and 24/7 support.",
        },
        {
          key: "5",
          question: "Is ClassEasily available in my area?",
          answer:
            "ClassEasily is rapidly expanding. To check if we're available in your area, simply enter your location on our homepage. If we're not there yet, you can <strong>join our waitlist</strong> to be the first to know when we launch.",
        },
      ],
      testimonials: [
        {
          text: "ClassEasily has helped me fill every pottery class this season. Managing bookings and communicating with attendees is a breeze.",
          author: "Linda M.",
          title: "Pottery Studio Owner",
          avatar: "https://randomuser.me/api/portraits/women/45.jpg",
        },
        {
          text: "My local cooking workshops have never been busier. The platform makes it simple to organize sessions and keep track of participants.",
          author: "Carlos G.",
          title: "Cooking Workshop Host",
          avatar: "https://randomuser.me/api/portraits/men/23.jpg",
        },
        {
          text: "ClassEasily has brought more art lovers to my painting classes. It's the perfect tool for local workshop providers like me.",
          author: "Sophie T.",
          title: "Painting Instructor",
          avatar: "https://randomuser.me/api/portraits/women/52.jpg",
        },
      ],
    }),
    []
  );

  // --- Callbacks (Memoized for Performance) ---
  const handleNavigate = useCallback(() => {
    router.push("/business/register");
  }, [router]);

  const triggerIconAnimation = useCallback((itemKey) => {
    if (iconRefs.current[itemKey]?.play) iconRefs.current[itemKey].play();
  }, []);

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

  const handleComparisonComplete = useCallback(() => {
    setComparisonAnimationComplete(true);
  }, []);

  // --- Effects ---
  useEffect(() => {
    import("@/assets/animations/animated-line-chart.json").then((module) =>
      setCostAnimationData(module.default)
    );
    import("@/assets/animations/line-chart-difference.json").then((module) =>
      setComparisonAnimationData(module.default)
    );
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => emblaApi.off("select", onSelect).off("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const refs = { cost: costRef, comparison: comparisonRef };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Object.keys(refs).find(
              (key) => refs[key].current === entry.target
            );
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.5 }
    );
    Object.values(refs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () =>
      Object.values(refs).forEach((ref) => {
        if (ref.current) observer.unobserve(ref.current);
      });
  }, []);

  useEffect(() => {
    if (
      activeSection === "comparison" &&
      comparisonAnimationComplete &&
      comparisonLottieRef.current?.animationItem
    ) {
      const animationItem = comparisonLottieRef.current.animationItem;
      let direction = -1;
      let isPlaying = false;
      const loopBetweenFrames = () => {
        if (isPlaying) return;
        isPlaying = true;
        const segments =
          direction === -1
            ? [
                Math.floor(3.2 * animationItem.frameRate),
                Math.floor(2 * animationItem.frameRate),
              ]
            : [
                Math.floor(2 * animationItem.frameRate),
                Math.floor(3.2 * animationItem.frameRate),
              ];
        animationItem.playSegments(segments, true);
        direction *= -1;
        animationItem.addEventListener("complete", () => {
          isPlaying = false;
        });
      };
      const timeoutId = setTimeout(() => {
        loopBetweenFrames();
        comparisonIntervalRef.current = setInterval(loopBetweenFrames, 3000);
      }, 2000);
      return () => {
        clearTimeout(timeoutId);
        if (comparisonIntervalRef.current)
          clearInterval(comparisonIntervalRef.current);
      };
    } else {
      setComparisonAnimationComplete(false);
      if (comparisonIntervalRef.current)
        clearInterval(comparisonIntervalRef.current);
    }
  }, [activeSection, comparisonAnimationComplete]);

  return (
    <PageWrapper>
      <Suspense fallback={null}>
        <GradientCanvas />
      </Suspense>

      <Header />

      <main>
        <HeroSection>
          <HeroGrid>
            <HeroTextContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <HeroTitle>Grow Your Teaching Business with Us</HeroTitle>
              <HeroSubtitle>
                Join thousands of successful schools, studios, and instructors
                who use our platform to manage their classes, reach more
                students, and increase their revenue.
              </HeroSubtitle>
              <StartButton onClick={handleNavigate}>
                List Your Business <ArrowRight size={20} aria-hidden="true" />
              </StartButton>
            </HeroTextContainer>
            <HeroAnimationContainer
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <Image
                src="/Group 1.svg"
                alt="A preview of the ClassEasily dashboard UI on a laptop"
                width={800}
                height={600}
                priority
                quality={75}
                style={{ width: "100%", height: "auto" }}
              />
            </HeroAnimationContainer>
          </HeroGrid>
        </HeroSection>

        <DashboardSection>
          <DashboardContainer>
            <SectionHeader>
              <SectionEyebrow>FEATURES</SectionEyebrow>
              <SectionTitle>Everything in one place</SectionTitle>
              <SectionSubtitle style={{ margin: "0 auto" }}>
                Manage your classes, track bookings, and monitor revenue with
                our comprehensive dashboard. Make data-driven decisions to grow
                your teaching business.
              </SectionSubtitle>
            </SectionHeader>
            <TabsContainer role="tablist" aria-label="Dashboard Features">
              {navigationItems.map((item, index) => (
                <TabButton
                  key={item.key}
                  $active={index === selectedIndex}
                  onClick={() => scrollTo(index)}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    triggerIconAnimation(item.key);
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-controls={`tabpanel-${item.key}`}
                  id={`tab-${item.key}`}
                >
                  <LordIcon
                    ref={(el) => (iconRefs.current[item.key] = el)}
                    src={item.src}
                    trigger="hover"
                    size="20px"
                    colors={
                      index === selectedIndex
                        ? "primary:#ffffff,secondary:#ffffff"
                        : index === hoveredIndex
                        ? "primary:#dc2626,secondary:#dc2626"
                        : "primary:#333333,secondary:#666666"
                    }
                    playOnLoad={index === selectedIndex}
                    aria-hidden="true"
                  />
                  {item.label}
                </TabButton>
              ))}
            </TabsContainer>
            <EmblaWrapper ref={emblaRef}>
              <EmblaContainer>
                {tabContent.map((content, index) => (
                  <EmblaSlide
                    key={index}
                    role="tabpanel"
                    id={`tabpanel-${navigationItems[index].key}`}
                    aria-labelledby={`tab-${navigationItems[index].key}`}
                  >
                    <Image
                      src={content.image}
                      alt={`Dashboard view for ${navigationItems[index].label}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      quality={85}
                    />
                  </EmblaSlide>
                ))}
              </EmblaContainer>
            </EmblaWrapper>
            <ImageDescription
              key={selectedIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {tabContent[selectedIndex].description}
            </ImageDescription>
          </DashboardContainer>
        </DashboardSection>

        <TwoColumnSection>
          <LeftColumn>
            <ContentBlock ref={costRef}>
              <SectionHeader>
                <SectionEyebrow>COST SAVINGS</SectionEyebrow>
                <SectionTitle>Save thousands every year</SectionTitle>
                <SectionSubtitle>
                  Our all-inclusive model eliminates hidden fees. No setup
                  costs, no monthly subscriptions—just a simple, transparent
                  commission.
                </SectionSubtitle>
              </SectionHeader>
              <SavingsGrid>
                {savingsData.map((item) => (
                  <SavingsCard key={item.title}>
                    <CardIconWrapper aria-hidden="true">
                      {item.icon}
                    </CardIconWrapper>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                    <SavingsAmount>{item.amount}</SavingsAmount>
                  </SavingsCard>
                ))}
              </SavingsGrid>
            </ContentBlock>

            <ContentBlock ref={comparisonRef}>
              <SectionHeader>
                <SectionEyebrow>COMPARISON</SectionEyebrow>
                <SectionTitle>Transparent, powerful, and fair</SectionTitle>
                <SectionSubtitle>
                  See how our model stacks up against the hidden costs and
                  limitations of other platforms. We provide everything you need
                  to succeed.
                </SectionSubtitle>
              </SectionHeader>
              <ComparisonTableWrapper>
                <ComparisonHeader>
                  <HeaderCell>Feature</HeaderCell>
                  <HeaderCell>Other Platforms</HeaderCell>
                  <HeaderCell>ClassEasily</HeaderCell>
                </ComparisonHeader>
                {comparisonData.map((row) => (
                  <ComparisonRow
                    key={row.feature}
                    className={row.highlight ? "highlight-row" : ""}
                  >
                    <FeatureCell>{row.feature}</FeatureCell>
                    <ValueCell $isPositive={false}>{row.others}</ValueCell>
                    <ValueCell $isPositive={true}>{row.classEasily}</ValueCell>
                  </ComparisonRow>
                ))}
              </ComparisonTableWrapper>
            </ContentBlock>
          </LeftColumn>

          <RightColumn>
            <div ref={animationRef}>
              <AnimatePresence mode="wait">
                <Suspense fallback={null}>
                  {activeSection === "cost" && costAnimationData && (
                    <AnimationContainer
                      key="cost-anim"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Lottie
                        key="cost-lottie"
                        animationData={costAnimationData}
                        loop={false}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </AnimationContainer>
                  )}
                  {activeSection === "comparison" &&
                    comparisonAnimationData && (
                      <AnimationContainer
                        key="comparison-anim"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <Lottie
                          key="comparison-lottie"
                          lottieRef={comparisonLottieRef}
                          animationData={comparisonAnimationData}
                          loop={false}
                          autoplay={true}
                          onComplete={handleComparisonComplete}
                          style={{ width: "100%", height: "100%" }}
                        />
                      </AnimationContainer>
                    )}
                </Suspense>
              </AnimatePresence>
            </div>
          </RightColumn>
        </TwoColumnSection>

        <TierComparisonSection>
          <TierComparisonWrapper>
            <SectionHeader style={{ textAlign: "center" }}>
              <SectionEyebrow>SOLUTIONS</SectionEyebrow>
              <SectionTitle>Pick the Right Way to Grow</SectionTitle>
              <SectionSubtitle style={{ margin: "0 auto" }}>
                Start simple with free contact storage, or unlock full booking
                tools through our website widget or marketplace. No
                subscriptions. No hidden costs. Fees only apply when a booking
                is made.
              </SectionSubtitle>
            </SectionHeader>
            <TierTableWrapper>
              <TierTableHeader>
                <TierHeaderCell>Feature</TierHeaderCell>
                <TierHeaderCell>
                  Imported
                  <br />
                  (Free Contacts)
                </TierHeaderCell>
                <TierHeaderCell>
                  Widget
                  <br />
                  (6% Fee)
                </TierHeaderCell>
                <TierHeaderCell>
                  Marketplace
                  <br />
                  (20% Fee)
                </TierHeaderCell>
              </TierTableHeader>
              {tierComparisonData.map((row) => (
                <TierTableRow key={row.feature}>
                  <TierFeatureCell>{row.feature}</TierFeatureCell>
                  <TierValueCell>
                    {typeof row.imported === "boolean" ? (
                      row.imported ? (
                        <CheckIcon aria-label="Included" />
                      ) : (
                        <XIcon aria-label="Not included" />
                      )
                    ) : (
                      row.imported
                    )}
                  </TierValueCell>
                  <TierValueCell>
                    {typeof row.widget === "boolean" ? (
                      row.widget ? (
                        <CheckIcon aria-label="Included" />
                      ) : (
                        <XIcon aria-label="Not included" />
                      )
                    ) : (
                      row.widget
                    )}
                  </TierValueCell>
                  <TierValueCell>
                    {typeof row.marketplace === "boolean" ? (
                      row.marketplace ? (
                        <CheckIcon aria-label="Included" />
                      ) : (
                        <XIcon aria-label="Not included" />
                      )
                    ) : (
                      row.marketplace
                    )}
                  </TierValueCell>
                </TierTableRow>
              ))}
            </TierTableWrapper>
          </TierComparisonWrapper>
        </TierComparisonSection>

        <TestimonialsWrapper>
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <SectionTitle>What our partners say</SectionTitle>
            <TestimonialGrid>
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <TestimonialText>
                    <TestimonialQuoteIcon aria-hidden="true" />
                    &ldquo;{testimonial.text}&rdquo;
                  </TestimonialText>
                  <TestimonialAuthor>
                    <AuthorAvatarWrapper>
                      <Image
                        src={testimonial.avatar}
                        alt={`${testimonial.author}`}
                        fill
                        sizes="50px"
                        quality={80}
                        style={{ objectFit: "cover" }}
                      />
                    </AuthorAvatarWrapper>
                    <AuthorInfo>
                      <AuthorName>{testimonial.author}</AuthorName>
                      <AuthorTitle>{testimonial.title}</AuthorTitle>
                    </AuthorInfo>
                  </TestimonialAuthor>
                </TestimonialCard>
              ))}
            </TestimonialGrid>
          </div>
        </TestimonialsWrapper>

        <FAQSection>
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <SectionHeader>
              <SectionTitle>Frequently asked questions</SectionTitle>
            </SectionHeader>
            <FAQContainer>
              {faqData.map((item) => {
                const isActive = activeItems.has(item.key);
                const buttonId = `faq-button-${item.key}`;
                const contentId = `faq-content-${item.key}`;

                return (
                  <FAQItem key={item.key} layout>
                    <FAQHeader
                      onClick={() => toggleItem(item.key)}
                      aria-expanded={isActive}
                      aria-controls={contentId}
                      id={buttonId}
                    >
                      <span>{item.question}</span>
                      <FAQIconWrapper>
                        <AnimatePresence initial={false} mode="wait">
                          <motion.div
                            key={isActive ? "minus" : "plus"}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {isActive ? (
                              <Minus size={16} aria-hidden="true" />
                            ) : (
                              <Plus size={16} aria-hidden="true" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </FAQIconWrapper>
                    </FAQHeader>
                    <AnimatePresence>
                      {isActive && (
                        <FAQContent
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          role="region"
                          id={contentId}
                          aria-labelledby={buttonId}
                        >
                          <FAQContentInner>
                            <p
                              dangerouslySetInnerHTML={{
                                __html: item.answer,
                              }}
                            />
                          </FAQContentInner>
                        </FAQContent>
                      )}
                    </AnimatePresence>
                  </FAQItem>
                );
              })}
            </FAQContainer>
          </div>
        </FAQSection>
      </main>

      <Footer />
    </PageWrapper>
  );
};

export default memo(BusinessWelcomePage);
