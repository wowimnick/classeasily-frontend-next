"use client";

import React, { useMemo, useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { Modal, Button, message as antMessage } from "antd";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { BRAND_PRIMARY } from "./PlanBillingAnimations";

/** Viewport at or below this uses Vaul bottom sheet instead of Ant Design Modal */
const EMAIL_TIER_MOBILE_DRAWER_MQ = "(max-width: 767px)";

function useMediaQueryMatch(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** Avoid SSR/client hydration mismatch: first paint always matches server (desktop modal path). */
function useMobileEmailTierDrawer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const matchesMq = useMediaQueryMatch(EMAIL_TIER_MOBILE_DRAWER_MQ);
  return mounted && matchesMq;
}

const TIER_ORDER = [
  "email_marketing_starter",
  "email_marketing_growth",
  "email_marketing_business",
  "email_marketing_scale",
];

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

const NODE_SIZE = 28;
const NODE_HALF = NODE_SIZE / 2;

function sliderMarkLeft($i, $n) {
  if ($n <= 1) return "50%";
  return `calc(var(--slider-node-half, ${NODE_HALF}px) + (100% - var(--slider-node, ${NODE_SIZE}px)) * ${$i} / ${$n - 1})`;
}

const Shell = styled.div`
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #111827;
  padding: 0 2px 4px;

  @media (max-width: 480px) {
    padding: 0 0 4px;
  }
`;

const HeroCard = styled(motion.div)`
  margin: 0 auto 16px;
  max-width: 360px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    margin-bottom: 12px;
    border-radius: 10px;
  }
`;

const HeroInner = styled.div`
  padding: 18px 16px 16px;
  text-align: center;

  @media (max-width: 480px) {
    padding: 14px 12px 12px;
  }
`;

const TierKicker = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 8px;
`;

const BigPrice = styled.div`
  font-size: clamp(2rem, 6vw, 2.5rem);
  font-weight: 700;
  line-height: 1.05;
  color: #111827;
  font-variant-numeric: tabular-nums;
`;

const PriceSuffix = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #9ca3af;
  margin-left: 4px;
`;

const EmailsLine = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #4b5563;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const EmailsStrong = styled.span`
  font-size: 1.15rem;
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
`;

const SliderBlock = styled.div`
  padding: 4px 0 8px;
  margin-bottom: 4px;
`;

/** Shared horizontal inset = half node so first/last centers sit on rail ends */
const SliderRail = styled.div`
  --slider-node: ${NODE_SIZE}px;
  --slider-node-half: ${NODE_HALF}px;
  position: relative;
  min-height: 76px;
  padding: 0 var(--slider-node-half);
  margin-bottom: 2px;

  @media (max-width: 480px) {
    --slider-node: 26px;
    --slider-node-half: 13px;
    min-height: 82px;
  }
`;

const SliderTrackLine = styled.div`
  position: absolute;
  left: var(--slider-node-half);
  right: var(--slider-node-half);
  top: 22px;
  height: 6px;
  border-radius: 8px;
  background: #e5e7eb;
  overflow: hidden;
  z-index: 0;

  @media (max-width: 480px) {
    top: 20px;
  }
`;

const TrackFill = styled(motion.div)`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 8px;
  background: ${BRAND_PRIMARY};
  max-width: 100%;
`;

/** calc() matches track endpoints so dots align with labels */
const SliderNodeWrap = styled.div`
  position: absolute;
  top: 8px;
  z-index: 2;
  left: ${({ $i, $n }) => sliderMarkLeft($i, $n)};
  transform: translateX(-50%);

  @media (max-width: 480px) {
    top: 6px;
  }
`;

const SliderLabelWrap = styled.div`
  position: absolute;
  top: 44px;
  left: ${({ $i, $n }) => sliderMarkLeft($i, $n)};
  transform: translateX(-50%);
  width: max-content;
  max-width: min(96px, 26vw);
  z-index: 1;

  @media (max-width: 480px) {
    top: 46px;
    max-width: min(80px, 22vw);
  }
`;

const NodeBtn = styled.button`
  width: var(--slider-node, ${NODE_SIZE}px);
  height: var(--slider-node, ${NODE_SIZE}px);
  border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? BRAND_PRIMARY : "#d1d5db")};
  background: ${({ $active }) => ($active ? "#ffffff" : "#f9fafb")};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: ${BRAND_PRIMARY};
    transform: scale(1.05);
  }
