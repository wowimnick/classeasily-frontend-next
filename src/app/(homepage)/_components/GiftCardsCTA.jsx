"use client";

import React, { useRef } from "react";
import styled from "styled-components";
import { Button as AntButton } from "antd";
import message from "@/lib/message";
import { motion } from "framer-motion";
import { ArrowRight, Wifi } from "lucide-react";
import LogoIcon from "@/components/common/logoIcon";

const GiftCardSection = styled.section`
  padding: 5rem 2rem;
  position: relative;
  overflow: hidden;
  background: radial-gradient(
    circle at top center,
    rgba(255, 255, 255, 0.8),
    #ffffff 60%
  );

  @media (max-width: 1024px) {
    padding: 4rem 1.5rem;
  }
`;

// --- Layouts ---

const ContentWrapper = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr; /* Desktop: Text (1fr) Left, Cards (1.5fr) Right */
  gap: 4rem;
  align-items: center;

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }
`;

/* 
   On Desktop: This is Column 1 (Left). 
   On Mobile: We force this to Order 3 (Bottom).
*/
const TextContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: 1024px) {
    align-items: center;
    text-align: center;
    order: 3;
    width: 100%;
  }
`;

/* 
   On Desktop: This is Column 2 (Right).
   On Mobile: We force this to Order 2 (Middle).
*/
const CardsArea = styled.div`
  position: relative;
  height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1500px;
  z-index: 1;
  width: 100%;

  @media (max-width: 1024px) {
    height: 300px;
    order: 2;
    margin-top: -1rem;
    margin-bottom: -1rem;
  }

  @media (max-width: 480px) {
    height: 260px;
  }
`;

// --- Typography ---

/* Only visible on Mobile. Order 1 (Top). */
const MobileTitle = styled.h2`
  display: none;
  font-size: clamp(2rem, 5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.1;
  color: #111;
  text-align: center;
  margin: 0;
  width: 100%;
  order: 1;

  @media (max-width: 1024px) {
    display: block;
  }
`;

/* Only visible on Desktop. Inside TextContent. */
const DesktopTitle = styled.h2`
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  font-weight: 700;
  margin-bottom: 1.2rem;
  line-height: 1.1;
  color: #1a1a1a;
  margin-top: 0;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Description = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  color: #111; /* Changed to Black */
  line-height: 1.6;
  margin-bottom: 2.5rem;
  margin-top: 0;
  max-width: 50ch;

  @media (max-width: 1024px) {
    margin-bottom: 2rem;
    font-size: 1rem;
    padding: 0 1rem;
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
  top: 50%;
  left: 50%;
  z-index: 2;

  @media (max-width: 1024px) {
    width: 320px;
    height: 200px;
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
  background: ${(props) => props.$bgColor || "#1a1a1a"};
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  color: white;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.6;
    background-image: url("/GiftCardsCTA.svg");
    mix-blend-mode: overlay;
  }

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
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: rgba(0, 0, 0, 0.2);
  }
  &::after {
    content: "";
    position: absolute;
    left: 35%;
    top: 15%;
    width: 30%;
    height: 70%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
`;

const WirelessIcon = styled(Wifi)`
  transform: rotate(90deg);
  opacity: 0.7;
`;

const CardAmount = styled.div`
  font-family: "Courier New", Courier, monospace;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  font-family: "Courier New", Courier, monospace;
  font-size: 1.1rem;
  letter-spacing: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
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
  type,
}) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    // Only run hover effect on desktop
    if (window.innerWidth < 1024 || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth < 1024) return;
    if (cardRef.current)
      cardRef.current.style.setProperty("--glare-opacity", "1");
  };

  const handleMouseLeave = () => {
    if (cardRef.current)
      cardRef.current.style.setProperty("--glare-opacity", "0");
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
          ${amount}
          <span>CAD</span>
        </CardAmount>

        <CardBottom>
          <CardDetails>
            <CardLabel>Digital Gift Code</CardLabel>
            <CardNumber>•••• {code}</CardNumber>
          </CardDetails>
          <div style={{ textAlign: "right" }}>
            <CardLabel style={{ display: "block", marginBottom: "4px" }}>
              {type}
            </CardLabel>
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
    message.info("Gift Cards are currently in development.");
  };

  return (
    <GiftCardSection aria-labelledby="giftcard-title">
      <ContentWrapper>
        {/* Mobile Title (Order 1) */}
        <MobileTitle>Gift a fun experience</MobileTitle>

        {/* Text Content: Desktop (Left/Col 1), Mobile (Order 3/Bottom) */}
        <TextContent
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <DesktopTitle>Gift a fun experience</DesktopTitle>

          <Description>
            The best gifts aren't things, they're moments. Let them pick their
            own vibe, from salsa dancing to sushi rolling. Instant delivery,
            zero wrapping paper required.
          </Description>

          <AntButton
            type="primary"
            size="large"
            onClick={handleBuyClick}
            style={{
              padding: "1rem 2.5rem",
              height: "auto",
              lineHeight: "1.5",
            }}
          >
            Purchase Gift Card{" "}
            <ArrowRight size={18} style={{ marginLeft: "8px" }} />
          </AntButton>
        </TextContent>

        {/* Cards Area: Desktop (Right/Col 2), Mobile (Order 2/Middle) */}
        <CardsArea>
          {/* Background Premium Card (Black) */}
          <InteractiveCard
            style={{
              transform: "translate(-50%, -60%) rotate(-15deg) scale(0.9)",
              zIndex: 1,
            }}
            bgColor="linear-gradient(135deg, #232526 0%, #414345 100%)"
            amount="250"
            code="8842"
          />

          {/* Foreground Classic Card (Red) */}
          <InteractiveCard
            style={{
              transform: "translate(-50%, -40%) rotate(5deg)",
              zIndex: 2,
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
