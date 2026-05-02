"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getLocalYYYYMMDD } from "@/services/utils";
import { scheduleService } from "@/services/apiService";
import posthog from "posthog-js";

/** Breakpoint (px) below which mobile reserve flow is shown */
export const MOBILE_RESERVE_BREAKPOINT = 1024;

/** Delay (ms) between closing one drawer and opening another to avoid overlap */
export const DRAWER_TRANSITION_MS = 150;

/** Default participant count when slot allows more */
export const DEFAULT_PARTICIPANTS = 2;

/**
 * Total horizon for mobile availability (matches former “far future” fix).
 * Loaded in small chunks: first chunk returns quickly (same perceived speed as old 60d),
 * remaining chunks run in parallel so total wait ≈ one chunk, not one huge query.
 */
const MOBILE_AVAILABILITY_RANGE_DAYS = 540;
const MOBILE_AVAILABILITY_CHUNK_DAYS = 60;

function buildAvailabilityChunkSpecs(minSelectableDate, chunkDays, totalDays) {
  const specs = [];
  for (let offset = 0; offset < totalDays; offset += chunkDays) {
    const rangeStart = new Date(minSelectableDate);
    rangeStart.setDate(rangeStart.getDate() + offset);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + chunkDays);
    specs.push({
      start_date: getLocalYYYYMMDD(rangeStart),
      end_date: getLocalYYYYMMDD(rangeEnd),
    });
  }
  return specs;
}

/**
 * Encapsulates all state and handlers for the mobile reserve flow:
 * inline calendar → time drawer → reserve footer → review drawer → edit drawers (date/time/guests).
 * Flow behavior is unchanged; this hook only isolates logic for readability.
 */
