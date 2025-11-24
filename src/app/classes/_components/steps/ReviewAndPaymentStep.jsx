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
import {
  Calendar as CalendarIcon,
  Shield,
  Clock,
  Tag,
  ChevronDown,
  ShoppingCart,
  CheckCircle,
  Lock,
  Percent,
  UserCheck,
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

// --- STYLED COMPONENTS (Keep as is) ---
const StepContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 0 4px;
  padding-bottom: 100px;

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
    font-size: 14px;
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

const SummaryClassImage = styled.img`
  width: 90px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
`;

const SummaryClassDetails = styled.div`
  flex: 1;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #111827;
  font-weight: 600;
  line-height: 1.3;
`;

const ClassDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-size: 13px;
  &:not(:last-child) {
    margin-bottom: 6px;
  }
  svg {
    color: #9ca3af;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const PriceBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${(props) => (props.$success ? "#10b981" : "#4b5563")};
  &.total {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
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
      font-size: 14px;
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
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  margin-bottom: 12px;
  border-radius: 8px;
  color: #005f9e;
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

// --- HELPERS (Keep as is) ---
const ParticipantNameInputs = ({
  count,
  form,
  isUserLoggedIn,
  bookerNameFromBookingData,
}) => {
  useEffect(() => {
    if (form && count > 0) {
      const currentParticipantFormValues =
        form.getFieldValue("participant_details") || [];
      const newParticipantDetails = Array.from({ length: count }, (_, i) => {
        let name = currentParticipantFormValues[i]?.name || "";
        if (i === 0 && isUserLoggedIn && bookerNameFromBookingData && !name) {
          name = bookerNameFromBookingData;
        }
        return { name };
      });
      form.setFieldsValue({ participant_details: newParticipantDetails });
    } else if (form && count === 0) {
      form.setFieldsValue({ participant_details: [] });
    }
  }, [count, bookerNameFromBookingData, form, isUserLoggedIn]);

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
      // We request these so Apple Pay asks the user for them
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
      // 1. Extract contact info DIRECTLY from the Apple Pay event
      // Apple Pay returns: ev.payerName, ev.payerEmail, ev.payerPhone
      const payerName = ev.payerName; // "John Doe"
      const payerEmail = ev.payerEmail;
      const payerPhone = ev.payerPhone;

      try {
        // 2. Update Backend with this real info
        if (clientSecret) {
          const paymentIntentId = clientSecret.split('_secret_')[0];
          
          if (paymentService && paymentService.updatePaymentIntent) {
            await paymentService.updatePaymentIntent({
              payment_intent_id: paymentIntentId,
              // Use the data from Apple Pay, NOT the empty form
              guest_email: payerEmail, 
              guest_full_name: payerName,
              guest_phone: payerPhone,
              // We still need these from props because Apple Pay doesn't know about them
              participant_details: bookingData.participant_details || [{ name: payerName }], 
              notes: bookingData.notes || "",
              applied_discount_id: bookingData.applied_discount_id || null, 
            });
            console.log("Backend updated with Apple Pay contact info");
          }
        }

        // 3. Confirm Payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: ev.paymentMethod.id,
            // Map Apple Pay details to Stripe billing details
            payment_method_data: {
              billing_details: {
                name: payerName,
                email: payerEmail,
                phone: payerPhone,
                address: ev.paymentMethod.billing_details?.address 
              }
            }
          },
          { handleActions: false }
        );

        if (error) {
          console.error("Express Checkout Error:", error);
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
        console.error("Exception during Apple Pay:", err);
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

  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (form) {
      if (isUserLoggedIn) {
        form.setFieldsValue({
          email: bookingData.userEmail || "",
          phone: bookingData.userPhone || "",
          guest_full_name: "",
        });
      } else {
        const currentValues = form.getFieldsValue();
        if (!currentValues.email) {
          form.resetFields(["email", "phone", "guest_full_name"]);
        }
      }
    }
  }, [isUserLoggedIn, bookingData, form]);

  useEffect(() => {
    if (form) {
      const currentNotes = form.getFieldValue("notes");
      if (currentNotes !== bookingData.notes) {
        form.setFieldsValue({
          participant_details: bookingData.participant_details || [],
          notes: bookingData.notes || "",
        });
      }
    }
  }, [bookingData.participant_details, bookingData.notes, form]);

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

  // --- INITIAL INTENT CREATION (Mounts with placeholders) ---
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
        // Fallbacks for initial render so Stripe Elements can load
        const payload = {
          selectedSlots: bookingData.selectedSlots,
          participants: participantsCount,
          notes: values.notes || "",
          participant_details: values.participant_details?.map((d) => ({
            name: d?.name || "Guest",
          })) || [],
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

    const { email, phone, guest_full_name, participant_details } = allValues;
    const contactFields = isUserLoggedIn
      ? [email, phone]
      : [email, phone, guest_full_name];

    const allTextFieldsFilled = contactFields.every(
      (val) => val && String(val).trim()
    );

    const participantsFilled =
      participant_details?.length === bookingData.participants &&
      participant_details.every((p) => p?.name?.trim());

    setIsFormValid(allTextFieldsFilled && participantsFilled);
  };

  const handleSubmit = useCallback(
    async (stripe, elements) => {
      if (!selectedSlot) {
        setError("Slot not selected.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const values = await form.validateFields();

        // 1. FREE BOOKING FLOW (No Changes needed here)
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

        // 2. PAID BOOKING FLOW
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
            }
          } catch (updateErr) {
            console.error("Failed to update booking details:", updateErr);
            setError("We could not save your contact details. Please refresh and try again.");
            setLoading(false);
            return; 
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
    ]
  );

  const renderBookingDetails = () => {
    // ... (Keep existing implementation)
    if (!selectedSlot) return null;
    const {
      date,
      time,
      duration,
      isCourse,
      end_date,
      days,
      price,
      minParticipants,
    } = selectedSlot;

    const numericPrice = parseFloat(price || 0);

    if (isCourse) {
      return (
        <>
          <ClassDetail>
            <CalendarIcon />
            <span>
              <strong>Course:</strong> {formatNaiveDate(date, "MMM d")} -{" "}
              {formatNaiveDate(end_date, "MMM d, yyyy")}
            </span>
          </ClassDetail>
          <ClassDetail>
            <Clock />
            <span>
              Every {days.join(", ")} at{" "}
              {formatTimeRangeForDisplay(
                date,
                time,
                duration,
                businessTimeZone,
                userTimeZone
              )}
            </span>
          </ClassDetail>
          <ClassDetail>
            <Tag />
            <span>
              {numericPrice === 0
                ? "Free for the course"
                : `$${numericPrice.toFixed(2)} for the course`}
            </span>
          </ClassDetail>
        </>
      );
    }

    return (
      <>
        <ClassDetail>
          <CalendarIcon />
          <span>
            {formatNaiveDate(date, "MMMM d, yyyy")} at{" "}
            {formatTimeRangeForDisplay(
              date,
              time,
              duration,
              businessTimeZone,
              userTimeZone
            )}
          </span>
        </ClassDetail>
        <ClassDetail>
          <Clock />
          <span>Duration: {getDurationText(duration)}</span>
        </ClassDetail>
        <ClassDetail>
          <Tag />
          <span>
            {numericPrice === 0
              ? "Free per person"
              : `$${numericPrice.toFixed(2)} per person`}
          </span>
        </ClassDetail>
        {minParticipants > 1 && (
          <ClassDetail>
            <UserCheck />
            <span style={{ fontWeight: 500, color: "#111827" }}>
              Requires minimum {minParticipants} participants
            </span>
          </ClassDetail>
        )}
      </>
    );
  };

  const renderSummaryContent = () => (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <SummaryClassImage
          src={classData?.images?.[0]?.thumbnail_url || "/placeholder.jpg"}
          alt={classData?.title}
        />
        <SummaryClassDetails>
          <SummaryTitle>{classData?.title}</SummaryTitle>
          {renderBookingDetails()}
        </SummaryClassDetails>
      </div>

      <PriceBreakdown>
        <PriceRow>
          <span>
            Price &times; {participantsCount}{" "}
            {participantsCount > 1 ? "people" : "person"}
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
          boxShadow: `0 0 0 2px rgba(255, 56, 92, 0.2)`,
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
                        <Input placeholder="Email" readOnly={isUserLoggedIn} />
                      </Form.Item>
                      <Form.Item name="phone" rules={[{ required: true }]}>
                        <Input placeholder="Phone" readOnly={isUserLoggedIn} />
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
              </FormCard>
            </PaymentSection>

            <SummarySection>
              <SummaryCard>
                <SectionTitle>Order Summary</SectionTitle>
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
              {isFormValid && (
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