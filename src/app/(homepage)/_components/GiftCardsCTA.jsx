"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "antd";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./GiftCardsCTA.module.css";

// Assets
import Card1 from "@/assets/card1.png";
import Card5 from "@/assets/Card 9.png";

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
  const router = useRouter();
  const ref = useRef(null);

  // Prefetch the giftcards page
  useEffect(() => {
    router.prefetch("/giftcards/");
  }, [router]);

  const handleBuyClick = () => {
    router.push("/giftcards/");
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="giftcard-title"
      ref={ref}
    >
      <div className={styles.wrapper}>
        {/* Mobile Title */}
        <h2 className={styles.titleMobile}>Gift a fun experience</h2>

        {/* Text Content */}
        <div className={styles.content}>
          <h2 className={styles.titleDesktop}>Gift a fun experience</h2>

          <p className={styles.description}>
            The best gifts aren't things, they're moments. Let them pick their
            own vibe, from salsa dancing to sushi rolling. Instant delivery,
            zero wrapping paper required.
          </p>

          <Button
            type="primary"
            size="large"
            onClick={handleBuyClick}
            className={styles.ctaButton}
          >
            Purchase Gift Card <ArrowRight size={18} />
          </Button>
        </div>

        {/* Cards area — 2D only (no Three.js) */}
        <div className={styles.canvasArea}>
          <Fallback2D />
        </div>
      </div>
    </section>
  );
};

export default GiftCardsCTA;
