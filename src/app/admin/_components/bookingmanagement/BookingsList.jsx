"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useReplaceSearchParams } from "@/hooks/useUrlState";
import styled from "styled-components";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import NumberFlow from "@number-flow/react";
import {
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
import { LordIcon } from "@/services/ReactUtils";
import AdminMetricCards from "../shared/AdminMetricCards";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { AdminCompactTable } from "../shared/AdminCompactTable";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import {
  AdminTableSkeleton,
  AdminMetricCardsSkeleton,
  SkeletonBlock,
} from "../shared/AdminSkeletons";
import { adminColors as colors } from "../shared/adminColors";
import {
  hexToRgba,
  formatCurrency,
  formatDate,
  formatDatetime as formatDateTime,
  formatAdminPaymentMethodDisplay,
  getAdminStripePaymentLinks,
} from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBar,
  SearchFilterContainer,
} from "../shared/adminTableStyles";
import {
  ActionButtonsContainerWideMobile as ActionButtonsContainer,
  RefreshButton,
  ExportButton,
} from "../shared/AdminButtons";
import {
  MobileCard,
  MobileCardContent,
  MobileCardRow,
  MobileCardLabel,
} from "../shared/adminMobileStyles";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Text, Title: AntTitle, Paragraph } = Typography;

// --- MAIN PAGE COMPONENTS (STYLED LIKE PAYOUTS) ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
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

// --- STATS CARDS ---
// --- TABLE SECTION ---
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

const DrawerTwoCol = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;
const DrawerLeftCol = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  @media (max-width: 768px) {
    padding: 14px;
  }
`;
const DrawerRightCol = styled.div`
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-left: 1px solid ${colors.border};
  padding: 16px;
  overflow-y: auto;
  @media (max-width: 768px) {
    width: 100%;
    border-left: none;
    border-top: 1px solid ${colors.border};
    padding: 14px;
  }
`;
const BookerViewCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${colors.border};
  margin-bottom: 16px;
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

const DrawerInfoCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  padding: 16px;
  margin-bottom: 12px;
`;

const DrawerInfoCardTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`;

const FeeBreakdownBar = styled.div`
  display: flex;
  height: 28px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: ${colors.border};
