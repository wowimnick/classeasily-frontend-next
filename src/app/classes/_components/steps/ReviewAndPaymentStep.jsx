import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ConfigProvider, Form, Input, Alert, Button } from "antd";
import message from "@/lib/message";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import confetti from "canvas-confetti";
import {
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Percent,
  UserCheck,
  RefreshCw,
  Ticket,
  MapPin,
  CalendarDays,
  X,
  Gift,
  CreditCard,
  Edit2,
  ChevronUp,
  Star,
} from "lucide-react";
import Lottie from "lottie-react";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";

import { getCancellationPolicyText, getDurationText } from "./utils";
import {
  businessDiscountService,
  giftCardService,
  globalDiscountService,
  bookingService,
} from "@/services/apiService";
import posthog from "posthog-js";
import { theme as appTheme } from "@/components/theme";
import { formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";
import loadingAnimation from "@/assets/animations/Scene.json";
import {
  ESTIMATED_SALES_TAX_RATE,
  estimateTaxFromSubtotal,
} from "@/lib/bookingPricing";

function buildIntentPriceBreakdown(response) {
  if (!response || typeof response !== "object") return null;
  const sub = response.subtotal;
  const tax = response.tax_amount;
  const total = response.amount;
  if (
    ![sub, tax, total].every(
      (v) => typeof v === "number" && Number.isFinite(v),
    )
  ) {
    return null;
  }
  return { subtotal: sub, tax_amount: tax, amount: total };
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// --- STYLED COMPONENTS ---

const StepContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  position: relative;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.2fr) 400px;
    gap: 40px;
    align-items: flex-start;
  }
`;

const LeftColumnWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;

  @media (max-width: 1023px) {
    .ant-input,
    .ant-input-affix-wrapper input,
    .ant-input-number-input {
      font-size: 16px !important;
    }
  }
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
`;

/* ACCORDION / SECTION STYLES – desktop and mobile (drawer-style on mobile) */
const SectionCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  padding-left: 4px;
  padding-right: 4px;

  @media (max-width: 1023px) {
    padding-left: 0;
    padding-right: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    margin-bottom: 24px;
  }

  ${(props) =>
    props.$disabled &&
    css`
      opacity: 0.6;
      pointer-events: none;
      background: #f9fafb;
    `}
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  background: white;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  @media (max-width: 1023px) {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: #222222;
    }
  }

  .edit-btn {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  @media (max-width: 1023px) {
    .edit-btn {
      color: #222222;
    }
  }
`;

const SectionContent = styled(motion.div)`
  padding: 8px 24px 24px 24px;

  @media (max-width: 1023px) {
    padding: 0;
  }
`;

const SectionContentInner = styled.div`
  padding: 8px 24px 24px 24px;
  border-top: 1px solid #f3f4f6;

  @media (max-width: 1023px) {
    padding: 0;
    border-top: none;
  }
`;

/* Drawer-style field rows on mobile (bordered rows like MobileReserveReviewDrawer) */
const CheckoutFieldRow = styled.div`
  @media (min-width: 1024px) {
    margin-bottom: 12px;
  }
  @media (max-width: 1023px) {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 0;
    &:last-of-type {
      border-bottom: none;
    }
  }
`;

/* On desktop: email + phone side by side; on mobile: stacked with borders */
const CheckoutContactRow = styled.div`
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
`;

const CheckoutPaymentBody = styled.div`
  @media (max-width: 1023px) {
    padding: 20px;
    padding-top: 0;
  }
`;

const COLLAPSE_TRANSITION = { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

function MeasuredCollapseSection({ children, ...motionProps }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => setHeight(el.scrollHeight));
    ro.observe(el);
    setHeight(el.scrollHeight);
    return () => ro.disconnect();
  }, [children]);
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={COLLAPSE_TRANSITION}
      style={{ overflow: "hidden" }}
      {...motionProps}
    >
      <SectionContentInner ref={ref}>{children}</SectionContentInner>
    </motion.div>
  );
}

function MeasuredMobileSummaryCollapse({ children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => setHeight(el.scrollHeight));
    ro.observe(el);
    setHeight(el.scrollHeight);
    return () => ro.disconnect();
  }, [children]);
  return (
    <MobileSummaryContent
      initial={{ height: 0, opacity: 0 }}
      animate={{ height, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={COLLAPSE_TRANSITION}
      style={{ overflow: "hidden" }}
    >
      <div ref={ref}>{children}</div>
    </MobileSummaryContent>
  );
}

const SummaryDataRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  
  .label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  .value {
    font-size: 15px;
    color: #111827;
    font-weight: 500;
  }

  @media (max-width: 1023px) {
    margin-bottom: 0;
    padding: 16px 12px;
    border-bottom: 1px solid #e5e7eb;
    .label {
      font-size: 15px;
      font-weight: 600;
      color: #222222;
    }
    .value {
      font-size: 14px;
      color: #717171;
      line-height: 1.4;
    }
    &:last-child {
      border-bottom: none;
    }
  }
`;

/* Step action buttons (Continue to payment, Edit details) */
const CheckoutStepActions = styled.div`
  margin-top: 16px;
  @media (max-width: 1023px) {
    padding: 16px 20px 0;
    margin-top: 0;
  }
`;

/* REFINED NEXT BUTTON */
const NextButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    @media (max-width: 1023px) {
      padding: 16px 20px;
      margin-top: 0;
      justify-content: stretch;
    }
`;

const NextButton = styled(Button)`
  height: 48px;
  min-width: 140px;
  font-size: 16px;
  font-weight: 600;
  background: #ff385c;
  border-color: #ff385c;
  border-radius: 8px;
  
  &:hover {
    background: #e31c5f !important;
    border-color: #e31c5f !important;
    opacity: 1 !important;
  }

  @media (max-width: 1023px) {
    width: 100%;
    min-width: unset;
    height: 52px;
    background: #222222;
    border-color: #222222;
    &:hover {
      background: #333 !important;
      border-color: #333 !important;
    }
  }
`;

const AdditionalNotesRevealButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0;
  margin-top: 12px;
  border: none;
  background: none;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  transition: color 0.15s ease;
  &:hover {
    color: #374151;
  }
`;

/* Skeleton matching Stripe Payment Element layout (Express + divider + card + expiry/cvc + button) */
const StripeSkeletonWrapper = styled.div`
  padding-top: 24px;
  width: 100%;
`;
const SkeletonBar = styled.div`
  height: 44px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: skeleton-shine 1.2s ease-in-out infinite;
  border-radius: 8px;
  @keyframes skeleton-shine {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
const SkeletonDivider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 20px 0 16px;
`;
const SkeletonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  & > *:first-child { flex: 1 1 50%; }
  & > *:last-child { flex: 1 1 50%; }
`;

/* Divider between express pay and card */
const PaymentMethodDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
`;

/* Payment Method Toggles */
const CardRevealButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 16px;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }

  span {
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const SummarySection = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: block;
    position: sticky;
    top: 100px; /* Account for sticky header */
  }
`;

/* Desktop Footer rendered INSIDE the payment section, so we just style the container */
const DesktopInlineFooter = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: block;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
  }
`;

// --- TICKET DESIGN COMPONENTS (Kept as is) ---
const TicketWrapper = styled.div`
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const TicketTop = styled.div`
  background-color: #ffffff;
  border-radius: 16px 16px 0 0;
  padding: 24px;
  position: relative;
  border: 1px solid #e5e7eb;
  border-bottom: none;

  &::after {
    content: "";
    position: absolute;
    bottom: -18px;
    left: -8px;
    width: 20px;
    height: 20px;
    background-color: #f3f4f6;
    border-radius: 50%;
    border-right: 1px solid #e5e7eb;
    z-index: 2;
  }

  &::before {
    content: "";
    position: absolute;
    bottom: -18px;
    right: -10px;
    width: 20px;
    height: 20px;
    background-color: #f3f4f6;
    border-radius: 50%;
    border-left: 1px solid #e5e7eb;
    z-index: 2;
  }
`;

const TicketDivider = styled.div`
  height: 20px;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    width: 86%;
    height: 0;
    border-top: 1px dashed #e5e7eb;
  }
`;

const TicketBottom = styled.div`
  background-color: #ffffff;
  border-radius: 0 0 16px 16px;
  padding: 24px;
  padding-top: 12px;
  position: relative;
  border: 1px solid #e5e7eb;
  border-top: none;
`;

const TicketHeaderTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const TicketSubHeader = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TicketRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #374151;

  span:first-child {
    color: #6b7280;
    font-weight: 500;
  }

  span:last-child {
    font-weight: 600;
    text-align: right;
  }
`;

const TicketTotalRow = styled(TicketRow)`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  margin-bottom: 0;
  align-items: center;

  span:first-child {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    text-transform: uppercase;
  }

  span:last-child {
    font-size: 24px;
    font-weight: 800;
    color: #111827;
  }
`;

const MobileSummaryContainer = styled.div`
  display: block;
  background: white;
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const MobileSummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: white;
  transition: background-color 0.2s;

  &:active {
    background-color: #f9fafb;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #111827;

    svg {
      color: #ff385c;
    }
  }

  .price-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .total-price {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .toggle-icon {
    color: #9ca3af;
    transition: transform 0.3s ease;
  }
`;

const MobileSummaryContent = styled(motion.div)`
  background: #fff;
  overflow: hidden;
`;

const MobileSummaryInner = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 12px 12px 2px;
`;

const MobileSummaryRowCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:last-of-type {
    margin-bottom: 0;
  }
`;

const MobileSummaryRowWithEdit = styled(MobileSummaryRowCard)`
  align-items: center;
  gap: 8px;
  .row-label {
    font-size: 13px;
    color: #6b7280;
    flex-shrink: 0;
  }
  .row-value {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    text-align: right;
    flex: 1;
    min-width: 0;
  }
`;

const MobileSummaryEditPencil = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: #ff385c;
    background: rgba(255, 56, 92, 0.08);
  }
`;

const ViewDetailsButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 6px;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover {
    color: #374151;
  }
`;

/* Mobile summary dropdown – match MobileReserveReviewDrawer (InfoCard, DetailRow, TotalSummaryCard) */
const MobileSummaryInfoCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-bottom: 24px;
`;
const MobileSummaryListingHeader = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
`;
const MobileSummaryListingImage = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const MobileSummaryListingInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
const MobileSummaryListingTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  line-height: 1.3;
  color: #222222;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
const MobileSummaryRatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #222222;
`;
const MobileSummaryDetailRow = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  &:last-child {
    border-bottom: none;
  }
`;
const MobileSummaryDetailContent = styled.div`
  display: flex;
  flex-direction: column;
`;
const MobileSummaryDetailLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #222222;
`;
const MobileSummaryDetailValue = styled.div`
  font-size: 14px;
  color: #717171;
  line-height: 1.4;
