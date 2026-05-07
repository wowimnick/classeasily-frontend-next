"use client";

import styled from "styled-components";

const Span = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

export default function MoneyChip({ cents, currency = "usd" }) {
  if (cents == null && cents !== 0) return "—";
  const n = Number(cents) || 0;
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
  }).format(n / 100);
  return <Span>{formatted}</Span>;
}
