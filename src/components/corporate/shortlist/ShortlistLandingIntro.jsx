"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";

const IntroShell = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: #ffffff;
  color: #000000;
`;

const IntroInner = styled.div`
  width: min(920px, 100%);
`;

const Transcript = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-bottom: clamp(1.6rem, 4vw, 2.75rem);
`;

const PastLine = styled(motion.p)`
  margin: 0;
  color: #000000;
  font-size: clamp(1.05rem, 2vw, 1.45rem);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.12;
`;

const WordLine = styled(motion.h1)`
  margin: 0;
  color: #000000;
  font-size: clamp(2.35rem, 7vw, 5.4rem);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 0.98;
`;

const Word = styled(motion.span)`
  display: inline-block;
  margin-right: 0.22em;
  color: #000000;
  transform-origin: 50% 80%;
`;

const ButtonWrap = styled(motion.div)`
  margin-top: clamp(2rem, 5vw, 3.5rem);
`;

const ContinueButton = styled.button`
  appearance: none;
  border: 1px solid #000000;
  border-radius: 999px;
  background: #000000;
  color: #ffffff;
  padding: 0.95rem 1.35rem;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 650;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    opacity: 0.86;
  }

  &:focus-visible {
    outline: 2px solid #000000;
    outline-offset: 4px;
  }
`;

const lineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.115,
      delayChildren: 0.2,
    },
  },
};

const pastLineVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
};

/** Word-by-word landing reveal with a small optical snap, not a plain typewriter. */
const wordVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    rotateX: 38,
    filter: "blur(16px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      mass: 0.72,
    },
  },
};

export default function ShortlistLandingIntro({ companyName, optionCount, onContinue }) {
  const [ready, setReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => {
    const count = Number(optionCount);
    const optionText = Number.isFinite(count) && count > 0 ? `${count} options` : "your options";
    const name = companyName ? `for ${companyName}` : "for your team";
    return [
      `We found ${optionText} ${name}.`,
      "Each one is here because it could work for your group, not because it was pulled from a generic list.",
      "Next, compare the format, area, inclusions, timing, and budget side by side.",
      "If you want more context, open the class page. If one feels right, choose it and we will handle the booking flow from there.",
    ];
  }, [companyName, optionCount]);

  const currentText = steps[stepIndex] || "";
  const currentWords = currentText.split(" ");
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    setReady(false);
    const buttonDelayMs = Math.max(1500, currentWords.length * 115 + 850);
    const t = window.setTimeout(() => setReady(true), buttonDelayMs);
    return () => window.clearTimeout(t);
  }, [currentWords.length, stepIndex]);

  const handleContinue = () => {
    if (!ready) return;
    if (isLastStep) {
      onContinue();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <IntroShell>
      <IntroInner>
        {stepIndex > 0 ? (
          <Transcript>
            {steps.slice(0, stepIndex).map((line) => (
              <PastLine key={line} variants={pastLineVariants} initial="hidden" animate="visible">
                {line}
              </PastLine>
            ))}
          </Transcript>
        ) : null}

        <AnimatePresence mode="wait">
          <WordLine key={stepIndex} variants={lineVariants} initial="hidden" animate="visible">
            {currentWords.map((word, index) => (
              <Word key={`${word}-${index}`} variants={wordVariants}>
                {word}
              </Word>
            ))}
          </WordLine>
        </AnimatePresence>

        {ready ? (
          <ButtonWrap
            key={`button-${stepIndex}`}
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 210, damping: 22 }}
          >
            <ContinueButton type="button" onClick={handleContinue}>
              {isLastStep ? "Show me the shortlist" : "Continue"}
            </ContinueButton>
          </ButtonWrap>
        ) : null}
      </IntroInner>
    </IntroShell>
  );
}
