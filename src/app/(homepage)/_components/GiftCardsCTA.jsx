"use client";

import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./GiftCardsCTA.module.css";

// Same CTA link as Start Hosting (ForHosts) — design and color
const CtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2.5rem;
  height: auto;
  line-height: 1.5;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #f81e3e;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #e01a38;
    color: #fff;
  }
`;

// Assets
import Card1 from "@/assets/card1.png";
import Card5 from "@/assets/Card 9.png";

// Diagonal section divider (white to white, same as business landing page)
const DiagonalDivider = () => (
  <div
    style={{
      lineHeight: 0,
      background: "#ffffff",
      display: "block",
      overflow: "hidden",
      position: "relative",
      zIndex: 1,
    }}
  >
    <svg
      viewBox="0 0 1440 44"
      preserveAspectRatio="none"
      width="100%"
      height="44"
      style={{ display: "block" }}
    >
      <path d="M0,0 L1440,0 L0,44 Z" fill="#ffffff" />
      <line
        x1="0"
        y1="0"
        x2="1440"
        y2="44"
        stroke="rgba(248,30,62,0.10)"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

// 2D static cards (no Three.js) — consistent look and faster load
const Fallback2D = () => (
  <div className={styles.fallbackContainer}>
    <img
      src={Card5.src}
      alt="Gift Card Back"
      className={`${styles.fallbackCard} ${styles.cardBack}`}
    />
    <img
      src={Card1.src}
      alt="Gift Card Front"
      className={`${styles.fallbackCard} ${styles.cardFront}`}
    />
  </div>
);

const GiftCardsCTA = () => {
  const ref = useRef(null);

  return (
    <>
      <section
        className={styles.section}
        aria-labelledby="giftcard-title"
        ref={ref}
      >
        <div className={styles.wrapper}>
          {/* Mobile Title */}
          <h2 className={styles.titleMobile}>Gift a fun experience</h2>

          {/* Cards area — 2D only (no Three.js) */}
          <div className={styles.canvasArea}>
            <Fallback2D />
          </div>

          {/* Text Content */}
          <div className={styles.content}>
            <h2 className={styles.titleDesktop}>Gift a fun experience</h2>

            <p className={styles.description}>
              The best gifts aren't things, they're moments. Let them pick their
              own vibe, from salsa dancing to sushi rolling. Instant delivery,
              zero wrapping paper required.
            </p>

            <CtaLink href="/giftcards/">
              Purchase Gift Card <ArrowRight size={18} />
            </CtaLink>
          </div>
        </div>
      </section>
      <DiagonalDivider />
    </>
  );
};

export default GiftCardsCTA;
