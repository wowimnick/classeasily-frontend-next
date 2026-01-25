"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  Typography,
  Divider,
  Tag,
  Avatar,
  Button,
  Popconfirm,
  Space,
  List,
  ConfigProvider,
  Skeleton,
  Timeline,
} from "antd";
import message from "@/lib/message";
import {
  User,
  BookOpen as BookIcon,
  Clock,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  UserCheck,
  Hash,
  Repeat,
  XCircle,
  ExternalLink,
  Users as UsersIcon,
  UserCircle2,
  DollarSign,
  Info,
  Building,
  CreditCard,
  AlertTriangle,
  Check,
  CheckCircle,
  FileText,
  X,
} from "lucide-react";
import { bookingService } from "@/services/apiService";
import {
  formatUTCToUserDisplay,
  formatBusinessLocalToUserDisplay,
  formatPhoneNumber,
} from "@/services/utils";
import { theme as appTheme } from "@/components/theme";
import { Drawer } from "vaul";

const { Text, Title, Paragraph } = Typography;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#e5e7eb",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0px); }
`;

// Vaul Drawer Styles for Mobile
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 90%;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

// Vaul Drawer Styles - Desktop (Right Side)
const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 680px;
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
  will-change: transform;
  transform: translateZ(0);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

const DrawerHeader = styled.div`
  background: white;
  border-bottom: 1px solid ${colors.border};
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const DrawerHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${colors.textPrimary};
  font-size: 20px;
  font-weight: 600;
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: ${colors.border};
  }
`;

const DrawerContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

const HeaderSection = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeIn} 0.3s ease-out;
  @media (max-width: 480px) {
    padding: 16px;
    gap: 12px;
  }
`;

const GuestAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: ${(props) => (props.$hasImage ? "transparent" : colors.primary)};
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
`;

const GuestInfo = styled.div`
  flex: 1;
`;

const GuestName = styled(Title).attrs({ level: 4 })`
  margin: 0 0 2px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  font-size: 18px !important;
  @media (max-width: 480px) {
    font-size: 16px !important;
  }
`;

const GuestEmail = styled(Text)`
  color: ${colors.textSecondary};
  font-size: 14px;
  display: block;
  margin-bottom: 6px;
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  background: white;
  border-top: 1px solid ${colors.border};
  flex-shrink: 0;
  @media (max-width: 480px) {
    padding: 12px 16px;
  }
`;

const ContentBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;

  animation: ${fadeIn} 0.5s 0.1s ease-out both;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @media (max-width: 768px) {
    padding: 16px;
  }
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 480px) {
    padding: 16px;
    margin-bottom: 16px;
  }
`;

const CancellationInfoGroup = styled(InfoGroup)`
  border-color: ${colors.error};
  background-color: #fff5f5;
`;

const InfoGroupTitle = styled(Title).attrs({ level: 5 })`
  color: ${colors.textPrimary};
  margin-bottom: 16px !important;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px !important;
  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }
  @media (max-width: 480px) {
    font-size: 15px !important;
    margin-bottom: 12px !important;
  }
`;

const CancellationInfoTitle = styled(InfoGroupTitle)`
  color: ${colors.error};
  svg {
    color: ${colors.error};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px 18px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  width: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  svg {
    width: 17px;
    height: 17px;
  }
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled(Text)`
  color: ${colors.textSecondary};
  display: block;
  font-size: 13px;
  margin-bottom: 3px;
  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const InfoValue = styled(Text)`
  color: ${colors.textPrimary};
  font-weight: 500;
  display: block;
  word-break: break-word;
  font-size: 14px;
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const StatusTag = styled(Tag)`
  border-radius: 6px;
  padding: 3px 10px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  margin: 0;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  @media (max-width: 480px) {
    flex-direction: column-reverse;
    .ant-btn {
      width: 100%;
    }
  }
