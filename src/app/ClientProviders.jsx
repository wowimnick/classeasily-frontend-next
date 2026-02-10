console.error('app started');
"use client";

import { Suspense, useMemo, useEffect, useRef } from "react";
import { ConfigProvider } from "antd";
import { ThemeProvider } from "styled-components";
import { AuthProvider } from "@/context/AuthContext";
import { useAuthStore } from "@/lib/auth-client";
import { theme } from "@/components/theme";
import StyledComponentsRegistry from "@/lib/registry";
import AnalyticsProvider from "./providers/AnalyticsProvider";
import CookieConsentProvider from "./providers/CookieConsentProvider";
import { ToastProvider } from "@/lib/toast/ToastContext";
import SessionMonitor from "@/components/auth/SessionMonitor";
import { SearchProvider } from "@/context/SearchContext";
import SearchDrawer from "@/components/common/SearchDrawer";
import SearchUrlHandler from "@/components/common/SearchUrlHandler";

export default function ClientProviders({ children }) {
  const memoizedTheme = useMemo(() => theme, []);
  const hasInitialized = useRef(false);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    localStorage.setItem("cookie_consent", "true");
  }, []);

  // When Zustand persist finishes hydrating, set _hasHydrated so we know to run initialize().
  // This is a fallback in case the onRehydrateStorage callback doesn't run (e.g. sync storage timing).
  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi?.onFinishHydration) return;
    const unsub = persistApi.onFinishHydration(() => {
      useAuthStore.getState().setHydrated();
    });
    return () => unsub?.();
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
          <ToastProvider>
            <AuthProvider>
              <SessionMonitor />
              <SearchProvider>
                <AnalyticsProvider>
                  <SearchDrawer />
                  <Suspense fallback={null}>
                    <SearchUrlHandler />
                  </Suspense>
                  {children}
                </AnalyticsProvider>
              </SearchProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}
