"use client";

import styled from "styled-components";

/**
 * Primary “Show results” CTA — matches fullscreen search (gradient pill + soft shadow).
 */
export const ExploreShowResultsButton = styled.button`
  flex: ${({ $footerFlex }) => ($footerFlex ? "1" : "0 0 auto")};
  min-width: 0;
  max-width: ${({ $footerFlex }) => ($footerFlex ? "240px" : "min(240px, 52vw)")};
  height: 48px;
  padding: 0 20px;
  border: none;
  border-radius: 9999px;
  background: linear-gradient(135deg, #ff385c 0%, #e11d48 100%);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 6px 18px rgba(255, 56, 92, 0.35);
  transition:
    transform 0.12s ease,
    box-shadow 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  line-height: 1.2;

  &:hover {
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.08),
      0 8px 22px rgba(255, 56, 92, 0.4);
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    opacity: 0.85;
    cursor: wait;
  }
`;
