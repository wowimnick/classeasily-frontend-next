"use client";

import Link from "next/link";
import styled from "styled-components";
import dayjs from "dayjs";
import { formatMoney } from "./formatMoney";
import {
  ACCENT_DARK,
  BORDER,
  BRAND_RED,
  SURFACE_MUTED,
  TEXT_BODY,
  TEXT_MUTED,
} from "../tokens";

/** Same labels as business-facing copy — export for admin parity */
export const BOOKING_STATUS_LABELS = {
  pending_deposit: "Awaiting deposit",
  deposit_paid: "Deposit received",
  invoiced: "Balance invoiced",
  fully_paid: "Paid in full",
  in_progress: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const Wrap = styled.div`
  border: 1px solid ${ACCENT_DARK};
  border-radius: 20px;
  padding: 1.5rem;
  background: linear-gradient(180deg, ${SURFACE_MUTED} 0%, #fff 100%);
`;

const Title = styled.h2`
  margin-top: 0;
  color: ${ACCENT_DARK};
  font-size: 1.25rem;
`;

const RefBlock = styled.p`
  color: ${TEXT_BODY};
  margin: 0 0 1rem;
  font-size: 0.95rem;
`;

const Timeline = styled.ol`
  list-style: none;
  margin: 0 0 1.25rem;
  padding: 0;
`;

const TlItem = styled.li`
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 0.75rem;
  align-items: start;
  padding: 0.35rem 0;
  border-left: 2px solid ${(p) => (p.$done ? BRAND_RED : BORDER)};
  margin-left: 11px;
  padding-left: 1rem;

  &:first-child {
    border-left-color: ${(p) => (p.$done ? BRAND_RED : BORDER)};
  }
`;

const Dot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-left: -23px;
  margin-top: 4px;
  background: ${(p) => (p.$active ? BRAND_RED : p.$done ? BRAND_RED : "#e2e8f0")};
  border: 2px solid ${(p) => (p.$active || p.$done ? BRAND_RED : "#cbd5e1")};
  flex-shrink: 0;
`;

const TlLabel = styled.span`
  font-size: 0.9rem;
  color: ${(p) => (p.$muted ? TEXT_MUTED : TEXT_BODY)};
  font-weight: ${(p) => (p.$active ? 700 : p.$done ? 500 : 500)};
`;

const MoneyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1.5rem;
  font-size: 0.95rem;
  color: ${TEXT_BODY};
  font-variant-numeric: tabular-nums;
`;

const MLabel = styled.span`
  color: ${TEXT_MUTED};
`;

const MVal = styled.span`
  font-weight: 600;
  text-align: right;
`;

const InvoiceCard = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid ${BORDER};
  background: #fff;
`;

const InvoiceTitle = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${TEXT_MUTED};
  font-weight: 700;
`;

const InvoiceLink = styled.a`
  color: ${BRAND_RED};
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const DepositCta = styled(Link)`
  display: inline-block;
  margin-top: 1rem;
  background: ${BRAND_RED};
  color: #fff;
  padding: 0.65rem 1.1rem;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid ${BRAND_RED};
    outline-offset: 2px;
  }
`;

const BalanceCta = styled(Link)`
  display: inline-block;
  margin-top: 1rem;
  background: ${BRAND_RED};
  color: #fff;
  padding: 0.65rem 1.1rem;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid ${BRAND_RED};
    outline-offset: 2px;
  }
`;

const SecondaryInvoiceLink = styled.a`
  display: inline-block;
  margin-top: 0.75rem;
  color: ${TEXT_MUTED};
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${TEXT_BODY};
  }
`;

const MAIN_FLOW = [
  { id: "pending_deposit", label: "Awaiting deposit" },
  { id: "deposit_paid", label: "Deposit received" },
  { id: "invoiced", label: "Balance invoiced" },
  { id: "fully_paid", label: "Paid in full" },
];

const RANK = {
  pending_deposit: 0,
  deposit_paid: 1,
  invoiced: 2,
  fully_paid: 3,
  in_progress: 3,
  completed: 4,
};

function isStepDone(i, status) {
  if (status === "cancelled" || status === "refunded") return false;
  if (status === "completed") return true;
  const r = RANK[status] ?? 0;
  if (i < MAIN_FLOW.length - 1) return r > i;
  return r >= 3;
}

function isStepActive(i, status) {
  if (status === "cancelled" || status === "refunded" || status === "completed") return false;
  const r = RANK[status] ?? 0;
  const activeRank = Math.min(r, 3);
  return activeRank === i;
}

export default function BookingStatusPanel({ booking, token, currency }) {
  const st = booking?.status;
  const isTerminal = st === "cancelled" || st === "refunded";
  const balanceDue = Number(booking?.balance_cents) > 0;
  const showPayBalance =
    balanceDue && (st === "deposit_paid" || st === "invoiced");

  return (
    <Wrap>
      <Title>Your booking</Title>
      <RefBlock>
        <strong>Reference:</strong> {booking.reference}
        <br />
        <strong>Status:</strong> {BOOKING_STATUS_LABELS[st] || st}
      </RefBlock>

      {!isTerminal ? (
        <Timeline>
          {MAIN_FLOW.map((step, i) => {
            const done = isStepDone(i, st);
            const active = isStepActive(i, st);
            return (
              <TlItem key={step.id} $done={done || active}>
                <Dot $done={done} $active={active} />
                <TlLabel $active={active} $done={done && !active} $muted={!done && !active}>
                  {step.label}
                </TlLabel>
              </TlItem>
            );
          })}
        </Timeline>
      ) : (
        <p style={{ color: TEXT_BODY, marginBottom: "1rem" }}>
          {BOOKING_STATUS_LABELS[st] || st}
        </p>
      )}

      <MoneyGrid>
        <MLabel>Total</MLabel>
        <MVal>{formatMoney(booking.total_cents, currency)}</MVal>
        <MLabel>Deposit</MLabel>
        <MVal>{formatMoney(booking.deposit_cents, currency)}</MVal>
        <MLabel>Balance</MLabel>
        <MVal>{formatMoney(booking.balance_cents, currency)}</MVal>
      </MoneyGrid>

      {booking.invoice_url && st !== "fully_paid" && st !== "completed" ? (
        <InvoiceCard>
          <InvoiceTitle>Balance invoice</InvoiceTitle>
          {showPayBalance ? (
            <>
              <BalanceCta href={`/corporate/shortlist/${token}/balance?booking=${booking.id}`}>
                Pay balance · {formatMoney(booking.balance_cents, currency)}
              </BalanceCta>
              <SecondaryInvoiceLink href={booking.invoice_url} target="_blank" rel="noreferrer">
                Or open Stripe invoice
              </SecondaryInvoiceLink>
            </>
          ) : (
            <InvoiceLink href={booking.invoice_url} target="_blank" rel="noreferrer">
              Open balance invoice
            </InvoiceLink>
          )}
          {booking.invoice_due_at ? (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem", color: TEXT_MUTED }}>
              Due {dayjs(booking.invoice_due_at).format("MMM D, YYYY")}
            </p>
          ) : null}
        </InvoiceCard>
      ) : showPayBalance ? (
        <BalanceCta href={`/corporate/shortlist/${token}/balance?booking=${booking.id}`}>
          Pay balance · {formatMoney(booking.balance_cents, currency)}
        </BalanceCta>
      ) : null}

      {st === "pending_deposit" ? (
        <DepositCta href={`/corporate/shortlist/${token}/checkout?booking=${booking.id}`}>
          Complete deposit
        </DepositCta>
      ) : null}
    </Wrap>
  );
}
