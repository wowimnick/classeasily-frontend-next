"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarCheck2, Compass, FileText, ShieldCheck, Users } from "lucide-react";
import { CORPORATE_VIDEOS } from "./corporateMedia";
import providerLogoData from "../_generated/providerLogos.json";

const PageBlock = styled.div`
  position: relative;
  background: #fff;
  overflow: hidden;
`;

const Container = styled.div`
  width: min(1160px, 100% - 3rem);
  margin: 0 auto;
  position: relative;
  z-index: 1;
  @media (max-width: 768px) {
    width: min(1160px, 100% - 2rem);
  }
`;

const Hairline = styled.div`
  height: 1px;
  width: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(17, 17, 17, 0.18) 18%,
    rgba(17, 17, 17, 0.18) 82%,
    transparent 100%
  );
`;

const SectionHeading = styled.h2`
  margin: 0;
  color: #111;
  letter-spacing: -0.03em;
  line-height: 1;
  font-size: clamp(1.9rem, 4vw, 3.15rem);
`;

const SectionSub = styled.p`
  margin: 1rem 0 0;
  color: #1a1a1a;
  line-height: 1.62;
  font-size: 1rem;
  max-width: 64ch;
`;

const HeroSection = styled.section`
  padding: 2.5rem 0 3.25rem;
  background:
    radial-gradient(circle at 80% 10%, rgba(0, 0, 0, 0.06), transparent 34%),
    radial-gradient(circle at 12% 78%, rgba(0, 0, 0, 0.04), transparent 30%),
    #fff;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 2.2rem;
  align-items: stretch;
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 1.4rem;
  }
`;

const HeroText = styled.div`
  border-radius: 32px;
  padding: 2rem 1.6rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #111;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #111;
  font-size: clamp(2rem, 4.8vw, 4rem);
  line-height: 0.96;
  letter-spacing: -0.03em;
  max-width: 14ch;
`;

const HeroLead = styled.p`
  margin: 1.15rem 0 0;
  color: #111;
  font-size: clamp(1rem, 1.6vw, 1.14rem);
  line-height: 1.55;
  max-width: 52ch;
`;

