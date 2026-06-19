"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { getLocalYYYYMMDD } from "@/services/utils";

const INITIAL_MONTHS = 8;
const MONTHS_PER_LOAD = 4;
const MIN_DISPLAY_MONTHS = 4;

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
  top: 8px;
  right: 10px;
  z-index: 3;
  width: 32px;
  height: 32px;
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
  gap: 6px;
  padding: 28px 20px 10px;
  background: #ffffff;
  box-shadow: 0 6px 16px -10px rgba(15, 23, 42, 0.22);
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
  padding: 8px 20px 0;
  -webkit-overflow-scrolling: touch;
`;

const MonthBlock = styled.div`
  margin-bottom: 22px;

  &:first-child {
    margin-top: 2px;
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
  gap: 6px;
`;

const DayCell = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  padding: 0;
  cursor: ${(p) => (p.$available ? "pointer" : "default")};

  &:disabled {
    cursor: default;
  }
`;

const DayInner = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: ${(p) => (p.$selected ? 500 : 400)};
  color: ${(p) => (p.$available ? "#000000" : "#c4c4c4")};
  text-decoration: ${(p) => (p.$available ? "none" : "line-through")};
  text-decoration-thickness: 1px;
  transition: box-shadow 0.15s ease, color 0.15s ease;

  ${(p) =>
    p.$selected &&
    `
    box-shadow: inset 0 0 0 1.5px #000000;
    color: #000000;
    text-decoration: none;
  `}

  ${DayCell}:not(:disabled):hover & {
    ${(p) => p.$available && !p.$selected && `color: #000000;`}
  }
`;

const EmptyDayCell = styled.div`
  aspect-ratio: 1;
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
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: #e31c5f;
  }

  &:active {
    transform: scale(0.98);
  }
`;

function buildAllMonths(sortedDateStrs, minSelectableDate) {
  const anchor = minSelectableDate ? new Date(minSelectableDate) : new Date();
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);

  let rangeEnd = new Date(anchor);
  rangeEnd.setMonth(rangeEnd.getMonth() + MIN_DISPLAY_MONTHS - 1);

  if (sortedDateStrs.length > 0) {
    const lastStr = sortedDateStrs[sortedDateStrs.length - 1];
    const [ly, lm] = lastStr.split("-").map(Number);
    const lastMonth = new Date(ly, lm - 1, 1);
    if (lastMonth > rangeEnd) {
      rangeEnd = lastMonth;
    }
  }

  const months = [];
  const cursor = new Date(anchor);
  while (cursor <= rangeEnd) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1, 1);
  }

  while (months.length < MIN_DISPLAY_MONTHS) {
    const last = months[months.length - 1] || anchor;
    const next = new Date(last);
    next.setMonth(next.getMonth() + 1, 1);
    months.push(next);
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
  }, [sortedDateStrs.length, minSelectableDate]);

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
        <X size={18} strokeWidth={1.75} />
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
                disabled={!available}
                onClick={() => available && handleDayClick(dateStr)}
              >
                <DayInner $available={available} $selected={selected}>
                  {dayNum}
                </DayInner>
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

      {showNextButton && hasDraft && (
        <Footer>
          <NextBtn type="button" onClick={() => onConfirm?.()}>
            Next
          </NextBtn>
        </Footer>
      )}
    </Wrap>
  );
}
