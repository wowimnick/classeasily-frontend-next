import axiosInstance from "@/lib/axiosInstance";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: "/auth/registration/",
  AUTH_LOGIN: "/login/",
  AUTH_GOOGLE: "/auth/google/",
  AUTH_REFRESH: "/token/refresh/",
  AUTH_LOGOUT: "/logout/",
  PASSWORD_RESET: "/auth/password/reset/",
  PASSWORD_RESET_CONFIRM: "/auth/password/reset/confirm/",

  // User Self-Service
  USER_UPDATE: "/user/update/",
  MY_PROFILE: "/user/profile/",
  MY_FAVORITES: "/my-favorites/",

  // Business Management
  BUSINESS_REGISTER: "/business/register/",
  MY_BUSINESSES: "/my-businesses/",
  MY_BUSINESS_PROFILE: "/my-business/profile/",
  MY_BUSINESS_OVERVIEW: "/my-business/overview/",
  BUSINESS_STATS: "/business-stats/",
  BUSINESS_CLASSES: "/business/classes/",
  BUSINESS_SCHEDULES: "/business/schedules/",
  BUSINESS_SCHEDULE_INSTANCES: "/business/schedule-instances/",
  BUSINESS_BOOKINGS: "/business/bookings/",
  BUSINESS_STUDENTS: "/business/students/",
  BUSINESS_CONTACT_INFO: "/business/classes/contact-info/",
  BUSINESS_DISCOUNTS: "/business/discounts/",
  BUSINESS_PAYOUTS: "/business/payouts/",
  REVENUE_ANALYTICS: "/revenue/analytics/",
  BUSINESS_STAFF: "/business/staff/",
  BUSINESS_ROLES: "/business/roles/",
  ACCEPT_INVITE: "/business/accept-invitation/",
  MY_BUSINESS_WIDGET_CONFIG: "/my-business/widget-config/",

  // Student Self-Service
  STUDENT_BOOKINGS: "/my-bookings/",

  // Public Endpoints
  PUBLIC_CLASSES: "/classes/",
  PUBLIC_CATEGORIES: "/categories/",
  TOGGLE_FAVORITE: (classId) => `/classes/${classId}/toggle-favorite/`,
  PUBLIC_BUSINESSES: "/businesses/",
  PUBLIC_SCHEDULES: "/schedules/",
  PUBLIC_BLOG_POSTS: "/blog/posts/",
  PUBLIC_BLOG_CATEGORIES: "/blog/categories/",

  // Reviews
  REVIEWS_SUBMIT: "/reviews/submit/",

  // Payments
  PAYMENTS_CREATE_INTENT: "/payments/create-payment-intent/",
  PAYMENTS_UPDATE_INTENT: "/payments/update-payment-intent/",
  PAYMENTS_CANCEL_INTENT: "/payments/cancel-payment-intent/",
  PAYMENTS_WEBHOOK: "/payments/webhook/",

  // --- CORRECTED COURSE ENDPOINTS ---
  BUSINESS_COURSES: "/business/course-management/",
  PUBLIC_COURSES: "/business/courses/",
  STUDENT_COURSE_ENROLLMENTS: "/business/student/course-enrollments/",

  // Support & Chat
  SUPPORT_TICKETS: "/support-tickets/",
  CHAT_MESSAGE: "/chat/message/",

  // Notifications
  NOTIFICATIONS: "/business/notifications/",
  NOTIFICATIONS_UNREAD_COUNT: "/business/notifications/unread-count/",
  NOTIFICATION_MARK_READ: (notificationId) =>
    `/business/notifications/${notificationId}/mark-read/`,
};

// ==========================================================================
// Service Definitions
// ==========================================================================

// --- File Upload Service ---
export const uploadService = {
  uploadFile: async (file, uploadType) => {
    if (!file) {
      return { success: false, error: "No file provided." };
    }
    if (!uploadType) {
      return {
        success: false,
        error: 'An upload type (e.g., "avatar") must be specified.',
      };
    }

    // Step 1: Request a pre-signed URL from our backend
    let presignedData;
    try {
      // --- THE FIX: Pass the uploadType to the backend ---
      const response = await axiosInstance.post(
        "/business/generate-upload-url/",
        {
          fileName: file.name,
          contentType: file.type,
          uploadType: uploadType, // <-- NEW: Send the context
        }
      );
      presignedData = response.data;
    } catch (error) {
      console.error(
        "Error getting pre-signed URL:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Could not prepare upload.",
      };
    }

    // Step 2: Use the pre-signed data to upload the file directly to S3
    const formData = new FormData();
    Object.keys(presignedData.fields).forEach((key) => {
      formData.append(key, presignedData.fields[key]);
    });

    formData.append("Content-Type", file.type);
    formData.append("file", file);

    try {
      const s3Response = await fetch(presignedData.url, {
        method: "POST",
        body: formData,
      });

      if (!s3Response.ok) {
        const errorText = await s3Response.text();
        console.error("S3 Upload Error Response:", errorText);
        let errorMessage = "File upload failed.";
        if (errorText.includes("EntityTooLarge")) {
          errorMessage = "The selected file is too large.";
        } else if (errorText.includes("Policy Condition failed")) {
          errorMessage =
            "File type is not allowed or is not being sent correctly.";
        }
        throw new Error(errorMessage);
      }

      return { success: true, s3_key: presignedData.s3_key }; // Use s3_key from the response
    } catch (error) {
      console.error("Error uploading to S3:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred during upload.",
      };
    }
  },
};

