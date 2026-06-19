"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { ChevronLeft } from "lucide-react";
import { getLocalYYYYMMDD } from "@/services/utils";

const INITIAL_MONTHS = 6;
const MONTHS_PER_LOAD = 3;

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #ffffff;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 8px;
  flex-shrink: 0;
  border-bottom: 1px solid #ebebeb;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #000000;
  cursor: pointer;
  border-radius: 50%;

  &:hover {
    background: #f3f4f6;
  }
`;

const TopTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.01em;
`;

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 20px 20px;
  -webkit-overflow-scrolling: touch;
`;

const MonthBlock = styled.div`
  margin-bottom: 28px;
`;

const MonthHeader = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #717171;
  padding: 4px 0;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DayCell = styled.button`
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => (p.$available ? "#000000" : "#d4d4d4")};
  cursor: ${(p) => (p.$available ? "pointer" : "default")};
  border-radius: 50%;
  font-family: inherit;
  padding: 0;
  transition: background 0.15s;

  &:hover {
    background: ${(p) => (p.$available ? "#f3f4f6" : "transparent")};
  }

  ${(p) =>
    p.$selected &&
    `
    background: #000000;
    color: #ffffff;
    &:hover { background: #000000; }
  `}

  &:disabled {
    cursor: default;
  }
`;

const EmptyDayCell = styled.div``;

const LoadMoreBtn = styled.button`
  display: block;
  width: 100%;
  margin: 8px 0 4px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #ebebeb;
  background: #ffffff;
  color: #000000;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);

  &:hover {
    background: #fafafa;
  }
`;

function buildAllMonths(sortedDateStrs, minSelectableDate) {
  if (!sortedDateStrs.length) return [];
  const minStr = minSelectableDate ? getLocalYYYYMMDD(minSelectableDate) : sortedDateStrs[0];
  const firstStr = sortedDateStrs.find((d) => d >= minStr) || sortedDateStrs[0];
  const lastStr = sortedDateStrs[sortedDateStrs.length - 1];
  const [fy, fm] = firstStr.split("-").map(Number);
  const [ly, lm] = lastStr.split("-").map(Number);
  const cursor = new Date(fy, fm - 1, 1);
  const end = new Date(ly, lm - 1, 1);
  const months = [];
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1, 1);
  }
  return months;
}

export default function StackedAvailabilityCalendar({
  sortedDateStrs,
  availableSlots,
  minSelectableDate,
  selectedDate,
  onDateSelect,
  onClose,
  showTopBar = true,
}) {
  const [visibleMonthCount, setVisibleMonthCount] = useState(INITIAL_MONTHS);

  const availableDateSet = useMemo(() => new Set(sortedDateStrs), [sortedDateStrs]);

  const allMonths = useMemo(
    () => buildAllMonths(sortedDateStrs, minSelectableDate),
    [sortedDateStrs, minSelectableDate],
  );

  const visibleMonths = allMonths.slice(0, visibleMonthCount);
  const hasMoreMonths = visibleMonthCount < allMonths.length;
  const selectedDateStr = selectedDate ? getLocalYYYYMMDD(selectedDate) : null;

  const handleDayClick = (dateStr) => {
    if (!availableDateSet.has(dateStr)) return;
    const [y, m, d] = dateStr.split("-").map(Number);
    onDateSelect?.(new Date(y, m - 1, d));
  };

  return (
    <Wrap>
      {showTopBar && (
        <TopBar>
          <BackBtn type="button" aria-label="Back to times" onClick={onClose}>
            <ChevronLeft size={22} />
          </BackBtn>
          <TopTitle>Select a date</TopTitle>
        </TopBar>
      )}

      <ScrollArea>
        {visibleMonths.map((monthDate) => {
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const firstDay = new Date(year, month, 1);
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const startWeekday = firstDay.getDay();
          const cells = [];

          for (let i = 0; i < startWeekday; i++) {
            cells.push(<EmptyDayCell key={`e-${year}-${month}-${i}`} />);
          }

          for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const available = availableDateSet.has(dateStr);
            const selected = selectedDateStr === dateStr;
            cells.push(
              <DayCell
                key={dateStr}
                type="button"
                $available={available}
                $selected={selected}
                disabled={!available}
                onClick={() => available && handleDayClick(dateStr)}
              >
                {dayNum}
              </DayCell>,
            );
          }

          return (
            <MonthBlock key={`${year}-${month}`}>
              <MonthHeader>
                {monthDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </MonthHeader>
              <WeekdayRow>
                {WEEKDAY_LABELS.map((w, i) => (
                  <WeekdayCell key={i}>{w}</WeekdayCell>
                ))}
              </WeekdayRow>
              <DayGrid>{cells}</DayGrid>
            </MonthBlock>
          );
        })}

        {hasMoreMonths && (
          <LoadMoreBtn
            type="button"
            onClick={() =>
              setVisibleMonthCount((n) =>
                Math.min(n + MONTHS_PER_LOAD, allMonths.length),
              )
            }
          >
            Load more dates
          </LoadMoreBtn>
        )}
      </ScrollArea>
    </Wrap>
  );
}
