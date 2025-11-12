// src/app/business/dashboard/[...tab]/page.jsx

"use client";

import { useParams } from "next/navigation";

// Import all tab components
import Overview from "../_components/tabs/overview/Overview";
import ActiveBookings from "../_components/tabs/bookings/ActiveBookings";
import BookingHistory from "../_components/tabs/bookings/BookingHistory";
import ClassManagement from "../_components/tabs/classes/manageclasses/ClassManagement";
import BusinessReviews from "../_components/tabs/reviews/BusinessReviews";
import Students from "../_components/tabs/students/Students";
import Staff from "../_components/tabs/staff/Staff";
import Revenue from "../_components/tabs/finances/Revenue";
import Payouts from "../_components/tabs/payouts/Payouts";
import BookingTrends from "../_components/tabs/bookings/BookingTrends";
import Discounts from "../_components/tabs/discounts/Discounts";
import WidgetCustomizer from "../_components/tabs/widget/WidgetCustomizer";

export default function DashboardPage() {
  const params = useParams();

  const activeKey = params.tab ? params.tab.join("/") : "overview";
  console.error(`[Page] Rendering content for activeKey: "${activeKey}"`);

  switch (activeKey) {
    case "overview":
      // UPDATED: Overview no longer receives props
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
    case "settings":
      // UPDATED: Settings now renders Overview without props
      return <Overview />;
    default:
      console.error(
        `[Page] FATAL: Unknown route detected: "${activeKey}". Rendering error message.`
      );
      return (
        <div>
          <h2>Error: Page Not Found</h2>
          <p>The dashboard tab "/{activeKey}" does not exist.</p>
        </div>
      );
  }
}
