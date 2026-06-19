"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLocalYYYYMMDD } from "@/services/utils";
import { scheduleService } from "@/services/apiService";
import posthog from "posthog-js";
import { BP } from "@/styles/breakpoints";
import message from "@/lib/message";

/** Breakpoint (px) below which mobile reserve flow is shown */
export const MOBILE_RESERVE_BREAKPOINT = BP.TABLET;

/** Delay (ms) between closing one drawer and opening another to avoid overlap */
export const DRAWER_TRANSITION_MS = 150;

/** Default participant count when quick-selecting from upcoming availability */
export const DEFAULT_PARTICIPANTS = 1;

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

/** Total horizon for availability fetch. */
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
 * Booking flow state: availability → select time → (mobile: review) → checkout.
 */
export function useMobileReserveFlow(
  mounted,
  classData,
  optionToDisplayOnCard,
  authUser,
) {
  const router = useRouter();
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
  const [mobileSelectTimeModalOpen, setMobileSelectTimeModalOpen] = useState(false);
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
    if (!mounted || !optionToDisplayOnCard?.optionId) return;
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
        console.error("Availability fetch failed", e);
        if (!cancelled) setMobileAvailabilityError(true);
      } finally {
        if (!cancelled) setMobileSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, optionToDisplayOnCard?.optionId, mobileMinSelectableDate]);

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

  const goToCheckout = useCallback(
    (slotState, participants) => {
      if (!classData?.slug || !optionToDisplayOnCard || !slotState) return;
      if (typeof window === "undefined") return;

      const bookerName = authUser
        ? `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim()
        : "";
      const bookerEmail = authUser?.email?.trim() || "";
      const bookerPhone = String(
        authUser?.phone_number || authUser?.phone || "",
      ).trim();

      const checkoutSlot = {
        id: slotState.id,
        date: slotState.date,
        time: slotState.time,
        duration: slotState.duration,
        available_spots: slotState.available_spots,
        price: slotState.price,
        isCourse: optionToDisplayOnCard.booking_type === "Full Course",
        min_participants: slotState.minParticipants ?? 1,
      };

      try {
        sessionStorage.setItem(
          CHECKOUT_STORAGE_KEY,
          JSON.stringify({
            classSlug: classData.slug,
            classData,
            bookingData: {
              selectedSlots: [checkoutSlot],
              participants,
              participant_details: Array.from({ length: participants }, (_, i) => ({
                name: i === 0 ? bookerName : "",
              })),
              notes: "",
              price: parseFloat(slotState.price || 0) || 0,
              selectedOption: optionToDisplayOnCard,
              userName: bookerName,
              userEmail: bookerEmail,
              userPhone: bookerPhone,
            },
          }),
        );
        setMobileSelectTimeModalOpen(false);
        setMobileReviewDrawerOpen(false);
        router.push(`/classes/${classData.slug}/checkout`);
      } catch (e) {
        console.error("Checkout redirect failed", e);
        message.error("Couldn't open checkout. Please try again.");
      }
    },
    [classData, optionToDisplayOnCard, authUser, router],
  );

  const handleOpenSelectTimeModal = useCallback(() => {
    setMobileScrollToDate(null);
    setMobileSelectTimeModalOpen(true);
  }, []);

  const handleCalendarDatePicked = useCallback((date) => {
    setMobileSelectedDate(date);
    setMobileCalendarMonth(date);
    setMobileScrollToDate(date);
  }, []);

  const handleMobileTimeSelect = useCallback(
    (slot, dateStrOverride, participantOverride) => {
      const dateStr =
        dateStrOverride ||
        (mobileSelectedDate ? getLocalYYYYMMDD(mobileSelectedDate) : null);
      if (!dateStr) return;

      const maxSpots = slot.available_spots ?? slot.maxParticipants ?? 1;
      const instanceId = slot.instance_id ?? slot.id;
      const participants = Math.min(
        participantOverride ?? mobileParticipants,
        maxSpots,
      );
      const slotState = {
        id: instanceId,
        date: dateStr,
        time: slot.time,
        available_spots: slot.available_spots ?? slot.maxParticipants,
        price: slot.price,
        duration: slot.duration,
        minParticipants: slot.min_participants ?? slot.minParticipants,
      };

      setMobileSelectedSlot(slotState);
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

      if (isMobileView) {
        setMobileSelectTimeModalOpen(false);
        setTimeout(() => setMobileReviewDrawerOpen(true), DRAWER_TRANSITION_MS);
      } else {
        goToCheckout(slotState, participants);
      }
    },
    [mobileSelectedDate, mobileParticipants, isMobileView, goToCheckout],
  );

  const handleQuickSelectFromAvailability = useCallback(
    (slot, dateStr) => {
      if (!slot || !dateStr) return;
      const normalized = {
        instance_id: slot.instance_id ?? slot.id,
        time: slot.time,
        available_spots: slot.available_spots ?? slot.maxParticipants,
        price: slot.price,
        duration: slot.duration,
        min_participants: slot.min_participants ?? slot.minParticipants,
      };
      const [y, m, d] = dateStr.split("-").map(Number);
      setMobileSelectedDate(new Date(y, m - 1, d));
      setMobileParticipants(1);
      handleMobileTimeSelect(normalized, dateStr, 1);
    },
    [handleMobileTimeSelect],
  );

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

  const openEditDrawerAfterClose = useCallback((openDrawer) => {
    reopenReviewDrawerOnCloseEditRef.current = true;
    setMobileReviewDrawerOpen(false);
    setTimeout(openDrawer, DRAWER_TRANSITION_MS);
  }, []);

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
    mobileModalParticipantsMax,
    mobileReviewDrawerOpen,
    setMobileReviewDrawerOpen,
    handleMobileEditDateOrTime,
    handleMobileEditGuests,
    createEditDrawerOnOpenChange,
    handleParticipantsApply,
    mobileAvailabilityError,
    mobileSelectTimeModalOpen,
    mobileScrollToDate,
    handleOpenSelectTimeModal,
    handleCalendarDatePicked,
    handleQuickSelectFromAvailability,
    handleSelectTimeModalSlot,
    handleSelectTimeModalOpenChange,
    setMobileSelectedDate,
  };
}
