"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { BP, down } from "@/styles/breakpoints";

const StepperNav = styled(motion.nav)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.1rem 0.2rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

const StepRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex-wrap: nowrap;
`;

const StepItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.12rem 0.4rem 0.12rem 0.28rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: ${(p) => (p.$active ? 650 : 500)};
  letter-spacing: 0.01em;
  color: ${(p) => (p.$active ? "#111111" : "#717171")};
  background: ${(p) => (p.$active ? "#f4f4f4" : "transparent")};
  white-space: nowrap;

  ${down(BP.MOBILE)} {
    font-size: 0.625rem;
    padding: 0.1rem 0.32rem 0.1rem 0.24rem;
    gap: 0.28rem;
  }
`;

const MotionStepItem = motion(StepItem);

const StepDot = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 0.55rem;
  font-weight: 700;
  border: 1px solid
    ${(p) => (p.$active ? "#111111" : p.$done ? "#d4d4d4" : "rgba(0,0,0,0.18)")};
  background: ${(p) => (p.$active ? "#111111" : p.$done ? "#e8e8e8" : "#ffffff")};
  color: ${(p) => (p.$active ? "#ffffff" : "#222222")};

  ${down(BP.MOBILE)} {
    width: 13px;
    height: 13px;
    font-size: 0.5rem;
  }
`;

const Separator = styled.span`
  display: inline-flex;
  align-items: center;
  color: #d4d4d4;
  font-size: 0.65rem;
  line-height: 1;
  padding: 0 0.05rem;
  user-select: none;
`;

const MotionSep = motion(Separator);

const STEPS = [
  { id: "choose", label: "Compare", labelFull: "Compare options" },
  { id: "details", label: "Details", labelFull: "Event details" },
  { id: "pay", label: "Deposit", labelFull: "Pay deposit" },
  { id: "done", label: "Confirmed", labelFull: "Confirmed" },
];

const railVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
};

const sepVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
};

export default function JourneyStepper({ currentStep = "choose" }) {
  const order = STEPS.map((s) => s.id);
  const idx = Math.max(0, order.indexOf(currentStep));

  return (
    <StepperNav
      variants={railVariants}
      initial="hidden"
      animate="visible"
      aria-label="Booking steps"
    >
      <StepRow>
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <React.Fragment key={s.id}>
              <MotionStepItem variants={stepVariants} $active={active} $done={done}>
                <StepDot $active={active} $done={done} aria-hidden>
                  {done ? "✓" : i + 1}
                </StepDot>
                <span title={s.labelFull}>{s.label}</span>
              </MotionStepItem>
              {i < STEPS.length - 1 && (
                <MotionSep variants={sepVariants} aria-hidden>
                  /
                </MotionSep>
              )}
            </React.Fragment>
          );
        })}
      </StepRow>
    </StepperNav>
  );
}