`;

// Skeleton Components
const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: ${(props) => props.marginBottom || "0"};

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonCircle = styled(SkeletonLine)`
  border-radius: 50%;
  width: ${(props) => props.size || "60px"};
  height: ${(props) => props.size || "60px"};
  margin-bottom: 0;
  flex-shrink: 0;
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 24px;
  width: ${(props) => props.width || "80px"};
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 0;
`;

const SkeletonHeaderSection = () => (
  <HeaderSection>
    <SkeletonCircle size="60px" />
    <GuestInfo>
      <SkeletonLine width="60%" height="20px" marginBottom="8px" />
      <SkeletonLine width="80%" height="14px" marginBottom="8px" />
      <SkeletonTag width="90px" />
    </GuestInfo>
  </HeaderSection>
);

const SkeletonInfoItem = () => (
  <InfoItem>
    <InfoIcon style={{ opacity: 0.2 }}>
      <SkeletonCircle size="20px" />
    </InfoIcon>
    <InfoContent>
      <SkeletonLine width="40%" height="12px" marginBottom="8px" />
      <SkeletonLine width="70%" height="14px" />
    </InfoContent>
  </InfoItem>
);

const SkeletonInfoGroup = ({ icon, title, itemCount = 2 }) => (
  <InfoGroup>
    <InfoGroupTitle>
      {icon} {title}
    </InfoGroupTitle>
    <InfoGrid>
      {Array.from({ length: itemCount }).map((_, index) => (
        <SkeletonInfoItem key={index} />
      ))}
    </InfoGrid>
  </InfoGroup>
);

const SkeletonContent = () => (
  <>
    <SkeletonHeaderSection />
    <ContentBody>
      {/* Experience & Schedule - 4 items */}
      <InfoGroup>
        <InfoGroupTitle style={{ opacity: 0.5 }}>
          <BookIcon /> Experience & Schedule
        </InfoGroupTitle>
        <InfoGrid>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <BookIcon size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Experience</InfoLabel>
              <SkeletonLine width="80%" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Calendar size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Date & Time (Business Timezone)</InfoLabel>
              <SkeletonLine width="85%" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Clock size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Duration</InfoLabel>
              <SkeletonLine width="50%" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Building size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Business</InfoLabel>
              <SkeletonLine width="70%" height="16px" />
            </InfoContent>
          </InfoItem>
        </InfoGrid>
      </InfoGroup>

      {/* Guests - 2 items + participant list */}
      <InfoGroup>
        <InfoGroupTitle style={{ opacity: 0.5 }}>
          <UsersIcon /> Guests
        </InfoGroupTitle>
        <InfoGrid>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Mail size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Booker Email</InfoLabel>
              <SkeletonLine width="85%" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Phone size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Booker Phone</InfoLabel>
              <SkeletonLine width="60%" height="16px" />
            </InfoContent>
          </InfoItem>
        </InfoGrid>
        <Divider style={{ margin: "20px 0 16px" }} />
        <div style={{ marginBottom: "12px" }}>
          <SkeletonLine width="150px" height="16px" />
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              padding: "12px 0",
              borderBottom: i === 1 ? `1px solid ${colors.border}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <SkeletonCircle size="40px" />
              <div style={{ flex: 1 }}>
                <SkeletonLine width="140px" height="14px" marginBottom="6px" />
                <SkeletonLine width="180px" height="12px" />
              </div>
            </div>
          </div>
        ))}
      </InfoGroup>

      {/* Booking Information - 4 items (all shown in skeleton) */}
      <InfoGroup>
        <InfoGroupTitle style={{ opacity: 0.5 }}>
          <FileText /> Booking Information
        </InfoGroupTitle>
        <InfoGrid>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Hash size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Reference Code</InfoLabel>
              <SkeletonLine width="90px" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Calendar size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Booked On (User's Time)</InfoLabel>
              <SkeletonLine width="80%" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Repeat size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Booking Type</InfoLabel>
              <SkeletonTag width="100px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <MessageSquare size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Notes from Booker</InfoLabel>
              <SkeletonLine width="100%" height="14px" marginBottom="4px" />
              <SkeletonLine width="80%" height="14px" />
            </InfoContent>
          </InfoItem>
        </InfoGrid>
      </InfoGroup>

      {/* Payment & Transaction - 4 items (all shown in skeleton) */}
      <InfoGroup>
        <InfoGroupTitle style={{ opacity: 0.5 }}>
          <CreditCard /> Payment & Transaction
        </InfoGroupTitle>
        <InfoGrid>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <Info size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Payment Status</InfoLabel>
              <SkeletonTag width="80px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <DollarSign size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Gross Amount</InfoLabel>
              <SkeletonLine width="80px" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <CreditCard size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Payment Method</InfoLabel>
              <SkeletonLine width="65%" height="16px" />
            </InfoContent>
          </InfoItem>
          <InfoItem>
            <InfoIcon style={{ opacity: 0.3 }}>
              <ExternalLink size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Payment Receipt</InfoLabel>
              <SkeletonLine width="110px" height="32px" />
            </InfoContent>
          </InfoItem>
        </InfoGrid>
      </InfoGroup>
    </ContentBody>
  </>
);

