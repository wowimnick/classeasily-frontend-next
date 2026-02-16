"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Button as AntButton } from "antd";
import { Calendar, Tag, ArrowRight } from "lucide-react";
import dayjs from "dayjs";
import { fromZonedTime } from "date-fns-tz";
import { formatBusinessLocalToUserDisplay } from "@/services/utils";

const CardWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  z-index: 1;
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

// Course details and schedule
const CourseDetailsContainer = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #f0f0f0;
`;

const CourseDetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #484848;

  &:last-child {
    margin-bottom: 0;
  }

  svg {
    color: #1890ff; /* Blue for course info */
    width: 16px;
    height: 16px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  strong {
    font-weight: 600;
    color: #222;
    margin-right: 4px;
  }
`;

const ScheduleInfo = styled.div`
  background: #f8f9fa;
  box-shadow: 0px 0px 8px 4px #0000000c;
  border-radius: 8px;
  padding: 0.75rem 0.75rem 0.75rem 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  position: relative;
`;

const ScheduleTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.3rem;

  svg {
    color: #ff385c;
    width: 14px;
    height: 14px;
  }
`;

const TimelineLine = styled.div`
  position: absolute;
  left: 1.22rem;
  top: 2.5rem;
  bottom: 1.25rem;
  width: 1px;
  background: linear-gradient(180deg, #ff385c 0%, rgba(255, 56, 92, 0.25) 100%);
  border-radius: 1px;
  pointer-events: none;
`;

const ScheduleList = styled.div`
  position: relative;
  padding-left: 1.092rem;
`;

const ScheduleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0 0.35rem 0.75rem;
  color: #666;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: -0.56rem;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff385c;
    box-shadow: 0 0 0 2px #fff;
  }

  &:not(:last-child) {
    margin-bottom: 0.15rem;
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
  flex-direction: row;
  align-items: baseline;
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
  businessTimeZone,
}) => {
  if (!option) {
    return <CardWrapper>No option details available.</CardWrapper>;
  }

  const optionId = option.optionId;
  const type = option.booking_type;
  const isCourse = type === "Full Course";
  const schedules = Array.isArray(option.schedules) ? option.schedules : [];
  const userTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Etc/UTC";
  const bizTz = businessTimeZone || "Etc/UTC";

  // Class start as UTC timestamp (date+time in business TZ). Falls back to local parse if no biz TZ.
  const getClassStartMs = (s) => {
    if (!s?.date || !s?.time) return 0;
    const timeParts = String(s.time).split(":");
    const timeStr = `${timeParts[0]}:${timeParts[1] || "00"}:${timeParts[2] || "00"}`;
    const dateTimeStr = `${s.date}T${timeStr}`;
    if (bizTz && bizTz !== "Etc/UTC") {
      try {
        return fromZonedTime(dateTimeStr, bizTz).getTime();
      } catch {
        return dayjs(dateTimeStr).valueOf();
      }
    }
    return dayjs(dateTimeStr).valueOf();
  };

  // "Today" in business TZ (YYYY-MM-DD) for calendar-date comparison
  const todayInBizTz = useMemo(() => {
    if (!bizTz || bizTz === "Etc/UTC") return dayjs().format("YYYY-MM-DD");
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: bizTz });
    } catch {
      return dayjs().format("YYYY-MM-DD");
    }
  }, [bizTz]);

  const now = Date.now();

  // Logic for Courses: next upcoming start (by business-local date >= today, then by time)
  const nextCourseSchedule = isCourse
    ? schedules
        .filter((s) => s.date && s.date >= todayInBizTz)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return getClassStartMs(a) - getClassStartMs(b);
        })[0]
    : null;

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      return dayjs(`2000-01-01 ${timeStr}`, "YYYY-MM-DD HH:mm:ss").format(
        "h:mm A",
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

  // Format session date+time for display: in user TZ when business TZ is known
  const formatSessionDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "";
    if (bizTz && bizTz !== "Etc/UTC") {
      try {
        const datePart = formatBusinessLocalToUserDisplay(
          dateStr,
          timeStr,
          bizTz,
          userTz,
          { dateTimeFormat: "EEE, MMM d" }
        );
        const timePart = formatBusinessLocalToUserDisplay(
          dateStr,
          timeStr,
          bizTz,
          userTz,
          { dateTimeFormat: "h:mm a zzz" }
        );
        if (datePart !== "Invalid Date" && timePart !== "Invalid Time") {
          return `${datePart} at ${timePart}`;
        }
      } catch (e) {
        // fall through to naive
      }
    }
    return `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
  };

  // Updated logic to include $0 (Free) pricing
  const getPriceRange = () => {
    if (!schedules.length) return { min: 0, max: 0, display: "-" };

    // Include 0 in the prices array
    const prices = schedules
      .map((s) => parseFloat(s.price || 0))
      .filter((p) => !isNaN(p));

    if (prices.length === 0) return { min: 0, max: 0, display: "-" };

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Determine display string
    let display = "";
    if (min === 0 && max === 0) {
      display = "Free";
    } else if (min === 0) {
      display = `Free - $${max}`;
    } else if (min === max) {
      display = `$${min}`;
    } else {
      display = `$${min} - $${max}`;
    }

    return { min, max, display };
  };

  const priceInfo = getPriceRange();

  // Filter generic upcoming sessions (non-course): class start (in business TZ) must be in the future
  const upcomingSchedules = !isCourse
    ? schedules
        .filter((s) => s.date && s.time && getClassStartMs(s) > now)
        .sort((a, b) => getClassStartMs(a) - getClassStartMs(b))
        .slice(0, 3)
    : [];

  const formatSchedulePrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return numPrice === 0 ? "Free" : `$${numPrice}`;
  };

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
            <Price>{priceInfo.display}</Price>
            <PriceRange>{isCourse ? "/ full course" : "/ person"}</PriceRange>
          </PriceDisplay>
        </PricingSection>
      </Header>


      {/* New Course Specific Details */}
      {isCourse && nextCourseSchedule && (
        <CourseDetailsContainer>
          <CourseDetailRow>
            <Calendar />
            <div>
              <strong>Next Start:</strong>
              {formatDate(nextCourseSchedule.date)}
            </div>
          </CourseDetailRow>
          {nextCourseSchedule.end_date && (
            <CourseDetailRow>
              <ArrowRight size={14} style={{ transform: "rotate(0deg)" }} />
              <div>
                <strong>Ends:</strong>
                {formatDate(nextCourseSchedule.end_date)}
              </div>
            </CourseDetailRow>
          )}
          <CourseDetailRow>
            <Clock />
            <div>
              <strong>Schedule:</strong>
              Every{" "}
              {Array.isArray(nextCourseSchedule.days)
                ? nextCourseSchedule.days.join(", ")
                : "Week"}{" "}
              at{" "}
              {bizTz && bizTz !== "Etc/UTC" && nextCourseSchedule.date && nextCourseSchedule.time
                ? (() => {
                    try {
                      const t = formatBusinessLocalToUserDisplay(
                        nextCourseSchedule.date,
                        nextCourseSchedule.time,
                        bizTz,
                        userTz,
                        { dateTimeFormat: "h:mm a zzz" }
                      );
                      return t !== "Invalid Time" ? t : formatTime(nextCourseSchedule.time);
                    } catch {
                      return formatTime(nextCourseSchedule.time);
                    }
                  })()
                : formatTime(nextCourseSchedule.time)}
            </div>
          </CourseDetailRow>
        </CourseDetailsContainer>
      )}

      {/* Upcoming Sessions with timeline */}
      {upcomingSchedules.length > 0 && (
        <ScheduleInfo>
          <ScheduleTitle>
            <Calendar size={14} />
            Upcoming Sessions
          </ScheduleTitle>
          {upcomingSchedules.length > 1 && <TimelineLine />}
          <ScheduleList>
            {upcomingSchedules.map((schedule, index) => (
              <ScheduleItem key={schedule.id || index}>
                <span>
                  {formatSessionDateTime(schedule.date, schedule.time) ||
                    `${schedule.date ? formatDate(schedule.date) : schedule.day} at ${formatTime(schedule.time)}`}
                </span>
                <span>{formatSchedulePrice(schedule.price)}</span>
              </ScheduleItem>
            ))}
          </ScheduleList>
        </ScheduleInfo>
      )}

      <SelectContainer>
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
