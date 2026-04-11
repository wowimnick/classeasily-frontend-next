/**
 * Transactional email branding: placeholder registry, validation, sample data, HTML checks.
 * Keep in sync with backend quickstart/utils/email_branding_constants.py (keys + required sets).
 */

import { checkMarketingHtml, formatMarketingHtml } from "../marketing/marketingHtmlTools";

export const EDITOR_MODE_VISUAL = "visual";
export const EDITOR_MODE_HTML = "html";

/** Maps preview tab value -> custom_html dict key (same as backend). */
export const PREVIEW_TYPE_TO_EMAIL_KEY = {
  booking_confirmation: "booking_confirmation",
  booking_reminder: "booking_reminder",
  booking_cancelled_by_host: "booking_cancelled_by_host",
  booking_rescheduled: "booking_rescheduled",
  booking_cancellation_confirmed: "booking_cancellation_confirmed",
};

/** Required placeholder names per email type (without braces). */
export const REQUIRED_PLACEHOLDERS_BY_TYPE = {
  booking_confirmation: [
    "class_title",
    "booking_date",
    "booking_time",
    "reference_id",
    "manage_booking_url",
  ],
  booking_reminder: [
    "class_title",
    "booking_date",
    "booking_time",
    "manage_booking_url",
  ],
  booking_cancelled_by_host: ["class_title", "booking_date", "booking_time"],
  booking_rescheduled: [
    "class_title",
    "booking_date",
    "booking_time",
    "new_date",
    "new_time",
  ],
  booking_cancellation_confirmed: [
    "class_title",
    "booking_date",
    "booking_time",
    "reference_id",
  ],
};

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function extractPlaceholderNames(html) {
  if (!html || typeof html !== "string") return new Set();
  const out = new Set();
  let m;
  const re = new RegExp(PLACEHOLDER_RE.source, PLACEHOLDER_RE.flags);
  while ((m = re.exec(html)) !== null) {
    out.add(m[1]);
  }
  return out;
}

export function getMissingRequiredPlaceholders(emailKey, html) {
  const required = REQUIRED_PLACEHOLDERS_BY_TYPE[emailKey];
  if (!required?.length) return [];
  const present = extractPlaceholderNames(html || "");
  return required.filter((r) => !present.has(r));
}

export function checkRequiredPlaceholdersForType(emailKey, html) {
  const missing = getMissingRequiredPlaceholders(emailKey, html);
  return {
    ok: missing.length === 0,
    missing,
  };
}

/** Sample values for preview / editor (mirror backend build_sample_placeholder_map). */
export function getSamplePlaceholderMap() {
  const baseUrl =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://classeasily.com";
  return {
    class_title: "Morning Yoga Flow",
    booking_date: "Monday, April 14",
    booking_time: "7:00 PM",
    time_range: "7:00 PM - 8:00 PM",
    duration: "60 min",
    location: "123 Studio Lane",
    reference_id: "BK-ABC123",
    business_name: "Your Business Name",
    first_name: "Alex",
    last_name: "Guest",
    customer_email: "alex@example.com",
    logo_url: "https://d1uuoquc68y10e.cloudfront.net/public/sig.png",
    primary_color: "#f81e3e",
    business_email: "hello@studio.com",
    business_phone: "+1 (555) 010-0000",
    cancellation_policy: "Cancel up to 24h before for a full refund.",
    participants: "2",
    option_title: "Evening session",
    equipment: "Bring a mat.",
    manage_booking_url: `${baseUrl}/my-classes?tab=upcoming`,
    cancel_booking_url: `${baseUrl}/guest/cancel/sample-token`,
    class_details_url: `${baseUrl}/classes/sample`,
    explore_url: `${baseUrl}/explore`,
    footer_text: "Questions? Email us at hello@studio.com",
    confirmation_message: "We can't wait to see you!",
    reason: "Host unavailable",
    refund_info: "$29.00 refunded to your original payment method.",
    new_date: "Wednesday, April 16",
    new_time: "6:00 PM - 7:00 PM",
    timezone: "America / New York",
  };
}

/**
 * Escape text for safe insertion into HTML preview.
 * @param {string} s
 */
function escPreview(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function applySamplePlaceholders(html) {
  const sample = getSamplePlaceholderMap();
  return (html || "").replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    (_, name) => escPreview(sample[name] ?? `{{${name}}}`),
  );
}

export function starterHtmlTemplate(emailKey) {
  const lines = [
    "<p>Hi {{first_name}},</p>",
    "<p><strong>{{class_title}}</strong></p>",
    "<p>{{booking_date}} at {{booking_time}}</p>",
  ];
  const req = REQUIRED_PLACEHOLDERS_BY_TYPE[emailKey] || [];
  for (const r of req) {
    if (!["class_title", "booking_date", "booking_time", "first_name"].includes(r)) {
      lines.push(`<p>{{${r}}}</p>`);
    }
  }
  lines.push("<p style=\"margin-top:24px;\"><a href=\"{{manage_booking_url}}\" style=\"color:#f81e3e;\">Manage booking</a></p>");
  return lines.join("\n");
}

export const PLACEHOLDER_GROUPS = [
  {
    label: "Booking",
    keys: [
      "class_title",
      "booking_date",
      "booking_time",
      "time_range",
      "duration",
      "location",
      "reference_id",
      "participants",
      "option_title",
      "equipment",
      "cancellation_policy",
    ],
  },
  {
    label: "Business",
    keys: ["business_name", "business_email", "business_phone"],
  },
  { label: "Customer", keys: ["first_name", "last_name", "customer_email"] },
  { label: "Branding", keys: ["logo_url", "primary_color", "footer_text", "confirmation_message"] },
  {
    label: "Links",
    keys: ["manage_booking_url", "cancel_booking_url", "class_details_url", "explore_url"],
  },
  { label: "Host cancel / reschedule", keys: ["reason", "refund_info", "new_date", "new_time", "timezone"] },
];

export { checkMarketingHtml, formatMarketingHtml };
