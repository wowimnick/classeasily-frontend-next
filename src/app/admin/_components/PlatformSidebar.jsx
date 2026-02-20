"use client";

import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "antd";
import { X, LayoutGrid, SidebarOpen } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";
import { theme as appTheme } from "@/components/theme";
import { useAuth } from "@/lib/auth-client";

const SidebarWrapper = styled.div`
  height: 100%;
  font-family: ${(props) => props.theme.token.fontFamily};

  @media (max-width: 1024px) {
    .desktop-sidebar {
      display: none;
    }
  }
`;

const DesktopSideMenu = styled(motion.div)`
  width: 280px;
  background: ${(props) => props.theme.token.colorBgContainer};
  box-shadow: 1px 0 8px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1000;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  flex-shrink: 0;
  min-height: 64px;
`;

const InfoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  min-width: 0;
  flex-grow: 1;
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background-color: ${(props) => props.theme.token.colorPrimary};
  color: ${(props) => props.theme.token.colorHeaderText};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  flex-shrink: 0;
`;

const TitleContainer = styled.div`
  overflow: hidden;
  min-width: 0;
  flex-grow: 1;
`;

const PlatformTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PlatformSubtitle = styled.p`
  font-size: 12px;
  margin: 0;
  color: ${(props) => props.theme.token.colorTextSecondary};
`;

const MenuContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.token.colorTextQuaternary};
    border-radius: ${(props) => props.theme.token.borderRadius}px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${(props) => props.theme.token.colorTextTertiary};
  }
  scrollbar-width: thin;
  scrollbar-color: ${(props) => props.theme.token.colorTextQuaternary}
    transparent;
`;

const FooterActionsContainer = styled.div`
  padding: 12px 20px;
  margin-top: auto;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  flex-shrink: 0;
`;

const StyledAntMenu = styled(Menu)`
  border-right: none !important;
  background: transparent !important;

  .ant-menu-item,
  .ant-menu-submenu-title {
    margin: 4px 0 !important;
    width: calc(100% - 16px) !important;
    margin-left: 8px !important;
    margin-right: 8px !important;
    padding: 0 16px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    height: 44px !important;
    line-height: 44px !important;
    color: ${(props) => props.theme.token.colorTextSecondary};
    font-weight: 400;
    font-size: 14px;

    .ant-menu-item-icon {
      display: inline-block !important;
      vertical-align: middle !important;
    }

    lord-icon {
      transition: all 0.3s ease;
      margin-right: 0 !important;
      vertical-align: middle;
      display: inline-block;
      pointer-events: none;
    }

    &:hover {
      color: ${(props) => props.theme.token.colorPrimary} !important;
      background-color: ${(props) =>
        props.theme.token.colorBgSpotlight} !important;

      lord-icon {
        transform: scale(1.1);
        --lord-icon-primary: ${(props) => props.theme.token.colorPrimary};
        --lord-icon-secondary: ${(props) => props.theme.token.colorPrimary};
      }
    }
  }

  .ant-menu-item-selected {
    background-color: ${(props) => props.theme.token.colorPrimary} !important;
    color: ${(props) => props.theme.token.colorHeaderText} !important;
    font-weight: 600 !important;

    lord-icon {
      --lord-icon-primary: ${(props) =>
        props.theme.token.colorHeaderText} !important;
      --lord-icon-secondary: ${(props) =>
        props.theme.token.colorHeaderText} !important;
      transform: scale(1);
    }

    &::after {
      display: none;
    }
    &:hover {
      background-color: ${(props) => props.theme.token.colorPrimary} !important;
      color: ${(props) => props.theme.token.colorHeaderText} !important;
      lord-icon {
        transform: scale(1);
        --lord-icon-primary: ${(props) =>
          props.theme.token.colorHeaderText} !important;
        --lord-icon-secondary: ${(props) =>
          props.theme.token.colorHeaderText} !important;
      }
    }
  }

  .ant-menu-submenu-selected > .ant-menu-submenu-title,
  .ant-menu-submenu-open > .ant-menu-submenu-title {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    font-weight: 600 !important;
    background-color: ${(props) =>
      props.theme.token.colorBgSpotlight} !important;

    lord-icon {
      --lord-icon-primary: ${(props) => props.theme.token.colorPrimary};
      --lord-icon-secondary: ${(props) => props.theme.token.colorPrimary};
    }
  }

  .ant-menu-sub.ant-menu-inline {
    background-color: transparent !important;

    .ant-menu-item {
      font-size: 13.5px;
      color: ${(props) => props.theme.token.colorTextSecondary};
      padding-left: 46px !important;
      background-color: transparent !important;
      height: 40px !important;
      line-height: 40px !important;

      &:hover {
        color: ${(props) => props.theme.token.colorPrimary} !important;
        background-color: ${(props) =>
          props.theme.token.colorBgSpotlight} !important;
      }
    }
    .ant-menu-item-selected {
      color: ${(props) => props.theme.token.colorPrimary} !important;
      font-weight: 600 !important;
      background-color: ${(props) =>
        props.theme.token.colorBgSpotlight} !important;

      &:hover {
        color: ${(props) => props.theme.token.colorPrimary} !important;
      }
    }
  }
`;

const MobileSidebarOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  width: 320px;
  max-width: calc(100vw - 48px);
  height: calc(100vh - 150px);
  max-height: calc(100vh - 48px);
  background: ${(props) => props.theme.token.colorBgContainer};
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
  background: ${(props) => props.theme.token.colorPrimary};
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  overflow: hidden;
  border: none;
  outline: none;
  user-select: none;
`;

const ButtonIcon = styled(motion.div)`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const ButtonText = styled(motion.span)`
  color: white;
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
  padding-right: 20px;
  overflow: hidden;
`;

const MobileHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  gap: 12px;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  flex-shrink: 0;
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 20px 20px 0 0;
`;

const MobileCloseButton = styled(motion.button)`
  background: ${(props) => props.theme.token.colorBgSpotlight};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.token.colorTextSecondary};
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
`;

const MobileMenuContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.token.colorTextQuaternary};
    border-radius: 2px;
  }
  scrollbar-width: thin;
`;

const MobileFooterContainer = styled.div`
  padding: 16px 24px 20px 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  flex-shrink: 0;
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 0 0 20px 20px;
`;

// Menu config: LordIcon on parents only; playOnLoad=false so icons don't replay on every nav
export const menuItems = [
  {
    key: "user-management",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/mdgrhyca.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={false}
        trigger="hover"
      />
    ),
    label: "User Management",
    children: [
      { key: "users", label: "Users" },
      { key: "roles", label: "Roles & Permissions" },
      { key: "audit", label: "Audit Log" },
    ],
  },
  {
    key: "business-management",
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
    label: "Business Management",
    children: [
      { key: "business-overview", label: "Business Overview" },
      { key: "business-listings", label: "Business Listings" },
      { key: "business-verification", label: "Business Verification" },
    ],
  },
  {
    key: "class-management",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/nocovwne.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={false}
        trigger="hover"
      />
    ),
    label: "Class Management",
    children: [
      { key: "class-listings", label: "Class Listings" },
      { key: "class-reviews", label: "Class Reviews" },
      { key: "collections", label: "Collections" },
    ],
  },
  {
    key: "all-bookings",
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
    label: "All Bookings",
  },
  {
    key: "payouts",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/yycecovd.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={false}
        trigger="hover"
        inState="in-wallet"
      />
    ),
    label: "Payouts",
  },
  {
    key: "global-discounts",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/nocovwne.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={false}
        trigger="hover"
      />
    ),
    label: "Global Discounts",
  },
  {
    key: "blog",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/nocovwne.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={false}
        trigger="hover"
      />
    ),
    label: "Blog",
  },
  {
    key: "support",
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
    label: "Support",
  },
  {
    key: "conversations",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/nocovwne.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={false}
        trigger="hover"
      />
    ),
    label: "Conversations",
  },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const sidebarVariants = {
  hidden: { scale: 0.2, opacity: 0, x: 0, y: 0, borderRadius: "50px" },
  visible: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    borderRadius: "20px",
    transition: { type: "spring", damping: 25, stiffness: 300, duration: 0.4 },
  },
};

const expandableButtonVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", damping: 15, stiffness: 300 },
  },
};

const buttonContentVariants = {
  collapsed: {
    width: 56,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
  expanded: {
    width: 140,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
};

const buttonTextVariants = {
  collapsed: { opacity: 0, x: -10, transition: { duration: 0.1 } },
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } },
};

