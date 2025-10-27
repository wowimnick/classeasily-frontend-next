"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function DashboardContent({ activeKey }) {
  const router = useRouter();

  // Get data from context
  const { overviewData, overviewLoading, overviewError, fetchOverviewData } =
    useDashboard();

  // Debug logging
  useEffect(() => {
    console.log("🔄 DashboardContent render - activeKey:", activeKey);
  }, [activeKey]);

  const renderContent = () => {
    console.log("📄 Rendering content for activeKey:", activeKey);

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
      default:
        console.warn(
          "⚠️ Unknown route:",
          activeKey,
          "- redirecting to overview"
        );
        router.replace("/business/dashboard/overview");
        return null;
    }
  };

  return renderContent();
}
