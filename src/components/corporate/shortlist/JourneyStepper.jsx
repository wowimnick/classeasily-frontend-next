"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const StepperContainer = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.95rem 0 1.75rem;
  padding: 0.32rem;
  border: 1px solid #e8e8e8;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.055);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000000;
  font-size: 0.82rem;
  white-space: nowrap;
  opacity: 1;
  font-weight: ${(p) => (p.$active ? 700 : 600)};
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  background: ${(p) => (p.$active ? "#f7f7f7" : "transparent")};
`;

const MotionStepItem = motion(StepItem);

const StepNumber = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid ${(p) => (p.$active || p.$done ? "#222222" : "rgba(0,0,0,0.22)")};
  background: ${(p) => (p.$active ? "#222222" : p.$done ? "#f2f2f2" : "transparent")};
  color: ${(p) => (p.$active ? "#ffffff" : "#222222")};
  font-size: 0.7rem;
  font-weight: 700;
`;

const Separator = styled.span`
  color: #000000;
  opacity: 1;
  font-size: 1rem;
  line-height: 1;
`;

const MotionSep = motion(Separator);

const STEPS = [
  { id: "choose", label: "Choose an experience" },
  { id: "details", label: "Event details" },
  { id: "pay", label: "Deposit" },
  { id: "done", label: "Confirmed" },
];

const railVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

/** Orbit-in micro-steps: slight rotation + blur decay + overshoot scale */
const stepVariants = {
  hidden: {
    opacity: 0,
    scale: 0.68,
    rotateZ: -14,
    filter: "blur(12px)",
    x: -18,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    filter: "blur(0px)",
    x: 0,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 24,
      mass: 0.55,
    },
  },
};

const sepVariants = {
  hidden: { opacity: 0, scaleY: 0.2, rotateZ: 45 },
  visible: {
    opacity: 1,
    scaleY: 1,
    rotateZ: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 20,
    },
  },
};

export default function JourneyStepper({ currentStep = "choose" }) {
  const order = STEPS.map((s) => s.id);
  const idx = Math.max(0, order.indexOf(currentStep));

  return (
    <StepperContainer variants={railVariants} initial="hidden" animate="visible">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.id}>
            <MotionStepItem variants={stepVariants} $active={active} $done={done}>
              <StepNumber $active={active} $done={done}>
                {done ? "✓" : i + 1}
              </StepNumber>
              {s.label}
            </MotionStepItem>
            {i < STEPS.length - 1 && (
              <MotionSep variants={sepVariants} aria-hidden>
                ›
              </MotionSep>
            )}
          </React.Fragment>
        );
      })}
    </StepperContainer>
  );
}
