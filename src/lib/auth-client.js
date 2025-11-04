// lib/auth-client.js - OPTIMISTIC VERSION WITH AUTO SESSION REFRESH
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from './axiosInstance';

// ============================================================================
// SESSION REFRESH CONFIGURATION
// ============================================================================
const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh every 10 minutes
const IDLE_TIMEOUT = 30 * 60 * 1000; // Consider idle after 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

let refreshTimer = null;
let lastActivityTime = Date.now();
let activityListenersAttached = false;

// ============================================================================
// REDIRECT MANAGEMENT
// ============================================================================
const REDIRECT_PATH_KEY = 'redirectAfterLogin';
const REDIRECT_PERMISSION_KEY = 'redirectRequiredPermission';

export const saveRedirectPath = (path, requiredPermission = null) => {
  if (typeof window === 'undefined') return;
  
  console.log('[Auth] Saving redirect path:', path, 'permission:', requiredPermission);
  localStorage.setItem(REDIRECT_PATH_KEY, path);
  
  if (requiredPermission) {
    localStorage.setItem(REDIRECT_PERMISSION_KEY, requiredPermission);
  } else {
    localStorage.removeItem(REDIRECT_PERMISSION_KEY);
  }
};

export const getRedirectPath = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    path: localStorage.getItem(REDIRECT_PATH_KEY),
    requiredPermission: localStorage.getItem(REDIRECT_PERMISSION_KEY),
  };
};

export const clearRedirectPath = () => {
  if (typeof window === 'undefined') return;
  
  console.log('[Auth] Clearing redirect path');
  localStorage.removeItem(REDIRECT_PATH_KEY);
  localStorage.removeItem(REDIRECT_PERMISSION_KEY);
};

const handlePostLoginRedirect = (user, router) => {
  if (typeof window === 'undefined') return;

  // ALWAYS prioritize business dashboard for business users
  if (user?.has_business) {
    console.log('[Auth] User has business, redirecting to business dashboard');
    clearRedirectPath(); // Clear any saved redirects
    router.push('/business/dashboard/overview');
    return true;
  }

  const { path: redirectPath, requiredPermission } = getRedirectPath();

  // Clear redirect data
  clearRedirectPath();

  // Check if we have a saved redirect path (for non-business users)
  if (redirectPath && redirectPath !== '/') {
    console.log('[Auth] Checking redirect:', { redirectPath, requiredPermission });
    
    // If a permission was required, verify user has it
    if (requiredPermission) {
      if (user?.permissions?.includes(requiredPermission)) {
        console.log('[Auth] User has permission, redirecting to:', redirectPath);
        router.push(redirectPath);
        return true;
      } else {
        console.log('[Auth] User lacks permission, staying on current page');
        return false;
      }
    }
    
    // No permission required - redirect to original path
    console.log('[Auth] No permission required, redirecting to:', redirectPath);
    router.push(redirectPath);
    return true;
  }
  
  return false;
};

// ============================================================================
// OPTIMISTIC AUTH STATE - Read from localStorage synchronously
// ============================================================================
const getOptimisticAuthState = () => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.state?.user || null,
        isAuthenticated: parsed.state?.isAuthenticated || false,
        isImpersonating: parsed.state?.isImpersonating || false,
      };
    }
  } catch (error) {
    console.error('[AuthStore] Failed to read optimistic state:', error);
  }
  
  return { user: null, isAuthenticated: false, isImpersonating: false };
};

