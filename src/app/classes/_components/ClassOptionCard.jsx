// ClassOptionCard.jsx
"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Button as AntButton } from "antd";
import { Clock, Users, Calendar, Tag } from "lucide-react";
import { getScheduleSummary } from "./steps/utils";
import dayjs from "dayjs";

const CardWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 1.25rem;
  transition: all 0.2s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
`;

const TypeBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: ${(props) => (props.$isCourse ? "#e6f7ff" : "#f6f6f6")};
  color: ${(props) => (props.$isCourse ? "#1890ff" : "#666")};
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const LevelBadge = styled.div`
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  color: #666;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: capitalize;
`;

const DetailsGrid = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  padding: 0.5rem 0.75rem;
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  svg {
    color: #ff385c;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

const ScheduleInfo = styled.div`
  background: #f8f9fa;
  box-shadow: 0px 0px 8px 4px #0000000c;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
`;

const ScheduleTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #ff385c;
    width: 14px;
    height: 14px;
  }
`;

const ScheduleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  color: #666;

  &:not(:last-child) {
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
    margin-bottom: 0.25rem;
  }
`;

const PricingSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1rem;
`;

const PriceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Price = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff385c;
  line-height: 1;
`;

const PriceRange = styled.span`
  font-size: 0.75rem;
  color: #767676;
  line-height: 1;
`;

const ReserveButton = styled(AntButton)`
  height: 36px !important;
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  border-radius: 14px !important;
  width: fit-content;
  padding: 1.2rem 3rem;
`;

const SelectContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const ClassOptionCard = ({
  option,
  classTitle,
  classImages,
  currency,
  onBookNow,
}) => {
  if (!option) {
    return <CardWrapper>No option details available.</CardWrapper>;
  }

  const optionId = option.optionId;
  const type = option.booking_type;
  const level = option.level || "all";
  const isCourse = type === "Full Course";
  const schedules = Array.isArray(option.schedules) ? option.schedules : [];

  const summary = getScheduleSummary(schedules);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      return dayjs(`2000-01-01 ${timeStr}`, "YYYY-MM-DD HH:mm:ss").format(
        "h:mm A"
      );
    } catch (e) {
      return timeStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return dayjs(dateStr).format("ddd, MMM D");
    } catch (e) {
      return dateStr;
    }
  };

  const getPriceRange = () => {
    if (!schedules.length) return { min: 0, max: 0, display: "-" };

    const prices = schedules
      .map((s) => parseFloat(s.price || 0))
      .filter((p) => p > 0);

    if (prices.length === 0) return { min: 0, max: 0, display: "-" };

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
      return { min, max, display: `${min}` };
    } else {
      return { min, max, display: `${min} - ${max}` };
    }
  };

  const priceInfo = getPriceRange();
  const upcomingSchedules = schedules
    .filter((s) => s.date && dayjs(s.date).isAfter(dayjs().subtract(1, "day")))
    .sort((a, b) => {
      const dateTimeA = dayjs(`${a.date}T${a.time}`);
      const dateTimeB = dayjs(`${b.date}T${b.time}`);
      return dateTimeA - dateTimeB;
    })
    .slice(0, 3);

  const handleReserveClick = () => {
    if (optionId && onBookNow) {
      onBookNow(optionId);
    }
  };

  const isButtonDisabled = !optionId || schedules.length === 0;

  return (
    <CardWrapper aria-labelledby={`option-${optionId}`}>
      <Header>
        <PricingSection>
          <PriceDisplay>
            <Price>${priceInfo.display}</Price>
            <PriceRange>{isCourse ? "/ course" : "/ session"}</PriceRange>
          </PriceDisplay>
        </PricingSection>
        <TypeBadge $isCourse={isCourse}>
          <Tag size={12} />
          {isCourse ? "Course" : "Single Session"}
        </TypeBadge>
      </Header>

      <DetailsGrid>
        <DetailItem>
          <Clock size={14} />
          {summary?.duration || "Duration varies"}
        </DetailItem>
        <DetailItem>
          <Users size={14} />
          {summary?.capacity + " spots available" || "Available spots vary"}
        </DetailItem>
        {summary?.minParticipants && (
          <DetailItem>
            <Users size={14} />
            {summary.minParticipants}
          </DetailItem>
        )}
      </DetailsGrid>

      {upcomingSchedules.length > 0 && (
        <ScheduleInfo>
          <ScheduleTitle>
            <Calendar size={14} />
            Upcoming Sessions
          </ScheduleTitle>
          {upcomingSchedules.map((schedule, index) => (
            <ScheduleItem key={schedule.id || index}>
              <span>
                {schedule.date ? formatDate(schedule.date) : schedule.day} at{" "}
                {formatTime(schedule.time)}
              </span>
              <span>${schedule.price}</span>
            </ScheduleItem>
          ))}
        </ScheduleInfo>
      )}
      <SelectContainer
      >
        <ReserveButton
          type="primary"
          onClick={handleReserveClick}
          disabled={isButtonDisabled}
          aria-label={isCourse ? "View Course Dates" : "Select Time"}
        >
          {isCourse ? "View Course Dates" : "Select Time"}
        </ReserveButton>
      </SelectContainer>
    </CardWrapper>
  );
};

export default ClassOptionCard;
