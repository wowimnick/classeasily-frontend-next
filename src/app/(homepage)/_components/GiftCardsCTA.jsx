// components/homepage/GiftCardsCTA.jsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { Button as AntButton, message } from "antd";
import { motion } from "framer-motion";
import {
  Gift,
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import LogoIcon from "@/components/common/logoIcon";

const GiftCardSection = styled.section`
  padding: 8rem 2rem;
  position: relative;
  overflow: hidden;
  background: radial-gradient(
      circle at top center,
      rgba(255, 255, 255, 0.5),
      transparent 60%
    ),
    radial-gradient(
      circle at bottom center,
      rgba(245, 245, 245, 0.3),
      transparent 70%
    ),
    #ffffff;

  @media (max-width: 1024px) {
    padding: 4rem 1.5rem;
  }
`;

const DesktopLayout = styled.div`
  display: block;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const MobileLayout = styled.div`
  display: none;
  @media (max-width: 1024px) {
    display: block;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 5rem;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 3rem;
  }
`;

const MobileContentWrapper = styled.div`
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
`;

const TextContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const MobileTextContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Title = styled.h2`
  font-size: clamp(2.5rem, 5vw, 3.2rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  background: linear-gradient(135deg, #e52e31 0%, #b42a2d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  margin-top: 0;
`;

const MobileTitle = styled.h2`
  font-size: clamp(2rem, 8vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
  background: linear-gradient(135deg, #e52e31 0%, #b42a2d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  margin-top: 0;
  text-align: center;
`;

const Description = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  color: #555;
  line-height: 1.7;
  margin-bottom: 2.5rem;
  margin-top: 0;
  max-width: 60ch;
`;

const MobileDescription = styled.p`
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  margin-top: 0;
  max-width: 90%;
  text-align: center;
`;

const Features = styled.div`
  display: flex;
  gap: 1.5rem;
  margin: 2.5rem 0;
  flex-wrap: wrap;
  @media (max-width: 1024px) {
    justify-content: center;
    gap: 1rem 1.5rem;
  }
`;

const MobileFeatures = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
  width: 100%;
  max-width: 300px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #666;
  font-size: 0.95rem;
  svg {
    color: rgb(218, 49, 52);
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const MobileFeatureItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.85rem;
  padding: 0.5rem;
  background: rgba(233, 46, 49, 0.05);
  border-radius: 8px;
  svg {
    color: rgb(218, 49, 52);
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
`;

const CardsPreviewContainer = styled.div`
  position: relative;
  height: 450px;
  min-height: 300px;
  perspective: 1200px;

  @media (max-width: 1024px) {
    height: 350px;
    margin-top: 3rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  @media (max-width: 480px) {
    height: 300px;
  }
`;

const MobileCardsContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 280px;
  height: 200px;
  margin: 0 auto 0;
  perspective: 1000px;
`;

const CardWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  max-width: 400px;
  perspective: 1200px;

  &:first-of-type {
    top: 0;
    right: 0;
    z-index: 2;
    @media (max-width: 1024px) {
      right: auto;
      left: 50%;
      transform: translateX(-55%);
    }
    @media (max-width: 480px) {
      transform: translateX(-50%);
    }
  }
  &:last-of-type {
    bottom: 0;
    left: 0;
    z-index: 1;
    @media (max-width: 1024px) {
      bottom: 10%;
      left: 50%;
      transform: translateX(-45%);
    }
    @media (max-width: 480px) {
      bottom: 5%;
      transform: translateX(-50%);
    }
  }
`;

const MobileCardWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  perspective: 1000px;

  &:first-of-type {
    top: 10px;
    left: 10px;
    z-index: 2;
    transform: rotate(-5deg);
  }
  &:last-of-type {
    top: 20px;
    right: 10px;
    z-index: 1;
    transform: rotate(5deg);
  }
`;

const CardBase = styled(motion.div)`
  width: 100%;
  aspect-ratio: 16 / 10;
  padding: 1.5rem 2rem;
  position: relative;
  transform-style: preserve-3d;
  border-radius: 10px;
  overflow: hidden;
  color: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  transition: box-shadow 0.3s ease, transform 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      circle at var(--mouse-x) var(--mouse-y),
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 15%,
      transparent 40%
    );
    opacity: var(--mouse-opacity, 0);
    transition: opacity 0.3s ease-out;
    z-index: 1;
    pointer-events: none;
  }
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    background-size: auto;
    opacity: 0.05;
    z-index: 0;
    pointer-events: none;
  }
`;

const MobileCardBase = styled(motion.div)`
  width: 100%;
  aspect-ratio: 16 / 10;
  padding: 1rem 1.25rem;
  position: relative;
  transform-style: preserve-3d;
  border-radius: 8px;
  overflow: hidden;
  color: white;
  box-shadow: 0 15px 35px -8px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    background-size: auto;
    opacity: 0.05;
    z-index: 0;
    pointer-events: none;
  }
`;

const ClassicCardStyled = styled(CardBase)`
  background: linear-gradient(135deg, #e52e31 0%, #b42a2d 100%);
`;

const PremiumCardStyled = styled(CardBase)`
  background: linear-gradient(135deg, #1f2937 0%, #3b82f6 100%);
`;

const MobileClassicCard = styled(MobileCardBase)`
  background: linear-gradient(135deg, #e52e31 0%, #b42a2d 100%);
`;

const MobilePremiumCard = styled(MobileCardBase)`
  background: linear-gradient(135deg, #1f2937 0%, #3b82f6 100%);
`;

const CardContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  z-index: 2;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Logo = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  opacity: 0.9;
  svg path {
    fill: #fff !important;
  }
`;

const MobileLogo = styled.div`
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  opacity: 0.9;
  svg path {
    fill: #fff !important;
  }
`;

const CardType = styled.div`
  text-shadow: 0px 1px 0px rgba(255, 255, 255, 0.15);
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
  padding: 0.25rem 0.6rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
`;

const MobileCardType = styled.div`
  text-shadow: 0px 1px 0px rgba(255, 255, 255, 0.15);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
  padding: 0.2rem 0.4rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
`;

const CardValue = styled.div`
  font-size: clamp(2.8rem, 7vw, 4rem);
  font-weight: 700;
  text-align: left;
  line-height: 1;
  margin-top: auto;
  margin-bottom: auto;
  padding-left: 0.5rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  span {
    font-size: 1.2rem;
    font-weight: 500;
    opacity: 0.8;
    margin-left: 0.5rem;
    text-transform: uppercase;
  }
`;

const MobileCardValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  text-align: left;
  line-height: 1;
  margin-top: auto;
  margin-bottom: auto;
  padding-left: 0.25rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  span {
    font-size: 0.8rem;
    font-weight: 500;
    opacity: 0.8;
    margin-left: 0.3rem;
    text-transform: uppercase;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.9rem;
  opacity: 0.8;
  span {
    font-weight: 500;
  }
  svg {
    opacity: 0.9;
    width: 20px;
    height: 20px;
  }
`;

const MobileCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.8rem;
  opacity: 0.8;
  span {
    font-weight: 500;
  }
  svg {
    opacity: 0.9;
    width: 16px;
    height: 16px;
  }
`;

const InteractiveCard = ({ type, children, ...motionProps }) => {
  const cardRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  }, []);
  const handleMouseEnter = useCallback(() => {
    if (cardRef.current)
      cardRef.current.style.setProperty("--mouse-opacity", "1");
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (cardRef.current)
      cardRef.current.style.setProperty("--mouse-opacity", "0");
  }, []);
  const CardComponent =
    type === "premium" ? PremiumCardStyled : ClassicCardStyled;
  const cardHoverEffect = {
    scale: 1.03,
    boxShadow:
      "0 30px 60px -15px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
  };
  return (
    <CardComponent
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={cardHoverEffect}
      {...motionProps}
    >
      {children}
    </CardComponent>
  );
};

const MobileCard = ({ type, children, ...motionProps }) => {
  const CardComponent =
    type === "premium" ? MobilePremiumCard : MobileClassicCard;
  return <CardComponent {...motionProps}>{children}</CardComponent>;
};

const GiftCardsCTA = () => {
  return (
    <GiftCardSection aria-labelledby="giftcard-title">
      <DesktopLayout>
        <ContentWrapper>
          <TextContent>
            <Title id="giftcard-title">Gift a Memorable Experience</Title>
            <Description>
              Gift a memorable experience with ClassEasily — local experiences
              they'll love, instantly delivered and never expiring.
            </Description>
            <Features>
              <FeatureItem>
                <Clock size={20} aria-hidden="true" /> Never Expires
              </FeatureItem>
              <FeatureItem>
                <DollarSign size={20} aria-hidden="true" /> Custom Amount
              </FeatureItem>
              <FeatureItem>
                <Calendar size={20} aria-hidden="true" /> Instant Delivery
              </FeatureItem>
            </Features>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ display: "inline-block" }}
              onClick={() =>
                message.info(
                  "Gift Cards are currently in development. They will be released by launch."
                )
              }
            >
              <AntButton
                type="primary"
                size="large"
                style={{
                  padding: "1rem 2.5rem",
                  height: "auto",
                  lineHeight: "1.5",
                }}
              >
                Purchase Gift Card <ArrowRight size={20} />
              </AntButton>
            </motion.div>
          </TextContent>

          <CardsPreviewContainer aria-hidden="true">
            <CardWrapper>
              <InteractiveCard
                type="classic"
                initial={{ rotateY: -10, rotateX: 8 }}
              >
                <CardContent>
                  <CardHeader>
                    <Logo>
                      <LogoIcon size={"1.8rem"} /> ClassEasily
                    </Logo>
                    <CardType>GIFT CARD</CardType>
                  </CardHeader>
                  <CardValue>
                    $100<span>CAD</span>
                  </CardValue>
                  <CardFooter>
                    <span></span> <Gift size={20} />
                  </CardFooter>
                </CardContent>
              </InteractiveCard>
            </CardWrapper>

            <CardWrapper>
              <InteractiveCard type="premium">
                <CardContent>
                  <CardHeader>
                    <Logo>
                      <LogoIcon size={"1.8rem"} /> ClassEasily
                    </Logo>
                    <CardType>GIFT CARD</CardType>
                  </CardHeader>
                  <CardValue>
                    $250<span>CAD</span>
                  </CardValue>
                  <CardFooter>
                    <span></span> <Sparkles size={20} />
                  </CardFooter>
                </CardContent>
              </InteractiveCard>
            </CardWrapper>
          </CardsPreviewContainer>
        </ContentWrapper>
      </DesktopLayout>

      <MobileLayout>
        <MobileContentWrapper>
          <MobileTextContent
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <MobileTitle id="giftcard-title-mobile">
              Gift a Memorable Experience
            </MobileTitle>
            <MobileDescription>
              Gift a memorable experience with ClassEasily — local experiences
              they'll love, instantly delivered and never expiring.
            </MobileDescription>
            <MobileFeatures>
              <MobileFeatureItem>
                <Clock size={16} aria-hidden="true" /> Never Expires
              </MobileFeatureItem>
              <MobileFeatureItem>
                <DollarSign size={16} aria-hidden="true" /> Custom Amount
              </MobileFeatureItem>
              <MobileFeatureItem>
                <Calendar size={16} aria-hidden="true" /> Instant Delivery
              </MobileFeatureItem>
              <MobileFeatureItem>
                <Gift size={16} aria-hidden="true" /> Digital Gift
              </MobileFeatureItem>
            </MobileFeatures>
          </MobileTextContent>

          <MobileCardsContainer aria-hidden="true">
            <MobileCardWrapper>
              <MobileCard type="classic">
                <CardContent>
                  <CardHeader>
                    <MobileLogo>
                      <LogoIcon size={"1.2rem"} /> ClassEasily
                    </MobileLogo>
                    <MobileCardType>GIFT CARD</MobileCardType>
                  </CardHeader>
                  <MobileCardValue>
                    $100<span>CAD</span>
                  </MobileCardValue>
                  <MobileCardFooter>
                    <span></span> <Gift size={16} />
                  </MobileCardFooter>
                </CardContent>
              </MobileCard>
            </MobileCardWrapper>

            <MobileCardWrapper>
              <MobileCard type="premium">
                <CardContent>
                  <CardHeader>
                    <MobileLogo>
                      <LogoIcon size={"1.2rem"} /> ClassEasily
                    </MobileLogo>
                    <MobileCardType>GIFT CARD</MobileCardType>
                  </CardHeader>
                  <MobileCardValue>
                    $250<span>CAD</span>
                  </MobileCardValue>
                  <MobileCardFooter>
                    <span></span> <Sparkles size={16} />
                  </MobileCardFooter>
                </CardContent>
              </MobileCard>
            </MobileCardWrapper>
          </MobileCardsContainer>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-block",
              width: "100%",
              maxWidth: "280px",
            }}
            onClick={() =>
              message.info(
                "Gift Cards are currently in development. They will be released by launch."
              )
            }
          >
            <AntButton
              type="primary"
              size="large"
              style={{
                padding: "0.875rem 2rem",
                height: "auto",
                lineHeight: "1.5",
                width: "100%",
                fontSize: "1rem",
              }}
            >
              Purchase Gift Card <ArrowRight size={18} />
            </AntButton>
          </motion.div>
        </MobileContentWrapper>
      </MobileLayout>
    </GiftCardSection>
  );
};

export default GiftCardsCTA;
