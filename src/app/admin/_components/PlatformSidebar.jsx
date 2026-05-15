"use client";

import React, {
  useState,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "antd";
import { X, LayoutGrid, SidebarOpen, Eye, AlertCircle, Users, Building2, BookOpen, MessageSquare } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";
import { theme as appTheme } from "@/components/theme";
import { useAuth } from "@/lib/auth-client";
import { ADMIN_TAB_PERMISSIONS } from "../adminTabsConfig";

/* ─── Wrapper ────────────────────────────────────────────────────── */
const SidebarWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${(p) => p.theme?.token?.fontFamily || "inherit"};

  @media (max-width: 767px) {
    .desktop-sidemenu {
      display: none;
    }
  }
`;

/* ─── Desktop sidebar ───────────────────────────────────────────── */
const DesktopSideMenu = styled(motion.div)`
  width: ${(p) => (p.$collapsed ? "72px" : "260px")};
  border-right: 1px solid #ebebeb;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  transition: width 0.2s ease;
`;

/* ─── Profile card area ─────────────────────────────────────────── */
const ProfileCardArea = styled.div`
  padding: 14px 14px 10px;
  flex-shrink: 0;
`;

const AdminProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: default;
  overflow: hidden;
`;

const AdminLogoIcon = styled.div`
  width: 34px;
  height: 34px;
  background-color: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
`;

/* ─── Menu container ─────────────────────────────────────────────── */
const MenuContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 10px 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 2px;
  }
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
`;

/* ─── Ant Design Menu overrides (match business SideMenu) ────────── */
const StyledAntMenu = styled(Menu)`
  border-right: none !important;
  background: transparent !important;

  .ant-menu-item-group-title {
    font-size: 10.5px !important;
    font-weight: 700 !important;
    letter-spacing: 0.07em !important;
    color: #111827 !important;
    text-transform: uppercase !important;
    padding: 14px 10px 5px !important;
    line-height: 1 !important;
  }

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
      background-color: rgba(0, 0, 0, 0.045) !important;

      lord-icon {
        --lord-icon-primary: #111827;
        --lord-icon-secondary: #111827;
      }
    }
  }

  .ant-menu-item-selected {
    background-color: #ffffff !important;
    color: #111827 !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;

    lord-icon {
      --lord-icon-primary: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"} !important;
      --lord-icon-secondary: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"} !important;
    }

    &::after {
      display: none;
    }

    &:hover {
      background-color: #ffffff !important;
      color: #111827 !important;
    }
  }

  .ant-menu-submenu-selected > .ant-menu-submenu-title,
  .ant-menu-submenu-open > .ant-menu-submenu-title {
    color: #111827 !important;
    font-weight: 600 !important;
    background-color: rgba(0, 0, 0, 0.04) !important;

    lord-icon {
      --lord-icon-primary: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"};
      --lord-icon-secondary: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"};
    }
  }

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
        background-color: rgba(0, 0, 0, 0.04) !important;
      }
    }

    .ant-menu-item-selected {
      color: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"} !important;
      font-weight: 600 !important;
      background-color: rgba(255, 56, 92, 0.06) !important;
      box-shadow: none !important;

      &:hover {
        color: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"} !important;
        background-color: rgba(255, 56, 92, 0.06) !important;
      }
    }
  }
`;

/* ─── Footer ─────────────────────────────────────────────────────── */
const FooterActionsContainer = styled.div`
  padding: 10px 14px 16px;
  border-top: 1px solid #ebebeb;
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
    background: rgba(0, 0, 0, 0.05);
    color: #111827;
    text-decoration: none;
  }
`;

/* ─── Mobile ─────────────────────────────────────────────────────── */
const MobileSidebarOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 1020;

  @media (min-width: 1025px) {
    display: none;
  }
`;

const MobileSidebarContainer = styled(motion.div)`
  position: fixed;
  left: 10px;
  top: 24px;
  width: 300px;
  max-width: calc(100vw - 48px);
  height: calc(100vh - 150px);
  max-height: calc(100vh - 48px);
  background: #f8f9fa;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1030;

  @media (min-width: 1025px) {
    display: none;
  }
`;

