import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";

export const adminService = {
  getAdminMetrics: async () => {
    try {
      const response = await axiosInstance.get("/admin/metrics/"); // Endpoint defined in urls.py
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      // Try to return a more specific error message if available
      const errorMessage =
        error.response?.data?.detail || // Check DRF detail first
        error.response?.data?.error || // Check for custom error field
        error.message || // Fallback to Axios error message
        "Failed to fetch metrics data";
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status, // Optionally include status code
      };
    }
  },
};

export const businessManagementService = {
  /**
   * Get all businesses with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering businesses
   * @param {string} params.category - Filter by category
   * @param {string} params.status - Filter by status (active/inactive/pending)
   * @param {boolean} params.featured - Filter by featured status
   */
  getBusinesses: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/businesses/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching businesses:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch businesses",
      };
    }
  },
  getGeographicalData: async () => {
    try {
      const response = await axiosInstance.get("/admin/geographical-data/");
      // The backend view returns an object with two keys: { province_data, city_data }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching geographical data:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch map data",
      };
    }
  },

  /**
   * Get platform metrics for business dashboard
   */
  getPlatformMetrics: async () => {
    try {
      const response = await axiosInstance.get("/admin/businesses/metrics/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching platform metrics:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch platform metrics",
      };
    }
  },

  /**
   * Get geographical distribution data
   * @param {string} viewType - 'province' or 'city'
   * @param {string} dataType - 'count', 'revenue', or 'growth'
   */
  getGeographicalData: async (viewType = "province", dataType = "count") => {
    try {
      const response = await axiosInstance.get(
        "/admin/businesses/geographical/",
        {
          params: { view_type: viewType, data_type: dataType },
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching geographical data:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch geographical data",
      };
    }
  },

  /**
   * Get business growth trends
   * @param {string} timeframe - 'week', 'month', 'quarter', or 'year'
   */
  getGrowthTrends: async (timeframe = "month") => {
    try {
      const response = await axiosInstance.get("/admin/businesses/growth/", {
        params: { timeframe },
      });
      console.log(response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching growth trends:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch growth trends",
      };
    }
  },

  /**
   * Get specific business details
   * @param {number} businessId - Business ID to fetch
   */
  getBusinessDetails: async (businessId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/businesses/${businessId}/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching business ${businessId}:`, error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch business details",
      };
    }
  },

  /**
   * Update a business
   * @param {number} businessId - Business ID to update
   * @param {Object} businessData - Updated business data
   */
  updateBusiness: async (businessId, businessData) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/businesses/${businessId}/`,
        businessData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating business ${businessId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update business",
      };
    }
  },

  /**
   * Toggle featured status for a business
   * @param {number} businessId - Business ID
   * @param {boolean} featured - New featured status
   */
  toggleFeatureStatus: async (businessId, featured) => {
    try {
      const response = await axiosInstance.post(
        `/admin/businesses/${businessId}/toggle_feature/`,
        {
          featured,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `Error toggling feature status for business ${businessId}:`,
        error
      );
      return {
        success: false,
        error: error.response?.data?.error || "Failed to toggle feature status",
      };
    }
  },

  /**
   * Delete a business
   * @param {number} businessId - Business ID to delete
   */
  deleteBusiness: async (businessId) => {
    try {
      await axiosInstance.delete(`/admin/businesses/${businessId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting business ${businessId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete business",
      };
    }
  },

  /**
   * Send announcement to businesses
   * @param {Object} announcementData - Announcement data
   */
  sendAnnouncement: async (announcementData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/businesses/announcements/",
        announcementData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error sending announcement:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to send announcement",
      };
    }
  },

  /**
   * Export businesses data to CSV
   * @param {Object} params - Filter parameters for export
   */
  exportBusinessesData: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/businesses/export/", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "businesses_data.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error exporting businesses data:", error);
      return {
        success: false,
        error: "Failed to export businesses data",
      };
    }
  },
};

export const userAdminService = {
  impersonateUser: async (userId) => {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required for impersonation",
      };
    }

    try {
      const response = await axiosInstance.post(
        `/admin/users/${userId}/impersonate/`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Failed to start impersonation session.",
      };
    }
  },
  /**
   * End impersonation and restore the admin session (no re-login).
   * Backend returns new tokens via Set-Cookie and the admin user in the body.
   */
  endImpersonation: async () => {
    try {
      const response = await axiosInstance.post("/admin/end-impersonation/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Could not restore admin session.",
      };
    }
  },
  /**
   * Get a list of users with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering users
   * @param {string} params.role - Filter by role name
   * @param {string} params.status - Filter by user status (active/inactive/pending)
   * @param {string} params.ordering - Field to order by
   */
  getUsers: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/users/", { params });
      console.log(response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch users",
      };
    }
  },

  getUserHistory: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/users/${userId}/history/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching user history ${userId}:`, error);
      return { success: false, error: error.response?.data };
    }
  },

  getUserCommunications: async (userId, params = {}) => {
    try {
      const response = await axiosInstance.get(
        `/admin/users/${userId}/communications/`,
        { params }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching user communications ${userId}:`, error);
      return { success: false, error: error.response?.data };
    }
  },

  /**
   * Get details for a specific user
   * @param {number} userId - User ID to fetch
   */
  getUserDetails: async (userId) => {
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user details",
      };
    }
  },

  /**
   * Get bookings for a specific user
   * @param {number} userId - User ID
   * @param {Object} params - Query parameters (e.g., for pagination: { page: 1, page_size: 10 })
   */
  getUserBookings: async (userId, params = {}) => {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }
    try {
      // Construct the URL using the userId and optional params
      const endpoint = `/admin/users/${userId}/bookings/`;
      const response = await axiosInstance.get(endpoint, { params });
      console.log(`Bookings fetched for user ${userId}:`, response.data);
      return {
        success: true,
        // The response might already be paginated by DRF,
        // return the whole response object to access 'results', 'count', 'next', 'previous'
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching bookings for user ${userId}:`, error);
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "Failed to fetch user bookings",
      };
    }
  },

  getRoles: async () => {
    try {
      const response = await axiosInstance.get("admin/roles/");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching roles:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data to create
   */
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post("/admin/users/", userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create user",
      };
    }
  },

  /**
   * Update an existing user
   * @param {number} userId - User ID to update
   * @param {Object} userData - Updated user data
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/users/${userId}/`,
        userData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update user",
      };
    }
  },

  /**
   * Delete a user
   * @param {number} userId - User ID to delete
   */
  deleteUser: async (userId) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete user",
      };
    }
  },

  /**
   * Lock a user account
   * @param {number} userId - User ID to lock
   */
  lockAccount: async (userId) => {
    try {
      const response = await axiosInstance.post(`/admin/users/${userId}/lock/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error locking account ${userId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to lock account",
      };
    }
  },

  /**
   * Unlock a user account
   * @param {number} userId - User ID to unlock
   */
  unlockAccount: async (userId) => {
    try {
      const response = await axiosInstance.post(
        `/admin/users/${userId}/unlock/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error unlocking account ${userId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to unlock account",
      };
    }
  },

  /**
   * Reset a user's password
   * @param {number} userId - User ID
   */
  resetPassword: async (userId) => {
    try {
      const response = await axiosInstance.post(
        `/admin/users/${userId}/reset-password/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error resetting password for user ${userId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reset password",
      };
    }
  },

  /**
   * Create a Shadow User (Concierge Onboarding)
   * @param {Object} userData - { email, first_name, last_name }
   */
  createShadowUser: async (userData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/users/create-shadow/",
        userData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating shadow user:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to create shadow user",
      };
    }
  },

  /**
   * Send the Account Claim email to a shadow user
   * @param {number} userId
   */
  sendHandoverEmail: async (userId) => {
    try {
      const response = await axiosInstance.post(
        `/admin/users/${userId}/send-handover/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error sending handover email:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to send email",
      };
    }
  },

  /**
   * Get user dashboard metrics
   * @param {Object} params - Optional query params: start_date, end_date (YYYY-MM-DD)
   */
  getUserMetrics: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/users/metrics/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching user metrics:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user metrics",
      };
    }
  },
};

