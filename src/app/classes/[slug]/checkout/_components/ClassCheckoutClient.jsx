"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { X, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { paymentService } from "@/services/apiService";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService";
import { motion, AnimatePresence } from "framer-motion";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

const ReviewAndPaymentStep = dynamic(
  () => import("@/app/classes/_components/steps/ReviewAndPaymentStep"),
  { loading: () => <div style={{ minHeight: "400px" }} />, ssr: false }
);

const ClientHeader = dynamic(
  () => import("@/components/layout/ClientHeader"),
  { ssr: false, loading: () => null }
);

// --- Modal-style checkout (no header, harder to leave; "Review and continue" bar) ---
const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:rgb(252, 252, 252);
`;

const DesktopHeaderWrap = styled.div`
  display: none;
  @media (min-width: 970px) {
    display: block;
    width: 100%;
    flex-shrink: 0;
  }
`;

const CheckoutModalBar = styled.header`
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  justify-items: center;
  width: 100%;
  min-height: 56px;
  background: transparent;
  box-sizing: border-box;
  @media (min-width: 970px) {
    grid-template-columns: 1fr;
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
  @media (min-width: 970px) {
    display: none;
  }
`;

const BackButtonDesktop = styled.button`
  display: none;
  @media (min-width: 970px) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 40px;
    height: 40px;
    margin-bottom: 16px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
    flex-shrink: 0;
    &:hover {
      color: #374151;
      background: rgba(0, 0, 0, 0.04);
    }
  }
`;
const TitleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-radius: 0 0 20px 20px;
  grid-column: 2;
  justify-self: center;
  @media (min-width: 970px) {
    grid-column: 1;
    width: 100%;
  }
`;
const CheckoutModalTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #222;
  text-align: center;
`;
const TitleMobile = styled(CheckoutModalTitle)`
  display: block;
  @media (min-width: 970px) {
    display: none;
  }
`;
const TitleDesktop = styled(CheckoutModalTitle)`
  display: none;
  @media (min-width: 970px) {
    display: block;
  }
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
  margin: 0 0 12px 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.45;
  text-align: center;

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
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: #e31c5f;
  }

  @media (min-width: 969px) {
    max-width: 320px;
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

  // Load checkout state from sessionStorage (persists across refresh); redirect only if invalid.
  // When restoring, we must await cancel of the previous PaymentIntent so spots are released before
  // the payment step creates a new one (otherwise "not enough spots" race can occur).
  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      router.replace(`/classes/${slug}`);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const state = JSON.parse(raw);
        if (state.classSlug !== slug) {
          router.replace(`/classes/${slug}`);
          return;
        }

        const hasSlots =
          state.bookingData?.selectedSlots?.length > 0 &&
          state.bookingData?.selectedOption;
        if (!hasSlots) {
          router.replace(`/classes/${slug}`);
          return;
        }

        const { paymentIntentId, clientSecret, ...restBookingData } =
          state.bookingData || {};
        // Release the previous session's hold before we render the payment step.
        // Await so spots are freed before createPaymentIntent runs (avoids "not enough spots" race).
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
            .catch(() => !cancelled && router.replace(`/classes/${slug}`));
        }
      } catch {
        if (!cancelled) router.replace(`/classes/${slug}`);
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
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [bookingData?.paymentIntentId]);

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
            if (process.env.NODE_ENV === "development") {
              console.warn("[Checkout] Persist booking data failed:", e);
            }
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
      paymentService
        .cancelPaymentIntent(intentId)
        .catch((e) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("[Checkout] Cancel intent on close failed:", e);
          }
        });
    }
    clearIntentFromStorage();
    router.replace(`/classes/${slug}`);
  };

  if (loading || !bookingData || !classData) {
    return (
      <PageWrapper>
        <DesktopHeaderWrap>
          <ClientHeader showOptionsWrapper={false} />
        </DesktopHeaderWrap>
        <CheckoutModalBar>
          <CloseButton type="button" onClick={() => router.replace(`/classes/${slug}`)} aria-label="Close">
            <X size={20} />
          </CloseButton>
          <TitleCard>
            <TitleMobile>Review and continue</TitleMobile>
            <TitleDesktop>Review and continue</TitleDesktop>
          </TitleCard>
        </CheckoutModalBar>
        <MainContainer>
          <BackButtonDesktop
            type="button"
            onClick={() => router.replace(`/classes/${slug}`)}
            aria-label="Back to experience"
          >
            <ArrowLeft size={22} />
          </BackButtonDesktop>
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            Loading checkout…
          </div>
        </MainContainer>
      </PageWrapper>
    );
  }

  const canSubmit =
    paymentAction?.canSubmit !== false && paymentAction?.handleSubmit;

  /* Show Confirm and Pay footer only when form is valid / Stripe ready (or free); hide when payment button is in card drawer */
  const showConfirmFooter =
    paymentAction &&
    canSubmit &&
    (paymentAction.showFooterButton !== false);

  return (
    <PageWrapper>
      <DesktopHeaderWrap>
        <ClientHeader showOptionsWrapper={false} />
      </DesktopHeaderWrap>
      <CheckoutModalBar>
        <CloseButton
          type="button"
          onClick={handleCloseCheckout}
          aria-label="Close and return to experience"
        >
          <X size={20} />
        </CloseButton>
        <TitleCard>
          <TitleMobile>Review and continue</TitleMobile>
          <TitleDesktop>Review and continue</TitleDesktop>
        </TitleCard>
      </CheckoutModalBar>
      <MainContainer>
          <BackButtonDesktop
            type="button"
            onClick={handleCloseCheckout}
            aria-label="Back to experience"
          >
            <ArrowLeft size={22} />
          </BackButtonDesktop>
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
            confirmFooter={
              showConfirmFooter ? (
                <>
                  <TermsText>
                    By selecting the button below, I agree to the{" "}
                    <Link href="/terms-of-service">Host Terms</Link>,{" "}
                    <Link href="/fees">Payment Terms of Service</Link>, and{" "}
                    <Link href="/privacy-policy">Privacy Policy</Link>.
                  </TermsText>
                  <ConfirmButton
                    type="button"
                    disabled={paymentAction.loading}
                    onClick={() => paymentAction.handleSubmit?.()}
                    whileTap={{ scale: 0.98 }}
                  >
                    {paymentAction.loading ? "Processing…" : "Confirm and Pay"}
                  </ConfirmButton>
                </>
              ) : null
            }
          />

          <MobileFooterWrap>
            <AnimatePresence>
              {showConfirmFooter && (
                <CheckoutFooter
                  initial={{ y: 32, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 300 }}
                >
                  <TermsText>
                    By selecting the button below, I agree to the{" "}
                    <Link href="/terms-of-service">Host Terms</Link>,{" "}
                    <Link href="/fees">Payment Terms of Service</Link>, and{" "}
                    <Link href="/privacy-policy">Privacy Policy</Link>.
                  </TermsText>
                  <ConfirmButton
                    type="button"
                    disabled={paymentAction.loading}
                    onClick={() => paymentAction.handleSubmit?.()}
                    whileTap={{ scale: 0.98 }}
                  >
                    {paymentAction.loading ? "Processing…" : "Confirm and Pay"}
                  </ConfirmButton>
                </CheckoutFooter>
              )}
            </AnimatePresence>
          </MobileFooterWrap>
        </MainContainer>
    </PageWrapper>
  );
}
