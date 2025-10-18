// src/components/layout/CookieConsentBanner.jsx
"use client"; // MIGRATION: Added client directive for hooks and browser-side rendering.

import React, { useState } from "react";
import styled from "styled-components";
import { Button, Typography, Modal } from "antd";
import Link from "next/link"; // MIGRATION: Swapped react-router-dom for next/link
import {
  MoreOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

// --- STYLED COMPONENTS (No changes needed) ---
const PopupWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 380px;
  min-width: 320px;
  z-index: 2000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 480px) {
    left: 10px;
    right: 10px;
    bottom: 10px;
    max-width: none;
    min-width: auto;
    padding: 1rem;
    border-radius: 8px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    margin-bottom: 0.5rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #95a5a6;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;

  &:hover {
    color: #7f8c8d;
    background: #f8f9fa;
  }

  @media (max-width: 480px) {
    padding: 2px;
  }
`;

const TextContent = styled.div`
  margin-bottom: 1.25rem;
  line-height: 1.4;

  @media (max-width: 480px) {
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
    line-height: 1.3;
  }
`;

// MIGRATION: This component now correctly uses the Next.js Link
const StyledLink = styled(Link)`
  color: #3498db;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const OptionsMenu = styled.div`
  position: absolute;
  right: 0;
  bottom: 3rem;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 2001;
  animation: fadeIn 0.2s ease-out;
  min-width: 140px;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 480px) {
    bottom: 2.5rem;
    right: -10px;
  }
`;

const OptionsButton = styled.button`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: #e9ecef;
    border-color: #dee2e6;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.5rem;
  }
`;

const AcceptButton = styled(Button)`
  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 4px 12px;
    height: auto;
  }
`;

// --- COMPONENT (Logic is the same, only the Link `to` prop changes) ---

const CookieConsentBanner = ({ onAccept, onDecline, onClose }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const handleOptionsClick = () => {
    setShowOptions(!showOptions);
  };

  const handleDeclineClick = () => {
    setShowOptions(false);
    setShowDeclineModal(true);
  };

  const handleFinalDecline = () => {
    setShowDeclineModal(false);
    onDecline();
  };

  const handleCancelDecline = () => {
    setShowDeclineModal(false);
  };

  return (
    <PopupWrapper>
      <Header>
        <Title>🍪 Cookie Settings</Title>
        <CloseButton onClick={onClose} aria-label="Close cookie banner">
          <CloseOutlined />
        </CloseButton>
      </Header>

      <TextContent>
        <Typography.Text style={{ color: "#495057", fontSize: "0.9rem" }}>
          We use cookies to enhance your experience and analyze our traffic. 📊
          View our {/* MIGRATION: Changed `to` prop to `href` */}
          <StyledLink href="/cookie-policy">Cookie Policy</StyledLink> for
          details.
        </Typography.Text>
      </TextContent>

      {showOptions && (
        <OptionsMenu>
          <Button size="small" onClick={handleDeclineClick} danger block>
            Manage Settings
          </Button>
        </OptionsMenu>
      )}

      <ButtonGroup>
        <OptionsButton onClick={handleOptionsClick} aria-label="More options">
          <MoreOutlined />
        </OptionsButton>
        <AcceptButton type="primary" onClick={onAccept} size="default">
          Accept All
        </AcceptButton>
      </ButtonGroup>

      <Modal
        title={
          <span style={{ color: "#d32f2f" }}>
            <ExclamationCircleOutlined style={{ marginRight: "8px" }} />
            Are you sure?
          </span>
        }
        open={showDeclineModal}
        onCancel={handleCancelDecline}
        footer={[
          <Button key="cancel" type="primary" onClick={handleCancelDecline}>
            Keep Cookies (Recommended)
          </Button>,
          <Button
            key="decline"
            onClick={handleFinalDecline}
            style={{ color: "#666" }}
          >
            Yes, Decline All
          </Button>,
        ]}
        width={480}
        centered
      >
        <div style={{ padding: "16px 0" }}>
          <Typography.Text>
            <strong style={{ color: "#d32f2f" }}>⛔ Warning:</strong> Declining
            cookies may significantly impact your browsing experience. You may
            encounter:
          </Typography.Text>
          <ul style={{ marginTop: "12px", color: "#666" }}>
            <li>Reduced website functionality</li>
            <li>Less personalized content</li>
            <li>Repeated login prompts</li>
            <li>Slower page loading times</li>
          </ul>
          <Typography.Text
            style={{ color: "#666", fontSize: "0.9rem", fontStyle: "italic" }}
          >
            Most users prefer to accept cookies for the best experience.
          </Typography.Text>
        </div>
      </Modal>
    </PopupWrapper>
  );
};

export default CookieConsentBanner;
