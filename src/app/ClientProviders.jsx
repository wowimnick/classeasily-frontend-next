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

  return (
    <StyledComponentsRegistry>
      <ConfigProvider theme={memoizedTheme}>
        <ThemeProvider theme={memoizedTheme}>
          <GlobalStyles />
          <ToastProvider>
            <AuthProvider>
              <CookieConsentProvider>
                <AnalyticsProvider>{children}</AnalyticsProvider>
              </CookieConsentProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}
