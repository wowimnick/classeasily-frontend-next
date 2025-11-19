"use client";

import { ConfigProvider } from "antd";
import { ThemeProvider } from "styled-components";
import { useMemo, useEffect, useRef } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { useAuthStore } from "@/lib/auth-client";
import { theme } from "@/components/theme";
import StyledComponentsRegistry from "@/lib/registry";
import GlobalStyles from "./GlobalStyles";
import AnalyticsProvider from "./providers/AnalyticsProvider";
import CookieConsentProvider from "./providers/CookieConsentProvider";
import { ToastProvider } from "@/lib/toast/ToastContext";
import SessionMonitor from "@/components/auth/SessionMonitor";
import { SearchProvider } from "@/context/SearchContext";

export default function ClientProviders({ children }) {
  const memoizedTheme = useMemo(() => theme, []);
  const hasInitialized = useRef(false);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

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
          <GlobalStyles />
          <ToastProvider>
            <AuthProvider>
              <SessionMonitor />
              <SearchProvider>
                <CookieConsentProvider>
                  <AnalyticsProvider>{children}</AnalyticsProvider>
                </CookieConsentProvider>
              </SearchProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}