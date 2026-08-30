"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styled, { css } from "styled-components";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/subscriptionPlans";
import { BP } from "@/components/marketing/tokens";

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

  ${(p) =>
    p.$layout === "stack" &&
    css`
      grid-template-columns: 1fr;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    `}

  ${(p) =>
    p.$layout !== "stack" &&
    css`
      @media (max-width: 860px) {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }
    `}

  ${(p) =>
    p.$layout === "snap" &&
    css`
      @media (max-width: ${BP.mobile}px) {
        display: none;
      }
    `}
`;

const Snap = styled.div`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: ${(p) => (p.$on ? "block" : "none")};
  }
`;

const Track = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 20px;
  padding: 18px 20px 8px;
  margin: 0 -20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SnapCard = styled.div`
  flex: 0 0 82vw;
  max-width: 340px;
  scroll-snap-align: center;
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
`;

const Dot = styled.button`
  appearance: none;
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: ${(p) => (p.$on ? "#111" : "#d4d4d8")};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #fc4056;
    outline-offset: 2px;
  }
`;

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
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
  min-height: ${(p) => (p.$compact ? "0" : "248px")};

  @media (max-width: ${BP.mobile}px) {
    min-height: 0;
    padding: 18px 18px 16px;
  }
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
  min-height: ${(p) => (p.$compact ? "0" : "40px")};

  @media (max-width: ${BP.mobile}px) {
    min-height: 0;
    margin-bottom: 12px;
  }
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

  @media (max-width: ${BP.mobile}px) {
    padding: 14px 16px 16px;
  }
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

function PlanCardBody({
  plan,
  selected,
  suggested,
  compact,
  selectable,
  onSelect,
  hrefForPlan,
  renderCta,
  featureCount,
}) {
  const features = trayFeatures(plan).slice(0, featureCount);
  return (
    <Card $on={selected} $best={suggested} data-plan-id={plan.id}>
      {suggested ? <BestValue>Best value</BestValue> : null}
      <Top $compact={compact}>
        <Name>{plan.name}</Name>
        <Desc $compact={compact}>{PLAN_BLURB[plan.id]}</Desc>
        <PriceRow>
          <Amount>${plan.price}.00</Amount>
          <Period>/Month</Period>
        </PriceRow>
        {renderCta ? (
          renderCta(plan, {
            Cta: PlanCtaButton,
            dark: plan.featured || selected,
          })
        ) : selectable ? (
          <CtaButton
            $dark={selected}
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(plan.id)}
          >
            {selected ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                Selected
              </>
            ) : (
              `Choose ${plan.name}`
            )}
          </CtaButton>
        ) : (
          <PlanCtaButton
            as={Link}
            href={hrefForPlan ? hrefForPlan(plan) : "#"}
            $dark={plan.featured}
          >
            {plan.featured ? "Get started" : `Choose ${plan.name}`}
          </PlanCtaButton>
        )}
      </Top>
      <Tray>
        <TrayLabel>{TRAY_LABEL[plan.id]}</TrayLabel>
        <Features>
          <Feature>
            <Mark>
              <Check size={11} strokeWidth={3} />
            </Mark>
            {plan.commission}% per paid booking
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
}

export default function PlanCards({
  selectedId,
  onSelect,
  hrefForPlan,
  renderCta,
  suggestedId,
  layout = "grid",
}) {
  const selectable = typeof onSelect === "function";
  const trackRef = useRef(null);
  const [snapIndex, setSnapIndex] = useState(
    Math.max(0, PLANS.findIndex((p) => p.featured)),
  );

  useEffect(() => {
    if (layout !== "snap") return undefined;
    const track = trackRef.current;
    if (!track) return undefined;
    const featured = track.querySelector("[data-plan-featured]");
    if (featured) {
      featured.scrollIntoView({ inline: "center", block: "nearest" });
    }
    const onScroll = () => {
      const cards = [...track.children];
      if (!cards.length) return;
      const mid =
        track.getBoundingClientRect().left + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setSnapIndex(best);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [layout]);

  const goTo = (i) => {
    const track = trackRef.current;
    const card = track?.querySelectorAll("[data-plan-id]")[i];
    card?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };

  const cards = PLANS.map((p) => {
    const selected = selectable ? selectedId === p.id : p.featured;
    const suggested = suggestedId ? p.id === suggestedId : p.featured;
    return { p, selected, suggested };
  });

  return (
    <>
      <Grid
        $layout={layout}
        role={selectable ? "radiogroup" : undefined}
        aria-label="Plans"
      >
        {cards.map(({ p, selected, suggested }) => (
          <PlanCardBody
            key={p.id}
            plan={p}
            selected={selected}
            suggested={suggested}
            compact={false}
            selectable={selectable}
            onSelect={onSelect}
            hrefForPlan={hrefForPlan}
            renderCta={renderCta}
            featureCount={6}
          />
        ))}
      </Grid>
      {layout === "snap" ? (
        <Snap $on aria-label="Plans">
          <Track ref={trackRef}>
            {cards.map(({ p, selected, suggested }) => (
              <SnapCard
                key={p.id}
                data-plan-featured={p.featured ? "" : undefined}
              >
                <PlanCardBody
                  plan={p}
                  selected={selected}
                  suggested={suggested}
                  compact
                  selectable={selectable}
                  onSelect={onSelect}
                  hrefForPlan={hrefForPlan}
                  renderCta={renderCta}
                  featureCount={4}
                />
              </SnapCard>
            ))}
          </Track>
          <Dots>
            {PLANS.map((p, i) => (
              <Dot
                key={p.id}
                type="button"
                $on={snapIndex === i}
                aria-label={`Show ${p.name} plan`}
                onClick={() => goTo(i)}
              />
            ))}
          </Dots>
        </Snap>
      ) : null}
    </>
  );
}
