"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Giftcard3DScene from "./Giftcard3DScene";

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
`;

const SuccessHeader = styled(motion.div)`
  margin-bottom: 24px;
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 16px 0;
    color: #000;
    @media (max-width: 600px) {
      font-size: 1.8rem;
    }
  }
  p {
    font-size: 1.1rem;
    color: #666;
    max-width: 500px;
    margin: 0 auto;
    @media (max-width: 600px) {
      font-size: 1rem;
    }
  }
`;

const IconWrapper = styled(motion.div)`
  width: 64px;
  height: 64px;
  background: #d4f7d4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: #008a05;
`;

const SceneWrapper = styled(motion.div)`
  width: 100%;
  height: 500px;
  background: radial-gradient(circle at center, #fafafa 0%, #ffffff 70%);
  border-radius: 24px;
  margin: 32px 0;
  position: relative;
  overflow: hidden;

  /* Mobile responsiveness */
  @media (max-width: 600px) {
    height: 300px; /* More compact on mobile */
    margin: 24px 0;
  }
`;

export default function GiftcardSuccessStep({ designUrl, recipientEmail }) {
  return (
    <SuccessContainer>
      <SuccessHeader
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <IconWrapper
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <Check size={32} strokeWidth={3} />
        </IconWrapper>
        <h1>Payment Successful!</h1>
        <p>
          Your gift card has been secured. We've sent a confirmation email to{" "}
          <strong>{recipientEmail || "your email"}</strong>.
        </p>
      </SuccessHeader>

      <SceneWrapper
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Giftcard3DScene textureUrl={designUrl} />
      </SceneWrapper>
    </SuccessContainer>
  );
}
