import React, { useState } from "react";
import styled from "styled-components";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Form, Input, message } from "antd";
import NumberFlow from "@number-flow/react";
import { ActionButton, CheckoutLink } from "./GiftcardStyles";

// --- CHECKOUT SPECIFIC STYLES ---

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;

  /* Center logic for larger screens to keep it looking neat like Airbnb */
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
  padding-bottom: 32px;
  border-bottom: 1px solid #ddd;
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

const InputGroup = styled.div`
  .ant-input {
    border-radius: 0;
    height: 50px;
    font-size: 1rem;
    border-color: #b0b0b0;

    &:hover,
    &:focus {
      z-index: 1;
      border-color: #000;
    }
  }

  > div:first-child .ant-input {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border-bottom: none;
  }

  > div:last-child {
    display: flex;
    .ant-input:first-child {
      border-bottom-left-radius: 8px;
      border-right: none;
    }
    .ant-input:last-child {
      border-bottom-right-radius: 8px;
    }
  }
`;

const SummaryBox = styled.div`
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
  position: sticky;
  top: 120px;
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

export default function GiftcardPaymentStep({
  amount,
  designUrl,
  formData,
  onBack,
}) {
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success("Order placed successfully! (Mock)");
    }, 2000);
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
          <CheckoutLink>Back to options</CheckoutLink>
        </button>
      </div>

      <CheckoutPageTitle>Confirm and Pay</CheckoutPageTitle>

      <CheckoutGrid>
        {/* LEFT: PAYMENT DETAILS */}
        <div>
          <CheckoutSection>
            <CheckoutSectionHeader>
              <span>Pay with</span>
              <div style={{ display: "flex", gap: 5 }}>
                {/* Placeholders for Card Icons */}
                <div
                  style={{
                    width: 30,
                    height: 20,
                    background: "#eee",
                    borderRadius: 2,
                  }}
                ></div>
                <div
                  style={{
                    width: 30,
                    height: 20,
                    background: "#eee",
                    borderRadius: 2,
                  }}
                ></div>
              </div>
            </CheckoutSectionHeader>

            <Form layout="vertical">
              <InputGroup>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Input placeholder="Card number" />
                </Form.Item>
                <div>
                  <Form.Item style={{ marginBottom: 0, width: "50%" }}>
                    <Input placeholder="Expiration" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, width: "50%" }}>
                    <Input placeholder="CVV" />
                  </Form.Item>
                </div>
              </InputGroup>

              <Form.Item style={{ marginTop: 16 }}>
                <Input
                  style={{
                    height: 50,
                    borderRadius: 8,
                    borderColor: "#b0b0b0",
                  }}
                  placeholder="ZIP code"
                />
              </Form.Item>
              <Form.Item style={{ marginTop: 16 }}>
                <Input
                  style={{
                    height: 50,
                    borderRadius: 8,
                    borderColor: "#b0b0b0",
                  }}
                  placeholder="Country/Region"
                  defaultValue="Canada"
                />
              </Form.Item>
            </Form>
          </CheckoutSection>

          <CheckoutSection>
            <CheckoutSectionHeader>
              Required for your gift card
            </CheckoutSectionHeader>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Recipient Email</div>
                <div style={{ color: "#666" }}>
                  {formData.recipientEmail || "Not provided"}
                </div>
              </div>
              <CheckoutLink>Edit</CheckoutLink>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Message</div>
                <div
                  style={{
                    color: "#666",
                    maxWidth: 300,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {formData.message || "No message included"}
                </div>
              </div>
              <CheckoutLink>Edit</CheckoutLink>
            </div>
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
              <CheckoutLink>Host Terms</CheckoutLink>,{" "}
              <CheckoutLink>Payment Terms of Service</CheckoutLink>, and{" "}
              <CheckoutLink>Privacy Policy</CheckoutLink>.
            </p>
            <ActionButton
              whileTap={{ scale: 0.98 }}
              onClick={handlePay}
              disabled={loading}
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
                <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  {formData.recipientName || "A Friend"}
                </div>
              </div>
            </SummaryItem>

            <div style={{ borderTop: "1px solid #eee", margin: "16px 0" }} />

            <h3
              style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 16 }}
            >
              Your total
            </h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.1rem",
              }}
            >
              <span>Total (CAD)</span>
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
    </div>
  );
}