`;

const NodeDot = styled.span`
  width: ${({ $active }) => ($active ? 10 : 6)}px;
  height: ${({ $active }) => ($active ? 10 : 6)}px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? BRAND_PRIMARY : "#9ca3af")};
  transition: all 0.2s ease;
`;

const TickLabel = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-align: center;
  line-height: 1.2;
  width: 100%;
  display: block;

  .name {
    display: block;
    font-size: 11px;
    font-weight: ${({ $active }) => ($active ? 700 : 500)};
    color: ${({ $active }) => ($active ? "#111827" : "#9ca3af")};
    word-break: break-word;
    hyphens: auto;
  }

  .price {
    display: block;
    font-size: 10px;
    color: #9ca3af;
    margin-top: 2px;
    font-weight: 500;
  }

  &:hover .name {
    color: #374151;
  }

  @media (max-width: 480px) {
    .name {
      font-size: 10px;
    }
    .price {
      font-size: 9px;
    }
  }
`;

const ChecklistCard = styled.div`
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  overflow: hidden;
  margin-top: 4px;
`;

const CheckRow = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  background: #ffffff;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 12px;
    gap: 10px;
  }
`;

const CompareToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-top: 10px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: #111827;
    color: #111827;
  }

  @media (max-width: 480px) {
    padding: 10px;
    font-size: 12px;
    border-radius: 8px;
  }
`;

const TableWrap = styled.div`
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-top: 10px;
  background: #f9fafb;
`;

const Table = styled.table`
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;

  @media (max-width: 480px) {
    .tier-check-icon {
      width: 13px;
      height: 13px;
    }
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 8px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;

  @media (max-width: 480px) {
    padding: 8px 6px;
    font-size: 11px;
  }
`;

/** Narrow first column on small screens so tier columns keep room */
const ThFeature = styled(Th)`
  width: 30%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.25;

  @media (max-width: 480px) {
    width: 24%;
    padding: 7px 5px 7px 6px;
    font-size: 10px;
  }
`;

const ThTier = styled.th`
  text-align: center;
  padding: 10px 4px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  font-size: 11px;
  white-space: nowrap;
  width: 17.5%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;

  @media (max-width: 480px) {
    width: 19%;
    padding: 7px 2px;
    font-size: 9px;
    white-space: normal;
    line-height: 1.15;
  }
`;

const ThTierActive = styled(ThTier)`
  background: #f9fafb;
  color: #111827;
  box-shadow: inset 0 -2px 0 #111827;
`;

const Td = styled.td`
  padding: 9px 8px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  vertical-align: middle;
  background: #fff;
  font-size: 12px;

  @media (max-width: 480px) {
    padding: 7px 5px;
    font-size: 11px;
  }
`;

const TdFeature = styled(Td)`
  width: 30%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  vertical-align: top;
  line-height: 1.25;

  @media (max-width: 480px) {
    width: 24%;
    padding: 6px 5px 6px 6px;
    font-size: 10px;
  }
`;

const TdCenter = styled(Td)`
  text-align: center;
  padding: 9px 4px;
  width: 17.5%;
  min-width: 0;
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;

  @media (max-width: 480px) {
    width: 19%;
    padding: 6px 2px;
    font-size: 10px;
  }
`;

const TdCenterActive = styled(TdCenter)`
  background: #f9fafb;
`;

const FooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  align-items: flex-start;

  ${({ $inDrawer }) =>
    $inDrawer
      ? `
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  `
      : `
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid #e5e7eb;
  `}

  @media (max-width: 520px) {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 8px;

    ${({ $inDrawer }) =>
      !$inDrawer &&
      `
      margin-top: 16px;
      padding-top: 14px;
    `}
  }

  & > .ant-btn-default {
    @media (max-width: 520px) {
      width: 100%;
    }
  }

  .footer-primary-stack {
    @media (max-width: 520px) {
      width: 100%;
      align-items: stretch;
    }
  }

  .footer-primary-stack .ant-btn-primary.footer-primary-btn {
    min-width: 200px;

    @media (max-width: 520px) {
      width: 100%;
      min-width: 0;
      max-width: none;
    }
  }
`;

const ModalCloseFab = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  z-index: 2;

  &:hover {
    background: #e5e7eb;
  }

  @media (max-width: 480px) {
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
  }
`;

const ModalInner = styled(motion.div)`
  position: relative;
  padding: 22px 22px 8px;

  @media (max-width: 640px) {
    padding: 18px 16px 8px;
  }

  @media (max-width: 480px) {
    padding: 16px 12px 8px;
  }
`;

const ModalTitle = styled.div`
  font-size: clamp(16px, 4.2vw, 18px);
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
  padding-right: 44px;
  line-height: 1.25;

  @media (max-width: 480px) {
    padding-right: 40px;
  }
`;

const ModalSubtitle = styled.p`
  margin: 0 0 16px;
  font-size: clamp(12px, 3.2vw, 13px);
  color: #6b7280;
  padding-right: 44px;
  line-height: 1.45;

  @media (max-width: 480px) {
    margin-bottom: 12px;
    padding-right: 40px;
  }
`;

const EmailTierDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  z-index: 1100;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const EmailTierDrawerContent = styled(Drawer.Content)`
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  height: 92vh;
  max-height: 92vh;
  height: 92dvh;
  max-height: 92dvh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1101;
  outline: none;
  min-height: 0;
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.14);
`;

const EmailTierDrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 10px auto 6px;
  flex-shrink: 0;
`;

const EmailTierDrawerScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
`;

const DrawerModalInner = styled.div`
  position: relative;
  padding: 4px 16px 8px;

  @media (max-width: 380px) {
    padding-left: 14px;
    padding-right: 14px;
  }
`;

const EmailTierDrawerFooter = styled.div`
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px calc(14px + env(safe-area-inset-bottom, 0px));

  @media (max-width: 380px) {
    padding-left: 14px;
    padding-right: 14px;
  }
`;

