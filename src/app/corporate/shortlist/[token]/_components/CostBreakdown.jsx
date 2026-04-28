"use client";

import { formatMoney } from "./formatMoney";

export default function CostBreakdown({ totalCents, depositPercent, depositCents, balanceCents, currency = "usd" }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "1rem 1.25rem",
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#64748b" }}>Total (estimate)</span>
        <strong style={{ color: "#0f172a" }}>{formatMoney(totalCents, currency)}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#64748b" }}>Deposit ({depositPercent}%)</span>
        <strong style={{ color: "#0f172a" }}>{formatMoney(depositCents, currency)}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Balance (invoiced)</span>
        <span style={{ color: "#0f172a", fontWeight: 600 }}>{formatMoney(balanceCents, currency)}</span>
      </div>
    </div>
  );
}
