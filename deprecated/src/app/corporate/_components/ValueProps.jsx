"use client";

import { useRef, useState } from "react";
import styled from "styled-components";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CORPORATE_VIDEOS } from "./corporateMedia";

const Section = styled.section`
  position: relative;
  background: #fff;
  color: #0f172a;
`;

const Intro = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 80px 1.5rem 48px;
  @media (min-width: 768px) {
    padding: 100px 2.5rem 56px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  max-width: 18ch;
`;

const Sub = styled.p`
  margin: 1rem 0 0;
  max-width: 40rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: #64748b;
`;

const Cards = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem 96px;
  @media (min-width: 768px) {
    padding: 0 2.5rem 120px;
  }
`;

const CardShell = styled.div`
  position: sticky;
  top: 72px;
  margin-bottom: 32vh;
  &:last-child {
    margin-bottom: 48px;
  }
`;

const Card = styled(motion.article)`
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 320px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
`;

const Media = styled.div`
  position: absolute;
  inset: 0;
  background: #f1f5f9;
`;

const VideoBg = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.45;
`;

const Gradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(255, 255, 255, 0.72) 45%,
    rgba(254, 242, 242, 0.55) 100%
  );
`;

const Body = styled.div`
  position: relative;
  z-index: 2;
  padding: 2rem 1.75rem 2.25rem;
  max-width: 28rem;
  @media (min-width: 768px) {
    padding: 2.5rem 2.25rem 2.75rem;
  }
`;

const Step = styled.span`
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #e11d48;
  margin-bottom: 0.65rem;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.65rem;
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
`;

const CardLead = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #475569;
`;

const CARDS = [
  {
    step: "What we provide",
    title: "Curated shortlists—not endless tabs",
    lead:
      "Tell us city, headcount, and vibe. We return a tight set of verified hosts that fit your brief.",
    video: CORPORATE_VIDEOS.valueCurate,
    fallback: "linear-gradient(135deg, #fce7f3, #e0e7ff)",
  },
  {
    step: "Trust",
    title: "Hosts who show up professionally",
    lead:
      "Every partner is vetted for quality, clarity, and logistics—so your People team isn’t chasing confirmations.",
    video: CORPORATE_VIDEOS.valueHost,
    fallback: "linear-gradient(135deg, #cffafe, #e0f2fe)",
  },
  {
    step: "Operations",
    title: "One path from idea to invoice",
    lead:
      "We align on add-ons, accessibility, and procurement-friendly flows so finance gets fewer surprises.",
    video: CORPORATE_VIDEOS.valueInvoice,
    fallback: "linear-gradient(135deg, #fef3c7, #ffedd5)",
  },
];

function LoopVideo({ src, reduceMotion }) {
  const [ok, setOk] = useState(true);
  if (reduceMotion || !ok) return null;
  return (
    <VideoBg
      src={src}
      muted
      playsInline
      autoPlay
      loop
      preload="metadata"
      onError={() => setOk(false)}
      aria-hidden
    />
  );
}

export default function ValueProps() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const introY = useTransform(scrollYProgress, [0, 0.35], [40, 0]);
  const introOp = useTransform(scrollYProgress, [0, 0.25], [0.35, 1]);

  return (
    <Section ref={sectionRef} id="value-props">
      <Intro>
        <motion.div style={{ y: reduceMotion ? 0 : introY, opacity: reduceMotion ? 1 : introOp }}>
          <Title>What ClassEasily delivers for corporate teams</Title>
          <Sub>
            A single relationship for discovery, alignment, and booking—built for
            offsites, ERGs, client entertainment, and culture moments that matter.
          </Sub>
        </motion.div>
      </Intro>
      <Cards>
        {CARDS.map((c) => (
          <CardShell key={c.title}>
            <Card
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? false : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ type: "spring", stiffness: 80, damping: 22 }}
            >
              <Media style={{ background: c.fallback }}>
                <LoopVideo src={c.video} reduceMotion={reduceMotion} />
                <Gradient />
              </Media>
              <Body>
                <Step>{c.step}</Step>
                <CardTitle>{c.title}</CardTitle>
                <CardLead>{c.lead}</CardLead>
              </Body>
            </Card>
          </CardShell>
        ))}
      </Cards>
    </Section>
  );
}
