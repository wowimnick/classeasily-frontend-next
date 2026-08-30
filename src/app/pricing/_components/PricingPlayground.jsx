"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import styled from "styled-components";
import NumberFlow from "@number-flow/react";
import { PLANS } from "@/lib/subscriptionPlans";

const MIN = 500;
const MAX = 10000;
const STEP = 100;

const money = (n) =>
  n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
  gap: 48px 64px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const Copy = styled.div`
  min-width: 0;
`;

const Headline = styled.h1`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.55);
`;

const Amount = styled.span`
  display: block;
  margin: 4px 0 2px;
  font-size: clamp(44px, 5.4vw, 64px);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1;
  color: #111;
  font-variant-numeric: tabular-nums;
`;

const Formula = styled.p`
  margin: 0 0 28px;
  font-size: 16px;
  line-height: 1.5;
  color: #111;
  font-variant-numeric: tabular-nums;

  em {
    font-style: normal;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 500;
  }
`;

const SliderBlock = styled.div`
  max-width: 420px;
`;

const SliderLabel = styled.label`
  display: block;
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
`;

const Range = styled.input.attrs({ type: "range" })`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 28px;
  margin: 0;
  background: transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid #fc4056;
    outline-offset: 4px;
    border-radius: 999px;
  }

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      #fc4056 0%,
      #fc4056 var(--pct),
      #e8e8e8 var(--pct),
      #e8e8e8 100%
    );
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    margin-top: -12px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #dedede;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 999px;
    background: #e8e8e8;
  }

  &::-moz-range-progress {
    height: 4px;
    border-radius: 999px;
    background: #fc4056;
  }

  &::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #dedede;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  }
`;

const Plans = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
`;

const PlanChip = styled.button`
  appearance: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$on ? "#111" : "#e5e5e5")};
  background: ${(p) => (p.$on ? "#111" : "#fff")};
  color: ${(p) => (p.$on ? "#fff" : "#111")};

  &:hover {
    border-color: #111;
  }

  &:focus-visible {
    outline: 2px solid #fc4056;
    outline-offset: 2px;
  }
`;

const Fine = styled.p`
  margin: 18px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.45);
  max-width: 36em;
`;

const Visual = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  margin-left: auto;
  aspect-ratio: 1;
  border-radius: 24px;
  overflow: hidden;
  background: #f3efe9;
  box-shadow:
    0 16px 40px rgba(15, 18, 30, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.04);

  @media (max-width: 900px) {
    max-width: 420px;
    margin: 0 auto;
  }
`;

const Shot = styled(Image)`
  object-fit: cover;
  object-position: center 20%;
`;

export default function PricingPlayground() {
  const sliderId = useId();
  const [volume, setVolume] = useState(2500);
  const [picked, setPicked] = useState(null);
  const pct = ((volume - MIN) / (MAX - MIN)) * 100;

  const rows = useMemo(
    () =>
      PLANS.map((plan) => ({
        plan,
        commission: (volume * plan.commission) / 100,
        total: plan.price + (volume * plan.commission) / 100,
      })),
    [volume],
  );
  const cheapest = rows.reduce((a, b) => (a.total <= b.total ? a : b));
  const cheapestId = cheapest.plan.id;
  const active =
    rows.find((r) => r.plan.id === (picked || cheapestId)) ?? rows[1];
  const isBest = active.plan.id === cheapestId;

  return (
    <Grid>
      <Copy>
        <Headline>
          You collect
          <Amount>
            <NumberFlow
              value={volume}
              format={{
                style: "currency",
                currency: "CAD",
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 0,
              }}
              locales="en-CA"
            />
          </Amount>
          from customers each month
        </Headline>
        <Formula>
          {isBest ? (
            <>
              {active.plan.name} is the best value at{" "}
              {money(Math.round(active.total))}/mo{" "}
              <em>
                · {money(active.plan.price)} plan + {active.plan.commission}% of
                bookings
              </em>
            </>
          ) : (
            <>
              {active.plan.name} costs {money(Math.round(active.total))}/mo{" "}
              <em>
                · {cheapest.plan.name} is the best value at{" "}
                {money(Math.round(cheapest.total))}
              </em>
            </>
          )}
        </Formula>

        <SliderBlock>
          <SliderLabel htmlFor={sliderId}>
            How much you collect each month
          </SliderLabel>
          <Range
            id={sliderId}
            min={MIN}
            max={MAX}
            step={STEP}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ "--pct": `${pct}%` }}
          />
        </SliderBlock>

        <Plans role="group" aria-label="Plans">
          {rows.map(({ plan, total }) => (
            <PlanChip
              key={plan.id}
              type="button"
              $on={plan.id === active.plan.id}
              onClick={() => setPicked(plan.id)}
            >
              {plan.name} · {money(Math.round(total))}
              {plan.id === cheapestId ? " · best value" : ""}
            </PlanChip>
          ))}
        </Plans>

        <Fine>
          The first three months include no commission — you pay the plan fee
          only. Stripe processing is billed separately. All amounts in CAD.
        </Fine>
      </Copy>

      <Visual>
        <Shot
          src="/payments-apple-pay.webp"
          alt="A customer paying for an appointment on their phone"
          fill
          sizes="(max-width: 900px) 420px, 480px"
          priority
        />
      </Visual>
    </Grid>
  );
}
