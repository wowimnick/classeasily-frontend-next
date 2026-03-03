"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuthModal } from "@/context/AuthContext";
import { saveRedirectPath } from "@/lib/auth-client";
import { getPlanById } from "@/lib/subscriptionPlans";
import { businessService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";
import { Check, Lock, Shield, Loader2, AlertCircle, RefreshCw, ArrowRight, Plus, Minus, ChevronRight } from "lucide-react";
import { theme as appTheme } from "@/components/theme";
import { Modal } from "antd";
import confetti from "canvas-confetti";
import { Drawer } from "vaul";

// ─── Stripe ───────────────────────────────────────────────────────────────────
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// ─── Session storage ──────────────────────────────────────────────────────────
const INTENT_KEY = "widget_checkout_plan";
const persistIntent = (p) => { try { sessionStorage.setItem(INTENT_KEY, p || ""); } catch (_) {} };
const getStoredIntent = () => { try { return sessionStorage.getItem(INTENT_KEY) || null; } catch (_) { return null; } };
const clearStoredIntent = () => { try { sessionStorage.removeItem(INTENT_KEY); } catch (_) {} };

// PaymentElement: hide zip and country, default Canada (matches ReviewAndPaymentStep)
const paymentElementOptions = {
  layout: "tabs",
  wallets: { applePay: "never", googlePay: "never" },
  defaultValues: {
    billingDetails: {
      address: { country: "CA" },
    },
  },
  fields: {
    billingDetails: {
      address: {
        country: "never",
        postalCode: "never",
      },
    },
  },
};

// ─── Animations ───────────────────────────────────────────────────────────────
const spin = keyframes`to { transform: rotate(360deg); }`;
const blob1 = keyframes`0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(28px,-18px) scale(1.08)}70%{transform:translate(-14px,12px) scale(0.96)}`;
const blob2 = keyframes`0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-22px,18px) scale(1.06)}70%{transform:translate(16px,-12px) scale(1.02)}`;
const blob3 = keyframes`0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,16px) scale(1.04)}`;
const shimmer = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`;
const fadeUp = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;

// ─── Page shell ───────────────────────────────────────────────────────────────
const PageWrap = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

/* Thin angled WebGL gradient strip (hidden on mobile) */
const CheckoutGradientStrip = styled.div`
  position: absolute;
  left: -10%;
  width: 120%;
  height:150px;
  top: 28%;
  transform: translateY(-50%) rotate(-3deg);
  z-index: 0;
  overflow: hidden;
  border-radius: 4px;
  @media (max-width: 640px) {
    display: none;
  }
`;
const CheckoutGradientStripInner = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;
const CheckoutGradientCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #ffffff;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #ffffff;
  --gradient-color-4: #ffcb57;
`;

const PageInner = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 20px 80px;
  animation: ${fadeUp} 0.3s ease;
  position: relative;
  z-index: 1;
  @media (max-width: 600px) { padding: 20px 14px 60px; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: #8792a2;
  text-decoration: none;
  margin-bottom: 18px;
  &:hover { color: #1a1a2e; }
`;

const PageHeading = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.025em;
  margin: 0 0 24px;
  @media (max-width: 600px) { font-size: 21px; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: flex-start;
  @media (max-width: 820px) { grid-template-columns: 1fr; }
`;

// ─── Glass card ───────────────────────────────────────────────────────────────
const GlassCard = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 6px 28px rgba(40,40,80,0.09),
    0 1px 6px rgba(0,0,0,0.05);
  overflow: hidden;
`;

// Blobs
const HoloBg = styled.div`
  position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; border-radius: 18px;
`;
const Blob = styled.div`
  position: absolute; border-radius: 50%; filter: blur(65px); opacity: 0.28;
`;
const BlobCoral = styled(Blob)`
  width: 300px; height: 220px;
  background: radial-gradient(circle, #ffb3b3 0%, #ffd6e7 60%, transparent 100%);
  top: 25%; left: 15%;
  animation: ${blob1} 10s ease-in-out infinite;
`;
const BlobBlue = styled(Blob)`
  width: 240px; height: 190px;
  background: radial-gradient(circle, #b3d4ff 0%, #d6eaff 60%, transparent 100%);
  top: 5%; right: 8%;
  animation: ${blob2} 12s ease-in-out infinite;
`;
const BlobMint = styled(Blob)`
  width: 200px; height: 160px;
  background: radial-gradient(circle, #c8f7c5 0%, #a8edca 60%, transparent 100%);
  bottom: 8%; left: 45%;
  animation: ${blob3} 14s ease-in-out infinite;
`;
const BlobPeach = styled(Blob)`
  width: 200px; height: 150px;
  background: radial-gradient(circle, #ffe0b2 0%, #ffc8a0 60%, transparent 100%);
  bottom: 15%; right: 3%;
  animation: ${blob1} 11s ease-in-out infinite 1.5s;
`;

// ─── Steps ────────────────────────────────────────────────────────────────────
const StepsWrap = styled.div`
  position: relative;
  z-index: 1;
`;

// Thin divider between steps
const StepDivider = styled.div`
  height: 1px;
  background: rgba(0, 0, 0, 0.07);
  margin: 0 24px;
  @media (max-width: 600px) { margin: 0 16px; }
`;

const StepRow = styled.div`
  padding: 0 24px;
  @media (max-width: 600px) { padding: 0 16px; }
`;

// Single horizontal line: circle · label + detail · CHANGE
const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
`;

const StepCircle = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  ${p => p.$done   && `background: #1a1a2e; color: #fff;`}
  ${p => p.$active && `background: #1a1a2e; color: #fff;`}
  ${p => !p.$done && !p.$active && `background: rgba(0,0,0,0.1); color: #8792a2;`}
`;

const StepMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
`;

const StepLabel = styled.span`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${p => p.$muted ? "#9ca3b0" : "#1a1a2e"};
  white-space: nowrap;
`;

const StepSummary = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Expanded body — sits below the header row with left-alignment to the text
const StepBody = styled.div`
  padding-bottom: 22px;
  padding-left: 38px;
  @media (max-width: 600px) { padding-left: 0; }
`;

// ─── Stripe skeleton ──────────────────────────────────────────────────────────
const SkeletonBar = styled.div`
  height: ${p => p.$h || "40px"};
  width: ${p => p.$w || "100%"};
  background: linear-gradient(90deg, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.5) 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
  border-radius: 10px;
`;
const SkeletonRow = styled.div`
  display: flex; gap: 10px; margin-top: 12px;
`;

// ─── Pay button (narrow, centered) ───────────────────────────────────────────
const PayBtnWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const PayBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  max-width: 260px;
  padding: 15px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: #1a1a2e;
  color: white;
  transition: opacity 0.15s, transform 0.15s;
  letter-spacing: -0.01em;

  &:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  &:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
`;

const SecLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #9ca3b0;
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px 14px;
  background: rgba(254,226,226,0.7);
  border: 1px solid #fca5a5;
  border-radius: 10px;
  font-size: 13px;
  color: #b91c1c;
  font-weight: 500;
  margin-top: 14px;
  svg { flex-shrink: 0; margin-top: 1px; }
`;

// ─── Login prompt (inside step body) ─────────────────────────────────────────
const SignInBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  border: 1.5px solid #1a1a2e;
  background: #1a1a2e;
  color: white;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

// ─── Order summary (right column) — gradient only in header, rest plain ──────
const SummaryCard = styled.div`
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 4px 18px rgba(40,40,80,0.07);
  @media (min-width: 821px) { position: sticky; top: 88px; }
`;

const SummaryHeader = styled.div`
  position: relative;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  background: linear-gradient(170deg, #fff 0%, rgba(255,230,160,0.55) 32%, rgba(255,185,120,0.42) 54%, rgba(155,170,255,0.38) 76%, #fff 100%);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 38% 44%, rgba(255,255,255,0.72) 0%, transparent 65%),
      linear-gradient(175deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.94) 72%, #fff 100%);
    pointer-events: none;
    z-index: 0;
  }
`;

const SummarySection = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  &:last-child { border-bottom: none; }
`;

const SummaryTitle = styled.div`
  position: relative;
  z-index: 1;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9ca3b0;
  margin-bottom: 14px;
`;

const SummaryPlanName = styled.div`
  position: relative;
  z-index: 1;
  font-size: 17px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.02em;
`;

const SummaryPlanSub = styled.div`
  position: relative;
  z-index: 1;
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  &:last-child { margin-bottom: 0; }
  span:last-child { color: #374151; font-weight: 600; }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.12);
`;

const TotalLabel = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
`;

const TotalValue = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.03em;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  margin-bottom: 6px;
  &:last-child { margin-bottom: 0; }
`;

const CancelNote = styled.div`
  font-size: 12px;
  color: #9ca3b0;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// ─── FAQ (below checkout, compact) ───────────────────────────────────────────
const CHECKOUT_FAQ = [
  {
    q: "How does the commission work?",
    a: "You pay a flat monthly fee plus a percentage of each booking (e.g. Growth: 3% per booking). Stripe processing fees are also deducted from your payout.",
  },
  {
    q: "Is the checkout secure?",
    a: "Yes. Payments are processed by Stripe (PCI DSS Level 1). Card details never touch our servers.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel from your dashboard at any time. Access continues until the end of your billing period.",
  },
];

// ─── FAQ styled components (matches BusinessWelcomePage design, compact) ──────
const FaqSection = styled.section`
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(0,0,0,0.08);
  @media (max-width: 600px) { margin-top: 36px; padding-top: 24px; }
`;

const FaqTitle = styled.h2`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9ca3b0;
  margin: 0 0 16px;
`;

const FaqContainer = styled.div`
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.9);
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border-radius: 18px;
  padding: 0 20px;
`;

const FaqItemWrap = styled.div`
  border-bottom: 1px solid rgba(0,0,0,0.05);
  &:last-child { border-bottom: none; }
`;

const FaqItemBtn = styled.button`
  width: 100%;
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  transition: color 0.15s;
  &:hover { color: #000; }
`;

const FaqItemAnswer = styled(m.div)`
  overflow: hidden;
  color: #6e6e73;
  font-size: 13px;
  line-height: 1.6;
`;

function CheckoutFaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <FaqItemWrap>
      <FaqItemBtn type="button" onClick={() => setOpen((o) => !o)}>
        {q}
        {open ? <Minus size={16} style={{ flexShrink: 0 }} /> : <Plus size={16} style={{ flexShrink: 0 }} />}
      </FaqItemBtn>
      <AnimatePresence>
        {open && (
          <FaqItemAnswer
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div style={{ paddingBottom: 16 }}>{a}</div>
          </FaqItemAnswer>
        )}
      </AnimatePresence>
    </FaqItemWrap>
  );
}

// ─── Processing overlay ───────────────────────────────────────────────────────
const processingBar = keyframes`
  0%   { transform: scaleX(0); transform-origin: left; }
  45%  { transform: scaleX(0.6); transform-origin: left; }
  55%  { transform: scaleX(0.6); transform-origin: right; }
  100% { transform: scaleX(0); transform-origin: right; }
`;


const BarTrack = styled.div`
  width: 180px;
  height: 3px;
  background: rgba(0,0,0,0.08);
  border-radius: 2px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: 60%;
  background: #1a1a2e;
  border-radius: 2px;
  animation: ${processingBar} 1.6s ease-in-out infinite;
`;

function ProcessingScreen() {
  return (
    <AnimatePresence>
      <m.div
        key="proc-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,10,20,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <m.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "#fff", borderRadius: 20, padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", minWidth: 280 }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.01em" }}>
            Processing payment…
          </div>
          <BarTrack>
            <BarFill />
          </BarTrack>
          <div style={{ fontSize: 12, color: "#9ca3b0" }}>Do not close this window</div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}

// ─── Success modal ─────────────────────────────────────────────────────────────

// Animation variants
const modalCardV = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};
const illustV = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 } },
};
const blobV = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.1 } },
};
const windowV = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.22 } },
};
const checkPathV = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { delay: 0.5, duration: 0.42, ease: "easeOut" } },
};
const checkCircleV = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { type: "spring", stiffness: 380, damping: 22, delay: 0.42 } },
};
const headlineV = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut", delay: 0.3 } },
};
const bodyV = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut", delay: 0.38 + i * 0.1 } }),
};
const stepRowV = {
  hidden: { opacity: 0, x: -8 },
  show: (i) => ({ opacity: 1, x: 0, transition: { duration: 0.32, ease: "easeOut", delay: 0.56 + i * 0.08 } }),
};
const footerV = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, delay: 0.88 } },
};

