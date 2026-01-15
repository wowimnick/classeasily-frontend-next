import React from "react";
import { Check, ChevronLeft, Calendar } from "lucide-react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";

const theme = {
  primary: "#ff385c",
  textPrimary: "#222222",
  textSecondary: "#717171",
  borderLight: "#f0f0f0",
  white: "#ffffff",
  success: "#00a96f",
};

// --- Header Styles ---
const HeaderContainer = styled.div`
  padding: 24px 24px;
  border-bottom: 1px solid ${theme.borderLight};
  background: ${theme.white};
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 640px) {
    padding: 20px 16px;
  }
`;

// --- Progress Bar Styles ---
const ProgressContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px;
`;

const ProgressTrack = styled.div`
  position: absolute;
  top: 15px; /* Aligned with center of circle */
  left: 30px;
  right: 30px;
  height: 2px;
  background-color: ${theme.borderLight};
  transform: translateY(-50%);
  z-index: 0;
`;

const ProgressFill = styled(motion.div)`
  position: absolute;
  top: 15px; /* Aligned with center of circle */
  left: 30px;
  right: 30px;
  height: 2px;
  background-color: ${theme.success};
  transform: translateY(-50%);
  transform-origin: left;
  z-index: 0;
`;

const Step = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 90px;
`;

const StepCircle = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.$active
      ? theme.primary
      : props.$completed
      ? theme.success
      : "#f3f4f6"};
  color: ${(props) =>
    props.$active || props.$completed ? "white" : "#9ca3af"};
  border: 2px solid white;
  box-shadow: 0 0 0 2px
    ${(props) =>
      props.$active
        ? theme.primary
        : props.$completed
        ? theme.success
        : "transparent"};
`;

const StepLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) =>
    props.$active || props.$completed
      ? theme.textPrimary
      : theme.textSecondary};
  white-space: nowrap;
  transition: color 0.3s ease;
`;

// --- Footer Styles ---
const FooterContainer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${theme.borderLight};
  background: ${theme.white};

  /* Mobile Safe Area & Grid */
  @media (max-width: 640px) {
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    display: grid;
    grid-template-columns: ${(props) => (props.$hasBack ? "auto 1fr" : "1fr")};
    gap: 12px;
    align-items: center;
  }

  /* Desktop Flex */
  @media (min-width: 641px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const DesktopLeftSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 640px) {
    display: contents;
  }
`;

const DesktopRightSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;

  @media (max-width: 640px) {
    width: 100%;
    button {
      width: 100%;
    }
  }
`;

const SelectedSlotInfo = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.textSecondary};
  background-color: #f9fafb;
  padding: 8px 12px;
  border-radius: 8px;
  flex-shrink: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  svg {
    flex-shrink: 0;
    color: ${theme.primary};
  }

  strong {
    color: ${theme.textPrimary};
    font-weight: 500;
  }

  @media (max-width: 968px) {
    display: none;
  }
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 640px) {
    padding: 14px 16px;
    font-size: 15px;
    border-radius: 12px;
  }

  ${(props) =>
    props.$primary
      ? `
    background: ${theme.primary};
    color: white;
    &:hover:not(:disabled) {
      background: #e31c5f;
      box-shadow: 0 2px 8px rgba(227, 28, 95, 0.2);
    }
    &:disabled {
      background: #fecdd3;
      cursor: not-allowed;
    }
  `
      : `
    background: ${theme.white};
    color: ${theme.textPrimary};
    border-color: #d1d5db;
    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }
    &:disabled {
      background: #f9fafb;
      border-color: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  `}

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
`;

const MobileBackButton = styled(Button)`
  @media (max-width: 640px) {
    min-width: auto;
    width: 48px;
    height: 48px;
    padding: 0;

    span {
      display: none;
    }
    svg {
      margin: 0;
    }
  }
`;

export const ModalHeader = ({ currentStep }) => {
  const steps = ["📅 Select Date", "💳 Payment", "✅ Confirmation"];

  return (
    <HeaderContainer>
      <ProgressContainer>
        <ProgressTrack />
        <ProgressFill
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: currentStep === 1 ? 0 : currentStep === 2 ? 0.5 : 1,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          return (
            <Step key={index}>
              <StepCircle $active={isActive} $completed={isCompleted}>
                {isCompleted ? <Check size={16} /> : stepNumber}
              </StepCircle>
              <StepLabel $active={isActive} $completed={isCompleted}>
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </ProgressContainer>
    </HeaderContainer>
  );
};

export const ModalFooter = ({
  currentStep,
  onBack,
  onNext,
  onClose,
  loading = false,
  hideNextButton = false,
  hideBackButton = false,
  isNextDisabled = false,
  bookingData = null,
  paymentAction = null,
}) => {
  // If we are on the first step (Calendar), return null to hide the footer
  if (currentStep === 1) {
    return null;
  }

  const selectedSlot = bookingData?.selectedSlots?.[0];

  const getButtonText = () => {
    switch (currentStep) {
      case 2:
        return "Confirm & Pay";
      case 3:
        return "Done";
      default:
        return "Next";
    }
  };

  const handlePaymentClick = () => {
    if (paymentAction?.handleSubmit) {
      paymentAction.handleSubmit();
    }
  };

  const isPaymentDisabled = !paymentAction?.canSubmit || paymentAction?.loading;
  const showBackButton = currentStep > 1 && !hideBackButton;

  return (
    <FooterContainer $hasBack={showBackButton}>
      <DesktopLeftSlot>
        {showBackButton && (
          <MobileBackButton
            onClick={onBack}
            disabled={loading || paymentAction?.loading}
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </MobileBackButton>
        )}
      </DesktopLeftSlot>

      <DesktopRightSlot>
        {currentStep === 2 && (
          <Button
            $primary
            onClick={handlePaymentClick}
            disabled={isPaymentDisabled}
          >
            {paymentAction?.loading
              ? "Processing..."
              : `Pay $${paymentAction?.finalTotal?.toFixed(2) || "0.00"}`}
          </Button>
        )}

        {currentStep === 3 && (
          <Button $primary onClick={onClose}>
            {getButtonText()}
          </Button>
        )}
      </DesktopRightSlot>
    </FooterContainer>
  );
};
