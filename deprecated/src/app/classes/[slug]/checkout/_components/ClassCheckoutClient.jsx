"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { X, ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { paymentService, scheduleService } from "@/services/apiService";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import ClientHeader from "@/components/layout/ClientHeader";
import CheckoutErrorBoundary from "@/components/common/CheckoutErrorBoundary";
import { saveBookingSuccessPayload } from "@/lib/bookingSuccessStorage";
import { getLocalYYYYMMDD } from "@/services/utils";
import SelectTimeModal from "@/app/classes/_components/SelectTimeModal";
import { toSchemaPriceCurrency } from "@/lib/seo";

const CHECKOUT_AVAILABILITY_RANGE_DAYS = 540;

function buildCheckoutAvailabilityRange(minSelectableDate) {
  const rangeEnd = new Date(minSelectableDate);
  rangeEnd.setDate(rangeEnd.getDate() + CHECKOUT_AVAILABILITY_RANGE_DAYS);
  return {
    start_date: getLocalYYYYMMDD(minSelectableDate),
    end_date: getLocalYYYYMMDD(rangeEnd),
  };
}

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

const ReviewAndPaymentStep = dynamic(
  () => import("@/app/classes/_components/steps/ReviewAndPaymentStep"),
  { loading: () => <div style={{ minHeight: "400px" }} />, ssr: false }
);

/** Lazy-loads lottie-react + Scene.json only while checkout is in loading state. */
function CheckoutLoaderLottie() {
  const [LottieComponent, setLottieComponent] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lottieMod, animMod] = await Promise.all([
          import("lottie-react"),
          import("@/assets/animations/Scene.json"),
        ]);
        if (cancelled) return;
        setLottieComponent(() => lottieMod.default);
        setAnimationData(animMod.default ?? animMod);
      } catch {
        if (!cancelled) setAnimationData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!LottieComponent || !animationData) {
    return (
      <div
        style={{ width: 180, height: 180 }}
        aria-hidden
      />
    );
  }

  return (
    <LottieComponent
      animationData={animationData}
      loop
      style={{ width: 180, height: 180 }}
    />
  );
}

// --- STYLED COMPONENTS ---

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgb(252, 252, 252);
`;

/* ClientHeader wrapper: show only on desktop, above checkout bar */
const DesktopClientHeaderWrap = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: block;
    width: 100%;
  }
`;

/* --- NEW CUSTOM DESKTOP HEADER --- */
const DesktopHeaderBar = styled.header`
  display: none;
  @media (min-width: 1024px) {
    display: flex;
    justify-content: center;
    width: 100%;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    height: 80px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
`;

const DesktopHeaderContent = styled.div`
  max-width: 1000px; /* Matches MainContainer */
  width: 100%;
  padding: 0 16px; /* Matches MainContainer padding */
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const HeaderTitle = styled.h1`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const DesktopBackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: white;
  color: #111827;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

/* Mobile Header: full white background */
const MobileHeaderBar = styled.header`
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  justify-items: center;
  width: 100%;
  min-height: 56px;
  background: white;
  box-sizing: border-box;
  @media (min-width: 1024px) {
    display: none;
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;
  justify-self: start;
  grid-column: 1;
  &:hover {
    color: #374151;
  }
`;

const TitleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: transparent;
  grid-column: 2;
  justify-self: center;
`;

const CheckoutModalTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #222;
  text-align: center;
`;

const MainContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px 120px;
  flex: 1;

  @media (max-width: 900px) {
    padding: 0 0 120px;
  }

  @media (max-width: 1023px) {
    padding: 0px 0px 220px;
  }
`;

const CheckoutLoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
`;

const CheckoutLoaderTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
  margin-bottom: 0;
`;

const CheckoutLoaderSubtext = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
`;

const CheckoutFooter = styled(motion.footer)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.125);
  box-shadow: 0 -8px 32px 0 rgba(31, 38, 135, 0.08);
  padding: 16px 24px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 100;
`;

const MobileFooterWrap = styled.div`
  @media (min-width: 1024px) {
    display: none;
  }
`;

const TermsText = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.45;
  text-align: center;
  
  @media (max-width: 968px) {
    margin-bottom: 12px;
  }

  a {
    color: #ff385c;
    text-decoration: underline;
    font-weight: 500;
  }
  a:hover {
    color: #e31c5f;
  }
`;

