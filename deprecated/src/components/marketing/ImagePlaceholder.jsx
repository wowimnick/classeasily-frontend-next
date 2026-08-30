"use client";

import styled from "styled-components";

const Box = styled.div`
  width: 100%;
  min-height: ${(p) => p.$minHeight || "420px"};
  background: linear-gradient(135deg, #f6f9fc 0%, #e2e8f0 100%);
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #000;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);

  @media (max-width: 640px) {
    min-height: 280px;
  }
`;

export default function ImagePlaceholder({ label = "Image placeholder", minHeight }) {
  return <Box $minHeight={minHeight}>{label}</Box>;
}