function SuccessInner({ plan, onClose, animate }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        key="success-inner"
        variants={animate ? modalCardV : undefined}
        initial={animate ? "hidden" : false}
        animate="show"
        style={{ background: "#fff" }}
      >
        {/* ── Illustration area ── */}
        <m.div
          variants={illustV}
          initial="hidden"
          animate="show"
          style={{ position: "relative", height: 160, overflow: "hidden" }}
        >
          <m.div
            variants={blobV}
            initial="hidden"
            animate="show"
            style={{
              position: "absolute", top: "-50%", left: "-5%",
              width: "90%", height: "140%", borderRadius: "50%",
              background: "radial-gradient(ellipse at 30% 50%, #FF5722 0%, #FFB74D 45%, rgba(255,255,255,0) 75%)",
              filter: "blur(28px)", opacity: 0.75,
            }}
          />
          <m.div
            variants={blobV}
            initial="hidden"
            animate="show"
            style={{
              position: "absolute", top: "-40%", left: "-5%",
              width: "90%", height: "70%", borderRadius: "50%",
              background: "radial-gradient(ellipse at 30% 50%, #FF2222 0%, #FFB74D 45%, rgba(255,255,255,0) 75%)",
              filter: "blur(28px)", opacity: 0.75,
            }}
          />
          <m.div
            variants={windowV}
            initial="hidden"
            animate="show"
            style={{
              position: "absolute", top: "40%", left: "40%",
              transform: "translate(-50%, -50%)",
              width: 168, height: 108,
              background: "rgba(255,220,190,0.55)", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(4px)",
              boxShadow: "0 8px 32px rgba(255,100,30,0.15)",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#e07840" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100% - 30px)" }}>
              <m.div
                variants={checkCircleV}
                initial="hidden"
                animate="show"
                style={{
                  width: 44, height: 44, borderRadius: "50%", background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(224,120,64,0.22)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <m.path
                    d="M4 10.5L8.5 15L16 7"
                    stroke="#e07840" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"
                    variants={checkPathV} initial="hidden" animate="show"
                  />
                </svg>
              </m.div>
            </div>
          </m.div>
        </m.div>

        {/* ── Text ── */}
        <div style={{ padding: "24px 28px 0 28px" }}>
          <m.h2
            variants={headlineV} initial="hidden" animate="show"
            style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#000", letterSpacing: "-0.025em", lineHeight: 1.2 }}
          >
            You are all set.
          </m.h2>
          <m.p
            custom={0} variants={bodyV} initial="hidden" animate="show"
            style={{ margin: "0 0 6px", fontSize: 14, color: "#666", lineHeight: 1.5 }}
          >
            Your <strong style={{ color: "#333" }}>{plan?.name} Plan</strong> is now active.
          </m.p>
          <m.p
            custom={1} variants={bodyV} initial="hidden" animate="show"
            style={{ margin: "0 0 28px", fontSize: 14, color: "#666", lineHeight: 1.6 }}
          >
            Head to your dashboard, grab your embed snippet under the Widget tab, and paste it into your site. One line of HTML — no developer needed.
          </m.p>
        </div>

        {/* ── Footer ── */}
        <m.div
          variants={footerV} initial="hidden" animate="show"
          style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            gap: 8, padding: "16px 28px 24px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <button
            type="button" onClick={onClose}
            style={{ background: "none", border: "none", padding: "8px 12px", fontSize: 14, fontWeight: 500, color: "#000", cursor: "pointer", borderRadius: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            Stay here
          </button>
          <a
            href="/business/dashboard/widget"
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "8px 18px", fontSize: 14, fontWeight: 500,
              color: "#000", textDecoration: "none",
              border: "1px solid #ccc", borderRadius: 9,
              background: "#fff", transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#999"; e.currentTarget.style.background = "#fafafa"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.background = "#fff"; }}
          >
            Go to dashboard
          </a>
        </m.div>
      </m.div>
    </LazyMotion>
  );
}

function SuccessModal({ open, plan, onClose }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const end = Date.now() + 200;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, zIndex: 9999 });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, zIndex: 9999 });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [open]);

  return (
    <>

      {isMobile ? (
        <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
            <Drawer.Content
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                background: "#fff",
                borderRadius: "20px 20px 0 0",
                overflow: "hidden",
                zIndex: 1001,
                outline: "none",
              }}
            >

              <SuccessInner plan={plan} onClose={onClose} animate={false} />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Modal
          open={open}
          onCancel={onClose}
          footer={null}
          closable={false}
          centered
          width={440}
          styles={{
            mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.28)" },
            content: { padding: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 20px 60px rgba(0,0,0,0.16)" },
            body: { padding: 0 },
          }}
        >
          <AnimatePresence>
            {open && <SuccessInner key="si" plan={plan} onClose={onClose} animate />}
          </AnimatePresence>
        </Modal>
      )}
    </>
  );
}

