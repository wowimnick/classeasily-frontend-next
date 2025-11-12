// src/app/business/dashboard/layout.jsx

"use client";

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

  // --- STABLE STATE MANAGEMENT PATTERN ---
  const pathKey = pathname.replace("/business/dashboard/", "") || "overview";
  const [activeKey, setActiveKey] = useState(pathKey);

  // EXTENSIVE LOGGING: Render Cycle
  console.error(
    `[Layout] RENDER START -----------------------------------------`
  );
  console.error(`[Layout] Props check | Pathname: "${pathname}"`);
  console.error(`[Layout] State check | Current activeKey: "${activeKey}"`);

  useEffect(() => {
    const currentPathKey =
      pathname.replace("/business/dashboard/", "") || "overview";

    console.error(`[Layout] EFFECT TRIGGERED | Dependency: [pathname]`);
    console.error(
      `[Layout] Logic | Comparing state "${activeKey}" with derived key "${currentPathKey}"`
    );

    if (activeKey !== currentPathKey) {
      console.error(
        `[Layout] ACTION | Updating activeKey state to: "${currentPathKey}"`
      );
      setActiveKey(currentPathKey);
    } else {
      console.error(`[Layout] ACTION | Keys match, NO state update required.`);
    }
  }, [pathname, activeKey]);

  const handleMenuSelect = useCallback(
    (key) => {
      console.error(
        `[Layout] HANDLER | handleMenuSelect called with key: "${key}"`
      );
      if (key !== "settings") {
        const targetPath = `/business/dashboard/${key}`;
        console.error(`[Layout] NAVIGATING | router.push("${targetPath}")`);
        router.push(targetPath);
      } else {
        console.error(
          `[Layout] HANDLER | Settings selected, no navigation needed.`
        );
      }
    },
    [router]
  );

  console.error(
    `[Layout] RENDER END | Passing activeKey="${activeKey}" to SideMenu`
  );
  console.error(
    `[Layout] -------------------------------------------------------`
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

        <SetupGuideWrapper sideMenuRef={sideMenuRef} />
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
