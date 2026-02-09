"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

// --- Styled Components ---

const CalendarWrapper = styled.div`
  width: 100%;
  user-select: none;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-weight: 700;
  font-size: 16px;
  color: #111;
  position: relative;
`;

const MonthTitle = styled.div`
  flex: 1;
  text-align: center;
`;

const NavBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #f3f4f6;
  }
`;

const DoubleMonthGrid = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
`;

const MonthSection = styled.div`
  flex: 1;
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  text-align: center;
  font-size: 12px;
  color: #999;
  font-weight: 600;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
`;

const DayBtn = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  position: relative;
  background: transparent;
  color: ${(props) =>
    props.$isWhiteText ? "white" : props.$isDisabled ? "#e5e7eb" : "#374151"};
  cursor: ${(props) => (props.$isDisabled ? "not-allowed" : "pointer")};
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  width: 100%;
  isolation: isolate;

  &:hover {
    background: ${(props) =>
      !props.$hasSelection && !props.$isDisabled ? "#f3f4f6" : "transparent"};
    border-radius: 50%;
  }
`;

const DayBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  z-index: -1;
  background: ${(props) => props.$bgColor};
  border-radius: ${(props) => props.$radius};
  width: 100%;
  height: 100%;
`;

const QuickSelectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding-top: 20px;
  margin-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const QuickPill = styled.button`
  background: ${(props) => (props.$active ? "#f3f4f6" : "white")};
  border: 1px solid ${(props) => (props.$active ? "#111" : "#e5e7eb")};
  border-radius: 12px;
  padding: 8px 4px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;

  &:hover {
    border-color: #111;
    background: #f9fafb;
  }
`;

const CustomCalendar = ({ value, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const selectedStart = value?.start
    ? dayjs(value.start)
    : value && value.isValid && value.isValid()
      ? dayjs(value)
      : null;
  const selectedEnd = value?.end ? dayjs(value.end) : null;

  const handleDateClick = (dateObj) => {
    onChange(dateObj);
    if (onClose) onClose();
  };

  const nextMonth = () => setCurrentDate(currentDate.add(1, "month"));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));

  const applyPreset = (type) => {
    let start, end;
    const today = dayjs();

    switch (type) {
      case "weekend":
        start = today.day() === 0 ? today.day(6).add(1, "week") : today.day(6);
        end = start.add(1, "day");
        break;
      case "next_weekend":
        start = today.day(6).add(1, "week");
        end = start.add(1, "day");
        break;
      case "this_week":
        start = today;
        end = today.endOf("week");
        break;
      case "next_week":
        start = today.add(1, "week").startOf("week");
        end = today.add(1, "week").endOf("week");
        break;
      default:
        start = today;
        end = null;
    }

    onChange({
      start: start.format("YYYY-MM-DD"),
      end: end ? end.format("YYYY-MM-DD") : null,
    });
  };

  const renderMonthGrid = (baseDate) => {
    const daysInMonth = baseDate.daysInMonth();
    const startDay = baseDate.startOf("month").day();
    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <DayGrid>
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const thisDate = baseDate.date(d);
          const isPast = thisDate.isBefore(dayjs().startOf("day"));

          let isRangeStart = false;
          let isRangeEnd = false;
          let isInRange = false;
          let isSingle = false;

          if (selectedStart && !selectedEnd) {
            isSingle = thisDate.isSame(selectedStart, "day");
          } else if (selectedStart && selectedEnd) {
            const s = selectedStart.startOf("day");
            const e = selectedEnd.startOf("day");
            const t = thisDate.startOf("day");

            isRangeStart = t.isSame(s);
            isRangeEnd = t.isSame(e);
            isInRange = t.isAfter(s) && t.isBefore(e);

            if (isRangeStart && isRangeEnd) {
              isSingle = true;
              isRangeStart = false;
              isRangeEnd = false;
            }
          }

          const hasSelection =
            isSingle || isRangeStart || isRangeEnd || isInRange;

          // Theme color fallback
          const primaryColor = "#e11d48";
          const faintColor = `${primaryColor}15`;

          let bgRadius = "0";
          let bgColor = "transparent";

          if (isSingle) {
            bgRadius = "50%";
            bgColor = primaryColor;
          } else if (isRangeStart) {
            bgRadius = "50% 0 0 50%";
            bgColor = primaryColor;
          } else if (isRangeEnd) {
            bgRadius = "0 50% 50% 0";
            bgColor = primaryColor;
          } else if (isInRange) {
            bgRadius = "0";
            bgColor = faintColor;
          }

          return (
            <DayBtn
              key={d}
              type="button"
              $isDisabled={isPast}
              $hasSelection={hasSelection}
              $isWhiteText={isSingle || isRangeStart || isRangeEnd}
              disabled={isPast}
              onClick={() => handleDateClick(thisDate)}
            >
              <span style={{ position: "relative", zIndex: 2 }}>{d}</span>
              {hasSelection && (
                <DayBackground
                  $bgColor={bgColor}
                  $radius={bgRadius}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </DayBtn>
          );
        })}
      </DayGrid>
    );
  };

  const nextMonthDate = currentDate.add(1, "month");

  return (
    <CalendarWrapper>
      <CalendarHeader>
        <NavBtn onClick={prevMonth} type="button">
          <ChevronLeft size={20} />
        </NavBtn>
        <div style={{ display: "flex", flex: 1 }}>
          <MonthTitle>{currentDate.format("MMMM YYYY")}</MonthTitle>
          <MonthTitle>{nextMonthDate.format("MMMM YYYY")}</MonthTitle>
        </div>
        <NavBtn onClick={nextMonth} type="button">
          <ChevronRight size={20} />
        </NavBtn>
      </CalendarHeader>

      <DoubleMonthGrid>
        <MonthSection>
          <WeekGrid>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </WeekGrid>
          {renderMonthGrid(currentDate)}
        </MonthSection>

        <MonthSection>
          <WeekGrid>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </WeekGrid>
          {renderMonthGrid(nextMonthDate)}
        </MonthSection>
      </DoubleMonthGrid>

      <QuickSelectGrid>
        <QuickPill type="button" onClick={() => applyPreset("weekend")}>
          This Weekend
        </QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("next_weekend")}>
          Next Weekend
        </QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("this_week")}>
          This Week
        </QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("next_week")}>
          Next Week
        </QuickPill>
      </QuickSelectGrid>
    </CalendarWrapper>
  );
};

export default CustomCalendar;
