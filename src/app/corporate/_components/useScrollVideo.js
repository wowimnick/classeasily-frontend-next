"use client";

import { useEffect, useRef, useState } from "react";
import {
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

/**
 * Drive `video.currentTime` from scroll progress over `scrollTargetRef`.
 * When `reduceMotion` or `enabled` is false, skips scrubbing (use poster overlay).
 */
export function useScrollVideo({ scrollTargetRef, videoRef, enabled = true }) {
  const reduceMotion = useReducedMotion();
  const [duration, setDuration] = useState(0);
  const enabledRef = useRef(enabled);
  const durationRef = useRef(duration);
  const reduceRef = useRef(!!reduceMotion);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);
  useEffect(() => {
    reduceRef.current = !!reduceMotion;
  }, [reduceMotion]);

  const { scrollYProgress } = useScroll({
    target: scrollTargetRef,
    offset: ["start start", "end end"],
  });

  const applyTime = (p) => {
    if (reduceRef.current || !enabledRef.current) return;
    const el = videoRef?.current;
    const dur = durationRef.current;
    if (!el || !dur) return;
    try {
      const t = Math.min(Math.max(p, 0), 1) * dur;
      if (Number.isFinite(t)) el.currentTime = t;
    } catch {
      /* seek may throw on some browsers before metadata */
    }
  };

  useMotionValueEvent(scrollYProgress, "change", applyTime);

  useEffect(() => {
    applyTime(scrollYProgress.get());
    // scrollYProgress is a stable MotionValue from useScroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, enabled, videoRef]);

  return {
    scrollYProgress,
    duration,
    setDuration,
    reduceMotion: !!reduceMotion,
  };
}

/**
 * Optional: pause scrubbed video when tab hidden to save CPU.
 */
export function usePauseVideoWhenHidden(videoRef) {
  useEffect(() => {
    const onVis = () => {
      const v = videoRef?.current;
      if (!v) return;
      if (document.hidden) {
        try {
          v.pause();
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [videoRef]);
}