const HeroCtas = styled.div`
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const CtaButton = styled(Link)`
  border: 1px solid #111;
  color: #111;
  background: #fff;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.92rem;
  padding: 0.75rem 1.05rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    color: #111;
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  }
`;

const HeroVideoCard = styled(motion.div)`
  border: 1px solid #111;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
  min-height: 300px;
  background: linear-gradient(160deg, #f5f5f5 0%, #ececec 100%);
`;

const HeroVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroVideoShade = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.44) 100%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.22) 0%, transparent 65%);
`;

const railMove = keyframes`
  from { transform: translateX(0%); }
  to { transform: translateX(-50%); }
`;

const ClientRail = styled.section`
  border-top: 1px solid rgba(90, 90, 90, 0.45);
  border-bottom: 1px solid rgba(90, 90, 90, 0.45);
  background: #f4f4f4;
  padding: 1.05rem 0 0.85rem;
`;

const ClientRailHead = styled.div`
  width: min(1160px, 100% - 3rem);
  margin: 0 auto 0.65rem;
  text-align: center;
  @media (max-width: 768px) {
    width: min(1160px, 100% - 2rem);
  }
`;

const ClientRailTitle = styled.h3`
  margin: 0 0 0.2rem;
  color: #2f2f2f;
  font-size: clamp(0.78rem, 1.3vw, 0.88rem);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
`;

const ClientRailSub = styled.p`
  margin: 0;
  color: #555;
  font-size: 0.86rem;
  line-height: 1.45;
`;

const RailViewport = styled.div`
  position: relative;
  overflow: hidden;
  &:hover > div {
    animation-play-state: paused;
  }
`;

const RailLane = styled.div`
  display: flex;
  width: max-content;
  animation: ${railMove} 160s linear infinite;
`;

const RailLaneContent = styled.div`
  display: flex;
  width: max-content;
`;

const ClientLogoItem = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 144px;
  padding: 0.9rem 1.35rem;
  border-right: 1px solid rgba(70, 70, 70, 0.2);
`;

const LogoImage = styled.img`
  width: 54px;
  height: 54px;
  object-fit: contain;
  opacity: 1;
`;

const LogoFallback = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 12px;
  border: 1px solid #3b3b3b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2f2f2f;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  font-weight: 800;
`;

const LogoText = styled.span`
  font-size: clamp(0.5rem, 1.1vw, 0.64rem);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.2;
  color: #3b3b3b;
`;

const StorySection = styled.section`
  padding: 3.4rem 0 3rem;
  background: #fff;
`;

const StoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StoryCard = styled(motion.article)`
  border: 1px solid #111;
  border-radius: 24px;
  padding: 1.15rem;
  background: #fff;
  position: relative;
  overflow: hidden;
  min-height: 232px;
`;

const StoryEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #111;
  color: #111;
`;

const StoryTitle = styled.h3`
  margin: 0.85rem 0 0;
  color: #111;
  font-size: clamp(1.28rem, 2.2vw, 1.9rem);
  letter-spacing: -0.02em;
  line-height: 1.05;
`;

const StoryText = styled.p`
  margin: 0.95rem 0 0;
  color: #111;
  line-height: 1.58;
  font-size: 0.97rem;
  max-width: 38ch;
`;

const StoryPattern = styled.div`
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 140px;
  height: 90px;
  background:
    linear-gradient(0deg, rgba(0, 0, 0, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.16) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: radial-gradient(circle at 100% 100%, #000 56%, transparent 100%);
  pointer-events: none;
`;

const HowSection = styled.section`
  padding: 3rem 0 3.5rem;
  background: #fff;
`;

const HowLayout = styled.div`
  margin-top: 1.55rem;
  display: grid;
  grid-template-columns: 0.4fr 0.6fr;
  gap: 1rem;
  align-items: start;
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const HowSidebar = styled.div`
  border-radius: 24px;
  padding: 1rem;
  background: #fff;
  @media (min-width: 981px) {
    position: sticky;
    top: 104px;
  }
`;

const HowSidebarLead = styled.p`
  margin: 0 0 0.9rem;
  color: #111;
  font-size: 0.95rem;
  line-height: 1.55;
`;

const StepPicker = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  padding: 0.25rem 0;


`;

const StepButton = styled.button`
  text-align: left;
  border: 1px solid #111;
  border-radius: 14px;
  background: #fff;
  color: #111;
  padding: 0.75rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.64rem;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  width: calc(100% - 2.8rem);
  position: relative;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  @media (max-width: 980px) {
    width: 100%;
    align-self: stretch;
    &::before,
    &::after {
      display: none;
    }
  }
  ${({ $active }) =>
    $active
      ? css`
          background: #111;
          color: #fff;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.14);
          &::after {
            background: #111;
            border-color: #111;
          }
        `
      : css`
          opacity: 0.85;
          &:hover {
            opacity: 1;
            transform: translateY(-2px);
          }
        `}
`;

const StepBadge = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  flex-shrink: 0;
`;

const HowMain = styled.div`
  border: 1px solid #111;
  border-radius: 24px;
  overflow: hidden;
  background: #fff;
`;

const HowStage = styled.div`
  position: relative;
  min-height: 320px;
  background: linear-gradient(145deg, #fcfcfc 0%, #ececec 100%);
  border-bottom: 1px solid #111;
`;

const SceneFrame = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HowCaption = styled.div`
  padding: 1rem 1.1rem 1.2rem;
`;

const HowCaptionTitle = styled.h3`
  margin: 0;
  color: #111;
  font-size: clamp(1.35rem, 2.2vw, 1.9rem);
  letter-spacing: -0.02em;
`;

const HowCaptionText = styled.p`
  margin: 0.62rem 0 0;
  color: #111;
  font-size: 0.98rem;
  line-height: 1.58;
`;

const SceneStage = styled.div`
  position: relative;
  width: min(430px, 82%);
  height: min(280px, 74%);
`;

function BriefScene() {
  const lines = [63, 80, 46, 70];
  return (
    <SceneStage>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "absolute",
          inset: "9% 8%",
          border: "1px solid #111",
          borderRadius: 18,
          background: "#fff",
          padding: "1rem 1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          justifyContent: "center",
        }}
      >
        {lines.map((width, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#111", flexShrink: 0 }}
            />
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ delay: 0.2 + i * 0.28, duration: 0.4, ease: "easeOut" }}
              style={{ height: 8, background: "#111", borderRadius: 999 }}
            />
          </div>
        ))}
      </motion.div>
    </SceneStage>
  );
}

