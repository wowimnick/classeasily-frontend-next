"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Avatar,
  ConfigProvider,
  Table,
  Typography,
  Button,
  Tag,
  Skeleton,
} from "antd";
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

const { Text, Title } = Typography;

// --- Vaul Drawer Styles ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1010;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  position: fixed;
  inset: 0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  z-index: 1011;
  top: 8vh;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -20px 40px rgba(0, 0, 0, 0.15);
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 32px;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 8px auto;
  cursor: grab;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
`;

const DrawerTitle = styled(Title)`
  &.ant-typography {
    font-size: 16px;
    font-weight: 600;
    margin: 0 !important;
    color: #1f2937;
  }
`;

const CloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
  color: #6b7280;
  border-radius: 8px;
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const DrawerFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

// --- Desktop Modal ---
const CompactModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }
  .ant-modal-header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 20px;
    margin: 0;
    .ant-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
  }
  .ant-modal-body {
    padding: 0;
    background: #f8fafc;
    max-height: 70vh;
    overflow-y: auto;
  }
  .ant-modal-footer {
    border-top: 1px solid #e2e8f0;
    padding: 12px 20px;
    background: #ffffff;
    margin-top: 0px;
  }
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

const StudentAvatar = styled.div`
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

const StudentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StudentName = styled.h1`
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
    color: #475569;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f1f5f9;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc !important;
  }
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

// Booking History Modal
const BookingHistoryModal = ({ visible, onClose, student }) => {
  const [bookingHistoryData, setBookingHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const DATE_FNS_DISPLAY_FORMAT = "MMM d, yyyy";

  useEffect(() => {
    if (visible && student?.booking_history) {
      setIsLoading(true);
      // Simulate loading for skeleton
      setTimeout(() => {
        const data = Array.isArray(student.booking_history)
          ? student.booking_history.map((item, index) => ({
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
    }
  }, [visible, student]);

  const bookingHistoryColumns = [
    {
      title: "Class Name",
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
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (text) => (
        <Text style={{ fontSize: "13px", color: "#475569" }}>{text}</Text>
      ),
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      width: 120,
      render: (text) => (
        <Text style={{ fontSize: "13px", color: "#475569" }}>{text}</Text>
      ),
    },
    {
      title: "Status",
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

  const StyledBookingModal = styled(Modal)`
    .ant-modal-content {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    }
    .ant-modal-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 24px;
      .ant-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 12px;
        svg {
          color: #ff385c;
        }
      }
    }
    .ant-modal-body {
      padding: 0;
      background: #f8fafc;
    }
    .ant-modal-footer {
      border-top: 1px solid #e2e8f0;
      padding: 16px 24px;
      background: #ffffff;
    }
  `;

  const TableWrapper = styled.div`
    .ant-table {
      background: white;
    }
    .ant-table-thead > tr > th {
      background: #f8fafc !important;
      border-bottom: 2px solid #e2e8f0 !important;
      font-weight: 600;
      color: #475569;
      font-size: 13px;
      padding: 16px 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ant-table-tbody > tr > td {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }
    .ant-table-tbody > tr:hover > td {
      background: #f8fafc !important;
    }
  `;

  return (
    <StyledBookingModal
      title={
        <>
          <Calendar size={18} />
          {`${student?.first_name || "Student"}'s Booking History`}
        </>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={900}
      zIndex={9999}
      destroyOnClose
    >
      {isLoading ? (
        <TableSkeleton />
      ) : bookingHistoryData.length > 0 ? (
        <TableWrapper>
          <Table
            columns={bookingHistoryColumns}
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
        </TableWrapper>
      ) : (
        <CompactAlert style={{ margin: "24px" }}>
          <AlertIcon>
            <Calendar size={20} />
          </AlertIcon>
          <AlertText>No booking history available for this student.</AlertText>
        </CompactAlert>
      )}
    </StyledBookingModal>
  );
};

// Compact Modal for Imported Contacts
const CompactContactModal = ({ student, currentUser, onClose }) => {
  const avatarLetter = student.first_name
    ? student.first_name[0].toUpperCase()
    : student.email
    ? student.email[0].toUpperCase()
    : "?";

  const { display: phoneDisplay, link: phoneLink } = formatPhoneNumber(
    student.phone_number || ""
  );

  return (
    <>
      <CompactHeroSection>
        <CompactProfileLayout>
          <StudentAvatar compact>
            <Avatar src={student.avatar_thumb_url} icon={<User />}>
              {!student.avatar_thumb_url && avatarLetter}
            </Avatar>
          </StudentAvatar>
          <StudentInfo>
            <StudentName compact>
              {student.first_name || "Unknown"} {student.last_name || ""}
            </StudentName>
            <Tag color="default" style={{ marginBottom: "8px" }}>
              Imported Contact
            </Tag>
            <ContactInfo compact>
              {student.email && (
                <ContactItem compact>
                  <Mail />
                  <a href={`mailto:${student.email}`}>{student.email}</a>
                </ContactItem>
              )}
              {student.phone_number && (
                <ContactItem compact>
                  <Phone />
                  {phoneLink ? (
                    <a href={phoneLink}>{phoneDisplay}</a>
                  ) : (
                    <span>{phoneDisplay}</span>
                  )}
                </ContactItem>
              )}
              {!student.phone_number && !student.email && (
                <ContactItem compact>
                  <span style={{ color: "#64748b", fontStyle: "italic" }}>
                    No contact information available
                  </span>
                </ContactItem>
              )}
            </ContactInfo>
          </StudentInfo>
        </CompactProfileLayout>
      </CompactHeroSection>

      <ContentBody compact>
        <InfoSection compact>
          <SectionTitle compact>
            <MessageSquare />
            Notes
          </SectionTitle>
          <NotesSection
            student={student}
            currentUser={currentUser}
            compact={true}
          />
        </InfoSection>
      </ContentBody>
    </>
  );
};