// src/api/user-management/roles.js
export const roleService = {
  /**
   * Get all roles
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering roles
   */
  getRoles: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/roles/", { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching roles:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch roles",
      };
    }
  },

  /**
   * Get a specific role by ID
   * @param {number} roleId - Role ID
   */
  getRole: async (roleId) => {
    try {
      const response = await axiosInstance.get(`/admin/roles/${roleId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching role ${roleId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch role",
      };
    }
  },

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   */
  createRole: async (roleData) => {
    try {
      const response = await axiosInstance.post("/admin/roles/", roleData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating role:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create role",
      };
    }
  },

  /**
   * Update an existing role
   * @param {number} roleId - Role ID
   * @param {Object} roleData - Updated role data
   */
  updateRole: async (roleId, roleData) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/roles/${roleId}/`,
        roleData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating role ${roleId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update role",
      };
    }
  },

  /**
   * Delete a role
   * @param {number} roleId - Role ID
   */
  deleteRole: async (roleId) => {
    try {
      await axiosInstance.delete(`/admin/roles/${roleId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete role",
      };
    }
  },

  /**
   * Duplicate a role
   * @param {number} roleId - Role ID to duplicate
   * @param {Object} data - New role data (at minimum should include name)
   */
  duplicateRole: async (roleId, data) => {
    try {
      const response = await axiosInstance.post(
        `/admin/roles/${roleId}/duplicate/`,
        data
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error duplicating role ${roleId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to duplicate role",
      };
    }
  },

  /**
   * Get all available permissions
   */
  getPermissions: async () => {
    try {
      const response = await axiosInstance.get("/admin/roles/permissions/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch permissions",
      };
    }
  },
  updateRoleOrder: async (rolesData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/roles/update_order/",
        rolesData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error updating role order:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to update role order",
      };
    }
  },
};

// src/api/user-management/verification.js
export const verificationService = {
  /**
   * Get verification requests (admin)
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {string} params.search - Search term
   */
  getVerificationRequests: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/verification/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch verification requests",
      };
    }
  },

  /**
   * Get verification overview stats (pending, verified_30d, rejected_30d)
   */
  getVerificationStats: async () => {
    try {
      const response = await axiosInstance.get("/admin/verification/stats/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching verification stats:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch verification stats",
      };
    }
  },

  /**
   * Get a specific verification request
   * @param {string} requestId - Verification request ID
   */
  getVerificationRequest: async (requestId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/verification/${requestId}/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching verification request ${requestId}:`, error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch verification request",
      };
    }
  },

  /**
   * Submit a verification request (for users)
   * @param {Object} data - Verification data
   * @param {FormData} data - Must be FormData for file uploads
   */
  submitVerification: async (data) => {
    try {
      const response = await axiosInstance.post("/verification/submit/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error submitting verification:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to submit verification",
      };
    }
  },

  /**
   * Process a verification request (approve/reject)
   * @param {string} requestId - Verification request ID
   * @param {Object} data - Processing data
   */
  processVerification: async (requestId, data) => {
    try {
      const response = await axiosInstance.post(
        `/admin/verification/${requestId}/process_verification/`,
        data
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error processing verification ${requestId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to process verification",
      };
    }
  },

  /**
   * Get documents for a verification request
   * @param {string} requestId - Verification request ID
   */
  getVerificationDocuments: async (requestId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/verification/${requestId}/documents/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `Error fetching verification documents for ${requestId}:`,
        error
      );
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch verification documents",
      };
    }
  },
};

