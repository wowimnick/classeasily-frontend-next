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
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Button,
  Typography,
  ConfigProvider,
  Space,
  Avatar,
  Skeleton,
  Tooltip,
} from "antd";
import { X, AlertCircle, SidebarOpen, Eye } from "lucide-react";

import { businessService } from "@/services/apiService";
import BusinessSettings from "./tabs/settings/BusinessSettings";
import AppGlobalStyles from "@/app/GlobalStyles";
import { useAuth } from "@/lib/auth-client";

const { Title, Text } = Typography;
import { theme as augmentedTheme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";

const LocalGlobalStyleForSkeleton = createGlobalStyle`
  .header-skeleton-title .ant-skeleton-title { height: 18px !important; margin-top: 2px !important; margin-bottom: 4px !important; border-radius: 4px; }
  .header-skeleton-type .ant-skeleton-title { height: 14px !important; margin-top: 0px !important; margin-bottom: 0px !important; border-radius: 4px; }
`;

const SideMenuWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${(props) => props.theme.token.fontFamily};
  @media (max-width: 1024px) {
    .desktop-sidemenu {
      display: none;
    }
  }
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

const BusinessInfoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  min-width: 0;
  flex-grow: 1;
  margin-right: 8px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  padding: 5px;
  justify-content: flex-start;
  transition: all 0.1s;

  &:hover {
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const BusinessInfoContainer = styled(Space)`
  flex-grow: 1;
  overflow: hidden;
  min-width: 0;
`;

const BusinessTextContainer = styled(Space)`
  overflow: hidden;
  min-width: 0;
  flex-grow: 1;
`;

const BusinessLogo = styled.img`
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  background-color: #f5f5f5;
  flex-shrink: 0;
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

const DesktopSideMenu = styled(motion.div)`
  width: 280px;
  background: ${(props) => props.theme.token.colorBgContainer};
  box-shadow: 1px 0 8px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1000;
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

      .ant-menu-item-icon {
        display: inline-block !important;
        vertical-align: middle !important;
        margin-inline-end: 10px !important;
      }

      lord-icon {
        width: 18px !important;
        height: 18px !important;
        margin-right: 0 !important;
        transition: all 0.3s ease;
        pointer-events: none;
        vertical-align: middle;
        display: inline-block;
      }

      &:hover {
        color: ${(props) => props.theme.token.colorPrimary} !important;
        background-color: ${(props) =>
          props.theme.token.colorBgSpotlight} !important;

        lord-icon {
          --lord-icon-primary: ${(props) => props.theme.token.colorPrimary};
          --lord-icon-secondary: ${(props) => props.theme.token.colorPrimary};
        }
      }
    }

    .ant-menu-item-selected {
      color: ${(props) => props.theme.token.colorPrimary} !important;
      font-weight: 600 !important;
      background-color: ${(props) =>
        props.theme.token.colorBgSpotlight} !important;

      lord-icon {
        --lord-icon-primary: ${(props) => props.theme.token.colorPrimary};
        --lord-icon-secondary: ${(props) => props.theme.token.colorPrimary};
      }

      &:hover {
        color: ${(props) => props.theme.token.colorPrimary} !important;
        lord-icon {
          --lord-icon-primary: ${(props) => props.theme.token.colorPrimary};
          --lord-icon-secondary: ${(props) => props.theme.token.colorPrimary};
        }
      }
    }
  }
`;

const FooterActionsContainer = styled.div`
  padding: 12px 20px;
  margin-top: auto;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

const sidebarVariants = {
  hidden: {
    scale: 0.2,
    opacity: 0,
    x: 0,
    y: 0,
    borderRadius: "50px",
  },
  visible: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    borderRadius: "20px",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.4,
    },
  },
};

const expandableButtonVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
    },
  },
};

const buttonContentVariants = {
  collapsed: {
    width: 56,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
  expanded: {
    width: 140,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
};

const buttonTextVariants = {
  collapsed: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.1,
    },
  },
  expanded: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
    },
  },
};

