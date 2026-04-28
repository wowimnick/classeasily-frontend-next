"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "./formatMoney";

export default function OptionCard({ option, index, currency, onDetails, onChoose }) {
  const reduceMotion = useReducedMotion();
  const inc = (option.inclusions || []).slice(0, 3);

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      style={{
        border: "1px solid #0f172a",
        borderRadius: 24,
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: 420,
      }}
    >
      <div
        style={{
          height: 180,
          background: option.cover_image_url
            ? `url(${option.cover_image_url}) center/cover`
            : "linear-gradient(145deg,#f1f5f9,#e2e8f0)",
        }}
      />
      <div style={{ padding: "1.1rem 1.25rem 1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: 0, fontSize: "1.35rem", letterSpacing: "-0.02em", color: "#0f172a" }}>
          {option.title}
        </h3>
        {option.host_name ? (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.88rem", color: "#64748b" }}>{option.host_name}</p>
        ) : null}
        {option.tagline ? (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.92rem", color: "#334155" }}>{option.tagline}</p>
        ) : null}
        <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem", color: "#475569", fontSize: "0.9rem" }}>
          {inc.map((line) => (
            <li key={line} style={{ marginBottom: 4 }}>
              {line}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>From</span>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
              {formatMoney(option.price_total_cents, currency)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => onDetails(option)}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: 12,
                padding: "0.65rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onChoose(option)}
              style={{
                flex: 1,
                border: "none",
                background: "#0f172a",
                color: "#fff",
                borderRadius: 12,
                padding: "0.65rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Choose
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