`;
const MobileSummaryEditLink = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  color: #222222;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  flex-shrink: 0;
`;
const MobileSummaryTotalCard = styled.div`
  background: white;
  border: 1px solid #111827;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .label-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .label {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }
  .label-sub {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }
  .value {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
  }
`;
const MobileSummaryViewDetailsBtn = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0 0 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-align: center;
  width: 100%;
  &:hover {
    color: #374151;
  }
`;
const MobileSummaryPolicySection = styled.div`
  margin-bottom: 24px;
`;
const MobileSummaryPolicyText = styled.div`
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 6px;
`;
const MobileSummaryPolicyLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  color: #111827;
  cursor: pointer;
`;

/* Price details drawer (Vaul) */
const PriceDetailsDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;
const PriceDetailsDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  max-height: 70vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;
const PriceDetailsDrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;
const PriceDetailsDrawerBody = styled.div`
  overflow-y: auto;
  padding: 24px 24px 32px;
  min-height: 0;
`;

const PolicyDetailsDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1055;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;
const PolicyDetailsDrawerContent = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1056;
  outline: none;
`;

/* Label above fields – drawer-style on mobile (15px, 600, #222) */
const FieldLabel = styled.span`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #111827;
  @media (max-width: 1023px) {
    font-size: 15px;
    color: #222222;
  }
`;

const SummaryMetaBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
`;

const TicketEditPencil = styled.button`
  margin-left: auto;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: #ff385c;
    background: rgba(255, 56, 92, 0.08);
  }
`;

const TicketMetaItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .text-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .label {
      font-size: 11px;
      text-transform: uppercase;
      color: #9ca3af;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .value {
      font-size: 14px;
      color: #111827;
      font-weight: 600;
      line-height: 1.4;
    }
  }
`;

const InfoPanel = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  background: ${(props) => props.$bgColor || "#f9fafb"};
  border: 1px solid ${(props) => props.$borderColor || "#e5e7eb"};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: ${(props) => props.$iconColor || "#6b7280"};
  }

  div {
    flex: 1;
    h5 {
      margin: 0 0 4px 0;
      font-size: 13px;
      font-weight: 600;
      color: ${(props) => props.$titleColor || "#111827"};
    }
    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: ${(props) => props.$textColor || "#4b5563"};
    }
  }
`;

// -- Promo / Gift card: unified styles and reveal button --
const PromoRevealButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0 0 12px 0;
  margin-bottom: 4px;
  text-decoration: underline;

  &:hover {
    color: #111827;
  }
`;

const CouponTicketInput = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;

  .ant-input,
  .ant-input-affix-wrapper input {
    font-size: 14px;
  }
  @media (max-width: 1023px) {
    .ant-input,
    .ant-input-affix-wrapper input {
      font-size: 16px;
    }
  }

  .ant-btn {
    font-size: 14px;
    font-weight: 600;
    box-shadow: none;
    border: 1px solid #111827;
    background: #111827;
    color: white;

    &:hover {
      background: #374151;
      border-color: #374151;
      color: white;
    }

    &:disabled {
      background: #f3f4f6;
      border-color: #e5e7eb;
      color: #9ca3af;
    }
  }
`;

const AppliedCouponTicket = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 10px 14px;
  background-color: #ecfdf5;
  border: 1px dashed #34d399;
  border-radius: 12px;
  color: #047857;
  font-weight: 600;
  font-size: 13px;

  .coupon-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  button {
    color: #047857;
    opacity: 0.7;
    transition: opacity 0.2s;
    &:hover {
      opacity: 1;
      background: rgba(4, 120, 87, 0.1);
    }
  }
`;

const TimerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: ${(props) => (props.$urgent ? "13px" : "12px")};
  font-weight: ${(props) => (props.$urgent ? "700" : "500")};
  border-radius: 20px;
  transition: all 0.3s ease;
  color: ${(props) => (props.$urgent ? "#dc2626" : "#9ca3af")};
  white-space: nowrap;
`;

const MobileTimerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${(props) => (props.$urgent ? "10px 12px" : "8px 0")};
  margin-top: 8px;
  margin-bottom: 12px;
  transition: background 0.3s ease, padding 0.3s ease;
  ${(props) =>
    props.$urgent &&
    `
    border-radius: 8px;
    margin-top: 12px;
  `}
  @media (min-width: 1024px) {
    display: none;
  }
`;

const DesktopTimerContainer = styled.div`
  display: none;
  text-align: right;
  @media (min-width: 1024px) {
    display: block;
  }
`;

const ExpiredOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  text-align: center;
  padding: 32px;
  overflow: hidden;
`;

const ExpiredContent = styled.div`
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-width: 320px;
  width: 100%;

  h3 {
    margin: 16px 0 8px;
    color: #111827;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    color: #6b7280;
    margin-bottom: 24px;
    line-height: 1.5;
    font-size: 13px;
  }
`;

const ExpiredIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: #dc2626;
`;

// --- NEW LOADER STYLES ---
const LottieContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
`;

const LottieText = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
  margin-bottom: 0;
`;

const LottieSubText = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
`;

// --- HELPERS ---
const Countdown = ({ seconds }) => {
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return (
    <NumberFlowGroup>
      <div
        style={{
          fontVariantNumeric: "tabular-nums",
          "--number-flow-char-height": "0.85em",
          display: "flex",
          alignItems: "baseline",
          fontWeight: 600,
          fontSize: "1.1em",
        }}
      >
        <NumberFlow
          trend={-1}
          value={mm}
          format={{ minimumIntegerDigits: 2 }}
        />
        <NumberFlow
          prefix=":"
          trend={-1}
          value={ss}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
        />
      </div>
    </NumberFlowGroup>
  );
};

function buildParticipantDetailsPayload(
  values,
  participantsCount,
  requirePerParticipantNames,
) {
  const bookerName =
    (values?.booker_name && String(values.booker_name).trim()) || "Guest";
  if (!requirePerParticipantNames || participantsCount <= 1) {
    return Array.from({ length: participantsCount }, () => ({ name: bookerName }));
  }
  const extraRaw = values?.additional_participant_names;
  const extra = Array.isArray(extraRaw)
    ? extraRaw.map((n) => String(n ?? "").trim())
    : [];
  // API requires every slot to have a non-empty name. Use the same placeholder as the
  // booker default until the guest fills additional names; Next / updatePaymentIntent
  // replaces these with real values before capture.
  const placeholder = "Guest";
  const names = [bookerName];
  for (let i = 1; i < participantsCount; i++) {
    const entered = extra[i - 1];
    names.push(entered && entered.length > 0 ? entered : placeholder);
  }
  return names.map((name) => ({ name }));
}

const ExpressCheckoutButton = ({
  finalTotal,
  clientSecret,
  onPaymentComplete,
  paymentService,
  bookingData,
  form,
  isFormValid,
  onPaymentRequestReady,
  /** When provided, render this instead of Stripe's button; it receives paymentRequest so the parent can call paymentRequest.show() */
  customTrigger,
  requirePerParticipantNames = false,
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe || !finalTotal) return;

    const pr = stripe.paymentRequest({
      country: "CA",
      currency: "cad",
      total: {
        label: "Experience Booking",
        amount: Math.round(finalTotal * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        onPaymentRequestReady?.();
      }
    });

    pr.on("paymentmethod", async (ev) => {
      try {
        if (!form) {
          ev.complete("fail");
          message.error("Whoops! Something went wrong. Please try again.");
          return;
        }

        const values = form.getFieldsValue();
        const email = (values?.email && String(values.email).trim()) || "";
        const phone = (values?.phone && String(values.phone).trim()) || "";
        const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "";
        const participantsCount = bookingData?.participants || 1;
        const participantDetailsPayload = buildParticipantDetailsPayload(
          values,
          participantsCount,
          requirePerParticipantNames,
        );

        // Only call update_intent when we have real guest data; otherwise leave metadata
        // as set by "Next" (avoids overwriting good metadata with empty from stale form).
        if (clientSecret && paymentService?.updatePaymentIntent && email) {
          try {
            const paymentIntentId = clientSecret.split("_secret_")[0];
            await paymentService.updatePaymentIntent({
              payment_intent_id: paymentIntentId,
              guest_email: email,
              guest_full_name: bookerName,
              guest_phone: phone,
              participant_details: participantDetailsPayload,
              notes: values?.notes || bookingData?.notes || "",
              applied_discount_id: bookingData?.applied_discount_id ?? null,
            });
          } catch (backendErr) {
            ev.complete("fail");
            message.error("Whoops! We couldn't save your details. Please try again.");
            return;
          }
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: ev.paymentMethod.id,
            receipt_email: email || undefined,
          },
          { handleActions: false },
        );

        if (error) {
          ev.complete("fail");
          message.error(error.message || "Whoops! Payment didn't go through. Please try again.");
        } else {
          ev.complete("success");
          if (paymentIntent?.status === "succeeded") {
            onPaymentComplete({
              payment_intent_id: paymentIntent.id,
              client_secret: clientSecret,
              participant_details: participantDetailsPayload,
            });
          }
        }
      } catch (err) {
        ev.complete("fail");
        message.error("Whoops! Something went wrong. Please try again.");
      }
    });
  }, [
    stripe,
    finalTotal,
    clientSecret,
    onPaymentComplete,
    paymentService,
    bookingData,
    form,
    requirePerParticipantNames,
  ]);

  if (!paymentRequest || !isFormValid) return null;

  if (customTrigger) {
    return <div style={{ marginBottom: 0 }}>{customTrigger(paymentRequest)}</div>;
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
    </div>
  );
};

const PaymentElementWrapper = styled.div`
  width: 100%;
`;

const paymentElementOptions = {
  layout: "tabs",
  wallets: {
    applePay: "never", // We use the custom Express button above
    googlePay: "never",
  },
  defaultValues: {
    billingDetails: {
      address: {
        country: "CA",
      },
    },
  },
  fields: {
    billingDetails: {
      address: {
        country: "never",
      },
    },
  },
};

