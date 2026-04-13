"use client";

import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { Plus, Minus, Check, X, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  font-family:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(
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

  @media (max-width: 480px) {
    padding: 0 16px;
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

/* Thin angled WebGL gradient strip (hidden on mobile) */
const WelcomeGradientStrip = styled.div`
  position: absolute;
  left: -50%;
  width: 150%;
  height: 150px;
  top: 50%;
  transform: translateY(-45%) rotate(-20deg);
  z-index: 0;
  overflow: hidden;
  border-radius: 4px;
  @media (max-width: 640px) {
    width: 200%;
  }
`;
const WelcomeGradientStripInner = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;
const WelcomeGradientCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #ffffff;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #ffffff;
  --gradient-color-4: #ffffff;
`;

const HeroSection = styled.section`
  min-height: 65vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow-x: clip;

  @media (max-width: 1024px) {
    min-height: auto;
    padding-top: 100px;
    padding-bottom: 40px;
    overflow: visible;
  }

  @media (max-width: 480px) {
    padding-top: 80px;
    padding-bottom: 28px;
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 3rem;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    text-align: center;
  }
`;

const HeroImagePane = styled(m.div)`
  width: calc(100% + 25vw);
  margin-left: -18vw;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const HeroTextContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: clamp(0px, 7vw, 5rem);

  @media (max-width: 1024px) {
    padding-left: 0;
    align-items: center;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 4vw, 3rem);
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #000;

  @media (max-width: 480px) {
    font-size: clamp(1.75rem, 8vw, 2.25rem);
    margin-bottom: 12px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.125rem;
  color: #000;
  max-width: 460px;
  margin-bottom: 32px;
  line-height: 1.2;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 14px;
    max-width: 100%;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 24px;
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

  @media (max-width: 480px) {
    height: 44px;
    padding: 0 24px;
    font-size: 13px;
  }
`;

const DashboardSection = styled.section`
  padding: 4rem 0 !important;
  position: relative;

  @media (max-width: 768px) {
    padding: 2.5rem 0 !important;
  }

  @media (max-width: 480px) {
    padding: 1.75rem 0 !important;
  }
`;

const PhoneCarouselScene = styled.div`
  position: relative;
  margin-top: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 60px;

  @media (max-width: 600px) {
    margin-top: 28px;
    padding: 12px 0 48px;
  }

  @media (max-width: 480px) {
    margin-top: 20px;
    padding: 8px 0 40px;
  }
`;

const PhoneCarouselStage = styled.div`
  position: relative;
  width: 260px;
  height: 520px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 220px;
    height: 440px;
  }

  @media (max-width: 380px) {
    width: 200px;
    height: 400px;
  }
`;

const PhoneSlide = styled(m.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transform-origin: center top;
  will-change: transform, opacity;
`;

const PhoneDescriptionArea = styled.div`
  position: absolute;
  bottom: -92px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  text-align: center;
  pointer-events: none;

  @media (max-width: 600px) {
    width: 260px;
  }
`;

const PhoneDescTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 6px;
`;

const PhoneDescText = styled.p`
  font-size: 0.9rem;
  color: #6e6e73;
  line-height: 1.5;
  margin: 0;
`;

const CarouselChevron = styled.button`
  position: absolute;
  top: 42%;
  transform: translateY(-60%);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: background 0.2s, box-shadow 0.2s;
  color: #1d1d1f;

  &:hover {
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  &.left {
    left: calc(50% - 100px - 24px - 44px);

    @media (max-width: 700px) {
      left: 4px;
    }
    @media (max-width: 480px) {
      left: 2px;
      width: 36px;
      height: 36px;
    }
  }

  &.right {
    right: calc(50% - 100px - 24px - 44px);

    @media (max-width: 700px) {
      right: 4px;
    }
    @media (max-width: 480px) {
      right: 2px;
      width: 36px;
      height: 36px;
    }
  }
`;

const CarouselDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 72px;

  @media (max-width: 480px) {
    margin-top: 68px;
  }
`;

const CarouselDot = styled.button`
  width: ${(p) => (p.$active ? "20px" : "8px")};
  height: 8px;
  border-radius: 4px;
  background: ${(p) => (p.$active ? "#1d1d1f" : "#d1d1d6")};
  border: none;
  cursor: pointer;
  transition: width 0.3s ease, background 0.3s ease;
  padding: 0;
`;

const ValuePropSection = styled.section`
  padding: 80px 0;

  @media (max-width: 768px) {
    padding: 60px 0;
  }

  @media (max-width: 480px) {
    padding: 40px 0;
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
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 480px) {
    margin: 0 -16px 32px -16px;
    padding-left: 16px;
    padding-right: 16px;
    gap: 12px;
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

  @media (max-width: 480px) {
    min-width: 260px;
    max-width: 260px;
    padding: 24px;
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
  font-weight: 600;
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

  @media (max-width: 768px) {
    margin-bottom: 32px;
  }

  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
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
  font-weight: 600;
  margin-bottom: 12px;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  line-height: 1.1;

  @media (max-width: 480px) {
    font-size: clamp(1.4rem, 6vw, 1.75rem);
    margin-bottom: 8px;
  }
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

  @media (max-width: 480px) {
    border-radius: 16px;
  }
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

  @media (max-width: 480px) {
    padding: 18px 16px;
    gap: 6px;
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
  padding: 80px 0;
  background: #f7f7f9;
  position: relative;

  @media (max-width: 768px) {
    padding: 56px 0;
  }

  @media (max-width: 480px) {
    padding: 40px 0;
  }
`;

const SocialProofGrid = styled.div`
  display: grid;
  grid-template-columns: 30% 38% 32%;
  gap: 40px;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  @media (max-width: 480px) {
    gap: 24px;
  }
`;

const SocialProofLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;

  @media (max-width: 1024px) {
    order: 1;
  }

  @media (max-width: 700px) {
    order: 1;
  }
`;

const SocialProofHeadline = styled.h2`
  font-size: clamp(2rem, 3.2vw, 2.75rem);
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.12;
  letter-spacing: -0.03em;
  margin: 0;

  @media (max-width: 480px) {
    font-size: clamp(1.5rem, 7vw, 1.85rem);
  }
`;

const SocialProofSubtext = styled.p`
  font-size: 1rem;
  font-weight: 400;
  color: #4a4a4a;
  line-height: 1.6;
  margin: 0;
  max-width: 280px;

  @media (max-width: 700px) {
    max-width: 100%;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const CenterImageCard = styled.div`
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  width: 100%;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);

  @media (max-width: 1024px) {
    order: 3;
    grid-column: span 2;
    max-width: 380px;
    margin: 0 auto;
  }

  @media (max-width: 700px) {
    order: 2;
    grid-column: span 1;
    max-width: 100%;
  }

  @media (max-width: 480px) {
    border-radius: 16px;
  }
`;

const ImageOverlayGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.82) 100%);
  z-index: 1;
`;

const ImageOverlayContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28px;
  z-index: 2;

  @media (max-width: 480px) {
    padding: 18px;
  }
`;

const ImageOverlayQuote = styled.p`
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0 0 12px 0;

  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
`;

const ImageOverlayAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
`;

const ImageAuthorName = styled.span`
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 700;
`;

const ImageAuthorTitle = styled.span`
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.8rem;
  font-weight: 400;
`;

const TestimonialStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  max-height: 560px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 72px;
    background: linear-gradient(to bottom, #f7f7f9 0%, transparent 100%);
    z-index: 2;
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, #f7f7f9 0%, transparent 100%);
    z-index: 2;
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    order: 2;
    max-height: none;
    overflow: visible;

    &::before,
    &::after {
      display: none;
    }
  }

  @media (max-width: 700px) {
    order: 3;
  }
`;

const TestimonialCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
    gap: 10px;
  }
`;

const TestimonialCardText = styled.p`
  font-size: 0.875rem;
  color: #333333;
  line-height: 1.55;
  margin: 0;
  font-weight: 400;
`;

const StarRow = styled.div`
  display: flex;
  gap: 1px;
  color: #ff6b00;
  font-size: 0.875rem;
  letter-spacing: 1px;
`;

const TestimonialCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TestimonialAvatarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TestimonialAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${(props) => props.$bg || "#e0e7ff"};
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ffffff;
`;

const TestimonialAuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TestimonialAuthorName = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: #1a1a1a;
`;

const TestimonialAuthorTitle = styled.span`
  font-size: 0.72rem;
  color: #888888;
  font-weight: 400;
`;

const CompanyBadge = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${(props) => props.$bg || "#1a73e8"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
`;

const TierSection = styled.section`
  padding: 36px 0 40px;
  background: #f8fafc;
  position: relative;

  @media (max-width: 768px) {
    padding: 28px 0 32px;
  }

  @media (max-width: 480px) {
    padding: 24px 0 28px;
  }
`;

const GrowthHeader = styled.div`
  margin-bottom: 20px;

  @media (max-width: 480px) {
    margin-bottom: 16px;
  }
`;

const GrowthEyebrow = styled.p`
  color: #1a1a1a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 4px 0;
`;

const GrowthHeadline = styled.h2`
  font-size: clamp(1.35rem, 2.2vw, 1.6rem);
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 6px 0;

  @media (max-width: 480px) {
    font-size: clamp(1.2rem, 5.5vw, 1.4rem);
  }
`;

const GrowthSubtext = styled.p`
  font-size: 0.8rem;
  color: #425466;
  line-height: 1.45;
  max-width: 520px;
  margin: 0;

  @media (max-width: 480px) {
    max-width: 100%;
    font-size: 0.75rem;
  }
`;

const GrowthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  align-items: stretch;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const GrowthCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    padding: 14px 16px;
    border-radius: 10px;
  }
`;

const GrowthCardEyebrow = styled.p`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(props) => props.$color || "#1a1a1a"};
  margin: 0 0 4px 0;