export const auditService = {
  /**
   * Get audit logs
   * @param {Object} params - Query parameters
   * @param {string} params.action - Filter by action
   * @param {string} params.user_id - Filter by user
   * @param {string} params.start_date - Filter by start date
   * @param {string} params.end_date - Filter by end date
   * @param {string} params.search - Search term
   */
  getAuditLogs: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/audit-logs/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch audit logs",
      };
    }
  },

  /**
   * Get a specific audit log entry
   * @param {string} logId - Audit log ID
   */
  getAuditLog: async (logId) => {
    try {
      const response = await axiosInstance.get(`/admin/audit-logs/${logId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching audit log ${logId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch audit log",
      };
    }
  },

  /**
   * Export audit logs to CSV
   * @param {Object} params - Query parameters for filtering
   */
  exportAuditLogs: async (params) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(
        `/admin/audit-logs/export/?${queryString}`,
        {
          responseType: "blob", // IMPORTANT: Expect a blob response
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from content-disposition header if available, otherwise fallback
      const contentDisposition = response.headers["content-disposition"];
      let filename = "audit_logs_export.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true }; // Indicate success to the component
    } catch (error) {
      console.error("API Error in exportAuditLogs:", error);
      // Try to parse error from blob if it's a JSON error response
      if (
        error.response &&
        error.response.data instanceof Blob &&
        error.response.data.type.includes("json")
      ) {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          error: errorJson.detail || "Failed to export logs.",
        };
      }
      return { success: false, error: "Failed to export logs." };
    }
  },

  /**
   * Get activity summary
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days to include in summary
   */
  getActivitySummary: async (params = { days: 30 }) => {
    try {
      const response = await axiosInstance.get(
        "/admin/audit-logs/activity-summary/",
        { params }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching activity summary:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch activity summary",
      };
    }
  },
};

export const classManagementService = {
  /**
   * Get classes with filters
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.category - Filter by category
   * @param {string} params.status - Filter by status
   * @param {boolean} params.featured - Filter by featured status
   */
  getClasses: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/classes/", { params });
      return {
        success: true,
        data: response.data, // This correctly returns the raw API response object
      };
    } catch (error) {
      console.error("Error fetching classes:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch classes",
      };
    }
  },

  /**
   * Updates a class with the provided data payload.
   * @param {number} classId The ID of the class to update.
   * @param {object} payload The data to update.
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  updateClass: async (classId, payload) => {
    try {
      // The backend expects a PATCH request for partial updates.
      const response = await axiosInstance.patch(
        `/admin/classes/${classId}/`,
        payload
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error updating class ${classId}:`,
        error.response?.data || error
      );
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to update the class.";
      return { success: false, error: errorMsg };
    }
  },
  getCollections: async () => {
    try {
      const response = await axiosInstance.get("/admin/collections/");
      // Handle both paginated and non-paginated responses
      const data = response.data.results || response.data;

      if (!Array.isArray(data)) {
        return { success: true, data: [] };
      }
      return { success: true, data: data };
    } catch (error) {
      console.error("Error fetching collections:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch collections",
      };
    }
  },

  createCollection: async (data) => {
    try {
      const response = await axiosInstance.post("/admin/collections/", data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating collection:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create collection",
      };
    }
  },

  updateCollection: async (id, data) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/collections/${id}/`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error updating collection ${id}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update collection",
      };
    }
  },

  deleteCollection: async (id) => {
    try {
      await axiosInstance.delete(`/admin/collections/${id}/`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting collection ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete collection",
      };
    }
  },

  updateCollectionOrder: async (orderedCollections) => {
    try {
      const response = await axiosInstance.post(
        "/admin/collections/update-order/",
        orderedCollections
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating collection order:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to update collection order",
      };
    }
  },

  /**
   * Get class details by ID
   * @param {string} classId - Class ID
   */
  getClassDetails: async (classId) => {
    try {
      // Use admin endpoint for class details
      const response = await axiosInstance.get(`/admin/classes/${classId}/`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching class details for ${classId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch class details",
      };
    }
  },

  /**
   * Update class status (active/inactive)
   * @param {string} classId - Class ID
   * @param {string} status - New status ('active' or 'inactive')
   */
  updateClassStatus: async (classId, status) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/classes/${classId}/update_class_status/`,
        {
          status: status,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating class status for ${classId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update class status",
      };
    }
  },

  /**
   * Updates the display order for all class categories.
   * @param {Array<Object>} orderedCategories - An array of objects, each containing a category ID and its new order index.
   * @param {number} orderedCategories[].id - The category ID.
   * @param {number} orderedCategories[].order - The new zero-based index for the category.
   * @example updateCategoryOrder([{ id: 3, order: 0 }, { id: 1, order: 1 }, { id: 2, order: 2 }])
   */
  updateCategoryOrder: async (orderedCategories) => {
    try {
      // The endpoint is a collection-level action, not on a specific resource.
      const response = await axiosInstance.post(
        `/admin/categories/update-order/`,
        orderedCategories
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error updating category order:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update category order",
      };
    }
  },

  /**
   * Toggle class featured status
   * @param {string} classId - Class ID
   * @param {boolean} featured - Featured status
   */
  toggleClassFeatured: async (classId, featured) => {
    try {
      const response = await axiosInstance.post(
        `/admin/classes/${classId}/toggle-feature/`,
        {
          featured,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `Error toggling featured status for class ${classId}:`,
        error
      );
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to toggle featured status",
      };
    }
  },

  /**
   * Get categories
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   */
  getCategories: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/categories/", {
        params,
      });
      const data = response.data.results || response.data;

      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.error("getCategories did not receive an array:", response.data);
        return { success: true, data: [] };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch categories",
      };
    }
  },

  /**
   * Create a new category
   * @param {Object} data - Category data, should be FormData
   */
  createCategory: async (data) => {
    try {
      // REMOVED FormData logic and multipart/form-data header.
      // We are now sending a standard JSON object.
      const response = await axiosInstance.post("/admin/categories/", data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating category:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create category",
      };
    }
  },

  /**
   * @param {string} categoryId - Category ID
   * @param {Object} data - Updated category data as a JSON object, not FormData.
   *                        Should include `image_s3_key` if an image was uploaded.
   */
  updateCategory: async (categoryId, data) => {
    try {
      // REMOVED FormData logic and multipart/form-data header.
      const response = await axiosInstance.patch(
        `/admin/categories/${categoryId}/`,
        data
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update category",
      };
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const response = await axiosInstance.delete(
        `/admin/categories/${categoryId}/`
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete category",
      };
    }
  },

  addSubcategory: async (categoryId, subcategoryData) => {
    try {
      const response = await axiosInstance.post(
        `/admin/categories/${categoryId}/subcategories/`,
        subcategoryData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error adding subcategory:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to add subcategory",
      };
    }
  },

  deleteCategoryWithReassignment: async (categoryId, newId) => {
    try {
      // This sends a simple JSON object which is fine.
      const response = await axiosInstance.post(
        `/admin/categories/${categoryId}/delete-with-reassignment/`,
        { new_id: newId }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error reassigning and deleting category ${categoryId}:`,
        error.response
      );
      return {
        success: false,
        error: error.response?.data?.error || "Reassignment failed.",
      };
    }
  },

  /**
   * FIX: Changed to send FormData instead of a JSON object.
   */
  deleteSubcategoryWithReassignment: async (
    categoryId,
    subcategoryId,
    newId
  ) => {
    try {
      // Send as simple JSON object, not FormData
      const response = await axiosInstance.post(
        `/admin/categories/${categoryId}/subcategories/${subcategoryId}/`,
        { new_id: newId }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error reassigning and deleting subcategory ${subcategoryId}:`,
        error.response
      );
      return {
        success: false,
        error: error.response?.data?.error || "Reassignment failed.",
      };
    }
  },

  updateSubcategory: async (categoryId, subcategoryId, subcategoryData) => {
    try {
      // Send standard JSON object
      const response = await axiosInstance.patch(
        `/admin/categories/${categoryId}/subcategories/${subcategoryId}/`,
        subcategoryData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `Error updating subcategory ${subcategoryId}:`,
        error.response
      );

      // FIX: Extract the specific error string.
      // If we return the whole 'data' object, React crashes when trying to render it.
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Failed to update subcategory.";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  deleteSubcategory: async (categoryId, subcategoryId) => {
    try {
      const response = await axiosInstance.delete(
        `/admin/categories/${categoryId}/subcategories/${subcategoryId}/`
      );
      return { success: true };
    } catch (error) {
      console.error("Delete subcategory error:", error.response);
      return {
        success: false,
        error: error.response?.data?.detail || "Could not delete subcategory.",
      };
    }
  },
  getReviewAnalytics: async () => {
    try {
      const response = await axiosInstance.get("/admin/reviews/analytics/");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching review analytics:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch review analytics",
      };
    }
  },

  moderateReview: async (reviewId, data) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/reviews/${reviewId}/`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error moderating review ${reviewId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to moderate review",
      };
    }
  },

  getReviews: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/reviews/", { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Also return on error!
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch reviews",
      };
    }
  },

  /**
   * Update review status
   * @param {string} reviewId - Review ID
   * @param {string} status - New status
   */
  updateReviewStatus: async (reviewId, status) => {
    try {
      const response = await axiosInstance.post(
        `/admin/reviews/${reviewId}/update_status/`,
        { status }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating review status for ${reviewId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update review status",
      };
    }
  },

  /**
   * Send message to business about a class
   * @param {string} businessId - Business ID
   * @param {string} classId - Class ID
   * @param {string} message - Message content
   */
  messageBusinessAboutClass: async (businessId, classId, message) => {
    try {
      const response = await axiosInstance.post(`/admin/messages/business/`, {
        businessId,
        classId,
        message,
        messageType: "inquiry",
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error sending message to business:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to send message to business",
      };
    }
  },

  /**
   * Get class analytics
   */
  getClassAnalytics: async () => {
    try {
      // Use the new admin endpoint
      const response = await axiosInstance.get("/admin/classes/analytics/");

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching class analytics:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch class analytics",
      };
    }
  },

  /**
   * Export class data
   * @param {Object} params - Query parameters for filtering
   */
  exportClassData: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.search) queryParams.append("search", params.search);
      if (params.category) queryParams.append("category", params.category);
      if (params.status) queryParams.append("status", params.status);
      if (params.featured) queryParams.append("featured", "true");

      // Use the new admin endpoint
      const endpoint = `/admin/classes/export/?${queryParams.toString()}`;

      const response = await axiosInstance.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error exporting class data:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to export class data",
      };
    }
  },

  /**
   * Get the options for a class
   * @param {string} classId - Class ID
   */
  getClassOptions: async (classId) => {
    try {
      const response = await axiosInstance.get(`/classes/${classId}/options/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching options for class ${classId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch class options",
      };
    }
  },

  /**
   * Get the schedules for an option
   * @param {string} optionId - Option ID
   */
  getOptionSchedules: async (optionId) => {
    try {
      const response = await axiosInstance.get(
        `/schedules/?option_id=${optionId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching schedules for option ${optionId}:`, error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch option schedules",
      };
    }
  },

  /**
   * Get schedule instances for a schedule
   * @param {string} scheduleId - Schedule ID
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date filter
   * @param {string} params.end_date - End date filter
   */
  getScheduleInstances: async (scheduleId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      queryParams.append("schedule_id", scheduleId);
      if (params.start_date)
        queryParams.append("start_date", params.start_date);
      if (params.end_date) queryParams.append("end_date", params.end_date);

      const endpoint = `/schedule-instances/?${queryParams.toString()}`;

      const response = await axiosInstance.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `Error fetching schedule instances for schedule ${scheduleId}:`,
        error
      );
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch schedule instances",
      };
    }
  },
};

