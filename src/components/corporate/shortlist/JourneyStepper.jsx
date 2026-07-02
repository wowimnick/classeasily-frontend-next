"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BP, down } from "@/styles/breakpoints";

const StepperNav = styled(motion.nav)`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  box-sizing: border-box;
`;

const TrackRow = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  position: relative;
`;

const TrackLine = styled.div`
  position: absolute;
  top: 7px;
  left: calc(12.5% + 6px);
  right: calc(12.5% + 6px);
  height: 2px;
  background: #ebebeb;
  border-radius: 1px;
  z-index: 0;
`;

const TrackFill = styled(motion.div)`
  position: absolute;
  top: 7px;
  left: calc(12.5% + 6px);
  height: 2px;
  background: #ff385c;
  border-radius: 1px;
  z-index: 1;
  transform-origin: left center;
`;

const StepCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  position: relative;
  z-index: 2;
`;

const MotionStepCol = motion(StepCol);

const StepDot = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 2px solid
    ${(p) => (p.$active ? "#111111" : p.$done ? "#ff385c" : "#d4d4d4")};
  background: ${(p) => (p.$active ? "#111111" : p.$done ? "#ff385c" : "transparent")};
  color: #ffffff;

  svg {
    width: 9px;
    height: 9px;
    stroke-width: 3;
  }

  ${down(BP.MOBILE)} {
    width: 14px;
    height: 14px;

    svg {
      width: 8px;
      height: 8px;
    }
  }
`;

const StepLabel = styled.span`
  font-size: 0.68rem;
  font-weight: ${(p) => (p.$active ? 650 : 500)};
  letter-spacing: 0.01em;
  color: ${(p) => (p.$active ? "#111111" : p.$done ? "#334155" : "#717171")};
  text-align: center;
  white-space: nowrap;
  line-height: 1.2;

  ${down(BP.MOBILE)} {
    font-size: 0.625rem;
  }
`;

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
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 26 },
  },
};

export default function JourneyStepper({ currentStep = "choose" }) {
  const order = STEPS.map((s) => s.id);
  const idx = Math.max(0, order.indexOf(currentStep));
  const fillPct = idx <= 0 ? 0 : ((idx) / (STEPS.length - 1)) * 100;

  return (
    <StepperNav
      variants={railVariants}
      initial="hidden"
      animate="visible"
      aria-label="Booking steps"
    >
      <TrackRow>
        <TrackLine aria-hidden />
        <TrackFill
          aria-hidden
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        />
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <MotionStepCol key={s.id} variants={stepVariants}>
              <StepDot $active={active} $done={done} aria-hidden>
                {done ? <Check aria-hidden /> : null}
              </StepDot>
              <StepLabel $active={active} $done={done} title={s.labelFull}>
                {s.label}
              </StepLabel>
            </MotionStepCol>
          );
        })}
      </TrackRow>
    </StepperNav>
  );
}
