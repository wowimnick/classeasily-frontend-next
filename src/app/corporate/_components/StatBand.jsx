"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { animate, useInView } from "framer-motion";

const Section = styled.section`
  padding: 56px 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 900px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
`;

const Cell = styled.div`
  text-align: center;
`;

const Num = styled.div`
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1;
`;

const Suffix = styled.span`
  font-size: 0.55em;
  font-weight: 700;
  color: #e11d48;
  margin-left: 0.08em;
`;

const Label = styled.p`
  margin: 0.65rem 0 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.45;
`;

const STATS = [
  { end: 1200, suffix: "+", label: "Experiences hosted on the platform" },
  { end: 85, suffix: "%", label: "Teams who re-book within a year" },
  { end: 48, suffix: "h", label: "Typical first response on corporate asks" },
  { end: 3, suffix: "", label: "Curated options in every shortlist we send" },
];

function AnimatedNumber({ end, suffix, started }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!started) return;
    const controls = animate(0, end, {
      duration: 1.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setV(Math.round(latest)),
    });
    return () => controls.stop();
  }, [end, started]);

  return (
    <Num>
      {v}
      {suffix ? <Suffix>{suffix}</Suffix> : null}
    </Num>
  );
}

export default function StatBand() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <Section ref={ref} aria-label="Platform highlights">
      <Inner>
        {STATS.map((s) => (
          <Cell key={s.label}>
            <AnimatedNumber end={s.end} suffix={s.suffix} started={inView} />
            <Label>{s.label}</Label>
          </Cell>
        ))}
      </Inner>
    </Section>
  );
}
