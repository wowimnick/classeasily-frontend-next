"use client";

import { useId, useState } from "react";
import styled from "styled-components";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { PLANS } from "@/lib/subscriptionPlans";
import { groupCompareRows } from "./MobilePlanCompare";
import { BP } from "@/components/marketing/tokens";

/** Header sits below the fixed marketing header while the table scrolls. */
const STUCK_TOP = 80;
const STUCK_TOP_SM = 68;

function groupRows() {
  return groupCompareRows();
}

const DesktopOnly = styled.div`
  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
`;

const cellBase = `
  padding: 15px 20px;
  vertical-align: top;
  border-bottom: 1px solid #e9ecf1;
`;

const stuckGlass = `
  background: rgba(250, 251, 252, 0.78);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
`;

const HeadCell = styled.th`
  ${cellBase}
  position: sticky;
  top: ${STUCK_TOP}px;
  z-index: 6;
  ${stuckGlass}
  padding-top: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #111;
  box-shadow: 0 8px 16px -12px rgba(15, 18, 30, 0.18);
  vertical-align: bottom;
  width: 17%;
  text-align: center;

  @media (max-width: 900px) {
    top: ${STUCK_TOP_SM}px;
  }
`;

const HeadCorner = styled(HeadCell)`
  left: 0;
  z-index: 7;
  width: 49%;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;

  @media (max-width: 900px) {
    position: sticky;
  }
`;

const HeadName = styled.span`
  display: block;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #111;
`;

const HeadPrice = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  font-variant-numeric: tabular-nums;
`;

const HeadRate = styled.span`
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
`;

const HeadFlag = styled.span`
  display: block;
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fc4056;
`;

const GroupCell = styled.th`
  ${cellBase}
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fafbfc;
  padding-top: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid #111;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #111;
`;

const FeatureCell = styled.th`
  ${cellBase}
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fafbfc;
  font-weight: 500;
  font-size: 15px;
  line-height: 1.45;
  color: #111;
`;

const ValueCell = styled.td`
  ${cellBase}
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #111;
  background: ${(p) => (p.$featured ? "rgba(252, 64, 86, 0.035)" : "transparent")};
  font-variant-numeric: tabular-nums;
`;

const FeaturedHead = styled(HeadCell)`
  background: rgba(255, 246, 247, 0.82);
`;

const LabelRow = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
`;

const InfoDot = styled.button`
  appearance: none;
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 1px solid #d3d8e0;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transform: translateY(2px);
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.2s ease;

  svg {
    transition: transform 0.22s ease;
    transform: rotate(${(p) => (p.$open ? "45deg" : "0deg")});
  }

  &:hover {
    border-color: #111;
    color: #111;
  }

  &:focus-visible {
    outline: 2px solid #fc4056;
    outline-offset: 2px;
  }
`;

const Detail = styled(motion.div)`
  overflow: hidden;
`;

const DetailText = styled.p`
  margin: 8px 0 2px;
  font-size: 13px;
  line-height: 1.55;
  font-weight: 400;
  color: #4b5563;
  max-width: 46ch;
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
  vertical-align: middle;
`;

const CtaCell = styled.td`
  padding: 22px 14px 4px;
  text-align: center;
  vertical-align: top;
  background: ${(p) => (p.$featured ? "rgba(252, 64, 86, 0.035)" : "transparent")};
`;

const Hidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ScrollHint = styled.p`
  display: none;
`;

function Value({ row, planId }) {
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

function FeatureRow({ row }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const detailId = useId();

  return (
    <tr>
      <FeatureCell scope="row">
        <LabelRow>
          {row.label}
          {row.tooltip ? (
            <InfoDot
              type="button"
              $open={open}
              aria-expanded={open}
              aria-controls={detailId}
              aria-label={`What ${row.label} means`}
              onClick={() => setOpen((v) => !v)}
            >
              <Plus size={11} strokeWidth={2.5} />
            </InfoDot>
          ) : null}
        </LabelRow>
        <AnimatePresence initial={false}>
          {open ? (
            <Detail
              id={detailId}
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <DetailText>{row.tooltip}</DetailText>
            </Detail>
          ) : null}
        </AnimatePresence>
      </FeatureCell>
      {PLANS.map((plan) => (
        <ValueCell key={plan.id} $featured={plan.featured}>
          <Value row={row} planId={plan.id} />
        </ValueCell>
      ))}
    </tr>
  );
}

export default function PlanComparison({ renderCta }) {
  const groups = groupRows();

  return (
    <DesktopOnly>
      <ScrollHint>Scroll sideways to compare all three plans.</ScrollHint>
      <div>
        <Table>
          <caption>
            <Hidden>Feature comparison across ClassEasily plans</Hidden>
          </caption>
          <thead>
            <tr>
              <HeadCorner scope="col">Compare plans</HeadCorner>
              {PLANS.map((plan) => {
                const Cell = plan.featured ? FeaturedHead : HeadCell;
                return (
                  <Cell key={plan.id} scope="col">
                    {plan.featured ? <HeadFlag>Best value</HeadFlag> : null}
                    <HeadName>{plan.name}</HeadName>
                    <HeadPrice>${plan.price}/mo</HeadPrice>
                    <HeadRate>+{plan.commission}% per booking</HeadRate>
                  </Cell>
                );
              })}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.id}>
              <tr>
                <GroupCell scope="colgroup" colSpan={PLANS.length + 1}>
                  {group.label}
                </GroupCell>
              </tr>
              {group.items.map((row) => (
                <FeatureRow key={row.id} row={row} />
              ))}
            </tbody>
          ))}
          {renderCta ? (
            <tfoot>
              <tr>
                <td />
                {PLANS.map((plan) => (
                  <CtaCell key={plan.id} $featured={plan.featured}>
                    {renderCta(plan)}
                  </CtaCell>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </Table>
      </div>
    </DesktopOnly>
  );
}
