"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

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

export default function DashboardContent({
  params,
  overviewData,
  overviewLoading,
  overviewError,
  onDataRefresh,
}) {
  const router = useRouter();

  const activeKey = useMemo(() => {
    if (!params?.tab || params.tab.length === 0) {
      return "overview";
    }
    return params.tab.join("/");
  }, [params]);

  const renderContent = () => {
    switch (activeKey) {
      case "overview":
        return (
          <Overview
            overviewData={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onDataRefresh={onDataRefresh}
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
        // Redirect to overview if unknown route
        router.replace("/business/dashboard/overview");
        return <Overview />;
    }
  };

  return renderContent();
}
