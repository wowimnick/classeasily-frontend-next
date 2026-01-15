"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Modal,
  List,
  Button,
  Typography,
  Empty,
  Alert,
  Radio,
  Tooltip,
  Skeleton,
} from "antd";
import message from "@/lib/message";
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Info as InfoIcon,
  HelpCircle,
} from "lucide-react";
import { bookingService } from "@/services/apiService";
import moment from "moment";

const { Text, Paragraph } = Typography;

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 65vh;
  min-height: 40vh;

  @media (max-width: 576px) {
    max-height: 70vh;
  }
`;

const SlotListWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin: 0 -24px;
  padding: 0 24px;

  @media (max-width: 576px) {
    margin: 0 -16px;
    padding: 0 16px;
  }
`;

const SlotItem = styled(List.Item)`
  padding: 12px 8px !important;
  border-radius: 8px;
  border-bottom: 1px solid #f0f0f0 !important;
  transition: background-color 0.2s ease, opacity 0.2s ease;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};

  &:hover {
    background-color: ${(props) =>
      props.disabled ? "transparent" : "#f8fafc"};
  }

  &.selected {
    background-color: #f0f9ff;
    padding-left: 8px !important;
  }
`;

const SlotDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const SlotDateTime = styled.div`
  .date {
    font-weight: 500;
    color: #1f2937;
    font-size: 14px;
  }
  .time {
    color: #6b7280;
    font-size: 13px;
  }
`;

const SlotInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const SlotAvailability = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${(props) => (props.hasSpots ? "#10b981" : "#ef4444")};
  font-weight: 500;
`;

const ConfirmationSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledAlert = styled(Alert)`
  border-radius: 8px;
`;

const PriceTag = styled.span`
  font-weight: 600;
  color: #059669;
