"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input, Button, ColorPicker, Tooltip } from "antd";
import { businessService } from "@/services/apiService";
import message from "@/lib/message";
const DEFAULT_BRANDING = {
  logo_url: "",
  primary_color: "",
  footer_text: "",
  confirmation_message: "",
};

function normalizeHex(val) {
  if (val == null || typeof val !== "string") return null;
  const s = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1] + s[1], g = s[2] + s[2], b = s[3] + s[3];
    return "#" + r + g + b;
  }
  const m = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (m) {
    const hex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0");
    return "#" + hex(m[1]) + hex(m[2]) + hex(m[3]);
  }
  return null;
}

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

function ColorRow({ label, value, onChange, tooltip }) {
  const debounced = useDebounce(onChange, 120);
  const hex = normalizeHex(value) || "#000000";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 0", borderBottom: "1px solid #f3f4f6",
    }}>
      <Tooltip title={tooltip} placement="left" mouseEnterDelay={0.4}>
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500, cursor: tooltip ? "help" : "default", borderBottom: tooltip ? "1px dashed #d1d5db" : "none" }}>
          {label}
        </span>
      </Tooltip>
      <ColorPicker
        value={hex}
        onChange={(color) => {
          const next = color?.toHexString?.() ?? (typeof color === "string" ? color : hex);
          debounced(normalizeHex(next) || next);
        }}
        size="small"
        format="hex"
        disabledAlpha
      />
    </div>
  );
}

const Card = ({ title, subtitle, children }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
    {(title || subtitle) && (
      <div style={{ padding: "13px 18px", borderBottom: "1px solid #f3f4f6" }}>
        {title && <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{subtitle}</div>}
      </div>
    )}
    <div style={{ padding: "14px 18px" }}>{children}</div>
  </div>
);

const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{children}</div>
);

export default function EmailBrandingSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState({ ...DEFAULT_BRANDING });

  useEffect(() => {
    businessService.getWidgetConfig()
      .then((res) => {
        if (res.success && res.data) {
          setBranding({ ...DEFAULT_BRANDING, ...(res.data.marketplace_email_branding || {}) });
        }
      })
      .catch(() => message.error("Failed to load email branding settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    const payload = {
      marketplace_email_branding: {
        logo_url: (branding.logo_url || "").trim() || undefined,
        primary_color: (branding.primary_color || "").trim() || undefined,
        footer_text: (branding.footer_text || "").trim() || undefined,
        confirmation_message: (branding.confirmation_message || "").trim() || undefined,
      },
    };
    businessService.updateWidgetConfig(payload)
      .then((res) => {
        if (res.success) {
          message.success("Email branding saved.");
        } else {
          message.error(res.error || "Failed to save.");
        }
      })
      .catch(() => message.error("Failed to save."))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#6b7280" }}>
        Loading email settings…
      </div>
    );
  }

  return (
    <div>
      <Card
        title="Marketplace email branding"
        subtitle="Customize confirmation and reminder emails for bookings made on the ClassEasily marketplace. This applies when customers book through the marketplace (not your widget)."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <FieldLabel>Logo URL</FieldLabel>
            <Input
              value={branding.logo_url ?? ""}
              onChange={(e) => setBranding((b) => ({ ...b, logo_url: e.target.value }))}
              placeholder="https://yoursite.com/logo.png"
              size="middle"
            />
          </div>
          <div>
            <ColorRow
              label="Primary color (emails)"
              value={branding.primary_color ?? ""}
              onChange={(v) => setBranding((b) => ({ ...b, primary_color: v }))}
              tooltip="Accent color used in marketplace booking emails."
            />
          </div>
          <div>
            <FieldLabel>Footer text</FieldLabel>
            <Input.TextArea
              value={branding.footer_text ?? ""}
              onChange={(e) => setBranding((b) => ({ ...b, footer_text: e.target.value }))}
              placeholder="Optional custom footer."
              rows={2}
              size="middle"
            />
          </div>
          <div>
            <FieldLabel>Custom confirmation / reminder message</FieldLabel>
            <Input.TextArea
              value={branding.confirmation_message ?? ""}
              onChange={(e) => setBranding((b) => ({ ...b, confirmation_message: e.target.value }))}
              placeholder="Optional short message added to emails."
              rows={3}
              size="middle"
            />
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
          <Button type="primary" onClick={handleSave} loading={saving} style={{ fontWeight: 600 }}>
            {saving ? "Saving…" : "Save email branding"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