function ShortlistScene() {
  const cards = [
    { x: -160, y: -70, rotate: -13 },
    { x: 170, y: -90, rotate: 10 },
    { x: -150, y: 90, rotate: 12 },
  ];
  return (
    <SceneStage>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ x: c.x, y: c.y, rotate: c.rotate, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.23 + i * 0.15, type: "spring", stiffness: 132, damping: 17 }}
            style={{
              width: 92,
              height: 128,
              border: "1px solid #111",
              borderRadius: 14,
              background: "#fff",
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ height: 54, background: "#111", borderRadius: 8 }} />
            <div style={{ height: 6, width: "72%", background: "#111", borderRadius: 999 }} />
            <div style={{ height: 6, width: "58%", background: "#111", borderRadius: 999 }} />
            <div style={{ height: 6, width: "66%", background: "#111", borderRadius: 999 }} />
          </motion.div>
        ))}
      </div>
    </SceneStage>
  );
}

function BookScene() {
  return (
    <SceneStage>
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "absolute",
          inset: "10% 10%",
          border: "1px solid #111",
          borderRadius: 18,
          background: "#fff",
          padding: "1rem",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: 74, height: 8, background: "#111", borderRadius: 999 }} />
          <div style={{ width: 30, height: 8, background: "#111", borderRadius: 999 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.01 }}
              style={{
                borderRadius: 4,
                background: i === 17 ? "#111" : "rgba(17,17,17,0.07)",
              }}
            />
          ))}
        </div>
      </motion.div>
    </SceneStage>
  );
}

const HEADLINE_WORDS = ["Team", "events", "people", "remember."];

const STORY_CARDS = [
  {
    icon: Compass,
    title: "Brief us once.",
    body: "Share city, date range, and budget in one pass. We handle the digging so your team does not drown in tabs.",
  },
  {
    icon: Users,
    title: "Good hosts only.",
    body: "We lean toward hosts who know how to run a room, not just rent one. That means cleaner flow and fewer awkward pauses.",
  },
  {
    icon: ShieldCheck,
    title: "Clear details up front.",
    body: "Invoices, constraints, and logistics are included early, so finance and operations are not guessing at the finish line.",
  },
];

const PROCESS = [
  {
    label: "Share brief",
    title: "Tell us what you need",
    text: "A few bullets is enough: headcount, city, budget guardrails, and what kind of energy you want in the room.",
    icon: FileText,
    Scene: BriefScene,
  },
  {
    label: "Review options",
    title: "Get a focused shortlist",
    text: "You get a small set of solid options with context. Make a choice with your team and we'll handle the rest.",
    icon: Users,
    Scene: ShortlistScene,
  },
  {
    label: "Book",
    title: "Pick the date and lock it in",
    text: "Choose the best fit, confirm details, and move on. Your team shows up knowing what to expect.",
    icon: CalendarCheck2,
    Scene: BookScene,
  },
];