`;

const GrowthCardTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 0 0 6px 0;
`;

const GrowthCommissionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${(props) => props.$bg || "rgba(0, 0, 0, 0.06)"};
  color: ${(props) => props.$color || "#1a1a1a"};
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  margin-bottom: 8px;
  width: fit-content;
`;

const GrowthCardDesc = styled.p`
  font-size: 0.75rem;
  color: #425466;
  line-height: 1.4;
  margin: 0 0 12px 0;
`;

const GrowthCardDivider = styled.hr`
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 0 0 10px 0;
`;

const GrowthFeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 14px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GrowthFeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.75rem;
  color: #425466;
  line-height: 1.35;

  svg {
    margin-top: 0;
    flex-shrink: 0;
    width: 12px;
    height: 12px;
  }
`;

const GrowthCTAButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  width: fit-content;
  transition: all 0.2s ease;
  background: ${(props) => props.$bg || "#1a1a1a"};
  color: #ffffff;
  margin-top: auto;

  &:hover {
    opacity: 0.88;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${(props) => props.$shadow || "rgba(0,0,0,0.2)"};
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

/* stripe-gradient strip for the Bento section */
const BentoGradientStrip = styled.div`
  position: absolute;
  left: -50%;
  width: 170%;
  height: 150px;
  top: 38%;
  transform: translateY(-50%) rotate(25deg);
  z-index: 0;
  overflow: hidden;
  border-radius: 4px;
  pointer-events: none;
  @media (max-width: 640px) {
    width: 200%;
  }
`;

const BentoGradientCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #ffffff;
  --gradient-color-2: #8b5cf6;
  --gradient-color-3: #fc4056;
  --gradient-color-4: #ffffff;
`;

// ─── Bento Grid – "Built for your bottom line" ────────────────────────────

const BentoSection = styled.section`
  padding: 80px 0;
  position: relative;
  overflow-x: clip;

  @media (max-width: 768px) {
    padding: 60px 0;
  }

  @media (max-width: 480px) {
    padding: 40px 0;
  }
`;

const BentoCenterHeader = styled.div`
  text-align: center;
  margin-bottom: 56px;

  @media (max-width: 768px) {
    margin-bottom: 40px;
  }

  @media (max-width: 480px) {
    margin-bottom: 28px;
  }
`;

const ServicesBadge = styled.span`
  display: inline-block;
  padding: 6px 18px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.09);
  color: #8b5cf6;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const BentoTitle = styled.h2`
  font-size: clamp(2rem, 3.5vw, 2.75rem);
  font-weight: 600;
  color: #1d1d1f;
  line-height: 1.2;
  letter-spacing: -0.03em;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    font-size: clamp(1.4rem, 6vw, 1.75rem);
    margin-bottom: 12px;
  }
