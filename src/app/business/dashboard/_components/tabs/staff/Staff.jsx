// src/app/business/dashboard/_components/tabs/staff/Staff.jsx

"use client";

import React, { Suspense, lazy } from "react";
import styled from "styled-components";
import { Typography, ConfigProvider, Tabs, Skeleton, Divider } from "antd";
import { Users, Shield } from "lucide-react";
import { theme } from "@/components/theme";
import { useAuth } from "@/lib/auth-client";

// Lazy load the tab content for better performance
const TeamMembers = lazy(() => import("./TeamMembers"));
const Roles = lazy(() => import("./Roles"));

const { Text } = Typography;

const colors = {
  primary: "#ff385c",
  textSecondary: "#64748b",
};

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 8px;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 4px 0;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 6px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 4px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 14px;
  }
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  margin-top: 0;
  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

const MobileDivider = styled(Divider)`
  margin: 16px 0;
  @media (max-width: 768px) {
    margin: 12px 0;
  }
  @media (max-width: 480px) {
    margin: 8px 0;
  }
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 24px;
    @media (max-width: 768px) {
      margin-bottom: 16px;
    }
    @media (max-width: 480px) {
      margin-bottom: 12px;
    }
  }
  .ant-tabs-nav-wrap {
    @media (max-width: 768px) {
      padding: 0;
    }
  }
  .ant-tabs-nav-list {
    gap: 24px;
  }
  .ant-tabs-tab {
    padding: 12px 16px;
    font-size: 14px !important;
    font-weight: 500;
    display: flex;
    align-items: center;
    @media (max-width: 768px) {
      padding: 10px 12px;
      font-size: 14px;
      span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
    @media (max-width: 480px) {
      padding: 8px 10px !important;
      font-size: 13px !important;
      span {
        gap: 4px;
      }
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: ${colors.primary};
  }
  .ant-tabs-ink-bar {
    background: ${colors.primary};
  }
  .ant-tabs-content-holder {
    @media (max-width: 768px) {
      overflow-x: auto;
    }
  }
  .ant-tabs-tabpane {
    @media (max-width: 768px) {
      min-width: 320px;
    }
  }
`;

const SkeletonWrapper = styled.div`
  padding: 20px;
  @media (max-width: 768px) {
    padding: 12px;
  }
  @media (max-width: 480px) {
    padding: 8px;
  }
`;

const TabSkeleton = () => (
  <SkeletonWrapper>
    <Skeleton active paragraph={{ rows: 2 }} />
    <Skeleton.Input
      style={{ width: "100%", height: 50, marginTop: 20 }}
      active
    />
    <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 20 }} />
  </SkeletonWrapper>
);

const Staff = () => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const canManageRoles = permissions.some((p) =>
    p.endsWith(".manage_business_roles")
  );

  const items = [
    {
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={16} />
          <span>Team Members</span>
        </span>
      ),
      key: "team-members",
      children: (
        <Suspense fallback={<TabSkeleton />}>
          <TeamMembers />
        </Suspense>
      ),
    },
  ];

  if (canManageRoles) {
    items.push({
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={16} />
          <span>Roles & Permissions</span>
        </span>
      ),
      key: "roles",
      children: (
        <Suspense fallback={<TabSkeleton />}>
          <Roles />
        </Suspense>
      ),
    });
  }

  return (
    <ConfigProvider theme={theme}>
      <DashboardWrapper>
        <DashboardHeader>
          <HeaderContent>
            <PageTitle>Staff Management</PageTitle>
            <HeaderSubtitle>
              Invite and manage your team members and their specific
              permissions.
            </HeaderSubtitle>
          </HeaderContent>
        </DashboardHeader>

        <MobileDivider />

        <ContentWrapper>
          <StyledTabs
            defaultActiveKey="team-members"
            items={items}
            size="large"
            tabBarGutter={0}
          />
        </ContentWrapper>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default Staff;
