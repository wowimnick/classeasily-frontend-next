"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import styled from "styled-components";
import { ConfigProvider } from "antd";
import PlatformSidebar from "../_components/PlatformSidebar";
import { theme as appTheme } from "@/components/theme";
import dynamic from "next/dynamic";
import SupportTicketTab from "../_components/support/SupportTicketTab";
import AdminConversationsTab from "../_components/conversations/AdminConversationsTab";
import PayoutsList from "../_components/payouts-management/PayoutsList";
import BusinessHeader from "@/app/business/dashboard/_components/BusinessHeader";
import ImpersonationBanner from "@/components/header/ImpersonationBanner";
import TabGlassWrapper from "@/app/business/dashboard/_components/TabGlassWrapper";

const UserManagement = dynamic(
  () => import("../_components/usermanagement/UserManagement"),
  { ssr: false }
);
const RolesManagement = dynamic(
  () => import("../_components/usermanagement/RolesManagement"),
  { ssr: false }
);
const UserAuditLog = dynamic(
  () => import("../_components/usermanagement/UserAuditLog"),
  { ssr: false }
);
const BookingsList = dynamic(
  () => import("../_components/bookingmanagement/BookingsList"),
  { ssr: false }
);
const BusinessListings = dynamic(
  () => import("../_components/businessmanagement/BusinessListings"),
  { ssr: false }
);
const BusinessManagement = dynamic(
  () => import("../_components/businessmanagement/BusinessManagement"),
  { ssr: false }
);
const UserAccessControl = dynamic(
  () => import("../_components/businessmanagement/UserAccessControl"),
  { ssr: false }
);
const ClassListings = dynamic(
  () => import("../_components/class-management/ClassListings"),
  { ssr: false }
);
const ClassCategories = dynamic(
  () => import("../_components/class-management/ClassCategories"),
  { ssr: false }
);
const ClassReviews = dynamic(
  () => import("../_components/class-management/ClassReviews"),
  { ssr: false }
);
const BlogManagement = dynamic(
  () => import("../_components/content-management/BlogManagement"),
  { ssr: false }
);
const GlobalDiscountsManagement = dynamic(
  () => import("../_components/global-discounts/GlobalDiscountsManagement"),
  { ssr: false }
);
const WidgetSubscriptionsTab = dynamic(
  () => import("../_components/widget-subscriptions/WidgetSubscriptionsTab"),
  { ssr: false }
);
const PlatformOverview = dynamic(
  () => import("../_components/overview/PlatformOverview"),
  { ssr: false }
);
const PaymentManagement = dynamic(
  () => import("../_components/payment-management/PaymentManagement"),
  { ssr: false }
);
const NotificationCampaigns = dynamic(
  () => import("../_components/notification-management/NotificationCampaigns"),
  { ssr: false }
);
const MetricsDashboard = dynamic(
  () => import("../_components/metrics/MetricsDashboard"),
  { ssr: false }
);

const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #ffffff;
`;

const HeaderWrapper = styled.div`
  flex-shrink: 0;
  z-index: 10;
`;

const DashboardContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
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
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
`;

export default function AdminPage() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeKey =
    pathname?.replace(/^\/admin\/?/, "").split("/")[0] ||
    params.tab?.[0] ||
    "overview";

  useEffect(() => {
    const hasTab = params.tab?.length > 0;
    if (permissions.length > 0 && !hasTab) {
      router.replace("/admin/overview");
    }
  }, [params.tab, permissions.length, router]);

  useEffect(() => {
    if (permissions.length === 0) return;
    const allowedKeys = [
      "overview",
      "users",
      "roles",
      "audit",
      "business-overview",
      "business-listings",
      "business-verification",
      "class-listings",
      "class-reviews",
      "collections",
      "all-bookings",
      "payments",
      "payouts",
      "campaigns",
      "widget-subscriptions",
      "global-discounts",
      "blog",
      "support",
      "conversations",
      "metrics",
    ];
    const permissionMap = {
      overview: "quickstart.access_admin_dashboard",
      users: "quickstart.view_customuser",
      roles: "quickstart.view_role",
      audit: "quickstart.view_auditlog",
      "business-overview": "quickstart.view_business_metrics",
      "business-listings": "quickstart.view_businessinfo",
      "business-verification": "quickstart.view_all_verificationrequests",
      "class-listings": "quickstart.view_classesmain",
      "class-reviews": "quickstart.view_reviews",
      "collections": "quickstart.view_classcollection",
      "all-bookings": "quickstart.view_booking",
      payments: "quickstart.access_payment_admin",
      payouts: "quickstart.access_payout_admin",
      campaigns: "quickstart.access_notification_admin",
      "widget-subscriptions": "quickstart.view_businessinfo",
      "global-discounts": "quickstart.access_global_discount_admin",
      blog: "quickstart.access_blog_admin",
      support: "quickstart.access_support_admin",
      conversations: "quickstart.access_support_admin",
      metrics: "quickstart.view_system_metrics",
    };
    const isCurrentTabVisible =
      allowedKeys.includes(activeKey) &&
      (!permissionMap[activeKey] ||
        permissions.includes(permissionMap[activeKey]));
    if (!isCurrentTabVisible) {
      router.replace("/admin/overview");
    }
  }, [activeKey, permissions, router]);

  const handleMenuSelect = useCallback(
    (key) => {
      router.push(`/admin/${key}`);
    },
    [router]
  );

  const renderContent = () => {
    let content;
    switch (activeKey) {
      case "overview":
        content = <PlatformOverview />;
        break;
      case "users":
        content = <UserManagement />;
        break;
      case "roles":
        content = <RolesManagement />;
        break;
      case "audit":
        content = <UserAuditLog />;
        break;
      case "all-bookings":
        content = <BookingsList />;
        break;
      case "business-listings":
        content = <BusinessListings />;
        break;
      case "business-overview":
        content = <BusinessManagement />;
        break;
      case "business-verification":
        content = <UserAccessControl />;
        break;
      case "class-listings":
        content = <ClassListings />;
        break;
      case "collections":
        content = <ClassCategories />;
        break;
      case "class-reviews":
        content = <ClassReviews />;
        break;
      case "blog":
        content = <BlogManagement />;
        break;
      case "support":
        content = <SupportTicketTab />;
        break;
      case "conversations":
        content = <AdminConversationsTab />;
        break;
      case "payouts":
        content = <PayoutsList />;
        break;
      case "payments":
        content = <PaymentManagement />;
        break;
      case "widget-subscriptions":
        content = <WidgetSubscriptionsTab />;
        break;
      case "global-discounts":
        content = <GlobalDiscountsManagement />;
        break;
      case "campaigns":
        content = <NotificationCampaigns />;
        break;
      case "metrics":
        content = <MetricsDashboard />;
        break;
      default:
        content = <div>Loading or Access Denied...</div>;
    }
    return <TabGlassWrapper>{content}</TabGlassWrapper>;
  };

  return (
    <ConfigProvider theme={appTheme}>
      <ImpersonationBanner />
      <PageLayout>
        <HeaderWrapper>
          <BusinessHeader />
        </HeaderWrapper>
        <DashboardContainer>
          <SideMenuWrapper>
            <PlatformSidebar
              onMenuSelect={handleMenuSelect}
              activeKey={activeKey}
            />
          </SideMenuWrapper>
          <MainContent>{renderContent()}</MainContent>
        </DashboardContainer>
      </PageLayout>
    </ConfigProvider>
  );
}
