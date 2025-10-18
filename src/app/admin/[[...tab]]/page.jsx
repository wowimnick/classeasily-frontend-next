"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import styled from "styled-components";
import { ConfigProvider } from "antd";
import PlatformSidebar, { menuItems } from "../_components/PlatformSidebar";
import { theme as appTheme } from "@/components/theme";
import dynamic from "next/dynamic";
import SupportTicketTab from "../_components/support/SupportTicketTab";
import PayoutsList from "../_components/payouts-management/PayoutsList";
import MetricsDashboard from "../_components/metrics/MetricsDashboard";
import BusinessHeader from "@/app/business/dashboard/_components/BusinessHeader";

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

const permissionMap = {
  metrics: "quickstart.view_system_metrics",
  "all-bookings": "quickstart.view_booking",
  payouts: "quickstart.access_payout_admin",
  blog: "quickstart.access_blog_admin",
  support: "quickstart.access_support_admin",
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

export default function AdminPage() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const params = useParams();
  const router = useRouter();

  const tabParam = params.tab?.[0] || "metrics";
  const [activeKey, setActiveKey] = useState(tabParam);

  const visibleMenuItems = useMemo(() => {
    const hasPermission = (perm) => permissions.includes(perm);

    return menuItems
      .map((item) => {
        if (item.children) {
          const visibleChildren = item.children.filter((child) => {
            const requiredPerm = permissionMap[child.key];
            return !requiredPerm || hasPermission(requiredPerm);
          });

          if (visibleChildren.length > 0) {
            return { ...item, children: visibleChildren };
          }
          return null;
        }

        const requiredPerm = permissionMap[item.key];
        if (!requiredPerm || hasPermission(requiredPerm)) {
          return item;
        }
        return null;
      })
      .filter(Boolean);
  }, [permissions]);

  useEffect(() => {
    setActiveKey(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (!tabParam && visibleMenuItems.length > 0) {
      const firstKey = visibleMenuItems[0].children
        ? visibleMenuItems[0].children[0].key
        : visibleMenuItems[0].key;
      router.replace(`/admin/${firstKey}`);
    }
  }, [tabParam, visibleMenuItems, router]);

  useEffect(() => {
    if (permissions.length > 0 && visibleMenuItems.length > 0) {
      const isCurrentTabVisible = visibleMenuItems.some(
        (item) =>
          item.key === activeKey ||
          item.children?.some((child) => child.key === activeKey)
      );

      if (!isCurrentTabVisible) {
        const firstVisibleKey = visibleMenuItems[0].children
          ? visibleMenuItems[0].children[0].key
          : visibleMenuItems[0].key;
        router.replace(`/admin/${firstVisibleKey}`);
      }
    } else if (permissions.length > 0 && visibleMenuItems.length === 0) {
      router.replace("/");
    }
  }, [activeKey, visibleMenuItems, permissions, router]);

  const handleMenuSelect = useCallback(
    (key) => {
      setActiveKey(key);
      router.push(`/admin/${key}`);
    },
    [router]
  );

  const renderContent = () => {
    switch (activeKey) {
      case "metrics":
        return <MetricsDashboard />;
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
      case "payouts":
        return <PayoutsList />;
      default:
        return <div>Loading or Access Denied...</div>;
    }
  };

  if (visibleMenuItems.length === 0 && permissions.length > 0) {
    return null;
  }

  return (
    <ConfigProvider theme={appTheme}>
      <PageContainer>
        <BusinessHeader />
        <PageWrapper>
          <PlatformSidebar
            onMenuSelect={handleMenuSelect}
            activeKey={activeKey}
            menuData={visibleMenuItems}
          />
          <ContentArea>{renderContent()}</ContentArea>
        </PageWrapper>
      </PageContainer>
    </ConfigProvider>
  );
}
