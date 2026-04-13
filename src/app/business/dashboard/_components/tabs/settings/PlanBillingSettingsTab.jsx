"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Button, Modal, message as antMessage, Tooltip } from "antd";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useInView } from "framer-motion";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import {
  ArrowRight, ArrowUp, ArrowDown, Loader2, RefreshCw, Lock,
  CreditCard, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Download, Trash2,
  Calendar, LayoutGrid, TrendingUp, Zap, Shield, Package, Receipt, Mail,
  AlertTriangle, Info, AlertCircle, Plus, X,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements, PaymentElement,
  PaymentRequestButtonElement, useStripe, useElements,
} from "@stripe/react-stripe-js";
import styled, { createGlobalStyle, css } from "styled-components";
import { useSubscription } from "@/context/SubscriptionContext";
import { getPlanById, PLANS, PLAN_IDS, isUpgrade, WIDGET_PLAN_COMPARISON_ROWS } from "@/lib/subscriptionPlans";
import message from "@/lib/message";
import { businessService, API_ENDPOINTS } from "@/services/apiService";
import axiosInstance from "@/lib/axiosInstance";
import { theme as appTheme } from "@/components/theme";
import EmailMarketingTierModal from "./EmailMarketingTierModal";
import {
  BRAND_PRIMARY,
  BRAND_PRIMARY_HOVER,
  shimmerMove,
  borderPulse,
  btnShimmer,
} from "./PlanBillingAnimations";

// ─── stripe setup ─────────────────────────────────────────────────────────────
const stripePromise =
  typeof window !== "undefined"
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "")
    : null;

const ADDON_PRICE = 7;
const SEL_COLOR = "#111827";
const INVOICES_PAGE_SIZE = 10;

const paymentElementOptions = {
  layout: "tabs",
  wallets: { applePay: "never", googlePay: "never" },
  defaultValues: { billingDetails: { address: { country: "CA" } } },
  fields: { billingDetails: { address: { country: "never", postalCode: "never" } } },
};

// ─── global ───────────────────────────────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
`;

// ─── design tokens ────────────────────────────────────────────────────────────
const T = {
  text:    "#111827",
  sub:     "#6B7280",
  faint:   "#9CA3AF",
  border:  "#E5E7EB",
  bg:      "#F9FAFB",
  white:   "#FFFFFF",
  green:   "#059669",
  greenBg: "#D1FAE5",
  amber:   "#92400E",
  amberBg: "#FEF3C7",
};

// ─── shared primitives (flat) ─────────────────────────────────────────────────
const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: ${({ $pad }) => $pad ?? "20px"};
  box-shadow: none;

  @media (max-width: 640px) {
    border-radius: 8px;
    padding: ${({ $pad, $mobilePad }) => $mobilePad ?? ($pad === "0" ? "0" : "16px")};
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 600;
  color: ${T.text};
`;

const SectionSub = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${T.sub};
  line-height: 1.5;
`;

// ─── page layout (responsive, centered) ───────────────────────────────────────
const PageOuter = styled.div`
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 8px 40px;
  overflow: visible;
  font-family: ui-sans-serif, system-ui, -apple-system, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #000000;
  background: #f9fafb;
  border-radius: 8px;

  @media (max-width: 640px) {
    padding: 8px 0 32px;
    gap: 20px;
  }
`;

const MainStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

// ─── choose plans header + decorative monthly toggle ─────────────────────────
const MonthlyToggleDecor = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  user-select: none;
`;

const ToggleLabel = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${({ $muted }) => ($muted ? "#6b7280" : "#111827")};
`;

const TogglePill = styled.div`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #e5e7eb;
  position: relative;
  flex-shrink: 0;
`;

const ToggleThumb = styled.div`
  position: absolute;
  left: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #000000;
`;

const SavePctBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 12px;
  background: #000000;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
`;

// ─── promo banner ────────────────────────────────────────────────────────────
const PromoBanner = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 24px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    text-align: left;
  }
`;

const PromoLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const PromoTitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const PromoTitle = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #000000;
`;

const PromoSaveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 8px;
  background: #000000;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const PromoSub = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.45;
  max-width: 520px;
`;

const PromoOutlineBtn = styled.button`
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: not-allowed;
  white-space: nowrap;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

// ─── pricing cards ───────────────────────────────────────────────────────────
const PlansBundle = styled.div`
  margin-top: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
`;

/** Mobile / tablet: stacked cards + horizontal-scroll table */
const PlansMobileLayout = styled.div`
  @media (min-width: 900px) {
    display: none;
  }
`;

const PlansBundleCards = styled.div`
  padding: 14px 14px 12px;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 380px) {
    padding: 12px 12px 10px;
  }
`;

const PricingCardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 0;
`;

/** Desktop: one grid so plan cards sit above the same columns as the comparison table */
const PlansDesktopLayout = styled.div`
  display: none;
  @media (min-width: 900px) {
    display: block;
  }
`;

const PlansDesktopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 0.88fr) repeat(3, minmax(0, 1fr));
  column-gap: 0;
  row-gap: 0;
  padding: 14px 14px 12px;
  align-items: stretch;
`;

const PlansDesktopCorner = styled.div`
  grid-column: 1;
  grid-row: 1;
  min-height: 1px;
  border-right: 1px solid #e5e7eb;
`;

const PlanCompareScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  min-width: 0;
`;

const PlanCompareTable = styled.table`
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const PcThFeature = styled.th`
  text-align: left;
  padding: 12px 12px 12px 14px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  left: 0;
  z-index: 2;
  width: 28%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.25;
  box-shadow: 1px 0 0 #e5e7eb;

  @media (max-width: 480px) {
    width: 26%;
    padding: 10px 8px 10px 10px;
    font-size: 12px;
  }
`;

const PcThPlan = styled.th`
  text-align: center;
  padding: 12px 6px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  white-space: normal;
  width: 24%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.2;

  @media (max-width: 480px) {
    padding: 10px 4px;
    font-size: 11px;
  }
`;

const PcTdFeature = styled.td`
  padding: 10px 12px 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  color: #374151;
  font-weight: 500;
  line-height: 1.35;
  position: sticky;
  left: 0;
  background: #ffffff;
  z-index: 1;
  width: 28%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  box-shadow: 1px 0 0 #f3f4f6;

  @media (max-width: 480px) {
    width: 26%;
    padding: 8px 8px 8px 10px;
    font-size: 12px;
  }
`;

const PcTdMark = styled.td`
  text-align: center;
  padding: 10px 6px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  width: 24%;
  min-width: 0;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 8px 4px;
    font-size: 12px;
  }
`;

const PcTdMarkInner = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 22px;
`;

const GridFeatHead = styled.div`
  grid-column: 1;
  grid-row: 2;
  padding: 12px 12px 12px 14px;
  font-weight: 700;
  font-size: 13px;
  color: #111827;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  align-self: stretch;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const GridPlanHead = styled.div`
  grid-column: ${({ $col }) => $col};
  grid-row: 2;
  padding: 12px 8px;
  font-weight: 700;
  font-size: 13px;
  color: #111827;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  border-left: ${({ $divider }) => ($divider ? "1px solid #e5e7eb" : "none")};
  border-right: ${({ $col }) => ($col === 4 ? "1px solid #e5e7eb" : "none")};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.2;
`;

const GridFeatCell = styled.div`
  grid-column: 1;
  grid-row: ${({ $row }) => $row};
  padding: 10px 12px 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  border-right: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 13px;
  color: #374151;
  line-height: 1.35;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const GridMarkCell = styled.div`
  grid-column: ${({ $col }) => $col};
  grid-row: ${({ $row }) => $row};
  padding: 10px 6px;
  border-bottom: 1px solid #f3f4f6;
  border-left: ${({ $divider }) => ($divider ? "1px solid #e5e7eb" : "none")};
  border-right: ${({ $col }) => ($col === 4 ? "1px solid #e5e7eb" : "none")};
  font-size: 13px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
`;

const PriceCard = styled.article`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-shadow: none;
`;

/** Shared inner layout: mobile = title block + price side-by-side; desktop = stacked, compact */
const PlanCardBody = styled.div`
  padding: 14px 16px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 899px) {
    padding: 14px 14px 14px;
  }

  @media (max-width: 380px) {
    padding: 12px 12px 12px;
  }

  .plan-card-cta {
    margin-top: 12px;
    @media (min-width: 900px) {
      margin-top: auto;
    }
  }
`;

const PlanCardTopCluster = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px 14px;
  min-width: 0;

  @media (min-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
  }
`;

const PlanCardTextCol = styled.div`
  min-width: 0;
  flex: 1;
`;

const PlanPriceCluster = styled.div`
  flex-shrink: 0;
  text-align: right;

  @media (min-width: 900px) {
    text-align: left;
  }
`;

const PriceCardPlaced = styled(PriceCard)`
  @media (min-width: 900px) {
    grid-column: ${({ $planCol }) => $planCol};
    grid-row: 1;
    min-width: 0;
    height: 100%;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    border-bottom: none;
    border-left: ${({ $planCol }) => ($planCol > 2 ? "1px solid #e5e7eb" : "none")};
    border-right: ${({ $planCol }) => ($planCol === 4 ? "1px solid #e5e7eb" : "none")};
  }
`;

const PriceCardTitleRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px 8px;
`;

const PriceCardName = styled.span`
  font-size: 17px;
  font-weight: 700;
  color: #000000;
  line-height: 1.2;

  @media (min-width: 900px) {
    font-size: 16px;
  }
`;

const BlackCapsBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  background: #000000;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const OutlineCapsBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const PriceCardSubtitle = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.35;
`;

const PriceRow = styled.div`
  margin-top: 0;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 5px;
  justify-content: flex-end;

  @media (min-width: 900px) {
    margin-top: 6px;
    justify-content: flex-start;
  }
`;

const PriceAmount = styled.span`
  font-size: clamp(22px, 5.2vw, 28px);
  font-weight: 700;
  color: #000000;
  line-height: 1;

  @media (min-width: 900px) {
    font-size: 24px;
  }
`;

const PriceSuffix = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;

  @media (min-width: 900px) {
    font-size: 12px;
  }
`;

const PriceCta = styled.button`
  margin-top: 0;
  width: 100%;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;

  @media (min-width: 900px) {
    padding: 9px 12px;
    font-size: 13px;
  }
  transition: opacity 0.15s, background 0.15s, border-color 0.15s;
  border: 1px solid ${({ $primary }) => ($primary ? "#000000" : "#e5e7eb")};
  background: ${({ $primary }) => ($primary ? "#000000" : "#ffffff")};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "#111827")};

  &:disabled {
    cursor: default;
    opacity: 1;
  }

  &:not(:disabled):hover {
    opacity: 0.88;
  }

  &:disabled:not([data-primary="true"]) {
    color: #111827;
    background: #ffffff;
  }
`;

// ─── plan dots (current plan display) ─────────────────────────────────────────
const PlanDot = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ $grad }) => $grad};
  flex-shrink: 0;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 640px) {
    margin-bottom: 2px;
  }
`;

const PLAN_GRADIENTS = {
  basic: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
  growth: "linear-gradient(135deg, #e5e7eb, #d1d5db)",
  advanced: "linear-gradient(135deg, #d1d5db, #cbd5e1)",
};

/** Dark neutrals for plan emblem (white icon) in plan-switch modal. */
const PLAN_EMBLEM_GRADIENTS = {
  basic: "linear-gradient(135deg, #4b5563, #374151)",
  growth: "linear-gradient(135deg, #374151, #1f2937)",
  advanced: "linear-gradient(135deg, #1f2937, #111827)",
};

const PLAN_TAGLINES = {
  basic: "Widget essentials & marketplace",
  growth: "Everything you needed",
  advanced: "Power team with scale",
};

// ─── invoice section ──────────────────────────────────────────────────────────
const InvoicePaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const InvoicePageInfo = styled.span`
  font-size: 12px;
  color: ${T.sub};
  min-width: 0;
`;

const InvoicePaginationActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const InvoicePageBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid ${T.border};
  border-radius: 8px;
  background: ${T.white};
  color: ${T.text};
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    background: ${T.bg};
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

const InvoiceListWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const InvoiceRowCard = styled.div`
  display: grid;
  grid-template-columns: 1fr 108px 92px 108px auto auto;
  align-items: center;
  gap: 8px 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  transition: background 0.1s ease;

  &:hover {
    background: #fafbfc;
  }

  @media (max-width: 639px) {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 10px 12px;
  }
`;

const InvoiceColMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const InvoiceNumStrong = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${T.text};
`;

const InvoiceDateMuted = styled.span`
  font-size: 11px;
  color: ${T.sub};
`;

const InvoiceAmountCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;

  @media (max-width: 639px) {
    flex-direction: row;
    align-items: baseline;
    gap: 8px;
  }
`;

const InvoiceCurrencyTiny = styled.span`
  font-size: 11px;
  color: ${T.faint};
  text-transform: uppercase;
`;

const InvoiceAmountStrong = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${T.text};
`;

const InvoicePmCol = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${T.sub};
`;

const InvoicePaidPill = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
`;

const InvoiceRowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;

  @media (max-width: 639px) {
    justify-content: space-between;
    width: 100%;
    padding-top: 4px;
    border-top: 1px solid ${T.border};
  }
`;

const InvoiceDownloadOutline = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${T.border};
  color: ${T.sub};
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: #f3f4f6;
    color: ${T.text};
  }

  &[data-disabled="true"] {
    opacity: 0.35;
    pointer-events: none;
  }
`;

