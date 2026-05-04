"use client";

import styled, { css } from "styled-components";

/**
 * Shared surface for floating “type” / I-want style panels (explore bar, header, homepage).
 * Compose into `styled(motion.div)` etc. with `${exploreSearchDropdownPanelCss}`.
 */
export const exploreSearchDropdownPanelCss = css`
  background: #ffffff;
  border-radius: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: min(560px, calc(100vh - 96px));
`;

/** Matches ExploreCategories `DropdownTypeChipFlow` — wrap + scroll */
export const ExploreDropdownTypeChipFlow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
  padding: 20px 22px 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

/** Matches ExploreCategories `DropdownTypeChip` — black pill selection */
export const ExploreDropdownTypeChip = styled.button`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  width: fit-content;
  max-width: 100%;
  padding: 10px 16px;
  border: 1.5px solid #111111;
  border-radius: 9999px;
  background: ${(p) => (p.$selected ? "#111111" : "#ffffff")};
  font-size: 14px;
  line-height: 1.2;
  color: ${(p) => (p.$selected ? "#ffffff" : "#222222")};
  cursor: pointer;
  font-weight: ${(p) => (p.$selected ? 600 : 400)};
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  svg {
    flex-shrink: 0;
    color: ${(p) => (p.$selected ? "#ffffff" : "inherit")};
  }
`;
