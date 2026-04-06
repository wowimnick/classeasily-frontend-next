"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button, Modal, message as antMessage } from "antd";
import {
  ArrowRight, ArrowUp, ArrowDown, Loader2, RefreshCw, Lock,
  CreditCard, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Download, SlidersHorizontal, Trash2,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements, PaymentElement,
  PaymentRequestButtonElement, useStripe, useElements,
} from "@stripe/react-stripe-js";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { useSubscription } from "@/context/SubscriptionContext";
import { getPlanById, PLANS, PLAN_IDS, isUpgrade, WIDGET_PLAN_COMPARISON_ROWS } from "@/lib/subscriptionPlans";
import message from "@/lib/message";
import { businessService, API_ENDPOINTS } from "@/services/apiService";
import axiosInstance from "@/lib/axiosInstance";
import { theme as appTheme } from "@/components/theme";
import EmailMarketingTierModal from "./EmailMarketingTierModal";

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

// ─── animations ───────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg) } to { transform: rotate(360deg) }`;

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

const SpinIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
  color: ${T.faint};
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  font-size: 13px;
  color: ${T.faint};
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
  border-radius: 999px;
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
  border-radius: 999px;
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
  border-radius: 4px;
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
  border-radius: 6px;
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
  grid-template-columns: minmax(220px, 1.15fr) repeat(3, minmax(0, 1fr));
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
`;

const PlanCompareTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 560px;
`;

const PcThFeature = styled.th`
  text-align: left;
  padding: 12px 14px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 220px;
  max-width: 320px;
  box-shadow: 1px 0 0 #e5e7eb;
`;

const PcThPlan = styled.th`
  text-align: center;
  padding: 12px 10px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  width: 1%;
`;

const PcTdFeature = styled.td`
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  color: #374151;
  font-weight: 500;
  line-height: 1.4;
  position: sticky;
  left: 0;
  background: #ffffff;
  z-index: 1;
  min-width: 220px;
  max-width: 320px;
  box-shadow: 1px 0 0 #f3f4f6;
`;

const PcTdMark = styled.td`
  text-align: center;
  padding: 10px 8px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
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
  padding: 12px 14px;
  font-weight: 700;
  font-size: 13px;
  color: #111827;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  align-self: stretch;
  display: flex;
  align-items: center;
`;

const GridPlanHead = styled.div`
  grid-column: ${({ $col }) => $col};
  grid-row: 2;
  padding: 12px 10px;
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
`;

const GridFeatCell = styled.div`
  grid-column: 1;
  grid-row: ${({ $row }) => $row};
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  border-right: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  display: flex;
  align-items: center;
`;

const GridMarkCell = styled.div`
  grid-column: ${({ $col }) => $col};
  grid-row: ${({ $row }) => $row};
  padding: 10px 8px;
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
  border-radius: 4px;
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
  border-radius: 4px;
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
  border-radius: 6px;
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
  basic: "linear-gradient(135deg, #93c5fd, #60a5fa)",
  growth: "linear-gradient(135deg, #a7f3d0, #34d399)",
  advanced: "linear-gradient(135deg, #fcd34d, #f59e0b)",
};

const PLAN_TAGLINES = {
  basic: "Widget essentials & marketplace",
  growth: "Everything you needed",
  advanced: "Power team with scale",
};

// ─── invoice section ──────────────────────────────────────────────────────────
const SortBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 11px;
  min-width: 0;
  background: ${T.white};
  border: 1px solid ${T.border};
  border-radius: 8px;
  font-size: 13px;
  color: ${T.text};
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: ${T.bg}; }

  @media (max-width: 380px) {
    white-space: normal;
    text-align: center;
  }
`;

const InvoicePaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const InvoicePageInfo = styled.span`
  font-size: 13px;
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
  width: 34px;
  height: 34px;
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
    opacity: 0.4;
    cursor: default;
  }
`;

const InvoiceRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto 26px;
  align-items: center;
  gap: 8px 12px;
  padding: 12px 16px;
  border-bottom: 1px solid ${T.border};
  &:last-child { border-bottom: none; }

  @media (min-width: 640px) {
    grid-template-columns: 1fr 110px 90px 100px 28px 26px;
    padding: 12px 20px;
  }

  @media (max-width: 639px) {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 13px 16px;
  }
