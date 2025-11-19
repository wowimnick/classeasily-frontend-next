// src/app/business/dashboard/_components/SetupGuideWrapper.jsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { businessService } from "@/services/apiService";
import BusinessSetupGuide from "./BusinessSetupGuide";

const DEBUG_ALWAYS_SHOW_SETUP_GUIDE = false;

export default function SetupGuideWrapper({ sideMenuRef }) {
  // State for setup guide is now completely isolated here.
  const [setupStatus, setSetupStatus] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [displaySetupGuide, setDisplaySetupGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data fetching logic is also isolated.
  const fetchSetupStatus = useCallback(async () => {
    console.error("[SetupGuideWrapper] Fetching setup guide status...");
    try {
      const response = await businessService.fetchMyBusinessOverview();
      if (response.success && response.data?.setup_progress) {
        const setupProgress = response.data.setup_progress;
        const allComplete =
          setupProgress.is_stripe_connected &&
          setupProgress.is_profile_complete &&
          setupProgress.has_created_class &&
          setupProgress.has_class_options &&
          setupProgress.has_schedules;

        setSetupStatus(setupProgress);
        setIsSetupComplete(allComplete);
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE || !allComplete);
      } else {
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
      }
    } catch (error) {
      console.error("[SetupGuideWrapper] Failed to fetch status:", error);
      setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSetupStatus();
  }, [fetchSetupStatus]);

  // If we're loading or shouldn't display, render nothing.
  if (isLoading || !displaySetupGuide) {
    return null;
  }

  // Only render the real component when ready.
  return (
    <BusinessSetupGuide
      key="setup-guide-widget"
      sideMenuRef={sideMenuRef}
      setupStatus={setupStatus}
      initialOpen={!isSetupComplete}
    />
  );
}
