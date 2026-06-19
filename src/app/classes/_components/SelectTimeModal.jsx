"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { CalendarDays } from "lucide-react";

import {
  mobileDrawerTheme,
  MobileDrawerOverlay,
  MobileDrawerHandle,
  ParticipantsStepperBtn,
  ParticipantsStepperValue,
} from "./mobileBookingStyles";

import {
  getLocalYYYYMMDD,
  formatTimeRangeForDisplay,
} from "@/services/utils";
import { formatMoneyCompact } from "@/lib/seo";

const MAX_MONTHS = 6;
const INITIAL_SECTIONS = 3;
const SECTIONS_PER_LOAD = 2;

const Sheet = styled(Drawer.Content)`
  background: ${mobileDrawerTheme.bg};
  display: flex;
  flex-direction: column;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  height: 92vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3001;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  outline: none;
  overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  color: #717171;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
`;

const HeaderWrap = styled.div`
  padding: 4px 24px 0;
  flex-shrink: 0;
  background: ${mobileDrawerTheme.bg};
`;

const Title = styled.h2`
  margin: 12px 0 0;
  padding-right: 44px;
  font-size: 1.35rem;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.02em;
`;

const GuestRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0 14px;
`;

const GuestLabel = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
`;

const StepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const CompactStepperBtn = styled(ParticipantsStepperBtn)`
  width: 36px;
  height: 36px;
  font-size: 1.1rem;
  font-weight: 500;
`;

const GuestStepperValue = styled(ParticipantsStepperValue)`
  font-size: 1rem;
  font-weight: 600;
  min-width: 1.5rem;
`;

const MonthToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 14px;
`;

const MonthLabel = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #111111;
  letter-spacing: -0.01em;
`;

const CalendarToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  &[aria-expanded="true"] {
    background: #111111;
    border-color: #111111;
    color: #ffffff;
  }
`;

const CalendarWrap = styled.div`
  padding: 0 0 12px;
  max-height: 42vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
`;

const MonthBlock = styled.div`
  margin-bottom: 16px;
