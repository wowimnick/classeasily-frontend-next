// src/app/business/dashboard/_components/SetupGuideWrapper.jsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { businessService } from "@/services/apiService";
import { useSubscription } from "@/context/SubscriptionContext";
import BusinessSetupGuide from "./BusinessSetupGuide";

const DEBUG_ALWAYS_SHOW_SETUP_GUIDE = false;

function isCoreSetupComplete(setupProgress) {
  if (!setupProgress) return false;
  // Stripe Connect is required and blocking: bookings cannot be accepted
  // until payouts are connected.
  if (!setupProgress.is_stripe_connected) return false;
  return (
    setupProgress.is_profile_complete &&
    setupProgress.has_created_class &&
    setupProgress.has_class_options &&
    setupProgress.has_schedules
  );
}

function isWidgetSetupComplete(setupProgress) {
  const ws = setupProgress?.widget_setup;
  if (!ws) return true;
  return Boolean(ws.has_widget_domains && ws.has_widget_embed_verified);
}

export default function SetupGuideWrapper({ sideMenuRef }) {
  const { hasWidgetAccess, loading: subLoading } = useSubscription();
  const [setupStatus, setSetupStatus] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [displaySetupGuide, setDisplaySetupGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSetupStatus = useCallback(async () => {
    try {
      const response = await businessService.fetchMyBusinessOverview();
      if (response.success && response.data?.setup_progress) {
        const setupProgress = response.data.setup_progress;
        const coreComplete = isCoreSetupComplete(setupProgress);
        const widgetComplete =
          !hasWidgetAccess || isWidgetSetupComplete(setupProgress);
        const allComplete = coreComplete && widgetComplete;

        setSetupStatus(setupProgress);
        setIsSetupComplete(allComplete);
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE || !allComplete);
      } else {
        setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
      }
    } catch (error) {
      setDisplaySetupGuide(DEBUG_ALWAYS_SHOW_SETUP_GUIDE);
    } finally {
      setIsLoading(false);
    }
  }, [hasWidgetAccess]);

  useEffect(() => {
    if (subLoading) return;
    fetchSetupStatus();
  }, [fetchSetupStatus, subLoading]);

  if (isLoading || subLoading || !displaySetupGuide) {
    return null;
  }

  return (
    <BusinessSetupGuide
      key="setup-guide-widget"
      sideMenuRef={sideMenuRef}
      setupStatus={setupStatus}
      hasWidgetAccess={hasWidgetAccess}
      initialOpen={!isSetupComplete}
    />
  );
}
