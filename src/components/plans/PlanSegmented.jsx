"use client";

import styled from "styled-components";
import { PLANS } from "@/lib/subscriptionPlans";
import { marketingTheme as t } from "@/components/marketing/tokens";

const Wrap = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  background: #f3f3f4;
  border-radius: 999px;
`;

const Seg = styled.button`
  appearance: none;
  border: none;
  min-height: 40px;
  padding: 8px 6px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
  background: ${(p) => (p.$on ? "#111" : "transparent")};
  color: ${(p) => (p.$on ? "#fff" : "#111")};
  box-shadow: ${(p) => (p.$on ? "0 1px 3px rgba(0,0,0,0.18)" : "none")};

  &:focus-visible {
    outline: 2px solid ${t.colors.primary};
    outline-offset: 2px;
  }
`;

export default function PlanSegmented({
  value,
  onChange,
  "aria-label": ariaLabel = "Plans",
}) {
  return (
    <Wrap role="tablist" aria-label={ariaLabel}>
      {PLANS.map((plan) => (
        <Seg
          key={plan.id}
          type="button"
          role="tab"
          aria-selected={value === plan.id}
          $on={value === plan.id}
          onClick={() => onChange(plan.id)}
        >
          {plan.name}
        </Seg>
      ))}
    </Wrap>
  );
}