const billingModalStyles = {
  content: {
    borderRadius: 12,
    padding: 0,
    overflow: "hidden",
    boxShadow: "0 25px 60px -12px rgba(0,0,0,0.2)",
    maxWidth: "calc(100vw - 16px)",
    width: "min(780px, calc(100vw - 16px))",
    margin: "0 auto",
  },
  header: { display: "none" },
  body: { padding: 0, maxHeight: "min(90vh, 900px)", overflowY: "auto" },
  mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.25)" },
};

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
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const i = currentTierKey ? TIER_ORDER.indexOf(currentTierKey) : 0;
    setIdx(i >= 0 ? i : 0);
    setCompareOpen(false);
  }, [open, currentTierKey]);

  const tier = steps[idx] || steps[0];
  const n = steps.length;
  const fillPct = n <= 1 ? 100 : (idx / (n - 1)) * 100;
  const hasPrice = tier?.configured && tier?.price_id;

  const onSliderIdx = useCallback((i) => {
    const v = Math.max(0, Math.min(n - 1, i));
    setIdx(v);
  }, [n]);

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

  const isMobileDrawer = useMobileEmailTierDrawer();

  const tierFooter = (
    <FooterActions $inDrawer={isMobileDrawer}>
      <Button onClick={onClose}>Cancel</Button>
      <div
        className="footer-primary-stack"
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}
      >
        <Button
          className="footer-primary-btn"
          type="primary"
          loading={subscribing}
          disabled={primaryDisabled}
          onClick={handlePrimary}
          icon={
            isSubscribed && tier.tier_key === currentTierKey ? (
              <Check size={16} />
            ) : undefined
          }
          style={{
            background: BRAND_PRIMARY,
            borderColor: BRAND_PRIMARY,
            fontWeight: 600,
            borderRadius: 10,
            height: 44,
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
            }}
          >
            Pay with a different card
          </button>
        )}
      </div>
    </FooterActions>
  );

  const tierScrollContent = (
    <Shell>
      <HeroCard layout transition={{ duration: 0.28, ease: "easeOut" }}>
            <HeroInner>
              <TierKicker>Selected tier</TierKicker>
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
                <span>Up to</span>
                <EmailsStrong>
                  <NumberFlow
                    value={tier?.monthly_marketing_send_limit ?? 0}
                    format={{ maximumFractionDigits: 0, useGrouping: true }}
                  />
                </EmailsStrong>
                <span>marketing emails / month</span>
              </EmailsLine>
            </HeroInner>
          </HeroCard>

          <SliderBlock>
            <SliderRail>
              <SliderTrackLine>
                <TrackFill
                  initial={false}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              </SliderTrackLine>
              {steps.map((s, i) => (
                <SliderNodeWrap key={s.tier_key} $i={i} $n={n}>
                  <NodeBtn
                    type="button"
                    aria-label={s.plan_label}
                    $active={i === idx}
                    onClick={() => onSliderIdx(i)}
                  >
                    <NodeDot $active={i === idx} />
                  </NodeBtn>
                </SliderNodeWrap>
              ))}
              {steps.map((s, i) => (
                <SliderLabelWrap key={`lbl-${s.tier_key}`} $i={i} $n={n}>
                  <TickLabel type="button" $active={i === idx} onClick={() => onSliderIdx(i)}>
                    <span className="name">{s.plan_label}</span>
                    <span className="price">${s.ui_monthly_price}/mo</span>
                  </TickLabel>
                </SliderLabelWrap>
              ))}
            </SliderRail>
          </SliderBlock>

          <AnimatePresence mode="wait">
            <motion.div
              key={tier.tier_key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ChecklistCard>
                {FEATURE_DEFS.map((f, ri) => {
                  const included = idx >= f.minTier;
                  return (
                    <CheckRow
                      key={f.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: ri * 0.04 }}
                    >
                      <span style={{ color: "#374151", fontWeight: 500 }}>{f.label}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", color: included ? "#111827" : "#d1d5db" }}>
                        {included ? <Check size={18} strokeWidth={2.5} /> : <span aria-hidden>—</span>}
                      </span>
                    </CheckRow>
                  );
                })}
                <CheckRow layout>
                  <span style={{ color: "#374151", fontWeight: 500 }}>Marketing emails / month</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    <NumberFlow
                      value={tier?.monthly_marketing_send_limit ?? 0}
                      format={{ maximumFractionDigits: 0, useGrouping: true }}
                    />
                  </span>
                </CheckRow>
                <CheckRow layout>
                  <span style={{ color: "#374151", fontWeight: 500 }}>Saved templates (max)</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    <NumberFlow value={tier?.max_saved_templates ?? 0} format={{ maximumFractionDigits: 0 }} />
                  </span>
                </CheckRow>
              </ChecklistCard>
            </motion.div>
          </AnimatePresence>

          <CompareToggle type="button" onClick={() => setCompareOpen((o) => !o)}>
            {compareOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {compareOpen ? "Hide full comparison" : "Compare all tiers"}
          </CompareToggle>

          <AnimatePresence initial={false}>
            {compareOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: "hidden" }}
              >
                <TableWrap>
                  <div style={{ width: "100%", minWidth: 0 }}>
                    <Table>
                      <thead>
                        <tr>
                          <ThFeature>Feature</ThFeature>
                          {steps.map((s, i) => {
                            const H = i === idx ? ThTierActive : ThTier;
                            return <H key={s.tier_key}>{s.plan_label}</H>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {FEATURE_DEFS.map((f) => (
                          <tr key={f.id}>
                            <TdFeature>{f.label}</TdFeature>
                            {steps.map((s, colIdx) => {
                              const included = colIdx >= f.minTier;
                              const Cell = colIdx === idx ? TdCenterActive : TdCenter;
                              return (
                                <Cell key={`${f.id}-${s.tier_key}`}>
                                  {included ? (
                                    <span style={{ color: "#111827", display: "inline-flex", justifyContent: "center" }}>
                                      <Check size={16} strokeWidth={2.5} className="tier-check-icon" />
                                    </span>
                                  ) : (
                                    <span style={{ color: "#d1d5db" }}>—</span>
                                  )}
                                </Cell>
                              );
                            })}
                          </tr>
                        ))}
                        <tr>
                          <TdFeature>Marketing emails / month</TdFeature>
                          {steps.map((s, colIdx) => {
                            const Cell = colIdx === idx ? TdCenterActive : TdCenter;
                            return (
                              <Cell key={`em-${s.tier_key}`}>
                                <NumberFlow
                                  value={s.monthly_marketing_send_limit ?? 0}
                                  format={{ maximumFractionDigits: 0, useGrouping: true }}
                                />
                              </Cell>
                            );
                          })}
                        </tr>
                        <tr>
                          <TdFeature>Saved templates (max)</TdFeature>
                          {steps.map((s, colIdx) => {
                            const Cell = colIdx === idx ? TdCenterActive : TdCenter;
                            return (
                              <Cell key={`tpl-${s.tier_key}`}>
                                <NumberFlow value={s.max_saved_templates ?? 0} format={{ maximumFractionDigits: 0 }} />
                              </Cell>
                            );
                          })}
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </TableWrap>
              </motion.div>
            )}
          </AnimatePresence>

      {!hasPrice && (
        <p style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
          Stripe price ID not configured for {tier?.plan_label}. Add it in the backend environment to enable checkout.
        </p>
      )}
    </Shell>
  );

  const modalHeaderBlock = (
    <>
      <ModalCloseFab
        type="button"
        aria-label="Close"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
      >
        <X size={18} />
      </ModalCloseFab>
      <ModalTitle>Email marketing plans</ModalTitle>
      <ModalSubtitle>
        Choose a monthly send volume. Transactional emails don&apos;t count toward your marketing quota.
      </ModalSubtitle>
    </>
  );

  const drawerHeaderBlock = (
    <>
      <ModalTitle style={{ paddingRight: 0 }}>Email marketing plans</ModalTitle>
      <ModalSubtitle style={{ paddingRight: 0 }}>
        Choose a monthly send volume. Transactional emails don&apos;t count toward your marketing quota.
      </ModalSubtitle>
    </>
  );

  if (isMobileDrawer) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose?.();
        }}
        dismissible
      >
        <Drawer.Portal>
          <EmailTierDrawerOverlay />
          <EmailTierDrawerContent>
            <Drawer.Title
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              Email marketing plans
            </Drawer.Title>
            <EmailTierDrawerHandle aria-hidden />
            <EmailTierDrawerScroll>
              <DrawerModalInner>
                {drawerHeaderBlock}
                {tierScrollContent}
              </DrawerModalInner>
            </EmailTierDrawerScroll>
            <EmailTierDrawerFooter>{tierFooter}</EmailTierDrawerFooter>
          </EmailTierDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width="min(780px, calc(100vw - 16px))"
      styles={billingModalStyles}
    >
      <ModalInner
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {modalHeaderBlock}
        {tierScrollContent}
        {tierFooter}
      </ModalInner>
    </Modal>
  );
}
