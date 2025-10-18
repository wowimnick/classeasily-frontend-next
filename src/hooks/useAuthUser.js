// src/hooks/useAuthUser.js - OPTIMISTIC VERSION

"use client";

import { useAuth } from "@/lib/auth-client";

/**
 * Custom hook that provides optimistic auth state.
 * Shows cached user immediately, then updates after backend verification.
 */
export const useAuthUser = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    error 
  } = useAuth();

  // Show optimistic state immediately (from localStorage)
  // Backend verification happens in background
  const safeUser = user ? {
    ...user,
    userId: user.userId,
  } : null;

  return {
    user: safeUser,
    isAuthenticated: isAuthenticated && !!safeUser?.userId,
    // Only show loading during backend verification, not initial render
    isLoading: isLoading && !isInitialized,
    isActionLoading: isLoading,
    isReady: true, // Always ready - we have optimistic state
    isVerified: isInitialized, // Backend has verified the state
    hasError: !!error,
    error: error,
  };
};