export const blogService = {
  getPosts: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PUBLIC_BLOG_POSTS,
        { params }
      );
      // The backend view paginates, so response.data will have { count, next, previous, results }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching blog posts:",
        error.response?.data || error
      );
      return {
        success: false,
        error: "Failed to fetch blog posts",
        data: null,
      };
    }
  },

  getPostBySlug: async (slug) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_BLOG_POSTS}${slug}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching blog post with slug ${slug}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 404
          ? "Blog post not found."
          : "Failed to fetch post.";
      return { success: false, error: errorMessage, data: null };
    }
  },

  getCategories: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PUBLIC_BLOG_CATEGORIES
      );
      // Backend returns a simple array for public view
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching blog categories:",
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch categories", data: [] };
    }
  },
};
// --- Payment Service ---
export const paymentService = {
  createPaymentIntent: async (bookingPayload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.PAYMENTS_CREATE_INTENT,
        bookingPayload
      );
      return response.data;
    } catch (error) {
      console.error(
        "Payment API error creating intent:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  },
  updatePaymentIntent: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.PAYMENTS_UPDATE_INTENT,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating payment intent:", error);
      throw error.response?.data || error;
    }
  },
  cancelPaymentIntent: async (paymentIntentId) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.PAYMENTS_CANCEL_INTENT,
        { payment_intent_id: paymentIntentId }
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling booking:", error);
      throw error.response?.data || error;
    }
  },
};

// --- Auth & User Services ---
export const userService = {
  register: async (formData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH_REGISTER,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error during registration:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.PASSWORD_RESET, {
        email,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error during password reset request:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: "Password reset request failed.",
        details: error.response?.data,
      };
    }
  },

  confirmPasswordReset: async (data) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.PASSWORD_RESET_CONFIRM,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error during password reset confirmation:",
        error.response?.data || error.message
      );
      throw (
        error.response?.data || {
          detail: "Password reset failed. Link may be invalid or expired.",
        }
      );
    }
  },

  updateUserProfile: async (userData) => {
    try {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.USER_UPDATE,
        userData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error updating user profile:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  },

  loginWithGoogle: async (accessToken) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH_GOOGLE, {
        access_token: accessToken,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error during Google login API call:",
        error.response?.data || error.message
      );
      throw (
        error.response?.data || {
          detail: "Google login failed due to an unknown error.",
        }
      );
    }
  },

  login: async (email, password) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH_LOGIN, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error during login:",
        error.response?.data || error.message
      );
      throw (
        error.response?.data || {
          detail: "Login failed due to an unknown error.",
        }
      );
    }
  },

  getMyFavoriteClasses: async (page = 1, pageSize = 12) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_FAVORITES, {
        params: { page, page_size: pageSize },
      });
      return {
        success: true,
        data: response.data.results || [],
        count: response.data.count || 0,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      console.error(
        "Error fetching favorite classes:",
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 401
          ? "Please log in to view favorites."
          : error.response?.data?.detail || "Failed to fetch favorites";
      return { success: false, error: errorMessage, data: [], count: 0 };
    }
  },

  getMyProfile: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_PROFILE);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching user profile:",
        error.response?.data || error
      );
      const message =
        error.response?.status === 401
          ? "Unauthorized. Please log in."
          : error.response?.data?.detail || "Failed to fetch profile";
      return { success: false, error: message };
    }
  },
};

// Role display and hierarchy functions
export const getRoleDisplayName = (roleName) => {
  if (!roleName) return "Guest";
  const roleMap = {
    "Super Admin": "Super Admin",
    Admin: "Administrator",
    "Business Owner": "Business Owner",
    Manager: "Manager",
    Instructor: "Instructor",
    "Content Creator": "Content Creator",
    Student: "Student",
  };
  return roleMap[roleName] || roleName;
};

