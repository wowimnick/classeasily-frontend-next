import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Normalize DRF paginated list responses for Ant Design Table dataSource.
 * Accepts either { results: T[] } or a bare array; otherwise returns [].
 */
export function unwrapAdminPaginatedResults(data) {
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

/** Safe hex → rgba (matches guarded patterns used in PaymentManagement / ClassReviews) */
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#") || hex.length < 7) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatDate(value, fallback = "N/A") {
  return value ? dayjs(value).format("MMM D, YYYY") : fallback;
}

export function formatDatetime(value, fallback = "N/A") {
  return value ? dayjs.utc(value).local().format("MMM D, YYYY h:mm A") : fallback;
}

/** CAD, 2 decimal places — tables, drawers, inline amounts */
export function formatCurrency(value, fallback = "—") {
  if (value == null || Number.isNaN(Number(value))) return fallback;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

/** CAD, whole dollars — KPI / metric cards */
export function formatCurrencyKPI(value, fallback = "—") {
  if (value == null || Number.isNaN(Number(value))) return fallback;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const PAYMENT_METHOD_LABELS = {
  card: "Card",
  link: "Stripe Link",
  us_bank_account: "US bank account (ACH)",
  acss_debit: "Pre-authorized debit",
  ideal: "iDEAL",
  sepa_debit: "SEPA Direct Debit",
  bancontact: "Bancontact",
  sofort: "Sofort",
  afterpay_clearpay: "Afterpay / Clearpay",
  klarna: "Klarna",
  affirm: "Affirm",
  cashapp: "Cash App Pay",
  paypal: "PayPal",
  amazon_pay: "Amazon Pay",
  interac_present: "Interac (present)",
};

/** Readable payment method for admin drawers when card brand/last4 are missing. */
export function formatAdminPaymentMethodDisplay(payment) {
  const fromCard = payment?.card_details?.display_name;
  if (fromCard) return fromCard;
  const raw = payment?.payment_method_type;
  if (raw == null || raw === "") return null;
  const key = String(raw).trim().toLowerCase();
  if (PAYMENT_METHOD_LABELS[key]) return PAYMENT_METHOD_LABELS[key];
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Customer receipt URL if present; else Stripe Dashboard PaymentIntent deep link when possible. */
export function getAdminStripePaymentLinks(payment) {
  const receiptUrl = (payment?.receipt_url || "").trim() || null;
  const pi = (payment?.stripe_payment_intent_id || "").trim();
  const dashboardFromApi = (payment?.stripe_dashboard_url || "").trim() || null;
  const dashboardUrl =
    dashboardFromApi ||
    (pi && !pi.startsWith("internal_") && !pi.startsWith("temp_")
      ? `https://dashboard.stripe.com/payments/${pi}`
      : null);
  return { receiptUrl, dashboardUrl };
}
