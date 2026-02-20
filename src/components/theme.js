// --- START OF FILE theme.js ---

// src/theme.js

// 🔥 FIX 1: Freeze colors object to prevent mutations
const colors = Object.freeze({
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#e2e2e2",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  chart: Object.freeze({
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    teal: "#14b8a6",
    yellow: "#eab308",
  }),
});

// Common font stack to be used across token and components
const fontStack =
  'var(--font-proxima-soft), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// 🔥 FIX 2: Create theme config once and freeze it
const themeConfig = {
  screenMD: 768,
  token: {
    colorPrimary: colors.primary,
    colorError: colors.error,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorInfo: colors.info,
    colorLink: colors.primary,

    colorTextBase: colors.textPrimary,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: "#94a3b8",
    colorTextQuaternary: "#cbd5e1",
    colorPrimaryHover: "#e11d48",

    colorBorder: colors.border,
    colorBorderSecondary: "#e2e8f0",

    colorBgBase: "#FFFFFF",
    colorBgContainer: "#FFFFFF",
    colorBgLayout: colors.lightBg,
    colorBgElevated: "#FFFFFF",

    fontFamily: fontStack,
    fontSize: 14,

    borderRadius: 12,
    borderRadiusLG: 12,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    controlHeight: 44, // Global height reference
    marginXS: 8,
    margin: 16,
    marginLG: 24,
    paddingXS: 8,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    controlPaddingHorizontal: 16,
    colorPrimaryBorderHover: "#e11d48",
    colorBgTextHover: "rgba(0, 0, 0, 0.06)",

    colorBackgroundDark: "#0f172a",
    colorHeaderText: "#FFFFFF",

    colorChart1: colors.chart.blue,
    colorChart2: colors.chart.green,
    colorChart3: colors.chart.purple,
    colorChart4: colors.chart.orange,
    colorChart5: colors.chart.red,
    colorChart6: colors.chart.teal,
    colorChart7: colors.chart.yellow,
  },

  components: {
    Button: {
      colorPrimary: colors.primary,
      algorithm: true,
      controlHeight: 46, // CHANGED: Matches Input height exactly
      borderRadius: 12,
      paddingInline: 16,
      fontFamily: fontStack,
    },
    Modal: {
      borderRadiusLG: 12,
      fontFamily: fontStack,
    },
    Input: {
      controlHeight: 44,
      controlHeightLG: 44,
      borderRadius: 12,
      paddingInline: 16,
      paddingBlock: 12,
      colorTextPlaceholder: "#c5c5c5",
      fontFamily: fontStack,
    },
    Select: {
      controlHeight: 44,
      controlHeightLG: 44,
      borderRadius: 12,
      fontFamily: fontStack,
    },
    DatePicker: {
      controlHeight: 44,
      borderRadius: 12,
      fontFamily: fontStack,
    },
    TimePicker: {
      controlHeight: 44,
      borderRadius: 12,
      fontFamily: fontStack,
    },
    InputNumber: {
      controlHeight: 44,
      borderRadius: 12,
      fontFamily: fontStack,
    },
    Checkbox: {
      borderRadius: 4,
      fontFamily: fontStack,
    },
    Radio: {
      fontFamily: fontStack,
    },
    Card: {
      borderRadiusLG: 12,
      fontFamily: fontStack,
    },
    Table: {
      borderRadiusLG: 0,
      fontFamily: fontStack,
    },
    Tag: {
      borderRadius: 6,
      fontFamily: fontStack,
    },
    Switch: {
      borderRadius: 20,
      fontFamily: fontStack,
    },
    Dropdown: {
      borderRadiusLG: 12,
      fontFamily: fontStack,
    },
    Popover: {
      borderRadiusLG: 12,
      fontFamily: fontStack,
    },
    Tooltip: {
      borderRadius: 8,
      fontFamily: fontStack,
    },
    Notification: {
      borderRadiusLG: 12,
      fontFamily: fontStack,
    },
    Message: {
      borderRadius: 8,
      fontFamily: fontStack,
    },
    Typography: {
      fontFamily: fontStack,
    },
  },
};

// 🔥 FIX 3: Deep freeze the entire theme object
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (
      obj[prop] !== null &&
      (typeof obj[prop] === "object" || typeof obj[prop] === "function") &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
}

// 🔥 FIX 4: Export frozen theme to prevent any mutations
export const theme = deepFreeze(themeConfig);

// 🔥 FIX 5: Export individual colors if needed elsewhere
export { colors };