`;

const BentoSubtitle = styled.p`
  font-size: 1.05rem;
  color: #555;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 0 8px;
  }
`;

const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 320px 320px;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-rows: 280px 300px;
    gap: 16px;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

/* ── Card 1: Left Tall ── */
const BentoTallCard = styled.div`
  grid-column: 1;
  grid-row: 1 / 3;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  background: url("/asian-girl-using-iphone.webp") no-repeat center center;
  background-size: cover;

  @media (max-width: 768px) {
    height: 360px;
    grid-column: auto;
    grid-row: auto;
  }

  @media (max-width: 480px) {
    height: 300px;
    border-radius: 16px;
  }
`;

const TallDecorCircle = styled.div`
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(34, 197, 94, 0.09) 0%,
    transparent 70%
  );
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 0;
  pointer-events: none;
`;

const TallDecorRing = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const ConfirmedBadge = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(12, 12, 12, 0.78);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  z-index: 10;
`;

const ConfirmedDot = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ConfirmedText = styled.span`
  color: #fff;
  font-size: 12px;
  font-weight: 500;
`;

const TallCardGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 54%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(4, 14, 10, 0.97) 100%
  );
  z-index: 1;
  pointer-events: none;
`;

const TallCardContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28px 28px 32px;
  z-index: 2;

  @media (max-width: 480px) {
    padding: 18px 18px 22px;
  }
`;

const TallCardHeadline = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 8px;
  letter-spacing: -0.02em;

  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin-bottom: 6px;
  }
`;

const TallCardBody = styled.p`
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.55;
`;

/* ── Cards 2 & 3: shared text ── */
const MiniCardTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 700;
  color: #1d1d1f;
  line-height: 1.25;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
`;

const MiniCardBody = styled.p`
  font-size: 0.8rem;
  color: #666;
  line-height: 1.5;
`;

/* ── Card 2: Escrow ── */
const EscrowCard = styled.div`
  grid-column: 2;
  grid-row: 1;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(150deg, #fff4ee 0%, #fff8f4 55%, #fef0f0 100%);
  padding: 26px 26px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;

  @media (max-width: 768px) {
    grid-column: auto;
    grid-row: auto;
    min-height: 280px;
  }

  @media (max-width: 480px) {
    min-height: 260px;
    padding: 18px 18px 0;
    border-radius: 16px;
  }
`;

