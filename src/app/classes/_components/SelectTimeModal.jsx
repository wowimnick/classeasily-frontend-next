"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import {
  mobileDrawerTheme,
  MobileDrawerOverlay,
  ParticipantsStepperBtn,
  ParticipantsStepperValue,
} from "./mobileBookingStyles";

import {
  getLocalYYYYMMDD,
  formatNaiveDate,
  formatTimeRangeForDisplay,
} from "@/services/utils";
import { formatMoneyCompact } from "@/lib/seo";
import { getDurationText } from "./steps/utils";

/* ============================================================
   SelectTimeModal — unified date/time picker for mobile class pages.

   Structure:
   - Sticky header: close button, title, guest stepper, month nav (toggles calendar)
   - Calendar expansion (when toggled): vertically-stacked multi-month grid
   - Scrolling body: infinite (windowed) list of date sections + slot cards

   The full 540-day availability map is fetched up front by
   useMobileReserveFlow, so "infinite scroll" here is pure client-side
   windowing — no additional network requests.
   ============================================================ */

const MAX_MONTHS = 6;
const INITIAL_SECTIONS = 2;
const SECTIONS_PER_LOAD = 2;

/* ---------- styled components ---------- */

const Sheet = styled(Drawer.Content)`
  background: ${mobileDrawerTheme.bg};
  display: flex;
  flex-direction: column;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
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
  top: 12px;
  right: 16px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #717171;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
`;

const HeaderWrap = styled.div`
  padding: 16px 24px 0;
  flex-shrink: 0;
  background: ${mobileDrawerTheme.bg};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #000000;
  letter-spacing: -0.01em;
`;

const GuestRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 16px;
`;

const GuestLabelLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const GuestMain = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #000000;
`;

const GuestSub = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: #717171;
`;

const StepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CompactStepperBtn = styled(ParticipantsStepperBtn)`
  width: 32px;
  height: 32px;
  font-size: 1rem;
`;

const Divider = styled.div`
  height: 1px;
  background: #ebebeb;
  width: 100%;
`;

const MonthNavRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
`;

const MonthLabel = styled.span`
  font-size: 17px;
  font-weight: 700;
  color: #000000;
`;

const CalendarIconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #717171;
`;

/* Calendar expansion */
const CalendarWrap = styled.div`
  padding: 8px 0 16px;
  max-height: 60vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const MonthBlock = styled.div`
  margin-bottom: 20px;
`;

const MonthHeader = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #000000;
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
  font-weight: 600;
  color: #717171;
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
  color: ${(p) => (p.$available ? "#000000" : "#d4d4d4")};
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
    background: #000000;
    color: #ffffff;
    &:hover { background: #000000; }
  `}

  &:disabled {
    cursor: default;
  }
`;

const EmptyDayCell = styled.div``;

/* Scrolling body */
const ScrollBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 32px;
  -webkit-overflow-scrolling: touch;
`;

const DateSectionHeader = styled.h3`
  margin: 28px 0 12px;
  font-size: 17px;
  font-weight: 700;
  color: #000000;

  &:first-child {
    margin-top: 8px;
  }
`;

const SlotCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid #ebebeb;
  background: ${mobileDrawerTheme.bg};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  margin-bottom: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #bdbdbd;
  }

  ${(p) =>
    p.$selected &&
    `
    border-color: #000000;
    box-shadow: 0 0 0 1px #000000;
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SlotLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SlotTime = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #000000;
`;

const SlotPrice = styled.span`
  font-size: 15px;
  color: #000000;
  font-weight: 400;
`;

const SlotPriceAmount = styled.span`
  font-weight: 600;
`;

const SlotRight = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #717171;
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
  color: #717171;
  font-size: 14px;
`;

/* ---------- helpers ---------- */

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getGuestWord(n) {
  return n === 1 ? "guest" : "guests";
}

function buildMonthDate(year, month) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setFullYear(year, month, 1);
  return d;
}

