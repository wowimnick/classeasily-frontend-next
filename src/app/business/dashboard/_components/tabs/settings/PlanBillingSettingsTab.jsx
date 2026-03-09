"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button, Modal, message as antMessage } from "antd";
import {
  ArrowRight, ArrowUp, ArrowDown, Loader2, RefreshCw, Mail, Lock,
  CreditCard, ChevronDown, ChevronUp, Check, Download,
  Search, SlidersHorizontal, Package,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements, PaymentElement,
  PaymentRequestButtonElement, useStripe, useElements,
} from "@stripe/react-stripe-js";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { useSubscription } from "@/context/SubscriptionContext";
import { getPlanById, PLANS, isUpgrade } from "@/lib/subscriptionPlans";
import message from "@/lib/message";
import { businessService, API_ENDPOINTS } from "@/services/apiService";
import axiosInstance from "@/lib/axiosInstance";
import { theme as appTheme } from "@/components/theme";

// ─── stripe setup ─────────────────────────────────────────────────────────────
const stripePromise =
  typeof window !== "undefined"
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "")
    : null;

const ADDON_PRICE = 7;
const SEL_COLOR = "#111827";

const paymentElementOptions = {
  layout: "tabs",
  wallets: { applePay: "never", googlePay: "never" },
  defaultValues: { billingDetails: { address: { country: "CA" } } },
  fields: { billingDetails: { address: { country: "never", postalCode: "never" } } },
};

// ─── animations ───────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg) } to { transform: rotate(360deg) }`;
const fadeUp = keyframes`from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: translateY(0) }`;

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

// ─── shared primitives (glassy) ───────────────────────────────────────────────
const Card = styled.div`
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 12px;
  padding: ${({ $pad }) => $pad ?? "20px"};
  animation: ${fadeUp} 0.2s ease;

  @media (max-width: 640px) {
    border-radius: 10px;
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
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 4px;
  overflow: visible;

  @media (max-width: 640px) {
    padding: 0;
    gap: 14px;
  }
`;

// ─── gradient strip: full viewport width, no clip ─────────────────────────────
const ContentTopWrap = styled.div`
  position: relative;
  width: 100vw;
  max-width: 100vw;
  left: 50%;
  margin-left: -50vw;
  margin-top: 32px;
  min-height: 140px;
  overflow: visible;
  @media (max-width: 640px) {
    margin-top: 24px;
    min-height: 100px;
  }
`;

const BillingGradientStrip = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 280px;
  top: 50%;
  transform: translateY(-50%) rotate(-12deg);
  z-index: 0;
  overflow: visible;
  border-radius: 4px;
  pointer-events: none;

  @media (max-width: 900px) {
    height: 200px;
    width: 110%;
    left: -5%;
    }
  @media (max-width: 640px) {
    display: none;
  }
`;

const BillingGradientStripInner = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const BillingGradientCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #f9fafb;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #f9fafc;
  --gradient-color-4: #fc4056;
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  margin-top: -160px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 640px) {
    margin-top: -120px;
  }
`;

// ─── plan grid ────────────────────────────────────────────────────────────────
const PlansGridWrapper = styled.div`
  @media (max-width: 599px) {
    margin: 0 -4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    padding: 0 4px 4px;
  }
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  background: rgba(249, 250, 251, 0.65);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(229, 231, 235, 0.75);
  border-radius: 12px;
  padding: 5px;
  gap: 4px;

  @media (max-width: 599px) {
    grid-template-columns: repeat(3, 260px);
    width: max-content;
    min-width: 100%;
  }
  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PlanCol = styled.div`
  padding: 18px 20px;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  background: ${({ $current }) => $current ? "rgba(255, 255, 255, 0.78)" : "rgba(255, 255, 255, 0.35)"};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: ${({ $current }) => $current ? "0 1px 4px rgba(0,0,0,0.06)" : "none"};
  border: ${({ $current }) => $current ? `1px solid rgba(229, 231, 235, 0.9)` : "1px solid transparent"};
  transition: background 0.15s, border-color 0.15s;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PlanNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const PlanDot = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ $grad }) => $grad};
  flex-shrink: 0;
`;

const PlanName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${T.text};
`;

