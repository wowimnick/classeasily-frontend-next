"use client";

import { useId, useMemo, useState } from "react";
import styled from "styled-components";
import { marketingTheme as t } from "./tokens";
import { usePointerFxEnabled, usePointerVars } from "./pointerFx";

const WEEK = [
  { d: "Mon", n: 6, rev: 390 },
  { d: "Tue", n: 9, rev: 585 },
  { d: "Wed", n: 5, rev: 325 },
  { d: "Thu", n: 12, rev: 780 },
  { d: "Fri", n: 16, rev: 1040 },
  { d: "Sat", n: 21, rev: 1365 },
  { d: "Sun", n: 11, rev: 715 },
];

const VW = 720;
const VH = 268;
const PAD = { l: 28, r: 28, t: 28, b: 40 };

const Shell = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  background: ${t.colors.dark};
  color: #fff;
  padding: 28px 28px 8px;
  box-shadow: 0 24px 64px rgba(10, 37, 64, 0.28);
  cursor: crosshair;

  @media (max-width: 640px) {
    padding: 22px 16px 4px;
    cursor: auto;
  }
`;

const Glow = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: radial-gradient(
    420px circle at var(--mx, 70%) var(--my, 40%),
    rgba(252, 64, 86, 0.28),
    transparent 58%
  );
  opacity: 0.85;
  transition: opacity 0.3s ease;

  @media (prefers-reduced-motion: reduce), (pointer: coarse) {
    opacity: 0.35;
    background: radial-gradient(
      520px circle at 72% 30%,
      rgba(252, 64, 86, 0.22),
      transparent 58%
    );
  }
`;

const Meta = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 8px;
`;

const Stat = styled.div`
  small {
    display: block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }
  strong {
    display: block;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }
  span {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.55);
    margin-left: 6px;
  }
`;

const Svg = styled.svg`
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: auto;
`;

export default function LiveWeekChart() {
  const uid = useId().replace(/:/g, "");
  const enabled = usePointerFxEnabled();
  const shellRef = usePointerVars(!enabled);
  const [idx, setIdx] = useState(5);

  const points = useMemo(() => {
    const max = Math.max(...WEEK.map((w) => w.n));
    return WEEK.map((w, i) => {
      const x = PAD.l + (i / (WEEK.length - 1)) * (VW - PAD.l - PAD.r);
      const y = PAD.t + (1 - w.n / max) * (VH - PAD.t - PAD.b);
      return { x, y, ...w };
    });
  }, []);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1].x} ${VH - PAD.b} L${points[0].x} ${VH - PAD.b} Z`;
  const p = points[idx];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const x = ((e.clientX - r.left) / r.width) * VW;
    let best = 0;
    let dist = Infinity;
    points.forEach((pt, i) => {
      const d = Math.abs(pt.x - x);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setIdx(best);
  };

  return (
    <Shell
      ref={shellRef}
      onPointerMove={onMove}
    >
      <Glow />
      <Meta>
        <Stat>
          <small>{p.d}</small>
          <strong>
            {p.n}
            <span>bookings</span>
          </strong>
        </Stat>
        <Stat style={{ textAlign: "right" }}>
          <small>Collected</small>
          <strong>${p.rev.toLocaleString()}</strong>
        </Stat>
      </Meta>
      <Svg
        viewBox={`0 0 ${VW} ${VH}`}
        role="img"
        aria-label="Sample week of bookings. Saturday is the busiest day."
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fc4056" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#fc4056" stopOpacity="0" />
          </linearGradient>
        </defs>
        {points.map((pt) => (
          <line
            key={pt.d}
            x1={pt.x}
            x2={pt.x}
            y1={PAD.t}
            y2={VH - PAD.b}
            stroke="rgba(255,255,255,0.06)"
          />
        ))}
        <path d={area} fill={`url(#${uid}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke="#fc4056"
          strokeWidth="2.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line
          x1={p.x}
          x2={p.x}
          y1={PAD.t - 6}
          y2={VH - PAD.b}
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="3 5"
        />
        <circle cx={p.x} cy={p.y} r="7" fill="#fff" />
        <circle cx={p.x} cy={p.y} r="4.5" fill="#fc4056" />
        {points.map((pt) => (
          <text
            key={pt.d}
            x={pt.x}
            y={VH - 12}
            textAnchor="middle"
            fill={pt.d === p.d ? "#fff" : "rgba(255,255,255,0.42)"}
            fontSize="13"
            fontWeight={pt.d === p.d ? 700 : 500}
            fontFamily="inherit"
          >
            {pt.d}
          </text>
        ))}
      </Svg>
    </Shell>
  );
}