`;

const FeeSegment = styled.div`
  height: 100%;
  min-width: 2px;
  background: ${(p) => p.$color || colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
`;

const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid ${colors.border};
  &:last-child {
    border-bottom: none;
    font-weight: 700;
    color: ${colors.textPrimary};
    font-size: 14px;
    padding-top: 8px;
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

// --- UTILITY FUNCTIONS ---
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
  isMobile,
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

  const stripeProcessingResolved = payment
    ? (() => {
        const raw = payment.stripe_processing_fee;
        if (raw != null && raw !== "") {
          const n = Number(raw);
          if (!Number.isNaN(n)) {
            return { amount: Math.max(0, n), estimated: false };
          }
        }
        const gross = Number(payment.amount || 0);
        return {
          amount: Math.max(0, gross * 0.029 + 0.3),
          estimated: true,
        };
      })()
    : { amount: 0, estimated: true };

  const paymentFeeBreakdown =
    payment &&
    (() => {
      const gross = Number(payment.amount || 0);
      const platformFee = Number(payment.platform_fee_amount || 0);
      const platTax = Number(payment.platform_fee_tax || 0);
      const stripeAmt = stripeProcessingResolved.amount;
      const net = Number(payment.net_payout_amount || 0);
      return { gross, platformFee, platTax, stripeAmt, net };
    })();

  const bookerCard = (
    <BookerViewCard>
      <StudentAvatar src={booking.user_details?.avatar_medium_url}>
        {(booking.user_name || "?")[0]}
      </StudentAvatar>
      <div style={{ minWidth: 0 }}>
        <AntTitle level={5} style={{ margin: 0, fontSize: 15 }}>
          {booking.user_name || "Booker name unavailable"}
        </AntTitle>
        <Text type="secondary" style={{ fontSize: 13 }}>{booking.user_email || "—"}</Text>
        {booking.user_phone_number && (
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{booking.user_phone_number}</Text>
        )}
      </div>
    </BookerViewCard>
  );

  if (isLoading) {
    return <BookingDrawerSkeleton isMobile={isMobile} />;
  }

  const mainContent = (
    <>
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
              <>
                <InfoGroup>
                  <InfoGroupTitle>
                    <CreditCard />
                    Payment Details
                  </InfoGroupTitle>
                  <InfoGrid>
                    {(() => {
                      const stripeLinks = getAdminStripePaymentLinks(payment);
                      const methodLabel =
                        formatAdminPaymentMethodDisplay(payment) || "N/A";
                      return (
                        <>
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
                        <InfoValue>{methodLabel}</InfoValue>
                      </InfoContent>
                    </InfoItem>
                    <InfoItem style={{ gridColumn: "1 / -1" }}>
                      <InfoIcon>
                        <ExternalLink />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Stripe</InfoLabel>
                        <InfoValue>
                          {stripeLinks.receiptUrl ? (
                            <Button
                              type="link"
                              style={{ padding: 0, height: "auto" }}
                              href={stripeLinks.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View customer receipt
                            </Button>
                          ) : stripeLinks.dashboardUrl ? (
                            <Button
                              type="link"
                              style={{ padding: 0, height: "auto" }}
                              href={stripeLinks.dashboardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open in Stripe Dashboard
                            </Button>
                          ) : (
                            <Text type="secondary">No receipt link available</Text>
                          )}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                        </>
                      );
                    })()}
                  </InfoGrid>
                </InfoGroup>

                <DrawerInfoCard>
                  <DrawerInfoCardTitle>Payout model</DrawerInfoCardTitle>
                  <p style={{ margin: 0, fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                    Marketplace default: ClassEasily commission is platform revenue. Stripe card fees
                    {stripeProcessingResolved.estimated ? " (estimated below)" : ""} reduce the host&apos;s net payout.
                  </p>
                </DrawerInfoCard>

                {paymentFeeBreakdown && (
                  <DrawerInfoCard>
                    <DrawerInfoCardTitle>Fee breakdown</DrawerInfoCardTitle>
                    {paymentFeeBreakdown.gross > 0 && (
                      <FeeBreakdownBar>
                        <FeeSegment
                          $color={colors.success}
                          style={{
                            width: `${(paymentFeeBreakdown.net / paymentFeeBreakdown.gross) * 100}%`,
                          }}
                          title={`Net: ${formatCurrency(paymentFeeBreakdown.net)}`}
                        >
                          {((paymentFeeBreakdown.net / paymentFeeBreakdown.gross) * 100).toFixed(0)}%
                        </FeeSegment>
                        <FeeSegment
                          $color={colors.warning}
                          style={{
                            width: `${(paymentFeeBreakdown.platformFee / paymentFeeBreakdown.gross) * 100}%`,
                          }}
                          title={`Platform: ${formatCurrency(paymentFeeBreakdown.platformFee)}`}
                        >
                          {((paymentFeeBreakdown.platformFee / paymentFeeBreakdown.gross) * 100).toFixed(0)}%
                        </FeeSegment>
                        <FeeSegment
                          $color={colors.error}
                          style={{
                            width: `${(paymentFeeBreakdown.stripeAmt / paymentFeeBreakdown.gross) * 100}%`,
                          }}
                          title={`Stripe: ${formatCurrency(paymentFeeBreakdown.stripeAmt)}`}
                        >
                          {((paymentFeeBreakdown.stripeAmt / paymentFeeBreakdown.gross) * 100).toFixed(0)}%
                        </FeeSegment>
                      </FeeBreakdownBar>
                    )}
                    <FeeRow>
                      <span style={{ color: colors.textSecondary }}>Gross amount</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(paymentFeeBreakdown.gross)}</span>
                    </FeeRow>
                    <FeeRow>
                      <span style={{ color: colors.textSecondary }}>Platform commission</span>
                      <span style={{ color: colors.error }}>
                        - {formatCurrency(paymentFeeBreakdown.platformFee)}
                      </span>
                    </FeeRow>
                    {paymentFeeBreakdown.platTax > 0.009 && (
                      <FeeRow>
                        <span style={{ color: colors.textSecondary }}>Tax on platform fee (HST)</span>
                        <span style={{ color: colors.error }}>
                          - {formatCurrency(paymentFeeBreakdown.platTax)}
                        </span>
                      </FeeRow>
                    )}
                    <FeeRow>
                      <span style={{ color: colors.textSecondary }}>
                        Stripe processing
                        {stripeProcessingResolved.estimated ? " (est.)" : ""}
                      </span>
                      <span style={{ color: colors.error }}>
                        - {formatCurrency(paymentFeeBreakdown.stripeAmt)}
                      </span>
                    </FeeRow>
                    <FeeRow>
                      <span>Net payout to business</span>
                      <span style={{ color: colors.success }}>
                        {formatCurrency(paymentFeeBreakdown.net)}
                      </span>
                    </FeeRow>
                  </DrawerInfoCard>
                )}
              </>
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

            {(booking.participants != null && booking.participants > 0) && (
              <InfoGroup>
                <InfoGroupTitle>
                  <Users />
                  Participant{booking.participants !== 1 ? "s" : ""}
                </InfoGroupTitle>
                <InfoValue>
                  {booking.participant_details?.[0]?.name
                    ? `Booked by ${booking.participant_details[0].name} · ${booking.participants} spot${booking.participants !== 1 ? "s" : ""}`
                    : `${booking.participants} participant${booking.participants !== 1 ? "s" : ""}`}
                </InfoValue>
              </InfoGroup>
            )}
    </>
  );

  if (isMobile) {
    return (
      <DrawerLeftCol>
        {bookerCard}
        {mainContent}
      </DrawerLeftCol>
    );
  }
  return (
    <DrawerTwoCol>
      <DrawerLeftCol>{mainContent}</DrawerLeftCol>
      <DrawerRightCol>
        {bookerCard}
        {payment && (
          <InfoGroup>
            <InfoGroupTitle><CreditCard size={14} /> Payment</InfoGroupTitle>
            <InfoGrid>
              <InfoItem>
                <InfoContent>
                  <InfoLabel>Amount</InfoLabel>
                  <InfoValue>{formatCurrency(payment.amount)}</InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoContent>
                  <InfoLabel>Status</InfoLabel>
                  <InfoValue>{getPaymentStatusTag(booking.payment_status)}</InfoValue>
                </InfoContent>
              </InfoItem>
            </InfoGrid>
          </InfoGroup>
        )}
      </DrawerRightCol>
    </DrawerTwoCol>
  );
};

const BookingDrawerSkeleton = ({ isMobile }) => (
  <div style={{ padding: 16, background: colors.lightBg }}>
    <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBlock style={{ height: 14, width: 160, marginBottom: 16 }} />
        <SkeletonBlock style={{ height: 220, width: "100%", marginBottom: 16 }} />
        <SkeletonBlock style={{ height: 14, width: 200, marginBottom: 12 }} />
        <SkeletonBlock style={{ height: 140, width: "100%", marginBottom: 16 }} />
        <SkeletonBlock style={{ height: 14, width: 140, marginBottom: 12 }} />
        <SkeletonBlock style={{ height: 180, width: "100%", marginBottom: 16 }} />
        <SkeletonBlock style={{ height: 14, width: 120, marginBottom: 12 }} />
        <SkeletonBlock style={{ height: 160, width: "100%" }} />
      </div>
      {!isMobile && (
        <div style={{ width: 260, flexShrink: 0 }}>
          <SkeletonBlock style={{ height: 100, width: "100%", marginBottom: 16 }} />
          <SkeletonBlock style={{ height: 120, width: "100%" }} />
        </div>
      )}
    </div>
  </div>
);

const DetailDrawerModal = ({ open, onClose, booking, isLoading, isMobile, onOpenCancelModal, onOpenRefundModal, isActionLoading }) => {
  if (!booking) return null;

  const { payment } = booking;

  const refundDisabled =
    !payment ||
    !(payment.available_refund_amount > 0) ||
    isActionLoading;

  const refundDisabledReason = !payment
    ? "No payment record for this booking."
    : !(payment.available_refund_amount > 0)
      ? payment.refunded_amount > 0
        ? "This payment has already been fully refunded."
        : "No refundable amount remains for this payment status."
      : isActionLoading
        ? "Please wait for the current action to finish."
        : null;

  const drawerFooter = (
    <>
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
      <Tooltip title={refundDisabled ? refundDisabledReason : null}>
        <span style={{ display: "inline-block" }}>
          <Button
            type="primary"
            icon={<DollarSign size={16} />}
            onClick={onOpenRefundModal}
            disabled={refundDisabled}
          >
            Process Refund
          </Button>
        </span>
      </Tooltip>
    </>
  );

  return (
    <AdminResponsiveDrawer
      open={open}
      onClose={onClose}
      title={`Booking: ${booking?.user_facing_reference || `#${booking?.id || ""}`}`}
      titleIcon={<Hash size={20} style={{ color: colors.primary }} />}
      isMobile={isMobile}
      width="860px"
      dense
      footer={drawerFooter}
      showCopyLink
    >
      <DrawerScrollContent>
        <DetailDrawerContent
          booking={booking}
          isLoading={isLoading}
          isMobile={isMobile}
          onOpenCancelModal={onOpenCancelModal}
          onOpenRefundModal={onOpenRefundModal}
          isActionLoading={isActionLoading}
        />
      </DrawerScrollContent>
    </AdminResponsiveDrawer>
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
  const searchParams = useSearchParams();
  const replaceParams = useReplaceSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
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
  const bookingDeepLinkLastIdRef = useRef("");
  const screens = useBreakpoint();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Block scrolling when drawer is open on mobile
  useEffect(() => {
    if (detailDrawerOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [detailDrawerOpen, isMobile]);

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
        if (response.success && response.data) {
          setBookings(response.data.results || []);
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
      const params =
        filterParams.startDate && filterParams.endDate
          ? {
              start_date: filterParams.startDate.format("YYYY-MM-DD"),
              end_date: filterParams.endDate.format("YYYY-MM-DD"),
            }
          : { all_time: true };
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
    if (detailDrawerOpen) return;

    setDetailDrawerOpen(true);
    setDetailsLoading(true);
    setSelectedBooking(booking);
    replaceParams({
      bookingId: String(booking.id),
      id: null,
    });

    try {
      const response = await adminBookingService.getBookingDetails(booking.id);
      if (response.success) {
        setSelectedBooking(response.data);
        replaceParams({
          bookingId: String(response.data.id),
          id: null,
        });
      } else {
        message.error(response.error || "Failed to load booking details");
        setDetailDrawerOpen(false);
        replaceParams({ bookingId: null, id: null });
      }
    } catch (e) {
      message.error("Error fetching details");
      setDetailDrawerOpen(false);
      replaceParams({ bookingId: null, id: null });
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const rawId =
      searchParams.get("bookingId") || searchParams.get("id");
    if (!rawId) {
      bookingDeepLinkLastIdRef.current = "";
      return;
    }
    if (bookingDeepLinkLastIdRef.current === rawId) return;
    const bookingId = parseInt(rawId, 10);
    if (Number.isNaN(bookingId)) return;
    bookingDeepLinkLastIdRef.current = rawId;
    showBookingDetails({ id: bookingId });
    replaceParams({ bookingId: String(bookingId), id: null });
  }, [searchParams, replaceParams]);

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
    if (response.success) {
      message.success({
        content: "Export started!",
        key: "export",
        duration: 2,
      });
    } else if (response.status === 413) {
      message.warning({
        content:
          response.error ||
          "Export exceeds the row limit. Narrow your filters and try again.",
        key: "export",
        duration: 5,
      });
    } else {
      message.error({
        content: response.error || "Export failed",
        key: "export",
        duration: 2,
      });
    }
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

  const totalRevenue = dashboardStats.total_confirmed_revenue ?? null;
  const platformFees = dashboardStats.total_platform_fees ?? null;
  const stripeFees = dashboardStats.total_stripe_fees ?? 0;
  const statsRangeLabel =
    filterParams.startDate && filterParams.endDate
      ? `${filterParams.startDate.format("MMM D, YYYY")} – ${filterParams.endDate.format("MMM D, YYYY")}`
      : "All time";

  const metricsPeriodBadge =
    filterParams.startDate && filterParams.endDate ? "Period" : "All-time";

  const statCardsData = [
    {
      title: "Total Bookings",
      icon: BookOpen,
      value: dashboardStats.total_bookings,
      growth: dashboardStats.booking_growth,
      footer: "vs last period",
      color: colors.info,
      isCurrency: false,
      periodBadge: metricsPeriodBadge,
    },
    {
      title: "Confirmed",
      icon: CheckCircle,
      value: dashboardStats.confirmed_bookings,
      footer: `${dashboardStats.total_bookings > 0 ? ((dashboardStats.confirmed_bookings / dashboardStats.total_bookings) * 100).toFixed(0) : "0"}% of total`,
      color: colors.success,
      isCurrency: false,
      periodBadge: metricsPeriodBadge,
    },
    {
      title: "Cancelled",
      icon: XCircle,
      value: dashboardStats.cancelled_bookings ?? 0,
      footer: `${dashboardStats.cancellation_rate?.toFixed(1) ?? "0"}% cancellation rate`,
      color: colors.error,
      isCurrency: false,
      periodBadge: metricsPeriodBadge,
    },
    {
      title: "Pending",
      icon: Clock,
      value: dashboardStats.total_bookings - (dashboardStats.confirmed_bookings ?? 0) - (dashboardStats.cancelled_bookings ?? 0),
      footer: "Awaiting confirmation",
      color: colors.warning,
      isCurrency: false,
      periodBadge: metricsPeriodBadge,
    },
    {
      title: "Gross Revenue",
      icon: DollarSign,
      value: totalRevenue,
      growth: dashboardStats.revenue_growth ?? null,
      footer: "Total GMV",
      color: "#8b5cf6",
      isCurrency: true,
      periodBadge: metricsPeriodBadge,
    },
    {
      title: "Platform Commission",
      icon: Percent,
      value: platformFees,
      footer: "Collected by platform",
      color: colors.info,
      isCurrency: true,
      periodBadge: metricsPeriodBadge,
    },
    {
      title: "Stripe Fees",
      icon: CreditCard,
      value: stripeFees,
      footer: "Recorded on payments (passthrough to hosts)",
      color: colors.textSecondary,
      isCurrency: true,
      periodBadge: metricsPeriodBadge,
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
            <BarChart2 size={20} color={colors.primary} />{" "}
            {filterParams.startDate && filterParams.endDate
              ? "Period overview"
              : "All-time overview"}
          </Text>
          <Text
            style={{
              fontSize: isMobile ? "13px" : "15px",
              color: colors.textSecondary,
              display: "block",
              marginBottom: "16px",
            }}
          >
            Key operational metrics for the selected range.{" "}
            <Text strong>{statsRangeLabel}</Text>
          </Text>
        </div>

        {statsLoading ? (
          <AdminMetricCardsSkeleton count={7} />
        ) : (
          <AdminMetricCards
            cards={statCardsData.map((card) => ({
              ...card,
              minimumFractionDigits: card.isCurrency ? 0 : undefined,
              maximumFractionDigits: card.isCurrency ? 0 : undefined,
            }))}
            isReadyForAnimation={isReadyForAnimation}
          />
        )}

        <Divider />

        <TableSection>
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
              {isMobile ? (
                <MobileDateRangePicker
                  allowClear
                  value={
                    filterParams.startDate && filterParams.endDate
                      ? [filterParams.startDate, filterParams.endDate]
                      : null
                  }
                  onChange={(dates) =>
                    handleFilterChange({
                      startDate: dates?.[0] ?? null,
                      endDate: dates?.[1] ?? null,
                    })
                  }
                  format="MMM D, YYYY"
                />
              ) : (
                <RangePicker
                  value={[filterParams.startDate, filterParams.endDate]}
                  onChange={(dates) =>
                    handleFilterChange({
                      startDate: dates?.[0],
                      endDate: dates?.[1],
                    })
                  }
                  style={{ width: "auto" }}
                />
              )}
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <AdminTableSkeleton rows={5} />
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
          ) : loading ? (
            <AdminTableSkeleton rows={8} />
          ) : (
            <AdminCompactTable
              columns={columns}
              dataSource={bookings}
              rowKey="id"
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
          open={detailDrawerOpen}
          onClose={() => {
            setDetailDrawerOpen(false);
            replaceParams({ bookingId: null, id: null });
            bookingDeepLinkLastIdRef.current = "";
          }}
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
            Cancel booking{" "}
            <strong>
              {selectedBooking?.user_facing_reference ||
                `#${selectedBooking?.id}`}
            </strong>
            {selectedBooking?.class_name ? (
              <>
                {" "}
                for <strong>{selectedBooking.class_name}</strong>
              </>
            ) : null}
            ? This will notify the user and flag the booking for a refund if
            applicable.
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
