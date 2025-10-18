import React from "react";
import styled from "styled-components";
import { Typography, Button, Tag, Popconfirm, Empty, Card, Space } from "antd";
import {
  Calendar,
  Users,
  MessageSquare,
  XCircle,
  Eye,
  Hash,
  Clock,
  BookOpen,
  Repeat, // Added icon
} from "lucide-react";
import moment from "moment";

const { Text } = Typography;

// --- STYLED COMPONENTS (New Mobile-First Design) ---

const colors = {
  primary: "#ff385c",
  border: "#f1f5f9",
  textPrimary: "#1f2937",
  textSecondary: "#64748b",
  lightBg: "#f8fafc",
};

const BookingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px; /* Small padding to not stick to edges */
`;

const BookingCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: white;

  .ant-card-body {
    padding: 16px;
    @media (max-width: 480px) {
      padding: 12px;
    }
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${colors.border};
`;

const ClassName = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  line-height: 1.3;
`;

const StudentName = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
`;

const CardContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetaValue = styled(Text)`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textPrimary};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px; /* For tags */
`;

const BookingTypeTag = styled(Tag)`
  border-radius: 6px;
  font-size: 11px;
  margin: 0;
  border: 1px solid transparent;

  &.single {
    background: #f1f5f9;
    color: #475569;
    border-color: #e2e8f0;
  }

  &.course {
    background: #f0fdf4;
    color: #166534;
    border-color: #86efac;
  }
`;

const SessionTag = styled(Tag)`
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
  border-radius: 6px;
  font-size: 11px;
`;

const CardFooter = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const ActionButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

// --- SKELETON LOADER ---

const MobileBookingSkeleton = () => (
  <BookingCard>
    <CardHeader style={{ borderBottom: "none", paddingBottom: 0 }}>
      <div
        style={{
          width: "80%",
          height: "20px",
          background: "#f0f0f0",
          borderRadius: "4px",
        }}
      />
      <div
        style={{
          width: "50%",
          height: "16px",
          background: "#f0f0f0",
          borderRadius: "4px",
          marginTop: "4px",
        }}
      />
    </CardHeader>
  </BookingCard>
);

// --- MAIN COMPONENT ---

const MobileActiveBookings = ({
  data,
  showViewDrawer,
  handleCancel,
  handleReschedule, // Added prop
  loading,
}) => {
  if (loading) {
    return (
      <BookingsList>
        {Array.from({ length: 5 }).map((_, index) => (
          <MobileBookingSkeleton key={index} />
        ))}
      </BookingsList>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Empty
        description="No active bookings found"
        style={{ padding: "40px 0" }}
      />
    );
  }

  return (
    <BookingsList>
      {data.map((booking) => (
        <BookingCard key={booking.id}>
          <CardHeader>
            <ClassName>{booking.class_name || "N/A"}</ClassName>
            <StudentName>{booking.user_name || "N/A"}</StudentName>
          </CardHeader>

          <CardContent>
            <MetaItem>
              <MetaLabel>
                <Calendar size={14} /> Date
              </MetaLabel>
              <MetaValue>
                {booking.date
                  ? moment(booking.date).format("MMM D, YYYY")
                  : "N/A"}
              </MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>
                <Clock size={14} /> Time
              </MetaLabel>
              <MetaValue>
                {booking.time
                  ? moment(booking.time, "HH:mm:ss").format("h:mm A")
                  : "N/A"}
              </MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>
                <Hash size={14} /> Reference
              </MetaLabel>
              <MetaValue>{booking.user_facing_reference || "N/A"}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>
                <Users size={14} /> Spots
              </MetaLabel>
              <MetaValue>{booking.participants || 0}</MetaValue>
            </MetaItem>
            <MetaItem style={{ gridColumn: "1 / -1" }}>
              <MetaLabel>
                <BookOpen size={14} /> Booking Type
              </MetaLabel>
              <MetaValue>
                <BookingTypeTag
                  className={(booking.enrollment_type || "")
                    .toLowerCase()
                    .replace(" ", "-")}
                >
                  {booking.enrollment_type || "N/A"}
                </BookingTypeTag>
                {booking.enrollment_type === "Full Course" &&
                  booking.session_info && (
                    <SessionTag>
                      Session {booking.session_info.current_session} of{" "}
                      {booking.session_info.total_sessions}
                    </SessionTag>
                  )}
              </MetaValue>
            </MetaItem>
          </CardContent>

          <CardFooter>
            <ActionButton
              icon={<Eye size={16} />}
              onClick={() => showViewDrawer(booking)}
            >
              Details
            </ActionButton>
            <ActionButton
              icon={<Repeat size={16} />}
              onClick={() => handleReschedule(booking)}
            >
              Reschedule
            </ActionButton>
            <Popconfirm
              title="Cancel this booking?"
              okText="Yes, Cancel"
              cancelText="No"
              onConfirm={() => handleCancel(booking)}
              placement="topRight"
            >
              <ActionButton
                danger
                icon={<XCircle size={16} />}
                style={{ gridColumn: "1 / -1" }}
              >
                Cancel Booking
              </ActionButton>
            </Popconfirm>
          </CardFooter>
        </BookingCard>
      ))}
    </BookingsList>
  );
};

export default MobileActiveBookings;
