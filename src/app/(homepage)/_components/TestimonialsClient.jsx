"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import styles from "./Testimonials.module.css";

export default function TestimonialsClient({ children }) {
  const scrollRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  const scroll = useCallback((direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.children[0]?.offsetWidth || 300;
    const gap = 16;
    const scrollAmount = cardWidth + gap;
    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    let targetScroll;
    if (direction === "left") {
      targetScroll = currentScroll - scrollAmount;
      if (targetScroll < 0) targetScroll = maxScroll;
    } else {
      targetScroll = currentScroll + scrollAmount;
      if (Math.abs(currentScroll - maxScroll) < 10) targetScroll = 0;
    }
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && !isInteracting) {
      interval = setInterval(() => scroll("right"), 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isInteracting, scroll]);

  const handleInteractionStart = () => setIsInteracting(true);
  const handleInteractionEnd = () => setIsInteracting(false);

  return (
    <div>
      <div className={styles.headerRow}>
        <h3 className={styles.carouselTitle}>What our learners say</h3>
        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${isPlaying ? styles.active : ""}`}
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className={styles.btnGroup}>
            <button
              className={styles.controlBtn}
              onClick={() => { scroll("left"); setIsPlaying(false); }}
              aria-label="Previous"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className={`${styles.controlBtn} ${styles.active}`}
              onClick={() => { scroll("right"); setIsPlaying(false); }}
              aria-label="Next"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={styles.trackContainer}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
      >
        <div ref={scrollRef} className={styles.track}>
          {children}
        </div>
      </div>
    </div>
  );
}