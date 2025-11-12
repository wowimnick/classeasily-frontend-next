// src/app/business/dashboard/layout.jsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { ConfigProvider } from "antd";
import { theme as appTheme } from "@/components/theme";
import { businessService } from "@/services/apiService";

// Import layout components
import PermissionProtectedRoute from "@/components/auth/PermissionProtectedRoute";
import BusinessHeader from "./_components/BusinessHeader";
import SideMenu from "./_components/SideMenu";
import BusinessSetupGuide from "./_components/BusinessSetupGuide";

const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f8fafc;
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
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const DEBUG_ALWAYS_SHOW_SETUP_GUIDE = false;

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const sideMenuRef = useRef(null);

  // State for setup guide is now managed locally in the layout
  const [setupStatus, setSetupStatus] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [displaySetupGuide, setDisplaySetupGuide] = useState(false);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);

  // Data fetching logic for the setup guide
  const fetchSetupStatus = useCallback(async () => {
    console.error("[Layout] Fetching setup guide status...");
    try {
      // We only need the setup_progress, which is part of the overview endpoint
      const response = await businessService.fetchMyBusinessOverview();
      if (response.success && response.data?.setup_progress) {
        const setupProgress = response.data.setup_progress;
        const allComplete =
          setupProgress.is_stripe_connected &&
          setupProgress.is_profile_complete &&
          setupProgress.has_created_class &&
          setupProgress.has_class_options &&
          setupProgress.has_schedules;

        setSetupStatus(setupProgress);
        setIsSetupComplete(allComplete);
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE || !allComplete);
      } else {
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
      }
    } catch (error) {
      console.error("[Layout] Failed to fetch setup guide status:", error);
      setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
    } finally {
      setIsLoadingSetup(false);
    }
  }, []);

  useEffect(() => {
    fetchSetupStatus();
  }, [fetchSetupStatus]);

  // Derive activeKey from the URL pathname.
  const activeKey = pathname.replace("/business/dashboard/", "") || "overview";

  const handleMenuSelect = useCallback(
    (key) => {
      if (key !== "settings") {
        router.push(`/business/dashboard/${key}`);
      }
    },
    [router]
  );

  return (
    <ConfigProvider theme={appTheme}>
      <PageLayout>
        <HeaderWrapper>
          <BusinessHeader />
        </HeaderWrapper>
        <DashboardContainer>
          <SideMenuWrapper>
            <SideMenu
              ref={sideMenuRef}
              onMenuSelect={handleMenuSelect}
              activeKey={activeKey}
            />
          </SideMenuWrapper>
          <MainContent>{children}</MainContent>
        </DashboardContainer>

        {displaySetupGuide && !isLoadingSetup && (
          <BusinessSetupGuide
            key="setup-guide-widget"
            sideMenuRef={sideMenuRef}
            setupStatus={setupStatus}
            initialOpen={!isSetupComplete}
          />
        )}
      </PageLayout>
    </ConfigProvider>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <PermissionProtectedRoute requiredPermission="quickstart.access_business_dashboard">
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </PermissionProtectedRoute>
  );
}
