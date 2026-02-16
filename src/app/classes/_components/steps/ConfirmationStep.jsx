import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Calendar as CalendarIcon,
  MapPin,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  Smartphone,
  Shield,
  Package,
  Info,
  Clock,
  AlertCircle
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
import message from "@/lib/message";

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const MainContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #222222;
  animation: ${fadeIn} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (max-width: 640px) {
    padding: 24px 20px;
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
  background-color: ${props => props.$failed ? "#FEE2E2" : "#222222"}; 
  color: ${props => props.$failed ? "#EF4444" : "#FFFFFF"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);

  svg {
    width: 40px;
    height: 40px;
    stroke-width: 2.5px;
  }
`;

const Headline = styled.h1`
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  line-height: 1.1;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const SubHeadline = styled.p`
  font-size: 16px;
  color: #717171;
  margin: 0 auto;
  max-width: 400px;
  line-height: 1.5;
`;

const ReferenceBar = styled.div`
  margin-top: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #F7F7F7;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  color: #222222;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #EBEBEB;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #DDDDDD;
  margin: 32px 0;
  width: 100%;
`;

// --- Trip Details Section ---

const TripGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TripRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
`;

const TripLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #222222;
  margin-bottom: 4px;
`;

const TripValue = styled.div`
  font-size: 16px;
  color: #717171;
  line-height: 1.4;
`;

const LocationBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  .icon-wrap {
    margin-top: 2px;
    color: #222222;
  }
`;

// --- Action Buttons ---

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
`;

const PrimaryButton = styled.button`
  background-color: #FF385C;
  color: white;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.1s ease, background-color 0.2s;

  &:hover {
    background-color: #D90B3E;
  }
  
  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #DDDDDD;
    cursor: not-allowed;
  }
`;

const GhostButton = styled.button`
  background: transparent;
  color: #222222;
  font-size: 15px;
  font-weight: 600;
  padding: 12px;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;

  &:hover {
    border-color: #000;
    background: #F7F7F7;
  }
`;

// --- Accordion / Dropdown Styles ---

const AccordionSection = styled.div`
  border-bottom: 1px solid #DDDDDD;
  &:first-of-type {
    border-top: 1px solid #DDDDDD;
  }
`;

const AccordionHeader = styled.button`
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
    font-size: 18px;
    font-weight: 600;
    color: #222222;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  svg {
    color: #222222;
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }
`;

const AccordionContent = styled.div`
  overflow: hidden;
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: ${props => props.$isOpen ? '24px' : '0'};
  color: #717171;
  font-size: 15px;
  line-height: 1.6;

  ul {
    padding-left: 20px;
    margin: 0;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

// --- Helpers ---

const getUTCDateFromBusinessLocal = (
  naiveDateStr,
  naiveTimeStr,
  businessTimeZoneStr
) => {
  if (!naiveDateStr || !naiveTimeStr || !businessTimeZoneStr) return null;
  try {
    const timeParts = naiveTimeStr.split(":");
    const formattedTimeStr = `${timeParts[0]}:${timeParts[1] || "00"}:${timeParts[2] || "00"}`;
    const dateTimeInBusinessTZStr = `${naiveDateStr}T${formattedTimeStr}`;
    const utcDate = fromZonedTime(dateTimeInBusinessTZStr, businessTimeZoneStr);
    return isValid(utcDate) ? utcDate : null;
  } catch (error) {
    console.error("Error creating UTC date:", error);
    return null;
  }
};

const SkeletonPlaceholder = styled.span`
  display: inline-block;
  height: 14px;
  width: 80px;
  background: #e0e0e0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

// --- Sub-components ---

const AccordionItem = ({ icon: Icon, title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // If no content, don't render
  if (!children) return null;

  return (
    <AccordionSection>
      <AccordionHeader onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen} type="button">
        <span>
          {Icon && <Icon size={20} />}
          {title}
        </span>
        <ChevronDown size={20} />
      </AccordionHeader>
      <AccordionContent $isOpen={isOpen}>
        {children}
      </AccordionContent>
    </AccordionSection>
  );
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

  const selectedSlot = bookingData.selectedSlots?.[0];
  const effectiveUserTimeZone =
    userTimeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Toronto");

  // --- Polling Logic ---
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
            setPollingError(data.failure_message || "Your payment could not be processed.");
            setIsPolling(false);
          } else if (
            ["pending_webhook", "processing"].includes(data.status) &&
            attempts < maxAttempts
          ) {
            setTimeout(attemptFetch, pollInterval);
          } else {
            setBookingFailed(true);
            setPollingError(data.message || "Booking could not be confirmed in time. Please contact support.");
            setIsPolling(false);
          }
        } else {
          setBookingFailed(true);
          setPollingError(result.error || "An error occurred while confirming your booking.");
          setIsPolling(false);
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(attemptFetch, pollInterval + attempts * 500);
        } else {
          setBookingFailed(true);
          setPollingError("A network error occurred. Please check your connection.");
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

  // --- Handlers ---

  const handleCopyReference = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference);
      message.success("Reference copied!");
    }
  };

  const handleAddToCalendar = () => {
    if (!selectedSlot || !businessTimeZone) return;

    const {
      date: naiveStartDate,
      time: naiveTime,
      duration,
      isCourse,
      end_date: naiveCourseEndDate,
      days,
    } = selectedSlot;

    const startUTC = getUTCDateFromBusinessLocal(naiveStartDate, naiveTime, businessTimeZone);
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
      description: `Your booking for ${classData?.title} with ${classData?.business_name}.\nRef: ${displayReference || "Pending..."}`,
      location: classData?.location || "",
      start: formatToICSDateArray(startUTC),
      startOutputType: "utc",
      duration: { minutes: duration },
    };

    if (isCourse && days?.length > 0 && naiveCourseEndDate) {
      const dayMap = { Sun: "SU", Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA" };
      const byDay = days.map((d) => dayMap[d]).filter(Boolean).join(",");
      const untilDate = new Date(`${naiveCourseEndDate}T23:59:59Z`);
      const untilDateFormatted = dateFnsFormat(untilDate, "yyyyMMdd'T'HHmmss'Z'");
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
        `${classData?.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_booking.ics`
      );
    });
  };

  // --- Render Helpers ---

  const getCancellationText = () => {
    const option = bookingData.selectedOption;
    const policyKey = option?.cancellationPolicy;
    if (!policyKey) return null;
    const classStartDateTime = selectedSlot?.date && selectedSlot?.time
      ? `${selectedSlot.date}T${selectedSlot.time}`
      : null;
    return getCancellationPolicyText(
      policyKey,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      classStartDateTime,
      effectiveUserTimeZone,
      businessTimeZone,
    );
  };

  const getBusinessEmail = () => classData?.student_contact_email ?? classData?.business_contact_email;
  const getBusinessPhone = () => classData?.student_contact_phone ?? classData?.business_contact_phone;

  // --- Main Render ---

  if (bookingFailed) {
    return (
      <MainContainer>
        <HeaderSection>
          <StatusCircle $failed={true}>
            <AlertCircle />
          </StatusCircle>
          <Headline>Booking Failed</Headline>
          <SubHeadline>{pollingError || "We were unable to complete your booking."}</SubHeadline>
        </HeaderSection>
        <PrimaryButton onClick={onRetryBooking || (() => window.location.reload())}>
          Try Booking Again
        </PrimaryButton>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      {/* 1. Header: Success & Ref */}
      <HeaderSection>
        <StatusCircle>
          <Check />
        </StatusCircle>
        <Headline>You're in!</Headline>
        <SubHeadline>
          Your spot's saved. We'll see you there—don't forget to show up.
          <br />
          We've dropped the full details in your inbox.
        </SubHeadline>

        <ReferenceBar onClick={handleCopyReference}>
          <span>Reference:</span>
          {isPolling && !displayReference ? (
            <SkeletonPlaceholder />
          ) : (
            <strong>{displayReference || "Processing..."}</strong>
          )}
          <Copy size={12} style={{marginLeft: 4, opacity: 0.5}} />
        </ReferenceBar>
      </HeaderSection>

      <Divider />

      {/* 2. Main Details (Itinerary) */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "24px" }}>
          {classData?.title || "Class Details"}
        </h2>

        <TripGrid>
          {/* Business */}
          <TripRow>
            <div>
              <TripLabel>Host</TripLabel>
              <TripValue>{classData?.business_name || "The Business"}</TripValue>
            </div>
          </TripRow>

          {/* Date & Time */}
          {selectedSlot && (
            <TripRow>
               <div>
                <TripLabel>When</TripLabel>
                <TripValue>
                  {selectedSlot.isCourse ? (
                    <>
                      {formatNaiveDate(selectedSlot.date, "MMM d")} – {formatNaiveDate(selectedSlot.end_date, "MMM d, yyyy")}
                      <div style={{ fontSize: 14, color: '#717171', marginTop: 4 }}>
                        Every {selectedSlot.days.join(", ")} at {formatTimeRangeForDisplay(selectedSlot.date, selectedSlot.time, selectedSlot.duration, businessTimeZone, effectiveUserTimeZone)}
                      </div>
                    </>
                  ) : (
                    <>
                      {formatBusinessLocalToUserDisplay(
                        selectedSlot.date,
                        selectedSlot.time,
                        businessTimeZone,
                        effectiveUserTimeZone,
                        { dateTimeFormat: "EEEE, MMMM d, yyyy" }
                      )}
                      <br />
                      {formatTimeRangeForDisplay(
                        selectedSlot.date,
                        selectedSlot.time,
                        selectedSlot.duration,
                        businessTimeZone,
                        effectiveUserTimeZone
                      )}
                    </>
                  )}
                </TripValue>
              </div>
            </TripRow>
          )}

          {/* Location */}
          {(classData?.location || classData?.business_name) && (
            <LocationBlock>
              <div className="icon-wrap"><MapPin size={24} /></div>
              <div>
                <TripLabel>Where</TripLabel>
                <TripValue>
                  {classData?.location || classData?.business_name}
                </TripValue>
              </div>
            </LocationBlock>
          )}
        </TripGrid>
      </div>

      <Divider />

      {/* 3. Actions */}
      <ButtonGroup>
        <PrimaryButton onClick={handleAddToCalendar} disabled={!selectedSlot || isPolling}>
          <CalendarIcon size={18} />
          Add to calendar
        </PrimaryButton>

        {getBusinessEmail() && (
           <GhostButton as="a" href={`mailto:${getBusinessEmail()}`} style={{textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
             <Mail size={18} />
             Contact Host
           </GhostButton>
        )}
      </ButtonGroup>

      <div style={{ marginTop: 40 }}>
        {/* 4. Dropdowns / Accordions */}
        
        {/* Things to bring */}
        {bookingData.selectedOption?.equipment?.length > 0 && (
            <AccordionItem icon={Package} title="What to bring">
                <p style={{marginTop: 0}}>Make sure you have these with you:</p>
                <ul>
                    {bookingData.selectedOption.equipment.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </AccordionItem>
        )}

        {/* Cancellation Policy */}
        {getCancellationText() && (
            <AccordionItem icon={Shield} title="Cancellation policy">
                <p style={{marginTop: 0}}>{getCancellationText()}</p>
            </AccordionItem>
        )}

        {/* Pro Tip / Need to Know */}
        <AccordionItem icon={Info} title="Need to know">
            <p style={{marginTop: 0}}>
                <strong>Pro tip:</strong> Arrive a few minutes early to check in. 
            </p>
            <p>
                Questions before the big day? You can reach out to {classData?.business_name || "the business"} directly at {getBusinessEmail() || "their email"}.
            </p>
        </AccordionItem>
      </div>

    </MainContainer>
  );
};

export default ConfirmationStep;