function formatSectionHeader(dateStr) {
  // dateStr = "YYYY-MM-DD"
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
  // else: no prefix, just weekday + date

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return prefix ? `${prefix}${monthDay}` : `${weekday}, ${monthDay}`;
}

/* ---------- component ---------- */

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

  // Sorted list of available date strings (>= minSelectableDate).
  const sortedDateStrs = useMemo(() => {
    if (!availableSlots || typeof availableSlots !== "object") return [];
    const minStr = minSelectableDate ? getLocalYYYYMMDD(minSelectableDate) : null;
    return Object.keys(availableSlots)
      .filter((d) => !minStr || d >= minStr)
      .filter((d) => Array.isArray(availableSlots[d]) && availableSlots[d].length > 0)
      .sort();
  }, [availableSlots, minSelectableDate]);

  // Reset windowing + calendar state when the modal transitions from closed -> open.
  // This is intentional derived-state reset on a controlled prop transition; the
  // setState calls only fire on that transition (guarded by prevOpenRef), so there
  // is no cascading-render risk in practice.
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleCount(INITIAL_SECTIONS);
      setCalendarExpanded(initialCalendarExpanded);
    }
    prevOpenRef.current = open;
  }, [open, initialCalendarExpanded]);

  // Infinite scroll: observe sentinel, append sections.
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
  }, [open, sortedDateStrs.length]);

  // Scroll to a specific date section when requested (e.g. from preview strip / calendar tap).
  // Expanding the visible window so the target section is rendered is a necessary
  // side effect of the scrollToDate prop changing.
  useEffect(() => {
    if (!open || !scrollToDate) return;
    const dateStr = getLocalYYYYMMDD(scrollToDate);
    const idx = sortedDateStrs.indexOf(dateStr);
    if (idx === -1) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount((prev) => Math.max(prev, idx + 1));
    // Defer scroll until the section is rendered.
    requestAnimationFrame(() => {
      const el = sectionRefs.current[dateStr];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [open, scrollToDate, sortedDateStrs]);

  const visibleDateStrs = sortedDateStrs.slice(0, visibleCount);

  // Months to render in the calendar expansion.
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

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <MobileDrawerOverlay />
        <Sheet>
          <CloseButton
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange?.(false)}
          >
            ×
          </CloseButton>

          <HeaderWrap>
            <Title>Select a time</Title>

            {/* Guest count row */}
            <GuestRow>
              <GuestLabelLeft>
                <GuestMain>
                  {participants} {participants === 1 ? "adult" : "adults"}
                </GuestMain>
                <GuestSub>Age 13+</GuestSub>
              </GuestLabelLeft>
              <StepperRow>
                <CompactStepperBtn
                  type="button"
                  disabled={participants <= 1}
                  onClick={() => onParticipantsChange?.(Math.max(1, participants - 1))}
                  aria-label="Decrease guests"
                >
                  −
                </CompactStepperBtn>
                <ParticipantsStepperValue>
                  {participants}
                </ParticipantsStepperValue>
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
            <Divider />

            {/* Month nav row (toggles calendar) */}
            <MonthNavRow
              type="button"
              onClick={() => setCalendarExpanded((v) => !v)}
              aria-expanded={calendarExpanded}
            >
              <MonthLabel>
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </MonthLabel>
              <CalendarIconWrap>
                <CalendarDays size={22} />
              </CalendarIconWrap>
            </MonthNavRow>
            <Divider />
          </HeaderWrap>

          {calendarExpanded ? (
            <CalendarWrap>
              {months.map((monthDate) => {
                const year = monthDate.getFullYear();
                const month = monthDate.getMonth();
                const firstDay = new Date(year, month, 1);
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const startWeekday = firstDay.getDay(); // 0=Sun
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
          ) : (
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
                                <SlotPriceAmount>{priceText}</SlotPriceAmount>{" "}
                                {perGuestLabel}
                              </SlotPrice>
                            </SlotLeft>
                            <SlotRight>
                              {soldOut
                                ? "Sold out"
                                : `${slot.available_spots} ${slot.available_spots === 1 ? "spot" : "spots"} available`}
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
          )}
        </Sheet>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
