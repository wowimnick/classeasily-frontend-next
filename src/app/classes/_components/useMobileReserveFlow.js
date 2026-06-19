"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getLocalYYYYMMDD } from "@/services/utils";
import { scheduleService } from "@/services/apiService";
import posthog from "posthog-js";
import { BP } from "@/styles/breakpoints";

/** Breakpoint (px) below which mobile reserve flow is shown */
export const MOBILE_RESERVE_BREAKPOINT = BP.TABLET;

/** Delay (ms) between closing one drawer and opening another to avoid overlap */
export const DRAWER_TRANSITION_MS = 150;

/** Default participant count when slot allows more */
export const DEFAULT_PARTICIPANTS = 2;

/** Total horizon for mobile availability (matches former "far future" fix). */
const MOBILE_AVAILABILITY_RANGE_DAYS = 540;

function buildMobileAvailabilityRange(minSelectableDate) {
  const rangeEnd = new Date(minSelectableDate);
  rangeEnd.setDate(rangeEnd.getDate() + MOBILE_AVAILABILITY_RANGE_DAYS);
  return {
    start_date: getLocalYYYYMMDD(minSelectableDate),
    end_date: getLocalYYYYMMDD(rangeEnd),
  };
}

/**
 * Encapsulates all state and handlers for the mobile reserve flow:
 * upcoming availability strip → SelectTimeModal → reserve footer → review drawer.
 */
