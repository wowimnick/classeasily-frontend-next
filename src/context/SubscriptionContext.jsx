"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { businessService } from "@/services/apiService";

const SubscriptionContext = createContext({
  subscription: null,
  scheduledDowngrade: null,
  widgetSubscriptionRequired: false,
  hasWidgetAccess: false,
  hasWidgetAnalytics: false,
  hasMembershipAccess: false,
  hasEmailMarketingAccess: false,
  hasStripeSubscription: false,
  publicWidgetPlans: null,
  loading: true,
  error: null,
  refetch: () => {},
  canManageSubscription: false,
});

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}

export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useAuthUser();
  const [subscription, setSubscription] = useState(null);
  const [scheduledDowngrade, setScheduledDowngrade] = useState(null);
  const [widgetSubscriptionRequired, setWidgetSubscriptionRequired] = useState(false);
  const [hasWidgetAccess, setHasWidgetAccess] = useState(false);
  const [hasWidgetAnalytics, setHasWidgetAnalytics] = useState(false);
  const [hasMembershipAccess, setHasMembershipAccess] = useState(false);
  const [hasEmailMarketingAccess, setHasEmailMarketingAccess] = useState(false);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [publicWidgetPlans, setPublicWidgetPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canManageSubscription = Boolean(isAuthenticated && user?.has_business);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const plansResult = await businessService.getPublicWidgetPlans();
    if (plansResult.success && plansResult.data) {
      setPublicWidgetPlans(plansResult.data);
    } else {
      setPublicWidgetPlans(null);
    }
    if (!canManageSubscription) {
      setSubscription(null);
      setScheduledDowngrade(null);
      setWidgetSubscriptionRequired(false);
      setHasWidgetAccess(false);
      setHasWidgetAnalytics(false);
      setHasMembershipAccess(false);
      setHasEmailMarketingAccess(false);
      setHasStripeSubscription(false);
      setLoading(false);
      setError(null);
      return;
    }
    const result = await businessService.getWidgetSubscription();
    setLoading(false);
    if (result.success && result.data) {
      setSubscription(result.data.subscription ?? null);
      setScheduledDowngrade(result.data.scheduled_downgrade ?? null);
      setWidgetSubscriptionRequired(Boolean(result.data.widget_subscription_required));
      setHasWidgetAccess(Boolean(result.data.has_widget_access));
      setHasWidgetAnalytics(Boolean(result.data.has_widget_analytics));
      setHasMembershipAccess(Boolean(result.data.has_membership_access));
      setHasEmailMarketingAccess(Boolean(result.data.has_email_marketing_access));
      setHasStripeSubscription(Boolean(result.data.has_stripe_subscription));
    } else {
      setSubscription(null);
      setScheduledDowngrade(null);
      setWidgetSubscriptionRequired(false);
      setHasWidgetAccess(false);
      setHasWidgetAnalytics(false);
      setHasMembershipAccess(false);
      setHasEmailMarketingAccess(false);
      setHasStripeSubscription(false);
      if (!result.success && result.error) {
        setError(result.error);
      }
    }
  }, [canManageSubscription]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({
      subscription,
      scheduledDowngrade,
      widgetSubscriptionRequired,
      hasWidgetAccess,
      hasWidgetAnalytics,
      hasMembershipAccess,
      hasEmailMarketingAccess,
      hasStripeSubscription,
      publicWidgetPlans,
      loading,
      error,
      refetch,
      canManageSubscription,
    }),
    [
      subscription,
      scheduledDowngrade,
      widgetSubscriptionRequired,
      hasWidgetAccess,
      hasWidgetAnalytics,
      hasMembershipAccess,
      hasEmailMarketingAccess,
      hasStripeSubscription,
      publicWidgetPlans,
      loading,
      error,
      refetch,
      canManageSubscription,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export default SubscriptionContext;
