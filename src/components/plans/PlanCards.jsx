"use client";

import Link from "next/link";
import styled from "styled-components";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/subscriptionPlans";

export const PLAN_BLURB = {
  basic:
    "Start taking bookings and payments on your website with client management built in.",
  growth:
    "Add branded emails and memberships while keeping more from every booking.",
  advanced:
    "Lower your booking rate as volume grows, with every Growth feature included.",
};

const TRAY_LABEL = {
  basic: "Get started with",
  growth: "Everything in Basic",
  advanced: "Everything in Growth",
};

function trayFeatures(plan) {
  return plan.features.filter((f) => !/^Everything in /i.test(f.label));
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
  padding-top: 14px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: #f3f3f3;
  border-radius: 28px;
  padding: 6px;
  box-shadow: ${(p) => {
    const ring = p.$best ? "0 0 0 0.5px #111" : "0 0 0 0px transparent";
    const lift = p.$on
      ? "0 22px 50px rgba(0, 0, 0, 0.12)"
      : "0 8px 24px rgba(0, 0, 0, 0.04)";
    return `${ring}, ${lift}`;
  }};
`;

const BestValue = styled.span`
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #111;
  background: #fff;
  border: 0.5px solid #111;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
`;

const Top = styled.div`
  background: #fff;
  border-radius: 22px;
  padding: 22px 22px 20px;
  display: flex;
  flex-direction: column;
  min-height: 248px;
`;

const Name = styled.h3`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #111;
`;

const Desc = styled.p`
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.5;
  color: #000;
  min-height: 40px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: auto;
  margin-bottom: 16px;
`;

const Amount = styled.span`
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #111;
`;

const Period = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #000;
`;

export const PlanCtaButton = styled.a`
  appearance: none;
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  background: ${(p) => (p.$dark ? "#111" : "#ececec")};
  color: ${(p) => (p.$dark ? "#fff" : "#111")};
  box-shadow: ${(p) =>
    p.$dark ? "0 10px 22px rgba(0, 0, 0, 0.22)" : "none"};

  &:hover {
    background: ${(p) => (p.$dark ? "#000" : "#e4e4e4")};
    color: ${(p) => (p.$dark ? "#fff" : "#111")};
  }
`;

const CtaButton = styled(PlanCtaButton).attrs({ as: "button", type: "button" })``;

const Tray = styled.div`
  padding: 18px 18px 22px;
  flex: 1;
`;

const TrayLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #000;
  margin-bottom: 14px;
`;

const Features = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Feature = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: #111;
`;

const Mark = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

export default function PlanCards({
  selectedId,
  onSelect,
  hrefForPlan,
  renderCta,
  suggestedId,
}) {
  const selectable = typeof onSelect === "function";

  return (
    <Grid role={selectable ? "radiogroup" : undefined} aria-label="Plans">
      {PLANS.map((p) => {
        const selected = selectable ? selectedId === p.id : p.featured;
        const suggested = suggestedId ? p.id === suggestedId : p.featured;
        const features = trayFeatures(p).slice(0, 6);
        return (
          <Card key={p.id} $on={selected} $best={suggested}>
            {suggested ? <BestValue>Best value</BestValue> : null}
            <Top>
              <Name>{p.name}</Name>
              <Desc>{PLAN_BLURB[p.id]}</Desc>
              <PriceRow>
                <Amount>${p.price}.00</Amount>
                <Period>/Month</Period>
              </PriceRow>
              {renderCta ? (
                renderCta(p, {
                  Cta: PlanCtaButton,
                  dark: p.featured || selected,
                })
              ) : selectable ? (
                <CtaButton
                  $dark={selected}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(p.id)}
                >
                  {selected ? (
                    <>
                      <Check size={16} strokeWidth={2.5} />
                      Selected
                    </>
                  ) : (
                    `Choose ${p.name}`
                  )}
                </CtaButton>
              ) : (
                <PlanCtaButton
                  as={Link}
                  href={hrefForPlan ? hrefForPlan(p) : "#"}
                  $dark={p.featured}
                >
                  {p.featured ? "Get started" : `Choose ${p.name}`}
                </PlanCtaButton>
              )}
            </Top>
            <Tray>
              <TrayLabel>{TRAY_LABEL[p.id]}</TrayLabel>
              <Features>
                <Feature>
                  <Mark>
                    <Check size={11} strokeWidth={3} />
                  </Mark>
                  {p.commission}% per paid booking
                </Feature>
                {features.map((f) => (
                  <Feature key={f.label}>
                    <Mark>
                      <Check size={11} strokeWidth={3} />
                    </Mark>
                    {f.label}
                  </Feature>
                ))}
              </Features>
            </Tray>
          </Card>
        );
      })}
    </Grid>
  );
}