export const paymentService = {
  /**
   * Get all payments with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering payments
   * @param {string} params.status - Filter by status (succeeded/pending/refunded/failed)
   * @param {string} params.payment_method - Filter by payment method
   * @param {string} params.start_date - Filter by start date
   * @param {string} params.end_date - Filter by end date
   */
  getPayments: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/payments/", { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch payments",
      };
    }
  },

  /**
   * Get payment statistics for dashboard
   */
  getPaymentStats: async () => {
    try {
      const response = await axiosInstance.get("/admin/payments/stats/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching payment statistics:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch payment statistics",
      };
    }
  },

  /**
   * Get a specific payment details
   * @param {string} paymentId - Payment ID
   */
  getPaymentDetails: async (paymentId) => {
    try {
      const response = await axiosInstance.get(`/admin/payments/${paymentId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching payment ${paymentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch payment details",
      };
    }
  },

  /**
   * Process a refund through Stripe
   * @param {Object} refundData - Refund data
   * @param {string} refundData.payment_intent_id - Stripe payment intent ID
   * @param {number} refundData.amount - Refund amount (optional, null means full refund)
   * @param {string} refundData.reason - Refund reason
   */
  processRefund: async (paymentId, refundData) => {
    console.log(
      "[paymentService.processRefund] Received paymentId:",
      paymentId
    );
    if (!paymentId) {
      const errorMsg = "Payment ID is required to process a refund.";
      console.error(`[paymentService.processRefund] Error: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
    const url = `/admin/payments/${paymentId}/refund/`;
    console.log(`[paymentService.processRefund] Constructing URL: ${url}`);
    console.log(
      "[paymentService.processRefund] Sending refundData:",
      refundData
    );
    try {
      const response = await axiosInstance.post(url, refundData);
      console.log(
        "[paymentService.processRefund] API call successful:",
        response.data
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        `[paymentService.processRefund] Error processing refund for payment ${paymentId}:`,
        error.response || error
      );
      const errorMsg =
        error.response?.data?.error || // Specific 'error' field
        error.response?.data?.detail || // DRF standard 'detail' field
        error.message || // Axios or network error message
        "An unknown error occurred while processing the refund."; // Fallback

      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Mark a payment as paid (for pending payments)
   * @param {string} paymentId - Payment ID
   */
  markAsPaid: async (paymentId) => {
    console.log("[paymentService.markAsPaid] Received paymentId:", paymentId);
    if (!paymentId) {
      const errorMsg = "Payment ID is required to mark as paid.";
      console.error(`[paymentService.markAsPaid] Error: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    const url = `/admin/payments/${paymentId}/mark_paid/`;
    console.log(`[paymentService.markAsPaid] Constructing URL: ${url}`);

    try {
      // Send POST request to the specific payment's mark_paid endpoint
      // No request body is typically needed for this action
      const response = await axiosInstance.post(url);
      console.log(
        "[paymentService.markAsPaid] API call successful:",
        response.data
      );

      return {
        success: true,
        data: response.data, // Backend should return the updated payment details
      };
    } catch (error) {
      console.error(
        `[paymentService.markAsPaid] Error marking payment ${paymentId} as paid:`,
        error.response || error
      );
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "An unknown error occurred while marking the payment as paid.";

      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Get payment history/timeline events
   * @param {string} paymentId - Payment ID
   */
  getPaymentHistory: async (paymentId) => {
    console.log(
      "[paymentService.getPaymentHistory] Received paymentId:",
      paymentId
    );
    if (!paymentId) {
      const errorMsg = "Payment ID is required to fetch history.";
      console.error(`[paymentService.getPaymentHistory] Error: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    const url = `/admin/payments/${paymentId}/history/`;
    console.log(`[paymentService.getPaymentHistory] Constructing URL: ${url}`);

    try {
      const response = await axiosInstance.get(url);
      console.log(
        "[paymentService.getPaymentHistory] API call successful:",
        response.data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `[paymentService.getPaymentHistory] Error fetching history for payment ${paymentId}:`,
        error.response || error
      );
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "An unknown error occurred while fetching payment history.";
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Get payment receipt URL
   * @param {string} paymentId - Payment ID
   */
  getReceiptUrl: async (paymentId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/payments/${paymentId}/receipt/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching receipt for payment ${paymentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch receipt",
      };
    }
  },

  /**
   * Export payments data to CSV
   * @param {Object} params - Filter parameters for export
   */
  exportPaymentsData: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/payments/export/", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "payments_data.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error exporting payments data:", error);
      return {
        success: false,
        error: "Failed to export payments data",
      };
    }
  },
};

export const adminBookingService = {
  /**
   * Get all bookings with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering bookings
   * @param {string} params.status - Filter by status
   * @param {string} params.start_date - Filter by start date
   * @param {string} params.end_date - Filter by end date
   */
  getBookings: async (params = {}, axiosConfig = {}) => {
    try {
      const response = await axiosInstance.get("/admin/bookings/", {
        params,
        signal: axiosConfig.signal,
      });
      return { success: true, data: response.data };
    } catch (error) {
      // Check if the error is a cancellation error before logging it as a failure.
      if (axios.isCancel(error)) {
        console.log(
          "Bookings fetch request was canceled as it is no longer needed."
        );
        return { success: false, error: "Request cancelled", cancelled: true };
      }
      // If it's a different kind of error, log it as a real problem.
      console.error("Error fetching bookings:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch bookings",
      };
    }
  },

  /**
   * Get booking analytics
   * @param {Object} params - Query parameters (e.g., { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' })
   * @param {Object} axiosConfig - Optional Axios config (e.g., for cancellation)
   */
  getBookingAnalytics: async (params = {}, axiosConfig = {}) => {
    // Accept params
    try {
      console.log("Service: Fetching booking analytics with params:", params); // Add log here
      const response = await axiosInstance.get("/admin/bookings/analytics/", {
        // Ensure correct endpoint
        params: params, // Pass the params object here!
        signal: axiosConfig.signal, // Pass the signal here if using cancellation
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching booking analytics:", error);
      if (axios.isCancel(error)) {
        console.log("Analytics request canceled", error.message);
        return { success: false, error: "Request cancelled", cancelled: true };
      }
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch booking analytics",
      };
    }
  },

  /**
   * Get a specific booking details
   * @param {string} bookingId - Booking ID
   */
  getBookingDetails: async (bookingId) => {
    try {
      const response = await axiosInstance.get(`/admin/bookings/${bookingId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch booking details",
      };
    }
  },

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} data - Cancellation data
   * @param {string} data.reason - Cancellation reason
   * @param {boolean} data.refund - Whether to process a refund
   */
  cancelBooking: async (bookingId, data) => {
    try {
      const response = await axiosInstance.post(
        `/admin/bookings/${bookingId}/cancel/`,
        data
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to cancel booking",
      };
    }
  },

  /**
   * Export bookings data to CSV
   * @param {Object} params - Filter parameters for export
   */
  exportBookingsData: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/bookings/export/", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bookings_data.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error exporting bookings data:", error);
      return {
        success: false,
        error: "Failed to export bookings data",
      };
    }
  },
};

export const adminPayoutService = {
  /**
   * Get all payouts with optional filtering
   * @param {Object} params - Query parameters for filtering and pagination
   */
  getPayouts: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/payouts/", { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching payouts:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch payouts",
      };
    }
  },

  /**
   * Get detailed information for a single payout
   * @param {string} payoutId - The UUID of the payout
   */
  getPayoutDetails: async (payoutId) => {
    try {
      const response = await axiosInstance.get(`/admin/payouts/${payoutId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching payout details for ${payoutId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch payout details",
      };
    }
  },

  /**
   * Get payout analytics for the dashboard overview
   * @param {Object} params - Query parameters (e.g., start_date, end_date)
   */
  getPayoutAnalytics: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/payouts/analytics/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching payout analytics:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch payout analytics",
      };
    }
  },

  /**
   * Export payouts data to a CSV file
   * @param {Object} params - Filter parameters for the export
   */
  exportPayouts: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/payouts/export/", {
        params,
        responseType: "blob", // Important to handle the file download correctly
      });
      // The component will handle the download logic
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error exporting payouts data:", error);
      return {
        success: false,
        error: "Failed to export payouts data",
      };
    }
  },

  /**
   * (Placeholder) Retry a failed payout transfer
   * @param {string} payoutId - The ID of the failed payout
   */
  retryFailedPayout: async (payoutId) => {
    try {
      const response = await axiosInstance.post(
        `/admin/payouts/${payoutId}/retry/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error retrying payout ${payoutId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to retry payout",
      };
    }
  },
};

export const blogAdminService = {
  // Post Management
  getPosts: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/blog/posts/", {
        params,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch posts",
      };
    }
  },
  getPost: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/blog/posts/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch post",
      };
    }
  },
  createPost: async (data) => {
    try {
      const response = await axiosInstance.post("/admin/blog/posts/", data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating post:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create post",
      };
    }
  },
  updatePost: async (id, data) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/blog/posts/${id}/`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update post",
      };
    }
  },
  deletePost: async (id) => {
    try {
      await axiosInstance.delete(`/admin/blog/posts/${id}/`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete post",
      };
    }
  },

  // Category Management
  getCategories: async () => {
    try {
      // This endpoint returns a flat array, not paginated data
      const response = await axiosInstance.get("/admin/blog/categories/");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch categories",
      };
    }
  },
  createCategory: async (data) => {
    try {
      const response = await axiosInstance.post(
        "/admin/blog/categories/",
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating category:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create category",
      };
    }
  },
  updateCategory: async (id, data) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/blog/categories/${id}/`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update category",
      };
    }
  },
  deleteCategory: async (id) => {
    try {
      await axiosInstance.delete(`/admin/blog/categories/${id}/`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete category",
      };
    }
  },
};

export const supportTicketService = {
  getTickets: async (params = {}, axiosConfig = {}) => {
    try {
      const response = await axiosInstance.get("/admin/support-tickets/", {
        params,
        signal: axiosConfig.signal,
      });
      return {
        success: true,
        data: response.data.results,
        pagination: response.data,
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        return { success: false, error: "Request cancelled", cancelled: true };
      }
      console.error("Error fetching support tickets:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch support tickets",
      };
    }
  },

  getTicketDetails: async (ticketId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/support-tickets/${ticketId}/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching ticket ${ticketId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch ticket details",
      };
    }
  },

  replyToTicket: async (ticketId, data) => {
    try {
      const response = await axiosInstance.post(
        `/admin/support-tickets/${ticketId}/reply/`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error replying to ticket ${ticketId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to reply to ticket",
      };
    }
  },

  getTicketHistory: async (ticketId) => {
    if (!ticketId) return { success: false, error: "Ticket ID is required" };
    try {
      const response = await axiosInstance.get(
        `/admin/support-tickets/${ticketId}/history/`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching history for ticket ${ticketId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch ticket history",
      };
    }
  },

  getAssignableAgents: async () => {
    try {
      const response = await axiosInstance.get(
        "/admin/support-tickets/assignable-agents/"
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching assignable agents:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch assignable agents",
      };
    }
  },

  assignTicket: async (ticketId, payload) => {
    try {
      const response = await axiosInstance.post(
        `/admin/support-tickets/${ticketId}/assign/`,
        payload
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error assigning ticket ${ticketId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to assign ticket",
      };
    }
  },

  resolveTicket: async (ticketId, data) => {
    try {
      const response = await axiosInstance.post(
        `/admin/support-tickets/${ticketId}/resolve/`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error resolving ticket ${ticketId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to resolve ticket",
      };
    }
  },

  getTicketStats: async () => {
    try {
      const response = await axiosInstance.get("/admin/support-tickets/stats/");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching ticket statistics:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch ticket statistics",
      };
    }
  },
};

export const globalDiscountAdminService = {
  list: async () => {
    try {
      const response = await axiosInstance.get("/admin/global-discounts/");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch global discounts",
      };
    }
  },
  get: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/global-discounts/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch global discount",
      };
    }
  },
  getStats: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/global-discounts/${id}/stats/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch stats",
      };
    }
  },
  create: async (payload) => {
    try {
      const response = await axiosInstance.post("/admin/global-discounts/", payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to create global discount",
      };
    }
  },
  update: async (id, payload) => {
    try {
      const response = await axiosInstance.patch(`/admin/global-discounts/${id}/`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Failed to update global discount",
      };
    }
  },
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/admin/global-discounts/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to delete global discount",
      };
    }
  },
};

export const notificationService = {
  /**
   * Get all notifications with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering notifications
   * @param {string} params.status - Filter by status (draft/scheduled/sent/template)
   * @param {string} params.type - Filter by notification type (email/push/in_app/sms)
   * @param {string} params.start_date - Filter by start date
   * @param {string} params.end_date - Filter by end date
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/notifications/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch notifications",
      };
    }
  },

  /**
   * Get a specific notification details
   * @param {string} notificationId - Notification ID
   */
  getNotificationDetails: async (notificationId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/notifications/${notificationId}/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching notification ${notificationId}:`, error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch notification details",
      };
    }
  },

  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   */
  createNotification: async (notificationData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/notifications/",
        notificationData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create notification",
      };
    }
  },

  /**
   * Update an existing notification
   * @param {string} notificationId - Notification ID
   * @param {Object} notificationData - Updated notification data
   */
  updateNotification: async (notificationId, notificationData) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/notifications/${notificationId}/`,
        notificationData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating notification ${notificationId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update notification",
      };
    }
  },

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   */
  deleteNotification: async (notificationId) => {
    try {
      await axiosInstance.delete(`/admin/notifications/${notificationId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete notification",
      };
    }
  },

  /**
   * Send a notification
   * @param {string} notificationId - Notification ID
   */
  sendNotification: async (notificationId, extraData = {}) => {
    try {
      console.log("Sending notification:", notificationId, extraData);
      const response = await axiosInstance.post(
        `/admin/notifications/${notificationId}/send/`,
        extraData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error sending notification ${notificationId}:`, error);
      // Log more detailed error information for debugging
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to send notification",
      };
    }
  },

  /**
   * Cancel a scheduled notification
   * @param {string} notificationId - Notification ID
   */
  cancelNotification: async (notificationId) => {
    try {
      const response = await axiosInstance.post(
        `/admin/notifications/${notificationId}/cancel/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error cancelling notification ${notificationId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to cancel notification",
      };
    }
  },

  /**
   * Duplicate a notification
   * @param {string} notificationId - Notification ID
   */
  duplicateNotification: async (notificationId) => {
    try {
      const response = await axiosInstance.post(
        `/admin/notifications/${notificationId}/duplicate/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error duplicating notification ${notificationId}:`, error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to duplicate notification",
      };
    }
  },

  /**
   * Get notification metrics
   */
  getNotificationMetrics: async () => {
    try {
      const response = await axiosInstance.get("/admin/notifications/metrics/");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching notification metrics:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to fetch notification metrics",
      };
    }
  },
};