export function useMobileReserveFlow(mounted, classData, optionToDisplayOnCard) {
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileAvailableSlots, setMobileAvailableSlots] = useState({});
  const [mobileSlotsLoading, setMobileSlotsLoading] = useState(false);
  const [mobileSelectedSlot, setMobileSelectedSlot] = useState(null);
  const [mobileSelectedDate, setMobileSelectedDate] = useState(null);
  const [mobileCalendarMonth, setMobileCalendarMonth] = useState(() => new Date());
  const [mobileParticipantsDrawerOpen, setMobileParticipantsDrawerOpen] = useState(false);
  const [mobileParticipants, setMobileParticipants] = useState(DEFAULT_PARTICIPANTS);
  const [mobileParticipantsDraft, setMobileParticipantsDraft] = useState(DEFAULT_PARTICIPANTS);
  const [mobileReviewDrawerOpen, setMobileReviewDrawerOpen] = useState(false);
  const [mobileAvailabilityError, setMobileAvailabilityError] = useState(false);

  // Unified "Select a time" modal (replaces old separate date/time drawers).
  const [mobileSelectTimeModalOpen, setMobileSelectTimeModalOpen] = useState(false);
  const [mobileCalendarExpanded, setMobileCalendarExpanded] = useState(false);
  const [mobileScrollToDate, setMobileScrollToDate] = useState(null);

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

    const range = buildMobileAvailabilityRange(mobileMinSelectableDate);

    (async () => {
      setMobileSlotsLoading(true);
      setMobileAvailabilityError(false);
      setMobileAvailableSlots({});
      setMobileSelectedSlot(null);
      setMobileSelectedDate(null);
      hasFiredDateSelectedRef.current = false;

      try {
        const data = await scheduleService.getAvailabilityForOption(optionId, range);
        if (cancelled) return;
        if (data && typeof data === "object") {
          setMobileAvailableSlots(data);
        }
      } catch (e) {
        console.error("Mobile availability fetch failed", e);
        if (!cancelled) setMobileAvailabilityError(true);
      } finally {
        if (!cancelled) setMobileSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, optionToDisplayOnCard?.optionId, isMobileView, mobileMinSelectableDate]);

  // Set initial calendar month to first available date — but do NOT auto-select a slot.
  // Users must explicitly pick a time via SelectTimeModal so the footer shows "Show dates".
  useEffect(() => {
    if (mobileSlotsLoading || Object.keys(mobileAvailableSlots).length === 0) return;
    const sortedDates = Object.keys(mobileAvailableSlots)
      .filter((d) => d >= getLocalYYYYMMDD(mobileMinSelectableDate))
      .sort();
    if (sortedDates.length === 0) return;

    const firstDateObj = (dateStr) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

    setMobileCalendarMonth((prev) => {
      for (const dateStr of sortedDates) {
        const slots = mobileAvailableSlots[dateStr];
        if (Array.isArray(slots) && slots.length > 0) {
          return firstDateObj(dateStr);
        }
      }
      return prev;
    });
  }, [mobileSlotsLoading, mobileAvailableSlots, mobileMinSelectableDate]);

  useEffect(() => {
    if (!mobileSelectedSlot) return;
    setMobileParticipants(
      Math.min(DEFAULT_PARTICIPANTS, mobileSelectedSlot.available_spots ?? 2),
    );
  }, [mobileSelectedSlot?.id]);

  const mobileParticipantsMax = useMemo(
    () => Math.max(1, mobileSelectedSlot?.available_spots ?? 2),
    [mobileSelectedSlot?.available_spots],
  );

  const handleMobileCalendarMonthChange = useCallback((direction) => {
    setMobileCalendarMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction, 1);
      return next;
    });
  }, []);

  /** Open the unified SelectTimeModal from the sticky footer "Show dates" button. */
  const handleOpenSelectTimeModal = useCallback(() => {
    setMobileCalendarExpanded(false);
    setMobileScrollToDate(null);
    setMobileSelectTimeModalOpen(true);
  }, []);

  /** Open the modal scrolled to a specific date (from upcoming availability strip card). */
  const handleOpenSelectTimeModalForDate = useCallback((date) => {
    setMobileSelectedDate(date);
    setMobileCalendarMonth(date);
    setMobileCalendarExpanded(false);
    setMobileScrollToDate(date);
    setMobileSelectTimeModalOpen(true);
  }, []);

  const handleMobileTimeSelect = useCallback(
    (slot, dateStrOverride) => {
      const dateStr =
        dateStrOverride ||
        (mobileSelectedDate ? getLocalYYYYMMDD(mobileSelectedDate) : null);
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

      if (!hasFiredDateSelectedRef.current) {
        hasFiredDateSelectedRef.current = true;
        posthog.capture("booking_date_selected", {
          date: dateStr,
          time: slot.time,
          participants,
        });
      }

      setMobileSelectTimeModalOpen(false);
      setTimeout(() => setMobileReviewDrawerOpen(true), DRAWER_TRANSITION_MS);
    },
    [mobileSelectedDate],
  );

  /** Slot selection from SelectTimeModal — sets date then delegates to handleMobileTimeSelect. */
  const handleSelectTimeModalSlot = useCallback(
    (slot, dateStr) => {
      if (dateStr) {
        const [y, m, d] = dateStr.split("-").map(Number);
        setMobileSelectedDate(new Date(y, m - 1, d));
      }
      handleMobileTimeSelect(slot, dateStr);
    },
    [handleMobileTimeSelect],
  );

  const handleReserveClick = useCallback(() => {
    if (!mobileSelectedSlot || !optionToDisplayOnCard || !classData?.slug) return;
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
    openEditDrawerAfterClose(() => {
      setMobileCalendarExpanded(true);
      setMobileScrollToDate(null);
      setMobileSelectTimeModalOpen(true);
    });
  }, [openEditDrawerAfterClose]);

  const handleMobileEditTime = useCallback(() => {
    openEditDrawerAfterClose(() => {
      setMobileCalendarExpanded(false);
      setMobileScrollToDate(mobileSelectedDate);
      setMobileSelectTimeModalOpen(true);
    });
  }, [openEditDrawerAfterClose, mobileSelectedDate]);

  const handleMobileEditGuests = useCallback(() => {
    openEditDrawerAfterClose(() => {
      setMobileParticipantsDraft(mobileParticipants);
      setMobileParticipantsDrawerOpen(true);
    });
  }, [openEditDrawerAfterClose, mobileParticipants]);

  const createEditDrawerOnOpenChange = useCallback((setDrawerOpen) => {
    return (open) => {
      setDrawerOpen(open);
      if (!open && reopenReviewDrawerOnCloseEditRef.current) {
        reopenReviewDrawerOnCloseEditRef.current = false;
        setMobileReviewDrawerOpen(true);
      }
    };
  }, []);

  /** onOpenChange for SelectTimeModal — reopen review drawer when closing from edit flow. */
  const handleSelectTimeModalOpenChange = useCallback((open) => {
    setMobileSelectTimeModalOpen(open);
    if (!open) {
      setMobileScrollToDate(null);
      if (reopenReviewDrawerOnCloseEditRef.current) {
        reopenReviewDrawerOnCloseEditRef.current = false;
        setMobileReviewDrawerOpen(true);
      }
    }
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
    mobileParticipantsDrawerOpen,
    setMobileParticipantsDrawerOpen,
    mobileParticipants,
    mobileParticipantsDraft,
    setMobileParticipantsDraft,
    setMobileParticipants,
    mobileParticipantsMax,
    mobileReviewDrawerOpen,
    setMobileReviewDrawerOpen,
    handleReserveClick,
    handleMobileEditDate,
    handleMobileEditTime,
    handleMobileEditGuests,
    handleMobileCalendarMonthChange,
    createEditDrawerOnOpenChange,
    handleParticipantsApply,
    mobileAvailabilityError,
    // Unified SelectTimeModal
    mobileSelectTimeModalOpen,
    setMobileSelectTimeModalOpen,
    mobileCalendarExpanded,
    mobileScrollToDate,
    handleOpenSelectTimeModal,
    handleOpenSelectTimeModalForDate,
    handleSelectTimeModalSlot,
    handleSelectTimeModalOpenChange,
    setMobileSelectedDate,
  };
}
