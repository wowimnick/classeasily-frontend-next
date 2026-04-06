"use client";

import { Tag } from "antd";

const TAG_STYLE = {
  margin: 0,
  fontSize: 10,
  lineHeight: "18px",
  borderRadius: 6,
};

/**
 * Human-readable range for metric cards (dayjs instances from RangePicker / filters).
 */
export function formatDayjsRangeBadge(start, end) {
  const sOk = start && typeof start.isValid === "function" && start.isValid();
  const eOk = end && typeof end.isValid === "function" && end.isValid();
  if (!sOk && !eOk) return "All time";
  if (sOk && eOk) {
    const s = start.format("MMM D, YYYY");
    const e = end.format("MMM D, YYYY");
    if (s === e) return s;
    return `${s} – ${e}`;
  }
  if (sOk) return `From ${start.format("MMM D, YYYY")}`;
  if (eOk) return `Until ${end.format("MMM D, YYYY")}`;
  return "All time";
}

export function MetricPeriodBadge({ children }) {
  if (children == null || children === "") return null;
  return <Tag style={TAG_STYLE}>{children}</Tag>;
}
