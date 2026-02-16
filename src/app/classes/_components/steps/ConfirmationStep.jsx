import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Copy,
  ArrowRight,
  Shield,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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
import { Button, message, Tooltip } from "antd";

// --- ANIMATIONS ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

// --- LAYOUT COMPONENTS ---

const Wrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #222222;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (max-width: 640px) {
    padding: 24px 16px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #dddddd;
  margin: 32px 0;
  width: 100%;
`;

// --- HERO SECTION ---

const HeroSection = styled.div`
  margin-bottom: 32px;
  text-align: left;
`;

const HeroImagePlaceholder = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff385c 0%, #e31c5f 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 10px 20px rgba(255, 56, 92, 0.15);
  color: white;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$failed ? "#c13515" : "#008a05")};
  margin-bottom: 12px;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const BigTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  line-height: 1.125;
  margin: 0 0 12px 0;
  color: #222222;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const SubTitle = styled.p`
  font-size: 16px;
  color: #717171;
  line-height: 1.5;
  margin: 0;
  max-width: 500px;
`;

// --- REFERENCE SECTION ---

const ReferenceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f7f7f7;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 32px;
`;

const RefLabel = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #717171;
  margin-bottom: 4px;
`;

const RefCode = styled.div`
  font-size: 18px;
  font-weight: 600;
  font-family: monospace;
  color: #222222;
  letter-spacing: 1px;
`;

const CopyButton = styled.button`
  background: white;
  border: 1px solid #dddddd;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #222222;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f0f0f0;
    border-color: #cdcdcd;
  }
`;

const LoadingSkeleton = styled.div`
  height: 20px;
  width: 100px;
  background-color: #e0e0e0;
  border-radius: 4px;
  animation: ${pulse} 1.5s infinite;
`;

// --- DETAILS GRID ---

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const IconColumn = styled.div`
  flex-shrink: 0;
  width: 24px;
  display: flex;
  justify-content: center;
  padding-top: 2px;
  color: #222222;
`;

const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const DetailLabel = styled.span`
  font-weight: 600;
  font-size: 16px;
  color: #222222;
  margin-bottom: 4px;
`;

const DetailValue = styled.span`
  font-size: 15px;
  color: #717171;
  line-height: 1.4;
