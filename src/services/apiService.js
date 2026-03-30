import axiosInstance from "@/lib/axiosInstance";
import { getMetaPixelParams } from "@/lib/metaPixel";
import { message } from "antd";

/** Flatten one level of value (array, or list-style object { 0: [...], 1: [...] }) to a string. */
function flattenValue(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const list = Object.values(value).flat();
    return list.map((v) => (Array.isArray(v) ? v.join(", ") : String(v))).filter(Boolean).join("; ");
  }
  return String(value ?? "");
}

/** Flatten API error (detail, message, or field errors e.g. { date: ['...'] }, days_of_week: { 0: [...] }) to a single string for toasts. */
function flattenApiError(data) {
  if (data == null) return "An unexpected error occurred.";
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    const parts = Object.entries(data).map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const text = flattenValue(value);
      return label && text ? `${label}: ${text}` : text;
    });
    return parts.filter(Boolean).join("; ") || "An unexpected error occurred.";
  }
  return String(data);
}

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
  MY_BUSINESS_WIDGET_SUBSCRIPTION: "/my-business/widget-subscription/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_CHECKOUT: "/my-business/widget-subscription/checkout/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_PAYMENT_INTENT: "/my-business/widget-subscription/payment-intent/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_CANCEL: "/my-business/widget-subscription/cancel/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_REACTIVATE:
    "/my-business/widget-subscription/reactivate/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_INVOICES:
    "/my-business/widget-subscription/invoices/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_SETUP_INTENT:
    "/my-business/widget-subscription/setup-intent/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_SET_DEFAULT_PAYMENT_METHOD:
    "/my-business/widget-subscription/set-default-payment-method/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_DEFAULT_PAYMENT_METHOD:
    "/my-business/widget-subscription/default-payment-method/",
  MY_BUSINESS_WIDGET_SUBSCRIPTION_DETACH_PAYMENT_METHOD:
    "/my-business/widget-subscription/detach-payment-method/",

  MY_BUSINESS_ADDONS: "/my-business/addons/",
  MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_CHECKOUT:
    "/my-business/addons/marketplace-email/checkout/",
  MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_PAYMENT_INTENT:
    "/my-business/addons/marketplace-email/payment-intent/",
  MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_INSTANT_SUBSCRIBE:
    "/my-business/addons/marketplace-email/instant-subscribe/",
  MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_CANCEL:
    "/my-business/addons/marketplace-email/cancel/",
  MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_REACTIVATE:
    "/my-business/addons/marketplace-email/reactivate/",

  MY_BUSINESS_MARKETING_ACCOUNT: "/my-business/marketing/account/",
  MY_BUSINESS_MARKETING_CAMPAIGNS: "/my-business/marketing/campaigns/",
  MY_BUSINESS_MARKETING_CAMPAIGN: (id) => `/my-business/marketing/campaigns/${id}/`,
  MY_BUSINESS_MARKETING_CAMPAIGN_SEND: (id) => `/my-business/marketing/campaigns/${id}/send/`,
  MY_BUSINESS_MARKETING_CAMPAIGN_TEST_SEND: (id) =>
    `/my-business/marketing/campaigns/${id}/test-send/`,
  MY_BUSINESS_MARKETING_CAMPAIGN_SCHEDULE: (id) => `/my-business/marketing/campaigns/${id}/schedule/`,
  MY_BUSINESS_MARKETING_SETTINGS: "/my-business/marketing/settings/",
  MY_BUSINESS_MARKETING_TEMPLATES: "/my-business/marketing/templates/",
  MY_BUSINESS_MARKETING_TEMPLATE: (id) => `/my-business/marketing/templates/${id}/`,
  MY_BUSINESS_MARKETING_SENDERS: "/my-business/marketing/senders/",
  MY_BUSINESS_MARKETING_SENDER: (id) => `/my-business/marketing/senders/${id}/`,
  MY_BUSINESS_MARKETING_DOMAINS: "/my-business/marketing/domains/",
  MY_BUSINESS_MARKETING_DOMAIN: (id) => `/my-business/marketing/domains/${id}/`,
  MY_BUSINESS_MARKETING_DOMAIN_VERIFY: (id) => `/my-business/marketing/domains/${id}/verify/`,
  MY_BUSINESS_MARKETING_AUDIENCE_PREVIEW: "/my-business/marketing/audience/preview/",
  MY_BUSINESS_MARKETING_AUDIENCE_FACETS: "/my-business/marketing/audience/facets/",
  MY_BUSINESS_MARKETING_SEGMENTS: "/my-business/marketing/segments/",
  MY_BUSINESS_MARKETING_SEGMENT: (id) => `/my-business/marketing/segments/${id}/`,
  MY_BUSINESS_MARKETING_WORKFLOWS: "/my-business/marketing/workflows/",
  MY_BUSINESS_MARKETING_WORKFLOW: (id) => `/my-business/marketing/workflows/${id}/`,
  MY_BUSINESS_MARKETING_WORKFLOW_ENROLL: (id) => `/my-business/marketing/workflows/${id}/enroll/`,
  MY_BUSINESS_MARKETING_WORKFLOW_ENROLLMENTS: "/my-business/marketing/workflow-enrollments/",
  MY_BUSINESS_ADDON_EMAIL_MARKETING_CHECKOUT: "/my-business/addons/email-marketing/checkout/",
  MY_BUSINESS_ADDON_EMAIL_MARKETING_INSTANT_SUBSCRIBE:
    "/my-business/addons/email-marketing/instant-subscribe/",
  MY_BUSINESS_ADDON_EMAIL_MARKETING_CANCEL: "/my-business/addons/email-marketing/cancel/",
  MY_BUSINESS_ADDON_EMAIL_MARKETING_REACTIVATE: "/my-business/addons/email-marketing/reactivate/",
  MY_BUSINESS_ADDON_EMAIL_MARKETING_CHANGE_TIER: "/my-business/addons/email-marketing/change-tier/",

  MY_BUSINESS_MEMBERSHIP_PRODUCTS: "/my-business/membership-products/",
  MY_BUSINESS_MEMBERS: "/my-business/members/",
  MY_BUSINESS_MEMBERS_MANUAL_ADD: "/my-business/members/manual-add/",
  MY_BUSINESS_CONTACTS: "/my-business/contacts/",

  // Student Self-Service
  STUDENT_BOOKINGS: "/my-bookings/",

  // Public Endpoints
  PUBLIC_CLASSES: "/classes/",
  PUBLIC_CATEGORIES: "/categories/",
  GIFTCARD_PURCHASE_INTENT: "/gift-cards/purchase-intent/",
  GIFTCARD_VALIDATE: "/gift-cards/validate/",
  TOGGLE_FAVORITE: (classId) => `/classes/${classId}/toggle-favorite/`,
  PUBLIC_BUSINESSES: "/businesses/",
  PUBLIC_SCHEDULES: "/schedules/",
  PUBLIC_BLOG_POSTS: "/blog/posts/",
  PUBLIC_BLOG_CATEGORIES: "/blog/categories/",
  GLOBAL_DISCOUNT_ACTIVE: "/global-discount/active/",

  // Reviews
  REVIEWS_SUBMIT: "/reviews/submit/",

  // Payments
  PAYMENTS_CREATE_INTENT: "/payments/create-payment-intent/",
  PAYMENTS_UPDATE_INTENT: "/payments/update_intent/",
  PAYMENTS_CANCEL_INTENT: "/payments/cancel-payment-intent/",
  PAYMENTS_CHECK_AVAILABILITY: "/payments/check-slot-availability/",
  PAYMENTS_WEBHOOK: "/payments/webhook/",

  // --- CORRECTED COURSE ENDPOINTS ---
  BUSINESS_COURSES: "/business/course-management/",
  PUBLIC_COURSES: "/business/courses/",
  STUDENT_COURSE_ENROLLMENTS: "/business/student/course-enrollments/",

  // Support & Chat
  SUPPORT_TICKETS: "/support-tickets/",
  CHAT_MESSAGE: "/chat/message/",

  // Guest–Business conversations (booker)
  CONVERSATIONS: "/conversations/",
  CONVERSATION_DETAIL: (id) => `/conversations/${id}/`,
  CONVERSATION_SEND_MESSAGE: (id) => `/conversations/${id}/send_message/`,
  CONVERSATION_MARK_READ: (id) => `/conversations/${id}/mark_read/`,
  // Business dashboard conversations
  BUSINESS_CONVERSATIONS: "/business/conversations/",
  BUSINESS_CONVERSATION_DETAIL: (id) => `/business/conversations/${id}/`,
  BUSINESS_CONVERSATION_SEND_MESSAGE: (id) =>
    `/business/conversations/${id}/send_message/`,
  BUSINESS_CONVERSATION_MARK_READ: (id) => `/business/conversations/${id}/mark_read/`,
  BUSINESS_CONVERSATION_START_BY_BOOKING: "/business/conversations/start-by-booking/",
  // Guest (no-account) messaging from class page + inbox via token
  GUEST_MESSAGE: "/guest-message/",
  GUEST_INBOX: (token) => `/guest-inbox/?token=${encodeURIComponent(token)}`,
  GUEST_INBOX_SEND: "/guest-inbox/send/",
  GUEST_INBOX_MARK_READ: "/guest-inbox/mark-read/",

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
        },
      );
      presignedData = response.data;
    } catch (error) {
      console.error(
        "Error getting pre-signed URL:",
        error.response?.data || error,
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

      return {
        success: true,
        s3_key: presignedData.s3_key,
        public_url: presignedData.public_url || null,
      };
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
        { params },
      );
      // The backend view paginates, so response.data will have { count, next, previous, results }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching blog posts:",
        error.response?.data || error,
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
        `${API_ENDPOINTS.PUBLIC_BLOG_POSTS}${slug}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching blog post with slug ${slug}:`,
        error.response?.data || error,
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
        API_ENDPOINTS.PUBLIC_BLOG_CATEGORIES,
      );
      // Backend returns a simple array for public view
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching blog categories:",
        error.response?.data || error,
      );
      return { success: false, error: "Failed to fetch categories", data: [] };
    }
  },
};
// --- Payment Service ---
export const paymentService = {
  createPaymentIntent: async (bookingPayload) => {
    try {
      // Meta CAPI: include fbc/fbp from Pixel cookies (Parameter Builder best practice)
      const metaParams = typeof window !== "undefined" ? getMetaPixelParams() : {};
      const payload = { ...bookingPayload, ...metaParams };
      const response = await axiosInstance.post(
        API_ENDPOINTS.PAYMENTS_CREATE_INTENT,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Payment API error creating intent:",
        error.response?.data || error,
      );
      throw error.response?.data || error;
    }
  },
  updatePaymentIntent: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.PAYMENTS_UPDATE_INTENT,
        payload,
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
        { payment_intent_id: paymentIntentId },
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling booking:", error);
      throw error.response?.data || error;
    }
  },
  checkSlotAvailability: async (instanceId, participants = 1) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PAYMENTS_CHECK_AVAILABILITY,
        { params: { instance_id: instanceId, participants } },
      );
      return response.data;
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return { available: false, available_spots: 0 };
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
        },
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error during registration:",
        error.response?.data || error,
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
        error.response?.data || error.message,
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
        data,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error during password reset confirmation:",
        error.response?.data || error.message,
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
        userData,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error updating user profile:",
        error.response?.data || error,
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
        error.response?.data || error.message,
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
        error.response?.data || error.message,
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
        error.response?.data || error,
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
        error.response?.data || error,
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
        jsonData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error registering business:",
        error.response?.data || error,
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
        error.response?.data || error,
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
        API_ENDPOINTS.MY_BUSINESS_PROFILE,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business profile:",
        error.response?.data || error,
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
        jsonData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error updating business profile:",
        error.response?.data || error,
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
        error.response?.data || error,
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
        API_ENDPOINTS.MY_BUSINESS_OVERVIEW,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching dashboard overview for current user:`,
        error.response?.data || error,
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
        API_ENDPOINTS.MY_BUSINESS_WIDGET_CONFIG,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching widget config:",
        error.response?.data || error,
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
        configData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error updating widget config:",
        error.response?.data || error,
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

  /**
   * GET widget subscription. Response: { subscription, widget_subscription_required,
   * has_stripe_subscription, has_widget_access, scheduled_downgrade? }.
   * subscription: { planId, status, currentPeriodEnd, cancelAtPeriodEnd } or null.
   */
  getWidgetSubscription: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching widget subscription:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to load subscription.";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * POST to set/change widget plan. Response: { subscription, requires_payment?, client_secret?,
   * stripe_updated?, downgrade_scheduled_at_period_end?, scheduled_plan_id?, target_plan_id? }.
   * If requires_payment and client_secret, frontend must collect payment then refetch.
   */
  subscribeWidgetPlan: async (planId) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION,
        { plan_id: planId },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error subscribing to widget plan:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to subscribe.";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Create a Stripe Subscription in default_incomplete mode for inline Elements checkout.
   * Returns { client_secret, subscription_id }.
   */
  createWidgetSubscriptionPaymentIntent: async ({ plan_id } = {}) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_PAYMENT_INTENT,
        { plan_id },
      );
      return { success: true, ...response.data };
    } catch (error) {
      const data = error.response?.data;
      const errorCode = data?.error;
      const errorMessage =
        (typeof errorCode === "string" ? errorCode : null) ||
        data?.detail ||
        "Failed to prepare payment.";
      return { success: false, error: errorMessage, errorCode };
    }
  },

  /**
   * Create a Stripe Checkout Session for the widget subscription.
   * Returns { url } to redirect the user to Stripe to complete payment.
   */
  createWidgetSubscriptionCheckoutSession: async ({
    plan_id,
    success_url,
    cancel_url,
  } = {}) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_CHECKOUT,
        { plan_id, success_url, cancel_url },
      );
      return { success: true, url: response.data?.url };
    } catch (error) {
      console.error(
        "Error creating widget subscription checkout session:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to start checkout.";
      return { success: false, error: errorMessage };
    }
  },

  cancelWidgetSubscription: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_CANCEL,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error canceling widget subscription:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to cancel.";
      return { success: false, error: errorMessage };
    }
  },

  reactivateWidgetSubscription: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_REACTIVATE,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error reactivating widget subscription:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to reactivate.";
      return { success: false, error: errorMessage };
    }
  },

  getWidgetSubscriptionInvoices: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_INVOICES,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching widget subscription invoices:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to load invoices.";
      return { success: false, error: errorMessage };
    }
  },

  /** Create SetupIntent for updating saved payment method (no charge). Returns client_secret. */
  createUpdatePaymentMethodSetupIntent: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_SETUP_INTENT,
      );
      return { success: true, client_secret: response.data?.client_secret };
    } catch (error) {
      console.error(
        "Error creating update payment method setup intent:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to prepare payment form.";
      return { success: false, error: errorMessage };
    }
  },

  /** Set default payment method after confirmSetup (payment_method id from Stripe). */
  setDefaultPaymentMethod: async ({ payment_method }) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_SET_DEFAULT_PAYMENT_METHOD,
        { payment_method },
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to update payment method.";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Saved cards for the business customer: payment_methods[], default_payment_method_id,
   * and payment_method (default row, backward-compatible).
   */
  getDefaultPaymentMethod: async () => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_DEFAULT_PAYMENT_METHOD,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching default payment method:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to load payment method.";
      return { success: false, error: errorMessage };
    }
  },

  detachPaymentMethod: async ({ payment_method }) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_WIDGET_SUBSCRIPTION_DETACH_PAYMENT_METHOD,
        { payment_method },
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to remove payment method.";
      return { success: false, error: errorMessage };
    }
  },

  getAddons: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_ADDONS);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching addons:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to load addons.";
      return { success: false, error: errorMessage };
    }
  },

  createMarketplaceEmailAddonCheckout: async ({ success_url, cancel_url } = {}) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_CHECKOUT,
        { success_url, cancel_url },
      );
      return { success: true, url: response.data?.url };
    } catch (error) {
      console.error(
        "Error creating marketplace email addon checkout:",
        error.response?.data || error,
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to start checkout.";
      return { success: false, error: errorMessage };
    }
  },

  createMarketplaceEmailAddonPaymentIntent: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_PAYMENT_INTENT,
      );
      return {
        success: true,
        client_secret: response.data?.client_secret,
        subscription_id: response.data?.subscription_id,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to start payment.";
      return { success: false, error: errorMessage };
    }
  },

  /** Subscribe to marketplace email addon using saved card (no redirect). Fails if no saved payment method. */
  subscribeMarketplaceEmailAddonInstant: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_INSTANT_SUBSCRIBE,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data;
      const errorMessage = errData?.error || error.response?.data?.detail || "Failed to subscribe.";
      return {
        success: false,
        error: errorMessage,
        can_instant: errData?.can_instant,
      };
    }
  },

  cancelMarketplaceEmailAddon: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_CANCEL,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to cancel.";
      return { success: false, error: errorMessage };
    }
  },

  reactivateMarketplaceEmailAddon: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_REACTIVATE,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to reactivate.";
      return { success: false, error: errorMessage };
    }
  },

  createEmailMarketingAddonCheckout: async ({ price_id, success_url, cancel_url } = {}) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_EMAIL_MARKETING_CHECKOUT,
        { price_id, success_url, cancel_url },
      );
      return { success: true, url: response.data?.url };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.detail ||
          "Failed to start checkout.",
      };
    }
  },

  subscribeEmailMarketingAddonInstant: async (price_id) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_EMAIL_MARKETING_INSTANT_SUBSCRIBE,
        { price_id },
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data;
      return {
        success: false,
        error: errData?.error || errData?.detail || "Failed to subscribe.",
        can_instant: errData?.can_instant,
      };
    }
  },

  cancelEmailMarketingAddon: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_EMAIL_MARKETING_CANCEL,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to cancel.",
      };
    }
  },

  reactivateEmailMarketingAddon: async () => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_ADDON_EMAIL_MARKETING_REACTIVATE,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to reactivate.",
      };
    }
  },

  changeEmailMarketingTier: async (price_id) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.MY_BUSINESS_ADDON_EMAIL_MARKETING_CHANGE_TIER, {
        price_id,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to change tier.",
      };
    }
  },

  getMarketingAccount: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_ACCOUNT);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load.",
      };
    }
  },

  listMarketingCampaigns: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGNS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load campaigns.",
      };
    }
  },

  createMarketingCampaign: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGNS,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to create.",
      };
    }
  },

  updateMarketingCampaign: async (id, payload) => {
    try {
      await axiosInstance.put(API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGN(id), payload);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to save.",
      };
    }
  },

  sendMarketingCampaign: async (id) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGN_SEND(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to send.",
      };
    }
  },

  testMarketingCampaign: async (id) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGN_TEST_SEND(id),
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Test send failed.",
      };
    }
  },

  fetchMarketingCampaign: async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGN(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load campaign.",
      };
    }
  },

  deleteMarketingCampaign: async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGN(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to delete.",
      };
    }
  },

  scheduleMarketingCampaign: async (id, payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_CAMPAIGN_SCHEDULE(id),
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const st = error.response?.status;
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Schedule failed.",
        status: st,
        used: error.response?.data?.used,
        limit: error.response?.data?.limit,
      };
    }
  },

  previewMarketingAudience: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_AUDIENCE_PREVIEW,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Preview failed.",
      };
    }
  },

  getMarketingAudienceFacets: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_AUDIENCE_FACETS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load audience options.",
      };
    }
  },

  getMarketingSettings: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_SETTINGS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load settings.",
      };
    }
  },

  patchMarketingSettings: async (payload) => {
    try {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_SETTINGS,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to save settings.",
      };
    }
  },

  listMarketingTemplates: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_TEMPLATES);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load templates.",
      };
    }
  },

  createMarketingTemplate: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_TEMPLATES,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to create template.",
      };
    }
  },

  fetchMarketingTemplate: async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_TEMPLATE(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load template.",
      };
    }
  },

  updateMarketingTemplate: async (id, payload) => {
    try {
      await axiosInstance.put(API_ENDPOINTS.MY_BUSINESS_MARKETING_TEMPLATE(id), payload);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to save template.",
      };
    }
  },

  deleteMarketingTemplate: async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_MARKETING_TEMPLATE(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to delete template.",
      };
    }
  },

  listMarketingSenders: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_SENDERS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load senders.",
      };
    }
  },

  createMarketingSender: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_SENDERS,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to create sender.",
      };
    }
  },

  deleteMarketingSender: async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_MARKETING_SENDER(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to delete sender.",
      };
    }
  },

  listMarketingDomains: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_DOMAINS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load domains.",
      };
    }
  },

  createMarketingDomain: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_DOMAINS,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to add domain.",
      };
    }
  },

  verifyMarketingDomain: async (id) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_DOMAIN_VERIFY(id),
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Verification failed.",
      };
    }
  },

  deleteMarketingDomain: async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_MARKETING_DOMAIN(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to remove domain.",
      };
    }
  },

  listMarketingSegments: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_SEGMENTS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load audiences.",
      };
    }
  },

  createMarketingSegment: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_SEGMENTS,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to save audience.",
      };
    }
  },

  updateMarketingSegment: async (id, payload) => {
    try {
      await axiosInstance.put(API_ENDPOINTS.MY_BUSINESS_MARKETING_SEGMENT(id), payload);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to update audience.",
      };
    }
  },

  deleteMarketingSegment: async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_MARKETING_SEGMENT(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to delete audience.",
      };
    }
  },

  listMarketingWorkflows: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOWS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load automations.",
      };
    }
  },

  createMarketingWorkflow: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOWS,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to create automation.",
      };
    }
  },

  fetchMarketingWorkflow: async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOW(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load automation.",
      };
    }
  },

  updateMarketingWorkflow: async (id, payload) => {
    try {
      await axiosInstance.put(API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOW(id), payload);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to save automation.",
      };
    }
  },

  deleteMarketingWorkflow: async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOW(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to delete automation.",
      };
    }
  },

  enrollMarketingWorkflow: async (id, payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOW_ENROLL(id),
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Enrollment failed.",
      };
    }
  },

  listMarketingWorkflowEnrollments: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.MY_BUSINESS_MARKETING_WORKFLOW_ENROLLMENTS,
        { params },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || "Failed to load enrollments.",
      };
    }
  },

  fetchBusinessReviews: async (slug, page = 1, pageSize = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_BUSINESSES}${slug}/reviews/`,
        { params: { page, page_size: pageSize } },
      );
      return {
        success: true,
        data: response.data.results || [],
        hasMore: !!response.data.next,
      };
    } catch (error) {
      console.error(
        `Error fetching reviews for business ${slug}:`,
        error.response?.data || error,
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
        { params },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching public businesses:",
        error.response?.data || error,
      );
      return { success: false, error: "Failed to fetch businesses" };
    }
  },

  fetchPublicBusinessDetail: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_BUSINESSES}${businessId}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching public business detail:",
        error.response?.data || error,
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
        },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching imported Google reviews for business ${businessId}:`,
        error,
      );
      return { success: false, error: "Failed to load Google reviews." };
    }
  },

  fetchBusinessContactDetails: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `/businesses/${businessId}/contact_details/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching contact details for business ${businessId}:`,
        error.response?.data || error.message,
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
        `${API_ENDPOINTS.BUSINESS_STATS}${businessId}/dashboard_stats/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching dashboard stats for business ${businessId}:`,
        error.response?.data || error,
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
        { params: { timeframe } },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching revenue over time for business ${businessId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_STATS}${businessId}/class_performance/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching class performance for business ${businessId}:`,
        error.response?.data || error,
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
        `${BASE_URL}/my-business/stripe-connect/`,
      ); // Ensure this matches your backend URL
      return { success: true, data: response.data }; // Expects { accountLinkUrl: "..." }
    } catch (error) {
      console.error(
        "Error creating Stripe account link:",
        error.response?.data || error,
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
        `${BASE_URL}/my-business/stripe-connect/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching Stripe connect status:",
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_PAYOUTS}summary/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching payout summary:",
        error.response?.data || error,
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
        { responseType: "blob" }, // Important: tells axios to expect a file
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
        error.response?.data || error,
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
        { params },
      );
      // Expecting { count, next, previous, results }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching bookings for payout ${payoutId}:`,
        error.response?.data || error,
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
        error.response?.data || error,
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
        API_ENDPOINTS.TOGGLE_FAVORITE(classId),
      );
      return { success: true, isFavorited: response.data.is_favorited };
    } catch (error) {
      console.error(
        `Error toggling favorite for class ${classId}:`,
        error.response?.data || error,
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
        API_ENDPOINTS.PUBLIC_CLASSES,
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
        },
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
        error.response?.data || error,
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
        API_ENDPOINTS.BUSINESS_CONTACT_INFO,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching business contact info:",
        error.response?.data || error,
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
        error.response?.data || error,
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
        jsonData,
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
        jsonData,
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
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Error deleting/deactivating class:",
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/toggle-active/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error toggling class active status:",
        error.response?.data || error,
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
        },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error uploading class images:",
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/images/${imageId}/`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Error deleting class image:",
        error.response?.data || error,
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
        `${BASE_URL}/business/all-categories/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching categories:",
        error.response?.data || error,
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
        },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error uploading import file:",
        error.response?.data || error,
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
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error starting import processing:",
        error.response?.data || error,
      );
      return {
        success: false,
        error: error.response?.data || "Failed to start import.",
      };
    }
  },
};

