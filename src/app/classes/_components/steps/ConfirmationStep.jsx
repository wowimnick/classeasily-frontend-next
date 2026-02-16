import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
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
import { message } from "antd";

// --- Animations ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #222222;
  animation: ${fadeInUp} 0.6s ease-out;

  @media (max-width: 640px) {
    padding: 24px 16px;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const StatusCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${(props) => (props.$failed ? "#fee2e2" : "#222222")}; /* Black for modern look */
  color: ${(props) => (props.$failed ? "#ef4444" : "#ffffff")};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 10px 25px -10px rgba(0,0,0,0.3);

  svg {
    width: 40px;
    height: 40px;
    stroke-width: 3px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  color: #222222;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #717171;
  margin: 0 auto;
  max-width: 420px;
  line-height: 1.5;
`;

/* The "Ticket" / Main Card */
const BookingCard = styled.div`
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  margin-bottom: 32px;
`;

const CardImagePlaceholder = styled.div`
  height: 8px;
  background: #222222;
  width: 100%;
`;

const CardContent = styled.div`
  padding: 24px;
`;

const ClassTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const BusinessName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #717171;
  margin-bottom: 24px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoIcon = styled.div`
  margin-right: 16px;
  color: #222222;
  display: flex;
  align-items: center;
  height: 24px; /* Align with line-height */
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const InfoText = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #222222;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: #717171;
  line-height: 1.4;
`;

const ReferenceSection = styled.div`
  border-top: 1px solid #dddddd;
  background-color: #f7f7f7;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReferenceLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #717171;
`;

const ReferenceCode = styled.div`
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: #222222;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    color: #000;
  }
`;

const SkeletonLoader = styled.div`
  height: 20px;
  width: 100px;
  background: #e0e0e0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

/* Action Buttons */
const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
`;

const PrimaryButton = styled.button`
  background: #ffffff;
  border: 1px solid #222222;
  color: #222222;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;

  &:hover {
    background: #f7f7f7;
    transform: scale(1.01);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RetryButton = styled(PrimaryButton)`
  background: #e31c5f;
  color: white;
  border-color: #e31c5f;
  
  &:hover {
    background: #d11a52;
  }
`;

/* Accordion / Dropdown Section */
const DropdownSection = styled.div`
  border-top: 1px solid #dddddd;
`;

const DropdownItem = styled.div`
  border-bottom: 1px solid #dddddd;
`;

const DropdownHeader = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  
  span {
    font-size: 16px;
    font-weight: 600;
    color: #222222;
  }

  svg {
    color: #222222;
    transition: transform 0.3s ease;
    ${(props) => props.$isOpen && css`
      transform: rotate(180deg);
    `}
  }

  &:hover span {
    text-decoration: underline;
  }
`;

const DropdownContent = styled.div`
  padding-bottom: 24px;
  color: #717171;
  font-size: 14px;
  line-height: 1.6;
  animation: ${fadeInUp} 0.3s ease-out;
  
  p {
    margin: 0;
  }
  
  ul {
    padding-left: 20px;
    margin: 0;
  }
  
  li {
    margin-bottom: 4px;
  }

  a {
    color: #222222;
    text-decoration: underline;
    font-weight: 500;
  }
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
  
  // Accordion States
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

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

  const handleCopyReference = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference);
      message.success("Reference copied!");
    }
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

  // --- Render Helpers ---

  const renderDateTimeContent = () => {
    if (!selectedSlot) return null;
    const { date, time, duration, isCourse, end_date, days } = selectedSlot;

    if (isCourse) {
      return (
        <>
          <InfoRow>
            <InfoIcon><CalendarIcon /></InfoIcon>
            <InfoText>
              <InfoLabel>Course Dates</InfoLabel>
              <InfoValue>
                {formatNaiveDate(date, "MMM d")} – {formatNaiveDate(end_date, "MMM d, yyyy")}
              </InfoValue>
            </InfoText>
          </InfoRow>
          <InfoRow>
            <InfoIcon><Clock /></InfoIcon>
            <InfoText>
              <InfoLabel>Schedule</InfoLabel>
              <InfoValue>
                Every {days.join(", ")} at {formatTimeRangeForDisplay(
                  date,
                  time,
                  duration,
                  businessTimeZone,
                  effectiveUserTimeZone
                )}
              </InfoValue>
            </InfoText>
          </InfoRow>
        </>
      );
    }

    return (
      <InfoRow>
        <InfoIcon><CalendarIcon /></InfoIcon>
        <InfoText>
          <InfoLabel>Date and time</InfoLabel>
          <InfoValue>
            {formatBusinessLocalToUserDisplay(
              date,
              time,
              businessTimeZone,
              effectiveUserTimeZone,
              { dateTimeFormat: "EEEE, MMM d" }
            )}
            {" · "}
            {formatBusinessLocalToUserDisplay(
              date,
              time,
              businessTimeZone,
              effectiveUserTimeZone,
              { timeFormat: "p" }
            )}
            {" ("}{getDurationText(duration)}{")"}
          </InfoValue>
        </InfoText>
      </InfoRow>
    );
  };

  const cancellationText = (() => {
    const option = bookingData.selectedOption;
    if (!option?.cancellationPolicy) return null;
    const classStartDateTime = selectedSlot?.date && selectedSlot?.time
      ? `${selectedSlot.date}T${selectedSlot.time}`
      : null;
    return getCancellationPolicyText(
      option.cancellationPolicy,
      option.cancellationRefundPercentage,
      option.cancellationCustomHours,
      classStartDateTime,
      effectiveUserTimeZone,
      businessTimeZone,
    );
  })();

  const equipmentList = bookingData.selectedOption?.equipment || [];
  
  const businessEmail =
    classData?.student_contact_email ??
    classData?.studentContactEmail ??
    classData?.business_contact_email ??
    classData?.businessContactEmail;
    
  const businessPhone =
    classData?.student_contact_phone ??
    classData?.studentContactPhone ??
    classData?.business_contact_phone ??
    classData?.businessContactPhone;

  return (
    <Container>
      <HeaderSection>
        <StatusCircle $failed={bookingFailed}>
          {bookingFailed ? <AlertCircle /> : <Check />}
        </StatusCircle>
        <Title>{bookingFailed ? "Booking Failed" : "You're in!"}</Title>
        <Subtitle>
          {bookingFailed
            ? pollingError || "We were unable to complete your booking."
            : "We've sent a confirmation email with all the details to your inbox."}
        </Subtitle>
      </HeaderSection>

      {bookingFailed ? (
         <ButtonGroup>
            <RetryButton onClick={handleRetry}>Try Booking Again</RetryButton>
         </ButtonGroup>
      ) : (
        <>
          <BookingCard>
            <CardImagePlaceholder />
            <CardContent>
              <ClassTitle>
                {classData?.title || bookingData.selectedOption?.classId?.title || "Class Title"}
              </ClassTitle>
              {(classData?.business_name) && (
                 <BusinessName>Hosted by {classData.business_name}</BusinessName>
              )}

              {renderDateTimeContent()}

              {(classData?.location) && (
                <InfoRow>
                  <InfoIcon><MapPin /></InfoIcon>
                  <InfoText>
                    <InfoLabel>Location</InfoLabel>
                    <InfoValue>{classData.location}</InfoValue>
                  </InfoText>
                </InfoRow>
              )}
            </CardContent>

            <ReferenceSection>
              <ReferenceLabel>Confirmation Code</ReferenceLabel>
              <ReferenceCode onClick={handleCopyReference}>
                {isPolling && !displayReference ? (
                  <SkeletonLoader />
                ) : (
                  <>
                    {displayReference || (actualBookingId ? "CONFIRMED" : "PROCESSING")}
                    <Copy size={14} style={{ color: "#717171" }}/>
                  </>
                )}
              </ReferenceCode>
            </ReferenceSection>
          </BookingCard>

          <ButtonGroup>
            <PrimaryButton
                onClick={handleAddToCalendar}
                disabled={!selectedSlot || isPolling}
            >
                <CalendarIcon size={18} /> Add to calendar
            </PrimaryButton>
          </ButtonGroup>

          {/* Accordion Sections for Extra Info */}
          <DropdownSection>
            {/* 1. What to bring */}
            {equipmentList.length > 0 && (
              <DropdownItem>
                <DropdownHeader 
                  $isOpen={openSection === 'equipment'} 
                  onClick={() => toggleSection('equipment')}
                >
                  <span>What to bring</span>
                  <ChevronDown size={20} />
                </DropdownHeader>
                {openSection === 'equipment' && (
                  <DropdownContent>
                    <ul>
                      {equipmentList.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </DropdownContent>
                )}
              </DropdownItem>
            )}

            {/* 2. Cancellation Policy */}
            {cancellationText && (
              <DropdownItem>
                <DropdownHeader 
                  $isOpen={openSection === 'cancellation'} 
                  onClick={() => toggleSection('cancellation')}
                >
                  <span>Cancellation policy</span>
                  <ChevronDown size={20} />
                </DropdownHeader>
                {openSection === 'cancellation' && (
                  <DropdownContent>
                    <p>{cancellationText}</p>
                  </DropdownContent>
                )}
              </DropdownItem>
            )}

            {/* 3. Contact Info */}
            {(businessEmail || businessPhone) && (
               <DropdownItem>
                 <DropdownHeader 
                    $isOpen={openSection === 'contact'} 
                    onClick={() => toggleSection('contact')}
                 >
                    <span>Contact host</span>
                    <ChevronDown size={20} />
                 </DropdownHeader>
                 {openSection === 'contact' && (
                   <DropdownContent>
                     <p style={{ marginBottom: 8 }}>
                        Have questions? Reach out to {classData?.business_name || "the host"} directly.
                     </p>
                     {businessEmail && (
                        <div style={{ marginBottom: 4 }}>
                           <strong>Email: </strong>
                           <a href={`mailto:${businessEmail}`}>{businessEmail}</a>
                        </div>
                     )}
                     {businessPhone && (
                        <div>
                           <strong>Phone: </strong>
                           <a href={`tel:${businessPhone.replace(/\s/g, "")}`}>{businessPhone}</a>
                        </div>
                     )}
                   </DropdownContent>
                 )}
               </DropdownItem>
            )}

            {/* 4. Arrive Early Note (Kept as witty text inside a dropdown or just a static tip) */}
            <DropdownItem>
                <DropdownHeader 
                   $isOpen={openSection === 'tips'} 
                   onClick={() => toggleSection('tips')}
                >
                   <span>Good to know</span>
                   <ChevronDown size={20} />
                </DropdownHeader>
                {openSection === 'tips' && (
                   <DropdownContent>
                      <p>
                        <strong>Pro tip:</strong> Arrive a few minutes early to get settled. 
                        Your spot's saved. We'll see you there—don't forget to show up.
                      </p>
                   </DropdownContent>
                )}
            </DropdownItem>
          </DropdownSection>
        </>
      )}
    </Container>
  );
};

export default ConfirmationStep;