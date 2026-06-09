import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Package,
  AlertCircle,
  Mail,
  MapPin,
  Phone,
  Shield,
  ChevronDown,
} from "lucide-react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { getDurationText, getCancellationPolicyText } from "./utils";
import { isValid, addMinutes, format as dateFnsFormat } from "date-fns";
import {
  formatBusinessLocalToUserDisplay,
  formatNaiveDate,
  formatTimeRangeForDisplay,
} from "@/services/utils";
import { createEvent } from "ics";
import { saveAs } from "file-saver";
import { fromZonedTime } from "date-fns-tz";
import { bookingService } from "@/services/apiService";
import {
  captureBookingPurchase,
  isNumericBookingId,
} from "@/lib/bookingAnalytics";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 24px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    padding: 0 16px 20px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const StatusIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${(props) => (props.$failed ? "#fee2e2" : "transparent")};
  color: ${(props) => (props.$failed ? "#ef4444" : "inherit")};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  svg {
    width: 32px;
    height: 32px;
  }
`;

const SuccessEmoji = styled.div`
  font-size: 48px;
  line-height: 1;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0 0 4px 0;
  color: #111827;
  font-size: 22px;
  font-weight: 800;

  @media (max-width: 640px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  max-width: 400px;
`;

const SkeletonPlaceholder = styled.div`
  display: inline-block;
  height: 18px;
  width: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite linear;
  border-radius: 4px;
  vertical-align: middle;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

/* Grouped blocks (mobile-summary style) */
const SummaryBlock = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 480px;
  text-align: left;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

const SummaryBlockLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  color: #9ca3af;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const SummaryBlockValue = styled.div`
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  line-height: 1.4;
`;

const SummaryMetaItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  &:not(:last-child) {
    margin-bottom: 12px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
  }
  .icon-box svg {
    width: 16px;
    height: 16px;
  }
  .text-content {
    display: flex;
    flex-direction: column;
  }
  .text-content .label {
    font-size: 11px;
    text-transform: uppercase;
    color: #9ca3af;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .text-content .value {
    font-size: 14px;
    color: #111827;
    font-weight: 600;
    line-height: 1.4;
  }
`;

const BookingSummary = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  text-align: left;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);

  @media (max-width: 640px) {
    padding: 20px;
  }
`;

const SummaryHeader = styled.div`
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #111827;
    font-weight: 600;
  }
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;

  &:not(:last-child) {
    margin-bottom: 12px;
  }

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 3px;
    color: #9ca3af;
  }
`;

const EquipmentList = styled.ul`
  list-style: disc;
  padding-left: 20px;
  margin: 4px 0 0 0;
  color: #374151;
`;

const ArriveEarlyNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #4b5563;
  padding: 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  width: 100%;
  max-width: 480px;
  margin-bottom: 12px;
  text-align: left;

  .icon-box {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #16a34a;
  }
  .icon-box svg {
    width: 16px;
    height: 16px;
  }
  p {
    margin: 0;
    line-height: 1.5;
  }
`;

const BusinessContactBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  width: 100%;
  max-width: 480px;
  margin-bottom: 12px;
  text-align: left;

  .contact-label {
    font-size: 11px;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  a {
    font-size: 14px;
    color: #0ea5e9;
    font-weight: 500;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .contact-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .contact-row svg {
    width: 16px;
    height: 16px;
    color: #64748b;
    flex-shrink: 0;
  }
`;

/* Email-style ticket card (matches booking_confirmation_user.html) */
const TicketCard = styled.div`
  width: 100%;
  max-width: 480px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  margin-bottom: 20px;
`;

/* Hero = reference (main focus) */
const TicketHero = styled.div`
  background-color: #f5f5f7;
  padding: 20px 20px 18px;
  border-bottom: 1px solid #e5e7eb;

  .hero-label {
    font-size: 11px;
    color: #86868b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .hero-ref {
    font-size: 24px;
    font-weight: 700;
    color: #1d1d1f;
    font-family: ui-monospace, monospace;
    letter-spacing: 0.02em;
  }
`;

/* Compact details body */
const TicketBody = styled.div`
  padding: 14px 20px 18px;
  text-align: left;

  .ticket-row {
    margin-bottom: 10px;
  }
  .ticket-row:last-child {
    margin-bottom: 0;
  }
  .ticket-meta {
    font-size: 11px;
    color: #86868b;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin-bottom: 2px;
  }
  .ticket-value {
    font-size: 13px;
    color: #1d1d1f;
    font-weight: 500;
  }
  .ticket-value.mono {
    font-family: ui-monospace, monospace;
  }
  .ticket-inline {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
  }
  .arrive-note {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
    margin: 0 0 12px 0;
  }
  .booking-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #d1d5db;
  }
  .booking-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-top: 6px;
  }
  .booking-pill {
    display: inline-block;
    background: #f5f5f7;
    border-radius: 99px;
    padding: 3px 10px;
    font-size: 12px;
    color: #1d1d1f;
  }