// ─── Stripe pay form ─────────────────────────────────────────────────────────
function StripePayForm({ plan, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handlePay = useCallback(async () => {
    if (!stripe || !elements) return;
    setErr(null);
    setSubmitting(true);
    const { error: subErr } = await elements.submit();
    if (subErr) { setErr(subErr.message || "Something went wrong."); setSubmitting(false); return; }
    const returnUrl = typeof window !== "undefined"
      ? `${window.location.origin}/business/dashboard/widget?subscribed=1`
      : "/business/dashboard/widget?subscribed=1";
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (error) { setErr(error.message || "Payment failed."); setSubmitting(false); return; }
    if (paymentIntent?.status === "succeeded") {
      clearStoredIntent();
      onSuccess?.();
    } else {
      setSubmitting(false);
    }
  }, [stripe, elements, onSuccess]);

  return (
    <>
      {submitting && <LazyMotion features={domAnimation}><ProcessingScreen /></LazyMotion>}
      <div>
        <div style={{ position: "relative", minHeight: ready ? undefined : 160 }}>
          {!ready && (
            <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
              <SkeletonBar />
              <SkeletonRow>
                <SkeletonBar $w="48%" />
                <SkeletonBar $w="48%" />
              </SkeletonRow>
              <SkeletonBar style={{ marginTop: 12 }} />
            </div>
          )}
          <div style={{ visibility: ready ? "visible" : "hidden" }}>
            <PaymentElement options={paymentElementOptions} onReady={() => setReady(true)} />
          </div>
        </div>

        {err && (
          <ErrorBox>
            <AlertCircle size={14} />
            {err}
          </ErrorBox>
        )}

        <PayBtnWrap>
          <PayBtn onClick={handlePay} disabled={submitting || !stripe || !elements || !ready}>
            <Lock size={14} />Pay ${plan?.price}.00 / month
          </PayBtn>
        </PayBtnWrap>
        <SecLine>
          <Shield size={11} />
          Secured by Stripe · Cancel anytime from your dashboard
        </SecLine>
      </div>
    </>
  );
}

// ─── Order summary card ───────────────────────────────────────────────────────
function OrderSummary({ plan }) {
  const features = plan?.features?.slice(0, 5) || [];
  return (
    <SummaryCard>
      <SummaryHeader>
        <SummaryTitle>Your Order</SummaryTitle>
        <SummaryPlanName>{plan?.name} Plan</SummaryPlanName>
        <SummaryPlanSub>Monthly subscription · {plan?.commission}% commission/booking</SummaryPlanSub>
      </SummaryHeader>

      <SummarySection>
        <SummaryRow>
          <span>Subtotal</span>
          <span>${plan?.price}.00</span>
        </SummaryRow>
        <SummaryRow>
          <span>Billing cycle</span>
          <span>Monthly</span>
        </SummaryRow>
      </SummarySection>

      <TotalRow>
        <TotalLabel>Total</TotalLabel>
        <TotalValue>${plan?.price}.00</TotalValue>
      </TotalRow>

      {features.length > 0 && (
        <SummarySection>
          <SummaryTitle>What&apos;s included</SummaryTitle>
          {features.map((f, i) => (
            <FeatureItem key={i}>
              <Check size={13} color="#10b981" strokeWidth={3} style={{ flexShrink: 0 }} />
              {f.label}
            </FeatureItem>
          ))}
        </SummarySection>
      )}

      <CancelNote>
        <Shield size={11} />
        No hidden fees. Cancel anytime.
      </CancelNote>
    </SummaryCard>
  );
}

// ─── Fallback ─────────────────────────────────────────────────────────────────
function CheckoutFallback() {
  return (
    <PageWrap>
      <ExploreHeader showOptionsWrapper={false} />
      <PageInner>
        <SkeletonBar $h="14px" $w="60px" style={{ marginBottom: 18, background: "#dde1e7" }} />
        <SkeletonBar $h="28px" $w="220px" style={{ marginBottom: 28, background: "#dde1e7" }} />
        <Grid>
          <GlassCard>
            <HoloBg><BlobCoral /><BlobBlue /><BlobMint /><BlobPeach /></HoloBg>
            <div style={{ padding: 24, position: "relative", zIndex: 1 }}>
              <SkeletonBar $h="18px" $w="160px" style={{ marginBottom: 16 }} />
              <SkeletonBar />
              <SkeletonRow><SkeletonBar $w="48%" /><SkeletonBar $w="48%" /></SkeletonRow>
            </div>
          </GlassCard>
          <SkeletonBar $h="300px" style={{ borderRadius: 18, background: "#dde1e7" }} />
        </Grid>
      </PageInner>
      <FooterSmart />
    </PageWrap>
  );
}

// ─── Main checkout ─────────────────────────────────────────────────────────────
function WidgetCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramPlan = searchParams.get("plan") || getStoredIntent();
  const planId = paramPlan ? String(paramPlan).toLowerCase() : null;
  const plan = planId ? getPlanById(planId) : null;

  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser();
  const { subscription, loading: subLoading, refetch } = useSubscription();
  const { openLoginModal } = useAuthModal();

  const [clientSecret, setClientSecret] = useState(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentErr, setIntentErr] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Stripe appearance: Proxima Soft, mobile 16px / desktop 14px (match ReviewAndPaymentStep)
  const [stripeFontSize, setStripeFontSize] = useState("16px");
  useEffect(() => {
    const update = () =>
      setStripeFontSize(typeof window !== "undefined" && window.innerWidth < 969 ? "12px" : "14px");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const stripeFontCssUrl =
    typeof window !== "undefined" ? `${window.location.origin}/fonts/proxima-soft.css` : "";
  const stripeFonts = useMemo(
    () => (stripeFontCssUrl ? [{ cssSrc: stripeFontCssUrl }] : []),
    [stripeFontCssUrl]
  );
  useEffect(() => {
    import("stripe-gradient").then(({ Gradient }) => {
      const gradient = new Gradient();
      gradient.initGradient("#checkout-gradient-canvas");
    }).catch(() => {});
  }, []);

  const stripeAppearance = useMemo(() => {
    const fontFamily = '"Proxima Soft", sans-serif';
    return {
      theme: "stripe",
      variables: {
        colorPrimary: appTheme.token.colorPrimary,
        colorBackground: "#ffffff",
        colorText: appTheme.token.colorText,
        colorDanger: appTheme.token.colorError,
        fontFamily,
        spacingUnit: "4px",
        borderRadius: `${appTheme.token.borderRadius}px`,
        fontSizeBase: stripeFontSize,
      },
      rules: {
        ".Input": {
          paddingTop: "16px",
          paddingBottom: "16px",
          paddingLeft: "16px",
          paddingRight: "16px",
          borderColor: appTheme.token.colorBorder,
          boxShadow: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          fontFamily,
          fontWeight: "500",
        },
        ".Input:hover": { borderColor: appTheme.token.colorPrimary },
        ".Input:focus": {
          borderColor: appTheme.token.colorPrimary,
          boxShadow: `0 0 0 2px ${appTheme.token.colorPrimary}20`,
          outline: "none",
        },
        ".Input--invalid": { borderColor: appTheme.token.colorError, boxShadow: "none" },
        ".Input--invalid:focus": {
          borderColor: appTheme.token.colorError,
          boxShadow: `0 0 0 2px ${appTheme.token.colorError}20`,
        },
        ".Label": { fontWeight: "600", color: "#000", marginBottom: "8px", fontFamily },
        ".Input::placeholder": { color: "#c5c5c5", fontWeight: "600", fontFamily },
        ".Tab": {
          borderColor: appTheme.token.colorBorder,
          borderRadius: `${appTheme.token.borderRadius}px`,
          fontFamily,
          fontWeight: "600",
        },
        ".Tab:selected": { borderColor: appTheme.token.colorPrimary },
      },
    };
  }, [stripeFontSize]);

  const hasBusiness = Boolean(user?.has_business);
  const [profileBusinessName, setProfileBusinessName] = useState(null);
  useEffect(() => {
    if (!isAuthenticated || !hasBusiness) return;
    businessService.getMyBusinessProfile().then((res) => {
      if (res.success && res.data)
        setProfileBusinessName(res.data.businessName || res.data.business_name || null);
    });
  }, [isAuthenticated, hasBusiness]);
  const businessName =
    profileBusinessName ?? user?.business_name ?? user?.businessName ?? null;
  const ownerName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    null;
  const userEmail = user?.email || null;

  const isActive = subscription?.status && ["active", "trialing"].includes(subscription.status);
  const isSamePlan = isActive && subscription?.planId === planId;

  useEffect(() => { if (planId) persistIntent(planId); }, [planId]);
  useEffect(() => { if (isAuthenticated && hasBusiness) refetch(); }, [isAuthenticated, hasBusiness, refetch]);
  useEffect(() => {
    if (!authLoading && !plan && !getStoredIntent()) router.replace("/booking-widget#pricing");
  }, [plan, authLoading, router]);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (authLoading || subLoading || !isAuthenticated || !hasBusiness || !plan || !planId) return;
    if (isActive || clientSecret || fetchedRef.current) return;
    fetchedRef.current = true;
    setIntentLoading(true);
    setIntentErr(null);
    businessService.createWidgetSubscriptionPaymentIntent({ plan_id: planId }).then(res => {
      setIntentLoading(false);
      if (res.success && res.client_secret) setClientSecret(res.client_secret);
      else if (res.errorCode === "already_subscribed") refetch();
      else setIntentErr(res.error || "Could not prepare payment. Please try again.");
    });
  }, [authLoading, subLoading, isAuthenticated, hasBusiness, plan, planId, isActive, clientSecret, refetch]);

  const handleRetry = useCallback(() => {
    fetchedRef.current = false;
    setClientSecret(null);
    setIntentErr(null);
    setIntentLoading(true);
    businessService.createWidgetSubscriptionPaymentIntent({ plan_id: planId }).then(res => {
      setIntentLoading(false);
      if (res.success && res.client_secret) setClientSecret(res.client_secret);
      else setIntentErr(res.error || "Could not prepare payment. Please try again.");
    });
  }, [planId]);

  const handleLoginClick = useCallback(() => {
    const path = `/booking-widget/checkout${planId ? `?plan=${planId}` : ""}`;
    saveRedirectPath(path, "quickstart.access_business_dashboard");
    openLoginModal();
    // Stay on checkout page so after login we restore here via AuthContext redirect
  }, [planId, openLoginModal]);

  const pageLoading = authLoading || (isAuthenticated && hasBusiness && subLoading && !subscription);

  if (!plan) return null;

  // Step A is "done" when user is authed + has business
  const stepADone = isAuthenticated && hasBusiness && !pageLoading;
  const stepAActive = !stepADone;

  // Step B — what to render in its body
  const renderStepBBody = () => {
    if (!isAuthenticated) return null; // login prompt handled in step A body

    if (!hasBusiness) return (
      <div>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#6b7280" }}>
          Widget subscriptions require a business account.
        </p>
        <Link
          href="/business/register"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "#1a1a2e", color: "white", textDecoration: "none" }}
        >
          Create business account <ArrowRight size={14} />
        </Link>
      </div>
    );

    if (isSamePlan) return (
      <div>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#6b7280" }}>You&apos;re already on {plan.name}.</p>
        <Link href="/business/dashboard/widget"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "#1a1a2e", color: "white", textDecoration: "none" }}>
          Manage plan <ArrowRight size={14} />
        </Link>
      </div>
    );

    if (isActive) return (
      <div>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#6b7280" }}>You have an active subscription. Switch plans from your dashboard.</p>
        <Link href="/business/dashboard/widget"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "#1a1a2e", color: "white", textDecoration: "none" }}>
          Go to dashboard <ArrowRight size={14} />
        </Link>
      </div>
    );

    if (pageLoading || intentLoading || (!clientSecret && !intentErr)) return (
      <div>
        <SkeletonBar />
        <SkeletonRow><SkeletonBar $w="48%" /><SkeletonBar $w="48%" /></SkeletonRow>
        <SkeletonBar style={{ marginTop: 12 }} />
        <SkeletonBar $h="46px" style={{ marginTop: 20, borderRadius: 12 }} />
      </div>
    );

    if (intentErr) return (
      <div>
        <ErrorBox><AlertCircle size={14} />{intentErr}</ErrorBox>
        <PayBtn onClick={handleRetry} disabled={intentLoading} style={{ marginTop: 14 }}>
          {intentLoading
            ? <><Loader2 size={16} style={{ animation: `${spin} 1s linear infinite` }} />Retrying…</>
            : <><RefreshCw size={14} />Try again</>}
        </PayBtn>
      </div>
    );

    if (clientSecret)
      return (
        <Elements
          stripe={stripePromise}
          key={clientSecret}
          options={{
            clientSecret,
            appearance: stripeAppearance,
            fonts: stripeFonts,
          }}
        >
          <StripePayForm plan={plan} onSuccess={() => { setPaymentDone(true); setShowSuccessModal(true); }} />
        </Elements>
      );

    return null;
  };

  return (
    <PageWrap>
      <CheckoutGradientStrip>
        <CheckoutGradientStripInner>
          <CheckoutGradientCanvas id="checkout-gradient-canvas" data-transition-in />
        </CheckoutGradientStripInner>
      </CheckoutGradientStrip>
      <SuccessModal open={showSuccessModal} plan={plan} onClose={() => setShowSuccessModal(false)} />
      <ExploreHeader showOptionsWrapper={false} />
      <PageInner>
        <BackLink href="/booking-widget#pricing">← Pricing</BackLink>
        <PageHeading>Subscribe to {plan.name}</PageHeading>

        <Grid>
          {/* LEFT: glass card */}
          <GlassCard>
            <HoloBg>
              <BlobCoral />
              <BlobBlue />
              <BlobMint />
              <BlobPeach />
            </HoloBg>

            <StepsWrap>
              {/* ── Step 1: Account ── */}
              <StepRow>
                <StepHeader>
                  <StepCircle $done={stepADone} $active={stepAActive}>
                    {stepADone ? <Check size={12} strokeWidth={3} /> : "1"}
                  </StepCircle>
                  <StepMeta>
                    <StepLabel $muted={!stepADone && !stepAActive && false}>
                      Login{stepADone ? " ✓" : ""}
                    </StepLabel>
                    {stepADone && (businessName || ownerName) && (
                      <StepSummary>
                        {[businessName, ownerName].filter(Boolean).join("  ·  ")}
                      </StepSummary>
                    )}
                  </StepMeta>
                </StepHeader>

                {/* Login button lives inside step A body when not authed */}
                {!isAuthenticated && (
                  <StepBody>
                    <SignInBtn onClick={handleLoginClick}>
                      Sign in to continue <ArrowRight size={14} />
                    </SignInBtn>
                    <div style={{ marginTop: 10 }}>
                      <Link href="/booking-widget#pricing" style={{ fontSize: 12, color: "#9ca3b0", fontWeight: 500 }}>
                        ← Back to pricing
                      </Link>
                    </div>
                  </StepBody>
                )}
              </StepRow>

              <StepDivider />

              {/* ── Step 2: Payment ── */}
              <StepRow>
                <StepHeader>
                  <StepCircle $done={paymentDone} $active={stepADone && !paymentDone}>
                    {paymentDone ? <Check size={12} strokeWidth={3} /> : "2"}
                  </StepCircle>
                  <StepMeta>
                    <StepLabel $muted={!stepADone && !paymentDone}>
                      Payment method{paymentDone ? " ✓" : ""}
                    </StepLabel>
                    {paymentDone && (
                      <StepSummary style={{ color: "#10b981" }}>Payment confirmed</StepSummary>
                    )}
                  </StepMeta>
                </StepHeader>

                {stepADone && !paymentDone && (
                  <StepBody>{renderStepBBody()}</StepBody>
                )}
              </StepRow>
            </StepsWrap>
          </GlassCard>

          {/* RIGHT: order summary */}
          <OrderSummary plan={plan} />
        </Grid>

        <FaqSection>
          <LazyMotion features={domAnimation}>
            <FaqContainer>
              {CHECKOUT_FAQ.map((item, i) => (
                <CheckoutFaqItem key={i} q={item.q} a={item.a} />
              ))}
            </FaqContainer>
          </LazyMotion>
        </FaqSection>

        {/* DEV: test success modal — hidden in production */}
        {process.env.NODE_ENV !== "production" && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setShowSuccessModal(true)}
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#9ca3b0", background: "none", border: "1px dashed rgba(0,0,0,0.15)",
                borderRadius: 8, padding: "7px 14px", cursor: "pointer",
              }}
            >
              ⚡ Test success modal
            </button>
          </div>
        )}
      </PageInner>
      <FooterSmart />
    </PageWrap>
  );
}

export default function WidgetCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <WidgetCheckoutContent />
    </Suspense>
  );
}