const PaymentFormContent = ({
  form,
  handleSubmit,
  loading,
  isFree,
  isFormValid,
  finalTotal,
  clientSecret,
  onPaymentAction,
  onPaymentComplete,
  onPaymentLoadError,
  paymentService,
  bookingData,
  currentStep,
  isVisible,
  requirePerParticipantNames = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [hasExpressPay, setHasExpressPay] = useState(false);
  const [showCardFields, setShowCardFields] = useState(false);

  const handleLoadError = useCallback(
    (event) => {
      const msg = event?.error?.message || "";
      const isTerminalState =
        msg.includes("terminal state") ||
        msg.includes("cannot be used to initialize Elements");
      if (isTerminalState && onPaymentLoadError) {
        onPaymentLoadError();
      }
    },
    [onPaymentLoadError]
  );

  // Auto-expand card fields if no express pay is available after a short timeout
  useEffect(() => {
    if (!hasExpressPay && !showCardFields && clientSecret && !isFree) {
        const t = setTimeout(() => setShowCardFields(true), 1500);
        return () => clearTimeout(t);
    }
  }, [hasExpressPay, showCardFields, clientSecret, isFree]);

  // Sync with parent for the footer button state
  useEffect(() => {
    const canSubmit = isFree
      ? !loading && isFormValid
      : stripe && elements && !loading && isFormValid && isReady;

    onPaymentAction?.({
      handleSubmit: () => handleSubmit(stripe, elements),
      loading,
      canSubmit,
      finalTotal,
      // Hide footer button if user is in Step 1
      showFooterButton: currentStep === 'payment',
    });
  }, [
    onPaymentAction,
    handleSubmit,
    loading,
    stripe,
    elements,
    finalTotal,
    isFormValid,
    isReady,
    isFree,
    currentStep,
  ]);

  if (isFree) {
    if (!isVisible) return null;
    return (
        <Alert 
            message="No payment required" 
            description="Your booking is fully covered by the discount or gift card." 
            type="success" 
            showIcon 
            style={{marginTop: 16}}
        />
    );
  }

  if (!clientSecret) return null;

  const stripeUINotReady =
    (!hasExpressPay && !showCardFields) || (showCardFields && !isReady);

  return (
    <div style={{ display: isVisible ? "block" : "none", position: "relative", minHeight: stripeUINotReady ? 220 : undefined }}>
      {stripeUINotReady && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} aria-hidden="true">
          <StripeSkeletonWrapper>
            <SkeletonBar style={{ width: "100%" }} />
            <SkeletonRow>
              <SkeletonBar />
              <SkeletonBar />
            </SkeletonRow>
          </StripeSkeletonWrapper>
        </div>
      )}
      <div style={{ visibility: stripeUINotReady ? "hidden" : "visible", paddingTop: hasExpressPay ? 16 : 0 }}>
        <ExpressCheckoutButton
          finalTotal={finalTotal}
          clientSecret={clientSecret}
          onPaymentComplete={onPaymentComplete}
          paymentService={paymentService}
          bookingData={bookingData}
          form={form}
          isFormValid={isFormValid}
          requirePerParticipantNames={requirePerParticipantNames}
          onPaymentRequestReady={() => {
            setHasExpressPay(true);
          }}
        />

        {hasExpressPay && (
          <PaymentMethodDivider>or</PaymentMethodDivider>
        )}

        {hasExpressPay && !showCardFields && (
          <CardRevealButton type="button" onClick={() => setShowCardFields(true)}>
            <span><CreditCard size={18} /> Pay with Credit or Debit card</span>
            <ChevronDown size={16} color="#6b7280" />
          </CardRevealButton>
        )}

        <div style={{ display: showCardFields ? "block" : "none", marginTop: 24 }}>
          <PaymentElementWrapper>
            <PaymentElement
              options={paymentElementOptions}
              onReady={() => setIsReady(true)}
              onLoadError={handleLoadError}
            />
          </PaymentElementWrapper>
        </div>
      </div>
    </div>
  );
};

