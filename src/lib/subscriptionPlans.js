/**
 * Widget subscription plan definitions. Shared by landing, checkout, and dashboard.
 * Keep in sync with backend WidgetSubscription.PLAN_CHOICES and pricing.
 */

export const PLAN_IDS = ["basic", "growth", "advanced"];

export const PLAN_FEATURES_BASIC = [
  { label: "Widget on your website" },
  {
    label: "Marketplace listing",
    tooltip:
      "Get discovered by customers searching for classes on Classeasily.",
  },
  { label: "One dashboard & payout" },
  { label: "Brand colors & fonts" },
  { label: "Modal, inline, or floating embed" },
  {
    label: "Domain whitelist",
    tooltip:
      "Restrict your widget so it only loads on your own site. Prevents unauthorized embedding on third-party pages.",
  },
];

export const PLAN_FEATURES_GROWTH = [
  { label: "Everything in Basic" },
  {
    label: "Personalized booking emails",
    tooltip:
      "Confirmation and reminder emails sent under your brand — your logo, colors, and custom message. Not generic Classeasily emails.",
  },
  {
    label: "Pin widget to a specific class",
    tooltip:
      "Embed a booking button for one class or location — great for landing pages, ads, and campaigns.",
  },
  {
    label: "Widget revenue & booking analytics",
    tooltip:
      "Track widget-specific conversion rates, revenue by class, and booking trends. Separate from your Marketplace stats.",
  },
  {
    label: "Automated pre-class reminders",
    tooltip:
      "Email (and optional SMS) reminders sent automatically before each session to cut no-shows.",
  },
  {
    label: "Post-class review requests",
    tooltip:
      "Automatically prompt customers for a review after each class to build your public reputation.",
  },
  { label: "Promo codes & discounts" },
  { label: "Priority support" },
];

export const PLAN_FEATURES_ADVANCED = [
  { label: "Everything in Growth" },
  {
    label: "Lower commission (2%)",
    tooltip:
      "Best for high-volume studios. Pay a higher subscription to keep more of every booking.",
  },
  {
    label: "White-label widget",
    tooltip:
      "Remove all Classeasily branding entirely. Customers only see your brand when they book.",
  },
  {
    label: "API access",
    tooltip:
      "Connect booking data directly to your CRM, scheduling tools, or custom apps via the Classeasily REST API.",
  },
  { label: "Dedicated account manager" },
  { label: "Personal onboarding call" },
  { label: "SLA-backed support" },
];

export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 29,
    commission: 4,
    features: PLAN_FEATURES_BASIC,
    featured: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 49,
    commission: 3,
    features: PLAN_FEATURES_GROWTH,
    featured: true,
  },
  {
    id: "advanced",
    name: "Advanced",
    price: 89,
    commission: 2,
    features: PLAN_FEATURES_ADVANCED,
    featured: false,
  },
];

/**
 * @param {string} id - Plan id: 'basic' | 'growth' | 'advanced'
 * @returns {typeof PLANS[0] | undefined}
 */
export function getPlanById(id) {
  if (!id) return undefined;
  return PLANS.find((p) => p.id === (id || "").toLowerCase());
}

/**
 * Plan order for upgrade/downgrade comparison.
 */
export const PLAN_ORDER = ["basic", "growth", "advanced"];

export function isUpgrade(fromPlanId, toPlanId) {
  const fromIdx = PLAN_ORDER.indexOf(fromPlanId);
  const toIdx = PLAN_ORDER.indexOf(toPlanId);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx > fromIdx;
}

export function isDowngrade(fromPlanId, toPlanId) {
  const fromIdx = PLAN_ORDER.indexOf(fromPlanId);
  const toIdx = PLAN_ORDER.indexOf(toPlanId);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx < fromIdx;
}
