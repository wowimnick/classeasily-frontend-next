"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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

// Dynamically import tab components
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

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f8fafc;
`;

const PageWrapper = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
`;

export default function AdminPage() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const params = useParams();
  const router = useRouter();

  const activeKey = params.tab?.[0] || "users";

  useEffect(() => {
    const hasTab = params.tab?.length > 0;
    if (permissions.length > 0 && !hasTab) {
      router.replace("/admin/users");
    }
  }, [params.tab, permissions.length, router]);

  useEffect(() => {
    if (permissions.length === 0) return;
    const allowedKeys = [
      "users", "roles", "audit",
      "business-overview", "business-listings", "business-verification",
      "class-listings", "class-reviews", "class-categories",
      "all-bookings", "payouts", "global-discounts", "blog", "support", "conversations",
    ];
    const permissionMap = {
      "all-bookings": "quickstart.view_booking",
      payouts: "quickstart.access_payout_admin",
      "global-discounts": "quickstart.access_global_discount_admin",
      blog: "quickstart.access_blog_admin",
      support: "quickstart.access_support_admin",
      conversations: "quickstart.access_support_admin",
      users: "quickstart.view_customuser",
      roles: "quickstart.view_role",
      audit: "quickstart.view_auditlog",
      "business-overview": "quickstart.view_business_metrics",
      "business-listings": "quickstart.view_businessinfo",
      "business-verification": "quickstart.view_all_verificationrequests",
      "class-listings": "quickstart.view_classesmain",
      "class-reviews": "quickstart.view_reviews",
      "class-categories": "quickstart.view_classcategory",
    };
    const isCurrentTabVisible = allowedKeys.includes(activeKey) &&
      (!permissionMap[activeKey] || permissions.includes(permissionMap[activeKey]));
    if (!isCurrentTabVisible) {
      router.replace("/admin/users");
    }
  }, [activeKey, permissions, router]);

  const handleMenuSelect = useCallback(
    (key) => {
      router.push(`/admin/${key}`);
    },
    [router]
  );

  const renderContent = () => {
    switch (activeKey) {
      case "users":
        return <UserManagement />;
      case "roles":
        return <RolesManagement />;
      case "audit":
        return <UserAuditLog />;
      case "all-bookings":
        return <BookingsList />;
      case "business-listings":
        return <BusinessListings />;
      case "business-overview":
        return <BusinessManagement />;
      case "business-verification":
        return <UserAccessControl />;
      case "class-listings":
        return <ClassListings />;
      case "class-categories":
        return <ClassCategories />;
      case "class-reviews":
        return <ClassReviews />;
      case "blog":
        return <BlogManagement />;
      case "support":
        return <SupportTicketTab />;
      case "conversations":
        return <AdminConversationsTab />;
      case "payouts":
        return <PayoutsList />;
      case "global-discounts":
        return <GlobalDiscountsManagement />;
      default:
        return <div>Loading or Access Denied...</div>;
    }
  };

  return (
    <ConfigProvider theme={appTheme}>
      <ImpersonationBanner />
      <PageContainer>
        <BusinessHeader />
        <PageWrapper>
          <PlatformSidebar
            onMenuSelect={handleMenuSelect}
            activeKey={activeKey}
          />
          <ContentArea>{renderContent()}</ContentArea>
        </PageWrapper>
      </PageContainer>
    </ConfigProvider>
  );
}
