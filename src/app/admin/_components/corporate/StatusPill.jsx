"use client";

import { Tag } from "antd";

const SHORTLIST = {
  draft: { color: "default", label: "Draft" },
  ready: { color: "processing", label: "Ready" },
  sent: { color: "blue", label: "Sent" },
  viewed: { color: "cyan", label: "Viewed" },
  accepted: { color: "green", label: "Accepted" },
  cancelled: { color: "red", label: "Cancelled" },
};

const BOOKING = {
  pending_deposit: { color: "orange", label: "Awaiting deposit" },
  deposit_paid: { color: "blue", label: "Deposit paid" },
  invoiced: { color: "purple", label: "Invoiced" },
  fully_paid: { color: "green", label: "Paid in full" },
  in_progress: { color: "cyan", label: "Confirmed" },
  completed: { color: "green", label: "Completed" },
  cancelled: { color: "red", label: "Cancelled" },
  refunded: { color: "volcano", label: "Refunded" },
};

export default function StatusPill({ kind = "booking", value }) {
  const map = kind === "shortlist" ? SHORTLIST : BOOKING;
  const entry = map[value] || { color: "default", label: value || "—" };
  return <Tag color={entry.color}>{entry.label}</Tag>;
}