export const businessMembershipService = {
  getProducts: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MEMBERSHIP_PRODUCTS);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.detail || "Failed to fetch products" };
    }
  },
  createProduct: async (data) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.MY_BUSINESS_MEMBERSHIP_PRODUCTS, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.detail || "Failed to create" };
    }
  },
  getProduct: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.MY_BUSINESS_MEMBERSHIP_PRODUCTS}${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to fetch" };
    }
  },
  updateProduct: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`${API_ENDPOINTS.MY_BUSINESS_MEMBERSHIP_PRODUCTS}${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to update" };
    }
  },
  deleteProduct: async (id) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.MY_BUSINESS_MEMBERSHIP_PRODUCTS}${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to delete" };
    }
  },
  syncStripe: async (id) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.MY_BUSINESS_MEMBERSHIP_PRODUCTS}${id}/sync-stripe/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Stripe sync failed" };
    }
  },
  getMembers: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_MEMBERS, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to fetch members" };
    }
  },
  getMember: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.MY_BUSINESS_MEMBERS}${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to fetch member" };
    }
  },
  cancelMember: async (id, immediate = false) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.MY_BUSINESS_MEMBERS}${id}/cancel/`, { immediate });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to cancel" };
    }
  },
  approveMember: async (id) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.MY_BUSINESS_MEMBERS}${id}/approve/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.detail || "Failed to approve" };
    }
  },
  declineMember: async (id) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.MY_BUSINESS_MEMBERS}${id}/decline/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.detail || "Failed to decline" };
    }
  },
  manualAddMember: async (data) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.MY_BUSINESS_MEMBERS_MANUAL_ADD, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to add member" };
    }
  },
};