// --- Business Service ---
export const businessService = {
  registerBusiness: async (jsonData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_REGISTER,
        jsonData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error registering business:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to register business",
      };
    }
  },

  getMyBusinesses: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESSES);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching user's businesses:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch businesses",
      };
    }
  },

  getMyBusinessProfile: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_PROFILE
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business profile:",
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 404
          ? "No business profile associated with this user."
          : error.response?.data?.detail || "Failed to fetch business profile";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  updateMyBusinessProfile: async (jsonData) => {
    try {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.MY_BUSINESS_PROFILE,
        jsonData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error updating business profile:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to update profile",
      };
    }
  },

  deleteMyBusinessProfile: async () => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_PROFILE);
      return { success: true };
    } catch (error) {
      console.error(
        "Error deleting business profile:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete profile",
      };
    }
  },

  fetchMyBusinessOverview: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_OVERVIEW
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching dashboard overview for current user:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 404
          ? "No business profile associated with this user."
          : error.response?.status === 403
          ? "Permission denied."
          : error.response?.data?.detail ||
            error.response?.data?.error ||
            "Failed to fetch dashboard overview";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  getWidgetConfig: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_CONFIG
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching widget config:",
        error.response?.data || error
      );
      const errorMessage =
        error.response?.data?.detail || "Failed to load widget settings.";
      return { success: false, error: errorMessage };
    }
  },

  updateWidgetConfig: async (configData) => {
    try {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_CONFIG,
        configData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error updating widget config:",
        error.response?.data || error
      );
      const errorData = error.response?.data;
      // Handle nested validation errors if they exist
      const errorMessage =
        typeof errorData === "object" && errorData !== null
          ? Object.values(errorData).flat().join(" ")
          : "Failed to save widget settings.";
      return {
        success: false,
        error: errorMessage || "An unknown error occurred.",
      };
    }
  },

  fetchBusinessReviews: async (slug, page = 1, pageSize = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_BUSINESSES}${slug}/reviews/`,
        { params: { page, page_size: pageSize } }
      );
      return {
        success: true,
        data: response.data.results || [],
        hasMore: !!response.data.next,
      };
    } catch (error) {
      console.error(
        `Error fetching reviews for business ${slug}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: "Failed to load reviews.",
        data: [],
        hasMore: false,
      };
    }
  },

  fetchPublicBusinesses: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PUBLIC_BUSINESSES,
        { params }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching public businesses:",
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch businesses" };
    }
  },

  fetchPublicBusinessDetail: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_BUSINESSES}${businessId}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching public business detail:",
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 404
          ? "Business not found."
          : error.response?.data?.detail || "Failed to fetch business details";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  fetchImportedGoogleReviews: async (businessId, sampleSize = 10) => {
    try {
      const response = await axiosInstance.get(
        `/business/${businessId}/google-reviews/`,
        {
          params: { sample_size: sampleSize },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching imported Google reviews for business ${businessId}:`,
        error
      );
      return { success: false, error: "Failed to load Google reviews." };
    }
  },

  fetchBusinessContactDetails: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `/businesses/${businessId}/contact_details/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching contact details for business ${businessId}:`,
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.detail || "Could not load contact details.",
      };
    }
  },

  fetchDashboardStats: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_STATS}${businessId}/dashboard_stats/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching dashboard stats for business ${businessId}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 403
          ? "Permission denied to view dashboard stats."
          : error.response?.data?.detail || "Failed to fetch dashboard stats";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  fetchRevenueOverTime: async (businessId, timeframe = "monthly") => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_STATS}${businessId}/revenue_over_time/`,
        { params: { timeframe } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching revenue over time for business ${businessId}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 403
          ? "Permission denied."
          : error.response?.data?.detail || "Failed to fetch revenue data";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  fetchClassPerformance: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_STATS}${businessId}/class_performance/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching class performance for business ${businessId}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 403
          ? "Permission denied."
          : error.response?.data?.detail || "Failed to fetch class performance";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },
  createStripeAccountLink: async () => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/my-business/stripe-connect/`
      ); // Ensure this matches your backend URL
      return { success: true, data: response.data }; // Expects { accountLinkUrl: "..." }
    } catch (error) {
      console.error(
        "Error creating Stripe account link:",
        error.response?.data || error
      );
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to initiate Stripe connection",
      };
    }
  },

  getStripeConnectStatus: async () => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/my-business/stripe-connect/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching Stripe connect status:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch Stripe status",
      };
    }
  },
  fetchPayoutSummary: async () => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_PAYOUTS}summary/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching payout summary:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch payout summary",
      };
    }
  },
  exportPayoutDetails: async (payoutId) => {
    if (!payoutId) {
      return { success: false, error: "Payout ID is required." };
    }
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_PAYOUTS}${payoutId}/export/`,
        { responseType: "blob" } // Important: tells axios to expect a file
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from the Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `payout_${payoutId}_details.csv`; // Fallback filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up by removing the link and revoking the object URL
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error(`Error exporting payout details for ${payoutId}:`, error);
      let errorText = "Failed to export payout details.";
      // Try to read the error message if the response was a JSON error blob
      if (error.response?.data instanceof Blob) {
        try {
          const errorJson = JSON.parse(await error.response.data.text());
          errorText = errorJson.error || errorText;
        } catch {
          /* Ignore if parsing fails */
        }
      }
      return { success: false, error: errorText };
    }
  },

  fetchBusinessPayouts: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.BUSINESS_PAYOUTS, {
        params,
      });
      // Expecting { count, next, previous, results }
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "Error fetching business payouts:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch payout history",
      };
    }
  },
  fetchPayoutBookings: async (payoutId, params = {}) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_PAYOUTS}${payoutId}/bookings/`,
        { params }
      );
      // Expecting { count, next, previous, results }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching bookings for payout ${payoutId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error:
          error.response?.data?.detail || "Failed to fetch payout bookings",
      };
    }
  },
};

// --- Class Services (Public Context) ---
export const classService = {
  fetchClasses: async (filters = {}, fullUrl = null) => {
    try {
      const url = fullUrl || API_ENDPOINTS.PUBLIC_CLASSES;

      const config = fullUrl ? {} : { params: filters };

      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching public classes:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  },
  getPublicCategories: async () => {
    try {
      // We use the public endpoint, not the admin one
      const response = await axiosInstance.get(API_ENDPOINTS.PUBLIC_CATEGORIES);
      // The new viewset doesn't paginate, so it returns the array directly.
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching public categories:", error);
      return { success: false, error: "Failed to fetch categories" };
    }
  },

  toggleFavoriteClass: async (classId) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.TOGGLE_FAVORITE(classId)
      );
      return { success: true, isFavorited: response.data.is_favorited };
    } catch (error) {
      console.error(
        `Error toggling favorite for class ${classId}:`,
        error.response?.data || error
      );
      let errorMessage = "Could not update favorite status.";
      if (error.response?.status === 401) {
        errorMessage = "Please log in to favorite classes.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  fetchClassDetail: async (slug) => {
    try {
      console.log("=== fetchClassDetail called ===");
      console.log("Slug received:", slug);
      console.log(
        "API_ENDPOINTS.PUBLIC_CLASSES:",
        API_ENDPOINTS.PUBLIC_CLASSES
      );

      if (!slug) {
        throw new Error("Class slug is required");
      }

      const url = `${API_ENDPOINTS.PUBLIC_CLASSES}${slug}/`;
      console.log("Final URL:", url);

      const response = await axiosInstance.get(url);
      console.log("Response received:", response.status);

      return response.data;
    } catch (error) {
      console.error("=== Error in fetchClassDetail ===");
      console.error("Slug:", slug);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      throw error;
    }
  },

  searchClasses: async (params = {}, signal) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, value);
        }
      });
      const url = `${
        API_ENDPOINTS.PUBLIC_CLASSES
      }search/?${queryParams.toString()}`;
      const response = await axiosInstance.get(url, { signal });
      return response.data;
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        throw error; // Don't log this as a console error
      }
      console.error("Error searching classes:", error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  fetchClassReviewsPaginated: async (classId, page = 1, pageSize = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_CLASSES}${classId}/reviews/`,
        {
          params: { page, page_size: pageSize },
        }
      );
      return {
        success: true,
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {},
        counts: response.data.counts || {},
      };
    } catch (error) {
      console.error(
        "Error fetching paginated class reviews:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch reviews",
        reviews: [],
        pagination: {},
        counts: {},
      };
    }
  },
};

