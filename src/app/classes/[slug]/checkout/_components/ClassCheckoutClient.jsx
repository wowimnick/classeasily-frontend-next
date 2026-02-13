"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { ChevronLeft } from "lucide-react";
import { Divider } from "antd";
import dynamic from "next/dynamic";
import { paymentService } from "@/services/apiService";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";
import { motion } from "framer-motion";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

const ReviewAndPaymentStep = dynamic(
  () => import("@/app/classes/_components/steps/ReviewAndPaymentStep"),
  { loading: () => <div style={{ minHeight: "400px" }} />, ssr: false }
);

// --- Giftcard-style layout (same structure as GiftcardPaymentStep) ---
const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) {
    padding-top: 80px;
  }
`;

const MainContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px 100px;

  @media (max-width: 900px) {
    padding: 20px 16px 80px;
  }
`;

const BackLink = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  margin-bottom: 24px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #222;
  text-decoration: underline;

  &:hover {
    color: #ff385c;
  }
`;

const CheckoutPageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  margin-top: -10px;
`;

const CheckoutFooter = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 100;

  @media (min-width: 969px) {
    position: static;
    border-top: none;
    padding: 24px 0 0;
    margin-top: 24px;
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

  // Load checkout state from sessionStorage (persists across refresh); redirect only if invalid
  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      router.replace(`/classes/${slug}`);
      return;
    }

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

      setBookingData(state.bookingData);
      if (state.classData) {
        setClassData(state.classData);
      } else if (initialClassData) {
        setClassData(initialClassData);
      } else {
        classService
          .fetchClassDetail(slug)
          .then((data) => setClassData(data))
          .catch(() => router.replace(`/classes/${slug}`));
      }
    } catch {
      router.replace(`/classes/${slug}`);
    } finally {
      setLoading(false);
    }
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
      const successPayload = {
        bookingId: dataFromReviewStep.booking_id,
        user_facing_reference: dataFromReviewStep.user_facing_reference,
        booking_group_id: dataFromReviewStep.booking_group_id,
        participant_details: dataFromReviewStep.participant_details,
        payment_intent_id: dataFromReviewStep.payment_intent_id,
        client_secret: dataFromReviewStep.client_secret,
        bookingData,
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

  if (loading || !bookingData || !classData) {
    return (
      <>
        <ExploreHeader showOptionsWrapper={false} />
        <PageWrapper>
          <MainContainer>
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              Loading checkout…
            </div>
          </MainContainer>
        </PageWrapper>
      </>
    );
  }

  const canSubmit =
    paymentAction?.canSubmit !== false && paymentAction?.handleSubmit;

  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <PageWrapper>
        <MainContainer>
          <BackLink
            type="button"
            onClick={() => {
              const intentId = bookingData?.paymentIntentId;
              if (intentId && !cancelledIntentRef.current) {
                paymentService
                  .cancelPaymentIntent(intentId)
                  .catch((e) => {
                    if (process.env.NODE_ENV === "development") {
                      console.warn("[Checkout] Cancel intent on back failed:", e);
                    }
                  });
              }
              clearIntentFromStorage();
              router.push(`/classes/${slug}`);
            }}
            aria-label="Back to experience"
          >
            <ChevronLeft size={18} />
            Back to experience
          </BackLink>

          <CheckoutPageTitle>Confirm and Pay</CheckoutPageTitle>
          <Divider style={{ margin: "0 0 32px 0" }} />

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
          />

          {paymentAction && (
            <CheckoutFooter>
              <ConfirmButton
                type="button"
                disabled={!canSubmit || paymentAction.loading}
                onClick={() => paymentAction.handleSubmit?.()}
                whileTap={{ scale: 0.98 }}
              >
                {paymentAction.loading ? "Processing…" : "Confirm and Pay"}
              </ConfirmButton>
            </CheckoutFooter>
          )}
        </MainContainer>
      </PageWrapper>
      <FooterSmart />
    </>
  );
}
