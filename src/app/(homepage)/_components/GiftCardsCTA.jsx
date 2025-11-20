"use client";

import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { Button as AntButton } from 'antd';
import message from '@/lib/message';
import { motion } from "framer-motion";
import {
  Gift,
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  Clock,
  Wifi
} from "lucide-react";
import LogoIcon from "@/components/common/logoIcon";

const GiftCardSection = styled.section`
  padding: 8rem 2rem;
  position: relative;
  overflow: hidden;
  background: radial-gradient(
      circle at top center,
      rgba(255, 255, 255, 0.8),
      #ffffff 60%
    );

  @media (max-width: 1024px) {
    padding: 5rem 1.5rem;
  }
`;

// --- Layouts ---

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 4rem;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 4rem;
  }
`;

const TextContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    order: 1; 
  }
`;

const CardsArea = styled.div`
  position: relative;
  height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1500px;
  z-index: 1;

  @media (max-width: 1024px) {
    height: 400px;
    order: 2;
  }
  @media (max-width: 480px) {
    height: 320px;
  }
`;

// --- Typography & Features ---

const Title = styled.h2`
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  font-weight: 700;
  margin-bottom: 1.2rem;
  line-height: 1.1;
  color: #1a1a1a;
  margin-top: 0;
`;

const Description = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  color: #555;
  line-height: 1.6;
  margin-bottom: 2rem;
  margin-top: 0;
  max-width: 50ch;
`;

const Features = styled.div`
  display: flex;
  gap: 1rem 2rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 1024px) {
    justify-content: center;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #444;
  font-weight: 500;
  font-size: 0.95rem;
  
  svg {
    color: #e52e31;
    width: 18px;
    height: 18px;
  }
`;

// --- High-Fidelity 3D Card Styles ---

const CardContainer = styled(motion.div)`
  position: absolute;
  width: 380px;
  height: 240px;
  border-radius: 16px;
  transform-style: preserve-3d;
  cursor: default;
  
  /* Default positioning for Classic Card */
  top: 50%;
  left: 50%;
  z-index: 2;
  
  @media (max-width: 1024px) {
    width: 340px;
    height: 215px;
  }
  
  @media (max-width: 480px) {
    width: 280px;
    height: 176px;
  }
`;

const CardFace = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 16px;
  overflow: hidden;
  /* Glass/Plastic texture base */
  background: ${props => props.$bgColor || '#1a1a1a'};
  box-shadow: 
    0 20px 50px rgba(0,0,0,0.3),
    inset 0 0 0 1px rgba(255,255,255,0.15);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  color: white;
  
  /* Texture Overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.6;
    mix-blend-mode: overlay;
  }
  
  /* Dynamic Glare Effect */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0) 60%
    );
    opacity: var(--glare-opacity, 0);
    transition: opacity 0.2s;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    padding: 18px;
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardChip = styled.div`
  width: 45px;
  height: 34px;
  background: linear-gradient(135deg, #d9d9d9 0%, #b3b3b3 50%, #e6e6e6 100%);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: rgba(0,0,0,0.2);
  }
  &::after {
    content: '';
    position: absolute;
    left: 35%;
    top: 15%;
    width: 30%;
    height: 70%;
    border: 1px solid rgba(0,0,0,0.2);
    border-radius: 4px;
  }
`;

const WirelessIcon = styled(Wifi)`
  transform: rotate(90deg);
  opacity: 0.7;
`;

const CardAmount = styled.div`
  font-family: 'Courier New', Courier, monospace; /* Monospace for card feel */
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  display: flex;
  align-items: baseline;
  
  span {
    font-size: 1rem;
    margin-left: 8px;
    opacity: 0.8;
    font-family: inherit;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardLabel = styled.span`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.7;
`;

const CardNumber = styled.span`
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1rem;
  letter-spacing: 2px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
`;

const BrandLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 1.1rem;
  opacity: 0.9;
  
  svg path {
    fill: white !important;
  }
`;

// --- Component Logic ---

const InteractiveCard = ({ 
  style, 
  initial, 
  animate,
  bgColor,
  amount,
  code,
  type
}) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseEnter = () => {
    if(cardRef.current) cardRef.current.style.setProperty('--glare-opacity', '1');
  };

  const handleMouseLeave = () => {
    if(cardRef.current) cardRef.current.style.setProperty('--glare-opacity', '0');
  };

  return (
    <CardContainer
      style={style}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <CardFace 
        ref={cardRef} 
        $bgColor={bgColor}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardTop>
          <CardChip />
          <WirelessIcon size={24} />
        </CardTop>

        <CardAmount>
          ${amount}<span>CAD</span>
        </CardAmount>

        <CardBottom>
          <CardDetails>
            <CardLabel>Digital Gift Code</CardLabel>
            <CardNumber>•••• {code}</CardNumber>
          </CardDetails>
          <div style={{ textAlign: 'right' }}>
            <CardLabel style={{ display: 'block', marginBottom: '4px' }}>{type}</CardLabel>
            <BrandLogo>
               <LogoIcon size="1.5rem" /> ClassEasily
            </BrandLogo>
          </div>
        </CardBottom>
      </CardFace>
    </CardContainer>
  );
};

const GiftCardsCTA = () => {
  const handleBuyClick = () => {
    message.info("Gift Cards are currently in development. They will be released by launch.");
  };

  return (
    <GiftCardSection aria-labelledby="giftcard-title">
      <ContentWrapper>
        
        <TextContent
           initial={{ opacity: 0, x: -20 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
        >
          <Title id="giftcard-title">Give the gift of learning</Title>
          <Description>
            Perfect for any occasion. ClassEasily gift cards unlock thousands of local experiences, 
            from pottery workshops to cooking classes. Delivered instantly via email.
          </Description>
          
          <Features>
            <FeatureItem><Clock /> Never Expires</FeatureItem>
            <FeatureItem><DollarSign /> Any Amount</FeatureItem>
            <FeatureItem><Calendar /> Instant Delivery</FeatureItem>
          </Features>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <AntButton
              type="primary"
              size="large"
              onClick={handleBuyClick}
              style={{
                padding: "0 2.5rem",
                height: "50px",
                fontSize: "1rem",
                borderRadius: "25px",
                background: "#E92E31",
                border: "none"
              }}
            >
              Purchase Gift Card <ArrowRight size={18} style={{marginLeft: '8px'}}/>
            </AntButton>
          </motion.div>
        </TextContent>

        <CardsArea>
          {/* Background Premium Card (Black) */}
          <InteractiveCard 
            style={{ 
              // Centered Y (-55%), Centered X (-50%), Rotated
              transform: 'translate(-50%, -60%) rotate(-15deg) scale(0.9)', 
              zIndex: 1 
            }}
            bgColor="linear-gradient(135deg, #232526 0%, #414345 100%)"
            amount="250"
            code="8842"
          />

          {/* Foreground Classic Card (Red) */}
          <InteractiveCard 
            style={{ 
              // Centered Y (-45%), Centered X (-50%), Rotated
              transform: 'translate(-50%, -40%) rotate(5deg)', 
              zIndex: 2 
            }}
            bgColor="linear-gradient(135deg, #E92E31 0%, #c41e21 100%)"
            amount="100"
            code="4291"
          />
        </CardsArea>

      </ContentWrapper>
    </GiftCardSection>
  );
};

export default GiftCardsCTA;