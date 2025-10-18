"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  CalendarDays,
  AlertCircle,
  MessageCircle,
  Star,
  Building2,
  CheckCircle,
  ListChecks,
  MoreHorizontal,
  Timer,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button, Tooltip, Space, ConfigProvider, Alert, Dropdown } from "antd";
import { theme } from "@/components/theme";

const ListItemContainer = styled(motion.div)`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  font-family: "Proxima Soft", sans-serif;

  &:hover {
    border-color: #d1d1d1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  @media (max-width: 640px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const ClassImage = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f5f5f5;

  @media (max-width: 640px) {
    width: 60px;
    height: 60px;
  }

  @media (max-width: 375px) {
    width: 50px;
    height: 50px;
  }
`;

const ClassInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ClassTitle = styled.h4`
  font-size: 17px;
  font-weight: 700;
  color: #222;
  margin: 0 0 4px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 16px;
  }
`;

const BusinessName = styled.div`
  font-size: 14px;
  color: #717171;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;

  @media (max-width: 640px) {
    font-size: 13px;
  }
`;

const OptionName = styled.div`
  font-size: 12px;
  color: #666;
  background: #f8f8f8;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  margin-top: 4px;
  margin-bottom: 6px;
`;

const StatusActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

const StatusBadge = styled.div`
  padding: 6px 12px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => {
    switch (props.$status) {
      case "confirmed":
        return "#E7F7ED";
      case "completed":
        return "#E3F5FF";
      case "cancelled":
        return "#FFF5F5";
      default:
        return "#F5F5F5";
    }
  }};
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

  @media (max-width: 375px) {
    font-size: 11px;
    padding: 5px 10px;
  }
`;

const SessionBadge = styled.div`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #f0f0f0;
  color: #484848;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 16px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: 14px;
  min-width: 0; /* Prevents container from overflowing */

  svg {
    flex-shrink: 0;
    color: #ff385c;
    width: 15px;
    height: 15px;
  }

  @media (max-width: 640px) {
    font-size: 13px;
  }
`;

const DetailTextContainer = styled.div`
  flex: 1;
  min-width: 0; /* Crucial for allowing the container to shrink */

  span,
  a {
    display: block; /* Ensures the element behaves like a block for truncation */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const LocationLink = styled.a`
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: ${theme.token.colorPrimary};
    text-decoration: underline;
  }
`;

const PriceInfo = styled.div`
  display: inline-flex;
  align-items: center;
  background: #f0fff4;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
`;

const ActionsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const ActionButtons = styled(Space)`
  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 500;
    border-radius: 8px;
    height: 36px;
    padding: 0 14px;
    font-size: 14px;
  }

  @media (max-width: 640px) {
    width: 100%;
    display: flex;
    gap: 8px !important;

    .ant-space-item {
      flex: 1;
    }
    .ant-btn {
      width: 100%;
    }
  }
`;

const MoreActionsButton = styled(Button)`
  &.ant-btn {
    border: 1px solid #d9d9d9;
    color: #666;

    &:hover {
      border-color: ${theme.token.colorPrimary};
      color: ${theme.token.colorPrimary};
    }
  }