export function useMobileReserveFlow(mounted, classData, optionToDisplayOnCard) {
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileAvailableSlots, setMobileAvailableSlots] = useState({});
  const [mobileSlotsLoading, setMobileSlotsLoading] = useState(false);
  const [mobileSelectedSlot, setMobileSelectedSlot] = useState(null);
  const [mobileSelectedDate, setMobileSelectedDate] = useState(null);
  const [mobileCalendarMonth, setMobileCalendarMonth] = useState(() => new Date());
  const [mobileTimeDrawerOpen, setMobileTimeDrawerOpen] = useState(false);
  const [mobileDateDrawerOpen, setMobileDateDrawerOpen] = useState(false);
  const [mobileParticipantsDrawerOpen, setMobileParticipantsDrawerOpen] = useState(false);
  const [mobileParticipants, setMobileParticipants] = useState(DEFAULT_PARTICIPANTS);
  const [mobileParticipantsDraft, setMobileParticipantsDraft] = useState(DEFAULT_PARTICIPANTS);
  const [mobileReviewDrawerOpen, setMobileReviewDrawerOpen] = useState(false);
  const [mobileAvailabilityError, setMobileAvailabilityError] = useState(false);
  const reopenReviewDrawerOnCloseEditRef = useRef(false);
  const hasFiredDateSelectedRef = useRef(false);

  const mobileMinSelectableDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 2);
    return d;
  }, []);

  const mobileToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    const check = () =>
      setIsMobileView(
        typeof window !== "undefined" && window.innerWidth < MOBILE_RESERVE_BREAKPOINT,
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted || !optionToDisplayOnCard?.optionId || !isMobileView) return;
    const optionId = optionToDisplayOnCard.optionId;
    let cancelled = false;

    const specs = buildAvailabilityChunkSpecs(
      mobileMinSelectableDate,
      MOBILE_AVAILABILITY_CHUNK_DAYS,
      MOBILE_AVAILABILITY_RANGE_DAYS,
    );

    (async () => {
      setMobileSlotsLoading(true);
      setMobileAvailabilityError(false);
      setMobileAvailableSlots({});

      try {
        const first = await scheduleService.getAvailabilityForOption(
          optionId,
          specs[0],
        );
        if (cancelled) return;
        if (first && typeof first === "object") {
          setMobileAvailableSlots(first);
        }
        setMobileSlotsLoading(false);

        if (specs.length <= 1) return;

        const rest = await Promise.all(
          specs.slice(1).map((spec) =>
            scheduleService
              .getAvailabilityForOption(optionId, spec)
              .catch((err) => {
                console.error("Mobile availability chunk failed", err);
                return {};
              }),
          ),
        );
        if (cancelled) return;
        const merged = {};
        for (const part of rest) {
          if (part && typeof part === "object") Object.assign(merged, part);
        }
        if (Object.keys(merged).length > 0) {
          setMobileAvailableSlots((prev) => ({ ...prev, ...merged }));
        }
      } catch (e) {
        console.error("Mobile availability fetch failed", e);
        if (!cancelled) setMobileAvailabilityError(true);
        setMobileSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, optionToDisplayOnCard?.optionId, isMobileView, mobileMinSelectableDate]);

  useEffect(() => {
    if (mobileSlotsLoading || Object.keys(mobileAvailableSlots).length === 0) return;
    const sortedDates = Object.keys(mobileAvailableSlots)
      .filter((d) => d >= getLocalYYYYMMDD(mobileMinSelectableDate))
      .sort();
    const firstSlotForDate = (dateStr) => {
      const slots = mobileAvailableSlots[dateStr];
      if (!Array.isArray(slots) || slots.length === 0) return null;
      const slot = slots[0];
      return {
        id: slot.instance_id,
        date: dateStr,
        time: slot.time,
        available_spots: slot.available_spots,
        price: slot.price,
        duration: slot.duration,
        minParticipants: slot.min_participants,
      };
    };
    const firstDateObj = (dateStr) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    };
    setMobileSelectedSlot((prev) => {
      if (prev) return prev;
      for (const dateStr of sortedDates) {
        const slot = firstSlotForDate(dateStr);
        if (slot) return slot;
      }
      return null;
    });
    setMobileSelectedDate((prev) => {
      if (prev) return prev;
      for (const dateStr of sortedDates) {
        if (firstSlotForDate(dateStr)) return firstDateObj(dateStr);
      }
      return null;
    });
    setMobileCalendarMonth((prev) => {
      for (const dateStr of sortedDates) {
        if (firstSlotForDate(dateStr)) return firstDateObj(dateStr);
      }
      return prev;
    });
  }, [mobileSlotsLoading, mobileAvailableSlots, mobileMinSelectableDate]);

  useEffect(() => {
    if (!mobileSelectedSlot) return;
    setMobileParticipants(
      Math.min(DEFAULT_PARTICIPANTS, mobileSelectedSlot.available_spots ?? 2)
    );
  }, [mobileSelectedSlot?.id]);

  const mobileParticipantsMax = useMemo(
    () => Math.max(1, mobileSelectedSlot?.available_spots ?? 2),
    [mobileSelectedSlot?.available_spots]
  );

  const handleMobileCalendarMonthChange = useCallback((direction) => {
    setMobileCalendarMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction, 1);
      return next;
    });
  }, []);

  const handleMobileDateSelect = useCallback((date) => {
    setMobileSelectedDate(date);
    setMobileTimeDrawerOpen(true);
  }, []);

  const handleMobileTimeSelect = useCallback(
    (slot) => {
      const dateStr = mobileSelectedDate ? getLocalYYYYMMDD(mobileSelectedDate) : null;
      if (!dateStr) return;
      const participants = Math.min(DEFAULT_PARTICIPANTS, slot.available_spots ?? 2);
      setMobileSelectedSlot({
        id: slot.instance_id,
        date: dateStr,
        time: slot.time,
        available_spots: slot.available_spots,
        price: slot.price,
        duration: slot.duration,
        minParticipants: slot.min_participants,
      });
      reopenReviewDrawerOnCloseEditRef.current = false;
      setMobileParticipants(participants);
      // PostHog: Track date/slot selection in mobile reserve flow (MiniCalendar + time drawer; same event as CalendarStep)
      if (!hasFiredDateSelectedRef.current) {
        hasFiredDateSelectedRef.current = true;
        posthog.capture("booking_date_selected", {
          date: dateStr,
          time: slot.time,
          participants,
        });
      }
      setMobileTimeDrawerOpen(false);
      setTimeout(() => setMobileReviewDrawerOpen(true), DRAWER_TRANSITION_MS);
    },
    [mobileSelectedDate]
  );

  const handleReserveClick = useCallback(() => {
    if (!mobileSelectedSlot || !optionToDisplayOnCard || !classData?.slug) return;
    // PostHog: If slot was auto-selected (user never opened time drawer), fire date_selected when they tap Reserve
    if (!hasFiredDateSelectedRef.current) {
      hasFiredDateSelectedRef.current = true;
      posthog.capture("booking_date_selected", {
        date: mobileSelectedSlot.date,
        time: mobileSelectedSlot.time,
        participants: mobileParticipants,
      });
    }
    setMobileReviewDrawerOpen(true);
  }, [mobileSelectedSlot, optionToDisplayOnCard, classData, mobileParticipants]);

  const openEditDrawerAfterClose = useCallback((openDrawer) => {
    reopenReviewDrawerOnCloseEditRef.current = true;
    setMobileReviewDrawerOpen(false);
    setTimeout(openDrawer, DRAWER_TRANSITION_MS);
  }, []);

  const handleMobileEditDate = useCallback(() => {
    openEditDrawerAfterClose(() => setMobileDateDrawerOpen(true));
  }, [openEditDrawerAfterClose]);

  const handleMobileEditTime = useCallback(() => {
    openEditDrawerAfterClose(() => setMobileTimeDrawerOpen(true));
  }, [openEditDrawerAfterClose]);

  const handleMobileEditGuests = useCallback(() => {
    openEditDrawerAfterClose(() => {
      setMobileParticipantsDraft(mobileParticipants);
      setMobileParticipantsDrawerOpen(true);
    });
  }, [openEditDrawerAfterClose, mobileParticipants]);

  const handleMobileDateSelectFromDrawer = useCallback((date) => {
    reopenReviewDrawerOnCloseEditRef.current = false;
    setMobileSelectedDate(date);
    setMobileCalendarMonth(date);
    setMobileDateDrawerOpen(false);
    setMobileTimeDrawerOpen(true);
  }, []);

  const createEditDrawerOnOpenChange = useCallback((setDrawerOpen) => {
    return (open) => {
      setDrawerOpen(open);
      if (!open && reopenReviewDrawerOnCloseEditRef.current) {
        reopenReviewDrawerOnCloseEditRef.current = false;
        setMobileReviewDrawerOpen(true);
      }
    };
  }, []);

  const handleParticipantsApply = useCallback(() => {
    setMobileParticipants(mobileParticipantsDraft);
    setMobileParticipantsDrawerOpen(false);
    if (reopenReviewDrawerOnCloseEditRef.current) {
      reopenReviewDrawerOnCloseEditRef.current = false;
      setMobileReviewDrawerOpen(true);
    }
  }, [mobileParticipantsDraft]);

  return {
    isMobileView,
    mobileAvailableSlots,
    mobileSlotsLoading,
    mobileSelectedSlot,
    mobileSelectedDate,
    mobileCalendarMonth,
    mobileMinSelectableDate,
    mobileToday,
    mobileTimeDrawerOpen,
    setMobileTimeDrawerOpen,
    mobileDateDrawerOpen,
    setMobileDateDrawerOpen,
    mobileParticipantsDrawerOpen,
    setMobileParticipantsDrawerOpen,
    mobileParticipants,
    mobileParticipantsDraft,
    setMobileParticipantsDraft,
    mobileParticipantsMax,
    mobileReviewDrawerOpen,
    setMobileReviewDrawerOpen,
    handleReserveClick,
    handleMobileEditDate,
    handleMobileEditTime,
    handleMobileEditGuests,
    handleMobileDateSelect,
    handleMobileDateSelectFromDrawer,
    handleMobileTimeSelect,
    handleMobileCalendarMonthChange,
    createEditDrawerOnOpenChange,
    handleParticipantsApply,
    mobileAvailabilityError,
  };
}
