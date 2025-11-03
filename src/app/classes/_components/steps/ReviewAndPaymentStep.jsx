import React, { useState, useEffect, useCallback } from "react";
import { ConfigProvider, Form, Input, Alert, Button, Divider } from "antd";
import message from "@/lib/message";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Users,
  Info,
  Lock,
  Clock,
  Tag,
  Shield,
  UserCheck,
  Percent,
} from "lucide-react";
import { getCancellationPolicyText, getDurationText } from "./utils";
import { businessDiscountService } from "@/services/apiService";
import { theme as appTheme } from "@/components/theme";

// --- Styles ---
const HST_RATE = 0.13;

const StepContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 0 4px;

  @media (min-width: 969px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 32px;
    align-items: flex-start;
  }
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: 968px) {
    padding-bottom: 70px; // Space for mobile footer
  }
`;

const SummarySection = styled.div`
  @media (max-width: 968px) {
    display: none;
  }

  @media (min-width: 969px) {
    position: sticky;
    top: 1px;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);

  @media (max-width: 968px) {
    padding: 20px;
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

const SummaryHeader = styled.div`
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
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

const CardElementContainer = styled.div`
  padding: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  margin-top: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: #ff385c;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.2);
  }
`;

const ParticipantSection = styled.div`
  padding-top: 8px;
`;

const ParticipantEntry = styled.div`
  .ant-form-item {
    margin-bottom: 12px;
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
    flex-direction: column;
    gap: 12px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    padding: 16px 20px 20px;
    border-top: 1px solid #e0e0e0;
    backdrop-filter: blur(10px);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    z-index: 100;
  }
`;

const MobilePriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: #111827;
  font-weight: 600;
`;

const mobileFooterVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", damping: 25, stiffness: 200 },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ... (ParticipantNameInputs component remains unchanged)
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
    <ParticipantSection>
      <SectionTitle>Participant Information</SectionTitle>
      {Array.from({ length: count }).map((_, index) => (
        <ParticipantEntry key={index}>
          <Form.Item
            label={
              <span style={{ fontWeight: 500 }}>
                {`Participant ${index + 1} Full Name`}
                {index === 0 &&
                  isUserLoggedIn &&
                  !!bookerNameFromBookingData &&
                  form.getFieldValue(["participant_details", index, "name"]) ===
                    bookerNameFromBookingData && (
                    <UserCheck
                      size={14}
                      style={{
                        marginLeft: "8px",
                        color: appTheme.token.colorPrimary,
                      }}
                    />
                  )}
              </span>
            }
            name={["participant_details", index, "name"]}
            rules={[
              { required: true, message: `P.${index + 1} name is required` },
            ]}
          >
            <Input
              placeholder="Full Name"
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
            />
          </Form.Item>
        </ParticipantEntry>
      ))}
    </ParticipantSection>
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
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [isFormValid, setIsFormValid] = useState(false);
  const [isCardComplete, setIsCardComplete] = useState(false);

  useEffect(() => {
    if (form) {
      if (isUserLoggedIn) {
        form.setFieldsValue({
          email: bookingData.userEmail || "",
          phone: bookingData.userPhone || "",
          // Clear guest name when logging in, if it exists
          guest_full_name: "",
        });
      } else {
        // Clear all contact/billing fields when user is logged out
        form.resetFields([
          "email",
          "phone",
          "guest_full_name",
          "fullName",
          "address",
          "city",
          "state",
          "zipCode",
        ]);
      }
    }
    // This effect should only run when the user's login status or their data changes.
  }, [isUserLoggedIn, bookingData.userEmail, bookingData.userPhone, form]);

  // Effect 2: Handles initialization of non-contact fields from bookingData.
  useEffect(() => {
    if (form) {
      form.setFieldsValue({
        participant_details: bookingData.participant_details || [],
        notes: bookingData.notes || "",
      });
    }
    // This effect runs only when these specific props change, without affecting contact info.
  }, [bookingData.participant_details, bookingData.notes, form]);

  const selectedSlot = bookingData.selectedSlots?.[0];
  const option = bookingData.selectedOption;
  const participantsCount = bookingData.participants || 1;
  const basePrice = parseFloat(selectedSlot?.price || option?.price || 0);
  const subtotal = basePrice * participantsCount;

  const { discountAmount, finalTotal } = useCallback(() => {
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
  }, [subtotal, appliedDiscount])();

  const taxAmount = Math.max(0, subtotal - discountAmount) * HST_RATE;

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
        message.error(result.error?.detail || "This coupon is not valid.");
        setAppliedDiscount(null);
      }
    } catch (err) {
      message.error("An error occurred while applying the coupon.");
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
    onUpdateBookingData(allValues);

    const {
      email,
      phone,
      fullName,
      guest_full_name,
      address,
      city,
      state,
      zipCode,
      participant_details,
    } = allValues;
    const contactFields = isUserLoggedIn
      ? [email, phone]
      : [email, phone, guest_full_name];
    const billingFields = [fullName, address, city, state, zipCode];
    const allTextFieldsFilled = [...contactFields, ...billingFields].every(
      (val) => val && String(val).trim()
    );
    const participantsFilled =
      participant_details?.length === bookingData.participants &&
      participant_details.every((p) => p?.name?.trim());
    setIsFormValid(allTextFieldsFilled && participantsFilled);
  };

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements || !selectedSlot) {
      setError("Payment system not ready or slot not selected.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const values = await form.validateFields();
      const paymentIntentPayload = {
        selectedSlots: bookingData.selectedSlots,
        participants: participantsCount,
        notes: values.notes || "",
        participant_details: values.participant_details.map((d) => ({
          name: d.name.trim(),
        })),
        applied_discount_id: appliedDiscount?.id || null,
      };

      if (!isUserLoggedIn) {
        paymentIntentPayload.guest_email = values.email;
        paymentIntentPayload.guest_full_name = values.guest_full_name;
        paymentIntentPayload.guest_phone = values.phone;
      }

      const intentResponse = await paymentService.createPaymentIntent(
        paymentIntentPayload
      );
      if (intentResponse.booking?.id) {
        onPaymentComplete(intentResponse.booking);
        return;
      }

      const clientSecret = intentResponse.clientSecret;
      const cardElement = elements.getElement(CardElement);
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: values.fullName,
            email: values.email,
            phone: values.phone,
            address: {
              line1: values.address,
              city: values.city,
              state: values.state,
              postal_code: values.zipCode,
              country: "CA",
            },
          },
        },
      });

      if (paymentResult.error) throw new Error(paymentResult.error.message);
      if (paymentResult.paymentIntent.status === "succeeded") {
        onPaymentComplete({
          payment_intent_id: paymentResult.paymentIntent.id,
          client_secret: clientSecret,
        });
      } else {
        throw new Error(
          `Payment status: ${paymentResult.paymentIntent.status}`
        );
      }
    } catch (err) {
      setError(err.message || "Payment failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }, [stripe, elements, form, bookingData, onPaymentComplete, isUserLoggedIn]);

  useEffect(() => {
    onPaymentAction?.({
      handleSubmit,
      loading,
      canSubmit: stripe && elements && !loading,
      finalTotal,
    });
  }, [onPaymentAction, handleSubmit, loading, stripe, elements, finalTotal]);

  const renderBookingDetails = () => {
    if (!selectedSlot) return null;
    const {
      date,
      time,
      duration,
      isCourse,
      end_date,
      day,
      price,
      minParticipants,
    } = selectedSlot;

    return (
      <>
        <ClassDetail>
          <CalendarIcon />
          <span>
            {isCourse
              ? `Course: ${formatDate(date)} - ${formatDate(end_date)}`
              : `${formatDate(date)} at ${formatTime(time)}`}
          </span>
        </ClassDetail>
        <ClassDetail>
          <Clock />
          <span>
            {isCourse
              ? `Classes every ${day}`
              : `Duration: ${getDurationText(duration)}`}
          </span>
        </ClassDetail>
        <ClassDetail>
          <Tag />
          <span>
            ${parseFloat(price || 0).toFixed(2)}{" "}
            {isCourse ? "for the course" : "per person"}
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

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr.replace(/-/g, "/")).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";
  const formatTime = (timeStr) =>
    timeStr
      ? new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

  const cardElementOptions = {
    style: {
      base: {
        iconColor: "#6b7280",
        color: "#111827",
        fontWeight: "500",
        fontFamily: "Proxima Soft, sans-serif",
        fontSize: "16px",
        "::placeholder": { color: "#9ca3af" },
      },
      invalid: { iconColor: "#ef4444", color: "#ef4444" },
    },
    hidePostalCode: true,
  };

  const PayButton = (props) => (
    <Button
      type="primary"
      size="large"
      block
      htmlType="button"
      onClick={handleSubmit}
      loading={loading}
      disabled={
        !stripe || !elements || loading || !isFormValid || !isCardComplete
      }
      {...props}
    >
      {loading ? "Processing..." : `Confirm & Pay $${finalTotal.toFixed(2)}`}
    </Button>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <StepContainer>
        <PaymentSection>
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}
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
                style={{ paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}
              >
                <SectionTitle>Your Contact Information</SectionTitle>
                {!isUserLoggedIn && (
                  <Form.Item
                    name="guest_full_name"
                    label="Full Name"
                    rules={[
                      { required: true, message: "Full name is required" },
                    ]}
                  >
                    <Input placeholder="e.g., Jane Doe" />
                  </Form.Item>
                )}
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    {
                      required: true,
                      type: "email",
                      message: "A valid email is required",
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g., you@example.com"
                    readOnly={isUserLoggedIn && !!bookingData.userEmail}
                    style={
                      isUserLoggedIn && !!bookingData.userEmail
                        ? {
                            backgroundColor: "#f0f0f0",
                            cursor: "not-allowed",
                            color: "#555",
                          }
                        : {}
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[
                    { required: true, message: "Phone number is required" },
                  ]}
                >
                  <Input
                    placeholder="e.g., (416) 555-1234"
                    readOnly={isUserLoggedIn && !!bookingData.userPhone}
                    style={
                      isUserLoggedIn && !!bookingData.userPhone
                        ? {
                            backgroundColor: "#f0f0f0",
                            cursor: "not-allowed",
                            color: "#555",
                          }
                        : {}
                    }
                  />
                </Form.Item>
              </div>

              <div
                style={{ paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}
              >
                <SectionTitle>Payment & Billing</SectionTitle>
                <Form.Item
                  name="fullName"
                  label="Full Name on Card"
                  rules={[
                    {
                      required: true,
                      message: "Cardholder's name is required",
                    },
                  ]}
                >
                  <Input placeholder="e.g., John Doe" />
                </Form.Item>
                <Form.Item
                  name="address"
                  label="Billing Address"
                  rules={[
                    { required: true, message: "Billing address is required" },
                  ]}
                >
                  <Input placeholder="e.g., 123 Main Street" />
                </Form.Item>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., Toronto" />
                  </Form.Item>
                  <Form.Item
                    name="state"
                    label="Province"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., Ontario" />
                  </Form.Item>
                  <Form.Item
                    name="zipCode"
                    label="Postal Code"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., M5V 2T6" />
                  </Form.Item>
                </div>
                <Form.Item label="Credit or Debit Card">
                  <CardElementContainer>
                    <CardElement
                      options={cardElementOptions}
                      onChange={(e) => setIsCardComplete(e.complete)}
                    />
                  </CardElementContainer>
                </Form.Item>
              </div>

              <div
                style={{ paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}
              >
                <SectionTitle>Add-ons</SectionTitle>
                {!appliedDiscount ? (
                  <Form.Item label="Have a Coupon?">
                    <CouponInputWrapper>
                      <Input
                        placeholder="COUPONCODE"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        disabled={couponLoading}
                      />
                      <Button
                        type="primary"
                        onClick={handleApplyCoupon}
                        loading={couponLoading}
                        ghost
                        style={{ height: "48px" }}
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
                      <span>{appliedDiscount.code.toUpperCase()} Applied</span>
                    </div>
                    <Button
                      type="link"
                      danger
                      onClick={handleRemoveCoupon}
                      size="small"
                    >
                      Remove
                    </Button>
                  </AppliedCouponDisplay>
                )}
                <Form.Item name="notes" label="Additional Notes (Optional)">
                  <Input.TextArea
                    rows={3}
                    placeholder="Any special requests for the instructor?"
                  />
                </Form.Item>
              </div>
            </Form>
          </FormCard>
        </PaymentSection>

        <SummarySection>
          <SummaryCard>
            <SummaryHeader>
              <SummaryClassImage
                src={
                  classData?.images?.[0]?.thumbnail_url || "/placeholder.jpg"
                }
                alt={classData?.title}
              />
              <SummaryClassDetails>
                <SummaryTitle>{classData?.title || "Class Title"}</SummaryTitle>
                {renderBookingDetails()}
              </SummaryClassDetails>
            </SummaryHeader>
            <SectionTitle>Order Summary</SectionTitle>
            <PriceBreakdown>
              <PriceRow>
                <span>
                  Price &times; {participantsCount}{" "}
                  {participantsCount > 1 ? "people" : "person"}
                </span>
                <span>${subtotal.toFixed(2)}</span>
              </PriceRow>
              {appliedDiscount && (
                <PriceRow $success>
                  <span>Discount ({appliedDiscount.code.toUpperCase()})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </PriceRow>
              )}
              <PriceRow>
                <span>HST (13%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </PriceRow>
              <PriceRow className="total">
                <span>Grand Total (CAD)</span>
                <span>${finalTotal.toFixed(2)}</span>
              </PriceRow>
            </PriceBreakdown>

            <InfoPanel
              $bgColor="#eef2ff"
              $borderColor="#c7d2fe"
              $iconColor="#4f46e5"
              $titleColor="#3730a3"
              $textColor="#4338ca"
            >
              <Shield />
              <div>
                <h5>Cancellation Policy</h5>
                <p>
                  {getCancellationPolicyText(
                    option?.cancellationPolicy,
                    option?.cancellationRefundPercentage,
                    option?.cancellationCustomHours,
                    selectedSlot?.date && selectedSlot?.time
                      ? `${selectedSlot.date}T${selectedSlot.time}`
                      : null,
                    userTimeZone,
                    businessTimeZone
                  )}
                </p>
              </div>
            </InfoPanel>

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
                <p>
                  Your payment is encrypted and processed securely by Stripe.
                </p>
              </div>
            </InfoPanel>
          </SummaryCard>
        </SummarySection>
      </StepContainer>

      <AnimatePresence>
        {isFormValid && isCardComplete && (
          <MobilePaymentFooter
            $visible={true}
            variants={mobileFooterVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <MobilePriceRow>
              <span>Grand Total (CAD)</span>
              <span>${finalTotal.toFixed(2)}</span>
            </MobilePriceRow>
            <PayButton style={{ width: "100%" }} />
          </MobilePaymentFooter>
        )}
      </AnimatePresence>
    </ConfigProvider>
  );
};

export default ReviewAndPaymentStep;