/* 3-step escrow lifecycle stepper */
const EscrowStepRow = styled.div`
  display: flex;
  align-items: flex-start;
  margin: 14px 0 16px;
`;

const EscrowStepItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
`;

const EscrowStepBubble = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(p) => p.$bg || "rgba(255,255,255,0.7)"};
  border: 1.5px solid ${(p) => p.$border || "rgba(0,0,0,0.06)"};
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  position: relative;
`;

const EscrowStepCheck = styled.div`
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #22c55e;
  border: 1.5px solid #fff8f4;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EscrowStepLabel = styled.span`
  font-size: 9.5px;
  font-weight: 600;
  color: #555;
  text-align: center;
  line-height: 1.3;
  white-space: nowrap;
`;

const EscrowConnector = styled.div`
  flex: 0 0 auto;
  width: 22px;
  height: 1.5px;
  background: linear-gradient(to right, rgba(239,68,68,0.25), rgba(239,68,68,0.12));
  margin-top: 18px;
  border-radius: 2px;
`;

/* Transaction rows */
const EscrowTxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: auto;
`;

const EscrowTx = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 10px 13px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EscrowTxIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${(p) => p.$bg || "#fee2e2"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
`;

const EscrowTxMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const EscrowTxPrimary = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EscrowTxSub = styled.div`
  font-size: 9.5px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EscrowTxBadge = styled.div`
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 700;
  background: ${(p) => p.$bg || "#dcfce7"};
  color: ${(p) => p.$color || "#166534"};
  flex-shrink: 0;
  white-space: nowrap;
`;

/* ── Card 3: Radar ── */
const radarPulse = keyframes`
  0%, 100% { opacity: 0.14; transform: translate(-50%, -50%) scale(1); }
  50%       { opacity: 0.28; transform: translate(-50%, -50%) scale(1.04); }
`;

const RadarCard = styled.div`
  grid-column: 2;
  grid-row: 2;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  background: radial-gradient(ellipse at 60% 80%, rgba(134, 239, 172, 0.18) 0%, #f0fbf5 55%);
  padding: 24px 24px 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    grid-column: auto;
    grid-row: auto;
    min-height: 320px;
  }

  @media (max-width: 480px) {
    min-height: 280px;
    padding: 18px 18px 0;
    border-radius: 16px;
  }
`;

const RadarMap = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 12px -24px 0;
`;

const RadarRing = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(16, 120, 70, 0.13);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${radarPulse} 3s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay || "0s"};
`;

const RadarCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 5;
`;

const RadarMe = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18), 0 4px 18px rgba(0, 0, 0, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  line-height: 1;
`;

const RadarMeLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #166534;
  background: rgba(255,255,255,0.85);
  padding: 1px 7px;
  border-radius: 999px;
`;

const RadarBadge = styled.div`
  position: absolute;
  background: #fff;
  border-radius: 14px;
  padding: 6px 10px 6px 6px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.1);
  z-index: 4;
  white-space: nowrap;
`;

const BadgeAva = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${(p) => p.$bg || "#e5e7eb"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
`;

const BadgeMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const BadgeName = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: #1d1d1f;
  line-height: 1.2;
`;

const BadgeDist = styled.span`
  font-size: 9.5px;
  color: #22c55e;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const RadarGreenDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
  flex-shrink: 0;
`;

// ─── End Bento Styled Components ───────────────────────────────────────────

const FAQSection = styled.section`
  padding: 80px 0;

  @media (max-width: 768px) {
    padding: 56px 0;
  }

  @media (max-width: 480px) {
    padding: 40px 0;
  }
