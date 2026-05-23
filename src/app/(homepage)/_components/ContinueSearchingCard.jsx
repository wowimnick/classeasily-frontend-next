"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { formatSearchLocationCityName } from "@/lib/formatSearchLocationDisplay";
import styles from "./ContinueSearchingCard.module.css";

const CONTINUE_THUMB_BACK =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=140&h=140&fit=crop&q=80";

const CONTINUE_THUMB_SRC =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=140&h=140&fit=crop&q=80";


export default function ContinueSearchingCard() {
  const { searchTerm, selectedLocation, performSearch } = useSearch();
  const prefersReducedMotion = useReducedMotion();

  const city = formatSearchLocationCityName({
    displayName: selectedLocation?.displayName,
    searchTerm,
    city: selectedLocation?.city,
    state: selectedLocation?.state,
  });

  if (!city) return null;

  return (
    // Wrapper owns the height tween — button inside sits at natural height
    <motion.div
      className={styles.wrapper}
      initial={{ height: 0 }}
      animate={{ height: "auto" }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.45, ease: [0.25, 0, 0.5, 1] } /* quad ease-out */
      }
    >
      <button
        type="button"
        className={styles.card}
        onClick={() => performSearch()}
        aria-label={`Continue searching for experiences in ${city}`}
      >
        <div className={styles.inner}>
          <div className={styles.left}>
            {/* Desktop: single line */}
            <span className={styles.singleLine}>
              Continue searching for Experiences in {city}
              <ArrowRight size={14} strokeWidth={2.5} className={styles.arrowIcon} />
            </span>
            {/* Mobile: stacked */}
            <span className={styles.label}>Continue searching for</span>
            <span className={styles.city}>Experiences in {city}</span>
            <div className={styles.chevronRow}>
              <ArrowRight size={14} strokeWidth={2.5} className={styles.chevronIcon} />
            </div>
          </div>

          <div className={styles.thumbStack}>
            {/* Back card — peeking behind */}
            <div className={styles.thumbBack}>
              <Image
                src={CONTINUE_THUMB_BACK}
                alt=""
                width={66}
                height={66}
                className={styles.thumbBackImg}
                sizes="66px"
              />
            </div>
            {/* Front card */}
            <div className={styles.thumbFront}>
              <Image
                src={CONTINUE_THUMB_SRC}
                alt=""
                width={66}
                height={66}
                className={styles.thumbFrontImg}
                sizes="66px"
              />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
