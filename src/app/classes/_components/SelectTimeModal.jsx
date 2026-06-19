"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.16);
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
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
`;

const HeaderWrap = styled.div`
  padding: 4px 24px 0;
  flex-shrink: 0;
  background: ${mobileDrawerTheme.bg};
`;

const Title = styled.h2`
  margin: 12px 0 0;
  padding-right: 44px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.02em;
`;

const GuestRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 16px;
`;

const GuestLabel = styled.span`
  font-size: 1.05rem;
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
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
`;

const GuestStepperValue = styled(ParticipantsStepperValue)`
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 1.5rem;
`;

const MonthToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 16px;
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
  box-shadow: 0 10px 20px -14px rgba(15, 23, 42, 0.22);
`;

const MonthLabel = styled.span`
  font-size: 1.05rem;
  font-weight: 500;
  color: #111111;
  letter-spacing: -0.01em;
`;

const CalendarToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }
`;

const ScrollBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 24px 32px;
  -webkit-overflow-scrolling: touch;
`;

const DateSectionHeader = styled.h3`
  margin: 24px 0 12px;
  font-size: 1.05rem;
  font-weight: 500;
  color: #374151;
  letter-spacing: -0.01em;

  &:first-child {
    margin-top: 4px;
  }
`;

const SlotCard = styled.button`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid #ebebeb;
  background: ${mobileDrawerTheme.bg};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #d1d5db;
    background: #fafafa;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  }

  ${(p) =>
    p.$selected &&
    `
    border-color: #111111;
    background: #fafafa;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  `}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const SlotLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const SlotTime = styled.span`
  font-size: 1.05rem;
  font-weight: 500;
  color: #111111;
  letter-spacing: -0.01em;
`;

const SlotPriceLine = styled.span`
  font-size: 0.78rem;
  font-weight: 400;
  color: #9ca3af;
`;

const SlotPriceAmount = styled.span`
  color: #111111;
  font-weight: 500;
`;

const SlotRight = styled.span`
  font-size: 0.78rem;
  font-weight: 400;
  color: #9ca3af;
  text-align: right;
  align-self: flex-end;
  flex-shrink: 0;
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
  onOpenCalendar,
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
  scrollToDate = null,
}) {
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
    }
    prevOpenRef.current = open;
  }, [open]);

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
                onClick={() => onOpenCalendar?.()}
              >
                <CalendarDays size={20} />
              </CalendarToggleBtn>
            </MonthToolbar>
          </HeaderWrap>

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
                            <SlotPriceLine>
                              <SlotPriceAmount>{priceText}</SlotPriceAmount>{" "}
                              {perGuestLabel}
                            </SlotPriceLine>
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
