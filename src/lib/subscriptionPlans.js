/**
 * Widget subscription plan definitions. Shared by booking-widget landing and dashboard settings.
 * Keep in sync with backend WidgetSubscription.PLAN_CHOICES and pricing.
 */

export const PLAN_IDS = ["basic", "growth", "advanced"];

export const PLAN_FEATURES_BASIC = [
  { label: "Widget on your website" },
  { label: "Scheduling and capacity" },
  { label: "Online payments" },
  { label: "Customer list" },
  { label: "One dashboard & payout" },
  { label: "Brand colors & fonts" },
  { label: "Popup or inline embed" },
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
      "Confirmation and reminder emails sent under your brand — your logo, colors, and custom message. Not generic ClassEasily emails.",
  },
  {
    label: "Pin widget to a specific class",
    tooltip:
      "Embed a booking button for one class or location — great for landing pages, ads, and campaigns.",
  },
  {
    label: "Widget revenue & booking analytics",
    tooltip:
      "Track widget conversion rates, revenue by class, and booking trends.",
  },
  {
    label: "Automated pre-class reminders",
    tooltip:
      "Email (and optional SMS) reminders sent automatically before each session to cut no-shows.",
  },
  {
    label: "Memberships",
    tooltip:
      "Sell recurring membership plans, manage members and credits, and collect subscription revenue from your widget or business page.",
  },
  { label: "Promo codes & discounts" },
];

export const PLAN_FEATURES_ADVANCED = [
  { label: "Everything in Growth" },
  {
    label: "Lower commission (2%)",
    tooltip:
      "Best for high-volume studios. Pay a higher subscription to keep more of every booking.",
  },
  {
    label: "Memberships",
    tooltip:
      "Sell recurring membership plans, manage members and credits, and collect subscription revenue from your widget or business page.",
  },
];

/**
 * Single comparison matrix for the Plans & billing page (one row per capability).
 * Replaces three separate per-plan checklists. `plans` booleans = included on that tier.
 */
export const WIDGET_PLAN_COMPARISON_ROWS = [
  {
    id: "commission",
    label: "Per-booking commission",
    valueType: "text",
    text: { basic: "4%", growth: "3%", advanced: "2%" },
  },
  {
    id: "widget_site",
    label: "Widget on your website",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "scheduling",
    label: "Scheduling and capacity",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "payments",
    label: "Online payments",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "crm",
    label: "Customer list / CRM",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "dashboard_payout",
    label: "One dashboard & payout",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "brand",
    label: "Brand colors & fonts",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "embed_modes",
    label: "Popup or inline embed",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "domain_whitelist",
    label: "Domain whitelist",
    tooltip:
      "Restrict your widget so it only loads on your own site. Prevents unauthorized embedding on third-party pages.",
    valueType: "check",
    plans: { basic: true, growth: true, advanced: true },
  },
  {
    id: "booking_emails",
    label: "Personalized booking emails",
    tooltip:
      "Confirmation and reminder emails sent under your brand — your logo, colors, and custom message. Not generic ClassEasily emails.",
    valueType: "check",
    plans: { basic: false, growth: true, advanced: true },
  },
  {
    id: "pin_class",
    label: "Pin widget to a specific class",
    tooltip:
      "Embed a booking button for one class or location — great for landing pages, ads, and campaigns.",
    valueType: "check",
    plans: { basic: false, growth: true, advanced: true },
  },
  {
    id: "widget_analytics",
    label: "Widget revenue & booking analytics",
    tooltip:
      "Track widget conversion rates, revenue by class, and booking trends.",
    valueType: "check",
    plans: { basic: false, growth: true, advanced: true },
  },
  {
    id: "reminders",
    label: "Automated pre-class reminders",
    tooltip:
      "Email (and optional SMS) reminders sent automatically before each session to cut no-shows.",
    valueType: "check",
    plans: { basic: false, growth: true, advanced: true },
  },
  {
    id: "memberships",
    label: "Memberships",
    tooltip:
      "Sell recurring membership plans, manage members and credits, and collect subscription revenue from your widget or business page.",
    valueType: "check",
    plans: { basic: false, growth: true, advanced: true },
  },
  {
    id: "promos",
    label: "Promo codes & discounts",
    valueType: "check",
    plans: { basic: false, growth: true, advanced: true },
  },
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

/** Monthly ClassEasily cost: plan fee + commission on collected bookings. */
export function planCostForVolume(plan, monthlyVolume) {
  const volume = Number(monthlyVolume) || 0;
  const commission = (volume * plan.commission) / 100;
  return {
    commission,
    total: plan.price + commission,
  };
}

/** Plan with the lowest all-in monthly cost at this booking volume. */
export function lowestCostPlan(monthlyVolume) {
  return PLANS.reduce((best, plan) => {
    const next = planCostForVolume(plan, monthlyVolume).total;
    const current = planCostForVolume(best, monthlyVolume).total;
    return next < current ? plan : best;
  });
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
