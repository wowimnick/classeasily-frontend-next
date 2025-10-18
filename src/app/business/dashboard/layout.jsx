"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";

import SideMenu from "./_components/SideMenu";
import BusinessHeader from "./_components/BusinessHeader";
import BusinessSetupGuide from "./_components/BusinessSetupGuide";
import {
  DashboardProvider,
  useDashboard,
} from "./_components/DashboardContext";
import PermissionProtectedRoute from "@/components/auth/PermissionProtectedRoute";

const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: black;
`;

const HeaderWrapper = styled.div`
  flex-shrink: 0;
`;

const DashboardContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: #fff;
`;

const SideMenuWrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const MainContent = styled.main`
  margin-top: 2.5rem;
  border-top-left-radius: 14px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    overviewLoading,
    setupGuideInitialStatus,
    allSetupStepsCompleteActual,
    displaySetupGuide,
  } = useDashboard();

  const getActiveKeyFromPath = useCallback(() => {
    const parts = pathname
      .replace("/business/dashboard/", "")
      .replace("/business/dashboard", "");
    return parts || "overview";
  }, [pathname]);

  const [selectedMenu, setSelectedMenu] = useState(() =>
    getActiveKeyFromPath()
  );

  const sideMenuRef = useRef(null);
  const mainContentRef = useRef(null);

  // FIX: Use useEffect with proper dependencies
  useEffect(() => {
    const currentKey = getActiveKeyFromPath();
    setSelectedMenu(currentKey);

    // Scroll to top when route changes
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [pathname, getActiveKeyFromPath]);

  useEffect(() => {
    const getPageTitle = (menuKey) => {
      const titles = {
        overview: "Overview",
        classes: "Manage Classes",
        "bookings/active": "Active Bookings",
        "bookings/history": "Booking History",
        reviews: "Reviews",
        discounts: "Discounts",
        trends: "Booking Trends",
        revenue: "Revenue",
        payouts: "Payouts",
        staff: "Staff Management",
        students: "Students",
        widget: "Widget Customizer",
      };
      return titles[menuKey] || "Dashboard";
    };

    document.title = `${getPageTitle(selectedMenu)} | ClassEasily`;
  }, [selectedMenu]);

  const handleMenuSelect = useCallback(
    (key) => {
      if (key !== "settings") {
        // FIX: Use router.push with proper error handling
        router.push(`/business/dashboard/${key}`);
      }
    },
    [router]
  );

  return (
    <PageLayout>
      <HeaderWrapper>
        <BusinessHeader />
      </HeaderWrapper>
      <DashboardContainer>
        <SideMenuWrapper>
          <SideMenu
            ref={sideMenuRef}
            onMenuSelect={handleMenuSelect}
            activeKey={selectedMenu}
          />
        </SideMenuWrapper>
        <MainContent ref={mainContentRef}>{children}</MainContent>
      </DashboardContainer>

      {displaySetupGuide && !overviewLoading && (
        <BusinessSetupGuide
          key="setup-guide-widget"
          sideMenuRef={sideMenuRef}
          setupStatus={setupGuideInitialStatus}
          initialOpen={!allSetupStepsCompleteActual}
        />
      )}
    </PageLayout>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <PermissionProtectedRoute requiredPermission="quickstart.access_business_dashboard">
      <DashboardProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </DashboardProvider>
    </PermissionProtectedRoute>
  );
}
