"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import styled from "styled-components";
import { ConfigProvider, Result, Button } from "antd";
import PlatformSidebar from "../_components/PlatformSidebar";
import { theme as appTheme } from "@/components/theme";
import dynamic from "next/dynamic";
import SupportTicketTab from "../_components/support/SupportTicketTab";
import AdminConversationsTab from "../_components/conversations/AdminConversationsTab";
import PayoutsList from "../_components/payouts-management/PayoutsList";
import BusinessHeader from "@/app/business/dashboard/_components/BusinessHeader";
import TabGlassWrapper from "@/app/business/dashboard/_components/TabGlassWrapper";
import { ADMIN_TAB_KEYS, ADMIN_TAB_PERMISSIONS } from "../adminTabsConfig";

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
const BannedIpManagement = dynamic(
  () => import("../_components/ip-ban/BannedIpManagement"),
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
const ClassReviews = dynamic(
  () => import("../_components/class-management/ClassReviews"),
  { ssr: false }
);
const BlogManagement = dynamic(
  () => import("../_components/content-management/BlogManagement"),
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
const RevenueStats = dynamic(
  () => import("../_components/revenue-management/RevenueStats"),
  { ssr: false }
);
const SystemMonitoring = dynamic(
  () => import("../_components/metrics/SystemMonitoring"),
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
  @media (max-width: 767px) {
    padding-bottom: 64px;
  }
`;

export default function AdminPage() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const pathname = usePathname();
  const router = useRouter();

  /** First URL segment under `/admin` — pathname is authoritative so reload/hydration keeps the tab. */
  const adminSegments =
    pathname?.replace(/^\/admin\/?/, "").split("/").filter(Boolean) ?? [];
  const activeKey = adminSegments[0] || "overview";

  useEffect(() => {
    if (permissions.length === 0) return;
    const segments =
      pathname?.replace(/^\/admin\/?/, "").split("/").filter(Boolean) ?? [];
    if (segments.length === 0) {
      router.replace("/admin/overview");
    }
  }, [pathname, permissions.length, router]);

  useEffect(() => {
    if (permissions.length === 0) return;
    const req = ADMIN_TAB_PERMISSIONS[activeKey];
    const reqs = Array.isArray(req) ? req : req ? [req] : [];
    const isCurrentTabVisible =
      ADMIN_TAB_KEYS.includes(activeKey) &&
      (reqs.length === 0 || reqs.some((p) => permissions.includes(p)));
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
      case "banned-ips":
        content = <BannedIpManagement />;
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
      case "revenue":
        content = <RevenueStats />;
        break;
      case "widget-subscriptions":
        content = <WidgetSubscriptionsTab />;
        break;
      case "monitoring":
        content = <SystemMonitoring />;
        break;
      default:
        content = (
          <Result
            status="404"
            title="Page not found"
            subTitle={`The admin tab "${activeKey}" does not exist or you may not have access.`}
            extra={
              <Button type="primary" onClick={() => router.push("/admin/overview")}>
                Back to overview
              </Button>
            }
          />
        );
    }
    return <TabGlassWrapper variant="admin">{content}</TabGlassWrapper>;
  };

  return (
    <ConfigProvider theme={appTheme}>
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
