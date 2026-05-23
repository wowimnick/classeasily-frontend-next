// lib/auth-client.js - OPTIMISTIC VERSION WITH REDIRECT MANAGEMENT
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "./axiosInstance";

// ============================================================================
// REDIRECT MANAGEMENT
// ============================================================================
const REDIRECT_PATH_KEY = "redirectAfterLogin";
const REDIRECT_PERMISSION_KEY = "redirectRequiredPermission";

/** Default landing route for accounts with platform admin access. */
export const ADMIN_DASHBOARD_PATH = "/admin/overview";

/**
 * Django permission as returned by `CustomUserDetailsSerializer.permissions`
 * (formatted `app_label.codename`).
 */
export const ADMIN_DASHBOARD_PERM = "quickstart.access_admin_dashboard";

export function userMayAccessPlatformAdmin(user) {
  return Boolean(user?.permissions?.includes(ADMIN_DASHBOARD_PERM));
}

export const saveRedirectPath = (path, requiredPermission = null) => {
  if (typeof window === "undefined") return;

  console.log(
    "[Auth] Saving redirect path:",
    path,
    "permission:",
    requiredPermission,
  );
  localStorage.setItem(REDIRECT_PATH_KEY, path);

  if (requiredPermission) {
    localStorage.setItem(REDIRECT_PERMISSION_KEY, requiredPermission);
  } else {
    localStorage.removeItem(REDIRECT_PERMISSION_KEY);
  }
};

export const getRedirectPath = () => {
  if (typeof window === "undefined") return null;

  return {
    path: localStorage.getItem(REDIRECT_PATH_KEY),
    requiredPermission: localStorage.getItem(REDIRECT_PERMISSION_KEY),
  };
};

export const clearRedirectPath = () => {
  if (typeof window === "undefined") return;

  console.log("[Auth] Clearing redirect path");
  localStorage.removeItem(REDIRECT_PATH_KEY);
  localStorage.removeItem(REDIRECT_PERMISSION_KEY);
};

export const handlePostLoginRedirect = (user, router) => {
  if (typeof window === "undefined") return false;

  const { path: redirectPath, requiredPermission } = getRedirectPath();

  if (userMayAccessPlatformAdmin(user)) {
    if (redirectPath && redirectPath.startsWith("/business/")) {
      clearRedirectPath();
      router.push(redirectPath);
      return true;
    }
    if (
      redirectPath &&
      (redirectPath.startsWith("/admin") || redirectPath.startsWith("/admin/"))
    ) {
      clearRedirectPath();
      router.push(
        redirectPath === "/admin"
          ? ADMIN_DASHBOARD_PATH
          : redirectPath.startsWith("/admin/")
          ? redirectPath
          : ADMIN_DASHBOARD_PATH,
      );
      return true;
    }
    if (
      redirectPath &&
      redirectPath !== "/" &&
      requiredPermission &&
      user?.permissions?.includes(requiredPermission)
    ) {
      clearRedirectPath();
      router.push(redirectPath);
      return true;
    }
    console.log("[Auth] Platform admin user — redirect to admin dashboard");
    clearRedirectPath();
    router.push(ADMIN_DASHBOARD_PATH);
    return true;
  }

  if (user?.has_business) {
    if (redirectPath && redirectPath.startsWith("/business/")) {
      clearRedirectPath();
      router.push(redirectPath);
      return true;
    }
    console.log("[Auth] User has business, redirecting to business dashboard");
    clearRedirectPath();
    router.push("/business/dashboard/overview");
    return true;
  }

  if (redirectPath && redirectPath !== "/") {
    const targetPath =
      redirectPath === "/business" ? "/business/register" : redirectPath;
    clearRedirectPath();
    if (requiredPermission) {
      if (user?.permissions?.includes(requiredPermission)) {
        router.push(targetPath);
        return true;
      }
      console.log("[Auth] User lacks permission for saved redirect");
      return false;
    }
    router.push(targetPath);
    return true;
  }

  clearRedirectPath();
  return false;
};

// ============================================================================
// OPTIMISTIC AUTH STATE - Read from localStorage synchronously
// ============================================================================
export const getOptimisticAuthState = () => {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false, isImpersonating: false };
  }

  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.state?.user || null,
        isAuthenticated: parsed.state?.isAuthenticated || false,
        isImpersonating: parsed.state?.isImpersonating || false,
      };
    }
  } catch (error) {
    console.error("[AuthStore] Failed to read optimistic state:", error);
  }

  return { user: null, isAuthenticated: false, isImpersonating: false };
};

/** Bumped when impersonation starts so in-flight initialize/refresh cannot stomp session. */
let authInitGeneration = 0;

const bumpAuthInitGeneration = () => {
  authInitGeneration += 1;
  return authInitGeneration;
};

