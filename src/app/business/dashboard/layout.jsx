// src/app/business/dashboard/layout.jsx

"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import styled, { ThemeProvider } from "styled-components";
import { theme as appTheme } from "@/components/theme";
import { ConfigProvider } from "antd";

// Import layout components
import ClientOnlyWrapper from "@/components/common/ClientOnlyWrapper";
import PermissionProtectedRoute from "@/components/auth/PermissionProtectedRoute";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import BusinessHeader from "./_components/BusinessHeader";
import ImpersonationBanner from "@/components/header/ImpersonationBanner";
import SideMenu from "./_components/SideMenu";
import SetupGuideWrapper from "./_components/SetupGuideWrapper";
import DashboardContext from "./_components/DashboardContext";

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

  @media (max-width: 768px) {
    padding: 4px;
  }
`;

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const sideMenuRef = useRef(null);

  // Derive activeKey directly from pathname - no state needed!
  const activeKey = pathname.replace("/business/dashboard/", "") || "overview";
  // When on "bookings" (no sub-path), highlight "Active Bookings" in the sidebar
  const menuActiveKey =
    activeKey === "bookings" ? "bookings/active" : activeKey;

  const handleMenuSelect = useCallback(
    (key) => {
      router.push(`/business/dashboard/${key}`);
    },
    [router]
  );

  return (
    <ThemeProvider theme={appTheme}>
      <ConfigProvider theme={appTheme}>
        <ImpersonationBanner />
      <PageLayout>
        <HeaderWrapper>
          <BusinessHeader />
        </HeaderWrapper>
        <DashboardContainer>
          <SideMenuWrapper>
            <SideMenu
              ref={sideMenuRef}
              onMenuSelect={handleMenuSelect}
              activeKey={menuActiveKey}
            />
          </SideMenuWrapper>
          <MainContent>
            <SubscriptionProvider>
              <DashboardContext.Provider
                value={{
                  openSettingsDrawer: (tab = "general", sectionId = null) => {
                    if (sectionId) sessionStorage.setItem("scrollToSection", sectionId);
                    else sessionStorage.removeItem("scrollToSection");
                    router.push(`/business/dashboard/settings${tab !== "general" ? `?tab=${tab}` : ""}`);
                  },
                }}
              >
                {children}
              </DashboardContext.Provider>
            </SubscriptionProvider>
          </MainContent>
        </DashboardContainer>
        <SetupGuideWrapper sideMenuRef={sideMenuRef} />
      </PageLayout>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ClientOnlyWrapper>
      <PermissionProtectedRoute requiredPermission="quickstart.access_business_dashboard">
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </PermissionProtectedRoute>
    </ClientOnlyWrapper>
  );
}
