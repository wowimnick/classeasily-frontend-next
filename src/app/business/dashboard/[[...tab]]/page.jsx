"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

// Static imports - no dynamic loading
import Overview from "../_components/tabs/overview/Overview";
import ActiveBookings from "../_components/tabs/bookings/ActiveBookings";
import BookingHistory from "../_components/tabs/bookings/BookingHistory";
import Students from "../_components/tabs/students/Students";
import Revenue from "../_components/tabs/finances/Revenue";
import Discounts from "../_components/tabs/discounts/Discounts";
import BusinessReviews from "../_components/tabs/reviews/BusinessReviews";
import ClassManagement from "../_components/tabs/classes/manageclasses/ClassManagement";
import BookingTrends from "../_components/tabs/bookings/BookingTrends";
import Payouts from "../_components/tabs/payouts/Payouts";
import Staff from "../_components/tabs/staff/Staff";
import WidgetCustomizer from "../_components/tabs/widget/WidgetCustomizer";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();

  // Extract tab from params - default to overview if no tab
  const activeKey = params.tab
    ? Array.isArray(params.tab)
      ? params.tab.join("/")
      : params.tab
    : "overview";

  // Redirect to overview if no tab specified
  useEffect(() => {
    if (!params.tab) {
      router.replace("/business/dashboard/overview");
    }
  }, [params.tab, router]);

  // Render the appropriate tab content - each component fetches its own data
  switch (activeKey) {
    case "overview":
      return <Overview />;
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
      // Unknown route - show overview
      return <Overview />;
  }
}
