"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { bookingService } from "@/services/apiService";
import { saveBookingSuccessPayload } from "@/lib/bookingSuccessStorage";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 30000;

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 120px 24px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Card = styled.div`
  max-width: 440px;
  width: 100%;
  padding: 32px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: #111827;
`;

const Message = styled.p`
  margin: 0 0 24px 0;
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.5;
`;

const LinkButton = styled(Link)`
  display: inline-block;
  padding: 10px 20px;
  background: #ff385c;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;

  &:hover {
    background: #e31c5f;
    color: white;
  }
`;

const ErrorMessage = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  color: #dc2626;
`;

export default function BookingStatusClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | failed | no_slug | timeout
  const [errorMessage, setErrorMessage] = useState(null);
  const hasStartedPollingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const paymentIntent = searchParams.get("payment_intent");
    const clientSecret = searchParams.get("payment_intent_client_secret");
    const redirectStatus = searchParams.get("redirect_status");

    if (!paymentIntent || !clientSecret) {
      setStatus("failed");
      setErrorMessage("Invalid return URL. Missing payment information.");
      return;
    }

    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      setStatus("no_slug");
      setErrorMessage("Session expired. Please start your booking again.");
      return;
    }

    let state;
    try {
      state = JSON.parse(raw);
    } catch {
      setStatus("failed");
      setErrorMessage("Invalid session. Please try again from the class page.");
      return;
    }

    const slug = state?.classSlug;
    if (!slug) {
      setStatus("no_slug");
      setErrorMessage("Session expired. Please start your booking again.");
      return;
    }

    if (redirectStatus === "failed") {
      setStatus("failed");
      setErrorMessage("Payment was not completed. You can try again from the class page.");
      return;
    }

    if (redirectStatus !== "succeeded") {
      setStatus("failed");
      setErrorMessage("Payment status could not be determined. Please check your bookings or try again.");
      return;
    }

    if (hasStartedPollingRef.current) return;
    hasStartedPollingRef.current = true;

    let cancelled = false;
    const startedAt = Date.now();
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setStatus("timeout");
        setErrorMessage(
          "Confirmation is taking longer than expected. Check your email for a receipt, or visit My Bookings if you have an account.",
        );
        return;
      }

      attempts += 1;
      try {
        const result = await bookingService.bookingStatusPolling(
          paymentIntent,
          clientSecret,
        );

        if (cancelled) return;

        if (!result.success) {
          if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
            setStatus("timeout");
            setErrorMessage(
              "Confirmation is taking longer than expected. Check your email for a receipt, or visit My Bookings if you have an account.",
            );
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        const data = result.data;
        if (data?.status === "confirmed" && data?.booking_id) {
          const rawDetails =
            data.participant_details ??
            state.bookingData?.participant_details ??
            [];
          const count = state.bookingData?.participants ?? 1;
          const participant_details = Array.isArray(rawDetails)
            ? Array.from(
                { length: Math.max(rawDetails.length, count) },
                (_, i) => ({
                  name:
                    rawDetails[i]?.name != null
                      ? String(rawDetails[i].name).trim() || "Guest"
                      : "Guest",
                }),
              )
            : Array.from({ length: count }, () => ({ name: "Guest" }));
          const bookingDataWithParticipants = {
            ...state.bookingData,
            participant_details,
          };
          const classDataWithContact = {
            ...state.classData,
            ...(data.business_contact_email != null && {
              student_contact_email: data.business_contact_email,
            }),
            ...(data.business_contact_phone != null && {
              student_contact_phone: data.business_contact_phone,
            }),
          };
          const successPayload = {
            bookingId: data.booking_id,
            user_facing_reference: data.user_facing_reference,
            booking_group_id: data.booking_group_id,
            participant_details,
            payment_intent_id: paymentIntent,
            client_secret: clientSecret,
            bookingData: bookingDataWithParticipants,
            classData: classDataWithContact,
          };
          saveBookingSuccessPayload(successPayload);
          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
          router.replace(`/classes/${slug}/checkout/success`);
          return;
        }

        if (data?.status === "payment_failed") {
          setStatus("failed");
          setErrorMessage(
            data?.failure_message || "Payment failed. Please try again.",
          );
          return;
        }

        if (
          ["pending_webhook", "processing", "pending"].includes(data?.status) &&
          Date.now() - startedAt < POLL_TIMEOUT_MS
        ) {
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setStatus("timeout");
          setErrorMessage(
            "Confirmation is taking longer than expected. Check your email for a receipt, or visit My Bookings if you have an account.",
          );
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.error("[BookingStatus] Error:", err);
        }
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS || attempts >= 10) {
          setStatus("timeout");
          setErrorMessage(
            "Confirmation is taking longer than expected. Check your email for a receipt, or visit My Bookings if you have an account.",
          );
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS + attempts * 500);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <PageWrapper>
        <Card>
          <Title>Confirming your booking</Title>
          <Message>Please wait…</Message>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Card>
        <Title>
          {status === "timeout"
            ? "Still confirming"
            : status === "no_slug"
              ? "Session expired"
              : "Booking issue"}
        </Title>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <Message>
          {status === "timeout" ? (
            <>
              Your payment may have gone through. Check your email for confirmation
              before trying to book again.
            </>
          ) : status === "no_slug" ? (
            <>Start again from the class page or explore more experiences.</>
          ) : (
            <>
              You can try booking again from the class page or contact support if
              the charge appeared on your card.
            </>
          )}
        </Message>
        <LinkButton href="/explore">Explore experiences</LinkButton>
      </Card>
    </PageWrapper>
  );
}
