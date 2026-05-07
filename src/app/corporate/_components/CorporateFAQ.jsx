"use client";

import { useId, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const Section = styled.section`
  padding: 88px 1.5rem 96px;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
`;

const Inner = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: clamp(1.75rem, 4vw, 2.15rem);
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2rem;
  letter-spacing: -0.02em;
`;

const Item = styled.div`
  border-bottom: 1px solid #e2e8f0;
  &:first-of-type {
    border-top: 1px solid #e2e8f0;
  }
`;

const Trigger = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 1.02rem;
  font-weight: 700;
  color: #0f172a;
  &:focus-visible {
    outline: 2px solid #e11d48;
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const Panel = styled(motion.div)`
  overflow: hidden;
`;

const PanelInner = styled.div`
  padding: 0 0.25rem 1.15rem 0;
  font-size: 0.98rem;
  line-height: 1.65;
  color: #475569;
  max-width: 40rem;
`;

const FAQS = [
  {
    q: "What group sizes can you support?",
    a: "From intimate leadership offsites to two-hundred-plus celebrations, we work with hosts across cities. Share your headcount and we’ll align capacity, staffing, and room flow.",
  },
  {
    q: "Can you help with invoicing or POs?",
    a: "Many hosts on ClassEasily are set up for business bookings. Note your procurement needs in the inquiry and we’ll route you to the right options and paperwork paths.",
  },
  {
    q: "How far in advance should we plan?",
    a: "Popular studios book quickly — especially Thursdays and weekends. We recommend at least three to four weeks for curated shortlists and six or more weeks for peak seasons.",
  },
  {
    q: "Is this only in certain cities?",
    a: "ClassEasily is growing across North America. Add your metro in the form and we’ll confirm availability and host density for your dates.",
  },
  {
    q: "Can you support hybrid or remote-first teams?",
    a: "Yes — tell us where people are based and we’ll suggest formats that work in-studio, hybrid kits shipped to homes, or blended experiences.",
  },
  {
    q: "What if we need to reschedule?",
    a: "Policies vary by host. We surface cancellation and reschedule windows up front so your team can decide with confidence.",
  },
];

export default function CorporateFAQ() {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const [openKey, setOpenKey] = useState(null);

  return (
    <Section id="faq">
      <Inner>
        <Title>FAQ</Title>
        {FAQS.map((item, i) => {
          const key = String(i);
          const isOpen = openKey === key;
          const panelId = `${baseId}-panel-${i}`;
          const headerId = `${baseId}-header-${i}`;
          return (
            <Item key={item.q}>
              <Trigger
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenKey(isOpen ? null : key)}
              >
                <span>{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  style={{ display: "flex", color: "#64748b" }}
                  aria-hidden
                >
                  <ChevronDown size={22} />
                </motion.span>
              </Trigger>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <Panel
                    key={key}
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <PanelInner>{item.a}</PanelInner>
                  </Panel>
                ) : null}
              </AnimatePresence>
            </Item>
          );
        })}
      </Inner>
    </Section>
  );
}
