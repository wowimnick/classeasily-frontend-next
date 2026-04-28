"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function ShortlistHero({ companyName, introMessage, depositPercent }) {
  const reduceMotion = useReducedMotion();
  const words = (companyName || "Your team").split(/\s+/).filter(Boolean);

  return (
    <header style={{ marginBottom: "2rem" }}>
      <p
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "#64748b",
          marginBottom: "0.75rem",
        }}
      >
        Curated for you
      </p>
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.25rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1.02,
          color: "#0f172a",
          margin: 0,
        }}
      >
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            style={{ display: "inline-block", marginRight: "0.2em" }}
            initial={reduceMotion ? false : { y: 28, opacity: 0 }}
            animate={reduceMotion ? false : { y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 17,
              delay: 0.04 * i,
            }}
          >
            {w}
          </motion.span>
        ))}
      </h1>
      {introMessage ? (
        <p
          style={{
            marginTop: "1rem",
            color: "#475569",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            maxWidth: "52ch",
          }}
        >
          {introMessage}
        </p>
      ) : null}
      <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#64748b" }}>
        Secure with a {depositPercent}% deposit &mdash; balance invoiced after.
      </p>
    </header>
  );
}
