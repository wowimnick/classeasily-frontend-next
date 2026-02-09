"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import styles from "./Testimonials.module.css";

export default function TestimonialsClient({ children }) {
  const scrollRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  // Scroll Handler
  const scroll = useCallback((direction) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const cardWidth = container.children[0]?.offsetWidth || 300;
    const gap = 24; // 1.5rem
    const scrollAmount = cardWidth + gap;

    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    let targetScroll;

    if (direction === "left") {
      targetScroll = currentScroll - scrollAmount;
      // Loop to end if at start
      if (targetScroll < 0) targetScroll = maxScroll;
    } else {
      targetScroll = currentScroll + scrollAmount;
      // Loop to start if at end
      if (Math.abs(currentScroll - maxScroll) < 10) targetScroll = 0;
    }

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  }, []);

  // Auto Scroll Logic
  useEffect(() => {
    let interval;
    if (isPlaying && !isInteracting) {
      interval = setInterval(() => {
        scroll("right");
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isInteracting, scroll]);

  // Handle User Interaction (Pauses auto-scroll)
  const handleInteractionStart = () => setIsInteracting(true);
  const handleInteractionEnd = () => setIsInteracting(false);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Thoughts from our learners</h2>

        <div className={styles.controls}>
          {/* Play/Pause */}
          <button
            className={`${styles.controlBtn} ${isPlaying ? styles.active : ""}`}
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Navigation */}
          <div className={styles.btnGroup}>
            <button
              className={styles.controlBtn}
              onClick={() => {
                scroll("left");
                setIsPlaying(false);
              }} // Manual click stops auto temporarily
              aria-label="Previous"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              className={`${styles.controlBtn} ${styles.active}`}
              onClick={() => {
                scroll("right");
                setIsPlaying(false);
              }}
              aria-label="Next"
            >
              <ArrowRight size={20} color="white" />
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
        {/* We clone the child (the track) to attach the ref without diving into it */}
        <div ref={scrollRef} className={styles.track}>
          {children}
        </div>
      </div>
    </div>
  );
}
