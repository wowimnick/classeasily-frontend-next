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
import axiosInstance from "@/lib/axiosInstance";

export default function ClientProviders({ children }) {
  const memoizedTheme = useMemo(() => theme, []);
  const hasInitialized = useRef(false);
  const hasFetchedCsrf = useRef(false);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // FETCH CSRF TOKEN FIRST
  useEffect(() => {
    if (hasFetchedCsrf.current) return;

    hasFetchedCsrf.current = true;

    const fetchCsrf = async () => {
      try {
        console.log("[ClientProviders] Fetching CSRF token...");
        await axiosInstance.get("/csrf/");
        console.log("[ClientProviders] CSRF token obtained");
      } catch (error) {
        console.error("[ClientProviders] Failed to fetch CSRF token:", error);
      }
    };

    fetchCsrf();
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

  return (
    <StyledComponentsRegistry>
      <ConfigProvider theme={memoizedTheme}>
        <ThemeProvider theme={memoizedTheme}>
          <GlobalStyles />
          <AuthProvider>
            <CookieConsentProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </CookieConsentProvider>
          </AuthProvider>
        </ThemeProvider>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}
