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
} from "lucide-react";
import Lottie from "lottie-react";
import { Drawer } from "vaul";

import { getCancellationPolicyText, getDurationText } from "./utils";
import {
  businessDiscountService,
  giftCardService,
  globalDiscountService,
} from "@/services/apiService";
import posthog from "posthog-js";
import { theme as appTheme } from "@/components/theme";
import { formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";
import loadingAnimation from "@/assets/animations/Scene.json";

const HST_RATE = 0.13;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// --- STYLED COMPONENTS ---

const StepContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 0 4px;
  padding-top: 4px;
  padding-bottom: 20px;
  position: relative;

  @media (min-width: 969px) {
    grid-template-columns: minmax(0, 1.2fr) 400px;
    gap: 40px;
    align-items: flex-start;
    padding-bottom: 0;
  }
`;

const LeftColumnWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
`;

/* ACCORDION / SECTION STYLES */
const SectionCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

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
`;

const SectionContent = styled(motion.div)`
  padding: 8px 24px 24px 24px;
  border-top: 1px solid #f3f4f6;
`;

const SectionContentInner = styled.div`
  padding: 8px 24px 24px 24px;
  border-top: 1px solid #f3f4f6;
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
`;

/* REFINED NEXT BUTTON */
const NextButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
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
  @media (min-width: 969px) {
    display: block;
    position: sticky;
    top: 100px; /* Account for sticky header */
  }
`;

/* Desktop Footer rendered INSIDE the payment section, so we just style the container */
const DesktopInlineFooter = styled.div`
  display: none;
  @media (min-width: 969px) {
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
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;

  @media (min-width: 969px) {
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
  background: #fafafa;
  overflow: hidden;
`;

const MobileSummaryInner = styled.div`
  border-top: 1px solid #f0f0f0;
  padding: 20px;
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

/* Price details drawer (Vaul) */
const PriceDetailsDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
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

/* Promo / Gift card section visible only on mobile */
const MobilePromoSection = styled.div`
  display: block;
  margin-bottom: 16px;
  text-align: center;
  @media (min-width: 969px) {
    display: none;
  }
`;

/* Label above fields: small, 600 weight */
const FieldLabel = styled.span`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #111827;
`;

const SummaryMetaBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
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
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  transition: all 0.3s ease;
  color: ${(props) => (props.$urgent ? "#dc2626" : "#4b5563")};
  white-space: nowrap;
`;

const MobileTimerContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  @media (min-width: 969px) {
    display: none;
  }
`;

const DesktopTimerContainer = styled.div`
  display: none;
  text-align: right;
  @media (min-width: 969px) {
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
          message.error("Please try again.");
          return;
        }

        const values = form.getFieldsValue();
        const email = (values?.email && String(values.email).trim()) || "";
        const phone = (values?.phone && String(values.phone).trim()) || "";
        const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "";
        const participantsCount = bookingData?.participants || 1;
        const participantDetailsPayload = Array.from(
          { length: participantsCount },
          () => ({ name: bookerName }),
        );
        
        if (clientSecret && paymentService?.updatePaymentIntent) {
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
            message.error("Could not update booking details. Please try again.");
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
          message.error(error.message);
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
        message.error("Payment failed. Please try again.");
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
  isVisible
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

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
        <ExpressCheckoutButton
            finalTotal={finalTotal}
            clientSecret={clientSecret}
            onPaymentComplete={onPaymentComplete}
            paymentService={paymentService}
            bookingData={bookingData}
            form={form}
            isFormValid={isFormValid}
            onPaymentRequestReady={() => {
                setHasExpressPay(true);
            }}
        />

        {hasExpressPay && !showCardFields && (
            <CardRevealButton type="button" onClick={() => setShowCardFields(true)}>
                <span><CreditCard size={18} /> Pay with Credit or Debit card</span>
                <ChevronDown size={16} color="#6b7280" />
            </CardRevealButton>
        )}

        <div style={{ display: showCardFields ? 'block' : 'none', marginTop: 24 }}>
            <PaymentElementWrapper>
                <PaymentElement
                    options={paymentElementOptions}
                    onReady={() => setIsReady(true)}
                    onLoadError={handleLoadError}
                />
            </PaymentElementWrapper>
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
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentIntentError, setPaymentIntentError] = useState(null);
  const [clientSecret, setClientSecret] = useState(
    () => bookingData?.clientSecret ?? null
  );
  const [isFormValid, setIsFormValid] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [priceDetailsDrawerOpen, setPriceDetailsDrawerOpen] = useState(false);
  
  // Step State: 'guest' | 'payment'
  const [checkoutStep, setCheckoutStep] = useState("guest");
  // Notes UI state
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    const fromStorage = bookingData?.clientSecret;
    if (fromStorage && !clientSecret) setClientSecret(fromStorage);
  }, [bookingData?.clientSecret]);

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

  // --- TIMER STATE ---
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [isExpired, setIsExpired] = useState(false);
  const expirationTimestampRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const intentDepsRef = useRef({
    discountId: null,
    gcCode: null,
    globalId: null,
  });

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
      return contactFields.every(
        (val) => val && String(val).trim().length > 0,
      );
    },
    [],
  );

  const getGuestFullName = useCallback(
    (values) => {
      if (isUserLoggedIn) return bookingData.userName || "";
      const name = values?.booker_name;
      return (name && String(name).trim()) || "Pending Guest";
    },
    [isUserLoggedIn, bookingData.userName],
  );

  useEffect(() => {
    if (form) {
      let formData = {};

      if (isUserLoggedIn) {
        formData.email = bookingData.userEmail || "";
        formData.phone = bookingData.userPhone || "";
        formData.booker_name = bookingData.userName || "";
      } else {
        const currentValues = form.getFieldsValue(true);
        if (currentValues.email === undefined) formData.email = "";
        if (currentValues.phone === undefined) formData.phone = "";
        const bookerFromDetails = bookingData.participant_details?.[0]?.name;
        if (bookerFromDetails && currentValues.booker_name !== bookerFromDetails) {
          formData.booker_name = bookerFromDetails;
        }
      }

      const currentNotes = form.getFieldValue("notes");
      if (currentNotes !== bookingData.notes) {
        formData.notes = bookingData.notes || "";
      }

      if (Object.keys(formData).length > 0) {
        form.setFieldsValue(formData);
      }

      const isValid = validateValues({
        ...form.getFieldsValue(true),
        ...formData,
      });
      setIsFormValid(isValid);
    }
  }, [isUserLoggedIn, bookingData, form, validateValues]);

  const selectedSlot = bookingData.selectedSlots?.[0];
  const option = bookingData.selectedOption;
  const participantsCount = bookingData.participants || 1;
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

  const { discountAmount, taxAmount, finalTotal, gcDeduction } = useMemo(() => {
    const businessDiscount = appliedDiscount
      ? parseFloat(appliedDiscount.calculated_discount_amount) || 0
      : 0;
    const globalDiscount = activeGlobalDiscount?.calculated_discount_amount
      ? parseFloat(activeGlobalDiscount.calculated_discount_amount) || 0
      : 0;
    const totalDiscount = businessDiscount + globalDiscount;
    const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
    const tax = subtotalAfterDiscount * HST_RATE;
    const grossTotal = subtotalAfterDiscount + tax;

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
    };
  }, [subtotal, appliedDiscount, appliedGiftCard, activeGlobalDiscount]);

  const isFree = finalTotal === 0;

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (!clientSecret || isFree) return;
    const fifteenMinutesMs = 15 * 60 * 1000;
    expirationTimestampRef.current = Date.now() + fifteenMinutesMs;
    setTimeRemaining(15 * 60);
    setIsExpired(false);

    const timer = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.ceil(
        (expirationTimestampRef.current - now) / 1000,
      );

      if (secondsLeft <= 0) {
        clearInterval(timer);
        setTimeRemaining(0);
        setIsExpired(true);
      } else {
        setTimeRemaining(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [clientSecret, isFree]);

  const handleSessionExpired = () => {
    window.location.reload();
  };

  const fetchPaymentIntent = useCallback(
    async (currentDiscountId = null) => {
      if (isFree && !appliedGiftCard) return;
      if (
        !bookingData.selectedSlots ||
        bookingData.selectedSlots.length === 0
      ) {
        return;
      }

      try {
        setPaymentIntentError(null);
        const values = form.getFieldsValue();
        const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "Guest";
        const participantDetailsPayload = Array.from(
          { length: participantsCount },
          () => ({ name: bookerName }),
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
          setClientSecret(response.clientSecret);
          setPaymentIntentError(null);
          if (onUpdateBookingData) {
            const paymentIntentId = response.clientSecret.split("_secret_")[0];
            onUpdateBookingData({
              paymentIntentId: paymentIntentId,
              clientSecret: response.clientSecret,
            });
          }
        }
      } catch (err) {
        const data = err?.response?.data;
        const errObj = data?.error;
        const msg =
          (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
          (Array.isArray(errObj?.non_field_errors) && errObj.non_field_errors[0]) ||
          (typeof data?.error === "string" ? data.error : null) ||
          (typeof errObj === "string" ? errObj : null) ||
          err?.message ||
          "We couldn't reserve the spots right now. Please try again.";
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
    ],
  );

  useEffect(() => {
    if (isFree) return;
    const discountId = appliedDiscount?.id ?? null;
    const gcCode = appliedGiftCard?.code ?? null;
    const globalId = activeGlobalDiscount?.id ?? null;
    const currentDeps = { discountId, gcCode, globalId };
    const prev = intentDepsRef.current;

    if (clientSecret) {
      const depsMatch =
        prev.discountId === discountId &&
        prev.gcCode === gcCode &&
        prev.globalId === globalId;
      if (depsMatch) return;
      const isFirstRunWithRehydratedIntent =
        prev.discountId === null &&
        prev.gcCode === null &&
        prev.globalId === null;
      if (isFirstRunWithRehydratedIntent) {
        intentDepsRef.current = currentDeps;
        return;
      }
      const paymentIntentId = clientSecret.split("_secret_")[0];
      paymentService.cancelPaymentIntent(paymentIntentId).catch(() => {});
      setClientSecret(null);
    }

    intentDepsRef.current = currentDeps;
    fetchPaymentIntent(discountId);
  }, [
    appliedDiscount?.id,
    appliedGiftCard?.code,
    activeGlobalDiscount?.id,
    clientSecret,
    isFree,
    fetchPaymentIntent,
  ]);

  const handlePaymentElementLoadError = useCallback(() => {
    const paymentIntentId =
      clientSecret?.split("_secret_")[0] || bookingData?.paymentIntentId;
    if (paymentIntentId) {
      paymentService.cancelPaymentIntent(paymentIntentId).catch(() => {});
    }
    setClientSecret(null);
    onUpdateBookingData?.({ clientSecret: null, paymentIntentId: null });
    const discountId = appliedDiscount?.id ?? null;
    fetchPaymentIntent(discountId);
  }, [
    clientSecret,
    bookingData?.paymentIntentId,
    onUpdateBookingData,
    appliedDiscount?.id,
    fetchPaymentIntent,
    paymentService,
  ]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      message.error("Please enter a coupon code.");
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
        message.error(result.error?.detail || "Invalid coupon.");
        setAppliedDiscount(null);
      }
    } catch (err) {
      message.error("Error applying coupon.");
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
      message.error(err.error || "Invalid Gift Card"); 
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
        await form.validateFields(['booker_name', 'email', 'phone']);
        setCheckoutStep("payment");
        // Update intent with the now valid data so metadata is ready for Payment Request Button
        if (clientSecret) {
             const paymentIntentId = clientSecret.split("_secret_")[0];
             // Fire and forget update
             const values = form.getFieldsValue();
             const bookerName = values.booker_name || "Guest";
             const participantDetailsPayload = Array.from(
                { length: participantsCount },
                () => ({ name: bookerName }),
             );
             paymentService.updatePaymentIntent({
                 payment_intent_id: paymentIntentId,
                 guest_email: values.email,
                 guest_full_name: bookerName,
                 guest_phone: values.phone,
                 participant_details: participantDetailsPayload,
                 notes: values.notes || "",
                 applied_discount_id: appliedDiscount?.id || null,
             }).catch(() => {});
        }
    } catch (e) {
        // Validation failed
        const errorField = e.errorFields?.[0]?.name?.[0];
        if (errorField) {
            form.scrollToField(errorField);
        }
    }
  };

  const handleSubmit = useCallback(
    async (stripe, elements) => {
      if (isExpired) return;
      if (!selectedSlot) {
        setError("Slot not selected.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const values = await form.validateFields();

        // --- FREE BOOKING FLOW ---
        if (isFree) {
          if (bookingData.paymentIntentId) {
            await paymentService.cancelPaymentIntent(bookingData.paymentIntentId).catch(() => {});
          }

          const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "Guest";
          const participantDetailsPayload = Array.from(
            { length: participantsCount },
            () => ({ name: bookerName }),
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
          setError(
            res?.error || "We couldn’t complete your free booking. Please try again."
          );
          setLoading(false);
          return;
        }

        // --- STANDARD STRIPE FLOW ---
        if (!stripe || !elements) return;

        const { error: submitError } = await elements.submit();
        if (submitError) {
          setError(submitError.message);
          setLoading(false);
          return;
        }

        const { error: confirmError, paymentIntent } =
          await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/booking/status`,
              payment_method_data: {
                billing_details: {
                  name: getGuestFullName(values),
                  email: values.email,
                  phone: values.phone,
                  address: { country: "CA" },
                },
              },
            },
            redirect: "if_required",
          });

        if (confirmError) {
          throw new Error(confirmError.message);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "Guest";
          const participantDetails = Array.from(
            { length: participantsCount },
            () => ({ name: bookerName }),
          );
          onPaymentComplete({
            payment_intent_id: paymentIntent.id,
            client_secret: clientSecret,
            participant_details: participantDetails,
          });
        }
      } catch (err) {
        setError(err.message || "Payment processing failed.");
      } finally {
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
      isExpired,
      appliedGiftCard,
      getGuestFullName,
    ],
  );

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
        typeof window !== "undefined" && window.innerWidth < 969 ? "16px" : "14px"
      );
    };
    updateStripeFontSize();
    window.addEventListener("resize", updateStripeFontSize);
    return () => window.removeEventListener("resize", updateStripeFontSize);
  }, []);

  const stripeAppearance = useMemo(() => {
    const stripeFont = '"Proxima Soft", sans-serif';
    return {
      theme: "stripe",
      variables: {
        colorPrimary: appTheme.token.colorPrimary,
        colorBackground: "#ffffff",
        colorText: appTheme.token.colorText,
        colorDanger: appTheme.token.colorError,
        fontFamily: stripeFont,
        spacingUnit: "4px",
        borderRadius: `${appTheme.token.borderRadius}px`,
        fontSizeBase: stripeFontSize,
      },
      rules: {
        ".Input": {
          paddingTop: stripeFontSize,
          paddingBottom: stripeFontSize,
          paddingLeft: "16px",
          paddingRight: "16px",
          borderColor: appTheme.token.colorBorder,
          boxShadow: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          fontFamily: stripeFont,
          fontSize: stripeFontSize,
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
          fontFamily: stripeFont,
        },
        ".Input::placeholder": {
          color: "#c5c5c5",
          fontWeight: "600",
          fontFamily: stripeFont,
        },
        ".Tab": {
          borderColor: appTheme.token.colorBorder,
          borderRadius: `${appTheme.token.borderRadius}px`,
          fontFamily: stripeFont,
          fontWeight: "600",
        },
        ".Tab:selected": {
          borderColor: appTheme.token.colorPrimary,
        },
      },
    };
  }, [stripeFontSize]);
  const renderTimerContent = () => {
    if (isFree || isExpired) return null;
    return (
      <TimerBadge $urgent={timeRemaining < 120}>
        <span>{timeRemaining < 120 ? "Expires in:" : "Spot reserved:"}</span>
        <Countdown seconds={timeRemaining} />
      </TimerBadge>
    );
  };

  const renderMobileSimpleSummary = () => {
    const slot = selectedSlot;
    const dateTimeLabel = slot?.isCourse ? "Course dates & time" : "Date & time";
    const dateTimeValue = slot
      ? slot.isCourse
        ? `${formatNaiveDate(slot.date, "MMM d")} - ${formatNaiveDate(slot.end_date, "MMM d, yyyy")} · Every ${slot.days.join(", ")} at ${formatTimeRangeForDisplay(slot.date, slot.time, slot.duration, businessTimeZone, userTimeZone)}`
        : `${formatNaiveDate(slot.date, "EEEE, MMM d, yyyy")} · ${formatTimeRangeForDisplay(slot.date, slot.time, slot.duration, businessTimeZone, userTimeZone)} (${getDurationText(slot.duration)})`
      : "";
    return (
      <>
        <div>
          <strong>{classData?.title}</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
          <MapPin size={14} />
          <span>{classData?.business_name || "Host Location"}</span>
        </div>

        {slot && (
          <MobileSummaryRowCard>
            <span style={{ fontSize: 13, color: "#6b7280" }}>{dateTimeLabel}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right", maxWidth: "60%" }}>
              {dateTimeValue}
            </span>
          </MobileSummaryRowCard>
        )}

        <MobileSummaryRowCard style={{ borderWidth: 1, borderColor: "#111827", flexDirection: "column", alignItems: "stretch" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
              {finalTotal === 0 ? (
                "Free"
              ) : (
                <NumberFlow
                  value={finalTotal}
                  format={{ style: "currency", currency: "CAD" }}
                />
              )}
            </span>
          </div>
          <ViewDetailsButton type="button" onClick={() => setPriceDetailsDrawerOpen(true)}>
            View details
          </ViewDetailsButton>
        </MobileSummaryRowCard>

        {/* RESTORED CANCELLATION POLICY & FREE CHECK */}
        {cancellationPolicyText && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Shield size={16} style={{ color: "#6b7280", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>Cancellation Policy</div>
                <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>{cancellationPolicyText}</div>
              </div>
            </div>
          </div>
        )}

        {isFree && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#15803d" }}>
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
        <span>HST (13%)</span>
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
        </TicketMetaItem>
        <TicketMetaItem>
          <div className="icon-box"><Clock /></div>
          <div className="text-content">
            <span className="label">Time</span>
            <span className="value">{formatTimeRangeForDisplay(date, time, duration, businessTimeZone, userTimeZone)} ({getDurationText(duration)})</span>
          </div>
        </TicketMetaItem>
      </SummaryMetaBlock>
    );
  };

  const renderTicketSummary = () => (
    <TicketWrapper>
      <TicketTop>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <DesktopTimerContainer>{renderTimerContent()}</DesktopTimerContainer>
        </div>
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
          <span>{participantsCount} {participantsCount > 1 ? "Guests" : "Guest"}</span>
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
          <span>HST (13%)</span>
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

  return (
    <ConfigProvider theme={appTheme}>
      {!isFree && !clientSecret ? (
        paymentIntentError ? (
          <LottieContainer>
            <Alert
              message="Couldn't reserve spots"
              description={paymentIntentError}
              type="warning"
              showIcon
              style={{ marginBottom: 16, maxWidth: 400 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={() => {
                setPaymentIntentError(null);
                fetchPaymentIntent(appliedDiscount?.id ?? null);
              }}
              icon={<RefreshCw size={16} />}
              style={{ background: "#ff385c", border: "none", height: "44px", fontWeight: 600 }}
            >
              Try again
            </Button>
          </LottieContainer>
        ) : (
          <LottieContainer>
            <Lottie animationData={loadingAnimation} loop={true} style={{ width: 180, height: 180 }} />
            <LottieText>We're getting things ready</LottieText>
            <LottieSubText>Let's get that booked for you!</LottieSubText>
          </LottieContainer>
        )
      ) : (
        <Elements
          stripe={stripePromise}
          key={`${clientSecret || "free-mode"}-${stripeFontSize}`}
          options={isFree ? undefined : { clientSecret, appearance: stripeAppearance }}
        >
          <StepContainer>
            <LeftColumnWrap>
            {isExpired && (
              <ExpiredOverlay>
                <ExpiredContent>
                  <ExpiredIconWrapper><Clock size={24} /></ExpiredIconWrapper>
                  <h3>Session Expired</h3>
                  <p>To ensure fairness for all guests, we only hold spots for 15 minutes. Please find a spot again to check availability.</p>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleSessionExpired}
                    icon={<RefreshCw size={16} />}
                    style={{ width: "100%", background: "#ff385c", border: "none", height: "44px", fontWeight: 600 }}
                  >
                    Find a Spot
                  </Button>
                </ExpiredContent>
              </ExpiredOverlay>
            )}

            <PaymentSection>
              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(null)}
                  style={{ marginBottom: 16 }}
                />
              )}

              <MobileTimerContainer>{renderTimerContent()}</MobileTimerContainer>

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

              <MobilePromoSection>
                {!showPromoGiftCard && !appliedDiscount && !appliedGiftCard ? (
                  <PromoRevealButton
                    type="button"
                    onClick={() => setShowPromoGiftCard(true)}
                  >
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
                        <Button
                          size="middle"
                          onClick={handleApplyCoupon}
                          loading={couponLoading}
                          style={{ height: 45 }}
                        >
                          Apply
                        </Button>
                      </CouponTicketInput>
                    ) : (
                      <AppliedCouponTicket>
                        <div className="coupon-info">
                          <Percent size={14} />
                          <span>{appliedDiscount.code.toUpperCase()} Applied</span>
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<X size={14} />}
                          onClick={handleRemoveCoupon}
                        />
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
                        <Button
                          size="middle"
                          onClick={handleApplyGiftCard}
                          loading={gcLoading}
                          style={{ height: 45 }}
                        >
                          Apply
                        </Button>
                      </CouponTicketInput>
                    ) : (
                      <AppliedCouponTicket
                        style={{
                          marginTop: 12,
                          borderColor: "#8b5cf6",
                          backgroundColor: "#f5f3ff",
                          color: "#7c3aed",
                        }}
                      >
                        <div className="coupon-info">
                          <Gift size={14} />
                          <span>Gift Card ending in {appliedGiftCard.code.slice(-4)}</span>
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<X size={14} />}
                          onClick={handleRemoveGiftCard}
                        />
                      </AppliedCouponTicket>
                    )}
                  </>
                )}
              </MobilePromoSection>

              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={handleFormValuesChange}
              >
                  {/* SECTION 1: GUEST DETAILS */}
                  <SectionCard>
                      <SectionHeader $clickable={checkoutStep === "payment"} onClick={() => checkoutStep === "payment" && setCheckoutStep("guest")}>
                          <h3>1. Guest Details</h3>
                          {checkoutStep === "payment" && (
                              <button type="button" className="edit-btn">Edit</button>
                          )}
                      </SectionHeader>
                      
                      <AnimatePresence initial={false}>
                        {checkoutStep === "guest" ? (
                             <MeasuredCollapseSection key="content">
                                <div style={{ paddingTop: 8 }}>
                                    <Form.Item
                                    name="booker_name"
                                    rules={[{ required: true, message: "Your name is required" }]}
                                    style={{ marginBottom: 12 }}
                                    label={<FieldLabel>Full name</FieldLabel>}
                                    >
                                    <Input
                                        placeholder="e.g. Jane Smith"
                                        readOnly={isUserLoggedIn && !!bookingData.userName}
                                        style={isUserLoggedIn && !!bookingData.userName ? { backgroundColor: "#f0f0f0", cursor: "not-allowed", color: "#555" } : {}}
                                        suffix={isUserLoggedIn && !!bookingData.userName && <UserCheck size={16} color="#52c41a" />}
                                    />
                                    </Form.Item>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <Form.Item name="email" rules={[{ required: true, type: "email" }]} label={<FieldLabel>Email</FieldLabel>}>
                                        <Input placeholder="e.g. jane@example.com" disabled={isUserLoggedIn} />
                                    </Form.Item>
                                    <Form.Item name="phone" rules={[{ required: true }]} label={<FieldLabel>Phone</FieldLabel>}>
                                        <Input placeholder="e.g. (555) 123-4567" disabled={isUserLoggedIn} />
                                    </Form.Item>
                                </div>
                                
                                <div>
                                    {!showNotes ? (
                                        <AdditionalNotesRevealButton type="button" onClick={() => setShowNotes(true)}>
                                            <ChevronRight size={18} />
                                            <span>Add additional notes (optional)</span>
                                        </AdditionalNotesRevealButton>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={COLLAPSE_TRANSITION} style={{ overflow: "hidden" }}>
                                            <Form.Item name="notes" label={<FieldLabel>Additional Notes</FieldLabel>} style={{ marginBottom: 0, marginTop: 12 }}>
                                                <Input.TextArea placeholder="Any special requests or dietary restrictions?" rows={2} />
                                            </Form.Item>
                                        </motion.div>
                                    )}
                                </div>

                                <NextButtonContainer>
                                    <NextButton type="primary" onClick={handleGoToPayment}>
                                        Next
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

                  {/* SECTION 2: PAYMENT */}
                  <SectionCard style={{ marginTop: 24 }} $disabled={checkoutStep !== "payment"}>
                      <SectionHeader>
                          <h3>2. Payment</h3>
                      </SectionHeader>
                      
                      {/* PRELOAD: We always render PaymentFormContent but toggle visibility via display: block/none 
                          and opacity to allow the iframe to load. 
                      */}
                      <SectionContent 
                          style={{ 
                             display: checkoutStep === "payment" ? 'block' : 'none' 
                          }}
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: checkoutStep === "payment" ? 1 : 0 }}
                      >
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
                            />
                            {/* Render footer inside payment section on desktop */}
                            {confirmFooter && (
                                <DesktopInlineFooter>
                                    {confirmFooter}
                                </DesktopInlineFooter>
                            )}
                      </SectionContent>
                  </SectionCard>
              </Form>

            </PaymentSection>
            </LeftColumnWrap>

            <SummarySection>{renderTicketSummary()}</SummarySection>
          </StepContainer>
        </Elements>
      )}
    </ConfigProvider>
  );
};

export default ReviewAndPaymentStep;