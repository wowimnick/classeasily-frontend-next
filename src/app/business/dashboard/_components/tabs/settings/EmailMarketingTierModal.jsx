"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Modal, Button, message as antMessage } from "antd";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { X, Check } from "lucide-react";
import styled from "styled-components";

const TIER_ORDER = [
  "email_marketing_starter",
  "email_marketing_growth",
  "email_marketing_business",
  "email_marketing_scale",
];

/** Display defaults when a tier has no Stripe price yet (slider still shows). */
const FALLBACK_BY_KEY = {
  email_marketing_starter: {
    plan_label: "Starter",
    ui_monthly_price: 6,
    monthly_marketing_send_limit: 2500,
    max_saved_templates: 5,
    custom_domain_allowed: false,
  },
  email_marketing_growth: {
    plan_label: "Growth",
    ui_monthly_price: 15,
    monthly_marketing_send_limit: 10000,
    max_saved_templates: 25,
    custom_domain_allowed: true,
  },
  email_marketing_business: {
    plan_label: "Business",
    ui_monthly_price: 29,
    monthly_marketing_send_limit: 50000,
    max_saved_templates: 75,
    custom_domain_allowed: true,
  },
  email_marketing_scale: {
    plan_label: "Scale",
    ui_monthly_price: 59,
    monthly_marketing_send_limit: 150000,
    max_saved_templates: 150,
    custom_domain_allowed: true,
  },
};

const Shell = styled.div`
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  color: #111827;
`;

const Hero = styled.div`
  text-align: center;
  padding: 8px 0 20px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
`;

const PlanTitle = styled.div`
  font-size: 14px;
  letter-spacing: 0.01em;
  color: #6b7280;
  margin-bottom: 10px;
`;

const BigPrice = styled.div`
  font-size: clamp(2.5rem, 8vw, 3.25rem);
  font-weight: 500;
  line-height: 1.05;
  color: #111827;
  font-variant-numeric: tabular-nums;
`;

const PriceSuffix = styled.span`
  font-size: 1.1rem;
  font-weight: 400;
  color: #9ca3af;
  margin-left: 4px;
`;

const EmailsLine = styled.div`
  margin-top: 14px;
  font-size: 1.05rem;
  color: #4b5563;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const EmailsStrong = styled.span`
  font-size: 1.35rem;
  font-weight: 500;
  color: #111827;
  font-variant-numeric: tabular-nums;
`;

const SliderWrap = styled.div`
  padding: 12px 4px 8px;
  margin-bottom: 8px;
`;

const StyledRange = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  appearance: none;
  background: linear-gradient(
    90deg,
    rgba(252, 64, 86, 0.45) 0%,
    #fc4056 ${({ $pct }) => $pct}%,
    #e5e7eb ${({ $pct }) => $pct}%,
    #e5e7eb 100%
  );
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #fc4056;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    cursor: grab;
  }
  &::-webkit-slider-thumb:active {
    cursor: grabbing;
  }
  &::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid #fc4056;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
`;

const TickRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  margin-top: 8px;
`;

const Tick = styled.button`
  background: none;
  border: none;
  padding: 4px 2px;
  cursor: pointer;
  font-size: 12px;
  letter-spacing: 0.01em;
  color: ${({ $active }) => ($active ? "#111827" : "#9ca3af")};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  font-family: ui-sans-serif, system-ui, sans-serif;
  max-width: 22%;
  line-height: 1.2;
  &:hover {
    color: #374151;
  }
`;

const TableWrap = styled.div`
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-top: 8px;
  background: #f9fafb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 10px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
`;

const ThTier = styled.th`
  text-align: center;
  padding: 12px 8px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  white-space: nowrap;
  min-width: 72px;
`;

const ThTierActive = styled(ThTier)`
  background: #fff5f5;
  color: #111827;
  box-shadow: inset 0 -2px 0 #fc4056;
`;

const Td = styled.td`
  padding: 11px 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  vertical-align: middle;
  background: #fff;
  font-size: 13px;
`;

const TdCenter = styled(Td)`
  text-align: center;
  padding: 11px 6px;
  vertical-align: middle;
`;

const TdCenterActive = styled(TdCenter)`
  background: #fffafb;
`;

const TdCenterInner = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 22px;
`;

const FooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

function mergeSteps(apiTiers) {
  const byKey = {};
  (apiTiers || []).forEach((t) => {
    byKey[t.tier_key] = t;
  });
  return TIER_ORDER.map((key) => {
    const api = byKey[key];
    const fb = FALLBACK_BY_KEY[key];
    return {
      tier_key: key,
      plan_label: api?.plan_label ?? fb.plan_label,
      price_id: api?.price_id || "",
      ui_monthly_price: api?.ui_monthly_price ?? fb.ui_monthly_price,
      monthly_marketing_send_limit:
        api?.monthly_marketing_send_limit ?? fb.monthly_marketing_send_limit,
      max_saved_templates: api?.max_saved_templates ?? fb.max_saved_templates,
      custom_domain_allowed: api?.custom_domain_allowed ?? fb.custom_domain_allowed,
      configured: Boolean(api?.price_id),
    };
  });
}

/**
 * Feature rows: minTierIndex is 0-based index in TIER_ORDER when the capability is included.
 */
const FEATURE_DEFS = [
  { id: "crm", label: "Contact & tag audiences", minTier: 0 },
  { id: "html", label: "HTML campaigns & editor", minTier: 0 },
  { id: "unsub", label: "One-click unsubscribe & footer", minTier: 0 },
  { id: "txn", label: "Transactional emails not counted toward quota", minTier: 0 },
  { id: "domain", label: "Verified custom sending domain", minTier: 1 },
];

