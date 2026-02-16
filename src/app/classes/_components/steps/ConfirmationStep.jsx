import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  MapPin,
} from "lucide-react";
import styled, { keyframes, css } from "styled-components";
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

// --- Animations ---

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px 40px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

// The "Golden Ticket" Wrapper
const EventPass = styled.div`
  background: #ffffff;
  width: 100%;
  border-radius: 24px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0,0,0,0.03);
  overflow: hidden;
  position: relative;
  margin-top: 24px;
  text-align: center;
  
  /* decorative top border */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #ff385c, #ff7e5f);
  }
`;

const PassHeader = styled.div`
  padding: 40px 32px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SuccessTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 16px 0 8px;
  letter-spacing: -0.5px;
`;

const SuccessSub = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  max-width: 380px;
  line-height: 1.5;
`;

const Divider = styled.div`
  height: 1px;
  background: #f3f4f6;
  width: 85%;
  margin: 24px auto;
  position: relative;
  
  /* Notches for ticket look */
  &::before, &::after {
    content: '';
    position: absolute;
    top: -10px;
    width: 20px;
    height: 20px;
    background: #fafafa; /* Matches page bg */
    border-radius: 50%;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
  }
  &::before { left: -34px; } /* Adjust based on padding */
  &::after { right: -34px; }
`;

const PassBody = styled.div`
  padding: 0 32px 32px;
  text-align: left;
`;

const ClassTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const VendorName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 6px;

  svg { width: 14px; height: 14px; }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 16px;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  font-weight: 700;
  margin-bottom: 6px;
`;

const InfoValue = styled.span`
  font-size: 15px;
  color: #111827;
  font-weight: 600;
  line-height: 1.4;
`;

const ReferenceBadge = styled.div`
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;

  .label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .code {
    font-family: monospace;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    letter-spacing: 1px;
  }
`;

// Skeleton for the reference code
const Skeleton = styled.div`
  height: 20px;
  width: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

// Secondary Info Section (Plain text, no boxes)
const SecondaryInfo = styled.div`
  width: 100%;
  margin-top: 32px;
  text-align: left;
  padding: 0 12px;
`;

const SecondaryGroup = styled.div`
  margin-bottom: 24px;
  
  h4 {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }
  
  p, li {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
    margin: 0;
  }

  ul {
    padding-left: 18px;
    margin: 0;
  }
  
  a {
    color: #ff385c;
    text-decoration: none;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }
`;

const EmailNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
  padding: 12px 20px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  margin: 24px 0 8px;
  width: fit-content;
  align-self: center;
  margin-left: auto;
  margin-right: auto;
`;