// Compact Modal for Platform Users
const CompactPlatformUserModal = ({
  student,
  currentUser,
  onClose,
  isReadyForAnimation,
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
    return student?.createdAt
      ? formatUTCToUserDisplay(student.createdAt, userTimeZone, {
          dateFormat: "MMMM yyyy",
        })
      : "N/A";
  }, [student?.createdAt, userTimeZone]);

  const avatarLetter = student.first_name
    ? student.first_name[0].toUpperCase()
    : student.email
    ? student.email[0].toUpperCase()
    : "?";

  const averageAttendance = student?.average_attendance
    ? parseFloat(student.average_attendance)
    : 0;

  const bookingCount = Array.isArray(student?.booking_history)
    ? student.booking_history.length
    : 0;

  return (
    <>
      <CompactHeroSection>
        <CompactProfileLayout>
          <StudentAvatar compact>
            <Avatar src={student.avatar_thumb_url} icon={<User />}>
              {!student.avatar_thumb_url && avatarLetter}
            </Avatar>
          </StudentAvatar>
          <StudentInfo>
            <StudentName compact>
              {student.first_name || "Unknown"} {student.last_name || ""}
            </StudentName>
            <Tag color="blue" style={{ marginBottom: "8px" }}>
              Platform User
            </Tag>
            <ContactInfo compact>
              {student.email && (
                <ContactItem compact>
                  <Mail />
                  <a href={`mailto:${student.email}`}>{student.email}</a>
                </ContactItem>
              )}
              <ContactItem compact>
                <User />
                <span>Member since {joinedDateFormatted}</span>
              </ContactItem>
            </ContactInfo>
          </StudentInfo>
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
                value={
                  isReadyForAnimation ? student.total_classes_taken ?? 0 : 0
                }
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
              Classes
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
                  isReadyForAnimation
                    ? student.total_spent_this_business || 0
                    : 0
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
            student={student}
            currentUser={currentUser}
            compact={true}
          />
        </InfoSection>
      </ContentBody>

      <BookingHistoryModal
        visible={showBookingHistory}
        onClose={() => setShowBookingHistory(false)}
        student={student}
      />
    </>
  );
};

const StudentProfile = ({
  student: initialStudent,
  onClose,
  currentUser,
  visible,
}) => {
  const [student, setStudent] = useState(null);
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
    const fetchStudentDetails = async () => {
      if (!initialStudent?.id) {
        setError("No student selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReadyForAnimation(false);
      setError(null);
      try {
        const response = await businessStudentService.getBusinessStudentProfile(
          initialStudent.id
        );

        if (response.success && response.data) {
          setStudent(response.data);
          setTimeout(() => setIsReadyForAnimation(true), 50);
        } else {
          throw new Error(response.error || "Failed to fetch student details");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("The requested student profile could not be found.");
        } else {
          setError(err.message || "Could not load student details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      fetchStudentDetails();
    }
  }, [initialStudent, visible]);

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
                "The details for this student could not be loaded. Please try again later."}
            </AlertText>
          </CompactAlert>
        </div>
      );
    }

    const isPlatformUser = student?.type === "user";

    return (
      <AnimatePresence mode="wait">
        {isLoading || !student ? (
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
                student={student}
                currentUser={currentUser}
                onClose={onClose}
              />
            ) : (
              <CompactPlatformUserModal
                student={student}
                currentUser={currentUser}
                onClose={onClose}
                isReadyForAnimation={isReadyForAnimation}
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
    if (student)
      return `${student.first_name || "Contact"}'s ${
        student.type === "user" ? "Profile" : "Details"
      }`;
    return "Student Profile";
  };

  return (
    <ConfigProvider theme={appTheme}>
      {/* Mobile Drawer with Vaul */}
      {isMobile ? (
        <Drawer.Root open={visible} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle>{getModalTitle()}</DrawerTitle>
                <CloseButton icon={<X size={20} />} onClick={onClose} />
              </DrawerHeader>
              <ScrollableContent>{renderContent()}</ScrollableContent>
              <DrawerFooter>
                <Button block type="primary" onClick={onClose}>
                  Close
                </Button>
              </DrawerFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        /* Desktop Modal */
        <CompactModal
          title={getModalTitle()}
          open={visible}
          onCancel={onClose}
          width={error ? 500 : 600}
          footer={[
            <Button key="close" onClick={onClose}>
              Close
            </Button>,
          ]}
          destroyOnClose
        >
          {renderContent()}
        </CompactModal>
      )}
    </ConfigProvider>
  );
};

export default StudentProfile;
