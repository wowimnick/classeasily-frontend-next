"use client";

import React from "react";
import { Button, Alert } from "antd";
import { RefreshCw, Link as LinkIcon } from "lucide-react";

export default function StripeConnectionSettingsTab({ stripeStatus, onRefresh }) {
  const status = stripeStatus || "unlinked";
  const refresh = () => {
    onRefresh?.();
  };
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 48px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>
        Stripe connection
      </h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20, lineHeight: 1.55 }}>
        This is your Connect account used for class payouts. Widget SaaS billing (Plan &amp; Billing tab) is separate.
      </p>
      <Alert
        type={status === "linked" || status === "active" ? "success" : "info"}
        showIcon
        message={`Account status: ${status}`}
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" icon={<RefreshCw size={16} />} onClick={refresh}>
        Refresh from Stripe
      </Button>
      <div style={{ marginTop: 28, fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
        <LinkIcon size={16} />
        Manage tax, bank details, and capabilities in the Stripe Dashboard when your account is connected.
      </div>
    </div>
  );
}
