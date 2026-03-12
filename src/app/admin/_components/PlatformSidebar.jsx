"use client";

import React, {
  useState,
  useEffect,
  memo,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "antd";
import { X, LayoutGrid, SidebarOpen, Eye, AlertCircle } from "lucide-react";
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

  @media (max-width: 1024px) {
    .desktop-sidemenu {
      display: none;
    }
  }
`;

/* ─── Desktop sidebar ───────────────────────────────────────────── */
const DesktopSideMenu = styled(motion.div)`
  width: 260px;
  border-right: 1px solid #ebebeb;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
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

const AdminTextBlock = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const AdminNameText = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const AdminSubtitleText = styled.div`
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  margin-top: 1px;
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

const PlatformSidebar = memo(({ onMenuSelect, activeKey }) => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
  );
  const [openKeys, setOpenKeys] = useState([]);
  const [transformOrigin, setTransformOrigin] = useState("bottom left");
  const mobileButtonRef = useRef(null);

  const hasPermission = useCallback(
    (key) => {
      const required = ADMIN_TAB_PERMISSIONS[key];
      if (!required) return true;
      return permissions.some((p) => p === required);
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
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (drawerVisible && mobileButtonRef.current && isMobile) {
      const buttonRect = mobileButtonRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mL = 10,
        mT = 24;
      const mW = Math.min(300, vw - 48);
      const mH = Math.min(vh - 150, vh - 48);
      const bX = buttonRect.left + buttonRect.width / 2;
      const bY = buttonRect.top + buttonRect.height / 2;
      const oX = Math.max(0, Math.min(100, ((bX - mL) / mW) * 100));
      const oY = Math.max(0, Math.min(100, ((bY - mT) / mH) * 100));
      setTransformOrigin(`${oX}% ${oY}%`);
    }
  }, [drawerVisible, isMobile]);

  const handleMenuClick = useCallback(
    (e) => {
      onMenuSelect(e.key);
      if (isMobile) setDrawerVisible(false);
    },
    [onMenuSelect, isMobile]
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

  const renderProfileCard = () => (
    <AdminProfileCard>
      <AdminLogoIcon>
        <LayoutGrid size={18} strokeWidth={2.5} />
      </AdminLogoIcon>
      <AdminTextBlock>
        <AdminNameText>Platform Admin</AdminNameText>
        <AdminSubtitleText>Platform Management</AdminSubtitleText>
      </AdminTextBlock>
    </AdminProfileCard>
  );

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

  const renderFooterActions = () => (
    <>
      <FooterBtn href="/">
        <Eye size={15} />
        View Platform
      </FooterBtn>
      <FooterBtn href="/business/help/">
        <AlertCircle size={15} />
        Help &amp; Docs
      </FooterBtn>
    </>
  );

  const renderMobileFooter = () => (
    <>
      <MobileFooterBtn href="/" onClick={() => setDrawerVisible(false)}>
        <Eye size={14} /> Preview
      </MobileFooterBtn>
      <MobileFooterBtn href="/business/help/" onClick={() => setDrawerVisible(false)}>
        <AlertCircle size={14} /> Help
      </MobileFooterBtn>
    </>
  );

  return (
    <ThemeProvider theme={appTheme}>
      <SidebarWrapper>
        <DesktopSideMenu className="desktop-sidemenu" initial={false}>
          <ProfileCardArea>{renderProfileCard()}</ProfileCardArea>
          {renderMenu()}
          <FooterActionsContainer>{renderFooterActions()}</FooterActionsContainer>
        </DesktopSideMenu>

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
                      {renderProfileCard()}
                      <MobileCloseButton
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDrawerVisible(false)}
                        aria-label="Close Menu"
                      >
                        <X size={18} />
                      </MobileCloseButton>
                    </MobileHeaderContainer>
                    <MobileMenuContainer>{renderMenu()}</MobileMenuContainer>
                    <MobileFooterContainer>
                      {renderMobileFooter()}
                    </MobileFooterContainer>
                  </MobileSidebarContainer>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </SidebarWrapper>
    </ThemeProvider>
  );
});

PlatformSidebar.displayName = "PlatformSidebar";

export default PlatformSidebar;
