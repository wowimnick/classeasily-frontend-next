/**
 * Dashboard visual language — Airbnb-derived tokens adapted for a data-dense
 * business dashboard. Accent comes from the frozen product palette so brand
 * alignment stays a single source of truth.
 */
import { colors as themeColors } from "@/components/theme";

export const dash = Object.freeze({
  color: Object.freeze({
    rausch: themeColors.primary, // #ff385c
    rauschPressed: "#e00b41",
    ink: "#222222",
    ash: "#717171",
    light: "#b0b0b0",
    hairline: "#dddddd",
    cloud: "#f7f7f7",
    surface: "#ffffff",
    success: themeColors.success,
    warning: themeColors.warning,
    danger: themeColors.error,
    info: themeColors.info,
  }),

  radius: Object.freeze({
    sm: 4,
    control: 8,
    md: 12,
    card: 14,
    media: 20,
    pill: 999,
  }),

  space: Object.freeze({
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    48: 48,
    64: 64,
    dataCardPad: 16,
    tableRowPad: 12,
  }),

  type: Object.freeze({
    display: { size: 28, weight: 600, line: 1.2 },
    title: { size: 22, weight: 600, line: 1.22 },
    heading: { size: 18, weight: 600, line: 1.25 },
    body: { size: 16, weight: 500, line: 1.43 },
    secondary: { size: 14, weight: 500, line: 1.43 },
    caption: { size: 12, weight: 500, line: 1.4 },
    overline: { size: 8, weight: 600, line: 1.2, tracking: "0.32px" },
  }),

  elevation: Object.freeze({
    flat: "none",
    raised:
      "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0",
  }),

  focus: "0 0 0 2px #222222",
  hit: 44,

  chart: Object.freeze({
    primary: themeColors.primary,
    muted: Object.freeze([
      "#5c6b7a",
      "#5f7a6a",
      "#6b6280",
      "#8a7360",
      "#5a7878",
      "#8a8058",
      "#5c6580",
    ]),
  }),
});

/**
 * Service color chips. First entry is Rausch so the first service stays the
 * loudest; remaining accents are desaturated so they recede next to it.
 */
export const CLASS_COLORS = Object.freeze([
  Object.freeze({ bg: "#fff0f2", accent: "#ff385c", text: "#991b1b" }),
  Object.freeze({ bg: "#f4f6f8", accent: "#5c6b7a", text: "#3d4a57" }),
  Object.freeze({ bg: "#f3f6f4", accent: "#5f7a6a", text: "#3d5248" }),
  Object.freeze({ bg: "#f5f4f7", accent: "#6b6280", text: "#4a4458" }),
  Object.freeze({ bg: "#f7f5f2", accent: "#8a7360", text: "#5c4c3e" }),
  Object.freeze({ bg: "#f2f6f6", accent: "#5a7878", text: "#3d5252" }),
  Object.freeze({ bg: "#f6f5f1", accent: "#8a8058", text: "#5a5338" }),
  Object.freeze({ bg: "#f3f4f7", accent: "#5c6580", text: "#3e4458" }),
]);

export function classColorAt(index) {
  return CLASS_COLORS[Math.abs(index) % CLASS_COLORS.length];
}

export const typeStyle = (key) => {
  const t = dash.type[key] || dash.type.body;
  return {
    fontSize: t.size,
    fontWeight: t.weight,
    lineHeight: t.line,
    letterSpacing: t.tracking || 0,
    color: dash.color.ink,
  };
};
