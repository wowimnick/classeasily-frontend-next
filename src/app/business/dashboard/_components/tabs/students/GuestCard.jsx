import React from "react";
import styled from "styled-components";
import { Card, Avatar, Tag, Tooltip, Dropdown, Menu, Button } from "antd";
import {
  User,
  Phone,
  Mail,
  CalendarCheck2,
  MoreVertical,
  Trash2,
  BookOpen,
  DollarSign,
} from "lucide-react";
import dayjs from "dayjs";
import NumberFlow from "@number-flow/react";
import { formatPhoneNumber } from "@/services/utils";

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  textSecondary: "#64748b",
  border: "#f1f5f9",
  textPrimary: "#334155",
  lightBg: "#f8fafc",
};

const StyledCard = styled(Card)`
  border-radius: 16px;
  border: 1px solid ${colors.border};
  background: #ffffff;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
  height: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }
  .ant-card-body {
    padding: 20px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const AvatarContainer = styled.div`
  position: relative;
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    right: 0;
    width: 14px;
    height: 14px;
    background-color: ${(props) => props.$statusColor};
    border: 2px solid #ffffff;
    border-radius: 50%;
  }
`;

const StyledAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  .lucide {
    font-size: 28px;
    color: ${colors.textSecondary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  background: ${colors.lightBg};
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled.span`
  color: ${colors.textSecondary};
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
  font-weight: 500;
  svg {
    width: 12px;
    height: 12px;
  }
`;

const InfoValue = styled.span`
  color: ${colors.textPrimary};
  font-size: 15px;
  font-weight: 600;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${colors.textPrimary};
  font-size: 13px;
  svg {
    color: ${colors.textSecondary};
    width: 14px;
    height: 14px;
  }
  span,
  a {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${colors.textPrimary};
    text-decoration: none;
    &:hover {
      color: ${colors.primary};
    }
  }
`;

const MoreButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  box-shadow: none;
  background: transparent;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const GuestCard = ({ guest, onClick, onDelete, isReady }) => {
  if (!guest) return null;

  const isPlatformUser = guest.type === "user";
  const isGuest = guest.type === "guest";
  const isActiveGuest = guest.is_active === true;
  const statusColor = isActiveGuest ? colors.success : colors.textSecondary;
  const avatarLetter = guest.first_name
    ? guest.first_name[0].toUpperCase()
    : guest.email
    ? guest.email[0].toUpperCase()
    : "?";

  const lastBookingDateFormatted = guest.last_booking_date_this_business
    ? dayjs(guest.last_booking_date_this_business).format("MMM D, YYYY")
    : "N/A";

  const { display: phoneDisplay, link: phoneLink } = formatPhoneNumber(
    guest.phone_number
  );

  const tooltipText = isPlatformUser
    ? "Registered platform user who has booked a class with your business."
    : isGuest
    ? "Guest who booked a class with your business (no platform account)."
    : "Imported or manually added contact. They may not have booked yet.";

  const menu = (
    <Menu>
      {!isPlatformUser && (
        <Menu.Item
          key="delete"
          danger
          icon={<Trash2 size={14} />}
          onClick={(e) => {
            e.domEvent.stopPropagation();
            onDelete();
          }}
        >
          Delete Contact
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <StyledCard onClick={onClick} hoverable>
      {" "}
      {!isPlatformUser && (
        <Dropdown overlay={menu} trigger={["click"]}>
          <MoreButton
            icon={<MoreVertical size={18} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      )}
      <CardHeader>
        <AvatarContainer $statusColor={statusColor}>
          <StyledAvatar
            src={guest.avatar_thumb_url}
            icon={!guest.avatar_thumb_url ? <User /> : null}
          >
            {!guest.avatar_thumb_url && avatarLetter}
          </StyledAvatar>
        </AvatarContainer>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
              color: colors.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {guest.first_name || "Unknown"} {guest.last_name || ""}
          </h3>
          <Tooltip title={tooltipText}>
            <Tag
              color={isPlatformUser ? "blue" : isGuest ? "purple" : "default"}
            >
              {isPlatformUser
                ? "Platform User"
                : isGuest
                ? "Guest Booking"
                : "Imported Contact"}
            </Tag>
          </Tooltip>
        </div>
      </CardHeader>
      <InfoGrid>
        <InfoItem>
          <InfoLabel>
            <BookOpen size={12} /> Experiences Taken
          </InfoLabel>
          <InfoValue>
            <NumberFlow
              value={isReady ? guest.total_classes_taken ?? 0 : 0}
              duration={800}
              numberFormatOptions={{ maximumFractionDigits: 0 }}
            />
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>
            <DollarSign size={12} /> Total Spent
          </InfoLabel>
          <InfoValue>
            $
            <NumberFlow
              value={isReady ? guest.total_spent_this_business || 0 : 0}
              duration={800}
              numberFormatOptions={{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>
            <CalendarCheck2 size={12} /> Last Booking
          </InfoLabel>
          <InfoValue>{lastBookingDateFormatted}</InfoValue>
        </InfoItem>
      </InfoGrid>
      <ContactInfo>
        {guest.email && (
          <ContactItem>
            <Mail />
            <Tooltip title={guest.email}>
              <a
                href={`mailto:${guest.email}`}
                onClick={(e) => e.stopPropagation()}
              >
                {guest.email}
              </a>
            </Tooltip>
          </ContactItem>
        )}
        {guest.phone_number && (
          <ContactItem>
            <Phone />
            {phoneLink ? (
              <a href={phoneLink} onClick={(e) => e.stopPropagation()}>
                {phoneDisplay}
              </a>
            ) : (
              <span>{phoneDisplay}</span>
            )}
          </ContactItem>
        )}
        {!guest.phone_number && !guest.email && (
          <ContactItem>
            <span style={{ color: colors.textSecondary, fontStyle: "italic" }}>
              No contact info
            </span>
          </ContactItem>
        )}
      </ContactInfo>
    </StyledCard>
  );
};

export default GuestCard;