`;

/* Attached accordion stack (FAQ-style, like BusinessWelcomePage) */
const AccordionStack = styled.div`
  width: 100%;
  max-width: 480px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  text-align: left;
`;

const AccordionItem = styled.div`
  border-bottom: 1px solid #e5e7eb;
  &:last-child {
    border-bottom: none;
  }
`;

const AccordionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  background: #f9fafb;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
  }
  .accordion-icon {
    color: #6b7280;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  .accordion-icon.open {
    transform: rotate(180deg);
  }
`;

const AccordionContent = styled(motion.div)`
  overflow: hidden;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  background: #ffffff;
  text-align: left;

  .inner {
    padding: 14px 18px 18px;
    border-top: 1px solid #e5e7eb;
    text-align: left;
  }
  .inner ul {
    margin: 4px 0 0 0;
    padding-left: 20px;
  }
  .inner a {
    color: #0ea5e9;
    text-decoration: none;
  }
  .inner a:hover {
    text-decoration: underline;
  }
  .inner strong {
    font-weight: 700;
  }
  .contact-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .contact-row:last-child {
    margin-bottom: 0;
  }
`;

const AddToCalendar = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ff385c;
  color: white;
  border: none;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  margin-top: 24px;
  transition: all 0.2s;
  width: 100%;
  width: fit-content;

  &:hover {
    background: #e31c5f;
    box-shadow: 0 4px 12px rgba(227, 28, 95, 0.2);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmailConfirmationNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 16px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  justify-content: center;

  svg {
    color: #9ca3af;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const RetryButton = styled.button`
  background: #ff385c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 16px;

  &:hover {
    background: #e31c5f;
  }
`;

const getUTCDateFromBusinessLocal = (
  naiveDateStr,
  naiveTimeStr,
  businessTimeZoneStr
) => {
  if (!naiveDateStr || !naiveTimeStr || !businessTimeZoneStr) return null;

  try {
    const timeParts = naiveTimeStr.split(":");
    const formattedTimeStr = `${timeParts[0]}:${timeParts[1] || "00"}:${
      timeParts[2] || "00"
    }`;
    const dateTimeInBusinessTZStr = `${naiveDateStr}T${formattedTimeStr}`;
    const utcDate = fromZonedTime(dateTimeInBusinessTZStr, businessTimeZoneStr);
    return isValid(utcDate) ? utcDate : null;
  } catch (error) {
    console.error("Error creating UTC date:", error);
    return null;
  }
};

const ConfirmationStep = ({
  bookingData,
  classData,
  userTimeZone,
  businessTimeZone,
  paymentIntentId,
  clientSecret,
  bookingId: propBookingId,
  reference: propReference,
  onBookingDetailsFetched,
  onRetryBooking,
}) => {
  const [fetchedReference, setFetchedReference] = useState(null);
  const [fetchedBookingId, setFetchedBookingId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState(null);
  const [bookingFailed, setBookingFailed] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({ equipment: false, cancellation: false, contact: false });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const actualBookingId = propBookingId || bookingData.bookingId || fetchedBookingId;
  const displayReference =
    propReference || fetchedReference || bookingData.user_facing_reference;

  /* PostHog fires as soon as payment intent / reference / booking id is known (no wait for numeric id).
     Meta client pixel still prefers numeric order_id for CAPI dedup when paymentIntentId is present. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Payment may have succeeded via Stripe even when booking confirmation polling failed.
    if (bookingFailed && !paymentIntentId) return;
    captureBookingPurchase({
      bookingData,
      classData,
      bookingId: actualBookingId,
      reference: displayReference,
      paymentIntentId,
    });
  }, [
    bookingFailed,
    actualBookingId,
    displayReference,
    paymentIntentId,
    bookingData,
    classData,
  ]);

  const pollForBookingReference = useCallback(async () => {
    if (!paymentIntentId || isNumericBookingId(actualBookingId)) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setPollingError(null);
    setBookingFailed(false);
    let attempts = 0;
    const maxAttempts = 12;
    const pollInterval = 3000;

    const attemptFetch = async () => {
      attempts++;
      try {
        const result = await bookingService.bookingStatusPolling(
          paymentIntentId,
          clientSecret
        );
        if (result.success) {
          const data = result.data;
          if (
            data.status === "confirmed" &&
            (data.user_facing_reference || data.booking_id != null)
          ) {
            if (data.user_facing_reference) {
              setFetchedReference(data.user_facing_reference);
            }
            if (data.booking_id != null) setFetchedBookingId(data.booking_id);
            if (onBookingDetailsFetched) onBookingDetailsFetched(data);
            setIsPolling(false);
          } else if (data.status === "payment_failed") {
            setBookingFailed(true);
            setPollingError(
              data.failure_message || "Your payment could not be processed."
            );
            setIsPolling(false);
          } else if (
            ["pending_webhook", "processing"].includes(data.status) &&
            attempts < maxAttempts
          ) {
            setTimeout(attemptFetch, pollInterval);
          } else if (["pending_webhook", "processing"].includes(data.status)) {
            // Payment may have succeeded; webhook is slow — do not block purchase analytics.
            setPollingError(
              data.message ||
                "Your payment was received. Booking confirmation is still processing — check your email shortly.",
            );
            setIsPolling(false);
          } else {
            setBookingFailed(true);
            setPollingError(
              data.message ||
                "Booking could not be confirmed in time. Please try again or contact support."
            );
            setIsPolling(false);
          }
        } else if (!paymentIntentId) {
          setBookingFailed(true);
          setPollingError(
            result.error || "An error occurred while confirming your booking."
          );
          setIsPolling(false);
        } else {
          setPollingError(
            result.error ||
              "Your payment was received. Booking confirmation is still processing — check your email shortly.",
          );
          setIsPolling(false);
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(attemptFetch, pollInterval + attempts * 500);
        } else if (!paymentIntentId) {
          setBookingFailed(true);
          setPollingError(
            "A network error occurred. Please check your connection or contact support."
          );
          setIsPolling(false);
        } else {
          setPollingError(
            "Your payment was received. We could not confirm the booking in the browser — check your email shortly.",
          );
          setIsPolling(false);
        }
      }
    };

    attemptFetch();
  }, [paymentIntentId, actualBookingId, clientSecret, onBookingDetailsFetched]);

  useEffect(() => {
    if (paymentIntentId && !isNumericBookingId(actualBookingId)) {
      pollForBookingReference();
    }
  }, [paymentIntentId, actualBookingId, pollForBookingReference]);

  const handleRetry = () => {
    if (onRetryBooking) onRetryBooking();
    else window.location.reload();
  };

  const handleAddToCalendar = () => {
    const selectedSlot = bookingData.selectedSlots?.[0];
    if (!selectedSlot || !businessTimeZone) return;

    const {
      date: naiveStartDate,
      time: naiveTime,
      duration,
      isCourse,
      end_date: naiveCourseEndDate,
      days,
    } = selectedSlot;

    const startUTC = getUTCDateFromBusinessLocal(
      naiveStartDate,
      naiveTime,
      businessTimeZone
    );
    if (!startUTC) {
      alert("Could not generate calendar event due to invalid date/time.");
      return;
    }

    const formatToICSDateArray = (dateObj) => [
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth() + 1,
      dateObj.getUTCDate(),
      dateObj.getUTCHours(),
      dateObj.getUTCMinutes(),
    ];

    const eventDetails = {
      title: classData?.title || "Booked Class",
      description: `Your booking for ${classData?.title} with ${
        classData?.business_name
      }.\nRef: ${displayReference || "Pending..."}`,
      location: classData?.location || "",
      start: formatToICSDateArray(startUTC),
      startOutputType: "utc",
      duration: { minutes: duration },
    };

    if (isCourse && days?.length > 0 && naiveCourseEndDate) {
      const dayMap = {
        Sun: "SU",
        Mon: "MO",
        Tue: "TU",
        Wed: "WE",
        Thu: "TH",
        Fri: "FR",
        Sat: "SA",
      };
      const byDay = days.map((d) => dayMap[d]).filter(Boolean).join(",");

      const untilDate = new Date(`${naiveCourseEndDate}T23:59:59Z`);
      const untilDateFormatted = dateFnsFormat(
        untilDate,
        "yyyyMMdd'T'HHmmss'Z'"
      );

      eventDetails.recurrenceRule = `FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilDateFormatted}`;
    } else {
      const endUTC = addMinutes(startUTC, duration);
      eventDetails.end = formatToICSDateArray(endUTC);
      delete eventDetails.duration;
    }

    createEvent(eventDetails, (error, value) => {
      if (error) {
        console.error("Error creating ICS event:", error);
        return;
      }
      saveAs(
        new Blob([value], { type: "text/calendar;charset=utf-8" }),
        `${classData?.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_booking.ics`
      );
    });
  };

  const selectedSlot = bookingData.selectedSlots?.[0];

  const effectiveUserTimeZone =
    userTimeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Toronto");

  const renderDateAndTimeBlock = () => {
    if (!selectedSlot) return null;
    const { date, time, duration, isCourse, end_date, days } = selectedSlot;

    if (isCourse) {
      return (
        <SummaryBlock>
          <SummaryMetaItem>
            <div className="icon-box"><CalendarIcon /></div>
            <div className="text-content">
              <span className="label">Course dates</span>
              <span className="value">
                {formatNaiveDate(date, "MMM d, yyyy")} – {formatNaiveDate(end_date, "MMM d, yyyy")}
              </span>
            </div>
          </SummaryMetaItem>
          <SummaryMetaItem>
            <div className="icon-box"><Clock /></div>
            <div className="text-content">
              <span className="label">Time</span>
              <span className="value">
                Every {days.join(", ")} at{" "}
                {formatTimeRangeForDisplay(
                  date,
                  time,
                  duration,
                  businessTimeZone,
                  effectiveUserTimeZone
                )}
              </span>
            </div>
          </SummaryMetaItem>
        </SummaryBlock>
      );
    }

    return (
      <SummaryBlock>
        <SummaryMetaItem>
          <div className="icon-box"><CalendarIcon /></div>
          <div className="text-content">
            <span className="label">Date</span>
            <span className="value">
              {formatBusinessLocalToUserDisplay(
                date,
                time,
                businessTimeZone,
                effectiveUserTimeZone,
                { dateTimeFormat: "EEEE, MMMM d, yyyy" }
              )}
            </span>
          </div>
        </SummaryMetaItem>
        <SummaryMetaItem>
          <div className="icon-box"><Clock /></div>
          <div className="text-content">
            <span className="label">Time</span>
            <span className="value">
              {formatTimeRangeForDisplay(
                date,
                time,
                duration,
                businessTimeZone,
                effectiveUserTimeZone
              )} ({getDurationText(duration)})
            </span>
          </div>
        </SummaryMetaItem>
      </SummaryBlock>
    );
  };

  const renderBookingDetails = () => {
    if (!selectedSlot) return null;

    const { date, time, duration, isCourse, end_date, days } = selectedSlot;

    if (isCourse) {
      return (
        <>
          <DetailRow>
            <CalendarIcon />
            <div>
              <strong>Course Dates:</strong>{" "}
              {formatNaiveDate(date, "MMM d, yyyy")} -{" "}
              {formatNaiveDate(end_date, "MMM d, yyyy")}
            </div>
          </DetailRow>
          <DetailRow>
            <Clock />
            <div>
              <strong>Schedule:</strong> Every {days.join(", ")} at{" "}
              {formatTimeRangeForDisplay(
                date,
                time,
                duration,
                businessTimeZone,
                effectiveUserTimeZone
              )}
            </div>
          </DetailRow>
        </>
      );
    }

    return (
      <>
        <DetailRow>
          <CalendarIcon />
          <div>
            <strong>Date:</strong>{" "}
            {formatBusinessLocalToUserDisplay(
              date,
              time,
              businessTimeZone,
              effectiveUserTimeZone,
              { dateTimeFormat: "MMMM d, yyyy" }
            )}
          </div>
        </DetailRow>
        <DetailRow>
          <Clock />
          <div>
            <strong>Time:</strong>{" "}
            {formatBusinessLocalToUserDisplay(
              date,
              time,
              businessTimeZone,
              effectiveUserTimeZone,
              { timeFormat: "p" }
            )}
          </div>
        </DetailRow>
        <DetailRow>
          <Clock />
          <div>
            <strong>Duration:</strong> {getDurationText(duration)}
          </div>
        </DetailRow>
      </>
    );
  };

  const renderParticipantInfo = () => {
    const { participants, participant_details } = bookingData;
    const count = (participants ?? (Array.isArray(participant_details) ? participant_details.length : 0)) || 1;
    if (!count) return null;
    return (
      <SummaryMetaItem>
        <div className="icon-box"><Users /></div>
        <div className="text-content">
          <span className="label">Participants</span>
          <span className="value">{count} Participants</span>
        </div>
      </SummaryMetaItem>
    );
  };

  const renderEquipmentInfo = () => {
    const equipment = bookingData.selectedOption?.equipment;
    const equipmentStr =
      typeof equipment === "string"
        ? equipment.trim()
        : Array.isArray(equipment)
          ? equipment.join("\n").trim()
          : "";
    if (!equipmentStr) return null;

    return (
      <SummaryMetaItem>
        <div className="icon-box"><Package /></div>
        <div className="text-content">
          <span className="label">Note from host</span>
          <span className="value" style={{ whiteSpace: "pre-line" }}>
            {equipmentStr}
          </span>
        </div>
      </SummaryMetaItem>
    );
  };

  const renderArriveEarlyNote = () => (
    <ArriveEarlyNote>
      <div className="icon-box"><Info /></div>
      <p>
        <strong>Pro tip:</strong> Arrive a few minutes early and check in at the venue. Questions before the big day? Reach out to the business below.
      </p>
    </ArriveEarlyNote>
  );

  const renderCancellationPolicy = () => {
    const option = bookingData.selectedOption;
    const policyKey = option?.cancellationPolicy;
    if (!policyKey) return null;
    const classStartDateTime = selectedSlot?.date && selectedSlot?.time
      ? `${selectedSlot.date}T${selectedSlot.time}`
      : null;
    const text = getCancellationPolicyText(
      policyKey,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      classStartDateTime,
      effectiveUserTimeZone,
      businessTimeZone,
    );
    if (!text) return null;
    return (
      <CancellationPolicyBlock>
        <div className="icon-box"><Shield /></div>
        <p><strong>The fine print:</strong> {text}</p>
      </CancellationPolicyBlock>
    );
  };

  const renderBusinessContact = () => {
    const email =
      classData?.student_contact_email ??
      classData?.studentContactEmail ??
      classData?.business_contact_email ??
      classData?.businessContactEmail;
    const phone =
      classData?.student_contact_phone ??
      classData?.studentContactPhone ??
      classData?.business_contact_phone ??
      classData?.businessContactPhone;
    const businessName = classData?.business_name || "the business";

    if (!email && !phone) return null;

    return (
      <BusinessContactBlock>
        <div className="contact-label">Questions? Contact {businessName}</div>
        {email && (
          <div className="contact-row">
            <Mail size={16} />
            <a href={`mailto:${email}`}>{email}</a>
          </div>
        )}
        {phone && (
          <div className="contact-row">
            <Phone size={16} />
            <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
          </div>
        )}
      </BusinessContactBlock>
    );
  };

  return (
    <ConfirmationContainer>
      <Header>
        {bookingFailed ? (
          <StatusIcon $failed>
            <AlertCircle />
          </StatusIcon>
        ) : (
          <SuccessEmoji aria-hidden>🎉</SuccessEmoji>
        )}
        <Title>{bookingFailed ? "Booking Failed" : "You're in!"}</Title>
        <Subtitle>
          {bookingFailed
            ? pollingError || "We were unable to complete your booking."
            : "Your spot's saved. We'll see you there—don't forget to show up."}
        </Subtitle>
      </Header>

      {bookingFailed ? (
        <RetryButton onClick={handleRetry}>Try Booking Again</RetryButton>
      ) : (
        <>
          {/* Ticket card: reference as hero, compact details below */}
          <TicketCard>
            <TicketHero>
              <div className="hero-label">Booking reference</div>
              <div className="hero-ref">
                {isPolling && !displayReference ? (
                  <SkeletonPlaceholder />
                ) : (
                  displayReference || (actualBookingId ? "Confirmed" : "Processing...")
                )}
              </div>
            </TicketHero>
            <TicketBody>
              <div className="ticket-inline">
                {classData?.title || bookingData.selectedOption?.classId?.title || "Class Title"}
                {classData?.business_name && (
                  <> · {classData.business_name}</>
                )}
              </div>
              {selectedSlot && (
                <div className="ticket-inline">
                  {selectedSlot.isCourse
                    ? `${formatNaiveDate(selectedSlot.date, "MMM d")} – ${formatNaiveDate(selectedSlot.end_date, "MMM d, yyyy")} · Every ${selectedSlot.days?.join(", ")} at ${formatTimeRangeForDisplay(selectedSlot.date, selectedSlot.time, selectedSlot.duration, businessTimeZone, effectiveUserTimeZone)}`
                    : `${formatNaiveDate(selectedSlot.date, "EEEE, MMM d")} · ${formatTimeRangeForDisplay(selectedSlot.date, selectedSlot.time, selectedSlot.duration, businessTimeZone, effectiveUserTimeZone)}${selectedSlot.duration ? ` (${getDurationText(selectedSlot.duration)})` : ""}`}
                </div>
              )}
              <p className="arrive-note">
                Arrive a few minutes early. Questions? See contact below.
              </p>
              {(() => {
                const count = (bookingData.participants ?? (Array.isArray(bookingData.participant_details) ? bookingData.participant_details.length : 0)) || 1;
                const rawName = (Array.isArray(bookingData.participant_details) && bookingData.participant_details[0]?.name)
                  ? String(bookingData.participant_details[0].name).trim()
                  : "";
                const bookerDisplay = rawName && rawName.toLowerCase() !== "guest" ? rawName : "You";
                if (!count) return null;
                const othersCount = count - 1;
                return (
                  <div className="booking-section">
                    <div className="ticket-meta">Booking</div>
                    <div className="booking-pills">
                      <span className="booking-pill">
                        Booked by {bookerDisplay}
                      </span>
                      {othersCount > 0 ? (
                        <span className="booking-pill">
                          + {othersCount} other{othersCount !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="booking-pill">
                          {count} participant{count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </TicketBody>
          </TicketCard>

          {/* Attached accordions (FAQ-style, animated) */}
          {((() => {
            const eq = bookingData.selectedOption?.equipment;
            const hasEquipment = typeof eq === "string" ? !!eq.trim() : Array.isArray(eq) && eq.length > 0;
            return hasEquipment;
          })() ||
            bookingData.selectedOption?.cancellationPolicy ||
            (classData?.student_contact_email ?? classData?.studentContactEmail ?? classData?.business_contact_email ?? classData?.businessContactEmail) ||
            (classData?.student_contact_phone ?? classData?.studentContactPhone ?? classData?.business_contact_phone ?? classData?.businessContactPhone)) && (
            <AccordionStack>
              {(() => {
                const eq = bookingData.selectedOption?.equipment;
                const hasEquipment = typeof eq === "string" ? !!eq.trim() : Array.isArray(eq) && eq.length > 0;
                if (!hasEquipment) return null;
                const displayText = typeof eq === "string" ? eq.trim() : eq.join("\n");
                return (
                  <AccordionItem>
                    <AccordionButton
                      type="button"
                      onClick={() => toggleAccordion("equipment")}
                      aria-expanded={openAccordions.equipment}
                    >
                      <span><Package size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Note from host</span>
                      <ChevronDown size={20} className={`accordion-icon ${openAccordions.equipment ? "open" : ""}`} />
                    </AccordionButton>
                    <AnimatePresence initial={false}>
                      {openAccordions.equipment && (
                        <AccordionContent
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="inner" style={{ whiteSpace: "pre-line" }}>
                            {displayText}
                          </div>
                        </AccordionContent>
                      )}
                    </AnimatePresence>
                  </AccordionItem>
                );
              })()}

              {(() => {
                const option = bookingData.selectedOption;
                const policyKey = option?.cancellationPolicy;
                if (!policyKey) return null;
                const classStartDateTime = selectedSlot?.date && selectedSlot?.time ? `${selectedSlot.date}T${selectedSlot.time}` : null;
                const text = getCancellationPolicyText(
                  policyKey,
                  option?.cancellationRefundPercentage,
                  option?.cancellationCustomHours,
                  classStartDateTime,
                  effectiveUserTimeZone,
                  businessTimeZone,
                );
                if (!text) return null;
                return (
                  <AccordionItem key="cancellation">
                    <AccordionButton
                      type="button"
                      onClick={() => toggleAccordion("cancellation")}
                      aria-expanded={openAccordions.cancellation}
                    >
                      <span><Shield size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Cancellation policy</span>
                      <ChevronDown size={20} className={`accordion-icon ${openAccordions.cancellation ? "open" : ""}`} />
                    </AccordionButton>
                    <AnimatePresence initial={false}>
                      {openAccordions.cancellation && (
                        <AccordionContent
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="inner">{text}</div>
                        </AccordionContent>
                      )}
                    </AnimatePresence>
                  </AccordionItem>
                );
              })()}

              {(() => {
                const email = classData?.student_contact_email ?? classData?.studentContactEmail ?? classData?.business_contact_email ?? classData?.businessContactEmail;
                const phone = classData?.student_contact_phone ?? classData?.studentContactPhone ?? classData?.business_contact_phone ?? classData?.businessContactPhone;
                const businessName = classData?.business_name || "the business";
                if (!email && !phone) return null;
                return (
                  <AccordionItem key="contact">
                    <AccordionButton
                      type="button"
                      onClick={() => toggleAccordion("contact")}
                      aria-expanded={openAccordions.contact}
                    >
                      <span><Mail size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Contact {businessName}</span>
                      <ChevronDown size={20} className={`accordion-icon ${openAccordions.contact ? "open" : ""}`} />
                    </AccordionButton>
                    <AnimatePresence initial={false}>
                      {openAccordions.contact && (
                        <AccordionContent
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="inner">
                            {email && (
                              <div className="contact-row">
                                <Mail size={16} style={{ flexShrink: 0 }} />
                                <span><strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a></span>
                              </div>
                            )}
                            {phone && (
                              <div className="contact-row">
                                <Phone size={16} style={{ flexShrink: 0 }} />
                                <span><strong>Phone:</strong> <a href={`tel:${(phone || "").replace(/\s/g, "")}`}>{phone}</a></span>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      )}
                    </AnimatePresence>
                  </AccordionItem>
                );
              })()}
            </AccordionStack>
          )}

          <EmailConfirmationNote>
            <Mail />We've dropped the full details in your inbox—no carrier pigeons required.
          </EmailConfirmationNote>

          <AddToCalendar
            onClick={handleAddToCalendar}
            disabled={!selectedSlot || isPolling}
          >
            <CalendarIcon size={16} /> Add to calendar
          </AddToCalendar>
        </>
      )}
    </ConfirmationContainer>
  );
};

export default ConfirmationStep;