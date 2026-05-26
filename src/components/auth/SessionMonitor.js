"use client";

import { useEffect, useRef } from "react";
import { useAuthStore, refreshUser } from "@/lib/auth-client";

/**
 * SessionMonitor - Proactively monitors session validity
 * 
 * Features:
 * - Checks session when user returns from being idle
 * - Validates session on page visibility change
 * - Prevents permission errors by catching expired sessions early
 * - Updates auth state after successful token refresh
 */
export const SessionMonitor = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const lastCheckRef = useRef(0);
  const isCheckingRef = useRef(false);

  // Check session validity and UPDATE auth state
  const checkSession = async () => {
    // Don't check if not authenticated or already checking
    if (!isAuthenticated || isCheckingRef.current) {
      return;
    }

    const now = Date.now();

    // Rate limit: only check once every 30 seconds (skip on first check)
    if (lastCheckRef.current !== 0) {
      const timeSinceLastCheck = now - lastCheckRef.current;
      if (timeSinceLastCheck < 30000) {
        return;
      }
    }

    try {
      isCheckingRef.current = true;
      lastCheckRef.current = now;

      console.log("[SessionMonitor] Checking session validity...");
      
      // Use refreshUser instead of raw axios call - this updates the store
      await refreshUser();
      
      console.log("[SessionMonitor] Session is valid and user state refreshed");
    } catch (error) {
      // If it's a 401, the axios interceptor will handle the session expiration
      if (error.response?.status === 401) {
        console.log("[SessionMonitor] Session expired, axios interceptor will handle it");
      } else {
        console.error("[SessionMonitor] Error checking session:", error.message);
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // Only run if user is authenticated and initialized
    if (!isAuthenticated || !isInitialized) {
      return;
    }

    // Check session when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[SessionMonitor] Page became visible, checking session...");
        checkSession();
      }
    };

    // Check session when user interacts after being idle
    const handleUserActivity = () => {
      const timeSinceLastCheck = Date.now() - lastCheckRef.current;
      // If it's been more than 5 minutes since last check, validate session
      if (timeSinceLastCheck > 5 * 60 * 1000) {
        console.log("[SessionMonitor] User returned from idle, checking session...");
        checkSession();
      }
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for user activity after idle
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial check on mount (client-only; ref stays 0 until first check runs)
    checkSession();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, isInitialized]);

  return null; // This component doesn't render anything
};

export default SessionMonitor;