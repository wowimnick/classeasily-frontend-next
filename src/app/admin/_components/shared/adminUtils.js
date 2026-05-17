import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

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
