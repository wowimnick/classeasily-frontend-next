import React, {
  useState,
  useEffect,
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
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import confetti from "canvas-confetti";
import {
  Shield,
  Clock,
  ChevronDown,
  ShoppingCart,
  CheckCircle,
  Lock,
  Percent,
  UserCheck,
  RefreshCw,
  Ticket,
  MapPin,
  CalendarDays,
  X,
} from "lucide-react";
import Lottie from "lottie-react";

import { getCancellationPolicyText, getDurationText } from "./utils";
import { businessDiscountService } from "@/services/apiService";
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

  /* The semi-circle cutouts at the bottom corners of the top section */
  &::after {
    content: "";
    position: absolute;
    bottom: -18px;
    left: -8px;
    width: 20px;
    height: 20px;
    background-color: #f3f4f6; /* Matches page bg */
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
    background-color: #f3f4f6; /* Matches page bg */
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

  /* Dashed Line */
  &::after {
    content: "";
    width: 86%;
    height: 0;
    border-top: 2px dashed #e5e7eb;
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
  border-top: 2px solid #f3f4f6;
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

const BarcodeSVG = () => (
  <svg width="100%" height="30" viewBox="0 0 200 30" preserveAspectRatio="none">
    <path
      fill="#111827"
      d="M0,0 h4 v30 h-4 M8,0 h2 v30 h-2 M14,0 h6 v30 h-6 M24,0 h2 v30 h-2 M30,0 h4 v30 h-4 M38,0 h2 v30 h-2 M44,0 h4 v30 h-4 M52,0 h2 v30 h-2 M60,0 h6 v30 h-6 M70,0 h2 v30 h-2 M76,0 h2 v30 h-2 M82,0 h4 v30 h-4 M90,0 h6 v30 h-6 M100,0 h2 v30 h-2 M106,0 h4 v30 h-4 M114,0 h2 v30 h-2 M120,0 h6 v30 h-6 M130,0 h2 v30 h-2 M136,0 h4 v30 h-4 M144,0 h2 v30 h-2 M150,0 h6 v30 h-6 M160,0 h2 v30 h-2 M166,0 h4 v30 h-4 M174,0 h2 v30 h-2 M180,0 h4 v30 h-4 M188,0 h2 v30 h-2 M196,0 h4 v30 h-4"
    />
  </svg>
);

// --- END TICKET DESIGN ---

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
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
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

// -- Updated Coupon Components --
const CouponTicketInput = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;

  .ant-input {
    font-size: 13px;
    background: white;
  }

  .ant-btn {
    font-size: 13px;
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
  margin-bottom: 12px;
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

const ParticipantNameInputs = ({
  count,
  isUserLoggedIn,
  bookerNameFromBookingData,
}) => {
  if (count <= 0) return null;

  return (
    <div style={{ paddingTop: 8 }}>
      <SectionTitle>Who's Coming?</SectionTitle>
      {Array.from({ length: count }).map((_, index) => (
        <Form.Item
          key={index}
          name={["participant_details", index, "name"]}
          rules={[
            { required: true, message: `Guest ${index + 1} name is required` },
          ]}
          style={{ marginBottom: 12 }}
        >
          <Input
            placeholder={`Guest ${index + 1} Full Name`}
            readOnly={
              index === 0 && isUserLoggedIn && !!bookerNameFromBookingData
            }
            style={
              index === 0 && isUserLoggedIn && !!bookerNameFromBookingData
                ? {
                    backgroundColor: "#f0f0f0",
                    cursor: "not-allowed",
                    color: "#555",
                  }
                : {}
            }
            suffix={
              index === 0 &&
              isUserLoggedIn &&
              !!bookerNameFromBookingData && (
                <UserCheck size={16} color="#52c41a" />
              )
            }
          />
        </Form.Item>
      ))}
    </div>
  );
};

const ExpressCheckoutButton = ({
  finalTotal,
  clientSecret,
  onPaymentComplete,
  paymentService,
  bookingData,
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
      }
    });

    pr.on("paymentmethod", async (ev) => {
      const payerName = ev.payerName;
      const payerEmail = ev.payerEmail;
      const payerPhone = ev.payerPhone;

      try {
        if (clientSecret) {
          const paymentIntentId = clientSecret.split("_secret_")[0];

          if (paymentService && paymentService.updatePaymentIntent) {
            try {
              await paymentService.updatePaymentIntent({
                payment_intent_id: paymentIntentId,
                guest_email: payerEmail,
                guest_full_name: payerName,
                guest_phone: payerPhone,
                participant_details: bookingData.participant_details || [
                  { name: payerName },
                ],
                notes: bookingData.notes || "",
                applied_discount_id: bookingData.applied_discount_id || null,
              });
            } catch (backendErr) {
              console.error("Error:", backendErr);
            }
          }
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: ev.paymentMethod.id,
            receipt_email: payerEmail || undefined,
          },
          { handleActions: false },
        );

        if (error) {
          ev.complete("fail");
          message.error(error.message);
        } else {
          ev.complete("success");
          if (paymentIntent.status === "succeeded") {
            onPaymentComplete({
              payment_intent_id: paymentIntent.id,
              client_secret: clientSecret,
            });
          }
        }
      } catch (err) {
        console.error("🍎 Apple Pay: EXCEPTION:", err);
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
  ]);

  if (!paymentRequest) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
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
    </div>
  );
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
  paymentService,
  bookingData,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canSubmit = isFree
      ? !loading && isFormValid
      : stripe && elements && !loading && isFormValid && isReady;

    onPaymentAction?.({
      handleSubmit: () => handleSubmit(stripe, elements),
      loading,
      canSubmit,
      finalTotal,
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
  ]);

  return (
    <>
      {!isFree && clientSecret && (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: 24,
          }}
        >
          <SectionTitle>Payment Method</SectionTitle>
          <ExpressCheckoutButton
            finalTotal={finalTotal}
            clientSecret={clientSecret}
            onPaymentComplete={onPaymentComplete}
            paymentService={paymentService}
            bookingData={bookingData}
          />
          <PaymentElement
            options={{
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
            }}
            onReady={() => setIsReady(true)}
          />
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
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // --- TIMER STATE ---
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [isExpired, setIsExpired] = useState(false);
  const expirationTimestampRef = useRef(null);
  const debounceTimerRef = useRef(null);

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
      const { email, phone, guest_full_name, participant_details } = values;

      const contactFields = isUserLoggedIn
        ? [email, phone]
        : [email, phone, guest_full_name];

      const allTextFieldsFilled = contactFields.every(
        (val) => val && String(val).trim().length > 0,
      );

      const currentParticipants = participant_details || [];
      const participantsFilled =
        currentParticipants.length === bookingData.participants &&
        currentParticipants.every((p) => p?.name?.trim());

      return !!(allTextFieldsFilled && participantsFilled);
    },
    [isUserLoggedIn, bookingData.participants],
  );

  useEffect(() => {
    if (form) {
      let formData = {};

      if (isUserLoggedIn) {
        formData.email = bookingData.userEmail || "";
        formData.phone = bookingData.userPhone || "";
        formData.guest_full_name = "";

        const currentParticipants = bookingData.participant_details || [];
        const newParticipants = Array.from(
          { length: bookingData.participants },
          (_, i) => {
            let name = currentParticipants[i]?.name || "";
            if (i === 0 && bookingData.userName && !name) {
              name = bookingData.userName;
            }
            return { name };
          },
        );
        formData.participant_details = newParticipants;
      } else {
        const currentValues = form.getFieldsValue(true);
        if (currentValues.email === undefined) formData.email = "";
        if (currentValues.phone === undefined) formData.phone = "";
        if (currentValues.guest_full_name === undefined)
          formData.guest_full_name = "";

        const currentPart = currentValues.participant_details || [];
        if (currentPart.length !== bookingData.participants) {
          const newGuestParticipants = Array.from(
            { length: bookingData.participants },
            (_, i) => {
              return { name: currentPart[i]?.name || "" };
            },
          );
          formData.participant_details = newGuestParticipants;
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

  const { discountAmount, finalTotal } = useMemo(() => {
    const calculatedDiscount = appliedDiscount
      ? parseFloat(appliedDiscount.calculated_discount_amount) || 0
      : 0;
    const subtotalAfter = Math.max(0, subtotal - calculatedDiscount);
    const tax = subtotalAfter * HST_RATE;
    return {
      discountAmount: calculatedDiscount,
      taxAmount: tax,
      finalTotal: subtotalAfter + tax,
    };
  }, [subtotal, appliedDiscount]);

  const isFree = finalTotal === 0;
  const taxAmount = (subtotal - discountAmount) * HST_RATE;

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (!clientSecret || isFree || isExpired) return;

    if (!expirationTimestampRef.current) {
      expirationTimestampRef.current = Date.now() + 15 * 60 * 1000;
    }

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
  }, [clientSecret, isFree, isExpired]);

  const handleSessionExpired = () => {
    window.location.reload();
  };

  const fetchPaymentIntent = useCallback(
    async (currentDiscountId = null) => {
      if (isFree) return;
      if (
        !bookingData.selectedSlots ||
        bookingData.selectedSlots.length === 0
      ) {
        return;
      }

      try {
        const values = form.getFieldsValue();
        let participantDetailsPayload =
          values.participant_details?.map((d) => ({
            name: d?.name || "Guest",
          })) || [];

        if (participantDetailsPayload.length < participantsCount) {
          participantDetailsPayload = Array.from(
            { length: participantsCount },
            (_, i) => ({
              name: participantDetailsPayload[i]?.name || "Guest",
            }),
          );
        }

        const payload = {
          selectedSlots: bookingData.selectedSlots,
          participants: participantsCount,
          notes: values.notes || "",
          participant_details: participantDetailsPayload,
          applied_discount_id: currentDiscountId,
          guest_email: values.email || "pending@example.com",
          guest_full_name: values.guest_full_name || "Pending Guest",
          guest_phone: values.phone || "555-555-5555",
        };

        const response = await paymentService.createPaymentIntent(payload);

        if (response.clientSecret) {
          setClientSecret(response.clientSecret);

          if (onUpdateBookingData) {
            const paymentIntentId = response.clientSecret.split("_secret_")[0];
            onUpdateBookingData({
              paymentIntentId: paymentIntentId,
              clientSecret: response.clientSecret,
            });
          }
        }
      } catch (err) {
        console.error("Error creating draft intent:", err);
      }
    },
    [
      bookingData,
      participantsCount,
      isFree,
      form,
      paymentService,
      onUpdateBookingData,
    ],
  );

  useEffect(() => {
    fetchPaymentIntent(appliedDiscount?.id);
  }, [appliedDiscount?.id]);

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

        if (isFree) {
          if (bookingData.paymentIntentId) {
            try {
              await paymentService.cancelPaymentIntent(
                bookingData.paymentIntentId,
              );
              console.log(
                "Cancelled previous pending booking to free capacity for 100% discount.",
              );
            } catch (cancelErr) {
              console.warn(
                "Failed to cancel previous pending booking, proceeding anyway:",
                cancelErr,
              );
            }
          }

          const payload = {
            selectedSlots: bookingData.selectedSlots,
            participants: participantsCount,
            notes: values.notes || "",
            participant_details: values.participant_details,
            applied_discount_id: appliedDiscount?.id || null,
            guest_email: values.email,
            guest_full_name: values.guest_full_name,
            guest_phone: values.phone,
          };
          const res = await paymentService.createPaymentIntent(payload);
          if (res.booking_id) {
            onPaymentComplete(res);
            return;
          }
        }

        if (!stripe || !elements) return;

        const { error: submitError } = await elements.submit();
        if (submitError) {
          setError(submitError.message);
          setLoading(false);
          return;
        }

        if (clientSecret) {
          try {
            const paymentIntentId = clientSecret.split("_secret_")[0];

            if (paymentService.updatePaymentIntent) {
              await paymentService.updatePaymentIntent({
                payment_intent_id: paymentIntentId,
                guest_email: values.email,
                guest_full_name: isUserLoggedIn
                  ? bookingData.userName
                  : values.guest_full_name,
                guest_phone: values.phone,
                participant_details: values.participant_details,
                notes: values.notes,
                applied_discount_id: appliedDiscount?.id || null,
              });
            } else {
              console.warn(
                "paymentService.updatePaymentIntent is not defined. Email may use placeholder.",
              );
            }
          } catch (updateErr) {
            console.error(
              "Failed to update booking details before payment:",
              updateErr,
            );
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
                  name: isUserLoggedIn
                    ? bookingData.userName
                    : values.guest_full_name,
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
          onPaymentComplete({
            payment_intent_id: paymentIntent.id,
            client_secret: clientSecret,
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

        {option?.title && <OptionLabel>{option.title}</OptionLabel>}

        <TicketHeaderTitle>{classData?.title}</TicketHeaderTitle>
        <TicketSubHeader>
          <MapPin />
          <span>{classData?.business_name || "Host Location"}</span>
        </TicketSubHeader>

        {renderBookingDetailsTicket()}
      </TicketTop>

      <TicketDivider />

      <TicketBottom>
        {/* Coupon Section inside Ticket */}
        {!appliedDiscount ? (
          <CouponTicketInput>
            <Input
              size="middle"
              placeholder="Promo Code"
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

        {appliedDiscount && (
          <TicketRow style={{ color: "#059669" }}>
            <span>Discount ({appliedDiscount.code})</span>
            <span>
              <NumberFlow
                value={-discountAmount}
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
            <p>This booking is free. No card needed.</p>
          </div>
        </InfoPanel>
      ) : (
        <InfoPanel
          $bgColor="#f0fdf4"
          $borderColor="#bbf7d0"
          $iconColor="#22c55e"
          $titleColor="#15803d"
          $textColor="#166534"
        >
          <Lock />
          <div>
            <h5>Secure Payment</h5>
            <p>Your payment is encrypted and processed securely.</p>
          </div>
        </InfoPanel>
      )}
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

  const stripeAppearance = useMemo(() => {
    return {
      theme: "stripe",
      variables: {
        colorPrimary: appTheme.token.colorPrimary,
        colorBackground: "#ffffff",
        colorText: appTheme.token.colorText,
        colorDanger: appTheme.token.colorError,
        // Set global font variable
        fontFamily: '"Proxima Soft", sans-serif',
        spacingUnit: "4px",
        borderRadius: `${appTheme.token.borderRadius}px`,
        fontSizeBase: `${appTheme.token.fontSize}px`,
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
          // Force font usage on input text
          fontFamily: '"Proxima Soft", sans-serif',
          fontWeight: "500",
        },
        // Added Hover Effect
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
          // Heavier weight for labels
          fontWeight: "600",
          color: "#000",
          marginBottom: "8px",
          fontFamily: '"Proxima Soft", sans-serif',
        },
        // Target placeholders specifically
        ".Input::placeholder": {
          color: "#c5c5c5",
          fontWeight: "600",
          fontFamily: '"Proxima Soft", sans-serif',
        },
        ".Tab": {
          borderColor: appTheme.token.colorBorder,
          borderRadius: `${appTheme.token.borderRadius}px`,
          fontFamily: '"Proxima Soft", sans-serif',
          fontWeight: "600",
        },
        ".Tab:selected": {
          borderColor: appTheme.token.colorPrimary,
        },
      },
    };
  }, []);

  const renderTimerContent = () => {
    if (isFree || isExpired) return null;
    return (
      <TimerBadge $urgent={timeRemaining < 120}>
        <span>{timeRemaining < 120 ? "Expires in:" : "Spot reserved:"}</span>
        <Countdown seconds={timeRemaining} />
      </TimerBadge>
    );
  };

  // Helper for mobile summary simple text (kept simple for the dropdown)
  const renderMobileSimpleSummary = () => (
    <>
      <div style={{ marginBottom: 12 }}>
        <strong>{classData?.title}</strong>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          {selectedSlot && formatNaiveDate(selectedSlot.date, "MMM d, yyyy")} •{" "}
          {participantsCount} Guest{participantsCount > 1 && "s"}
        </div>
      </div>
      <TicketRow>
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
      </TicketRow>
    </>
  );

  return (
    <ConfigProvider theme={appTheme}>
      {!isFree && !clientSecret ? (
        <LottieContainer>
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            style={{ width: 180, height: 180 }}
          />
          <LottieText>We're getting things ready</LottieText>
          <LottieSubText>Let's get that booked for you!</LottieSubText>
        </LottieContainer>
      ) : (
        <Elements
          stripe={stripePromise}
          key={clientSecret || "free-mode"}
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
                    <ParticipantNameInputs
                      count={bookingData.participants}
                      bookerNameFromBookingData={bookingData.userName}
                      form={form}
                      isUserLoggedIn={isUserLoggedIn}
                    />

                    <div
                      style={{
                        paddingTop: "16px",
                        borderTop: "1px solid #e5e7eb",
                        marginTop: 16,
                      }}
                    >
                      <SectionTitle>Contact Info</SectionTitle>
                      {!isUserLoggedIn && (
                        <Form.Item
                          name="guest_full_name"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <Input placeholder="Full Name" />
                        </Form.Item>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <Form.Item
                          name="email"
                          rules={[{ required: true, type: "email" }]}
                        >
                          <Input
                            placeholder="Email"
                            disabled={isUserLoggedIn}
                          />
                        </Form.Item>
                        <Form.Item name="phone" rules={[{ required: true }]}>
                          <Input
                            placeholder="Phone"
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
                      paymentService={paymentService}
                      bookingData={bookingData}
                    />

                    <div>
                      <Form.Item name="notes" label="Additional Notes">
                        <Input.TextArea
                          placeholder="Any special requests for the host?"
                          rows={2}
                        />
                      </Form.Item>
                    </div>
                  </Form>
                </fieldset>
              </FormCard>
            </PaymentSection>

            <SummarySection>{renderTicketSummary()}</SummarySection>
          </StepContainer>
        </Elements>
      )}
    </ConfigProvider>
  );
};

export default ReviewAndPaymentStep;