// --- Class Services (Business Context) ---
export const businessClassService = {
  getContactInfo: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_CONTACT_INFO
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching business contact info:",
        error.response?.data || error
      );
      throw error;
    }
  },
  fetchBusinessClasses: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.BUSINESS_CLASSES, {
        params,
      });
      return {
        success: true,
        data:
          response.data.results !== undefined
            ? response.data.results
            : response.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error(
        "Error fetching business classes:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch classes",
      };
    }
  },

  createClass: async (jsonData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_CLASSES,
        jsonData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating class:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to create class",
      };
    }
  },

  updateClass: async (classId, jsonData) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/`,
        jsonData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating class:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to update class",
      };
    }
  },

  deleteClass: async (classId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/`
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Error deleting/deactivating class:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete class",
      };
    }
  },

  toggleClassActive: async (classId) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/toggle-active/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error toggling class active status:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to toggle status",
      };
    }
  },

  uploadClassImages: async (classId, images) => {
    try {
      const formData = new FormData();
      Array.from(images).forEach((imageFile) => {
        if (imageFile instanceof File) {
          formData.append("images", imageFile);
        }
      });
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/images/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error uploading class images:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to upload images",
      };
    }
  },

  deleteClassImage: async (classId, imageId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/images/${imageId}/`
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Error deleting class image:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete image",
      };
    }
  },

  getCategories: async () => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/business/all-categories/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching categories:",
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch categories" };
    }
  },
};

export const contactImportService = {
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post(
        `${BASE_URL}/business/contact-import/upload/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error uploading import file:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Could not upload file.",
      };
    }
  },

  startProcessing: async (filePath, columnMapping) => {
    try {
      const payload = {
        file_path: filePath,
        column_mapping: columnMapping,
      };
      const response = await axiosInstance.post(
        `${BASE_URL}/business/contact-import/start-processing/`,
        payload
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error starting import processing:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to start import.",
      };
    }
  },
};

export const businessDiscountService = {
  getDiscounts: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_DISCOUNTS,
        { params }
      );
      return {
        success: true,
        data:
          response.data.results !== undefined
            ? response.data.results
            : response.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error(
        "Error fetching business discounts:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch discounts",
      };
    }
  },

  createDiscount: async (discountData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_DISCOUNTS,
        discountData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating discount:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to create discount",
      };
    }
  },

  updateDiscount: async (discountId, discountData) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_DISCOUNTS}${discountId}/`,
        discountData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error updating discount ${discountId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to update discount",
      };
    }
  },

  deleteDiscount: async (discountId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_DISCOUNTS}${discountId}/`
      );
      return { success: true };
    } catch (error) {
      console.error(
        `Error deleting discount ${discountId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete discount",
      };
    }
  },

  toggleDiscountActive: async (discountId) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_DISCOUNTS}${discountId}/toggle-active/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error toggling discount ${discountId} status:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to toggle status",
      };
    }
  },

  validateCoupon: async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_DISCOUNTS}validate-coupon/`,
        payload
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error validating coupon:", error.response?.data || error);
      // Return the structured error from the backend for specific user feedback
      return {
        success: false,
        error: error.response?.data || "Coupon validation failed",
      };
    }
  },
};

export const businessStaffService = {
  getStaff: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.BUSINESS_STAFF, {
        params,
      });
      return { success: true, data: response.data.results || response.data };
    } catch (error) {
      console.error(
        "Error fetching business staff:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch staff",
      };
    }
  },

  inviteStaff: async (inviteData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_STAFF,
        inviteData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error inviting staff:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to send invitation",
      };
    }
  },

  updateStaffRole: async (staffId, roleId) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_STAFF}${staffId}/`,
        { role: roleId }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error updating staff role:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to update role",
      };
    }
  },

  removeStaff: async (staffId) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.BUSINESS_STAFF}${staffId}/`);
      return { success: true };
    } catch (error) {
      console.error("Error removing staff:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to remove staff member",
      };
    }
  },

  acceptInvitation: async (token) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.ACCEPT_INVITE, {
        token,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error accepting invitation:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to accept invitation",
      };
    }
  },
};

