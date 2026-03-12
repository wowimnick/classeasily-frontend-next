"use client";

import React from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { Button } from "antd";
import { X } from "lucide-react";

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1049;
`;

const MobileDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 88vh;
  max-height: 88vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: min(860px, 95vw);
  display: flex;
`;

const DesktopDrawerInner = styled.div`
  background: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: white;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #334155;
`;

const CloseButton = styled(Button)`
  border: none;
  box-shadow: none;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #f8fafc;
`;

const DrawerFooter = styled.div`
  border-top: 1px solid #f1f5f9;
  padding: 14px 24px;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
`;

const AdminResponsiveDrawer = ({
  open,
  onClose,
  title,
  titleIcon,
  isMobile = false,
  footer = null,
  children,
  width,
}) => {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.();
      }}
      direction={isMobile ? "bottom" : "right"}
      dismissible
    >
      <Drawer.Portal>
        <StyledDrawerOverlay />
        {isMobile ? (
          <MobileDrawerContent>
            <DrawerHandle />
            <DrawerHeader>
              <HeaderTitle>
                {titleIcon}
                <span>{title}</span>
              </HeaderTitle>
              <CloseButton icon={<X size={18} />} onClick={onClose} />
            </DrawerHeader>
            <DrawerBody>{children}</DrawerBody>
            {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
          </MobileDrawerContent>
        ) : (
          <DesktopDrawerContent style={width ? { width } : undefined}>
            <DesktopDrawerInner>
              <DrawerHeader>
                <HeaderTitle>
                  {titleIcon}
                  <span>{title}</span>
                </HeaderTitle>
                <CloseButton icon={<X size={18} />} onClick={onClose} />
              </DrawerHeader>
              <DrawerBody>{children}</DrawerBody>
              {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
            </DesktopDrawerInner>
          </DesktopDrawerContent>
        )}
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default AdminResponsiveDrawer;
