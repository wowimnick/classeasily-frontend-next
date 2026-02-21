import React from "react";
import styled from "styled-components";
import { Typography, Button, Tag, Empty, Card, Space } from "antd";
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Eye,
  Hash,
  CheckCircle,
  XCircle,
  BookOpen,
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

const ExperienceName = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  line-height: 1.3;
`;

const GuestName = styled(Text)`
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

const StatusTag = styled(Tag)`
  border-radius: 6px;
  padding: 4px 8px; /* Adjusted padding for mobile tag */
  font-weight: 600;
  font-size: 11px; /* Smaller font for mobile */
  line-height: 1;
  height: auto;
  text-transform: uppercase;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 4px; /* Space for icon */
  margin-top: 4px; /* Small margin below other meta */

  &.completed {
    background: #dcfce7;
    color: #166534;
  }
  &.cancelled {
    background: #fee2e2;
    color: #991b1b;
  }
  &.pending {
    background: #fffbeb;
    color: #b45309;
  }
  &.forfeited {
    background: #f1f5f9;
    color: #475569;
  }
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
  display: flex; /* Use flex for single button or row */
  gap: 8px;
  justify-content: flex-end; /* Align to right */
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

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 22px;
  width: 90px;
  border-radius: 6px;
`;

const MobileBookingSkeleton = () => (
  <BookingCard>
    <CardHeader>
      <SkeletonLine width="80%" height="18px" />
      <SkeletonLine width="50%" height="14px" />
    </CardHeader>

    <CardContent>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Calendar size={14} /> Experience Date
        </MetaLabel>
        <SkeletonLine width="100px" height="14px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Clock size={14} /> Experience Time
        </MetaLabel>
        <SkeletonLine width="70px" height="14px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Hash size={14} /> Reference
        </MetaLabel>
        <SkeletonLine width="90px" height="14px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Users size={14} /> Spots
        </MetaLabel>
        <SkeletonLine width="30px" height="14px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Clock size={14} /> Booked On
        </MetaLabel>
        <SkeletonLine width="100px" height="14px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <BookOpen size={14} /> Experience Option
        </MetaLabel>
        <SkeletonLine width="80%" height="14px" />
      </MetaItem>
      <MetaItem style={{ gridColumn: "1 / -1" }}>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Calendar size={14} /> Booking Type
        </MetaLabel>
        <div style={{ display: "flex", gap: "8px" }}>
          <SkeletonTag />
          <SkeletonTag width="120px" />
        </div>
      </MetaItem>
      <MetaItem style={{ gridColumn: "1 / -1" }}>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Hash size={14} /> Status
        </MetaLabel>
        <SkeletonTag />
      </MetaItem>
    </CardContent>

    <CardFooter>
      <SkeletonLine height="40px" />
    </CardFooter>
  </BookingCard>
);

// --- MAIN COMPONENT ---

const MobileBookingHistory = ({ data, showViewDrawer, loading }) => {
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
        description="No booking history found"
        style={{ padding: "40px 0" }}
      />
    );
  }

  return (
    <BookingsList>
      {data.map((booking) => {
        const statusLower = booking.status?.toLowerCase();
        const statusIcon =
          statusLower === "completed" ? (
            <CheckCircle size={12} />
          ) : statusLower === "cancelled" || statusLower === "forfeited" ? (
            <XCircle size={12} />
          ) : statusLower === "pending" ? (
            <Clock size={12} />
          ) : null;

        return (
          <BookingCard key={booking.id}>
            <CardHeader>
              <ExperienceName>{booking.class_name || "N/A"}</ExperienceName>
              <GuestName>{booking.user_name || "N/A"}</GuestName>
            </CardHeader>

            <CardContent>
              <MetaItem>
                <MetaLabel>
                  <Calendar size={14} /> Experience Date
                </MetaLabel>
                <MetaValue>
                  {booking.date
                    ? moment(booking.date).format("MMM D, YYYY")
                    : "N/A"}
                </MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>
                  <Clock size={14} /> Experience Time
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
              <MetaItem>
                <MetaLabel>
                  <Clock size={14} /> Booked On
                </MetaLabel>
                <MetaValue>
                  {booking.booking_date
                    ? moment(booking.booking_date).format("MMM D, YYYY")
                    : "N/A"}
                </MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaLabel>
                  <BookOpen size={14} /> Experience Option
                </MetaLabel>
                <MetaValue>{booking.option_name || "N/A"}</MetaValue>
              </MetaItem>
              <MetaItem style={{ gridColumn: "1 / -1" }}>
                {" "}
                {/* Span full width for these */}
                <MetaLabel>
                  <Calendar size={14} /> Booking Type
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
              <MetaItem style={{ gridColumn: "1 / -1" }}>
                <MetaLabel>
                  <Hash size={14} /> Status
                </MetaLabel>
                <MetaValue>
                  <StatusTag className={statusLower} icon={statusIcon}>
                    {booking.status?.toUpperCase() || "N/A"}
                  </StatusTag>
                </MetaValue>
              </MetaItem>
              {booking.status === "cancelled" &&
                booking.cancellation_reason && (
                  <MetaItem style={{ gridColumn: "1 / -1" }}>
                    <MetaLabel>
                      <MessageSquare size={14} /> Cancellation Reason
                    </MetaLabel>
                    <MetaValue>{booking.cancellation_reason}</MetaValue>
                  </MetaItem>
                )}
            </CardContent>

            <CardFooter>
              <ActionButton
                icon={<Eye size={16} />}
                onClick={() => showViewDrawer(booking)}
                block
              >
                View Details
              </ActionButton>
            </CardFooter>
          </BookingCard>
        );
      })}
    </BookingsList>
  );
};

export default MobileBookingHistory;
