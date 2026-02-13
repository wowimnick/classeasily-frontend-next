"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { bookingService } from "@/services/apiService";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";
const SUCCESS_STORAGE_KEY = "classeasily_booking_success";

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
  const [status, setStatus] = useState("loading"); // loading | success | failed | no_slug
  const [errorMessage, setErrorMessage] = useState(null);

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

    (async () => {
      try {
        const result = await bookingService.bookingStatusPolling(
          paymentIntent,
          clientSecret
        );

        if (!result.success) {
          setStatus("failed");
          setErrorMessage(result.error || "Could not confirm booking.");
          return;
        }

        const data = result.data;
        if (data?.status === "confirmed" && data?.booking_id) {
          const successPayload = {
            bookingId: data.booking_id,
            user_facing_reference: data.user_facing_reference,
            booking_group_id: data.booking_group_id,
            participant_details: data.participant_details,
            payment_intent_id: paymentIntent,
            client_secret: clientSecret,
            bookingData: state.bookingData,
            classData: state.classData,
          };
          sessionStorage.setItem(
            SUCCESS_STORAGE_KEY,
            JSON.stringify(successPayload)
          );
          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
          router.replace(`/classes/${slug}/checkout/success`);
          return;
        }

        if (data?.status === "payment_failed") {
          setStatus("failed");
          setErrorMessage(
            data?.failure_message || "Payment failed. Please try again."
          );
          return;
        }

        setStatus("failed");
        setErrorMessage(
          data?.message || "Booking confirmation is still processing. Please check your email or return to the class page.";
        );
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[BookingStatus] Error:", err);
        }
        setStatus("failed");
        setErrorMessage("Something went wrong. Please try again from the class page.");
      }
    })();
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
        <Title>{status === "no_slug" ? "Session expired" : "Booking issue"}</Title>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <Message>
          {status === "no_slug" ? (
            <>Start again from the class page or explore more experiences.</>
          ) : (
            <>You can try booking again from the class page or contact support if the charge appeared on your card.</>
          )}
        </Message>
        <LinkButton href="/explore">Explore experiences</LinkButton>
      </Card>
    </PageWrapper>
  );
}