export const businessContactService = {
  getContacts: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MY_BUSINESS_CONTACTS, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to fetch contacts" };
    }
  },
  createContact: async (data) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.MY_BUSINESS_CONTACTS, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to create contact" };
    }
  },
  getContact: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.MY_BUSINESS_CONTACTS}${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to fetch contact" };
    }
  },
  updateContact: async (id, data) => {
    try {
      const response = await axiosInstance.patch(`${API_ENDPOINTS.MY_BUSINESS_CONTACTS}${id}/`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to update contact" };
    }
  },
  deleteContact: async (id) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.MY_BUSINESS_CONTACTS}${id}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to delete contact" };
    }
  },
};

export const businessDiscountService = {
  getDiscounts: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_DISCOUNTS,
        { params },
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
        error.response?.data || error,
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
        discountData,
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
        discountData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error updating discount ${discountId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_DISCOUNTS}${discountId}/`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        `Error deleting discount ${discountId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_DISCOUNTS}${discountId}/toggle-active/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error toggling discount ${discountId} status:`,
        error.response?.data || error,
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
        payload,
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

/** Public: fetch currently active platform-wide discount. Optional subtotal for calculated amount. */
export const globalDiscountService = {
  getActive: async (subtotal = null) => {
    try {
      const params = subtotal != null && subtotal > 0 ? { subtotal } : {};
      const response = await axiosInstance.get(
        API_ENDPOINTS.GLOBAL_DISCOUNT_ACTIVE,
        { params },
      );
      return {
        success: true,
        data: response.data?.active_discount ?? null,
      };
    } catch (error) {
      return { success: false, data: null };
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
        error.response?.data || error,
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
        inviteData,
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
        { role: roleId },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error updating staff role:",
        error.response?.data || error,
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
        error.response?.data || error,
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
        error.response?.data || error,
      );
      return { success: false, error: "Failed to fetch roles" };
    }
  },
  getRole: async (roleId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_ROLES}${roleId}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching role ${roleId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_ROLES}available-permissions/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching available permissions:",
        error.response?.data || error,
      );
      return { success: false, error: "Failed to fetch permissions" };
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_ROLES,
        roleData,
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
        roleData,
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
  getRevenueAnalytics: async (params = {}, options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("start_date", params.startDate);
      if (params.endDate) queryParams.append("end_date", params.endDate);
      if (params.class_id) queryParams.append("class_id", params.class_id);
      if (params.source && params.source !== "all") queryParams.append("source", params.source);
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.REVENUE_ANALYTICS}?${queryParams.toString()}`,
        { signal: options.signal },
      );
      return { success: true, data: response.data };
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        return { success: false, error: "Fetch aborted", aborted: true };
      }
      console.error(
        "Error fetching revenue analytics:",
        error.response?.data || error,
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
        { params: queryParams, responseType: "blob" },
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
        error.response?.data || error,
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
    try {
      const params = new URLSearchParams();
      if (dateRange?.[0])
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1])
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      if (options.classId) params.append("class_id", options.classId);
      if (options.source && options.source !== "all") params.append("source", options.source);
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}analytics/?${params.toString()}`,
        { signal: options.signal },
      );
      return { success: true, data: response.data };
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("Booking analytics fetch aborted.");
        return { success: false, error: "Fetch aborted", aborted: true };
      }
      console.error(
        "Error fetching booking analytics:",
        error.response?.data || error,
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
        { params: params, responseType: "blob" },
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
        error.response?.data || error,
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
        { params },
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
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_STUDENTS}${studentId}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching student profile ${studentId} for business:`,
        error.response?.data || error,
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
        { content: noteContent },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error adding note for student ${studentId} in business context:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_STUDENTS}${contactId}/`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        `Error deleting contact ${contactId}:`,
        error.response?.data || error,
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
        `/bookings/guest-cancel/${token}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching guest booking details for token ${token}:`,
        error.response?.data || error,
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
        `/bookings/guest-cancel/${token}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error cancelling guest booking for token ${token}:`,
        error.response?.data || error,
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
        "apiService: bookingStatusPolling - paymentIntentId is required",
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
        response.data,
      );
      return { success: true, data: response.data };
    } catch (error) {
      // Your existing robust error handling is great and can remain as is.
      console.error(
        "apiService: Error polling booking status. PI:",
        paymentIntentId,
        "Error Object:",
        error,
      );
      if (error.response) {
        console.error(
          "apiService: Polling Error - Response Data:",
          error.response.data,
        );
        console.error(
          "apiService: Polling Error - Response Status:",
          error.response.status,
        );
        console.error(
          "apiService: Polling Error - Response Headers:",
          error.response.headers,
        );
      } else if (error.request) {
        console.error(
          "apiService: Polling Error - No response received, Request:",
          error.request,
        );
      } else {
        console.error(
          "apiService: Polling Error - Error Message:",
          error.message,
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
        `${API_ENDPOINTS.STUDENT_BOOKINGS}${bookingId}/cancellation-info/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching cancellation info for booking ${bookingId}:`,
        error.response?.data || error,
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
        { params },
      );
      // Expect paginated response: { count, next, previous, results, summary (optional) }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business bookings:",
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching booking details ${bookingId}:`,
        error.response?.data || error,
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
        { reason },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error cancelling booking ${bookingId} (Business):`,
        error.response?.data || error,
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
  fetchAvailableRescheduleSlots: async (bookingId, options = {}) => {
    if (!bookingId) return { success: false, error: "Booking ID is required." };
    const { scope = "option" } = options; // "option" = same class only, "business" = any class in business
    try {
      const params = scope === "business" ? { scope: "business" } : {};
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/available-slots/`,
        { params },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching available slots for booking ${bookingId}:`,
        error.response?.data || error,
      );
      return { success: false, error: "Failed to fetch available slots." };
    }
  },

  rescheduleBooking: async (
    bookingId,
    newScheduleInstanceId,
    isDryRun = false,
    reason = "",
  ) => {
    try {
      const payload = {
        new_schedule_instance_id: newScheduleInstanceId,
        dry_run: isDryRun,
        reason: reason,
      };
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_BOOKINGS}${bookingId}/reschedule/`,
        payload,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error rescheduling booking ${bookingId}:`,
        error.response?.data || error,
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
        { attended },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error marking attendance for booking ${bookingId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.STUDENT_BOOKINGS}?${params.toString()}`,
      );

      if (response.data && typeof response.data === "object") {
        const bookings =
          response.data.results !== undefined
            ? response.data.results
            : response.data;
        if (!Array.isArray(bookings)) {
          console.error(
            "API Error: Expected bookings array, received:",
            bookings,
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
          response.data,
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
        error.response?.data || error.message || error,
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
        { reason },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error cancelling booking ${bookingId} (Student):`,
        error.response?.data || error,
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
        optionData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error creating option for class ${classId}:`,
        error.response?.data || error,
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
        optionData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error updating option ${optionId} for class ${classId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/options/${optionId}/`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        `Error deleting option ${optionId} for class ${classId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_CLASSES}${classId}/options/${optionId}/toggle-active/`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error toggling option active status:",
        error.response?.data || error,
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
        reviewData,
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
        { params },
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
        error.response?.data || error,
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
        { business_response: responseText },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error responding to review ${reviewId}:`,
        error.response?.data || error,
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
        `${BASE_URL}/business/reviews/analytics/?${queryParams.toString()}`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching business review analytics:",
        error.response?.data || error,
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
        { report_reason: reason },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error reporting review ${reviewId}:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.BUSINESS_SCHEDULE_INSTANCES}${instanceId}/`,
      );
      return { success: true, data: response.data, error: null };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "An unknown error occurred.";
      console.error(
        `Error fetching schedule instance ${instanceId}:`,
        errorMessage,
      );
      return { success: false, data: null, error: errorMessage };
    }
  },
  fetchSchedules: async (params = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_SCHEDULES,
        { params },
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
        scheduleData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const data = error.response?.data || error.message;
      console.error("Error creating schedule:", data);
      const msg = flattenApiError(error.response?.data || data);
      message.error(msg, 5);
      return {
        success: false,
        error: error.response?.data ?? "Failed to create schedule",
      };
    }
  },
  deleteScheduleGroup: async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}group-delete/`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error deleting schedule group:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
  bulkCreateSchedules: async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}bulk-create/`,
        payload,
      );
      return response.data;
    } catch (error) {
      const data = error.response?.data || error.message;
      console.error("Error bulk creating schedules:", data);
      message.error(flattenApiError(error.response?.data ?? data), 5);
      throw error;
    }
  },
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}${scheduleId}/`,
        scheduleData,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const data = error.response?.data || error;
      console.error("Error updating schedule:", data);
      const msg = flattenApiError(error.response?.data ?? data);
      message.error(msg, 5);
      return {
        success: false,
        error: error.response?.data || "Failed to update schedule",
      };
    }
  },
  deleteSchedule: async (scheduleId) => {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.BUSINESS_SCHEDULES}${scheduleId}/`,
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
        payload,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error updating schedule group:",
        error.response?.data || error.message,
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
        },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching instances for schedule ${scheduleId}:`,
        error.response?.data || error,
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch instances",
      };
    }
  },
  getAvailabilityForOption: async (
    optionId,
    { start_date, end_date, is_course = false },
  ) => {
    //console.log('Fetching availability for option:', optionId, start_date, end_date, 'is_course:', is_course);
    try {
      const params = { option_id: optionId, start_date, end_date };
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.PUBLIC_SCHEDULES}availability/`,
        { params },
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching availability:",
        error.response?.data || error,
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
        error.response?.data || error,
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
        ticketData,
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
        error.response?.data || error,
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
        { message },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error replying to ticket ${ticketId}:`,
        error.response?.data || error,
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to send reply",
      };
    }
  },
};