const PlanPrice = styled.span`
  font-size: 12px;
  color: ${T.sub};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12px;
  color: ${T.sub};
  line-height: 1.4;
  svg { flex-shrink: 0; margin-top: 1px; }
`;

const PlanBtn = styled.button`
  margin-top: 16px;
  width: 100%;
  height: 30px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => $active ? T.text : T.border};
  background: ${({ $active }) => $active ? T.text : "transparent"};
  color: ${({ $active }) => $active ? T.white : T.faint};
  font-size: 12px;
  font-weight: 500;
  cursor: ${({ $active }) => $active ? "pointer" : "default"};
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  &:hover { ${({ $active }) => $active && `opacity: 0.85;`} }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 640px) {
    margin-bottom: 2px;
  }
`;

const InvoicesSectionHeader = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${T.text};
  margin-bottom: 14px;

  @media (max-width: 640px) {
    font-size: 15px;
    margin-bottom: 10px;
  }
`;
const PLAN_GRADIENTS = {
  basic: "linear-gradient(135deg, #93c5fd, #60a5fa)",
  growth: "linear-gradient(135deg, #a7f3d0, #34d399)",
  advanced: "linear-gradient(135deg, #fcd34d, #f59e0b)",
};

// ─── invoice section ──────────────────────────────────────────────────────────
const TabsWrap = styled.div`
  display: inline-flex;
  background: ${T.bg};
  border-radius: 8px;
  padding: 3px;
  gap: 2px;

  @media (max-width: 600px) {
    display: flex;
    width: 100%;
    & > * { flex: 1; text-align: center; }
  }
`;

const Tab = styled.button`
  padding: 5px 14px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: ${({ $active }) => $active ? "500" : "400"};
  color: ${({ $active }) => $active ? T.text : T.sub};
  background: ${({ $active }) => $active ? T.white : "transparent"};
  box-shadow: ${({ $active }) => $active ? "0 1px 3px rgba(0,0,0,0.1)" : "none"};
  cursor: pointer;
  transition: all 0.15s;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const InvoiceSearchGroup = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 600px) {
    & > * { flex: 1; }
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  background: ${T.white};
  border: 1px solid ${T.border};
  border-radius: 8px;
  min-width: 170px;
  input {
    border: none; outline: none;
    font-size: 13px; color: ${T.text}; background: transparent; width: 100%;
    &::placeholder { color: ${T.faint}; }
  }

  @media (max-width: 600px) {
    min-width: 0;
    flex: 1;
  }
`;

const SortBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  padding: 7px 11px;
  background: ${T.white}; border: 1px solid ${T.border};
  border-radius: 8px; font-size: 13px; color: ${T.text};
  cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: ${T.bg}; }
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
    grid-template-columns: 18px 1fr 110px 90px 100px 28px 26px;
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

const Checkbox = styled.div`
  width: 14px; height: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 3px; cursor: pointer; flex-shrink: 0;
`;

const InvoiceCheckboxCell = styled.div`
  display: none;
  @media (min-width: 640px) {
    display: flex;
    align-items: center;
  }
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
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 12px;
  overflow: hidden;
  animation: ${fadeUp} 0.2s ease;
`;

const PlanBillingHeader = styled.div`
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${T.border};
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
`;

const PlanBillingHeaderNote = styled(SectionSub)`
  margin-left: auto;
  font-size: 12px;

  @media (max-width: 640px) {
    margin-left: 0;
    margin-top: 2px;
  }
`;

const SectionDivider = styled.div`
  height: 1px;
  background: ${T.border};
  margin: 8px 0;
`;

const PlanBillingBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  divide-x: 1px solid ${T.border};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PlanBillingSection = styled.div`
  padding: 18px 20px;
  border-right: ${({ $noBorder }) => $noBorder ? "none" : `1px solid ${T.border}`};
  display: flex;
  flex-direction: column;

  @media (max-width: 640px) {
    border-right: none;
    border-bottom: ${({ $noBorder }) => $noBorder ? "none" : `1px solid ${T.border}`};
  }
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

const PaymentMethodDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
`;

const CardIconWrap = styled.div`
  width: 36px;
  height: 24px;
  background: ${T.bg};
  border: 1px solid ${T.border};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const CardNumber = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${T.text};
  letter-spacing: 0.03em;
`;

const CardBrand = styled.div`
  font-size: 11.5px;
  color: ${T.sub};
  text-transform: capitalize;
`;

const PaymentMethodAction = styled.div`
  margin-top: 14px;
`;

// ─── add-ons ──────────────────────────────────────────────────────────────────
const AddonsGrid = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${T.border};
  border-radius: 10px;
  overflow: hidden;
`;

const AddonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  background: ${T.white};
  transition: background 0.12s;
  &:not(:last-child) { border-bottom: 1px solid ${T.border}; }
  &:hover { background: ${T.bg}; }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 14px;
  }
