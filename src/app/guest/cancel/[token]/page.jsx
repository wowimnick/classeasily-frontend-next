// app/guest/cancel/[token]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Result, Typography, message } from "antd";
import { Calendar, Clock, Users, AlertTriangle, Info } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { guestBookingService } from "@/services/apiService";
import { getCancellationPolicyText } from "@/app/classes/_components/steps/utils";
import { theme } from "@/components/theme";
import SharedMainClientHeader from "@/components/layout/SharedMainClientHeader";
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  ssr: false,
});
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const GradientCanvas = dynamic(() => import("@/components/Gradient"), {
  ssr: false,
});

// Styled components remain the same...
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  isolation: isolate;
`;

const MainContentContainer = styled.main`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8rem 2rem;
  min-height: 100vh;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 6rem 1rem;
  }
`;

const ContentCard = styled(motion.div)`
  width: 100%;
  max-width: 550px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.1);
  text-align: center;

  @media (max-width: 576px) {
    padding: 32px 24px;
  }
`;

const GradientWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.5;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 12px;
  text-align: left;
  margin: 24px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f0f0f0;

  svg {
    flex-shrink: 0;
    color: ${theme.token.colorPrimary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  flex-wrap: wrap;
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 200px;
`;

const formatDate = (dateStr) => {
  if (!dateStr) return "Not available";
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(navigator.language, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

function CancellationContent() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [status, setStatus] = useState("loading");
  const [booking, setBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [policyText, setPolicyText] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMessage("No cancellation token found in the link.");
      setStatus("error");
      return;
    }
    const fetchBookingDetails = async () => {
      const result = await guestBookingService.getBookingDetails(token);
      if (result.success) {
        const bookingData = result.data;
        setBooking(bookingData);

        const startDateTime = `${bookingData.date}T${bookingData.time}`;
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const text = getCancellationPolicyText(
          bookingData.cancellation_policy,
          bookingData.cancellation_refund_percentage,
          bookingData.cancellation_custom_hours,
          startDateTime,
          userTz,
          bookingData.business_timezone
        );
        setPolicyText(text);

        setStatus("confirm");
      } else {
        setErrorMessage(result.error);
        setStatus("error");
      }
    };
    fetchBookingDetails();
  }, [token]);

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    message.loading({ content: "Processing cancellation...", key: "cancel" });
    const result = await guestBookingService.cancelBooking(token);
    if (result.success) {
      message.success({
        content: "Your booking has been successfully cancelled.",
        key: "cancel",
        duration: 4,
      });
      setStatus("success");
    } else {
      message.error({
        content: `Cancellation failed: ${result.error}`,
        key: "cancel",
        duration: 5,
      });
      setErrorMessage(result.error);
      setStatus("error");
    }
    setIsCancelling(false);
  };

  const renderContent = () => {
    switch (status) {
      case "confirm":
        return (
          <>
            <AlertTriangle
              size={48}
              style={{ marginBottom: 24, color: "#faad14" }}
            />
            <Typography.Title level={3} style={{ color: "black" }}>
              Confirm Cancellation
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Please review your booking details. Are you sure you want to
              permanently cancel?
            </Typography.Paragraph>
            <InfoGrid>
              <InfoRow>
                <Calendar size={20} />
                <Typography.Text strong>{booking.class_name}</Typography.Text>
              </InfoRow>
              <InfoRow>
                <Clock size={20} />
                <Typography.Text>
                  {formatDate(booking.date)} at {formatTime(booking.time)}
                </Typography.Text>
              </InfoRow>
              <InfoRow>
                <Users size={20} />
                <Typography.Text>
                  {booking.participants} Participant(s)
                </Typography.Text>
              </InfoRow>
            </InfoGrid>
            <Typography.Paragraph style={{ fontSize: "12px", color: "#888" }}>
              <Info
                size={12}
                style={{ marginRight: "4px", verticalAlign: "middle" }}
              />
              {policyText}
            </Typography.Paragraph>
            <ButtonGroup>
              <Button onClick={() => router.push("/")} disabled={isCancelling}>
                No, Keep My Booking
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleConfirmCancel}
                loading={isCancelling}
              >
                Yes, Cancel Booking
              </Button>
            </ButtonGroup>
          </>
        );
      case "success":
        return (
          <Result
            status="success"
            title="Booking Successfully Cancelled"
            subTitle="A confirmation email has been sent to the class provider. Please allow 3-5 business days for any applicable refunds to appear."
            extra={[
              <Button
                type="primary"
                key="home"
                onClick={() => router.push("/")}
              >
                Go to Homepage
              </Button>,
            ]}
          />
        );
      case "error":
        return (
          <Result
            status="error"
            title="Cancellation Failed"
            subTitle={errorMessage}
            extra={[
              <Button
                type="primary"
                key="home"
                onClick={() => router.push("/")}
              >
                Go to Homepage
              </Button>,
            ]}
          />
        );
      default:
        return (
          <LoaderWrapper>
            <GlobalLoaderWithoutInlineStyles />
          </LoaderWrapper>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <ContentCard
        key={status}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </ContentCard>
    </AnimatePresence>
  );
}

export default function GuestCancellationPage() {
  return (
    <PageWrapper>
      <GradientWrapper>
        <GradientCanvas />
      </GradientWrapper>
      <SharedMainClientHeader
        hamburgerColor="#000"
        dropdownButtonColor="#000"
        dropdownButtonHoverColor="#fe2142"
        dropdownButtonOutlineColor="#000"
        logoTitleColor="#fe2142"
      />
      <MainContentContainer>
        <Suspense
          fallback={
            <ContentCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoaderWrapper>
                <GlobalLoaderWithoutInlineStyles />
              </LoaderWrapper>
            </ContentCard>
          }
        >
          <CancellationContent />
        </Suspense>
      </MainContentContainer>
      <Footer />
    </PageWrapper>
  );
}
