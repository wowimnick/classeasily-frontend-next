import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Package,
  AlertCircle,
  Mail,
} from "lucide-react";
import styled, { keyframes } from "styled-components";
import { getDurationText } from "./utils";
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    padding: 24px 16px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const StatusIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${(props) => (props.$failed ? "#fee2e2" : "#dcfce7")};
  color: ${(props) => (props.$failed ? "#ef4444" : "#22c55e")};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  svg {
    width: 32px;
    height: 32px;
  }
`;

const Title = styled.h2`
  margin: 0 0 4px 0;
  color: #111827;
  font-size: 22px;
  font-weight: 600;

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

const BookingReference = styled.div`
  background-color: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #4b5563;
  width: 100%;
  max-width: 400px;

  strong {
    color: #111827;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
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

const ParticipantList = styled.ul`
  list-style: none;
  padding-left: 0;
  margin: 4px 0 0 0;
  li {
    font-size: 14px;
    color: #374151;
    &:not(:last-child) {
      margin-bottom: 4px;
    }
  }
`;

const EquipmentList = styled.ul`
  list-style: disc;
  padding-left: 20px;
  margin: 4px 0 0 0;
  color: #374151;
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
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState(null);
  const [bookingFailed, setBookingFailed] = useState(false);

  const actualBookingId = propBookingId || bookingData.bookingId;
  const displayReference =
    propReference || fetchedReference || bookingData.user_facing_reference;

  const pollForBookingReference = useCallback(async () => {
    if (!paymentIntentId || actualBookingId) {
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
          if (data.status === "confirmed" && data.user_facing_reference) {
            setFetchedReference(data.user_facing_reference);
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
          } else {
            setBookingFailed(true);
            setPollingError(
              data.message ||
                "Booking could not be confirmed in time. Please try again or contact support."
            );
            setIsPolling(false);
          }
        } else {
          setBookingFailed(true);
          setPollingError(
            result.error || "An error occurred while confirming your booking."
          );
          setIsPolling(false);
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(attemptFetch, pollInterval + attempts * 500);
        } else {
          setBookingFailed(true);
          setPollingError(
            "A network error occurred. Please check your connection or contact support."
          );
          setIsPolling(false);
        }
      }
    };

    attemptFetch();
  }, [paymentIntentId, actualBookingId, clientSecret, onBookingDetailsFetched]);

  useEffect(() => {
    if (paymentIntentId && !actualBookingId) {
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

  const renderBookingDetails = () => {
    if (!selectedSlot) return null;

    const { date, time, duration, isCourse, end_date, days } = selectedSlot;
    const effectiveUserTimeZone =
      userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

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

    const list = Array.isArray(participant_details) ? participant_details : [];
    const displayNames = list
      .map((d) => (d && d.name != null ? String(d.name).trim() : null))
      .filter(Boolean);
    const hasNames = displayNames.length > 0;

    return (
      <DetailRow>
        <Users />
        <div>
          <strong>
            {count} Participant{count > 1 ? "s" : ""}
          </strong>
          <ParticipantList>
            {hasNames ? (
              <>
                {displayNames.slice(0, 5).map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
                {count > 5 && <li>...and {count - 5} more</li>}
              </>
            ) : (
              <li>Guest{count > 1 ? "s" : ""}</li>
            )}
          </ParticipantList>
        </div>
      </DetailRow>
    );
  };

  const renderEquipmentInfo = () => {
    const equipment = bookingData.selectedOption?.equipment;
    if (!equipment?.length) return null;

    return (
      <DetailRow>
        <Package />
        <div>
          <strong>Required Equipment</strong>
          <EquipmentList>
            {equipment.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </EquipmentList>
        </div>
      </DetailRow>
    );
  };

  return (
    <ConfirmationContainer>
      <Header>
        <StatusIcon $failed={bookingFailed}>
          {bookingFailed ? <AlertCircle /> : <Check />}
        </StatusIcon>
        <Title>{bookingFailed ? "Booking Failed" : "Booking Confirmed!"}</Title>
        <Subtitle>
          {bookingFailed
            ? pollingError || "We were unable to complete your booking."
            : "Your spot is reserved. We're excited to see you!"}
        </Subtitle>
      </Header>

      {bookingFailed ? (
        <RetryButton onClick={handleRetry}>Try Booking Again</RetryButton>
      ) : (
        <>
          <BookingReference>
            Booking Reference:{" "}
            <strong>
              {isPolling && !displayReference ? (
                <SkeletonPlaceholder />
              ) : (
                displayReference || (actualBookingId ? "Confirmed" : "Processing...")
              )}
            </strong>
          </BookingReference>

          <BookingSummary>
            <SummaryHeader>
              <h3>
                {classData?.title ||
                  bookingData.selectedOption?.classId?.title ||
                  "Class Title"}
              </h3>
            </SummaryHeader>
            {renderBookingDetails()}
            {renderParticipantInfo()}
            {renderEquipmentInfo()}
          </BookingSummary>

          <EmailConfirmationNote>
            <Mail />A confirmation has been sent to your email.
          </EmailConfirmationNote>

          <AddToCalendar
            onClick={handleAddToCalendar}
            disabled={!selectedSlot || isPolling}
          >
            <CalendarIcon size={16} /> Add to Calendar
          </AddToCalendar>
        </>
      )}
    </ConfirmationContainer>
  );
};

export default ConfirmationStep;