"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfigProvider, message } from "antd";
import { theme } from "@/components/theme";
import { useTexture } from "@react-three/drei";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";

import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// Import sub-components
import GiftcardConfigStep from "./GiftcardConfigStep";
import GiftcardPaymentStep from "./GiftcardPaymentStep";
import {
  CORPORATE_COLOR,
  PageWrapper,
  MainContainer,
  SectionHeader,
} from "./GiftcardStyles";

// --- ASSETS ---
import Card1 from "@/assets/card1.png";
import Card2 from "@/assets/Card 7.png";
import Card3 from "@/assets/Card 8.png";
import Card4 from "@/assets/Card 6.png";
import Card5 from "@/assets/Card 9.png";
import Card6 from "@/assets/Card 10.png";
import Card7 from "@/assets/Card 11.png";

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

  const [step, setStep] = useState("config"); // 'config' | 'checkout'
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
    message: "",
    date: null,
  });

  const finalAmount = amount || (customAmount ? parseFloat(customAmount) : 0);

  const handleProceedToCheckout = () => {
    if (!finalAmount || finalAmount <= 0)
      return message.error("Please enter a valid amount");
    if (deliveryMethod === "email" && !formData.recipientEmail)
      return message.error("Please enter recipient email");
    setStep("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  return (
    <ConfigProvider theme={theme}>
      <Header
        hamburgerColor="#111"
        dropdownButtonColor="#111"
        dropdownButtonHoverColor={CORPORATE_COLOR}
        dropdownButtonOutlineColor="#111"
        logoTitleColor={CORPORATE_COLOR}
      />

      <PageWrapper>
        <MainContainer>
          {step === "config" ? (
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
          ) : (
            <GiftcardPaymentStep
              amount={finalAmount}
              designUrl={CARD_IMAGES[selectedDesignIndex]}
              formData={formData}
              onBack={() => setStep("config")}
            />
          )}
        </MainContainer>

        {/* SHARED FAQ SECTION */}
        <BottomContainer>
          <SectionHeader>Frequently asked questions</SectionHeader>
          {FAQS.map((item, index) => (
            <FAQItem key={index}>
              <FAQTrigger onClick={() => toggleFaq(index)}>
                <span>{item.q}</span>
                {openFaq === index ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </FAQTrigger>
              <AnimatePresence>
                {openFaq === index && (
                  <FAQContent
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div style={{ paddingBottom: 24 }}>{item.a}</div>
                  </FAQContent>
                )}
              </AnimatePresence>
            </FAQItem>
          ))}
        </BottomContainer>
      </PageWrapper>
      <FooterClient />
    </ConfigProvider>
  );
}