const buttonIconVariants = {
  collapsed: {
    rotate: 0,
  },
  expanded: {
    rotate: 180,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
};

const closeButtonVariants = {
  hover: {
    scale: 1.1,
    backgroundColor: "#ff4757",
  },
  tap: {
    scale: 0.95,
  },
};

// Menu Configuration - REORGANIZED FOR UX
const menuItemsConfig = [
  // 1. Dashboard: The Command Center
  {
    key: "overview",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/upjgggre.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={true}
        inState="in-home"
      />
    ),
    label: "Dashboard",
  },
  // 2. Core Product: My Listings (High Frequency)
  {
    key: "listings",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/yraqammt.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={true}
        inState="in-newspaper"
      />
    ),
    label: "My Listings",
  },
  // 3. Operational Flow: Bookings (Active + History)
  {
    key: "bookings",
    label: "Bookings",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/uoljexdg.json" // Using the calendar/booking icon here
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={true}
        state="in-booking"
      />
    ),
    children: [
      { key: "bookings/active", label: "Active Bookings" },
      { key: "bookings/history", label: "Booking History" },
    ],
  },
  // 4. Relationships: People & Community (CRM)
  {
    key: "people",
    label: "People & Community",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/mudwpdhy.json" // Using the system/grid icon for general management
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={true}
        inState="in-build"
      />
    ),
    children: [
      { key: "students", label: "Students" },
      { key: "reviews", label: "Reviews & Feedback" },
      { key: "staff", label: "Staff Management" },
    ],
  },
  // 5. Results: Financials
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
    children: [
      { key: "revenue", label: "Revenue Overview" },
      { key: "payouts", label: "Payouts" },
    ],
  },
  // 6. Strategy: Marketing & Analytics
  {
    key: "growth",
    label: "Marketing & Analytics",
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/excswhey.json"
        colors="primary:#666,secondary:#666"
        size="20px"
        playOnLoad={true}
        inState="in-trend-up"
      />
    ),
    children: [
      { key: "trends", label: "Booking Trends" },
      { key: "discounts", label: "Promotions & Discounts" },
    ],
  },
  // 7. Configuration: Settings
  {
    key: "platform",
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
    children: [
      { key: "settings", label: "Business Settings" },
      // { key: "widget", label: "Widget Management" },
    ],
  },
];

const menuItemPermissions = {
  overview: "access_business_dashboard",
  listings: "manage_own_classes",
  "bookings/active": "view_own_business_bookings",
  "bookings/history": "view_own_business_bookings",
  students: "view_business_students",
  reviews: "view_own_business_reviews",
  revenue: "view_business_revenue_analytics",
  payouts: "view_business_revenue_analytics",
  discounts: "manage_own_business_discounts",
  trends: "view_own_booking_analytics",
  staff: "manage_business_staff",
  widget: "manage_own_business_profile",
  settings: "manage_own_business_profile",
};

