"use client";

import { useId, useState } from "react";
import styled from "styled-components";
import NumberFlow from "@number-flow/react";
import PlanCards from "@/components/plans/PlanCards";
import {
  lowestCostPlan,
  planCostForVolume,
} from "@/lib/subscriptionPlans";

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

const Wrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Tool = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.75fr);
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Collect = styled.div`
  padding: 28px 28px 24px;
  min-width: 0;

  @media (max-width: 640px) {
    padding: 22px 20px 20px;
  }
`;

const Label = styled.label`
  display: block;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
`;

const Volume = styled.p`
  margin: 0 0 18px;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1;
  color: #111;
  font-variant-numeric: tabular-nums;

  @media (max-width: 640px) {
    font-size: 32px;
  }
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

const Suggest = styled.div`
  position: relative;
  z-index: 1;
  margin: 10px 10px 10px 0;
  padding: 22px 24px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow:
    0 18px 40px rgba(15, 18, 30, 0.12),
    0 4px 12px rgba(15, 18, 30, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;

  @media (max-width: 800px) {
    margin: 0 10px 10px;
    padding: 20px;
  }
`;

const SuggestKicker = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #111;
`;

const SuggestName = styled.p`
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #111;
`;

const SuggestPrice = styled.p`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.1;
  color: #111;
  font-variant-numeric: tabular-nums;
`;

const SuggestMath = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #111;
  font-variant-numeric: tabular-nums;
`;

const Cards = styled.div``;

const CardsLabel = styled.p`
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
`;

export default function PlanPicker({ planId, onChange, onVolumeChange }) {
  const sliderId = useId();
  const [volume, setVolume] = useState(2500);
  const suggested = lowestCostPlan(volume);
  const cost = planCostForVolume(suggested, volume);
  const pct = ((volume - MIN) / (MAX - MIN)) * 100;

  const onSlide = (next) => {
    setVolume(next);
    onChange(lowestCostPlan(next).id);
    onVolumeChange?.(next);
  };

  return (
    <Wrap>
      <Tool>
        <Collect>
          <Label htmlFor={sliderId}>How much you collect each month</Label>
          <Volume>
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
          </Volume>
          <Range
            id={sliderId}
            min={MIN}
            max={MAX}
            step={STEP}
            value={volume}
            onChange={(e) => onSlide(Number(e.target.value))}
            style={{ "--pct": `${pct}%` }}
          />
        </Collect>
        <Suggest>
          <SuggestKicker>Best value at this volume</SuggestKicker>
          <SuggestName>{suggested.name}</SuggestName>
          <SuggestPrice>
            <NumberFlow
              value={Math.round(cost.total)}
              format={{
                style: "currency",
                currency: "CAD",
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 0,
              }}
              locales="en-CA"
            />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>
              {" "}
              /mo
            </span>
          </SuggestPrice>
          <SuggestMath>
            {money(suggested.price)} plan + {suggested.commission}% of bookings.
            You can still pick any plan.
          </SuggestMath>
        </Suggest>
      </Tool>

      <Cards>
        <CardsLabel>Select a plan</CardsLabel>
        <PlanCards
          layout="snap"
          selectedId={planId}
          onSelect={onChange}
          suggestedId={suggested.id}
        />
      </Cards>
    </Wrap>
  );
}
