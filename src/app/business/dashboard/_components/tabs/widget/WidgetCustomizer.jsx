"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Modal, Input, Select, Button, ColorPicker, Switch, Tooltip, message as antMessage } from "antd";
import { Copy, Loader2, Check, X, Plus, Trash2, Pencil } from "lucide-react";
import { businessService } from "@/services/apiService";
import message from "@/lib/message";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";

// ─── Theme constants ──────────────────────────────────────────────────────────
const ACCENT      = "#ff385b";  // big CTAs
const SEL_COLOR   = "#111827";  // active selection borders / small buttons

/** Normalize to #rrggbb for ColorPicker and API. Handles #fff, #ffffff, rgb(), etc. */
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

// ─── Debounce ─────────────────────────────────────────────────────────────────
function useDebounce(fn, delay = 300) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

// ─── Color row with antd ColorPicker ─────────────────────────────────────────
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

// ─── Active badge ──────────────────────────────────────────────────────────────
function ActiveBadge() {
  return (
    <div style={{
      position: "absolute", top: -7, right: -7,
      width: 18, height: 18, borderRadius: "50%",
      background: SEL_COLOR, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
    }}>
      <Check size={10} strokeWidth={3} />
    </div>
  );
}

// ─── View type cards with SVG illustrations ───────────────────────────────────
function ModalIllustration({ active }) {
  const line = active ? `${SEL_COLOR}30` : "#edf0f2";
  const border = active ? SEL_COLOR : "#d1d5db";
  return (
    <svg width="52" height="38" viewBox="0 0 52 38" fill="none">
      {/* browser bg */}
      <rect width="52" height="38" rx="4" fill={active ? "#f3f4f6" : "#f9fafb"} />
      {/* top bar */}
      <rect x="0" y="0" width="52" height="7" rx="2" fill={active ? "#e5e7eb" : "#eef0f2"} />
      <circle cx="5" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <circle cx="10" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      {/* page lines */}
      <rect x="4" y="11" width="28" height="3" rx="1" fill={line} />
      <rect x="4" y="16" width="20" height="2" rx="1" fill={line} />
      {/* overlay */}
      <rect x="0" y="7" width="52" height="31" rx="0" fill="rgba(0,0,0,0.35)" />
      {/* modal card */}
      <rect x="10" y="10" width="32" height="25" rx="3" fill="white" />
      {/* modal header */}
      <rect x="10" y="10" width="32" height="8" rx="3" fill="#f9fafb" />
      <rect x="10" y="14" width="32" height="4" fill="#f9fafb" />
      <rect x="14" y="12.5" width="18" height="3" rx="1" fill="#d1d5db" />
      <circle cx="38" cy="14" r="2.5" fill="#e5e7eb" />
      {/* modal body lines */}
      <rect x="13" y="22" width="20" height="2" rx="1" fill="#e5e7eb" />
      <rect x="13" y="26" width="14" height="2" rx="1" fill="#edf0f2" />
      {/* modal button */}
      <rect x="13" y="30" width="20" height="3.5" rx="1.5" fill={border} />
    </svg>
  );
}

function InlineIllustration({ active }) {
  const line = active ? `${SEL_COLOR}25` : "#edf0f2";
  const accent = active ? SEL_COLOR : "#d1d5db";
  return (
    <svg width="52" height="38" viewBox="0 0 52 38" fill="none">
      <rect width="52" height="38" rx="4" fill={active ? "#f3f4f6" : "#f9fafb"} />
      <rect x="0" y="0" width="52" height="7" rx="2" fill={active ? "#e5e7eb" : "#eef0f2"} />
      <circle cx="5" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <circle cx="10" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <rect x="4" y="11" width="22" height="2.5" rx="1" fill={line} />
      {/* inline widget card */}
      <rect x="4" y="16" width="44" height="19" rx="3" fill="white" stroke={accent} strokeWidth="0.8" />
      {/* mini calendar grid inside */}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={6 + i*6} y="19" width="4" height="3.5" rx="0.8"
          fill={i===3 ? accent : "#f0f0f0"} />
      ))}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={6 + i*6} y="24" width="4" height="3.5" rx="0.8" fill="#f0f0f0" />
      ))}
      {/* slot row */}
      <rect x="6" y="30" width="28" height="3" rx="1" fill="#f3f4f6" />
      <rect x="36" y="30" width="10" height="3" rx="1.5" fill={accent} />
    </svg>
  );
}

