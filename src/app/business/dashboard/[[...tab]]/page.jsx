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

  // Calculate key
  const activeKey = params.tab ? params.tab.join("/") : "overview";

  // EXTENSIVE LOGGING: Page Level
  console.error(
    `[Page] RENDER START >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`
  );
  console.error(`[Page] Params received:`, JSON.stringify(params));
  console.error(`[Page] Derived activeKey: "${activeKey}"`);

  let componentToRender;
  let componentName = "";

  switch (activeKey) {
    case "overview":
      componentToRender = <Overview />;
      componentName = "Overview";
      break;
    case "bookings/active":
      componentToRender = <ActiveBookings />;
      componentName = "ActiveBookings";
      break;
    case "bookings/history":
      componentToRender = <BookingHistory />;
      componentName = "BookingHistory";
      break;
    case "classes":
      componentToRender = <ClassManagement />;
      componentName = "ClassManagement";
      break;
    case "reviews":
      componentToRender = <BusinessReviews />;
      componentName = "BusinessReviews";
      break;
    case "students":
      componentToRender = <Students />;
      componentName = "Students";
      break;
    case "staff":
      componentToRender = <Staff />;
      componentName = "Staff";
      break;
    case "revenue":
      componentToRender = <Revenue />;
      componentName = "Revenue";
      break;
    case "payouts":
      componentToRender = <Payouts />;
      componentName = "Payouts";
      break;
    case "trends":
      componentToRender = <BookingTrends />;
      componentName = "BookingTrends";
      break;
    case "discounts":
      componentToRender = <Discounts />;
      componentName = "Discounts";
      break;
    case "widget":
      componentToRender = <WidgetCustomizer />;
      componentName = "WidgetCustomizer";
      break;
    case "settings":
      componentToRender = <Overview />;
      componentName = "Overview (Settings Mode)";
      break;
    default:
      console.error(`[Page] FATAL | Unknown key "${activeKey}"`);
      componentName = "ErrorDisplay";
      componentToRender = (
        <div>
          <h2>Error: Page Not Found</h2>
          <p>The dashboard tab "/{activeKey}" does not exist.</p>
        </div>
      );
  }

  console.error(`[Page] DECISION | Returning component: <${componentName} />`);
  console.error(`[Page] RENDER END <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);

  return componentToRender;
}
