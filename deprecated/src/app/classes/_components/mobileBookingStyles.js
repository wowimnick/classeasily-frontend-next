"use client";

// Shared styled components + theme for mobile booking drawers/modals.
// Lifted from ClassPageClient.jsx so SelectTimeModal can reuse the same
// visual language without duplicating style definitions.

import styled from "styled-components";
import { motion } from "framer-motion";
import { Drawer } from "vaul";

export const mobileDrawerTheme = {
  primary: "#ff385c",
  primaryFade: "rgba(255, 56, 92, 0.04)",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  bg: "#ffffff",
  bgSecondary: "#f3f4f6",
  radiusSm: "16px",
};

export const MobileDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 3000;
`;

export const MobileDrawerContent = styled(Drawer.Content)`
  background: ${mobileDrawerTheme.bg};
  display: flex;
  flex-direction: column;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3001;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  outline: none;
`;

export const MobileDrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: ${mobileDrawerTheme.border};
  border-radius: 2px;
  margin: 12px auto;
  flex-shrink: 0;
`;

export const MobileDrawerTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: ${mobileDrawerTheme.textPrimary};
  text-align: center;
`;

export const MobileDrawerBody = styled.div`
  padding: 0 1rem 1rem;
  overflow-y: auto;
  display: flex;
  justify-content: center;
`;

export const MobileDrawerSubtitle = styled.span`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-top: 4px;
`;

export const ParticipantsStepperBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #ff385c;
    color: #ff385c;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const ParticipantsStepperValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  min-width: 2rem;
  text-align: center;
`;