// --- Guest–Business Conversation Service (booker) ---
export const conversationService = {
  getList: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATIONS);
      return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.results ?? [] };
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to fetch conversations" };
    }
  },

  getDetail: async (conversationId) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.CONVERSATION_DETAIL(conversationId)
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching conversation:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to fetch conversation" };
    }
  },

  createOrGet: async (businessId, bookingId = null) => {
    try {
      const payload = { business_id: businessId };
      if (bookingId != null) payload.booking_id = bookingId;
      const response = await axiosInstance.post(API_ENDPOINTS.CONVERSATIONS, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating conversation:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to start conversation" };
    }
  },

  sendMessage: async (conversationId, text) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.CONVERSATION_SEND_MESSAGE(conversationId),
        { text }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to send message" };
    }
  },

  markRead: async (conversationId) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.CONVERSATION_MARK_READ(conversationId));
      return { success: true };
    } catch (error) {
      console.error("Error marking read:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to mark read" };
    }
  },
};

// --- Business Conversation Service (dashboard) ---
export const businessConversationService = {
  getList: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.BUSINESS_CONVERSATIONS);
      return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.results ?? [] };
    } catch (error) {
      console.error("Error fetching business conversations:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to fetch conversations" };
    }
  },

  getDetail: async (conversationId) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.BUSINESS_CONVERSATION_DETAIL(conversationId)
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching conversation:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to fetch conversation" };
    }
  },

  sendMessage: async (conversationId, text) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_CONVERSATION_SEND_MESSAGE(conversationId),
        { text }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error sending reply:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to send reply" };
    }
  },

  markRead: async (conversationId) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.BUSINESS_CONVERSATION_MARK_READ(conversationId));
      return { success: true };
    } catch (error) {
      console.error("Error marking read:", error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || "Failed to mark read" };
    }
  },

  /**
   * Get or create a conversation for a booking (business initiates messaging the guest).
   * Optional `text` sends an initial message.
   */
  startByBooking: async (bookingId, text = "") => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.BUSINESS_CONVERSATION_START_BY_BOOKING,
        { booking_id: bookingId, ...(text ? { text } : {}) }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error starting conversation by booking:", error.response?.data || error);
      const detail = error.response?.data;
      const msg = typeof detail === "object" && detail !== null
        ? (detail.detail || detail.booking_id?.[0] || JSON.stringify(detail))
        : "Failed to start conversation";
      return { success: false, error: msg };
    }
  },
};

