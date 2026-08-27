"use client";

import { useEffect, useRef, useState } from "react";

function useMedia(query) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatch(mq.matches);
    const fn = (e) => setMatch(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return match;
}

export function usePrefersReducedMotion() {
  return useMedia("(prefers-reduced-motion: reduce)");
}

export function useFinePointer() {
  return useMedia("(pointer: fine)");
}

export function usePointerFxEnabled() {
  const reduce = usePrefersReducedMotion();
  const fine = useFinePointer();
  return fine && !reduce;
}

/** Tracks pointer inside an element as CSS vars --mx/--my (px) and --nx/--ny (-0.5..0.5). */
export function usePointerVars(reduce) {
  const ref = useRef(null);
  const raf = useRef(0);
  const pending = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return undefined;

    const flush = () => {
      raf.current = 0;
      const next = pending.current;
      if (!next) return;
      el.style.setProperty("--mx", `${next.mx}px`);
      el.style.setProperty("--my", `${next.my}px`);
      el.style.setProperty("--nx", String(next.nx));
      el.style.setProperty("--ny", String(next.ny));
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      pending.current = {
        mx,
        my,
        nx: r.width ? mx / r.width - 0.5 : 0,
        ny: r.height ? my / r.height - 0.5 : 0,
      };
      if (!raf.current) raf.current = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      pending.current = { mx: rCenter(el).x, my: rCenter(el).y, nx: 0, ny: 0 };
      if (!raf.current) raf.current = requestAnimationFrame(flush);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduce]);

  return ref;
}

function rCenter(el) {
  const r = el.getBoundingClientRect();
  return { x: r.width / 2, y: r.height / 2 };
}

export function Magnetic({ children, strength = 0.28 }) {
  const ref = useRef(null);
  const enabled = usePointerFxEnabled();

  const onMove = (e) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        display: "inline-flex",
        transition: enabled ? "transform 0.16s ease-out" : "none",
        willChange: enabled ? "transform" : undefined,
      }}
    >
      {children}
    </span>
  );
}

export function TiltFollow({ children, max = 9 }) {
  const ref = useRef(null);
  const enabled = usePointerFxEnabled();

  const onMove = (e) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(1100px) rotateY(${x * max * 2}deg) rotateX(${-y * max}deg)`;
  };

  const onLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "perspective(1100px) rotateY(0deg) rotateX(0deg)";
    }
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        transformStyle: "preserve-3d",
        transform: "perspective(1100px) rotateY(0deg) rotateX(0deg)",
        transition: enabled ? "transform 0.14s ease-out" : "none",
        willChange: enabled ? "transform" : undefined,
      }}
    >
      {children}
    </div>
  );
}

/** Forwards a ref that writes --mx/--my for CSS pointer glows. */
export function GlowRoot({ as: Comp = "div", children, ...rest }) {
  const enabled = usePointerFxEnabled();
  const ref = usePointerVars(!enabled);
  return (
    <Comp ref={ref} {...rest}>
      {children}
    </Comp>
  );
}