`;

const InvoiceBreakdownRow = styled.div`
  padding: 12px 20px 14px;
  background: ${T.bg};
  border-bottom: 1px solid ${T.border};
  font-size: 13px;
  color: ${T.sub};
  @media (max-width: 639px) { padding: 12px 16px 14px; }
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
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  &:hover:not(:disabled) { background: ${T.border}; color: ${T.text}; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const InvoiceId = styled.span`
  font-size: 13.5px; font-weight: 500; color: ${T.text};

  @media (max-width: 639px) {
    display: none;
  }
`;

const InvoiceCell = styled.span`
  font-size: 13px; color: ${T.sub};

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
  font-size: 13px;
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
  color: ${T.faint}; padding: 3px; border-radius: 4px;
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
  border-radius: 20px; font-size: 11.5px; margin-top: 8px;
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
  border-radius: 8px;
  overflow: hidden;
  box-shadow: none;
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

const SectionDivider = styled.div`
  height: 1px;
  background: ${T.border};
  margin: 8px 0;
`;

const PlanBillingBody = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PlanBillingSection = styled.div`
  box-sizing: border-box;
  flex: 1 1 0;
  min-width: 0;
  padding: 18px 20px;
  border-right: ${({ $noBorder }) => ($noBorder ? "none" : `1px solid ${T.border}`)};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  @media (max-width: 640px) {
    flex: 1 1 auto;
    width: 100%;
    border-right: none;
    border-bottom: ${({ $noBorder }) => ($noBorder ? "none" : `1px solid ${T.border}`)};
  }
`;

const PlanBillingPaymentStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
`;

const PlanBillingSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${T.faint};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
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
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  height: 30px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  svg {
    max-width: 46px;
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
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
`;

const PmMetaLine = styled.div`
  font-size: 13px;
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
  padding: 2px 6px;
  border-radius: 999px;
  background: #000000;
  color: #ffffff;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const PmExpiredBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const PmSetDefaultLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  font-weight: 500;
  color: #2563eb;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.2;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
    text-decoration: none;
  }
`;

const PmAddNewLinkBtn = styled.button`
  margin-top: 12px;
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 500;
  color: #2563eb;
  cursor: pointer;
  line-height: 1.4;

  &:hover {
    text-decoration: underline;
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
  border-radius: 6px;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #6b7280;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

// ─── add-ons ──────────────────────────────────────────────────────────────────
const AddonsStack = styled.div`
  overflow: hidden;
`;

const AddonCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  &:last-child { border-bottom: none; }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    padding: 16px 16px;
    gap: 14px;
  }
`;

const AddonIconBox = styled.div`
  width: 42px;
  height: 42px;
  min-width: 42px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
`;

const AddonBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const AddonTitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 3px;
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
  border-radius: 4px;
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
  border-radius: 99px;
  background: #dcfce7;
  color: #15803d;
  font-size: 11px;
  font-weight: 600;
`;

const AddonCancelsBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 600;
`;

const AddonDesc = styled.p`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
`;

const AddonUsageWrap = styled.div`
  margin-top: 8px;
`;

const AddonUsageBar = styled.div`
  height: 4px;
  border-radius: 99px;
  background: #e5e7eb;
  margin-top: 5px;
  overflow: hidden;
`;

const AddonUsageFill = styled.div`
  height: 100%;
  border-radius: 99px;
  background: #111827;
  width: ${({ $pct }) => Math.min(100, $pct ?? 0)}%;
`;

const AddonSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
  min-width: 130px;

  @media (max-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    min-width: 0;
  }
`;

const AddonPriceLabel = styled.div`
  text-align: right;
  line-height: 1.2;
`;

const AddonPriceStrong = styled.span`
  font-size: 15px;
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
  gap: 5px;
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
  border-radius: 6px;
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

const AddonPrimaryBtn = styled.button`
  padding: 7px 14px;
  border-radius: 6px;
  border: 1px solid #111827;
  background: #111827;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #1f2937; }
  &:disabled { opacity: 0.55; cursor: default; }
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
        <AddonExpressCheckoutButton clientSecret={clientSecret} onSuccess={onSuccess} onPaymentRequestReady={() => setHasExpressPay(true)} />
        {hasExpressPay && (
          <div style={dividerStyle}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ padding: "0 12px" }}>or</span>
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
              <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
                {err}
              </div>
            )}
            <Button type="primary" htmlType="submit"
              disabled={!stripe || !elements || !ready || submitting}
              loading={submitting} block
              style={{ background: SEL_COLOR, borderColor: SEL_COLOR }}
              icon={<Lock size={14} />}>
              {submitting ? "Processing…" : `Pay $${ADDON_PRICE}/month`}
            </Button>
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
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
          {err}
        </div>
      )}
      <Button
        type="primary"
        htmlType="submit"
        disabled={!stripe || !elements || !ready || submitting}
        loading={submitting}
        block
        style={{ background: SEL_COLOR, borderColor: SEL_COLOR }}
        icon={<Lock size={14} />}
      >
        {submitting ? "Processing…" : `Confirm payment to switch to ${planName || "new plan"}`}
      </Button>
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
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
          {err}
        </div>
      )}
      <Button
        type="primary"
        htmlType="submit"
        disabled={!stripe || !elements || !ready || submitting}
        loading={submitting}
        block
        style={{ background: SEL_COLOR, borderColor: SEL_COLOR }}
        icon={<Lock size={14} />}
      >
        {submitting ? "Saving…" : "Update payment method"}
      </Button>
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
      <span style={{ display: "inline-flex", justifyContent: "center", color: "#059669" }} aria-label="Included">
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
        borderRadius: `${appTheme.token.borderRadius}px`,
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
        ".Tab": { borderColor: appTheme.token.colorBorder, borderRadius: `${appTheme.token.borderRadius}px`, fontFamily, fontWeight: "600" },
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
        grad: PLAN_GRADIENTS[plan.id] || "linear-gradient(135deg, #a5b4fc, #818cf8)",
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
    const result = await subscribe(planId);
    setSwitchPlanLoading(null);
    if (result.success) {
      if (result.data?.requires_payment && result.data?.client_secret) {
        setSwitchPaymentSecret(result.data.client_secret);
        setSwitchPaymentTargetPlanId(result.data.target_plan_id ?? planId);
        return;
      }
      await refreshBillingViews();
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
  };

  const handleSwitchPaymentSuccess = useCallback(async () => {
    const planName = getPlanById(switchPaymentTargetPlanId)?.name ?? switchPaymentTargetPlanId;
    setSwitchPaymentSecret(null);
    setSwitchPaymentTargetPlanId(null);
    await refreshBillingViewsWithRetries();
    message.success(`Switched to ${planName} plan.`);
  }, [switchPaymentTargetPlanId, refreshBillingViewsWithRetries]);

  const handleSwitchPaymentLoadError = useCallback(() => {
    setSwitchPaymentSecret(null);
    setSwitchPaymentTargetPlanId(null);
    antMessage.error(
      "This payment link can't be used anymore (already used or expired). Please try switching plan again."
    );
  }, []);

  const handleCancelConfirm = async () => {
    setCancelling(true);
    const result = await cancel();
    setCancelling(false); setCancelModalOpen(false);
    if (result.success) { await refreshBillingViews(); message.success("Subscription will cancel at the end of the billing period."); }
    else antMessage.error(result.error || "Failed to cancel.");
  };

  const handleReactivate = async () => {
    const result = await reactivate();
    if (result.success) { await refreshBillingViews(); message.success("Subscription reactivated."); }
    else antMessage.error(result.error || "Failed to reactivate.");
  };

  const marketplaceEmail = addons?.marketplace_email_branding;
  const addonActive = marketplaceEmail?.active === true;
  const canInstantSubscribeAddon = marketplaceEmail?.canInstantSubscribe === true;
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
      await refreshBillingViews();
      refetchAddons?.();
      message.success("Email marketing plan updated.");
    } else antMessage.error(r.error || "Could not change plan.");
    return r;
  };

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
                    <PcTdFeature title={row.tooltip || undefined}>{row.label}</PcTdFeature>
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
                    {row.label}
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

      <SectionDivider />

      {/* Active subscription + Payment method — redesigned */}
      <PlanBillingCard>
        <PlanBillingHeader>
          <SectionTitle style={{ margin: 0 }}>Widget plan &amp; billing</SectionTitle>
          <PlanBillingHeaderNote>
            Upgrades take effect immediately. Downgrades and cancellations take effect at the end of the billing period.
          </PlanBillingHeaderNote>
        </PlanBillingHeader>

        {subLoading ? (
          <LoadingRow style={{ padding: "20px 20px" }}><SpinIcon size={16} /><span>Loading…</span></LoadingRow>
        ) : !subscription?.planId ? (
          <div style={{
            margin: 20, background: T.bg, border: `1px dashed ${T.border}`,
            borderRadius: 10, padding: 24, textAlign: "center",
          }}>
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 14px", lineHeight: 1.5 }}>
              You don&apos;t have an active widget plan. Subscribe to embed the booking widget on your website.
            </p>
            <Link href="/booking-widget">
              <Button type="primary" icon={<ArrowRight size={14} />} size="small"
                style={{ background: SEL_COLOR, borderColor: SEL_COLOR }}>
                View plans
              </Button>
            </Link>
          </div>
        ) : (
          <PlanBillingBody>
            {/* Left: Current plan */}
            <PlanBillingSection>
              <PlanBillingSectionLabel>Current plan</PlanBillingSectionLabel>
              <PlanBillingPlanName>
                {currentPlan?.name ?? subscription.planId}
                {subscription.cancelAtPeriodEnd && (
                  <Badge style={{ marginTop: 0, marginLeft: 4 }}>Cancels {nextBilling || "at period end"}</Badge>
                )}
                {scheduledDowngrade?.planId && !subscription.cancelAtPeriodEnd && (
                  <Badge style={{ marginTop: 0, marginLeft: 4, background: T.bg, color: T.sub }}>
                    Switching to {getPlanById(scheduledDowngrade.planId)?.name ?? scheduledDowngrade.planId}
                    {scheduledDowngrade.effectiveDate
                      ? ` ${new Date(scheduledDowngrade.effectiveDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                      : " at period end"}
                  </Badge>
                )}
              </PlanBillingPlanName>
              <PlanBillingPlanPrice>
                ${currentPlan?.price ?? 0}/mo
                {currentPlan?.commission ? ` · ${currentPlan.commission}% per booking` : ""}
                {nextBilling && !subscription.cancelAtPeriodEnd ? ` · Renews ${nextBilling}` : ""}
              </PlanBillingPlanPrice>
              <PlanBillingActions>
                {subscription.cancelAtPeriodEnd ? (
                  <Button size="small" icon={<RefreshCw size={12} />} onClick={handleReactivate}
                    style={{ background: SEL_COLOR, borderColor: SEL_COLOR, color: "white", fontSize: 12 }}>
                    Reactivate
                  </Button>
                ) : (
                  <>
                    {PLANS.filter((p) => p.id !== subscription.planId).map((p) => (
                      <Button
                        key={p.id}
                        size="small"
                        style={{ fontSize: 12 }}
                        loading={switchPlanLoading === p.id}
                        disabled={switchPlanLoading !== null}
                        onClick={() => handleSwitchPlan(p.id)}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {isUpgrade(subscription.planId, p.id) ? (
                          <><ArrowUp size={12} /> Upgrade</>
                        ) : (
                          <><ArrowDown size={12} /> Downgrade</>
                        )}{" "}
                        to {p.name}
                      </span>
                      </Button>
                    ))}
                    <Button size="small" danger onClick={() => setCancelModalOpen(true)} style={{ fontSize: 12 }}>
                      Cancel
                    </Button>
                  </>
                )}
              </PlanBillingActions>
            </PlanBillingSection>

            {/* Right: Payment method */}
            <PlanBillingSection $noBorder>
              <PlanBillingSectionLabel>Payment method</PlanBillingSectionLabel>
              {defaultPaymentMethodLoading ? (
                <LoadingRow style={{ padding: 0 }}><SpinIcon size={14} /><span>Loading…</span></LoadingRow>
              ) : showPaymentMethodSection ? (
                <PlanBillingPaymentStack>
                  {savedPaymentMethods.length > 0 ? (
                    <PmListOuter>
                      <PmListWrap>
                        {savedPaymentMethods.map((pm) => {
                          const isDefault = Boolean(pm.id && defaultPaymentMethodId && pm.id === defaultPaymentMethodId);
                          const expired = isCardExpired(pm.exp_month, pm.exp_year);
                          const expStr = formatExpShort(pm.exp_month, pm.exp_year);
                          const brandLabel = formatCardBrandLabel(pm.brand);
                          const last4 = pm.last4 || "––––";
                          const canDetach = savedPaymentMethods.length > 1 && Boolean(pm.id);
                          return (
                            <PmRow key={pm.id || `${pm.brand}-${last4}`}>
                              <PmRowLeft>
                                <PmBrandBox>
                                  <PaymentMethodBrandIcon brand={pm.brand} />
                                </PmBrandBox>
                                <PmTextCol>
                                  <PmTitleLine>
                                    {brandLabel} ending in {last4}
                                  </PmTitleLine>
                                  <PmMetaLine>
                                    {expStr ? `Exp. date ${expStr}` : "Expiration not available"}
                                  </PmMetaLine>
                                </PmTextCol>
                              </PmRowLeft>
                              <PmRowRight>
                                <PmStatusSlot>
                                  {expired && <PmExpiredBadge>Expired</PmExpiredBadge>}
                                  {isDefault && <PmDefaultBadge>Default</PmDefaultBadge>}
                                  {!isDefault && !expired && pm.id && (
                                    <PmSetDefaultLink
                                      type="button"
                                      disabled={Boolean(settingDefaultPmId)}
                                      onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                                    >
                                      {settingDefaultPmId === pm.id ? "Updating…" : "Set as default"}
                                    </PmSetDefaultLink>
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
                          );
                        })}
                      </PmListWrap>
                    </PmListOuter>
                  ) : (
                    <PlanBillingPlanPrice style={{ marginTop: 6 }}>
                      No payment method on file yet.
                    </PlanBillingPlanPrice>
                  )}
                  <PmAddNewLinkBtn type="button" onClick={() => setUpdatePaymentModalOpen(true)}>
                    + Add new payment method
                  </PmAddNewLinkBtn>
                </PlanBillingPaymentStack>
              ) : (
                <PlanBillingPlanPrice style={{ marginTop: 4 }}>
                  No payment method on file yet.
                </PlanBillingPlanPrice>
              )}
            </PlanBillingSection>
          </PlanBillingBody>
        )}
      </PlanBillingCard>

      <SectionDivider />

      {/* Add-ons */}
      <PlanBillingCard>
        <PlanBillingHeader>
          <SectionTitle style={{ margin: 0 }}>Add-ons</SectionTitle>
          <PlanBillingHeaderNote>Billed separately from your widget plan.</PlanBillingHeaderNote>
        </PlanBillingHeader>

        {addonsLoading ? (
          <PlanBillingPanelBody>
            <LoadingRow style={{ padding: 0 }}><SpinIcon size={15} /><span>Loading add-ons…</span></LoadingRow>
          </PlanBillingPanelBody>
        ) : (
          <AddonsStack>
            {/* ── Marketplace email branding ── */}
            <AddonCard>
              <AddonIconBox>
                <lord-icon src="https://cdn.lordicon.com/axroojxh.json" trigger="in" style={{ width: 28, height: 28 }} />
              </AddonIconBox>
              <AddonBody>
                <AddonTitleRow>
                  <AddonName>Marketplace email branding</AddonName>
                  <NewBadge>New</NewBadge>
                  {addonActive && (
                    marketplaceEmail?.cancelAtPeriodEnd
                      ? <AddonCancelsBadge>Cancels {addonNextBilling}</AddonCancelsBadge>
                      : <AddonActiveBadge>Active · Renews {addonNextBilling}</AddonActiveBadge>
                  )}
                </AddonTitleRow>
                <AddonDesc>Custom logo, colors &amp; footer in marketplace booking emails — sent under your brand.</AddonDesc>
              </AddonBody>
              <AddonSide>
                <AddonPriceLabel>
                  <AddonPriceStrong>+${ADDON_PRICE}</AddonPriceStrong>
                  <AddonPriceSuffix> / mo</AddonPriceSuffix>
                </AddonPriceLabel>
                <AddonCtaGroup>
                  {addonActive ? (
                    marketplaceEmail?.cancelAtPeriodEnd ? (
                      <AddonPrimaryBtn type="button" onClick={handleAddonReactivate}>
                        <RefreshCw size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />Reactivate
                      </AddonPrimaryBtn>
                    ) : (
                      <AddonOutlineBtn type="button" onClick={() => setAddonCancelModalOpen(true)}>Cancel</AddonOutlineBtn>
                    )
                  ) : canInstantSubscribeAddon ? (
                    <>
                      <AddonPrimaryBtn type="button" onClick={handleInstantSubscribeAddon} disabled={addonSubscribing}>
                        {addonSubscribing ? "Subscribing…" : "Add to plan"}
                      </AddonPrimaryBtn>
                      <SmallLink type="button" onClick={() => setSubscribeModalOpen(true)} style={{ textAlign: "right" }}>Use different card</SmallLink>
                    </>
                  ) : (
                    <AddonPrimaryBtn type="button" onClick={() => setSubscribeModalOpen(true)}>Add to plan</AddonPrimaryBtn>
                  )}
                </AddonCtaGroup>
              </AddonSide>
            </AddonCard>

            {/* ── Email marketing campaigns ── */}
            <AddonCard>
              <AddonIconBox>
                <lord-icon src="https://cdn.lordicon.com/cfkiwvcc.json" trigger="in" delay="2000" style={{ width: 28, height: 28 }} />
              </AddonIconBox>
              <AddonBody>
                <AddonTitleRow>
                  <AddonName>Email marketing campaigns</AddonName>
                  {emActive && (
                    emailMkt?.cancelAtPeriodEnd
                      ? <AddonCancelsBadge>Cancels {emNextBilling}</AddonCancelsBadge>
                      : <AddonActiveBadge>Active · Renews {emNextBilling}</AddonActiveBadge>
                  )}
                </AddonTitleRow>
                <AddonDesc>Broadcast to your contacts with tiered monthly limits. Transactional emails are not counted.</AddonDesc>
                {emActive && emUsage && (
                  <AddonUsageWrap>
                    <AddonDesc style={{ fontSize: 12 }}>
                      {(emUsage.used_this_period ?? 0).toLocaleString()} / {(emUsage.monthly_limit ?? 0).toLocaleString()} sends this period
                    </AddonDesc>
                    <AddonUsageBar>
                      <AddonUsageFill $pct={emUsage.monthly_limit ? (emUsage.used_this_period / emUsage.monthly_limit) * 100 : 0} />
                    </AddonUsageBar>
                  </AddonUsageWrap>
                )}
              </AddonBody>
              <AddonSide>
                <AddonPriceLabel>
                  <AddonPriceStrong>From $6</AddonPriceStrong>
                  <AddonPriceSuffix> / mo</AddonPriceSuffix>
                </AddonPriceLabel>
                <AddonCtaGroup>
                  {emActive ? (
                    emailMkt?.cancelAtPeriodEnd ? (
                      <AddonPrimaryBtn type="button" onClick={handleEmailMarketingReactivate}>
                        <RefreshCw size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />Reactivate
                      </AddonPrimaryBtn>
                    ) : (
                      <AddonCtaRow>
                        <AddonPrimaryBtn type="button" onClick={() => setEmailMarketingTierModalOpen(true)}>Change plan</AddonPrimaryBtn>
                        <AddonOutlineBtn type="button" onClick={handleEmailMarketingCancel}>Cancel</AddonOutlineBtn>
                      </AddonCtaRow>
                    )
                  ) : (
                    <AddonPrimaryBtn type="button" onClick={() => setEmailMarketingTierModalOpen(true)}>Add to plan</AddonPrimaryBtn>
                  )}
                </AddonCtaGroup>
              </AddonSide>
            </AddonCard>
          </AddonsStack>
        )}
      </PlanBillingCard>

      <SectionDivider />

      {/* Previous invoices */}
      <PlanBillingCard>
        <PlanBillingHeader>
          <SectionTitle style={{ margin: 0 }}>Previous invoices</SectionTitle>
          <PlanBillingHeaderNote>Download PDFs and view line-item breakdowns.</PlanBillingHeaderNote>
        </PlanBillingHeader>

        <PlanBillingPanelBody>
          <Card $pad="0" style={{ overflow: "hidden" }}>
          {invoicesLoading ? (
            <LoadingRow style={{ padding: 24 }}><SpinIcon size={16} /><span>Loading invoices…</span></LoadingRow>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.sub }}>
              {hasStripeSubscription
                ? "No invoices yet. Invoices appear here after your first payment."
                : "Invoices appear after you subscribe through Stripe (e.g. booking widget checkout). Plan changes above update your access only until then."}
            </div>
          ) : sortedInvoices.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.sub }}>
              No paid invoices to show yet.
            </div>
          ) : (
            paginatedInvoices.map((inv) => {
              const dateStr = inv.created
                ? new Date(inv.created).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                : "—";
              const amountStr = inv.currency && inv.amount_paid != null
                ? `${inv.currency} $${Number(inv.amount_paid).toFixed(2)}`
                : "—";
              const cardStr = inv.payment_method
                ? `${inv.payment_method.brand} •••• ${inv.payment_method.last4}`
                : "—";
              const hasLines = Array.isArray(inv.lines) && inv.lines.length > 0;
              const isExpanded = expandedInvoiceId === inv.id;
              return (
                <React.Fragment key={inv.id}>
                  <InvoiceRow>
                    <InvoiceId>{inv.number || inv.id}</InvoiceId>
                    <InvoiceCell>{dateStr}</InvoiceCell>
                    <InvoiceCell>{amountStr}</InvoiceCell>
                    <InvoiceCell style={{ fontSize: 12 }}>{cardStr}</InvoiceCell>
                    <InvoiceExpandBtn
                      type="button"
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Hide breakdown" : "Show charge breakdown"}
                      title={hasLines ? (isExpanded ? "Hide breakdown" : "Show charge breakdown") : "No line items"}
                      disabled={!hasLines}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </InvoiceExpandBtn>
                    {/* Mobile combined cell */}
                    <MobileInvoiceInfo>
                      <MobileInvoiceId>{inv.number || inv.id}</MobileInvoiceId>
                      <MobileInvoiceMeta>{dateStr}{amountStr !== "—" ? ` · ${amountStr}` : ""}{cardStr !== "—" ? ` · ${cardStr}` : ""}</MobileInvoiceMeta>
                    </MobileInvoiceInfo>
                    <DownloadBtn
                      as={inv.invoice_pdf ? "a" : "span"}
                      href={inv.invoice_pdf || undefined}
                      target={inv.invoice_pdf ? "_blank" : undefined}
                      rel={inv.invoice_pdf ? "noopener noreferrer" : undefined}
                      aria-label="Download invoice"
                      style={{ display: "inline-flex", cursor: inv.invoice_pdf ? "pointer" : "default", opacity: inv.invoice_pdf ? 1 : 0.5 }}
                    >
                      <Download size={14} />
                    </DownloadBtn>
                    <MobileDownloadBtn
                      href={inv.invoice_pdf || undefined}
                      target={inv.invoice_pdf ? "_blank" : undefined}
                      rel={inv.invoice_pdf ? "noopener noreferrer" : undefined}
                      data-disabled={!inv.invoice_pdf ? "true" : undefined}
                      aria-label="Download invoice"
                    >
                      <Download size={14} />
                    </MobileDownloadBtn>
                  </InvoiceRow>
                  {isExpanded && hasLines && (
                    <InvoiceBreakdownRow>
                      <div style={{ fontWeight: 600, color: "inherit", marginBottom: 8 }}>Charge breakdown</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {inv.lines.map((line, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>
                            {line.description} — {line.currency} ${Number(line.amount).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </InvoiceBreakdownRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </Card>

          {!invoicesLoading && sortedInvoices.length > 0 && (
            <InvoicePaginationBar>
              <InvoicePageInfo>
                Showing{" "}
                {(invoicePage - 1) * INVOICES_PAGE_SIZE + 1}
                –
                {Math.min(invoicePage * INVOICES_PAGE_SIZE, sortedInvoices.length)}
                {" "}of {sortedInvoices.length}
              </InvoicePageInfo>
              <InvoicePaginationActions>
                <SortBtn type="button" onClick={() => setInvoiceSortOrder((o) => (o === "recent" ? "oldest" : "recent"))}>
                  <SlidersHorizontal size={13} color={T.sub} />
                  {invoiceSortOrder === "recent" ? "Most recent" : "Oldest first"}
                </SortBtn>
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
        </PlanBillingPanelBody>
      </PlanBillingCard>

      {/* Modals */}
      <Modal title="Cancel subscription" open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)} onOk={handleCancelConfirm}
        okText={cancelling ? "Cancelling…" : "Cancel at period end"}
        okButtonProps={{ danger: true, loading: cancelling }}
        cancelText="Keep subscription">
        <p style={{ margin: 0 }}>
          Your subscription will cancel at the end of the current billing period ({nextBilling || "see above"}).
          You&apos;ll keep access until then.
        </p>
      </Modal>

      <Modal
        title="Remove payment method"
        open={detachPmModalOpen}
        onCancel={() => {
          if (!detachPmLoading) {
            setDetachPmModalOpen(false);
            setDetachPmId(null);
            setDetachPmLabel("");
          }
        }}
        onOk={handleDetachPaymentMethodConfirm}
        okText={detachPmLoading ? "Removing…" : "Remove"}
        okButtonProps={{ danger: true, loading: detachPmLoading }}
        cancelText="Keep card"
      >
        <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
          Remove {detachPmLabel ? <strong>{detachPmLabel}</strong> : "this card"} from your saved payment methods?
          You must keep at least one card on file for billing.
        </p>
      </Modal>

      <Modal title="Subscribe to Marketplace email branding" open={subscribeModalOpen}
        onCancel={() => !addonIntentLoading && setSubscribeModalOpen(false)}
        footer={null} destroyOnClose width={440}>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: T.sub }}>
          This add-on is <strong>${ADDON_PRICE}/month</strong>, billed as a separate subscription. Payment is secure and stays on this page.
        </p>
        {addonIntentLoading && (
          <LoadingRow><SpinIcon size={16} /><span>Preparing payment form…</span></LoadingRow>
        )}
        {addonIntentError && !addonIntentLoading && (
          <div style={{ padding: "12px", background: "#fef2f2", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
            {addonIntentError}
          </div>
        )}
        {addonClientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret: addonClientSecret, appearance: stripeAppearance, fonts: stripeFonts }}>
            <AddonPaymentForm clientSecret={addonClientSecret} onSuccess={handleAddonPaymentSuccess} />
          </Elements>
        )}
      </Modal>

      <Modal title="Cancel add-on" open={addonCancelModalOpen}
        onCancel={() => setAddonCancelModalOpen(false)} onOk={handleAddonCancelConfirm}
        okText={addonCancelling ? "Cancelling…" : "Cancel at period end"}
        okButtonProps={{ danger: true, loading: addonCancelling }}
        cancelText="Keep add-on">
        <p style={{ margin: 0 }}>
          Marketplace email branding will cancel at the end of the current billing period ({addonNextBilling || "see above"}).
          You&apos;ll keep access until then.
        </p>
      </Modal>

      <Modal
        title="Update payment method"
        open={updatePaymentModalOpen}
        onCancel={() => !updatePaymentIntentLoading && setUpdatePaymentModalOpen(false)}
        footer={null}
        destroyOnClose
        width={440}
      >
        <p style={{ margin: "0 0 16px", fontSize: 13, color: T.sub }}>
          Enter a new card below. It will be used for plan renewals and add-ons. No charge is made when updating.
        </p>
        {updatePaymentIntentLoading && (
          <LoadingRow><SpinIcon size={16} /><span>Preparing form…</span></LoadingRow>
        )}
        {updatePaymentIntentError && !updatePaymentIntentLoading && (
          <div style={{ padding: "12px", background: "#fef2f2", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
            {updatePaymentIntentError}
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
      </Modal>

      <Modal
        title={`Confirm payment to switch to ${getPlanById(switchPaymentTargetPlanId)?.name ?? switchPaymentTargetPlanId ?? "new"} plan`}
        open={Boolean(switchPaymentSecret)}
        onCancel={() => { setSwitchPaymentSecret(null); setSwitchPaymentTargetPlanId(null); }}
        footer={null}
        destroyOnClose
        width={440}
      >
        <p style={{ margin: "0 0 16px", fontSize: 13, color: T.sub }}>
          Complete payment below to switch to the {getPlanById(switchPaymentTargetPlanId)?.name ?? switchPaymentTargetPlanId ?? "chosen"} plan. You may see a prorated charge for the remainder of this billing period.
        </p>
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