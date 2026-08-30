"use client";

import { useRef } from "react";
import styled from "styled-components";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Check, X } from "lucide-react";

const Section = styled.section`
  padding: 88px 1.5rem 96px;
  background: #fff;
  @media (min-width: 768px) {
    padding: 112px 2.5rem 120px;
  }
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
  text-align: center;
`;

const Sub = styled.p`
  margin: 0 auto 3rem;
  max-width: 40rem;
  text-align: center;
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  gap: 1.25rem;
  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
`;

const Card = styled(motion.div)`
  border-radius: 20px;
  padding: 1.75rem 1.5rem;
  border: 1px solid #e2e8f0;
  background: #fafafa;
  height: 100%;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const Row = styled.div`
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.65rem 0;
  border-top: 1px solid #e2e8f0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #334155;
  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
`;

const IconOk = styled.span`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(225, 29, 72, 0.12);
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconNo = styled(IconOk)`
  background: #f1f5f9;
  color: #94a3b8;
`;

const usRows = [
  "One curated shortlist matched to your brief and budget",
  "Verified hosts with clear run-of-show and contingency thinking",
  "Support for accessibility, dietary, and procurement questions",
  "A partner who stays with you from idea to post-event debrief",
];

const themRows = [
  "Dozens of tabs, DMs, and PDFs across unknown vendors",
  "Last-minute surprises on capacity, materials, or pricing",
  "Your team becomes the project manager for every detail",
  "Little continuity if the host cancels or the room changes",
];

export default function Differentiators() {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yUs = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [48, -24]);
  const yThem = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [32, -12]);

  return (
    <Section ref={ref} id="differentiators">
      <Inner>
        <Title>How we’re different</Title>
        <Sub>
          Team events shouldn’t feel like a second job for Ops. ClassEasily is built
          for the way companies actually plan—fast, accountable, and human.
        </Sub>
        <Grid>
          <motion.div style={{ y: yThem }}>
            <Card>
              <CardHead style={{ color: "#64748b" }}>
                <IconNo aria-hidden>
                  <X size={14} strokeWidth={2.5} />
                </IconNo>
                The old way
              </CardHead>
              {themRows.map((t) => (
                <Row key={t}>
                  <IconNo aria-hidden>
                    <X size={14} strokeWidth={2.5} />
                  </IconNo>
                  <span>{t}</span>
                </Row>
              ))}
            </Card>
          </motion.div>
          <motion.div style={{ y: yUs }}>
            <Card
              style={{
                background: "linear-gradient(180deg, #fff 0%, #fff5f7 100%)",
                borderColor: "rgba(225, 29, 72, 0.2)",
                boxShadow: "0 24px 70px rgba(225, 29, 72, 0.08)",
              }}
            >
              <CardHead style={{ color: "#be123c" }}>
                <IconOk aria-hidden>
                  <Check size={14} strokeWidth={2.5} />
                </IconOk>
                With ClassEasily
              </CardHead>
              {usRows.map((t) => (
                <Row key={t}>
                  <IconOk aria-hidden>
                    <Check size={14} strokeWidth={2.5} />
                  </IconOk>
                  <span>{t}</span>
                </Row>
              ))}
            </Card>
          </motion.div>
        </Grid>
      </Inner>
    </Section>
  );
}
