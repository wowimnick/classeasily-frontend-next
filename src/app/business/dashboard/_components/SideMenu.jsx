"use client";

import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, ThemeProvider, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Typography,
  Space,
  Avatar,
  Skeleton,
  Tooltip,
  Modal,
} from "antd";
import { X, AlertCircle, SidebarOpen, Eye, ChevronRight, Lock, ArrowRight } from "lucide-react";
import { Drawer } from "vaul";

import { businessService } from "@/services/apiService";
import { useAuth } from "@/lib/auth-client";
import { useSubscription } from "@/context/SubscriptionContext";

const { Title, Text } = Typography;
import { theme as augmentedTheme } from "@/components/theme";

const BUSINESS_TYPE_LABELS = {
  individual: "Individual Host",
  "tour-operator": "Tour Operator",
  "experience-group": "Experience Group",
  venue: "Venue / Studio",
  "event-organizer": "Event Organizer",
};

function getBusinessTypeLabel(value) {
  if (!value || value === "Not set") return value;
  return (
    BUSINESS_TYPE_LABELS[value] ??
    value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
import { LordIcon } from "@/services/ReactUtils";

const LocalGlobalStyleForSkeleton = createGlobalStyle`
  .header-skeleton-title .ant-skeleton-title { height: 16px !important; margin-top: 2px !important; margin-bottom: 4px !important; border-radius: 4px; }
  .header-skeleton-type .ant-skeleton-title  { height: 13px !important; margin-top: 0px  !important; margin-bottom: 0px  !important; border-radius: 4px; }
`;

/* ─── Widget upgrade modal: holographic blobs ────────────────────── */
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  12%      { transform: translateX(-4px); }
  24%      { transform: translateX(4px); }
  36%      { transform: translateX(-3px); }
  48%      { transform: translateX(3px); }
  60%      { transform: translateX(-2px); }
  72%      { transform: translateX(2px); }
  84%      { transform: translateX(-1px); }
`;

const ModalBackgroundContainer = styled.div`
  position: absolute;
  inset: 0;
  background: #ffffff;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
`;

const ModalWhiteOverlay = styled.div`
  position: absolute;
  inset: 0;
  /* An 80% opacity white overlay washes out the saturated blobs underneath, resulting in a premium, mostly-white holographic effect */
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
`;

const Blob = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
  opacity: 0.8;
  will-change: transform;
`;

const UpgradeModalInner = styled.div`
  position: relative;
  z-index: 2;
  padding: 28px 24px 24px;
  border-radius: 20px;
`;

const UpgradeModalTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
`;

const UpgradeModalBody = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

const UpgradeModalCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  background: #1a1a2e;
  color: white;
  text-decoration: none;
  transition: opacity 0.15s, transform 0.15s;
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    color: white;
  }
`;

function WidgetUpgradeModal({ open, onClose }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  },[]);

  const content = (
    <>
      <ModalBackgroundContainer>
        {/* Cyan Orb */}
        <Blob
          style={{ width: 300, height: 300, background: "#00e1ff", top: "-100px", left: "-100px" }}
          animate={{
            x:[0, 60, -40, 20, 0],
            y:[0, 40, 80, -20, 0],
            scale:[1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Magenta Orb */}
        <Blob
          style={{ width: 280, height: 280, background: "#fff", top: "-80px", right: "-80px" }}
          animate={{
            x: [0, -70, 30, -50, 0],
            y: [0, 50, -40, 30, 0],
            scale:[1, 0.8, 1.15, 0.95, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Purple Orb */}
        <Blob
          style={{ width: 320, height: 320, background: "#F54927", bottom: "-120px", left: "-80px" }}
          animate={{
            x:[0, 80, -50, 40, 0],
            y:[0, -60, 30, -70, 0],
            scale:[1, 1.15, 0.85, 1.05, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Yellow Orb */}
        <Blob
          style={{ width: 250, height: 250, background: "#F54927", bottom: "-80px", right: "-80px" }}
          animate={{
            x: [0, -90, 40, -30, 0],
            y:[0, -40, 60, -20, 0],
            scale:[1, 0.9, 1.2, 0.8, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <ModalWhiteOverlay />
      </ModalBackgroundContainer>
      <UpgradeModalInner>
        <UpgradeModalTitle>Unlock the Booking Widget</UpgradeModalTitle>
        <UpgradeModalBody>
          Subscribe to a widget plan to embed the booking widget on your website, customize its look, and start taking bookings.
        </UpgradeModalBody>
        <UpgradeModalCta href="/booking-widget" onClick={onClose}>
          Get the Widget <ArrowRight size={14} />
        </UpgradeModalCta>
      </UpgradeModalInner>
    </>
  );
  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
          <Drawer.Content
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              overflow: "hidden",
              zIndex: 1001,
              outline: "none",
            }}
          >
            <div style={{ position: "relative", minHeight: 120 }}>{content}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={420} centered closable={false}
      styles={{ body: { padding: 0, overflow: "hidden" } }}
      getContainer={false}>
      <div style={{ position: "relative", minHeight: 280 }}>{content}</div>
    </Modal>
  );
}

function MembershipsUpgradeModal({ open, onClose }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const content = (
    <>
      <ModalBackgroundContainer>
        <Blob style={{ width: 300, height: 300, background: "#00e1ff", top: "-100px", left: "-100px" }}
          animate={{ x: [0, 60, -40, 20, 0], y: [0, 40, 80, -20, 0], scale: [1, 1.2, 0.9, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <Blob style={{ width: 280, height: 280, background: "#fff", top: "-80px", right: "-80px" }}
          animate={{ x: [0, -70, 30, -50, 0], y: [0, 50, -40, 30, 0], scale: [1, 0.8, 1.15, 0.95, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <Blob style={{ width: 320, height: 320, background: "#F54927", bottom: "-120px", left: "-80px" }}
          animate={{ x: [0, 80, -50, 40, 0], y: [0, -60, 30, -70, 0], scale: [1, 1.15, 0.85, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <Blob style={{ width: 250, height: 250, background: "#F54927", bottom: "-80px", right: "-80px" }}
          animate={{ x: [0, -90, 40, -30, 0], y: [0, -40, 60, -20, 0], scale: [1, 0.9, 1.2, 0.8, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <ModalWhiteOverlay />
      </ModalBackgroundContainer>
      <UpgradeModalInner>
        <UpgradeModalTitle>Unlock Memberships</UpgradeModalTitle>
        <UpgradeModalBody>
          Subscribe to Growth or Advanced to create membership plans, manage members and credits, and collect recurring revenue from your widget or business page.
        </UpgradeModalBody>
        <UpgradeModalCta href="/booking-widget" onClick={onClose}>
          View plans <ArrowRight size={14} />
        </UpgradeModalCta>
      </UpgradeModalInner>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
          <Drawer.Content
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              overflow: "hidden",
              zIndex: 1001,
              outline: "none",
            }}
          >
            <div style={{ position: "relative", minHeight: 120 }}>{content}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={true}
      centered
      width={400}
      styles={{
        mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.28)" },
        content: { padding: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 20px 60px rgba(0,0,0,0.16)" },
        body: { padding: 0 },
      }}
    >
      <div style={{ position: "relative", minHeight: 140, borderRadius: 20 }}>{content}</div>
    </Modal>
  );
}

/* ─── Outer wrapper ────────────────────────────────────────────── */
const SideMenuWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${(p) => p.theme.token.fontFamily};

  @media (max-width: 1024px) {
    .desktop-sidemenu { display: none; }
  }
`;

/* ─── Desktop sidebar ──────────────────────────────────────────── */
const DesktopSideMenu = styled(motion.div)`
  width: 260px;
  border-right: 1px solid #EBEBEB;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
`;

/* ─── Profile card area ────────────────────────────────────────── */
const ProfileCardArea = styled.div`
  padding: 14px 14px 10px;
  flex-shrink: 0;
`;

const BusinessProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.05);
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  overflow: hidden;

  &:hover {
    ${(p) =>
      p.$clickable &&
      `
      box-shadow: 0 4px 12px rgba(0,0,0,0.10);
      transform: translateY(-1px);
    `}
  }
`;

const BusinessLogoImg = styled.img`
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
`;

const BusinessTextBlock = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const BusinessNameText = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const BusinessTypeText = styled.div`
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  margin-top: 1px;
`;

/* ─── Menu container ───────────────────────────────────────────── */
const MenuContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 10px 8px;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 2px;
  }
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
`;

/* ─── Ant Design Menu overrides ────────────────────────────────── */
const StyledAntMenu = styled(Menu)`
  border-right: none !important;
  background: transparent !important;

  /* Group header label */
  .ant-menu-item-group-title {
    font-size: 10.5px !important;
    font-weight: 700 !important;
    letter-spacing: 0.07em !important;
    color: #111827 !important;
    text-transform: uppercase !important;
    padding: 14px 10px 5px !important;
    line-height: 1 !important;
  }

  /* Every item / submenu title */
  .ant-menu-item,
  .ant-menu-submenu-title {
    margin: 2px 0 !important;
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0 12px !important;
    border-radius: 8px !important;
    height: 40px !important;
    line-height: 40px !important;
    color: #4b5563;
    font-weight: 500;
    font-size: 13.5px;

    .ant-menu-item-icon {
      display: inline-block !important;
      vertical-align: middle !important;
    }

    lord-icon {
      transition: none;
      margin-right: 0 !important;
      vertical-align: middle;
      display: inline-block;
      pointer-events: none;
    }

    &:hover {
      color: #111827 !important;
      background-color: rgba(0,0,0,0.045) !important;

      lord-icon {
        --lord-icon-primary: #111827;
        --lord-icon-secondary: #111827;
      }
    }
  }

  /* ACTIVE / selected top-level item */
  .ant-menu-item-selected {
    background-color: #ffffff !important;
    color: #111827 !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04) !important;

    lord-icon {
      --lord-icon-primary: ${(p) => p.theme.token.colorPrimary} !important;
      --lord-icon-secondary: ${(p) => p.theme.token.colorPrimary} !important;
    }

    &::after { display: none; }

    &:hover {
      background-color: #ffffff !important;
      color: #111827 !important;
    }
  }

  /* Open / selected parent submenu title */
  .ant-menu-submenu-selected > .ant-menu-submenu-title,
  .ant-menu-submenu-open    > .ant-menu-submenu-title {
    color: #111827 !important;
    font-weight: 600 !important;
    background-color: rgba(0,0,0,0.04) !important;

    lord-icon {
      --lord-icon-primary: ${(p) => p.theme.token.colorPrimary};
      --lord-icon-secondary: ${(p) => p.theme.token.colorPrimary};
    }
  }

  /* Sub-menu (children) items */
  .ant-menu-sub.ant-menu-inline {
    background-color: transparent !important;

    .ant-menu-item {
      font-size: 13px;
      font-weight: 400;
      color: #6b7280;
      padding-left: 40px !important;
      background-color: transparent !important;
      height: 36px !important;
      line-height: 36px !important;
      box-shadow: none !important;

      &:hover {
        color: #111827 !important;
        background-color: rgba(0,0,0,0.04) !important;
      }
    }

    .ant-menu-item-selected {
      color: ${(p) => p.theme.token.colorPrimary} !important;
      font-weight: 600 !important;
      background-color: rgba(255, 56, 92, 0.06) !important;
      box-shadow: none !important;

      &:hover {
        color: ${(p) => p.theme.token.colorPrimary} !important;
        background-color: rgba(255, 56, 92, 0.06) !important;
      }
    }
  }

  /* Widget item shake when locked and clicked */
  .widget-menu-item-shake.ant-menu-item {
    animation: ${shake} 0.4s ease-in-out;
  }
  .ant-menu-submenu.widget-menu-item-shake .ant-menu-submenu-title {
    animation: ${shake} 0.4s ease-in-out;
  }
`;

/* ─── Footer ───────────────────────────────────────────────────── */
const FooterActionsContainer = styled.div`
  padding: 10px 14px 16px;
  border-top: 1px solid #EBEBEB;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FooterBtn = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
  background: transparent;

  &:hover {
    background: rgba(0,0,0,0.05);
    color: #111827;
    text-decoration: none;
  }
`;

/* ─── Mobile sidebar ───────────────────────────────────────────── */
const MobileSidebarOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  z-index: 1020;

  @media (min-width: 1025px) { display: none; }
`;

const MobileSidebarContainer = styled(motion.div)`
  position: fixed;
  left: 10px;
  top: 24px;
  width: 300px;
  max-width: calc(100vw - 48px);
  height: calc(100vh - 150px);
  max-height: calc(100vh - 48px);
  background: #F8F9FA;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1030;

  @media (min-width: 1025px) { display: none; }
`;

const MobileExpandableButton = styled(motion.div)`
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 1001;

  @media (min-width: 1025px) { display: none; }
`;

const ExpandableButtonContent = styled(motion.div)`
  display: flex;
  align-items: center;
  background: ${(p) => p.theme.token.colorPrimary};
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  cursor: pointer;
  overflow: hidden;
`;

const ButtonIcon = styled(motion.div)`
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const ButtonText = styled(motion.span)`
  color: white;
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  padding-right: 18px;
  overflow: hidden;
`;

const MobileHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #EBEBEB;
  flex-shrink: 0;
`;

const MobileCloseButton = styled(motion.button)`
  background: #f3f4f6;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
`;

const MobileMenuContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 4px 10px 8px;
  scrollbar-width: thin;
`;

const MobileFooterContainer = styled.div`
  padding: 12px 14px 18px;
  border-top: 1px solid #EBEBEB;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
`;

const MobileFooterBtn = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  transition: background 0.15s ease;

  &:hover {
    background: #e5e7eb;
    text-decoration: none;
    color: #111827;
  }
`;

/* ─── Motion variants ──────────────────────────────────────────── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const sidebarVariants = {
  hidden: { scale: 0.2, opacity: 0, borderRadius: "50px" },
  visible: {
    scale: 1, opacity: 1, borderRadius: "20px",
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
};

const expandableButtonVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 300 } },
};

/* ─── Menu config (grouped) ────────────────────────────────────── */
const menuGroupsConfig =[
  {
    groupKey: "main",
    label: "Main Menu",
    items:[
      {
        key: "overview",
        label: "Dashboard",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/upjgggre.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            inState="in-home"
          />
        ),
      },
      {
        key: "listings",
        label: "My Experiences",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/yraqammt.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            inState="in-newspaper"
          />
        ),
      },
      {
        key: "schedules",
        label: "Schedules",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/uoljexdg.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            inState="in-calendar"
          />
        ),
      },
      {
        key: "bookings",
        label: "Bookings",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/bushiqea.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            state="in-booking"
          />
        ),
        children:[
          { key: "bookings/active",  label: "Active Bookings" },
          { key: "bookings/history", label: "Booking History" },
        ],
      },
    ],
  },
  {
    groupKey: "manage",
    label: "Manage",
    items:[
      {
        key: "people",
        label: "People",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/mudwpdhy.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            inState="in-build"
          />
        ),
        children:[
          { key: "guests",   label: "Guests" },
          { key: "reviews",  label: "Reviews" },
          { key: "staff",    label: "Staff" },
          { key: "messages", label: "Messages" },
        ],
      },
      {
        key: "financials",
        label: "Financials",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/yycecovd.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            inState="in-wallet"
          />
        ),
        children:[
          { key: "revenue", label: "Revenue" },
          { key: "payouts", label: "Payouts" },
        ],
      },
      {
        key: "growth",
        label: "Marketing",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/excswhey.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            inState="in-trend-up"
          />
        ),
        children:[
          { key: "trends",    label: "Booking Trends" },
          { key: "discounts", label: "Discounts" },
          { key: "email-campaigns", label: "Email Campaigns" },
        ],
      },
    ],
  },
  {
    groupKey: "platform",
    label: "Platform",
    items:[
      {
        key: "widget",
        label: "Booking Widget",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/axroojxh.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
          />
        ),
      },
      {
        key: "memberships",
        label: "Memberships",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/mudwpdhy.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
          />
        ),
        children: [
          { key: "memberships/products", label: "My Plans" },
          { key: "memberships/members", label: "Members" },
        ],
      },
      {
        key: "settings",
        label: "Settings",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/lrubprlz.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={true}
            state="in-code"
          />
        ),
      },
    ],
  },
];

const allMenuItems = menuGroupsConfig.flatMap((g) => g.items);

const menuItemPermissions = {
  overview:    "access_business_dashboard",
  listings:    "manage_own_classes",
  schedules:   "manage_own_classes",
  bookings:    "view_own_business_bookings",
  guests:      "view_business_students",
  reviews:     "view_own_business_reviews",
  revenue:     "view_business_revenue_analytics",
  payouts:     "view_business_revenue_analytics",
  discounts:   "manage_own_business_discounts",
  trends:      "view_own_booking_analytics",
  "email-campaigns": ["manage_email_marketing", "manage_own_classes"],
  widget:      "manage_own_business_profile",
  staff:       "manage_business_staff",
  messages:    "view_own_business_bookings",
  settings:    "manage_own_business_profile",
  "memberships/products": "manage_own_classes",
  "memberships/members":  "manage_own_classes",
};

/* ─── Component ────────────────────────────────────────────────── */
const SideMenuComponent = memo(
  forwardRef(({ onMenuSelect, activeKey }, ref) => {
    const[isMobile, setIsMobile]                       = useState(false);
    const [drawerVisible, setDrawerVisible]             = useState(false);
    const [openKeys, setOpenKeys]                       = useState([]);
    const[businessData, setBusinessData]               = useState(null);
    const [loadingBusiness, setLoadingBusiness]         = useState(true);
    const [businessError, setBusinessError]             = useState(null);
    const[transformOrigin, setTransformOrigin]         = useState("bottom left");
    const [shakeWidget, setShakeWidget]                 = useState(false);
    const [shakeMemberships, setShakeMemberships]       = useState(false);
    const [showUpgradeModal, setShowUpgradeModal]       = useState(false);
    const [showMembershipsUpgradeModal, setShowMembershipsUpgradeModal] = useState(false);
    const router = useRouter();

    const { user } = useAuth();
    const permissions = user?.permissions ||[];
    const { hasWidgetAccess, hasMembershipAccess } = useSubscription();

    const isBusinessClickable =
      !loadingBusiness && !businessError && businessData && !businessData._isPlaceholder;

    const businessClickHandler =
      isBusinessClickable && businessData.slug
        ? () => router.push(`/business/${businessData.slug}`)
        : undefined;

    const mobileButtonRef = useRef(null);

    const homeMenuRef           = useRef(null);
    const listingsMenuRef       = useRef(null);
    const activeBookingsMenuRef = useRef(null);
    const managementMenuRef     = useRef(null);
    const financialsMenuRef     = useRef(null);
    const growthMenuRef         = useRef(null);
    const platformMenuRef       = useRef(null);
    const widgetMenuRef         = useRef(null);
    const membershipsMenuRef   = useRef(null);

    useImperativeHandle(ref, () => ({
      homeMenuRef,
      listingsMenuRef,
      activeBookingsMenuRef,
      managementMenuRef,
      financialsMenuRef,
      growthMenuRef,
      platformMenuRef,
      openSettingsDrawer: (tab = "general", sectionId = null) => {
        if (sectionId) {
          sessionStorage.setItem("scrollToSection", sectionId);
        } else {
          sessionStorage.removeItem("scrollToSection");
        }
        router.push(`/business/dashboard/settings${tab !== "general" ? `?tab=${tab}` : ""}`);
      },
      closeSettingsDrawer: () => {},
      getBusinessSettingsRef: () => null,
    }));

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (drawerVisible && mobileButtonRef.current && isMobile) {
        const buttonRect = mobileButtonRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mL = 10, mT = 24;
        const mW = Math.min(300, vw - 48);
        const mH = Math.min(vh - 150, vh - 48);
        const bX = buttonRect.left + buttonRect.width / 2;
        const bY = buttonRect.top  + buttonRect.height / 2;
        const oX = Math.max(0, Math.min(100, ((bX - mL) / mW) * 100));
        const oY = Math.max(0, Math.min(100, ((bY - mT) / mH) * 100));
        setTransformOrigin(`${oX}% ${oY}%`);
      }
    },[drawerVisible, isMobile]);

    const fetchBusinessProfile = useCallback(async () => {
      setLoadingBusiness(true);
      setBusinessError(null);
      try {
        const result = await businessService.getMyBusinessProfile();
        if (result.success && result.data) {
          setBusinessData(result.data);
        } else if (result.status === 404) {
          setBusinessData({
            businessName: "Create Business Profile",
            businessImage: null,
            businessType: "Not set",
            _isPlaceholder: true,
          });
        } else {
          setBusinessError(result.error || "Failed to load business info");
          setBusinessData(null);
        }
      } catch {
        setBusinessError("Network error occurred while fetching profile");
        setBusinessData(null);
      } finally {
        setLoadingBusiness(false);
      }
    },[]);

    useEffect(() => { fetchBusinessProfile(); }, [fetchBusinessProfile]);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= 1024);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    },[]);

    useEffect(() => {
      const parentKey = allMenuItems.find(
        (item) => item.children?.some((child) => child.key === activeKey)
      )?.key;
      if (parentKey) {
        if (parentKey === "memberships" && !hasMembershipAccess) {
          return;
        }
        setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [parentKey]));
      }
    }, [activeKey, hasMembershipAccess]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const forcedTab = sessionStorage.getItem("forceOpenSettingsTab");
      if (forcedTab) {
        sessionStorage.removeItem("forceOpenSettingsTab");
        router.push(`/business/dashboard/settings${forcedTab !== "general" ? `?tab=${forcedTab}` : ""}`);
        fetchBusinessProfile();
      }
    }, [fetchBusinessProfile, router]);

    const handleMenuClick = (e) => {
      if (e.key === "widget" && !hasWidgetAccess) {
        e.domEvent?.preventDefault?.();
        setShakeWidget(true);
        setTimeout(() => {
          setShowUpgradeModal(true);
          setShakeWidget(false);
        }, 400);
        if (isMobile) setDrawerVisible(false);
        return;
      }
      const membershipsKeys = ["memberships", "memberships/products", "memberships/members"];
      if (membershipsKeys.includes(e.key) && !hasMembershipAccess) {
        e.domEvent?.preventDefault?.();
        setShakeMemberships(true);
        setTimeout(() => {
          setShowMembershipsUpgradeModal(true);
          setShakeMemberships(false);
        }, 400);
        if (isMobile) setDrawerVisible(false);
        return;
      }
      onMenuSelect(e.key);
      if (isMobile) setDrawerVisible(false);
    };

    const handleOpenChange = (keys) => {
      if (!hasMembershipAccess) {
        const attemptingOpenMemberships =
          keys.includes("memberships") && !openKeys.includes("memberships");
        if (attemptingOpenMemberships) {
          setShakeMemberships(true);
          setTimeout(() => {
            setShowMembershipsUpgradeModal(true);
            setShakeMemberships(false);
          }, 400);
        }
        setOpenKeys(keys.filter((k) => k !== "memberships"));
        return;
      }

      const latestOpenKey = keys.find((k) => !openKeys.includes(k));
      if (allMenuItems.some((item) => item.key === latestOpenKey && item.children)) {
        setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
      } else if (latestOpenKey) {
        setOpenKeys(keys);
      } else {
        setOpenKeys([]);
      }
    };

    const handleMenuItemHover = useCallback((e, isEntering) => {
      const menuItem = e.currentTarget;
      const icon = menuItem.querySelector("lord-icon");
      if (icon) {
        try {
          if (isEntering && icon.playerInstance) {
            icon.playerInstance.playFromBeginning();
          }
        } catch (_err) { /* ignore */ }
      }
    },[]);

    const updateIconColors = useCallback((menuItem, isSelected, isHovering = false, isSubmenuTitle = false) => {
      const icon = menuItem.querySelector("lord-icon");
      if (icon) {
        const isDropdownParent = menuItem.classList.contains("ant-menu-submenu-title") || isSubmenuTitle;
        if (isSelected && !isDropdownParent) {
          icon.setAttribute("colors", `primary:${augmentedTheme.token.colorPrimary},secondary:${augmentedTheme.token.colorPrimary}`);
        } else if (isHovering || (isDropdownParent && isSelected)) {
          icon.setAttribute("colors", `primary:${augmentedTheme.token.colorPrimary},secondary:${augmentedTheme.token.colorPrimary}`);
        } else {
          icon.setAttribute("colors", "primary:#9ca3af,secondary:#9ca3af");
        }
      }
    },[]);

    useEffect(() => {
      const updateAll = () => {
        const menuItems = document.querySelectorAll(".ant-menu-item, .ant-menu-submenu-title");
        menuItems.forEach((item) => {
          const isSelected =
            item.classList.contains("ant-menu-item-selected") ||
            item.parentElement.classList.contains("ant-menu-submenu-selected") ||
            item.parentElement.classList.contains("ant-menu-submenu-open");
          const isSubmenuTitle = item.classList.contains("ant-menu-submenu-title");
          updateIconColors(item, isSelected, false, isSubmenuTitle);
        });
      };
      const tid = setTimeout(updateAll, 100);
      return () => clearTimeout(tid);
    }, [activeKey, openKeys, updateIconColors]);

    const getMenuItemsForAntd = useMemo(() => {
      const attachRefToLabel = (label, key) => {
        const refMap = {
          overview:    homeMenuRef,
          listings:    listingsMenuRef,
          bookings:    activeBookingsMenuRef,
          people:      managementMenuRef,
          memberships: membershipsMenuRef,
          financials:  financialsMenuRef,
          growth:      growthMenuRef,
          widget:      widgetMenuRef,
          settings:    platformMenuRef,
        };
        const r = refMap[key];
        return r ? <span ref={r}>{label}</span> : label;
      };

      const widgetLabel = hasWidgetAccess
        ? attachRefToLabel("Booking Widget", "widget")
        : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 2 }}>
              <span ref={widgetMenuRef}>Booking Widget</span>
              <Lock size={14} style={{ flexShrink: 0, color: "#9ca3af" }} />
            </span>
          );
      const membershipsLabel = hasMembershipAccess
        ? attachRefToLabel("Memberships", "memberships")
        : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 2 }}>
              <span ref={membershipsMenuRef}>Memberships</span>
              <Lock size={14} style={{ flexShrink: 0, color: "#9ca3af" }} />
            </span>
          );

      const hasPermission = (key) => {
        const required = menuItemPermissions[key];
        if (!required) return true;
        const check = (codename) =>
          permissions.some((p) => {
            const parts = p.split(".");
            return parts.length === 2 && parts[1] === codename;
          });
        return Array.isArray(required) ? required.some(check) : check(required);
      };

      return menuGroupsConfig
        .map((group) => {
          const visibleItems = group.items.reduce((acc, item) => {
            if (item.children) {
              const visibleChildren = item.children.filter((c) => hasPermission(c.key));
              if (visibleChildren.length > 0) {
                acc.push({
                  key: item.key,
                  icon: item.icon,
                  label: item.key === "memberships" ? membershipsLabel : attachRefToLabel(item.label, item.key),
                  className: item.key === "memberships" && shakeMemberships ? "widget-menu-item-shake" : undefined,
                  onMouseEnter: ({ domEvent }) => handleMenuItemHover(domEvent, true),
                  onMouseLeave: ({ domEvent }) => handleMenuItemHover(domEvent, false),
                  children: visibleChildren.map((c) => ({
                    key: c.key,
                    label: c.label,
                    onMouseEnter: ({ domEvent }) => handleMenuItemHover(domEvent, true),
                    onMouseLeave: ({ domEvent }) => handleMenuItemHover(domEvent, false),
                  })),
                });
              }
            } else if (hasPermission(item.key)) {
              acc.push({
                key: item.key,
                icon: item.icon,
                label: item.key === "widget" ? widgetLabel : attachRefToLabel(item.label, item.key),
                className: item.key === "widget" && shakeWidget ? "widget-menu-item-shake" : undefined,
                onMouseEnter: ({ domEvent }) => handleMenuItemHover(domEvent, true),
                onMouseLeave: ({ domEvent }) => handleMenuItemHover(domEvent, false),
              });
            }
            return acc;
          },[]);

          if (visibleItems.length === 0) return null;
          return { type: "group", label: group.label, children: visibleItems };
        })
        .filter(Boolean);
    },[handleMenuItemHover, permissions, hasWidgetAccess, hasMembershipAccess, shakeWidget, shakeMemberships]);

    /* ── Render helpers ── */

    const renderLogoOrAvatar = (size = 34) =>
      businessData?.business_image_medium_url ? (
        <BusinessLogoImg
          src={businessData.business_image_medium_url}
          alt={`${businessData.businessName} Logo`}
          style={{ width: size, height: size }}
        />
      ) : (
        <Avatar
          size={size}
          style={{
            backgroundColor: augmentedTheme.token.colorPrimary,
            borderRadius: 8,
            flexShrink: 0,
            fontWeight: 700,
            fontSize: size * 0.4,
          }}
        >
          {businessData?.businessName?.charAt(0) ?? "B"}
        </Avatar>
      );

    const renderProfileCardContent = () => {
      if (loadingBusiness) {
        return (
          <>
            <Skeleton.Avatar active size={34} shape="square" style={{ borderRadius: 8 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton title={{ width: "70%" }} paragraph={false} active className="header-skeleton-title" />
              <Skeleton title={{ width: "50%" }} paragraph={false} active className="header-skeleton-type" />
            </div>
          </>
        );
      }
      if (businessError) {
        return (
          <>
            <Avatar size={34} icon={<AlertCircle size={18} />} style={{ backgroundColor: augmentedTheme.token.colorError, borderRadius: 8, flexShrink: 0 }} />
            <BusinessTextBlock>
              <BusinessNameText style={{ color: augmentedTheme.token.colorError }}>Error</BusinessNameText>
              <BusinessTypeText>Profile load failed</BusinessTypeText>
            </BusinessTextBlock>
          </>
        );
      }
      return (
        <>
          {renderLogoOrAvatar()}
          <BusinessTextBlock>
            <BusinessNameText title={businessData?.businessName}>
              {businessData?.businessName}
            </BusinessNameText>
            <BusinessTypeText title={getBusinessTypeLabel(businessData?.businessType)}>
              {getBusinessTypeLabel(businessData?.businessType)}
            </BusinessTypeText>
          </BusinessTextBlock>
          <ChevronRight size={14} style={{ color: "#d1d5db", flexShrink: 0 }} />
        </>
      );
    };

    const renderMenu = (containerClass = "") => (
      <MenuContainer className={containerClass}>
        <StyledAntMenu
          mode="inline"
          selectedKeys={[activeKey]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          items={getMenuItemsForAntd}
        />
      </MenuContainer>
    );

    const renderFooterActions = () => {
      if (loadingBusiness || businessError || !businessData || businessData._isPlaceholder) {
        return (
          <FooterBtn href="/business/help/">
            <AlertCircle size={15} />
            Get Help
          </FooterBtn>
        );
      }
      return (
        <>
          {businessData.slug && (
            <FooterBtn href={`/business/${businessData.slug}`}>
              <Eye size={15} />
              Preview page
            </FooterBtn>
          )}
          <FooterBtn href="/business/help/">
            <AlertCircle size={15} />
            Help &amp; Docs
          </FooterBtn>
        </>
      );
    };

    const renderMobileFooter = () => {
      if (loadingBusiness || businessError || !businessData || businessData._isPlaceholder) {
        return (
          <MobileFooterBtn href="/business/help/" onClick={() => setDrawerVisible(false)}>
            <AlertCircle size={14} /> Get Help
          </MobileFooterBtn>
        );
      }
      return (
        <>
          {businessData.slug && (
            <MobileFooterBtn href={`/business/${businessData.slug}`} onClick={() => setDrawerVisible(false)}>
              <Eye size={14} /> Preview
            </MobileFooterBtn>
          )}
          <MobileFooterBtn href="/business/help/" onClick={() => setDrawerVisible(false)}>
            <AlertCircle size={14} /> Help
          </MobileFooterBtn>
        </>
      );
    };

    return (
      <ThemeProvider theme={augmentedTheme}>
        <LocalGlobalStyleForSkeleton />
        <WidgetUpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        <MembershipsUpgradeModal open={showMembershipsUpgradeModal} onClose={() => setShowMembershipsUpgradeModal(false)} />
        <SideMenuWrapper>
          {/* ── Desktop ── */}
          <DesktopSideMenu className="desktop-sidemenu" initial={false}>
            <ProfileCardArea>
              <BusinessProfileCard
                $clickable={!!businessClickHandler}
                onClick={businessClickHandler}
                title={isBusinessClickable ? "Preview your public page" : undefined}
              >
                {renderProfileCardContent()}
              </BusinessProfileCard>
            </ProfileCardArea>

            {renderMenu()}

            <FooterActionsContainer>
              {renderFooterActions()}
            </FooterActionsContainer>
          </DesktopSideMenu>

          {/* ── Mobile ── */}
          {isMobile && (
            <>
              <AnimatePresence>
                {!drawerVisible && (
                  <MobileExpandableButton
                    ref={mobileButtonRef}
                    variants={expandableButtonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <ExpandableButtonContent
                      initial={{ width: 52 }}
                      whileHover={{ width: 120 }}
                      onClick={() => setDrawerVisible(true)}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    >
                      <ButtonIcon>
                        <SidebarOpen size={22} />
                      </ButtonIcon>
                      <ButtonText
                        initial={{ opacity: 0, x: -8 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.05 }}
                      >
                        Menu
                      </ButtonText>
                    </ExpandableButtonContent>
                  </MobileExpandableButton>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {drawerVisible && (
                  <>
                    <MobileSidebarOverlay
                      variants={overlayVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      onClick={() => setDrawerVisible(false)}
                    />
                    <MobileSidebarContainer
                      variants={sidebarVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      style={{ transformOrigin }}
                    >
                      <MobileHeaderContainer>
                        <BusinessProfileCard
                          style={{ flex: 1, marginRight: 10 }}
                          $clickable={false}
                        >
                          {renderProfileCardContent()}
                        </BusinessProfileCard>
                        <MobileCloseButton
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDrawerVisible(false)}
                        >
                          <X size={18} />
                        </MobileCloseButton>
                      </MobileHeaderContainer>

                      <MobileMenuContainer>
                        <StyledAntMenu
                          mode="inline"
                          selectedKeys={[activeKey]}
                          openKeys={openKeys}
                          onOpenChange={handleOpenChange}
                          onClick={handleMenuClick}
                          items={getMenuItemsForAntd}
                        />
                      </MobileMenuContainer>

                      <MobileFooterContainer>
                        {renderMobileFooter()}
                      </MobileFooterContainer>
                    </MobileSidebarContainer>
                  </>
                )}
              </AnimatePresence>
            </>
          )}

        </SideMenuWrapper>
      </ThemeProvider>
    );
  })
);

SideMenuComponent.displayName = "SideMenuComponent";
export default SideMenuComponent;