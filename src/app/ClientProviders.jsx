"use client";

import { Suspense, useMemo, useEffect, useRef } from "react";
import { ConfigProvider } from "antd";
import { ThemeProvider } from "styled-components";
import { AuthProvider } from "@/context/AuthContext";
import { useAuthStore } from "@/lib/auth-client";
import { theme } from "@/components/theme";
import StyledComponentsRegistry from "@/lib/registry";
import AnalyticsProvider from "./providers/AnalyticsProvider";
import { ToastProvider } from "@/lib/toast/ToastContext";
import SessionMonitor from "@/components/auth/SessionMonitor";
import ScrollRestorationHome from "@/components/ScrollRestorationHome";
import ScrollToTopOnNavigate from "@/components/ScrollToTopOnNavigate";
import ImpersonationBanner from "@/components/header/ImpersonationBanner";

export default function ClientProviders({ children }) {
  const memoizedTheme = useMemo(() => theme, []);
  const hasInitialized = useRef(false);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    localStorage.setItem("cookie_consent", "true");
  }, []);

  // Trigger auth store rehydration after first paint so server and client initial HTML match (avoids React #418).
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;

    if (!_hasHydrated) {
      console.log("[ClientProviders] Waiting for Zustand hydration...");
      return;
    }

    hasInitialized.current = true;

    console.log("[ClientProviders] Initializing auth...");
    useAuthStore.getState().initialize();
  }, [_hasHydrated]);

  // Add MutationObserver to mark Ant Design dropdowns with data-vaul-no-drag
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Check if it's an Ant Design dropdown/select container
            if (
              node.classList?.contains("ant-select-dropdown") ||
              node.classList?.contains("ant-dropdown") ||
              node.classList?.contains("ant-picker-dropdown") ||
              node.classList?.contains("ant-tooltip") ||
              node.classList?.contains("ant-popover")
            ) {
              node.setAttribute("data-vaul-no-drag", "");
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: false, // Only observe direct children of body
    });

    return () => observer.disconnect();
  }, []);

  return (
    <StyledComponentsRegistry>
      <ConfigProvider
        theme={memoizedTheme}
        getPopupContainer={() => document.body}
      >
        <ThemeProvider theme={memoizedTheme}>
          <ImpersonationBanner />
          <ToastProvider>
            <AuthProvider>
              <SessionMonitor />
              <AnalyticsProvider>
                <Suspense fallback={null}>
                  <ScrollRestorationHome />
                  <ScrollToTopOnNavigate />
                </Suspense>
                {children}
              </AnalyticsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}
