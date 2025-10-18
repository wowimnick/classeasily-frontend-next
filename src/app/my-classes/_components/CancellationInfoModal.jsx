"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styled, { css } from "styled-components";
import { Typography, Button, ConfigProvider, Space } from "antd";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  FileText,
  DollarSign,
  Info,
  Shield,
  XCircle,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "@/components/theme";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import CancellationModalSkeleton from "./CancellationModalSkeleton";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

// --- Modal Shell Components (Inspired by BookingModal for consistency) ---

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1050;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalContainer = styled(motion.div)`
  width: 100%;
  max-width: 550px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  @media (max-width: 768px) {
    height: auto;
    max-height: 85vh;
    border-radius: 24px 24px 0 0;
  }
`;

const DragHandle = styled(motion.div)`
  display: none;
  width: 40px;
  height: 5px;
  background: #d1d1d1;
  border-radius: 2.5px;
  margin: 12px auto 0;
  cursor: grab;

  @media (max-width: 768px) {
    display: block;
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #717171;

  &:hover {
    background: #e0e0e0;
  }
`;

const ModalHeader = styled.header`
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 16px 24px;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

const ModalFooter = styled.footer`
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;

  .ant-btn {
    flex: 1;
  }
`;

// --- Custom Components for Cancellation Info ---

const ModalLoader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
  flex-direction: column;
  gap: 16px;
`;

const BookingHeader = styled.div`
  background: #fafafa;
  padding: 16px 24px;
  margin: -24px -24px 24px -24px;
  border-bottom: 1px solid #f0f0f0;

  .booking-title {
    font-weight: 700;
    font-size: 18px;
    color: #222;
    margin-bottom: 8px;
  }

  .booking-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .booking-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #717171;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    padding: 16px 20px;
    margin: -16px -20px 20px -20px;
    .booking-title {
      font-size: 16px;
    }
    .booking-item {
      font-size: 13px;
    }
  }
`;

const SectionTitle = styled(Title)`
  &.ant-typography {
    font-size: 16px;
    font-weight: 600;
    color: #484848;
    margin-bottom: 16px !important;
    display: flex;
    align-items: center;
    gap: 8px;

    .section-icon {
      color: #717171;
    }

    @media (max-width: 768px) {
      font-size: 15px;
      margin-bottom: 12px !important;
    }
  }
`;

const PolicyCard = styled.div`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;

  .policy-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .policy-name {
    font-size: 15px;
    font-weight: 600;
    color: #222;
  }
  .policy-description {
    color: #717171;
    font-size: 14px;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    padding: 12px;
    margin-bottom: 20px;
    .policy-name {
      font-size: 14px;
    }
    .policy-description {
      font-size: 13px;
    }
  }
`;

const FinancialSummary = styled.div`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const FinancialRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  font-size: 14px;
  background: white;

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }

  &.total {
    background-color: #fafafa;
    font-weight: 700;
  }

  .label {
    color: #717171;
  }
  .value {
    font-weight: 600;
    color: #222;
  }
  .value.refund {
    color: #2e7d32;
  }
  .value.non-refund {
    color: #d46b08;
  }

  @media (max-width: 768px) {
    padding: 12px 14px;
    font-size: 13px;
  }
`;

const RefundStatusNotice = styled(motion.div)`
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;

  ${({ status }) => {
    if (status === "success")
      return css`
        background-color: #f6ffed;
      `;
    if (status === "warning")
      return css`
        background-color: #fffbe6;
      `;
    if (status === "error")
      return css`
        background-color: #fff5f5;
      `;
    return css`
      background-color: #fafafa;
    `;
  }}

  .status-icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ status }) => {
      if (status === "success") return "#389E0D";
      if (status === "warning") return "#D46B08";
      if (status === "error") return "#D80027";
      return "#717171";
    }};
  }

  .status-content {
    flex: 1;
  }
  .status-title {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: ${({ status }) => {
      if (status === "success") return "#389E0D";
      if (status === "warning") return "#D46B08";
      if (status === "error") return "#D80027";
      return "#222";
    }};
  }
  .status-description {
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    color: ${({ status }) => {
      if (status === "success") return "#2e7d32";
      if (status === "warning") return "#A85B06";
      if (status === "error") return "#A53E3E";
      return "#717171";
    }};
  }

  @media (max-width: 768px) {
    padding: 12px 14px;
    .status-title {
      font-size: 15px;
    }
    .status-description {
      font-size: 13px;
    }
  }
`;

const CancellationInfoModal = ({
  isOpen,
  onClose,
  booking,
  userTimeZone,
  onConfirmCancel,
  isCancelling,
  cancellationDetails,
  isLoading,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Only access window after component mounts on client
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth <= 768);

      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Block scrolling on the body when the modal is open
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, isMounted]);

  const modalVariants = isMobile
    ? {
        hidden: { y: "100%", opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: {
          y: "100%",
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.2, ease: "easeOut" },
        },
        exit: {
          scale: 0.95,
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      };

  const handleDragEnd = (event, info) => {
    const dragThreshold = 100;
    const velocityThreshold = 20;

    if (info.offset.y > dragThreshold && info.velocity.y > velocityThreshold) {
      onClose();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <CancellationModalSkeleton />;
    }
    if (!cancellationDetails || cancellationDetails.error) {
      return (
        <RefundStatusNotice status="error">
          <XCircle size={24} className="status-icon" />
          <div className="status-content">
            <h3 className="status-title">Could Not Load Details</h3>
            <p className="status-description">
              {cancellationDetails?.error ||
                "The cancellation policy could not be retrieved. Please try again later."}
            </p>
          </div>
        </RefundStatusNotice>
      );
    }

    const {
      can_cancel,
      is_eligible_for_refund,
      policy_key,
      policy_description,
      refund_percentage,
    } = cancellationDetails;
    const originalPrice = parseFloat(booking.price || 0);
    const estimatedRefund = is_eligible_for_refund
      ? (originalPrice * refund_percentage) / 100
      : 0;
    const nonRefundableAmount = originalPrice - estimatedRefund;

    const getPolicyName = (key) =>
      ({
        "24h": "24-Hour Notice",
        "48h": "48-Hour Notice",
        "72h": "72-Hour Notice",
        flexible: "Flexible Policy",
        strict: "Strict Policy",
      }[key] || "Standard Policy");

    let statusProps;
    if (!can_cancel) {
      statusProps = {
        status: "error",
        title: "Cancellation Not Available",
        description:
          "This booking cannot be cancelled as it has already started or is in the past.",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/juujmrhr.json"
            trigger="in"
            delay="1500"
            state="in-error"
            colors="primary:#c73132"
          />
        ),
      };
    } else if (is_eligible_for_refund) {
      statusProps = {
        status: "success",
        title: "Eligible for Refund",
        description: `You will receive an estimated refund of $${estimatedRefund.toFixed(
          2
        )} if you cancel now.`,
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/rxgzsafd.json"
            trigger="in"
            delay="1500"
            state="in-check"
            colors="primary:#5b943f"
          />
        ),
      };
    } else {
      statusProps = {
        status: "warning",
        title: "No Refund Available",
        description:
          "The cancellation deadline has passed. You can still cancel this booking, but no refund will be issued.",
        icon: (
          <LordIcon
            src="https://cdn.lordicon.com/jzwvffwx.json"
            trigger="in"
            delay="1500"
            state="in-warning"
            colors="primary:#c27630"
          />
        ),
      };
    }

    return (
      <>
        <SectionTitle>
          <Shield size={18} className="section-icon" />
          Cancellation Policy
        </SectionTitle>
        <PolicyCard>
          <div className="policy-header">
            <FileText size={18} style={{ color: "#717171" }} />
            <span className="policy-name">{getPolicyName(policy_key)}</span>
          </div>
          <p className="policy-description">
            {policy_description ||
              `This policy, set by ${booking.business_name}, determines your refund eligibility.`}
          </p>
        </PolicyCard>

        <SectionTitle>
          <DollarSign size={18} className="section-icon" />
          Financial Summary
        </SectionTitle>
        <FinancialSummary>
          <FinancialRow>
            <span className="label">Original Amount Paid</span>
            <span className="value">${originalPrice.toFixed(2)}</span>
          </FinancialRow>
          <FinancialRow>
            <span className="label">Non-Refundable Amount</span>
            <span className="value non-refund">
              ${nonRefundableAmount.toFixed(2)}
            </span>
          </FinancialRow>
          <FinancialRow className="total">
            <span className="label">Estimated Refund</span>
            <span className="value refund">${estimatedRefund.toFixed(2)}</span>
          </FinancialRow>
        </FinancialSummary>

        <RefundStatusNotice
          status={statusProps.status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="status-icon">{statusProps.icon}</div>
          <div className="status-content">
            <h3 className="status-title">{statusProps.title}</h3>
            <p className="status-description">{statusProps.description}</p>
          </div>
        </RefundStatusNotice>
      </>
    );
  };

  // Don't render anything until mounted on client
  if (!isMounted) {
    return null;
  }

  const modalComponent = (
    <ConfigProvider theme={theme}>
      <AnimatePresence>
        {isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <ModalContainer
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 500 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              dragSnapToOrigin
            >
              <DragHandle />
              <ModalHeader>
                <Space align="center" size={12}>
                  <AlertTriangle
                    size={22}
                    style={{ color: theme.token.colorWarning }}
                  />
                  <span
                    style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}
                  >
                    Cancel Booking
                  </span>
                </Space>
                <CloseButton whileTap={{ scale: 0.9 }} onClick={onClose}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                {booking && (
                  <BookingHeader>
                    <Title level={4} className="booking-title">
                      {booking.class_name}
                    </Title>
                    <div className="booking-details">
                      <div className="booking-item">
                        <CalendarDays size={16} />
                        <span>{booking.userLocalSessionTime || "N/A"}</span>
                      </div>
                      <div className="booking-item">
                        <Shield size={16} />
                        <span>Hosted by {booking.business_name}</span>
                      </div>
                    </div>
                  </BookingHeader>
                )}
                {renderContent()}
              </ModalContent>

              <ModalFooter>
                <Button
                  key="back"
                  onClick={onClose}
                  disabled={isCancelling}
                  size="middle"
                >
                  Go Back
                </Button>
                {cancellationDetails &&
                  cancellationDetails.can_cancel &&
                  !isLoading && (
                    <Button
                      key="submit"
                      type="primary"
                      danger
                      loading={isCancelling}
                      onClick={() => onConfirmCancel(booking)}
                      disabled={isCancelling}
                      size="middle"
                    >
                      {isCancelling ? "Processing..." : "Confirm Cancellation"}
                    </Button>
                  )}
              </ModalFooter>
            </ModalContainer>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </ConfigProvider>
  );

  return typeof window !== "undefined"
    ? createPortal(modalComponent, document.body)
    : null;
};

export default CancellationInfoModal;
