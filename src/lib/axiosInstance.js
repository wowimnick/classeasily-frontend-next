// src/lib/axiosInstance.js - FIXED VERSION WITH ISR SUPPORT AND AUTO-LOGIN REDIRECT
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
  // Use custom adapter for ISR support
  adapter: nextJsFetchAdapter,
});

// Request interceptor - NO CSRF TOKEN NEEDED FOR JWT
axiosInstance.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    
    // REMOVED: CSRF token logic - not needed for JWT auth
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto-login redirect on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || !originalRequest.url) {
      console.error('[Axios] Error without valid config:', error.message);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.log(`[Axios] 401 Unauthorized: ${originalRequest.method} ${originalRequest.url}`);
      
      // Don't auto-redirect for these endpoints (they're expected to return 401)
      const skipAutoRedirectEndpoints = [
        '/login/',
        '/token/refresh/',
        '/auth/registration/',
        '/auth/google/',
        '/logout/',
      ];
      
      const shouldSkipRedirect = skipAutoRedirectEndpoints.some(endpoint => 
        originalRequest.url.includes(endpoint)
      );
      
      if (!shouldSkipRedirect) {
        console.log('[Axios] Session expired during user action, triggering login modal');
        
        // Dynamically import to avoid circular dependencies
        Promise.all([
          import('./auth-client'),
          import('./message')
        ]).then(([authModule, messageModule]) => {
          const { saveRedirectPath, useAuthStore } = authModule;
          const message = messageModule.default;
          
          // Show toast notification
          message.warning('Your session has expired. Please log in again.', 4);
          
          // Save current path for redirect after login
          saveRedirectPath(window.location.pathname);
          
          // Clear user state and open login modal
          const store = useAuthStore.getState();
          store.clearUser();
          store.setShouldOpenAuthModal(true);
        }).catch(err => {
          console.error('[Axios] Failed to trigger login modal:', err);
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;