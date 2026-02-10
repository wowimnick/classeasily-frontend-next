"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic import for LordIcon
const LordIcon = dynamic(
  () => import("@/services/ReactUtils").then((mod) => mod.LordIcon),
  { ssr: false }
);

const DisclaimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e8e8e8;
  box-shadow: 0px 7px 12px 4px #0000000a;
  background: #fff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #000;
`;

/* Bookmark variant (desktop): tab peeking from top of card, matches card width with small inset */
const BookmarkContainer = styled.div`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  /* Wider: ~82% of card (360px sidebar → ~295px) so it looks like a real bookmark with slight inset */
  width: 82%;
  min-width: 240px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.25rem;
  min-height: 56px;
  /* Glass bookmark tab */
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px) saturate(170%);
  -webkit-backdrop-filter: blur(12px) saturate(170%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: none;
  /* Bookmark shape: rounded top only, aligns with card radius below */
  border-radius: 12px 12px 0 0;
  box-shadow:
    0 -1px 3px rgba(0, 0, 0, 0.04),
    0 6px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: #222;
  font-size: 0.875rem;
  font-weight: 600;

  lord-icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }
`;

const AnimatedText = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const AnimatedLetter = styled(motion.span)`
  display: inline-block;
`;

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
  cursor: help;
`;

const TooltipContent = styled.div`
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: #333;
  color: white;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  max-width: 200px;
  width: max-content;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? "visible" : "hidden")};
  transition: opacity 0.2s ease, visibility 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #333;
  }
`;

const PriceDisclaimer = ({
  cancellationPolicy,
  cancellationRefundPercentage,
  variant = "default",
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const text = "Best Price Guaranteed";

  useEffect(() => {
    setIsMounted(true);
    setAnimationStarted(true);
  }, []);

  const getCancellationText = () => {
    if (!cancellationPolicy) return "No cancellation policy specified";

    const policy = cancellationPolicy.toLowerCase();
    const refundPercentage = cancellationRefundPercentage || 0;

    if (policy === "flexible") {
      return `Flexible cancellation: ${refundPercentage}% refund available`;
    } else if (policy === "moderate") {
      return `Moderate cancellation: ${refundPercentage}% refund with advance notice`;
    } else if (policy === "strict") {
      return `Strict cancellation: ${refundPercentage}% refund only in specific cases`;
    }

    return `${policy} cancellation policy: ${refundPercentage}% refund`;
  };

  const letterVariants = {
    initial: {
      scale: 1,
      color: "#000",
    },
    animate: (i) => ({
      scale: [1, 1.3, 1],
      color: ["#000", "#fc3552", "#000"],
      transition: {
        duration: 0.3,
        delay: i * 0.03,
        ease: "easeInOut",
      },
    }),
  };

  if (!isMounted) {
    if (variant === "bookmark") {
      return (
        <BookmarkContainer aria-label={text}>
          <span>{text}</span>
        </BookmarkContainer>
      );
    }
    return (
      <DisclaimerContainer>
        <span>{text}</span>
      </DisclaimerContainer>
    );
  }

  const content = (
    <>
      <LordIcon
        src="https://cdn.lordicon.com/abgykmtd.json"
        trigger="in"
        state="in-label"
        colors={variant === "bookmark" ? "primary:#222" : "primary:#000000"}
        style={{ marginRight: variant === "bookmark" ? "0.25rem" : "0.5rem" }}
      />
      <AnimatedText>
        {text.split("").map((letter, index) => (
          <AnimatedLetter
            key={index}
            custom={index}
            variants={letterVariants}
            initial="initial"
            animate={animationStarted ? "animate" : "initial"}
          >
            {letter === " " ? "\u00A0" : letter}
          </AnimatedLetter>
        ))}
      </AnimatedText>
    </>
  );

  if (variant === "bookmark") {
    return (
      <BookmarkContainer aria-label={text}>
        {content}
      </BookmarkContainer>
    );
  }

  return (
    <DisclaimerContainer>
      {content}
      {cancellationPolicy && (
        <TooltipWrapper
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <Info size={16} style={{ color: "#999" }} />
          <TooltipContent $visible={tooltipVisible}>
            {getCancellationText()}
          </TooltipContent>
        </TooltipWrapper>
      )}
    </DisclaimerContainer>
  );
};

export default PriceDisclaimer;
