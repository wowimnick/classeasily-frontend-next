"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Avatar, Table, Typography, Button, Tag, Skeleton } from "antd";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  X,
  BookOpen,
  Lock,
  Users,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { businessStudentService } from "@/services/apiService";
import styled from "styled-components";
import NotesSection from "./NotesSection";
import {
  formatUTCToUserDisplay,
  formatNaiveDate,
  formatPhoneNumber,
} from "@/services/utils";
import dayjs from "dayjs";
import { theme as appTheme } from "@/components/theme";
import NumberFlow from "@number-flow/react";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import CompactContactModal from "./CompactContactModal";

const { Text } = Typography;

const GuestOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const GuestMobileShell = styled(Drawer.Content)`
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  height: 92%;
  max-height: 92vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const GuestDesktopShell = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 860px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14), 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const GuestThumbArea = styled.div`
  flex-shrink: 0;
  background: #f4f5f8;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GuestDrawerHandle = styled(Drawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const GuestDrawerInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const GuestShellHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  flex-shrink: 0;
`;

const GuestShellTitle = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const GuestShellClose = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  display: flex;
  align-items: center;
  &:hover {
    background: #e5e7eb;
  }
`;

const GuestShellScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #f8fafc;
`;

// Compact header for imported contacts
const CompactHeroSection = styled.div`
  background: #ffffff;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const CompactProfileLayout = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const GuestAvatar = styled.div`
  width: ${(props) => (props.compact ? "48px" : "120px")};
  height: ${(props) => (props.compact ? "48px" : "120px")};
  border-radius: 50%;
  background: #f8fafc;
  flex-shrink: 0;
  border: ${(props) => (props.compact ? "2px" : "3px")} solid #ffffff;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  .ant-avatar {
    width: 100% !important;
    height: 100% !important;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${(props) => (props.compact ? "18px" : "48px")} !important;
    color: white;
  }
  @media (max-width: 600px) {
    width: ${(props) => (props.compact ? "44px" : "80px")};
    height: ${(props) => (props.compact ? "44px" : "80px")};
    .ant-avatar {
      font-size: ${(props) => (props.compact ? "16px" : "32px")} !important;
    }
  }
`;

const GuestInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuestName = styled.h1`
  font-size: ${(props) => (props.compact ? "1.125rem" : "2.25rem")};
  font-weight: 600;
  margin: 0 0 ${(props) => (props.compact ? "4px" : "8px")} 0;
  color: #1e293b;
  line-height: 1.2;
  letter-spacing: -0.02em;
  @media (max-width: 768px) {
    font-size: ${(props) => (props.compact ? "1rem" : "1.75rem")};
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: ${(props) => (props.compact ? "8px" : "16px")};
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: ${(props) => (props.compact ? "12px" : "14px")};
  svg {
    color: #64748b;
    width: ${(props) => (props.compact ? "14px" : "16px")};
    height: ${(props) => (props.compact ? "14px" : "16px")};
  }
  a {
    color: #475569;
    text-decoration: none;
    &:hover {
      color: #ff385c;
    }
  }
`;

const ContentBody = styled.div`
  padding: ${(props) => (props.compact ? "16px 20px 20px" : "32px")};
  @media (max-width: 768px) {
    padding: ${(props) =>
      props.compact ? "12px 16px 16px" : "24px 20px 30px"};
  }
`;

const InfoSection = styled.div`
  margin-bottom: ${(props) => (props.compact ? "16px" : "32px")};
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${(props) => (props.compact ? "1rem" : "1.25rem")};
  font-weight: 600;
  color: #1e293b;
  margin-bottom: ${(props) => (props.compact ? "12px" : "20px")};
  display: flex;
  align-items: center;
  gap: ${(props) => (props.compact ? "8px" : "12px")};
  letter-spacing: -0.01em;
  svg {
    width: ${(props) => (props.compact ? "16px" : "20px")};
    height: ${(props) => (props.compact ? "16px" : "20px")};
    color: #ff385c;
  }
`;

const CompactAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const AlertIcon = styled.div`
  flex-shrink: 0;
  color: #64748b;
`;

const AlertText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
  flex-grow: 1;
`;

const StyledTable = styled(Table)`
  .ant-table {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  .ant-table-thead > tr > th {
    background: #f8fafc !important;
    border-bottom: 1px solid #e2e8f0 !important;
    font-weight: 600;
    color: #64748b;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f1f5f9;
    padding: 12px 14px;
    font-size: 13px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc !important;
  }
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 12px;
      font-size: 10px;
    }
    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }
`;

const BookingHistoryTableWrapper = styled.div`
  .ant-table {
    background: white;
  }
  .ant-table-thead > tr > th {
    background: #f8fafc !important;
    border-bottom: 2px solid #e2e8f0 !important;
    font-weight: 600;
    color: #64748b;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ant-table-tbody > tr > td {
    padding: 12px 14px;
    font-size: 13px;
    border-bottom: 1px solid #f1f5f9;
  }
  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc !important;
  }
`;

const HistoryOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1100;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const HistoryMobileShell = styled(Drawer.Content)`
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  height: 88%;
  max-height: 88vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1101;
  outline: none;
`;

const HistoryDesktopShell = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1101;
  outline: none;
  width: min(900px, 96vw);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14);
