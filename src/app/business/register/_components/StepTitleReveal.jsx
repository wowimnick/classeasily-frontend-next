"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { marketingTheme as t, BP } from "@/components/marketing/tokens";

const EASE = [0.16, 1, 0.3, 1];

const Title = styled.h1`
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

function titleParts(title) {
  return String(title || "").split(/(\s+)/).filter(Boolean);
}

export default function StepTitleReveal({
  title,
  stepKey,
  reduceMotion,
  onSettled,
  align = "left",
  skipAnimation = false,
}) {
  const instant = reduceMotion === true || skipAnimation;
  const parts = useMemo(() => titleParts(title), [title]);

  useEffect(() => {
    onSettled?.();
  }, [stepKey, onSettled]);

  return (
    <Title $align={align} aria-label={title}>
      {instant
        ? title
        : (() => {
            let n = 0;
            return parts.map((part, i) => {
              if (/^\s+$/.test(part)) {
                return <Space key={`${stepKey}-sp-${i}`}>{part}</Space>;
              }
              return (
                <Word key={`${stepKey}-w-${i}`}>
                  {Array.from(part).map((ch, ci) => {
                    const delay = n * 0.028;
                    n += 1;
                    return (
                      <Letter
                        key={`${stepKey}-${i}-${ci}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay, ease: EASE }}
                      >
                        {ch}
                      </Letter>
                    );
                  })}
                </Word>
              );
            });
          })()}
    </Title>
  );
}