`;

// --- ACTION BUTTONS ---

const PrimaryButton = styled.button`
  width: 100%;
  background: linear-gradient(90deg, #ff385c 0%, #e61e4d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.1s ease, box-shadow 0.2s ease;
  margin-top: 8px;

  &:hover {
    box-shadow: 0 6px 16px rgba(255, 56, 92, 0.25);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #dddddd;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SecondaryAction = styled.button`
  background: transparent;
  border: none;
  color: #222222;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-top: 16px;
  
  &:hover {
    color: #000;
  }
`;

// --- FOOTER SECTIONS (Accordion Style) ---

const ExpandableSection = styled.div`
  border-bottom: 1px solid #dddddd;
  
  &:first-of-type {
    border-top: 1px solid #dddddd;
  }
`;

const SectionTrigger = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 24px 0;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 16px;
    font-weight: 600;
    color: #222222;
  }
`;

const SectionContent = styled.div`
  padding-bottom: 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #717171;
  animation: ${fadeInUp} 0.3s ease-out;

  ul {
    padding-left: 20px;
    margin: 8px 0 0 0;
  }
  
  strong {
    color: #222222;
    font-weight: 600;
  }
`;

// --- UTILS ---

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
  
  // UI States for accordions
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const actualBookingId = propBookingId || bookingData.bookingId;
  const displayReference =
    propReference || fetchedReference || bookingData.user_facing_reference;

  // --- POLLING LOGIC ---
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
              data.message || "Booking could not be confirmed in time."
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
          setPollingError("Network error. Please check connection.");
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

  // --- CALENDAR LOGIC ---
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
      message.error("Could not generate calendar event.");
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
        Sun: "SU", Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA",
      };
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
        "booking.ics"
      );
    });
  };

  const handleCopyReference = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference);
      message.success("Reference copied!");
    }
  };

  const selectedSlot = bookingData.selectedSlots?.[0];
  const effectiveUserTimeZone =
    userTimeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Toronto");
  
  // --- DERIVED DATA STRINGS ---
  
  // Date & Time String
  let dateTimeLabel = "";
  if (selectedSlot) {
    if (selectedSlot.isCourse) {
      dateTimeLabel = `Starts ${formatNaiveDate(selectedSlot.date, "MMM d")} · Every ${selectedSlot.days.join(", ")} at ${formatTimeRangeForDisplay(
        selectedSlot.date,
        selectedSlot.time,
        selectedSlot.duration,
        businessTimeZone,
        effectiveUserTimeZone
      )}`;
    } else {
      dateTimeLabel = formatBusinessLocalToUserDisplay(
        selectedSlot.date,
        selectedSlot.time,
        businessTimeZone,
        effectiveUserTimeZone,
        { dateTimeFormat: "EEEE, MMM d · p" }
      );
    }
  }

  // Participants
  const participantsCount = bookingData.participants ?? (Array.isArray(bookingData.participant_details) ? bookingData.participant_details.length : 1);
  const guestsLabel = `${participantsCount} ${participantsCount === 1 ? 'guest' : 'guests'}`;

  // Contact Info
  const businessName = classData?.business_name || "the host";
  const contactEmail = classData?.student_contact_email || classData?.business_contact_email;
  const contactPhone = classData?.student_contact_phone || classData?.business_contact_phone;

  // Cancellation
  const cancellationText = getCancellationPolicyText(
    bookingData.selectedOption?.cancellationPolicy,
    bookingData.selectedOption?.cancellationRefundPercentage,
    bookingData.selectedOption?.cancellationCustomHours,
    selectedSlot?.date ? `${selectedSlot.date}T${selectedSlot.time}` : null,
    effectiveUserTimeZone,
    businessTimeZone
  );

  if (bookingFailed) {
    return (
      <Wrapper>
        <HeroSection>
          <StatusBadge $failed>
             <AlertCircle /> Booking Failed
          </StatusBadge>
          <BigTitle>Something went wrong</BigTitle>
          <SubTitle>{pollingError || "We couldn't complete your booking."}</SubTitle>
        </HeroSection>
        <PrimaryButton onClick={onRetryBooking || (() => window.location.reload())}>
          Try Booking Again
        </PrimaryButton>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* 1. HERO */}
      <HeroSection>
        {!isPolling && <StatusBadge><Check /> Confirmed</StatusBadge>}
        {isPolling && <StatusBadge style={{ color: "#eab308" }}><Clock /> Finalizing...</StatusBadge>}
        
        {/* Optional: If classData has an image, render it here visually like Airbnb */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
                <BigTitle>You're going to {classData?.location?.split(',')[0] || "class"}!</BigTitle>
                <SubTitle>
                    We sent a confirmation email to <strong>{bookingData?.userEmail || bookingData.email}</strong>.
                </SubTitle>
            </div>
            {/* Minimal visual anchor */}
            <HeroImagePlaceholder>
                <Check />
            </HeroImagePlaceholder>
        </div>
      </HeroSection>

      {/* 2. REFERENCE CODE CARD */}
      <ReferenceContainer>
        <div>
          <RefLabel>Booking Reference</RefLabel>
          {isPolling && !displayReference ? (
            <LoadingSkeleton />
          ) : (
            <RefCode>{displayReference}</RefCode>
          )}
        </div>
        <Tooltip title="Copy reference">
            <CopyButton onClick={handleCopyReference}>
            <Copy size={16} />
            </CopyButton>
        </Tooltip>
      </ReferenceContainer>

      {/* 3. DETAILS LIST (Minimal, no borders) */}
      <DetailsList>
        {/* Time */}
        <DetailRow>
          <IconColumn><CalendarIcon size={20} /></IconColumn>
          <TextColumn>
            <DetailLabel>Date and time</DetailLabel>
            <DetailValue>{dateTimeLabel}</DetailValue>
          </TextColumn>
        </DetailRow>

        {/* Location */}
        <DetailRow>
          <IconColumn><MapPin size={20} /></IconColumn>
          <TextColumn>
            <DetailLabel>Address</DetailLabel>
            <DetailValue>{classData?.location}</DetailValue>
            <DetailValue style={{ fontSize: '13px', marginTop: '4px' }}>
                {classData?.business_name}
            </DetailValue>
          </TextColumn>
        </DetailRow>

        {/* Guests */}
        <DetailRow>
          <IconColumn><Users size={20} /></IconColumn>
          <TextColumn>
            <DetailLabel>Guests</DetailLabel>
            <DetailValue>{guestsLabel}</DetailValue>
          </TextColumn>
        </DetailRow>
      </DetailsList>

      <Divider />

      {/* 4. PRIMARY ACTION */}
      <PrimaryButton onClick={handleAddToCalendar} disabled={isPolling || !selectedSlot}>
        <CalendarIcon size={18} /> Add to Calendar
      </PrimaryButton>

      {/* 5. FOOTER DETAILS (Accordion Style) */}
      <div style={{ marginTop: 40 }}>
        {/* Equipment */}
        {bookingData.selectedOption?.equipment?.length > 0 && (
          <ExpandableSection>
            <SectionTrigger onClick={() => toggleSection('equipment')}>
              <span>Things to bring</span>
              {expandedSection === 'equipment' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </SectionTrigger>
            {expandedSection === 'equipment' && (
              <SectionContent>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {bookingData.selectedOption.equipment.map((item, i) => (
                        <li key={i} style={{ marginBottom: 6, display: 'flex', gap: 10 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#222', marginTop: 8 }} />
                            {item}
                        </li>
                    ))}
                </ul>
              </SectionContent>
            )}
          </ExpandableSection>
        )}

        {/* Cancellation */}
        {cancellationText && (
          <ExpandableSection>
            <SectionTrigger onClick={() => toggleSection('cancellation')}>
              <span>Cancellation policy</span>
              {expandedSection === 'cancellation' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </SectionTrigger>
            {expandedSection === 'cancellation' && (
              <SectionContent>
                {cancellationText}
              </SectionContent>
            )}
          </ExpandableSection>
        )}

        {/* Contact */}
        {(contactEmail || contactPhone) && (
          <ExpandableSection>
            <SectionTrigger onClick={() => toggleSection('contact')}>
              <span>Contact {businessName}</span>
              {expandedSection === 'contact' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </SectionTrigger>
            {expandedSection === 'contact' && (
              <SectionContent>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {contactEmail && (
                        <a href={`mailto:${contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#222', textDecoration: 'underline' }}>
                            <Mail size={16} /> {contactEmail}
                        </a>
                    )}
                    {contactPhone && (
                        <a href={`tel:${contactPhone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#222', textDecoration: 'underline' }}>
                            <Phone size={16} /> {contactPhone}
                        </a>
                    )}
                 </div>
              </SectionContent>
            )}
          </ExpandableSection>
        )}
      </div>

    </Wrapper>
  );
};

export default ConfirmationStep;