const ConfirmButton = styled(motion.button)`
  width: 100%;
  background: #ff385c;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.1s ease, background-color 0.2s;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #ff385c;
  }
  &:hover:not(:disabled) {
    background: #e31c5f;
  }
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const ChangeParticipantsDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 3000;
`;
const ChangeParticipantsDrawerContent = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3001;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  outline: none;
`;
const ChangeParticipantsDrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto;
`;
const ParticipantsStepperWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 1rem;
`;
const ParticipantsStepperBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #ff385c;
    color: #ff385c;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const ParticipantsStepperValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  min-width: 2rem;
  text-align: center;
`;
const ParticipantsApplyButton = styled.button`
  margin: 0 1rem 1.5rem;
  padding: 14px 24px;
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #e62e4e;
  }
`;

const DesktopParticipantsModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const DesktopParticipantsModalCard = styled(motion.div)`
  width: min(100%, 360px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  padding: 20px;
  box-sizing: border-box;
`;

const DesktopParticipantsModalTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111;
  text-align: center;
`;

const DesktopParticipantsModalSub = styled.p`
  margin: 0 0 12px;
  font-size: 0.825rem;
  color: #6b7280;
  text-align: center;
`;

const DesktopParticipantsActions = styled.div`
  display: flex;
  gap: 10px;
  padding: 0 4px;
`;

const DesktopParticipantsCancel = styled.button`
  flex: 1;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
