"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { businessService } from "@/services/apiService";

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
};

const DEBUG_ALWAYS_SHOW_SETUP_GUIDE = false;

export const DashboardProvider = ({ children }) => {
  console.error("🟢 DashboardProvider - COMPONENT RENDER START");

  const [setupGuideInitialStatus, setSetupGuideInitialStatus] = useState(null);
  const [allSetupStepsCompleteActual, setAllSetupStepsCompleteActual] =
    useState(false);
  const [displaySetupGuide, setDisplaySetupGuide] = useState(false);
  const [setupGuideLoading, setSetupGuideLoading] = useState(true);

  const fetchSetupGuideData = useCallback(async () => {
    console.error("🟢 DashboardContext - fetchSetupGuideData CALLED");
    setSetupGuideLoading(true);
    try {
      console.error("🟢 DashboardContext - Fetching from businessService...");
      const response = await businessService.fetchMyBusinessOverview();
      console.error(
        "🟢 DashboardContext - Response received:",
        response.success
      );

      if (response.success && response.data) {
        const setupProgress = response.data.setup_progress;
        if (setupProgress) {
          const allActuallyComplete =
            setupProgress.is_stripe_connected &&
            setupProgress.is_profile_complete &&
            setupProgress.has_created_class &&
            setupProgress.has_class_options &&
            setupProgress.has_schedules;

          console.error(
            "🟢 DashboardContext - Setup complete:",
            allActuallyComplete
          );
          setAllSetupStepsCompleteActual(allActuallyComplete);
          setSetupGuideInitialStatus(setupProgress);
          setDisplaySetupGuide(
            DEBUG_ALWAYS_SHOW_SETUP_GUIDE || !allActuallyComplete
          );
        } else {
          console.error("🟢 DashboardContext - No setup progress data");
          setAllSetupStepsCompleteActual(false);
          setSetupGuideInitialStatus(null);
          setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
        }
      } else {
        console.error("🟢 DashboardContext - Fetch failed:", response.error);
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
      }
    } catch (error) {
      console.error("🟢 DashboardContext - ERROR:", error);
      setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
    } finally {
      console.error(
        "🟢 DashboardContext - Fetch complete, setting loading to false"
      );
      setSetupGuideLoading(false);
    }
  }, []);

  useEffect(() => {
    console.error(
      "🟢 DashboardContext - Provider mounted, calling fetchSetupGuideData"
    );
    fetchSetupGuideData();
  }, [fetchSetupGuideData]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    console.error("🟢 DashboardContext - Creating new context value object");
    return {
      setupGuideInitialStatus,
      allSetupStepsCompleteActual,
      displaySetupGuide,
      setupGuideLoading,
      fetchSetupGuideData,
    };
  }, [
    setupGuideInitialStatus,
    allSetupStepsCompleteActual,
    displaySetupGuide,
    setupGuideLoading,
    fetchSetupGuideData,
  ]);

  console.error("🟢 DashboardContext - Provider rendering with value:", {
    setupGuideLoading,
    displaySetupGuide,
  });

  console.error(
    "🟢 DashboardProvider - COMPONENT RENDER END - returning Provider"
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