/* ─── Bottom nav (mobile only) ───────────────────────────────────── */
const BottomNavBar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  padding: 0 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    display: none;
  }
`;

const BottomNavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 10px;
  color: ${(p) => (p.$active ? (p.theme?.token?.colorPrimary || "#ff385c") : "#6b7280")};
  font-size: 10px;
  font-weight: ${(p) => (p.$active ? "600" : "500")};
  text-decoration: none;
  min-width: 56px;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
  }
`;

const MobileExpandableButton = styled(motion.div)`
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 1001;

  @media (min-width: 1025px) {
    display: none;
  }
`;

const ExpandableButtonContent = styled(motion.div)`
  display: flex;
  align-items: center;
  background: ${(p) => p.theme?.token?.colorPrimary || "#ff385c"};
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
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
  border-bottom: 1px solid #ebebeb;
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
  border-top: 1px solid #ebebeb;
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

/* ─── Motion variants ───────────────────────────────────────────── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const sidebarVariants = {
  hidden: { scale: 0.2, opacity: 0, borderRadius: "50px" },
  visible: {
    scale: 1,
    opacity: 1,
    borderRadius: "20px",
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
};

const expandableButtonVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 300 } },
};

/* ─── Menu groups config (per plan) ──────────────────────────────── */
const menuGroupsConfig = [
  {
    groupKey: "overview",
    label: "Overview",
    items: [
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
    ],
  },
  {
    groupKey: "user-mgmt",
    label: "User Management",
    items: [
      {
        key: "user-management",
        label: "User Management",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/mdgrhyca.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
          />
        ),
        children: [
          { key: "users", label: "Users" },
          { key: "roles", label: "Roles & Permissions" },
          { key: "audit", label: "Audit Log" },
        ],
      },
    ],
  },
  {
    groupKey: "business-mgmt",
    label: "Business Management",
    items: [
      {
        key: "business-management",
        label: "Business Management",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/yraqammt.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
            inState="in-newspaper"
          />
        ),
        children: [
          { key: "business-overview", label: "Analytics" },
          { key: "business-listings", label: "Listings" },
          { key: "business-verification", label: "Verification" },
        ],
      },
    ],
  },
  {
    groupKey: "class-mgmt",
    label: "Class Management",
    items: [
      {
        key: "class-management",
        label: "Class Management",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/nocovwne.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
          />
        ),
        children: [
          { key: "class-listings", label: "Listing Management" },
          { key: "collections", label: "Collections" },
          { key: "class-reviews", label: "Reviews" },
        ],
      },
    ],
  },
  {
    groupKey: "bookings-payments",
    label: "Bookings & Payments",
    items: [
      {
        key: "bookings-payments",
        label: "Bookings & Payments",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/uoljexdg.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
            state="in-booking"
          />
        ),
        children: [
          { key: "all-bookings", label: "All Bookings" },
          { key: "corporate-inquiries", label: "Corporate" },
          { key: "payments", label: "Payments" },
          { key: "payouts", label: "Payouts" },
        ],
      },
    ],
  },
  {
    groupKey: "marketing",
    label: "Marketing",
    items: [
      {
        key: "marketing",
        label: "Marketing",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/excswhey.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
            inState="in-trend-up"
          />
        ),
        children: [
          { key: "global-discounts", label: "Global Discounts" },
          { key: "widget-subscriptions", label: "Widget Subscriptions" },
        ],
      },
    ],
  },
  {
    groupKey: "content",
    label: "Content",
    items: [
      {
        key: "blog",
        label: "Blog",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/nocovwne.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
          />
        ),
      },
    ],
  },
  {
    groupKey: "support-comms",
    label: "Support & Comms",
    items: [
      {
        key: "support-comms",
        label: "Support & Comms",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/lrubprlz.json"
            colors="primary:#666,secondary:#666"
            size="20px"
            playOnLoad={false}
            trigger="hover"
            state="in-code"
          />
        ),
        children: [
          { key: "support", label: "Support Tickets" },
          { key: "conversations", label: "Conversations" },
        ],
      },
    ],
  },
];

const allMenuKeys = new Set();
menuGroupsConfig.forEach((g) => {
  g.items.forEach((item) => {
    if (item.children) {
      allMenuKeys.add(item.key);
      item.children.forEach((c) => allMenuKeys.add(c.key));
    } else {
      allMenuKeys.add(item.key);
    }
  });
});

const BOTTOM_NAV_ITEMS = [
  { key: "overview", label: "Dashboard", icon: LayoutGrid },
  { key: "users", label: "Users", icon: Users },
  { key: "business-overview", label: "Business", icon: Building2 },
  { key: "all-bookings", label: "Bookings", icon: BookOpen },
  { key: "support", label: "Support", icon: MessageSquare },
];

const PlatformSidebar = memo(({ onMenuSelect, activeKey }) => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallMobile = width < 768;
  const isMobile = !isDesktop;
  const [openKeys, setOpenKeys] = useState([]);

  const hasPermission = useCallback(
    (key) => {
      const required = ADMIN_TAB_PERMISSIONS[key];
      if (!required) return true;
      const reqs = Array.isArray(required) ? required : [required];
      return reqs.some((perm) => permissions.some((p) => p === perm));
    },
    [permissions]
  );

  const getMenuItemsForAntd = useMemo(() => {
    return menuGroupsConfig
      .map((group) => {
        const visibleItems = group.items.reduce((acc, item) => {
          if (item.children) {
            const visibleChildren = item.children.filter((c) => hasPermission(c.key));
            if (visibleChildren.length > 0) {
              acc.push({
                key: item.key,
                icon: item.icon,
                label: item.label,
                children: visibleChildren.map((c) => ({
                  key: c.key,
                  label: c.label,
                })),
              });
            }
          } else if (hasPermission(item.key)) {
            acc.push({
              key: item.key,
              icon: item.icon,
              label: item.label,
            });
          }
          return acc;
        }, []);

        if (visibleItems.length === 0) return null;
        return { type: "group", label: group.label, children: visibleItems };
      })
      .filter(Boolean);
  }, [hasPermission]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const parentKey = menuGroupsConfig.find((g) =>
      g.items.some(
        (item) =>
          item.children && item.children.some((c) => c.key === activeKey)
      )
    )?.items?.find(
      (item) =>
        item.children && item.children.some((c) => c.key === activeKey)
    )?.key;
    if (parentKey) {
      setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [parentKey]));
    }
  }, [activeKey]);

  const handleMenuClick = useCallback(
    (e) => {
      onMenuSelect(e.key);
    },
    [onMenuSelect]
  );

  const handleOpenChange = useCallback((keys) => {
    setOpenKeys((prev) => {
      const latestOpenKey = keys.find((k) => !prev.includes(k));
      const isSubmenuKey = menuGroupsConfig.some((g) =>
        g.items.some((item) => item.key === latestOpenKey && item.children)
      );
      if (isSubmenuKey) {
        return latestOpenKey ? [latestOpenKey] : [];
      }
      if (latestOpenKey) return keys;
      return [];
    });
  }, []);


  const renderMenu = (containerClass = "", inlineCollapsed = false) => (
    <MenuContainer className={containerClass}>
      <StyledAntMenu
        mode="inline"
        inlineCollapsed={inlineCollapsed}
        selectedKeys={[activeKey]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleMenuClick}
        items={getMenuItemsForAntd}
      />
    </MenuContainer>
  );


  return (
    <ThemeProvider theme={appTheme}>
      <SidebarWrapper>
        {!isSmallMobile && (
          <DesktopSideMenu className="desktop-sidemenu" initial={false} $collapsed={isTablet}>
            {renderMenu("", isTablet)}
          </DesktopSideMenu>
        )}

        {isSmallMobile && (
          <BottomNavBar>
            {BOTTOM_NAV_ITEMS.filter((item) => hasPermission(item.key)).map((item) => {
              const Icon = item.icon;
              return (
                <BottomNavItem
                  key={item.key}
                  href={`/admin/${item.key}`}
                  $active={activeKey === item.key}
                >
                  <Icon size={20} strokeWidth={2} />
                  {item.label}
                </BottomNavItem>
              );
            })}
          </BottomNavBar>
        )}

      </SidebarWrapper>
    </ThemeProvider>
  );
});

PlatformSidebar.displayName = "PlatformSidebar";

export default PlatformSidebar;
