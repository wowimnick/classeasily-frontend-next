"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";
import styled from "styled-components";

const ConfirmationStep = dynamic(
  () => import("@/app/classes/_components/steps/ConfirmationStep"),
  { loading: () => <div style={{ minHeight: "300px" }} />, ssr: false }
);

const SUCCESS_STORAGE_KEY = "classeasily_booking_success";

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
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px 60px;

  @media (max-width: 640px) {
    padding: 24px 16px 40px;
  }
`;

export default function ClassCheckoutSuccessClient() {
  const router = useRouter();
  const params = useParams();
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

    const raw = sessionStorage.getItem(SUCCESS_STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      router.replace(`/classes/${slug}`);
      return;
    }

    try {
      const data = JSON.parse(raw);
      if (!data.bookingData || !data.classData) {
        setLoading(false);
        router.replace(`/classes/${slug}`);
        return;
      }
      setSuccessData(data);
    } catch {
      setLoading(false);
      router.replace(`/classes/${slug}`);
      return;
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  const handleRetryBooking = () => {
    sessionStorage.removeItem(SUCCESS_STORAGE_KEY);
    router.push(`/classes/${slug}`);
  };

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
    ...bookingData,
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
          />
        </MainContainer>
      </PageWrapper>
      <FooterSmart />
    </>
  );
}
