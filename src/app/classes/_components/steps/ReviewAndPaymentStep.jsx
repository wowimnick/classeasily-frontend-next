import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import {
  Calendar as CalendarIcon,
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
} from "lucide-react";
import {
  getCancellationPolicyText,
  getDurationText,
} from "./utils";
import { businessDiscountService } from "@/services/apiService";
import { theme as appTheme } from "@/components/theme";
import { formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";

const HST_RATE = 0.13;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// --- STYLED COMPONENTS ---

const StepContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 0 4px;
  padding-top: 4px;
  padding-bottom: 100px;
  position: relative; /* Needed for Overlay positioning */

  @media (min-width: 969px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 32px;
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
    top: 1px;
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

const Card = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);
  @media (max-width: 968px) {
    padding: 16px;
  }
`;

const SummaryCard = styled(Card)``;
const FormCard = styled(Card)``;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

// --- UPDATED SUMMARY STYLES ---

const SummaryItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
`;

const SummaryItemTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
`;

const SummaryMetaBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
`;

const SummaryMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;

  svg {
    width: 14px;
    height: 14px;
    color: #9ca3af;
  }
`;

const ReceiptDivider = styled.div`
  height: 1px;
  background-image: linear-gradient(to right, #e5e7eb 50%, rgba(255,255,255,0) 0%);
  background-position: bottom;
  background-size: 8px 1px;
  background-repeat: repeat-x;
  margin: 20px 0;
`;

const PriceBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: ${(props) => (props.$success ? "#059669" : "#4b5563")};
  
  &.total {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  span:first-child {
    color: ${(props) => (props.$success ? "#059669" : "#6b7280")};
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

const CouponInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  .ant-input {
    text-transform: uppercase;
    &::placeholder {
      text-transform: none;
    }
  }
`;

const AppliedCouponDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  margin-bottom: 12px;
  border-radius: 8px;
  color: #047857;
  font-weight: 500;
`;

const MobilePaymentFooter = styled(motion.div)`
  display: none;
  @media (max-width: 968px) {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 12px 20px;
    border-top: 1px solid #e0e0e0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    z-index: 100;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
`;

const MobileTotalDisplay = styled.div`
  display: flex;
  flex-direction: column;
  span.label {
    font-size: 12px;
    color: #6b7280;
  }
  span.amount {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }
`;

// --- NEW STYLES FOR TIMER & EXPIRATION ---

const TimerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  transition: all 0.3s ease;
  
  /* Badge Appearance */
  color: ${(props) => (props.$urgent ? "#dc2626" : "#4b5563")};
  white-space: nowrap;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }
`;

// Wrapper to center the badge on mobile
const MobileTimerContainer = styled.div`
  display: flex;
  justify-content: center;
  
  @media (min-width: 969px) {
    display: none;
  }
`;

// Wrapper to show/hide on desktop
const DesktopTimerContainer = styled.div`
  display: none;
  @media (min-width: 969px) {
    display: block;
  }
`;

const ExpiredOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  text-align: center;
  padding: 32px;
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

// --- HELPERS (Keep as is) ---
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
      <SectionTitle>Participants</SectionTitle>
      {Array.from({ length: count }).map((_, index) => (
        <Form.Item
          key={index}
          name={["participant_details", index, "name"]}
          rules={[
            { required: true, message: `P.${index + 1} name is required` },
          ]}
          style={{ marginBottom: 12 }}
        >
          <Input
            placeholder={`Participant ${index + 1} Full Name`}
            // Read-only logic is handled by parent pre-fill + disabled prop logic below
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

const ExpressCheckoutButton = ({ finalTotal, clientSecret, onPaymentComplete, paymentService, bookingData }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe || !finalTotal) return;

    const pr = stripe.paymentRequest({
      country: 'CA',
      currency: 'cad',
      total: {
        label: 'Booking Total',
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

    pr.on('paymentmethod', async (ev) => {
      
      const payerName = ev.payerName;
      const payerEmail = ev.payerEmail;
      const payerPhone = ev.payerPhone;

      try {
        if (clientSecret) {
          const paymentIntentId = clientSecret.split('_secret_')[0];
          
          if (paymentService && paymentService.updatePaymentIntent) {
            try {
              // We update the backend so the DB knows who the guest is before the charge
              await paymentService.updatePaymentIntent({
                payment_intent_id: paymentIntentId,
                guest_email: payerEmail, 
                guest_full_name: payerName,
                guest_phone: payerPhone,
                participant_details: bookingData.participant_details || [{ name: payerName }], 
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
            // Apple Pay already created the PaymentMethod object with all billing details.
            // We just pass the ID here.
            payment_method: ev.paymentMethod.id,
            
            // Optional: attach the email for Stripe receipts
            receipt_email: payerEmail || undefined,
          },
          { handleActions: false }
        );

        if (error) {
          ev.complete('fail');
          message.error(error.message);
        } else {
          ev.complete('success');
          
          if (paymentIntent.status === "succeeded") {
             onPaymentComplete({
              payment_intent_id: paymentIntent.id,
              client_secret: clientSecret,
            });
          }
        }
      } catch (err) {
        console.error("🍎 Apple Pay: EXCEPTION:", err);
        ev.complete('fail');
        message.error("Payment failed. Please try again.");
      }
    });

  }, [stripe, finalTotal, clientSecret, onPaymentComplete, paymentService, bookingData]);

  if (!paymentRequest) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
      <div style={{ 
        textAlign: 'center', 
        margin: '16px 0', 
        color: '#6b7280', 
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
        <span>Or pay with card</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
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
  bookingData
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Determine if we can submit. 
    // Important: We rely on isReady (Stripe loaded) AND isFormValid (Inputs filled)
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
            marginTop: 24,
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
                applePay: 'never',
                googlePay: 'never',
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
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes
  const [isExpired, setIsExpired] = useState(false);

  const debounceTimerRef = useRef(null);

  // FIX: Clear timer on unmount to prevent race condition where form updates
  // overwrite the successful booking confirmation state.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // --- VALIDATION HELPER ---
  // Accepts explicit values to allow validation before the form store updates
  const validateValues = useCallback((values) => {
    const { email, phone, guest_full_name, participant_details } = values;
    
    const contactFields = isUserLoggedIn
      ? [email, phone]
      : [email, phone, guest_full_name];

    const allTextFieldsFilled = contactFields.every(
      (val) => val && String(val).trim().length > 0
    );

    const currentParticipants = participant_details || [];
    const participantsFilled =
      currentParticipants.length === bookingData.participants &&
      currentParticipants.every((p) => p?.name?.trim());

    return !!(allTextFieldsFilled && participantsFilled);
  }, [isUserLoggedIn, bookingData.participants]);

  // Find this useEffect (around line 430)
  useEffect(() => {
    if (form) {
      let formData = {};

      if (isUserLoggedIn) {
        formData.email = bookingData.userEmail || "";
        formData.phone = bookingData.userPhone || "";
        formData.guest_full_name = ""; 
        
        const currentParticipants = bookingData.participant_details || [];
        const newParticipants = Array.from({ length: bookingData.participants }, (_, i) => {
          let name = currentParticipants[i]?.name || "";
          if (i === 0 && bookingData.userName && !name) {
            name = bookingData.userName;
          }
          return { name };
        });
        formData.participant_details = newParticipants;
      } else {
        // Guest Mode - preserve if exists
        const currentValues = form.getFieldsValue(true); // true = get all values including hidden/unmounted
        
        // --- START OF FIX ---
        // Previously: checked (!currentValues.email) and wiped all fields.
        // Now: Check individual fields to ensure we don't overwrite user input.
        if (currentValues.email === undefined) formData.email = "";
        if (currentValues.phone === undefined) formData.phone = "";
        if (currentValues.guest_full_name === undefined) formData.guest_full_name = "";
        // --- END OF FIX ---
        
        const currentPart = currentValues.participant_details || [];
        if (currentPart.length !== bookingData.participants) {
             const newGuestParticipants = Array.from({ length: bookingData.participants }, (_, i) => {
                 return { name: currentPart[i]?.name || "" };
             });
             formData.participant_details = newGuestParticipants;
        }
      }

      const currentNotes = form.getFieldValue("notes");
      if (currentNotes !== bookingData.notes) {
        formData.notes = bookingData.notes || "";
      }

      // 1. SET VALUES
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue(formData);
      }

      // 2. VALIDATE IMMEDIATELY using the data we just created.
      // Do not wait for form.getFieldsValue() to update.
      const isValid = validateValues({
          ...form.getFieldsValue(true), // Get current state
          ...formData // Overwrite with what we just set
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
    // Start countdown when clientSecret exists (meaning a hold is in DB)
    // Don't run for free bookings as they confirm instantly on submit
    if (!clientSecret || isFree || isExpired) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [clientSecret, isFree, isExpired]);

  const handleSessionExpired = () => {
    // Reload is the cleanest way to clear frontend state + Stripe Elements
    // and force user to pick a new slot (generating new intent)
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
        
        // --- FIX START ---
        // Ensure participant_details matches the count, even if form isn't fully ready
        let participantDetailsPayload = values.participant_details?.map((d) => ({
            name: d?.name || "Guest",
        })) || [];
        
        if (participantDetailsPayload.length < participantsCount) {
             // Fill missing slots with placeholders to satisfy backend validator
             participantDetailsPayload = Array.from({ length: participantsCount }, (_, i) => ({
                 name: participantDetailsPayload[i]?.name || "Guest"
             }));
        }
        // --- FIX END ---

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
        }
      } catch (err) {
        console.error("Error creating draft intent:", err);
      }
    },
    [bookingData, participantsCount, isFree, form, paymentService]
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

      // FIX: Clear timer immediately to prevent overwriting result
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setLoading(true);
      setError(null);

      try {
        const values = await form.validateFields();

        if (isFree) {
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
            const paymentIntentId = clientSecret.split('_secret_')[0];
            
            if (paymentService.updatePaymentIntent) {
              await paymentService.updatePaymentIntent({
                payment_intent_id: paymentIntentId,
                guest_email: values.email,
                guest_full_name: isUserLoggedIn ? bookingData.userName : values.guest_full_name,
                guest_phone: values.phone,
                participant_details: values.participant_details,
                notes: values.notes,
                applied_discount_id: appliedDiscount?.id || null,
              });
            } else {
              console.warn("paymentService.updatePaymentIntent is not defined. Email may use placeholder.");
            }
          } catch (updateErr) {
            console.error("Failed to update booking details before payment:", updateErr);
          }
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
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
    ]
  );

  const renderBookingDetailsText = () => {
    if (!selectedSlot) return null;
    const {
      date,
      time,
      duration,
      isCourse,
      end_date,
      days,
    } = selectedSlot;

    if (isCourse) {
      return (
        <SummaryMetaBlock>
          <SummaryMetaRow>
            {formatNaiveDate(date, "MMM d")} - {formatNaiveDate(end_date, "MMM d, yyyy")}
          </SummaryMetaRow>
          <SummaryMetaRow>
            Every {days.join(", ")} at {formatTimeRangeForDisplay(date, time, duration, businessTimeZone, userTimeZone)}
          </SummaryMetaRow>
          <SummaryMetaRow>
            {participantsCount} Participant{participantsCount > 1 ? 's' : ''}
          </SummaryMetaRow>
        </SummaryMetaBlock>
      );
    }

    // Single Class
    return (
      <SummaryMetaBlock>
        <SummaryMetaRow>
          {formatNaiveDate(date, "EEEE, MMMM d, yyyy")}
        </SummaryMetaRow>
        <SummaryMetaRow>
          {formatTimeRangeForDisplay(date, time, duration, businessTimeZone, userTimeZone)}
        </SummaryMetaRow>
        <SummaryMetaRow>
          {getDurationText(duration)} • {participantsCount} Participant{participantsCount > 1 ? 's' : ''}
        </SummaryMetaRow>
      </SummaryMetaBlock>
    );
  };

  const renderSummaryContent = () => (
    <>
      <SummaryItemContainer>
        <SummaryItemTitle>{classData?.title}</SummaryItemTitle>
        {renderBookingDetailsText()}
      </SummaryItemContainer>

      <ReceiptDivider />

      <PriceBreakdown>
        <PriceRow>
          <span>
            {participantsCount} {participantsCount > 1 ? "people" : "person"} &times; ${basePrice.toFixed(2)}
          </span>
          <span>{subtotal === 0 ? "Free" : `$${subtotal.toFixed(2)}`}</span>
        </PriceRow>
        
        {appliedDiscount && (
          <PriceRow $success>
            <span>Discount ({appliedDiscount.code})</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </PriceRow>
        )}
        
        <PriceRow>
          <span>HST (13%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </PriceRow>
        
        <PriceRow className="total">
          <span>Total</span>
          <span>{finalTotal === 0 ? "Free" : `$${finalTotal.toFixed(2)}`}</span>
        </PriceRow>
      </PriceBreakdown>
    </>
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
      businessTimeZone
    );
  }, [
    option?.cancellationPolicy,
    option?.cancellationRefundPercentage,
    option?.cancellationCustomHours,
    selectedSlot,
    userTimeZone,
    businessTimeZone,
  ]);

  const stripeAppearance = useMemo(
    () => ({
      theme: "flat",
      variables: {
        borderRadius: "12px",
        colorPrimary: appTheme.token.colorPrimary,
        colorBackground: "#ffffff",
        colorText: "#222222",
        colorDanger: "#ff4d4f",
        spacingUnit: "4px",
        gridRowSpacing: "16px",
        fontFamily: '"ProximaSoft" !important',
      },
      rules: {
        ".Input": {
          border: "1px solid #d9d9d9",
          boxShadow: "none",
          backgroundColor: "#ffffff",
          transition: "all 0.2s",
          fontSize: "14px",
        },
        ".Input:hover": {
          borderColor: appTheme.token.colorPrimary,
        },
        ".Input:focus": {
          borderColor: appTheme.token.colorPrimary,
          boxShadow: `0 0 0 2px rgba(255, 38, 92, 0.2)`,
        },
        ".Input--invalid": {
          borderColor: "#ff4d4f",
          color: "#ff4d4f",
          boxShadow: "none",
        },
        ".Input--invalid:focus": {
          boxShadow: "0 0 0 2px rgba(255, 77, 79, 0.2)",
        },
        ".Label": {
          fontWeight: "500",
          color: "#222222",
          marginBottom: "6px",
          fontSize: "14px",
        },
        ".Tab": {
          border: "1px solid #d9d9d9",
          backgroundColor: "#ffffff",
          padding: "10px",
        },
        ".Tab:hover": {
          borderColor: appTheme.token.colorPrimary,
          color: appTheme.token.colorPrimary,
        },
        ".Tab--selected": {
          borderColor: appTheme.token.colorPrimary,
          color: appTheme.token.colorPrimary,
          backgroundColor: "#fff5f7",
        },
        ".TabIcon": {
          color: "#6b7280",
        },
        ".TabIcon--selected": {
          color: appTheme.token.colorPrimary,
        },
      },
    }),
    []
  );

  // Helper to render the compact timer content
  const renderTimerContent = () => {
    if (isFree || isExpired) return null;
    return (
      <TimerBadge $urgent={timeRemaining < 120}>
        <span>
          {timeRemaining < 120 ? "Expires in:" : "Spot reserved:"}
        </span>
        <Countdown seconds={timeRemaining} />
      </TimerBadge>
    );
  };

  return (
    <ConfigProvider theme={appTheme}>
      {!isFree && !clientSecret ? (
        <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>
          Preparing payment details...
        </div>
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
            {/* OVERLAY WHEN EXPIRED */}
            {isExpired && (
              <ExpiredOverlay>
                <ExpiredContent>
                  <ExpiredIconWrapper>
                    <Clock size={24} />
                  </ExpiredIconWrapper>
                  <h3>Session Expired</h3>
                  <p>
                    To ensure fairness for all students, we only hold spots for
                    15 minutes. Please find a spot again to check availability.
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

              {/* TIMER: Mobile Only (Centered above form) */}
              <MobileTimerContainer>
                {renderTimerContent()}
              </MobileTimerContainer>

              <MobileSummaryContainer>
                <MobileSummaryHeader
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                >
                  <div className="title-group">
                    <ShoppingCart size={20} />
                    <span>Booking Summary</span>
                  </div>
                  <div className="price-group">
                    <span className="total-price">
                      ${finalTotal.toFixed(2)}
                    </span>
                    <ChevronDown
                      className="toggle-icon"
                      size={20}
                      style={{
                        transform: showMobileSummary ? "rotate(180deg)" : "none",
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
                        {renderSummaryContent()}
                      </MobileSummaryInner>
                    </MobileSummaryContent>
                  )}
                </AnimatePresence>
              </MobileSummaryContainer>

              <FormCard>
                {/* Disable form when expired */}
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

                    <div
                      style={{
                        paddingTop: "16px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      {!appliedDiscount ? (
                        <Form.Item label="Have a Coupon?">
                          <CouponInputWrapper>
                            <Input
                              placeholder="PROMO CODE"
                              value={couponCode}
                              onChange={(e) =>
                                setCouponCode(e.target.value.toUpperCase())
                              }
                            />
                            <Button
                              onClick={handleApplyCoupon}
                              loading={couponLoading}
                              size="large"
                            >
                              Apply
                            </Button>
                          </CouponInputWrapper>
                        </Form.Item>
                      ) : (
                        <AppliedCouponDisplay>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Percent size={16} />
                            <span>
                              {appliedDiscount.code.toUpperCase()} Applied
                            </span>
                          </div>
                          <Button
                            type="text"
                            danger
                            onClick={handleRemoveCoupon}
                            size="small"
                          >
                            Remove
                          </Button>
                        </AppliedCouponDisplay>
                      )}
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

                    <div style={{ marginTop: 24 }}>
                      <Form.Item name="notes" label="Additional Notes">
                        <Input.TextArea
                          placeholder="Any special requests?"
                          rows={2}
                        />
                      </Form.Item>
                    </div>
                  </Form>
                </fieldset>
              </FormCard>
            </PaymentSection>

            <SummarySection>
              <SummaryCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 16 }}>
                  <SectionTitle style={{ marginBottom: 0 }}>Order Summary</SectionTitle>
                  
                  {/* TIMER: Desktop Only (Inside Summary Card) */}
                  <DesktopTimerContainer>
                    {renderTimerContent()}
                  </DesktopTimerContainer>
                </div>

                {renderSummaryContent()}

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
              </SummaryCard>
            </SummarySection>

            <AnimatePresence>
              {isFormValid && !isExpired && (
                <MobilePaymentFooter
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                >
                  <MobileTotalDisplay>
                    <span className="label">Total</span>
                    <span className="amount">${finalTotal.toFixed(2)}</span>
                  </MobileTotalDisplay>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={() => onPaymentAction.handleSubmit()}
                    style={{
                      minWidth: 140,
                      background: "#ff385c",
                      border: "none",
                      height: "48px",
                      fontWeight: 600,
                    }}
                  >
                    {isFree ? "Confirm" : "Pay Now"}
                  </Button>
                </MobilePaymentFooter>
              )}
            </AnimatePresence>
          </StepContainer>
        </Elements>
      )}
    </ConfigProvider>
  );
};

export default ReviewAndPaymentStep;