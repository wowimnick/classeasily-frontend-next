"use client";

import styled from "styled-components";
import { formatMoney } from "./formatMoney";

const StandaloneSection = styled.section`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #ebebeb;
`;

const EmbeddedRoot = styled.div`
  padding: 1.25rem clamp(1rem, 3vw, 1.5rem) 1.5rem;
  border-top: 1px solid #ebebeb;
  background: #ffffff;
`;

const Heading = styled.h2`
  font-size: clamp(20px, 0.95rem + 1.5vw, 23px);
  font-weight: 500;
  color: #000000;
  margin: 0 0 0.5rem;
  line-height: 1.25;
`;

const Subline = styled.p`
  font-size: 15px;
  font-weight: 400;
  color: #000000;
  margin: 0 0 1rem;
  line-height: 1.5;
  max-width: 52ch;
`;

const PriceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  line-height: 1.45;
  color: #000000;

  caption {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  tbody tr:not(:last-child) th,
  tbody tr:not(:last-child) td {
    border-bottom: 1px solid #ebebeb;
  }

  th[scope="row"] {
    font-weight: 400;
    text-align: left;
    padding: 0.65rem 1rem 0.65rem 0;
    vertical-align: baseline;
  }

  td {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    padding: 0.65rem 0;
    vertical-align: baseline;
    white-space: nowrap;
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    padding-bottom: 0;
  }

  tbody tr:first-child th,
  tbody tr:first-child td {
    padding-top: 0;
  }
`;

export default function CostBreakdown({
  totalCents,
  depositPercent,
  depositCents,
  balanceCents,
  currency = "usd",
  experienceTitle,
  /** Use inside OptionsPricingShell — no outer section spacing / top rule */
  variant = "standalone",
}) {
  const subline =
    experienceTitle != null && experienceTitle !== ""
      ? `Totals for ${experienceTitle}. Deposit today; balance is invoiced after your event.`
      : "Deposit today; balance is invoiced after your event.";

  const body = (
    <>
      <Heading id="shortlist-pricing-heading">Pricing</Heading>
      <Subline>{subline}</Subline>
      <PriceTable>
        <caption>Pricing estimate for this shortlist</caption>
        <tbody>
          <tr>
            <th scope="row">Total (estimate)</th>
            <td>{formatMoney(totalCents, currency)}</td>
          </tr>
          <tr>
            <th scope="row">Deposit ({depositPercent}%)</th>
            <td>{formatMoney(depositCents, currency)}</td>
          </tr>
          <tr>
            <th scope="row">Balance (invoiced)</th>
            <td>{formatMoney(balanceCents, currency)}</td>
          </tr>
        </tbody>
      </PriceTable>
    </>
  );

  if (variant === "embedded") {
    return (
      <EmbeddedRoot aria-labelledby="shortlist-pricing-heading">
        {body}
      </EmbeddedRoot>
    );
  }

  return (
    <StandaloneSection aria-labelledby="shortlist-pricing-heading">{body}</StandaloneSection>
  );
}
