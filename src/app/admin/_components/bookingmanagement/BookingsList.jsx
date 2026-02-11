"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import NumberFlow from "@number-flow/react";
import { Drawer } from "vaul";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  ConfigProvider,
  Avatar,
  Space,
  Modal,
  Grid,
  Empty,
  DatePicker,
  Form,
  Divider,
  Typography,
  Skeleton,
  List,
  Tooltip,
  Tag,
  InputNumber,
  Alert,
} from "antd";
import message from "@/lib/message";
import {
  Search,
  Eye,
  RefreshCcw,
  Download,
  CheckCircle,
  X,
  Clock,
  Check,
  XCircle,
  DollarSign,
  Users,
  BookOpen,
  Hash,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Building,
  Info,
  Repeat,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Calendar,
  Shield,
  UserCircle2,
  ShieldAlert,
  Mail,
  Phone,
  Percent,
  AlertCircle,
} from "lucide-react";
import { adminBookingService, paymentService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Text, Title: AntTitle, Paragraph } = Typography;

// --- THEME COLORS ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE COMPONENTS (STYLED LIKE PAYOUTS) ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 50%;
    flex-direction: row;
    justify-content: space-between;
  }
`;

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const ExportButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

// --- STATS CARDS (COPIED FROM PAYOUTS) ---
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 12px !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    @media (max-width: 768px) {
      padding: 16px !important;
    }
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};
  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;

  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PercentChange = styled.span`
  color: ${(props) => (props.isPositive ? colors.success : colors.error)};
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
`;

// --- TABLE SECTION ---
const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableTitle = styled(AntTitle).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid ${colors.border};

  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textPrimary};
    font-size: 13px;
    padding: 16px 24px;
  }

  .ant-table-tbody > tr > td {
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
  }

  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }

  .ant-empty {
    padding: 40px 20px;
  }
`;

// --- IOS STYLE DRAWER (FROM CANCELLATION MODAL) ---
// --- VAUL DRAWER STYLES ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1049;
`;

const MobileDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 85vh;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DragHandle = styled.div`
  width: 40px;
  height: 5px;
  background: #d1d1d1;
  border-radius: 2.5px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 720px;
  display: flex;
`;

const DesktopDrawerInner = styled.div`
  background: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
`;

const DrawerHeaderSection = styled.div`
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 16px 24px;
  }
`;

const DrawerCloseButton = styled.button`
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #717171;

  &:hover {
    background: #e0e0e0;
  }
`;

const DrawerScrollContent = styled.div`
  overflow-y: auto;
  flex: 1;
  background-color: ${colors.lightBg};
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  background: white;
`;

const DrawerHeader = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StudentAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: ${colors.primary};
  color: white;
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 20px;
`;

const InfoGroupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  svg {
    width: 18px;
    height: 18px;
    color: ${colors.primary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  margin-top: 2px;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InfoContent = styled.div``;

const InfoLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-bottom: 2px;
`;

const InfoValue = styled(Paragraph)`
  &.ant-typography {
    font-weight: 500;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
  }
`;

const ParticipantListItem = styled(List.Item)`
  .ant-list-item-meta-title {
    font-weight: 500;
  }
`;

const StatusTag = styled(Tag)`
  font-weight: 600;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
`;

// Mobile Components
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;

// --- UTILITY FUNCTIONS ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value ?? 0
  );

const formatDate = (dateString) =>
  dateString ? dayjs(dateString).format("MMM D, YYYY") : "N/A";

const formatDateTime = (dateString) =>
  dateString
    ? dayjs.utc(dateString).local().format("MMM D, YYYY h:mm A")
    : "N/A";

const formatTimeInTimezone = (date, time, tz, formatStr = "h:mm A zzz") => {
  if (!date || !time || !tz) return "N/A";
  const dateTimeStr = `${date}T${time}`;
  return dayjs.tz(dateTimeStr, tz).format(formatStr);
};

const getStatusTag = (status) => {
  const statusMap = {
    confirmed: { color: "blue", icon: <Check size={12} /> },
    completed: { color: "green", icon: <CheckCircle size={12} /> },
    cancelled: { color: "red", icon: <X size={12} /> },
    pending: { color: "gold", icon: <Clock size={12} /> },
  };
  const config = statusMap[status?.toLowerCase()] || {
    color: "default",
    icon: <Info size={12} />,
  };
  return (
    <StatusTag color={config.color} icon={config.icon}>
      {status}
    </StatusTag>
  );
};

const getPaymentStatusTag = (status) => {
  const statusMap = {
    succeeded: {
      color: "green",
      icon: <CheckCircle size={12} />,
      text: "Paid",
    },
    paid: { color: "green", icon: <CheckCircle size={12} />, text: "Paid" },
    pending: { color: "gold", icon: <Clock size={12} />, text: "Pending" },
    refunded: {
      color: "default",
      icon: <Repeat size={12} />,
      text: "Refunded",
    },
    partially_refunded: {
      color: "purple",
      icon: <Repeat size={12} />,
      text: "Partial Refund",
    },
    failed: { color: "red", icon: <AlertCircle size={12} />, text: "Failed" },
    refund_pending: {
      color: "orange",
      icon: <Clock size={12} />,
      text: "Refund Pending",
    },
  };
  const config = statusMap[status?.toLowerCase()] || {
    color: "default",
    icon: <Info size={12} />,
    text: status || "Unknown",
  };
  return (
    <StatusTag color={config.color} icon={config.icon}>
      {config.text}
    </StatusTag>
  );
};

// --- STANDALONE DETAIL DRAWER COMPONENT ---

const DetailDrawerContent = ({
  booking,
  isLoading,
  onOpenCancelModal,
  onOpenRefundModal,
  isActionLoading,
}) => {
  if (!booking) {
    return (
      <Empty description="No booking selected" style={{ paddingTop: 100 }} />
    );
  }

  const { payment } = booking;

  return (
    <>
      <DrawerHeader>
        <StudentAvatar src={booking.user_details?.avatar_medium_url}>
          {(booking.user_name || "?")[0]}
        </StudentAvatar>
        <div>
          <AntTitle level={4} style={{ margin: 0 }}>
            {booking.user_name || "Booker name unavailable"}
          </AntTitle>
          <Text type="secondary">
            {booking.user_email || "—"}
          </Text>
          {booking.user_phone_number && (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {booking.user_phone_number}
            </Text>
          )}
        </div>
      </DrawerHeader>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "350px",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <GlobalLoaderWithoutInlineStyles />
            <Text type="secondary">Loading booking details...</Text>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ overflowY: "auto" }}
          >
            <InfoGroup>
              <InfoGroupTitle>
                <Hash />
                Booking Summary
              </InfoGroupTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoIcon>
                    <Hash />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Reference Code</InfoLabel>
                    <InfoValue>
                      {booking.user_facing_reference || `#${booking.id}`}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Info />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Booking Status</InfoLabel>
                    <InfoValue>{getStatusTag(booking.status)}</InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <CreditCard />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Payment Status</InfoLabel>
                    <InfoValue>
                      {getPaymentStatusTag(booking.payment_status)}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Calendar />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Booked On</InfoLabel>
                    <InfoValue>
                      {formatDateTime(booking.booking_date)}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Repeat />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Enrollment Type</InfoLabel>
                    <InfoValue>
                      {booking.enrollment_type}
                      {booking.session_info
                        ? ` (${booking.session_info.current_session} of ${booking.session_info.total_sessions})`
                        : ""}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Users />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Participants</InfoLabel>
                    <InfoValue>
                      {booking.participants != null ? booking.participants : "—"}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                {booking.notes && (
                  <InfoItem style={{ gridColumn: "1 / -1" }}>
                    <InfoIcon>
                      <MessageSquare />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Notes from Booker</InfoLabel>
                      <InfoValue>{booking.notes}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                )}
                {booking.cancellation_reason && (
                  <InfoItem style={{ gridColumn: "1 / -1" }}>
                    <InfoIcon>
                      <XCircle />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Cancellation Reason</InfoLabel>
                      <InfoValue>{booking.cancellation_reason}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                )}
              </InfoGrid>
            </InfoGroup>

            <InfoGroup>
              <InfoGroupTitle>
                <Shield />
                Cancellation Policy (At Time of Booking)
              </InfoGroupTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoIcon>
                    <Shield />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Policy Type</InfoLabel>
                    <InfoValue style={{ textTransform: "capitalize" }}>
                      {booking.cancellation_policy?.replace(/_/g, " ") || "N/A"}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Percent />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Refund Percentage</InfoLabel>
                    <InfoValue>
                      {booking.cancellation_refund_percentage}%
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                {/* Conditionally render this item ONLY if the policy is 'custom' */}
                {booking.cancellation_policy === "custom" && (
                  <InfoItem>
                    <InfoIcon>
                      <Clock />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Required Notice</InfoLabel>
                      <InfoValue>
                        {booking.cancellation_custom_hours} hours
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                )}
              </InfoGrid>
            </InfoGroup>

            {payment && (
              <InfoGroup>
                <InfoGroupTitle>
                  <CreditCard />
                  Payment Details
                </InfoGroupTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoIcon>
                      <Hash />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Stripe Transaction ID</InfoLabel>
                      <InfoValue>{payment.stripe_payment_intent_id}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <DollarSign />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Total Paid</InfoLabel>
                      <InfoValue>{formatCurrency(payment.amount)}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Percent />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Platform Fee</InfoLabel>
                      <InfoValue>
                        {formatCurrency(payment.platform_fee_amount)}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <TrendingUp />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Net Payout to Business</InfoLabel>
                      <InfoValue>
                        {formatCurrency(payment.net_payout_amount)}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <TrendingDown />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Refunded</InfoLabel>
                      <InfoValue>
                        {formatCurrency(payment.refunded_amount)}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <CreditCard />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Method</InfoLabel>
                      <InfoValue>
                        {payment.card_details?.display_name || "N/A"}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem style={{ gridColumn: "1 / -1" }}>
                    <InfoIcon>
                      <ExternalLink />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Stripe Receipt</InfoLabel>
                      <InfoValue>
                        <Button
                          type="link"
                          style={{ padding: 0, height: "auto" }}
                          href={payment.receipt_url}
                          target="_blank"
                        >
                          View on Stripe
                        </Button>
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                </InfoGrid>
              </InfoGroup>
            )}

            <InfoGroup>
              <InfoGroupTitle>
                <BookOpen />
                Class & Business
              </InfoGroupTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoIcon>
                    <BookOpen />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Class Name</InfoLabel>
                    <InfoValue>{booking.class_name}</InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Building />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Business</InfoLabel>
                    <InfoValue>{booking.business_name}</InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Calendar />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Session Date</InfoLabel>
                    <InfoValue>{formatDate(booking.date)}</InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Clock />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Session Time (Business Local)</InfoLabel>
                    <InfoValue>
                      {formatTimeInTimezone(
                        booking.date,
                        booking.time,
                        booking.business_timezone
                      )}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
              </InfoGrid>
            </InfoGroup>

            {(booking.participant_details?.length > 0 || (booking.participants != null && booking.participants > 0)) && (
              <InfoGroup>
                <InfoGroupTitle>
                  <Users />
                  Participant{booking.participants !== 1 ? "s" : ""} Details
                </InfoGroupTitle>
                {booking.participant_details?.length > 0 ? (
                  <List
                    dataSource={booking.participant_details}
                    renderItem={(item, index) => (
                      <ParticipantListItem>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserCircle2 size={18} />} />}
                          title={item.name || "—"}
                          description={
                            item.email || (index === 0 ? "(Same as booker)" : "—")
                          }
                        />
                      </ParticipantListItem>
                    )}
                  />
                ) : (
                  <InfoValue>
                    {booking.participants} participant{booking.participants !== 1 ? "s" : ""} (names not stored)
                  </InfoValue>
                )}
              </InfoGroup>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const DetailDrawerModal = ({
  isVisible,
  onClose,
  booking,
  isLoading,
  isMobile,
  onOpenCancelModal,
  onOpenRefundModal,
  isActionLoading,
}) => {
  if (!booking) return null;

  const { payment } = booking;

  const renderDrawerContent = () => (
    <>
      <DrawerHeaderSection>
        <Space align="center" size={12}>
          <Hash size={20} style={{ color: colors.primary }} />
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}>
            Booking: {booking?.user_facing_reference || `#${booking?.id}`}
          </span>
        </Space>
        <DrawerCloseButton onClick={onClose}>
          <X size={20} />
        </DrawerCloseButton>
      </DrawerHeaderSection>

      <DrawerScrollContent>
        <DetailDrawerContent
          booking={booking}
          isLoading={isLoading}
          onOpenCancelModal={onOpenCancelModal}
          onOpenRefundModal={onOpenRefundModal}
          isActionLoading={isActionLoading}
        />
      </DrawerScrollContent>

      <DrawerFooter>
        <Button
          danger
          icon={<XCircle size={16} />}
          onClick={onOpenCancelModal}
          disabled={
            booking.status === "cancelled" ||
            booking.status === "completed" ||
            isActionLoading
          }
        >
          Cancel Booking
        </Button>
        <Button
          type="primary"
          icon={<DollarSign size={16} />}
          onClick={onOpenRefundModal}
          disabled={
            !payment ||
            !(payment.available_refund_amount > 0) ||
            isActionLoading
          }
        >
          Process Refund
        </Button>
      </DrawerFooter>
    </>
  );

  return (
    <Drawer.Root
      open={isVisible}
      onOpenChange={(open) => !open && onClose()}
      direction={isMobile ? "bottom" : "right"}
      dismissible
    >
      <Drawer.Portal>
        <StyledDrawerOverlay />
        {isMobile ? (
          <MobileDrawerContent>
            <DragHandle />
            {renderDrawerContent()}
          </MobileDrawerContent>
        ) : (
          <DesktopDrawerContent>
            <DesktopDrawerInner>{renderDrawerContent()}</DesktopDrawerInner>
          </DesktopDrawerContent>
        )}
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// Mobile Booking Item
const MobileBookingItem = ({ booking, onViewDetails }) => (
  <MobileCard>
    <MobileCardContent>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <Space>
          <Avatar src={booking.user_avatar_thumb_url}>
            {booking.user_name?.[0]}
          </Avatar>
          <div>
            <Text
              strong
              style={{
                fontSize: "14px",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "180px",
              }}
            >
              {booking.user_name}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: "12px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "180px",
              }}
            >
              {booking.user_email}
            </Text>
          </div>
        </Space>
        {getStatusTag(booking.status)}
      </div>

      <MobileCardRow>
        <MobileCardLabel>Class</MobileCardLabel>
        <Text
          strong
          style={{
            fontSize: "13px",
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "200px",
          }}
        >
          {booking.class_name}
        </Text>
      </MobileCardRow>

      <MobileCardRow>
        <MobileCardLabel>Business</MobileCardLabel>
        <Text
          style={{
            fontSize: "13px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "200px",
          }}
        >
          {booking.business_name}
        </Text>
      </MobileCardRow>

      <MobileCardRow>
        <MobileCardLabel>Session Date</MobileCardLabel>
        <Text style={{ fontSize: "13px" }}>{formatDate(booking.date)}</Text>
      </MobileCardRow>

      <MobileCardRow>
        <MobileCardLabel>Payment</MobileCardLabel>
        {getPaymentStatusTag(booking.payment_status)}
      </MobileCardRow>

      <MobileCardRow>
        <MobileCardLabel>Amount</MobileCardLabel>
        <Text strong style={{ fontSize: "14px", color: colors.success }}>
          {formatCurrency(booking.amount_paid)}
        </Text>
      </MobileCardRow>

      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <Button
          type="primary"
          size="middle"
          icon={<Eye size={14} />}
          onClick={() => onViewDetails(booking)}
          block
        >
          View Details
        </Button>
      </div>
    </MobileCardContent>
  </MobileCard>
);

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [refundForm] = Form.useForm();
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const [dashboardStats, setDashboardStats] = useState({
    total_bookings: 0,
    confirmed_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    booking_growth: 0,
    cancellation_rate: 0,
    average_booking_value: 0,
    total_participants: 0,
    average_participants_per_booking: 0,
  });

  const [filterParams, setFilterParams] = useState({
    status: "all",
    search: "",
    startDate: null,
    endDate: null,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [sortedInfo, setSortedInfo] = useState({
    order: "descend",
    columnKey: "booking_date",
  });

  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const refreshButtonRef = useRef(null);
  const screens = useBreakpoint();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Block scrolling when drawer is open on mobile
  useEffect(() => {
    if (isDetailDrawerVisible && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDetailDrawerVisible, isMobile]);

  const handleFilterChange = (updates) => {
    setFilterParams((prev) => ({ ...prev, ...updates }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const fetchBookings = useCallback(
    async (currentFilters, currentPagination, currentSorter) => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      try {
        const apiParams = {
          page: currentPagination.current,
          page_size: currentPagination.pageSize,
          search: currentFilters.search,
          status:
            currentFilters.status === "all" ? undefined : currentFilters.status,
          start_date: currentFilters.startDate?.format("YYYY-MM-DD"),
          end_date: currentFilters.endDate?.format("YYYY-MM-DD"),
          ordering:
            currentSorter.columnKey && currentSorter.order
              ? `${currentSorter.order === "descend" ? "-" : ""}${
                  currentSorter.columnKey
                }`
              : "-booking_date",
        };
        const response = await adminBookingService.getBookings(apiParams, {
          signal,
        });
        console.log("Bookings response:", response);
        if (response.success && response.data) {
          setBookings(response.data.results);
          setPagination((prev) => ({
            ...prev,
            total: response.data.count,
            current: currentPagination.current,
            pageSize: currentPagination.pageSize,
          }));
        } else if (!signal.aborted) {
          message.error(response.error || "Failed to load bookings");
        }
      } catch (error) {
        if (error.name !== "AbortError")
          message.error("An error occurred while fetching bookings");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBookings(filterParams, pagination, sortedInfo);
    }, 300);
    return () => clearTimeout(handler);
  }, [filterParams.search]);

  useEffect(() => {
    fetchBookings(filterParams, pagination, sortedInfo);
  }, [
    filterParams.status,
    filterParams.startDate,
    filterParams.endDate,
    pagination.current,
    pagination.pageSize,
    sortedInfo,
  ]);

  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const params = {
        start_date: filterParams.startDate?.format("YYYY-MM-DD"),
        end_date: filterParams.endDate?.format("YYYY-MM-DD"),
      };
      const response = await adminBookingService.getBookingAnalytics(params);
      if (response.success && response.data) {
        setDashboardStats(response.data);
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else {
        message.error(response.error || "Failed to load dashboard statistics");
      }
    } catch (error) {
      message.error("An error occurred while fetching dashboard data");
    } finally {
      setStatsLoading(false);
    }
  }, [filterParams.startDate, filterParams.endDate]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleTableChange = (p, f, sorter) => {
    setPagination(p);
    setSortedInfo(sorter);
  };

  const updateLocalBookingState = (updatedBooking) => {
    setBookings((currentBookings) =>
      currentBookings.map((b) =>
        b.id === updatedBooking.id ? updatedBooking : b
      )
    );
    setSelectedBooking(updatedBooking);
  };

  const showBookingDetails = async (booking) => {
    if (isDetailDrawerVisible) return;

    setIsDetailDrawerVisible(true);
    setDetailsLoading(true);
    setSelectedBooking(booking);

    try {
      const response = await adminBookingService.getBookingDetails(booking.id);
      if (response.success) {
        setSelectedBooking(response.data);
      } else {
        message.error(response.error || "Failed to load booking details");
        setIsDetailDrawerVisible(false);
      }
    } catch (e) {
      message.error("Error fetching details");
      setIsDetailDrawerVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenCancelModal = () => setIsCancelModalVisible(true);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setIsActionLoading(true);
    const response = await adminBookingService.cancelBooking(
      selectedBooking.id,
      { reason: cancelReason || "Cancelled by administrator" }
    );
    setIsActionLoading(false);
    setIsCancelModalVisible(false);
    setCancelReason("");
    if (response.success) {
      message.success("Booking cancelled successfully.");
      updateLocalBookingState(response.data);
      fetchDashboardStats();
    } else {
      message.error(response.error || "Failed to cancel booking.");
    }
  };

  const handleOpenRefundModal = () => {
    const payment = selectedBooking?.payment;
    if (payment) {
      refundForm.setFieldsValue({
        amount: payment.available_refund_amount,
      });
      setIsRefundModalVisible(true);
    }
  };

  const handleProcessRefund = async (values) => {
    if (!selectedBooking?.payment?.id) return;
    setIsActionLoading(true);
    const response = await paymentService.processRefund(
      selectedBooking.payment.id,
      { amount: values.amount, reason: "requested_by_customer" }
    );
    setIsActionLoading(false);
    if (response.success) {
      message.success("Refund processed successfully.");
      setIsRefundModalVisible(false);
      const updatedBookingResponse =
        await adminBookingService.getBookingDetails(selectedBooking.id);
      if (updatedBookingResponse.success) {
        updateLocalBookingState(updatedBookingResponse.data);
      }
      fetchDashboardStats();
    } else {
      message.error(response.error || "Failed to process refund.");
    }
  };

  const refreshData = () => {
    fetchBookings(filterParams, { ...pagination, current: 1 }, sortedInfo);
    fetchDashboardStats();
  };

  const handleExportData = async () => {
    message.loading({ content: "Preparing export...", key: "export" });
    const response = await adminBookingService.exportBookingsData(filterParams);
    if (!response.success)
      message.error({
        content: response.error || "Export failed",
        key: "export",
        duration: 2,
      });
    else
      message.success({
        content: "Export started!",
        key: "export",
        duration: 2,
      });
  };

  const handleButtonHover = useCallback((isEntering) => {
    const buttonNode = refreshButtonRef.current;
    if (!buttonNode) return;

    const icon = buttonNode.querySelector("lord-icon");
    if (!icon) return;

    try {
      if (isEntering) {
        if (icon.playerInstance) {
          icon.playerInstance.play();
        } else if (icon.player) {
          icon.player.play();
        } else {
          icon.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        }
      } else {
        if (icon.playerInstance) {
          icon.playerInstance.pause();
          icon.playerInstance.goToFirstFrame();
        } else if (icon.player) {
          icon.player.pause();
          icon.player.goToFirstFrame();
        } else {
          icon.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        }
      }
    } catch (error) {
      console.error("Lordicon animation failed:", error);
    }
  }, []);

  const statCardsData = [
    {
      title: "Total Bookings",
      icon: BookOpen,
      value: dashboardStats.total_bookings,
      growth: dashboardStats.booking_growth,
      footer: "vs last period",
      color: colors.info,
    },
    {
      title: "Confirmed Bookings",
      icon: CheckCircle,
      value: dashboardStats.confirmed_bookings,
      footer: `${
        dashboardStats.total_bookings > 0
          ? (
              (dashboardStats.confirmed_bookings /
                dashboardStats.total_bookings) *
              100
            ).toFixed(0)
          : "0"
      }% of total`,
      color: colors.success,
    },
    {
      title: "Avg. Booking Value",
      icon: DollarSign,
      value: Number(dashboardStats.average_booking_value).toFixed(2),
      footer: "Per successful booking",
      color: "#8b5cf6",
    },
    {
      title: "Total Participants",
      icon: Users,
      value: dashboardStats.total_participants,
      footer: "In confirmed bookings",
      color: colors.primary,
    },
    {
      title: "Cancellation Rate",
      icon: Percent,
      value: `${dashboardStats.cancellation_rate.toFixed(1)}%`,
      footer: "Of all bookings",
      color: colors.warning,
    },
  ];

  const columns = [
    {
      title: "Student",
      dataIndex: "user_name",
      key: "user",
      fixed: "left",
      width: 220,
      render: (_, r) => {
        const userName =
          r.user_name || r.user?.name || r.user_details?.name || "N/A";
        const userEmail =
          r.user_email || r.user?.email || r.user_details?.email || "";
        const userAvatar =
          r.user_avatar_thumb_url ||
          r.user?.avatar_thumb_url ||
          r.user_details?.avatar_thumb_url;
        return (
          <Space>
            <Avatar src={userAvatar}>{userName?.[0]}</Avatar>
            <div>
              <Text style={{ fontWeight: 500 }}>{userName}</Text>
              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {userEmail}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Class",
      dataIndex: "class_name",
      key: "class",
      width: 250,
      render: (_, r) => (
        <div>
          <Text style={{ fontWeight: 500 }}>{r.class_name}</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            {r.business_name}
          </Text>
        </div>
      ),
    },
    {
      title: "Participants",
      dataIndex: "participants",
      key: "participants",
      width: 100,
      align: "center",
      render: (val) => (val != null ? val : "—"),
    },
    {
      title: "Session Date",
      dataIndex: "date",
      key: "date",
      sorter: true,
      width: 150,
      render: (d) => formatDate(d),
      sortOrder:
        sortedInfo.columnKey === "schedule_instance__date" && sortedInfo.order,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      width: 140,
      render: getStatusTag,
      sortOrder: sortedInfo.columnKey === "status" && sortedInfo.order,
    },
    {
      title: "Payment",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 160,
      render: getPaymentStatusTag,
    },
    {
      title: "Amount",
      dataIndex: "amount_paid",
      key: "amount_paid",
      sorter: true,
      width: 120,
      align: "right",
      render: (val) => formatCurrency(val),
      sortOrder: sortedInfo.columnKey === "amount_paid" && sortedInfo.order,
    },
    {
      title: "Booked On",
      dataIndex: "booking_date",
      key: "booking_date",
      sorter: true,
      width: 180,
      defaultSortOrder: "descend",
      render: (d) => formatDateTime(d),
      sortOrder: sortedInfo.columnKey === "booking_date" && sortedInfo.order,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      align: "center",
      render: (_, r) => (
        <Button
          size="middle"
          icon={<Eye size={14} />}
          onClick={() => showBookingDetails(r)}
        >
          Details
        </Button>
      ),
    },
  ];

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Booking Management</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and analyze all bookings across the platform.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <ExportButton
              icon={<Download size={16} />}
              onClick={handleExportData}
            >
              {!isMobile && "Export Data"}
            </ExportButton>
            <RefreshButton
              ref={refreshButtonRef}
              onMouseEnter={() => handleButtonHover(true)}
              onMouseLeave={() => handleButtonHover(false)}
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                  playOnLoad={false}
                />
              }
              onClick={refreshData}
              loading={statsLoading || loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <div style={{ marginBottom: "20px" }}>
          <Text
            style={{
              fontSize: isMobile ? "16px" : "17px",
              fontWeight: 600,
              color: colors.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <BarChart2 size={20} color={colors.primary} /> Period Overview
          </Text>
          <Text
            style={{
              fontSize: isMobile ? "13px" : "15px",
              color: colors.textSecondary,
              display: "block",
              marginBottom: "16px",
            }}
          >
            Key operational metrics for the selected date range.{" "}
            <Text strong>
              {filterParams.startDate?.format("MMM D, YYYY")} -{" "}
              {filterParams.endDate?.format("MMM D, YYYY")}
            </Text>
          </Text>
        </div>

        <StatsGrid>
          {statCardsData.map((stat) => (
            <StatCard key={stat.title}>
              {statsLoading ? (
                <StatSkeleton />
              ) : (
                <>
                  <div>
                    <StatCardHeader>
                      <IconContainer
                        background={hexToRgba(stat.color, 0.1)}
                        color={stat.color}
                      >
                        <stat.icon size={18} />
                      </IconContainer>
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <StatValue>
                    {stat.title === "Avg. Booking Value" ? (
                      <NumberFlow
                        value={
                          isReadyForAnimation ? parseFloat(stat.value) || 0 : 0
                        }
                        duration={800}
                        prefix="$"
                        numberFormatOptions={{
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }}
                      />
                    ) : stat.title.includes("Rate") ||
                      stat.title.includes("%") ? (
                      stat.value
                    ) : (
                      <NumberFlow
                        value={
                          isReadyForAnimation ? parseFloat(stat.value) || 0 : 0
                        }
                        duration={800}
                      />
                    )}
                  </StatValue>
                  {stat.growth !== undefined && (
                    <StatFooter>
                      <PercentChange isPositive={stat.growth >= 0}>
                        {stat.growth >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {`${stat.growth.toFixed(1)}%`}
                      </PercentChange>
                      {stat.footer}
                    </StatFooter>
                  )}
                  {stat.footer && stat.growth === undefined && (
                    <StatFooter>{stat.footer}</StatFooter>
                  )}
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <Users />
              All Bookings
            </TableTitle>
            <TableDescription>
              Complete list of bookings with filtering and search capabilities.
            </TableDescription>
          </TableHeader>

          <FilterBar>
            <SearchFilterContainer>
              <Input
                ref={searchInputRef}
                placeholder="Search name, email, class..."
                allowClear
                onSearch={(val) => handleFilterChange({ search: val })}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
              />
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 180 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="pending">Pending</Option>
              </Select>
              <RangePicker
                value={[filterParams.startDate, filterParams.endDate]}
                onChange={(dates) =>
                  handleFilterChange({
                    startDate: dates?.[0],
                    endDate: dates?.[1],
                  })
                }
                style={{ width: isMobile ? "100%" : "auto" }}
              />
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : bookings.length > 0 ? (
                <>
                  {bookings.map((booking) => (
                    <MobileBookingItem
                      key={booking.id}
                      booking={booking}
                      onViewDetails={showBookingDetails}
                    />
                  ))}
                  {pagination.total > pagination.pageSize && (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                      <Button
                        onClick={() =>
                          handleTableChange({
                            ...pagination,
                            current: pagination.current + 1,
                          })
                        }
                        disabled={
                          pagination.current * pagination.pageSize >=
                          pagination.total
                        }
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Empty description="No bookings found with current filters." />
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={bookings}
              rowKey="id"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{
                ...pagination,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} bookings`,
              }}
              onChange={handleTableChange}
              scroll={{ x: 1400 }}
              locale={{
                emptyText: (
                  <Empty description="No bookings found with current filters." />
                ),
              }}
            />
          )}
        </TableSection>

        <DetailDrawerModal
          isVisible={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
          booking={selectedBooking}
          isLoading={detailsLoading}
          isMobile={isMobile}
          onOpenCancelModal={handleOpenCancelModal}
          onOpenRefundModal={handleOpenRefundModal}
          isActionLoading={isActionLoading}
        />

        <Modal
          title="Cancel Booking"
          open={isCancelModalVisible}
          onOk={handleCancelBooking}
          onCancel={() => setIsCancelModalVisible(false)}
          confirmLoading={isActionLoading}
          okText="Confirm Cancellation"
          okButtonProps={{ danger: true }}
          zIndex={1060}
        >
          <Paragraph>
            You are about to cancel this booking. This action will notify the
            user and flag the booking for a refund if applicable.
          </Paragraph>
          <Input.TextArea
            rows={3}
            placeholder="Provide a reason for cancellation (optional, but recommended)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </Modal>

        <Modal
          title="Process Refund"
          open={isRefundModalVisible}
          onCancel={() => setIsRefundModalVisible(false)}
          footer={null}
          destroyOnClose
          zIndex={1060}
          width={400}
        >
          {selectedBooking?.payment && (
            <Form
              form={refundForm}
              layout="vertical"
              onFinish={handleProcessRefund}
              initialValues={{
                amount: selectedBooking.payment.available_refund_amount,
              }}
            >
              <Alert
                message="Refund reason: Requested by customer"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{ marginBottom: 16, fontSize: 13, color: colors.textSecondary }}>
                Available to refund:{" "}
                <strong style={{ color: colors.textPrimary }}>
                  {formatCurrency(selectedBooking.payment.available_refund_amount)}
                </strong>
              </div>
              <Form.Item
                name="amount"
                label="Refund amount"
                rules={[
                  { required: true, message: "Enter refund amount." },
                  { type: "number", min: 0.01, message: "Must be greater than 0." },
                  {
                    type: "number",
                    max: selectedBooking.payment.available_refund_amount,
                    message: "Cannot exceed available amount.",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.01}
                  max={selectedBooking.payment.available_refund_amount}
                  step={0.01}
                  precision={2}
                  addonBefore="$"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isActionLoading}
                  block
                  key={isActionLoading ? "loading" : "idle"}
                >
                  Submit Refund
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BookingsList;
