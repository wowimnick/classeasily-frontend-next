"use client";

import styled from "styled-components";
import { motion } from "framer-motion";
import {
  SHORTLIST_BOOKING_FLOW,
  SHORTLIST_LEAD,
} from "./shortlistGuestGuideCopy";

const HeroShell = styled(motion.section)`
  padding: 0.25rem 0 1.75rem;
`;

const HeroPanel = styled(motion.div)`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: clamp(1rem, 3vw, 2rem);
  align-items: center;
  padding: clamp(1rem, 2.5vw, 1.5rem);
  border: 1px solid #e8e8e8;
  border-radius: 28px;
  background:
    radial-gradient(circle at 92% 12%, rgba(255, 56, 92, 0.09), transparent 31%),
    linear-gradient(135deg, #ffffff 0%, #fbfbfb 100%);
  overflow: hidden;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

const CopyColumn = styled.div`
  position: relative;
  z-index: 1;
  max-width: 760px;
`;

const Title = styled(motion.h1)`
  font-size: clamp(1.8rem, 3.2vw, 2.5rem);
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.06;
  color: #000000;
  margin: 0;
  max-width: 680px;
`;

const Lead = styled(motion.p)`
  font-size: clamp(0.96rem, 1.25vw, 1.05rem);
  line-height: 1.5;
  color: #000000;
  max-width: 720px;
  margin: 0.85rem 0 0;
  font-weight: 400;
`;

const ProcessCard = styled(motion.aside)`
  position: relative;
  z-index: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  padding: 0.9rem;
  border: 1px solid rgba(34, 34, 34, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(18px);
`;

const ProcessHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #eeeeee;
`;

const ProcessKicker = styled.span`
  color: #000000;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const ProcessStatus = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.3rem 0.5rem;
  background: #f7f7f7;
  color: #000000;
  font-size: 0.73rem;
  font-weight: 650;
`;

const FlowList = styled(motion.div)`
  display: grid;
  gap: 0.65rem;
  margin-top: 0.75rem;
`;

const FlowItem = styled(motion.div)`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 0.65rem;
  align-items: start;
`;

const FlowNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #000000;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
`;

const FlowTitle = styled.span`
  display: block;
  color: #000000;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.2;
`;

const FlowText = styled.span`
  display: block;
  margin-top: 0.25rem;
  color: #000000;
  font-size: 0.8rem;
  line-height: 1.38;
  font-weight: 400;
`;

const shell = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.06,
    },
  },
};

const panelReveal = {
  hidden: {
    opacity: 0,
    scale: 0.985,
    rotateX: 4,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
      mass: 0.82,
    },
  },
};

const titleReveal = {
  hidden: {
    opacity: 0,
    filter: "blur(14px)",
    clipPath: "polygon(-8% 0, -8% 0, -8% 110%, -8% 110%)",
    skewX: "-2deg",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    clipPath: "polygon(-8% 0, 108% 0, 108% 110%, -8% 110%)",
    skewX: "0deg",
    transition: {
      duration: 0.72,
      ease: [0.16, 1, 0.3, 1],
      filter: { duration: 0.55 },
    },
  },
};

const softBloom = {
  hidden: { opacity: 0, scale: 0.97, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 120, damping: 18, mass: 0.8 },
  },
};

const cardReveal = {
  hidden: {
    opacity: 0,
    x: 28,
    rotateY: -7,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 170,
      damping: 22,
      mass: 0.72,
      delay: 0.12,
    },
  },
};

const flowItemReveal = {
  hidden: { opacity: 0, x: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

const flowStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.03,
    },
  },
};

export default function ShortlistHero({ companyName }) {
  return (
    <HeroShell variants={shell} initial="hidden" animate="visible">
      <HeroPanel variants={panelReveal}>
        <CopyColumn>
          <Title variants={titleReveal}>
            Handpicked experiences for {companyName || "your team"}
          </Title>
          <Lead variants={softBloom}>{SHORTLIST_LEAD}</Lead>
        </CopyColumn>

        <ProcessCard variants={cardReveal}>
          <ProcessHeader>
            <ProcessKicker>How it works</ProcessKicker>
            <ProcessStatus>No obligation yet</ProcessStatus>
          </ProcessHeader>
          <FlowList variants={flowStagger}>
            {SHORTLIST_BOOKING_FLOW.map((item, index) => (
              <FlowItem key={item.title} variants={flowItemReveal}>
                <FlowNumber>{index + 1}</FlowNumber>
                <div>
                  <FlowTitle>{item.title}</FlowTitle>
                  <FlowText>{item.text}</FlowText>
                </div>
              </FlowItem>
            ))}
          </FlowList>
        </ProcessCard>
      </HeroPanel>
    </HeroShell>
  );
}
