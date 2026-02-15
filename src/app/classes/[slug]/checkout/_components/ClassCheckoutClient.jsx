"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { X, ArrowLeft, ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { paymentService } from "@/services/apiService";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService";
import { motion, AnimatePresence } from "framer-motion";
import ClientHeader from "@/components/layout/ClientHeader";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

const ReviewAndPaymentStep = dynamic(
  () => import("@/app/classes/_components/steps/ReviewAndPaymentStep"),
  { loading: () => <div style={{ minHeight: "400px" }} />, ssr: false }
);

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
  @media (min-width: 970px) {
    display: block;
    width: 100%;
  }
`;

/* --- NEW CUSTOM DESKTOP HEADER --- */
const DesktopHeaderBar = styled.header`
  display: none;
  @media (min-width: 970px) {
    display: flex;
    justify-content: center;
    width: 100%;
    border-bottom: 1px solid #e5e7eb;
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
  @media (min-width: 970px) {
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
    padding: 16px 12px 120px;
  }

  @media (max-width: 969px) {
    padding: 16px 12px 220px;
  }
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
  @media (min-width: 969px) {
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

export default function ClassCheckoutClient({ slug, initialClassData }) {
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const [classData, setClassData] = useState(initialClassData || null);
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAction, setPaymentAction] = useState(null);
  const cancelledIntentRef = useRef(false);

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

        const { paymentIntentId, clientSecret, ...restBookingData } =
          state.bookingData || {};
        
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
      const { paymentIntentId, clientSecret, ...rest } = state.bookingData;
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
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [bookingData?.paymentIntentId, clearIntentFromStorage]);

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
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      router.push(`/classes/${slug}/checkout/success`);
    },
    [slug, router, bookingData, classData]
  );

  const handleUpdateBookingData = useCallback(
    (data) => {
      setBookingData((prev) => {
        const next = prev ? { ...prev, ...data } : prev;
        if (
          next &&
          slug &&
          (data.paymentIntentId != null || data.clientSecret != null)
        ) {
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
          <div style={{ padding: "60px 0", textAlign: "center" }}>Loading checkout…</div>
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
          />

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
    </PageWrapper>
  );
}