const ReviewAndPaymentStep = ({
  bookingData,
  classData,
  paymentService,
  onPaymentComplete,
  isUserLoggedIn,
  onUpdateBookingData,
  onPaymentAction,
  userTimeZone,
  businessTimeZone,
  confirmFooter,
  onRequestChangeDate,
  onRequestChangeTime,
  onRequestChangeParticipants,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentIntentError, setPaymentIntentError] = useState(null);
  const [clientSecret, setClientSecret] = useState(
    () => bookingData?.clientSecret ?? null
  );
  const [isFormValid, setIsFormValid] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [priceDetailsDrawerOpen, setPriceDetailsDrawerOpen] = useState(false);
  const [policyDetailsDrawerOpen, setPolicyDetailsDrawerOpen] = useState(false);
  
  // Step State: 'guest' | 'payment'
  const [checkoutStep, setCheckoutStep] = useState("guest");
  const paymentStepRef = useRef(null);
  // Notes UI state
  const [showNotes, setShowNotes] = useState(false);

  const participantsCount = bookingData?.participants || 1;
  const requirePerParticipantNames =
    Boolean(classData?.require_participant_names) && participantsCount > 1;

  const guestContactFieldNames = useMemo(() => {
    const base = ["booker_name", "email", "phone"];
    if (!requirePerParticipantNames || participantsCount <= 1) return base;
    const extra = [];
    for (let i = 0; i < participantsCount - 1; i++) {
      extra.push(["additional_participant_names", i]);
    }
    return [...base, ...extra];
  }, [requirePerParticipantNames, participantsCount]);

  useEffect(() => {
    const fromStorage = bookingData?.clientSecret;
    if (fromStorage && !clientSecret) setClientSecret(fromStorage);
  }, [bookingData?.clientSecret]);

  // When parent has no clientSecret (e.g. reopened checkout from session), show guest step so user sees form; don't leave them on payment with empty fields.
  useEffect(() => {
    if (!bookingData?.clientSecret && checkoutStep === "payment") {
      setCheckoutStep("guest");
    }
  }, [bookingData?.clientSecret, checkoutStep]);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Gift Card State
  const [giftCardCode, setGiftCardCode] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [gcLoading, setGcLoading] = useState(false);

  const [showPromoGiftCard, setShowPromoGiftCard] = useState(false);
  const [activeGlobalDiscount, setActiveGlobalDiscount] = useState(null);

  // --- SLOT AVAILABILITY (poll every minute; no spot holding) ---
  const [slotUnavailable, setSlotUnavailable] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [updatingIntentForPayment, setUpdatingIntentForPayment] = useState(false);

  const debounceTimerRef = useRef(null);
  const intentDepsRef = useRef({
    discountId: null,
    gcCode: null,
    globalId: null,
    bookingFingerprint: null,
  });
  const fetchIntentInFlightRef = useRef(false);
  const intentCreationAttemptedRef = useRef(false);
  const paymentSubmitInFlightRef = useRef(false);

  const bookingFingerprint = useMemo(() => {
    const slot = bookingData?.selectedSlots?.[0];
    if (!slot) return null;
    const participants = bookingData?.participants ?? 1;
    const price = bookingData?.price ?? 0;
    return `${slot.id ?? ""}-${slot.date ?? ""}-${slot.time ?? ""}-${participants}-${price}`;
  }, [
    bookingData?.selectedSlots?.[0]?.id,
    bookingData?.selectedSlots?.[0]?.date,
    bookingData?.selectedSlots?.[0]?.time,
    bookingData?.participants,
    bookingData?.price,
  ]);

  useEffect(() => {
    posthog.capture("booking_payment_initiated", {
      class_id: classData?.classId || classData?.id,
      class_title: classData?.title,
      participants: bookingData.participants,
    });
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const validateValues = useCallback(
    (values) => {
      const { email, phone, booker_name } = values;
      const contactFields = [email, phone, booker_name];
      if (!contactFields.every((val) => val && String(val).trim().length > 0)) {
        return false;
      }
      if (!requirePerParticipantNames || participantsCount <= 1) return true;
      const extra = values?.additional_participant_names;
      if (!Array.isArray(extra)) return false;
      for (let i = 0; i < participantsCount - 1; i++) {
        const n = extra[i];
        if (!n || !String(n).trim()) return false;
        if (String(n).trim().toLowerCase() === "guest") return false;
      }
      return true;
    },
    [requirePerParticipantNames, participantsCount],
  );

  const getGuestFullName = useCallback(
    (values) => {
      if (isUserLoggedIn) return bookingData.userName || "";
      const name = values?.booker_name;
      return (name && String(name).trim()) || "Pending Guest";
    },
    [isUserLoggedIn, bookingData.userName],
  );

  /* Sync bookingData into form so saved guest details (and notes) are shown when reopening checkout or going back to guest step. */
  const hasSyncedInitialRef = useRef(false);
  useEffect(() => {
    if (!form) return;
    let formData = {};

    if (isUserLoggedIn) {
      formData.email = bookingData.email ?? bookingData.userEmail ?? "";
      formData.phone = bookingData.phone ?? bookingData.userPhone ?? "";
      formData.booker_name = bookingData.booker_name ?? bookingData.userName ?? "";
    } else {
      /* Guest: restore email, phone, booker_name from bookingData when present so fields aren't empty on reopen or back to guest. */
      const bookerFromDetails = bookingData.participant_details?.[0]?.name;
      const name = bookingData.booker_name ?? bookerFromDetails ?? "";
      const email = bookingData.email ?? "";
      const phone = bookingData.phone ?? "";
      const currentValues = form.getFieldsValue(true);
      if (name && (!currentValues.booker_name || !String(currentValues.booker_name).trim())) formData.booker_name = name;
      if (email && (!currentValues.email || !String(currentValues.email).trim())) formData.email = email;
      if (phone && (!currentValues.phone || !String(currentValues.phone).trim())) formData.phone = phone;
    }
    if (formData.booker_name !== undefined) hasSyncedInitialRef.current = true;

    const currentNotes = form.getFieldValue("notes");
    const notesFromBooking = bookingData.notes ?? "";
    if (notesFromBooking !== "" && currentNotes !== notesFromBooking) {
      formData.notes = notesFromBooking;
    }

    const pc = bookingData.participants || 1;
    const rp = Boolean(classData?.require_participant_names) && pc > 1;
    if (rp) {
      const need = pc - 1;
      const fromPd = bookingData.participant_details;
      const curExtra = form.getFieldValue("additional_participant_names");
      const allEmpty =
        !Array.isArray(curExtra) ||
        curExtra.slice(0, need).every((x) => !x || !String(x).trim());
      if (allEmpty && fromPd?.length) {
        const extra = [];
        for (let i = 0; i < need; i++) {
          extra.push(
            fromPd[i + 1]?.name != null ? String(fromPd[i + 1].name) : "",
          );
        }
        formData.additional_participant_names = extra;
      }
    } else {
      formData.additional_participant_names = undefined;
    }

    if (Object.keys(formData).length > 0) {
      form.setFieldsValue(formData);
    }

    const isValid = validateValues({
      ...form.getFieldsValue(true),
      ...formData,
    });
    setIsFormValid(isValid);
  }, [isUserLoggedIn, bookingData, classData, form, validateValues]);

  useEffect(() => {
    if (!form) return;
    if (!requirePerParticipantNames || participantsCount <= 1) {
      form.setFieldValue("additional_participant_names", undefined);
      return;
    }
    const need = participantsCount - 1;
    const cur = form.getFieldValue("additional_participant_names");
    const arr = Array.isArray(cur) ? [...cur] : [];
    while (arr.length < need) arr.push("");
    if (arr.length > need) arr.length = need;
    form.setFieldValue("additional_participant_names", arr);
  }, [form, requirePerParticipantNames, participantsCount]);

  const selectedSlot = bookingData.selectedSlots?.[0];
  const option = bookingData.selectedOption;
  const basePrice = parseFloat(selectedSlot?.price || option?.price || 0);
  const subtotal = basePrice * participantsCount;

  const subtotalForGlobal =
    subtotal -
    (appliedDiscount ? parseFloat(appliedDiscount.calculated_discount_amount) || 0 : 0);

  useEffect(() => {
    if (subtotalForGlobal <= 0) {
      setActiveGlobalDiscount(null);
      return;
    }
    let cancelled = false;
    globalDiscountService.getActive(subtotalForGlobal).then((res) => {
      if (!cancelled && res.success && res.data) {
        setActiveGlobalDiscount(res.data);
      } else if (!cancelled) {
        setActiveGlobalDiscount(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subtotalForGlobal]);

  const { discountAmount, taxAmount, finalTotal, gcDeduction, taxFromBackend } =
    useMemo(() => {
      const businessDiscount = appliedDiscount
        ? parseFloat(appliedDiscount.calculated_discount_amount) || 0
        : 0;
      const globalDiscount = activeGlobalDiscount?.calculated_discount_amount
        ? parseFloat(activeGlobalDiscount.calculated_discount_amount) || 0
        : 0;
      const totalDiscount = businessDiscount + globalDiscount;
      const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);

      const breakdown = bookingData?.intentPriceBreakdown;
      const hasBackend =
        breakdown &&
        typeof breakdown.tax_amount === "number" &&
        Number.isFinite(breakdown.tax_amount) &&
        typeof breakdown.amount === "number" &&
        Number.isFinite(breakdown.amount);

      const tax = hasBackend
        ? breakdown.tax_amount
        : estimateTaxFromSubtotal(subtotalAfterDiscount);
      const grossTotal = hasBackend
        ? breakdown.amount
        : subtotalAfterDiscount + tax;

      let deduction = 0;
      if (appliedGiftCard) {
        deduction = Math.min(grossTotal, parseFloat(appliedGiftCard.balance));
      }

      const payable = Math.max(0, grossTotal - deduction);

      return {
        discountAmount: totalDiscount,
        taxAmount: tax,
        finalTotal: payable,
        gcDeduction: deduction,
        taxFromBackend: !!hasBackend,
      };
    }, [
      subtotal,
      appliedDiscount,
      appliedGiftCard,
      activeGlobalDiscount,
      bookingData?.intentPriceBreakdown,
    ]);

  const isFree = finalTotal === 0;

  const taxLineLabel = taxFromBackend
    ? "Tax"
    : `Estimated tax (${Math.round(ESTIMATED_SALES_TAX_RATE * 100)}%)`;

  const fetchPaymentIntent = useCallback(
    async (currentDiscountId = null) => {
      if (isFree && !appliedGiftCard) return;
      if (
        !bookingData.selectedSlots ||
        bookingData.selectedSlots.length === 0
      ) {
        return;
      }

      fetchIntentInFlightRef.current = true;
      try {
        setPaymentIntentError(null);
        const values = form.getFieldsValue();
        const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "Guest";
        const participantDetailsPayload = buildParticipantDetailsPayload(
          values,
          participantsCount,
          requirePerParticipantNames,
        );

        const payload = {
          selectedSlots: bookingData.selectedSlots,
          participants: participantsCount,
          notes: values.notes || "",
          participant_details: participantDetailsPayload,
          applied_discount_id: currentDiscountId,
          guest_email: values.email || "pending@example.com",
          guest_full_name: bookerName,
          guest_phone: values.phone || "555-555-5555",
          gift_card_code: appliedGiftCard?.code || null,
        };

        const response = await paymentService.createPaymentIntent(payload);

        if (response.clientSecret) {
          fetchIntentInFlightRef.current = false;
          setClientSecret(response.clientSecret);
          setPaymentIntentError(null);
          if (onUpdateBookingData) {
            const paymentIntentId = response.clientSecret.split("_secret_")[0];
            const intentPriceBreakdown = buildIntentPriceBreakdown(response);
            onUpdateBookingData({
              paymentIntentId: paymentIntentId,
              clientSecret: response.clientSecret,
              ...(intentPriceBreakdown
                ? { intentPriceBreakdown }
                : {}),
            });
          }
        } else {
          fetchIntentInFlightRef.current = false;
        }
      } catch (err) {
        fetchIntentInFlightRef.current = false;
        const data = err?.response?.data;
        const errObj = data?.error;
        const msg =
          (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
          (Array.isArray(errObj?.non_field_errors) && errObj.non_field_errors[0]) ||
          (typeof data?.error === "string" ? data.error : null) ||
          (typeof errObj === "string" ? errObj : null) ||
          err?.message ||
          "Whoops! We couldn't reserve the spots right now. Please try again.";
        message.error(msg);
        setPaymentIntentError(msg);
      }
    },
    [
      bookingData,
      participantsCount,
      isFree,
      form,
      paymentService,
      onUpdateBookingData,
      appliedGiftCard,
      getGuestFullName,
      requirePerParticipantNames,
    ],
  );

  // When slot/discount/participants change and we already have an intent, clear it and allow a new intent (e.g. after changing date/time/guests from mobile summary).
  useEffect(() => {
    if (isFree || !clientSecret) return;
    const discountId = appliedDiscount?.id ?? null;
    const gcCode = appliedGiftCard?.code ?? null;
    const globalId = activeGlobalDiscount?.id ?? null;
    const prev = intentDepsRef.current;
    const discountMatch =
      prev.discountId === discountId &&
      prev.gcCode === gcCode &&
      prev.globalId === globalId;
    const bookingMatch = prev.bookingFingerprint === bookingFingerprint;
    if (discountMatch && bookingMatch) return;

    intentDepsRef.current = {
      discountId,
      gcCode,
      globalId,
      bookingFingerprint: bookingFingerprint ?? null,
    };
    intentCreationAttemptedRef.current = false;
    const paymentIntentId = clientSecret.split("_secret_")[0];
    paymentService.cancelPaymentIntent(paymentIntentId).catch(() => {});
    setClientSecret(null);
    onUpdateBookingData?.({
      clientSecret: null,
      paymentIntentId: null,
      intentPriceBreakdown: null,
    });
    setPaymentIntentError(null);
  }, [
    appliedDiscount?.id,
    appliedGiftCard?.code,
    activeGlobalDiscount?.id,
    bookingFingerprint,
    clientSecret,
    isFree,
    onUpdateBookingData,
  ]);

  // Poll slot availability every 60s (no spot holding)
  useEffect(() => {
    if (isFree || !selectedSlot?.id) return;
    const instanceId = selectedSlot.id;
    const participants = participantsCount || 1;
    const check = () => {
      paymentService
        .checkSlotAvailability(instanceId, participants)
        .then((res) => {
          if (res?.availabilityCheckFailed) return;
          setSlotUnavailable(!res.available);
        });
    };
    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [isFree, selectedSlot?.id, participantsCount]);

  // Create payment intent as soon as we have slot, date, time, participants (and discount/gift card).
  // Use placeholder guest details; backend accepts them and we update via updatePaymentIntent when the user clicks Next.
  useEffect(() => {
    if (
      isFree ||
      clientSecret ||
      creatingIntent ||
      slotUnavailable ||
      intentCreationAttemptedRef.current
    )
      return;
    if (checkoutStep !== "payment" && checkoutStep !== "guest") return;
    if (
      !bookingData?.selectedSlots?.length ||
      !bookingData?.selectedOption
    ) return;

    intentCreationAttemptedRef.current = true;
    setCreatingIntent(true);
    setPaymentIntentError(null);

    const run = async () => {
      try {
        const participantDetailsPayload = buildParticipantDetailsPayload(
          { booker_name: "Guest", additional_participant_names: [] },
          participantsCount,
          requirePerParticipantNames,
        );
        const payload = {
          selectedSlots: bookingData.selectedSlots,
          participants: participantsCount,
          notes: "",
          participant_details: participantDetailsPayload,
          applied_discount_id: appliedDiscount?.id ?? null,
          guest_email: "pending@example.com",
          guest_full_name: "Guest",
          guest_phone: "555-555-5555",
          gift_card_code: appliedGiftCard?.code ?? null,
        };
        const response = await paymentService.createPaymentIntent(payload);
        if (response?.clientSecret) {
          const paymentIntentId = response.clientSecret.split("_secret_")[0];
          if (process.env.NODE_ENV === "development") {
            console.info(
              "[Booking] createPaymentIntent SUCCESS (useEffect)",
              new Date().toISOString(),
              { payment_intent_id: paymentIntentId },
            );
          }
          const intentPriceBreakdown = buildIntentPriceBreakdown(response);
          setClientSecret(response.clientSecret);
          onUpdateBookingData?.({
            paymentIntentId,
            clientSecret: response.clientSecret,
            ...(intentPriceBreakdown ? { intentPriceBreakdown } : {}),
          });
          intentDepsRef.current = {
            discountId: appliedDiscount?.id ?? null,
            gcCode: appliedGiftCard?.code ?? null,
            globalId: activeGlobalDiscount?.id ?? null,
            bookingFingerprint: bookingFingerprint ?? null,
          };
        }
      } catch (err) {
        intentCreationAttemptedRef.current = false;
        const data = err?.response?.data || err;
        const errObj = data?.error;
        const msg =
          (Array.isArray(data?.non_field_errors) && data.non_field_errors?.[0]) ||
          (Array.isArray(errObj?.non_field_errors) && errObj?.non_field_errors?.[0]) ||
          (typeof data?.error === "string" ? data.error : null) ||
          (typeof errObj === "string" ? errObj : null) ||
          err?.message ||
          "We couldn't prepare payment. Please try again.";
        message.error(msg);
        setPaymentIntentError(msg);
      } finally {
        setCreatingIntent(false);
      }
    };
    run();
  }, [
    checkoutStep,
    isFree,
    clientSecret,
    creatingIntent,
    slotUnavailable,
    bookingData?.selectedSlots,
    bookingData?.selectedOption,
    participantsCount,
    appliedDiscount?.id,
    appliedGiftCard?.code,
    activeGlobalDiscount?.id,
    bookingFingerprint,
    onUpdateBookingData,
    paymentService,
    requirePerParticipantNames,
  ]);

  // When paid and no clientSecret: hide footer until we have intent; when we have clientSecret it's set by PaymentFormContent.
  useEffect(() => {
    if (isFree) return;
    if (!clientSecret) {
      onPaymentAction?.({
        handleSubmit: undefined,
        loading: creatingIntent,
        canSubmit: false,
        finalTotal: finalTotal ?? 0,
        showFooterButton: false,
      });
    }
  }, [isFree, clientSecret, creatingIntent, finalTotal, onPaymentAction]);

  const handlePaymentElementLoadError = useCallback(() => {
    const paymentIntentId =
      clientSecret?.split("_secret_")[0] || bookingData?.paymentIntentId;
    if (paymentIntentId) {
      paymentService.cancelPaymentIntent(paymentIntentId).catch(() => {});
    }
    intentCreationAttemptedRef.current = false;
    setClientSecret(null);
    setPaymentIntentError(
      "Payment form couldn't load. Please try again."
    );
    onUpdateBookingData?.({
      clientSecret: null,
      paymentIntentId: null,
      intentPriceBreakdown: null,
    });
  }, [clientSecret, bookingData?.paymentIntentId, onUpdateBookingData, paymentService]);

  const handleGoBackToGuest = useCallback(() => {
    if (checkoutStep !== "payment") return;
    setPaymentIntentError(null);
    setCheckoutStep("guest");
    // Keep clientSecret and intent; we stay in the same layout branch so the step doesn't remount
    // and the open animation doesn't replay. When user clicks Next again we update the intent via handleGoToPayment.
  }, [checkoutStep]);

  const handleCreateIntentAndShowPayment = useCallback(async () => {
    if (slotUnavailable || creatingIntent || isFree) return;
    try {
      await form.validateFields(guestContactFieldNames);
    } catch {
      return;
    }
    if (
      !bookingData?.selectedSlots?.length ||
      !bookingData?.selectedOption
    ) {
      message.error("Missing booking details.");
      return;
    }
    setCreatingIntent(true);
    setPaymentIntentError(null);
    try {
      const values = form.getFieldsValue();
      const bookerName =
        (values?.booker_name && String(values.booker_name).trim()) || "Guest";
      const participantDetailsPayload = buildParticipantDetailsPayload(
        values,
        participantsCount,
        requirePerParticipantNames,
      );
      const payload = {
        selectedSlots: bookingData.selectedSlots,
        participants: participantsCount,
        notes: values.notes || "",
        participant_details: participantDetailsPayload,
        applied_discount_id: appliedDiscount?.id ?? null,
        guest_email: values.email || "pending@example.com",
        guest_full_name: bookerName,
        guest_phone: values.phone || "555-555-5555",
        gift_card_code: appliedGiftCard?.code || null,
      };
      const response = await paymentService.createPaymentIntent(payload);
      if (response?.clientSecret) {
        setClientSecret(response.clientSecret);
        const paymentIntentId = response.clientSecret.split("_secret_")[0];
        const intentPriceBreakdown = buildIntentPriceBreakdown(response);
        onUpdateBookingData?.({
          paymentIntentId,
          clientSecret: response.clientSecret,
          ...(intentPriceBreakdown ? { intentPriceBreakdown } : {}),
        });
        intentDepsRef.current = {
          discountId: appliedDiscount?.id ?? null,
          gcCode: appliedGiftCard?.code ?? null,
          globalId: activeGlobalDiscount?.id ?? null,
          bookingFingerprint: bookingFingerprint ?? null,
        };
      }
    } catch (err) {
      const data = err?.response?.data || err;
      const errObj = data?.error;
      const msg =
        (Array.isArray(data?.non_field_errors) && data.non_field_errors?.[0]) ||
        (Array.isArray(errObj?.non_field_errors) && errObj?.non_field_errors?.[0]) ||
        (typeof data?.error === "string" ? data.error : null) ||
        (typeof errObj === "string" ? errObj : null) ||
        err?.message ||
        "We couldn't prepare payment. Please try again.";
      message.error(msg);
      setPaymentIntentError(msg);
    } finally {
      setCreatingIntent(false);
    }
  }, [
    slotUnavailable,
    creatingIntent,
    isFree,
    form,
    bookingData?.selectedSlots,
    bookingData?.selectedOption,
    participantsCount,
    appliedDiscount?.id,
    appliedGiftCard?.code,
    activeGlobalDiscount?.id,
    bookingFingerprint,
    onUpdateBookingData,
    paymentService,
    guestContactFieldNames,
    requirePerParticipantNames,
  ]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      message.error("Please enter a coupon code to apply.");
      return;
    }
    setCouponLoading(true);
    try {
      const result = await businessDiscountService.validateCoupon({
        code: couponCode.trim(),
        option_id: option.optionId,
        base_amount: subtotal,
      });
      if (result.success) {
        setAppliedDiscount(result.data);
        message.success(`Coupon "${result.data.code}" applied!`);
        confetti({
          particleCount: 150,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#ff385c", "#000000", "#ffffff"],
        });
      } else {
        message.error(result.error?.detail || "That coupon isn't valid. Double-check the code and try again.");
        setAppliedDiscount(null);
      }
    } catch (err) {
      message.error("Whoops! Something went wrong applying the coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponCode("");
    message.info("Coupon removed.");
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setGcLoading(true);
    try {
      const data = await giftCardService.validateGiftCard(giftCardCode);
      setAppliedGiftCard(data);
      message.success(`Gift card applied: $${data.balance} available`);
    } catch (err) {
      message.error(err.error || "That gift card code didn't work. Please check and try again."); 
      setAppliedGiftCard(null);
    } finally {
      setGcLoading(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode("");
  };

  const handleFormValuesChange = (changedValues, allValues) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onUpdateBookingData(allValues);
    }, 300);

    const isValid = validateValues(allValues);
    setIsFormValid(isValid);
  };

  const handleGoToPayment = async () => {
    try {
      await form.validateFields(guestContactFieldNames);
    } catch (e) {
      const errName = e.errorFields?.[0]?.name;
      if (errName != null) {
        form.scrollToField(errName);
      }
      return;
    }

    // Update Stripe metadata with guest details first; only then show payment step
    // so the webhook never sees placeholder data if the user pays quickly (e.g. Apple Pay).
    if (clientSecret && paymentService?.updatePaymentIntent) {
      setUpdatingIntentForPayment(true);
      try {
        const paymentIntentId = clientSecret.split("_secret_")[0];
        const values = form.getFieldsValue();
        const bookerName = values.booker_name || "Guest";
        const participantDetailsPayload = buildParticipantDetailsPayload(
          values,
          participantsCount,
          requirePerParticipantNames,
        );
        const updatePayload = {
          payment_intent_id: paymentIntentId,
          guest_email: values.email,
          guest_full_name: bookerName,
          guest_phone: values.phone,
          participant_details: participantDetailsPayload,
          notes: values.notes || "",
          applied_discount_id: appliedDiscount?.id || null,
        };
        if (process.env.NODE_ENV === "development") {
          console.info(
            "[Booking] update_intent CALL_START",
            new Date().toISOString(),
            { payment_intent_id: paymentIntentId },
          );
        }
        await paymentService.updatePaymentIntent(updatePayload);
        if (process.env.NODE_ENV === "development") {
          console.info(
            "[Booking] update_intent CALL_SUCCESS",
            new Date().toISOString(),
            paymentIntentId,
          );
        }
      } catch (err) {
        console.error(
          "[Booking] update_intent CALL_FAILED",
          new Date().toISOString(),
          err?.message || err
        );
        message.error(
          err?.message || "We couldn't save your details. Please try again."
        );
        return;
      } finally {
        setUpdatingIntentForPayment(false);
      }
    }

        if (!clientSecret) {
          console.warn(
            "[Booking] update_intent SKIPPED (no clientSecret yet) — switching to payment step without updating metadata. Payment intent may have placeholder data.",
            new Date().toISOString()
          );
        }
        setShowMobileSummary(false);
        setCheckoutStep("payment");
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        paymentStepRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleSubmit = useCallback(
    async (stripe, elements) => {
      if (paymentSubmitInFlightRef.current) return;
      if (!selectedSlot) {
        message.error("Whoops! Please select a date and time to continue.");
        return;
      }

      paymentSubmitInFlightRef.current = true;
      setLoading(true);

      try {
        const values = await form.validateFields();

        // --- FREE BOOKING FLOW ---
        if (isFree) {
          if (bookingData.paymentIntentId) {
            await paymentService.cancelPaymentIntent(bookingData.paymentIntentId).catch(() => {});
          }

          const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "Guest";
          const participantDetailsPayload = buildParticipantDetailsPayload(
            values,
            participantsCount,
            requirePerParticipantNames,
          );
          const payload = {
            selectedSlots: bookingData.selectedSlots,
            participants: participantsCount,
            notes: values.notes || "",
            participant_details: participantDetailsPayload,
            applied_discount_id: appliedDiscount?.id || null,
            guest_email: values.email,
            guest_full_name: bookerName,
            guest_phone: values.phone,
            gift_card_code: appliedGiftCard?.code || null,
          };

          const res = await paymentService.createPaymentIntent(payload);
          if (res?.booking_id) {
            onPaymentComplete(res);
            return;
          }
          message.error(
            res?.error || "Whoops! We couldn’t complete your free booking. Please try again."
          );
          return;
        }

        // --- STANDARD STRIPE FLOW ---
        if (!stripe || !elements) return;

        const { error: submitError } = await elements.submit();
        if (submitError) {
          message.error(submitError.message || "Whoops! Something went wrong. Please try again.");
          return;
        }

        const paymentIntentIdAtConfirm = clientSecret?.split("_secret_")[0];
        // Use bookingData fallback when guest fields are unmounted on payment step (Ant Design drops unmounted fields from getFieldsValue)
        const billingName =
          (values?.booker_name && String(values.booker_name).trim()) ||
          bookingData?.booker_name ||
          bookingData?.participant_details?.[0]?.name ||
          (isUserLoggedIn ? bookingData?.userName : "") ||
          "Guest";
        const billingEmail = values?.email?.trim() || bookingData?.email || "";
        const billingPhone = values?.phone?.trim() || bookingData?.phone || "";
        if (process.env.NODE_ENV === "development") {
          console.info(
            "[Booking] confirmPayment CALL_START",
            new Date().toISOString(),
            { payment_intent_id: paymentIntentIdAtConfirm },
          );
        }
        const { error: confirmError, paymentIntent } =
          await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/booking/status`,
              payment_method_data: {
                billing_details: {
                  name: billingName,
                  email: billingEmail,
                  phone: billingPhone,
                  address: { country: "CA" },
                },
              },
            },
            redirect: "if_required",
          });

        if (confirmError) {
          message.error(confirmError.message || "Whoops! Something went wrong. Please try again.");
          return;
        }
        if (paymentIntent && paymentIntent.status === "succeeded") {
          const allFormValues = form.getFieldsValue(true);
          const participantDetails = buildParticipantDetailsPayload(
            {
              ...allFormValues,
              booker_name: allFormValues.booker_name || billingName,
            },
            participantsCount,
            requirePerParticipantNames,
          );
          const basePayload = {
            payment_intent_id: paymentIntent.id,
            client_secret: clientSecret,
            participant_details: participantDetails,
          };
          try {
            for (let attempt = 0; attempt < 6; attempt++) {
              const result = await bookingService.bookingStatusPolling(
                paymentIntent.id,
                clientSecret
              );
              if (
                result.success &&
                result.data?.status === "confirmed" &&
                result.data?.booking_id != null
              ) {
                onPaymentComplete({
                  ...basePayload,
                  booking_id: result.data.booking_id,
                  user_facing_reference: result.data.user_facing_reference,
                  booking_group_id: result.data.booking_group_id,
                });
                return;
              }
              if (attempt < 5) await new Promise((r) => setTimeout(r, 800));
            }
          } catch (_) {
            /* ignore */
          }
          onPaymentComplete(basePayload);
        }
      } catch (err) {
        message.error(err.message || "Whoops! Something went wrong. Please try again.");
      } finally {
        paymentSubmitInFlightRef.current = false;
        setLoading(false);
      }
    },
    [
      selectedSlot,
      form,
      isFree,
      bookingData,
      participantsCount,
      appliedDiscount,
      paymentService,
      onPaymentComplete,
      isUserLoggedIn,
      clientSecret,
      appliedGiftCard,
      getGuestFullName,
      requirePerParticipantNames,
    ],
  );

  const mobileSummaryImageUrl = useMemo(() => {
    const img = classData?.images?.[0];
    if (!img) return null;
    if (typeof img === "string") return img;
    return img?.thumbnail_url || img?.medium_url || img?.image_url || img?.url;
  }, [classData?.images]);

  const cancellationPolicyText = useMemo(() => {
    return getCancellationPolicyText(
      option?.cancellationPolicy,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      selectedSlot?.date && selectedSlot?.time
        ? `${selectedSlot.date}T${selectedSlot.time}`
        : null,
      userTimeZone,
      businessTimeZone,
    );
  }, [
      option?.cancellationPolicy,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      selectedSlot,
      userTimeZone,
      businessTimeZone,
  ]);

  const [stripeFontSize, setStripeFontSize] = useState("16px");
  useEffect(() => {
    const updateStripeFontSize = () => {
      setStripeFontSize(
        typeof window !== "undefined" && window.innerWidth < 1024 ? "16px" : "14px"
      );
    };
    updateStripeFontSize();
    window.addEventListener("resize", updateStripeFontSize);
    return () => window.removeEventListener("resize", updateStripeFontSize);
  }, []);

  /* Proxima Soft for Stripe: load via fonts option so the iframe gets the font on mobile (Stripe docs) */
  const stripeFontCssUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/fonts/proxima-soft.css`
      : "";
  const stripeFonts = useMemo(
    () =>
      stripeFontCssUrl
        ? [{ cssSrc: stripeFontCssUrl }]
        : [],
    [stripeFontCssUrl]
  );

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
        ".Input:hover": {
          borderColor: appTheme.token.colorPrimary,
        },
        ".Input:focus": {
          borderColor: appTheme.token.colorPrimary,
          boxShadow: `0 0 0 2px ${appTheme.token.colorPrimary}20`,
          outline: "none",
        },
        ".Input--invalid": {
          borderColor: appTheme.token.colorError,
          boxShadow: "none",
        },
        ".Input--invalid:focus": {
          borderColor: appTheme.token.colorError,
          boxShadow: `0 0 0 2px ${appTheme.token.colorError}20`,
        },
        ".Label": {
          fontWeight: "600",
          color: "#000",
          marginBottom: "8px",
          fontFamily,
        },
        ".Input::placeholder": {
          color: "#c5c5c5",
          fontWeight: "600",
          fontFamily,
        },
        ".Tab": {
          borderColor: appTheme.token.colorBorder,
          borderRadius: `${appTheme.token.borderRadius}px`,
          fontFamily,
          fontWeight: "600",
        },
        ".Tab:selected": {
          borderColor: appTheme.token.colorPrimary,
        },
      },
    };
  }, [stripeFontSize]);
  const renderMobileSimpleSummary = () => {
    const slot = selectedSlot;
    const averageRating = classData?.average_rating;
    const reviewCount = classData?.review_count ?? 0;
    const showRating = typeof averageRating === "number" || reviewCount > 0;

    const dateText = slot && !slot.isCourse && slot.date
      ? formatNaiveDate(slot.date, "MMM d, yyyy")
      : slot && slot.isCourse && slot.end_date
        ? `${formatNaiveDate(slot.date, "MMM d")} – ${formatNaiveDate(slot.end_date, "MMM d, yyyy")}`
        : "Select date";
    const timeText = slot && !slot.isCourse && slot?.time && typeof slot?.duration === "number"
      ? formatTimeRangeForDisplay(slot.date, slot.time, slot.duration, businessTimeZone, userTimeZone)
      : slot && slot.isCourse && slot.days
        ? `Every ${slot.days.join(", ")} · ${formatTimeRangeForDisplay(slot.date, slot.time, slot.duration, businessTimeZone, userTimeZone)}`
        : "";
    const guestsText = participantsCount === 1 ? "1 participant" : `${participantsCount} participants`;

    const currency = classData?.currency_code || "CAD";

    return (
      <>
        <MobileSummaryInfoCard>
          <MobileSummaryListingHeader>
            <MobileSummaryListingImage>
              {mobileSummaryImageUrl && <img src={mobileSummaryImageUrl} alt="" />}
            </MobileSummaryListingImage>
            <MobileSummaryListingInfo>
              <MobileSummaryListingTitle>{classData?.title || "Class"}</MobileSummaryListingTitle>
              {showRating && (
                <MobileSummaryRatingBadge>
                  <Star size={14} fill="currentColor" />
                  {Number(averageRating ?? 0).toFixed(1)} ({reviewCount})
                </MobileSummaryRatingBadge>
              )}
            </MobileSummaryListingInfo>
          </MobileSummaryListingHeader>

          {slot && !slot.isCourse && (
            <>
              <MobileSummaryDetailRow>
                <MobileSummaryDetailContent>
                  <MobileSummaryDetailLabel>Date</MobileSummaryDetailLabel>
                  <MobileSummaryDetailValue>{dateText}</MobileSummaryDetailValue>
                </MobileSummaryDetailContent>
                {onRequestChangeDate && (
                  <MobileSummaryEditLink type="button" onClick={onRequestChangeDate}>Edit</MobileSummaryEditLink>
                )}
              </MobileSummaryDetailRow>
              <MobileSummaryDetailRow>
                <MobileSummaryDetailContent>
                  <MobileSummaryDetailLabel>Time</MobileSummaryDetailLabel>
                  <MobileSummaryDetailValue>{timeText}{slot.duration ? ` (${getDurationText(slot.duration)})` : ""}</MobileSummaryDetailValue>
                </MobileSummaryDetailContent>
                {onRequestChangeTime && (
                  <MobileSummaryEditLink type="button" onClick={onRequestChangeTime}>Edit</MobileSummaryEditLink>
                )}
              </MobileSummaryDetailRow>
              <MobileSummaryDetailRow>
                <MobileSummaryDetailContent>
                  <MobileSummaryDetailLabel>Guests</MobileSummaryDetailLabel>
                  <MobileSummaryDetailValue>{guestsText}</MobileSummaryDetailValue>
                </MobileSummaryDetailContent>
                {onRequestChangeParticipants && (
                  <MobileSummaryEditLink type="button" onClick={onRequestChangeParticipants}>Edit</MobileSummaryEditLink>
                )}
              </MobileSummaryDetailRow>
            </>
          )}

          {slot && slot.isCourse && (
            <>
              <MobileSummaryDetailRow>
                <MobileSummaryDetailContent>
                  <MobileSummaryDetailLabel>Date</MobileSummaryDetailLabel>
                  <MobileSummaryDetailValue>{dateText}</MobileSummaryDetailValue>
                </MobileSummaryDetailContent>
              </MobileSummaryDetailRow>
              <MobileSummaryDetailRow>
                <MobileSummaryDetailContent>
                  <MobileSummaryDetailLabel>Time</MobileSummaryDetailLabel>
                  <MobileSummaryDetailValue>{timeText}</MobileSummaryDetailValue>
                </MobileSummaryDetailContent>
              </MobileSummaryDetailRow>
              <MobileSummaryDetailRow>
                <MobileSummaryDetailContent>
                  <MobileSummaryDetailLabel>Guests</MobileSummaryDetailLabel>
                  <MobileSummaryDetailValue>{guestsText}</MobileSummaryDetailValue>
                </MobileSummaryDetailContent>
                {onRequestChangeParticipants && (
                  <MobileSummaryEditLink type="button" onClick={onRequestChangeParticipants}>Edit</MobileSummaryEditLink>
                )}
              </MobileSummaryDetailRow>
            </>
          )}
        </MobileSummaryInfoCard>

        <MobileSummaryTotalCard>
          <div className="top-row">
            <div className="label-wrap">
              <span className="label">Total</span>
              <span className="label-sub">includes taxes</span>
            </div>
            <span className="value">
              {finalTotal === 0 ? (
                "Free"
              ) : (
                <NumberFlow
                  value={finalTotal}
                  format={{ style: "currency", currency: currency || "CAD" }}
                />
              )}
            </span>
          </div>
          <MobileSummaryViewDetailsBtn type="button" onClick={() => setPriceDetailsDrawerOpen(true)}>
            View details
          </MobileSummaryViewDetailsBtn>
        </MobileSummaryTotalCard>

        <div style={{ marginBottom: 24 }}>
          {!showPromoGiftCard && !appliedDiscount && !appliedGiftCard ? (
            <PromoRevealButton type="button" onClick={() => setShowPromoGiftCard(true)}>
              Add promo or gift card
            </PromoRevealButton>
          ) : (
            <>
              {!appliedDiscount ? (
                <CouponTicketInput>
                  <Input
                    size="middle"
                    placeholder="e.g. SAVE10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    bordered={false}
                    onPressEnter={handleApplyCoupon}
                  />
                  <Button size="middle" onClick={handleApplyCoupon} loading={couponLoading} style={{ height: 45 }}>Apply</Button>
                </CouponTicketInput>
              ) : (
                <AppliedCouponTicket>
                  <div className="coupon-info">
                    <Percent size={14} />
                    <span>{appliedDiscount.code.toUpperCase()} Applied</span>
                  </div>
                  <Button type="text" size="small" icon={<X size={14} />} onClick={handleRemoveCoupon} />
                </AppliedCouponTicket>
              )}
              {!appliedGiftCard ? (
                <CouponTicketInput style={{ marginTop: 12 }}>
                  <Input
                    prefix={<Gift size={14} color="#9ca3af" />}
                    placeholder="e.g. XXXX-XXXX-XXXX"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    onPressEnter={handleApplyGiftCard}
                    bordered={false}
                  />
                  <Button size="middle" onClick={handleApplyGiftCard} loading={gcLoading} style={{ height: 45 }}>Apply</Button>
                </CouponTicketInput>
              ) : (
                <AppliedCouponTicket style={{ marginTop: 12, borderColor: "#8b5cf6", backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                  <div className="coupon-info">
                    <Gift size={14} />
                    <span>Gift Card ending in {appliedGiftCard.code.slice(-4)}</span>
                  </div>
                  <Button type="text" size="small" icon={<X size={14} />} onClick={handleRemoveGiftCard} />
                </AppliedCouponTicket>
              )}
            </>
          )}
        </div>


        {isFree && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#15803d" }}>
            <CheckCircle size={16} />
            <span>This booking is fully covered. No payment required.</span>
          </div>
        )}
      </>
    );
  };
  
  const renderPriceDetailsDrawerContent = () => (
    <>
      <TicketRow>
        <span>
          {participantsCount} {participantsCount > 1 ? "Guests" : "Guest"}
        </span>
        <span>
          {subtotal === 0 ? "Free" : <NumberFlow value={subtotal} format={{ style: "currency", currency: "CAD" }} />}
        </span>
      </TicketRow>
      {(appliedDiscount || activeGlobalDiscount) && discountAmount > 0 && (
        <TicketRow style={{ color: "#059669" }}>
          <span>
            Discount
            {appliedDiscount && ` (${appliedDiscount.code})`}
            {activeGlobalDiscount && (appliedDiscount ? ` · ${activeGlobalDiscount.name}` : ` (${activeGlobalDiscount.name})`)}
          </span>
          <span><NumberFlow value={-discountAmount} format={{ style: "currency", currency: "CAD" }} /></span>
        </TicketRow>
      )}
      {appliedGiftCard && (
        <TicketRow style={{ color: "#7c3aed" }}>
          <span>Gift Card</span>
          <span>- <NumberFlow value={gcDeduction} format={{ style: "currency", currency: "CAD" }} /></span>
        </TicketRow>
      )}
      <TicketRow>
        <span>{taxLineLabel}</span>
        <span><NumberFlow value={taxAmount} format={{ style: "currency", currency: "CAD" }} /></span>
      </TicketRow>
      <TicketTotalRow>
        <span>Total</span>
        <span>
          {finalTotal === 0 ? "Free" : <NumberFlow value={finalTotal} format={{ style: "currency", currency: "CAD" }} />}
        </span>
      </TicketTotalRow>
    </>
  );

  const renderBookingDetailsTicket = () => {
    if (!selectedSlot) return null;
    const { date, time, duration, isCourse, end_date, days } = selectedSlot;
    if (isCourse) {
      return (
        <SummaryMetaBlock>
          <TicketMetaItem>
            <div className="icon-box"><CalendarDays /></div>
            <div className="text-content">
              <span className="label">Course Dates</span>
              <span className="value">{formatNaiveDate(date, "MMM d")} - {formatNaiveDate(end_date, "MMM d, yyyy")}</span>
            </div>
          </TicketMetaItem>
          <TicketMetaItem>
            <div className="icon-box"><Clock /></div>
            <div className="text-content">
              <span className="label">Time</span>
              <span className="value">Every {days.join(", ")} at {formatTimeRangeForDisplay(date, time, duration, businessTimeZone, userTimeZone)}</span>
            </div>
          </TicketMetaItem>
        </SummaryMetaBlock>
      );
    }
    return (
      <SummaryMetaBlock>
        <TicketMetaItem>
          <div className="icon-box"><CalendarDays /></div>
          <div className="text-content">
            <span className="label">Date</span>
            <span className="value">{formatNaiveDate(date, "EEEE, MMMM d, yyyy")}</span>
          </div>
          {onRequestChangeDate && (
            <TicketEditPencil type="button" onClick={onRequestChangeDate} aria-label="Change date">
              <Edit2 size={14} />
            </TicketEditPencil>
          )}
        </TicketMetaItem>
        <TicketMetaItem>
          <div className="icon-box"><Clock /></div>
          <div className="text-content">
            <span className="label">Time</span>
            <span className="value">{formatTimeRangeForDisplay(date, time, duration, businessTimeZone, userTimeZone)} ({getDurationText(duration)})</span>
          </div>
          {onRequestChangeTime && (
            <TicketEditPencil type="button" onClick={onRequestChangeTime} aria-label="Change time">
              <Edit2 size={14} />
            </TicketEditPencil>
          )}
        </TicketMetaItem>
        <TicketMetaItem>
          <div className="icon-box"><Ticket /></div>
          <div className="text-content">
            <span className="label">Participants</span>
            <span className="value">{participantsCount} {participantsCount === 1 ? "guest" : "guests"}</span>
          </div>
          {onRequestChangeParticipants && (
            <TicketEditPencil type="button" onClick={onRequestChangeParticipants} aria-label="Change participants">
              <Edit2 size={14} />
            </TicketEditPencil>
          )}
        </TicketMetaItem>
      </SummaryMetaBlock>
    );
  };

  const renderTicketSummary = () => (
    <TicketWrapper>
      <TicketTop>
        <TicketHeaderTitle>{classData?.title}</TicketHeaderTitle>
        <TicketSubHeader>
          <MapPin />
          <span>{classData?.business_name || "Host Location"}</span>
        </TicketSubHeader>
        {renderBookingDetailsTicket()}
      </TicketTop>
      <TicketDivider />
      <TicketBottom>
        {!showPromoGiftCard && !appliedDiscount && !appliedGiftCard ? (
          <PromoRevealButton type="button" onClick={() => setShowPromoGiftCard(true)}>
            Add promo or gift card
          </PromoRevealButton>
        ) : (
          <>
            {!appliedDiscount ? (
              <CouponTicketInput>
                <Input
                  size="middle"
                  placeholder="e.g. SAVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  bordered={false}
                  onPressEnter={handleApplyCoupon}
                />
                <Button size="middle" onClick={handleApplyCoupon} loading={couponLoading} style={{ height: 45 }}>Apply</Button>
              </CouponTicketInput>
            ) : (
              <AppliedCouponTicket>
                <div className="coupon-info">
                  <Percent size={14} />
                  <span>{appliedDiscount.code.toUpperCase()} Applied</span>
                </div>
                <Button type="text" size="small" icon={<X size={14} />} onClick={handleRemoveCoupon} />
              </AppliedCouponTicket>
            )}

            {!appliedGiftCard ? (
              <CouponTicketInput style={{ marginTop: 12 }}>
                <Input
                  prefix={<Gift size={14} color="#9ca3af" />}
                  placeholder="e.g. XXXX-XXXX-XXXX"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value)}
                  onPressEnter={handleApplyGiftCard}
                  bordered={false}
                />
                <Button size="middle" onClick={handleApplyGiftCard} loading={gcLoading} style={{ height: 45 }}>Apply</Button>
              </CouponTicketInput>
            ) : (
              <AppliedCouponTicket style={{ marginTop: 12, borderColor: "#8b5cf6", backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                <div className="coupon-info">
                  <Gift size={14} />
                  <span>Gift Card ending in {appliedGiftCard.code.slice(-4)}</span>
                </div>
                <Button type="text" size="small" icon={<X size={14} />} onClick={handleRemoveGiftCard} />
              </AppliedCouponTicket>
            )}
          </>
        )}

        <TicketRow>
          <span>
            {participantsCount} {participantsCount > 1 ? "Guests" : "Guest"}
          </span>
          <span>{subtotal === 0 ? "Free" : <NumberFlow value={subtotal} format={{ style: "currency", currency: "CAD" }} />}</span>
        </TicketRow>

        {(appliedDiscount || activeGlobalDiscount) && discountAmount > 0 && (
          <TicketRow style={{ color: "#059669" }}>
            <span>
              Discount
              {appliedDiscount && ` (${appliedDiscount.code})`}
              {activeGlobalDiscount && (appliedDiscount ? ` · ${activeGlobalDiscount.name}` : ` (${activeGlobalDiscount.name})`)}
            </span>
            <span><NumberFlow value={-discountAmount} format={{ style: "currency", currency: "CAD" }} /></span>
          </TicketRow>
        )}

        {appliedGiftCard && (
          <TicketRow style={{ color: "#7c3aed" }}>
            <span>Gift Card</span>
            <span>- <NumberFlow value={gcDeduction} format={{ style: "currency", currency: "CAD" }} /></span>
          </TicketRow>
        )}

        <TicketRow>
          <span>{taxLineLabel}</span>
          <span><NumberFlow value={taxAmount} format={{ style: "currency", currency: "CAD" }} /></span>
        </TicketRow>

        <TicketTotalRow>
          <span>Total</span>
          <span>{finalTotal === 0 ? "Free" : <NumberFlow value={finalTotal} format={{ style: "currency", currency: "CAD" }} />}</span>
        </TicketTotalRow>
      </TicketBottom>

      <InfoPanel $bgColor="#f9fafb" $borderColor="#e5e7eb" $iconColor="#6b7280" $titleColor="#111827" $textColor="#4b5563">
        <Shield />
        <div>
          <h5>Cancellation Policy</h5>
          <p>{cancellationPolicyText}</p>
        </div>
      </InfoPanel>
    </TicketWrapper>
  );

  const renderPaymentSectionContentWhenNoIntent = () => (
    <>
      {slotUnavailable && (
        <Alert
          message="This time is no longer available"
          description="Someone else may have just booked. Please choose another time to continue."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {!creatingIntent && paymentIntentError && (
        <>
          <Alert
            message="Couldn't prepare payment"
            description={paymentIntentError}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            size="large"
            onClick={handleCreateIntentAndShowPayment}
            icon={<RefreshCw size={16} />}
            style={{ width: "100%", background: "#ff385c", border: "none", height: "44px", fontWeight: 600 }}
          >
            Try again
          </Button>
        </>
      )}
      {creatingIntent && (
        <StripeSkeletonWrapper aria-hidden="true">
          <SkeletonBar style={{ width: "100%" }} />
          <SkeletonRow>
            <SkeletonBar />
            <SkeletonBar />
          </SkeletonRow>
        </StripeSkeletonWrapper>
      )}
    </>
  );

  // Single layout branch: one tree so step never remounts when clientSecret appears/disappears.
  // Elements wraps only the payment section content when we have clientSecret or isFree.
  const paymentSectionContent = (() => {
    if (isFree) {
      return (
        <Elements stripe={stripePromise} options={undefined}>
          <CheckoutPaymentBody>
            <PaymentFormContent
              form={form}
              handleSubmit={handleSubmit}
              loading={loading}
              isFree={isFree}
              isFormValid={isFormValid}
              finalTotal={finalTotal}
              clientSecret={clientSecret}
              onPaymentAction={onPaymentAction}
              onPaymentComplete={onPaymentComplete}
              onPaymentLoadError={handlePaymentElementLoadError}
              paymentService={paymentService}
              bookingData={bookingData}
              currentStep={checkoutStep}
              isVisible={checkoutStep === "payment"}
              requirePerParticipantNames={requirePerParticipantNames}
            />
            {confirmFooter && <DesktopInlineFooter>{confirmFooter}</DesktopInlineFooter>}
          </CheckoutPaymentBody>
        </Elements>
      );
    }
    if (!clientSecret) {
      return (
        <CheckoutPaymentBody>
          {checkoutStep === "payment" && renderPaymentSectionContentWhenNoIntent()}
          {confirmFooter && <DesktopInlineFooter>{confirmFooter}</DesktopInlineFooter>}
        </CheckoutPaymentBody>
      );
    }
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
        <CheckoutPaymentBody>
          <PaymentFormContent
            form={form}
            handleSubmit={handleSubmit}
            loading={loading}
            isFree={isFree}
            isFormValid={isFormValid}
            finalTotal={finalTotal}
            clientSecret={clientSecret}
            onPaymentAction={onPaymentAction}
            onPaymentComplete={onPaymentComplete}
            onPaymentLoadError={handlePaymentElementLoadError}
            paymentService={paymentService}
            bookingData={bookingData}
            currentStep={checkoutStep}
            isVisible={checkoutStep === "payment"}
            requirePerParticipantNames={requirePerParticipantNames}
          />
          {confirmFooter && <DesktopInlineFooter>{confirmFooter}</DesktopInlineFooter>}
        </CheckoutPaymentBody>
      </Elements>
    );
  })();

  return (
    <ConfigProvider theme={appTheme}>
      <StepContainer>
        <LeftColumnWrap>
          <PaymentSection>
            <MobileSummaryContainer>
              <MobileSummaryHeader onClick={() => setShowMobileSummary(!showMobileSummary)}>
                <div className="title-group"><Ticket size={20} /><span>Booking Summary</span></div>
                <div className="price-group">
                  <span className="total-price"><NumberFlow value={finalTotal} format={{ style: "currency", currency: "CAD" }} /></span>
                  <ChevronDown className="toggle-icon" size={20} style={{ transform: showMobileSummary ? "rotate(180deg)" : "none" }} />
                </div>
              </MobileSummaryHeader>
              <AnimatePresence initial={false}>
                {showMobileSummary && (
                  <MeasuredMobileSummaryCollapse key="content">
                    <MobileSummaryInner>{renderMobileSimpleSummary()}</MobileSummaryInner>
                  </MeasuredMobileSummaryCollapse>
                )}
              </AnimatePresence>
            </MobileSummaryContainer>

            <Drawer.Root open={priceDetailsDrawerOpen} onOpenChange={setPriceDetailsDrawerOpen}>
              <Drawer.Portal>
                <PriceDetailsDrawerOverlay />
                <PriceDetailsDrawerContent>
                  <PriceDetailsDrawerHandle />
                  <PriceDetailsDrawerBody>{renderPriceDetailsDrawerContent()}</PriceDetailsDrawerBody>
                </PriceDetailsDrawerContent>
              </Drawer.Portal>
            </Drawer.Root>

            <Drawer.Root open={policyDetailsDrawerOpen} onOpenChange={setPolicyDetailsDrawerOpen}>
              <Drawer.Portal>
                <PolicyDetailsDrawerOverlay />
                <PolicyDetailsDrawerContent>
                  <PriceDetailsDrawerHandle />
                  <PriceDetailsDrawerBody>
                    <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 700, color: "#222", textAlign: "center" }}>Cancellation Policy</h3>
                    <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                      {cancellationPolicyText || "Cancel before the start time for a full refund."}
                    </div>
                  </PriceDetailsDrawerBody>
                </PolicyDetailsDrawerContent>
              </Drawer.Portal>
            </Drawer.Root>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              preserve
              onValuesChange={handleFormValuesChange}
              style={{ padding: "0 12px" }}
            >
              <SectionCard>
                <SectionHeader $clickable={checkoutStep === "payment"} onClick={handleGoBackToGuest}>
                  <h3>Guest details</h3>
                  {checkoutStep === "payment" && (
                    <button type="button" className="edit-btn">Edit</button>
                  )}
                </SectionHeader>
                <AnimatePresence initial={false}>
                  {checkoutStep === "guest" ? (
                    <MeasuredCollapseSection key="content">
                      <CheckoutFieldRow>
                        <Form.Item
                          name="booker_name"
                          rules={[
                            { required: true, message: "Please enter your full name" },
                            { whitespace: true, message: "Please enter your full name" },
                            {
                              validator: (_, value) => {
                                const v = (value && String(value).trim()) || "";
                                if (v.toLowerCase() === "guest") {
                                  return Promise.reject(new Error("Please enter your real full name"));
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                          label={<FieldLabel>Full name</FieldLabel>}
                        >
                          <Input
                            placeholder="e.g. Jane Smith"
                            readOnly={isUserLoggedIn && !!bookingData.userName}
                            style={isUserLoggedIn && !!bookingData.userName ? { backgroundColor: "#f0f0f0", cursor: "not-allowed", color: "#555" } : {}}
                            suffix={isUserLoggedIn && !!bookingData.userName && <UserCheck size={16} color="#52c41a" />}
                          />
                        </Form.Item>
                      </CheckoutFieldRow>
                      {requirePerParticipantNames &&
                        Array.from(
                          { length: Math.max(0, participantsCount - 1) },
                          (_, i) => (
                            <CheckoutFieldRow key={`extra-participant-${i + 2}`}>
                              <Form.Item
                                name={["additional_participant_names", i]}
                                rules={[
                                  {
                                    required: true,
                                    message: `Enter participant ${i + 2}'s full name`,
                                  },
                                  {
                                    whitespace: true,
                                    message: `Enter participant ${i + 2}'s full name`,
                                  },
                                  {
                                    validator: (_, value) => {
                                      const v = (value && String(value).trim()) || "";
                                      if (v.toLowerCase() === "guest") {
                                        return Promise.reject(
                                          new Error("Please enter a real full name"),
                                        );
                                      }
                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                                style={{ marginBottom: 0 }}
                                label={
                                  <FieldLabel>{`Participant ${i + 2} full name`}</FieldLabel>
                                }
                              >
                                <Input placeholder={`e.g. Participant ${i + 2}`} />
                              </Form.Item>
                            </CheckoutFieldRow>
                          ),
                        )}
                      <CheckoutContactRow>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="email"
                            rules={[
                              { required: true, message: "Please enter your email" },
                              { type: "email", message: "Please enter a valid email address" },
                              {
                                validator: (_, value) => {
                                  const v = (value && String(value).trim()) || "";
                                  if (v && /pending@example/i.test(v)) {
                                    return Promise.reject(new Error("Please enter your real email address"));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            label={<FieldLabel>Email</FieldLabel>}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="e.g. jane@example.com" />
                          </Form.Item>
                        </CheckoutFieldRow>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="phone"
                            rules={[
                              { required: true, message: "Please enter your phone number" },
                              { whitespace: true, message: "Please enter your phone number" },
                              {
                                validator: (_, value) => {
                                  const v = (value && String(value).replace(/\s/g, "")) || "";
                                  const digits = v.replace(/\D/g, "");
                                  if (digits === "5555555555" || /555-555-5555/.test(v)) {
                                    return Promise.reject(new Error("Please enter your real phone number"));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            label={<FieldLabel>Phone</FieldLabel>}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="e.g. (555) 123-4567" />
                          </Form.Item>
                        </CheckoutFieldRow>
                      </CheckoutContactRow>
                      <CheckoutFieldRow>
                        {!showNotes ? (
                          <AdditionalNotesRevealButton type="button" onClick={() => setShowNotes(true)}>
                            <ChevronRight size={18} />
                            <span>Add additional notes (optional)</span>
                          </AdditionalNotesRevealButton>
                        ) : (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={COLLAPSE_TRANSITION} style={{ overflow: "hidden" }}>
                            <Form.Item name="notes" label={<FieldLabel>Additional notes</FieldLabel>} style={{ marginBottom: 0 }}>
                              <Input.TextArea placeholder="Any special requests or dietary restrictions?" rows={2} />
                            </Form.Item>
                          </motion.div>
                        )}
                      </CheckoutFieldRow>
                      {slotUnavailable && (
                        <Alert
                          message="This time is no longer available"
                          description="Please choose another time to continue."
                          type="warning"
                          showIcon
                          style={{ marginBottom: 12 }}
                        />
                      )}
                      <NextButtonContainer>
                        <NextButton
                          type="primary"
                          onClick={handleGoToPayment}
                          disabled={slotUnavailable || updatingIntentForPayment}
                          loading={updatingIntentForPayment}
                        >
                          {updatingIntentForPayment ? "Just a moment…" : "Next"}
                        </NextButton>
                      </NextButtonContainer>
                    </MeasuredCollapseSection>
                  ) : (
                    <MeasuredCollapseSection key="summary">
                      <SummaryDataRow>
                        <span className="label">Name</span>
                        <span className="value">{form.getFieldValue("booker_name")}</span>
                      </SummaryDataRow>
                      <SummaryDataRow>
                        <span className="label">Contact</span>
                        <span className="value">{form.getFieldValue("email")} · {form.getFieldValue("phone")}</span>
                      </SummaryDataRow>
                    </MeasuredCollapseSection>
                  )}
                </AnimatePresence>
              </SectionCard>

              <SectionCard ref={paymentStepRef} style={{ marginTop: 24 }} $disabled={checkoutStep !== "payment"}>
                <SectionHeader>
                  <h3>Payment</h3>
                </SectionHeader>
                <SectionContent
                  style={{ display: checkoutStep === "payment" ? "block" : "none" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: checkoutStep === "payment" ? 1 : 0 }}
                >
                  {paymentSectionContent}
                </SectionContent>
              </SectionCard>
            </Form>
          </PaymentSection>
        </LeftColumnWrap>
        <SummarySection>{renderTicketSummary()}</SummarySection>
      </StepContainer>
    </ConfigProvider>
  );
};

export default ReviewAndPaymentStep;