// lib/auth-client.js - OPTIMISTIC VERSION WITH REDIRECT MANAGEMENT
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from './axiosInstance';

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
        console.log('[AuthStore] onRehydrateStorage - hydration starting...');
        return (state, error) => {
          if (error) {
            console.error('[AuthStore] Hydration error:', error);
          } else {
            console.log('[AuthStore] Hydration complete');
          }
          
          if (state) {
            state._hasHydrated = true;
            state.isInitialized = false;
            state.isInitializing = false;
          }
        };
      },
    }
  )
);

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

export const signInWithDjango = async (email, password, router = null) => {
  try {
    console.log('[Auth] signInWithDjango - attempting login');
    const response = await axiosInstance.post('/login/', { email, password });

    if (response.data.user) {
      console.log('[Auth] Login successful');
      useAuthStore.getState().setUser(response.data.user);
      
      // Handle redirect if router is provided
      if (router) {
        const didRedirect = handlePostLoginRedirect(response.data.user, router);
        if (!didRedirect) {
          // No redirect occurred, might want to go to dashboard or stay
          console.log('[Auth] No redirect path found');
        }
      }
      
      return { success: true, user: response.data.user };
    }

    throw new Error('No user data received');
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    const message = error.response?.data?.detail || 
                   error.response?.data?.message || 
                   'Invalid credentials';
    throw new Error(message);
  }
};

export const signUpWithDjango = async (userData) => {
  try {
    console.log('[Auth] signUpWithDjango - attempting registration');
    const response = await axiosInstance.post('/auth/registration/', userData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Auth] Registration failed:', error);
    throw error.response?.data || error;
  }
};

export const signInWithGoogle = async (accessToken, router = null) => {
  try {
    console.log('[Auth] signInWithGoogle - attempting Google auth');
    const response = await axiosInstance.post('/auth/google/', {
      access_token: accessToken,
    });

    if (response.data.user) {
      console.log('[Auth] Google auth successful');
      useAuthStore.getState().setUser(response.data.user);
      
      // Handle redirect if router is provided
      if (router) {
        const didRedirect = handlePostLoginRedirect(response.data.user, router);
        if (!didRedirect) {
          console.log('[Auth] No redirect path found');
        }
      }
      
      return { success: true, user: response.data.user };
    }

    throw new Error('Google authentication failed');
  } catch (error) {
    console.error('[Auth] Google auth failed:', error);
    const message = error.response?.data?.detail || 'Google login failed';
    throw new Error(message);
  }
};

export const signOutFull = async (router) => {
  try {
    console.log('[Auth] signOutFull - logging out');
    await axiosInstance.post('/logout/');
  } catch (error) {
    console.warn('[Auth] Logout API call failed:', error);
  } finally {
    // Clear redirect path on logout
    clearRedirectPath();
    
    useAuthStore.getState().clearUser();
    
    if (router) {
      router.push('/');
      router.refresh(); 
    }
  }
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
    const response = await axiosInstance.patch('/user/profile/', payload);
    
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