`;

const BookingListItem = ({
  booking,
  onShowCancellationInfo,
  onMessageInstructor,
  onLeaveReview,
  onBookAgain,
}) => {
  const statusMap = {
    confirmed: "upcoming",
    completed: "completed",
    cancelled: "cancelled",
  };

  const formatCancellationPolicy = (policyKey) => {
    const policyMap = {
      flexible: "Flexible",
      "24h": "24 Hours Notice",
      "48h": "48 Hours Notice",
      "72h": "72 Hours Notice",
      strict: "Non-refundable",
      custom: "Custom Policy",
    };
    return policyMap[policyKey] || "Standard Policy";
  };

  const renderLocation = () => {
    const address = booking.location_address_string;
    if (!address && !booking.coordinates) {
      return <span>Location unavailable</span>;
    }

    const mapsQuery = address
      ? encodeURIComponent(address)
      : booking.coordinates;

    if (mapsQuery) {
      return (
        <Tooltip title={address || "Click to open in Google Maps"}>
          <LocationLink
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {address || "View on Map"}
          </LocationLink>
        </Tooltip>
      );
    }
    return <span>{address}</span>;
  };

  const renderActions = () => {
    const isUpcoming = booking.status === "confirmed";
    const isCompleted = booking.status === "completed";
    const isCancelled = booking.status === "cancelled";

    const primaryActions = [];
    const secondaryActions = [];

    if (isCompleted) {
      primaryActions.push({
        key: "review",
        element: (
          <Button
            key="review"
            onClick={() => onLeaveReview(booking)}
            disabled={booking.has_review}
            icon={
              booking.has_review ? (
                <CheckCircle size={14} />
              ) : (
                <Star size={14} />
              )
            }
          >
            {booking.has_review ? "Reviewed" : "Review"}
          </Button>
        ),
      });
    }

    if (isCompleted || isCancelled) {
      primaryActions.push({
        key: "book-again",
        element: (
          <Button
            key="book-again"
            type="primary"
            onClick={() => onBookAgain(booking)}
          >
            Book Again
          </Button>
        ),
      });
    }

    if (isUpcoming) {
      secondaryActions.push({
        key: "cancel",
        label: "Cancel Booking",
        icon: <AlertCircle size={14} />,
        danger: true,
        onClick: () => onShowCancellationInfo(booking),
      });
    }

    return (
      <ActionButtons>
        {primaryActions.map((action) => action.element)}

        {secondaryActions.length === 1 && (
          <Button
            danger={secondaryActions[0].danger}
            icon={secondaryActions[0].icon}
            onClick={secondaryActions[0].onClick}
          >
            {secondaryActions[0].label}
          </Button>
        )}

        {secondaryActions.length > 1 && (
          <Dropdown
            menu={{
              items: secondaryActions.map((action) => ({
                key: action.key,
                label: action.label,
                icon: action.icon,
                danger: action.danger,
                onClick: action.onClick,
              })),
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <MoreActionsButton icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        )}
      </ActionButtons>
    );
  };

  return (
    <ConfigProvider theme={theme}>
      <ListItemContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ItemHeader>
          <ClassImage
            src={booking.class_image_large_url || "/api/placeholder/72/72"}
            alt={booking.class_name || "Class image"}
          />
          <ClassInfo>
            <ClassTitle>
              {booking.class_name || "Class Name Missing"}
            </ClassTitle>
            <BusinessName>
              <Building2 size={13} />
              {booking.business_name || "Business Name Missing"}
            </BusinessName>
            {booking.option_name && (
              <OptionName>{booking.option_name}</OptionName>
            )}
            {booking.enrollment_type === "Full Course" &&
              booking.session_info && (
                <SessionBadge>
                  <ListChecks size={12} />
                  Session {booking.session_info.current_session}/
                  {booking.session_info.total_sessions}
                </SessionBadge>
              )}
          </ClassInfo>
          <StatusActions>
            {booking.status && statusMap[booking.status] && (
              <StatusBadge $status={booking.status}>
                {statusMap[booking.status]}
              </StatusBadge>
            )}
          </StatusActions>
        </ItemHeader>

        <DetailsGrid>
          <DetailItem>
            <CalendarDays />
            <DetailTextContainer>
              <span>
                {booking.userLocalSessionTime ||
                  "Date/Time details unavailable"}
              </span>
            </DetailTextContainer>
          </DetailItem>
          <DetailItem>
            <MapPin />
            <DetailTextContainer>{renderLocation()}</DetailTextContainer>
          </DetailItem>
          {booking.duration && (
            <DetailItem>
              <Timer />
              <DetailTextContainer>
                <span>{booking.duration} minutes</span>
              </DetailTextContainer>
            </DetailItem>
          )}
          {booking.participants && (
            <DetailItem>
              <Users />
              <DetailTextContainer>
                <span>
                  {booking.participants}{" "}
                  {booking.participants > 1 ? "participants" : "participant"}
                </span>
              </DetailTextContainer>
            </DetailItem>
          )}
          {booking.cancellation_policy && (
            <DetailItem>
              <ShieldCheck />
              <DetailTextContainer>
                <span>
                  {formatCancellationPolicy(booking.cancellation_policy)} Policy
                </span>
              </DetailTextContainer>
            </DetailItem>
          )}
        </DetailsGrid>

        {booking.status === "cancelled" && (
          <Alert
            message="Booking Cancelled"
            description={
              booking.cancellation_reason || "This booking was cancelled."
            }
            type="error"
            showIcon
            style={{ marginBottom: "16px", borderRadius: "8px" }}
          />
        )}

        <ActionsSection>
          <div>
            {booking.price && booking.status !== "cancelled" && (
              <PriceInfo>
                ${parseFloat(booking.price).toFixed(2)} PAID
              </PriceInfo>
            )}
          </div>
          {renderActions()}
        </ActionsSection>
      </ListItemContainer>
    </ConfigProvider>
  );
};

export default BookingListItem;
