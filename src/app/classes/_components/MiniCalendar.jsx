"use client";

import React, { useMemo } from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNaiveDate, getLocalYYYYMMDD } from "@/services/utils";

const theme = {
  primary: "#ff385c",
  primaryFade: "rgba(255, 56, 92, 0.04)",
  textPrimary: "#111827",
  textLight: "#9ca3af",
  bg: "#ffffff",
  bgSecondary: "#f3f4f6",
  border: "#e5e7eb",
  radius: "24px",
  shadow: "0 4px 20px rgba(0,0,0,0.05)",
};

const CalendarCard = styled(motion.div)`
  background: ${theme.bg};
  border-radius: ${theme.radius};
  padding: clamp(12px, 4vw, 24px);
  box-shadow: ${theme.shadow};
  border: 1px solid ${theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: min(390px, 100%);
  min-width: 0;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 380px) {
    padding: 10px;
    border-radius: 16px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(12px, 3vw, 24px);
  width: 100%;
  min-width: 0;
  padding: 0 2px;
  gap: 6px;
`;

const MonthLabel = styled(motion.h2)`
  font-size: clamp(13px, 3.8vw, 16px);
  font-weight: 700;
  color: ${theme.textPrimary};
  margin: 0;
  min-width: 0;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 380px) {
    font-size: 13px;
  }
`;

const IconButton = styled(motion.button)`
  background: transparent;
  border: 1px solid ${theme.border};
  border-radius: 50%;
  width: clamp(28px, 8vw, 32px);
  height: clamp(28px, 8vw, 32px);
  min-width: 28px;
  min-height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.textPrimary};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${theme.primary};
    color: ${theme.primary};
    background: ${theme.primaryFade};
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 380px) {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
  }
`;

const GridContainer = styled.div`
  width: 100%;
  min-width: 0;
`;

const DaysGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(4px, 1.5vw, 8px);
  width: 100%;
  min-width: 0;
  justify-items: center;
  align-items: center;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(4px, 1.5vw, 8px);
  margin-bottom: clamp(6px, 1.5vw, 12px);
  width: 100%;
  min-width: 0;
  justify-items: center;
`;

const Weekday = styled.div`
  text-align: center;
  font-size: clamp(9px, 2.5vw, 11px);
  font-weight: 700;
  color: ${theme.textLight};
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 380px) {
    font-size: 9px;
  }
`;

const DayCell = styled.div`
  width: 100%;
  max-width: 44px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
