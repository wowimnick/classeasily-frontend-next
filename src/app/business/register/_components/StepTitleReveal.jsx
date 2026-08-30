"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { marketingTheme as t, BP } from "@/components/marketing/tokens";

const LETTER_STAGGER = 0.036;
const LETTER_DUR = 0.3;
const HOLD_MS = 240;
const FLY_S = 0.78;
const CENTER_SCALE = 1.18;
const EASE = [0.16, 1, 0.3, 1];

const Title = styled(motion.h1)`
  position: relative;
  z-index: ${(p) => (p.$raised ? 41 : 1)};
  margin: 0 0 8px;
  font-family: ${t.fonts.body};
  font-size: clamp(26px, 3.4vw, 36px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: #111;
  text-align: ${(p) => p.$align || "left"};
  overflow-wrap: normal;
  word-break: normal;
  hyphens: none;

  @media (max-width: ${BP.mobile}px) {
    font-size: 24px;
    margin-bottom: 6px;
  }
`;

const FlyLayer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 72px 24px 24px;
  background: rgba(255, 255, 255, 0.62);
`;

const FlyTitle = styled.h1`
  margin: 0;
  font-family: ${t.fonts.body};
  font-size: clamp(32px, 5.2vw, 56px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.12;
  color: #111;
  text-align: center;
  white-space: nowrap;
`;

const Dim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.62);
`;

const Word = styled.span`
  display: inline-block;
  white-space: nowrap;
`;

const Space = styled.span`
  white-space: pre;
`;

const Letter = styled(motion.span)`
  display: inline-block;
`;

function letterDelay(chars, index) {
  return chars.slice(0, index).reduce((sum, ch) => sum + (ch === " " ? 0 : LETTER_STAGGER), 0);
}

function lettersDurationMs(chars) {
  const count = chars.filter((ch) => ch !== " ").length;
  return (count * LETTER_STAGGER + LETTER_DUR) * 1000;
}

function titleParts(title) {
  return String(title || "").split(/(\s+)/).filter(Boolean);
}

function LetterNodes({ stepKey, chars, startIndex, allChars, reduceMotion }) {
  return chars.map((ch, i) => (
    <Letter
      key={`${stepKey}-${i}`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: LETTER_DUR,
        delay: letterDelay(allChars, startIndex + i),
        ease: EASE,
      }}
    >
      {ch}
    </Letter>
  ));
}

function WordTitle({ stepKey, title, reduceMotion }) {
  const chars = useMemo(() => Array.from(String(title || "")), [title]);
  let offset = 0;
  return titleParts(title).map((part, i) => {
    if (/^\s+$/.test(part)) {
      offset += part.length;
      return <Space key={`${stepKey}-sp-${i}`}>{part}</Space>;
    }
    const start = offset;
    offset += part.length;
    return (
      <Word key={`${stepKey}-w-${i}`}>
        <LetterNodes
          stepKey={`${stepKey}-${i}`}
          chars={chars.slice(start, start + part.length)}
          startIndex={start}
          allChars={chars}
          reduceMotion={reduceMotion}
        />
      </Word>
    );
  });
}

export default function StepTitleReveal({
  title,
  stepKey,
  reduceMotion,
  onSettled,
  stayCenter = false,
  align = "left",
}) {
  const titleRef = useRef(null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  const chars = useMemo(() => Array.from(String(title || "")), [title]);
  const lettersMs = lettersDurationMs(chars);
  const [phase, setPhase] = useState(reduceMotion ? "ready" : "measure");
  const [origin, setOrigin] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    let cancelled = false;
    if (reduceMotion) {
      setPhase("ready");
      settledRef.current?.();
      return undefined;
    }
    if (stayCenter) {
      setPhase("letters");
      const timer = window.setTimeout(() => {
        if (cancelled) return;
        setPhase("ready");
        settledRef.current?.();
      }, lettersMs + 640);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
    setOrigin({ x: 0, y: 0, scale: 1 });
    setPhase("measure");
    return undefined;
  }, [stepKey, title, reduceMotion, stayCenter, lettersMs]);

  useLayoutEffect(() => {
    if (phase !== "measure" || stayCenter || reduceMotion) return;
    const el = titleRef.current;
    if (!el) {
      setPhase("ready");
      settledRef.current?.();
      return;
    }
    const home = el.getBoundingClientRect();
    setOrigin({
      x: window.innerWidth / 2 - (home.left + home.width / 2),
      y: window.innerHeight / 2 - (home.top + home.height / 2),
      scale: CENTER_SCALE,
    });
    setPhase("letters");
  }, [phase, stayCenter, reduceMotion]);

  useEffect(() => {
    if (phase !== "letters" || stayCenter || reduceMotion) return undefined;
    const timer = window.setTimeout(() => setPhase("flying"), lettersMs + HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase, stayCenter, reduceMotion, lettersMs]);

  if (stayCenter) {
    return (
      <FlyLayer>
        <FlyTitle aria-label={title}>
          <WordTitle stepKey={stepKey} title={title} reduceMotion={reduceMotion} />
        </FlyTitle>
      </FlyLayer>
    );
  }

  const raised = phase === "letters" || phase === "flying";
  const atHome = phase === "ready" || phase === "flying" || phase === "measure";

  return (
    <>
      {phase === "letters" ? <Dim /> : null}
      <Title
        ref={titleRef}
        $align={align}
        $raised={raised}
        aria-label={title}
        initial={false}
        animate={atHome ? { x: 0, y: 0, scale: 1 } : origin}
        transition={
          phase === "flying"
            ? { duration: FLY_S, ease: EASE }
            : { duration: 0 }
        }
        style={{
          transformOrigin: "center center",
          visibility: phase === "measure" ? "hidden" : "visible",
        }}
        onAnimationComplete={() => {
          if (phase !== "flying") return;
          setPhase("ready");
          settledRef.current?.();
        }}
      >
        <WordTitle stepKey={stepKey} title={title} reduceMotion={reduceMotion} />
      </Title>
    </>
  );
}