const buttonIconVariants = {
  collapsed: { rotate: 0 },
  expanded: {
    rotate: 180,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
};

const closeButtonVariants = {
  hover: { scale: 1.1, rotate: 90 },
  tap: { scale: 0.95 },
};

const menuItemPermissions = {
  "all-bookings": "quickstart.view_booking",
  payouts: "quickstart.access_payout_admin",
  "global-discounts": "quickstart.access_global_discount_admin",
  blog: "quickstart.access_blog_admin",
  support: "quickstart.access_support_admin",
  conversations: "quickstart.access_support_admin",
  users: "quickstart.view_customuser",
  roles: "quickstart.view_role",
  audit: "quickstart.view_auditlog",
  "business-overview": "quickstart.view_business_metrics",
  "business-listings": "quickstart.view_businessinfo",
  "business-verification": "quickstart.view_all_verificationrequests",
  "class-listings": "quickstart.view_classesmain",
  "class-reviews": "quickstart.view_reviews",
  "collections": "quickstart.view_classcollection",
};

const PlatformSidebar = memo(({ onMenuSelect, activeKey }) => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
  );
  const [openKeys, setOpenKeys] = useState([]);
  const [transformOrigin, setTransformOrigin] = useState("bottom left");
  const mobileButtonRef = React.useRef(null);

  const permissionsKey = useMemo(
    () => (permissions || []).slice().sort().join(","),
    [permissions]
  );

  const getMenuItemsForAntd = useMemo(() => {
    const hasPermission = (key) => {
      const required = menuItemPermissions[key];
      if (!required) return true;
      return permissions.some((p) => p === required);
    };
    const filteredConfig = menuItems.reduce((acc, item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((child) =>
          hasPermission(child.key)
        );
        if (visibleChildren.length > 0) {
          acc.push({ ...item, children: visibleChildren });
        }
      } else if (hasPermission(item.key)) {
        acc.push(item);
      }
      return acc;
    }, []);
    return filteredConfig.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children?.map((child) => ({
        key: child.key,
        label: child.label,
      })),
    }));
  }, [permissionsKey]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const parentKey = menuItems.find((item) =>
      item.children?.some((child) => child.key === activeKey)
    )?.key;
    if (parentKey) {
      setOpenKeys((prev) =>
        prev.includes(parentKey) ? prev : [parentKey]
      );
    }
  }, [activeKey]);

  useEffect(() => {
    if (drawerVisible && mobileButtonRef.current && isMobile) {
      const buttonRect = mobileButtonRef.current.getBoundingClientRect();
      const modalLeft = 10,
        modalTop = 24;
      const modalWidth = Math.min(320, window.innerWidth - 48);
      const modalHeight = Math.min(
        window.innerHeight - 150,
        window.innerHeight - 48
      );
      const originX =
        ((buttonRect.left + buttonRect.width / 2 - modalLeft) / modalWidth) *
        100;
      const originY =
        ((buttonRect.top + buttonRect.height / 2 - modalTop) / modalHeight) *
        100;
      setTransformOrigin(
        `${Math.max(0, Math.min(100, originX))}% ${Math.max(
          0,
          Math.min(100, originY)
        )}%`
      );
    }
  }, [drawerVisible, isMobile]);

  const handleMenuClick = useCallback(
    (e) => {
      onMenuSelect(e.key);
      if (isMobile) {
        setDrawerVisible(false);
      }
    },
    [onMenuSelect, isMobile]
  );

  const handleOpenChange = useCallback((keys) => {
    setOpenKeys((prev) => {
      const latestOpenKey = keys.find((key) => !prev.includes(key));
      if (
        menuItems.some((item) => item.key === latestOpenKey && item.children)
      ) {
        return latestOpenKey ? [latestOpenKey] : [];
      }
      if (latestOpenKey) return keys;
      return [];
    });
  }, []);

  const renderHeaderContent = () => (
    <InfoWrapper>
      <LogoIcon>
        <LayoutGrid size={20} strokeWidth={2.5} />
      </LogoIcon>
      <TitleContainer>
        <PlatformTitle>Administration</PlatformTitle>
        <PlatformSubtitle>Platform Management</PlatformSubtitle>
      </TitleContainer>
    </InfoWrapper>
  );

  const renderMenu = () => (
    <StyledAntMenu
      key="admin-sidebar-menu"
      mode="inline"
      onClick={handleMenuClick}
      selectedKeys={[activeKey]}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      items={getMenuItemsForAntd}
    />
  );

  return (
    <ThemeProvider theme={appTheme}>
      <SidebarWrapper>
        <DesktopSideMenu className="desktop-sidebar" initial={false}>
          <HeaderContainer>{renderHeaderContent()}</HeaderContainer>
          <MenuContainer>{renderMenu()}</MenuContainer>
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
                    variants={buttonContentVariants}
                    initial="collapsed"
                    whileHover="expanded"
                    onClick={() => setDrawerVisible(true)}
                  >
                    <ButtonIcon
                      variants={buttonIconVariants}
                      initial="collapsed"
                      whileHover="expanded"
                    >
                      <SidebarOpen size={24} />
                    </ButtonIcon>
                    <ButtonText
                      variants={buttonTextVariants}
                      initial="collapsed"
                      whileHover="expanded"
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
                      {renderHeaderContent()}
                      <MobileCloseButton
                        variants={closeButtonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setDrawerVisible(false)}
                        aria-label="Close Menu"
                      >
                        <X size={20} />
                      </MobileCloseButton>
                    </MobileHeaderContainer>
                    <MobileMenuContainer>{renderMenu()}</MobileMenuContainer>
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
