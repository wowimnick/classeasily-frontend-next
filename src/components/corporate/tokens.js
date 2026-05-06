/**
 * Corporate UI tokens — aligned with class detail page (ClassPageImagesTitle).
 */
export const HERO_TEXT = "#111111";
export const HERO_MUTED = "#717171";
export const BORDER = "#E5E7EB";
export const SURFACE = "#FFFFFF";
export const SURFACE_MUTED = "#F8FAFC";
export const BRAND_RED = "#E63151";
/** Accent border / headings where slate was used */
export const ACCENT_DARK = "#0f172a";
export const TEXT_BODY = "#334155";
export const TEXT_MUTED = "#64748b";
export const ERROR_TEXT = "#991b1b";
export const ERROR_BG = "#fef2f2";

export { BP, down, up, media } from "@/styles/breakpoints";

import styled from "styled-components";

export const PrimaryButton = styled.button`
  flex: 1;
  border: none;
  background: ${BRAND_RED};
  color: #fff;
  border-radius: 12px;
  padding: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${BRAND_RED};
    outline-offset: 2px;
  }
`;

export const GhostButton = styled.button`
  flex: 1;
  border: 1px solid ${BORDER};
  background: ${SURFACE};
  border-radius: 12px;
  padding: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  color: ${HERO_TEXT};
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${HERO_MUTED};
    background: ${SURFACE_MUTED};
  }

  &:focus-visible {
    outline: 2px solid ${BRAND_RED};
    outline-offset: 2px;
  }
`;
