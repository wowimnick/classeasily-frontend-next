"use client";

import { useEffect, useId, useRef } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { marketingTheme as t } from "@/components/marketing/tokens";

const TINT = {
  account: "#fc4056",
  business: "#fb7185",
  plan: "#c4b5fd",
  pay: "#34d399",
  timezone: "#60a5fa",
  loading: "#a78bfa",
  "about-industry": "#fb7185",
  "about-booking": "#60a5fa",
  "about-attribution": "#c4b5fd",
  connect: "#34d399",
  preview: "#a78bfa",
};

const Ambient = styled.div`
  position: sticky;
  top: 0;
  height: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 0;
`;

const Fill = styled.div`
  position: absolute;
  top: calc(-1 * var(--onboard-pad-t, 40px));
  left: calc(-1 * var(--onboard-pad-x, 28px));
  width: calc(100% + 2 * var(--onboard-pad-x, 28px));
  height: calc(100cqh + var(--onboard-pad-t, 40px) + var(--onboard-pad-b, 32px));
  overflow: hidden;
`;

const Field = styled.div`
  position: absolute;
  left: -18%;
  top: 0;
  bottom: -8%;
  width: min(96vw, 1040px);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(
    90deg,
    #000 0%,
    #000 42%,
    rgba(0, 0, 0, 0.45) 68%,
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    #000 0%,
    #000 42%,
    rgba(0, 0, 0, 0.45) 68%,
    transparent 100%
  );

  @media (max-width: 860px) {
    width: 100%;
    left: 0;
    bottom: -8%;
    opacity: 0.45;
  }
`;

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #f4f4f5;
  --gradient-color-2: ${t.colors.primary};
  --gradient-color-3: #ffffff;
  --gradient-color-4: #ffe4dc;
`;

const Tint = styled(motion.div)`
  position: absolute;
  inset: 0;
  mix-blend-mode: multiply;
  opacity: 0.16;
  background: radial-gradient(
    ellipse 70% 80% at 18% 28%,
    currentColor 0%,
    transparent 68%
  );
`;

const Grain = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.14;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  background-size: 180px 180px;
`;

const Vignette = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
      90deg,
      transparent 0%,
      transparent 38%,
      rgba(255, 255, 255, 0.4) 58%,
      #fff 78%
    ),
    linear-gradient(
      180deg,
      #fff 0%,
      rgba(255, 255, 255, 0.35) 18%,
      transparent 42%
    );
`;

export default function OnboardAmbient({ step, reduceMotion }) {
  const reactId = useId();
  const canvasId = `onboard-mesh-${reactId.replace(/:/g, "")}`;
  const gradientRef = useRef(null);
  const tint = TINT[step] || TINT.account;

  useEffect(() => {
    if (reduceMotion) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      import("./OnboardGradient")
        .then(({ default: OnboardGradient }) => {
          if (cancelled) return;
          const canvas = document.getElementById(canvasId);
          if (!canvas?.getContext) return;
          const gradient = new OnboardGradient();
          gradient.initGradient(`#${canvasId}`);
          gradientRef.current = gradient;
          window.dispatchEvent(new Event("resize"));
        })
        .catch(() => {});
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      try {
        gradientRef.current?.disconnect?.();
      } catch {
        /* ignore */
      }
      gradientRef.current = null;
    };
  }, [canvasId, reduceMotion]);

  return (
    <Ambient aria-hidden>
      <Fill>
        <Field>
          <Canvas id={canvasId} data-transition-in />
          <Tint
            animate={{ color: tint }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </Field>
        <Grain />
        <Vignette />
      </Fill>
    </Ambient>
  );
}
