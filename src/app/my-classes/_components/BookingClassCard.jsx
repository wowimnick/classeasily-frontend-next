"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CalendarDays,
  Users,
  MoreHorizontal,
  AlertCircle,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { Button, Tooltip, Dropdown, Alert, Tag } from "antd";
import { theme } from "@/components/theme";

// --- Main Card Styles ---

const CardContainer = styled(motion.div)`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: #d9d9d9;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  height: 140px;
  width: 100%;
  background: #f5f5f5;
  overflow: hidden;
`;

const ClassImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  color: ${(props) => {
    switch (props.$status) {
      case "confirmed":
        return "#287D3C";
      case "completed":
        return "#006d9c";
      case "cancelled":
        return "#D80027";
      default:
        return "#666666";
    }
  }};
`;

const CardContent = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ClassTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BusinessName = styled.div`
  font-size: 13px;
  color: #717171;
  margin-bottom: 8px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Divider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: 8px 0;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  color: #555;
  font-size: 13px;

  svg {
    color: ${theme.token.colorPrimary};
    width: 14px;
    height: 14px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  span,
  a {
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const PriceTag = styled.div`
  display: inline-flex;
  align-items: center;
  background: ${(props) => (props.$isFree ? "#e6fffa" : "#f0fdf4")};
  color: ${(props) => (props.$isFree ? "#047481" : "#15803d")};
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
  align-self: flex-start;
  margin-bottom: 8px;
`;

const LocationLink = styled.a`
  color: inherit;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
    color: ${theme.token.colorPrimary};
  }
`;

const CardFooter = styled.div`
  padding: 10px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ViewScheduleButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${theme.token.colorPrimary};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

// --- New "Clean" Popup Styles (Copied/Adapted from ClientHeader) ---

// Uses a fixed positioning but with a very subtle/transparent overlay
const PopupOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000; /* High z-index like header popup */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05); /* Extremely subtle dim, no blur */
`;

const PopupCard = styled(motion.div)`
  background: white;
  width: 90%;
  max-width: 400px;
  border-radius: 24px; /* Matches header UnifiedPopupContainer */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); /* Matches header shadow */
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 80vh;
  position: relative;
`;

const PopupHeader = styled.div`
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #222;
  }
`;

const ClosePopupButton = styled.button`
  background: #f7f7f7;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #222;
  transition: all 0.2s;

  &:hover {
    background: #e5e5e5;
    transform: scale(1.05);
  }
`;

const PopupBody = styled.div`
  padding: 12px 0;
  overflow-y: auto;
`;

const SessionRow = styled.div`
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f9f9f9;
  background: ${(props) => (props.$isCurrent ? "#fff0f2" : "white")};
  transition: background 0.2s;

  &:hover {
    background: #f9f9f9;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const SessionNumber = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${(props) => (props.$isCompleted ? "#e6fffa" : "#f1f1f1")};
  color: ${(props) => (props.$isCompleted ? "#047481" : "#717171")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const SessionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SessionDate = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #222;
`;

const SessionTime = styled.div`
  font-size: 13px;
  color: #717171;
`;

const BookingClassCard = ({
  booking,
  onShowCancellationInfo,
  onLeaveReview,
  onBookAgain,
}) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const statusMap = {
    confirmed: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const renderLocation = () => {
    const address = booking.location_address_string;
    if (!address && !booking.coordinates)
      return <span>Online / Location unavailable</span>;

    const mapsQuery = address
      ? encodeURIComponent(address)
      : booking.coordinates;
    return (
      <Tooltip title={address}>
        <LocationLink
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {address || "View on Map"}
        </LocationLink>
      </Tooltip>
    );
  };

  const renderPrice = () => {
    if (booking.status === "cancelled") return null;
    const price = parseFloat(booking.price);
    const isFree = isNaN(price) || price === 0;

    return (
      <PriceTag $isFree={isFree}>
        {isFree ? "FREE" : `$${price.toFixed(2)}`}
      </PriceTag>
    );
  };

  const renderActions = () => {
    const isUpcoming = booking.status === "confirmed";
    const isCompleted = booking.status === "completed";
    const buttonSize = "small";

    if (isUpcoming) {
      return (
        <Dropdown
          menu={{
            items: [
              {
                key: "cancel",
                label: "Cancel Booking",
                icon: <AlertCircle size={14} />,
                danger: true,
                onClick: () => onShowCancellationInfo(booking),
              },
            ],
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button size={buttonSize} icon={<MoreHorizontal size={14} />}>
            Options
          </Button>
        </Dropdown>
      );
    }

    if (isCompleted) {
      return (
        <>
          <Button
            size={buttonSize}
            onClick={() => onLeaveReview(booking)}
            disabled={booking.has_review}
            type={booking.has_review ? "default" : "primary"}
            ghost={!booking.has_review}
          >
            {booking.has_review ? "Reviewed" : "Review"}
          </Button>
          <Button
            size={buttonSize}
            type="primary"
            onClick={() => onBookAgain(booking)}
          >
            Book Again
          </Button>
        </>
      );
    }

    return (
      <Button size={buttonSize} onClick={() => onBookAgain(booking)}>
        Book Again
      </Button>
    );
  };

  return (
    <>
      <CardContainer
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ImageContainer>
          <ClassImage
            src={booking.class_image_large_url || "/api/placeholder/400/300"}
            alt={booking.class_name}
          />
          <StatusBadge $status={booking.status}>
            {statusMap[booking.status] || booking.status}
          </StatusBadge>
        </ImageContainer>

        <CardContent>
          {booking.enrollment_type === "Full Course" &&
            booking.session_info && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Tag
                  color="blue"
                  style={{
                    fontSize: "10px",
                    lineHeight: "16px",
                    margin: 0,
                  }}
                >
                  Session {booking.session_info.current_session}/
                  {booking.session_info.total_sessions}
                </Tag>

                {booking.all_sessions && (
                  <ViewScheduleButton onClick={() => setShowSchedule(true)}>
                    View Schedule <ChevronRight size={12} />
                  </ViewScheduleButton>
                )}
              </div>
            )}

          <ClassTitle title={booking.class_name}>
            {booking.class_name || "Class Name Unavailable"}
          </ClassTitle>
          <BusinessName>{booking.business_name || "Instructor"}</BusinessName>

          {renderPrice()}

          <Divider />

          <DetailRow>
            <CalendarDays />
            <span>{booking.userLocalSessionTime}</span>
          </DetailRow>

          <DetailRow>
            <MapPin />
            <div style={{ flex: 1, minWidth: 0 }}>{renderLocation()}</div>
          </DetailRow>

          {booking.participants > 1 && (
            <DetailRow>
              <Users />
              <span>{booking.participants} Participants</span>
            </DetailRow>
          )}

          {booking.status === "cancelled" && (
            <Alert
              type="error"
              message="Cancelled"
              style={{
                marginTop: 8,
                fontSize: 12,
                padding: "4px 8px",
              }}
            />
          )}
        </CardContent>

        <CardFooter>{renderActions()}</CardFooter>
      </CardContainer>

      {/* --- Updated Schedule Popup --- */}
      <AnimatePresence>
        {showSchedule && booking.all_sessions && (
          <PopupOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSchedule(false)}
          >
            <PopupCard
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <PopupHeader>
                <h4>Course Schedule</h4>
                <ClosePopupButton onClick={() => setShowSchedule(false)}>
                  <X size={18} />
                </ClosePopupButton>
              </PopupHeader>
              <PopupBody>
                {booking.all_sessions.map((session, idx) => {
                  const isCompleted = session.status === "completed";
                  const isCurrent = session.id === booking.id;

                  return (
                    <SessionRow key={session.id} $isCurrent={isCurrent}>
                      <SessionNumber $isCompleted={isCompleted}>
                        {isCompleted ? <Check size={14} /> : idx + 1}
                      </SessionNumber>
                      <SessionInfo>
                        <SessionDate>Session {idx + 1}</SessionDate>
                        <SessionTime>{session.userLocalSessionTime}</SessionTime>
                      </SessionInfo>
                    </SessionRow>
                  );
                })}
              </PopupBody>
            </PopupCard>
          </PopupOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingClassCard;