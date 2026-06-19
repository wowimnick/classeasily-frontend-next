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

/** Default participant count when quick-selecting from upcoming availability */
export const DEFAULT_PARTICIPANTS = 1;

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
  const [mobileCalendarDrawerOpen, setMobileCalendarDrawerOpen] = useState(false);
  const [mobileScrollToDate, setMobileScrollToDate] = useState(null);

  const reopenReviewDrawerOnCloseEditRef = useRef(false);
  const reopenSelectTimeAfterCalendarRef = useRef(false);
  const pendingCalendarFromSelectTimeRef = useRef(false);
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
    setMobileParticipants((prev) =>
      Math.min(Math.max(1, prev), mobileSelectedSlot.available_spots ?? 1),
    );
  }, [mobileSelectedSlot?.id]);

  const mobileModalParticipantsMax = useMemo(() => {
    const allSlots = Object.values(mobileAvailableSlots).flat();
    if (!allSlots.length) return 10;
    return Math.max(...allSlots.map((s) => s.available_spots ?? 1), 1);
  }, [mobileAvailableSlots]);

  const mobileParticipantsMax = useMemo(() => {
    if (mobileSelectedSlot?.available_spots != null) {
      return Math.max(1, mobileSelectedSlot.available_spots);
    }
    return mobileModalParticipantsMax;
  }, [mobileSelectedSlot?.available_spots, mobileModalParticipantsMax]);

  const handleMobileCalendarMonthChange = useCallback((direction) => {
    setMobileCalendarMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction, 1);
      return next;
    });
  }, []);

  /** Open the unified SelectTimeModal from the sticky footer "Show dates" button. */
  const handleOpenSelectTimeModal = useCallback(() => {
    setMobileScrollToDate(null);
    setMobileSelectTimeModalOpen(true);
  }, []);

  /** Close time modal and open the separate calendar drawer (MiniCalendar). */
  const handleOpenCalendarFromSelectTime = useCallback(() => {
    reopenSelectTimeAfterCalendarRef.current = true;
    pendingCalendarFromSelectTimeRef.current = true;
    setMobileSelectTimeModalOpen(false);
    setTimeout(() => {
      pendingCalendarFromSelectTimeRef.current = false;
      setMobileCalendarDrawerOpen(true);
    }, DRAWER_TRANSITION_MS);
  }, []);

  const handleCalendarDateSelect = useCallback((date) => {
    setMobileSelectedDate(date);
    setMobileCalendarMonth(date);
    setMobileScrollToDate(date);
    reopenSelectTimeAfterCalendarRef.current = false;
    setMobileCalendarDrawerOpen(false);
    setTimeout(() => setMobileSelectTimeModalOpen(true), DRAWER_TRANSITION_MS);
  }, []);

  const handleCalendarDrawerOpenChange = useCallback((open) => {
    setMobileCalendarDrawerOpen(open);
    if (!open && reopenSelectTimeAfterCalendarRef.current) {
      reopenSelectTimeAfterCalendarRef.current = false;
      setTimeout(() => setMobileSelectTimeModalOpen(true), DRAWER_TRANSITION_MS);
    }
  }, []);

  const handleMobileTimeSelect = useCallback(
    (slot, dateStrOverride, participantOverride) => {
      const dateStr =
        dateStrOverride ||
        (mobileSelectedDate ? getLocalYYYYMMDD(mobileSelectedDate) : null);
      if (!dateStr) return;

      const maxSpots = slot.available_spots ?? 1;
      const participants = Math.min(
        participantOverride ?? mobileParticipants,
        maxSpots,
      );
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
    [mobileSelectedDate, mobileParticipants],
  );

  /** Upcoming availability strip — skip modal, go straight to review summary with 1 guest. */
  const handleQuickSelectFromAvailability = useCallback(
    (slot, dateStr) => {
      if (!slot || !dateStr) return;
      const [y, m, d] = dateStr.split("-").map(Number);
      setMobileSelectedDate(new Date(y, m - 1, d));
      setMobileParticipants(1);
      handleMobileTimeSelect(slot, dateStr, 1);
    },
    [handleMobileTimeSelect],
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

  /** Edit date or time from review summary — both reopen the same time-selection modal. */
  const handleMobileEditDateOrTime = useCallback(() => {
    openEditDrawerAfterClose(() => {
      const dateStr = mobileSelectedSlot?.date;
      if (dateStr) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const dateObj = new Date(y, m - 1, d);
        setMobileSelectedDate(dateObj);
        setMobileCalendarMonth(dateObj);
        setMobileScrollToDate(dateObj);
      }
      setMobileSelectTimeModalOpen(true);
    });
  }, [openEditDrawerAfterClose, mobileSelectedSlot?.date]);

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
      if (pendingCalendarFromSelectTimeRef.current) return;
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
    mobileModalParticipantsMax,
    mobileReviewDrawerOpen,
    setMobileReviewDrawerOpen,
    handleReserveClick,
    handleMobileEditDateOrTime,
    handleMobileEditGuests,
    handleMobileCalendarMonthChange,
    createEditDrawerOnOpenChange,
    handleParticipantsApply,
    mobileAvailabilityError,
    // Unified SelectTimeModal
    mobileSelectTimeModalOpen,
    setMobileSelectTimeModalOpen,
    mobileCalendarDrawerOpen,
    mobileScrollToDate,
    handleOpenSelectTimeModal,
    handleOpenCalendarFromSelectTime,
    handleCalendarDateSelect,
    handleCalendarDrawerOpenChange,
    handleQuickSelectFromAvailability,
    handleSelectTimeModalSlot,
    handleSelectTimeModalOpenChange,
    setMobileSelectedDate,
  };
}
