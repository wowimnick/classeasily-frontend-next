export const ADMIN_TAB_PERMISSIONS = {
  overview: "quickstart.access_admin_dashboard",
  users: "quickstart.view_customuser",
  roles: "quickstart.view_role",
  audit: "quickstart.view_auditlog",
  "business-overview": "quickstart.view_business_metrics",
  "business-listings": "quickstart.view_businessinfo",
  "business-verification": "quickstart.view_all_verificationrequests",
  "class-listings": "quickstart.view_classesmain",
  "class-reviews": "quickstart.view_reviews",
  collections: "quickstart.view_classcollection",
  "all-bookings": "quickstart.view_booking",
  "corporate-inquiries": "quickstart.access_corporate_admin",
  payments: "quickstart.access_payment_admin",
  payouts: "quickstart.access_payout_admin",
  "widget-subscriptions": [
    "quickstart.view_widgetsubscription",
    "quickstart.view_businessinfo",
  ],
  "global-discounts": "quickstart.access_global_discount_admin",
  blog: "quickstart.access_blog_admin",
  support: "quickstart.access_support_admin",
  conversations: "quickstart.access_support_admin",
};

export const ADMIN_TAB_KEYS = Object.keys(ADMIN_TAB_PERMISSIONS);
