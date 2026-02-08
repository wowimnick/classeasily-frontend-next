"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styled from "styled-components";
import { Button, Typography, Modal, ConfigProvider } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Cookie,
  X,
  Ellipsis,
  ShieldCheck,
  AlertTriangle,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Drawer } from "vaul";
import { theme } from "@/components/theme";

// --- UTILS ---
const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
};

// --- STYLED COMPONENTS ---

const PopupWrapper = styled(motion.div)`
  position: fixed;
  z-index: 990;
  bottom: 24px;
  right: 24px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  width: 380px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08); /* Lighter shadow */
  overflow: hidden;

  @media (max-width: 768px) {
    left: 16px;
    right: 16px;
    bottom: max(16px, env(safe-area-inset-bottom));
    width: auto;
    border-radius: 16px; /* Smaller radius */
  }
`;

const ContentContainer = styled.div`
  padding: 1.25rem;

  @media (max-width: 768px) {
    padding: 12px 16px; /* Much tighter padding on mobile */
  }
`;

// Mobile-specific hidden elements to save space
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    display: ${(props) => (props.$mobileHide ? "none" : "flex")};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconButton = styled.button`
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    background: #e5e7eb;
    color: #111827;
  }
`;

const TextContent = styled.div`
  margin-bottom: 20px;
  line-height: 1.5;
  color: #4b5563;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    margin-bottom: 12px;
    font-size: 0.85rem; /* Smaller font */
    line-height: 1.4;
    padding-right: 20px; /* Space for hidden close click area if needed */
  }
`;

const StyledLink = styled(Link)`
  color: ${theme.token.colorPrimary};
  text-decoration: none;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const OptionsButton = styled.button`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  cursor: pointer;
  height: 44px;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  @media (max-width: 768px) {
    height: 36px; /* Smaller button */
    width: 36px;
    border-radius: 10px;
  }
`;

const SettingsOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 14px;
  margin-bottom: 12px;
  border: 1px solid #f3f4f6;
`;

const OptionTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

// --- DRAWER COMPONENTS (Mobile) ---
const DrawerInner = styled.div`
  padding: 1.5rem;
  background: white;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 5px;
  background: #e5e7eb;
  border-radius: 10px;
  margin: 0 auto 24px;
`;