`;

const MonthHeader = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
  margin-bottom: 8px;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  padding: 4px 0;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
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
  color: ${(p) => (p.$available ? "#111111" : "#d4d4d4")};
  cursor: ${(p) => (p.$available ? "pointer" : "default")};
  border-radius: 50%;
  transition: background 0.15s;
  font-family: inherit;
  padding: 0;

  &:hover {
    background: ${(p) => (p.$available ? "#f3f4f6" : "transparent")};
  }

  ${(p) =>
    p.$selected &&
    `
    background: #111111;
    color: #ffffff;
    &:hover { background: #111111; }
  `}

  &:disabled {
    cursor: default;
  }
`;

const EmptyDayCell = styled.div``;

const ScrollBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 32px;
  -webkit-overflow-scrolling: touch;
`;

const DateSectionHeader = styled.h3`
  margin: 22px 0 10px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  letter-spacing: -0.01em;

  &:first-child {
    margin-top: 6px;
  }
`;

const SlotCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid #ebebeb;
  background: ${mobileDrawerTheme.bg};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  margin-bottom: 8px;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #d1d5db;
    background: #fafafa;
  }

  ${(p) =>
    p.$selected &&
    `
    border-color: #111111;
    background: #fafafa;
  `}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const SlotLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SlotTime = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #111111;
`;

const SlotPrice = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
`;

const SlotRight = styled.span`
  font-size: 0.8rem;
  font-weight: 400;
  color: #9ca3af;
  text-align: right;
  align-self: center;
`;

const Sentinel = styled.div`
  height: 1px;
  width: 100%;
`;

const EmptyState = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
`;

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function formatSectionHeader(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  let prefix = "";
  if (date.getTime() === tomorrow.getTime()) prefix = "Tomorrow, ";
  else if (date.getTime() === dayAfter.getTime()) prefix = "Day after, ";

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return prefix ? `${prefix}${monthDay}` : `${weekday}, ${monthDay}`;
}

export default function SelectTimeModal({
  open,
  onOpenChange,
  onDateSelect,
  availableSlots,
  loading,
  selectedDate,
  selectedSlot,
  participants,
  participantsMax,
  onParticipantsChange,
  onSelectSlot,
  minSelectableDate,
  today,
  businessTimezone = "Etc/UTC",
  currency = "CAD",
  option,
  initialCalendarExpanded = false,
  scrollToDate = null,
}) {
  const [calendarExpanded, setCalendarExpanded] = useState(initialCalendarExpanded);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SECTIONS);
  const scrollBodyRef = useRef(null);
  const sectionRefs = useRef({});
  const sentinelRef = useRef(null);

  const sortedDateStrs = useMemo(() => {
    if (!availableSlots || typeof availableSlots !== "object") return [];
    const minStr = minSelectableDate ? getLocalYYYYMMDD(minSelectableDate) : null;
    return Object.keys(availableSlots)
      .filter((d) => !minStr || d >= minStr)
      .filter((d) => Array.isArray(availableSlots[d]) && availableSlots[d].length > 0)
      .sort();
  }, [availableSlots, minSelectableDate]);

  const headerMonthDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (sortedDateStrs.length === 0) return today || new Date();
    const [y, m, d] = sortedDateStrs[0].split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate, sortedDateStrs, today]);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setVisibleCount(INITIAL_SECTIONS);
      setCalendarExpanded(initialCalendarExpanded);
    }
    prevOpenRef.current = open;
  }, [open, initialCalendarExpanded]);

  useEffect(() => {
    if (!open || sortedDateStrs.length === 0) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + SECTIONS_PER_LOAD, sortedDateStrs.length),
          );
        }
      },
      { root: scrollBodyRef.current, rootMargin: "0px 0px 200px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, sortedDateStrs.length, calendarExpanded]);

  useEffect(() => {
    if (!open || !scrollToDate) return;
    const dateStr = getLocalYYYYMMDD(scrollToDate);
    const idx = sortedDateStrs.indexOf(dateStr);
    if (idx === -1) return;
    setVisibleCount((prev) => Math.max(prev, idx + 1));
    requestAnimationFrame(() => {
      const el = sectionRefs.current[dateStr];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [open, scrollToDate, sortedDateStrs]);

  const visibleDateStrs = sortedDateStrs.slice(0, visibleCount);

  const months = useMemo(() => {
    const start = new Date(today || new Date());
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const arr = [];
    for (let i = 0; i < MAX_MONTHS; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i, 1);
      arr.push(d);
    }
    return arr;
  }, [today]);

  const availableDateSet = useMemo(() => new Set(sortedDateStrs), [sortedDateStrs]);
  const selectedDateStr = selectedDate ? getLocalYYYYMMDD(selectedDate) : null;

  const handleCalendarDateTap = useCallback(
    (dateStr) => {
      if (!availableDateSet.has(dateStr)) return;
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      setCalendarExpanded(false);
      onDateSelect?.(dateObj);
      const idx = sortedDateStrs.indexOf(dateStr);
      if (idx !== -1) {
        setVisibleCount((prev) => Math.max(prev, idx + 1));
        requestAnimationFrame(() => {
          const el = sectionRefs.current[dateStr];
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [availableDateSet, sortedDateStrs, onDateSelect],
  );

  const isCourse = option?.booking_type === "Full Course";
  const perGuestLabel = isCourse ? "/ course" : "/ guest";
  const guestLabel =
    participants === 1 ? "1 guest" : `${participants} guests`;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <MobileDrawerOverlay />
        <Sheet>
          <MobileDrawerHandle />
          <CloseButton
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange?.(false)}
          >
            ×
          </CloseButton>

          <HeaderWrap>
            <Title>Select a time</Title>

            <GuestRow>
              <GuestLabel>{guestLabel}</GuestLabel>
              <StepperRow>
                <CompactStepperBtn
                  type="button"
                  disabled={participants <= 1}
                  onClick={() => onParticipantsChange?.(Math.max(1, participants - 1))}
                  aria-label="Decrease guests"
                >
                  −
                </CompactStepperBtn>
                <GuestStepperValue>{participants}</GuestStepperValue>
                <CompactStepperBtn
                  type="button"
                  disabled={participants >= participantsMax}
                  onClick={() =>
                    onParticipantsChange?.(
                      Math.min(participantsMax, participants + 1),
                    )
                  }
                  aria-label="Increase guests"
                >
                  +
                </CompactStepperBtn>
              </StepperRow>
            </GuestRow>

            <MonthToolbar>
              <MonthLabel>
                {headerMonthDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </MonthLabel>
              <CalendarToggleBtn
                type="button"
                aria-label="Open calendar"
                aria-expanded={calendarExpanded}
                onClick={() => setCalendarExpanded((v) => !v)}
              >
                <CalendarDays size={20} />
              </CalendarToggleBtn>
            </MonthToolbar>
          </HeaderWrap>

          {calendarExpanded && (
            <CalendarWrap>
              {months.map((monthDate) => {
                const year = monthDate.getFullYear();
                const month = monthDate.getMonth();
                const firstDay = new Date(year, month, 1);
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const startWeekday = firstDay.getDay();
                const cells = [];
                for (let i = 0; i < startWeekday; i++) {
                  cells.push(<EmptyDayCell key={`e-${i}`} />);
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
                      onClick={() => available && handleCalendarDateTap(dateStr)}
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
            </CalendarWrap>
          )}

          <ScrollBody ref={scrollBodyRef}>
            {loading ? (
              <EmptyState>Loading availability…</EmptyState>
            ) : sortedDateStrs.length === 0 ? (
              <EmptyState>No upcoming availability for this class.</EmptyState>
            ) : (
              visibleDateStrs.map((dateStr) => {
                const slots = availableSlots[dateStr] || [];
                return (
                  <div
                    key={dateStr}
                    ref={(el) => {
                      sectionRefs.current[dateStr] = el;
                    }}
                  >
                    <DateSectionHeader>{formatSectionHeader(dateStr)}</DateSectionHeader>
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.instance_id;
                      const price = parseFloat(slot.price);
                      const soldOut = Number(slot.available_spots) === 0;
                      const priceText =
                        price === 0
                          ? "Free"
                          : formatMoneyCompact(price, currency).text;
                      return (
                        <SlotCard
                          type="button"
                          key={slot.instance_id}
                          $selected={isSelected}
                          disabled={soldOut}
                          onClick={() => !soldOut && onSelectSlot(slot, dateStr)}
                        >
                          <SlotLeft>
                            <SlotTime>
                              {formatTimeRangeForDisplay(
                                dateStr,
                                slot.time,
                                slot.duration,
                                businessTimezone,
                                Intl.DateTimeFormat().resolvedOptions().timeZone,
                              )}
                            </SlotTime>
                            <SlotPrice>
                              {priceText} {perGuestLabel}
                            </SlotPrice>
                          </SlotLeft>
                          <SlotRight>
                            {soldOut
                              ? "Sold out"
                              : `${slot.available_spots} ${slot.available_spots === 1 ? "spot" : "spots"}`}
                          </SlotRight>
                        </SlotCard>
                      );
                    })}
                  </div>
                );
              })
            )}
            {visibleDateStrs.length < sortedDateStrs.length && (
              <Sentinel ref={sentinelRef} />
            )}
          </ScrollBody>
        </Sheet>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