// --- NEW: Business Role Service ---
export const businessRoleService = {
  getRoles: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.BUSINESS_ROLES);
      return { success: true, data: response.data.results || response.data };
    } catch (error) {
      console.error(
        "Error fetching business roles:",
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch roles" };
    }
  },
  getRole: async (roleId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_ROLES}${roleId}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching role ${roleId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch role details",
      };
    }
  },

  getAvailablePermissions: async () => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_ROLES}available-permissions/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching available permissions:",
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch permissions" };
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_ROLES,
        roleData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating role:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to create role",
      };
    }
  },

  updateRole: async (roleId, roleData) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_ROLES}${roleId}/`,
        roleData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating role:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to update role",
      };
    }
  },

  deleteRole: async (roleId) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.BUSINESS_ROLES}${roleId}/`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting role:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete role",
      };
    }
  },
};

// --- Revenue Service ---
export const revenueService = {
  getRevenueAnalytics: async (params = {}) => {
    try {
      // console.log('Revenue Analytics Request Params:', params);
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("start_date", params.startDate);
      if (params.endDate) queryParams.append("end_date", params.endDate);
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.REVENUE_ANALYTICS}?${queryParams.toString()}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching revenue analytics:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch revenue data",
        details: error.response?.data,
      };
    }
  },

  exportRevenueReport: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("start_date", params.startDate);
      if (params.endDate) queryParams.append("end_date", params.endDate);
      const response = await axiosInstance.post(
        API_ENDPOINTS.REVENUE_ANALYTICS,
        {},
        { params: queryParams, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let filename = "revenue_report.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1)
          filename = filenameMatch[1];
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error(
        "Error exporting revenue report:",
        error.response?.data || error
      );
      let errorText = "Failed to export revenue report";
      if (error.response?.data instanceof Blob) {
        try {
          errorText = await error.response.data.text();
        } catch {
          /* ignore */
        }
      } else if (error.response?.data?.error) {
        errorText = error.response.data.error;
      }
      return { success: false, error: errorText };
    }
  },
};

// --- Booking Analytics Service ---
export const bookingAnalyticsService = {
  getBookingAnalytics: async (dateRange, options = {}) => {
    // Added options for signal
    try {
      const params = new URLSearchParams();
      if (dateRange?.[0])
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1])
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}analytics/?${params.toString()}`,
        { signal: options.signal }
      );
      return { success: true, data: response.data };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Booking analytics fetch aborted.");
        return { success: false, error: "Fetch aborted", aborted: true };
      }
      console.error(
        "Error fetching booking analytics:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch booking data",
        details: error.response?.data,
      };
    }
  },

  exportBookingReport: async (dateRange) => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.[0])
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1])
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}analytics/`,
        {},
        { params: params, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let filename = "booking_report.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1)
          filename = filenameMatch[1];
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error(
        "Error exporting booking report:",
        error.response?.data || error
      );
      let errorText = "Failed to export booking report";
      if (error.response?.data instanceof Blob) {
        try {
          errorText = await error.response.data.text();
        } catch {
          /* ignore */
        }
      } else if (error.response?.data?.error) {
        errorText = error.response.data.error;
      }
      return { success: false, error: errorText };
    }
  },
};

// --- Business Student Service ---
export const businessStudentService = {
  getAllBusinessStudents: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_STUDENTS,
        { params }
      );
      return {
        success: true,
        data:
          response.data.results !== undefined
            ? response.data.results
            : response.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error(
        "Error fetching students for business:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch students",
      };
    }
  },

  getBusinessStudentProfile: async (studentId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_STUDENTS}${studentId}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching student profile ${studentId} for business:`,
        error.response?.data || error
      );
      const message =
        error.response?.status === 404
          ? "Student not found."
          : error.response?.data?.detail || "Failed to fetch profile";
      return { success: false, error: message };
    }
  },

  addNoteToBusinessStudent: async (studentId, noteContent) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_STUDENTS}${studentId}/add_note/`,
        { content: noteContent }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error adding note for student ${studentId} in business context:`,
        error.response?.data || error
      );
      const errorDetail =
        error.response?.data?.content?.[0] ||
        error.response?.data?.detail ||
        "Failed to add note";
      return { success: false, error: errorDetail };
    }
  },

  deleteContact: async (contactId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_STUDENTS}${contactId}/`
      );
      return { success: true };
    } catch (error) {
      console.error(
        `Error deleting contact ${contactId}:`,
        error.response?.data || error
      );
      // Return the specific error message from the backend (e.g., "Cannot delete...").
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete contact",
      };
    }
  },

  formatUserData: (rawData) => {
    if (!rawData) {
      console.warn("formatUserData received null or undefined rawData");
      return {};
    }
    return {
      userId: rawData.userId,
      email: rawData.email || "",
      first_name: rawData.first_name || "",
      last_name: rawData.last_name || "",
      phone_number: rawData.phone_number || null,
      avatar_thumb_url: rawData.avatar_thumb_url || null, // Use the new field name
      active_classes: rawData.active_classes ?? 0,
      total_classes_taken: rawData.total_classes_taken ?? 0,
      average_attendance: rawData.average_attendance ?? "0.00",
      notes: Array.isArray(rawData.notes)
        ? rawData.notes.map((note) => ({
            id: note.id,
            content: note.content || "",
            created_at: note.created_at,
            author: note.author,
            author_name: note.author_name || "Unknown Author",
            author_avatar_thumb_url: note.author_avatar_thumb_url || null, // Use the new field name for note authors
          }))
        : [],
      is_active: rawData.is_active === true,
      createdAt: rawData.createdAt,

      attendance_history: Array.isArray(rawData.attendance_history)
        ? rawData.attendance_history
        : [],
      last_booking_date_this_business:
        rawData.last_booking_date_this_business || null,
      total_spent_this_business: rawData.total_spent_this_business || "0.00",
    };
  },
};