`;

const SkeletonItem = () => (
  <List.Item style={{ padding: "12px 8px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: "16px",
      }}
    >
      <Skeleton.Avatar shape="circle" size="small" active />
      <div style={{ flex: 1 }}>
        <Skeleton active title={false} paragraph={{ rows: 2, width: "100%" }} />
      </div>
    </div>
  </List.Item>
);

const RescheduleBookingModal = ({ visible, booking, onSuccess, onCancel }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [policyCheck, setPolicyCheck] = useState(null);
  const [checkingPolicy, setCheckingPolicy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (visible && booking) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const result = await bookingService.fetchAvailableRescheduleSlots(
            booking.id
          );
          if (result.success) {
            setAvailableSlots(result.data);
          } else {
            message.error(result.error || "Failed to fetch available slots.");
          }
        } catch (error) {
          message.error("An error occurred while fetching slots.");
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlotId(null);
      setPolicyCheck(null);
    }
  }, [visible, booking]);

  const handleSlotSelect = async (instanceId) => {
    if (!instanceId) return;
    setSelectedSlotId(instanceId);
    setCheckingPolicy(true);
    setPolicyCheck(null);
    try {
      const result = await bookingService.rescheduleBooking(
        booking.id,
        instanceId,
        true // dry_run = true
      );
      if (result.success) {
        setPolicyCheck(result.data);
      } else {
        message.error(result.error || "Could not verify this slot.");
        setSelectedSlotId(null);
      }
    } catch (error) {
      message.error("An error occurred while checking this slot.");
      setSelectedSlotId(null);
    } finally {
      setCheckingPolicy(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlotId) return;
    setIsConfirming(true);
    try {
      const result = await bookingService.rescheduleBooking(
        booking.id,
        selectedSlotId,
        false, // dry_run = false
        "Rescheduled by business"
      );
      if (result.success) {
        onSuccess();
      } else {
        message.error(result.error || "Failed to reschedule booking.");
      }
    } catch (error) {
      message.error("An unexpected error occurred.");
    } finally {
      setIsConfirming(false);
    }
  };

  const renderPriceDifferenceWarning = () => {
    if (!policyCheck || policyCheck.price_difference === 0) return null;

    const diff = parseFloat(policyCheck.price_difference);
    const isMoreExpensive = diff > 0;

    return (
      <StyledAlert
        message={isMoreExpensive ? "Price Increase" : "Price Decrease"}
        description={
          <Paragraph type="secondary" style={{ fontSize: "13px", margin: 0 }}>
            The new session is ${Math.abs(diff).toFixed(2)}{" "}
            {isMoreExpensive ? "more expensive" : "cheaper"}. The guest will
            <b> not</b> be charged or refunded the difference. The original
            payment of ${parseFloat(policyCheck.original_price).toFixed(2)} will
            be retained for this booking.
          </Paragraph>
        }
        type="warning"
        showIcon
        icon={<AlertTriangle />}
      />
    );
  };

  return (
    <Modal
      title={`Reschedule Booking for ${booking?.user_name || "Guest"}`}
      open={visible}
      onCancel={onCancel}
      destroyOnClose
      width="95vw"
      style={{ maxWidth: "600px", top: 20 }}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key={`btn-${isConfirming}`}
          type="primary"
          loading={isConfirming}
          onClick={handleConfirm}
          disabled={!selectedSlotId || checkingPolicy}
        >
          Confirm Reschedule
        </Button>,
      ]}
    >
      <ModalContentWrapper>
        <Paragraph type="secondary">
          Select a new available time slot. Invalid slots are disabled.
        </Paragraph>
        {loadingSlots ? (
          <SlotListWrapper>
            <List dataSource={[1, 2, 3]} renderItem={() => <SkeletonItem />} />
          </SlotListWrapper>
        ) : (
          <SlotListWrapper>
            {availableSlots.length > 0 ? (
              <Radio.Group
                onChange={(e) => handleSlotSelect(e.target.value)}
                value={selectedSlotId}
                style={{ width: "100%" }}
              >
                <List
                  dataSource={availableSlots}
                  renderItem={(item) => (
                    <SlotItem
                      onClick={() => item.is_valid && handleSlotSelect(item.id)}
                      className={selectedSlotId === item.id ? "selected" : ""}
                      disabled={!item.is_valid}
                    >
                      <Radio
                        value={item.id}
                        disabled={!item.is_valid}
                        style={{ marginRight: "16px" }}
                      />
                      <SlotDetails>
                        <SlotDateTime>
                          <div className="date">
                            {moment(item.date).format("dddd, MMMM D, YYYY")}
                          </div>
                          <div className="time">
                            {moment(item.time, "HH:mm:ss").format("h:mm A")}
                          </div>
                        </SlotDateTime>
                        <SlotInfo>
                          <PriceTag>
                            ${parseFloat(item.price).toFixed(2)}
                          </PriceTag>
                          <SlotAvailability hasSpots={item.available_spots > 0}>
                            <User size={14} />
                            {item.available_spots} spots
                          </SlotAvailability>
                          {!item.is_valid && (
                            <Tooltip title={item.reason_invalid}>
                              <AlertTriangle size={16} color="#ef4444" />
                            </Tooltip>
                          )}
                        </SlotInfo>
                      </SlotDetails>
                    </SlotItem>
                  )}
                />
              </Radio.Group>
            ) : (
              <Empty description="No other available slots for this experience." />
            )}
          </SlotListWrapper>
        )}
        {selectedSlotId && (
          <ConfirmationSection>
            {checkingPolicy && (
              <Skeleton
                active
                title={false}
                paragraph={{ rows: 2, width: "100%" }}
              />
            )}
            {policyCheck && (
              <>
                {policyCheck.warning_required ? (
                  <StyledAlert
                    message="Policy Warning"
                    description={<>{policyCheck.policy_message}</>}
                    type="warning"
                    showIcon
                    icon={<AlertTriangle />}
                  />
                ) : (
                  <StyledAlert
                    message={policyCheck.policy_message}
                    type="info"
                    showIcon
                    icon={<InfoIcon />}
                  />
                )}
                {renderPriceDifferenceWarning()}
              </>
            )}
          </ConfirmationSection>
        )}
      </ModalContentWrapper>
    </Modal>
  );
};

export default RescheduleBookingModal;
