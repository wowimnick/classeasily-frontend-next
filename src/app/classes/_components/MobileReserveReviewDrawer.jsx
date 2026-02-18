"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Drawer } from "vaul";
import { Star, CalendarDays, Clock, Users, ChevronRight, Shield } from "lucide-react";
import { formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";
import { getCancellationPolicyText, getDurationText } from "./steps/utils";
import NumberFlow from "@number-flow/react";
import message from "@/lib/message";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";
const HST_RATE = 0.13;

const theme = {
  textPrimary: "#222222",
  textSecondary: "#717171",
  borderLight: "#e5e7eb",
};

// --- Styled Components ---

const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1050;
`;

const NestedDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1055; 
`;

const DrawerContent = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 96vh;
  max-height: 96vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1051;
  outline: none;
  /* Constrain height so flex child (DrawerBody) can shrink and scroll */
  min-height: 0;
`;

const NestedDrawerContent = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1056; 
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  overflow-y: scroll;
  padding: 0 12px 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
  /* Ensure scrollbar is visible when content overflows */
  overflow-x: hidden;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 8px 12px 12px;
  background: #fff;
  border-top: 1px solid ${theme.borderLight};
`;

/* Header */
const HeaderRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 8px;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${theme.textPrimary};
  letter-spacing: -0.01em;
`;

const CloseBtn = styled.button`
  background: #f3f4f6;
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: #111827;
  transition: background 0.2s;
  
  &:active {
    background-color: #e5e5e5;
  }
`;

/* Main Info Card */
const InfoCard = styled.div`
  background: #fff;
  border: 1px solid ${theme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  margin-bottom: 24px;
  flex-shrink: 0;
`;

const ListingHeader = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid ${theme.borderLight};
`;

const ListingImage = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ListingInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ListingTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  line-height: 1.3;
  color: ${theme.textPrimary};
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: ${theme.textPrimary};
`;

/* Details Rows */
const DetailRow = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.borderLight};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  &:last-child {
    border-bottom: none;
  }
`;

const DetailContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.textPrimary};
`;

const DetailValue = styled.div`
  font-size: 14px;
  color: ${theme.textSecondary};
  line-height: 1.4;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  color: ${theme.textPrimary};
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  flex-shrink: 0;
`;

/* Total Price Card - Matching ReviewAndPaymentStep Style */
const TotalSummaryCard = styled.div`
  background: white;
  border: 1px solid #111827; /* Dark border as requested */
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  flex-shrink: 0;

  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .label-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .label {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .label-sub {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }

  .value {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
  }
`;

const ViewDetailsButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0 0 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-align: center;
  width: 100%;
  
  &:hover {
    color: #374151;
  }
`;

/* Cancellation Policy */
const PolicySection = styled.div`
  margin-bottom: 24px;
  flex-shrink: 0;
`;

const PolicyText = styled.div`
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 6px;
`;

const PolicyLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  color: #111827;
  cursor: pointer;
`;

/* Bottom Action */
const NextButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #222222;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  
  &:active {
    opacity: 0.95;
    transform: scale(0.99);
  }
`;

/* Nested Drawer Styles */
const SheetTitle = styled.h3`
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 700;
  color: ${theme.textPrimary};
  text-align: center;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 15px;
  color: #4b5563;

  &.total {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${theme.borderLight};
    font-weight: 700;
    color: #111827;
    font-size: 16px;
    margin-bottom: 0;
  }
`;

export default function MobileReserveReviewDrawer({
  open,
  onClose,
  classData,
  reserveData,
  onEditDate,
  onEditTime,
  onEditGuests,
}) {
  const router = useRouter();
  const [priceOpen, setPriceOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const slot = reserveData?.selectedSlot;
  const option = reserveData?.selectedOption;
  const participants = reserveData?.participants ?? 1;
  const pricePer = slot ? parseFloat(slot.price) || 0 : 0;
  const subtotal = pricePer * participants;
  const taxAmount = subtotal * HST_RATE;
  const total = subtotal + taxAmount;
  const currency = classData?.currency_code || "CAD";

  const imageUrl = useMemo(() => {
    const img = classData?.images?.[0];
    if (!img) return null;
    if (typeof img === "string") return img;
    return img?.thumbnail_url || img?.medium_url || img?.image_url || img?.url;
  }, [classData?.images]);

  const averageRating = classData?.average_rating;
  const reviewCount = classData?.review_count ?? 0;
  const showRating = typeof averageRating === "number" || reviewCount > 0;

  const userTimeZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const businessTimeZone = classData?.business_timezone || "Etc/UTC";

  // Formatted Date
  const dateText = useMemo(() => {
    if (!slot?.date) return "Select date";
    if (slot.isCourse && slot.end_date) {
      return `${formatNaiveDate(slot.date, "MMM d")} – ${formatNaiveDate(slot.end_date, "MMM d, yyyy")}`;
    }
    return formatNaiveDate(slot.date, "MMM d, yyyy");
  }, [slot]);

  // Formatted Time (Actual Span)
  const timeText = useMemo(() => {
     if (!slot) return "";
     if (slot.isCourse && slot.days) {
         // For courses we might show "Every Mon, Wed..."
         const days = Array.isArray(slot.days) ? slot.days.join(", ") : "";
         const timeRange = formatTimeRangeForDisplay(slot.date, slot.time, slot.duration, businessTimeZone, userTimeZone);
         return `Every ${days} · ${timeRange}`;
     }
     if (slot.time && typeof slot.duration === "number") {
       return formatTimeRangeForDisplay(
        slot.date,
        slot.time,
        slot.duration,
        businessTimeZone,
        userTimeZone
      );
     }
     return "";
  }, [slot, businessTimeZone, userTimeZone]);

  const guestsText = participants === 1 ? "1 participant" : `${participants} participants`;

  const cancellationPolicyText = useMemo(() => {
    return getCancellationPolicyText(
      option?.cancellationPolicy,
      option?.cancellationRefundPercentage,
      option?.cancellationCustomHours,
      slot?.date && slot?.time ? `${slot.date}T${slot.time}` : null,
      userTimeZone,
      businessTimeZone
    );
  }, [
    option?.cancellationPolicy,
    option?.cancellationRefundPercentage,
    option?.cancellationCustomHours,
    slot,
    userTimeZone,
    businessTimeZone,
  ]);

  const handleNext = () => {
    if (!classData?.slug || !slot || !option) return;
    const participantDetails = Array.from(
      { length: participants },
      () => ({ name: "" })
    );
    const nextBookingState = {
      selectedSlots: [slot],
      participants,
      participant_details: participantDetails,
      selectedOption: option,
      userName: "",
      userEmail: "",
      userPhone: "",
      price: pricePer,
      notes: "",
    };
    try {
      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          classSlug: classData.slug,
          classData,
          bookingData: nextBookingState,
        })
      );
      onClose();
      router.push(`/classes/${classData.slug}/checkout`);
    } catch (e) {
      console.error("Reserve -> checkout failed", e);
      message.error("Couldn't open checkout. Please try again.");
    }
  };

  if (!reserveData?.selectedSlot || !reserveData?.selectedOption) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHandle />
          <DrawerBody>
            <HeaderRow>
              <Title>Review and continue</Title>
            </HeaderRow>

            <InfoCard>
              <ListingHeader>
                <ListingImage>
                  {imageUrl && <img src={imageUrl} alt="" />}
                </ListingImage>
                <ListingInfo>
                  <ListingTitle>{classData?.title || "Class"}</ListingTitle>
                  {showRating && (
                    <RatingBadge>
                      <Star size={14} fill="currentColor" />
                      {Number(averageRating ?? 0).toFixed(1)} ({reviewCount})
                    </RatingBadge>
                  )}
                </ListingInfo>
              </ListingHeader>

              <DetailRow>
                <DetailContent>
                  <DetailLabel>Date</DetailLabel>
                  <DetailValue>{dateText}</DetailValue>
                </DetailContent>
                <EditButton type="button" onClick={() => (onEditDate ?? onClose)()}>Edit</EditButton>
              </DetailRow>

              <DetailRow>
                <DetailContent>
                  <DetailLabel>Time</DetailLabel>
                  <DetailValue>{timeText}</DetailValue>
                </DetailContent>
                <EditButton type="button" onClick={() => (onEditTime ?? onClose)()}>Edit</EditButton>
              </DetailRow>

              <DetailRow>
                <DetailContent>
                  <DetailLabel>Guests</DetailLabel>
                  <DetailValue>{guestsText}</DetailValue>
                </DetailContent>
                <EditButton type="button" onClick={() => (onEditGuests ?? onClose)()}>Edit</EditButton>
              </DetailRow>
            </InfoCard>

            {/* Total Card - Specific Design */}
            <TotalSummaryCard>
              <div className="top-row">
                <div className="label-wrap">
                  <span className="label">Total</span>
                  <span className="label-sub">includes taxes</span>
                </div>
                <span className="value">
                  {total === 0 ? (
                    "Free"
                  ) : (
                    <NumberFlow
                      value={total}
                      format={{ style: "currency", currency: currency || "CAD" }}
                    />
                  )}
                </span>
              </div>
              <ViewDetailsButton type="button" onClick={() => setPriceOpen(true)}>
                View details
              </ViewDetailsButton>
            </TotalSummaryCard>

            <PolicySection>
              <div style={{ display: "flex", gap: 10 }}>
                 <Shield size={20} style={{ color: "#4b5563", flexShrink: 0 }} />
                 <div>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: 15, marginBottom: 4 }}>
                        Free cancellation
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px" }}>
                      <PolicyText style={{ marginBottom: 0 }}>Cancel before the start time for a full refund.</PolicyText>
                      <PolicyLink onClick={() => setPolicyOpen(true)}>Full policy</PolicyLink>
                    </div>
                 </div>
              </div>
            </PolicySection>
          </DrawerBody>

          <DrawerFooter>
            <NextButton type="button" onClick={handleNext}>
              Next
            </NextButton>
          </DrawerFooter>

            {/* NESTED DRAWER: Price Details */}
            <Drawer.Root open={priceOpen} onOpenChange={setPriceOpen}>
                <Drawer.Portal>
                    <NestedDrawerOverlay />
                    <NestedDrawerContent>
                        <DrawerHandle />
                        <DrawerBody>
                            <SheetTitle>Price details</SheetTitle>
                            
                            <PriceRow>
                                <span>{participants} {participants > 1 ? "Guests" : "Guest"} x <NumberFlow value={pricePer} format={{ style: "currency", currency }} /></span>
                                <span><NumberFlow value={subtotal} format={{ style: "currency", currency }} /></span>
                            </PriceRow>
                            <PriceRow>
                                <span>HST (13%)</span>
                                <span><NumberFlow value={taxAmount} format={{ style: "currency", currency }} /></span>
                            </PriceRow>
                            <PriceRow className="total">
                                <span>Total</span>
                                <span><NumberFlow value={total} format={{ style: "currency", currency }} /></span>
                            </PriceRow>
                        </DrawerBody>
                    </NestedDrawerContent>
                </Drawer.Portal>
            </Drawer.Root>

            {/* NESTED DRAWER: Policy Details */}
            <Drawer.Root open={policyOpen} onOpenChange={setPolicyOpen}>
                <Drawer.Portal>
                    <NestedDrawerOverlay />
                    <NestedDrawerContent>
                        <DrawerHandle />
                        <DrawerBody>
                            <SheetTitle>Cancellation Policy</SheetTitle>
                            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                                {cancellationPolicyText}
                            </div>
                        </DrawerBody>
                    </NestedDrawerContent>
                </Drawer.Portal>
            </Drawer.Root>
        </DrawerContent>
      </Drawer.Portal>
    </Drawer.Root>
  );
}