export const guestBookingService = {
  getBookingDetails: async (token) => {
    if (!token) {
      return { success: false, error: "Cancellation token is missing." };
    }
    try {
      const response = await axiosInstance.get(
        `/bookings/guest-cancel/${token}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching guest booking details for token ${token}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.status === 404
          ? "This cancellation link is invalid or has expired."
          : error.response?.data?.detail ||
            "Could not retrieve booking details.";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },

  cancelBooking: async (token) => {
    if (!token) {
      return { success: false, error: "Cancellation token is missing." };
    }
    try {
      const response = await axiosInstance.post(
        `/bookings/guest-cancel/${token}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error cancelling guest booking for token ${token}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.data?.policy ||
        error.response?.data?.detail ||
        "An error occurred during cancellation.";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },
};

// --- Booking Service ---
export const bookingService = {
  bookingStatusPolling: async (paymentIntentId, clientSecret = null) => {
    if (!paymentIntentId) {
      console.error(
        "apiService: bookingStatusPolling - paymentIntentId is required"
      );
      return { success: false, error: "Payment Intent ID is required." };
    }
    try {
      // Base URL for the endpoint
      let url = `${BASE_URL}/booking-status/by-payment-intent/${paymentIntentId}/`;

      // **THIS IS THE CRUCIAL FIX**: If a clientSecret is provided,
      // append it as a query parameter for the backend to verify.
      if (clientSecret) {
        url += `?client_secret=${clientSecret}`;
      }

      console.log(`apiService: Polling URL: ${url}`); // This will now show the secret for guests

      const response = await axiosInstance.get(url);

      console.log(
        "apiService: bookingStatusPolling - Backend response data:",
        response.data
      );
      return { success: true, data: response.data };
    } catch (error) {
      // Your existing robust error handling is great and can remain as is.
      console.error(
        "apiService: Error polling booking status. PI:",
        paymentIntentId,
        "Error Object:",
        error
      );
      if (error.response) {
        console.error(
          "apiService: Polling Error - Response Data:",
          error.response.data
        );
        console.error(
          "apiService: Polling Error - Response Status:",
          error.response.status
        );
        console.error(
          "apiService: Polling Error - Response Headers:",
          error.response.headers
        );
      } else if (error.request) {
        console.error(
          "apiService: Polling Error - No response received, Request:",
          error.request
        );
      } else {
        console.error(
          "apiService: Polling Error - Error Message:",
          error.message
        );
      }
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.detail ||
        errorData?.error ||
        "Failed to fetch booking status.";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
        data: errorData,
      };
    }
  },
  getBookingCancellationInfo: async (bookingId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.STUDENT_BOOKINGS}${bookingId}/cancellation-info/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching cancellation info for booking ${bookingId}:`,
        error.response?.data || error
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to fetch cancellation info";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  },
  fetchBusinessBookings: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_BOOKINGS,
        { params }
      );
      // Expect paginated response: { count, next, previous, results, summary (optional) }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business bookings:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch bookings",
      };
    }
  },
  getBookingDetails: async (bookingId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching booking details ${bookingId}:`,
        error.response?.data || error
      );
      const message =
        error.response?.status === 404
          ? "Booking not found."
          : error.response?.data?.detail || "Failed to fetch details";
      return { success: false, error: message };
    }
  },
  businessCancelBooking: async (bookingId, reason = "") => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/cancel/`,
        { reason }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error cancelling booking ${bookingId} (Business):`,
        error.response?.data || error
      );
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data ||
          "Failed to cancel booking",
      };
    }
  },
  fetchAvailableRescheduleSlots: async (bookingId) => {
    if (!bookingId) return { success: false, error: "Booking ID is required." };
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/available-slots/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching available slots for booking ${bookingId}:`,
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch available slots." };
    }
  },

  rescheduleBooking: async (
    bookingId,
    newScheduleInstanceId,
    isDryRun = false,
    reason = ""
  ) => {
    try {
      const payload = {
        new_schedule_instance_id: newScheduleInstanceId,
        dry_run: isDryRun,
        reason: reason,
      };
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/reschedule/`,
        payload
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error rescheduling booking ${bookingId}:`,
        error.response?.data || error
      );
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.new_schedule_instance_id?.[0] ||
        errorData?.detail ||
        "Failed to reschedule the booking.";
      return { success: false, error: errorMessage };
    }
  },
  markAttendance: async (bookingId, attended) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/mark_attendance/`,
        { attended }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error marking attendance for booking ${bookingId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to mark attendance",
      };
    }
  },

  getMyBookings: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.when) params.append("when", filters.when);
      if (filters.page) params.append("page", filters.page);

      const response = await axiosInstance.get(
        `${API_ENDPOINTS.STUDENT_BOOKINGS}?${params.toString()}`
      );

      if (response.data && typeof response.data === "object") {
        const bookings =
          response.data.results !== undefined
            ? response.data.results
            : response.data;
        if (!Array.isArray(bookings)) {
          console.error(
            "API Error: Expected bookings array, received:",
            bookings
          );
          return {
            success: false,
            error: "Received invalid data format for bookings.",
            data: { bookings: [], summary: {} },
          };
        }
        return {
          success: true,
          data: {
            bookings: bookings,
            summary: response.data.summary || {},
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
          },
        };
      } else {
        console.error(
          "API Error: Invalid response data structure:",
          response.data
        );
        return {
          success: false,
          error: "Received invalid data from server.",
          data: { bookings: [], summary: {} },
        };
      }
    } catch (error) {
      console.error(
        "Error fetching my bookings:",
        error.response?.data || error.message || error
      );
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Failed to fetch bookings";
      return {
        success: false,
        error: errorMessage,
        data: { bookings: [], summary: {} },
      };
    }
  },
  studentCancelBooking: async (bookingId, reason = "") => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.STUDENT_BOOKINGS}${bookingId}/cancel/`,
        { reason }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error cancelling booking ${bookingId} (Student):`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to cancel booking",
      };
    }
  },
};

