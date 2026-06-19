"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { getLocalYYYYMMDD } from "@/services/utils";

const INITIAL_MONTHS = 8;
const MONTHS_PER_LOAD = 4;

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #000000;
  cursor: pointer;
  padding: 0;

  &:hover {
    opacity: 0.65;
  }
`;

const StickyWeekdayBar = styled.div`
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 44px 20px 8px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #717171;
  letter-spacing: 0.02em;
`;

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 20px 0;
  -webkit-overflow-scrolling: touch;
`;

const MonthBlock = styled.div`
  margin-bottom: 20px;

  &:first-child {
    margin-top: 4px;
  }
`;

const MonthHeader = styled.h4`
  margin: 0 0 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.01em;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 2px;
`;

const DayCell = styled.button`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  color: ${(p) => (p.$available ? "#000000" : "#d1d5db")};
  cursor: ${(p) => (p.$available ? "pointer" : "default")};
  border-radius: 50%;
  font-family: inherit;
  padding: 0;
  transition: box-shadow 0.15s ease, color 0.15s ease;

  ${(p) =>
    p.$selected &&
    `
    box-shadow: inset 0 0 0 1.5px #000000;
    color: #000000;
    font-weight: 500;
  `}

  &:hover {
    ${(p) => p.$available && !p.$selected && `color: #000000;`}
  }

  &:disabled {
    cursor: default;
  }
`;

const EmptyDayCell = styled.div`
  height: 40px;
`;

const LoadMoreWrap = styled.div`
  padding: 8px 0 16px;
`;

const LoadMoreBtn = styled.button`
  display: block;
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #ebebeb;
  background: #ffffff;
  color: #000000;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: #fafafa;
  }
`;

const Footer = styled.div`
  flex-shrink: 0;
  padding: 12px 20px 20px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
`;

const NextBtn = styled.button`
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  background: #ff385c;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.15s ease;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: translateY(${(p) => (p.$visible ? 0 : 6)}px);
  pointer-events: ${(p) => (p.$visible ? "auto" : "none")};

  &:hover {
    background: #e31c5f;
  }

  &:active {
    transform: scale(0.98);
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
  minSelectableDate,
  draftDate,
  onDraftDateSelect,
  onConfirm,
  onClose,
  showNextButton = true,
}) {
  const [visibleMonthCount, setVisibleMonthCount] = useState(INITIAL_MONTHS);

  useEffect(() => {
    setVisibleMonthCount(INITIAL_MONTHS);
  }, [sortedDateStrs.length]);

  const availableDateSet = useMemo(() => new Set(sortedDateStrs), [sortedDateStrs]);

  const allMonths = useMemo(
    () => buildAllMonths(sortedDateStrs, minSelectableDate),
    [sortedDateStrs, minSelectableDate],
  );

  const visibleMonths = allMonths.slice(0, visibleMonthCount);
  const hasMoreMonths = visibleMonthCount < allMonths.length;
  const draftDateStr = draftDate ? getLocalYYYYMMDD(draftDate) : null;
  const hasDraft = Boolean(draftDateStr);

  const handleDayClick = (dateStr) => {
    if (!availableDateSet.has(dateStr)) return;
    const [y, m, d] = dateStr.split("-").map(Number);
    onDraftDateSelect?.(new Date(y, m - 1, d));
  };

  return (
    <Wrap>
      <CloseBtn type="button" aria-label="Close calendar" onClick={onClose}>
        <X size={22} strokeWidth={1.75} />
      </CloseBtn>

      <StickyWeekdayBar>
        {WEEKDAY_LABELS.map((w, i) => (
          <WeekdayCell key={i}>{w}</WeekdayCell>
        ))}
      </StickyWeekdayBar>

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
            const selected = draftDateStr === dateStr;
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
              <DayGrid>{cells}</DayGrid>
            </MonthBlock>
          );
        })}

        {hasMoreMonths && (
          <LoadMoreWrap>
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
          </LoadMoreWrap>
        )}
      </ScrollArea>

      {showNextButton && (
        <Footer>
          <NextBtn
            type="button"
            $visible={hasDraft}
            disabled={!hasDraft}
            onClick={() => hasDraft && onConfirm?.()}
          >
            Next
          </NextBtn>
        </Footer>
      )}
    </Wrap>
  );
}
