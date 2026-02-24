"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button, Typography, Input, Select, Tooltip,
  message as antMessage,
} from "antd";
import {
  Copy, Palette, Shield, Loader2,
  ExternalLink, LayoutTemplate, Save, Info,
  Monitor, Type, Layers, Check, Code,
  Smartphone, AlignLeft, Square,
} from "lucide-react";
import { businessService } from "@/services/apiService";
import message from "@/lib/message";

const { Title, Text } = Typography;
const { TextArea } = Input;

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

// ─── Color field ──────────────────────────────────────────────────────────────
function ColorField({ label, value, onChange, tooltip }) {
  const [localHex, setLocalHex] = useState(value || "#000000");
  const inputRef = useRef(null);

  useEffect(() => { setLocalHex(value || "#000000"); }, [value]);

  const debounced = useDebounce(onChange, 280);

  const handleHex = (e) => {
    const raw = e.target.value;
    setLocalHex(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) debounced(raw);
  };

  const handleNative = (e) => {
    setLocalHex(e.target.value);
    debounced(e.target.value);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
        {tooltip && (
          <Tooltip title={tooltip} placement="top">
            <Info size={13} style={{ color: "#9ca3af", cursor: "help", flexShrink: 0 }} />
          </Tooltip>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: localHex, border: "2px solid #e5e7eb",
            cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            transition: "box-shadow 0.2s",
          }}
          title="Click to pick a color"
        />
        <input
          ref={inputRef} type="color" value={localHex} onChange={handleNative}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
          tabIndex={-1}
        />
        <Input
          value={localHex} onChange={handleHex} maxLength={7}
          placeholder="#000000"
          style={{ flex: 1, fontFamily: "monospace", fontSize: 13, height: 36 }}
        />
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, icon, description, children }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ color: "#6b7280", display: "flex" }}>{icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</div>
          {description && (
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{description}</div>
          )}
        </div>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ─── View type tile ───────────────────────────────────────────────────────────
function ViewTile({ id, current, onChange, label, description, icon }) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      style={{
        flex: 1, minWidth: 0, padding: "14px 12px", border: `2px solid ${active ? "#111827" : "#e5e7eb"}`,
        borderRadius: 12, background: active ? "#111827" : "#ffffff",
        cursor: "pointer", textAlign: "left", transition: "all 0.18s",
        display: "flex", flexDirection: "column", gap: 6, position: "relative",
      }}
    >
      {active && (
        <span style={{
          position: "absolute", top: 8, right: 8, width: 18, height: 18,
          borderRadius: "50%", background: "#22c55e", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      <span style={{ color: active ? "#ffffff" : "#6b7280", display: "flex" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#ffffff" : "#111827" }}>{label}</div>
        <div style={{ fontSize: 11, color: active ? "#d1d5db" : "#9ca3af", marginTop: 2, lineHeight: 1.4 }}>{description}</div>
      </div>
    </button>
  );
}

// ─── Border radius preset ─────────────────────────────────────────────────────
const RADIUS_OPTIONS = [
  { value: "none",   label: "None",   preview: 0 },
  { value: "small",  label: "Small",  preview: 4 },
  { value: "medium", label: "Medium", preview: 8 },
  { value: "large",  label: "Large",  preview: 16 },
];

function RadiusPreset({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {RADIUS_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value} type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: "10px 0", border: `2px solid ${active ? "#111827" : "#e5e7eb"}`,
              borderRadius: 10, background: active ? "#111827" : "#ffffff",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6, transition: "all 0.18s",
            }}
          >
            <div style={{
              width: 24, height: 24, background: active ? "#ffffff" : "#6b7280",
              borderRadius: opt.preview, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#ffffff" : "#6b7280" }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Code block ───────────────────────────────────────────────────────────────
function CodeSnippet({ code, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      antMessage.success("Copied!");
    }
    onCopy?.();
  };
  return (
    <div style={{ position: "relative" }}>
      <pre style={{
        background: "#0f172a", color: "#e2e8f0", padding: "16px 18px",
        borderRadius: 12, fontSize: 12, lineHeight: 1.7, margin: 0,
        overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}>
        {code}
      </pre>
      <button
        type="button" onClick={handleCopy}
        style={{
          position: "absolute", top: 10, right: 10,
          background: copied ? "#22c55e" : "rgba(255,255,255,0.12)",
          border: "none", borderRadius: 7, padding: "6px 10px",
          color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5, transition: "background 0.2s",
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// ─── Default form ─────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  view: "modal",
  buttonText: "Book now",
  drawerPosition: "bottom",
  responsiveDrawerOnMobile: true,
  primary: "#222222",
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

const RADIUS_PREVIEW_PX = { none: "0px", small: "6px", medium: "10px", large: "16px" };

// ─── Main component ───────────────────────────────────────────────────────────
export default function WidgetCustomizer() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [data, setData]         = useState(null);
  const [form, setForm]         = useState(DEFAULT_FORM);
  const [isWide, setIsWide]     = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1080 : true
  );

  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 1080);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  useEffect(() => {
    businessService
      .getWidgetConfig()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          const c = res.data.config || {};
          setForm((prev) => ({
            ...prev,
            view:                     c.view                     ?? prev.view,
            buttonText:               c.buttonText               ?? prev.buttonText,
            drawerPosition:           c.drawerPosition           ?? prev.drawerPosition,
            responsiveDrawerOnMobile: c.responsiveDrawerOnMobile !== false,
            primary:                  c.primary                  ?? prev.primary,
            background:               c.background               ?? prev.background,
            cardBackground:           c.cardBackground            ?? prev.cardBackground,
            textPrimary:              c.textPrimary               ?? prev.textPrimary,
            textSecondary:            c.textSecondary             ?? prev.textSecondary,
            textOnPrimary:            c.textOnPrimary             ?? prev.textOnPrimary,
            border:                   c.border                   ?? prev.border,
            fontFamily:               c.fontFamily               ?? prev.fontFamily,
            borderRadiusPreset:       c.borderRadiusPreset       ?? prev.borderRadiusPreset,
            specificClassId:          c.specificClassId != null ? String(c.specificClassId) : "",
            allowed_widget_origins:   typeof c.allowed_widget_origins === "string" ? c.allowed_widget_origins : "",
          }));
        }
      })
      .catch(() => antMessage.error("Failed to load widget settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    const payload = {
      view: form.view,
      buttonText: form.buttonText,
      drawerPosition: form.drawerPosition,
      responsiveDrawerOnMobile: form.responsiveDrawerOnMobile,
      primary: form.primary,
      background: form.background,
      cardBackground: form.cardBackground,
      textPrimary: form.textPrimary,
      textSecondary: form.textSecondary,
      textOnPrimary: form.textOnPrimary,
      border: form.border,
      fontFamily: form.fontFamily || undefined,
      borderRadiusPreset: form.borderRadiusPreset,
      specificClassId: form.specificClassId || undefined,
      allowed_widget_origins: form.allowed_widget_origins,
    };
    businessService
      .updateWidgetConfig(payload)
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

  const apiKey = data?.widget_api_key || "";
  const apiBase = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "" : "";
  const widgetScriptUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL || "" : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl = apiKey
    ? `${origin}/widget-demo?key=${encodeURIComponent(apiKey)}${apiBase ? `&base=${encodeURIComponent(apiBase)}` : ""}`
    : "";
  const mockPreviewUrl = apiKey
    ? `${origin}/widget-demo/mock?key=${encodeURIComponent(apiKey)}${apiBase ? `&base=${encodeURIComponent(apiBase)}` : ""}`
    : "";

  const embedSnippet = `<!-- Class Easily Booking Widget -->
<link rel="stylesheet" href="${widgetScriptUrl.replace(/\.js$/, ".css")}" />
<div id="classeasily-booking-widget"
  data-widget-api-key="${apiKey}"
  data-api-base="${apiBase}">
</div>
<script src="${widgetScriptUrl}"><\/script>`;

  if (loading) {
    return (
      <div style={{ padding: "40px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
        <Text style={{ color: "#9ca3af" }}>Loading widget settings…</Text>
      </div>
    );
  }

  const classes = data?.classes || [];

  // ─── Live button preview ───────────────────────────────────────────────────
  const buttonPreview = (
    <div style={{
      padding: "36px 20px", background: "#f9fafb",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 12, minHeight: 100,
    }}>
      <button
        type="button"
        style={{
          backgroundColor: form.primary,
          color: form.textOnPrimary,
          border: "none",
          padding: "12px 28px",
          borderRadius: RADIUS_PREVIEW_PX[form.borderRadiusPreset] || "10px",
          fontSize: 15, fontWeight: 600,
          fontFamily: form.fontFamily || "inherit",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          transition: "opacity 0.15s",
          pointerEvents: "none",
        }}
      >
        {form.buttonText || "Book now"}
      </button>
    </div>
  );

  // ─── Settings panel ────────────────────────────────────────────────────────
  const settingsPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Display */}
      <Section
        title="Display"
        icon={<Monitor size={16} />}
        description="How the booking flow opens for your customers"
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>View type</span>
            <Tooltip title="Controls how the booking flow is presented. Inline embeds it directly on the page. Modal opens a centered popup. Floating adds a fixed button in the corner." placement="top">
              <Info size={13} style={{ color: "#9ca3af", cursor: "help" }} />
            </Tooltip>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <ViewTile id="modal" current={form.view} onChange={set("view")}
              label="Modal" description="Centered popup" icon={<Square size={16} />} />
            <ViewTile id="inline" current={form.view} onChange={set("view")}
              label="Inline" description="Embedded in page" icon={<AlignLeft size={16} />} />
            <ViewTile id="floating" current={form.view} onChange={set("view")}
              label="Floating" description="Fixed corner FAB" icon={<Smartphone size={16} />} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>
            On mobile, a bottom sheet drawer is always used regardless of this setting.
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Button label</span>
            <Tooltip title="The text on your trigger button. Keep it short and action-oriented." placement="top">
              <Info size={13} style={{ color: "#9ca3af", cursor: "help" }} />
            </Tooltip>
          </div>
          <Input
            value={form.buttonText}
            onChange={(e) => set("buttonText")(e.target.value)}
            placeholder="Book now"
            maxLength={40}
            showCount
          />
        </div>
      </Section>

      {/* Brand Colors */}
      <Section
        title="Brand Colors"
        icon={<Palette size={16} />}
        description="Match the widget to your website's visual identity"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom: 16 }}>
          <ColorField
            label="Primary"
            value={form.primary}
            onChange={set("primary")}
            tooltip="Main accent color for buttons, selected states, and highlights. Use your brand color here."
          />
          <ColorField
            label="Text on Primary"
            value={form.textOnPrimary}
            onChange={set("textOnPrimary")}
            tooltip="Text color shown on top of primary-colored elements. Use white or a dark contrasting color."
          />
          <ColorField
            label="Background"
            value={form.background}
            onChange={set("background")}
            tooltip="The main background color of the widget modal or inline container."
          />
          <ColorField
            label="Card Background"
            value={form.cardBackground}
            onChange={set("cardBackground")}
            tooltip="Background for cards, list items, and nested panels inside the widget."
          />
          <ColorField
            label="Text — Primary"
            value={form.textPrimary}
            onChange={set("textPrimary")}
            tooltip="Main text color for headings and important content."
          />
          <ColorField
            label="Text — Secondary"
            value={form.textSecondary}
            onChange={set("textSecondary")}
            tooltip="Muted text color for descriptions, labels, and helper text."
          />
        </div>
        <ColorField
          label="Border"
          value={form.border}
          onChange={set("border")}
          tooltip="Color used for dividers, input borders, and card outlines."
        />
      </Section>

      {/* Typography & Shape */}
      <Section
        title="Typography & Shape"
        icon={<Type size={16} />}
        description="Control font and corner rounding"
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Font family</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>(optional)</span>
            <Tooltip title="Override the widget font. Leave empty to inherit your website's font automatically. Example: 'Inter, sans-serif'" placement="top">
              <Info size={13} style={{ color: "#9ca3af", cursor: "help" }} />
            </Tooltip>
          </div>
          <Input
            value={form.fontFamily}
            onChange={(e) => set("fontFamily")(e.target.value)}
            placeholder="e.g. Inter, sans-serif"
          />
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
            Leave empty to auto-inherit from your website.
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Border radius</span>
            <Tooltip title="How round the corners are on buttons, cards, and inputs." placement="top">
              <Info size={13} style={{ color: "#9ca3af", cursor: "help" }} />
            </Tooltip>
          </div>
          <RadiusPreset value={form.borderRadiusPreset} onChange={set("borderRadiusPreset")} />
        </div>
      </Section>

      {/* Content */}
      <Section
        title="Content"
        icon={<Layers size={16} />}
        description="Control which classes are shown"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Feature a specific class</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>(optional)</span>
          <Tooltip title="Pin the widget to a single class so customers skip the class selection step. Ideal for a dedicated booking button on a class page." placement="top">
            <Info size={13} style={{ color: "#9ca3af", cursor: "help" }} />
          </Tooltip>
        </div>
        <Select
          value={form.specificClassId || undefined}
          onChange={(v) => set("specificClassId")(v || "")}
          style={{ width: "100%" }}
          allowClear
          placeholder="Show all classes"
          options={[
            { value: "", label: "All classes" },
            ...classes.map((c) => ({ value: String(c.classId), label: c.title })),
          ]}
        />
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          When set, customers skip straight to date & time selection for this class.
        </div>
      </Section>

      {/* Allowed Domains */}
      <Section
        title="Allowed Domains"
        icon={<Shield size={16} />}
        description="Restrict which websites can embed your widget"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Your website domains</span>
          <Tooltip title="Add every domain where you embed the widget. Requests from unlisted domains will be blocked. ClassEasily domains are always allowed." placement="top">
            <Info size={13} style={{ color: "#9ca3af", cursor: "help" }} />
          </Tooltip>
        </div>
        <TextArea
          value={form.allowed_widget_origins}
          onChange={(e) => set("allowed_widget_origins")(e.target.value)}
          placeholder={"yoursite.com\nwww.yoursite.com\nshop.yoursite.com"}
          rows={4}
          style={{ fontFamily: "monospace", fontSize: 13 }}
        />
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, lineHeight: 1.5 }}>
          Enter one domain per line, without <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>https://</code>.
          ClassEasily domains are always included.
        </div>
      </Section>

      {/* Save */}
      <div style={{ paddingBottom: 48 }}>
        <Button
          type="primary" size="large" icon={<Save size={16} />}
          onClick={handleSave} loading={saving}
          style={{ width: "100%", height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10 }}
        >
          Save changes
        </Button>
        <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 10 }}>
          Changes take effect after saving. Reload the preview to see them.
        </div>
      </div>
    </div>
  );

  // ─── Preview panel ─────────────────────────────────────────────────────────
  const previewPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Live button preview */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Button preview</span>
          <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 20 }}>Live</span>
        </div>
        {buttonPreview}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { swatch: form.primary,    label: "Primary" },
              { swatch: form.background, label: "Background" },
              { swatch: form.textPrimary, label: "Text" },
            ].map(({ swatch, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: swatch, border: "1px solid #e5e7eb" }} />
                <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Widget preview */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Widget preview</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Reflects your last saved settings</div>
        </div>
        <div style={{ padding: 16 }}>
          {previewUrl ? (
            <>
              <iframe
                src={previewUrl}
                title="Widget preview"
                style={{
                  width: "100%", height: 340, border: "1px solid #e5e7eb",
                  borderRadius: 12, background: "#f9fafb",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button
                  size="small" icon={<ExternalLink size={13} />}
                  onClick={() => window.open(previewUrl, "_blank")}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  Full preview
                </Button>
                <Button
                  size="small" icon={<LayoutTemplate size={13} />}
                  onClick={() => window.open(mockPreviewUrl, "_blank")}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  Mock layout
                </Button>
              </div>
            </>
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", background: "#f9fafb", borderRadius: 12 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Save settings and reload to see the preview.</Text>
            </div>
          )}
        </div>
      </div>

      {/* Embed code */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
          <Code size={15} style={{ color: "#6b7280" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Embed code</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              Paste this where the booking button should appear
            </div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <CodeSnippet code={embedSnippet} />
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
              <strong>Before you go live:</strong> add your domain in the Allowed Domains section above so the widget can make requests from your site.
            </div>
          </div>
          {apiKey && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
              API key: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{apiKey}</code>
            </div>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <div style={{ padding: "24px 0 48px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <Title level={4} style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#111827" }}>
          Booking Widget
        </Title>
        <Text style={{ color: "#6b7280", fontSize: 15 }}>
          Customize the look and feel of your booking widget, then embed it on your website.
        </Text>
      </div>

      {isWide ? (
        /* Desktop: two-column layout */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 370px", gap: 32, alignItems: "start" }}>
          {settingsPanel}
          <div style={{ position: "sticky", top: 24 }}>
            {previewPanel}
          </div>
        </div>
      ) : (
        /* Mobile/narrow: stacked */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Preview on top (collapsed height) */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Button preview</div>
            </div>
            {buttonPreview}
          </div>
          {settingsPanel}
          {/* Widget preview: iframe + actions, no container */}
          {previewIframeUrl && (
            <>
              <iframe
                src={previewIframeUrl}
                title="Widget preview"
                style={{ width: "100%", height: 280, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f9fafb" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button size="small" icon={<ExternalLink size={13} />} onClick={() => window.open(previewUrl, "_blank")} style={{ flex: 1 }}>
                  Open preview
                </Button>
                <Button size="small" icon={<LayoutTemplate size={13} />} onClick={() => window.open(mockPreviewUrl, "_blank")} style={{ flex: 1 }}>
                  Mock layout
                </Button>
              </div>
            </>
          )}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
              <Code size={15} style={{ color: "#6b7280" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Embed code</span>
            </div>
            <div style={{ padding: 16 }}>
              <CodeSnippet code={embedSnippet} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
