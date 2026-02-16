// src/app/business/dashboard/[...tab]/page.jsx

"use client";

import { useParams } from "next/navigation";

// Import all tab components
import Overview from "../_components/tabs/overview/Overview";
import ActiveBookings from "../_components/tabs/bookings/ActiveBookings";
import BookingHistory from "../_components/tabs/bookings/BookingHistory";
import ClassManagement from "../_components/tabs/classes/manageclasses/ClassManagement";
import BusinessReviews from "../_components/tabs/reviews/BusinessReviews";
import Staff from "../_components/tabs/staff/Staff";
import Revenue from "../_components/tabs/finances/Revenue";
import Payouts from "../_components/tabs/payouts/Payouts";
import BookingTrends from "../_components/tabs/bookings/BookingTrends";
import Discounts from "../_components/tabs/discounts/Discounts";
import WidgetCustomizer from "../_components/tabs/widget/WidgetCustomizer";
import Guests from "../_components/tabs/students/Guests";

export default function DashboardPage() {
  const params = useParams();

  // Calculate key
  const activeKey = params.tab ? params.tab.join("/") : "overview";

  let componentToRender;

  switch (activeKey) {
    case "overview":
      componentToRender = <Overview />;
      break;
    case "bookings/active":
      componentToRender = <ActiveBookings />;
      break;
    case "bookings/history":
      componentToRender = <BookingHistory />;
      break;
    case "listings":
      componentToRender = <ClassManagement />;
      break;
    case "reviews":
      componentToRender = <BusinessReviews />;
      break;
    case "guests":
      componentToRender = <Guests />;
      break;
    case "staff":
      componentToRender = <Staff />;
      break;
    case "revenue":
      componentToRender = <Revenue />;
      break;
    case "payouts":
      componentToRender = <Payouts />;
      break;
    case "trends":
      componentToRender = <BookingTrends />;
      break;
    case "discounts":
      componentToRender = <Discounts />;
      break;
    case "widget":
      componentToRender = <WidgetCustomizer />;
      break;
    case "settings":
      componentToRender = <Overview />;
      break;
    default:
      componentToRender = (
        <div>
          <h2>Error: Page Not Found</h2>
          <p>The dashboard tab "/{activeKey}" does not exist.</p>
        </div>
      );
  }

  return componentToRender;
}