`;

const HistoryDrawerInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const HistoryDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
`;

const HistoryDrawerTitle = styled.span`
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HistoryScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
  background: #f8fafc;
`;

// Skeleton for table loading
const TableSkeleton = () => (
  <div style={{ padding: "16px" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          display: "flex",
          gap: "16px",
          padding: "16px 0",
          borderBottom: i !== 5 ? "1px solid #f1f5f9" : "none",
        }}
      >
        <Skeleton.Avatar active size={40} shape="square" />
        <div style={{ flex: 1 }}>
          <Skeleton active paragraph={{ rows: 1, width: ["100%"] }} />
        </div>
      </div>
    ))}
  </div>
);

const BOOKING_HISTORY_COLUMNS = [
  {
    title: "EXPERIENCE NAME",
    dataIndex: "class_name",
    key: "class",
    ellipsis: true,
    render: (text) => (
      <Text strong style={{ fontSize: "14px" }}>
        {text}
      </Text>
    ),
  },
  {
    title: "DATE",
    dataIndex: "date",
    key: "date",
    width: 140,
    render: (text) => (
      <Text style={{ fontSize: "13px", color: "#475569" }}>{text}</Text>
    ),
  },
  {
    title: "TIME",
    dataIndex: "time",
    key: "time",
    width: 120,
    render: (text) => (
      <Text style={{ fontSize: "13px", color: "#475569" }}>{text}</Text>
    ),
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    width: 120,
    align: "center",
    render: (status) => {
      let color = "default";
      if (status === "completed") color = "success";
      else if (status === "confirmed") color = "processing";
      else if (status === "cancelled") color = "error";
      const formattedStatus = (status?.replace("_", " ") || "N/A").replace(
        /\b\w/g,
        (char) => char.toUpperCase()
      );
      return (
        <Tag
          color={color}
          style={{
            borderRadius: "6px",
            fontWeight: 500,
            fontSize: "12px",
          }}
        >
          {formattedStatus}
        </Tag>
      );
    },
  },
];

