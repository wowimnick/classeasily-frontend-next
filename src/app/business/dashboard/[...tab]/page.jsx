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
import EmailMarketingDashboard from "../_components/tabs/marketing/EmailMarketingDashboard";
import MembershipsDashboard from "../_components/tabs/memberships/MembershipsDashboard";
import WidgetCustomizer from "../_components/tabs/widget/WidgetCustomizer";
import Guests from "../_components/tabs/students/Guests";
import BusinessMessages from "../_components/tabs/messages/BusinessMessages";
import SettingsPage from "../_components/tabs/settings/SettingsPage";
import TabGlassWrapper from "../_components/TabGlassWrapper";

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasWidgetAccess, hasEmailMarketingAccess, hasMembershipAccess, loading: subLoading } = useSubscription();

  // Calculate key
  const activeKey = params.tab ? params.tab.join("/") : "overview";
  const initialMembershipProductId = searchParams.get("membershipProductId") || undefined;

  useEffect(() => {
    if (subLoading) return;
    const mid = searchParams.get("membershipProductId");
    if (!mid) return;
    if (activeKey === "memberships" || activeKey === "memberships/products") {
      const q = searchParams.toString();
      router.replace(`/business/dashboard/memberships/members${q ? `?${q}` : ""}`);
    }
  }, [activeKey, searchParams, subLoading, router]);

  useEffect(() => {
    if (subLoading) return;
    if (!activeKey.startsWith("memberships")) return;
    if (!hasMembershipAccess) {
      router.replace("/business/dashboard/settings?tab=billing");
    }
  }, [activeKey, hasMembershipAccess, subLoading, router]);

  // When user has no widget access, redirect away from widget tab (e.g. direct URL /business/dashboard/widget)
  useEffect(() => {
    if (subLoading || activeKey !== "widget") return;
    if (!hasWidgetAccess) {
      router.replace("/business/dashboard");
    }
  }, [activeKey, hasWidgetAccess, subLoading, router]);

  useEffect(() => {
    if (subLoading || activeKey !== "email-campaigns") return;
    if (!hasEmailMarketingAccess) {
      router.replace("/business/dashboard/settings?tab=billing&email_marketing_modal=1");
    }
  }, [activeKey, hasEmailMarketingAccess, subLoading, router]);

  let componentToRender;

  switch (activeKey) {
    case "overview":
      componentToRender = <Overview />;
      break;
    case "bookings":
    case "bookings/active":
    case "bookings/history":
      componentToRender = (
        <TabGlassWrapper>
          <BookingsCombined
            defaultActiveKey={
              activeKey === "bookings/history" ? "history" : "active"
            }
          />
        </TabGlassWrapper>
      );
      break;
    case "listings":
      componentToRender = (
        <TabGlassWrapper>
          <ClassManagement />
        </TabGlassWrapper>
      );
      break;
    case "schedules": {
      const classIdParam = searchParams.get("classId");
      const instanceIdParam = searchParams.get("instanceId");
      const initialClassId =
        classIdParam && !isNaN(Number(classIdParam))
          ? Number(classIdParam)
          : classIdParam || undefined;
      let initialInstanceId;
      if (instanceIdParam != null && instanceIdParam !== "") {
        const n = Number(instanceIdParam);
        if (Number.isInteger(n) && n > 0) initialInstanceId = n;
      }
      componentToRender = (
        <div style={{ height: "100%", minHeight: "calc(100vh - 60px)" }}>
          <ScheduleCalendarView
            initialClassId={initialClassId}
            initialInstanceId={initialInstanceId}
          />
        </div>
      );
      break;
    }
    case "reviews":
      componentToRender = (
        <TabGlassWrapper>
          <BusinessReviews />
        </TabGlassWrapper>
      );
      break;
    case "guests":
      componentToRender = (
        <TabGlassWrapper>
          <Guests />
        </TabGlassWrapper>
      );
      break;
    case "staff":
      componentToRender = (
        <TabGlassWrapper>
          <Staff />
        </TabGlassWrapper>
      );
      break;
    case "messages":
      componentToRender = (
        <TabGlassWrapper>
          <BusinessMessages />
        </TabGlassWrapper>
      );
      break;
    case "revenue":
      componentToRender = (
        <TabGlassWrapper>
          <Revenue />
        </TabGlassWrapper>
      );
      break;
    case "payouts":
      componentToRender = (
        <TabGlassWrapper>
          <Payouts />
        </TabGlassWrapper>
      );
      break;
    case "trends":
      componentToRender = (
        <TabGlassWrapper>
          <BookingTrends />
        </TabGlassWrapper>
      );
      break;
    case "discounts":
      componentToRender = (
        <TabGlassWrapper>
          <Discounts />
        </TabGlassWrapper>
      );
      break;
    case "email-campaigns":
      componentToRender = (
        <TabGlassWrapper>
          <EmailMarketingDashboard />
        </TabGlassWrapper>
      );
      break;
    case "memberships":
    case "memberships/products":
    case "memberships/members":
      componentToRender = (
        <TabGlassWrapper>
          <MembershipsDashboard
            defaultActiveKey={activeKey === "memberships/members" ? "members" : "products"}
            initialMembershipProductId={initialMembershipProductId}
          />
        </TabGlassWrapper>
      );
      break;
    case "widget": {
      const showWidget = !subLoading && hasWidgetAccess;
      componentToRender = showWidget ? (
        <TabGlassWrapper unclipped>
          <WidgetCustomizer />
        </TabGlassWrapper>
      ) : subLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
          Loading…
        </div>
      ) : null;
      break;
    }
    case "settings": {
      const rawSettingsTab = searchParams.get("tab") || "general";
      const settingsTab =
        rawSettingsTab === "location" ? "locations" : rawSettingsTab;
      const addonReturn =
        searchParams.get("addon") === "1" || searchParams.get("email_marketing") === "1";
      componentToRender = (
        <SettingsPage defaultTab={settingsTab} addonReturn={addonReturn} />
      );
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
