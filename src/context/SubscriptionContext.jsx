"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { businessService } from "@/services/apiService";

const SubscriptionContext = createContext({
  subscription: null,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canManageSubscription = Boolean(isAuthenticated && user?.has_business);

  const refetch = useCallback(async () => {
    if (!canManageSubscription) {
      setSubscription(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await businessService.getWidgetSubscription();
    setLoading(false);
    if (result.success && result.data?.subscription) {
      setSubscription(result.data.subscription);
    } else {
      setSubscription(null);
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
      if (result.success && result.data?.subscription) {
        setSubscription(result.data.subscription);
      }
      return result;
    },
    [],
  );

  const cancel = useCallback(async () => {
    const result = await businessService.cancelWidgetSubscription();
    if (result.success && result.data?.subscription) {
      setSubscription(result.data.subscription);
    }
    return result;
  }, []);

  const reactivate = useCallback(async () => {
    const result = await businessService.reactivateWidgetSubscription();
    if (result.success && result.data?.subscription) {
      setSubscription(result.data.subscription);
    }
    return result;
  }, []);

  const value = {
    subscription,
    loading,
    error,
    refetch,
    subscribe,
    cancel,
    reactivate,
    canManageSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export default SubscriptionContext;