const SideMenuComponent = memo(
  forwardRef(({ onMenuSelect, activeKey }, ref) => {
    console.error(
      `[SideMenuComponent] Render start for activeKey: "${activeKey}"`
    );
    const [isMobile, setIsMobile] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
    const [openKeys, setOpenKeys] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [loadingBusiness, setLoadingBusiness] = useState(true);
    const [businessError, setBusinessError] = useState(null);
    const [transformOrigin, setTransformOrigin] = useState("bottom left");
    const router = useRouter();

    const { user } = useAuth();
    const permissions = user?.permissions || [];

    const isBusinessClickable =
      !loadingBusiness &&
      !businessError &&
      businessData &&
      !businessData._isPlaceholder;

    const businessClickHandler =
      isBusinessClickable && businessData.slug
        ? () => {
            console.error(
              "[SideMenuComponent] BusinessInfoWrapper click: Navigating to business page"
            );
            router.push(`/business/${businessData.slug}`);
          }
        : null;

    const businessClickableTitle = isBusinessClickable
      ? "Preview your public business page"
      : "";

    const activeSettingsTab = useRef("general");
    const businessSettingsRefInternal = useRef(null);
    const mobileButtonRef = useRef(null);

    // Refs for tours/highlights
    const homeMenuRef = useRef(null);
    const listingsMenuRef = useRef(null);
    const activeBookingsMenuRef = useRef(null);
    const managementMenuRef = useRef(null); // Used for People
    const financialsMenuRef = useRef(null);
    const growthMenuRef = useRef(null);
    const platformMenuRef = useRef(null);

    useImperativeHandle(ref, () => ({
      homeMenuRef,
      listingsMenuRef,
      activeBookingsMenuRef,
      managementMenuRef,
      financialsMenuRef,
      growthMenuRef,
      platformMenuRef,

      openSettingsDrawer: (tab = "general", sectionId = null) => {
        console.error(
          `[SideMenuComponent] openSettingsDrawer called with tab: ${tab}, section: ${sectionId}`
        );
        activeSettingsTab.current = tab;
        if (sectionId) {
          sessionStorage.setItem("scrollToSection", sectionId);
        } else {
          sessionStorage.removeItem("scrollToSection");
        }
        setSettingsDrawerVisible(true);
      },
      closeSettingsDrawer: () => {
        console.error("[SideMenuComponent] closeSettingsDrawer called");
        setSettingsDrawerVisible(false);
      },
      getBusinessSettingsRef: () => businessSettingsRefInternal,
    }));

    useEffect(() => {
      console.error(
        "[SideMenuComponent] useEffect (mobile transform origin) triggered"
      );
      if (typeof window === "undefined") return;

      if (drawerVisible && mobileButtonRef.current && isMobile) {
        const buttonRect = mobileButtonRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const modalLeft = 10;
        const modalTop = 24;
        const modalWidth = Math.min(320, viewportWidth - 48);
        const modalHeight = Math.min(viewportHeight - 150, viewportHeight - 48);

        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;

        const originX = ((buttonCenterX - modalLeft) / modalWidth) * 100;
        const originY = ((buttonCenterY - modalTop) / modalHeight) * 100;

        const clampedX = Math.max(0, Math.min(100, originX));
        const clampedY = Math.max(0, Math.min(100, originY));

        setTransformOrigin(`${clampedX}% ${clampedY}%`);
      }
    }, [drawerVisible, isMobile]);

    const fetchBusinessProfile = useCallback(
      async (context = "explicit call") => {
        console.error(
          `[SideMenuComponent] fetchBusinessProfile CALLED (context: ${context})`
        );
        setLoadingBusiness(true);
        setBusinessError(null);
        try {
          const result = await businessService.getMyBusinessProfile();
          if (result.success && result.data) {
            console.error("[SideMenuComponent] fetchBusinessProfile SUCCESS");
            setBusinessData(result.data);
          } else if (result.status === 404) {
            console.error(
              "[SideMenuComponent] fetchBusinessProfile NOT FOUND (404)"
            );
            setBusinessData({
              businessName: "Create Business Profile",
              businessImage: null,
              businessType: "Not set",
              _isPlaceholder: true,
            });
          } else {
            console.error(
              "[SideMenuComponent] fetchBusinessProfile FAILED (API error)"
            );
            setBusinessError(result.error || "Failed to load business info");
            setBusinessData(null);
          }
        } catch (error) {
          console.error(
            "[SideMenuComponent] fetchBusinessProfile CATCH ERROR:",
            error
          );
          setBusinessError("Network error occurred while fetching profile");
          setBusinessData(null);
        } finally {
          console.error("[SideMenuComponent] fetchBusinessProfile COMPLETE");
          setLoadingBusiness(false);
        }
      },
      []
    );

    useEffect(() => {
      console.error(
        "[SideMenuComponent] useEffect (initial fetchBusinessProfile) triggered"
      );
      fetchBusinessProfile("initial mount");
    }, [fetchBusinessProfile]);

    useEffect(() => {
      console.error(
        "[SideMenuComponent] useEffect (resize listener) triggered"
      );
      const handleResize = () => setIsMobile(window.innerWidth <= 1024);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        console.error(
          "[SideMenuComponent] useEffect (resize listener) cleanup"
        );
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    useEffect(() => {
      const parentKey = menuItemsConfig.find((item) =>
        item.children?.some((child) => child.key === activeKey)
      )?.key;

      if (parentKey) {
        setOpenKeys((prevOpenKeys) => {
          if (prevOpenKeys.includes(parentKey)) {
            return prevOpenKeys; // No change needed
          }
          return [parentKey]; // Set the new parent key
        });
      }
    }, [activeKey]);

    useEffect(() => {
      console.error(
        "[SideMenuComponent] useEffect (forceOpenSettingsTab) triggered"
      );
      if (typeof window === "undefined") return;

      const forcedTab = sessionStorage.getItem("forceOpenSettingsTab");
      if (forcedTab) {
        sessionStorage.removeItem("forceOpenSettingsTab");
        activeSettingsTab.current = forcedTab;
        setSettingsDrawerVisible(true);
        console.error(
          "[SideMenuComponent] Force opening settings drawer, fetching business profile."
        );
        fetchBusinessProfile("after Stripe redirect");
      }
    }, [fetchBusinessProfile]);

    const toggleMobileDrawer = () => {
      console.error(
        `[SideMenuComponent] toggleMobileDrawer called, drawerVisible: ${!drawerVisible}`
      );
      setDrawerVisible(!drawerVisible);
    };

    const handleMenuClick = (e) => {
      console.error(
        `[SideMenuComponent] handleMenuClick called with key: ${e.key}`
      );
      if (e.key === "settings") {
        activeSettingsTab.current = "general";
        setSettingsDrawerVisible(true);
        if (isMobile) setDrawerVisible(false);
        console.error("[SideMenuComponent] Navigating to settings.");
        return;
      }
      onMenuSelect(e.key);
      if (isMobile) setDrawerVisible(false);
    };

    const handleOpenChange = (keys) => {
      console.error(
        `[SideMenuComponent] handleOpenChange called with keys: ${keys}`
      );
      const latestOpenKey = keys.find((key) => !openKeys.includes(key));
      if (
        menuItemsConfig.some(
          (item) => item.key === latestOpenKey && item.children
        )
      ) {
        setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
      } else if (latestOpenKey) {
        setOpenKeys(keys);
      } else {
        setOpenKeys([]);
      }
    };

    const handleSettingsClose = () => {
      console.error("[SideMenuComponent] handleSettingsClose called");
      setSettingsDrawerVisible(false);
    };

    const handleSettingsTabChange = (key) => {
      console.error(
        `[SideMenuComponent] handleSettingsTabChange called with key: ${key}`
      );
      activeSettingsTab.current = key;
    };

    const handleSettingsSave = () => {
      console.error(
        "[SideMenuComponent] handleSettingsSave called, re-fetching business profile"
      );
      fetchBusinessProfile("after settings save");
    };

    const handleMenuItemHover = useCallback((e, isEntering) => {
      // console.error(`[SideMenuComponent] handleMenuItemHover: ${isEntering ? 'entering' : 'leaving'} ${e.currentTarget.innerText}`);
      const menuItem = e.currentTarget;
      const icon = menuItem.querySelector("lord-icon");
      if (icon) {
        try {
          if (isEntering) {
            if (icon.playerInstance) {
              icon.playerInstance.playFromBeginning();
            }
          }
        } catch (error) {
          console.error("[SideMenuComponent] Icon animation error:", error);
        }
      }
    }, []);

    const updateIconColors = useCallback(
      (menuItem, isSelected, isHovering = false, isSubmenuTitle = false) => {
        // console.error(`[SideMenuComponent] updateIconColors for ${menuItem.innerText}, selected: ${isSelected}, hovering: ${isHovering}, submenu: ${isSubmenuTitle}`);
        const icon = menuItem.querySelector("lord-icon");
        if (icon) {
          const isDropdownParent =
            menuItem.classList.contains("ant-menu-submenu-title") ||
            isSubmenuTitle;
          if (isSelected && !isDropdownParent) {
            icon.setAttribute("colors", "primary:#ffffff,secondary:#ffffff");
          } else if (isHovering || (isDropdownParent && isSelected)) {
            const primaryColor = augmentedTheme.token.colorPrimary;
            icon.setAttribute(
              "colors",
              `primary:${primaryColor},secondary:${primaryColor}`
            );
          } else {
            icon.setAttribute("colors", "primary:#666,secondary:#666");
          }
        }
      },
      []
    );

    useEffect(() => {
      console.error(
        "[SideMenuComponent] useEffect (icon color update) triggered"
      );
      const updateAllIconColors = () => {
        const menuItems = document.querySelectorAll(
          ".ant-menu-item, .ant-menu-submenu-title"
        );
        menuItems.forEach((item) => {
          const isSelected =
            item.classList.contains("ant-menu-item-selected") ||
            item.parentElement.classList.contains(
              "ant-menu-submenu-selected"
            ) ||
            item.parentElement.classList.contains("ant-menu-submenu-open");
          const isSubmenuTitle = item.classList.contains(
            "ant-menu-submenu-title"
          );
          updateIconColors(item, isSelected, false, isSubmenuTitle);
        });
      };

      const timeoutId = setTimeout(updateAllIconColors, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [activeKey, openKeys]);

    const getMenuItemsForAntd = useMemo(() => {
      console.error(
        "[SideMenuComponent] useMemo (getMenuItemsForAntd) re-calculated"
      );
      const attachRefToLabel = (label, key) => {
        let refToAttach;
        switch (key) {
          case "overview":
            refToAttach = homeMenuRef;
            break;
          case "listings":
            refToAttach = listingsMenuRef;
            break;
          case "bookings":
            // Attach ref to the "Bookings" parent
            refToAttach = activeBookingsMenuRef;
            break;
          case "people":
            // Attach ref to the "People" parent
            refToAttach = managementMenuRef;
            break;
          case "financials":
            refToAttach = financialsMenuRef;
            break;
          case "growth":
            refToAttach = growthMenuRef;
            break;
          case "platform":
            refToAttach = platformMenuRef;
            break;
          default:
            refToAttach = null;
        }
        return refToAttach ? <span ref={refToAttach}>{label}</span> : label;
      };

      const hasPermission = (key) => {
        const requiredPermCodename = menuItemPermissions[key];
        if (!requiredPermCodename) return true;

        const checkPermission = (codename) => {
          return permissions.some((userPerm) => {
            const parts = userPerm.split(".");
            return parts.length === 2 && parts[1] === codename;
          });
        };

        if (Array.isArray(requiredPermCodename)) {
          return requiredPermCodename.some((p) => checkPermission(p));
        }

        return checkPermission(requiredPermCodename);
      };

      const filteredConfig = menuItemsConfig.reduce((acc, item) => {
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
        label: attachRefToLabel(item.label, item.key),
        onMouseEnter: ({ domEvent }) => handleMenuItemHover(domEvent, true),
        onMouseLeave: ({ domEvent }) => handleMenuItemHover(domEvent, false),
        children: item.children?.map((child) => ({
          key: child.key,
          label: child.label,
          icon: child.icon,
          onMouseEnter: ({ domEvent }) => handleMenuItemHover(domEvent, true),
          onMouseLeave: ({ domEvent }) => handleMenuItemHover(domEvent, false),
        })),
      }));
    }, [handleMenuItemHover, permissions]);

    const renderMenu = () => {
      console.error("[SideMenuComponent] renderMenu called");
      return (
        <MenuContainer>
          <StyledAntMenu
            mode="inline"
            selectedKeys={[activeKey]}
            onOpenChange={setOpenKeys} // Directly connect the handler to the state setter
            openKeys={openKeys}
            onClick={handleMenuClick}
            items={getMenuItemsForAntd}
          />
        </MenuContainer>
      );
    };

    const renderMobileMenu = () => {
      console.error("[SideMenuComponent] renderMobileMenu called");
      return (
        <MobileMenuContainer>
          <StyledAntMenu
            mode="inline"
            selectedKeys={[activeKey]}
            onOpenChange={setOpenKeys} // Directly connect the handler to the state setter
            openKeys={openKeys}
            onClick={handleMenuClick}
            items={getMenuItemsForAntd}
          />
        </MobileMenuContainer>
      );
    };

    const renderLogoOrAvatar = (size = 36) => {
      // console.error("[SideMenuComponent] renderLogoOrAvatar called");
      return businessData.business_image_medium_url ? (
        <BusinessLogo
          src={businessData.business_image_medium_url}
          alt={`${businessData.businessName} Logo`}
          style={{ width: size, height: size }}
        />
      ) : (
        <Avatar
          size={size}
          icon={<div style={{ fontSize: size * 0.5 }}>B</div>} // Fallback icon since Building wasn't imported
          style={{
            backgroundColor: augmentedTheme.token.colorPrimary,
            flexShrink: 0,
          }}
        />
      );
    };

    const renderHeaderContent = () => {
      console.error("[SideMenuComponent] renderHeaderContent called");
      if (loadingBusiness) {
        return (
          <BusinessInfoContainer align="center" size={12}>
            <Skeleton.Avatar
              active
              size={36}
              shape="square"
              style={{ borderRadius: augmentedTheme.token.borderRadius }}
            />
            <BusinessTextContainer
              direction="vertical"
              size={2}
              style={{ flexGrow: 1 }}
            >
              <Skeleton
                title={{ width: "70%" }}
                paragraph={false}
                active
                className="header-skeleton-title"
              />
              <Skeleton
                title={{ width: "50%" }}
                paragraph={false}
                active
                className="header-skeleton-type"
              />
            </BusinessTextContainer>
          </BusinessInfoContainer>
        );
      }
      if (businessError) {
        return (
          <Tooltip title={businessError || "Error loading business profile"}>
            <BusinessInfoContainer align="center" size={12}>
              <Avatar
                size={36}
                icon={<AlertCircle size={20} />}
                style={{
                  backgroundColor: augmentedTheme.token.colorError,
                  flexShrink: 0,
                }}
              />
              <BusinessTextContainer direction="vertical" size={0}>
                <Title
                  level={5}
                  type="danger"
                  style={{ margin: 0, lineHeight: "1.3" }}
                >
                  Error
                </Title>
                <Text
                  type="secondary"
                  style={{ fontSize: "0.75rem", lineHeight: "1.2" }}
                >
                  Profile load failed
                </Text>
              </BusinessTextContainer>
            </BusinessInfoContainer>
          </Tooltip>
        );
      }
      return (
        <>
          {renderLogoOrAvatar()}
          <BusinessTextContainer direction="vertical" size={0}>
            <Title
              level={5}
              style={{
                margin: 0,
                lineHeight: "1.3",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={businessData.businessName}
            >
              {businessData.businessName}
            </Title>
            {businessData.businessType && (
              <Text
                type="secondary"
                style={{
                  fontSize: "0.75rem",
                  lineHeight: "1.2",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={businessData.businessType}
              >
                {businessData.businessType.charAt(0).toUpperCase() +
                  businessData.businessType.slice(1)}
              </Text>
            )}
          </BusinessTextContainer>
        </>
      );
    };

    const renderFooterActions = () => {
      console.error("[SideMenuComponent] renderFooterActions called");
      if (
        loadingBusiness ||
        businessError ||
        !businessData ||
        businessData._isPlaceholder
      ) {
        return (
          <Button
            type="text"
            style={{ boxShadow: "rgba(0, 0, 0, 0.05) 1px 4px 9px 0px" }}
            icon={<AlertCircle size={16} />}
            onClick={() => {
              console.error("[SideMenuComponent] Get Help (desktop) clicked");
              router.push("/business/help/");
            }}
            block
          >
            Get Help
          </Button>
        );
      }
      return (
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          <Button
            type="text"
            style={{ boxShadow: "rgba(0, 0, 0, 0.05) 1px 4px 9px 0px" }}
            icon={<Eye size={16} />}
            onClick={() => {
              console.error("[SideMenuComponent] Preview (desktop) clicked");
              businessData.slug &&
                router.push(`/business/${businessData.slug}`);
            }}
            block
            size="small"
          >
            Preview
          </Button>
          <Button
            type="text"
            style={{ boxShadow: "rgba(0, 0, 0, 0.05) 1px 4px 9px 0px" }}
            icon={<AlertCircle size={16} />}
            onClick={() => {
              console.error(
                "[SideMenuComponent] Help & Docs (desktop) clicked"
              );
              router.push("/business/help/");
            }}
            block
            size="small"
          >
            Help & Docs
          </Button>
        </Space>
      );
    };

    const renderMobileFooterActions = () => {
      console.error("[SideMenuComponent] renderMobileFooterActions called");
      if (
        loadingBusiness ||
        businessError ||
        !businessData ||
        businessData._isPlaceholder
      ) {
        return (
          <Button
            type="text"
            style={{
              boxShadow: "rgba(0, 0, 0, 0.05) 0px 2px 8px 0px",
              borderRadius: "12px",
            }}
            icon={<AlertCircle size={16} />}
            onClick={() => {
              console.error("[SideMenuComponent] Get Help (mobile) clicked");
              router.push("/business/help/");
              setDrawerVisible(false);
            }}
            block
          >
            Get Help
          </Button>
        );
      }
      return (
        <Space direction="horizontal" style={{ width: "100%" }} size={12}>
          <Button
            type="text"
            style={{
              boxShadow: "rgba(0, 0, 0, 0.05) 0px 2px 8px 0px",
              borderRadius: "12px",
              flex: 1,
            }}
            icon={<Eye size={16} />}
            onClick={() => {
              console.error("[SideMenuComponent] Preview (mobile) clicked");
              if (businessData.slug) {
                router.push(`/business/${businessData.slug}`);
              }
              setDrawerVisible(false);
            }}
          >
            Preview
          </Button>
          <Button
            type="text"
            style={{
              boxShadow: "rgba(0, 0, 0, 0.05) 0px 2px 8px 0px",
              borderRadius: "12px",
              flex: 1,
            }}
            icon={<AlertCircle size={16} />}
            onClick={() => {
              console.error("[SideMenuComponent] Help (mobile) clicked");
              router.push("/business/help/");
              setDrawerVisible(false);
            }}
          >
            Help
          </Button>
        </Space>
      );
    };

    console.error(
      `[SideMenuComponent] Render end for activeKey: "${activeKey}"`
    );
    return (
      <ThemeProvider theme={augmentedTheme}>
        <ConfigProvider theme={augmentedTheme}>
          <AppGlobalStyles />
          <LocalGlobalStyleForSkeleton />
          <SideMenuWrapper>
            <DesktopSideMenu
              className="desktop-sidemenu"
              initial={false}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <HeaderContainer>
                <BusinessInfoWrapper
                  onClick={businessClickHandler}
                  title={businessClickableTitle}
                >
                  {renderHeaderContent()}
                </BusinessInfoWrapper>
              </HeaderContainer>
              {renderMenu()}
              <FooterActionsContainer>
                {renderFooterActions()}
              </FooterActionsContainer>
            </DesktopSideMenu>

            {/* Enhanced Mobile Sidebar */}
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
                        onClick={toggleMobileDrawer}
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
                        <MobileMenuContainer>
                          {renderMobileMenu()}
                        </MobileMenuContainer>
                        <MobileFooterContainer>
                          {renderMobileFooterActions()}
                        </MobileFooterContainer>
                      </MobileSidebarContainer>
                    </>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Business Settings Drawer - Now handled by BusinessSettings component */}
            <BusinessSettings
              ref={businessSettingsRefInternal}
              open={settingsDrawerVisible}
              onClose={handleSettingsClose}
              onSave={handleSettingsSave}
              activeTabKey={activeSettingsTab.current}
              onTabChangeExternal={handleSettingsTabChange}
              onProfileUpdate={fetchBusinessProfile}
            />
          </SideMenuWrapper>
        </ConfigProvider>
      </ThemeProvider>
    );
  })
);

SideMenuComponent.displayName = "SideMenuComponent";

export default SideMenuComponent;
