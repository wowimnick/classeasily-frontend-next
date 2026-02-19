// src/lib/axiosInstance.js

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

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    // Let axios set multipart/form-data (with boundary) for FormData; instance default is application/json
    if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// SILENT REFRESH & RETRY LOGIC
// ============================================================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || !originalRequest.url) {
      console.error('[Axios] Error without valid config:', error.message);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Session Expired
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      const url = originalRequest.url;
      
      // Ignored endpoints that shouldn't trigger refresh logic to avoid loops
      const isAuthEndpoint = url.includes('/auth/registration/') || 
                            url.includes('/login/') || 
                            url.includes('/auth/google/') ||
                            url.includes('/token/refresh/') || // Don't refresh the refresh endpoint
                            url.includes('/logout/') ||
                            url.includes('/auth/password/reset/');

      // If it's not an auth endpoint, attempt silent refresh
      if (!isAuthEndpoint) {
        if (isRefreshing) {
          // If already refreshing, queue this request to retry after refresh completes
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then(function() {
              return axiosInstance(originalRequest);
            })
            .catch(function(err) {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log('[Axios] 401 detected on non-auth endpoint. Attempting silent refresh...');
          
          // Attempt to refresh the cookie
          await axiosInstance.post('/token/refresh/');
          
          console.log('[Axios] Silent refresh successful. Retrying original request.');
          
          // Process any queued requests (retry them)
          processQueue(null, true);
          
          // Retry the original request
          return axiosInstance(originalRequest);
          
        } catch (refreshError) {
          console.error('[Axios] Silent refresh failed:', refreshError);
          
          // Fail all queued requests
          processQueue(refreshError, null);
          
          // Handle UI feedback (Modal vs Redirect)
          try {
            // Import dynamically to avoid circular dependency
            const { useAuthStore, redirectToLogin } = await import('./auth-client');
            
            // Clear user state
            console.log('[Axios] Clearing user state due to session expiration');
            useAuthStore.getState().clearUser();
            
            // Check if we are on the business or registration page (so after login we send them to registration)
            const currentPath = window.location.pathname + window.location.search;
            const isBusinessOrRegisterPage =
              currentPath.startsWith('/business/register') || currentPath === '/business';

            if (isBusinessOrRegisterPage) {
              const { saveRedirectPath } = await import('./auth-client');
              saveRedirectPath('/business/register');
              console.log('[Axios] Business/register page detected. Opening auth modal; will redirect to /business/register after auth.');
              useAuthStore.getState().setShouldOpenAuthModal(true);
            } else if (currentPath !== '/' && currentPath !== '') {
              // For other pages, use standard redirect logic
              redirectToLogin(currentPath);
            } else {
              useAuthStore.getState().setShouldOpenAuthModal(true);
            }
          } catch (importError) {
            console.error('[Axios] Error importing auth client:', importError);
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;