"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { businessService } from "@/services/apiService";

const SubscriptionContext = createContext({
  subscription: null,
  scheduledDowngrade: null,
  widgetSubscriptionRequired: false,
  hasWidgetAccess: false,
  hasMembershipAccess: false,
  hasEmailMarketingAccess: false,
  hasStripeSubscription: false,
  loading: true,
  error: null,
  refetch: () => {},
  subscribe: async () => ({ success: false }),
  cancel: async () => ({ success: false }),
  reactivate: async () => ({ success: false }),
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
  const [hasMembershipAccess, setHasMembershipAccess] = useState(false);
  const [hasEmailMarketingAccess, setHasEmailMarketingAccess] = useState(false);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canManageSubscription = Boolean(isAuthenticated && user?.has_business);

  const refetch = useCallback(async () => {
    if (!canManageSubscription) {
      setSubscription(null);
      setScheduledDowngrade(null);
      setWidgetSubscriptionRequired(false);
      setHasWidgetAccess(false);
      setHasMembershipAccess(false);
      setHasEmailMarketingAccess(false);
      setHasStripeSubscription(false);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await businessService.getWidgetSubscription();
    setLoading(false);
    if (result.success && result.data) {
      setSubscription(result.data.subscription ?? null);
      setScheduledDowngrade(result.data.scheduled_downgrade ?? null);
      setWidgetSubscriptionRequired(Boolean(result.data.widget_subscription_required));
      setHasWidgetAccess(Boolean(result.data.has_widget_access));
      setHasMembershipAccess(Boolean(result.data.has_membership_access));
      setHasEmailMarketingAccess(Boolean(result.data.has_email_marketing_access));
      setHasStripeSubscription(Boolean(result.data.has_stripe_subscription));
    } else {
      setSubscription(null);
      setScheduledDowngrade(null);
      setWidgetSubscriptionRequired(false);
      setHasWidgetAccess(false);
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

  const subscribe = useCallback(
    async (planId) => {
      const result = await businessService.subscribeWidgetPlan(planId);
      if (result.success && result.data?.subscription != null && !result.data?.requires_payment) {
        setSubscription(result.data.subscription);
        refetch();
      }
      return result;
    },
    [refetch],
  );

  const cancel = useCallback(async () => {
    const result = await businessService.cancelWidgetSubscription();
    if (result.success && result.data?.subscription) {
      setSubscription(result.data.subscription);
      refetch();
    }
    return result;
  }, [refetch]);

  const reactivate = useCallback(async () => {
    const result = await businessService.reactivateWidgetSubscription();
    if (result.success && result.data?.subscription) {
      setSubscription(result.data.subscription);
      refetch();
    }
    return result;
  }, [refetch]);

  const value = useMemo(
    () => ({
      subscription,
      scheduledDowngrade,
      widgetSubscriptionRequired,
      hasWidgetAccess,
      hasMembershipAccess,
      hasEmailMarketingAccess,
      hasStripeSubscription,
      loading,
      error,
      refetch,
      subscribe,
      cancel,
      reactivate,
      canManageSubscription,
    }),
    [
      subscription,
      scheduledDowngrade,
      widgetSubscriptionRequired,
      hasWidgetAccess,
      hasMembershipAccess,
      hasEmailMarketingAccess,
      hasStripeSubscription,
      loading,
      error,
      refetch,
      subscribe,
      cancel,
      reactivate,
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