const BookingHistoryDrawer = ({ visible, onClose, guest, isMobile }) => {
  const [bookingHistoryData, setBookingHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const DATE_FNS_DISPLAY_FORMAT = "MMM d, yyyy";

  useEffect(() => {
    if (visible && guest?.booking_history) {
      setIsLoading(true);
      const t = setTimeout(() => {
        const data = Array.isArray(guest.booking_history)
          ? guest.booking_history.map((item, index) => ({
              ...item,
              key: item.id || `booking-${index}`,
              date: item.date
                ? formatNaiveDate(item.date, DATE_FNS_DISPLAY_FORMAT)
                : "N/A",
              time: item.time
                ? dayjs(item.time, "HH:mm:ss").format("h:mm A")
                : "N/A",
            }))
          : [];
        setBookingHistoryData(data);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible, guest]);

  const body = isLoading ? (
    <TableSkeleton />
  ) : bookingHistoryData.length > 0 ? (
    <BookingHistoryTableWrapper style={{ padding: "16px 20px 24px" }}>
      <Table
        columns={BOOKING_HISTORY_COLUMNS}
        dataSource={bookingHistoryData}
        pagination={{
          pageSize: 10,
          hideOnSinglePage: true,
          showSizeChanger: false,
        }}
        rowKey="key"
        size="middle"
        loading={false}
      />
    </BookingHistoryTableWrapper>
  ) : (
    <CompactAlert style={{ margin: "24px" }}>
      <AlertIcon>
        <Calendar size={20} />
      </AlertIcon>
      <AlertText>No booking history available for this guest.</AlertText>
    </CompactAlert>
  );

  const headerTitle = (
    <>
      <Calendar size={18} style={{ color: "#ff385c" }} />
      {`${guest?.first_name || "Guest"}'s Booking History`}
    </>
  );

  const inner = (
    <HistoryDrawerInner>
      <HistoryDrawerHeader>
        <HistoryDrawerTitle>{headerTitle}</HistoryDrawerTitle>
        <GuestShellClose type="button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </GuestShellClose>
      </HistoryDrawerHeader>
      <HistoryScroll>{body}</HistoryScroll>
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #e2e8f0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <Button type="primary" block onClick={onClose}>
          Close
        </Button>
      </div>
    </HistoryDrawerInner>
  );

  return isMobile ? (
    <Drawer.Root
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      snapPoints={[1]}
      activeSnapPoint={1}
      dismissible
    >
      <Drawer.Portal>
        <HistoryOverlay />
        <HistoryMobileShell>
          <GuestThumbArea>
            <GuestDrawerHandle />
          </GuestThumbArea>
          {inner}
        </HistoryMobileShell>
      </Drawer.Portal>
    </Drawer.Root>
  ) : (
    <Drawer.Root
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      direction="right"
      dismissible
      handleOnly
    >
      <Drawer.Portal>
        <HistoryOverlay />
        <HistoryDesktopShell>{inner}</HistoryDesktopShell>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// Compact Modal for Platform Users
const CompactPlatformUserModal = ({
  guest,
  currentUser,
  onClose,
  isReadyForAnimation,
  isMobile,
}) => {
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [userTimeZone, setUserTimeZone] = useState("UTC");

  useEffect(() => {
    const clientTimeZone =
      currentUser?.user_timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimeZone(clientTimeZone);
  }, [currentUser]);

  const joinedDateFormatted = useMemo(() => {
    return guest?.createdAt
      ? formatUTCToUserDisplay(guest.createdAt, userTimeZone, {
          dateFormat: "MMMM yyyy",
        })
      : "N/A";
  }, [guest?.createdAt, userTimeZone]);

  const avatarLetter = guest.first_name
    ? guest.first_name[0].toUpperCase()
    : guest.email
    ? guest.email[0].toUpperCase()
    : "?";

  const averageAttendance = guest?.average_attendance
    ? parseFloat(guest.average_attendance)
    : 0;

  const bookingCount = Array.isArray(guest?.booking_history)
    ? guest.booking_history.length
    : 0;

  return (
    <>
      <CompactHeroSection>
        <CompactProfileLayout>
          <GuestAvatar compact>
            <Avatar src={guest.avatar_thumb_url} icon={<User />}>
              {!guest.avatar_thumb_url && avatarLetter}
            </Avatar>
          </GuestAvatar>
          <GuestInfo>
            <GuestName compact>
              {guest.first_name || "Unknown"} {guest.last_name || ""}
            </GuestName>
            <Tag color="blue" style={{ marginBottom: "8px" }}>
              Platform User
            </Tag>
            <ContactInfo compact>
              {guest.email && (
                <ContactItem compact>
                  <Mail />
                  <a href={`mailto:${guest.email}`}>{guest.email}</a>
                </ContactItem>
              )}
              <ContactItem compact>
                <User />
                <span>Member since {joinedDateFormatted}</span>
              </ContactItem>
            </ContactInfo>
          </GuestInfo>
        </CompactProfileLayout>
      </CompactHeroSection>

      {/* Compact Stats Row */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            textAlign: "center",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "2px",
              }}
            >
              <NumberFlow
                value={isReadyForAnimation ? guest.total_classes_taken ?? 0 : 0}
                duration={800}
                numberFormatOptions={{ maximumFractionDigits: 0 }}
              />
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                fontWeight: "500",
                textTransform: "uppercase",
              }}
            >
              Experiences
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "2px",
              }}
            >
              <NumberFlow
                value={isReadyForAnimation ? averageAttendance : 0}
                duration={800}
                numberFormatOptions={{ maximumFractionDigits: 1 }}
              />
              %
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                fontWeight: "500",
                textTransform: "uppercase",
              }}
            >
              Attendance
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "2px",
              }}
            >
              $
              <NumberFlow
                value={
                  isReadyForAnimation ? guest.total_spent_this_business || 0 : 0
                }
                duration={800}
                numberFormatOptions={{
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }}
              />
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                fontWeight: "500",
                textTransform: "uppercase",
              }}
            >
              Total Spent
            </div>
          </div>

          <div>
            <Button
              size="small"
              onClick={() => setShowBookingHistory(true)}
              disabled={bookingCount === 0}
              style={{
                height: "auto",
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "6px",
              }}
            >
              {bookingCount > 0
                ? `View ${bookingCount} Bookings`
                : "No Bookings"}
            </Button>
          </div>
        </div>
      </div>

      <ContentBody compact>
        <InfoSection compact>
          <SectionTitle compact>
            <MessageSquare />
            Notes
          </SectionTitle>
          <NotesSection
            guest={guest}
            currentUser={currentUser}
            compact={true}
          />
        </InfoSection>
      </ContentBody>

      <BookingHistoryDrawer
        visible={showBookingHistory}
        onClose={() => setShowBookingHistory(false)}
        guest={guest}
        isMobile={isMobile}
      />
    </>
  );
};

