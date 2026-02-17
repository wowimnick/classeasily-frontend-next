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
  padding: 24px;
  box-shadow: ${theme.shadow};
  border: 1px solid ${theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
  padding: 0 4px;
`;

const MonthLabel = styled(motion.h2)`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin: 0;
  min-width: 140px;
  text-align: center;
`;

const IconButton = styled(motion.button)`
  background: transparent;
  border: 1px solid ${theme.border};
  border-radius: 50%;
  width: 32px;
  height: 32px;
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
`;

const GridContainer = styled.div`
  width: 100%;
`;

const DaysGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  justify-content: center;
  justify-items: center;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  justify-content: center;
  justify-items: center;
`;

const Weekday = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: ${theme.textLight};
  text-transform: uppercase;
`;

const DayButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  font-size: 14px;
  font-weight: 500;
  color: ${theme.textPrimary};
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;

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
          <SkeletonBlock $width="140px" $height="20px" $radius="6px" />
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
            <SkeletonBlock
              key={i}
              $width="40px"
              $height="40px"
              $radius="12px"
              style={{ margin: 0 }}
            />
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
              if (!item.date) return <div key={`empty-${idx}`} />;
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
                <DayButton
                  key={naive}
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
              );
            })}
          </DaysGrid>
        </AnimatePresence>
      </GridContainer>
    </CalendarCard>
  );
}

export default MiniCalendar;
