"use client";

import React, { useState, useEffect, memo, useMemo } from "react";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Button, Space } from "antd";
import {
  Activity,
  Users,
  UserPlus,
  Shield as ShieldIcon,
  ActivitySquare,
  Briefcase,
  BarChart2,
  Building,
  BookOpen,
  List,
  Star,
  Bookmark,
  CalendarCheck,
  Mail,
  HelpCircle,
  Menu as MenuIcon,
  X,
  LayoutGrid,
  Text,
  ArrowRightFromLine,
  SidebarOpen,
  LifeBuoy,
} from "lucide-react";
import { theme as appTheme } from "@/components/theme";

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
    font-weight: 500;
    font-size: 14px;
    .lucide {
      transition: transform 0.2s ease, color 0.2s ease;
      margin-right: 12px;
      color: ${(props) => props.theme.token.colorTextSecondary};
      font-size: 18px;
      vertical-align: -0.2em; /* Better alignment */
    }
    &:hover {
      color: ${(props) => props.theme.token.colorPrimary} !important;
      background-color: ${(props) =>
        props.theme.token.colorBgSpotlight} !important;
      .lucide {
        color: ${(props) => props.theme.token.colorPrimary} !important;
        transform: scale(1.1);
      }
    }
  }
  .ant-menu-item-selected {
    background-color: ${(props) => props.theme.token.colorPrimary} !important;
    color: ${(props) => props.theme.token.colorHeaderText} !important;
    font-weight: 600 !important;
    .lucide {
      color: ${(props) => props.theme.token.colorHeaderText} !important;
    }
    &::after {
      display: none;
    }
    &:hover {
      background-color: ${(props) => props.theme.token.colorPrimary} !important;
      color: ${(props) => props.theme.token.colorHeaderText} !important;
      .lucide {
        color: ${(props) => props.theme.token.colorHeaderText} !important;
        transform: scale(1);
      }
    }
  }
  .ant-menu-submenu-selected > .ant-menu-submenu-title,
  .ant-menu-submenu-open > .ant-menu-submenu-title {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    font-weight: 600 !important;
    background-color: ${(props) =>
      props.theme.token.colorBgSpotlight} !important;
    .lucide {
      color: ${(props) => props.theme.token.colorPrimary} !important;
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

export const menuItems = [
  { key: "metrics", icon: <Activity size={18} />, label: "System Metrics" },
  {
    key: "user-management",
    icon: <Users size={18} />,
    label: "User Management",
    children: [
      { key: "users", icon: <UserPlus size={18} />, label: "Users" },
      {
        key: "roles",
        icon: <ShieldIcon size={18} />,
        label: "Roles & Permissions",
      },
      { key: "audit", icon: <ActivitySquare size={18} />, label: "Audit Log" },
    ],
  },
  {
    key: "business-management",
    icon: <Briefcase size={18} />,
    label: "Business Management",
    children: [
      {
        key: "business-overview",
        icon: <BarChart2 size={18} />,
        label: "Business Overview",
      },
      {
        key: "business-listings",
        icon: <Building size={18} />,
        label: "Business Listings",
      },
      {
        key: "business-verification",
        icon: <UserPlus size={18} />,
        label: "Business Verification",
      },
    ],
  },
  {
    key: "class-management",
    icon: <BookOpen size={18} />,
    label: "Class Management",
    children: [
      {
        key: "class-listings",
        icon: <List size={18} />,
        label: "Class Listings",
      },
      {
        key: "class-reviews",
        icon: <Star size={18} />,
        label: "Class Reviews",
      },
      {
        key: "class-categories",
        icon: <Bookmark size={18} />,
        label: "Class Categories",
      },
    ],
  },
  {
    key: "all-bookings",
    icon: <CalendarCheck size={18} />,
    label: "All Bookings",
  },
  {
    key: "payouts",
    icon: <ArrowRightFromLine size={18} />,
    label: "Payouts",
  },
  { key: "blog", icon: <Text size={18} />, label: "Blog" },
  { key: "support", icon: <HelpCircle size={18} />, label: "Support" },
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

const PlatformSidebar = memo(({ onMenuSelect, activeKey, menuData }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
  );
  const [openKeys, setOpenKeys] = useState([]);
  const [transformOrigin, setTransformOrigin] = useState("bottom left");
  const mobileButtonRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeKey) {
      const parentKey = menuData.find((item) =>
        item.children?.some((child) => child.key === activeKey)
      )?.key;
      if (parentKey && !openKeys.includes(parentKey)) {
        setOpenKeys((prevOpenKeys) => [...prevOpenKeys, parentKey]);
      }
    }
  }, [activeKey, menuData, openKeys]);

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

  const handleMenuClick = (e) => {
    onMenuSelect(e.key);
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (menuData.some((item) => item.key === latestOpenKey && item.children)) {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    } else {
      setOpenKeys(keys);
    }
  };

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

  const menuItemsForAnt = useMemo(
    () =>
      menuData.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children?.map((child) => ({
          key: child.key,
          icon: child.icon,
          label: child.label,
        })),
      })),
    [menuData]
  );

  const renderMenu = () => (
    <StyledAntMenu
      mode="inline"
      onClick={handleMenuClick}
      selectedKeys={[activeKey]}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      items={menuItemsForAnt}
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