`;

const AddonLeft = styled.div`
  display: flex; align-items: center; gap: 11px; min-width: 0;
`;

const AddonIcon = styled.div`
  width: 32px; height: 32px; border-radius: 7px;
  background: ${T.bg}; border: 1px solid ${T.border};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const AddonName = styled.div`
  font-size: 13.5px; font-weight: 500; color: ${T.text};
`;

const AddonDesc = styled.div`
  font-size: 12px; color: ${T.sub}; margin-top: 2px;
`;

const AddonRight = styled.div`
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;

  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-start;
    padding-top: 10px;
    border-top: 1px solid ${T.border};
  }
`;

const ActivePill = styled.span`
  font-size: 11.5px; font-weight: 600;
  color: ${T.green}; background: ${T.greenBg};
  padding: 2px 9px; border-radius: 20px;
`;

const CancellingNote = styled.span`
  font-size: 11px; color: ${T.sub}; display: block; margin-top: 3px; text-align: right;
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
  const [activeTab, setActiveTab] = useState("View all");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
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
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [defaultPaymentMethodLoading, setDefaultPaymentMethodLoading] = useState(false);

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
      const featureLabels = (plan.features || []).slice(0, 5).map((f) => (typeof f === "object" && f?.label) ? f.label : String(f));
      return {
        id: plan.id,
        name: plan.name,
        price: `$${plan.price}/mth`,
        grad: PLAN_GRADIENTS[plan.id] || "linear-gradient(135deg, #a5b4fc, #818cf8)",
        features: featureLabels.length ? featureLabels : [`${plan.commission}% commission per booking`],
        isCurrent,
        btnText: isCurrent ? "Current plan" : `Switch to ${plan.name}`,
        btnActive: !isCurrent,
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

  const displayedInvoices = useMemo(() => {
    let list = [...invoices];
    list = list.filter((inv) => Number(inv?.amount_paid || 0) > 0);
    if (activeTab === "Active") list = list.filter((inv) => inv.status === "paid");
    else if (activeTab === "Archived") list = list.filter((inv) => (inv.status && !["paid", "open", "draft"].includes(inv.status)) || false);
    const q = (invoiceSearchQuery || "").trim().toLowerCase();
    if (q) list = list.filter((inv) => (inv.number && String(inv.number).toLowerCase().includes(q)) || (inv.id && String(inv.id).toLowerCase().includes(q)));
    const asc = invoiceSortOrder === "oldest";
    list.sort((a, b) => {
      const da = a.created || "";
      const db = b.created || "";
      return asc ? (da < db ? -1 : da > db ? 1 : 0) : (db < da ? -1 : db > da ? 1 : 0);
    });
    return list;
  }, [invoices, activeTab, invoiceSearchQuery, invoiceSortOrder]);

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
  useEffect(() => {
    if (!showPaymentMethodSection) return;
    let cancelled = false;
    setDefaultPaymentMethodLoading(true);
    businessService.getDefaultPaymentMethod().then((res) => {
      if (cancelled) return;
      setDefaultPaymentMethodLoading(false);
      if (res.success && res.data) setDefaultPaymentMethod(res.data.payment_method ?? null);
      else setDefaultPaymentMethod(null);
    }).catch(() => {
      if (!cancelled) { setDefaultPaymentMethodLoading(false); setDefaultPaymentMethod(null); }
    });
    return () => { cancelled = true; };
  }, [showPaymentMethodSection]);

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

  const handleUpdatePaymentMethodSuccess = useCallback(async (paymentMethodId) => {
    const result = await businessService.setDefaultPaymentMethod({ payment_method: paymentMethodId });
    if (result.success) {
      setUpdatePaymentModalOpen(false);
      setUpdatePaymentClientSecret(null);
      message.success("Payment method updated. It will be used for future charges and renewals.");
      const pmRes = await businessService.getDefaultPaymentMethod();
      if (pmRes.success && pmRes.data) setDefaultPaymentMethod(pmRes.data.payment_method ?? null);
      refetchAddons?.();
    } else {
      antMessage.error(result.error || "Failed to update payment method.");
    }
  }, [refetchAddons]);

  useEffect(() => {
    const id = "billing-gradient-canvas";
    const run = () => {
      import("stripe-gradient")
        .then(({ Gradient }) => {
          const canvas = document.getElementById(id);
          if (!canvas || !canvas.getContext) return;
          const gradient = new Gradient();
          gradient.initGradient(`#${id}`);
        })
        .catch(() => {});
    };
    const t = setTimeout(run, 0);
    return () => clearTimeout(t);
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

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <PageOuter>
      <GlobalStyle />

      <ContentTopWrap>
        <BillingGradientStrip>
          <BillingGradientStripInner>
            <BillingGradientCanvas id="billing-gradient-canvas" data-transition-in />
          </BillingGradientStripInner>
        </BillingGradientStrip>
      </ContentTopWrap>

      <ContentLayer>
      {/* Header */}
      <PageHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>Plans &amp; billing</div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 3 }}>Manage your plan and billing history here.</div>
          </div>
        </div>
      </PageHeader>

      {/* Pricing Plans Grid */}
      <PlansGridWrapper>
        <PlansGrid>
          {planDisplay.map((plan) => (
            <PlanCol key={plan.id} $current={plan.isCurrent}>
              <PlanHeader>
                <PlanNameRow>
                  <PlanDot $grad={plan.grad} />
                  <PlanName>{plan.name}</PlanName>
                </PlanNameRow>
                <PlanPrice>{plan.price}</PlanPrice>
              </PlanHeader>
              <FeatureList>
                {plan.features.map((f) => (
                  <FeatureItem key={f}>
                    <Check size={12} color={T.text} strokeWidth={2.5} />
                    {f}
                  </FeatureItem>
                ))}
              </FeatureList>
              <PlanBtn
                $active={plan.btnActive}
                onClick={() => plan.btnActive && handleSwitchPlan(plan.id)}
                disabled={!plan.btnActive || switchPlanLoading !== null}
                type="button"
              >
                {switchPlanLoading === plan.id ? "Switching…" : plan.btnText}
              </PlanBtn>
            </PlanCol>
          ))}
        </PlansGrid>
      </PlansGridWrapper>

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
                <PlanDot $grad={PLAN_GRADIENTS[subscription.planId] || "linear-gradient(135deg, #a5b4fc, #818cf8)"} />
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
                <>
                  <PaymentMethodDisplay>
                    <CardIconWrap>
                      <CreditCard size={14} color={T.sub} />
                    </CardIconWrap>
                    <CardDetails>
                      <CardNumber>
                        {defaultPaymentMethod?.last4 ? `•••• •••• •••• ${defaultPaymentMethod.last4}` : "•••• •••• •••• ––––"}
                      </CardNumber>
                      {defaultPaymentMethod?.brand && (
                        <CardBrand>{defaultPaymentMethod.brand}</CardBrand>
                      )}
                    </CardDetails>
                  </PaymentMethodDisplay>
                  <PaymentMethodAction>
                    <Button
                      size="small"
                      onClick={() => setUpdatePaymentModalOpen(true)}
                      style={{ fontSize: 12 }}
                    >
                      Update payment method
                    </Button>
                  </PaymentMethodAction>
                </>
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
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Package size={14} color={T.sub} />
          <SectionTitle style={{ margin: 0 }}>Add-ons</SectionTitle>
          <SectionSub style={{ marginLeft: "auto", fontSize: 12 }}>Billed separately</SectionSub>
        </div>

        {addonsLoading ? (
          <LoadingRow><SpinIcon size={15} /><span>Loading add-ons…</span></LoadingRow>
        ) : (
          <AddonsGrid>
            {/* Marketplace email branding */}
            <AddonRow>
              <AddonLeft>
                <AddonIcon><Mail size={15} color={T.sub} /></AddonIcon>
                <div>
                  <AddonName>Marketplace email branding</AddonName>
                  <AddonDesc>
                    ${ADDON_PRICE}/mo · Custom logo, colors &amp; footer in marketplace booking emails.
                  </AddonDesc>
                </div>
              </AddonLeft>

              <AddonRight>
                {addonActive ? (
                  <>
                    <div style={{ textAlign: "right" }}>
                      <ActivePill>Active</ActivePill>
                      {addonNextBilling && (
                        <CancellingNote>
                          {marketplaceEmail?.cancelAtPeriodEnd ? `Cancels ${addonNextBilling}` : `Renews ${addonNextBilling}`}
                        </CancellingNote>
                      )}
                    </div>
                    {marketplaceEmail?.cancelAtPeriodEnd ? (
                      <Button size="small" icon={<RefreshCw size={11} />} onClick={handleAddonReactivate}
                        style={{ background: SEL_COLOR, borderColor: SEL_COLOR, color: "white", fontSize: 12 }}>
                        Reactivate
                      </Button>
                    ) : (
                      <Button size="small" danger onClick={() => setAddonCancelModalOpen(true)} style={{ fontSize: 12 }}>
                        Cancel
                      </Button>
                    )}
                  </>
                ) : canInstantSubscribeAddon ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                    <Button type="primary" size="small" onClick={handleInstantSubscribeAddon} loading={addonSubscribing}
                      style={{ background: SEL_COLOR, borderColor: SEL_COLOR, fontSize: 12 }}>
                      {addonSubscribing ? "Subscribing…" : `Add — $${ADDON_PRICE}/mo`}
                    </Button>
                    <SmallLink onClick={() => setSubscribeModalOpen(true)}>Use different card</SmallLink>
                  </div>
                ) : (
                  <Button type="primary" size="small" onClick={() => setSubscribeModalOpen(true)}
                    style={{ background: SEL_COLOR, borderColor: SEL_COLOR, fontSize: 12 }}>
                    Add — ${ADDON_PRICE}/mo
                  </Button>
                )}
              </AddonRight>
            </AddonRow>

            {/*
              Future add-ons slot — copy the <AddonRow> pattern above.
              Each row gets its own icon, name, desc, price, and action button.
            */}
          </AddonsGrid>
        )}
      </Card>

      <SectionDivider />

      {/* Previous invoices */}
      <div>
        <InvoicesSectionHeader>Previous invoices</InvoicesSectionHeader>

        <ControlsRow>
          <TabsWrap>
            {["View all", "Active", "Archived"].map((t) => (
              <Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>{t}</Tab>
            ))}
          </TabsWrap>
          <InvoiceSearchGroup>
            <SearchBox>
              <Search size={13} color={T.faint} />
              <input
                placeholder="Search"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                aria-label="Search invoices"
              />
            </SearchBox>
            <SortBtn type="button" onClick={() => setInvoiceSortOrder((o) => (o === "recent" ? "oldest" : "recent"))}>
              <SlidersHorizontal size={13} color={T.sub} />
              {invoiceSortOrder === "recent" ? "Most recent" : "Oldest first"}
            </SortBtn>
          </InvoiceSearchGroup>
        </ControlsRow>

        <Card $pad="0" style={{ marginTop: 12, overflow: "hidden" }}>
          {invoicesLoading ? (
            <LoadingRow style={{ padding: 24 }}><SpinIcon size={16} /><span>Loading invoices…</span></LoadingRow>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.sub }}>
              {hasStripeSubscription
                ? "No invoices yet. Invoices appear here after your first payment."
                : "Invoices appear after you subscribe through Stripe (e.g. booking widget checkout). Plan changes above update your access only until then."}
            </div>
          ) : displayedInvoices.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.sub }}>
              No invoices match your filters. Try a different tab or search.
            </div>
          ) : (
            displayedInvoices.map((inv) => {
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
                    <InvoiceCheckboxCell aria-hidden><Checkbox /></InvoiceCheckboxCell>
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
      </div>

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
      </ContentLayer>
    </PageOuter>
  );
}