import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ConfigProvider, Form, Input, Alert, Button } from "antd";
import message, { useToast } from "@/lib/message";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import confetti from "canvas-confetti";
import axios from "axios";
import {
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Lock,
  Percent,
  UserCheck,
  RefreshCw,
  Ticket,
  MapPin,
  CalendarDays,
  X,
  Gift,
  CreditCard,
  Wallet,
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

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SummarySection = styled.div`
  display: none;
  @media (min-width: 969px) {
    display: block;
    position: sticky;
    top: 20px;
  }
`;

const LeftColumnWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

const DesktopConfirmFooterWrap = styled.div`
  display: none;
  @media (min-width: 969px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    padding: 24px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    background: white;
  }
`;

// --- TICKET DESIGN COMPONENTS ---

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

/* Scannable row containers for mobile booking summary (Airbnb-style) */
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

const AdditionalNotesRevealButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
  margin-top: 8px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  border-top: 1px solid #e5e7eb;
  transition: color 0.15s ease;
  &:hover {
    color: #374151;
  }
  svg {
    flex-shrink: 0;
  }
`;

/* Price details drawer (Vaul) - padding only, no new background */
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

/* Promo / Gift card section visible only on mobile (desktop has it in the sidebar ticket) */
const MobilePromoSection = styled.div`
  display: block;
  margin-bottom: 16px;
  text-align: center;
  @media (min-width: 969px) {
    display: none;
  }
`;

const FormCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);
  @media (max-width: 968px) {
    padding: 16px;
    /* Prevent iOS zoom on focus: inputs must be at least 16px */
    .ant-input,
    .ant-input-affix-wrapper input,
    textarea.ant-input {
      font-size: 16px !important;
    }
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;

  @media (max-width: 968px) {
    font-size: 0.95rem;
    text-align: center;
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

const OptionLabel = styled.div`
  display: inline-block;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
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

const BookerNameInput = ({ isUserLoggedIn, bookerNameFromBookingData }) => (
  <div style={{ paddingTop: 8 }}>
    <Form.Item
      name="booker_name"
      rules={[{ required: true, message: "Please enter your full name" }]}
      style={{ marginBottom: 12 }}
      label={<FieldLabel>Full name</FieldLabel>}
    >
      <Input
        placeholder="e.g. Jane Smith"
        readOnly={isUserLoggedIn && !!bookerNameFromBookingData}
        style={
          isUserLoggedIn && !!bookerNameFromBookingData
            ? {
                backgroundColor: "#f0f0f0",
                cursor: "not-allowed",
                color: "#555",
              }
            : {}
        }
        suffix={
          isUserLoggedIn && !!bookerNameFromBookingData && (
            <UserCheck size={16} color="#52c41a" />
          )
        }
      />
    </Form.Item>
  </div>
);

const ExpressCheckoutButton = ({
  finalTotal,
  clientSecret,
  onPaymentComplete,
  paymentService,
  bookingData,
  form,
  getGuestFullName,
  isFormValid,
  onPaymentRequestReady,
  inSelectorMode,
  /** When provided (e.g. mobile custom selector), render this instead of Stripe's button; it receives paymentRequest so the parent can call paymentRequest.show() */
  customTrigger,
  /** Toast API for error/success (from useToast); falls back to message if not provided */
  toast,
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const notify = toast || message;

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
          notify.error("Please try again.");
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

        if (!email || !phone || !bookerName) {
          ev.complete("fail");
          notify.error("Please enter your full name, email, and phone number above first.");
          return;
        }

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
            if (process.env.NODE_ENV === "development") {
              console.error("Error updating intent for Apple Pay:", backendErr);
            }
            ev.complete("fail");
            notify.error("Could not update booking details. Please try again.");
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
          notify.error(error.message || "Payment was declined. Please try again.");
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
        if (process.env.NODE_ENV === "development") {
          console.error("Apple Pay exception:", err);
        }
        ev.complete("fail");
        notify.error("Payment failed. Please try again.");
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
    getGuestFullName,
  ]);

  if (!paymentRequest || !isFormValid) return null;

  if (customTrigger) {
    return <div style={{ marginBottom: 0 }}>{customTrigger(paymentRequest)}</div>;
  }

  return (
    <div style={{ marginBottom: inSelectorMode ? 0 : 24 }}>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
      {!inSelectorMode && (
        <div
          style={{
            textAlign: "center",
            margin: "16px 0",
            color: "#6b7280",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
          <span>Or pay with card</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
        </div>
      )}
    </div>
  );
};

const PaymentElementWrapper = styled.div`
  min-height: 240px;
  width: 100%;
  @media (min-width: 969px) {
    min-height: 0;
  }
`;

/* Desktop: Express + card only. Mobile: custom selector (Apple Pay | Card). CSS shows one. */
const DesktopPaymentOnly = styled.div`
  display: block;
  @media (max-width: 968px) {
    display: none !important;
  }
`;
const MobilePaymentOnly = styled.div`
  display: none;
  @media (max-width: 968px) {
    display: block;
  }
`;

/* Payment method selector (Apple Pay vs Card) */
const PaymentMethodSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;
const PaymentMethodOption = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${(p) => (p.$selected ? "#ff385c" : "#e5e7eb")};
  background: ${(p) => (p.$selected ? "#fff5f6" : "white")};
  color: ${(p) => (p.$selected ? "#ff385c" : "#374151")};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
  &:hover {
    border-color: ${(p) => (p.$selected ? "#ff385c" : "#d1d5db")};
    background: ${(p) => (p.$selected ? "#fff5f6" : "#f9fafb")};
  }
`;
const OpenCardDrawerButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #222;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: #ff385c;
    background: #fff5f6;
  }
`;

/* Custom Apple Pay button for mobile (calls paymentRequest.show(); font matches app) */
const CustomApplePayButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #222;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Proxima Soft", sans-serif;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: #ff385c;
    background: #fff5f6;
  }
`;
/* Vaul drawer for card payment */
const CardDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;
const CardDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;
const CardDrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;
const CardDrawerBody = styled.div`
  overflow-y: auto;
  padding: 20px 24px 16px;
  min-height: 0;
  flex: 1;
  font-family: "Proxima Soft", sans-serif;
`;
const CardDrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  border-top: 1px solid #e5e7eb;
  background: white;
  font-family: "Proxima Soft", sans-serif;
`;
const CardDrawerConfirmButton = styled.button`
  width: 100%;
  background: #ff385c;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  font-family: "Proxima Soft", sans-serif;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: #e31c5f;
  }
`;

const paymentElementOptions = {
  layout: "tabs",
  wallets: {
    applePay: "never",
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
  getGuestFullName,
  toast,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [mountPaymentElement, setMountPaymentElement] = useState(false);
  const [hasApplePay, setHasApplePay] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("apple_pay");
  const [cardDrawerOpen, setCardDrawerOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 969);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const showCardInline = !isMobile;
  const showCardInDrawer = isMobile && selectedMethod === "card" && cardDrawerOpen;
  const shouldMountPaymentElement = !!clientSecret && !isFree && (showCardInline || showCardInDrawer);

  useEffect(() => {
    if (!shouldMountPaymentElement) {
      setMountPaymentElement(false);
      return;
    }
    let cancelled = false;
    const t = requestAnimationFrame(() => {
      if (!cancelled) setMountPaymentElement(true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(t);
    };
  }, [shouldMountPaymentElement]);

  const hideFooterButton = isMobile && selectedMethod === "card";

  useEffect(() => {
    const canSubmit = isFree
      ? !loading && isFormValid
      : stripe && elements && !loading && isFormValid && isReady;

    onPaymentAction?.({
      handleSubmit: () => handleSubmit(stripe, elements),
      loading,
      canSubmit,
      finalTotal,
      showFooterButton: hideFooterButton ? false : undefined,
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
    hideFooterButton,
  ]);

  const paymentElementBlock = mountPaymentElement && (
    <PaymentElement
      options={paymentElementOptions}
      onReady={() => setIsReady(true)}
      onLoadError={handleLoadError}
    />
  );

  return (
    <>
      {!isFree && clientSecret && (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: 24,
          }}
        >
          {/* Desktop: Express + card only (no selector). Hidden on mobile. */}
          <DesktopPaymentOnly>
            <ExpressCheckoutButton
              finalTotal={finalTotal}
              clientSecret={clientSecret}
              onPaymentComplete={onPaymentComplete}
              paymentService={paymentService}
              bookingData={bookingData}
              form={form}
              getGuestFullName={getGuestFullName}
              isFormValid={isFormValid}
              onPaymentRequestReady={() => setHasApplePay(true)}
              toast={toast}
            />
            <PaymentElementWrapper>
              {paymentElementBlock}
            </PaymentElementWrapper>
          </DesktopPaymentOnly>

          {/* Mobile: custom selector (Apple Pay | Card). Hidden on desktop. */}
          <MobilePaymentOnly>
            <PaymentMethodSelector>
              <PaymentMethodOption
                type="button"
                $selected={selectedMethod === "apple_pay"}
                onClick={() => setSelectedMethod("apple_pay")}
              >
                <Wallet size={18} />
                Apple Pay
              </PaymentMethodOption>
              <PaymentMethodOption
                type="button"
                $selected={selectedMethod === "card"}
                onClick={() => setSelectedMethod("card")}
              >
                <CreditCard size={18} />
                Credit / Debit card
              </PaymentMethodOption>
            </PaymentMethodSelector>
            {selectedMethod === "apple_pay" && (
              <ExpressCheckoutButton
                finalTotal={finalTotal}
                clientSecret={clientSecret}
                onPaymentComplete={onPaymentComplete}
                paymentService={paymentService}
                bookingData={bookingData}
                form={form}
                getGuestFullName={getGuestFullName}
                isFormValid={isFormValid}
                onPaymentRequestReady={() => setHasApplePay(true)}
                inSelectorMode
                toast={toast}
                customTrigger={(paymentRequest) => (
                  <CustomApplePayButton
                    type="button"
                    onClick={() => paymentRequest.show()}
                  >
                    <Wallet size={20} />
                    Pay with Apple Pay
                  </CustomApplePayButton>
                )}
              />
            )}
            {selectedMethod === "card" && (
              <>
                <OpenCardDrawerButton
                  type="button"
                  onClick={() => setCardDrawerOpen(true)}
                >
                  <CreditCard size={20} />
                  Pay with credit or debit card
                </OpenCardDrawerButton>
                <Drawer.Root
                  open={cardDrawerOpen}
                  onOpenChange={(open) => setCardDrawerOpen(open)}
                >
                  <Drawer.Portal>
                    <CardDrawerOverlay />
                    <CardDrawerContent>
                      <CardDrawerHandle />
                      <CardDrawerBody>
                        <PaymentElementWrapper style={{ minHeight: 200 }}>
                          {paymentElementBlock}
                        </PaymentElementWrapper>
                      </CardDrawerBody>
                      <CardDrawerFooter>
                        <CardDrawerConfirmButton
                          type="button"
                          disabled={!stripe || !elements || !isFormValid || !isReady || loading}
                          onClick={() => handleSubmit(stripe, elements)?.()}
                        >
                          {loading ? "Processing…" : "Confirm and Pay"}
                        </CardDrawerConfirmButton>
                      </CardDrawerFooter>
                    </CardDrawerContent>
                  </Drawer.Portal>
                </Drawer.Root>
              </>
            )}
          </MobilePaymentOnly>
        </div>
      )}
    </>
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
  const toast = useToast();
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
  const [showAdditionalNotes, setShowAdditionalNotes] = useState(false);

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
  const [appliedGiftCard, setAppliedGiftCard] = useState(null); // { code, balance }
  const [gcLoading, setGcLoading] = useState(false);

  const [showPromoGiftCard, setShowPromoGiftCard] = useState(false);

  // Global (platform) discount – applied automatically; shown in same Discount line as business coupon
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
    // PostHog: Track payment step entry in booking funnel
    posthog.capture("booking_payment_initiated", {
      class_id: classData?.classId || classData?.id,
      class_title: classData?.title,
      participants: bookingData.participants,
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
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

  // Basis for global discount (backend applies it on subtotal after business discount)
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

  // Calculate totals: one combined discount (business coupon + global/platform)
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
  // Reset timer whenever we have a (possibly new) PaymentIntent so each hold gets a full 15 min.
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
      // If fully covered by Gift Card, we don't need a Stripe Intent upfront.
      // But we DO need to ensure we have a valid booking state to submit.
      // We skip fetching payment intent if it's already free, unless we're just updating metadata.
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
          // Pass Gift Card info so backend knows we might be partially or fully covering it
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
        toast.error(msg);
        if (process.env.NODE_ENV === "development") {
          console.error("Error creating draft intent:", err);
        }
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
      toast,
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

  // When PaymentElement fires loaderror (e.g. PaymentIntent in terminal state after refresh/expiry),
  // release the old intent's hold, then clear and fetch a new PaymentIntent so Elements can initialize correctly.
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

  // --- COUPON HANDLERS ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code.");
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
        toast.success(`Coupon "${result.data.code}" applied!`);
        confetti({
          particleCount: 150,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#ff385c", "#000000", "#ffffff"],
        });
      } else {
        toast.error(result.error?.detail || "Invalid coupon code. Please check and try again.");
        setAppliedDiscount(null);
      }
    } catch (err) {
      toast.error("We couldn't apply the coupon. Please try again.");
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

      setAppliedGiftCard(data); // Should return { code, balance }
        toast.success(`Gift card applied: $${data.balance} available`);
    } catch (err) {
      toast.error(err.error || "Invalid gift card. Please check the code and try again.");
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

  const handleSubmit = useCallback(
    async (stripe, elements) => {
      if (isExpired) return;
      if (!selectedSlot) {
        setError("Slot not selected.");
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setLoading(true);
      setError(null);

      try {
        const values = await form.validateFields();

        // --- FREE / FULLY COVERED BOOKING FLOW ---
        // If final total is 0 (due to 100% coupon OR 100% gift card coverage)
        if (isFree) {
          // If we had a previous stripe intent, cancel it to release hold
          if (bookingData.paymentIntentId) {
            try {
              await paymentService.cancelPaymentIntent(
                bookingData.paymentIntentId,
              );
            } catch (cancelErr) {
              // Ignore
            }
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

          // Logic: For $0 total, createPaymentIntent returns booking_id directly
          const res = await paymentService.createPaymentIntent(payload);
          if (res?.booking_id) {
            onPaymentComplete(res);
            return;
          }
          const freeMsg =
            res?.error || "We couldn’t complete your free booking. Please try again or contact support.";
          setError(freeMsg);
          toast.error(freeMsg);
          setLoading(false);
          return;
        }

        // --- STANDARD STRIPE FLOW ---
        if (!stripe || !elements) return;

        const { error: submitError } = await elements.submit();
        if (submitError) {
          const msg = submitError.message || "Please check your payment details and try again.";
          setError(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        if (clientSecret) {
          try {
            const paymentIntentId = clientSecret.split("_secret_")[0];

            const bookerName = (values?.booker_name && String(values.booker_name).trim()) || "Guest";
            const participantDetailsPayload = Array.from(
              { length: participantsCount },
              () => ({ name: bookerName }),
            );
            if (paymentService.updatePaymentIntent) {
              await paymentService.updatePaymentIntent({
                payment_intent_id: paymentIntentId,
                guest_email: values.email,
                guest_full_name: bookerName,
                guest_phone: values.phone,
                participant_details: participantDetailsPayload,
                notes: values.notes,
                applied_discount_id: appliedDiscount?.id || null,
              });
            }
          } catch (updateErr) {
            if (process.env.NODE_ENV === "development") {
              console.error("Failed to update booking details before payment:", updateErr);
            }
          }
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
        const msg = err.message || "Payment processing failed. Please try again.";
        setError(msg);
        toast.error(msg);
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
      toast,
    ],
  );

  const renderBookingDetailsTicket = () => {
    if (!selectedSlot) return null;
    const { date, time, duration, isCourse, end_date, days } = selectedSlot;

    if (isCourse) {
      return (
        <SummaryMetaBlock>
          <TicketMetaItem>
            <div className="icon-box">
              <CalendarDays />
            </div>
            <div className="text-content">
              <span className="label">Course Dates</span>
              <span className="value">
                {formatNaiveDate(date, "MMM d")} -{" "}
                {formatNaiveDate(end_date, "MMM d, yyyy")}
              </span>
            </div>
          </TicketMetaItem>
          <TicketMetaItem>
            <div className="icon-box">
              <Clock />
            </div>
            <div className="text-content">
              <span className="label">Time</span>
              <span className="value">
                Every {days.join(", ")} at{" "}
                {formatTimeRangeForDisplay(
                  date,
                  time,
                  duration,
                  businessTimeZone,
                  userTimeZone,
                )}
              </span>
            </div>
          </TicketMetaItem>
        </SummaryMetaBlock>
      );
    }

    return (
      <SummaryMetaBlock>
        <TicketMetaItem>
          <div className="icon-box">
            <CalendarDays />
          </div>
          <div className="text-content">
            <span className="label">Date</span>
            <span className="value">
              {formatNaiveDate(date, "EEEE, MMMM d, yyyy")}
            </span>
          </div>
        </TicketMetaItem>
        <TicketMetaItem>
          <div className="icon-box">
            <Clock />
          </div>
          <div className="text-content">
            <span className="label">Time</span>
            <span className="value">
              {formatTimeRangeForDisplay(
                date,
                time,
                duration,
                businessTimeZone,
                userTimeZone,
              )}{" "}
              ({getDurationText(duration)})
            </span>
          </div>
        </TicketMetaItem>
      </SummaryMetaBlock>
    );
  };

  // --- RENDER TICKET SUMMARY (Replaces Card) ---
  const renderTicketSummary = () => (
    <TicketWrapper>
      <TicketTop>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
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
        {/* Promo / Gift card: reveal section to reduce cognitive load */}
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

        <TicketRow>
          <span>
            {participantsCount} {participantsCount > 1 ? "Guests" : "Guest"}
          </span>
          <span>
            {subtotal === 0 ? (
              "Free"
            ) : (
              <NumberFlow
                value={subtotal}
                format={{ style: "currency", currency: "CAD" }}
              />
            )}
          </span>
        </TicketRow>

        {(appliedDiscount || activeGlobalDiscount) && discountAmount > 0 && (
          <TicketRow style={{ color: "#059669" }}>
            <span>
              Discount
              {appliedDiscount && ` (${appliedDiscount.code})`}
              {activeGlobalDiscount && (appliedDiscount ? ` · ${activeGlobalDiscount.name}` : ` (${activeGlobalDiscount.name})`)}
            </span>
            <span>
              <NumberFlow
                value={-discountAmount}
                format={{ style: "currency", currency: "CAD" }}
              />
            </span>
          </TicketRow>
        )}

        {appliedGiftCard && (
          <TicketRow style={{ color: "#7c3aed" }}>
            <span>Gift Card</span>
            <span>
              -{" "}
              <NumberFlow
                value={gcDeduction}
                format={{ style: "currency", currency: "CAD" }}
              />
            </span>
          </TicketRow>
        )}

        <TicketRow>
          <span>HST (13%)</span>
          <span>
            <NumberFlow
              value={taxAmount}
              format={{ style: "currency", currency: "CAD" }}
            />
          </span>
        </TicketRow>

        <TicketTotalRow>
          <span>Total</span>
          <span>
            {finalTotal === 0 ? (
              "Free"
            ) : (
              <NumberFlow
                value={finalTotal}
                format={{ style: "currency", currency: "CAD" }}
              />
            )}
          </span>
        </TicketTotalRow>
      </TicketBottom>

      {/* Policies below ticket */}
      <InfoPanel
        $bgColor="#f9fafb"
        $borderColor="#e5e7eb"
        $iconColor="#6b7280"
        $titleColor="#111827"
        $textColor="#4b5563"
      >
        <Shield />
        <div>
          <h5>Cancellation Policy</h5>
          <p>{cancellationPolicyText}</p>
        </div>
      </InfoPanel>

      {isFree ? (
        <InfoPanel
          $bgColor="#f0fdf4"
          $borderColor="#bbf7d0"
          $iconColor="#22c55e"
          $titleColor="#15803d"
          $textColor="#166534"
        >
          <CheckCircle />
          <div>
            <h5>No Payment Required</h5>
            <p>This booking is fully covered.</p>
          </div>
        </InfoPanel>
      ) : null}
    </TicketWrapper>
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

  // Stripe font size: 14px desktop, 16px mobile (16px avoids iOS zoom on focus)
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

  return (
    <ConfigProvider theme={appTheme}>
      {/* 
          If NOT free and NO clientSecret yet, show loader. 
          If free (via GC/coupon), we skip Elements and show just the form.
      */}
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
              style={{
                background: "#ff385c",
                border: "none",
                height: "44px",
                fontWeight: 600,
              }}
            >
              Try again
            </Button>
          </LottieContainer>
        ) : (
          <LottieContainer>
            <Lottie
              animationData={loadingAnimation}
              loop={true}
              style={{ width: 180, height: 180 }}
            />
            <LottieText>We're getting things ready</LottieText>
            <LottieSubText>Let's get that booked for you!</LottieSubText>
          </LottieContainer>
        )
      ) : (
        <Elements
          stripe={stripePromise}
          key={`${clientSecret || "free-mode"}-${stripeFontSize}`}
          options={
            isFree
              ? undefined
              : {
                  clientSecret,
                  appearance: stripeAppearance,
                }
          }
        >
          <StepContainer>
            <LeftColumnWrap>
            {isExpired && (
              <ExpiredOverlay>
                <ExpiredContent>
                  <ExpiredIconWrapper>
                    <Clock size={24} />
                  </ExpiredIconWrapper>
                  <h3>Session Expired</h3>
                  <p>
                    To ensure fairness for all guests, we only hold spots for 15
                    minutes. Please find a spot again to check availability.
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleSessionExpired}
                    icon={<RefreshCw size={16} />}
                    style={{
                      width: "100%",
                      background: "#ff385c",
                      border: "none",
                      height: "44px",
                      fontWeight: 600,
                    }}
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

              <MobileTimerContainer>
                {renderTimerContent()}
              </MobileTimerContainer>

              <MobileSummaryContainer>
                <MobileSummaryHeader
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                >
                  <div className="title-group">
                    <Ticket size={20} />
                    <span>Booking Summary</span>
                  </div>
                  <div className="price-group">
                    <span className="total-price">
                      <NumberFlow
                        value={finalTotal}
                        format={{ style: "currency", currency: "CAD" }}
                      />
                    </span>
                    <ChevronDown
                      className="toggle-icon"
                      size={20}
                      style={{
                        transform: showMobileSummary
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </div>
                </MobileSummaryHeader>
                <AnimatePresence initial={false}>
                  {showMobileSummary && (
                    <MobileSummaryContent
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <MobileSummaryInner>
                        {renderMobileSimpleSummary()}
                      </MobileSummaryInner>
                    </MobileSummaryContent>
                  )}
                </AnimatePresence>
              </MobileSummaryContainer>

              <Drawer.Root open={priceDetailsDrawerOpen} onOpenChange={setPriceDetailsDrawerOpen}>
                <Drawer.Portal>
                  <PriceDetailsDrawerOverlay />
                  <PriceDetailsDrawerContent>
                    <PriceDetailsDrawerHandle />
                    <PriceDetailsDrawerBody>
                      {renderPriceDetailsDrawerContent()}
                    </PriceDetailsDrawerBody>
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

              <FormCard>
                <fieldset
                  disabled={isExpired}
                  style={{ border: "none", padding: 0, margin: 0 }}
                >
                  <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onValuesChange={handleFormValuesChange}
                  >
                    <BookerNameInput
                      bookerNameFromBookingData={bookingData.userName}
                      isUserLoggedIn={isUserLoggedIn}
                    />

                    <div
                      style={{
                        paddingTop: "16px",
                        borderTop: "1px solid #e5e7eb",
                        marginTop: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <Form.Item
                          name="email"
                          rules={[
                            { required: true, message: "Please enter your email" },
                            { type: "email", message: "Please enter a valid email address" },
                          ]}
                          label={<FieldLabel>Email</FieldLabel>}
                        >
                          <Input
                            placeholder="e.g. jane@example.com"
                            disabled={isUserLoggedIn}
                          />
                        </Form.Item>
                        <Form.Item
                          name="phone"
                          rules={[{ required: true, message: "Please enter your phone number" }]}
                          label={<FieldLabel>Phone</FieldLabel>}
                        >
                          <Input
                            placeholder="e.g. (555) 123-4567"
                            disabled={isUserLoggedIn}
                          />
                        </Form.Item>
                      </div>
                    </div>

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
                      getGuestFullName={getGuestFullName}
                      toast={toast}
                    />

                    <div>
                      {!showAdditionalNotes ? (
                        <AdditionalNotesRevealButton
                          type="button"
                          onClick={() => setShowAdditionalNotes(true)}
                        >
                          <ChevronRight size={18} />
                          <span>Additional notes</span>
                        </AdditionalNotesRevealButton>
                      ) : (
                        <Form.Item
                          name="notes"
                          label={<FieldLabel>Additional Notes</FieldLabel>}
                        >
                          <Input.TextArea
                            placeholder="e.g. Any dietary restrictions or special requests"
                            rows={2}
                          />
                        </Form.Item>
                      )}
                    </div>
                  </Form>
                </fieldset>
              </FormCard>
            </PaymentSection>
            {confirmFooter && (
              <DesktopConfirmFooterWrap>{confirmFooter}</DesktopConfirmFooterWrap>
            )}
            </LeftColumnWrap>

            <SummarySection>{renderTicketSummary()}</SummarySection>
          </StepContainer>
        </Elements>
      )}
    </ConfigProvider>
  );
};

export default ReviewAndPaymentStep;
