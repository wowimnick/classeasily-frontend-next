"use client";

import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import { theme } from "@/components/theme";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const { Title, Text } = Typography;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  /* Pull content up slightly on desktop, less on mobile */
  margin-top: -5rem;
  position: relative;
  overflow: hidden;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
    margin-top: 0; /* Reset margin on mobile for natural flow */
    align-items: flex-start; /* Align top on mobile */
    padding-top: 2rem;
  }
`;

const LandingContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  max-width: 1400px;
  width: 100%;
  position: relative;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    display: flex;
    flex-direction: column-reverse; /* Text comes after visuals on mobile usually, but here we keep visuals top (order set below) */
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  z-index: 1;

  @media (max-width: 1024px) {
    align-items: center;
    text-align: center;
    padding: 0 1rem 2rem 1rem;
  }
`;

const AnimationSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 2rem;

  @media (max-width: 1024px) {
    /* Visuals at the top */
    order: -1;
    padding: 0 1rem 1rem 1rem;
  }
`;

const LottieContainer = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;

  .lottie-player-container {
    width: 100%;
    height: auto;
  }

  @media (max-width: 768px) {
    max-width: 280px; /* Smaller on mobile */
    margin-bottom: 1rem;
  }
`;

const StepsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  max-width: 500px;
  width: 100%;

  @media (max-width: 768px) {
    gap: 0.5rem;
    /* Make steps more compact on mobile */
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

const StepItem = styled.div`
  background: ${theme.token.colorBgContainer};
  padding: 0.8rem 1.2rem;
  border-radius: ${theme.token.borderRadius}px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid ${theme.token.colorBorder};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 0.6rem 0.8rem;
    justify-content: center;
    font-size: 13px;
  }
`;

const StepNumber = styled.span`
  background: ${theme.token.colorPrimary};
  color: ${theme.token.colorBgContainer};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const StepText = styled.span`
  font-size: 0.85rem;
  color: ${theme.token.colorTextBase};
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const HeadingText = styled.span`
  color: ${theme.token.colorPrimary};
  font-weight: 800;
`;

const StartButton = styled(motion.button)`
  background: ${theme.token.colorPrimary};
  color: ${theme.token.colorBgContainer};
  border: none;
  padding: 1rem 1.5rem;
  border-radius: ${theme.components.Button.borderRadius}px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px rgba(255, 56, 92, 0.2);
  transition: all 0.3s ease;
  font-family: ${theme.token.fontFamily};

  &:hover {
    background: ${theme.token.colorPrimaryHover};
    box-shadow: 0 4px 12px rgba(255, 56, 92, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    margin-top: 1.5rem;
    padding: 0.8rem 1rem;
    font-size: 1rem;
  }
`;

const LandingPage = ({ steps, startForm, isMobile }) => {
  const lottieAnimRef = useRef(null);
  const [isLottieReady, setIsLottieReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (lottieAnimRef.current && lottieAnimRef.current.animationItem) {
      setIsLottieReady(true);
    }
  };

  return (
    <ContentContainer>
      <LandingContainer>
        <InfoSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Title
              level={1}
              style={{
                fontSize: isMobile ? "1.8rem" : "3.5rem", // Compact font for mobile
                marginBottom: isMobile ? "0.5rem" : "1rem",
                lineHeight: 1.2,
                fontWeight: "800",
                color: theme.token.colorTextBase,
                fontFamily: theme.token.fontFamily,
              }}
            >
              Share Your Knowledge on <HeadingText>ClassEasily</HeadingText>
            </Title>
            <Text
              style={{
                fontSize: isMobile ? "1rem" : "1.2rem",
                color: theme.token.colorTextSecondary,
                display: "block",
                marginBottom: isMobile ? "1rem" : "2rem",
                maxWidth: "600px",
                fontFamily: theme.token.fontFamily,
                marginRight: isMobile ? "auto" : "0",
                marginLeft: isMobile ? "auto" : "0",
                lineHeight: 1.5,
              }}
            >
              Join as an educator and expand your reach into our community of
              curious learners! List your business in just a few easy steps.
            </Text>
            <StartButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startForm}
            >
              Begin Your Journey
              <ArrowRightOutlined />
            </StartButton>
          </motion.div>
        </InfoSection>

        <AnimationSection>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <LottieContainer>
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
            </LottieContainer>
          </motion.div>

          <StepsContainer>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                style={isMobile ? { width: "100%" } : {}}
              >
                <StepItem>
                  <StepNumber>{index + 1}</StepNumber>
                  <StepText>
                    {step.title || step.name || `Step ${index + 1}`}
                  </StepText>
                </StepItem>
              </motion.div>
            ))}
          </StepsContainer>
        </AnimationSection>
      </LandingContainer>
    </ContentContainer>
  );
};

export default LandingPage;