export const userSegmentService = {
  /**
   * Get all user segments
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for filtering segments
   */
  getUserSegments: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/admin/user-segments/", {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching user segments:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch user segments",
      };
    }
  },

  getUsers: async (segmentId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/user-segments/${segmentId}/users/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching users for segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch segment users",
      };
    }
  },

  calculateCounts: async () => {
    try {
      const response = await axiosInstance.post(
        "/admin/user-segments/calculate-counts/"
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error calculating segment counts:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to calculate segment counts",
      };
    }
  },

  getSegmentDetails: async (segmentId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/user-segments/${segmentId}/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch segment details",
      };
    }
  },

  /**
   * Create a new segment
   * @param {Object} segmentData - Segment data
   */
  createSegment: async (segmentData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/user-segments/",
        segmentData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error creating segment:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to create segment",
      };
    }
  },

  /**
   * Update an existing segment
   * @param {string} segmentId - Segment ID
   * @param {Object} segmentData - Updated segment data
   */
  updateSegment: async (segmentId, segmentData) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/user-segments/${segmentId}/`,
        segmentData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error updating segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.response?.data || "Failed to update segment",
      };
    }
  },

  /**
   * Delete a segment
   * @param {string} segmentId - Segment ID
   */
  deleteSegment: async (segmentId) => {
    try {
      await axiosInstance.delete(`/admin/user-segments/${segmentId}/`);
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete segment",
      };
    }
  },

  /**
   * Get users in a segment
   * @param {string} segmentId - Segment ID
   */
  getSegmentUsers: async (segmentId) => {
    try {
      const response = await axiosInstance.get(
        `/admin/user-segments/${segmentId}/users/`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching users for segment ${segmentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch segment users",
      };
    }
  },

  /**
   * Calculate user counts for all segments
   */
  calculateCounts: async () => {
    try {
      const response = await axiosInstance.post(
        "/admin/user-segments/calculate-counts/"
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error calculating segment counts:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to calculate segment counts",
      };
    }
  },
};

export const attachmentService = {
  /**
   * Upload a notification attachment
   * @param {FormData} formData - Form data with file
   */
  uploadAttachment: async (formData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/notification-attachments/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error uploading attachment:", error);
      return {
        success: false,
        error: error.response?.data || "Failed to upload attachment",
      };
    }
  },

  /**
   * Delete a notification attachment
   * @param {string} attachmentId - Attachment ID
   */
  deleteAttachment: async (attachmentId) => {
    try {
      await axiosInstance.delete(
        `/admin/notification-attachments/${attachmentId}/`
      );
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting attachment ${attachmentId}:`, error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete attachment",
      };
    }
  },
};
