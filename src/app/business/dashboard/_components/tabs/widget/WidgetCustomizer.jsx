"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, Select, Button, ColorPicker, Tooltip, message as antMessage, Collapse, Tabs, Alert } from "antd";
import { Copy, Loader2, Check, Plus, Trash2, Pencil, Code, Layout, Settings } from "lucide-react";
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
function ColorRow({ label, value, onChange, tooltip, emptyFallback = "#000000" }) {
  const debounced = useDebounce(onChange, 120);
  const hex = normalizeHex(value) || normalizeHex(emptyFallback) || emptyFallback;
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

const BORDER_RADIUS_OPTIONS =[
  { id: "none", label: "Sharp" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Rounded" },
];

const RADIUS_PX = { none: 0, small: 4, medium: 8, large: 12 };

/** Map stored config to a corner preset (legacy button_radius_px supported). */
function effectiveMembershipButtonRadiusPreset(cfg) {
  const c = cfg || {};
  if (c.button_radius_preset && RADIUS_PX[c.button_radius_preset] !== undefined) {
    return c.button_radius_preset;
  }
  const px = c.button_radius_px;
  if (px == null || px === "") return "medium";
  const n = Number(px);
  if (!Number.isFinite(n) || n <= 0) return "none";
  if (n <= 4) return "small";
  if (n <= 8) return "medium";
  return "large";
}

const COLOR_PRESETS =[
  { id: "classic", label: "Classic", primary: "#2563EB", textOnPrimary: "#ffffff", background: "#EFF6FF", cardBackground: "#FFFFFF", textPrimary: "#1E293B", textSecondary: "#64748B", border: "#E2E8F0" },
  { id: "sunset", label: "Sunset", primary: "#EA580C", textOnPrimary: "#ffffff", background: "#FEF3C7", cardBackground: "#FFFFFF", textPrimary: "#431407", textSecondary: "#B45309", border: "#FED7AA" },
  { id: "retro", label: "Retro", primary: "#D97706", textOnPrimary: "#1C1917", background: "#FDF6E3", cardBackground: "#FFFBEB", textPrimary: "#292524", textSecondary: "#92400E", border: "#D97706" },
  { id: "minimal", label: "Minimal", primary: "#3F3F46", textOnPrimary: "#FAFAFA", background: "#F4F4F5", cardBackground: "#FFFFFF", textPrimary: "#18181B", textSecondary: "#71717A", border: "#E4E4E7" },
  { id: "ocean", label: "Ocean", primary: "#0D9488", textOnPrimary: "#ffffff", background: "#CCFBF1", cardBackground: "#FFFFFF", textPrimary: "#134E4A", textSecondary: "#0F766E", border: "#99F6E4" },
  { id: "rose", label: "Rose", primary: "#E11D48", textOnPrimary: "#ffffff", background: "#FFF1F2", cardBackground: "#FFFFFF", textPrimary: "#4C0519", textSecondary: "#BE123C", border: "#FECDD3" },
];

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

function buildMembershipButtonHtml(product) {
  const cfg = product.widget_button_config || {};
  const classArg =
    cfg.open_class_id != null && cfg.open_class_id !== ""
      ? `, '${String(cfg.open_class_id)}'`
      : "";
  const rawLabel =
    (cfg.button_label && String(cfg.button_label).trim()) || `Join ${product.name || "plan"}`;
  const label = escapeSubscriptionLabel(rawLabel);
  const styles = [];
  styles.push(
    "display:flex;align-items:center;justify-content:center;width:100%;height:100%;box-sizing:border-box;cursor:pointer;border:none;font:inherit"
  );
  if (cfg.button_background) styles.push(`background:${cfg.button_background}`);
  if (cfg.button_text_color) styles.push(`color:${cfg.button_text_color}`);
  let radiusPx = null;
  if (cfg.button_radius_preset && RADIUS_PX[cfg.button_radius_preset] !== undefined) {
    radiusPx = RADIUS_PX[cfg.button_radius_preset];
  } else if (cfg.button_radius_px != null && cfg.button_radius_px !== "") {
    const n = Number(cfg.button_radius_px);
    if (Number.isFinite(n)) radiusPx = n;
  }
  if (radiusPx != null && radiusPx > 0) styles.push(`border-radius:${radiusPx}px`);
  const styleAttr = styles.length ? ` style="${styles.join(";")}"` : "";
  return `<button type="button"${styleAttr} onclick="openClasseasilyMembership('${product.id}'${classArg})">${label}</button>`;
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
const snippetContainerStyle = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};
const snippetPreStyle = {
  background: "#111827",
  color: "#f3f4f6",
  padding: "12px 16px",
  borderRadius: 8,
  fontSize: 12,
  lineHeight: 1.5,
  overflowX: "auto",
  fontFamily: "monospace",
  margin: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "block",
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
  /** SideMenu mobile FAB: fixed bottom 24px, height 52px — keep sticky bar above it. */
  const [isMobileLayout, setIsMobileLayout] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
  );

  const [newDomainInput, setNewDomainInput] = useState("");
  
  const [membershipProducts, setMembershipProducts] = useState([]);
  const[membershipProductsLoading, setMembershipProductsLoading] = useState(true);
  const[copiedSubscriptionId, setCopiedSubscriptionId] = useState(null);
  const embedSaveTimersRef = useRef({});
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
    const onResize = () => setIsMobileLayout(window.innerWidth <= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  const scheduleSaveWidgetButtonConfig = useCallback((productId, config) => {
    if (embedSaveTimersRef.current[productId]) clearTimeout(embedSaveTimersRef.current[productId]);
    embedSaveTimersRef.current[productId] = setTimeout(async () => {
      const res = await businessMembershipService.updateProduct(productId, { widget_button_config: config });
      if (!res.success) antMessage.error(res.error || "Could not save button options");
      else if (res.data?.widget_button_config) {
        setMembershipProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, widget_button_config: res.data.widget_button_config } : p))
        );
      }
    }, 450);
  }, []);

  const patchProductEmbedConfig = useCallback(
    (product, patch) => {
      const base = { ...(product.widget_button_config || {}) };
      const next = { ...base, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, "button_radius_preset")) {
        delete next.button_radius_px;
      }
      Object.keys(next).forEach((k) => {
        if (next[k] === "" || next[k] === undefined || next[k] === null) delete next[k];
      });
      setMembershipProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, widget_button_config: next } : p)));
      scheduleSaveWidgetButtonConfig(product.id, next);
    },
    [scheduleSaveWidgetButtonConfig]
  );

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      
      {allowedDomainsArray.length === 0 && (
        <Alert type="error" showIcon message={<span style={{ fontSize: 12 }}>Wait! You haven't added your website domain in the 'Settings' tab. The code below will not work until you do.</span>} />
      )}

      <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        <SectionTitle
          title="Embed code"
          subtitle={
            form.view === "modal"
              ? "Copy this code into your site. It loads the booking widget and adds a Book Now button that opens it."
              : "Copy this code and paste it where you want the booking calendar to appear on the page."
          }
        />
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
          <div style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <SectionTitle
              title="Membership signup buttons"
              subtitle="Let customers join a plan from your website."
            />
            <div
              style={{
                fontSize: 13,
                color: "#4b5563",
                lineHeight: 1.55,
                marginBottom: 16,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <p style={{ margin: "0 0 10px" }}>For each plan, set how the button looks, then copy the code and paste it into your site—wherever you want that subscribe button to appear (for example next to your Book button).</p>
              <Collapse
                ghost
                size="small"
                style={{ marginBottom: 10 }}
                items={[
                  {
                    key: "membership-dev-note",
                    label: (
                      <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>For developers</span>
                    ),
                    children: (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#92400e",
                          background: "#fffbeb",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #fcd34d",
                          lineHeight: 1.45,
                        }}
                      >
                        <strong>React / Next.js:</strong> This snippet is plain HTML for Wix, Squarespace, WordPress custom HTML, and similar. In React/JSX, paste the idea—not this markup: call{" "}
                        <code style={{ fontSize: 11, background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>window.openClasseasilyMembership</code> from an{" "}
                        <code style={{ fontSize: 11, background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>onClick</code> function and pass a{" "}
                        <code style={{ fontSize: 11, background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>style</code> object, not HTML{" "}
                        <code style={{ fontSize: 11, background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>onclick</code> or{" "}
                        <code style={{ fontSize: 11, background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>style=&quot;…&quot;</code>.
                      </p>
                    ),
                  },
                ]}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", minWidth: 0 }}>
              {membershipProducts.map((product) => {
                const cfg = product.widget_button_config || {};
                const snippet = buildMembershipButtonHtml(product);
                const copyId = `plan-${product.id}`;
                const isCopied = copiedSubscriptionId === copyId;
                const classOptions = [
                  { value: "", label: "No specific class" },
                  ...(data?.classes || []).map((c) => ({ value: String(c.classId), label: c.title })),
                ];
                const radiusActive = effectiveMembershipButtonRadiusPreset(cfg);

                return (
                  <div
                    key={product.id}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      minWidth: 0,
                      boxSizing: "border-box",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Button Configuration</div>

                    <div style={{ marginBottom: 12, width: "100%" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        Button text
                      </label>
                      <Input
                        size="small"
                        placeholder={`e.g. Join ${product.name}`}
                        value={cfg.button_label || ""}
                        onChange={(e) => patchProductEmbedConfig(product, { button_label: e.target.value || null })}
                        style={{ width: "100%", maxWidth: "100%" }}
                      />
                    </div>

                    <div style={{ marginBottom: 14, width: "100%" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        Class shown on signup (optional)
                      </label>
                      <Select
                        size="small"
                        value={cfg.open_class_id != null && cfg.open_class_id !== "" ? String(cfg.open_class_id) : ""}
                        onChange={(v) =>
                          patchProductEmbedConfig(product, {
                            open_class_id: v && String(v).trim() !== "" ? Number(v) : null,
                          })
                        }
                        options={classOptions}
                        style={{ width: "100%", maxWidth: "100%" }}
                      />
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280", lineHeight: 1.45 }}>
                        If you pick a class, that name appears on the signup screen so people know what the plan applies to.
                      </p>
                    </div>

                    <div style={{ marginBottom: 12, width: "100%" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Corner shape</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
                        {BORDER_RADIUS_OPTIONS.map((opt) => {
                          const active = radiusActive === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                patchProductEmbedConfig(product, {
                                  button_radius_preset: opt.id,
                                  button_radius_px: null,
                                })
                              }
                              style={{
                                flex: "1 1 72px",
                                minWidth: 72,
                                padding: "8px 10px",
                                border: `${active ? 2 : 1}px solid ${active ? SEL_COLOR : "#e5e7eb"}`,
                                borderRadius: 6,
                                background: active ? "#fafafa" : "#ffffff",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: active ? 600 : 500,
                                color: active ? SEL_COLOR : "#374151",
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f9fafb",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #f3f4f6",
                        marginBottom: 14,
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8, letterSpacing: "0.03em" }}>
                        BUTTON COLORS
                      </div>
                      <ColorRow
                        label="Fill"
                        value={cfg.button_background || ""}
                        emptyFallback={form.primary}
                        onChange={(hex) =>
                          patchProductEmbedConfig(product, { button_background: normalizeHex(hex) || null })
                        }
                      />
                      <ColorRow
                        label="Text"
                        value={cfg.button_text_color || ""}
                        emptyFallback={form.textOnPrimary}
                        onChange={(hex) =>
                          patchProductEmbedConfig(product, { button_text_color: normalizeHex(hex) || null })
                        }
                      />
                    </div>

                    <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#374151" }}>Code for your website</div>
                    <div style={snippetContainerStyle}>
                      <pre style={snippetPreStyle}>{snippet}</pre>
                      <Button
                        size="small"
                        icon={isCopied ? <Check size={12} /> : <Copy size={12} />}
                        onClick={() => handleCopySubscription(snippet, copyId)}
                        style={getCopyBtnStyle(isCopied)}
                      >
                        {isCopied ? "Copied" : "Copy code"}
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

  /* Mobile menu FAB: bottom 24px, height 52px — bar clears it + gap; safe-area once here (FAB does not add it). */
  const mobileStickyBottom = "calc(24px + 52px + 14px + env(safe-area-inset-bottom, 0px))";
  const pageBottomPad = isMobileLayout
    ? `max(112px, calc(96px + env(safe-area-inset-bottom, 0px)))`
    : "max(96px, calc(72px + env(safe-area-inset-bottom, 0px)))";

  return (
    <div
      style={{
        padding: `16px 24px ${pageBottomPad}`,
        maxWidth: 1200,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <DashboardBreadcrumb title="Booking Widget" />
        <h1 style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 800, color: "#111827" }}>Customize Your Widget</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>Design your booking experience and get the code to install it.</p>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "16px 20px",
          boxShadow: "0 2px 4px -1px rgba(0,0,0,0.05)",
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Tabs defaultActiveKey="design" items={tabItems} size="small" tabBarGutter={16} />
      </div>

      <div
        style={{
          position: "sticky",
          bottom: isMobileLayout ? mobileStickyBottom : 16,
          zIndex: 6,
          marginTop: 24,
          marginLeft: "max(0px, env(safe-area-inset-left, 0px))",
          marginRight: "max(0px, env(safe-area-inset-right, 0px))",
          padding: 0,
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            borderRadius: 18,
            padding: "12px 16px",
            paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
            paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
            paddingBottom: 12,
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 12px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            style={{ background: ACCENT, borderColor: ACCENT, fontWeight: 600, padding: "0 20px", minHeight: 40 }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}