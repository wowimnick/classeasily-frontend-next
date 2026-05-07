"use client";

import { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { CORPORATE_VIDEOS } from "./corporateMedia";

const Section = styled.section`
  position: relative;
  background: #fff;
`;

const Pin = styled.div`
  position: ${(p) => (p.$static ? "relative" : "sticky")};
  top: 0;
  min-height: ${(p) => (p.$static ? "auto" : "100vh")};
  display: flex;
  align-items: center;
  padding: 72px 1.5rem;
  @media (min-width: 768px) {
    padding: 88px 2.5rem;
  }
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const Row = styled.div`
  display: grid;
  gap: 2rem;
  align-items: center;
  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 3rem;
  }
`;

const StepsCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StepBtn = styled.button`
  text-align: left;
  border: none;
  background: transparent;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  cursor: default;
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;
  ${(p) =>
    p.$active
      ? `
    background: #fff5f7;
    box-shadow: 0 12px 40px rgba(225, 29, 72, 0.12);
  `
      : `
    background: #f8fafc;
  `}
`;

const StepNum = styled.span`
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #e11d48;
  margin-bottom: 0.35rem;
`;

const StepTitle = styled.span`
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
`;

const StepBody = styled.span`
  display: block;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #64748b;
`;

const MediaCol = styled.div`
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  min-height: 280px;
  aspect-ratio: 16 / 11;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 56px rgba(15, 23, 42, 0.08);
`;

const MediaLayer = styled(motion.div)`
  position: absolute;
  inset: 0;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MediaFallback = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) => p.$grad};
`;

const STEPS = [
  {
    title: "Tell us what you need",
    body: "Headcount, metro, dates, vibe, and any procurement notes—we intake once.",
    video: CORPORATE_VIDEOS.howTell,
    grad: "linear-gradient(135deg, #e0e7ff, #fce7f3)",
  },
  {
    title: "We curate a shortlist",
    body: "Three strong options from verified hosts—clear pricing paths and photos you can forward.",
    video: CORPORATE_VIDEOS.howCurate,
    grad: "linear-gradient(135deg, #cffafe, #e0f2fe)",
  },
  {
    title: "Book with confidence",
    body: "Align on add-ons, accessibility, and run-of-show. Your team gets one coherent thread.",
    video: CORPORATE_VIDEOS.howBook,
    grad: "linear-gradient(135deg, #d1fae5, #ecfccb)",
  },
  {
    title: "Celebrate & debrief",
    body: "Show up, connect, and let us know how it landed—we use feedback to tune the next one.",
    video: CORPORATE_VIDEOS.howCelebrate,
    grad: "linear-gradient(135deg, #ffedd5, #fef3c7)",
  },
];

function StepMedia({ step, active, reduceMotion }) {
  const [ok, setOk] = useState(true);
  const showVideo = ok && !reduceMotion;
  return (
    <MediaLayer
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: active ? "auto" : "none" }}
    >
      {showVideo ? (
        <Video
          src={step.video}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          onError={() => setOk(false)}
          aria-hidden
        />
      ) : null}
      <MediaFallback $grad={step.grad} style={{ opacity: showVideo ? 0.35 : 1 }} />
    </MediaLayer>
  );
}

export default function HowItWorksCorporate() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    if (reduceMotion) setActive(0);
  }, [reduceMotion]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduceMotion) return;
    if (v < 0.26) setActive(0);
    else if (v < 0.51) setActive(1);
    else if (v < 0.76) setActive(2);
    else setActive(3);
  });

  const headY = useTransform(scrollYProgress, [0, 0.2], reduceMotion ? [0, 0] : [24, 0]);
  const headOp = useTransform(scrollYProgress, [0, 0.15], reduceMotion ? [1, 1] : [0.2, 1]);

  return (
    <Section
      ref={sectionRef}
      id="how-it-works-corporate"
      style={{ minHeight: reduceMotion ? "auto" : "380vh" }}
    >
      <Pin $static={!!reduceMotion}>
        <Inner>
          <motion.div style={{ y: headY, opacity: headOp }}>
            <h2
              style={{
                margin: "0 0 0.5rem",
                fontSize: "clamp(1.75rem, 4vw, 2.35rem)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              How it works
            </h2>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                maxWidth: "36rem",
              }}
            >
              A calm, guided flow from first note to event day—built for People teams
              who already have enough tabs open.
            </p>
          </motion.div>
          <Row>
            <StepsCol>
              {STEPS.map((s, i) => (
                <StepBtn
                  key={s.title}
                  type="button"
                  $active={active === i}
                  aria-current={active === i ? "step" : undefined}
                >
                  <StepNum>{`0${i + 1}`}</StepNum>
                  <StepTitle>{s.title}</StepTitle>
                  <StepBody>{s.body}</StepBody>
                </StepBtn>
              ))}
            </StepsCol>
            <MediaCol aria-live="polite">
              {STEPS.map((s, i) => (
                <StepMedia
                  key={s.title}
                  step={s}
                  active={active === i}
                  reduceMotion={reduceMotion}
                />
              ))}
            </MediaCol>
          </Row>
        </Inner>
      </Pin>
    </Section>
  );
}
