"use client";

import { useState } from "react";
import styled from "styled-components";
import { Check, ChevronDown } from "lucide-react";
import { PLANS, WIDGET_PLAN_COMPARISON_ROWS } from "@/lib/subscriptionPlans";
import PlanSegmented from "@/components/plans/PlanSegmented";
import { marketingTheme as t, BP } from "@/components/marketing/tokens";

export const COMPARE_GROUPS = [
  {
    id: "core",
    label: "Taking bookings",
    rows: [
      "widget_site",
      "scheduling",
      "payments",
      "embed_modes",
      "dashboard_payout",
    ],
  },
  {
    id: "brand",
    label: "Staying on brand",
    rows: ["brand", "domain_whitelist", "booking_emails", "pin_class"],
  },
  {
    id: "grow",
    label: "Growing repeat business",
    rows: ["crm", "memberships", "promos", "reminders", "widget_analytics"],
  },
];

export function groupCompareRows() {
  const byId = new Map(
    WIDGET_PLAN_COMPARISON_ROWS.filter(
      (r) => r.id !== "marketplace" && r.id !== "commission",
    ).map((r) => [r.id, r]),
  );

  const groups = COMPARE_GROUPS.map((g) => ({
    ...g,
    items: g.rows.map((id) => byId.get(id)).filter(Boolean),
  }));
  groups.forEach((g) => g.rows.forEach((id) => byId.delete(id)));

  const leftover = [...byId.values()];
  return leftover.length
    ? [...groups, { id: "more", label: "Also included", items: leftover }]
    : groups;
}

const Wrap = styled.div`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: block;
  }
`;

const CtaSlot = styled.div`
  margin-top: 16px;
`;

const Groups = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Group = styled.div`
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 16px;
  overflow: hidden;
`;

const GroupBtn = styled.button`
  appearance: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #111;
  cursor: pointer;
  text-align: left;

  svg {
    flex-shrink: 0;
    transition: transform 0.2s ease;
    transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
  }
`;

const Rows = styled.div`
  display: ${(p) => (p.$open ? "block" : "none")};
  border-top: 1px solid #f0f0f0;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 12px 16px;
  border-top: 1px solid #f4f4f5;

  &:first-child {
    border-top: none;
  }
`;

const Feature = styled.div`
  min-width: 0;
`;

const FeatureName = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 550;
  line-height: 1.4;
  color: #111;
`;

const All = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin-top: 8px;
`;

const AllCell = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
`;

const CompareToggle = styled.button`
  appearance: none;
  margin-top: 6px;
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: ${t.colors.primary};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #111;
  color: #fff;
`;

const Dash = styled.span`
  display: inline-block;
  width: 12px;
  height: 1.5px;
  background: #c8cdd6;
  align-self: center;
`;

const Hidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
`;

function cell(row, planId) {
  if (row.valueType === "text") return row.text?.[planId] || "—";
  if (row.plans?.[planId]) {
    return (
      <Mark>
        <Check size={12} strokeWidth={3} aria-hidden />
        <Hidden>Included</Hidden>
      </Mark>
    );
  }
  return (
    <>
      <Dash aria-hidden />
      <Hidden>Not included</Hidden>
    </>
  );
}

function FeatureRow({ row, planId, compareAll }) {
  return (
    <Row>
      <Feature>
        <FeatureName>{row.label}</FeatureName>
        {compareAll ? (
          <All>
            {PLANS.map((plan) => (
              <AllCell key={plan.id}>
                {cell(row, plan.id)}
                {plan.name}
              </AllCell>
            ))}
          </All>
        ) : null}
      </Feature>
      {compareAll ? null : cell(row, planId)}
    </Row>
  );
}

export default function MobilePlanCompare({
  planId,
  onPlanChange,
  renderCta,
}) {
  const groups = groupCompareRows();
  const [openId, setOpenId] = useState(groups[0]?.id || "core");
  const [compareAll, setCompareAll] = useState(false);
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];

  return (
    <Wrap data-mobile-plan-compare>
      <PlanSegmented value={plan.id} onChange={onPlanChange} />
      <CompareToggle
        type="button"
        onClick={() => setCompareAll((v) => !v)}
        aria-pressed={compareAll}
      >
        {compareAll ? "Show selected plan" : "Compare all"}
      </CompareToggle>
      <Groups>
        {groups.map((group) => {
          const open = openId === group.id;
          return (
            <Group key={group.id}>
              <GroupBtn
                type="button"
                $open={open}
                aria-expanded={open}
                onClick={() => setOpenId(open ? "" : group.id)}
              >
                {group.label}
                <ChevronDown size={16} />
              </GroupBtn>
              <Rows $open={open}>
                {group.items.map((row) => (
                  <FeatureRow
                    key={row.id}
                    row={row}
                    planId={plan.id}
                    compareAll={compareAll}
                  />
                ))}
              </Rows>
            </Group>
          );
        })}
      </Groups>
      {renderCta ? <CtaSlot>{renderCta(plan)}</CtaSlot> : null}
    </Wrap>
  );
}