function FloatingIllustration({ active }) {
  const line = active ? `${SEL_COLOR}25` : "#edf0f2";
  const accent = active ? SEL_COLOR : "#d1d5db";
  return (
    <svg width="52" height="38" viewBox="0 0 52 38" fill="none">
      <rect width="52" height="38" rx="4" fill={active ? "#f3f4f6" : "#f9fafb"} />
      <rect x="0" y="0" width="52" height="7" rx="2" fill={active ? "#e5e7eb" : "#eef0f2"} />
      <circle cx="5" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <circle cx="10" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <rect x="4" y="11" width="28" height="2.5" rx="1" fill={line} />
      <rect x="4" y="16" width="22" height="2" rx="1" fill={line} />
      <rect x="4" y="21" width="18" height="2" rx="1" fill={line} />
      {/* floating pill button */}
      <rect x="28" y="27" width="20" height="8" rx="4" fill={accent} />
      <rect x="31" y="30" width="14" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

function DrawerIllustration({ active }) {
  const lineFill = active ? (SEL_COLOR + "25") : "#edf0f2";
  const accent = active ? SEL_COLOR : "#d1d5db";
  const bgFill = active ? "#f3f4f6" : "#f9fafb";
  const barFill = active ? "#e5e7eb" : "#eef0f2";
  const dotFill = active ? "#d1d5db" : "#e5e7eb";
  return (
    <svg width="52" height="38" viewBox="0 0 52 38" fill="none">
      <rect width="52" height="38" rx="4" fill={bgFill} />
      <rect x="0" y="0" width="52" height="7" rx="2" fill={barFill} />
      <circle cx="5" cy="3.5" r="1.5" fill={dotFill} />
      <circle cx="10" cy="3.5" r="1.5" fill={dotFill} />
      <rect x="4" y="11" width="24" height="2.5" rx="1" fill={lineFill} />
      <rect x="4" y="16" width="18" height="2" rx="1" fill={lineFill} />
      <rect x="22" y="7" width="26" height="31" rx="2" fill="white" stroke={accent} strokeWidth="1" />
      <rect x="24" y="9" width="22" height="5" rx="1" fill="#f9fafb" />
      <rect x="24" y="16" width="16" height="2" rx="1" fill="#e5e7eb" />
      <rect x="24" y="20" width="12" height="2" rx="1" fill="#edf0f2" />
      <rect x="24" y="26" width="18" height="3" rx="1.5" fill={accent} />
    </svg>
  );
}

const VIEW_OPTIONS = [
  { id: "modal",    label: "Modal",    Illustration: ModalIllustration },
  { id: "inline",   label: "Inline",   Illustration: InlineIllustration },
  // Drawer display type commented out for now (unused)
  // { id: "drawer",   label: "Drawer",   Illustration: DrawerIllustration },
  { id: "floating", label: "Floating", Illustration: FloatingIllustration },
];

function ViewTypeCard({ id, current, onChange, label, Illustration }) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      style={{
        flex: 1, minWidth: 0, padding: "12px 8px 10px",
        border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
        borderRadius: 10, background: active ? "#fafafa" : "#ffffff",
        cursor: "pointer", textAlign: "center",
        transition: "all 0.15s", position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
      }}
    >
      {active && <ActiveBadge />}
      <Illustration active={active} />
      <div style={{ fontSize: 11, fontWeight: 600, color: active ? SEL_COLOR : "#6b7280" }}>{label}</div>
    </button>
  );
}

// ─── Button size cards ─────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
  { id: "large",  label: "Large",  pillWidth: 58 },
  { id: "medium", label: "Medium", pillWidth: 42 },
  { id: "small",  label: "Small",  pillWidth: 26 },
];