// --- Guest (no-account) message from class page + inbox via token ---
export const guestMessageService = {
  submitMessage: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.GUEST_MESSAGE, payload);
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data;
      const msg = typeof detail === "object" && detail !== null
        ? (detail.detail || Object.values(detail).flat().join(" ") || "Failed to send message")
        : (detail || "Failed to send message");
      return { success: false, error: msg };
    }
  },
  getInbox: async (token) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GUEST_INBOX(token));
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data;
      const msg = typeof detail === "object" && detail !== null
        ? (detail.token?.[0] || detail.detail || "Invalid or expired link")
        : "Invalid or expired link";
      return { success: false, error: msg };
    }
  },
  sendMessage: async (token, text) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.GUEST_INBOX_SEND, { token, text });
      return { success: true, data: response.data };
    } catch (error) {
      const detail = error.response?.data;
      const msg = typeof detail === "object" && detail !== null
        ? (detail.detail || detail.token?.[0] || Object.values(detail).flat().join(" "))
        : "Failed to send message";
      return { success: false, error: msg };
    }
  },

  markRead: async (token) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.GUEST_INBOX_MARK_READ, { token });
      return { success: true };
    } catch (error) {
      const detail = error.response?.data;
      const msg = typeof detail === "object" && detail !== null
        ? (detail.detail || detail.token?.[0] || "Failed to mark read")
        : "Failed to mark read";
      return { success: false, error: msg };
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
        error.response?.data || error,
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
        API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT,
      );
      return { success: true, data: response.data }; // Expects { unread_count: X }
    } catch (error) {
      console.error(
        "Error fetching unread notification count:",
        error.response?.data || error,
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
        API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId),
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        error.response?.data || error,
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
        `${API_ENDPOINTS.NOTIFICATIONS}mark-all-read/`,
      ); // Assuming action path
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error.response?.data || error,
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
        error.response?.data || error,
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch courses",
      };
    }
  },
};

export const giftCardService = {
  createPurchaseIntent: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.GIFTCARD_PURCHASE_INTENT,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error creating gift card purchase intent:",
        error.response?.data || error,
      );
      throw error.response?.data || error;
    }
  },
  validateGiftCard: async (code) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.GIFTCARD_VALIDATE,
        {
          code,
        },
      );
      return response.data; // Expects { code, balance }
    } catch (error) {
      console.error(
        "Error validating gift card:",
        error.response?.data || error,
      );
      throw error.response?.data || error;
    }
  },
};
