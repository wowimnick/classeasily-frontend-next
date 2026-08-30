/** Marketing-site design tokens. Keep Proxima Soft via --font-proxima-soft. */
export const BP = {
  phone: 640,
  mobile: 768,
};

export const mq = {
  phone: `@media (max-width: ${BP.phone}px)`,
  mobile: `@media (max-width: ${BP.mobile}px)`,
};

export const marketingTheme = {
  colors: {
    primary: "#fc4056",
    primaryHover: "#c92e44",
    dark: "#000000",
    text: "#000000",
    textLight: "#000000",
    bg: "#FFFFFF",
    bgLight: "#F6F9FC",
    border: "#E2E8F0",
    white: "#FFFFFF",
    accent: "#fb2243",
  },
  fonts: {
    body: 'var(--font-proxima-soft), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shadows: {
    sm: "0 2px 4px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(50,50,93,0.11), 0 1px 3px rgba(0,0,0,0.08)",
    lg: "0 15px 35px rgba(50,50,93,0.1), 0 5px 15px rgba(0,0,0,0.07)",
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  headerHeight: 72,
  breakpoints: BP,
  spacing: {
    pageX: 20,
    sectionY: 48,
    tap: 48,
  },
  safeArea: {
    bottom: "env(safe-area-inset-bottom, 0px)",
  },
};

export const SUPPORT_EMAIL = "support@classeasily.com";
export const REGISTER_HREF = "/business/register";
export const PRICING_HREF = "/pricing";