const FALLBACK_LOGOS = [
  { name: "Google", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg" },
  { name: "Spotify", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/spotify.svg" },
  { name: "Slack", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/slack.svg" },
  { name: "Shopify", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/shopify.svg" },
  { name: "Notion", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/notion.svg" },
  { name: "Airbnb", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/airbnb.svg" },
  { name: "Adobe", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/adobe.svg" },
  { name: "Zoom", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/zoom.svg" },
];

const GENERATED_LOGOS = Array.isArray(providerLogoData?.logos)
  ? providerLogoData.logos
      .filter((item) => item?.disabled !== true)
      .filter((item) => {
        const n = item?.activePublicClassCount;
        if (n === undefined || n === null) return true;
        return Number(n) > 0;
      })
      .map((item) => ({
        name: typeof item?.name === "string" ? item.name.trim() : "",
        logo: typeof item?.logo === "string" ? item.logo.trim() : "",
      }))
      .filter((item) => item.name && item.logo)
  : [];

const CLIENT_LOGOS = GENERATED_LOGOS.length ? GENERATED_LOGOS : FALLBACK_LOGOS;
const MIN_LOGOS_PER_LOOP = 24;

function ensureLoopCoverage(logos, minCount = MIN_LOGOS_PER_LOOP) {
  if (!Array.isArray(logos) || logos.length === 0) return [];
  const output = [...logos];
  let i = 0;
  while (output.length < minCount) {
    output.push(logos[i % logos.length]);
    i += 1;
  }
  return output;
}

const LOGO_LOOP = ensureLoopCoverage(CLIENT_LOGOS);

const TIMELINE_INTERVAL_MS = 5600;

function useAutoCycle({ length, intervalMs, paused, onTick }) {
  useEffect(() => {
    if (paused || length <= 1) return undefined;
    const id = setInterval(onTick, intervalMs);
    return () => clearInterval(id);
  }, [paused, length, intervalMs, onTick]);
}

function ProviderLogo({ name, logo }) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return broken ? (
    <LogoFallback aria-hidden>{initials}</LogoFallback>
  ) : (
    <LogoImage
      src={logo}
      alt={`${name} logo`}
      loading="lazy"
      onError={() => {
        setBroken(true);
      }}
    />
  );
}

function LogoRow({ logos }) {
  return logos.map((client, index) => (
    <ClientLogoItem key={`${client.name}-${index}`}>
      <ProviderLogo name={client.name} logo={client.logo} />
      <LogoText>{client.name}</LogoText>
    </ClientLogoItem>
  ));
}

function HowItWorks({ reduceMotion }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const tick = useCallback(() => {
    setActive((prev) => (prev + 1) % PROCESS.length);
  }, []);

  useAutoCycle({
    length: PROCESS.length,
    intervalMs: TIMELINE_INTERVAL_MS,
    paused: paused || reduceMotion,
    onTick: tick,
  });

  const current = PROCESS[active];
  const ActiveScene = current.Scene;
  const ActiveIcon = current.icon;

  return (
    <HowLayout onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <HowSidebar>
        <StepPicker>
          {PROCESS.map((step, index) => {
            const Icon = step.icon;
            const isActive = active === index;
            return (
              <StepButton
                key={step.label}
                type="button"
                $active={isActive}
                $index={index}
                onClick={() => setActive(index)}
              >
                <StepBadge>{index + 1}</StepBadge>
                <Icon size={16} />
                {step.label}
              </StepButton>
            );
          })}
        </StepPicker>
      </HowSidebar>

      <HowMain>
        <HowStage>
          <AnimatePresence mode="wait" initial={false}>
            <SceneFrame
              key={active}
              initial={reduceMotion ? false : { clipPath: "inset(0 100% 0 0 round 0px)" }}
              animate={reduceMotion ? undefined : { clipPath: "inset(0 0% 0 0 round 0px)" }}
              exit={reduceMotion ? undefined : { clipPath: "inset(0 0 0 100% round 0px)" }}
              transition={{ duration: 0.56, ease: [0.7, 0, 0.2, 1] }}
            >
              <ActiveScene />
            </SceneFrame>
          </AnimatePresence>
        </HowStage>
        <HowCaption>
          <HowCaptionTitle>
            <ActiveIcon size={20} style={{ marginRight: 8 }} />
            {current.title}
          </HowCaptionTitle>
          <HowCaptionText>{current.text}</HowCaptionText>
        </HowCaption>
      </HowMain>
    </HowLayout>
  );
}

export default function CorporateAboveFaqRedesign() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(true);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const tryPlay = () => {
      const video = videoRef.current;
      if (!video) return;
      const promise = video.play?.();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    };
    const onVisible = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tryPlay);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tryPlay);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !videoReady) return;
    const video = videoRef.current;
    if (!video) return;
    const promise = video.play?.();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
  }, [reduceMotion, videoReady]);

  useEffect(() => {
    let gradient;
    const canvasEl = document.querySelector("#corporate-gradient-canvas");
    if (!canvasEl) return undefined;
    import("stripe-gradient")
      .then(({ Gradient }) => {
        gradient = new Gradient();
        gradient.initGradient("#corporate-gradient-canvas");
      })
      .catch(() => {});

    return () => {
      if (gradient && typeof gradient.disconnect === "function") {
        gradient.disconnect();
      }
    };
  }, []);

  return (
    <PageBlock>
      <HeroSection>
        <Container>
          <HeroGrid>
            <HeroText>
              <HeroTitle>
                {HEADLINE_WORDS.map((word, index) => (
                  <motion.span
                    key={word}
                    style={{ display: "inline-block", marginRight: "0.18em" }}
                    initial={reduceMotion ? false : { y: 42, rotate: 3, opacity: 0 }}
                    animate={reduceMotion ? false : { y: 0, rotate: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 130,
                      damping: 18,
                      delay: 0.05 + index * 0.05,
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </HeroTitle>
              <HeroLead>
                You need a team event that does not feel forced. Share the basics and
                we will send back options your team will actually want to attend.
              </HeroLead>
              <HeroCtas>
                <CtaButton href="#inquiry">
                  Start your inquiry
                  <ArrowRight size={16} />
                </CtaButton>
                <CtaButton href="#faq">Jump to FAQ</CtaButton>
              </HeroCtas>
            </HeroText>

            <HeroVideoCard
              initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0 round 32px)" }}
              animate={reduceMotion ? false : { clipPath: "inset(0 0 0% 0 round 32px)" }}
              transition={{ duration: 0.75, ease: [0.2, 0.9, 0.2, 1] }}
            >
              {videoReady && !reduceMotion ? (
                <HeroVideo
                  ref={videoRef}
                  src={CORPORATE_VIDEOS.hero}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                  disableRemotePlayback
                  onError={() => setVideoReady(false)}
                  aria-hidden
                />
              ) : null}
              <HeroVideoShade />
            </HeroVideoCard>
          </HeroGrid>
        </Container>
      </HeroSection>

      <ClientRail aria-label="Client logos">
        <ClientRailHead>
          <ClientRailTitle>Our Providers</ClientRailTitle>
          <ClientRailSub>
            Some of the studios we've worked with.
          </ClientRailSub>
        </ClientRailHead>
        <RailViewport>
          <RailLane>
            <RailLaneContent>
              <LogoRow logos={LOGO_LOOP} />
            </RailLaneContent>
            <RailLaneContent>
              <LogoRow logos={LOGO_LOOP} />
            </RailLaneContent>
          </RailLane>
        </RailViewport>
      </ClientRail>

      <StorySection>
        <Container>
          <StoryGrid>
            {STORY_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <StoryCard
                  key={card.title}
                  initial={reduceMotion ? false : { scale: 0.9, rotate: index === 1 ? -1 : 1 }}
                  whileInView={reduceMotion ? undefined : { scale: 1, rotate: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ type: "spring", stiffness: 125, damping: 16, delay: index * 0.08 }}
                >
                  <StoryEyebrow>
                    <Icon size={18} />
                  </StoryEyebrow>
                  <StoryTitle>{card.title}</StoryTitle>
                  <StoryText>{card.body}</StoryText>
                </StoryCard>
              );
            })}
          </StoryGrid>
        </Container>
      </StorySection>

      <Hairline />

      <HowSection id="how-it-works-corporate">
        <Container>
          <SectionHeading>How it works</SectionHeading>
          <SectionSub>
            A simple, three-step process to get your team booked.
          </SectionSub>
          <HowItWorks reduceMotion={reduceMotion} />
        </Container>
      </HowSection>
    </PageBlock>
  );
}