const SortSegmentWrap = styled.div`
  position: relative;
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: ${T.bg};
  border: 1px solid ${T.border};
`;

const SortSegmentBtn = styled.button`
  position: relative;
  padding: 6px 14px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: ${({ $active }) => ($active ? "#ffffff" : T.sub)};
  transition: color 0.2s ease;
  min-width: 72px;
  overflow: hidden;
`;

const InvoicePageCenter = styled.span`
  font-size: 12px;
  color: ${T.sub};
  min-width: 88px;
  text-align: center;
`;

const BreakdownTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: ${T.sub};
`;

const BreakdownTr = styled.tr`
  background: ${({ $alt }) => ($alt ? "#f9fafb" : "#ffffff")};
`;

const BreakdownTd = styled.td`
  padding: 6px 12px;
  border-bottom: 1px solid ${T.border};
`;


const InvoiceExpandBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: ${T.sub};
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  &:hover:not(:disabled) { background: ${T.border}; color: ${T.text}; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const InvoiceId = styled.span`
  font-size: 12px; font-weight: 500; color: ${T.text};

  @media (max-width: 639px) {
    display: none;
  }
`;

const InvoiceCell = styled.span`
  font-size: 12px; color: ${T.sub};

  @media (max-width: 639px) {
    display: none;
  }
`;

const MobileInvoiceInfo = styled.div`
  display: none;
  @media (max-width: 639px) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }
`;

const MobileInvoiceId = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${T.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileInvoiceMeta = styled.span`
  font-size: 11.5px;
  color: ${T.sub};
`;

const MobileDownloadBtn = styled.a`
  display: none;
  @media (max-width: 639px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid ${T.border};
    color: ${T.sub};
    cursor: pointer;
    margin-left: 10px;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
    &:hover { background: ${T.bg}; color: ${T.text}; }
    &[data-disabled="true"] { opacity: 0.4; pointer-events: none; }
  }
`;

const DownloadBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: ${T.faint}; padding: 3px; border-radius: 8px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${T.text}; background: ${T.bg}; }

  @media (max-width: 639px) {
    display: none;
  }
`;

// ─── subscription status ──────────────────────────────────────────────────────
const StatusRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0;
  }
`;

const PlanLabel = styled.div`
  font-size: 15px; font-weight: 700; color: ${T.text};
`;

const PlanMeta = styled.div`
  font-size: 13px; color: ${T.sub}; margin-top: 4px;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  background: ${T.amberBg}; color: ${T.amber};
  border-radius: 12px; font-size: 11.5px; margin-top: 8px;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;

  @media (max-width: 600px) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: flex-start;
    width: 100%;
    gap: 7px;
    padding-top: 12px;
    border-top: 1px solid ${T.border};
    & > * {
      flex: 1 1 auto;
      min-width: 0;
    }
  }
`;

// ─── redesigned plan & billing card ──────────────────────────────────────────
const PlanBillingCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 6px 16px rgba(0, 0, 0, 0.04);
`;

const PlanBillingHeader = styled.div`
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${T.border};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  ${SectionTitle} {
    flex-shrink: 0;
    max-width: 100%;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
`;

const PlanBillingHeaderTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const HeaderPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  background: ${T.bg};
  color: ${T.sub};
  font-size: 11px;
  font-weight: 500;
`;

const PlanBillingHeaderNote = styled(SectionSub)`
  margin-left: auto;
  font-size: 12px;
  flex: 1 1 auto;
  min-width: 0;
  text-align: right;
  line-height: 1.45;

  @media (max-width: 640px) {
    margin-left: 0;
    margin-top: 2px;
    text-align: left;
  }
`;

const PlanBillingPanelBody = styled.div`
  padding: 16px 20px 20px;

  @media (max-width: 640px) {
    padding: 14px 16px 18px;
  }
`;

/** Tighter panel for billing history list */
const InvoiceHistoryPanelBody = styled(PlanBillingPanelBody)`
  padding: 10px 16px 12px;

  @media (max-width: 640px) {
    padding: 8px 12px 10px;
  }
`;

const PlanBillingHeaderCompact = styled(PlanBillingHeader)`
  padding: 12px 16px 10px;
  gap: 8px;

  ${PlanBillingHeaderNote} {
    font-size: 11px;
    line-height: 1.35;
  }
`;

const SkeletonLine = styled.div`
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: ${shimmerMove} 1.2s ease-in-out infinite;
`;

const SkeletonPlanBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
`;

const SkeletonPmBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PlanBillingBody = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px 20px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    flex-direction: column;
    padding: 14px 16px 18px;
  }
`;

const PlanBillingSection = styled.div`
  box-sizing: border-box;
  flex: 1 1 0;
  min-width: 0;
  border: 1px solid ${T.border};
  border-radius: 8px;
  background: ${T.white};
  align-self: flex-start;

  @media (max-width: 640px) {
    flex: 1 1 auto;
    width: 100%;
  }
`;

const PlanBillingSectionInner = styled.div`
  flex: 1;
  min-width: 0;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

/** Tighter padding + layout for the current-plan column only */
const PlanCurrentPlanInner = styled(PlanBillingSectionInner)`
  padding: 12px 16px 14px;
`;

const PlanEmblem = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $grad }) => $grad || T.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const PlanTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const PlanNameText = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${T.text};
  line-height: 1.25;
`;

const PlanPriceRow = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 4px;
`;

const PlanPriceSuffix = styled.span`
  font-size: 13px;
  color: ${T.sub};
  font-weight: 400;
`;

const CommissionPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  background: ${T.bg};
  color: ${T.sub};
  font-size: 11px;
  font-weight: 600;
`;

const RenewalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: ${T.sub};
`;

const PlanActionBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  &:not(:disabled):hover {
    transform: scale(1.02);
  }
`;

const PlanActionPrimary = styled(PlanActionBtn)`
  background: #111827;
  color: #ffffff;
  border-color: #111827;
`;

const PlanActionOutline = styled(PlanActionBtn)`
  background: #ffffff;
  color: #374151;
  border-color: #e5e7eb;
`;

const PlanActionGhost = styled(PlanActionBtn)`
  background: transparent;
  color: #6b7280;
  border-color: transparent;
  text-decoration: none;

  &:not(:disabled):hover {
    text-decoration: underline;
    transform: none;
  }
`;

const PmSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 600;
  color: ${T.faint};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const PlanBillingPaymentStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
`;

const PlanBillingSectionLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${T.faint};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
`;

const PlanBillingPlanName = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${T.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlanBillingPlanPrice = styled.div`
  font-size: 11px;
  color: ${T.sub};
  margin-top: 2px;
`;

const PlanBillingActions = styled.div`
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const PmListOuter = styled.div`
  margin-top: 4px;
  border-radius: 8px;
`;

const PmListWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PmRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-width: 0;

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
`;

const PmRowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
`;

const PmBrandBox = styled.div`
  width: 48px;
  height: 32px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  svg {
    max-width: 40px;
    max-height: 24px;
    width: auto;
    height: auto;
    display: block;
  }
`;

const PmBrandImg = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
`;

const PmTextCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const PmTitleLine = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
`;

const PmMetaLine = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
`;

const PmRowRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 560px) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
`;

const PmStatusSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-height: 20px;
`;

const PmDefaultBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  background: #f3f4f6;
  color: #374151;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const PmExpiredBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const PmSetDefaultBtn = styled.button`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #d1d5db;
  transition: border-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const PmAddCardDashed = styled(motion.button)`
  margin-top: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 16px;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  background: #fafafa;
  color: ${T.sub};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: #9ca3af;
    color: #111827;
    background: #f9fafb;
  }
`;

const PmActionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

const PmDeleteIconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

// ─── add-ons ──────────────────────────────────────────────────────────────────
const AddonsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 16px;

  @media (max-width: 640px) {
    padding: 10px 14px 14px;
  }
`;

const AddonCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.03);

  ${({ $pulse }) =>
    $pulse
      ? css`
          animation: ${borderPulse} 1.5s ease-out 1;
        `
      : css``}
`;

const AddonCardInner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    flex-wrap: wrap;
    padding: 12px 12px;
  }
`;

const AddonIconBox = styled.div`
  width: 40px;
  height: 40px;
  min-width: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AddonBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const AddonTitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 2px;
`;

const AddonName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const NewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const AddonActiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f3f4f6;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
`;

const AddonCancelsBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
`;

const AddonDesc = styled.p`
  font-size: 12px;
  color: #6b7280;
  line-height: 1.45;
  margin: 0;
`;

const AddonUsageWrap = styled.div`
  margin-top: 6px;
`;

const AddonUsageBar = styled.div`
  height: 6px;
  border-radius: 6px;
  background: #f3f4f6;
  margin-top: 6px;
  overflow: hidden;
`;

const AddonUsageFill = styled.div`
  height: 100%;
  border-radius: 6px;
  background: ${({ $fill }) => $fill || "#374151"};
  width: ${({ $pct }) => Math.min(100, $pct ?? 0)}%;
  transition: width 0.35s ease, background 0.35s ease;
`;

const AddonSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
  min-width: 118px;

  @media (max-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
    min-width: 0;
  }
`;

const AddonPriceLabel = styled.div`
  text-align: right;
  line-height: 1.2;
`;

const AddonPriceStrong = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #111827;
`;

const AddonPriceSuffix = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const AddonCtaGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const AddonCtaRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
`;

const AddonOutlineBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const AddonPrimaryBtn = styled(motion.button)`
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: ${({ $brand }) => ($brand ? BRAND_PRIMARY : "#111827")};
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: ${({ $brand }) =>
    $brand ? "0 2px 8px rgba(247, 50, 78, 0.2)" : "0 2px 8px rgba(17, 24, 39, 0.12)"};
  transition: box-shadow 0.2s ease, background 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $brand }) => ($brand ? BRAND_PRIMARY_HOVER : "#0f172a")};
    box-shadow: ${({ $brand }) =>
      $brand ? "0 4px 14px rgba(247, 50, 78, 0.28)" : "0 4px 14px rgba(17, 24, 39, 0.15)"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const CancellingNote = styled.span`
  font-size: 11px;
  color: ${T.sub};
  text-align: right;
`;

const SmallLink = styled.button`
  background: none; border: none; padding: 0;
  font-size: 12px; color: ${T.sub};
  text-decoration: underline; cursor: pointer;
  &:hover { color: ${T.text}; }
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
`;

const EmptyStateWrap = styled.div`
  margin: 20px 24px 28px;
  padding: 28px 20px;
  text-align: center;
  border: 1px dashed ${T.border};
  border-radius: 12px;
  background: ${T.bg};
`;

const PrimaryCtaBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: ${BRAND_PRIMARY};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${BRAND_PRIMARY_HOVER};
  }
`;

const ModalSectionTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${T.text};
  text-align: center;
  margin-top: 8px;
`;

const ModalBodyText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  text-align: center;
`;

const ModalInfoBox = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.45;
`;

const ModalFooterStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22px;
  padding: 0 24px 24px;
`;

const PaySectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${T.faint};
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const StripeSecureNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: ${T.faint};
`;

const ShimmerPrimaryBtn = styled(Button)`
  &.ant-btn-primary {
    background: linear-gradient(90deg, #111827 0%, #1f2937 50%, #111827 100%) !important;
    background-size: 200% 100% !important;
    border-color: #111827 !important;
  }

  &.ant-btn-loading.ant-btn-primary {
    animation: ${btnShimmer} 1.2s linear infinite !important;
  }
`;

const ShimmerBrandBtn = styled(Button)`
  &.ant-btn-primary {
    background: linear-gradient(90deg, ${BRAND_PRIMARY} 0%, #ff4d67 50%, ${BRAND_PRIMARY} 100%) !important;
    background-size: 200% 100% !important;
    border-color: ${BRAND_PRIMARY} !important;
  }

  &.ant-btn-loading.ant-btn-primary {
    animation: ${btnShimmer} 1.2s linear infinite !important;
  }
`;

const billingModalStyles = {
  content: {
    borderRadius: 12,
    padding: 0,
    overflow: "hidden",
    boxShadow: "0 25px 60px -12px rgba(0,0,0,0.2)",
  },
  header: { display: "none" },
  body: { padding: 0 },
  mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.25)" },
};

function AnimatedSectionDivider() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  return (
    <motion.div
      ref={ref}
      style={{
        height: 2,
        background: T.border,
        margin: "12px 0",
        transformOrigin: "left",
        borderRadius: 1,
      }}
      initial={{ scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  );
}

function ShieldBillingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L5 6v5c0 5.25 3.5 9.74 7 11 3.5-1.26 7-5.75 7-11V6l-7-3z"
        stroke={BRAND_PRIMARY}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyPlanIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden style={{ margin: "0 auto 16px", display: "block" }}>
      <rect x="8" y="12" width="104" height="56" rx="8" fill="#f3f4f6" stroke="#e5e7eb" />
      <rect x="20" y="24" width="48" height="8" rx="2" fill="#e5e7eb" />
      <rect x="20" y="38" width="72" height="6" rx="2" fill="#e5e7eb" />
      <rect x="20" y="50" width="32" height="6" rx="2" fill={BRAND_PRIMARY} opacity="0.35" />
      <rect x="78" y="22" width="28" height="22" rx="4" fill="#fff" stroke={BRAND_PRIMARY} strokeWidth="1.5" />
      <path d="M84 32h16M84 36h10" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptEmptyIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden style={{ margin: "0 auto 12px", display: "block" }}>
      <rect x="14" y="8" width="36" height="48" rx="4" stroke="#d1d5db" strokeWidth="2" strokeDasharray="4 3" fill="#fafafa" />
      <path d="M22 20h20M22 28h16M22 36h20" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlanEmblemIcon({ planId }) {
  if (planId === "growth") return <TrendingUp size={18} strokeWidth={2.25} />;
  if (planId === "advanced") return <Zap size={18} strokeWidth={2.25} />;
  return <LayoutGrid size={18} strokeWidth={2.25} />;
}

function EmailMarketingUsageBlock({ emUsage }) {
  if (!emUsage) return null;
  const pct = emUsage.monthly_limit ? (emUsage.used_this_period / emUsage.monthly_limit) * 100 : 0;
  const fill = pct > 95 ? BRAND_PRIMARY : "#374151";
  return (
    <AddonUsageWrap>
      <AddonDesc style={{ fontSize: 12, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <NumberFlow value={emUsage.used_this_period ?? 0} format={{ maximumFractionDigits: 0, useGrouping: true }} />
        <span>/</span>
        <NumberFlow value={emUsage.monthly_limit ?? 0} format={{ maximumFractionDigits: 0, useGrouping: true }} />
        <span>sends this period</span>
      </AddonDesc>
      <AddonUsageBar>
        <AddonUsageFill $pct={pct} $fill={fill} />
      </AddonUsageBar>
    </AddonUsageWrap>
  );
}

// ─── payment form ─────────────────────────────────────────────────────────────
const dividerStyle = {
  display: "flex", alignItems: "center", gap: 12,
  margin: "20px 0 16px", color: "#9ca3af", fontSize: 13, fontWeight: 500,
};

const cardRevealStyle = {
  width: "100%", display: "flex", alignItems: "center",
  justifyContent: "space-between", padding: 16,
  background: "#f9fafb", border: "1px solid #e5e7eb",
  borderRadius: 8, cursor: "pointer", marginTop: 16, transition: "background 0.2s",
};

function AddonExpressCheckoutButton({ clientSecret, onSuccess, onPaymentRequestReady }) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe || !clientSecret) return;
    const pr = stripe.paymentRequest({
      country: "CA", currency: "cad",
      total: { label: "Marketplace email branding", amount: Math.round(ADDON_PRICE * 100) },
      requestPayerName: true, requestPayerEmail: true,
    });
    pr.canMakePayment().then((result) => {
      if (result) { setPaymentRequest(pr); onPaymentRequestReady?.(); }
    });
    pr.on("paymentmethod", async (ev) => {
      try {
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret,
          { payment_method: ev.paymentMethod.id, receipt_email: ev.payerEmail || undefined },
          { handleActions: false });
        if (error) { ev.complete("fail"); message.error(error.message || "Payment didn't go through."); }
        else { ev.complete("success"); if (paymentIntent?.status === "succeeded") onSuccess?.(); }
      } catch (err) { ev.complete("fail"); message.error(err?.message || "Payment failed."); }
    });
  }, [stripe, clientSecret, onSuccess, onPaymentRequestReady]);

  if (!paymentRequest) return null;
  return <div style={{ marginBottom: 24 }}><PaymentRequestButtonElement options={{ paymentRequest }} /></div>;
}

function AddonPaymentForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [hasExpressPay, setHasExpressPay] = useState(false);
  const [showCardFields, setShowCardFields] = useState(false);

  useEffect(() => {
    if (!hasExpressPay && !showCardFields && clientSecret) {
      const t = setTimeout(() => setShowCardFields(true), 1500);
      return () => clearTimeout(t);
    }
  }, [hasExpressPay, showCardFields, clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setErr(null); setSubmitting(true);
    const { error } = await elements.submit();
    if (error) { setErr(error.message || "Something went wrong."); setSubmitting(false); return; }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== "undefined" ? window.location.href : "",
        payment_method_data: {
          billing_details: {
            address: { country: "CA", postal_code: "K1A 0B1" },
          },
        },
      },
      redirect: "if_required",
    });
    if (confirmError) { setErr(confirmError.message || "Payment failed."); setSubmitting(false); return; }
    setSubmitting(false); onSuccess?.();
  };

  const notReady = (!hasExpressPay && !showCardFields) || (showCardFields && !ready);

  return (
    <div style={{ position: "relative", minHeight: notReady ? 120 : undefined }}>
      <div style={{ visibility: notReady ? "hidden" : "visible" }}>
        <PaySectionLabel style={{ marginBottom: 10 }}>Pay with</PaySectionLabel>
        <AddonExpressCheckoutButton clientSecret={clientSecret} onSuccess={onSuccess} onPaymentRequestReady={() => setHasExpressPay(true)} />
        {hasExpressPay && (
          <div style={dividerStyle}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span
              style={{
                padding: "2px 12px",
                background: "#ffffff",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                color: "#9ca3af",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>
        )}
        {hasExpressPay && !showCardFields && (
          <button type="button" onClick={() => setShowCardFields(true)} style={cardRevealStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f9fafb"; }}>
            <span style={{ fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={18} /> Pay with Credit or Debit card
            </span>
            <ChevronDown size={16} color="#6b7280" />
          </button>
        )}
        <div style={{ display: showCardFields ? "block" : "none", marginTop: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16, minHeight: ready ? undefined : 120 }}>
              <PaymentElement options={paymentElementOptions} onReady={() => setReady(true)} />
            </div>
            {err && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#991b1b",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{err}</span>
              </div>
            )}
            <ShimmerPrimaryBtn
              type="primary"
              htmlType="submit"
              disabled={!stripe || !elements || !ready || submitting}
              loading={submitting}
              block
              size="large"
              style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
              icon={<Lock size={14} />}
            >
              {submitting ? "Processing…" : `Pay $${ADDON_PRICE}/month`}
            </ShimmerPrimaryBtn>
            <StripeSecureNote>
              <Lock size={12} />
              Secured by Stripe
            </StripeSecureNote>
          </form>
        </div>
      </div>
      {notReady && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Loading payment…</span>
        </div>
      )}
    </div>
  );
}

function PlanSwitchPaymentForm({ clientSecret, onSuccess, onLoadError, planName }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleLoadError = useCallback(
    (event) => {
      const msg = event?.error?.message || "";
      if (typeof onLoadError === "function") onLoadError(msg);
    },
    [onLoadError]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setErr(null);
    setSubmitting(true);
    const { error } = await elements.submit();
    if (error) {
      setErr(error.message || "Something went wrong.");
      setSubmitting(false);
      return;
    }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== "undefined" ? window.location.href : "",
        payment_method_data: {
          billing_details: {
            address: { country: "CA", postal_code: "K1A 0B1" },
          },
        },
      },
      redirect: "if_required",
    });
    if (confirmError) {
      setErr(confirmError.message || "Payment failed.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16, minHeight: ready ? undefined : 120 }}>
        <PaymentElement
          options={paymentElementOptions}
          onReady={() => setReady(true)}
          onLoadError={handleLoadError}
        />
      </div>
      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            fontSize: 13,
            color: "#991b1b",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{err}</span>
        </div>
      )}
      <PaySectionLabel>Payment</PaySectionLabel>
      <ShimmerPrimaryBtn
        type="primary"
        htmlType="submit"
        disabled={!stripe || !elements || !ready || submitting}
        loading={submitting}
        block
        size="large"
        style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
        icon={<Lock size={14} />}
      >
        {submitting ? "Processing…" : `Confirm and switch to ${planName || "new plan"}`}
      </ShimmerPrimaryBtn>
      <StripeSecureNote>
        <Lock size={12} />
        Secured by Stripe
      </StripeSecureNote>
    </form>
  );
}

function UpdatePaymentMethodForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setErr(null);
    setSubmitting(true);
    const { error } = await elements.submit();
    if (error) {
      setErr(error.message || "Something went wrong.");
      setSubmitting(false);
      return;
    }
    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: typeof window !== "undefined" ? window.location.href : "",
        payment_method_data: {
          billing_details: {
            address: { country: "CA", postal_code: "K1A 0B1" },
          },
        },
      },
      redirect: "if_required",
    });
    if (confirmError) {
      setErr(confirmError.message || "Setup failed.");
      setSubmitting(false);
      return;
    }
    const pm = setupIntent?.payment_method;
    const pmId = typeof pm === "string" ? pm : (pm?.id ?? null);
    setSubmitting(false);
    if (pmId) onSuccess?.(pmId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16, minHeight: ready ? undefined : 120 }}>
        <PaymentElement options={paymentElementOptions} onReady={() => setReady(true)} />
      </div>
      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            fontSize: 13,
            color: "#991b1b",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{err}</span>
        </div>
      )}
      <PaySectionLabel>Card details</PaySectionLabel>
      <ShimmerBrandBtn
        type="primary"
        htmlType="submit"
        disabled={!stripe || !elements || !ready || submitting}
        loading={submitting}
        block
        size="large"
        style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
        icon={<Lock size={14} />}
      >
        {submitting ? "Saving…" : "Save payment method"}
      </ShimmerBrandBtn>
      <StripeSecureNote>
        <Lock size={12} />
        Secured by Stripe
      </StripeSecureNote>
    </form>
  );
}

function formatCardBrandLabel(brand) {
  if (!brand) return "Card";
  const b = String(brand).toLowerCase();
  if (b === "mastercard") return "Mastercard";
  if (b === "amex") return "Amex";
  if (b === "diners") return "Diners";
  if (b === "discover") return "Discover";
  if (b === "unionpay") return "UnionPay";
  return b.charAt(0).toUpperCase() + b.slice(1);
}

function isCardExpired(expMonth, expYear) {
  if (expMonth == null || expYear == null) return false;
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const y = Number(expYear);
  const m = Number(expMonth);
  if (!y || !m) return false;
  if (y < cy) return true;
  if (y > cy) return false;
  return m < cm;
}

function formatExpShort(expMonth, expYear) {
  if (expMonth == null || expYear == null) return null;
  const m = Number(expMonth);
  const y = Number(expYear);
  if (!m || !y) return null;
  const yy = y >= 100 ? y % 100 : y;
  return `${String(m).padStart(2, "0")}/${String(yy).padStart(2, "0")}`;
}

/**
 * Flat card-art SVGs (MIT): aaronfagan/svg-credit-card-payment-icons
 * Fetched from: https://github.com/aaronfagan/svg-credit-card-payment-icons/tree/master/flat
 * Served from /public/payment-brands/
 */
const PAYMENT_BRAND_IMG = {
  visa: "/payment-brands/visa.svg",
  mastercard: "/payment-brands/mastercard.svg",
  amex: "/payment-brands/amex.svg",
  americanexpress: "/payment-brands/amex.svg",
  american_express: "/payment-brands/amex.svg",
  discover: "/payment-brands/discover.svg",
  diners: "/payment-brands/diners.svg",
  diners_club: "/payment-brands/diners.svg",
  jcb: "/payment-brands/jcb.svg",
  unionpay: "/payment-brands/unionpay.svg",
};

function PaymentMethodBrandIcon({ brand }) {
  const raw = (brand || "card").toLowerCase().replace(/\s+/g, "_");
  const src = PAYMENT_BRAND_IMG[raw];
  if (!src) {
    return <CreditCard size={16} color="#6b7280" strokeWidth={1.75} />;
  }
  return <PmBrandImg src={src} alt="" aria-hidden draggable={false} />;
}

function renderWidgetPlanComparisonCell(row, pid) {
  if (row.valueType === "text") {
    return row.text?.[pid] ?? "—";
  }
  if (row.plans?.[pid]) {
    return (
      <span style={{ display: "inline-flex", justifyContent: "center", color: "#111827" }} aria-label="Included">
        <Check size={18} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span style={{ color: "#d1d5db" }} aria-label="Not included">—</span>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function PlanBillingSettingsTab({ addons, addonsLoading, refetchAddons } = {}) {
  const { subscription, scheduledDowngrade, loading: subLoading, cancel, reactivate, refetch: refetchSubscription, subscribe, hasStripeSubscription } = useSubscription();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [addonClientSecret, setAddonClientSecret] = useState(null);
  const [addonIntentLoading, setAddonIntentLoading] = useState(false);
  const [addonIntentError, setAddonIntentError] = useState(null);
  const [addonSubscribing, setAddonSubscribing] = useState(false);
  const [addonCancelModalOpen, setAddonCancelModalOpen] = useState(false);
  const [addonCancelling, setAddonCancelling] = useState(false);
  const [emSubscribing, setEmSubscribing] = useState(false);
  const [emailMarketingTierModalOpen, setEmailMarketingTierModalOpen] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceSortOrder, setInvoiceSortOrder] = useState("recent"); // "recent" | "oldest"
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [switchPlanLoading, setSwitchPlanLoading] = useState(null);
  const [switchPaymentSecret, setSwitchPaymentSecret] = useState(null);
  const [switchPaymentTargetPlanId, setSwitchPaymentTargetPlanId] = useState(null);
  const [emailMarketingTierPaymentSecret, setEmailMarketingTierPaymentSecret] = useState(null);
  const [emailMarketingTierPaymentLabel, setEmailMarketingTierPaymentLabel] = useState(null);
  const [updatePaymentModalOpen, setUpdatePaymentModalOpen] = useState(false);
  const [updatePaymentClientSecret, setUpdatePaymentClientSecret] = useState(null);
  const [updatePaymentIntentLoading, setUpdatePaymentIntentLoading] = useState(false);
  const [updatePaymentIntentError, setUpdatePaymentIntentError] = useState(null);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(null);
  const [defaultPaymentMethodLoading, setDefaultPaymentMethodLoading] = useState(false);
  const [settingDefaultPmId, setSettingDefaultPmId] = useState(null);
  const [detachPmModalOpen, setDetachPmModalOpen] = useState(false);
  const [detachPmId, setDetachPmId] = useState(null);
  const [detachPmLabel, setDetachPmLabel] = useState("");
  const [detachPmLoading, setDetachPmLoading] = useState(false);
  const [marketplacePulse, setMarketplacePulse] = useState(false);
  const prevAddonActiveRef = useRef(null);

  /** Avoid setState after unmount / tab switch during async plan or billing actions */
  const billingMountedRef = useRef(true);
  useEffect(() => {
    billingMountedRef.current = true;
    return () => {
      billingMountedRef.current = false;
    };
  }, []);

  const [stripeFontSize, setStripeFontSize] = useState("14px");
  useEffect(() => {
    const update = () => setStripeFontSize(typeof window !== "undefined" && window.innerWidth < 969 ? "12px" : "14px");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const stripeFontCssUrl = typeof window !== "undefined" ? `${window.location.origin}/fonts/proxima-soft.css` : "";
  const stripeFonts = useMemo(() => (stripeFontCssUrl ? [{ cssSrc: stripeFontCssUrl }] : []), [stripeFontCssUrl]);

  const stripeAppearance = useMemo(() => {
    const fontFamily = '"Proxima Soft", sans-serif';
    return {
      theme: "stripe",
      variables: {
        colorPrimary: appTheme.token.colorPrimary,
        colorBackground: "#ffffff",
        colorText: appTheme.token.colorText,
        colorDanger: appTheme.token.colorError,
        fontFamily, spacingUnit: "4px",
        borderRadius: "10px",
        fontSizeBase: stripeFontSize,
      },
      rules: {
        ".Input": { paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px", borderColor: appTheme.token.colorBorder, boxShadow: "none", transition: "border-color 0.2s, box-shadow 0.2s", fontFamily, fontWeight: "500" },
        ".Input:hover": { borderColor: appTheme.token.colorPrimary },
        ".Input:focus": { borderColor: appTheme.token.colorPrimary, boxShadow: `0 0 0 2px ${appTheme.token.colorPrimary}20`, outline: "none" },
        ".Input--invalid": { borderColor: appTheme.token.colorError, boxShadow: "none" },
        ".Input--invalid:focus": { borderColor: appTheme.token.colorError, boxShadow: `0 0 0 2px ${appTheme.token.colorError}20` },
        ".Label": { fontWeight: "600", color: "#000", marginBottom: "8px", fontFamily },
        ".Input::placeholder": { color: "#c5c5c5", fontWeight: "600", fontFamily },
        ".Tab": { borderColor: appTheme.token.colorBorder, borderRadius: "10px", fontFamily, fontWeight: "600" },
        ".Tab:selected": { borderColor: appTheme.token.colorPrimary },
      },
    };
  }, [stripeFontSize]);

  const currentPlan = subscription?.planId ? getPlanById(subscription.planId) : null;
  const nextBilling = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const planDisplay = useMemo(() => {
    return PLANS.map((plan) => {
      const isCurrent = subscription?.planId === plan.id;
      const subId = subscription?.planId;
      return {
        id: plan.id,
        name: plan.name,
        priceNum: plan.price,
        grad: PLAN_GRADIENTS[plan.id] || "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
        isCurrent,
        isUpgrade: Boolean(subId && isUpgrade(subId, plan.id)),
      };
    });
  }, [subscription?.planId]);

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await businessService.getWidgetSubscriptionInvoices();
      if (res.success && Array.isArray(res.data?.invoices)) setInvoices(res.data.invoices);
      else setInvoices([]);
    } catch {
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const sortedInvoices = useMemo(() => {
    const list = invoices.filter((inv) => Number(inv?.amount_paid || 0) > 0);
    const asc = invoiceSortOrder === "oldest";
    list.sort((a, b) => {
      const da = a.created || "";
      const db = b.created || "";
      return asc ? (da < db ? -1 : da > db ? 1 : 0) : (db < da ? -1 : db > da ? 1 : 0);
    });
    return list;
  }, [invoices, invoiceSortOrder]);

  const invoiceTotalPages = Math.max(1, Math.ceil(sortedInvoices.length / INVOICES_PAGE_SIZE));

  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * INVOICES_PAGE_SIZE;
    return sortedInvoices.slice(start, start + INVOICES_PAGE_SIZE);
  }, [sortedInvoices, invoicePage]);

  useEffect(() => {
    setInvoicePage((p) => Math.min(Math.max(1, p), invoiceTotalPages));
  }, [invoiceTotalPages, sortedInvoices.length]);

  useEffect(() => {
    setExpandedInvoiceId(null);
  }, [invoicePage]);

  useEffect(() => {
    setInvoicePage(1);
    setExpandedInvoiceId(null);
  }, [invoiceSortOrder]);

  const refreshBillingViews = useCallback(async () => {
    await Promise.allSettled([
      refetchSubscription(),
      Promise.resolve(refetchAddons?.()),
      fetchInvoices(),
    ]);
  }, [refetchSubscription, refetchAddons, fetchInvoices]);

  const refreshBillingViewsWithRetries = useCallback(async () => {
    await refreshBillingViews();
    setTimeout(() => { refreshBillingViews(); }, 1200);
    setTimeout(() => { refreshBillingViews(); }, 3000);
  }, [refreshBillingViews]);

  const handleSwitchPlan = async (planId) => {
    if (subscription?.planId === planId) return;
    setSwitchPlanLoading(planId);
    try {
      const result = await subscribe(planId);
      if (!billingMountedRef.current) return;
      if (result.success) {
        if (result.data?.requires_payment && result.data?.client_secret) {
          setSwitchPaymentSecret(result.data.client_secret);
          setSwitchPaymentTargetPlanId(result.data.target_plan_id ?? planId);
          return;
        }
        await refreshBillingViews();
        if (!billingMountedRef.current) return;
        const planName = getPlanById(planId)?.name ?? planId;
        if (result.data?.downgrade_scheduled_at_period_end && result.data?.scheduled_plan_id) {
          message.success(`Downgrade to ${planName} scheduled for the end of your billing period. You'll keep your current plan until then.`, 6);
        } else if (result.data?.stripe_updated) {
          message.success(`You're now on the ${planName} plan. Any proration will appear on your invoice or payment method.`, 5);
        } else {
          message.success(`Switched to ${planName} plan.`, 4);
        }
      } else {
        antMessage.error(result.error || "Failed to switch plan.");
      }
    } catch (e) {
      if (billingMountedRef.current) {
        antMessage.error("Something went wrong while switching plans. Please try again.");
      }
    } finally {
      if (billingMountedRef.current) {
        setSwitchPlanLoading(null);
      }
    }
  };

  const handleSwitchPaymentSuccess = useCallback(async () => {
    const planName = getPlanById(switchPaymentTargetPlanId)?.name ?? switchPaymentTargetPlanId;
    setSwitchPaymentSecret(null);
    setSwitchPaymentTargetPlanId(null);
    await refreshBillingViewsWithRetries();
    if (billingMountedRef.current) {
      message.success(`Switched to ${planName} plan.`);
    }
  }, [switchPaymentTargetPlanId, refreshBillingViewsWithRetries]);

  const handleSwitchPaymentLoadError = useCallback(() => {
    setSwitchPaymentSecret(null);
    setSwitchPaymentTargetPlanId(null);
    if (billingMountedRef.current) {
      antMessage.error(
        "This payment link can't be used anymore (already used or expired). Please try switching plan again."
      );
    }
  }, []);

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      const result = await cancel();
      if (!billingMountedRef.current) return;
      setCancelModalOpen(false);
      if (result.success) {
        await refreshBillingViews();
        if (billingMountedRef.current) {
          message.success("Subscription will cancel at the end of the billing period.");
        }
      } else {
        antMessage.error(result.error || "Failed to cancel.");
      }
    } catch {
      if (billingMountedRef.current) {
        antMessage.error("Failed to cancel. Please try again.");
      }
    } finally {
      if (billingMountedRef.current) {
        setCancelling(false);
      }
    }
  };

  const handleReactivate = async () => {
    try {
      const result = await reactivate();
      if (!billingMountedRef.current) return;
      if (result.success) {
        await refreshBillingViews();
        if (billingMountedRef.current) {
          message.success("Subscription reactivated.");
        }
      } else {
        antMessage.error(result.error || "Failed to reactivate.");
      }
    } catch {
      if (billingMountedRef.current) {
        antMessage.error("Failed to reactivate. Please try again.");
      }
    }
  };

  const marketplaceEmail = addons?.marketplace_email_branding;
  const addonActive = marketplaceEmail?.active === true;
  const canInstantSubscribeAddon = marketplaceEmail?.canInstantSubscribe === true;

  useEffect(() => {
    if (addonsLoading) return undefined;
    const prev = prevAddonActiveRef.current;
    if (prev === null) {
      prevAddonActiveRef.current = addonActive;
      return undefined;
    }
    let tid;
    if (addonActive && !prev) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.72, x: 0.5 } });
      setMarketplacePulse(true);
      tid = setTimeout(() => setMarketplacePulse(false), 1500);
    }
    prevAddonActiveRef.current = addonActive;
    return () => {
      if (tid) clearTimeout(tid);
    };
  }, [addonActive, addonsLoading]);
  const addonNextBilling = marketplaceEmail?.currentPeriodEnd
    ? new Date(marketplaceEmail.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const emailMkt = addons?.email_marketing;
  const emActive = emailMkt?.active === true;
  const emTiers = emailMkt?.tiers || [];
  const emCurrentTierKey = emailMkt?.current_tier_key ?? null;
  const emUsage = emailMkt?.usage;
  const emCanInstant = emailMkt?.canInstantSubscribe === true;
  const emNextBilling = emailMkt?.currentPeriodEnd
    ? new Date(emailMkt.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const createAddonPaymentIntent = useCallback(async () => {
    if (typeof businessService.createMarketplaceEmailAddonPaymentIntent === "function")
      return businessService.createMarketplaceEmailAddonPaymentIntent();
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.MY_BUSINESS_ADDON_MARKETPLACE_EMAIL_PAYMENT_INTENT);
      return { success: true, client_secret: response.data?.client_secret, subscription_id: response.data?.subscription_id };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.response?.data?.detail || "Failed to start payment." };
    }
  }, []);

  useEffect(() => {
    if (!subscribeModalOpen) { setAddonClientSecret(null); setAddonIntentError(null); return; }
    let cancelled = false;
    setAddonIntentLoading(true); setAddonIntentError(null);
    createAddonPaymentIntent().then((res) => {
      if (cancelled) return;
      setAddonIntentLoading(false);
      if (res.success && res.client_secret) setAddonClientSecret(res.client_secret);
      else setAddonIntentError(res.error || "Could not load payment form.");
    }).catch(() => {
      if (!cancelled) { setAddonIntentLoading(false); setAddonIntentError("Could not load payment form."); }
    });
    return () => { cancelled = true; };
  }, [subscribeModalOpen, createAddonPaymentIntent]);

  const showPaymentMethodSection = hasStripeSubscription || canInstantSubscribeAddon;

  const fetchPaymentMethods = useCallback(async () => {
    setDefaultPaymentMethodLoading(true);
    try {
      const res = await businessService.getDefaultPaymentMethod();
      if (res.success && res.data) {
        let list = Array.isArray(res.data.payment_methods) ? res.data.payment_methods : [];
        if (!list.length && res.data.payment_method?.last4) {
          list = [{ ...res.data.payment_method }];
        }
        setSavedPaymentMethods(list);
        setDefaultPaymentMethodId(res.data.default_payment_method_id ?? null);
      } else {
        setSavedPaymentMethods([]);
        setDefaultPaymentMethodId(null);
      }
    } catch {
      setSavedPaymentMethods([]);
      setDefaultPaymentMethodId(null);
    } finally {
      setDefaultPaymentMethodLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showPaymentMethodSection) {
      setSavedPaymentMethods([]);
      setDefaultPaymentMethodId(null);
      return undefined;
    }
    fetchPaymentMethods();
    return undefined;
  }, [showPaymentMethodSection, fetchPaymentMethods]);

  useEffect(() => {
    if (!updatePaymentModalOpen) { setUpdatePaymentClientSecret(null); setUpdatePaymentIntentError(null); return; }
    let cancelled = false;
    setUpdatePaymentIntentLoading(true); setUpdatePaymentIntentError(null);
    businessService.createUpdatePaymentMethodSetupIntent().then((res) => {
      if (cancelled) return;
      setUpdatePaymentIntentLoading(false);
      if (res.success && res.client_secret) setUpdatePaymentClientSecret(res.client_secret);
      else setUpdatePaymentIntentError(res.error || "Could not load payment form.");
    }).catch(() => {
      if (!cancelled) { setUpdatePaymentIntentLoading(false); setUpdatePaymentIntentError("Could not load payment form."); }
    });
    return () => { cancelled = true; };
  }, [updatePaymentModalOpen]);

  const handleSetDefaultPaymentMethod = useCallback(async (pmId) => {
    if (!pmId) return;
    setSettingDefaultPmId(pmId);
    try {
      const result = await businessService.setDefaultPaymentMethod({ payment_method: pmId });
      if (result.success) {
        message.success("Default payment method updated.");
        await fetchPaymentMethods();
        refetchAddons?.();
      } else {
        antMessage.error(result.error || "Could not set default payment method.");
      }
    } finally {
      setSettingDefaultPmId(null);
    }
  }, [fetchPaymentMethods, refetchAddons]);

  const handleDetachPaymentMethodConfirm = useCallback(async () => {
    if (!detachPmId) return;
    setDetachPmLoading(true);
    try {
      const r = await businessService.detachPaymentMethod({ payment_method: detachPmId });
      if (r.success) {
        message.success("Payment method removed.");
        setDetachPmModalOpen(false);
        setDetachPmId(null);
        setDetachPmLabel("");
        await fetchPaymentMethods();
        refetchAddons?.();
      } else {
        antMessage.error(r.error || "Could not remove card.");
      }
    } finally {
      setDetachPmLoading(false);
    }
  }, [detachPmId, fetchPaymentMethods, refetchAddons]);

  const handleUpdatePaymentMethodSuccess = useCallback(async (paymentMethodId) => {
    const result = await businessService.setDefaultPaymentMethod({ payment_method: paymentMethodId });
    if (result.success) {
      setUpdatePaymentModalOpen(false);
      setUpdatePaymentClientSecret(null);
      message.success("Payment method updated. It will be used for future charges and renewals.");
      await fetchPaymentMethods();
      refetchAddons?.();
    } else {
      antMessage.error(result.error || "Failed to update payment method.");
    }
  }, [fetchPaymentMethods, refetchAddons]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("email_marketing_modal") === "1") setEmailMarketingTierModalOpen(true);
  }, []);

  const handleAddonPaymentSuccess = useCallback(async () => {
    setSubscribeModalOpen(false); setAddonClientSecret(null);
    await refreshBillingViewsWithRetries();
    message.success("Marketplace email branding add-on is now active.");
  }, [refreshBillingViewsWithRetries]);

  const handleInstantSubscribeAddon = async () => {
    setAddonSubscribing(true);
    const result = await businessService.subscribeMarketplaceEmailAddonInstant();
    setAddonSubscribing(false);
    if (result.success) { await refreshBillingViewsWithRetries(); message.success("Marketplace email branding add-on is now active."); }
    else antMessage.error(result.error || "Failed to subscribe.");
  };

  const handleAddonCancelConfirm = async () => {
    setAddonCancelling(true);
    const result = await businessService.cancelMarketplaceEmailAddon();
    setAddonCancelling(false); setAddonCancelModalOpen(false);
    if (result.success) { await refreshBillingViews(); message.success("Add-on will cancel at the end of the billing period."); }
    else antMessage.error(result.error || "Failed to cancel.");
  };

  const handleAddonReactivate = async () => {
    const result = await businessService.reactivateMarketplaceEmailAddon();
    if (result.success) { await refreshBillingViews(); message.success("Add-on reactivated."); }
    else antMessage.error(result.error || "Failed to reactivate.");
  };

  const startEmailMarketingCheckout = async (priceId) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const r = await businessService.createEmailMarketingAddonCheckout({
      price_id: priceId,
      success_url: `${origin}/business/dashboard/settings?tab=billing&email_marketing=1`,
      cancel_url: `${origin}/business/dashboard/settings?tab=billing`,
    });
    if (r.success && r.url) window.location.href = r.url;
    else antMessage.error(r.error || "Could not start checkout.");
  };

  const handleEmailMarketingInstant = async (priceId) => {
    setEmSubscribing(true);
    const r = await businessService.subscribeEmailMarketingAddonInstant(priceId);
    setEmSubscribing(false);
    if (r.success) {
      await refreshBillingViewsWithRetries();
      refetchAddons?.();
      message.success("Email marketing add-on is now active.");
    } else antMessage.error(r.error || "Failed to subscribe.");
    return r;
  };

  const handleEmailMarketingChangeTier = async (priceId) => {
    setEmSubscribing(true);
    const r = await businessService.changeEmailMarketingTier(priceId);
    setEmSubscribing(false);
    if (r.success) {
      if (r.data?.requires_payment && r.data?.client_secret) {
        const tier = emTiers.find((t) => t.price_id === priceId);
        const label = tier?.plan_label || tier?.planLabel || "new plan";
        setEmailMarketingTierPaymentSecret(r.data.client_secret);
        setEmailMarketingTierPaymentLabel(label);
        return { ...r, requires_payment: true };
      }
      await refreshBillingViews();
      refetchAddons?.();
      message.success("Email marketing plan updated.");
    } else antMessage.error(r.error || "Could not change plan.");
    return r;
  };

  const handleEmailMarketingTierPaymentSuccess = useCallback(async () => {
    const label = emailMarketingTierPaymentLabel;
    setEmailMarketingTierPaymentSecret(null);
    setEmailMarketingTierPaymentLabel(null);
    await refreshBillingViewsWithRetries();
    if (billingMountedRef.current) {
      message.success(
        label ? `Email marketing plan updated (${label}).` : "Email marketing plan updated.",
      );
    }
    setEmailMarketingTierModalOpen(false);
  }, [emailMarketingTierPaymentLabel, refreshBillingViewsWithRetries]);

  const handleEmailMarketingTierPaymentLoadError = useCallback(() => {
    setEmailMarketingTierPaymentSecret(null);
    setEmailMarketingTierPaymentLabel(null);
    if (billingMountedRef.current) {
      antMessage.error(
        "This payment link can't be used anymore (already used or expired). Please try changing plan again.",
      );
    }
  }, []);

  const handleEmailMarketingCancel = async () => {
    const r = await businessService.cancelEmailMarketingAddon();
    if (r.success) {
      await refreshBillingViews();
      refetchAddons?.();
      message.success("Email marketing will cancel at the end of the billing period.");
    } else antMessage.error(r.error || "Failed to cancel.");
  };

  const handleEmailMarketingReactivate = async () => {
    const r = await businessService.reactivateEmailMarketingAddon();
    if (r.success) {
      await refreshBillingViews();
      refetchAddons?.();
      message.success("Email marketing add-on reactivated.");
    } else antMessage.error(r.error || "Failed to reactivate.");
  };

  const detachPmPreview = savedPaymentMethods.find((p) => p.id === detachPmId);

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <PageOuter>
      <GlobalStyle />

      <MainStack>
      {/* Header */}
      <PageHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#000000", lineHeight: 1.2 }}>Plans &amp; billing</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>Manage your plan and billing history here.</div>
          </div>
        </div>
      </PageHeader>

      <PlansBundle>
        <PlansMobileLayout>
          <PlansBundleCards>
            <PricingCardsGrid>
              {planDisplay.map((plan) => {
                const ctaBusy = switchPlanLoading === plan.id;
                const ctaDisabled = plan.isCurrent || switchPlanLoading !== null;
                let ctaPrimary = false;
                let ctaLabel = "";
                if (plan.isCurrent) {
                  ctaLabel = ctaBusy ? "Switching…" : "Your current plan";
                } else if (!subscription?.planId) {
                  ctaPrimary = true;
                  ctaLabel = ctaBusy ? "Switching…" : `Switch to ${plan.name}`;
                } else if (plan.isUpgrade) {
                  ctaPrimary = true;
                  ctaLabel = ctaBusy ? "Switching…" : "Upgrade now";
                } else {
                  ctaLabel = ctaBusy ? "Switching…" : `Switch to ${plan.name}`;
                }
                return (
                  <PriceCard key={plan.id}>
                    <PlanCardBody>
                      <PlanCardTopCluster>
                        <PlanCardTextCol>
                          <PriceCardTitleRow>
                            <PriceCardName>{plan.name}</PriceCardName>
                            {plan.id === "growth" && <BlackCapsBadge>Most popular</BlackCapsBadge>}
                            {plan.id === "advanced" && <OutlineCapsBadge>Most valuable</OutlineCapsBadge>}
                          </PriceCardTitleRow>
                          <PriceCardSubtitle>{PLAN_TAGLINES[plan.id] ?? ""}</PriceCardSubtitle>
                        </PlanCardTextCol>
                        <PlanPriceCluster>
                          <PriceRow>
                            <PriceAmount>${plan.priceNum}</PriceAmount>
                            <PriceSuffix>/ month</PriceSuffix>
                          </PriceRow>
                        </PlanPriceCluster>
                      </PlanCardTopCluster>
                      <PriceCta
                        type="button"
                        className="plan-card-cta"
                        $primary={ctaPrimary}
                        data-primary={ctaPrimary ? "true" : undefined}
                        disabled={ctaDisabled}
                        onClick={() => !ctaDisabled && handleSwitchPlan(plan.id)}
                      >
                        {ctaLabel}
                      </PriceCta>
                    </PlanCardBody>
                  </PriceCard>
                );
              })}
            </PricingCardsGrid>
          </PlansBundleCards>
          <PlanCompareScroll>
            <PlanCompareTable>
              <thead>
                <tr>
                  <PcThFeature scope="col">Feature</PcThFeature>
                  {PLAN_IDS.map((pid) => (
                    <PcThPlan key={pid} scope="col">
                      {getPlanById(pid)?.name ?? pid}
                    </PcThPlan>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WIDGET_PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.id}>
                    <PcTdFeature title={row.tooltip || undefined}>
                      {row.tooltip ? (
                        <Tooltip title={row.tooltip}>
                          <span style={{ cursor: "help", borderBottom: "1px dotted #9ca3af" }}>{row.label}</span>
                        </Tooltip>
                      ) : (
                        row.label
                      )}
                    </PcTdFeature>
                    {PLAN_IDS.map((pid) => (
                      <PcTdMark key={`${row.id}-${pid}`}>
                        <PcTdMarkInner>{renderWidgetPlanComparisonCell(row, pid)}</PcTdMarkInner>
                      </PcTdMark>
                    ))}
                  </tr>
                ))}
              </tbody>
            </PlanCompareTable>
          </PlanCompareScroll>
        </PlansMobileLayout>

        <PlansDesktopLayout>
          <PlansDesktopGrid>
            <PlansDesktopCorner aria-hidden />
            {planDisplay.map((plan, planIdx) => {
              const ctaBusy = switchPlanLoading === plan.id;
              const ctaDisabled = plan.isCurrent || switchPlanLoading !== null;
              let ctaPrimary = false;
              let ctaLabel = "";
              if (plan.isCurrent) {
                ctaLabel = ctaBusy ? "Switching…" : "Your current plan";
              } else if (!subscription?.planId) {
                ctaPrimary = true;
                ctaLabel = ctaBusy ? "Switching…" : `Switch to ${plan.name}`;
              } else if (plan.isUpgrade) {
                ctaPrimary = true;
                ctaLabel = ctaBusy ? "Switching…" : "Upgrade now";
              } else {
                ctaLabel = ctaBusy ? "Switching…" : `Switch to ${plan.name}`;
              }
              return (
                <PriceCardPlaced key={plan.id} $planCol={planIdx + 2}>
                  <PlanCardBody>
                    <PlanCardTopCluster>
                      <PlanCardTextCol>
                        <PriceCardTitleRow>
                          <PriceCardName>{plan.name}</PriceCardName>
                          {plan.id === "growth" && <BlackCapsBadge>Most popular</BlackCapsBadge>}
                          {plan.id === "advanced" && <OutlineCapsBadge>Most valuable</OutlineCapsBadge>}
                        </PriceCardTitleRow>
                        <PriceCardSubtitle>{PLAN_TAGLINES[plan.id] ?? ""}</PriceCardSubtitle>
                      </PlanCardTextCol>
                      <PlanPriceCluster>
                        <PriceRow>
                          <PriceAmount>${plan.priceNum}</PriceAmount>
                          <PriceSuffix>/ month</PriceSuffix>
                        </PriceRow>
                      </PlanPriceCluster>
                    </PlanCardTopCluster>
                    <PriceCta
                      type="button"
                      className="plan-card-cta"
                      $primary={ctaPrimary}
                      data-primary={ctaPrimary ? "true" : undefined}
                      disabled={ctaDisabled}
                      onClick={() => !ctaDisabled && handleSwitchPlan(plan.id)}
                    >
                      {ctaLabel}
                    </PriceCta>
                  </PlanCardBody>
                </PriceCardPlaced>
              );
            })}
            <GridFeatHead>Feature</GridFeatHead>
            {PLAN_IDS.map((pid, i) => (
              <GridPlanHead key={pid} $col={i + 2} $divider={i > 0}>
                {getPlanById(pid)?.name ?? pid}
              </GridPlanHead>
            ))}
            {WIDGET_PLAN_COMPARISON_ROWS.map((row, ri) => {
              const gridRow = ri + 3;
              return (
                <React.Fragment key={row.id}>
                  <GridFeatCell $row={gridRow} title={row.tooltip || undefined}>
                    {row.tooltip ? (
                      <Tooltip title={row.tooltip}>
                        <span style={{ cursor: "help", borderBottom: "1px dotted #9ca3af" }}>{row.label}</span>
                      </Tooltip>
                    ) : (
                      row.label
                    )}
                  </GridFeatCell>
                  {PLAN_IDS.map((pid, ci) => (
                    <GridMarkCell
                      key={`${row.id}-${pid}`}
                      $row={gridRow}
                      $col={ci + 2}
                      $divider={ci > 0}
                    >
                      {renderWidgetPlanComparisonCell(row, pid)}
                    </GridMarkCell>
                  ))}
                </React.Fragment>
              );
            })}
          </PlansDesktopGrid>
        </PlansDesktopLayout>
      </PlansBundle>

      <AnimatedSectionDivider />

      {/* Active subscription + Payment method — redesigned */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <PlanBillingCard>
          <PlanBillingHeader>
            <PlanBillingHeaderTitleRow>
              <ShieldBillingIcon />
              <SectionTitle style={{ margin: 0 }}>Widget plan &amp; billing</SectionTitle>
            </PlanBillingHeaderTitleRow>
            <PlanBillingHeaderNote>
              Upgrades take effect immediately. Downgrades and cancellations take effect at the end of the billing period.
            </PlanBillingHeaderNote>
          </PlanBillingHeader>

          {subLoading ? (
            <PlanBillingBody>
              <PlanBillingSection>
                <PlanCurrentPlanInner>
                  <SkeletonPlanBlock>
                    <SkeletonLine style={{ height: 12, width: "30%" }} />
                    <SkeletonLine style={{ height: 24, width: "55%" }} />
                    <SkeletonLine style={{ height: 18, width: "40%" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <SkeletonLine style={{ height: 36, width: 120, borderRadius: 12 }} />
                      <SkeletonLine style={{ height: 36, width: 120, borderRadius: 12 }} />
                    </div>
                  </SkeletonPlanBlock>
                </PlanCurrentPlanInner>
              </PlanBillingSection>
              <PlanBillingSection>
                <PlanBillingSectionInner>
                  <SkeletonPmBlock>
                    <SkeletonLine style={{ height: 14, width: "45%" }} />
                    <SkeletonLine style={{ height: 72, width: "100%", borderRadius: 12 }} />
                  </SkeletonPmBlock>
                </PlanBillingSectionInner>
              </PlanBillingSection>
            </PlanBillingBody>
          ) : !subscription?.planId ? (
            <EmptyStateWrap>
              <EmptyPlanIllustration />
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>No active plan</div>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.55 }}>
                You don&apos;t have an active widget plan yet. Choose a plan in the comparison above to subscribe and embed the booking widget on your website.
              </p>
            </EmptyStateWrap>
          ) : (
            <PlanBillingBody>
              <PlanBillingSection>
                <PlanCurrentPlanInner>
                  <PlanBillingSectionLabel>Current plan</PlanBillingSectionLabel>
                  <PlanTitleBlock style={{ gap: 2 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px", rowGap: 4 }}>
                      <PlanNameText>{currentPlan?.name ?? subscription.planId}</PlanNameText>
                      <AnimatePresence mode="popLayout">
                        {subscription.cancelAtPeriodEnd && (
                          <motion.span
                            key="cancel-badge"
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: "inline-flex" }}
                          >
                            <Badge style={{ marginTop: 0 }}>Cancels {nextBilling || "at period end"}</Badge>
                          </motion.span>
                        )}
                        {scheduledDowngrade?.planId && !subscription.cancelAtPeriodEnd && (
                          <motion.span
                            key="downgrade-badge"
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: "inline-flex" }}
                          >
                            <Badge style={{ marginTop: 0, background: T.bg, color: T.sub }}>
                              Switching to {getPlanById(scheduledDowngrade.planId)?.name ?? scheduledDowngrade.planId}
                              {scheduledDowngrade.effectiveDate
                                ? ` ${new Date(scheduledDowngrade.effectiveDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                                : " at period end"}
                            </Badge>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <PlanPriceRow>
                      <NumberFlowGroup>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "baseline",
                            gap: 1,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: 22,
                            fontWeight: 700,
                            color: T.text,
                            // Tighter digit spacing inside NumberFlow (default mask width adds visible gaps)
                            ["--number-flow-mask-width"]: "0.1em",
                          }}
                        >
                          $
                          <NumberFlow
                            value={currentPlan?.price ?? 0}
                            format={{ maximumFractionDigits: 0, useGrouping: true }}
                          />
                        </span>
                      </NumberFlowGroup>
                      <PlanPriceSuffix>/mo</PlanPriceSuffix>
                      {currentPlan?.commission != null ? (
                        <CommissionPill>{currentPlan.commission}% per booking</CommissionPill>
                      ) : null}
                    </PlanPriceRow>
                    {nextBilling && !subscription.cancelAtPeriodEnd ? (
                      <RenewalRow>
                        <Calendar size={13} strokeWidth={2} />
                        <span>Renews {nextBilling}</span>
                      </RenewalRow>
                    ) : null}
                  </PlanTitleBlock>
                  <PlanBillingActions>
                    {subscription.cancelAtPeriodEnd ? (
                      <PlanActionPrimary
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={handleReactivate}
                      >
                        <RefreshCw size={14} />
                        Reactivate
                      </PlanActionPrimary>
                    ) : (
                      <>
                        {PLANS.filter((p) => p.id !== subscription.planId).map((p) => {
                          const up = isUpgrade(subscription.planId, p.id);
                          const Btn = up ? PlanActionPrimary : PlanActionOutline;
                          return (
                            <Btn
                              key={p.id}
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              disabled={switchPlanLoading !== null}
                              onClick={() => handleSwitchPlan(p.id)}
                            >
                              {switchPlanLoading === p.id ? (
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                  style={{ display: "inline-flex" }}
                                >
                                  <Loader2 size={14} />
                                </motion.span>
                              ) : up ? (
                                <ArrowUp size={14} />
                              ) : (
                                <ArrowDown size={14} />
                              )}
                              {switchPlanLoading === p.id
                                ? "Switching…"
                                : `${up ? "Upgrade" : "Downgrade"} to ${p.name}`}
                            </Btn>
                          );
                        })}
                        <PlanActionGhost
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setCancelModalOpen(true)}
                        >
                          Cancel subscription
                        </PlanActionGhost>
                      </>
                    )}
                  </PlanBillingActions>
                </PlanCurrentPlanInner>
              </PlanBillingSection>

              <PlanBillingSection>
                <PlanBillingSectionInner>
                  <PmSectionHeader>
                    <CreditCard size={16} strokeWidth={2} aria-hidden />
                    Payment methods
                  </PmSectionHeader>
                  {defaultPaymentMethodLoading ? (
                    <SkeletonPmBlock style={{ marginTop: 4 }}>
                      <SkeletonLine style={{ height: 72, width: "100%", borderRadius: 12 }} />
                    </SkeletonPmBlock>
                  ) : showPaymentMethodSection ? (
                    <PlanBillingPaymentStack>
                      {savedPaymentMethods.length > 0 ? (
                        <PmListOuter>
                          <PmListWrap>
                            <AnimatePresence initial={false}>
                              {savedPaymentMethods.map((pm) => {
                                const isDefault = Boolean(pm.id && defaultPaymentMethodId && pm.id === defaultPaymentMethodId);
                                const expired = isCardExpired(pm.exp_month, pm.exp_year);
                                const expStr = formatExpShort(pm.exp_month, pm.exp_year);
                                const brandLabel = formatCardBrandLabel(pm.brand);
                                const last4 = pm.last4 || "––––";
                                const canDetach = savedPaymentMethods.length > 1 && Boolean(pm.id);
                                return (
                                  <motion.div
                                    key={pm.id || `${pm.brand}-${last4}`}
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22 }}
                                    style={{ overflow: "hidden" }}
                                  >
                                    <PmRow>
                                      <PmRowLeft>
                                        <PmBrandBox>
                                          <PaymentMethodBrandIcon brand={pm.brand} />
                                        </PmBrandBox>
                                        <PmTextCol>
                                          <PmTitleLine>
                                            {brandLabel} ending in {last4}
                                          </PmTitleLine>
                                          <PmMetaLine>
                                            {expStr ? `Exp. ${expStr}` : "Expiration not available"}
                                          </PmMetaLine>
                                        </PmTextCol>
                                      </PmRowLeft>
                                      <PmRowRight>
                                        <PmStatusSlot>
                                          {expired && (
                                            <PmExpiredBadge>
                                              <AlertCircle size={10} strokeWidth={2.5} aria-hidden />
                                              Expired
                                            </PmExpiredBadge>
                                          )}
                                          {isDefault && (
                                            <PmDefaultBadge>
                                              <Check size={10} strokeWidth={3} aria-hidden />
                                              Default
                                            </PmDefaultBadge>
                                          )}
                                          {!isDefault && !expired && pm.id && (
                                            <PmSetDefaultBtn
                                              type="button"
                                              disabled={Boolean(settingDefaultPmId)}
                                              onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                                            >
                                              {settingDefaultPmId === pm.id ? "Updating…" : "Set as default"}
                                            </PmSetDefaultBtn>
                                          )}
                                        </PmStatusSlot>
                                        {canDetach && (
                                          <PmActionsGroup>
                                            <PmDeleteIconBtn
                                              type="button"
                                              aria-label="Remove payment method"
                                              title="Remove card"
                                              disabled={Boolean(detachPmLoading || settingDefaultPmId)}
                                              onClick={() => {
                                                setDetachPmId(pm.id);
                                                setDetachPmLabel(`${brandLabel} ending in ${last4}`);
                                                setDetachPmModalOpen(true);
                                              }}
                                            >
                                              <Trash2 size={16} strokeWidth={1.75} />
                                            </PmDeleteIconBtn>
                                          </PmActionsGroup>
                                        )}
                                      </PmRowRight>
                                    </PmRow>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </PmListWrap>
                        </PmListOuter>
                      ) : (
                        <PlanBillingPlanPrice style={{ marginTop: 6 }}>
                          No payment method on file yet.
                        </PlanBillingPlanPrice>
                      )}
                      <PmAddCardDashed type="button" whileTap={{ scale: 0.98 }} onClick={() => setUpdatePaymentModalOpen(true)}>
                        <Plus size={22} strokeWidth={2} />
                        Add payment method
                      </PmAddCardDashed>
                    </PlanBillingPaymentStack>
                  ) : (
                    <PlanBillingPlanPrice style={{ marginTop: 4 }}>
                      No payment method on file yet.
                    </PlanBillingPlanPrice>
                  )}
                </PlanBillingSectionInner>
              </PlanBillingSection>
            </PlanBillingBody>
          )}
        </PlanBillingCard>
      </motion.div>

      <AnimatedSectionDivider />

      {/* Add-ons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
      >
        <PlanBillingCard>
          <PlanBillingHeader>
            <PlanBillingHeaderTitleRow>
              <Package size={18} strokeWidth={2} aria-hidden />
              <SectionTitle style={{ margin: 0 }}>Add-ons</SectionTitle>
              <HeaderPill>Billed separately</HeaderPill>
            </PlanBillingHeaderTitleRow>
            <PlanBillingHeaderNote>Power-ups for your widget and customer comms.</PlanBillingHeaderNote>
          </PlanBillingHeader>

          {addonsLoading ? (
            <PlanBillingPanelBody>
              <SkeletonPmBlock>
                <SkeletonLine style={{ height: 108, width: "100%", borderRadius: 12 }} />
                <SkeletonLine style={{ height: 108, width: "100%", borderRadius: 12 }} />
              </SkeletonPmBlock>
            </PlanBillingPanelBody>
          ) : (
            <AddonsStack>
              {/* ── Marketplace email branding ── */}
              <AddonCard
                $pulse={marketplacePulse}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0 }}
              >
                <AddonCardInner>
                  <AddonIconBox>
                    <lord-icon src="https://cdn.lordicon.com/axroojxh.json" trigger="in" style={{ width: 26, height: 26 }} />
                  </AddonIconBox>
                  <AddonBody>
                    <AddonTitleRow>
                      <AddonName>Marketplace email branding</AddonName>
                      <NewBadge>New</NewBadge>
                      {addonActive && (
                        <motion.span layout style={{ display: "inline-flex" }}>
                          {marketplaceEmail?.cancelAtPeriodEnd ? (
                            <AddonCancelsBadge>Cancels {addonNextBilling}</AddonCancelsBadge>
                          ) : (
                            <AddonActiveBadge>Active · Renews {addonNextBilling}</AddonActiveBadge>
                          )}
                        </motion.span>
                      )}
                    </AddonTitleRow>
                    <AddonDesc>Custom logo, colors &amp; footer in marketplace booking emails — sent under your brand.</AddonDesc>
                  </AddonBody>
                  <AddonSide>
                    <AddonPriceLabel>
                      <AddonPriceStrong style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                        +$
                        <NumberFlow value={ADDON_PRICE} format={{ maximumFractionDigits: 0 }} />
                      </AddonPriceStrong>
                      <AddonPriceSuffix> / mo</AddonPriceSuffix>
                    </AddonPriceLabel>
                    <AddonCtaGroup>
                      {addonActive ? (
                        marketplaceEmail?.cancelAtPeriodEnd ? (
                          <AddonPrimaryBtn
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleAddonReactivate}
                          >
                            <RefreshCw size={12} style={{ marginRight: 6 }} />
                            Reactivate
                          </AddonPrimaryBtn>
                        ) : (
                          <AddonOutlineBtn type="button" onClick={() => setAddonCancelModalOpen(true)}>
                            Cancel
                          </AddonOutlineBtn>
                        )
                      ) : canInstantSubscribeAddon ? (
                        <>
                          <AddonPrimaryBtn
                            type="button"
                            $brand
                            whileTap={{ scale: 0.97 }}
                            onClick={handleInstantSubscribeAddon}
                            disabled={addonSubscribing}
                          >
                            {addonSubscribing ? "Subscribing…" : "Add to plan"}
                          </AddonPrimaryBtn>
                          <SmallLink type="button" onClick={() => setSubscribeModalOpen(true)} style={{ textAlign: "right" }}>
                            Use different card
                          </SmallLink>
                        </>
                      ) : (
                        <AddonPrimaryBtn
                          type="button"
                          $brand
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSubscribeModalOpen(true)}
                        >
                          Add to plan
                        </AddonPrimaryBtn>
                      )}
                    </AddonCtaGroup>
                  </AddonSide>
                </AddonCardInner>
              </AddonCard>

              {/* ── Email marketing campaigns ── */}
              <AddonCard
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <AddonCardInner>
                  <AddonIconBox>
                    <lord-icon src="https://cdn.lordicon.com/cfkiwvcc.json" trigger="in" delay="2000" style={{ width: 26, height: 26 }} />
                  </AddonIconBox>
                  <AddonBody>
                    <AddonTitleRow>
                      <AddonName>Email marketing campaigns</AddonName>
                      {emActive && (
                        <motion.span layout style={{ display: "inline-flex" }}>
                          {emailMkt?.cancelAtPeriodEnd ? (
                            <AddonCancelsBadge>Cancels {emNextBilling}</AddonCancelsBadge>
                          ) : (
                            <AddonActiveBadge>Active · Renews {emNextBilling}</AddonActiveBadge>
                          )}
                        </motion.span>
                      )}
                    </AddonTitleRow>
                    <AddonDesc>Broadcast to your contacts with tiered monthly limits. Transactional emails are not counted.</AddonDesc>
                    {emActive && emUsage ? <EmailMarketingUsageBlock emUsage={emUsage} /> : null}
                  </AddonBody>
                  <AddonSide>
                    <AddonPriceLabel>
                      <AddonPriceStrong style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                        From $
                        <NumberFlow value={6} format={{ maximumFractionDigits: 0 }} />
                      </AddonPriceStrong>
                      <AddonPriceSuffix> / mo</AddonPriceSuffix>
                    </AddonPriceLabel>
                    <AddonCtaGroup>
                      {emActive ? (
                        emailMkt?.cancelAtPeriodEnd ? (
                          <AddonPrimaryBtn
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleEmailMarketingReactivate}
                          >
                            <RefreshCw size={12} style={{ marginRight: 6 }} />
                            Reactivate
                          </AddonPrimaryBtn>
                        ) : (
                          <AddonCtaRow>
                            <AddonPrimaryBtn
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setEmailMarketingTierModalOpen(true)}
                            >
                              Change plan
                            </AddonPrimaryBtn>
                            <AddonOutlineBtn type="button" onClick={handleEmailMarketingCancel}>
                              Cancel
                            </AddonOutlineBtn>
                          </AddonCtaRow>
                        )
                      ) : (
                        <AddonPrimaryBtn
                          type="button"
                          $brand
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setEmailMarketingTierModalOpen(true)}
                        >
                          Add to plan
                        </AddonPrimaryBtn>
                      )}
                    </AddonCtaGroup>
                  </AddonSide>
                </AddonCardInner>
              </AddonCard>
            </AddonsStack>
          )}
        </PlanBillingCard>
      </motion.div>

      <AnimatedSectionDivider />

      {/* Billing history */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
      >
        <PlanBillingCard>
          <PlanBillingHeaderCompact>
            <PlanBillingHeaderTitleRow>
              <Receipt size={16} strokeWidth={2} aria-hidden />
              <SectionTitle style={{ margin: 0, fontSize: 15 }}>Billing history</SectionTitle>
            </PlanBillingHeaderTitleRow>
            <PlanBillingHeaderNote>Download receipts and view charge breakdowns.</PlanBillingHeaderNote>
          </PlanBillingHeaderCompact>

          <InvoiceHistoryPanelBody>
            {invoicesLoading ? (
              <InvoiceListWrap>
                {[1, 2, 3].map((k) => (
                  <SkeletonLine key={k} style={{ height: 56, width: "100%", borderRadius: 8 }} />
                ))}
              </InvoiceListWrap>
            ) : invoices.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center" }}>
                <ReceiptEmptyIllustration />
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>No invoices yet</div>
                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, maxWidth: 400, margin: "0 auto" }}>
                  {hasStripeSubscription
                    ? "Invoices appear here after your first payment."
                    : "Invoices appear after your first successful Stripe payment when you subscribe here. Plan changes above update your access only until then."}
                </div>
              </div>
            ) : sortedInvoices.length === 0 ? (
              <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 12, color: T.sub }}>
                No paid invoices to show yet.
              </div>
            ) : (
              <InvoiceListWrap>
                {paginatedInvoices.map((inv) => {
                  const dateStr = inv.created
                    ? new Date(inv.created).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const hasLines = Array.isArray(inv.lines) && inv.lines.length > 0;
                  const isExpanded = expandedInvoiceId === inv.id;
                  const cur = inv.currency ? String(inv.currency).toUpperCase() : "";
                  const totalPaid =
                    inv.currency && inv.amount_paid != null
                      ? `${inv.currency} $${Number(inv.amount_paid).toFixed(2)}`
                      : "—";
                  return (
                    <React.Fragment key={inv.id}>
                      <InvoiceRowCard>
                        <InvoiceColMain>
                          <InvoiceNumStrong>{inv.number || inv.id}</InvoiceNumStrong>
                          <InvoiceDateMuted>{dateStr}</InvoiceDateMuted>
                        </InvoiceColMain>
                        <InvoiceAmountCol>
                          {cur ? <InvoiceCurrencyTiny>{cur}</InvoiceCurrencyTiny> : null}
                          <InvoiceAmountStrong>
                            {inv.amount_paid != null ? `$${Number(inv.amount_paid).toFixed(2)}` : "—"}
                          </InvoiceAmountStrong>
                        </InvoiceAmountCol>
                        <InvoicePmCol>
                          {inv.payment_method?.brand ? (
                            <PmBrandBox style={{ width: 36, height: 22 }}>
                              <PaymentMethodBrandIcon brand={inv.payment_method.brand} />
                            </PmBrandBox>
                          ) : null}
                          <span>
                            {inv.payment_method
                              ? `${formatCardBrandLabel(inv.payment_method.brand)} •••• ${inv.payment_method.last4 || "—"}`
                              : "—"}
                          </span>
                        </InvoicePmCol>
                        <InvoicePaidPill>Paid</InvoicePaidPill>
                        <InvoiceRowActions>
                          <InvoiceExpandBtn
                            type="button"
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Hide breakdown" : "Show charge breakdown"}
                            title={hasLines ? (isExpanded ? "Hide breakdown" : "Show charge breakdown") : "No line items"}
                            disabled={!hasLines}
                          >
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.22 }}
                              style={{ display: "inline-flex" }}
                            >
                              <ChevronDown size={16} />
                            </motion.span>
                          </InvoiceExpandBtn>
                          <InvoiceDownloadOutline
                            href={inv.invoice_pdf || undefined}
                            target={inv.invoice_pdf ? "_blank" : undefined}
                            rel={inv.invoice_pdf ? "noopener noreferrer" : undefined}
                            data-disabled={!inv.invoice_pdf ? "true" : undefined}
                            aria-label="Download invoice"
                            onClick={!inv.invoice_pdf ? (e) => e.preventDefault() : undefined}
                          >
                            <Download size={16} />
                          </InvoiceDownloadOutline>
                        </InvoiceRowActions>
                      </InvoiceRowCard>
                      <AnimatePresence initial={false}>
                        {isExpanded && hasLines ? (
                          <motion.div
                            key={`bd-${inv.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div
                              style={{
                                padding: 0,
                                background: T.bg,
                                borderRadius: 8,
                                marginBottom: 6,
                                border: `1px solid ${T.border}`,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  padding: "8px 12px",
                                  fontWeight: 700,
                                  color: T.text,
                                  fontSize: 12,
                                  borderBottom: `1px solid ${T.border}`,
                                  background: "#ffffff",
                                }}
                              >
                                Charge breakdown
                              </div>
                              <BreakdownTable>
                                <tbody>
                                  {inv.lines.map((line, i) => (
                                    <BreakdownTr key={i} $alt={i % 2 === 1}>
                                      <BreakdownTd>{line.description}</BreakdownTd>
                                      <BreakdownTd style={{ textAlign: "right", fontWeight: 500 }}>
                                        {line.currency} ${Number(line.amount).toFixed(2)}
                                      </BreakdownTd>
                                    </BreakdownTr>
                                  ))}
                                  <BreakdownTr $alt={false}>
                                    <BreakdownTd
                                      style={{
                                        paddingTop: 8,
                                        fontWeight: 700,
                                        color: T.text,
                                        borderTop: `1px solid ${T.border}`,
                                      }}
                                    >
                                      Total paid
                                    </BreakdownTd>
                                    <BreakdownTd
                                      style={{
                                        paddingTop: 8,
                                        textAlign: "right",
                                        fontWeight: 700,
                                        color: T.text,
                                        borderTop: `1px solid ${T.border}`,
                                      }}
                                    >
                                      {totalPaid}
                                    </BreakdownTd>
                                  </BreakdownTr>
                                </tbody>
                              </BreakdownTable>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </InvoiceListWrap>
            )}

            {!invoicesLoading && sortedInvoices.length > 0 && (
              <InvoicePaginationBar>
                <InvoicePageInfo>
                  Showing {(invoicePage - 1) * INVOICES_PAGE_SIZE + 1}–
                  {Math.min(invoicePage * INVOICES_PAGE_SIZE, sortedInvoices.length)} of {sortedInvoices.length}
                </InvoicePageInfo>
                <InvoicePaginationActions style={{ alignItems: "center", gap: 12 }}>
                  <SortSegmentWrap>
                    <SortSegmentBtn
                      type="button"
                      $active={invoiceSortOrder === "recent"}
                      onClick={() => setInvoiceSortOrder("recent")}
                    >
                      {invoiceSortOrder === "recent" && (
                        <motion.div
                          layoutId="billing-invoice-sort"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          style={{
                            position: "absolute",
                            inset: 3,
                            borderRadius: 8,
                            background: "#111827",
                            zIndex: 0,
                          }}
                        />
                      )}
                      <span style={{ position: "relative", zIndex: 1, color: invoiceSortOrder === "recent" ? "#fff" : T.sub }}>
                        Newest
                      </span>
                    </SortSegmentBtn>
                    <SortSegmentBtn
                      type="button"
                      $active={invoiceSortOrder === "oldest"}
                      onClick={() => setInvoiceSortOrder("oldest")}
                    >
                      {invoiceSortOrder === "oldest" && (
                        <motion.div
                          layoutId="billing-invoice-sort"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          style={{
                            position: "absolute",
                            inset: 3,
                            borderRadius: 10,
                            background: "#111827",
                            zIndex: 0,
                          }}
                        />
                      )}
                      <span style={{ position: "relative", zIndex: 1, color: invoiceSortOrder === "oldest" ? "#fff" : T.sub }}>
                        Oldest
                      </span>
                    </SortSegmentBtn>
                  </SortSegmentWrap>
                  <InvoicePageCenter>
                    Page {invoicePage} of {invoiceTotalPages}
                  </InvoicePageCenter>
                  <InvoicePageBtn
                    type="button"
                    aria-label="Previous page"
                    disabled={invoicePage <= 1}
                    onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={18} strokeWidth={1.75} />
                  </InvoicePageBtn>
                  <InvoicePageBtn
                    type="button"
                    aria-label="Next page"
                    disabled={invoicePage >= invoiceTotalPages}
                    onClick={() => setInvoicePage((p) => Math.min(invoiceTotalPages, p + 1))}
                  >
                    <ChevronRight size={18} strokeWidth={1.75} />
                  </InvoicePageBtn>
                </InvoicePaginationActions>
              </InvoicePaginationBar>
            )}
          </InvoiceHistoryPanelBody>
        </PlanBillingCard>
      </motion.div>

      {/* Modals */}
      <Modal
        open={cancelModalOpen}
        onCancel={() => !cancelling && setCancelModalOpen(false)}
        footer={null}
        closable={false}
        width={440}
        styles={billingModalStyles}
        destroyOnClose
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !cancelling && setCancelModalOpen(false)}
          >
            <X size={18} />
          </ModalCloseFab>
          <div style={{ padding: "28px 28px 0", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <AlertTriangle size={28} color="#6b7280" strokeWidth={2} />
            </div>
            <ModalSectionTitle>Cancel subscription?</ModalSectionTitle>
          </div>
          <div style={{ padding: "12px 28px 0" }}>
            <ModalBodyText>
              Your subscription will cancel at the end of the current billing period (
              <strong style={{ color: T.text }}>{nextBilling || "see above"}</strong>
              ). You&apos;ll keep access until then.
            </ModalBodyText>
            <ModalInfoBox>
              <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>You&apos;ll keep full access until your billing period ends.</span>
            </ModalInfoBox>
          </div>
          <ModalFooterStack>
            <Button
              type="primary"
              block
              size="large"
              style={{ height: 48, borderRadius: 12, background: BRAND_PRIMARY, borderColor: BRAND_PRIMARY, fontWeight: 600 }}
              onClick={() => setCancelModalOpen(false)}
            >
              Keep my plan
            </Button>
            <Button
              type="text"
              danger
              block
              size="large"
              loading={cancelling}
              onClick={handleCancelConfirm}
              style={{ fontWeight: 500 }}
            >
              {cancelling ? "Cancelling…" : "Cancel at period end"}
            </Button>
          </ModalFooterStack>
        </motion.div>
      </Modal>

      <Modal
        open={detachPmModalOpen}
        onCancel={() => {
          if (!detachPmLoading) {
            setDetachPmModalOpen(false);
            setDetachPmId(null);
            setDetachPmLabel("");
          }
        }}
        footer={null}
        closable={false}
        width={440}
        styles={billingModalStyles}
        destroyOnClose
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!detachPmLoading) {
                setDetachPmModalOpen(false);
                setDetachPmId(null);
                setDetachPmLabel("");
              }
            }}
          >
            <X size={18} />
          </ModalCloseFab>
          <div style={{ padding: "28px 28px 0", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <CreditCard size={26} color="#6b7280" strokeWidth={2} />
            </div>
            <ModalSectionTitle>Remove card?</ModalSectionTitle>
          </div>
          <div style={{ padding: "12px 28px 0" }}>
            {detachPmPreview ? (
              <div style={{ marginBottom: 14 }}>
                <PmRow style={{ border: `1px solid ${T.border}`, background: T.bg }}>
                  <PmRowLeft>
                    <PmBrandBox>
                      <PaymentMethodBrandIcon brand={detachPmPreview.brand} />
                    </PmBrandBox>
                    <PmTextCol>
                      <PmTitleLine>
                        {formatCardBrandLabel(detachPmPreview.brand)} ending in {detachPmPreview.last4 || "—"}
                      </PmTitleLine>
                      <PmMetaLine>
                        {formatExpShort(detachPmPreview.exp_month, detachPmPreview.exp_year)
                          ? `Exp. ${formatExpShort(detachPmPreview.exp_month, detachPmPreview.exp_year)}`
                          : ""}
                      </PmMetaLine>
                    </PmTextCol>
                  </PmRowLeft>
                </PmRow>
              </div>
            ) : null}
            <ModalBodyText style={{ textAlign: "left" }}>
              Remove {detachPmLabel ? <strong>{detachPmLabel}</strong> : "this card"} from your saved payment methods? You must keep at least one card on file for billing.
            </ModalBodyText>
          </div>
          <ModalFooterStack>
            <Button
              type="primary"
              block
              size="large"
              style={{ height: 48, borderRadius: 12, background: BRAND_PRIMARY, borderColor: BRAND_PRIMARY, fontWeight: 600 }}
              onClick={() => {
                if (!detachPmLoading) {
                  setDetachPmModalOpen(false);
                  setDetachPmId(null);
                  setDetachPmLabel("");
                }
              }}
            >
              Keep card
            </Button>
            <Button
              type="text"
              danger
              block
              size="large"
              loading={detachPmLoading}
              onClick={handleDetachPaymentMethodConfirm}
            >
              {detachPmLoading ? "Removing…" : "Remove card"}
            </Button>
          </ModalFooterStack>
        </motion.div>
      </Modal>

      <Modal
        open={subscribeModalOpen}
        onCancel={() => !addonIntentLoading && setSubscribeModalOpen(false)}
        footer={null}
        closable={false}
        destroyOnClose
        width={480}
        styles={billingModalStyles}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", padding: "20px 24px 24px" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileTap={{ scale: 0.95 }}
            onClick={() => !addonIntentLoading && setSubscribeModalOpen(false)}
          >
            <X size={18} />
          </ModalCloseFab>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingRight: 40 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <lord-icon src="https://cdn.lordicon.com/axroojxh.json" trigger="in" style={{ width: 36, height: 36 }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Marketplace email branding</div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "2px 10px",
                  borderRadius: 12,
                  background: T.bg,
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.sub,
                }}
              >
                ${ADDON_PRICE}/month
              </span>
            </div>
          </div>
          {[
            "Custom logo in marketplace booking emails",
            "Your brand colors & footer",
            "Sent under your brand — not generic Classeasily",
          ].map((text, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.25 }}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13, color: "#374151" }}
            >
              <span style={{ color: "#111827", display: "inline-flex" }}>
                <Check size={18} strokeWidth={2.5} />
              </span>
              {text}
            </motion.div>
          ))}
          {addonIntentLoading && (
            <SkeletonPmBlock style={{ marginTop: 16 }}>
              <SkeletonLine style={{ height: 100, borderRadius: 10 }} />
            </SkeletonPmBlock>
          )}
          {addonIntentError && !addonIntentLoading && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 12px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                color: "#991b1b",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{addonIntentError}</span>
            </div>
          )}
          {addonClientSecret && stripePromise && (
            <div style={{ marginTop: 16 }}>
              <Elements stripe={stripePromise} options={{ clientSecret: addonClientSecret, appearance: stripeAppearance, fonts: stripeFonts }}>
                <AddonPaymentForm clientSecret={addonClientSecret} onSuccess={handleAddonPaymentSuccess} />
              </Elements>
            </div>
          )}
        </motion.div>
      </Modal>

      <Modal
        open={addonCancelModalOpen}
        onCancel={() => !addonCancelling && setAddonCancelModalOpen(false)}
        footer={null}
        closable={false}
        width={440}
        styles={billingModalStyles}
        destroyOnClose
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !addonCancelling && setAddonCancelModalOpen(false)}
          >
            <X size={18} />
          </ModalCloseFab>
          <div style={{ padding: "28px 28px 0", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <lord-icon src="https://cdn.lordicon.com/axroojxh.json" trigger="in" style={{ width: 32, height: 32 }} />
            </div>
            <ModalSectionTitle>Cancel Marketplace email branding?</ModalSectionTitle>
          </div>
          <div style={{ padding: "12px 28px 0" }}>
            <ModalBodyText>
              This add-on will cancel at the end of the current billing period (
              <strong style={{ color: T.text }}>{addonNextBilling || "see above"}</strong>
              ). You&apos;ll keep access until then.
            </ModalBodyText>
            <ModalInfoBox>
              <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>You&apos;ll keep full access until your billing period ends.</span>
            </ModalInfoBox>
          </div>
          <ModalFooterStack>
            <Button
              type="primary"
              block
              size="large"
              style={{ height: 48, borderRadius: 12, background: BRAND_PRIMARY, borderColor: BRAND_PRIMARY, fontWeight: 600 }}
              onClick={() => setAddonCancelModalOpen(false)}
            >
              Keep add-on
            </Button>
            <Button type="text" danger block size="large" loading={addonCancelling} onClick={handleAddonCancelConfirm}>
              {addonCancelling ? "Cancelling…" : "Cancel at period end"}
            </Button>
          </ModalFooterStack>
        </motion.div>
      </Modal>

      <Modal
        open={updatePaymentModalOpen}
        onCancel={() => !updatePaymentIntentLoading && setUpdatePaymentModalOpen(false)}
        footer={null}
        closable={false}
        destroyOnClose
        width={480}
        styles={billingModalStyles}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", padding: "20px 24px 24px" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileTap={{ scale: 0.95 }}
            onClick={() => !updatePaymentIntentLoading && setUpdatePaymentModalOpen(false)}
          >
            <X size={18} />
          </ModalCloseFab>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8, paddingRight: 40 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Add payment method</div>
              <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
                This card will be saved for future charges. No charge is made now.
              </p>
            </div>
          </div>
          {savedPaymentMethods.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: T.faint, marginBottom: 8 }}>
                EXISTING CARDS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedPaymentMethods.slice(0, 3).map((pm) => (
                  <PmRow key={pm.id || pm.last4} style={{ opacity: 0.85, pointerEvents: "none" }}>
                    <PmRowLeft>
                      <PmBrandBox>
                        <PaymentMethodBrandIcon brand={pm.brand} />
                      </PmBrandBox>
                      <PmTextCol>
                        <PmTitleLine>
                          {formatCardBrandLabel(pm.brand)} ·••• {pm.last4}
                        </PmTitleLine>
                      </PmTextCol>
                    </PmRowLeft>
                  </PmRow>
                ))}
              </div>
            </div>
          )}
          {updatePaymentIntentLoading && (
            <SkeletonPmBlock>
              <SkeletonLine style={{ height: 120, borderRadius: 10 }} />
            </SkeletonPmBlock>
          )}
          {updatePaymentIntentError && !updatePaymentIntentLoading && (
            <div
              style={{
                padding: "10px 12px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                color: "#991b1b",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{updatePaymentIntentError}</span>
            </div>
          )}
          {updatePaymentClientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: updatePaymentClientSecret, appearance: stripeAppearance, fonts: stripeFonts }}
            >
              <UpdatePaymentMethodForm
                clientSecret={updatePaymentClientSecret}
                onSuccess={handleUpdatePaymentMethodSuccess}
              />
            </Elements>
          )}
        </motion.div>
      </Modal>

      <Modal
        open={Boolean(switchPaymentSecret)}
        onCancel={() => {
          setSwitchPaymentSecret(null);
          setSwitchPaymentTargetPlanId(null);
        }}
        footer={null}
        closable={false}
        destroyOnClose
        width={480}
        styles={billingModalStyles}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", padding: "24px 24px 20px" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSwitchPaymentSecret(null);
              setSwitchPaymentTargetPlanId(null);
            }}
          >
            <X size={18} />
          </ModalCloseFab>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
              paddingRight: 32,
            }}
          >
            <PlanEmblem
              $grad={PLAN_EMBLEM_GRADIENTS[subscription?.planId] || PLAN_EMBLEM_GRADIENTS.basic}
              style={{ width: 28, height: 28, borderRadius: 8, opacity: 0.75 }}
            >
              <span style={{ display: "flex", transform: "scale(0.82)" }}>
                <PlanEmblemIcon planId={subscription?.planId || "basic"} />
              </span>
            </PlanEmblem>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ color: T.sub }}
            >
              <ArrowRight size={22} />
            </motion.div>
            <PlanEmblem $grad={PLAN_EMBLEM_GRADIENTS[switchPaymentTargetPlanId] || PLAN_EMBLEM_GRADIENTS.growth}>
              <PlanEmblemIcon planId={switchPaymentTargetPlanId || "growth"} />
            </PlanEmblem>
          </div>
          <ModalSectionTitle style={{ marginBottom: 8 }}>
            Switch to {getPlanById(switchPaymentTargetPlanId)?.name ?? switchPaymentTargetPlanId ?? "new plan"}
          </ModalSectionTitle>
          <ModalBodyText style={{ marginBottom: 16 }}>
            You may see a prorated charge for the remainder of this billing period.
          </ModalBodyText>
          {switchPaymentSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: switchPaymentSecret, appearance: stripeAppearance, fonts: stripeFonts }}
            >
              <PlanSwitchPaymentForm
                clientSecret={switchPaymentSecret}
                onSuccess={handleSwitchPaymentSuccess}
                onLoadError={handleSwitchPaymentLoadError}
                planName={getPlanById(switchPaymentTargetPlanId)?.name}
              />
            </Elements>
          )}
        </motion.div>
      </Modal>

      <Modal
        open={Boolean(emailMarketingTierPaymentSecret)}
        onCancel={() => {
          setEmailMarketingTierPaymentSecret(null);
          setEmailMarketingTierPaymentLabel(null);
        }}
        footer={null}
        closable={false}
        destroyOnClose
        width={480}
        styles={billingModalStyles}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", padding: "24px 24px 20px" }}
        >
          <ModalCloseFab
            type="button"
            aria-label="Close"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEmailMarketingTierPaymentSecret(null);
              setEmailMarketingTierPaymentLabel(null);
            }}
          >
            <X size={18} />
          </ModalCloseFab>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 16,
              paddingRight: 32,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Mail size={22} strokeWidth={2} />
            </div>
          </div>
          <ModalSectionTitle style={{ marginBottom: 8 }}>
            Complete payment — {emailMarketingTierPaymentLabel || "Email marketing"}
          </ModalSectionTitle>
          <ModalBodyText style={{ marginBottom: 16 }}>
            You may see a prorated charge for the remainder of this billing period.
          </ModalBodyText>
          {emailMarketingTierPaymentSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: emailMarketingTierPaymentSecret, appearance: stripeAppearance, fonts: stripeFonts }}
            >
              <PlanSwitchPaymentForm
                clientSecret={emailMarketingTierPaymentSecret}
                onSuccess={handleEmailMarketingTierPaymentSuccess}
                onLoadError={handleEmailMarketingTierPaymentLoadError}
                planName={emailMarketingTierPaymentLabel || "Email marketing"}
              />
            </Elements>
          )}
        </motion.div>
      </Modal>

      <EmailMarketingTierModal
        open={emailMarketingTierModalOpen}
        onClose={() => setEmailMarketingTierModalOpen(false)}
        apiTiers={emTiers}
        isSubscribed={emActive}
        currentTierKey={emCurrentTierKey}
        canInstantSubscribe={emCanInstant}
        subscribing={emSubscribing}
        onCheckout={async (priceId) => {
          await startEmailMarketingCheckout(priceId);
        }}
        onInstantSubscribe={handleEmailMarketingInstant}
        onChangeTier={handleEmailMarketingChangeTier}
      />
      </MainStack>
    </PageOuter>
  );
}