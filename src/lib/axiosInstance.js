// src/lib/axiosInstance.js - FIXED SESSION EXPIRATION HANDLING
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_TIMEOUT = 99999999;

function getCookie(name) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Custom adapter for Next.js ISR support
async function nextJsFetchAdapter(config) {
  if (!config || !config.url) {
    throw new Error('Axios adapter called without valid config');
  }

  const isGetRequest = config.method?.toUpperCase() === 'GET';

  // For GET requests on server, use native fetch with Next.js caching
  if (isGetRequest && typeof window === 'undefined' && typeof fetch !== 'undefined') {
    try {
      const baseURL = API_BASE_URL;
      if (!baseURL) {
        throw new Error('baseURL is missing. Ensure NEXT_PUBLIC_API_URL is set.');
      }

      let url = config.url;
      if (!url.startsWith('http')) {
        url = baseURL + (url.startsWith('/') ? url : '/' + url);
      }

      // Add query params
      if (config.params) {
        const params = new URLSearchParams();
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(key, String(value));
          }
        });
        const queryString = params.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }

      // CRITICAL: Enable caching for Next.js ISR
      const response = await fetch(url, {
        method: 'GET',
        headers: config.headers || {},
        cache: 'force-cache',
        next: { 
          revalidate: 3600,
          tags: ['api-cache']
        },
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config,
        request: {},
      };
    } catch (error) {
      const axiosError = new Error(error.message);
      axiosError.config = config;
      axiosError.request = {};
      axiosError.response = {
        status: 500,
        statusText: error.message,
        data: error.message,
      };
      throw axiosError;
    }
  }

  // For non-GET or client-side, use default adapter
  const configWithoutAdapter = { ...config };
  delete configWithoutAdapter.adapter;
  const defaultAdapter = axios.getAdapter(axios.defaults.adapter);
  return defaultAdapter(configWithoutAdapter);
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: nextJsFetchAdapter,
});

// Track if we're handling session expiration globally
let sessionExpirationPromise = null;

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with FIXED session expiration handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || !originalRequest.url) {
      console.error('[Axios] Error without valid config:', error.message);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Session Expired
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = originalRequest.url;
      
      // Don't trigger session expiration for auth-related endpoints
      const isAuthEndpoint = url.includes('/auth/registration/') || 
                            url.includes('/login/') || 
                            url.includes('/auth/google/') ||
                            url.includes('/token/refresh/') ||
                            url.includes('/logout/') ||
                            url.includes('/auth/password/reset/');

      // If it's not an auth endpoint
      if (!isAuthEndpoint) {
        console.log('[Axios] Session expired - 401 on:', url);

        // If we're already handling session expiration, wait for it
        if (sessionExpirationPromise) {
          console.log('[Axios] Already handling session expiration, waiting...');
          await sessionExpirationPromise;
          return Promise.reject(error);
        }

        // Create a promise to handle session expiration
        sessionExpirationPromise = (async () => {
          try {
            // Import dynamically to avoid circular dependency
            const { useAuthStore } = await import('./auth-client');
            const { redirectToLogin } = await import('./auth-client');
            
            // Get current path before clearing
            const currentPath = window.location.pathname + window.location.search;
            
            // Clear user state
            console.log('[Axios] Clearing user state due to session expiration');
            useAuthStore.getState().clearUser();
            
            // Save redirect path and trigger login modal
            // Only save non-home paths
            if (currentPath !== '/' && currentPath !== '') {
              console.log('[Axios] Saving redirect path:', currentPath);
              redirectToLogin(currentPath);
            } else {
              // Just open modal without redirect
              useAuthStore.getState().setShouldOpenAuthModal(true);
            }
          } finally {
            // Reset the promise after 2 seconds
            setTimeout(() => {
              sessionExpirationPromise = null;
            }, 2000);
          }
        })();

        await sessionExpirationPromise;
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;