// --- Class Option Service ---
export const optionService = {
  createOption: async (classId, optionData) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/options/`,
        optionData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error creating option for class ${classId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to create option",
      };
    }
  },
  updateOption: async (classId, optionId, optionData) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/options/${optionId}/`,
        optionData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error updating option ${optionId} for class ${classId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to update option",
      };
    }
  },
  deleteOption: async (classId, optionId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/options/${optionId}/`
      );
      return { success: true };
    } catch (error) {
      console.error(
        `Error deleting option ${optionId} for class ${classId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete option",
      };
    }
  },
  toggleOptionActive: async (classId, optionId) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/options/${optionId}/toggle-active/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error toggling option active status:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to toggle status",
      };
    }
  },
};

// --- Review Service ---
export const reviewService = {
  submitReview: async (reviewData) => {
    // MODIFIED: This function now expects a JSON object, NOT FormData.
    // The calling component is responsible for uploading the image first.
    try {
      // The reviewData object should look like:
      // { booking_id, rating, comment, image_s3_key? }
      const response = await axiosInstance.post(
        API_ENDPOINTS.REVIEWS_SUBMIT,
        reviewData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error);
      const errors = error.response?.data;
      let errorMessage = "Failed to submit review.";
      if (typeof errors === "object" && errors !== null) {
        if (errors.booking_id) errorMessage = errors.booking_id[0];
        else if (errors.rating) errorMessage = errors.rating[0];
        else if (errors.comment) errorMessage = errors.comment[0];
        else if (errors.image_s3_key)
          errorMessage = errors.image_s3_key[0]; // Handle S3 key errors
        else if (errors.non_field_errors)
          errorMessage = errors.non_field_errors[0];
        else if (errors.detail) errorMessage = errors.detail;
      }
      return { success: false, error: errorMessage, details: errors };
    }
  },
  getBusinessReviews: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/business/reviews/`,
        { params }
      );
      return {
        success: true,
        data:
          response.data.results !== undefined
            ? response.data.results
            : response.data,
        count: response.data.count, // For pagination
        next: response.data.next, // For pagination
        previous: response.data.previous, // For pagination
      };
    } catch (error) {
      console.error(
        "Error fetching business reviews:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch reviews",
      };
    }
  },

  respondToReview: async (reviewId, responseText) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/business/reviews/${reviewId}/respond/`,
        { business_response: responseText }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error responding to review ${reviewId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to submit response",
      };
    }
  },

  getBusinessReviewAnalytics: async (params = {}) => {
    // startDate, endDate can be passed in params
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("start_date", params.startDate); // Expect YYYY-MM-DD
      if (params.endDate) queryParams.append("end_date", params.endDate); // Expect YYYY-MM-DD

      const response = await axiosInstance.get(
        `${BASE_URL}/business/reviews/analytics/?${queryParams.toString()}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business review analytics:",
        error.response?.data || error
      );
      return {
        success: false,
        error:
          error.response?.data?.detail || "Failed to fetch review analytics",
      };
    }
  },

  reportReview: async (reviewId, reason) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/business/reviews/${reviewId}/report/`,
        { report_reason: reason }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error reporting review ${reviewId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to report review",
      };
    }
  },
};

// --- Schedule Service ---
export const scheduleService = {
  fetchInstance: async (instanceId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_SCHEDULE_INSTANCES}${instanceId}/`
      );
      return { success: true, data: response.data, error: null };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "An unknown error occurred.";
      console.error(
        `Error fetching schedule instance ${instanceId}:`,
        errorMessage
      );
      return { success: false, data: null, error: errorMessage };
    }
  },
  fetchSchedules: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_SCHEDULES,
        { params }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching schedules:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to fetch schedules",
      };
    }
  },
  createSchedule: async (scheduleData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_SCHEDULES,
        scheduleData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error creating schedule:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || "Failed to create schedule",
      };
    }
  },
  deleteScheduleGroup: async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}group-delete/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error deleting schedule group:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  bulkCreateSchedules: async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}bulk-create/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error bulk creating schedules:",
        error.response?.data || error.message
      );
      // Let the component handle the error message display
      throw error;
    }
  },
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}${scheduleId}/`,
        scheduleData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating schedule:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data || "Failed to update schedule",
      };
    }
  },
  deleteSchedule: async (scheduleId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}${scheduleId}/`
      );
      return { success: true };
    } catch (error) {
      console.error("Error deleting schedule:", error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete schedule",
      };
    }
  },
  groupUpdate: async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}group-update/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error updating schedule group:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  getScheduleInstances: async (scheduleId, startDate, endDate) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_SCHEDULE_INSTANCES,
        {
          params: {
            schedule_id: scheduleId,
            start_date: startDate,
            end_date: endDate,
          },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching instances for schedule ${scheduleId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch instances",
      };
    }
  },
  getAvailabilityForOption: async (
    optionId,
    { start_date, end_date, is_course = false }
  ) => {
    //console.log('Fetching availability for option:', optionId, start_date, end_date, 'is_course:', is_course);
    try {
      const params = { option_id: optionId, start_date, end_date };
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_SCHEDULES}availability/`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching availability:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  },
};