// ============================================================================
// SESSION REFRESH MANAGER
// ============================================================================
const startSessionRefreshTimer = (store) => {
  if (typeof window === 'undefined') return;
  
  // Clear existing timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  // Only start if user is authenticated
  if (!store.isAuthenticated) {
    console.log('[SessionRefresh] User not authenticated, skipping timer setup');
    return;
  }
  
  console.log('[SessionRefresh] Starting automatic session refresh timer');
  
  // Set up periodic refresh
  refreshTimer = setInterval(async () => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    
    // Don't refresh if user has been idle too long
    if (timeSinceActivity > IDLE_TIMEOUT) {
      console.log('[SessionRefresh] User idle for too long, skipping refresh');
      return;
    }
    
    console.log('[SessionRefresh] Auto-refreshing session...');
    try {
      const response = await axiosInstance.post('/token/refresh/');
      store.setUser(response.data.user);
      console.log('[SessionRefresh] Session refreshed successfully');
    } catch (error) {
      console.error('[SessionRefresh] Auto-refresh failed:', error);
      
      // If refresh fails with 401, user session is invalid
      if (error.response?.status === 401) {
        console.log('[SessionRefresh] Session expired, logging out and showing login');
        
        // Import message dynamically to avoid circular dependencies
        import('./message').then(({ default: message }) => {
          message.warning('Your session has expired. Please log in again.', 4);
        }).catch(() => {
          console.log('[SessionRefresh] Could not show toast message');
        });
        
        // Save current path for redirect after login
        if (typeof window !== 'undefined') {
          saveRedirectPath(window.location.pathname);
        }
        
        // Clear user and open login modal
        store.clearUser();
        store.setShouldOpenAuthModal(true);
        stopSessionRefreshTimer();
      }
    }
  }, SESSION_REFRESH_INTERVAL);
};

const stopSessionRefreshTimer = () => {
  if (refreshTimer) {
    console.log('[SessionRefresh] Stopping session refresh timer');
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  // Remove activity listeners
  if (activityListenersAttached && typeof window !== 'undefined') {
    ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, handleUserActivity);
    });
    activityListenersAttached = false;
  }
};

const handleUserActivity = () => {
  lastActivityTime = Date.now();
};

const setupActivityListeners = () => {
  if (typeof window === 'undefined' || activityListenersAttached) return;
  
  console.log('[SessionRefresh] Setting up activity listeners');
  ACTIVITY_EVENTS.forEach(event => {
    window.addEventListener(event, handleUserActivity, { passive: true });
  });
  activityListenersAttached = true;
  
  // Initialize activity time
  lastActivityTime = Date.now();
};

