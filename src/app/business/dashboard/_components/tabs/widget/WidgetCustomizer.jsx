"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, Select, Button, ColorPicker, Tooltip, message as antMessage, Collapse, Tabs, Alert } from "antd";
import { Copy, Loader2, Check, X, Plus, Trash2, Pencil, Code, Layout, Settings } from "lucide-react";
import { businessService, businessMembershipService } from "@/services/apiService";
import message from "@/lib/message";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";

// ─── Theme constants ──────────────────────────────────────────────────────────
const ACCENT      = "#ff385b";  // big CTAs
const SEL_COLOR   = "#111827";  // active selection borders / small buttons

/** Normalize to #rrggbb for ColorPicker and API. */
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
      padding: "7px 0", borderBottom: "1px solid #f3f4f6",
    }}>
      <Tooltip title={tooltip} placement="left" mouseEnterDelay={0.4}>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, cursor: tooltip ? "help" : "default", borderBottom: tooltip ? "1px dashed #d1d5db" : "none" }}>
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
      position: "absolute", top: -6, right: -6,
      width: 16, height: 16, borderRadius: "50%",
      background: SEL_COLOR, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
    }}>
      <Check size={9} strokeWidth={3} />
    </div>
  );
}

// ─── View type cards with SVG illustrations ───────────────────────────────────
function ModalIllustration({ active }) {
  const line = active ? `${SEL_COLOR}30` : "#edf0f2";
  const border = active ? SEL_COLOR : "#d1d5db";
  return (
    <svg width="44" height="32" viewBox="0 0 52 38" fill="none">
      <rect width="52" height="38" rx="4" fill={active ? "#f3f4f6" : "#f9fafb"} />
      <rect x="0" y="0" width="52" height="7" rx="2" fill={active ? "#e5e7eb" : "#eef0f2"} />
      <circle cx="5" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <circle cx="10" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <rect x="4" y="11" width="28" height="3" rx="1" fill={line} />
      <rect x="4" y="16" width="20" height="2" rx="1" fill={line} />
      <rect x="0" y="7" width="52" height="31" rx="0" fill="rgba(0,0,0,0.35)" />
      <rect x="10" y="10" width="32" height="25" rx="3" fill="white" />
      <rect x="10" y="10" width="32" height="8" rx="3" fill="#f9fafb" />
      <rect x="10" y="14" width="32" height="4" fill="#f9fafb" />
      <rect x="14" y="12.5" width="18" height="3" rx="1" fill="#d1d5db" />
      <circle cx="38" cy="14" r="2.5" fill="#e5e7eb" />
      <rect x="13" y="22" width="20" height="2" rx="1" fill="#e5e7eb" />
      <rect x="13" y="26" width="14" height="2" rx="1" fill="#edf0f2" />
      <rect x="13" y="30" width="20" height="3.5" rx="1.5" fill={border} />
    </svg>
  );
}

function InlineIllustration({ active }) {
  const line = active ? `${SEL_COLOR}25` : "#edf0f2";
  const accent = active ? SEL_COLOR : "#d1d5db";
  return (
    <svg width="44" height="32" viewBox="0 0 52 38" fill="none">
      <rect width="52" height="38" rx="4" fill={active ? "#f3f4f6" : "#f9fafb"} />
      <rect x="0" y="0" width="52" height="7" rx="2" fill={active ? "#e5e7eb" : "#eef0f2"} />
      <circle cx="5" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <circle cx="10" cy="3.5" r="1.5" fill={active ? "#d1d5db" : "#e5e7eb"} />
      <rect x="4" y="11" width="22" height="2.5" rx="1" fill={line} />
      <rect x="4" y="16" width="44" height="19" rx="3" fill="white" stroke={accent} strokeWidth="0.8" />
      {[0,1,2,3,4,5,6].map(i => <rect key={i} x={6 + i*6} y="19" width="4" height="3.5" rx="0.8" fill={i===3 ? accent : "#f0f0f0"} />)}
      {[0,1,2,3,4,5,6].map(i => <rect key={i} x={6 + i*6} y="24" width="4" height="3.5" rx="0.8" fill="#f0f0f0" />)}
      <rect x="6" y="30" width="28" height="3" rx="1" fill="#f3f4f6" />
      <rect x="36" y="30" width="10" height="3" rx="1.5" fill={accent} />
    </svg>
  );
}

