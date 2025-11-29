import React from "react";
import {
  Clock,
  Users,
  Check,
  Calendar,
} from "lucide-react";
import styled from "styled-components";
import { getScheduleSummary, getDurationText } from "./utils";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

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
  padding: 20px 24px;
  border-bottom: 1px solid ${theme.borderLight};
  background: ${theme.white};

  @media (max-width: 640px) {
    padding: 0px;
  }
`;

const ClassInfo = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;

const ClassImage = styled.img`
  width: 100px;
  height: 66px;
  border-radius: 8px;
  object-fit: cover;

  @media (max-width: 480px) {
    width: 80px;
    height: 54px;
  }
`;

const ClassDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ClassTitle = styled.h2`
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${theme.textPrimary};
  line-height: 1.3;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ClassMeta = styled.div`
  display: flex;
  gap: 16px;
  color: ${theme.textSecondary};
  font-size: 13px;

  div {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

// --- Progress Bar Styles ---
const ProgressContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 8px;
`;

const ProgressTrack = styled.div`
  position: absolute;
  top: 12px;
  left: 40px;
  right: 40px;
  height: 2px;
  background-color: ${theme.borderLight};
  transform: translateY(-50%);
  z-index: 0;
`;

const ProgressFill = styled(motion.div)`
  position: absolute;
  top: 12px;
  left: 40px;
  right: 40px;
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
  width: 80px;
`;

const StepCircle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.$active
      ? theme.primary
      : props.$completed
      ? theme.success
      : "#e5e7eb"};
  color: white;
  border: 2px solid white;
  box-shadow: 0 0 0 1px
    ${(props) =>
      props.$active
        ? theme.primary
        : props.$completed
        ? theme.success
        : "transparent"};
`;

const StepLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
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
  display: flex;
  align-items: center;
  background: ${theme.white};

  @media (max-width: 640px) {
    padding: 12px 16px;
  }
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 1;
  min-width: 0;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
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

  @media (min-width: 969px) {
    display: none;
  }
`;

const Button = styled(motion.button)`
  padding: 10px 20px;
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

const DesktopPayButton = styled(Button)`
  @media (max-width: 968px) {
    display: none;
  }
`;

export const ModalHeader = ({
  classData,
  currentStep,
}) => {
  const selectedOption = classData?.selectedOption;
  const summary = getScheduleSummary(selectedOption?.schedules);
  const steps = ["Select Date", "Payment", "Confirmation"];

  const getDisplayDurationText = (option, summary) => {
    if (!option) return "-";
    if (
      option.schedules?.length === 1 &&
      typeof option.schedules[0].duration === "number"
    ) {
      return getDurationText(option.schedules[0].duration);
    }
    return summary?.duration || "-";
  };

  const getCapacityText = (summary) => {
    if (!summary || !summary.capacity || summary.capacity === "-")
      return "Capacity varies";
    return summary.capacity.toString().includes("-")
      ? "Capacity varies"
      : `Up to ${summary.capacity} people`;
  };

  return (
    <HeaderContainer>
      <ClassInfo>
        <ClassImage
          src={classData?.image || "/placeholder.jpg"}
          alt={classData?.title || "Class Image"}
        />
        <ClassDetails>
          <ClassTitle>{classData?.title || "Class Title"}</ClassTitle>
          <ClassMeta>
            <div>
              <Clock size={14} />
              {getDisplayDurationText(selectedOption, summary)}
            </div>
            <div>
              <Users size={14} />
              {getCapacityText(summary)}
            </div>
          </ClassMeta>
        </ClassDetails>
      </ClassInfo>

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
                {isCompleted ? <Check size={14} /> : stepNumber}
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
  businessTimeZone = "Etc/UTC",
  userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  paymentAction = null,
}) => {
  const selectedSlot = bookingData?.selectedSlots?.[0];

  const getButtonText = () => {
    switch (currentStep) {
      case 1:
        return "Next";
      case 2:
        return "Confirm & Pay";
      case 3:
        return "Done";
      default:
        return "Next";
    }
  };

  const handlePaymentClick = () => {
    paymentAction?.handleSubmit?.();
  };

  const isPaymentDisabled = !paymentAction?.canSubmit || paymentAction?.loading;
  const showBackButton = currentStep > 1 && !hideBackButton;
  // Show slot info in footer only on step 1 to avoid clutter on payment step
  const showSelectedSlotInfo = currentStep === 1 && selectedSlot;

  return (
    <FooterContainer>
      <FooterContent>
        <FooterLeft>
          {showBackButton && (
            <Button
              onClick={onBack}
              disabled={loading || paymentAction?.loading}
            >
              Back
            </Button>
          )}
          <AnimatePresence>
            {showSelectedSlotInfo && (
              <SelectedSlotInfo
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Calendar size={16} />
                <strong>
                  {/* Reuse utils format if needed, simplistic check here */}
                  {new Date(selectedSlot.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </strong>
              </SelectedSlotInfo>
            )}
          </AnimatePresence>
        </FooterLeft>

        <FooterRight>
          {currentStep === 1 && !hideNextButton && (
            <Button $primary onClick={onNext} disabled={isNextDisabled}>
              {getButtonText()}
            </Button>
          )}

          {currentStep === 2 && (
            <DesktopPayButton
              $primary
              onClick={handlePaymentClick}
              disabled={isPaymentDisabled}
            >
              {paymentAction?.loading
                ? "Processing..."
                : `Pay $${paymentAction?.finalTotal?.toFixed(2) || "0.00"}`}
            </DesktopPayButton>
          )}

          {currentStep === 3 && (
            <Button $primary onClick={onClose}>
              {getButtonText()}
            </Button>
          )}
        </FooterRight>
      </FooterContent>
    </FooterContainer>
  );
};