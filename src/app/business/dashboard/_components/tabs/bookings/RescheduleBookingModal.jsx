"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Modal,
  Button,
  Typography,
  Skeleton,
  Alert,
  Empty,
  Radio,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  Info as InfoIcon,
  X,
  CheckCircle,
} from "lucide-react";
import { Drawer } from "vaul";
import moment from "moment";

import message from "@/lib/message";
import { bookingService } from "@/services/apiService";
import { theme } from "@/components/theme";

const { Title } = Typography;

// --- GLOBAL STYLES ---
const ModalGlobalStyle = createGlobalStyle`
  .compact-modal .ant-modal-content {
    padding: 0 !important;
    border-radius: 16px;
    overflow: hidden;
  }
  .compact-modal .ant-modal-body {
    padding: 0;
  }
`;

// --- STYLED COMPONENTS ---

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
  background: white;
  position: relative;
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  flex-shrink: 0;
  position: relative;
  z-index: 50; /* Topmost */

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
`;

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  position: relative;
  z-index: 1; /* Lowest */
  background: white;

  /* Compact Scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 4px;
  }
`;

const Footer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  position: relative;
  z-index: 50; /* Topmost */

  @media (max-width: 576px) {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
`;

// --- COMPACT LIST ITEM STYLES ---

const CompactItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  background: ${(props) => (props.$selected ? "#f0f9ff" : "white")};
  opacity: ${(props) => (props.$disabled ? 0.6 : 1)};
  transition: background 0.1s;
  position: relative;
  z-index: 1;

  &:hover {
    background: ${(props) =>
      !props.$disabled && (props.$selected ? "#e0f2fe" : "#fafafa")};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 12px;
`;

const DateGroup = styled.div`
  display: flex;
  flex-direction: column;

  .date {
    font-weight: 500;
    font-size: 14px;
    color: #1f2937;
  }
  .time {
    font-size: 12px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .class-label {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }
`;

const SlotSectionHeader = styled.div`
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
`;

const MetaGroup = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  .price {
    font-weight: 600;
    font-size: 13px;
    color: ${theme.token.colorPrimary};
  }
  .spots {
    font-size: 11px;
    color: ${(props) => (props.$hasSpots ? "#059669" : "#dc2626")};
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

// --- WARNING SECTION ---

const WarningContainer = styled(motion.div)`
  background: #fffaf0;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 30; /* High Z-Index to sit above list */
  box-shadow: 0 4px 6px -4px rgba(0, 0, 0, 0.1); /* Shadow to prove depth */
`;

const CompactAlert = styled(Alert)`
  padding: 8px 12px;
  border-radius: 6px;

  .ant-alert-message {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .ant-alert-description {
    font-size: 12px;
    line-height: 1.4;
  }
  .ant-alert-icon {
    margin-top: 2px;
  }
`;

// --- ANIMATION ---
const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
};

const AnimatedContent = ({ children }) => {
  const [ref, { height }] = useElementSize();
  return (
    <motion.div
      animate={{ height: height || "auto" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};

// --- LOGIC COMPONENT ---

const RescheduleContent = ({ booking, onSuccess, onCancel, isInDrawer }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [policyCheck, setPolicyCheck] = useState(null);
  const [checkingPolicy, setCheckingPolicy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [viewState, setViewState] = useState("selection");

  useEffect(() => {
    if (booking) fetchSlots();
  }, [booking]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const result = await bookingService.fetchAvailableRescheduleSlots(
        booking.id,
        { scope: "business" },
      );
      if (result.success) setAvailableSlots(result.data || []);
      else message.error(result.error || "Failed to fetch slots.");
    } catch {
      message.error("Error fetching slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const sameOptionSlots = availableSlots.filter((s) => s.is_same_option !== false);
  const otherClassSlots = availableSlots.filter((s) => s.is_same_option === false);

  const handleSlotSelect = async (slot, isValid) => {
    if (!isValid || slot.id === selectedSlotId) return;
    setSelectedSlotId(slot.id);
    setSelectedSlot(slot);
    setCheckingPolicy(true);
    setPolicyCheck(null);
    try {
      const result = await bookingService.rescheduleBooking(
        booking.id,
        slot.id,
        true,
      ); // dry_run
      if (result.success) setPolicyCheck(result.data);
      else {
        message.error(result.error || "Slot verification failed.");
        setSelectedSlotId(null);
        setSelectedSlot(null);
      }
    } catch {
      message.error("Error checking slot.");
      setSelectedSlotId(null);
      setSelectedSlot(null);
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
        false,
        "Rescheduled by business",
      );
      if (result.success) {
        setViewState("success");
        setTimeout(onSuccess, 1500);
      } else {
        message.error(result.error || "Reschedule failed.");
        setIsConfirming(false);
      }
    } catch {
      message.error("Unexpected error.");
      setIsConfirming(false);
    }
  };

  const renderWarnings = () => {
    if (!policyCheck) return null;
    const diff = parseFloat(policyCheck.price_difference);
    const hasDiff = diff !== 0;
    const isMore = diff > 0;
    const isDifferentClass =
      selectedSlot && selectedSlot.is_same_option === false;

    return (
      <>
        {/* Different class warning */}
        {isDifferentClass && (
          <CompactAlert
            message="Different class"
            description={
              <span>
                This slot is for{" "}
                <b>
                  {selectedSlot.class_title || "Another class"}
                  {selectedSlot.option_title ? ` – ${selectedSlot.option_title}` : ""}
                </b>
                . The customer will be moved to this class/schedule.
              </span>
            }
            type="warning"
            showIcon
            icon={<AlertTriangle size={16} />}
            style={{ marginBottom: 8 }}
          />
        )}

        {/* Policy Warning */}
        <CompactAlert
          message={
            policyCheck.warning_required ? "Policy Warning" : "Policy Info"
          }
          description={policyCheck.policy_message}
          type={policyCheck.warning_required ? "warning" : "info"}
          showIcon
          icon={
            policyCheck.warning_required ? (
              <AlertTriangle size={16} />
            ) : (
              <InfoIcon size={16} />
            )
          }
          style={{ marginBottom: hasDiff ? 8 : 0 }}
        />

        {/* Price Warning */}
        {hasDiff && (
          <CompactAlert
            message={isMore ? "Price Increase" : "Price Decrease"}
            description={
              <span>
                New session is <b>${Math.abs(diff).toFixed(2)}</b>{" "}
                {isMore ? "more" : "less"}. Difference is <u>not</u>{" "}
                charged/refunded automatically.
              </span>
            }
            type="warning"
            showIcon
            icon={<AlertTriangle size={16} />}
          />
        )}
      </>
    );
  };

  if (viewState === "success") {
    return (
      <ContentContainer
        style={{
          justifyContent: "center",
          alignItems: "center",
          minHeight: 250,
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <CheckCircle size={48} color="#52c41a" style={{ marginBottom: 16 }} />
        </motion.div>
        <Title level={4}>Rescheduled!</Title>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <Header>
        <h3>Reschedule {booking?.user_name}</h3>
        {!isInDrawer && (
          <Button
            type="text"
            size="small"
            icon={<X size={18} />}
            onClick={onCancel}
          />
        )}
      </Header>

      <AnimatePresence>
        {selectedSlotId && (
          <AnimatedContent>
            <WarningContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {checkingPolicy ? (
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              ) : (
                renderWarnings()
              )}
            </WarningContainer>
          </AnimatedContent>
        )}
      </AnimatePresence>

      <ScrollableList>
        {loadingSlots ? (
          <div style={{ padding: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Input
                key={i}
                active
                size="small"
                block
                style={{ marginBottom: 12, height: 40 }}
              />
            ))}
          </div>
        ) : availableSlots.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No slots available"
            style={{ margin: "32px 0" }}
          />
        ) : (
          <div>
            {sameOptionSlots.length > 0 && (
              <>
                <SlotSectionHeader>Same class – other times</SlotSectionHeader>
                {sameOptionSlots.map((item) => (
                  <CompactItem
                    key={item.id}
                    $selected={selectedSlotId === item.id}
                    $disabled={!item.is_valid}
                    onClick={() => handleSlotSelect(item, item.is_valid)}
                  >
                    <Radio
                      checked={selectedSlotId === item.id}
                      disabled={!item.is_valid}
                      style={{ marginRight: 0 }}
                    />
                    <ItemContent>
                      <DateGroup>
                        <div className="date">
                          {moment(item.date).format("ddd, MMM D")}
                        </div>
                        <div className="time">
                          <Clock size={10} />{" "}
                          {moment(item.time, "HH:mm:ss").format("h:mm A")}
                        </div>
                      </DateGroup>
                      <MetaGroup $hasSpots={item.available_spots > 0}>
                        <div className="price">
                          ${parseFloat(item.price).toFixed(2)}
                        </div>
                        <div className="spots">
                          {!item.is_valid && <AlertTriangle size={10} />}
                          {item.available_spots} spots
                        </div>
                      </MetaGroup>
                    </ItemContent>
                  </CompactItem>
                ))}
              </>
            )}
            {otherClassSlots.length > 0 && (
              <>
                <SlotSectionHeader>Other classes</SlotSectionHeader>
                {otherClassSlots.map((item) => (
                  <CompactItem
                    key={item.id}
                    $selected={selectedSlotId === item.id}
                    $disabled={!item.is_valid}
                    onClick={() => handleSlotSelect(item, item.is_valid)}
                  >
                    <Radio
                      checked={selectedSlotId === item.id}
                      disabled={!item.is_valid}
                      style={{ marginRight: 0 }}
                    />
                    <ItemContent>
                      <DateGroup>
                        <div className="date">
                          {moment(item.date).format("ddd, MMM D")}
                        </div>
                        <div className="time">
                          <Clock size={10} />{" "}
                          {moment(item.time, "HH:mm:ss").format("h:mm A")}
                        </div>
                        {(item.class_title || item.option_title) && (
                          <div className="class-label">
                            {item.class_title}
                            {item.option_title ? ` – ${item.option_title}` : ""}
                          </div>
                        )}
                      </DateGroup>
                      <MetaGroup $hasSpots={item.available_spots > 0}>
                        <div className="price">
                          ${parseFloat(item.price).toFixed(2)}
                        </div>
                        <div className="spots">
                          {!item.is_valid && <AlertTriangle size={10} />}
                          {item.available_spots} spots
                        </div>
                      </MetaGroup>
                    </ItemContent>
                  </CompactItem>
                ))}
              </>
            )}
          </div>
        )}
      </ScrollableList>

      <Footer>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          type="primary"
          onClick={handleConfirm}
          loading={isConfirming}
          disabled={!selectedSlotId || checkingPolicy}
        >
          Confirm
        </Button>
      </Footer>
    </ContentContainer>
  );
};

// --- MAIN EXPORT ---

const RescheduleBookingModal = ({ visible, booking, onSuccess, onCancel }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 576);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <ModalGlobalStyle />
      {isMobile ? (
        <Drawer.Root
          open={visible}
          onOpenChange={(open) => !open && onCancel()}
          disablePreventScroll={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1000,
              }}
            />
            <Drawer.Content
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                zIndex: 1001,
                outline: "none",
                display: "flex",
                flexDirection: "column",
                maxHeight: "90vh",
              }}
            >
              <Drawer.Handle
                style={{
                  width: 40,
                  height: 4,
                  background: "#e5e7eb",
                  borderRadius: 2,
                  margin: "8px auto",
                  flexShrink: 0,
                }}
              />
              <RescheduleContent
                booking={booking}
                onSuccess={onSuccess}
                onCancel={onCancel}
                isInDrawer={true}
              />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <StyledModal
          open={visible}
          onCancel={onCancel}
          footer={null}
          centered
          width={420}
          closable={false}
          className="compact-modal"
          destroyOnClose
        >
          <RescheduleContent
            booking={booking}
            onSuccess={onSuccess}
            onCancel={onCancel}
            isInDrawer={false}
          />
        </StyledModal>
      )}
    </>
  );
};

export default RescheduleBookingModal;
