"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [setupGuideInitialStatus, setSetupGuideInitialStatus] = useState(null);
  const [allSetupStepsCompleteActual, setAllSetupStepsCompleteActual] =
    useState(false);
  const [displaySetupGuide, setDisplaySetupGuide] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await businessService.fetchMyBusinessOverview();
      if (response.success && response.data) {
        setOverviewData(response.data);

        const setupProgress = response.data.setup_progress;
        if (setupProgress) {
          const allActuallyComplete =
            setupProgress.is_stripe_connected &&
            setupProgress.is_profile_complete &&
            setupProgress.has_created_class &&
            setupProgress.has_class_options &&
            setupProgress.has_schedules;

          setAllSetupStepsCompleteActual(allActuallyComplete);
          setSetupGuideInitialStatus(setupProgress);
          setDisplaySetupGuide(
            DEBUG_ALWAYS_SHOW_SETUP_GUIDE || !allActuallyComplete
          );
        } else {
          setAllSetupStepsCompleteActual(false);
          setSetupGuideInitialStatus(null);
          setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
        }
      } else {
        setOverviewError(response.error || "Failed to fetch overview data.");
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      setOverviewError("An unexpected error occurred.");
      setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const value = {
    overviewData,
    overviewLoading,
    overviewError,
    setupGuideInitialStatus,
    allSetupStepsCompleteActual,
    displaySetupGuide,
    fetchOverviewData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