const ActionButton = styled.button`
  background: #111827;
  color: white;
  width: 100%;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;

  &:hover {
    background: #000;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const RetryButton = styled(ActionButton)`
  background: #dc2626;
  &:hover { background: #b91c1c; }
`;

// --- Logic Helpers ---

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

  // --- Logic: Polling ---
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

  // --- Logic: Data Prep ---
  const selectedSlot = bookingData.selectedSlots?.[0];
  const effectiveUserTimeZone =
    userTimeZone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Toronto");

  const { participants, participant_details } = bookingData;
  const participantCount =
    (participants ??
      (Array.isArray(participant_details) ? participant_details.length : 0)) ||
    1;

  // -- Render Helpers --
  const renderTimeInfo = () => {
    if (!selectedSlot) return { date: "N/A", time: "N/A" };
    const { date, time, duration, isCourse, end_date, days } = selectedSlot;

    if (isCourse) {
      return {
        date: `${formatNaiveDate(date, "MMM d")} – ${formatNaiveDate(
          end_date,
          "MMM d, yyyy"
        )}`,
        time: `Every ${days.join(", ")} @ ${formatTimeRangeForDisplay(
          date,
          time,
          duration,
          businessTimeZone,
          effectiveUserTimeZone
        )}`,
      };
    }

    return {
      date: formatBusinessLocalToUserDisplay(
        date,
        time,
        businessTimeZone,
        effectiveUserTimeZone,
        { dateTimeFormat: "EEEE, MMMM d, yyyy" }
      ),
      time: `${formatTimeRangeForDisplay(
        date,
        time,
        duration,
        businessTimeZone,
        effectiveUserTimeZone
      )} (${getDurationText(duration)})`,
    };
  };

  const { date: dateText, time: timeText } = renderTimeInfo();

  // Cancellation
  const renderCancellationText = () => {
    const option = bookingData.selectedOption;
    const policyKey = option?.cancellationPolicy;
    if (!policyKey) return null;
    const classStartDateTime =
      selectedSlot?.date && selectedSlot?.time
        ? `${selectedSlot.date}T${selectedSlot.time}`
        : null;
    return getCancellationPolicyText(
      policyKey,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      classStartDateTime,
      effectiveUserTimeZone,
      businessTimeZone
    );
  };
  const cancellationText = renderCancellationText();

  // Contact
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

  // Equipment
  const equipment = bookingData.selectedOption?.equipment;

  // --- Render ---

  if (bookingFailed) {
    return (
      <Container>
        <EventPass style={{ borderTop: "none" }}>
          <div style={{ padding: "40px" }}>
            <lord-icon
              src="https://cdn.lordicon.com/keaiwgyv.json"
              trigger="loop"
              delay="1000"
              colors="primary:#ef4444,secondary:#fee2e2"
              style={{ width: "80px", height: "80px" }}
            />
            <SuccessTitle style={{ color: "#ef4444" }}>
              Booking Failed
            </SuccessTitle>
            <SuccessSub>
              {pollingError || "We were unable to complete your booking."}
            </SuccessSub>
            <RetryButton onClick={handleRetry} style={{ marginTop: 24 }}>
              <RefreshCw size={18} /> Try Booking Again
            </RetryButton>
          </div>
        </EventPass>
      </Container>
    );
  }

  return (
    <Container>
      <EventPass>
        <PassHeader>
          {/* Animated Success Icon */}
          <lord-icon
            src="https://cdn.lordicon.com/fkaukecx.json"
            trigger="in"
            delay="200"
            state="in-reveal"
            colors="primary:#10b981,secondary:#a7f3d0"
            style={{ width: "80px", height: "80px" }}
          />
          <SuccessTitle>You're in!</SuccessTitle>
          <SuccessSub>
            Your spot is secured. We've sent a confirmation email with all the details.
          </SuccessSub>
        </PassHeader>

        <Divider />

        <PassBody>
          <ClassTitle>
            {classData?.title || bookingData.selectedOption?.classId?.title}
          </ClassTitle>
          
          {(classData?.business_name || classData?.location) && (
            <VendorName>
               <MapPin />
               {[classData?.business_name, classData?.location].filter(Boolean).join(" · ")}
            </VendorName>
          )}

          <InfoGrid>
            <InfoItem>
              <InfoLabel>Date</InfoLabel>
              <InfoValue>{dateText}</InfoValue>
            </InfoItem>

            <InfoItem>
              <InfoLabel>Time</InfoLabel>
              <InfoValue>{timeText}</InfoValue>
            </InfoItem>

            <InfoItem>
              <InfoLabel>Guests</InfoLabel>
              <InfoValue>{participantCount} Person{participantCount > 1 ? 's' : ''}</InfoValue>
            </InfoItem>

            <InfoItem>
              <InfoLabel>Total</InfoLabel>
              <InfoValue>
                 {/* Logic taken from existing props passing context, simplified for display here as 'Paid' or 'Confirmed' if exact price isn't easily prop-drilled without clutter, but assuming Paid */}
                 Confirmed
              </InfoValue>
            </InfoItem>
          </InfoGrid>

          <ReferenceBadge>
            <span className="label">Booking Reference</span>
            {isPolling && !displayReference ? (
              <Skeleton />
            ) : (
              <span className="code">{displayReference || "CONFIRMED"}</span>
            )}
          </ReferenceBadge>

          <ActionButton
            onClick={handleAddToCalendar}
            disabled={!selectedSlot || isPolling}
          >
            <CalendarIcon size={18} /> Add to Calendar
          </ActionButton>
        </PassBody>
      </EventPass>

      <EmailNotice>
        <lord-icon
            src="https://cdn.lordicon.com/tmqaflqo.json"
            trigger="loop"
            delay="2000"
            colors="primary:#15803d"
            style={{ width: "24px", height: "24px" }}
        />
        <span>Check your inbox for the receipt</span>
      </EmailNotice>

      {/* Unified Secondary Details (No boxes, just clean text) */}
      <SecondaryInfo>
        
        {equipment?.length > 0 && (
          <SecondaryGroup>
            <h4>What to bring</h4>
            <ul>
              {equipment.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </SecondaryGroup>
        )}

        {cancellationText && (
          <SecondaryGroup>
            <h4>Cancellation Policy</h4>
            <p>{cancellationText}</p>
          </SecondaryGroup>
        )}

        {(email || phone) && (
          <SecondaryGroup>
            <h4>Need help?</h4>
            <p>
              Contact {classData?.business_name || "the organizer"} at{" "}
              {email && <a href={`mailto:${email}`}>{email}</a>}
              {email && phone && " or "}
              {phone && <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>}
            </p>
          </SecondaryGroup>
        )}
      </SecondaryInfo>
    </Container>
  );
};

export default ConfirmationStep;