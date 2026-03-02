"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ConfigProvider } from "antd";
import { theme } from "@/components/theme";
import { useTexture } from "@react-three/drei";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";

import posthog from "posthog-js";
import FooterClient from "@/components/homepage/FooterClient";

// Import sub-components
import GiftcardConfigStep from "./GiftcardConfigStep";
import GiftcardPaymentStep from "./GiftcardPaymentStep";
import GiftcardSuccessStep from "./GiftcardSuccessStep";

import {
  CORPORATE_COLOR,
  PageWrapper,
  MainContainer,
  SectionHeader,
} from "./GiftcardStyles";

// Stripe gradient background (same pattern as BusinessWelcomePage)
const CheckoutGradientStrip = styled.div`
  position: absolute;
  left: -50%;
  width: 150%;
  height: 150px;
  top: 18%;
  transform: translateY(-45%) rotate(-20deg);
  z-index: 0;
  overflow: hidden;
  border-radius: 4px;
  pointer-events: none;
  @media (max-width: 640px) {
    width: 200%;
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
  --gradient-color-4: #ffffff;
`;

// --- ASSETS ---
import Card1 from "@/assets/card1.png";
import Card2 from "@/assets/Card 7.png";
import Card3 from "@/assets/Card 8.png";
import Card4 from "@/assets/Card 6.png";
import Card5 from "@/assets/Card 9.png";
import Card6 from "@/assets/Card 10.png";
import Card7 from "@/assets/Card 11.png";
import ExploreHeader from "@/components/explore/ExploreHeader";

const CARD_IMAGES = [
  Card1.src,
  Card2.src,
  Card3.src,
  Card4.src,
  Card5.src,
  Card6.src,
  Card7.src,
];

// Preload textures
CARD_IMAGES.forEach((url) => useTexture.preload(url));

// FAQ Data
const FAQS = [
  {
    q: "Are gift cards physical or digital?",
    a: "Our gift cards are 100% digital. They land in emails instantly (or when you schedule them).",
  },
  {
    q: "What exactly can they book?",
    a: "Anything! From a pottery session in a local studio to a guided food tour downtown.",
  },
  {
    q: "Do gift cards expire?",
    a: "Nope. No expiration dates, no hidden fees.",
  },
  {
    q: "Can I send one to a friend abroad?",
    a: "Absolutely, provided the currency matches.",
  },
];

const FAQItem = styled.div`
  border-bottom: 1px solid #eee;
`;

const FAQTrigger = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
  color: #000;
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #000;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const BottomContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto 80px auto;
  padding: 0 24px;
  border-top: 1px solid #eee;
  padding-top: 60px;
`;

export default function GiftcardCheckoutPage() {
  const searchParams = useSearchParams();
  const initialIndex = parseInt(searchParams.get("designIndex") || "0");

  const [step, setStep] = useState("config");
  const [selectedDesignIndex, setSelectedDesignIndex] = useState(
    initialIndex >= 0 && initialIndex < CARD_IMAGES.length ? initialIndex : 0,
  );
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("email");
  const [isScheduled, setIsScheduled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    senderName: "",
    senderEmail: "",
    message: "",
    date: null,
  });

  const finalAmount = amount || (customAmount ? parseFloat(customAmount) : 0);

  const handleProceedToCheckout = () => {
    // Basic validations that happen before step switch,
    // Note: ConfigStep now handles granular form validation.
    posthog.capture("giftcard_checkout_started", {
      amount: finalAmount,
      delivery_method: deliveryMethod,
      is_scheduled: isScheduled,
    });

    setStep("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentSuccess = () => {
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  useEffect(() => {
    import("stripe-gradient")
      .then(({ Gradient }) => {
        const g = new Gradient();
        g.initGradient("#giftcard-checkout-gradient-canvas");
      })
      .catch(() => {});
  }, []);

  return (
    <ConfigProvider theme={theme}>
      <ExploreHeader showOptionsWrapper={false} />

      <PageWrapper>
        <CheckoutGradientStrip>
          <CheckoutGradientStripInner>
            <CheckoutGradientCanvas
              id="giftcard-checkout-gradient-canvas"
              data-transition-in
            />
          </CheckoutGradientStripInner>
        </CheckoutGradientStrip>

        <MainContainer>
          {step === "config" && (
            <GiftcardConfigStep
              cardImages={CARD_IMAGES}
              selectedDesignIndex={selectedDesignIndex}
              setSelectedDesignIndex={setSelectedDesignIndex}
              amount={amount}
              setAmount={setAmount}
              customAmount={customAmount}
              setCustomAmount={setCustomAmount}
              formData={formData}
              setFormData={setFormData}
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              isScheduled={isScheduled}
              setIsScheduled={setIsScheduled}
              onNext={handleProceedToCheckout}
            />
          )}

          {step === "checkout" && (
            <GiftcardPaymentStep
              amount={finalAmount}
              designUrl={CARD_IMAGES[selectedDesignIndex]}
              formData={formData}
              setFormData={setFormData}
              deliveryMethod={deliveryMethod}
              onBack={() => setStep("config")}
              onSuccess={handlePaymentSuccess}
            />
          )}

          {step === "success" && (
            <GiftcardSuccessStep
              designUrl={CARD_IMAGES[selectedDesignIndex]}
              amount={finalAmount}
              recipientEmail={
                deliveryMethod === "self"
                  ? formData.senderEmail
                  : formData.recipientEmail
              }
            />
          )}
        </MainContainer>

        {/* SHARED FAQ SECTION */}
        {step !== "success" && (
          <BottomContainer>
            <SectionHeader>Frequently asked questions</SectionHeader>
            {FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              const faqId = `faq-content-${index}`;
              const triggerId = `faq-trigger-${index}`;

              return (
                <FAQItem key={index}>
                  <FAQTrigger
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={faqId}
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </FAQTrigger>
                  <AnimatePresence>
                    {isOpen && (
                      <FAQContent
                        id={faqId}
                        role="region"
                        aria-labelledby={triggerId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div style={{ paddingBottom: 24 }}>{item.a}</div>
                      </FAQContent>
                    )}
                  </AnimatePresence>
                </FAQItem>
              );
            })}
          </BottomContainer>
        )}
      </PageWrapper>
      <FooterClient />
    </ConfigProvider>
  );
}
