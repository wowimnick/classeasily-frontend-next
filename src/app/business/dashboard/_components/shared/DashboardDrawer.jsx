"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import styled from "styled-components";
import { X } from "lucide-react";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { dash } from "./dashboardTokens";

const BREAKPOINT = 1024;

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(34, 34, 34, 0.4);
  z-index: 1100;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const DesktopContent = styled(Drawer.Content)`
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(${(p) => p.$width || 420}px, 100vw);
  background: ${dash.color.surface};
  z-index: 1101;
  display: flex;
  flex-direction: column;
  outline: none;
  box-shadow: ${dash.elevation.raised};
`;

const MobileContent = styled(Drawer.Content)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${dash.color.surface};
  border-radius: ${dash.radius.media}px ${dash.radius.media}px 0 0;
  z-index: 1101;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  outline: none;
`;

const Handle = styled(Drawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(34, 34, 34, 0.18);
  border-radius: 2px;
  margin: 10px auto 0;
  flex-shrink: 0;
`;

const Header = styled.div`
  padding: ${(p) => (p.$mobile ? "12px 16px 12px" : "20px 20px 14px")};
  border-bottom: 1px solid ${dash.color.hairline};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
`;

const TitleBlock = styled.div`
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${dash.type.heading.size}px;
  font-weight: ${dash.type.heading.weight};
  line-height: ${dash.type.heading.line};
  color: ${dash.color.ink};
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: ${dash.type.caption.size}px;
  font-weight: ${dash.type.caption.weight};
  color: ${dash.color.ash};
  line-height: 1.4;
`;

const CloseBtn = styled.button`
  width: ${dash.hit}px;
  height: ${dash.hit}px;
  margin: -10px -10px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${dash.color.ash};
  border-radius: ${dash.radius.control}px;
  flex-shrink: 0;
  &:hover {
    background: ${dash.color.cloud};
    color: ${dash.color.ink};
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${dash.focus};
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${(p) => (p.$pad === "none" ? 0 : p.$mobile ? "16px 16px 24px" : "16px 20px 24px")};
  min-height: 0;
`;

const Footer = styled.div`
  padding: 12px 16px 16px;
  border-top: 1px solid ${dash.color.hairline};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  background: ${dash.color.surface};
`;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isMobile;
}

/**
 * Shared vaul drawer: right panel on desktop, bottom sheet under 1024px.
 */
export default function DashboardDrawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  width = 420,
  hideHeader = false,
  bodyPad,
}) {
  const isMobile = useIsMobile();
  const Content = isMobile ? MobileContent : DesktopContent;

  return (
    <Drawer.Root
      open={!!open}
      onOpenChange={(v) => {
        if (!v) onClose?.();
      }}
      direction={isMobile ? "bottom" : "right"}
      dismissible
      handleOnly={!isMobile}
    >
      <Drawer.Portal>
        <Overlay />
        <Content $width={width} style={!isMobile ? { "--initial-transform": "calc(100% + 8px)" } : undefined}>
          {isMobile && <Handle />}
          {!hideHeader && (
            <Header $mobile={isMobile}>
              <TitleBlock>
                {title ? <Title>{title}</Title> : null}
                {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
              </TitleBlock>
              <CloseBtn type="button" onClick={onClose} aria-label="Close">
                <X size={18} />
              </CloseBtn>
            </Header>
          )}
          <Body $mobile={isMobile} $pad={bodyPad}>
            {children}
          </Body>
          {footer ? <Footer>{footer}</Footer> : null}
        </Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export { BREAKPOINT as DASHBOARD_DRAWER_BREAKPOINT };