const CookieConsentBanner = ({ onAccept, onDecline, onClose }) => {
  const [view, setView] = useState("main");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [contentRef, { height }] = useElementSize();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMoreClick = () => {
    if (isMobile) setIsDrawerOpen(true);
    else setView("settings");
  };

  const handleDeclineIntent = () => {
    setIsDrawerOpen(false);
    setShowDeclineModal(true);
  };

  return (
    <ConfigProvider theme={theme}>
      <PopupWrapper
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: height || "auto" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div ref={contentRef}>
          <ContentContainer>
            <AnimatePresence mode="wait">
              {view === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header hidden on mobile for compactness */}
                  <Header $mobileHide>
                    <Title>
                      <Cookie
                        size={20}
                        color={theme.token.colorPrimary}
                        fill={theme.token.colorPrimary}
                        fillOpacity={0.1}
                      />
                      Cookie Settings
                    </Title>
                    <IconButton onClick={onClose}>
                      <X size={16} />
                    </IconButton>
                  </Header>

                  <TextContent>
                    We use cookies to analyze traffic. See our{" "}
                    <StyledLink href="/cookie-policy">Policy</StyledLink>.
                  </TextContent>

                  <ButtonGroup>
                    <OptionsButton
                      onClick={handleMoreClick}
                      aria-label="More options"
                    >
                      <Ellipsis size={isMobile ? 18 : 20} />
                    </OptionsButton>
                    <Button
                      type="primary"
                      onClick={onAccept}
                      block
                      style={{
                        height: isMobile ? "36px" : "44px", // Compact button
                        borderRadius: isMobile ? "10px" : "12px",
                        fontWeight: 600,
                        fontSize: isMobile ? "13px" : "14px",
                      }}
                    >
                      Accept All
                    </Button>
                    {/* Tiny close button for mobile only, next to Accept */}
                    {isMobile && (
                      <IconButton
                        onClick={onClose}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          flexShrink: 0,
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    )}
                  </ButtonGroup>
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Desktop Settings View (Mobile uses Drawer) */}
                  <Header>
                    <Title>
                      <IconButton
                        onClick={() => setView("main")}
                        style={{
                          width: 28,
                          height: 28,
                          background: "transparent",
                        }}
                      >
                        <ArrowLeft size={18} />
                      </IconButton>
                      Preferences
                    </Title>
                  </Header>

                  <SettingsOption>
                    <OptionTextWrapper>
                      <Typography.Text strong>Essential</Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: "12px" }}
                      >
                        Required for site function.
                      </Typography.Text>
                    </OptionTextWrapper>
                    <ShieldCheck size={20} color="#10b981" />
                  </SettingsOption>

                  <SettingsOption>
                    <OptionTextWrapper>
                      <Typography.Text strong>Analytics</Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: "12px" }}
                      >
                        Helps us improve UI.
                      </Typography.Text>
                    </OptionTextWrapper>
                    <Button
                      size="small"
                      type="text"
                      danger
                      onClick={handleDeclineIntent}
                    >
                      Decline
                    </Button>
                  </SettingsOption>

                  <Button
                    type="primary"
                    block
                    onClick={onAccept}
                    style={{ marginTop: 4, height: 44, borderRadius: 12 }}
                  >
                    Save & Accept All
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </ContentContainer>
        </div>
      </PopupWrapper>

      {/* Mobile Drawer (Vaul) */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1000,
            }}
          />
          <Drawer.Content
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1001,
              outline: "none",
            }}
          >
            <DrawerInner>
              <DrawerHandle />
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Settings
                  size={28}
                  color={theme.token.colorPrimary}
                  style={{ margin: "0 auto 10px" }}
                />
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Privacy Settings
                </Typography.Title>
              </div>

              <SettingsOption style={{ padding: 12 }}>
                <OptionTextWrapper>
                  <Typography.Text strong>Analytics Tracking</Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "12px" }}
                  >
                    Anonymized data to improve performance.
                  </Typography.Text>
                </OptionTextWrapper>
                <Button
                  danger
                  type="link"
                  size="small"
                  onClick={handleDeclineIntent}
                >
                  Decline
                </Button>
              </SettingsOption>

              <Button
                type="primary"
                size="large"
                block
                onClick={() => {
                  onAccept();
                  setIsDrawerOpen(false);
                }}
                style={{
                  height: 48,
                  borderRadius: 14,
                  marginTop: 12,
                  fontWeight: 600,
                }}
              >
                Accept All
              </Button>
            </DrawerInner>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Decline Confirmation Modal */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#dc2626",
              fontSize: "16px",
            }}
          >
            <AlertTriangle size={20} />
            Are you sure?
          </div>
        }
        open={showDeclineModal}
        onCancel={() => setShowDeclineModal(false)}
        zIndex={1100}
        centered
        width={320} // Smaller width for modal
        footer={[
          <Button
            key="keep"
            type="primary"
            block
            onClick={() => setShowDeclineModal(false)}
            style={{ borderRadius: 10 }}
          >
            Keep Cookies
          </Button>,
          <Button
            key="decline"
            type="text"
            danger
            block
            onClick={() => {
              setShowDeclineModal(false);
              onDecline();
            }}
            style={{ marginTop: 4 }}
          >
            Decline All
          </Button>,
        ]}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: "13px" }}>
          Declining cookies may cause slower loading times.
        </Typography.Paragraph>
      </Modal>
    </ConfigProvider>
  );
};

export default CookieConsentBanner;
