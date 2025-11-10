"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { theme as antdTheme } from "antd";

import SideMenu from "./SideMenu";
import BusinessHeader from "./BusinessHeader";
import BusinessSetupGuide from "./BusinessSetupGuide";
import { DashboardProvider, useDashboard } from "./DashboardContext";

// Import tab components
import Overview from "./tabs/overview/Overview";
import ActiveBookings from "./tabs/bookings/ActiveBookings";
import BookingHistory from "./tabs/bookings/BookingHistory";
import Students from "./tabs/students/Students";
import Revenue from "./tabs/finances/Revenue";
import Discounts from "./tabs/discounts/Discounts";
import BusinessReviews from "./tabs/reviews/BusinessReviews";
import ClassManagement from "./tabs/classes/manageclasses/ClassManagement";
import BookingTrends from "./tabs/bookings/BookingTrends";
import Payouts from "./tabs/payouts/Payouts";
import Staff from "./tabs/staff/Staff";
import WidgetCustomizer from "./tabs/widget/WidgetCustomizer";

const DEBUG_ALWAYS_SHOW_SETUP_GUIDE = false;

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

// Inner component that uses the context
function DashboardClientInner({ params }) {
  const { token } = antdTheme.useToken();
  const router = useRouter();

  // Get data from context
  const {
    overviewData,
    overviewLoading,
    overviewError,
    setupGuideInitialStatus,
    allSetupStepsCompleteActual,
    displaySetupGuide,
    fetchOverviewData,
  } = useDashboard();

  // Extract active key from params
  const getActiveKeyFromParams = useCallback(() => {
    if (!params?.tab || params.tab.length === 0) {
      return "overview";
    }
    // Join the array to handle nested routes like ['bookings', 'active']
    return params.tab.join("/");
  }, [params]);

  const [selectedMenu, setSelectedMenu] = useState(getActiveKeyFromParams());

  const sideMenuRef = useRef(null);
  const mainContentRef = useRef(null);

  // Update selected menu when params change
  useEffect(() => {
    const currentKey = getActiveKeyFromParams();
    setSelectedMenu(currentKey);

    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [params, getActiveKeyFromParams]);

  // Update document title
  useEffect(() => {
    document.title = `Dashboard - ${getPageTitle(selectedMenu) || "Settings"}`;
  }, [selectedMenu]);

  const handleMenuSelect = useCallback(
    (key) => {
      if (key !== "settings") {
        router.push(`/business/dashboard/${key}`);
      }
    },
    [router]
  );

  const getPageTitle = (menuKey) => {
    const titles = {
      overview: "Overview",
      "schedule-view": "Schedule View",
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
    return titles[menuKey] || null;
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "overview":
        return (
          <Overview
            overviewData={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onDataRefresh={fetchOverviewData}
          />
        );
      case "bookings/active":
        return <ActiveBookings />;
      case "bookings/history":
        return <BookingHistory />;
      case "classes":
        return <ClassManagement />;
      case "reviews":
        return <BusinessReviews />;
      case "students":
        return <Students />;
      case "staff":
        return <Staff />;
      case "revenue":
        return <Revenue />;
      case "payouts":
        return <Payouts />;
      case "trends":
        return <BookingTrends />;
      case "discounts":
        return <Discounts />;
      case "widget":
        return <WidgetCustomizer />;
      case "settings":
        // Settings handled by SideMenu drawer - show overview
        return (
          <Overview
            overviewData={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onDataRefresh={fetchOverviewData}
          />
        );
      // Parent menu keys (from SideMenu) that shouldn't trigger navigation
      case "management":
      case "financials":
      case "growth":
      case "platform":
        // Show overview while submenu is open/being selected
        return (
          <Overview
            overviewData={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onDataRefresh={fetchOverviewData}
          />
        );
      default:
        // Don't redirect in default case - just show overview to avoid loops
        console.warn("Unknown route:", selectedMenu);
        return (
          <Overview
            overviewData={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onDataRefresh={fetchOverviewData}
          />
        );
    }
  };

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
        <MainContent ref={mainContentRef}>{renderContent()}</MainContent>
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

// Main component that provides the context
export default function DashboardClient({ params }) {
  return (
    <DashboardProvider>
      <DashboardClientInner params={params} />
    </DashboardProvider>
  );
}
