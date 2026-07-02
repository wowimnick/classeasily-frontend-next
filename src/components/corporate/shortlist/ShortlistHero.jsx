"use client";

import styled from "styled-components";
import { motion } from "framer-motion";
import { BP, down } from "@/styles/breakpoints";
import { SHORTLIST_LEAD } from "./shortlistGuestGuideCopy";

const HeroShell = styled(motion.section)`
  padding: 0.25rem 0 1.75rem;

  ${down(BP.MOBILE)} {
    padding: 0.15rem 0 1.25rem;
  }
`;

const HeroPanel = styled(motion.div)`
  position: relative;
  display: grid;
  grid-template-columns: ${(p) => (p.$hasImage ? "minmax(0, 1fr) minmax(240px, 0.55fr)" : "1fr")};
  gap: clamp(1.25rem, 3vw, 2rem);
  align-items: center;
  padding: clamp(1.25rem, 2.5vw, 2rem);
  border: 1px solid #ebebeb;
  border-radius: 16px;
  background: ${(p) =>
    p.$accent
      ? `linear-gradient(135deg, #ffffff 0%, ${p.$accent}08 100%)`
      : "#ffffff"};
  overflow: hidden;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    align-items: start;
    padding: clamp(1rem, 3vw, 1.5rem);
  }
`;

const CopyColumn = styled.div`
  position: relative;
  z-index: 1;
  max-width: 760px;
  min-width: 0;
`;

const Eyebrow = styled(motion.p)`
  margin: 0 0 0.65rem;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
`;

const Title = styled(motion.h1)`
  font-size: clamp(2rem, 4.5vw, 2.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.12;
  color: #0f172a;
  margin: 0;
  max-width: 680px;

  ${down(BP.MOBILE)} {
    font-size: clamp(1.75rem, 7vw, 2rem);
  }
`;

const Lead = styled(motion.div)`
  font-size: 17px;
  line-height: 1.5;
  color: #334155;
  max-width: 640px;
  margin: 0.85rem 0 0;
  font-weight: 400;
  white-space: pre-wrap;
`;

const HeroImageWrap = styled(motion.div)`
  position: relative;
  z-index: 1;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: #f1f5f9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const shell = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 28 },
  },
};

export default function ShortlistHero({ companyName, introMessage, presentation }) {
  const accent = presentation?.accent_color || null;
  const heroImage = presentation?.hero_image_url?.trim?.() || "";
  const leadCopy = introMessage?.trim?.() || SHORTLIST_LEAD;

  return (
    <HeroShell variants={shell} initial="hidden" animate="visible">
      <HeroPanel variants={fadeUp} $hasImage={!!heroImage} $accent={accent}>
        <CopyColumn>
          <Eyebrow variants={fadeUp}>
            A proposal for {companyName || "your team"}
          </Eyebrow>
          <Title variants={fadeUp}>
            Experiences for {companyName || "your team"}
          </Title>
          <Lead variants={fadeUp}>{leadCopy}</Lead>
        </CopyColumn>
        {heroImage ? (
          <HeroImageWrap variants={fadeUp}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" />
          </HeroImageWrap>
        ) : null}
      </HeroPanel>
    </HeroShell>
  );
}