const GuestProfile = ({
  guest: initialGuest,
  onClose,
  currentUser,
  visible,
}) => {
  const [guest, setGuest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchGuestDetails = async () => {
      if (!initialGuest?.id) {
        setError("No guest selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReadyForAnimation(false);
      setError(null);
      try {
        const response = await businessStudentService.getBusinessStudentProfile(
          initialGuest.id
        );

        if (response.success && response.data) {
          setGuest(response.data);
          setTimeout(() => setIsReadyForAnimation(true), 50);
        } else {
          throw new Error(response.error || "Failed to fetch guest details");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("The requested guest profile could not be found.");
        } else {
          setError(err.message || "Could not load guest details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      fetchGuestDetails();
    }
  }, [initialGuest, visible]);

  const renderContent = () => {
    if (error) {
      return (
        <div style={{ padding: "20px" }}>
          <CompactAlert>
            <AlertIcon>
              <Lock size={24} />
            </AlertIcon>
            <AlertText>
              <strong>Error Loading Profile</strong>
              <br />
              {error ||
                "The details for this guest could not be loaded. Please try again later."}
            </AlertText>
          </CompactAlert>
        </div>
      );
    }

    const isPlatformUser = guest?.type === "user";

    return (
      <AnimatePresence mode="wait">
        {isLoading || !guest ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Skeleton active avatar paragraph={{ rows: 4 }} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!isPlatformUser ? (
              <CompactContactModal
                guest={guest}
                currentUser={currentUser}
                onClose={onClose}
                embedded
              />
            ) : (
              <CompactPlatformUserModal
                guest={guest}
                currentUser={currentUser}
                onClose={onClose}
                isReadyForAnimation={isReadyForAnimation}
                isMobile={isMobile}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const getModalTitle = () => {
    if (isLoading) return "Loading Profile...";
    if (error) return "Error";
    if (guest)
      return `${guest.first_name || "Contact"}'s ${
        guest.type === "user" ? "Profile" : "Details"
      }`;
    return "Guest Profile";
  };

  const shellContent = (
    <GuestDrawerInner>
      <GuestShellHeader>
        <GuestShellTitle>{getModalTitle()}</GuestShellTitle>
        <GuestShellClose type="button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </GuestShellClose>
      </GuestShellHeader>
      <GuestShellScroll>{renderContent()}</GuestShellScroll>
    </GuestDrawerInner>
  );

  return isMobile ? (
    <Drawer.Root
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      snapPoints={[1]}
      activeSnapPoint={1}
      dismissible
    >
      <Drawer.Portal>
        <GuestOverlay />
        <GuestMobileShell>
          <GuestThumbArea>
            <GuestDrawerHandle />
          </GuestThumbArea>
          {shellContent}
        </GuestMobileShell>
      </Drawer.Portal>
    </Drawer.Root>
  ) : (
    <Drawer.Root
      open={visible}
      onOpenChange={(open) => !open && onClose()}
      direction="right"
      dismissible
      handleOnly
    >
      <Drawer.Portal>
        <GuestOverlay />
        <GuestDesktopShell style={{ "--initial-transform": "calc(100% + 8px)" }}>
          {shellContent}
        </GuestDesktopShell>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default GuestProfile;
