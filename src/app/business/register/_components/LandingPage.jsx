"use client";

import React, { useRef, useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Lottie
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// --- Global Styles (Matching Reference) ---
const GlobalStyle = createGlobalStyle`
  :root {
    --glass-border: 1px solid rgba(255, 255, 255, 0.4);
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    --primary-color: #1d1d1f;
    --accent-red: #f81e3e;
  }
`;

// --- Styled Components ---

const PageWrapper = styled.div`
  position: relative;
  background-color: #ffffff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  min-height: -webkit-fill-available;
  display: flex;
  align-items: center; // Vertically center
  justify-content: center;
  overflow: hidden;
  padding: 20px;

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

const ContentContainer = styled(m.div)`
  max-width: 1100px;
  width: 100%;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 4rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
    padding-top: 40px;
    padding-bottom: 40px;
  }
`;

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 900px) {
    align-items: center;
    order: 2; // Show text below visual on mobile if preferred, or remove to keep top
  }
`;

const VisualSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media (max-width: 900px) {
    order: 1;
  }
`;

const Title = styled.h1`
  font-size: clamp(2rem, 3.5vw, 3.2rem);
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #1d1d1f;

  span {
    color: #f81e3e; // Accent color from reference
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #6e6e73;
  max-width: 480px;
  margin-bottom: 32px;
  line-height: 1.5;

  @media (max-width: 900px) {
    font-size: 1rem;
    margin-left: auto;
    margin-right: auto;
  }
`;

const StartButton = styled(m.button)`
  background: transparent;
  color: #1d1d1f;
  border: 2px solid #1d1d1f;
  height: 52px;
  padding: 0 36px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: #f81e3e;
    border-color: #f81e3e;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(248, 30, 62, 0.25);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const StepsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 420px;
  margin-top: 24px;
`;

const GlassStep = styled(m.div)`
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--glass-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(5px);
    background: rgba(255, 255, 255, 0.85);
  }
`;

const StepNumber = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StepText = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #1d1d1f;
`;

const LottieWrapper = styled(m.div)`
  width: 100%;
  max-width: 480px;
  margin-bottom: 10px;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.08));
`;

// --- Main Component ---

const LandingPage = ({ steps = [], startForm, isMobile }) => {
  const lottieAnimRef = useRef(null);
  const [isLottieReady, setIsLottieReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Lottie play segment logic
  useEffect(() => {
    const lottieWrapper = lottieAnimRef.current;
    if (isLottieReady && lottieWrapper && lottieWrapper.animationItem) {
      const animInstance = lottieWrapper.animationItem;
      if (animInstance.totalFrames && animInstance.totalFrames > 0) {
        const halfwayFrame = Math.floor(animInstance.totalFrames / 2);
        lottieWrapper.playSegments([0, halfwayFrame], true);
      } else {
        lottieWrapper.goToAndStop(0, true);
      }
    }
  }, [isLottieReady]);

  const handleLottieDOMLoaded = () => {
    if (lottieAnimRef.current?.animationItem) {
      setIsLottieReady(true);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <GlobalStyle />
      <PageWrapper>
        <ContentContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Left Column: Text & CTA */}
          <TextSection>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Title>
                Share Some Fun on <span>ClassEasily</span>
              </Title>
              <Subtitle>
                Join as host and expand your reach into our community of
                adventurers. List your experience in minutes.
              </Subtitle>

              <StartButton onClick={startForm} whileTap={{ scale: 0.95 }}>
                Begin Your Journey <ArrowRight size={18} />
              </StartButton>
            </m.div>
          </TextSection>

          {/* Right Column: Visuals & Compact Steps */}
          <VisualSection>
            <LottieWrapper
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {isMounted && (
                <Lottie
                  lottieRef={lottieAnimRef}
                  path="https://classeasily.com/public/animations/buildings.json"
                  loop={false}
                  autoplay={false}
                  onDOMLoaded={handleLottieDOMLoaded}
                  style={{ width: "100%", height: "auto" }}
                />
              )}
            </LottieWrapper>

            <StepsWrapper>
              {steps.map((step, index) => (
                <GlassStep
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <StepNumber>{index + 1}</StepNumber>
                  <StepText>
                    {step.title || step.name || `Step ${index + 1}`}
                  </StepText>
                  <CheckCircle2
                    size={16}
                    color="#10b981"
                    style={{ marginLeft: "auto", opacity: 0.6 }}
                  />
                </GlassStep>
              ))}
            </StepsWrapper>
          </VisualSection>
        </ContentContainer>
      </PageWrapper>
    </LazyMotion>
  );
};

export default LandingPage;
