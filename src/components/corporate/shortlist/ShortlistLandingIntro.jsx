"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { BP, down, up } from "@/styles/breakpoints";

const IntroShell = styled.main`
  height: 100dvh;
  max-height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: max(0.75rem, env(safe-area-inset-top, 0px)) max(0.75rem, env(safe-area-inset-right, 0px))
    max(0.75rem, env(safe-area-inset-bottom, 0px)) max(0.75rem, env(safe-area-inset-left, 0px));
  background: #ffffff;
  color: #000000;
  box-sizing: border-box;
`;

const ContentScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
`;

const IntroInner = styled.div`
  width: min(920px, 100%);
  margin-inline: auto;
  padding: clamp(2.5rem, 10vmin, 5rem) clamp(0.75rem, 3vw, 1.5rem)
    max(2rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)));
`;

const Transcript = styled.div`
  display: grid;
  gap: clamp(0.65rem, 2vw, 0.85rem);
  margin-bottom: clamp(1.25rem, 3.5vw, 2rem);
`;

const PastLine = styled(motion.p)`
  margin: 0;
  color: #000000;
  font-size: clamp(1rem, 2.2vw, 1.4rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.35;

  ${down(BP.XS)} {
    line-height: 1.42;
  }
`;

/**
 * Wrapper that owns the group exit animation so the WordLine inside
 * exits as a single solid block — no per-word scale/distortion.
 */
const ActiveLineWrap = styled(motion.div)`
  /* block so h1 inside lays out normally */
`;

const WordLine = styled(motion.h1)`
  margin: 0;
  color: #000000;
  font-size: clamp(1.85rem, 6.5vw, 5rem);
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1.05;

  ${down(BP.MOBILE)} {
    line-height: 1.08;
  }
`;

const Word = styled(motion.span)`
  display: inline-block;
  margin-right: 0.22em;
  color: #000000;
  transform-origin: 50% 80%;
`;

const ButtonWrap = styled(motion.div)`
  margin-top: clamp(1.65rem, 4vw, 2.75rem);
  display: flex;
  flex-direction: column;
  align-items: stretch;

  ${up(BP.MOBILE)} {
    align-items: flex-start;
  }
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
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease;

  ${up(BP.MOBILE)} {
    width: auto;
    min-width: min(100%, 13.5rem);
  }

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

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  &:disabled:hover {
    transform: none;
  }
`;

/* ─── Framer variants ─────────────────────────────────────────── */

const lineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.105,
      delayChildren: 0.05,
    },
  },
};

const pastLineVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
};

/**
 * Word entrance: reduced rotateX (18 → was 38) and softer blur so
 * letters don't visually warp, especially on mobile.
 */
const wordVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    rotateX: 18,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.68,
    },
  },
};

/** Exit: the whole active block moves upward as a unit — no per-word distortion. */
const activeWrapExit = {
  opacity: 0,
  y: -64,
  filter: "blur(10px)",
  transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
};

/* ─── Component ─────────────────────────────────────────────────── */

export default function ShortlistLandingIntro({ companyName, optionCount, onContinue }) {
  const [ready, setReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  const steps = useMemo(() => {
    const count = Number(optionCount);
    const audience = companyName ? `for ${companyName}` : "for your team";
    const hasCount = Number.isFinite(count) && count > 0;
    const openLine = !hasCount
      ? `Here is a shortlist of options ${audience}.`
      : count === 1
        ? `Here is one option ${audience}.`
        : `Here are ${count} options ${audience}.`;
    return [
      openLine,
      "Each option reflects what you told us in your inquiry. We are here to help you organize the event.",
      "On the next screen, compare them in one table: location, timing, what is included, and price.",
      "Open any class page if you want the full write-up. When you are ready, select the experience you want.",
      "To reserve it: you will confirm a few details and pay a deposit. We will confirm timing and logistics with you afterward. The remaining amount is invoiced before the event.",
    ];
  }, [companyName, optionCount]);

  const currentWords = steps[stepIndex]?.split(" ") ?? [];
  const isLastStep = stepIndex >= steps.length - 1;

  /* Wait for all words to animate in, then reveal Continue */
  useEffect(() => {
    setReady(false);
    const delay = Math.max(1500, currentWords.length * 105 + 750);
    const t = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(t);
  }, [currentWords.length, stepIndex]);

  /**
   * After the exit animation completes (≈ 280 ms) the new ActiveLineWrap
   * has mounted and activeRef.current is valid. We then scroll ContentScroll
   * so that element sits vertically centred in the viewport.
   */
  useEffect(() => {
    if (stepIndex === 0) return;
    const t = window.setTimeout(() => {
      const container = scrollRef.current;
      const el = activeRef.current;
      if (!container || !el) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const target =
        container.scrollTop +
        (elRect.top - containerRect.top) -
        (containerRect.height - elRect.height) / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }, 360); // exit (280ms) + small buffer
    return () => window.clearTimeout(t);
  }, [stepIndex]);

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
      <ContentScroll ref={scrollRef}>
        <IntroInner>
          {stepIndex > 0 ? (
            <Transcript>
              {steps.slice(0, stepIndex).map((line, i) => (
                <PastLine
                  key={`${i}-${line.slice(0, 24)}`}
                  variants={pastLineVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {line}
                </PastLine>
              ))}
            </Transcript>
          ) : null}

          {/*
           * AnimatePresence mode="wait": the old ActiveLineWrap exits fully
           * before the new one enters, so they never overlap / distort.
           */}
          <AnimatePresence mode="wait">
            <ActiveLineWrap
              key={stepIndex}
              ref={activeRef}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={activeWrapExit}
            >
              <WordLine variants={lineVariants} initial="hidden" animate="visible">
                {currentWords.map((word, index) => (
                  <Word key={`${word}-${index}`} variants={wordVariants}>
                    {word}
                  </Word>
                ))}
              </WordLine>

              <ButtonWrap
                key={`cta-${stepIndex}`}
                initial={false}
                animate={{
                  opacity: ready ? 1 : 0,
                  y: ready ? 0 : 10,
                  filter: ready ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ type: "spring", stiffness: 210, damping: 24 }}
                style={{ pointerEvents: ready ? "auto" : "none" }}
              >
                <ContinueButton type="button" disabled={!ready} onClick={handleContinue}>
                  {isLastStep ? "Show me the shortlist" : "Continue"}
                </ContinueButton>
              </ButtonWrap>
            </ActiveLineWrap>
          </AnimatePresence>
        </IntroInner>
      </ContentScroll>
    </IntroShell>
  );
}