function ButtonSizeCard({ id, current, onChange, label, pillWidth }) {
  const active = current === id;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <button
        type="button"
        onClick={() => onChange(id)}
        style={{
          width: "100%", padding: "11px 6px",
          border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
          borderRadius: 10, background: active ? "#fafafa" : "#ffffff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", transition: "all 0.15s",
        }}
      >
        {active && <ActiveBadge />}
        <div style={{
          width: pillWidth, height: 11, borderRadius: 6,
          background: active ? "#d1d5db" : "#e5e7eb",
        }} />
      </button>
      <span style={{ fontSize: 11, color: active ? SEL_COLOR : "#9ca3af", fontWeight: active ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
}

// Button size → mock padding/font (for preview only)
const MOCK_BTN_SIZE = { large: { p: "4px 10px", fs: 9 }, medium: { p: "3px 8px", fs: 8 }, small: { p: "2px 6px", fs: 7 } };

// ─── Accurate inline widget mockup (uses full theme) ───────────────────────────
function InlineWidgetMock({
  primary,
  textOnPrimary,
  background,
  cardBackground,
  textPrimary,
  textSecondary,
  border,
  radiusPx = 8,
  buttonSize = "medium",
}) {
  const bc = primary || SEL_COLOR;
  const btc = textOnPrimary || "#ffffff";
  const bg = background || "#f9fafb";
  const cardBg = cardBackground || "#ffffff";
  const tp = textPrimary || "#111827";
  const ts = textSecondary || "#6b7280";
  const bdr = border || "#e5e7eb";
  const r = radiusPx;
  const btnSize = MOCK_BTN_SIZE[buttonSize] || MOCK_BTN_SIZE.medium;
  const DAYS = [
    [null, null, null, null, null, { n: 1 }, { n: 2, dot: true }],
    [{ n: 3, dot: true }, { n: 4 }, { n: 5, sel: true }, { n: 6, dot: true }, { n: 7 }, { n: 8, dot: true }, { n: 9 }],
    [{ n: 10, dot: true }, { n: 11 }, { n: 12 }, { n: 13, dot: true }, { n: 14 }, { n: 15, dot: true }, { n: 16 }],
    [{ n: 17 }, { n: 18, dot: true }, { n: 19, dot: true }, { n: 20 }, { n: 21, dot: true }, { n: 22 }, { n: 23 }],
    [{ n: 24, dot: true }, { n: 25 }, { n: 26 }, { n: 27, dot: true }, { n: 28 }, null, null],
  ];

  return (

      <div style={{
        background: cardBg,
        borderRadius: r,
        border: `1px solid ${bdr}`,
        padding: "10px 10px 8px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          <div style={{ width: 16, height: 16, borderRadius: Math.max(2, r - 6), background: bg, border: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: ts, lineHeight: 1, userSelect: "none" }}>‹</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: tp }}>February 2026</span>
          <div style={{ width: 16, height: 16, borderRadius: Math.max(2, r - 6), background: bg, border: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: ts, lineHeight: 1, userSelect: "none" }}>›</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 3 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 7, fontWeight: 600, color: ts }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 8 }}>
          {DAYS.flat().map((cell, i) => {
            if (!cell) return <div key={i} style={{ aspectRatio: "1" }} />;
            return (
              <div key={i} style={{
                aspectRatio: "1", borderRadius: Math.max(2, r - 6),
                display: "flex", alignItems: "center", justifyContent: "center",
                background: cell.sel ? bc : "transparent",
                position: "relative",
              }}>
                <span style={{ fontSize: 9.5, fontWeight: cell.sel ? 700 : 400, color: cell.sel ? btc : cell.dot ? tp : ts }}>
                  {cell.n}
                </span>
                {cell.dot && !cell.sel && (
                  <div style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 2.5, height: 2.5, borderRadius: "50%", background: bc }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 8, fontWeight: 700, color: tp, marginBottom: 5 }}>Select a time — Wed, Feb 5</div>
        <div style={{ border: `1px solid ${bdr}`, borderRadius: r, overflow: "hidden" }}>
          {[{ time: "10:00 AM", dur: "60 min", price: "$45" }, { time: "2:00 PM", dur: "60 min", price: "$45" }].map((slot, i) => (
            <div key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${bdr}`, padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", background: cardBg }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: tp }}>{slot.time}</div>
                <div style={{ fontSize: 7.5, color: ts }}>{slot.dur} · {slot.price}</div>
              </div>
              <div style={{ background: bc, color: btc, borderRadius: Math.max(2, r - 4), padding: btnSize.p, fontSize: btnSize.fs, fontWeight: 700 }}>Book</div>
            </div>
          ))}
        </div>
      </div>
  );
}

// ─── Drawer position options (when view === drawer) ───────────────────────────
const DRAWER_POSITION_OPTIONS = [
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

// ─── Border radius options (widget uses borderRadiusPreset) ──────────────────
const BORDER_RADIUS_OPTIONS = [
  { id: "none", label: "None" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

const RADIUS_PX = { none: 0, small: 4, medium: 8, large: 12 };

// Color presets derived from WidgetLandingClient WIDGET_THEMES (Classic, Sunset, Retro, Minimal, Ocean, Rose).
const COLOR_PRESETS = [
  { id: "classic", label: "Classic", primary: "#2563EB", textOnPrimary: "#ffffff", background: "#EFF6FF", cardBackground: "#FFFFFF", textPrimary: "#1E293B", textSecondary: "#64748B", border: "#E2E8F0" },
  { id: "sunset", label: "Sunset", primary: "#EA580C", textOnPrimary: "#ffffff", background: "#FEF3C7", cardBackground: "#FFFFFF", textPrimary: "#431407", textSecondary: "#B45309", border: "#FED7AA" },
  { id: "retro", label: "Retro", primary: "#D97706", textOnPrimary: "#1C1917", background: "#FDF6E3", cardBackground: "#FFFBEB", textPrimary: "#292524", textSecondary: "#92400E", border: "#D97706" },
  { id: "minimal", label: "Minimal", primary: "#3F3F46", textOnPrimary: "#FAFAFA", background: "#F4F4F5", cardBackground: "#FFFFFF", textPrimary: "#18181B", textSecondary: "#71717A", border: "#E4E4E7" },
  { id: "ocean", label: "Ocean", primary: "#0D9488", textOnPrimary: "#ffffff", background: "#CCFBF1", cardBackground: "#FFFFFF", textPrimary: "#134E4A", textSecondary: "#0F766E", border: "#99F6E4" },
  { id: "rose", label: "Rose", primary: "#E11D48", textOnPrimary: "#ffffff", background: "#FFF1F2", cardBackground: "#FFFFFF", textPrimary: "#4C0519", textSecondary: "#BE123C", border: "#FECDD3" },
];

// Font options: value is the exact CSS font-family string sent to the widget (--ce-font-family).
const FONT_FAMILY_OPTIONS = [
  { value: "", label: "Inherit from website" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "Lato, sans-serif", label: "Lato" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: '"Proxima Soft", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', label: "Proxima Soft" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "system-ui, sans-serif", label: "System default" },
];

// ─── Browser mockup shell + view-specific content (uses full theme) ─────────────
function BrowserMockup({
  view,
  buttonText,
  buttonColor,
  buttonTextColor,
  buttonSize,
  borderRadiusPreset,
  background,
  cardBackground,
  textPrimary,
  textSecondary,
  border,
}) {
  const bc = buttonColor || SEL_COLOR;
  const btc = buttonTextColor || "#ffffff";
  const bg = background || "#f9fafb";
  const cardBg = cardBackground || "#ffffff";
  const tp = textPrimary || "#111827";
  const ts = textSecondary || "#6b7280";
  const bdr = border || "#e5e7eb";
  const label = (buttonText || "Book now").slice(0, 16);
  const r = RADIUS_PX[borderRadiusPreset] ?? 8;

  const btnPadding = { large: "5px 12px", medium: "4px 9px", small: "3px 7px" }[buttonSize] || "4px 9px";
  const btnFontSize = { large: 9, medium: 8, small: 7 }[buttonSize] || 8;

  const TriggerBtn = ({ extraStyle = {} }) => (
    <div style={{ background: bc, color: btc, borderRadius: r, fontSize: btnFontSize, fontWeight: 700, padding: btnPadding, display: "inline-block", ...extraStyle }}>
      {label}
    </div>
  );

  const PageLines = () => (
    <div style={{ padding: "12px 10px 10px" }}>
      <div style={{ height: 8, background: bdr, borderRadius: 3, width: "62%", marginBottom: 7 }} />
      <div style={{ height: 6, background: bdr, borderRadius: 3, width: "88%", marginBottom: 5, opacity: 0.7 }} />
      <div style={{ height: 6, background: bdr, borderRadius: 3, width: "72%", marginBottom: 5, opacity: 0.5 }} />
    </div>
  );

  const themeProps = {
    primary: bc,
    textOnPrimary: btc,
    background: bg,
    cardBackground: cardBg,
    textPrimary: tp,
    textSecondary: ts,
    border: bdr,
    radiusPx: r,
    buttonSize,
  };

  const innerContent = (() => {
    if (view === "inline") {
      return (
          <InlineWidgetMock {...themeProps} />
      );
    }

    if (view === "modal") {
      return (
        <div style={{ position: "relative", minHeight: 170 }}>
          <PageLines />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}>
            <div style={{
              position: "absolute", top: "8%", left: "9%", right: "9%",
              background: cardBg, borderRadius: r,
              boxShadow: "0 8px 24px rgba(0,0,0,0.22)", overflow: "hidden",
              border: `1px solid ${bdr}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: `1px solid ${bdr}`, gap: 6, background: bg, borderRadius: `${r}px ${r}px 0 0` }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", border: `1px solid ${bdr}`, background: cardBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: ts, userSelect: "none" }}>‹</span>
                </div>
                <span style={{ flex: 1, textAlign: "center", fontSize: 9, fontWeight: 700, color: tp }}>Select date & time</span>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: bg, border: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={7} color={ts} />
                </div>
              </div>
              <div style={{ padding: "8px 10px 10px", background: cardBg }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 7.5, color: ts, userSelect: "none" }}>‹</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: tp }}>February 2026</span>
                  <span style={{ fontSize: 7.5, color: ts, userSelect: "none" }}>›</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} style={{ textAlign: "center", fontSize: 6, color: ts }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: 21 }, (_, i) => {
                    const n = i - 4;
                    if (n <= 0) return <div key={i} style={{ aspectRatio: "1" }} />;
                    const isSelected = n === 5;
                    return (
                      <div key={i} style={{ aspectRatio: "1", borderRadius: Math.max(1, r - 4), display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? bc : "transparent" }}>
                        <span style={{ fontSize: 8.5, color: isSelected ? btc : tp }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: "relative" }}>
        <PageLines />
        <div style={{ padding: "0 10px 4px" }}>
          <div style={{ height: 5, background: bdr, borderRadius: Math.max(1, r - 4), width: "78%", marginBottom: 5, opacity: 0.6 }} />
          <div style={{ height: 5, background: bdr, borderRadius: Math.max(1, r - 4), width: "50%", opacity: 0.5 }} />
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 8 }}>
          <TriggerBtn extraStyle={{ borderRadius: 999 }} />
        </div>
        <div style={{ height: 32 }} />
      </div>
    );
  })();

  return (

    <div>
      {innerContent}
      </div>
  );
}

