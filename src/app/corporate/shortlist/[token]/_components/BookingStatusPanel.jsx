"use client";

import Link from "next/link";
import { formatMoney } from "./formatMoney";

const LABELS = {
  pending_deposit: "Awaiting deposit",
  deposit_paid: "Deposit received",
  invoiced: "Balance invoiced",
  fully_paid: "Paid in full",
  in_progress: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function BookingStatusPanel({ booking, token, currency }) {
  const st = booking?.status;
  return (
    <div
      style={{
        border: "1px solid #0f172a",
        borderRadius: 20,
        padding: "1.5rem",
        background: "linear-gradient(180deg,#f8fafc 0%,#fff 100%)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#0f172a" }}>Your booking</h2>
      <p style={{ color: "#475569" }}>
        <strong>Reference:</strong> {booking.reference}
        <br />
        <strong>Status:</strong> {LABELS[st] || st}
      </p>
      <p style={{ color: "#475569" }}>
        <strong>Total:</strong> {formatMoney(booking.total_cents, currency)}
        <br />
        <strong>Deposit:</strong> {formatMoney(booking.deposit_cents, currency)}
        <br />
        <strong>Balance:</strong> {formatMoney(booking.balance_cents, currency)}
      </p>
      {booking.invoice_url && st !== "fully_paid" && st !== "completed" ? (
        <p>
          <a
            href={booking.invoice_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0f172a", fontWeight: 700 }}
          >
            Open balance invoice
          </a>
        </p>
      ) : null}
      {st === "pending_deposit" ? (
        <p style={{ marginTop: 16 }}>
          <Link
            href={`/corporate/shortlist/${token}/checkout?booking=${booking.id}`}
            style={{
              display: "inline-block",
              background: "#0f172a",
              color: "#fff",
              padding: "0.65rem 1.1rem",
              borderRadius: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Complete deposit
          </Link>
        </p>
      ) : null}
    </div>
  );
}
