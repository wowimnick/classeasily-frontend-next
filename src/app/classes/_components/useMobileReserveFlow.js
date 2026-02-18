"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getLocalYYYYMMDD } from "@/services/utils";
import { scheduleService } from "@/services/apiService";

/** Breakpoint (px) below which mobile reserve flow is shown */
export const MOBILE_RESERVE_BREAKPOINT = 1024;

/** Delay (ms) between closing one drawer and opening another to avoid overlap */
export const DRAWER_TRANSITION_MS = 150;

/** Default participant count when slot allows more */
export const DEFAULT_PARTICIPANTS = 2;

/** Availability fetch window (days) for mobile calendar */
const MOBILE_AVAILABILITY_DAYS = 60;

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
  const reopenReviewDrawerOnCloseEditRef = useRef(false);

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
      setIsMobileView(typeof window !== "undefined" && window.innerWidth <= MOBILE_RESERVE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted || !optionToDisplayOnCard?.optionId || !isMobileView) return;
    const optionId = optionToDisplayOnCard.optionId;
    setMobileSlotsLoading(true);
    const start = new Date(mobileMinSelectableDate);
    const end = new Date(start);
    end.setDate(end.getDate() + MOBILE_AVAILABILITY_DAYS);
    scheduleService
      .getAvailabilityForOption(optionId, {
        start_date: getLocalYYYYMMDD(start),
        end_date: getLocalYYYYMMDD(end),
      })
      .then((res) => {
        if (res && typeof res === "object") {
          setMobileAvailableSlots((prev) => ({ ...prev, ...res }));
        }
      })
      .catch((e) => console.error("Mobile availability fetch failed", e))
      .finally(() => setMobileSlotsLoading(false));
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
      setMobileTimeDrawerOpen(false);
      setTimeout(() => setMobileReviewDrawerOpen(true), DRAWER_TRANSITION_MS);
    },
    [mobileSelectedDate]
  );

  const handleReserveClick = useCallback(() => {
    if (!mobileSelectedSlot || !optionToDisplayOnCard || !classData?.slug) return;
    setMobileReviewDrawerOpen(true);
  }, [mobileSelectedSlot, optionToDisplayOnCard, classData]);

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
  };
}
