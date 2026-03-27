/** Membership UI helpers — keep display logic in one place */

const HIDDEN_STATUSES = new Set(["incomplete", "expired"]);

export function shouldHideMemberStatus(status) {
  return HIDDEN_STATUSES.has((status || "").toLowerCase());
}

const STATUS_LABELS = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
  cancelled: "Canceled",
  paused: "Paused",
  pending_approval: "Pending approval",
  incomplete: "Incomplete",
  expired: "Expired",
};

/**
 * Title-style label for member status. Hidden statuses return null (caller should filter rows or show "—").
 */
export function formatMemberStatusLabel(status) {
  if (!status) return "—";
  const key = status.toLowerCase();
  if (shouldHideMemberStatus(key)) return null;
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSourceLabel(source) {
  if (source == null || source === "") return "—";
  const s = String(source).trim();
  if (!s) return "—";
  if (s.length <= 1) return s.toUpperCase();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * e.g. credit_unit "2 hour session", allowance 5 → "5× 2-hour sessions"
 */
export function formatPlanAccess(record) {
  if (!record || record.access_type !== "credits") return "Unlimited";
  const n = record.credit_allowance;
  let unit = (record.credit_unit || "credits").trim();
  if (n == null || n === "") return "Credits";
  const num = Number(n);
  if (Number.isNaN(num)) return `${n}× ${unit}`;

  unit = unit.replace(/\s+/g, " ");
  if (num !== 1 && unit.length > 0 && !unit.endsWith("s")) {
    unit = `${unit}s`;
  }
  const pretty = unit.replace(/(\d)\s*hour\b/gi, "$1-hour");
  return `${num}× ${pretty}`;
}
