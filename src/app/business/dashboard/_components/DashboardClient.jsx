"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { theme as antdTheme } from "antd";

import SideMenu from "./SideMenu";
import BusinessHeader from "./BusinessHeader";
import BusinessSetupGuide from "./BusinessSetupGuide";
import { businessService } from "@/services/apiService";

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

export default function DashboardClient({ params }) {
  const { token } = antdTheme.useToken();
  const router = useRouter();

  // Extract active key from params
  const getActiveKeyFromParams = useCallback(() => {
    if (!params?.tab || params.tab.length === 0) {
      return "overview";
    }
    // Join the array to handle nested routes like ['bookings', 'active']
    return params.tab.join("/");
  }, [params]);

  const [selectedMenu, setSelectedMenu] = useState(getActiveKeyFromParams());
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [setupGuideInitialStatus, setSetupGuideInitialStatus] = useState(null);
  const [allSetupStepsCompleteActual, setAllSetupStepsCompleteActual] =
    useState(false);
  const [displaySetupGuide, setDisplaySetupGuide] = useState(false);

  const sideMenuRef = useRef(null);
  const mainContentRef = useRef(null);

  const fetchOverviewData = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await businessService.fetchMyBusinessOverview();
      if (response.success && response.data) {
        setOverviewData(response.data);

        const setupProgress = response.data.setup_progress;
        if (setupProgress) {
          const allActuallyComplete =
            setupProgress.is_stripe_connected &&
            setupProgress.is_profile_complete &&
            setupProgress.has_created_class &&
            setupProgress.has_class_options &&
            setupProgress.has_schedules;

          setAllSetupStepsCompleteActual(allActuallyComplete);
          setSetupGuideInitialStatus(setupProgress);
          setDisplaySetupGuide(
            DEBUG_ALWAYS_SHOW_SETUP_GUIDE || !allActuallyComplete
          );
        } else {
          setAllSetupStepsCompleteActual(false);
          setSetupGuideInitialStatus(null);
          setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
        }
      } else {
        setOverviewError(response.error || "Failed to fetch overview data.");
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      setOverviewError("An unexpected error occurred.");
      setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

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
      case "settings":
        router.push("/business/dashboard/overview");
        return null;
      default:
        router.push("/business/dashboard/overview");
        return null;
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
