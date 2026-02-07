import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { message, Input, Alert, Button, Divider } from "antd";
import NumberFlow from "@number-flow/react";
import posthog from "posthog-js";
import dayjs from "dayjs"; // Make sure to install this
import { ActionButton, CheckoutLink } from "./GiftcardStyles";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { theme as appTheme } from "@/components/theme";

// --- STRIPE SETUP ---
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
);

// --- CHECKOUT SPECIFIC STYLES ---

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;

  @media (min-width: 1200px) {
    grid-template-columns: 1.2fr 1fr;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const CheckoutPageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  margin-top: -10px;
`;

const CheckoutSection = styled.div`
  margin-bottom: 32px;
  &:last-child {
    border-bottom: none;
  }
`;

const CheckoutSectionHeader = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SummaryBox = styled.div`
  border-radius: 12px;
  padding: 24px;
  position: sticky;
  top: 120px;
  background: #fafafa;
  border: 1px solid #eee;
`;

const SummaryThumb = styled.div`
  width: 120px;
  height: 75px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin-right: 16px;
  flex-shrink: 0;
  img {
    object-fit: cover;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  margin-bottom: 24px;
  align-items: center;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.95rem;
  color: #333;
`;

const EditableRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 40px;
  margin-bottom: 12px;
`;

// --- EXPRESS CHECKOUT COMPONENT ---
const ExpressCheckoutButton = ({ amount, onPaymentComplete }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe || !amount) return;

    const pr = stripe.paymentRequest({
      country: "CA",
      currency: "cad",
      total: {
        label: "Gift Card Purchase",
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on("paymentmethod", async (ev) => {
      try {
        ev.complete("success");
        onPaymentComplete({ payment_method: "wallet" });
      } catch (err) {
        ev.complete("fail");
        message.error("Payment failed. Please try again.");
      }
    });
  }, [stripe, amount, onPaymentComplete]);

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

// --- INNER FORM COMPONENT ---
const StripePaymentForm = ({
  amount,
  formData,
  setFormData,
  clientSecret,
  designUrl,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [cardholderName, setCardholderName] = useState("");

  const handleSaveEdit = () => {
    setEditingField(null);
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    if (!cardholderName.trim()) {
      setError("Please enter the cardholder name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      // Mock confirmation for demo / or use real clientSecret
      let result;
      if (clientSecret) {
        result = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/booking/status`,
            payment_method_data: {
              billing_details: {
                name: cardholderName,
                email: formData.recipientEmail,
                address: { country: "CA" },
              },
            },
          },
          redirect: "if_required",
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        result = { paymentIntent: { status: "succeeded" } };
      }

      if (result.error) {
        throw new Error(result.error.message);
      } else if (
        result.paymentIntent &&
        result.paymentIntent.status === "succeeded"
      ) {
        posthog.capture("giftcard_purchase_completed", {
          amount,
          recipient_email: formData.recipientEmail,
        });
        message.success("Gift card ordered successfully!");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || "Payment processing failed.");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = formData.date
    ? dayjs(formData.date).format("MMM D, YYYY")
    : "Instantly";

  return (
    <CheckoutGrid>
      {/* LEFT: PAYMENT INPUTS */}
      <div>
        <CheckoutSection>
          <CheckoutSectionHeader>Pay with</CheckoutSectionHeader>
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              closable
              onClose={() => setError(null)}
            />
          )}

          <ExpressCheckoutButton
            amount={amount}
            onPaymentComplete={() => {
              message.success("Paid via Wallet!");
              if (onSuccess) onSuccess();
            }}
          />

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 8,
                fontSize: "13px",
              }}
            >
              Cardholder Name
            </label>
            <Input
              placeholder="e.g. John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              size="middle"
            />
          </div>

          <PaymentElement
            options={{
              layout: "tabs",
              fields: { billingDetails: { address: { country: "never" } } },
              defaultValues: { billingDetails: { address: { country: "CA" } } },
            }}
          />
        </CheckoutSection>

        <Divider style={{ margin: "40px 0" }} />

        <CheckoutSection>
          <CheckoutSectionHeader>
            Required for your gift card
          </CheckoutSectionHeader>

          {/* Email */}
          {editingField === "email" ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                Recipient Email
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  value={formData.recipientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientEmail: e.target.value })
                  }
                  placeholder="e.g. john@example.com"
                />
                <Button onClick={handleSaveEdit} type="primary">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <EditableRow>
              <div>
                <div style={{ fontWeight: 500 }}>Recipient Email</div>
                <div style={{ color: "#666" }}>
                  {formData.recipientEmail || "Not provided"}
                </div>
              </div>
              <button
                onClick={() => setEditingField("email")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <CheckoutLink as="span">Edit</CheckoutLink>
              </button>
            </EditableRow>
          )}

          {/* Message */}
          {editingField === "message" ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Message</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Input.TextArea
                  rows={3}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
                <div style={{ alignSelf: "flex-end" }}>
                  <Button onClick={handleSaveEdit} type="primary">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EditableRow>
              <div style={{ maxWidth: "80%" }}>
                <div style={{ fontWeight: 500 }}>Message</div>
                <div
                  style={{
                    color: "#666",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {formData.message || "No message included"}
                </div>
              </div>
              <button
                onClick={() => setEditingField("message")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <CheckoutLink as="span">Edit</CheckoutLink>
              </button>
            </EditableRow>
          )}
        </CheckoutSection>

        <div style={{ marginTop: 32 }}>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#666",
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            By selecting the button below, I agree to the{" "}
            <CheckoutLink>Terms</CheckoutLink> and{" "}
            <CheckoutLink>Privacy Policy</CheckoutLink>.
          </p>
          <ActionButton
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !stripe}
          >
            {loading ? "Processing..." : "Confirm and Pay"}
          </ActionButton>
        </div>
      </div>

      {/* RIGHT: SUMMARY */}
      <div>
        <SummaryBox>
          <SummaryItem>
            <SummaryThumb>
              <Image
                src={designUrl}
                alt="Card Preview"
                fill
                style={{ objectFit: "cover" }}
              />
            </SummaryThumb>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ color: "#666", fontSize: "0.9rem" }}>
                Gift Card for
              </div>
              <div style={{ fontWeight: 500, fontSize: "1.05rem" }}>
                {formData.recipientName || "A Friend"}
              </div>
            </div>
          </SummaryItem>

          <div style={{ borderTop: "1px solid #eee", margin: "16px 0" }} />

          <h3
            style={{ fontSize: "1.25rem", fontWeight: 500, marginBottom: 16 }}
          >
            Your total
          </h3>

          <SummaryRow>
            <span>Gift Card Value</span>
            <span>
              <NumberFlow
                value={amount}
                format={{ style: "currency", currency: "CAD" }}
              />
            </span>
          </SummaryRow>

          <SummaryRow>
            <span>Delivery Date</span>
            <span>{formattedDate}</span>
          </SummaryRow>

          <SummaryRow style={{ color: "#666" }}>
            <span>Tax (0%)</span>
            <span>$0.00</span>
          </SummaryRow>

          <div style={{ borderTop: "1px solid #eee", margin: "16px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1.1rem",
            }}
          >
            <span style={{ fontWeight: 700 }}>Total (CAD)</span>
            <span style={{ fontWeight: 700 }}>
              <NumberFlow
                value={amount}
                format={{ style: "currency", currency: "CAD" }}
              />
            </span>
          </div>
        </SummaryBox>
      </div>
    </CheckoutGrid>
  );
};

export default function GiftcardPaymentStep({
  amount,
  designUrl,
  formData,
  setFormData,
  onBack,
  onSuccess,
}) {
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Fetch Intent logic here
  }, [amount]);

  const stripeAppearance = useMemo(() => {
    return {
      theme: "stripe",
      variables: {
        colorPrimary: appTheme.token.colorPrimary,
        borderRadius: `${appTheme.token.borderRadius}px`,
      },
      rules: {
        ".Input": {
          padding: "12px",
          borderColor: appTheme.token.colorBorder,
          boxShadow: "none",
        },
        ".Input:focus": {
          borderColor: appTheme.token.colorPrimary,
        },
      },
    };
  }, []);

  const options = {
    mode: "payment",
    currency: "cad",
    amount: Math.round(amount * 100),
    appearance: stripeAppearance,
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: 0,
          }}
        >
          <ChevronLeft size={16} />
          <CheckoutLink as="span">Back to options</CheckoutLink>
        </button>
      </div>
      <CheckoutPageTitle>Confirm and Pay</CheckoutPageTitle>
      <Divider style={{ margin: "40px 0" }} />
      <Elements stripe={stripePromise} options={options}>
        <StripePaymentForm
          amount={amount}
          formData={formData}
          setFormData={setFormData}
          designUrl={designUrl}
          clientSecret={clientSecret}
          onSuccess={onSuccess}
        />
      </Elements>
    </div>
  );
}
