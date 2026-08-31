"use client";

import styled from "styled-components";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export const DesktopOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(6px);
  z-index: 2999;
`;

export const DesktopPanel = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 48px);
  max-width: ${(p) => p.$maxWidth ?? 560}px;
  max-height: ${(p) => p.$maxHeight ?? "88vh"};
  background: #ffffff;
  border-radius: 24px;
  box-shadow:
    0 24px 64px rgba(15, 23, 42, 0.18),
    0 8px 24px rgba(15, 23, 42, 0.1);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
`;

export const DesktopCloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 20px;
  background: transparent;
  border: none;
  color: #717171;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  z-index: 5;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #111111;
  }
`;

/** Centered desktop modal shell — renders via portal when open. */
export function DesktopModalShell({
  open,
  onClose,
  children,
  maxWidth = 560,
  maxHeight = "88vh",
  ariaLabel,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <DesktopOverlay onClick={onClose} aria-hidden="true" />
      <DesktopPanel
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        $maxWidth={maxWidth}
        $maxHeight={maxHeight}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </DesktopPanel>
    </>,
    document.body,
  );
}