const NoDataText = styled(Text)`
  color: #9ca3af;
  font-style: italic;
`;

const BookingTypeTag = styled(Tag)`
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  font-weight: 500;
  &.single {
    background: #e0e7ff;
    color: #3730a3;
    border-color: #c7d2fe;
  }
  &.course {
    background: #d1fae5;
    color: #047857;
    border-color: #a7f3d0;
  }
`;

const GuestListItem = styled(List.Item)`
  padding: 12px 0 !important;
  border-bottom: 1px solid ${colors.border} !important;
  &:last-child {
    border-bottom: none !important;
  }
  .ant-list-item-meta-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px !important;
  }
`;

const BookingDetailsDrawer = ({
  visible,
  onClose,
  bookingId,
  onBookingCancel,
  onReschedule,
}) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!bookingId) {
        setBooking(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await bookingService.getBookingDetails(bookingId);
        if (result.success) {
          setBooking(result.data);
        } else {
          setError(result.error || "Failed to load booking details.");
          message.error(result.error || "Failed to load booking details.");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        message.error("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (visible && bookingId) {
      fetchDetails();
    } else if (!visible) {
      setBooking(null);
    }
  }, [bookingId, visible]);

  const handleInternalCancel = async () => {
    if (!booking?.id) return;
    setIsCancelling(true);
    try {
      const result = await bookingService.businessCancelBooking(
        booking.id,
        "Cancelled by business user",
      );
      if (result.success) {
        message.success("Booking successfully cancelled");
        onBookingCancel?.(result.data);
        onClose();
      } else {
        message.error(result.error || "Cancellation failed.");
      }
    } catch (e) {
      message.error("An error occurred during cancellation.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleClick = () => {
    if (booking) {
      onReschedule(booking);
      onClose();
    }
  };

  const getStatusTag = (status, paymentStatus) => {
    let color = colors.textSecondary,
      bgColor = colors.lightBg,
      icon = <Info size={12} />,
      statusText = status?.toUpperCase() || "UNKNOWN";

    switch (status?.toLowerCase()) {
      case "confirmed":
        color = colors.info;
        bgColor = "#eff6ff";
        icon = <UserCheck size={12} />;
        if (paymentStatus === "refund_pending") {
          statusText = "REFUND PENDING";
          color = colors.warning;
          bgColor = "#fffbeb";
          icon = <Clock size={12} />;
        }
        break;
      case "completed":
        color = "#059669";
        bgColor = "#d1fae5";
        icon = <CheckCircle size={12} />;
        break;
      case "cancelled":
        color = colors.error;
        bgColor = "#fee2e2";
        icon = <XCircle size={12} />;
        break;
      case "pending":
        color = colors.warning;
        bgColor = "#fffbeb";
        icon = <Clock size={12} />;
        break;
      default:
        break;
    }
    return (
      <StatusTag style={{ color, background: bgColor }} icon={icon}>
        {statusText}
      </StatusTag>
    );
  };

  const getPaymentStatusDisplay = (paymentInfo) => {
    if (!paymentInfo) return <NoDataText>N/A</NoDataText>;
    let color,
      icon = <Info size={12} />;
    switch (paymentInfo.status?.toLowerCase()) {
      case "succeeded":
        color = "success";
        icon = <Check size={12} />;
        break;
      case "pending":
        color = "warning";
        icon = <Clock size={12} />;
        break;
      case "failed":
        color = "error";
        icon = <AlertTriangle size={12} />;
        break;
      case "refunded":
        color = "processing";
        icon = <Repeat size={12} />;
        break;
      default:
        color = "default";
        break;
    }
    return (
      <Tag
        color={color}
        icon={icon}
        style={{
          textTransform: "capitalize",
          borderRadius: "6px",
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        {paymentInfo.status?.replace("_", " ") || "N/A"}
      </Tag>
    );
  };

  const getBookingTypeDisplay = (type, sessionInfo) => {
    if (!type) return <NoDataText>N/A</NoDataText>;
    const isCourse = type === "Full Course";
    return (
      <Space direction="vertical" size={4} align="start">
        <BookingTypeTag
          className={isCourse ? "course" : "single"}
          icon={isCourse ? <Calendar size={13} /> : <Hash size={13} />}
        >
          {type}
        </BookingTypeTag>
        {isCourse && sessionInfo && (
          <Tag
            color="blue"
            icon={<Repeat size={12} />}
            style={{ borderRadius: "6px", fontSize: "11px" }}
          >
            Session {sessionInfo.current_session ?? "?"} of{" "}
            {sessionInfo.total_sessions ?? "?"}
          </Tag>
        )}
      </Space>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <SkeletonContent />;
    }
    if (error || !booking) {
      return (
        <div style={{ padding: "24px" }}>
          <Text type="danger">{error || "Booking data not available."}</Text>
        </div>
      );
    }

    const {
      booker_details = {},
      schedule_instance_details: scheduleInstance = {},
      business_context: businessCtx = {},
      payment_info: payment = {},
    } = booking;

    const businessTimezone = businessCtx.business_timezone || "UTC";
    const userTimezone = booker_details.user_timezone || businessTimezone;
    const { display: phoneDisplay, link: phoneLink } = formatPhoneNumber(
      booker_details.phone_number,
    );

    return (
      <>
        <HeaderSection>
          <GuestAvatar
            size={60}
            src={booker_details.avatar_url}
            $hasImage={!!booker_details.avatar_url}
          >
            {!booker_details.avatar_url && <User />}
          </GuestAvatar>
          <GuestInfo>
            <GuestName>{booker_details.full_name || "N/A"}</GuestName>
            <GuestEmail>{booker_details.email || "N/A"}</GuestEmail>
            {getStatusTag(booking.status, booking.payment_status)}
          </GuestInfo>
        </HeaderSection>

        <ContentBody>
          {booking.status === "cancelled" && (
            <CancellationInfoGroup>
              <CancellationInfoTitle>
                <XCircle /> Cancellation Details
              </CancellationInfoTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoIcon>
                    <MessageSquare />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Reason</InfoLabel>
                    <InfoValue>
                      {booking.cancellation_reason || (
                        <NoDataText>No reason provided</NoDataText>
                      )}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
              </InfoGrid>
            </CancellationInfoGroup>
          )}

          <InfoGroup>
            <InfoGroupTitle>
              <BookIcon /> Experience & Schedule
            </InfoGroupTitle>
            <InfoGrid>
              <InfoItem>
                <InfoIcon>
                  <BookIcon />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Experience</InfoLabel>
                  <InfoValue>
                    {booking.class_name || <NoDataText>N/A</NoDataText>}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <Hash />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Option / Tier</InfoLabel>
                  <InfoValue>
                    {booking.option_name || <NoDataText>N/A</NoDataText>}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <Calendar />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Date & Time (Business Timezone)</InfoLabel>
                  <InfoValue>
                    {formatBusinessLocalToUserDisplay(
                      scheduleInstance.date,
                      scheduleInstance.time,
                      businessTimezone,
                      businessTimezone,
                      { dateTimeFormat: "EEEE, MMMM d, yyyy, h:mm a" },
                    )}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <Clock />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Duration</InfoLabel>
                  <InfoValue>
                    {booking.duration ? (
                      `${booking.duration} minutes`
                    ) : (
                      <NoDataText>N/A</NoDataText>
                    )}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <Building />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Business</InfoLabel>
                  <InfoValue>
                    {businessCtx.businessName || <NoDataText>N/A</NoDataText>}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            </InfoGrid>
          </InfoGroup>

          {/* NEW: Course Schedule Section */}
          {booking.enrollment_type === "Full Course" &&
            booking.course_schedule && (
              <InfoGroup>
                <InfoGroupTitle>
                  <Calendar /> Course Schedule
                </InfoGroupTitle>
                <div style={{ marginTop: "12px", padding: "0 12px" }}>
                  <Timeline
                    items={booking.course_schedule.map((session) => ({
                      color: session.is_current
                        ? colors.primary
                        : session.status === "completed"
                          ? colors.success
                          : "gray",
                      children: (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            opacity: session.status === "cancelled" ? 0.5 : 1,
                            fontWeight: session.is_current ? 600 : 400,
                          }}
                        >
                          <Space direction="vertical" size={0}>
                            <Text strong={session.is_current}>
                              Session {session.session_number}
                              {session.is_current && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  Current Viewing
                                </Tag>
                              )}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "13px" }}>
                              {formatBusinessLocalToUserDisplay(
                                session.date,
                                session.time,
                                // You might need to pass timezone props down or use the ones from booking context
                                booking.business_context.business_timezone,
                                booking.business_context.business_timezone,
                                { dateTimeFormat: "EEE, MMM d, yyyy • h:mm a" },
                              )}
                            </Text>
                          </Space>
                          <StatusTag style={{ height: "fit-content" }}>
                            {session.status.toUpperCase()}
                          </StatusTag>
                        </div>
                      ),
                    }))}
                  />
                </div>
              </InfoGroup>
            )}

          <InfoGroup>
            <InfoGroupTitle>
              <UsersIcon /> Guests
            </InfoGroupTitle>
            <InfoGrid>
              <InfoItem>
                <InfoIcon>
                  <Mail />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Booker Email</InfoLabel>
                  <InfoValue>
                    {booker_details.email || <NoDataText>N/A</NoDataText>}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <Phone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Booker Phone</InfoLabel>
                  <InfoValue>
                    {phoneLink ? (
                      <a href={phoneLink}>{phoneDisplay}</a>
                    ) : (
                      phoneDisplay
                    )}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            </InfoGrid>
            {booking.participant_details?.length > 0 && (
              <>
                <Divider style={{ margin: "20px 0 16px" }} />
                <List
                  header={<Text strong>Guests ({booking.participants})</Text>}
                  itemLayout="horizontal"
                  dataSource={booking.participant_details}
                  renderItem={(participant, index) => (
                    <GuestListItem>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{ backgroundColor: colors.primary }}
                            icon={<UserCircle2 size={18} />}
                          />
                        }
                        title={participant.name || `Guest ${index + 1}`}
                        description={
                          participant.email ||
                          (booking.participants === 1 ? "Same as booker" : "")
                        }
                      />
                    </GuestListItem>
                  )}
                />
              </>
            )}
          </InfoGroup>

          <InfoGroup>
            <InfoGroupTitle>
              <FileText /> Booking Information
            </InfoGroupTitle>
            <InfoGrid>
              {booking.user_facing_reference && (
                <InfoItem>
                  <InfoIcon>
                    <Hash />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Reference Code</InfoLabel>
                    <InfoValue>{booking.user_facing_reference}</InfoValue>
                  </InfoContent>
                </InfoItem>
              )}
              <InfoItem>
                <InfoIcon>
                  <Calendar />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Booked On (User's Time)</InfoLabel>
                  <InfoValue>
                    {formatUTCToUserDisplay(
                      booking.booking_date,
                      userTimezone,
                      { dateTimeFormat: "MMM d, yyyy, h:mm a zzz" },
                    )}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <Repeat />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Booking Type</InfoLabel>
                  <InfoValue>
                    {getBookingTypeDisplay(
                      booking.enrollment_type,
                      booking.session_info,
                    )}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
              <InfoItem>
                <InfoIcon>
                  <MessageSquare />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Notes from Booker</InfoLabel>
                  <Paragraph
                    style={{ margin: 0, color: colors.textPrimary }}
                    ellipsis={{ rows: 3, expandable: true }}
                  >
                    {booking.notes || (
                      <NoDataText>No additional notes provided.</NoDataText>
                    )}
                  </Paragraph>
                </InfoContent>
              </InfoItem>
            </InfoGrid>
          </InfoGroup>

          {payment && Object.keys(payment).length > 0 && (
            <InfoGroup>
              <InfoGroupTitle>
                <CreditCard /> Payment & Transaction
              </InfoGroupTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoIcon>
                    <Info />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Payment Status</InfoLabel>
                    <InfoValue>{getPaymentStatusDisplay(payment)}</InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <DollarSign />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Gross Amount</InfoLabel>
                    <InfoValue>
                      ${parseFloat(payment.amount || 0).toFixed(2)}{" "}
                      {payment.currency?.toUpperCase()}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <CreditCard />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Payment Method</InfoLabel>
                    <InfoValue>
                      {payment.card_brand
                        ? `•••• ${payment.card_last4} (${payment.card_brand})`
                        : payment.payment_method_type || (
                            <NoDataText>N/A</NoDataText>
                          )}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                {payment.receipt_url && (
                  <InfoItem>
                    <InfoIcon>
                      <ExternalLink />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Payment Receipt</InfoLabel>
                      <InfoValue>
                        <Button
                          type="link"
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: 0, height: "auto" }}
                          icon={<ExternalLink size={14} />}
                        >
                          View on Stripe
                        </Button>
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                )}
              </InfoGrid>
            </InfoGroup>
          )}
        </ContentBody>
      </>
    );
  };

  const renderFooter = () => {
    if (!loading && booking && booking.status === "confirmed") {
      return (
        <DrawerFooter>
          <ActionSection>
            <Button icon={<Repeat size={16} />} onClick={handleRescheduleClick}>
              Reschedule
            </Button>
            <Popconfirm
              title="Are you sure you want to cancel?"
              description="The guest will be notified and a refund may be initiated."
              onConfirm={handleInternalCancel}
              okText="Yes, Cancel Booking"
              cancelText="No"
              placement="topRight"
              disabled={isCancelling}
            >
              <Button
                type="primary"
                danger
                icon={<XCircle size={16} />}
                loading={isCancelling}
                key={`btn-${isCancelling}`}
              >
                Cancel Booking
              </Button>
            </Popconfirm>
          </ActionSection>
        </DrawerFooter>
      );
    }
    return null;
  };

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerHeaderTitle>
          <FileText size={20} />
          <span>
            Booking Details{" "}
            {booking?.user_facing_reference
              ? `(${booking.user_facing_reference})`
              : ""}
          </span>
        </DrawerHeaderTitle>
        <CloseButton icon={<X size={20} />} onClick={onClose} />
      </DrawerHeader>
      <DrawerContent>{renderContent()}</DrawerContent>
      {renderFooter()}
    </>
  );

  if (!shouldRender) return null;

  return (
    <ConfigProvider theme={appTheme}>
      {isMobile ? (
        <Drawer.Root open={visible} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              {renderDrawerContent()}
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Drawer.Root
          open={visible}
          onOpenChange={(open) => !open && onClose()}
          direction="right"
          dismissible
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <DesktopDrawerContent
              style={{ "--initial-transform": "calc(100% + 8px)" }}
            >
              <DesktopDrawerInner>{renderDrawerContent()}</DesktopDrawerInner>
            </DesktopDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </ConfigProvider>
  );
};

export default BookingDetailsDrawer;
