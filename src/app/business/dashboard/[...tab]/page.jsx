// src/app/business/dashboard/[...tab]/page.jsx

"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSubscription } from "@/context/SubscriptionContext";

// Import all tab components
import Overview from "../_components/tabs/overview/Overview";
import BookingsCombined from "../_components/tabs/bookings/BookingsCombined";
import ClassManagement from "../_components/tabs/classes/manageclasses/ClassManagement";
import ScheduleCalendarView from "../_components/tabs/classes/manageclasses/ScheduleCalendarView";
import BusinessReviews from "../_components/tabs/reviews/BusinessReviews";
import Staff from "../_components/tabs/staff/Staff";
import Revenue from "../_components/tabs/finances/Revenue";
import Payouts from "../_components/tabs/payouts/Payouts";
import BookingTrends from "../_components/tabs/bookings/BookingTrends";
import Discounts from "../_components/tabs/discounts/Discounts";
import WidgetCustomizer from "../_components/tabs/widget/WidgetCustomizer";
import Guests from "../_components/tabs/students/Guests";
import BusinessMessages from "../_components/tabs/messages/BusinessMessages";
import SettingsPage from "../_components/tabs/settings/SettingsPage";

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { subscription, widgetSubscriptionRequired, loading: subLoading } = useSubscription();

  // Calculate key
  const activeKey = params.tab ? params.tab.join("/") : "overview";

  const hasWidgetPlan = Boolean(
    !widgetSubscriptionRequired ||
      (subscription?.status &&
        ["active", "trialing"].includes(subscription.status) &&
        subscription?.planId)
  );

  // When widget subscription is required and user has no plan, redirect away from widget tab (e.g. direct URL)
  useEffect(() => {
    if (subLoading || activeKey !== "widget") return;
    if (widgetSubscriptionRequired && !hasWidgetPlan) {
      router.replace("/business/dashboard");
    }
  }, [activeKey, widgetSubscriptionRequired, hasWidgetPlan, subLoading, router]);

  let componentToRender;

  switch (activeKey) {
    case "overview":
      componentToRender = <Overview />;
      break;
    case "bookings":
    case "bookings/active":
    case "bookings/history":
      componentToRender = (
        <BookingsCombined
          defaultActiveKey={
            activeKey === "bookings/history" ? "history" : "active"
          }
        />
      );
      break;
    case "listings":
      componentToRender = <ClassManagement />;
      break;
    case "schedules": {
      const classIdParam = searchParams.get("classId");
      const initialClassId = classIdParam && !isNaN(Number(classIdParam)) ? Number(classIdParam) : classIdParam || undefined;
      componentToRender = (
        <div style={{ height: "100%", minHeight: "calc(100vh - 60px)" }}>
          <ScheduleCalendarView initialClassId={initialClassId} />
        </div>
      );
      break;
    }
    case "reviews":
      componentToRender = <BusinessReviews />;
      break;
    case "guests":
      componentToRender = <Guests />;
      break;
    case "staff":
      componentToRender = <Staff />;
      break;
    case "messages":
      componentToRender = <BusinessMessages />;
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
    case "widget": {
      const showWidget =
        !subLoading && (!widgetSubscriptionRequired || hasWidgetPlan);
      componentToRender = showWidget ? (
        <WidgetCustomizer />
      ) : subLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
          Loading…
        </div>
      ) : null;
      break;
    }
    case "settings": {
      const settingsTab = searchParams.get("tab") || "general";
      componentToRender = <SettingsPage defaultTab={settingsTab} />;
      break;
    }
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