const PopupIllustration = ModalIllustration;

const VIEW_OPTIONS =[
  { id: "inline", label: "Inline (Embedded)",  Illustration: InlineIllustration },
  { id: "modal",  label: "Popup (Button)",   Illustration: PopupIllustration },
];

function ViewTypeCard({ id, current, onChange, label, Illustration }) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      style={{
        flex: 1, minWidth: 0, padding: "12px 8px",
        border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
        borderRadius: 8, background: active ? "#fafafa" : "#ffffff",
        cursor: "pointer", textAlign: "center",
        transition: "all 0.15s", position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}
    >
      {active && <ActiveBadge />}
      <Illustration active={active} />
      <div style={{ fontSize: 11, fontWeight: 600, color: active ? SEL_COLOR : "#6b7280" }}>{label}</div>
    </button>
  );
}

// ─── Widget mockup UI ───────────────────────────
function InlineWidgetMock({ primary, textOnPrimary, background, cardBackground, textPrimary, textSecondary, border, radiusPx = 8 }) {
  const bc = primary || SEL_COLOR; const btc = textOnPrimary || "#ffffff";
  const bg = background || "#f9fafb"; const cardBg = cardBackground || "#ffffff";
  const tp = textPrimary || "#111827"; const ts = textSecondary || "#6b7280";
  const bdr = border || "#e5e7eb"; const r = radiusPx;
  const DAYS = [[null, null, null, null, null, { n: 1 }, { n: 2, dot: true }],[{ n: 3, dot: true }, { n: 4 }, { n: 5, sel: true }, { n: 6, dot: true }, { n: 7 }, { n: 8, dot: true }, { n: 9 }],[{ n: 10, dot: true }, { n: 11 }, { n: 12 }, { n: 13, dot: true }, { n: 14 }, { n: 15, dot: true }, { n: 16 }],[{ n: 17 }, { n: 18, dot: true }, { n: 19, dot: true }, { n: 20 }, { n: 21, dot: true }, { n: 22 }, { n: 23 }],[{ n: 24, dot: true }, { n: 25 }, { n: 26 }, { n: 27, dot: true }, { n: 28 }, null, null]];

  return (
      <div style={{ background: cardBg, borderRadius: r, border: `1px solid ${bdr}`, padding: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: Math.max(2, r - 6), background: bg, border: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, color: ts }}>‹</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: tp }}>February 2026</span>
          <div style={{ width: 16, height: 16, borderRadius: Math.max(2, r - 6), background: bg, border: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, color: ts }}>›</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 7, fontWeight: 600, color: ts }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 10 }}>
          {DAYS.flat().map((cell, i) => {
            if (!cell) return <div key={i} style={{ aspectRatio: "1" }} />;
            return (
              <div key={i} style={{
                aspectRatio: "1", borderRadius: Math.max(2, r - 6),
                display: "flex", alignItems: "center", justifyContent: "center",
                background: cell.sel ? bc : "transparent", position: "relative",
              }}>
                <span style={{ fontSize: 9, fontWeight: cell.sel ? 700 : 400, color: cell.sel ? btc : cell.dot ? tp : ts }}>
                  {cell.n}
                </span>
                {cell.dot && !cell.sel && (
                  <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 2.5, height: 2.5, borderRadius: "50%", background: bc }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 8, fontWeight: 700, color: tp, marginBottom: 6 }}>Select a time — Wed, Feb 5</div>
        <div style={{ border: `1px solid ${bdr}`, borderRadius: r, overflow: "hidden" }}>
          {[{ time: "10:00 AM", dur: "60 min", price: "$45" }, { time: "2:00 PM", dur: "60 min", price: "$45" }].map((slot, i) => (
            <div key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${bdr}`, padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", background: cardBg }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: tp }}>{slot.time}</div>
                <div style={{ fontSize: 7.5, color: ts }}>{slot.dur} · {slot.price}</div>
              </div>
              <div style={{ background: bc, color: btc, borderRadius: Math.max(2, r - 4), padding: "3px 8px", fontSize: 8, fontWeight: 700 }}>Book</div>
            </div>
          ))}
        </div>
      </div>
  );
}

const BORDER_RADIUS_OPTIONS =[
  { id: "none", label: "Sharp" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Rounded" },
];

const RADIUS_PX = { none: 0, small: 4, medium: 8, large: 12 };

const COLOR_PRESETS =[
  { id: "classic", label: "Classic", primary: "#2563EB", textOnPrimary: "#ffffff", background: "#EFF6FF", cardBackground: "#FFFFFF", textPrimary: "#1E293B", textSecondary: "#64748B", border: "#E2E8F0" },
  { id: "sunset", label: "Sunset", primary: "#EA580C", textOnPrimary: "#ffffff", background: "#FEF3C7", cardBackground: "#FFFFFF", textPrimary: "#431407", textSecondary: "#B45309", border: "#FED7AA" },
  { id: "retro", label: "Retro", primary: "#D97706", textOnPrimary: "#1C1917", background: "#FDF6E3", cardBackground: "#FFFBEB", textPrimary: "#292524", textSecondary: "#92400E", border: "#D97706" },
  { id: "minimal", label: "Minimal", primary: "#3F3F46", textOnPrimary: "#FAFAFA", background: "#F4F4F5", cardBackground: "#FFFFFF", textPrimary: "#18181B", textSecondary: "#71717A", border: "#E4E4E7" },
  { id: "ocean", label: "Ocean", primary: "#0D9488", textOnPrimary: "#ffffff", background: "#CCFBF1", cardBackground: "#FFFFFF", textPrimary: "#134E4A", textSecondary: "#0F766E", border: "#99F6E4" },
  { id: "rose", label: "Rose", primary: "#E11D48", textOnPrimary: "#ffffff", background: "#FFF1F2", cardBackground: "#FFFFFF", textPrimary: "#4C0519", textSecondary: "#BE123C", border: "#FECDD3" },
];

// ─── Browser mockup shell ─────────────────────────────
function BrowserMockup({ view, borderRadiusPreset, background, cardBackground, textPrimary, textSecondary, border, primary, textOnPrimary }) {
  const bc = primary || SEL_COLOR; const btc = textOnPrimary || "#ffffff";
  const bg = background || "#f9fafb"; const cardBg = cardBackground || "#ffffff";
  const tp = textPrimary || "#111827"; const ts = textSecondary || "#6b7280";
  const bdr = border || "#e5e7eb"; const r = RADIUS_PX[borderRadiusPreset] ?? 8;

  const PageLines = () => (
    <div style={{ padding: "12px" }}>
      <div style={{ height: 8, background: bdr, borderRadius: 3, width: "62%", marginBottom: 8 }} />
      <div style={{ height: 6, background: bdr, borderRadius: 3, width: "88%", marginBottom: 6, opacity: 0.7 }} />
      <div style={{ height: 6, background: bdr, borderRadius: 3, width: "72%", marginBottom: 6, opacity: 0.5 }} />
    </div>
  );

  const themeProps = { primary: bc, textOnPrimary: btc, background: bg, cardBackground: cardBg, textPrimary: tp, textSecondary: ts, border: bdr, radiusPx: r };

  const innerContent = (() => {
    if (view === "inline") return <InlineWidgetMock {...themeProps} />;

    return (
      <div style={{ position: "relative", minHeight: 180, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
        <PageLines />
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ display: "inline-block", background: bc, color: btc, borderRadius: r, fontSize: 9, fontWeight: 700, padding: "5px 12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            Book now
          </div>
          <div style={{ marginTop: 5, fontSize: 8, color: ts }}>← Imagine your button here</div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}>
          <div style={{
            position: "absolute", top: "10%", left: "8%", right: "8%",
            background: cardBg, borderRadius: r,
            boxShadow: "0 8px 24px rgba(0,0,0,0.22)", overflow: "hidden", border: `1px solid ${bdr}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${bdr}`, gap: 6, background: bg }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1px solid ${bdr}`, background: cardBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: ts }}>‹</span>
              </div>
              <span style={{ flex: 1, textAlign: "center", fontSize: 9, fontWeight: 700, color: tp }}>Select date & time</span>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: bg, border: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={8} color={ts} />
              </div>
            </div>
            <div style={{ padding: "10px", background: cardBg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 8, color: ts }}>‹</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: tp }}>February 2026</span>
                <span style={{ fontSize: 8, color: ts }}>›</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {Array.from({ length: 14 }, (_, i) => {
                  const n = i + 1;
                  const isSelected = n === 5;
                  return (
                    <div key={i} style={{ aspectRatio: "1", borderRadius: Math.max(1, r - 4), display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? bc : "transparent" }}>
                      <span style={{ fontSize: 9, color: isSelected ? btc : tp, fontWeight: isSelected ? 700 : 400 }}>{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return <div>{innerContent}</div>;
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function escapeSubscriptionLabel(s) {
  if (s == null || typeof s !== "string") return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const DEFAULT_FORM = {
  view: "modal",
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
  specificClassId: "",
  allowed_widget_origins: "",
};

// ─── Code Snippet Styling ─────────────────────────────────────────────────────
const snippetContainerStyle = { position: "relative" };
const snippetPreStyle = {
  background: "#111827", color: "#f3f4f6", padding: "12px 16px", borderRadius: 8,
  fontSize: 12, lineHeight: 1.5, overflowX: "auto", fontFamily: "monospace", margin: 0
};
const getCopyBtnStyle = (isCopied) => ({
  position: "absolute", top: 8, right: 8,
  background: isCopied ? "#16a34a" : "#374151", color: "#fff", border: "none", fontSize: 12
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function WidgetCustomizer() {
  const[loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [copied, setCopied]     = useState(false);
  const[data, setData]         = useState(null);
  const [form, setForm]         = useState(DEFAULT_FORM);
  const[isWide, setIsWide]     = useState(typeof window !== "undefined" ? window.innerWidth >= 960 : true);
  
  const [newDomainInput, setNewDomainInput] = useState("");
  
  const [membershipProducts, setMembershipProducts] = useState([]);
  const[membershipProductsLoading, setMembershipProductsLoading] = useState(true);
  const[copiedSubscriptionId, setCopiedSubscriptionId] = useState(null);
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
      allowed_widget_origins:[f.allowed_widget_origins.trim(), domain].filter(Boolean).join("\n"),
    }));
    setNewDomainInput("");
  };

  const removeDomain = (index) => {
    const next = allowedDomainsArray.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, allowed_widget_origins: next.join("\n") }));
  };

  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 960);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  },[]);

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
            view: c.view ?? prev.view,
            primary: norm(c.primary, prev.primary),
            background: norm(c.background, prev.background),
            cardBackground: norm(c.cardBackground, prev.cardBackground),
            textPrimary: norm(c.textPrimary, prev.textPrimary),
            textSecondary: norm(c.textSecondary, prev.textSecondary),
            textOnPrimary: norm(c.textOnPrimary, prev.textOnPrimary),
            border: norm(c.border, prev.border),
            borderRadiusPreset: c.borderRadiusPreset ?? prev.borderRadiusPreset,
            specificClassId: c.specificClassId != null ? String(c.specificClassId) : "",
            allowed_widget_origins: typeof c.allowed_widget_origins === "string" ? c.allowed_widget_origins : "",
          }));
          
          const activePlans = (list) => (Array.isArray(list) ? list :[]).filter((p) => p.is_active !== false);
          if (res.data.membership_products && Array.isArray(res.data.membership_products)) {
            setMembershipProducts(activePlans(res.data.membership_products));
            setMembershipProductsLoading(false);
          } else {
            businessMembershipService.getProducts().then((res2) => {
              setMembershipProducts(res2.success && Array.isArray(res2.data) ? activePlans(res2.data) :[]);
            }).finally(() => setMembershipProductsLoading(false));
          }
        }
      })
      .catch(() => antMessage.error("Failed to load widget settings"))
      .finally(() => setLoading(false));
  },[]);

  const handleSave = () => {
    setSaving(true);
    const hex = (v) => (normalizeHex(v) || v);
    const payload = {
      view: form.view,
      primary: hex(form.primary), background: hex(form.background), cardBackground: hex(form.cardBackground),
      textPrimary: hex(form.textPrimary), textSecondary: hex(form.textSecondary), textOnPrimary: hex(form.textOnPrimary),
      border: hex(form.border),
      borderRadiusPreset: form.borderRadiusPreset,
      specificClassId: (form.specificClassId && String(form.specificClassId).trim()) || null,
      allowed_widget_origins: form.allowed_widget_origins,
    };
    
    businessService.updateWidgetConfig(payload)
      .then((res) => {
        if (res.success) {
          message.success("Widget settings saved successfully!");
          setData((d) => (d ? { ...d, config: { ...d.config, ...payload } } : null));
        } else {
          antMessage.error(res.error || "Failed to save");
        }
      })
      .catch(() => antMessage.error("Failed to save"))
      .finally(() => setSaving(false));
  };

  const apiKey        = data?.widget_api_key || "";
  const widgetScriptUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL || "" : "";
  
  const embedSnippet = `<!-- Class Easily Booking Widget -->
<link rel="stylesheet" href="${widgetScriptUrl.replace(/\.js$/, ".css")}" />
<div id="classeasily-booking-widget" data-widget-api-key="${apiKey}"></div>
<script src="${widgetScriptUrl}"><\/script>`;

  const loaderUrl = widgetScriptUrl.replace(/\/widget\.js$/i, "/loader.js");
  const popupSnippet = `<!-- Add this script once on your page -->
<script src="${loaderUrl}" data-api-key="${apiKey}"><\/script>

<!-- Add a button anywhere to open the widget -->
<button onclick="openClasseasilyBooking()">Book Now</button>`;

  const activeSnippet = form.view === "modal" ? popupSnippet : embedSnippet;

  const handleCopy = () => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(activeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleCopySubscription = (text, id) => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(text);
      setCopiedSubscriptionId(id);
      setTimeout(() => setCopiedSubscriptionId(null), 2200);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
        <span style={{ color: "#6b7280", fontSize: 13 }}>Loading widget settings…</span>
      </div>
    );
  }

  // ─── TABS CONTENT ──────────────────────────────────────────────────────────

  const designTab = (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <SectionTitle title="1. Choose a layout" subtitle="How do you want the booking experience to appear on your site? Widget setup differs between the two options." />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {VIEW_OPTIONS.map((opt) => (
            <ViewTypeCard key={opt.id} id={opt.id} current={form.view} onChange={set("view")} label={opt.label} Illustration={opt.Illustration} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="2. Pick a theme" subtitle="Match the widget to your brand's look and feel." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setForm((f) => ({
                ...f,
                primary: preset.primary, textOnPrimary: preset.textOnPrimary,
                background: preset.background, cardBackground: preset.cardBackground,
                textPrimary: preset.textPrimary, textSecondary: preset.textSecondary, border: preset.border,
              }))}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff",
                cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#374151",
                transition: "all 0.2s"
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 4, background: preset.primary }} />
              {preset.label}
            </button>
          ))}
        </div>
        
        <Collapse
          ghost
          size="small"
          items={[{
            key: "advanced-colors",
            label: <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>Custom advanced colors</span>,
            children: (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", background: "#f9fafb", padding: "10px 14px", borderRadius: 6, border: "1px solid #f3f4f6" }}>
                <div>
                  <ColorRow label="Primary Accent" value={form.primary} onChange={set("primary")} />
                  <ColorRow label="Main Background" value={form.background} onChange={set("background")} />
                  <ColorRow label="Card Surface" value={form.cardBackground} onChange={set("cardBackground")} />
                </div>
                <div>
                  <ColorRow label="Primary Text" value={form.textPrimary} onChange={set("textPrimary")} />
                  <ColorRow label="Muted Text" value={form.textSecondary} onChange={set("textSecondary")} />
                  <ColorRow label="Borders" value={form.border} onChange={set("border")} />
                </div>
              </div>
            )
          }]}
        />
      </div>

      <div>
        <SectionTitle title="3. Corner style" subtitle="Adjust how rounded the widget edges are." />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BORDER_RADIUS_OPTIONS.map((opt) => {
            const active = form.borderRadiusPreset === opt.id;
            return (
              <button
                key={opt.id} type="button" onClick={() => set("borderRadiusPreset")(opt.id)}
                style={{
                  flex: 1, minWidth: 60, padding: "8px 10px",
                  border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
                  borderRadius: 6, background: active ? "#fafafa" : "#ffffff",
                  cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 500, color: active ? SEL_COLOR : "#374151"
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const settingsTab = (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      <div>
        <SectionTitle title="Allowed Website Domains" subtitle="For security, list the websites where you plan to install this widget. Without this, the widget will not load." />
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <Input
            value={newDomainInput} onChange={(e) => setNewDomainInput(e.target.value)} onPressEnter={addDomain}
            placeholder="e.g. www.mywebsite.com" size="small" style={{ flex: 1 }}
          />
          <Button type="primary" size="small" onClick={addDomain} style={{ background: SEL_COLOR }}>Add Domain</Button>
        </div>
        
        {allowedDomainsArray.length > 0 ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
            {allowedDomainsArray.map((domain, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff", borderBottom: index < allowedDomainsArray.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{domain}</span>
                <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => removeDomain(index)} />
              </div>
            ))}
          </div>
        ) : (
          <Alert type="warning" showIcon message={<span style={{ fontSize: 12 }}>No domains added yet. Your widget won't work on your website until you add your domain here.</span>} />
        )}
      </div>

      <div style={{ height: 1, background: "#f3f4f6" }} />

      <div>
        <SectionTitle title="Specific Starting Page" subtitle="Instead of showing all your classes, skip directly to a specific class when the widget loads." />
        {(() => {
          const planId = (data?.widget_subscription?.planId || "").toLowerCase();
          const canPinToClass =["growth", "advanced"].includes(planId);
          const classes = data?.classes ||[];
          const select = (
            <Select
              value={form.specificClassId || ""} onChange={set("specificClassId")}
              size="small" style={{ width: "100%", maxWidth: 350 }} disabled={!canPinToClass}
              options={[{ value: "", label: "Show all classes (Default)" }, ...classes.map((c) => ({ value: String(c.classId), label: c.title }))]}
            />
          );
          return canPinToClass ? select : (
            <Tooltip title="Upgrade to Growth or Advanced to pin the widget to a specific class.">
              <div style={{ display: "inline-block", width: "100%" }}>{select}</div>
            </Tooltip>
          );
        })()}
      </div>

    </div>
  );

  const installTab = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      
      {allowedDomainsArray.length === 0 && (
        <Alert type="error" showIcon message={<span style={{ fontSize: 12 }}>Wait! You haven't added your website domain in the 'Settings' tab. The code below will not work until you do.</span>} />
      )}

      <div>
        <SectionTitle title="Embed Code" subtitle={form.view === "modal" ? "Copy and paste this code anywhere on your website. It adds the required script and a basic Book Now button to trigger the popup." : "Copy and paste this code onto your website where you want the booking form to appear."} />
        <div style={snippetContainerStyle}>
          <pre style={snippetPreStyle}>
            {activeSnippet}
          </pre>
          <Button size="small" icon={copied ? <Check size={12} /> : <Copy size={12} />} onClick={handleCopy} style={getCopyBtnStyle(copied)}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div style={{ padding: "12px", background: "#f3f6f8", borderRadius: 8 }}>
        <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>Need help installing?</h4>
        <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.4 }}>
          Not sure where to paste this or how to add buttons? Check out our <a href="/business/help?category=widget-installation" target="_blank" rel="noreferrer" style={{ color: SEL_COLOR, fontWeight: 600, textDecoration: "underline" }}>setup guides</a> for Squarespace, Wix, WordPress, and more.
        </p>
      </div>

      {membershipProducts.length > 0 && (
        <>
          <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0" }} />
          <div>
            <SectionTitle title="Sell Memberships" subtitle="Want to sell subscriptions directly from your site? Use these specific buttons." />
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {membershipProducts.map((product) => {
                const label = escapeSubscriptionLabel(product.name);
                const snippet = `<button onclick="openClasseasilyMembership('${product.id}')">Join ${label}</button>`;
                const copyId = `plan-${product.id}`;
                const isCopied = copiedSubscriptionId === copyId;
                
                return (
                  <div key={product.id} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 6 }}>{product.name}</div>
                    <div style={snippetContainerStyle}>
                      <pre style={snippetPreStyle}>
                        {snippet}
                      </pre>
                      <Button size="small" icon={isCopied ? <Check size={12} /> : <Copy size={12} />} onClick={() => handleCopySubscription(snippet, copyId)} style={getCopyBtnStyle(isCopied)}>
                        {isCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );

  const tabItems =[
    { key: "design", label: <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><Layout size={14} /> Design</span>, children: designTab },
    { key: "settings", label: <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><Settings size={14} /> Settings</span>, children: settingsTab },
    { key: "install", label: <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><Code size={14} /> Add to Website</span>, children: installTab },
  ];

  return (
    <div style={{ padding: "16px 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <DashboardBreadcrumb title="Booking Widget" />
          <h1 style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 800, color: "#111827" }}>Customize Your Widget</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>Design your booking experience and get the code to install it.</p>
        </div>
        <Button type="primary" size="small" onClick={handleSave} loading={saving} style={{ background: ACCENT, borderColor: ACCENT, fontWeight: 600, padding: "0 16px" }}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 320px" : "1fr", gap: 32, alignItems: "start" }}>
        
        {/* LEFT PANE - TABS */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 20px", boxShadow: "0 2px 4px -1px rgba(0,0,0,0.05)" }}>
          <Tabs defaultActiveKey="design" items={tabItems} size="small" tabBarGutter={16} />
        </div>

        {/* RIGHT PANE - LIVE PREVIEW */}
        <div style={{ position: "sticky", top: 16 }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ height: 1, flex: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Preview</span>
            <div style={{ height: 1, flex: 1, background: "#e5e7eb" }} />
          </div>
          
          <div style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", borderRadius: 8 }}>
            <BrowserMockup
              view={form.view}
              borderRadiusPreset={form.borderRadiusPreset}
              background={form.background} cardBackground={form.cardBackground}
              textPrimary={form.textPrimary} textSecondary={form.textSecondary}
              border={form.border} primary={form.primary} textOnPrimary={form.textOnPrimary}
            />
          </div>
        </div>

      </div>
    </div>
  );
}