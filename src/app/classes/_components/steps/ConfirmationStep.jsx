import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { 
  getDurationText, 
  getCancellationPolicyText 
} from "./utils";
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

// --- ANIMATIONS ---
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- STYLED COMPONENTS ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  width: 100%;
  animation: ${slideUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Card = styled.div`
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.08);
  overflow: hidden;
  border: 1px solid #f3f4f6;
  position: relative;
`;

const HeaderSection = styled.div`
  background: ${(props) => (props.$failed ? "#fef2f2" : "#ffffff")};
  padding: 40px 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Place for Lord Icon
const IconWrapper = styled.div`
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const StatusMessage = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  max-width: 400px;
`;

const ReferenceBadge = styled.div`
  margin-top: 24px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 0.5px;

  strong {
    color: #111827;
    font-weight: 700;
    margin-left: 4px;
    font-family: monospace;
    font-size: 14px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 0 32px;
`;

const ContentSection = styled.div`
  padding: 32px;
`;

const ClassTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
`;

const ClassSubtitle = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const GridSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  
  @media (min-width: 500px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.5px;
`;

const Value = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
`;

const SubValue = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
`;

const PolicySection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;

  strong {
    color: #374151;
    font-weight: 600;
  }
  
  a {
    color: #ff385c;
    text-decoration: none;
    font-weight: 600;
    &:hover { text-decoration: underline; }
  }
`;

const FooterActions = styled.div`
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const PrimaryButton = styled.button`
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.2);

  &:hover {
    background: #e31c5f;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(255, 56, 92, 0.3);
  }

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  /* Target the lord-icon inside the button */
  lord-icon {
    width: 24px;
    height: 24px;
  }
`;

const SecondaryAction = styled.button`
  background: none;
  border: none;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;
  &:hover { color: #111827; }
`;

const SkeletonLoader = styled.span`
  display: inline-block;
  width: 100px;
  height: 1em;
  background: #f3f4f6;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

// --- HELPER FUNCTIONS ---

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

  // --- LOGIC ---
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
  const effectiveUserTimeZone =
    userTimeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Toronto");

  // --- RENDER HELPERS ---
  
  const getContactInfo = () => {
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
    return { email, phone };
  };

  const { email, phone } = getContactInfo();
  
  const cancellationText = (() => {
    if (!bookingData.selectedOption) return null;
    const option = bookingData.selectedOption;
    const classStartDateTime = selectedSlot?.date && selectedSlot?.time
      ? `${selectedSlot.date}T${selectedSlot.time}`
      : null;
    return getCancellationPolicyText(
      option?.cancellationPolicy,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      classStartDateTime,
      effectiveUserTimeZone,
      businessTimeZone,
    );
  })();

  const participantsCount = (bookingData.participants ?? (Array.isArray(bookingData.participant_details) ? bookingData.participant_details.length : 0)) || 1;

  if (bookingFailed) {
    return (
      <Container>
        <Card>
          <HeaderSection $failed>
            <IconWrapper>
              {/* Alert Icon */}
              <lord-icon
                src="https://cdn.lordicon.com/keaiwoeo.json"
                trigger="loop"
                delay="2000"
                colors="primary:#ef4444,secondary:#ef4444"
                style={{ width: "100%", height: "100%" }}
              />
            </IconWrapper>
            <StatusTitle style={{ color: "#ef4444" }}>Booking Failed</StatusTitle>
            <StatusMessage>{pollingError || "We were unable to complete your booking."}</StatusMessage>
          </HeaderSection>
          <FooterActions>
            <PrimaryButton onClick={handleRetry} style={{ backgroundColor: "#ef4444" }}>
              Try Booking Again
            </PrimaryButton>
            {email && (
              <SecondaryAction as="a" href={`mailto:${email}`}>
                Contact Support
              </SecondaryAction>
            )}
          </FooterActions>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        {/* Header with Celebration Icon */}
        <HeaderSection>
          <IconWrapper>
            {/* Celebration Confetti Icon */}
            <lord-icon
                src="https://cdn.lordicon.com/lupuorrc.json"
                trigger="loop"
                delay="3000"
                colors="primary:#ff385c,secondary:#000000"
                style={{ width: "100%", height: "100%" }}>
            </lord-icon>
          </IconWrapper>
          <StatusTitle>You're going!</StatusTitle>
          <StatusMessage>
            We sent a confirmation email to <strong>{bookingData.userEmail || "your inbox"}</strong>.
          </StatusMessage>
          
          <ReferenceBadge>
            Reference: 
            <strong>
              {isPolling && !displayReference ? (
                <SkeletonLoader style={{ marginLeft: 8 }} />
              ) : (
                displayReference || (actualBookingId ? "Confirmed" : "Generating...")
              )}
            </strong>
          </ReferenceBadge>
        </HeaderSection>

        <Divider />

        <ContentSection>
          <ClassTitle>{classData?.title || "Class Title"}</ClassTitle>
          <ClassSubtitle>
            {classData?.business_name ? `Hosted by ${classData.business_name}` : ""}
            {classData?.business_name && classData?.location ? " · " : ""}
            {classData?.location}
          </ClassSubtitle>

          <GridSection>
            {/* When */}
            <InfoGroup>
              <Label>Date & Time</Label>
              {selectedSlot && (
                <>
                  <Value>
                    {selectedSlot.isCourse 
                      ? `${formatNaiveDate(selectedSlot.date, "MMM d")} – ${formatNaiveDate(selectedSlot.end_date, "MMM d")}`
                      : formatBusinessLocalToUserDisplay(
                          selectedSlot.date,
                          selectedSlot.time,
                          businessTimeZone,
                          effectiveUserTimeZone,
                          { dateTimeFormat: "EEE, MMM d, yyyy" }
                        )
                    }
                  </Value>
                  <SubValue>
                    {selectedSlot.isCourse
                      ? `Every ${selectedSlot.days.join(", ")} at ${formatTimeRangeForDisplay(selectedSlot.date, selectedSlot.time, selectedSlot.duration, businessTimeZone, effectiveUserTimeZone)}`
                      : `${formatTimeRangeForDisplay(selectedSlot.date, selectedSlot.time, selectedSlot.duration, businessTimeZone, effectiveUserTimeZone)} (${getDurationText(selectedSlot.duration)})`
                    }
                  </SubValue>
                </>
              )}
            </InfoGroup>

            {/* Who */}
            <InfoGroup>
              <Label>Guests</Label>
              <Value>{participantsCount} {participantsCount === 1 ? "Person" : "People"}</Value>
              <SubValue>General Admission</SubValue>
            </InfoGroup>
          </GridSection>

          {/* Additional Info / Policies */}
          <PolicySection>
            {cancellationText && (
               <div style={{ marginBottom: 12 }}>
                 <strong>Cancellation Policy:</strong> {cancellationText}
               </div>
            )}
            {bookingData.selectedOption?.equipment?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong>What to bring:</strong> {bookingData.selectedOption.equipment.join(", ")}.
              </div>
            )}
             <div style={{ marginTop: 12 }}>
                Need help? <a href={`mailto:${email || ""}`}>Contact Host</a>
             </div>
          </PolicySection>

        </ContentSection>

        <Divider />

        <FooterActions>
          <PrimaryButton onClick={handleAddToCalendar} disabled={!selectedSlot || isPolling}>
             {/* Calendar Icon */}
             <lord-icon
                src="https://cdn.lordicon.com/abfverha.json"
                trigger="morph"
                colors="primary:#ffffff,secondary:#ffffff"
             />
             Add to Calendar
          </PrimaryButton>
          <SecondaryAction onClick={handleRetry}>
            Book another spot
          </SecondaryAction>
        </FooterActions>
      </Card>
    </Container>
  );
};

export default ConfirmationStep;