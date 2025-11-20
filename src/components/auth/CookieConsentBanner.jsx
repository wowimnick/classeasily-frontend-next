
"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Button, Typography, Modal } from "antd";
import Link from "next/link";
import {
  MoreOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

// --- STYLED COMPONENTS ---

const PopupWrapper = styled.div`
  position: fixed;
  z-index: 990; 
  
  bottom: 20px;
  right: 20px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 16px; /* Slightly more rounded for modern iOS feel */
  padding: 1.5rem;
  max-width: 380px;
  min-width: 320px;
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

  /* --- COMPACT IOS / MOBILE STYLING --- */
  @media (max-width: 480px) {
    left: 12px;
    /* Ensure full width minus margins */
    width: calc(100% - 24px); 
    min-width: 0;
    max-width: none;
    
    /* Respect iOS Home Bar Safe Area */
    bottom: max(12px, env(safe-area-inset-bottom));
    
    padding: 12px 16px;
    border-radius: 14px;
    
    /* Tighter shadow for mobile */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center; /* Center alignment for tighter vertical space */
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    margin-bottom: 0.25rem; /* Much tighter on mobile */
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 480px) {
    font-size: 0.95rem; /* Smaller title */
  }
`;

const CloseButton = styled.button`
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    color: #4b5563;
    background: #e5e7eb;
  }
`;

const TextContent = styled.div`
  margin-bottom: 1.25rem;
  line-height: 1.5;

  @media (max-width: 480px) {
    margin-bottom: 0.75rem;
    font-size: 0.8rem; /* Smaller text */
    line-height: 1.35;
    color: #6b7280;
  }
`;

const StyledLink = styled(Link)`
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  align-items: center;

  @media (max-width: 480px) {
    gap: 0.5rem;
    padding-top: 4px;
  }
`;

const OptionsMenu = styled.div`
  position: absolute;
  right: 0;
  bottom: 3.5rem; /* Moved up slightly */
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  padding: 8px;
  z-index: 991; /* Just above the wrapper */
  animation: fadeIn 0.2s ease-out;
  min-width: 160px;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @media (max-width: 480px) {
    bottom: 100%; /* Sit on top of the banner on mobile */
    right: 0;
    margin-bottom: 8px;
    width: 100%;
  }
`;

const OptionsButton = styled.button`
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px; /* Square button saves width */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }

  @media (max-width: 480px) {
    height: 32px;
    width: 32px;
  }
`;

const AcceptButton = styled(Button)`
  border-radius: 8px;
  font-weight: 600;
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    height: 32px;
    padding: 0 16px;
    flex: 1; /* Make accept button take remaining space on mobile */
  }
`;

// --- COMPONENT ---

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
      {showOptions && (
        <OptionsMenu>
          <Button 
            size="middle" 
            onClick={handleDeclineClick} 
            danger 
            block
            type="text"
            style={{ textAlign: 'left', fontWeight: 500 }}
          >
            Manage / Decline
          </Button>
        </OptionsMenu>
      )}

      <Header>
        <Title>
          <span>🍪</span> Cookie Settings
        </Title>
        <CloseButton onClick={onClose} aria-label="Close cookie banner">
          <CloseOutlined style={{ fontSize: '12px' }} />
        </CloseButton>
      </Header>

      <TextContent>
        <Typography.Text style={{ color: "inherit", fontSize: "inherit" }}>
          We use cookies to analyze traffic. See our{" "}
          <StyledLink href="/cookie-policy">Policy</StyledLink>.
        </Typography.Text>
      </TextContent>

      <ButtonGroup>
        <OptionsButton onClick={handleOptionsClick} aria-label="More options">
          <MoreOutlined />
        </OptionsButton>
        <AcceptButton type="primary" onClick={onAccept} size="middle">
          Accept All
        </AcceptButton>
      </ButtonGroup>

      {/* Modal inherits default Ant Z-Index (1000), so it will appear ABOVE the banner (990) */}
      <Modal
        title={
          <span style={{ color: "#d32f2f" }}>
            <ExclamationCircleOutlined style={{ marginRight: "8px" }} />
            Are you sure?
          </span>
        }
        open={showDeclineModal}
        onCancel={handleCancelDecline}
        zIndex={1001} // Ensure Modal is definitely above banner
        footer={[
          <Button key="cancel" type="primary" onClick={handleCancelDecline}>
            Keep Cookies
          </Button>,
          <Button
            key="decline"
            onClick={handleFinalDecline}
            danger
            type="text"
          >
            Decline All
          </Button>,
        ]}
        width={400}
        centered
        styles={{ mask: { backdropFilter: 'blur(2px)' } }}
      >
        <div style={{ padding: "8px 0" }}>
          <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Declining cookies may result in a degraded experience, including functionality issues and slower loading times.
          </Typography.Text>
        </div>
      </Modal>
    </PopupWrapper>
  );
};

export default CookieConsentBanner;