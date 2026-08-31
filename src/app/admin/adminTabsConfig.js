export const ADMIN_TAB_PERMISSIONS = {
  overview: "quickstart.access_admin_dashboard",
  users: "quickstart.view_customuser",
  roles: "quickstart.view_role",
  audit: "quickstart.view_auditlog",
  "banned-ips": "quickstart.manage_ip_bans",
  "business-overview": "quickstart.view_business_metrics",
  "business-listings": "quickstart.view_businessinfo",
  "class-reviews": "quickstart.view_reviews",
  "all-bookings": "quickstart.view_booking",
  payments: "quickstart.access_payment_admin",
  revenue: "quickstart.view_platform_revenue",
  payouts: "quickstart.access_payout_admin",
  "widget-subscriptions": [
    "quickstart.view_widgetsubscription",
    "quickstart.view_businessinfo",
  ],
  blog: "quickstart.access_blog_admin",
  support: "quickstart.access_support_admin",
  conversations: "quickstart.access_support_admin",
  monitoring: "quickstart.view_system_metrics",
};

export const ADMIN_TAB_KEYS = Object.keys(ADMIN_TAB_PERMISSIONS);