// --- Support Ticket Service ---
export const CustomerSupportTicketService = {
  getUserTickets: async (filters = {}) => {
    try {
      // The new user viewset is not paginated and returns a simple list.
      const response = await axiosInstance.get(`/support-tickets/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching user tickets:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch tickets",
      };
    }
  },

  createTicket: async (ticketData) => {
    try {
      const response = await axiosInstance.post(
        "/support-tickets/",
        ticketData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating ticket:", error.response?.data || error);
      const errorDetails = error.response?.data;
      let errorMessage = "Failed to create ticket. Please check the fields.";
      if (errorDetails && typeof errorDetails === "object") {
        const key = Object.keys(errorDetails)[0];
        errorMessage = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${
          errorDetails[key][0]
        }`;
      }
      return { success: false, message: errorMessage };
    }
  },

  getTicketById: async (ticketId) => {
    try {
      const response = await axiosInstance.get(`/support-tickets/${ticketId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching ticket details ${ticketId}:`,
        error.response?.data || error
      );
      const message =
        error.response?.status === 404
          ? "Ticket not found."
          : error.response?.data?.detail || "Failed to fetch ticket details";
      return { success: false, error: message };
    }
  },

  replyToTicket: async (ticketId, message) => {
    try {
      // Backend expects a JSON object: { "message": "..." }
      const response = await axiosInstance.post(
        `/support-tickets/${ticketId}/reply/`,
        { message }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error replying to ticket ${ticketId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to send reply",
      };
    }
  },
};

// --- Notification Service (NEW) ---
export const notificationService = {
  getNotifications: async (params = {}) => {
    // params for pagination if needed
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, {
        params,
      });
      // Assuming paginated response: { count, next, previous, results }
      // If not paginated, it will just be an array in response.data
      return {
        success: true,
        data:
          response.data.results !== undefined
            ? response.data.results
            : response.data,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      console.error(
        "Error fetching notifications:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch notifications",
      };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT
      );
      return { success: true, data: response.data }; // Expects { unread_count: X }
    } catch (error) {
      console.error(
        "Error fetching unread notification count:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch unread count",
        data: { unread_count: 0 },
      };
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId)
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to mark as read",
      };
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.NOTIFICATIONS}mark-all-read/`
      ); // Assuming action path
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to mark all as read",
      };
    }
  },
};

// --- Other Utility Functions ---
export const fetchOptions = async (classId) => {
  try {
    const classData = await classService.fetchClassDetail(classId);
    return classData.options || [];
  } catch (error) {
    console.error("Error fetching class options:", error);
    throw error;
  }
};
// --- Course Service ---
export const courseService = {
  // Public endpoints
  getPublicCourses: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PUBLIC_COURSES, {
        params,
      });
      return { success: true, data: response.data.results || response.data };
    } catch (error) {
      console.error(
        "Error fetching public courses:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch courses",
      };
    }
  },

  getCourseDetail: async (scheduleId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_COURSES}${scheduleId}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching course detail ${scheduleId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch course detail",
      };
    }
  },

  // Business endpoints
  getBusinessCourses: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.BUSINESS_COURSES, {
        params,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business courses:",
        error.response?.data || error
      );
      return {
        success: false,
        error:
          error.response?.data?.detail || "Failed to fetch business courses",
      };
    }
  },

  getBusinessCourseEnrollments: async (courseScheduleId, params = {}) => {
    try {
      // This endpoint is a custom action on the BusinessCourseManagementViewSet
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_COURSES}${courseScheduleId}/enrollments/`,
        { params }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching course enrollments:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch enrollments",
      };
    }
  },

  // Student enrollment (for creating, viewing, and canceling their own)
  createCourseEnrollment: async (enrollmentData) => {
    try {
      // Uses the correct student-facing endpoint for creation
      const response = await axiosInstance.post(
        API_ENDPOINTS.STUDENT_COURSE_ENROLLMENTS,
        enrollmentData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error creating course enrollment:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to create enrollment",
      };
    }
  },

  getMyCourseEnrollments: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.STUDENT_COURSE_ENROLLMENTS,
        { params }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching student course enrollments:",
        error.response?.data || error
      );
      return { success: false, error: "Failed to fetch your enrollments" };
    }
  },

  cancelMyCourseEnrollment: async (enrollmentId, reason = "") => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.STUDENT_COURSE_ENROLLMENTS}${enrollmentId}/cancel/`,
        { reason }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error canceling enrollment ${enrollmentId}:`,
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data || "Failed to cancel enrollment",
      };
    }
  },
};
