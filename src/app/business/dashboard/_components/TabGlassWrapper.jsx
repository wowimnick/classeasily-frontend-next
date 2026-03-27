"use client";

import React from "react";
import styled from "styled-components";

const Outer = styled.div`
  position: relative;
  min-height: 100%;
  padding: 12px;
  background: radial-gradient(
    circle at 85% 8%,
    rgba(252, 64, 86, 0.055) 0%,
    transparent 42%
  );
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const Glass = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  overflow: ${(p) => (p.$unclipped ? "visible" : "hidden")};
  isolation: isolate;
  @media (max-width: 768px) {
    padding: 0;
    border-radius: 12px;
  }
`;

/**
 * @param {object} props
 * @param {boolean} [props.unclipped] — If true, `overflow: visible` so children can use `position: sticky`
 *   (e.g. widget save bar). Default keeps `overflow: hidden` for frosted panel clipping.
 */
export default function TabGlassWrapper({ children, unclipped = false }) {
  return (
    <Outer>
      <Glass $unclipped={unclipped}>{children}</Glass>
    </Outer>
  );
}