`;

const FAQContainer = styled(GlassCard)`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.7);

  @media (max-width: 768px) {
    padding: 0 20px;
  }

  @media (max-width: 480px) {
    padding: 0 16px;
    border-radius: 16px;
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

  @media (max-width: 480px) {
    padding: 18px 0;
    font-size: 0.95rem;
  }
`;

const FAQAnswer = styled(m.div)`
  overflow: hidden;
  color: #6e6e73;
  font-size: 14px;
  line-height: 1.6;
`;

// ─── Diagonal Section Divider (same pattern as WidgetLandingClient) ──────────
const DiagonalDivider = ({ fromBg = "#ffffff", toBg = "#ffffff", flip = false }) => (
  <div style={{ lineHeight: 0, background: toBg, display: "block", overflow: "hidden", position: "relative", zIndex: 1 }}>
    <svg
      viewBox="0 0 1440 44"
      preserveAspectRatio="none"
      width="100%"
      height="44"
      style={{ display: "block", transform: flip ? "scaleX(-1)" : "none" }}
    >
      <path d="M0,0 L1440,0 L0,44 Z" fill={fromBg} />
      <line x1="0" y1="0" x2="1440" y2="44" stroke="rgba(248,30,62,0.10)" strokeWidth="1.5" />
    </svg>
  </div>
);

// --- Main Component ---
const BusinessWelcomePage = () => {
  const router = useRouter();

  // --- State Hooks ---
  const [activeItems, setActiveItems] = useState(new Set(["1"]));
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  // --- Data ---
  const { mockupItems, comparisonData, growthPathData, faqData, testimonials } =
    useMemo(
      () => ({
        mockupItems: [
          {
            title: "Bookings",
            description:
              "Visualize trends, pinpoint popular experiences, and optimize your schedule.",
            image: "/iPhone 14 Pro.png",
            delay: 0,
          },
          {
            title: "Insights",
            description:
              "Track every dollar. Visualize growth trends and instantly identify profitable time slots.",
            image: "/iPhone 14 Pro (1).png",
            delay: 0.1,
          },
          {
            title: "Earnings",
            description:
              "Get paid with confidence. Track earnings in real-time and access clear payout history.",
            image: "/iPhone 14 Pro (2).png",
            delay: 0.2,
          },
        ],
        comparisonData: [
          {
            feature: "Commission Rate",
            others: "20-30% + Fees",
            classEasily: "15% All-Inclusive",
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
            eyebrow: "MARKETPLACE",
            title: "Get discovered, hands-free",
            commission: "15% commission per booking",
            commissionColor: "#1a1a1a",
            commissionBg: "rgba(0, 0, 0, 0.06)",
            description:
              "List your experience and we market it for you. Our platform handles SEO, discovery, and secure payments to bring you new customers.",
            iconColor: "#1a1a1a",
            buttonLabel: "List on Marketplace",
            buttonPath: "business/register",
            buttonBg: "#1a1a1a",
            buttonShadow: "rgba(0, 0, 0, 0.25)",
            features: [
              "Full marketplace exposure",
              "Search & Discovery boost",
              "Secure payment processing",
              "Next-day payouts",
              "Verified guest reviews",
            ],
          },
          {
            eyebrow: "WEBSITE WIDGET",
            title: "Book directly on your site",
            commission: "3% commission per booking",
            commissionColor: "#1a1a1a",
            commissionBg: "rgba(0, 0, 0, 0.06)",
            description:
              "Already have a website? Embed our booking widget to manage schedules and accept payments directly on your own domain.",
            iconColor: "#1a1a1a",
            buttonLabel: "Get the Widget",
            buttonPath: "/business/dashboard/settings?tab=billing",
            buttonBg: "#1a1a1a",
            buttonShadow: "rgba(0, 0, 0, 0.25)",
            features: [
              "Embeddable booking engine",
              "Real-time calendar sync",
              "Automated email/SMS reminders",
              "Centralized dashboard",
              "Brand-matched design",
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
            text: "I used to drown in spreadsheets. Now I just focus on my pottery students — the platform handles everything else 🎉",
            author: "Linda M.",
            title: "Pottery Host",
            initials: "LM",
            avatarBg: "#e25c5c",
            badgeBg: "#f97316",
            badgeLabel: "H",
          },

          {
            text: "Finally a platform that only charges when I earn. No monthly fees, no surprises — exactly how it should be 🤝",
            author: "Sophie T.",
            title: "Art Instructor",
            initials: "ST",
            avatarBg: "#8b5cf6",
            badgeBg: "#22c55e",
            badgeLabel: "E",
          },

        ],
      }),
      [],
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

  useEffect(() => {
    import("stripe-gradient").then(({ Gradient }) => {
      const g1 = new Gradient();
      g1.initGradient("#welcome-gradient-canvas");
      const g2 = new Gradient();
      g2.initGradient("#bento-gradient-canvas");
    }).catch(() => {});
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <PageWrapper>
        <GlobalStyle />
        <ExploreHeader showOptionsWrapper={false} />

        <main>
          {/* 1. Hero Section */}
          <HeroSection>
            <WelcomeGradientStrip>
              <WelcomeGradientStripInner>
                <WelcomeGradientCanvas id="welcome-gradient-canvas" data-transition-in />
              </WelcomeGradientStripInner>
            </WelcomeGradientStrip>
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
                <HeroImagePane
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <Image
                    src="/Frame 1597880366.webp"
                    alt="Host Dashboard Preview"
                    width={900}
                    height={1100}
                    priority
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </HeroImagePane>
              </HeroGrid>
            </SectionContainer>
          </HeroSection>

          <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" />
          {/* 3. Dashboard Mockups — Phone Carousel */}
          <DashboardSection>
            <SectionContainer>
              <SectionHeader $center>
                <SectionTitle>Manage everything in one place</SectionTitle>
                <SectionSubtitle $center>
                  From scheduling events to tracking your payouts, our dashboard
                  gives you the clarity you need.
                </SectionSubtitle>
              </SectionHeader>

              <PhoneCarouselScene>
                {/* Left chevron */}
                <CarouselChevron
                  className="left"
                  aria-label="Previous"
                  onClick={() =>
                    setActiveCarouselIndex(
                      (prev) => (prev - 1 + mockupItems.length) % mockupItems.length
                    )
                  }
                >
                  <ChevronLeft size={20} />
                </CarouselChevron>

                <PhoneCarouselStage>
                  {mockupItems.map((item, index) => {
                    const total = mockupItems.length;
                    const rel = (index - activeCarouselIndex + total) % total;
                    // rel 0 = center, 1 = right, 2 = left
                    const isCenter = rel === 0;
                    const xOffset = isCenter ? 0 : rel === 1 ? 290 : -290;
                    const yOffset = isCenter ? 0 : 44;
                    const scaleVal = isCenter ? 1 : 0.87;
                    const opacityVal = isCenter ? 1 : 0.22;
                    const zVal = isCenter ? 10 : 1;
                    const shadowVal = isCenter
                      ? "0 24px 60px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.12)"
                      : "none";
                    const borderColor = isCenter
                      ? "#111111"
                      : "rgba(100,100,100,0.3)";

                    return (
                      <PhoneSlide
                        key={item.title}
                        style={{ zIndex: zVal }}
                        animate={{
                          x: xOffset,
                          y: yOffset,
                          scale: scaleVal,
                          opacity: opacityVal,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 35,
                          mass: 1,
                        }}
                      >
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 600px) 220px, 260px"
                          style={{ objectFit: "cover", objectPosition: "top center" }}
                        />
                      </PhoneSlide>
                    );
                  })}

                  {/* Description fades with active item */}
                  <PhoneDescriptionArea>
                    <AnimatePresence mode="wait">
                      <m.div
                        key={activeCarouselIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <PhoneDescTitle>
                          {mockupItems[activeCarouselIndex].title}
                        </PhoneDescTitle>
                        <PhoneDescText>
                          {mockupItems[activeCarouselIndex].description}
                        </PhoneDescText>
                      </m.div>
                    </AnimatePresence>
                  </PhoneDescriptionArea>
                </PhoneCarouselStage>

                {/* Right chevron */}
                <CarouselChevron
                  className="right"
                  aria-label="Next"
                  onClick={() =>
                    setActiveCarouselIndex(
                      (prev) => (prev + 1) % mockupItems.length
                    )
                  }
                >
                  <ChevronRight size={20} />
                </CarouselChevron>
              </PhoneCarouselScene>

              <CarouselDots>
                {mockupItems.map((_, i) => (
                  <CarouselDot
                    key={i}
                    $active={i === activeCarouselIndex}
                    onClick={() => setActiveCarouselIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </CarouselDots>
            </SectionContainer>
          </DashboardSection>

          <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" flip />
          {/* 2. "Built for your bottom line" — Bento Grid */}
          <BentoSection>
            {/* Live stripe-gradient strip behind header */}
            <BentoGradientStrip>
              <WelcomeGradientStripInner>
                <BentoGradientCanvas id="bento-gradient-canvas" data-transition-in />
              </WelcomeGradientStripInner>
            </BentoGradientStrip>
            <SectionContainer>
              {/* ── Header ── */}
              <BentoCenterHeader>
                <BentoTitle>
                  Built to protect your time
                  <br />
                  and your earnings
                </BentoTitle>
                <BentoSubtitle>
                  List your experience, take bookings on autopilot, and get
                  paid with confidence — guest payments are held in escrow
                  until every session is complete.
                </BentoSubtitle>
              </BentoCenterHeader>

              {/* ── Bento Grid ── */}
              <BentoGrid>

                {/* ── Card 1: Left Tall — Peace of Mind ── */}
                <BentoTallCard>
                  {/* Decorative background elements */}
                  <TallDecorCircle />
                  <TallDecorRing style={{ width: 200, height: 200 }} />
                  <TallDecorRing style={{ width: 330, height: 330 }} />

                  {/* Floating "Booking Confirmed" badge */}
                  <ConfirmedBadge>
                    <ConfirmedDot>
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </ConfirmedDot>
                    <ConfirmedText>Booking Confirmed!</ConfirmedText>
                  </ConfirmedBadge>

                  {/* Bottom gradient + text */}
                  <TallCardGradient />
                  <TallCardContent>
                    <TallCardHeadline>Your Guests Book With Confidence</TallCardHeadline>
                    <TallCardBody>
                      A frictionless checkout and secured payments means more
                      completed bookings and fewer no-shows.
                    </TallCardBody>
                  </TallCardContent>
                </BentoTallCard>

                {/* ── Card 2: Escrow Payments ── */}
                <EscrowCard>
                  <MiniCardTitle>
                    Secure Escrow
                    Payments
                  </MiniCardTitle>
                  <MiniCardBody>
                    Guest funds are locked the moment they book and released
                    to you automatically once the experience is complete.
                  </MiniCardBody>

                  {/* 3-step escrow lifecycle */}
                  <EscrowStepRow>
                    <EscrowStepItem>
                      <EscrowStepBubble $bg="rgba(254,243,199,0.9)" $border="rgba(251,191,36,0.2)">
                        🎟
                        <EscrowStepCheck>
                          <Check size={7} color="#fff" strokeWidth={3.5} />
                        </EscrowStepCheck>
                      </EscrowStepBubble>
                      <EscrowStepLabel>Guest<br/>Books</EscrowStepLabel>
                    </EscrowStepItem>
                    <EscrowConnector />
                    <EscrowStepItem>
                      <EscrowStepBubble $bg="rgba(254,226,226,0.9)" $border="rgba(239,68,68,0.2)">
                        🔒
                        <EscrowStepCheck>
                          <Check size={7} color="#fff" strokeWidth={3.5} />
                        </EscrowStepCheck>
                      </EscrowStepBubble>
                      <EscrowStepLabel>Funds<br/>Secured</EscrowStepLabel>
                    </EscrowStepItem>
                    <EscrowConnector />
                    <EscrowStepItem>
                      <EscrowStepBubble $bg="rgba(209,250,229,0.6)" $border="rgba(34,197,94,0.15)">
                        ✅
                      </EscrowStepBubble>
                      <EscrowStepLabel>Session<br/>Complete</EscrowStepLabel>
                    </EscrowStepItem>
                    <EscrowConnector />
                    <EscrowStepItem>
                      <EscrowStepBubble $bg="rgba(219,234,254,0.6)" $border="rgba(59,130,246,0.15)">
                        💸
                      </EscrowStepBubble>
                      <EscrowStepLabel>You Get<br/>Paid</EscrowStepLabel>
                    </EscrowStepItem>
                  </EscrowStepRow>

                  {/* Live transaction rows */}
                  <EscrowTxList>
                    <EscrowTx>
                      <EscrowTxIcon $bg="#fef9c3">🎨</EscrowTxIcon>
                      <EscrowTxMeta>
                        <EscrowTxPrimary>Pottery Workshop · Sarah O.</EscrowTxPrimary>
                        <EscrowTxSub>$60.00 CAD · releases after session</EscrowTxSub>
                      </EscrowTxMeta>
                      <EscrowTxBadge $bg="#fef3c7" $color="#92400e">In Escrow</EscrowTxBadge>
                    </EscrowTx>
                    <EscrowTx>
                      <EscrowTxIcon $bg="#dcfce7">🍳</EscrowTxIcon>
                      <EscrowTxMeta>
                        <EscrowTxPrimary>Cooking Class · 3 guests</EscrowTxPrimary>
                        <EscrowTxSub>$120.00 CAD · released to you</EscrowTxSub>
                      </EscrowTxMeta>
                      <EscrowTxBadge $bg="#dcfce7" $color="#166534">Paid Out</EscrowTxBadge>
                    </EscrowTx>
                  </EscrowTxList>
                </EscrowCard>

                {/* ── Card 3: Nearby Radar ── */}
                <RadarCard>
                  <MiniCardTitle>
                    Your next guest
                    is already nearby
                  </MiniCardTitle>
                  <MiniCardBody>
                    We surface your listing to local guests who are actively
                    searching for experiences just like yours.
                  </MiniCardBody>

                  <RadarMap>
                    {/* Concentric pulsing rings */}
                    <RadarRing $delay="0s"   style={{ width: 68,  height: 68  }} />
                    <RadarRing $delay="0.7s" style={{ width: 130, height: 130 }} />
                    <RadarRing $delay="1.4s" style={{ width: 205, height: 205 }} />
                    <RadarRing $delay="2.1s" style={{ width: 280, height: 280 }} />

                    {/* Center — host "You" bubble */}
                    <RadarCenter>
                      <RadarMe>🧑🏽‍🍳</RadarMe>
                      <RadarMeLabel>You</RadarMeLabel>
                    </RadarCenter>

                    {/* Guest badges with Memoji face emojis */}
                    <RadarBadge style={{ top: "8%", left: "3%" }}>
                      <BadgeAva $bg="#fef9c3">👩🏻‍🦰</BadgeAva>
                      <BadgeMeta>
                        <BadgeName>Sophie</BadgeName>
                        <BadgeDist><RadarGreenDot />0.4 mi away</BadgeDist>
                      </BadgeMeta>
                    </RadarBadge>

                    <RadarBadge style={{ top: "10%", right: "2%" }}>
                      <BadgeAva $bg="#dcfce7">🧑🏿‍🦱</BadgeAva>
                      <BadgeMeta>
                        <BadgeName>Marcus</BadgeName>
                        <BadgeDist><RadarGreenDot />1.2 mi away</BadgeDist>
                      </BadgeMeta>
                    </RadarBadge>

                    <RadarBadge style={{ bottom: "20%", left: "2%" }}>
                      <BadgeAva $bg="#ede9fe">👩🏽</BadgeAva>
                      <BadgeMeta>
                        <BadgeName>Amara</BadgeName>
                        <BadgeDist><RadarGreenDot />2.1 mi away</BadgeDist>
                      </BadgeMeta>
                    </RadarBadge>

                    <RadarBadge style={{ bottom: "22%", right: "2%" }}>
                      <BadgeAva $bg="#ffedd5">🧔🏻</BadgeAva>
                      <BadgeMeta>
                        <BadgeName>James</BadgeName>
                        <BadgeDist><RadarGreenDot />3.0 mi away</BadgeDist>
                      </BadgeMeta>
                    </RadarBadge>
                  </RadarMap>
                </RadarCard>

              </BentoGrid>
            </SectionContainer>
          </BentoSection>

          <DiagonalDivider fromBg="#ffffff" toBg="#f7f7f9" />
          {/* 4. Testimonials */}
          <TestimonialsSection>
            <SectionContainer>
              <SocialProofGrid>
                {/* Left: Marketing Copy */}
                <SocialProofLeft>
                  <SocialProofHeadline>
                    Trusted by 
                    many 
                    passionate hosts
                  </SocialProofHeadline>
                  <SocialProofSubtext>
                    Classeasily has helped hosts across every category — from yoga to ceramics — grow their bookings and spend less time on admin.
                  </SocialProofSubtext>
                </SocialProofLeft>

                {/* Center: Tall Image Card */}
                <CenterImageCard>
                  <Image
                    src="/63f746587912c47bc359769c_Cover (3).webp"
                    alt="Host running a workshop"
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 700px) 100vw, (max-width: 1024px) 50vw, 38vw"
                  />
                  <ImageOverlayGradient />
                  <ImageOverlayContent>
                    <ImageOverlayQuote>
                      "Classeasily made running my workshop feel completely effortless!"
                    </ImageOverlayQuote>
                    <ImageOverlayAuthor>
                      <ImageAuthorName>Sarah B.</ImageAuthorName>
                      <ImageAuthorTitle>&nbsp;· Ceramics Host &amp; Studio Owner</ImageAuthorTitle>
                    </ImageOverlayAuthor>
                  </ImageOverlayContent>
                </CenterImageCard>

                {/* Right: Testimonial Card Stack */}
                <TestimonialStack>
                  {testimonials.map((t, i) => (
                    <TestimonialCard key={i}>
                      <TestimonialCardText>{t.text}</TestimonialCardText>
                      <StarRow>★★★★★</StarRow>
                      <TestimonialCardFooter>
                        <TestimonialAvatarGroup>
                          <TestimonialAvatar $bg={t.avatarBg}>
                            {t.initials}
                          </TestimonialAvatar>
                          <TestimonialAuthorInfo>
                            <TestimonialAuthorName>{t.author}</TestimonialAuthorName>
                            <TestimonialAuthorTitle>{t.title}</TestimonialAuthorTitle>
                          </TestimonialAuthorInfo>
                        </TestimonialAvatarGroup>
                        <CompanyBadge $bg={t.badgeBg}>{t.badgeLabel}</CompanyBadge>
                      </TestimonialCardFooter>
                    </TestimonialCard>
                  ))}
                </TestimonialStack>
              </SocialProofGrid>
            </SectionContainer>
          </TestimonialsSection>

          <DiagonalDivider fromBg="#f7f7f9" toBg="#f8fafc" flip />
          {/* 5. Flexibility / How It Works */}
          <TierSection>
            <SectionContainer>
              <GrowthHeader>
                <GrowthHeadline>Grow your way</GrowthHeadline>
                <GrowthSubtext>
                  List on our marketplace to reach new customers, or embed our
                  widget on your site to convert your own traffic — or do both
                  from one account.
                </GrowthSubtext>
              </GrowthHeader>

              <GrowthGrid>
                {growthPathData.map((tier, i) => (
                  <GrowthCard key={i}>
                    <GrowthCardEyebrow $color={tier.iconColor}>
                      {tier.eyebrow}
                    </GrowthCardEyebrow>
                    <GrowthCardTitle>{tier.title}</GrowthCardTitle>
                    <GrowthCommissionBadge
                      $color={tier.commissionColor}
                      $bg={tier.commissionBg}
                    >
                      {tier.commission}
                    </GrowthCommissionBadge>
                    <GrowthCardDesc>{tier.description}</GrowthCardDesc>
                    <GrowthCardDivider />
                    <GrowthFeatureList>
                      {tier.features.map((feat, idx) => (
                        <GrowthFeatureItem key={idx}>
                          <Check size={12} color={tier.iconColor} />
                          {feat}
                        </GrowthFeatureItem>
                      ))}
                    </GrowthFeatureList>
                    <GrowthCTAButton
                      $bg={tier.buttonBg}
                      $shadow={tier.buttonShadow}
                      onClick={() => router.push(tier.buttonPath)}
                    >
                      {tier.buttonLabel}
                      <ArrowRight size={12} />
                    </GrowthCTAButton>
                  </GrowthCard>
                ))}
              </GrowthGrid>
            </SectionContainer>
          </TierSection>

          <DiagonalDivider fromBg="#f8fafc" toBg="#ffffff" />
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