// ============================================================================
// ZUSTAND STORE - Client-side auth state management
// ============================================================================
// Use fixed initial state (no localStorage read) so server and client match
// and avoid hydration mismatch / white screen on reload. Persist middleware
// will rehydrate from storage after mount.
export const useAuthStore = create(
  persist(
    (set, get) => {
      return {
        // Same initial state on server and client to prevent hydration mismatch
        user: null,
        isAuthenticated: false,
        isImpersonating: false,

        // Loading states
        isLoading: true,
        isInitialized: false,
        isInitializing: false,
        _hasHydrated: false,
        updateLoading: false,
        updateError: null,
        registrationLoading: false,
        invitationSuccess: false,
        error: null,

        // Redirect state
        shouldOpenAuthModal: false,

        setUser: (user) => {
          console.log("[AuthStore] setUser called:", {
            userId: user?.id,
            userName: user?.first_name,
            hasUser: !!user,
          });
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        },

        clearUser: () => {
          console.log("[AuthStore] clearUser called");
          set({
            user: null,
            isAuthenticated: false,
            isImpersonating: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        },

        setLoading: (loading) => {
          console.log("[AuthStore] setLoading:", loading);
          set({ isLoading: loading });
        },

        setUpdateLoading: (loading) => {
          set({ updateLoading: loading });
        },

        setUpdateError: (error) => {
          set({ updateError: error });
        },

        clearUpdateError: () => {
          set({ updateError: null });
        },

        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        resetInvitationStatus: () => {
          set({ invitationSuccess: false });
        },

        setHydrated: () => {
          console.log("[AuthStore] setHydrated called");
          set({ _hasHydrated: true });
        },

        setShouldOpenAuthModal: (shouldOpen) => {
          console.log("[AuthStore] setShouldOpenAuthModal:", shouldOpen);
          set({ shouldOpenAuthModal: shouldOpen });
        },

        initialize: async () => {
          const state = get();

          if (!state._hasHydrated) return;

          if (state.isInitialized || state.isInitializing) return;

          if (!state.user || !state.isAuthenticated) {
            console.log("[AuthStore] No user in state, skipping refresh");
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              isInitializing: false,
            });
            return;
          }

          const initGeneration = authInitGeneration;
          console.log("[AuthStore] Starting initialization process...");
          set({ isLoading: true, isInitializing: true });

          try {
            console.log("[AuthStore] Calling /token/refresh/ endpoint...");
            const response = await axiosInstance.post("/token/refresh/");

            if (initGeneration !== authInitGeneration) {
              console.log("[AuthStore] Stale initialize refresh ignored");
              set({ isLoading: false, isInitializing: false });
              return;
            }

            console.log("[AuthStore] Refresh successful");

            set({
              user: response.data.user,
              isAuthenticated: true,
              isImpersonating: get().isImpersonating,
              isLoading: false,
              isInitialized: true,
              isInitializing: false,
            });
          } catch (error) {
            if (initGeneration !== authInitGeneration) {
              console.log("[AuthStore] Stale initialize failure ignored");
              set({ isLoading: false, isInitializing: false });
              return;
            }

            console.log("[AuthStore] Refresh failed:", error.message);

            const current = get();
            if (current.isImpersonating) {
              set({
                isLoading: false,
                isInitialized: true,
                isInitializing: false,
              });
              return;
            }

            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              isInitializing: false,
            });
          }
        },
      };
    },
    {
      name: "auth-storage",
      skipHydration: true, // Defer rehydration until after first paint so server and client initial render match (avoids React #418).
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isImpersonating: state.isImpersonating,
      }),
      onRehydrateStorage: () => {
        console.log("[AuthStore] onRehydrateStorage - hydration starting...");
        return (_state, error) => {
          if (error) {
            console.error("[AuthStore] Hydration error:", error);
          } else {
            console.log("[AuthStore] Hydration complete");
          }
          // Defer setState so we don't reference useAuthStore before it's assigned
          // (callback runs during create(persist(...)), causing TDZ "Cannot access 'g' before initialization").
          queueMicrotask(() => {
            const latestPersisted = getOptimisticAuthState();
            const current = useAuthStore.getState();
            useAuthStore.setState({
              _hasHydrated: true,
              isInitialized: false,
              isInitializing: false,
              isImpersonating:
                current.isImpersonating || latestPersisted.isImpersonating,
            });
          });
        };
      },
    },
  ),
);

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

export const signInWithDjango = async (email, password, router = null) => {
  try {
    console.log("[Auth] signInWithDjango - attempting login");
    const response = await axiosInstance.post("/login/", { email, password });

    if (response.data.user) {
      console.log("[Auth] Login successful");
      useAuthStore.getState().setUser(response.data.user);

      // Handle redirect if router is provided
      if (router) {
        const didRedirect = handlePostLoginRedirect(response.data.user, router);
        if (!didRedirect) {
          // No redirect occurred, might want to go to dashboard or stay
          console.log("[Auth] No redirect path found");
        }
      }

      return { success: true, user: response.data.user };
    }

    throw new Error("No user data received");
  } catch (error) {
    console.error("[Auth] Login failed:", error);
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Invalid credentials";
    throw new Error(message);
  }
};

