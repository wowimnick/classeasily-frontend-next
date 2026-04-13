import React from "react";
import { ChevronLeft } from "lucide-react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";

const theme = {
  primary: "#ff385c",
  textPrimary: "#222222",
  textSecondary: "#717171",
  borderLight: "#f0f0f0",
  white: "#ffffff",
};

// --- Header Styles ---
const HeaderContainer = styled.div`
  padding: 24px 24px;
  border-bottom: 1px solid ${theme.borderLight};
  background: ${theme.white};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0;

  @media (max-width: 640px) {
    padding: 20px 16px;
  }
`;

// --- Text Content Styles ---
const TextContainer = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 400px;
`;

const HeaderTitle = styled(motion.h2)`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: ${theme.textPrimary};
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(motion.p)`
  margin: 0;
  font-size: 14px;
  color: ${theme.textSecondary};
  line-height: 1.5;
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

  /* Desktop Flex + reduced bottom padding */
  @media (min-width: 641px) {
    padding: 12px 24px;
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

// --- Animations ---
const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const ModalHeader = ({
  currentStep,
  steps = ["Date", "Payment", "Confirm"],
}) => {
  // Dynamic Content mapping based on step Label or Index
  const getContent = (label) => {
    switch (label) {
      case "Option":
        return {
          title: "Choose your experience",
          subtitle: "Select the option that suits you best.",
        };
      case "Date":
        return {
          title: "When would you like to go?",
          subtitle: "Choose a date and time.",
        };
      case "Payment":
        return {
          title: "Review & Pay",
          subtitle: "Double-check your details and secure your spot.",
        };
      case "Confirm":
        return {
          title: "Woohoo! You're booked.",
          subtitle: "Your spot is saved. Details sent to email.",
        };
      default:
        return { title: "", subtitle: "" };
    }
  };

  const currentLabel = steps[currentStep - 1] || "Unknown";
  const { title, subtitle } = getContent(currentLabel);

  return (
    <HeaderContainer>
      <TextContainer>
        <AnimatePresence mode="wait">
          <React.Fragment key={currentStep}>
            <HeaderTitle
              variants={textVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {title}
            </HeaderTitle>
            <HeaderSubtitle
              variants={textVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
            >
              {subtitle}
            </HeaderSubtitle>
          </React.Fragment>
        </AnimatePresence>
      </TextContainer>
    </HeaderContainer>
  );
};

export const ModalFooter = ({
  currentStep,
  totalSteps,
  onBack,
  onClose,
  loading = false,
  hideBackButton = false,
  paymentAction = null,
  isPaymentStep = false,
}) => {
  const handlePaymentClick = () => {
    if (paymentAction?.handleSubmit) {
      paymentAction.handleSubmit();
    }
  };

  const isPaymentDisabled = !paymentAction?.canSubmit || paymentAction?.loading;
  const showBackButton = currentStep > 1 && !hideBackButton;

  // FIX: Only show the "Pay" button if we are explicitly on the payment step
  const showPayButton = isPaymentStep && paymentAction !== null;

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
        {showPayButton && (
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

      </DesktopRightSlot>
    </FooterContainer>
  );
};
