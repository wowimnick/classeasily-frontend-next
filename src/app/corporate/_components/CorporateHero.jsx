"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import styled from "styled-components";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { usePauseVideoWhenHidden } from "./useScrollVideo";
import { CORPORATE_VIDEOS } from "./corporateMedia";

const PinWrap = styled.div`
  position: relative;
  height: 170vh;
`;

const Sticky = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  min-height: 520px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  background: #f8fafc;
`;

const VideoEl = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PosterFallback = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    #fff 0%,
    #fce7f3 38%,
    #fff7ed 72%,
    #e0e7ff 100%
  );
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(248, 250, 252, 0.82) 48%,
    rgba(248, 250, 252, 0.96) 100%
  );
  pointer-events: none;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1120px;
  margin: 0 auto;
  padding: 72px 1.5rem 56px;
  width: 100%;
  @media (min-width: 768px) {
    padding: 96px 2.5rem 72px;
  }
`;

const Kicker = styled.p`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e11d48;
  margin: 0 0 1rem;
`;

const WordRow = styled.span`
  display: block;
`;

const Lead = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.65;
  color: #475569;
  margin: 1.5rem 0 0;
  max-width: 34rem;
`;

const CtaRow = styled.div`
  margin-top: 1.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

const PrimaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.35rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  background: #e11d48;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 12px 40px rgba(225, 29, 72, 0.35);
  transition: transform 0.2s ease, background 0.2s ease;
  &:hover {
    background: #be123c;
    transform: translateY(-1px);
  }
`;

const GhostCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 1.15rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  &:hover {
    border-color: #94a3b8;
    background: #fff;
    color: #0f172a;
  }
`;

const HEADLINE_LINES = [
  ["Team", "experiences"],
  ["worth", "showing", "up", "for"],
];

const spring = { type: "spring", stiffness: 80, damping: 22 };

export default function CorporateHero() {
  const pinRef = useRef(null);
  const videoRef = useRef(null);
  const [videoOk, setVideoOk] = useState(true);
  const reduceMotion = useReducedMotion();

  /** Scroll drives overlay tint only; the video itself autoplays (muted loop). */
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });

  const posterOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.55, 0.35, 0.2]);

  usePauseVideoWhenHidden(videoRef);

  useEffect(() => {
    if (reduceMotion || !videoOk) return;
    const v = videoRef.current;
    if (!v) return;
    const p = v.play?.();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        /* autoplay can be deferred; user interaction may be required on some policies */
      });
    }
  }, [reduceMotion, videoOk]);

  const onVideoError = useCallback(() => {
    setVideoOk(false);
  }, []);

  return (
    <PinWrap ref={pinRef} id="corporate-hero">
      <Sticky aria-label="Corporate hero">
        {!reduceMotion && videoOk ? (
          <VideoEl
            ref={videoRef}
            src={CORPORATE_VIDEOS.hero}
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
            disableRemotePlayback
            onError={onVideoError}
            aria-hidden
          />
        ) : null}
        <PosterFallback
          style={{ opacity: reduceMotion || !videoOk ? 1 : undefined }}
          initial={false}
          animate={
            reduceMotion || !videoOk
              ? { opacity: 1 }
              : { opacity: [0.92, 0.75] }
          }
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {!reduceMotion && videoOk ? (
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: posterOpacity,
              background:
                "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(225,29,72,0.12), transparent 55%)",
            }}
            aria-hidden
          />
        ) : null}
        <Overlay />
        <Content>
          <Kicker>ClassEasily for teams</Kicker>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2.5rem, 7vw, 4.75rem)",
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0f172a",
            }}
          >
            {HEADLINE_LINES.map((line, li) => (
              <WordRow key={li}>
                {line.map((word, wi) => (
                  <motion.span
                    key={word}
                    initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                    animate={reduceMotion ? false : { opacity: 1, y: 0 }}
                    transition={{
                      ...spring,
                      delay: reduceMotion ? 0 : li * 0.12 + wi * 0.05,
                    }}
                    style={{ display: "inline-block", marginRight: "0.22em" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </WordRow>
            ))}
          </h1>
          <Lead>
            Curated local workshops and experiences for offsites, client events,
            and culture-building—planned with less noise and more wow.
          </Lead>
          <CtaRow>
            <PrimaryCta href="#inquiry">Start an inquiry</PrimaryCta>
            <GhostCta href="#how-it-works-corporate">See how it works</GhostCta>
          </CtaRow>
        </Content>
      </Sticky>
    </PinWrap>
  );
}
