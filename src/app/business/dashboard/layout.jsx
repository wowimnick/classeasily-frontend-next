// src/app/business/dashboard/layout.jsx

"use client";

// --- IMPORT useState and useEffect ---
import { useCallback, useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { theme as appTheme } from "@/components/theme";
import { ConfigProvider } from "antd";

// Import layout components
import PermissionProtectedRoute from "@/components/auth/PermissionProtectedRoute";
import BusinessHeader from "./_components/BusinessHeader";
import SideMenu from "./_components/SideMenu";
import SetupGuideWrapper from "./_components/SetupGuideWrapper";

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

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const sideMenuRef = useRef(null);

  // --- STABLE STATE MANAGEMENT PATTERN (from working Admin page) ---
  const pathKey = pathname.replace("/business/dashboard/", "") || "overview";
  const [activeKey, setActiveKey] = useState(pathKey);

  useEffect(() => {
    const currentPathKey =
      pathname.replace("/business/dashboard/", "") || "overview";
    setActiveKey(currentPathKey);
  }, [pathname]);
  // ----------------------------------------------------------------

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
              activeKey={activeKey} // Pass the stable state down
            />
          </SideMenuWrapper>
          <MainContent>{children}</MainContent>
        </DashboardContainer>

        {/* Restore the SetupGuideWrapper */}
        <SetupGuideWrapper sideMenuRef={sideMenuRef} />
      </PageLayout>
    </ConfigProvider>
  );
}

export default function DashboardLayout({ children }) {
  return (
    // Restore the PermissionProtectedRoute
    <PermissionProtectedRoute requiredPermission="quickstart.access_business_dashboard">
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </PermissionProtectedRoute>
  );
}