export default function EmailMarketingTierModal({
  open,
  onClose,
  apiTiers = [],
  isSubscribed = false,
  currentTierKey = null,
  canInstantSubscribe = false,
  subscribing = false,
  onCheckout,
  onInstantSubscribe,
  onChangeTier,
}) {
  const steps = useMemo(() => mergeSteps(apiTiers), [apiTiers]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const i = currentTierKey ? TIER_ORDER.indexOf(currentTierKey) : 0;
    setIdx(i >= 0 ? i : 0);
  }, [open, currentTierKey]);

  const tier = steps[idx] || steps[0];
  const pct = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 0;
  const hasPrice = tier?.configured && tier?.price_id;

  const onSlider = useCallback(
    (raw) => {
      const v = Number(raw);
      if (Number.isNaN(v)) return;
      setIdx(Math.round(v));
    },
    []
  );

  const handlePrimary = async () => {
    if (!hasPrice) {
      antMessage.warning("This tier is not available yet. Set the Stripe price in your environment.");
      return;
    }
    if (isSubscribed) {
      if (tier.tier_key === currentTierKey) return;
      const r = await onChangeTier?.(tier.price_id);
      if (r?.success) onClose?.();
      return;
    }
    if (canInstantSubscribe) {
      const r = await onInstantSubscribe?.(tier.price_id);
      if (r?.success) onClose?.();
    } else {
      await onCheckout?.(tier.price_id);
    }
  };

  const primaryLabel = (() => {
    if (!hasPrice) return "Unavailable";
    if (isSubscribed) {
      if (tier.tier_key === currentTierKey) return "Current plan";
      return "Switch to this plan";
    }
    return canInstantSubscribe ? "Subscribe with saved card" : "Continue to checkout";
  })();

  const primaryDisabled =
    subscribing ||
    !hasPrice ||
    (isSubscribed && tier.tier_key === currentTierKey);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      closeIcon={<X size={18} style={{ color: "#6b7280" }} />}
      styles={{
        content: {
          background: "#ffffff",
          padding: 24,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        },
        header: { background: "transparent", border: "none", marginBottom: 0 },
        body: { paddingTop: 8 },
      }}
      title={
        <span style={{ color: "#111827", fontWeight: 600, fontSize: 18, fontFamily: "ui-sans-serif, system-ui" }}>
          Email marketing plans
        </span>
      }
    >
      <Shell>
        <Hero>
          <PlanTitle>Your selection</PlanTitle>
          <BigPrice>
            <NumberFlowGroup>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  "--number-flow-char-height": "1em",
                }}
              >
                <NumberFlow
                  value={tier?.ui_monthly_price ?? 0}
                  format={{
                    style: "currency",
                    currency: "CAD",
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                  }}
                />
                <PriceSuffix>/mo</PriceSuffix>
              </span>
            </NumberFlowGroup>
          </BigPrice>
          <EmailsLine>
            <span style={{ fontFamily: "ui-sans-serif, system-ui" }}>Up to</span>
            <EmailsStrong>
              <NumberFlow
                value={tier?.monthly_marketing_send_limit ?? 0}
                format={{ maximumFractionDigits: 0, useGrouping: true }}
              />
            </EmailsStrong>
            <span style={{ fontFamily: "ui-sans-serif, system-ui" }}>marketing emails / month</span>
          </EmailsLine>
        </Hero>

        <SliderWrap>
          <StyledRange
            type="range"
            min={0}
            max={steps.length - 1}
            step={1}
            value={idx}
            $pct={pct}
            onChange={(e) => onSlider(e.target.value)}
            aria-valuetext={tier?.plan_label}
          />
          <TickRow>
            {steps.map((s, i) => (
              <Tick
                key={s.tier_key}
                type="button"
                $active={i === idx}
                onClick={() => setIdx(i)}
              >
                {s.plan_label}
              </Tick>
            ))}
          </TickRow>
        </SliderWrap>

        <TableWrap>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <Table style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <Th>Feature</Th>
                  {steps.map((s, i) => {
                    const H = i === idx ? ThTierActive : ThTier;
                    return <H key={s.tier_key}>{s.plan_label}</H>;
                  })}
                </tr>
              </thead>
              <tbody>
                {FEATURE_DEFS.map((f) => (
                  <tr key={f.id}>
                    <Td>{f.label}</Td>
                    {steps.map((s, colIdx) => {
                      const included = colIdx >= f.minTier;
                      const Cell = colIdx === idx ? TdCenterActive : TdCenter;
                      return (
                        <Cell key={`${f.id}-${s.tier_key}`}>
                          <TdCenterInner>
                            {included ? (
                              <span style={{ display: "inline-flex", justifyContent: "center", color: "#059669" }} aria-label="Included">
                                <Check size={18} strokeWidth={2.5} />
                              </span>
                            ) : (
                              <span style={{ color: "#d1d5db" }} aria-label="Not included">—</span>
                            )}
                          </TdCenterInner>
                        </Cell>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <Td>Marketing emails / month</Td>
                  {steps.map((s, colIdx) => {
                    const Cell = colIdx === idx ? TdCenterActive : TdCenter;
                    return (
                      <Cell key={`em-${s.tier_key}`}>
                        <TdCenterInner>
                          <NumberFlow
                            value={s.monthly_marketing_send_limit ?? 0}
                            format={{ maximumFractionDigits: 0, useGrouping: true }}
                          />
                        </TdCenterInner>
                      </Cell>
                    );
                  })}
                </tr>
                <tr>
                  <Td>Saved templates (max)</Td>
                  {steps.map((s, colIdx) => {
                    const Cell = colIdx === idx ? TdCenterActive : TdCenter;
                    return (
                      <Cell key={`tpl-${s.tier_key}`}>
                        <TdCenterInner>
                          <NumberFlow
                            value={s.max_saved_templates ?? 0}
                            format={{ maximumFractionDigits: 0 }}
                          />
                        </TdCenterInner>
                      </Cell>
                    );
                  })}
                </tr>
              </tbody>
            </Table>
          </div>
        </TableWrap>

        {!hasPrice && (
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#b45309",
              fontFamily: "ui-sans-serif, system-ui",
            }}
          >
            Stripe price ID not configured for {tier?.plan_label}. Add it in the backend environment to enable checkout.
          </p>
        )}

        <FooterActions>
          <Button onClick={onClose}>Cancel</Button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <Button
              type="primary"
              loading={subscribing}
              disabled={primaryDisabled}
              onClick={handlePrimary}
              style={{
                background: "#fc4056",
                borderColor: "#fc4056",
                fontWeight: 600,
              }}
            >
              {subscribing ? "Working…" : primaryLabel}
            </Button>
            {!isSubscribed && canInstantSubscribe && hasPrice && (
              <button
                type="button"
                onClick={() => hasPrice && onCheckout?.(tier.price_id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "ui-sans-serif, system-ui",
                }}
              >
                Pay with a different card
              </button>
            )}
          </div>
        </FooterActions>
      </Shell>
    </Modal>
  );
}