export const signUpWithDjango = async (userData) => {
  try {
    console.log("[Auth] signUpWithDjango - attempting registration");
    const response = await axiosInstance.post("/auth/registration/", userData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("[Auth] Registration failed:", error);
    throw error.response?.data || error;
  }
};

export const signInWithGoogle = async (accessToken, router = null) => {
  try {
    console.log("[Auth] signInWithGoogle - attempting Google auth");
    const response = await axiosInstance.post("/auth/google/", {
      access_token: accessToken,
    });

    if (response.data.user) {
      console.log("[Auth] Google auth successful");
      useAuthStore.getState().setUser(response.data.user);

      // Handle redirect if router is provided
      if (router) {
        const didRedirect = handlePostLoginRedirect(response.data.user, router);
        if (!didRedirect) {
          console.log("[Auth] No redirect path found");
        }
      }

      return { success: true, user: response.data.user };
    }

    throw new Error("Google authentication failed");
  } catch (error) {
    console.error("[Auth] Google auth failed:", error);
    const message = error.response?.data?.detail || "Google login failed";
    throw new Error(message);
  }
};

export const signOutFull = async (router) => {
  try {
    console.log("[Auth] signOutFull - logging out");
    await axiosInstance.post("/logout/");
  } catch (error) {
    console.warn("[Auth] Logout API call failed:", error);
  } finally {
    // Clear redirect path on logout
    clearRedirectPath();

    useAuthStore.getState().clearUser();

    if (router) {
      router.push("/");
      router.refresh();
    }
  }
};

// ============================================================================
// GLOBAL REDIRECT TO LOGIN FUNCTION
// ============================================================================
export const redirectToLogin = (path, requiredPermission = null) => {
  console.log("[Auth] redirectToLogin called:", { path, requiredPermission });

  // Save the redirect path
  saveRedirectPath(path, requiredPermission);

  // Set flag to open auth modal
  useAuthStore.getState().setShouldOpenAuthModal(true);
};

// ============================================================================
// USER UPDATE FUNCTION
// ============================================================================

export const updateUserDetails = async ({ payload, localAvatarUrl }) => {
  const store = useAuthStore.getState();

  try {
    store.setUpdateLoading(true);
    store.setUpdateError(null);

    // Optimistic update for avatar
    if (localAvatarUrl && store.user) {
      store.setUser({
        ...store.user,
        avatar_thumb_url: localAvatarUrl,
        avatar_medium_url: localAvatarUrl,
      });
    }

    console.log("[Auth] updateUserDetails - calling API");
    const response = await axiosInstance.patch("/user/update/", payload);

    console.log("[Auth] User update successful");
    store.setUser(response.data);
    store.setUpdateLoading(false);

    return { success: true, user: response.data };
  } catch (error) {
    console.error("[Auth] User update failed:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      "Update failed. Please try again.";

    store.setUpdateError(errorMessage);
    store.setUpdateLoading(false);

    throw new Error(errorMessage);
  }
};

// ============================================================================
// IMPERSONATION FUNCTION
// ============================================================================

export const impersonateUser = async (userId) => {
  const store = useAuthStore.getState();

  try {
    store.setLoading(true);
    store.setError(null);

    console.log("[Auth] impersonateUser - calling API for userId:", userId);
    const response = await axiosInstance.post(`/admin/impersonate/${userId}/`);

    if (response.data.success && response.data.data?.user) {
      console.log("[Auth] Impersonation successful");
      const userData = response.data.data.user;

      store.setUser(userData);
      store.setLoading(false);

      return { success: true, user: userData };
    }

    throw new Error(response.data.error || "Impersonation failed");
  } catch (error) {
    console.error("[Auth] Impersonation failed:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Impersonation failed";

    store.setError(message);
    store.setLoading(false);

    throw new Error(message);
  }
};

// ============================================================================
// BUSINESS REGISTRATION FUNCTION
// ============================================================================

export const registerBusiness = async (formData) => {
  const store = useAuthStore.getState();

  try {
    store.setLoading(true);
    store.setError(null);

    console.log("[Auth] registerBusiness - calling API");
    const response = await axiosInstance.post("/business/register/", formData);

    if (response.data.success) {
      console.log("[Auth] Business registration successful");
      store.setLoading(false);
      return { success: true, data: response.data };
    }

    throw new Error(response.data.error || "Registration failed");
  } catch (error) {
    console.error("[Auth] Business registration failed:", error);
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Registration failed";

    store.setLoading(false);
    store.setError(errorMessage);

    throw error.response?.data || { error: errorMessage };
  }
};

// ============================================================================
// ACCEPT INVITATION FUNCTION
// ============================================================================

export const acceptInvitation = async (token) => {
  const store = useAuthStore.getState();

  try {
    store.setLoading(true);
    store.setError(null);
    store.resetInvitationStatus();

    console.log("[Auth] acceptInvitation - calling API");
    const response = await axiosInstance.post(
      "/business/staff/accept-invitation/",
      {
        token,
      },
    );

    if (response.data.success) {
      console.log("[Auth] Invitation accepted successfully");

      const userPayload = response.data.user || response.data.data?.user;

      if (userPayload) {
        store.setUser(userPayload);
        store.setLoading(false);

        useAuthStore.setState({ invitationSuccess: true });

        return { success: true, user: userPayload };
      }

      store.setLoading(false);
      useAuthStore.setState({ invitationSuccess: true });

      return { success: true };
    }

    throw new Error(response.data.error || "Could not accept invitation");
  } catch (error) {
    console.error("[Auth] Accept invitation failed:", error);
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Could not accept invitation";

    store.setLoading(false);
    store.setError(errorMessage);

    throw error.response?.data || { error: errorMessage };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const isAuthenticated = () => {
  return useAuthStore.getState().isAuthenticated;
};

export const getCurrentUser = () => {
  return useAuthStore.getState().user;
};

export const refreshUser = async () => {
  const refreshGeneration = authInitGeneration;

  try {
    console.log("[Auth] refreshUser - calling token refresh");
    const response = await axiosInstance.post("/token/refresh/");

    if (refreshGeneration !== authInitGeneration) {
      return useAuthStore.getState().user;
    }

    useAuthStore.getState().setUser(response.data.user);
    return response.data.user;
  } catch (error) {
    console.error("[Auth] refreshUser failed:", error);

    if (refreshGeneration !== authInitGeneration) {
      throw error;
    }

    const { isImpersonating } = useAuthStore.getState();
    if (!isImpersonating) {
      useAuthStore.getState().clearUser();
    }
    throw error;
  }
};

/**
 * Complete admin → business impersonation: sync client store with rotated cookies when possible,
 * then land on the host dashboard so RSC/nav matches the impersonated JWT.
 *
 * Important: avoids `refreshUser()` which clears auth on transient refresh failure right after impersonate sets cookies.
 */
export async function applyImpersonationSession(userPayload, router) {
  if (typeof window === "undefined") return;

  bumpAuthInitGeneration();

  useAuthStore.setState({
    user: userPayload,
    isAuthenticated: true,
    isImpersonating: true,
    isLoading: false,
    isInitialized: true,
    isInitializing: false,
  });

  if (!router) return;

  const impersonationGeneration = authInitGeneration;

  try {
    console.log("[Auth] applyImpersonationSession — token refresh sync");
    const response = await axiosInstance.post("/token/refresh/");
    if (
      impersonationGeneration === authInitGeneration &&
      response.data?.user
    ) {
      useAuthStore.setState({
        user: response.data.user,
        isAuthenticated: true,
        isImpersonating: true,
        isLoading: false,
        isInitialized: true,
        isInitializing: false,
      });
    }
  } catch (error) {
    console.warn(
      "[Auth] applyImpersonationSession refresh skipped:",
      error?.message || error,
    );
    if (impersonationGeneration === authInitGeneration) {
      useAuthStore.setState({
        isImpersonating: true,
        isInitialized: true,
        isInitializing: false,
        isLoading: false,
      });
    }
  }

  router.push("/business/dashboard/overview");
  if (typeof router.refresh === "function") {
    router.refresh();
  }
}

// ============================================================================
// REACT HOOK for components
// ============================================================================
export const useAuth = () => {
  const store = useAuthStore();

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isImpersonating: store.isImpersonating,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    updateLoading: store.updateLoading,
    updateError: store.updateError,
    registrationLoading: store.registrationLoading,
    invitationSuccess: store.invitationSuccess,
    error: store.error,
    shouldOpenAuthModal: store.shouldOpenAuthModal,

    // Actions
    signIn: signInWithDjango,
    signUp: signUpWithDjango,
    signInWithGoogle,
    signOut: signOutFull,
    refreshUser,
    updateUserDetails,
    impersonateUser,
    registerBusiness,
    acceptInvitation,
    clearError: store.clearError,
    clearUpdateError: store.clearUpdateError,
    resetInvitationStatus: store.resetInvitationStatus,
    setShouldOpenAuthModal: store.setShouldOpenAuthModal,

    // Redirect utilities
    redirectToLogin,
    saveRedirectPath,
    clearRedirectPath,
    getRedirectPath,
  };
};
