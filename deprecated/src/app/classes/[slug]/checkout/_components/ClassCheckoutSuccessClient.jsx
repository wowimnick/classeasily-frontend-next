"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";
import styled from "styled-components";
import { bookingService } from "@/services/apiService";
import {
  loadBookingSuccessPayload,
  clearBookingSuccessPayload,
  saveBookingSuccessPayload,
} from "@/lib/bookingSuccessStorage";

const ConfirmationStep = dynamic(
  () => import("@/app/classes/_components/steps/ConfirmationStep"),
  { loading: () => <div style={{ minHeight: "300px" }} />, ssr: false }
);

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    padding-top: 40px;
  }
`;

const MainContainer = styled.div`
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 60px;

  @media (max-width: 640px) {
    padding: 0;
  }
`;

export default function ClassCheckoutSuccessClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const [successData, setSuccessData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!slug) {
      setLoading(false);
      router.replace("/explore");
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      const paymentIntentId = searchParams.get("payment_intent");
      let data = loadBookingSuccessPayload({
        slug,
        paymentIntentId: paymentIntentId || undefined,
      });

      if (
        !data &&
        paymentIntentId &&
        searchParams.get("redirect_status") === "succeeded"
      ) {
        const clientSecret = searchParams.get("payment_intent_client_secret");
        try {
          const result = await bookingService.bookingStatusPolling(
            paymentIntentId,
            clientSecret,
          );
          if (result.success && result.data?.status === "confirmed") {
            data = {
              bookingId: result.data.booking_id,
              user_facing_reference: result.data.user_facing_reference,
              booking_group_id: result.data.booking_group_id,
              participant_details: result.data.participant_details,
              payment_intent_id: paymentIntentId,
              client_secret: clientSecret,
              bookingData: {},
              classData: { slug },
            };
            saveBookingSuccessPayload(data);
          }
        } catch {
          // fall through to redirect
        }
      }

      if (cancelled) return;

      if (
        !data?.bookingId &&
        !data?.user_facing_reference &&
        !data?.payment_intent_id
      ) {
        setLoading(false);
        router.replace(`/classes/${slug}`);
        return;
      }

      if (!data.classData) {
        data = { ...data, classData: { slug } };
      }

      const storedSlug =
        data.classData?.slug ||
        data.classData?.class_slug ||
        data.classSlug;
      if (storedSlug && String(storedSlug) !== String(slug)) {
        setLoading(false);
        router.replace(`/classes/${slug}`);
        return;
      }

      setSuccessData(data);
      setLoading(false);
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [slug, router, searchParams]);

  useEffect(() => {
    if (successData && typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [successData]);

  const handleRetryBooking = () => {
    clearBookingSuccessPayload(slug);
    router.push(`/classes/${slug}`);
  };

  const handleBookingDetailsFetched = useCallback(
    (data) => {
      setSuccessData((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          bookingId: data.booking_id ?? prev.bookingId,
          user_facing_reference:
            data.user_facing_reference ?? prev.user_facing_reference,
          booking_group_id: data.booking_group_id ?? prev.booking_group_id,
          participant_details:
            data.participant_details ?? prev.participant_details,
        };
        saveBookingSuccessPayload(next);
        return next;
      });
    },
    [],
  );

  if (!slug) {
    return (
      <>
        <ExploreHeader showOptionsWrapper={false} />
        <PageWrapper>
          <MainContainer>
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              Redirecting…
            </div>
          </MainContainer>
        </PageWrapper>
      </>
    );
  }

  if (loading || !successData) {
    return (
      <>
        <ExploreHeader showOptionsWrapper={false} />
        <PageWrapper>
          <MainContainer>
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              Loading…
            </div>
          </MainContainer>
        </PageWrapper>
      </>
    );
  }

  const {
    bookingId,
    user_facing_reference,
    booking_group_id,
    participant_details,
    payment_intent_id,
    client_secret,
    bookingData,
    classData,
  } = successData;

  const mergedBookingData = {
    ...(bookingData || {}),
    bookingId,
    user_facing_reference,
    booking_group_id,
    participant_details: participant_details || bookingData?.participant_details,
  };

  const businessTimeZone = classData?.business_timezone || "Etc/UTC";
  const userTimeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Toronto";

  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <PageWrapper>
        <MainContainer>
          <ConfirmationStep
            bookingData={mergedBookingData}
            classData={classData}
            userTimeZone={userTimeZone}
            businessTimeZone={businessTimeZone}
            paymentIntentId={payment_intent_id}
            clientSecret={client_secret}
            bookingId={bookingId}
            reference={user_facing_reference}
            onRetryBooking={handleRetryBooking}
            onBookingDetailsFetched={handleBookingDetailsFetched}
          />
        </MainContainer>
      </PageWrapper>
      <FooterSmart />
    </>
  );
}
