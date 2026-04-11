import { keyframes } from "styled-components";

export const BRAND_PRIMARY = "#f7324e";
export const BRAND_PRIMARY_HOVER = "#d62a42";

export const shimmerMove = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const floatY = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

export const borderPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(17, 24, 39, 0.12); }
  100% { box-shadow: 0 0 0 10px rgba(17, 24, 39, 0); }
`;

export const btnShimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;
