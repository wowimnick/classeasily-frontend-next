"use client";

import styled from "styled-components";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/subscriptionPlans";
import { PLAN_BLURB } from "@/components/plans/PlanCards";

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const Card = styled.button`
  appearance: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  background: #fff;
  border: 1px solid ${(p) => (p.$on ? "#111" : "#ebebeb")};
  border-radius: 16px;
  box-shadow: ${(p) =>
    p.$on
      ? "0 8px 24px rgba(0, 0, 0, 0.08)"
      : "0 2px 12px rgba(0, 0, 0, 0.06)"};
  padding: 16px 18px 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  position: relative;
`;

const Name = styled.div`
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Best = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #111;
  background: #f3f3f3;
  border-radius: 999px;
  padding: 3px 8px;
`;

const Price = styled.div`
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.03em;
  white-space: nowrap;
`;

const Blurb = styled.p`
  grid-column: 1 / -1;
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #6a6a6a;
`;

const Meta = styled.div`
  grid-column: 1 / -1;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #222;
`;

const Selected = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #111;
`;

export default function PlanPicker({ planId, onChange }) {
  return (
    <List role="radiogroup" aria-label="Plans">
      {PLANS.map((plan) => {
        const selected = planId === plan.id;
        return (
          <Card
            key={plan.id}
            type="button"
            $on={selected}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(plan.id)}
          >
            <Name>
              {plan.name}
              {plan.featured ? <Best>Best value</Best> : null}
            </Name>
            <Price>${plan.price}/mo</Price>
            <Blurb>{PLAN_BLURB[plan.id]}</Blurb>
            <Meta>
              <span>{plan.commission}% per paid booking</span>
              {selected ? (
                <Selected>
                  <Check size={14} strokeWidth={2.5} />
                  Selected
                </Selected>
              ) : (
                <span style={{ color: "#6a6a6a", fontWeight: 600 }}>
                  Choose {plan.name}
                </span>
              )}
            </Meta>
          </Card>
        );
      })}
    </List>
  );
}