// ============================================================================
// ZUSTAND STORE - Client-side auth state management
// ============================================================================
export const useAuthStore = create(
  persist(
    (set, get) => {
      // Get optimistic initial state
      const optimisticState = getOptimisticAuthState();
      
      return {
        // START WITH OPTIMISTIC STATE
        user: optimisticState.user,
        isAuthenticated: optimisticState.isAuthenticated,
        isImpersonating: optimisticState.isImpersonating,
        
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
          console.log('[AuthStore] setUser called:', {
            userId: user?.id,
            userName: user?.first_name,
            hasUser: !!user,
          });
          set({ 
            user, 
            isAuthenticated: !!user, 
            isLoading: false 
          });
          
          // Start session refresh when user is set
          if (user) {
            const store = get();
            setupActivityListeners();
            startSessionRefreshTimer(store);
          }
        },
        
        clearUser: () => {
          console.log('[AuthStore] clearUser called');
          set({ 
            user: null, 
            isAuthenticated: false,
            isImpersonating: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          
          // Stop session refresh when user is cleared
          stopSessionRefreshTimer();
        },
        
        setLoading: (loading) => {
          console.log('[AuthStore] setLoading:', loading);
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
          console.log('[AuthStore] setHydrated called');
          set({ _hasHydrated: true });
        },
        
        setShouldOpenAuthModal: (shouldOpen) => {
          console.log('[AuthStore] setShouldOpenAuthModal:', shouldOpen);
          set({ shouldOpenAuthModal: shouldOpen });
        },

        initialize: async () => {
          const state = get();
          
          console.log('[AuthStore] initialize called, current state:', {
            _hasHydrated: state._hasHydrated,
            isInitialized: state.isInitialized,
            isInitializing: state.isInitializing,
          });
          
          if (!state._hasHydrated) {
            console.log('[AuthStore] Waiting for hydration, skipping initialize');
            return;
          }
          
          if (state.isInitialized || state.isInitializing) {
            console.log('[AuthStore] Already initialized or initializing, skipping');
            return;
          }

          console.log('[AuthStore] Starting initialization process...');
          set({ isLoading: true, isInitializing: true });

          try {
            console.log('[AuthStore] Calling /token/refresh/ endpoint...');
            const response = await axiosInstance.post('/token/refresh/');
            
            console.log('[AuthStore] Refresh successful');
            
            set({ 
              user: response.data.user,
              isAuthenticated: true, 
              isLoading: false,
              isInitialized: true,
              isInitializing: false 
            });
            
            // Start session refresh timer after successful initialization
            setupActivityListeners();
            startSessionRefreshTimer(get());
            
          } catch (error) {
            console.log('[AuthStore] Refresh failed:', error.message);
            
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              isInitialized: true,
              isInitializing: false 
            });
          }
        },

        signIn: async (credentials, router) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('[AuthStore] signIn - Calling backend');
            const response = await axiosInstance.post('/token/', credentials);
            
            const user = response.data.user;
            
            console.log('[AuthStore] Login successful');
            set({ 
              user,
              isAuthenticated: true,
              isLoading: false 
            });
            
            // Start session refresh after login
            setupActivityListeners();
            startSessionRefreshTimer(get());
            
            if (router) {
              handlePostLoginRedirect(user, router);
            }
            
            return { success: true, user };
          } catch (error) {
            console.error('[AuthStore] Login failed:', error);
            const message = error.response?.data?.message || 
                           error.response?.data?.detail || 
                           'Login failed';
            set({ 
              isLoading: false,
              error: message 
            });
            throw new Error(message);
          }
        },

        signUp: async (formData, router) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('[AuthStore] signUp - Calling backend');
            const response = await axiosInstance.post('/register/', formData);
            
            const user = response.data.user;
            
            console.log('[AuthStore] Registration successful');
            set({ 
              user,
              isAuthenticated: true,
              isLoading: false 
            });
            
            // Start session refresh after registration
            setupActivityListeners();
            startSessionRefreshTimer(get());
            
            if (router) {
              handlePostLoginRedirect(user, router);
            }
            
            return { success: true, user };
          } catch (error) {
            console.error('[AuthStore] Registration failed:', error);
            const message = error.response?.data?.message || 
                           error.response?.data?.detail || 
                           'Registration failed';
            set({ 
              isLoading: false,
              error: message 
            });
            throw new Error(message);
          }
        },

        signInWithGoogle: async (credentialResponse, router) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('[AuthStore] Google Sign In - Calling backend');
            const response = await axiosInstance.post('/social-auth/google/', {
              credential: credentialResponse.credential,
            });
            
            const user = response.data.user;
            
            console.log('[AuthStore] Google login successful');
            set({ 
              user,
              isAuthenticated: true,
              isLoading: false 
            });
            
            // Start session refresh after Google login
            setupActivityListeners();
            startSessionRefreshTimer(get());
            
            if (router) {
              handlePostLoginRedirect(user, router);
            }
            
            return { success: true, user };
          } catch (error) {
            console.error('[AuthStore] Google login failed:', error);
            const message = error.response?.data?.message || 
                           error.response?.data?.detail || 
                           'Google login failed';
            set({ 
              isLoading: false,
              error: message 
            });
            throw new Error(message);
          }
        },

        signOut: async () => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('[AuthStore] Logging out');
            await axiosInstance.post('/logout/');
            
            console.log('[AuthStore] Logout successful');
            set({ 
              user: null, 
              isAuthenticated: false,
              isImpersonating: false,
              isLoading: false 
            });
            
            // Stop session refresh on logout
            stopSessionRefreshTimer();
            
            return { success: true };
          } catch (error) {
            console.error('[AuthStore] Logout failed:', error);
            
            set({ 
              user: null, 
              isAuthenticated: false,
              isImpersonating: false,
              isLoading: false 
            });
            
            // Stop session refresh even if logout failed
            stopSessionRefreshTimer();
            
            return { success: true };
          }
        },
      };
    },
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isImpersonating: state.isImpersonating,
      }),
      onRehydrateStorage: () => {
        console.log('[AuthStore] Starting rehydration');
        return (state, error) => {
          if (error) {
            console.error('[AuthStore] Rehydration error:', error);
          } else {
            console.log('[AuthStore] Rehydration complete');
            state?.setHydrated();
          }
        };
      },
    }
  )
);