// ─── Settings card ─────────────────────────────────────────────────────────────
function SettingsCard({ title, subtitle, children }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e9ecef", borderRadius: 12, overflow: "hidden" }}>
      {(title || subtitle) && (
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f3f4f6" }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{children}</div>;
}

// ─── Default form ─────────────────────────────────────────────────────────────
const DEFAULT_EMAIL_BRANDING = {
  logo_url: "",
  primary_color: "",
  footer_text: "",
  confirmation_message: "",
};

const DEFAULT_FORM = {
  view: "modal",
  buttonText: "Book now",
  drawerPosition: "bottom",
  responsiveDrawerOnMobile: true,
  primary: SEL_COLOR,
  background: "#ffffff",
  cardBackground: "#ffffff",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textOnPrimary: "#ffffff",
  border: "#e5e7eb",
  fontFamily: "",
  borderRadiusPreset: "medium",
  buttonSize: "medium",
  specificClassId: "",
  allowed_widget_origins: "",
  emailBranding: { ...DEFAULT_EMAIL_BRANDING },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function WidgetCustomizer() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [copied, setCopied]     = useState(false);
  const [data, setData]         = useState(null);
  const [form, setForm]         = useState(DEFAULT_FORM);
  const [isWide, setIsWide]     = useState(
    typeof window !== "undefined" ? window.innerWidth >= 960 : true
  );
  const [newDomainInput, setNewDomainInput] = useState("");
  const [editingDomainIndex, setEditingDomainIndex] = useState(-1);
  const [editingDomainValue, setEditingDomainValue] = useState("");
  const searchParams = useSearchParams();

  const allowedDomainsArray = (form.allowed_widget_origins || "")
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const addDomain = () => {
    const domain = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!domain) return;
    if (allowedDomainsArray.includes(domain)) {
      antMessage.warning("Domain already in list.");
      return;
    }
    setForm((f) => ({
      ...f,
      allowed_widget_origins: [f.allowed_widget_origins.trim(), domain].filter(Boolean).join("\n"),
    }));
    setNewDomainInput("");
  };

  const removeDomain = (index) => {
    const next = allowedDomainsArray.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, allowed_widget_origins: next.join("\n") }));
  };

  const startEditDomain = (index) => {
    setEditingDomainIndex(index);
    setEditingDomainValue(allowedDomainsArray[index]);
  };

  const saveEditDomain = () => {
    const domain = editingDomainValue.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!domain) {
      setEditingDomainIndex(-1);
      return;
    }
    const next = [...allowedDomainsArray];
    next[editingDomainIndex] = domain;
    setForm((f) => ({ ...f, allowed_widget_origins: next.join("\n") }));
    setEditingDomainIndex(-1);
    setEditingDomainValue("");
  };

  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 960);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (searchParams.get("subscribed") === "1") {
      message.success("You're now subscribed. Your widget is ready to use.");
      window.history.replaceState({}, "", "/business/dashboard/widget");
    }
  }, [searchParams]);

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  useEffect(() => {
    businessService.getWidgetConfig()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          const c = res.data.config || {};
          const norm = (v, fallback) => (normalizeHex(v) || normalizeHex(fallback) || fallback);
          setForm((prev) => ({
            ...prev,
            view:                     c.view                     ?? prev.view,
            buttonText:               c.buttonText               ?? prev.buttonText,
            drawerPosition:           c.drawerPosition           ?? prev.drawerPosition,
            responsiveDrawerOnMobile: c.responsiveDrawerOnMobile !== false,
            primary:                  norm(c.primary, prev.primary),
            background:               norm(c.background, prev.background),
            cardBackground:           norm(c.cardBackground, prev.cardBackground),
            textPrimary:              norm(c.textPrimary, prev.textPrimary),
            textSecondary:            norm(c.textSecondary, prev.textSecondary),
            textOnPrimary:            norm(c.textOnPrimary, prev.textOnPrimary),
            border:                   norm(c.border, prev.border),
            fontFamily:               (typeof c.fontFamily === "string" ? c.fontFamily : prev.fontFamily) ?? "",
            borderRadiusPreset:       c.borderRadiusPreset       ?? prev.borderRadiusPreset,
            buttonSize:               c.buttonSize               ?? prev.buttonSize,
            specificClassId:          c.specificClassId != null ? String(c.specificClassId) : "",
            allowed_widget_origins:   typeof c.allowed_widget_origins === "string" ? c.allowed_widget_origins : "",
            emailBranding:           {
              ...DEFAULT_EMAIL_BRANDING,
              ...(res.data.widget_email_branding || {}),
            },
          }));
        }
      })
      .catch(() => antMessage.error("Failed to load widget settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    const hex = (v) => (normalizeHex(v) || v);
    const payload = {
      view: form.view, buttonText: form.buttonText,
      drawerPosition: form.drawerPosition, responsiveDrawerOnMobile: form.responsiveDrawerOnMobile,
      primary: hex(form.primary), background: hex(form.background), cardBackground: hex(form.cardBackground),
      textPrimary: hex(form.textPrimary), textSecondary: hex(form.textSecondary), textOnPrimary: hex(form.textOnPrimary),
      border: hex(form.border), fontFamily: (form.fontFamily && form.fontFamily.trim()) || undefined,
      borderRadiusPreset: form.borderRadiusPreset, buttonSize: form.buttonSize,
      // Always send specificClassId so backend can clear it when "Profile page with all classes" is selected (partial merge would otherwise leave old value)
      specificClassId: (form.specificClassId && String(form.specificClassId).trim()) || null,
      allowed_widget_origins: form.allowed_widget_origins,
    };
    businessService.updateWidgetConfig(payload)
      .then((res) => {
        if (res.success) {
          message.success("Widget settings saved.");
          setData((d) => (d ? { ...d, config: { ...d.config, ...payload } } : null));
        } else {
          antMessage.error(res.error || "Failed to save");
        }
      })
      .catch(() => antMessage.error("Failed to save"))
      .finally(() => setSaving(false));
  };

  const apiKey        = data?.widget_api_key || "";
  const apiBase       = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "" : "";
  const widgetScriptUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL || "" : "";
  const origin        = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl    = apiKey
    ? `${origin}/widget-demo?key=${encodeURIComponent(apiKey)}${apiBase ? `&base=${encodeURIComponent(apiBase)}` : ""}`
    : "";
  const mockDemoUrl   = `${origin}/widget-demo/mock?key=${encodeURIComponent(apiKey || "demo")}${apiBase ? `&base=${encodeURIComponent(apiBase)}` : ""}`;

  const embedSnippet = `<!-- Class Easily Booking Widget -->
<link rel="stylesheet" href="${widgetScriptUrl.replace(/\.js$/, ".css")}" />
<div id="classeasily-booking-widget"
  data-widget-api-key="${apiKey}"
  data-api-base="${apiBase}">
</div>
<script src="${widgetScriptUrl}"><\/script>`;

  const handleCopy = () => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        background: "rgba(255,255,255,0.9)",
        zIndex: 10,
      }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
        <span style={{ color: "#6b7280", fontSize: 14 }}>Loading widget settings…</span>
      </div>
    );
  }

  const classes = data?.classes || [];

  // ─── Left column ─────────────────────────────────────────────────────────────
  const leftColumn = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Display type */}
      <SettingsCard title="Display Type" subtitle="How the booking flow opens for visitors">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {VIEW_OPTIONS.map((opt) => (
            <ViewTypeCard
              key={opt.id} id={opt.id}
              current={form.view} onChange={set("view")}
              label={opt.label} Illustration={opt.Illustration}
            />
          ))}
        </div>
        {form.view === "drawer" && (
          <div style={{ marginTop: 14 }}>
            <FieldLabel>Drawer position</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {DRAWER_POSITION_OPTIONS.map((opt) => {
                const active = form.drawerPosition === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => set("drawerPosition")(opt.id)}
                    style={{
                      flex: 1, padding: "8px 10px",
                      border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
                      borderRadius: 8, background: active ? "#fafafa" : "#ffffff",
                      cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 500,
                      color: active ? SEL_COLOR : "#374151",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </SettingsCard>

      {/* Button */}
      <SettingsCard title="Button" subtitle="Customize the trigger button">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <FieldLabel>Button Label</FieldLabel>
            <Input
              value={form.buttonText}
              onChange={(e) => set("buttonText")(e.target.value)}
              maxLength={40}
              placeholder="Book now"
              size="middle"
            />
          </div>
          <div>
            <FieldLabel>Size</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {SIZE_OPTIONS.map((opt) => (
                <ButtonSizeCard
                  key={opt.id} id={opt.id}
                  current={form.buttonSize} onChange={set("buttonSize")}
                  label={opt.label} pillWidth={opt.pillWidth}
                />
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Typography & shape */}
      <SettingsCard title="Typography & Shape" subtitle="Font and corner rounding">
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Font</FieldLabel>
          <Select
            value={form.fontFamily ?? ""}
            onChange={(v) => set("fontFamily")(v ?? "")}
            style={{ width: "100%" }}
            size="middle"
            options={FONT_FAMILY_OPTIONS}
            placeholder="Inherit from website"
          />
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Choose how text appears in the widget. &quot;Inherit&quot; uses your site&apos;s font.</div>
        </div>
        <div>
          <FieldLabel>Corner radius</FieldLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {BORDER_RADIUS_OPTIONS.map((opt) => {
              const active = form.borderRadiusPreset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("borderRadiusPreset")(opt.id)}
                  style={{
                    flex: 1, minWidth: 60, padding: "8px 10px",
                    border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
                    borderRadius: 8, background: active ? "#fafafa" : "#ffffff",
                    cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 500,
                    color: active ? SEL_COLOR : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsCard>

      {/* Colors */}
      <SettingsCard title="Colors" subtitle="Match the widget to your brand">
        <FieldLabel style={{ marginBottom: 8 }}>Presets</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setForm((f) => ({
                ...f,
                primary: preset.primary,
                textOnPrimary: preset.textOnPrimary,
                background: preset.background,
                cardBackground: preset.cardBackground,
                textPrimary: preset.textPrimary,
                textSecondary: preset.textSecondary,
                border: preset.border,
              }))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 4, background: preset.primary, flexShrink: 0 }} />
              {preset.label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
          <div>
            <ColorRow label="Primary" value={form.primary} onChange={set("primary")}
              tooltip="Main accent color — used for the Book button, selected date cells, the Continue button, and active highlights throughout the widget." />
            <ColorRow label="Widget Background" value={form.background} onChange={set("background")}
              tooltip="Outermost background of the widget. Also used for subtle fills like available date cells, price badges, and booking summary strips." />
            <ColorRow label="Card Background" value={form.cardBackground} onChange={set("cardBackground")}
              tooltip="Background of the main card panels, the modal/drawer surface, and individual booking slots. Usually white or a near-white shade." />
            <ColorRow label="Primary Text" value={form.textPrimary} onChange={set("textPrimary")}
              tooltip="Main text color for headings, time labels, names, and prices." />
          </div>
          <div>
            <ColorRow label="Secondary Text" value={form.textSecondary} onChange={set("textSecondary")}
              tooltip="Muted text for dates, duration, spots remaining, labels, and helper copy." />
            <ColorRow label="Borders" value={form.border} onChange={set("border")}
              tooltip="Color of dividers, card outlines, input borders, and nav button rings." />
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, lineHeight: 1.45 }}>
          Text on the primary color (e.g. the date number inside selected cells) auto-adjusts to black or white for maximum contrast.
        </div>
      </SettingsCard>

      {/* Content */}
      <SettingsCard title="Content" subtitle="Control which classes are shown">
        <FieldLabel>Starting page</FieldLabel>
        {(() => {
          const planId = (data?.widget_subscription?.planId || "").toLowerCase();
          const canPinToClass = ["growth", "advanced"].includes(planId);
          const select = (
            <Select
              value={form.specificClassId || ""}
              onChange={(v) => set("specificClassId")(v)}
              style={{ width: "100%" }}
              size="middle"
              disabled={!canPinToClass}
              options={[
                { value: "", label: "Profile page with all classes" },
                ...classes.map((c) => ({ value: String(c.classId), label: c.title })),
              ]}
            />
          );
          return canPinToClass ? (
            select
          ) : (
            <Tooltip title="Upgrade to Growth or Advanced to pin the widget to a specific class.">
              <span style={{ display: "inline-block", width: "100%" }}>{select}</span>
            </Tooltip>
          );
        })()}
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, lineHeight: 1.4 }}>
          Selecting a class skips the class-selection step for your customers.
        </div>
      </SettingsCard>

      {/* Allowed Domains */}
      <SettingsCard title="Allowed Domains" subtitle="Restrict which websites can embed your widget">
        <FieldLabel>Add a domain</FieldLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Input
            value={newDomainInput}
            onChange={(e) => setNewDomainInput(e.target.value)}
            onPressEnter={addDomain}
            placeholder="yoursite.com or www.yoursite.com"
            style={{ flex: 1, fontFamily: "monospace" }}
            size="middle"
          />
          <Button type="primary" icon={<Plus size={14} />} onClick={addDomain} style={{ background: SEL_COLOR, borderColor: SEL_COLOR }}>
            Add
          </Button>
        </div>
        {allowedDomainsArray.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            {allowedDomainsArray.map((domain, index) => (
              <li
                key={`${domain}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderBottom: index < allowedDomainsArray.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: "#fff",
                  gap: 8,
                }}
              >
                {editingDomainIndex === index ? (
                  <>
                    <Input
                      value={editingDomainValue}
                      onChange={(e) => setEditingDomainValue(e.target.value)}
                      onPressEnter={saveEditDomain}
                      size="small"
                      style={{ flex: 1, fontFamily: "monospace" }}
                      autoFocus
                    />
                    <Button type="text" size="small" icon={<Check size={14} />} onClick={saveEditDomain} style={{ color: "#16a34a" }} />
                    <Button type="text" size="small" icon={<X size={14} />} onClick={() => { setEditingDomainIndex(-1); setEditingDomainValue(""); }} style={{ color: "#6b7280" }} />
                  </>
                ) : (
                  <>
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#111827", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{domain}</span>
                    <Button type="text" size="small" icon={<Pencil size={12} />} onClick={() => startEditDomain(index)} style={{ color: "#6b7280", padding: "4px" }} title="Edit" />
                    <Button type="text" size="small" danger icon={<Trash2 size={12} />} onClick={() => removeDomain(index)} style={{ padding: "4px" }} title="Remove" />
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>No domains added yet. Add your website domain so the widget can load.</div>
        )}
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, lineHeight: 1.4 }}>
          Without <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>https://</code>. ClassEasily domains are always allowed.
        </div>
      </SettingsCard>

    </div>
  );

  // ─── Right column ─────────────────────────────────────────────────────────────
  const rightColumn = (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Live mockup */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
          Live Preview
        </div>
        <BrowserMockup
          view={form.view}
          buttonText={form.buttonText}
          buttonColor={form.primary}
          buttonTextColor={form.textOnPrimary}
          buttonSize={form.buttonSize}
          borderRadiusPreset={form.borderRadiusPreset}
          background={form.background}
          cardBackground={form.cardBackground}
          textPrimary={form.textPrimary}
          textSecondary={form.textSecondary}
          border={form.border}
        />
        {previewUrl && (
          <Button
            size="small"
            onClick={() => window.open(previewUrl, "_blank")}
            style={{ marginTop: 8, width: "100%" }}
          >
            Open full preview
          </Button>
        )}
        <Button
          size="small"
          onClick={() => window.open(mockDemoUrl, "_blank")}
          style={{ marginTop: 6, width: "100%" }}
        >
          Open experience demo
        </Button>
      </div>

      <div style={{ height: 1, background: "#e9ecef" }} />

      {/* Embed code */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Embed Code</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, lineHeight: 1.5 }}>
          Paste this into your website HTML.{" "}
          <a href="https://classeasily.com" target="_blank" rel="noopener noreferrer"
            style={{ color: SEL_COLOR, textDecoration: "underline" }}>Setup guide
          </a>
        </div>

        <pre style={{
          background: "#f1f3f5", border: "1px dashed #d1d5db",
          borderRadius: 8, padding: "11px 13px", fontSize: 11,
          lineHeight: 1.75, margin: 0, overflowX: "auto",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
          color: "#1f2937", fontFamily: "monospace",
        }}>
          {embedSnippet}
        </pre>

        <Button
          type="primary"
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={handleCopy}
          block
          style={{ marginTop: 8, background: copied ? "#16a34a" : SEL_COLOR, borderColor: copied ? "#16a34a" : SEL_COLOR, fontWeight: 600 }}
        >
          {copied ? "Copied!" : "Copy code"}
        </Button>

        {apiKey && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af" }}>
            API key: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{apiKey}</code>
          </div>
        )}

        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fffbeb", borderRadius: 7, border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
            <strong>Before going live:</strong> add your domain to Allowed Domains so the widget can load from your site.
          </div>
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#eff6ff", borderRadius: 7, border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 11, color: "#1e40af", lineHeight: 1.5 }}>
            <strong>Using your own button?</strong> (e.g. on Wix) Add <code style={{ background: "rgba(255,255,255,0.7)", padding: "1px 4px", borderRadius: 3 }}>data-ce-trigger="custom"</code> to the div, include the trigger script on your page, and add <code style={{ background: "rgba(255,255,255,0.7)", padding: "1px 4px", borderRadius: 3 }}>data-ce-booking-trigger</code> to your button. The modal will open fullscreen. See the demo page for the full snippet.
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div style={{ padding: "24px 24px 80px", position: "relative" }}>
      <DashboardBreadcrumb title="Booking Widget" />

      <h1 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "#111827" }}>Booking Widget</h1>

      {isWide ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>
          {leftColumn}
          <div style={{ position: "sticky", top: 24, background: "#F8F9FA", borderRadius: 14, border: "1px solid #e9ecef", padding: "20px" }}>
            {rightColumn}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#F8F9FA", borderRadius: 14, border: "1px solid #e9ecef", padding: "18px" }}>
            {rightColumn}
          </div>
          {leftColumn}
        </div>
      )}

      {/* Sticky Save button — bottom-left with margin so it doesn't cover content */}
      <div
        style={{
          position: "sticky",
          bottom: 24,
          left: 24,
          marginTop: 24,
          display: "inline-block",
          zIndex: 10,
        }}
      >
        <Button
          type="primary"
          size="middle"
          onClick={handleSave}
          loading={saving}
          style={{ background: ACCENT, borderColor: ACCENT, fontWeight: 600, minWidth: 140 }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