`;

const DayButton = styled(motion.button)`
  width: 100%;
  height: 100%;
  min-width: 24px;
  min-height: 24px;
  max-width: 44px;
  max-height: 44px;
  aspect-ratio: 1;
  border: 2px solid transparent;
  background: transparent;
  border-radius: clamp(8px, 2vw, 12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  font-size: clamp(12px, 3.2vw, 14px);
  font-weight: 500;
  color: ${theme.textPrimary};
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  box-sizing: border-box;

  ${(props) =>
    !props.$inMonth &&
    css`
      color: ${theme.textLight};
      opacity: 0.3;
    `}

  ${(props) =>
    props.$isPast &&
    css`
      color: ${theme.textLight};
      opacity: 0.45;
      cursor: default;
    `}

  ${(props) =>
    props.$unavailableFuture &&
    css`
      cursor: not-allowed;
      color: ${theme.textLight};
      opacity: 0.7;
      background: ${theme.bgSecondary};
    `}

  ${(props) =>
    props.$isToday &&
    !props.$isSelected &&
    css`
      border-color: ${theme.border};
      font-weight: 600;
    `}

  ${(props) =>
    props.$hasSlots &&
    !props.$isSelected &&
    !props.$isPast &&
    css`
      font-weight: 700;
      background: ${theme.bgSecondary};

      &:hover {
        background: ${theme.primaryFade};
        color: ${theme.primary};
      }
    `}

  ${(props) =>
    props.$isSelected &&
    css`
      background: ${theme.primary} !important;
      color: white !important;
      font-weight: 600;
      border-color: ${theme.primary} !important;
    `}
`;

const SkeletonBlock = styled.div`
  background: #f0f0f0;
  border-radius: ${(p) => p.$radius || "4px"};
  width: ${(p) => p.$width || "100%"};
  height: ${(p) => p.$height || "16px"};
  animation: pulse 1.5s infinite ease-in-out;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

/** Start of calendar day (midnight local) as timestamp for reliable date-only comparison */
function getDayStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function MiniCalendar({
  availableSlots = {},
  loading = false,
  selectedDate,
  onDateSelect,
  currentDate,
  onMonthChange,
  minSelectableDate,
  today,
}) {
  const todayStart = useMemo(() => getDayStart(today), [today]);
  const minSelectableStart = useMemo(() => getDayStart(minSelectableDate), [minSelectableDate]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ date: null });
    for (let i = 1; i <= daysCount; i++)
      days.push({ date: new Date(year, month, i) });
    return days;
  }, [currentDate]);

  const handleDateClick = (date) => {
    if (!date || getDayStart(date) < minSelectableStart) return;
    const naive = getLocalYYYYMMDD(date);
    if (!(availableSlots[naive]?.length > 0)) return;
    onDateSelect(date);
  };

  const handleMonthChange = (direction) => {
    onMonthChange(direction);
  };

  if (loading) {
    return (
      <CalendarCard>
        <HeaderRow>
          <IconButton disabled>
            <ChevronLeft size={20} />
          </IconButton>
          <SkeletonBlock $width="min(140px, 50%)" $height="20px" $radius="6px" />
          <IconButton disabled>
            <ChevronRight size={20} />
          </IconButton>
        </HeaderRow>
        <WeekdayRow>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Weekday key={d}>{d}</Weekday>
          ))}
        </WeekdayRow>
        <DaysGrid>
          {[...Array(35)].map((_, i) => (
            <DayCell key={i}>
              <SkeletonBlock
                $width="100%"
                $height="100%"
                $radius="12px"
                style={{ margin: 0 }}
              />
            </DayCell>
          ))}
        </DaysGrid>
      </CalendarCard>
    );
  }

  return (
    <CalendarCard>
      <HeaderRow>
        <IconButton
          type="button"
          onClick={() => handleMonthChange(-1)}
          disabled={
            getDayStart(currentDate) <= todayStart &&
            currentDate.getMonth() === new Date(todayStart).getMonth()
          }
        >
          <ChevronLeft size={20} />
        </IconButton>
        <AnimatePresence mode="wait">
          <MonthLabel
            key={currentDate.toString()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {formatNaiveDate(getLocalYYYYMMDD(currentDate), "MMMM yyyy")}
          </MonthLabel>
        </AnimatePresence>
        <IconButton type="button" onClick={() => handleMonthChange(1)}>
          <ChevronRight size={20} />
        </IconButton>
      </HeaderRow>

      <GridContainer>
        <WeekdayRow>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Weekday key={d}>{d}</Weekday>
          ))}
        </WeekdayRow>

        <AnimatePresence mode="wait">
          <DaysGrid
            key={currentDate.toString()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {daysInMonth.map((item, idx) => {
              if (!item.date) {
                return <DayCell key={`empty-${idx}`} />;
              }
              const naive = getLocalYYYYMMDD(item.date);
              const itemDayStart = getDayStart(item.date);
              const isPast = itemDayStart < todayStart;
              const isBeforeMin = itemDayStart < minSelectableStart;
              const hasSlots =
                !isBeforeMin && (availableSlots[naive]?.length > 0);
              const isUnavailableFuture =
                !isPast && (isBeforeMin || (!hasSlots && !loading));
              const isSel =
                selectedDate && getLocalYYYYMMDD(selectedDate) === naive;
              const isToday = itemDayStart === todayStart;

              return (
                <DayCell key={naive}>
                  <DayButton
                    type="button"
                    disabled={isPast || isUnavailableFuture}
                    $inMonth={true}
                    $hasSlots={hasSlots}
                    $isSelected={isSel}
                    $isPast={isPast}
                    $unavailableFuture={isUnavailableFuture}
                    $isToday={isToday}
                    onClick={() =>
                      !isPast &&
                      !isUnavailableFuture &&
                      handleDateClick(item.date)
                    }
                    whileTap={hasSlots && !isPast ? { scale: 0.9 } : {}}
                  >
                    {item.date.getDate()}
                  </DayButton>
                </DayCell>
              );
            })}
          </DaysGrid>
        </AnimatePresence>
      </GridContainer>
    </CalendarCard>
  );
}

export default MiniCalendar;