// ============================================================================
// EXPORTED AUTH FUNCTIONS
// ============================================================================
export const signInWithDjango = async (credentials, router) => {
  return useAuthStore.getState().signIn(credentials, router);
};

export const signUpWithDjango = async (formData, router) => {
  return useAuthStore.getState().signUp(formData, router);
};

export const signInWithGoogle = async (credentialResponse, router) => {
  return useAuthStore.getState().signInWithGoogle(credentialResponse, router);
};

export const signOutFull = async () => {
  return useAuthStore.getState().signOut();
};

// ============================================================================
// GLOBAL REDIRECT TO LOGIN FUNCTION
// ============================================================================
export const redirectToLogin = (path, requiredPermission = null) => {
  console.log('[Auth] redirectToLogin called:', { path, requiredPermission });
  
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

    console.log('[Auth] updateUserDetails - calling API');
    const response = await axiosInstance.patch('/user/update/', payload);
    
    console.log('[Auth] User update successful');
    store.setUser(response.data);
    store.setUpdateLoading(false);
    
    return { success: true, user: response.data };
  } catch (error) {
    console.error('[Auth] User update failed:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.detail || 
                        error.message || 
                        'Update failed. Please try again.';
    
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

    console.log('[Auth] impersonateUser - calling API for userId:', userId);
    const response = await axiosInstance.post(`/admin/impersonate/${userId}/`);
    
    if (response.data.success && response.data.data?.user) {
      console.log('[Auth] Impersonation successful');
      const userData = response.data.data.user;
      
      store.setUser(userData);
      store.setLoading(false);
      
      return { success: true, user: userData };
    }
    
    throw new Error(response.data.error || 'Impersonation failed');
  } catch (error) {
    console.error('[Auth] Impersonation failed:', error);
    const message = error.response?.data?.message || 
                   error.response?.data?.detail || 
                   'Impersonation failed';
    
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

    console.log('[Auth] registerBusiness - calling API');
    const response = await axiosInstance.post('/business/register/', formData);
    
    if (response.data.success) {
      console.log('[Auth] Business registration successful');
      store.setLoading(false);
      return { success: true, data: response.data };
    }
    
    throw new Error(response.data.error || 'Registration failed');
  } catch (error) {
    console.error('[Auth] Business registration failed:', error);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Registration failed';
    
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

    console.log('[Auth] acceptInvitation - calling API');
    const response = await axiosInstance.post('/business/staff/accept-invitation/', {
      token
    });
    
    if (response.data.success) {
      console.log('[Auth] Invitation accepted successfully');
      
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
    
    throw new Error(response.data.error || 'Could not accept invitation');
  } catch (error) {
    console.error('[Auth] Accept invitation failed:', error);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Could not accept invitation';
    
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
  try {
    console.log('[Auth] refreshUser - calling token refresh');
    const response = await axiosInstance.post('/token/refresh/');
    useAuthStore.getState().setUser(response.data.user);
    return response.data.user;
  } catch (error) {
    console.error('[Auth] refreshUser failed:', error);
    useAuthStore.getState().clearUser();
    throw error;
  }
};

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