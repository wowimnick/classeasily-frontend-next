"use client";

import React, { useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboard } from "./DashboardContext";

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

export default function DashboardContent() {
  const pathname = usePathname();
  const router = useRouter();

  // Get data from context
  const { overviewData, overviewLoading, overviewError, fetchOverviewData } =
    useDashboard();

  // Extract activeKey from pathname - this is MORE RELIABLE than using params
  const activeKey = useMemo(() => {
    // Remove the base path
    const path = pathname
      .replace("/business/dashboard/", "")
      .replace("/business/dashboard", "");

    // Return the path or default to overview
    return path || "overview";
  }, [pathname]);

  // Debug logging
  useEffect(() => {
    console.log(
      "DashboardContent - pathname:",
      pathname,
      "activeKey:",
      activeKey
    );
  }, [pathname, activeKey]);

  const renderContent = () => {
    console.log("Rendering content for:", activeKey); // Additional debug log

    switch (activeKey) {
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
      default:
        console.warn("Unknown route:", activeKey, "- redirecting to overview");
        router.replace("/business/dashboard/overview");
        return null;
    }
  };

  return renderContent();
}