`;

export default function ClassCheckoutClient({ slug, initialClassData }) {
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const [classData, setClassData] = useState(initialClassData || null);
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAction, setPaymentAction] = useState(null);
  const cancelledIntentRef = useRef(false);

  const [selectTimeModalOpen, setSelectTimeModalOpen] = useState(false);
  const [checkoutAvailableSlots, setCheckoutAvailableSlots] = useState({});
  const [checkoutSlotsLoading, setCheckoutSlotsLoading] = useState(false);
  const [checkoutSelectedDate, setCheckoutSelectedDate] = useState(null);
  const [checkoutScrollToDate, setCheckoutScrollToDate] = useState(null);
  const [checkoutParticipants, setCheckoutParticipants] = useState(1);

  const [changeParticipantsDrawerOpen, setChangeParticipantsDrawerOpen] = useState(false);
  const [participantsDraft, setParticipantsDraft] = useState(1);

  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsMobileView(
        typeof window !== "undefined" && window.innerWidth < 1024,
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      router.replace(`/classes/${slug}`);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const state = JSON.parse(raw);
        if (state.classSlug !== slug) {
          setLoading(false);
          router.replace(`/classes/${slug}`);
          return;
        }

        const hasSlots =
          state.bookingData?.selectedSlots?.length > 0 &&
          state.bookingData?.selectedOption;
        if (!hasSlots) {
          setLoading(false);
          router.replace(`/classes/${slug}`);
          return;
        }

        const {
          paymentIntentId,
          clientSecret,
          intentPriceBreakdown: _discardedBreakdown,
          ...restBookingData
        } = state.bookingData || {};
        
        if (paymentIntentId && !cancelled) {
          await paymentService.cancelPaymentIntent(paymentIntentId).catch(() => {});
        }
        if (cancelled) return;

        setBookingData(restBookingData);
        if (state.classData) {
          setClassData(state.classData);
        } else if (initialClassData) {
          setClassData(initialClassData);
        } else {
          classService
            .fetchClassDetail(slug)
            .then((data) => !cancelled && setClassData(data))
            .catch(() => {
              if (!cancelled) {
                setLoading(false);
                router.replace(`/classes/${slug}`);
              }
            });
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          router.replace(`/classes/${slug}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [slug, initialClassData, router]);

  const clearIntentFromStorage = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!raw || !slug) return;
      const state = JSON.parse(raw);
      if (state.classSlug !== slug || !state.bookingData) return;
      const {
        paymentIntentId,
        clientSecret,
        intentPriceBreakdown: _discardedBreakdown,
        ...rest
      } = state.bookingData;
      state.bookingData = rest;
      sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Checkout] clearIntentFromStorage failed:", e);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (!bookingData?.paymentIntentId) return;
    const intentId = bookingData.paymentIntentId;
    const handleBeforeUnload = () => {
      if (cancelledIntentRef.current) return;
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      if (!base) return;
      const url = `${base.replace(/\/$/, "")}/payments/cancel-payment-intent/`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_intent_id: intentId }),
        keepalive: true,
        credentials: "include",
      }).catch(() => {});
    };
    const handlePopState = () => {
      if (cancelledIntentRef.current) return;
      paymentService.cancelPaymentIntent(intentId).catch(() => {});
      clearIntentFromStorage();
      setBookingData((prev) =>
        prev
          ? {
              ...prev,
              clientSecret: undefined,
              paymentIntentId: undefined,
              intentPriceBreakdown: undefined,
            }
          : prev,
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [bookingData?.paymentIntentId, clearIntentFromStorage, paymentService]);

  const handlePaymentComplete = useCallback(
    (dataFromReviewStep) => {
      cancelledIntentRef.current = true;
      const rawDetails =
        dataFromReviewStep.participant_details ??
        bookingData?.participant_details ??
        [];
      const participantCount = bookingData?.participants ?? 1;
      const participant_details = Array.isArray(rawDetails)
        ? Array.from({ length: Math.max(rawDetails.length, participantCount) }, (_, i) => ({
            name: rawDetails[i]?.name != null ? String(rawDetails[i].name).trim() || "Guest" : "Guest",
          }))
        : Array.from({ length: participantCount }, () => ({ name: "Guest" }));
      const successPayload = {
        bookingId: dataFromReviewStep.booking_id,
        user_facing_reference: dataFromReviewStep.user_facing_reference,
        booking_group_id: dataFromReviewStep.booking_group_id,
        participant_details,
        payment_intent_id: dataFromReviewStep.payment_intent_id,
        client_secret: dataFromReviewStep.client_secret,
        bookingData: {
          ...bookingData,
          participant_details,
        },
        classData,
      };

      sessionStorage.setItem(
        "classeasily_booking_success",
        JSON.stringify(successPayload)
      );
      saveBookingSuccessPayload(successPayload);
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      router.push(`/classes/${slug}/checkout/success`);
    },
    [slug, router, bookingData, classData]
  );

  const handleUpdateBookingData = useCallback(
    (data) => {
      setBookingData((prev) => {
        const next = prev ? { ...prev, ...data } : prev;
        if (next && slug) {
          try {
            const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
            if (raw) {
              const state = JSON.parse(raw);
              if (state.classSlug === slug) {
                state.bookingData = { ...state.bookingData, ...data };
                sessionStorage.setItem(
                  CHECKOUT_STORAGE_KEY,
                  JSON.stringify(state)
                );
              }
            }
          } catch (e) {
            console.warn("[Checkout] Persist booking data failed:", e);
          }
        }
        return next;
      });
    },
    [slug]
  );

  const businessTimeZone = classData?.business_timezone || "Etc/UTC";
  const userTimeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Toronto";

  const changeDateMinSelectable = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 2);
    return d;
  }, []);
  const changeDateToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!selectTimeModalOpen || !bookingData?.selectedOption?.optionId) return;
    if (Object.keys(checkoutAvailableSlots).length > 0) return;

    const optionId = bookingData.selectedOption.optionId;
    const range = buildCheckoutAvailabilityRange(changeDateMinSelectable);
    let cancelled = false;
    setCheckoutSlotsLoading(true);

    scheduleService
      .getAvailabilityForOption(optionId, range)
      .then((res) => {
        if (!cancelled && res && typeof res === "object") {
          setCheckoutAvailableSlots(res);
        }
      })
      .finally(() => {
        if (!cancelled) setCheckoutSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectTimeModalOpen,
    bookingData?.selectedOption?.optionId,
    checkoutAvailableSlots,
    changeDateMinSelectable,
  ]);

  const changeParticipantsMax = useMemo(() => {
    const slot = bookingData?.selectedSlots?.[0];
    const spots = slot?.available_spots;
    if (spots != null && typeof spots === "number") return Math.max(1, spots);
    return 20;
  }, [bookingData?.selectedSlots]);

  const changeParticipantsMin = useMemo(() => {
    const slot = bookingData?.selectedSlots?.[0];
    const raw = Number(slot?.min_participants ?? slot?.minParticipants);
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  }, [bookingData?.selectedSlots]);

  useEffect(() => {
    if (changeParticipantsDrawerOpen && bookingData) {
      const p = bookingData.participants || changeParticipantsMin;
      setParticipantsDraft(Math.max(changeParticipantsMin, p));
    }
  }, [
    changeParticipantsDrawerOpen,
    bookingData?.participants,
    changeParticipantsMin,
  ]);

  const checkoutSelectedSlot = useMemo(() => {
    const slot = bookingData?.selectedSlots?.[0];
    if (!slot) return null;
    return {
      id: slot.id,
      date: slot.date,
      time: slot.time,
      available_spots: slot.available_spots,
      price: slot.price,
      duration: slot.duration,
      minParticipants: slot.minParticipants ?? slot.min_participants,
    };
  }, [bookingData?.selectedSlots]);

  const displayCurrency = useMemo(
    () => toSchemaPriceCurrency(classData?.currency_code || "CAD"),
    [classData?.currency_code],
  );

  const openSelectTimeModal = useCallback(() => {
    const slot = bookingData?.selectedSlots?.[0];
    const participants = Math.max(
      changeParticipantsMin,
      bookingData?.participants || changeParticipantsMin,
    );
    setCheckoutParticipants(participants);

    if (slot?.date) {
      const [y, m, d] = slot.date.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      setCheckoutSelectedDate(dateObj);
      setCheckoutScrollToDate(dateObj);
    }

    setSelectTimeModalOpen(true);
  }, [
    bookingData?.participants,
    bookingData?.selectedSlots,
    changeParticipantsMin,
  ]);

  const handleCheckoutCalendarDatePicked = useCallback((date) => {
    setCheckoutSelectedDate(date);
    setCheckoutScrollToDate(date);
  }, []);

  const handleSelectTimeModalOpenChange = useCallback((open) => {
    setSelectTimeModalOpen(open);
    if (!open) setCheckoutScrollToDate(null);
  }, []);

  const handleCheckoutSelectTimeSlot = useCallback(
    (slot, dateStr) => {
      if (!bookingData) return;
      const resolvedDateStr =
        dateStr ||
        (checkoutSelectedDate
          ? getLocalYYYYMMDD(checkoutSelectedDate)
          : bookingData?.selectedSlots?.[0]?.date);
      if (!resolvedDateStr) return;

      const participants = Math.min(
        checkoutParticipants || bookingData.participants || changeParticipantsMin,
        slot.available_spots ?? slot.maxParticipants ?? checkoutParticipants,
      );
      const instanceId = slot.instance_id ?? slot.id;
      const newSlot = {
        id: instanceId,
        date: resolvedDateStr,
        time: slot.time,
        available_spots: slot.available_spots ?? slot.maxParticipants,
        price: slot.price,
        duration: slot.duration,
        minParticipants: slot.min_participants ?? slot.minParticipants,
      };

      const existingName = bookingData.participant_details?.[0]?.name || "";
      handleUpdateBookingData({
        selectedSlots: [newSlot],
        participants,
        participant_details: Array.from({ length: participants }, (_, index) => ({
          name: bookingData.participant_details?.[index]?.name || existingName,
        })),
        price: parseFloat(slot.price) || 0,
      });

      const [y, m, d] = resolvedDateStr.split("-").map(Number);
      setCheckoutSelectedDate(new Date(y, m - 1, d));
      setSelectTimeModalOpen(false);
      setCheckoutScrollToDate(null);
    },
    [
      bookingData,
      checkoutParticipants,
      checkoutSelectedDate,
      changeParticipantsMin,
      handleUpdateBookingData,
    ],
  );

  const handleChangeParticipantsApply = useCallback(() => {
    const count = Math.min(
      Math.max(changeParticipantsMin, participantsDraft),
      changeParticipantsMax,
    );
    const existingName = bookingData?.participant_details?.[0]?.name || "";
    handleUpdateBookingData({
      participants: count,
      participant_details: Array.from({ length: count }, () => ({ name: existingName })),
    });
    setChangeParticipantsDrawerOpen(false);
  }, [participantsDraft, changeParticipantsMin, changeParticipantsMax, bookingData?.participant_details, handleUpdateBookingData]);

  const handleCloseCheckout = () => {
    const intentId = bookingData?.paymentIntentId;
    if (intentId && !cancelledIntentRef.current) {
      paymentService.cancelPaymentIntent(intentId).catch(() => {});
    }
    clearIntentFromStorage();
    router.replace(`/classes/${slug}`);
  };

  if (loading || !bookingData || !classData) {
    return (
      <PageWrapper>
        <DesktopClientHeaderWrap>
          <ClientHeader />
        </DesktopClientHeaderWrap>
        <DesktopHeaderBar>
           <DesktopHeaderContent>
              <DesktopBackButton onClick={() => router.replace(`/classes/${slug}`)}>
                 <ChevronLeft size={20} />
              </DesktopBackButton>
              <HeaderTitle>Review and continue</HeaderTitle>
           </DesktopHeaderContent>
        </DesktopHeaderBar>
        
        <MobileHeaderBar>
          <CloseButton onClick={() => router.replace(`/classes/${slug}`)}><X size={20} /></CloseButton>
          <TitleCard><CheckoutModalTitle>Review and continue</CheckoutModalTitle></TitleCard>
        </MobileHeaderBar>

        <MainContainer>
          <CheckoutLoaderContainer>
            <CheckoutLoaderLottie />
            <CheckoutLoaderTitle>We're getting things ready</CheckoutLoaderTitle>
            <CheckoutLoaderSubtext>Let's get that booked for you!</CheckoutLoaderSubtext>
          </CheckoutLoaderContainer>
        </MainContainer>
      </PageWrapper>
    );
  }

  const canSubmit = paymentAction?.canSubmit !== false && paymentAction?.handleSubmit;
  
  // Logic for the button content
  const FooterContent = (
    <>
      <TermsText>
        By selecting the button below, I agree to the{" "}
        <Link href="/terms-of-service">Host Terms</Link>,{" "}
        <Link href="/fees">Payment Terms of Service</Link>, and{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </TermsText>
      <ConfirmButton
        type="button"
        disabled={paymentAction?.loading || !canSubmit}
        onClick={() => paymentAction?.handleSubmit?.()}
        whileTap={{ scale: 0.98 }}
      >
        {paymentAction?.loading ? "Processing…" : "Complete Booking"}
      </ConfirmButton>
    </>
  );

  return (
    <PageWrapper>
      {/* ClientHeader on desktop only, above checkout nav */}
      <DesktopClientHeaderWrap>
        <ClientHeader showOptionsWrapper={false} />
      </DesktopClientHeaderWrap>
      {/* 1. Custom Desktop Header */}
      <DesktopHeaderBar>
         <DesktopHeaderContent>
            <DesktopBackButton onClick={handleCloseCheckout} aria-label="Back">
               <ChevronLeft size={24} />
            </DesktopBackButton>
            <HeaderTitle>Review and continue</HeaderTitle>
         </DesktopHeaderContent>
      </DesktopHeaderBar>

      {/* Mobile Header (Hidden on Desktop) */}
      <MobileHeaderBar>
        <CloseButton type="button" onClick={handleCloseCheckout} aria-label="Close">
          <X size={20} />
        </CloseButton>
        <TitleCard>
          <CheckoutModalTitle>Review and continue</CheckoutModalTitle>
        </TitleCard>
      </MobileHeaderBar>

      <MainContainer>
          <CheckoutErrorBoundary slug={slug}>
          <ReviewAndPaymentStep
            bookingData={bookingData}
            classData={classData}
            paymentService={paymentService}
            onPaymentComplete={handlePaymentComplete}
            isUserLoggedIn={!!currentUser}
            onUpdateBookingData={handleUpdateBookingData}
            onPaymentAction={setPaymentAction}
            userTimeZone={userTimeZone}
            businessTimeZone={businessTimeZone}
            confirmFooter={FooterContent}
            onRequestChangeDate={isMobileView ? openSelectTimeModal : undefined}
            onRequestChangeTime={isMobileView ? openSelectTimeModal : undefined}
            onRequestChangeParticipants={() => setChangeParticipantsDrawerOpen(true)}
          />
          </CheckoutErrorBoundary>

          {/* Mobile Floating Footer */}
          <MobileFooterWrap>
            <AnimatePresence>
              {/* Show footer only when payment step is active (controlled inside ReviewAndPaymentStep logic) 
                  but we receive the signal via paymentAction.showFooterButton */}
              {paymentAction?.showFooterButton && (
                <CheckoutFooter
                  initial={{ y: 32, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 300 }}
                >
                  {FooterContent}
                </CheckoutFooter>
              )}
            </AnimatePresence>
          </MobileFooterWrap>
        </MainContainer>

        {isMobileView && (
          <SelectTimeModal
            open={selectTimeModalOpen}
            onOpenChange={handleSelectTimeModalOpenChange}
            onDateSelect={handleCheckoutCalendarDatePicked}
            availableSlots={checkoutAvailableSlots}
            loading={checkoutSlotsLoading}
            selectedDate={checkoutSelectedDate}
            selectedSlot={checkoutSelectedSlot}
            participants={checkoutParticipants}
            participantsMax={changeParticipantsMax}
            onParticipantsChange={setCheckoutParticipants}
            onSelectSlot={handleCheckoutSelectTimeSlot}
            minSelectableDate={changeDateMinSelectable}
            today={changeDateToday}
            businessTimezone={businessTimeZone}
            currency={displayCurrency}
            option={bookingData?.selectedOption}
            scrollToDate={checkoutScrollToDate}
            variant="drawer"
          />
        )}

        {isMobileView ? (
          <Drawer.Root
            open={changeParticipantsDrawerOpen}
            onOpenChange={setChangeParticipantsDrawerOpen}
            shouldScaleBackground
          >
            <Drawer.Portal>
              <ChangeParticipantsDrawerOverlay />
              <ChangeParticipantsDrawerContent>
                <ChangeParticipantsDrawerHandle />
                <h3 style={{ margin: "0 1rem 0.25rem", fontSize: "1.125rem", fontWeight: 700, color: "#111", textAlign: "center" }}>
                  Number of guests
                </h3>
                <p style={{ margin: "0 1rem 1rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
                  Up to {changeParticipantsMax} guests for this time slot.
                  {changeParticipantsMin > 1 ? (
                    <span style={{ display: "block", marginTop: "0.35rem" }}>
                      Minimum {changeParticipantsMin} guests.
                    </span>
                  ) : null}
                </p>
                <ParticipantsStepperWrap>
                  <ParticipantsStepperBtn
                    type="button"
                    disabled={participantsDraft <= changeParticipantsMin}
                    onClick={() =>
                      setParticipantsDraft((n) =>
                        Math.max(changeParticipantsMin, n - 1),
                      )
                    }
                    aria-label="Decrease guests"
                  >
                    −
                  </ParticipantsStepperBtn>
                  <ParticipantsStepperValue>{participantsDraft}</ParticipantsStepperValue>
                  <ParticipantsStepperBtn
                    type="button"
                    disabled={participantsDraft >= changeParticipantsMax}
                    onClick={() => setParticipantsDraft((n) => Math.min(changeParticipantsMax, n + 1))}
                    aria-label="Increase guests"
                  >
                    +
                  </ParticipantsStepperBtn>
                </ParticipantsStepperWrap>
                <ParticipantsApplyButton type="button" onClick={handleChangeParticipantsApply}>
                  Apply
                </ParticipantsApplyButton>
              </ChangeParticipantsDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <AnimatePresence>
            {changeParticipantsDrawerOpen && (
              <DesktopParticipantsModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setChangeParticipantsDrawerOpen(false)}
              >
                <DesktopParticipantsModalCard
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DesktopParticipantsModalTitle>
                    Number of guests
                  </DesktopParticipantsModalTitle>
                  <DesktopParticipantsModalSub>
                    Up to {changeParticipantsMax} guests for this time slot.
                    {changeParticipantsMin > 1 ? (
                      <>
                        {" "}
                        Minimum {changeParticipantsMin} guests.
                      </>
                    ) : null}
                  </DesktopParticipantsModalSub>
                  <ParticipantsStepperWrap style={{ padding: "12px 0 16px" }}>
                    <ParticipantsStepperBtn
                      type="button"
                      disabled={participantsDraft <= changeParticipantsMin}
                      onClick={() =>
                        setParticipantsDraft((n) =>
                          Math.max(changeParticipantsMin, n - 1),
                        )
                      }
                      aria-label="Decrease guests"
                    >
                      −
                    </ParticipantsStepperBtn>
                    <ParticipantsStepperValue>{participantsDraft}</ParticipantsStepperValue>
                    <ParticipantsStepperBtn
                      type="button"
                      disabled={participantsDraft >= changeParticipantsMax}
                      onClick={() => setParticipantsDraft((n) => Math.min(changeParticipantsMax, n + 1))}
                      aria-label="Increase guests"
                    >
                      +
                    </ParticipantsStepperBtn>
                  </ParticipantsStepperWrap>
                  <DesktopParticipantsActions>
                    <DesktopParticipantsCancel
                      type="button"
                      onClick={() => setChangeParticipantsDrawerOpen(false)}
                    >
                      Cancel
                    </DesktopParticipantsCancel>
                    <ParticipantsApplyButton
                      type="button"
                      onClick={handleChangeParticipantsApply}
                      style={{ margin: 0, flex: 1 }}
                    >
                      Apply
                    </ParticipantsApplyButton>
                  </DesktopParticipantsActions>
                </DesktopParticipantsModalCard>
              </DesktopParticipantsModalOverlay>
            )}
          </AnimatePresence>
        )}
    </PageWrapper>
  );
}