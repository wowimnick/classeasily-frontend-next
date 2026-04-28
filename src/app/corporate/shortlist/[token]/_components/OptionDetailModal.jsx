"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "./formatMoney";

export default function OptionDetailModal({ open, option, currency, onClose, onChoose }) {
  const reduceMotion = useReducedMotion();
  if (!option) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? undefined : { scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(640px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #0f172a",
              boxShadow: "0 25px 80px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                height: 220,
                background: option.cover_image_url
                  ? `url(${option.cover_image_url}) center/cover`
                  : "#e2e8f0",
              }}
            />
            <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>{option.title}</h2>
              {option.host_name ? (
                <p style={{ color: "#64748b", marginTop: 6 }}>{option.host_name}</p>
              ) : null}
              <p style={{ color: "#334155", lineHeight: 1.6, marginTop: 12 }}>{option.description}</p>
              <ul style={{ color: "#475569", lineHeight: 1.5 }}>
                {(option.inclusions || []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p style={{ marginTop: 12, fontWeight: 700, fontSize: "1.2rem" }}>
                {formatMoney(option.price_total_cents, currency)}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: 12,
                    padding: "0.75rem",
                    background: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => onChoose(option)}
                  style={{
                    flex: 1,
                    border: "none",
                    borderRadius: 12,
                    padding: "0.75rem",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Choose this
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
