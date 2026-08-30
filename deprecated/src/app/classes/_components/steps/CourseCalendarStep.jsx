import React, { useState, useEffect, useMemo, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ServerCrash,
  Minus,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { getCourseDuration } from "./utils";
import { courseService } from "@/services/apiService";
import message from "@/lib/message";
import { motion, AnimatePresence } from "framer-motion";
import { formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";

// --- UI & Colors ---
const theme = {
  primary: "#ff385c",
  primaryLight: "rgba(255, 56, 92, 0.05)",
  textPrimary: "#222222",
  textSecondary: "#717171",
  success: "#00a96f",
  border: "#e5e7eb",
  white: "#ffffff",
  bg: "#f9fafb",
};

// --- Shimmer Animation ---
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  overflow-x: hidden;
  padding: 1px;
`;

const InfoBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f0f9ff;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #bae6fd;

  svg {
    color: #0284c7;
    flex-shrink: 0;
    margin-top: 2px;
    width: 18px;
    height: 18px;
  }

  div {
    font-size: 13px;
    color: #0369a1;
    line-height: 1.4;
    
    strong {
      display: block;
      margin-bottom: 2px;
      font-weight: 600;
    }
  }
`;

const CourseGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  @media (min-width: 640px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// --- NEW CARD DESIGN ---
const CardWrapper = styled(motion.button)`
  display: flex;
  flex-direction: column;
  background: ${theme.white};
  border: 1px solid ${(props) => (props.$selected ? theme.primary : theme.border)};
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;
  padding: 0;
  
  ${(props) =>
    props.$selected &&
    css`
      background: #fff0f3;
      box-shadow: 0 0 0 1px ${theme.primary};
    `}

  &:hover:not(:disabled) {
    border-color: ${theme.primary};
    box-shadow: 0 8px 16px rgba(0,0,0,0.06);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f9fafb;
    border-color: #f0f0f0;
  }
`;

const MainContent = styled.div`
  display: flex;
  width: 100%;
  padding: 16px;
  gap: 16px;
  align-items: stretch;
`;

const DateSheet = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 64px;
  background: ${(props) => (props.$selected ? theme.primary : "#f3f4f6")};
  border-radius: 12px;
  color: ${(props) => (props.$selected ? theme.white : theme.textPrimary)};
  flex-shrink: 0;

  .month {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
    opacity: 0.9;
  }

  .day {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    margin-top: 2px;
  }
`;

const DetailsColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  gap: 6px;
`;

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textPrimary};
  
  svg {
    width: 14px;
    height: 14px;
    color: ${theme.textSecondary};
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${theme.textSecondary};
`;

const PriceTag = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 15px;
  font-weight: 700;
  color: ${(props) => (props.$selected ? theme.primary : theme.textPrimary)};
`;

const ParticipantArea = styled(motion.div)`
  background: ${(props) => (props.$selected ? "rgba(255, 255, 255, 0.6)" : "#fafafa")};
  border-top: 1px solid rgba(0,0,0,0.05);
  padding: 0 16px 16px 16px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StepperWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid ${theme.border};
  border-radius: 8px;
  padding: 4px;
  margin-top: 12px;
  margin-left: auto;
`;

const StepBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: ${(props) => (props.disabled ? "#f3f4f6" : theme.primaryLight)};
  color: ${(props) => (props.disabled ? "#d1d5db" : theme.primary)};
  border-radius: 6px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${theme.primary};
    color: white;
  }
`;

const Count = styled.span`
  font-size: 15px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
`;

// --- NEW SKELETON WITH SHIMMER ---
const SkeletonCard = styled.div`
  background: white;
  border: 1px solid ${theme.border};
  border-radius: 16px;
  display: flex;
  padding: 16px;
  gap: 16px;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

// The moving gradient
const ShimmerBlock = styled.div`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 1000px 100%; 
  animation: ${shimmer} 2s infinite linear;
  border-radius: ${(props) => props.$radius || "4px"};
  width: ${(props) => props.$w || "100%"};
  height: ${(props) => props.$h || "12px"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

const DetailedSkeleton = () => (
  <SkeletonCard>
    {/* Left: Date Sheet Skeleton */}
    <ShimmerBlock $w="64px" $h="64px" $radius="12px" style={{ flexShrink: 0 }} />

    {/* Middle: Details */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <ShimmerBlock $w="40%" $h="14px" />
      <ShimmerBlock $w="60%" $h="12px" />
      <ShimmerBlock $w="50%" $h="12px" />
    </div>

    {/* Right: Price Badge */}
    <ShimmerBlock
      $w="50px"
      $h="16px"
      style={{ position: 'absolute', top: '16px', right: '16px' }}
    />
  </SkeletonCard>
);

const ErrorContainer = styled.div`
  padding: 32px;
  text-align: center;
  background: #fff;
  border: 1px dashed ${theme.border};
  border-radius: 16px;
  color: ${theme.textSecondary};
  
  h4 { margin: 8px 0 4px; color: ${theme.textPrimary}; }
  p { font-size: 14px; margin: 0; }
`;

const CourseCalendarStep = ({
  optionId,
  bookingData,
  onUpdate,
  classData,
  userTimeZone,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseSlots, setCourseSlots] = useState([]);
  const hasFetchedRef = useRef(false);

  const selectedSlot = useMemo(
    () => bookingData.selectedSlots[0] || null,
    [bookingData.selectedSlots]
  );

  useEffect(() => {
    const fetchCourseSchedules = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await courseService.getPublicCourses({
          class_id: classData.classId,
        });

        if (response.success) {
          const relevantSlots = response.data.filter(
            (slot) => slot.option === optionId
          );
          relevantSlots.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
          setCourseSlots(relevantSlots);
        } else {
          const errMsg = response.error || "Could not load schedules.";
          setError(errMsg);
          message.error("Whoops! We couldn't load schedules. Please try again.");
        }
      } catch (err) {
        setError("Unable to load schedules.");
        message.error("Whoops! Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (optionId && classData?.classId) {
      fetchCourseSchedules();
    } else {
      setLoading(false);
    }
  }, [optionId, classData?.classId]);

  const handleSlotSelect = (slot) => {
    const formattedSlot = {
      ...slot,
      date: slot.start_date,
      isCourse: true
    };

    let updatedParticipants = bookingData.participants || 1;
    updatedParticipants = Math.max(updatedParticipants, slot.min_participants || 1);
    updatedParticipants = Math.min(updatedParticipants, slot.available_spots);

    onUpdate({
      selectedSlots: [formattedSlot],
      participants: updatedParticipants
    });
  };

  const updateParticipants = (delta, slot) => {
    const current = bookingData.participants;
    const next = current + delta;
    const min = Math.max(1, slot.min_participants || 1);
    const max = slot.available_spots;

    if (next >= min && next <= max) {
      onUpdate({ participants: next });
    }
  };

  if (loading) {
    return (
      <Container>
        <CourseGrid>
          {[1, 2, 3].map((i) => <DetailedSkeleton key={i} />)}
        </CourseGrid>
      </Container>
    );
  }

  if (error || courseSlots.length === 0) {
    return (
      <Container>
        <ErrorContainer>
          <ServerCrash size={32} style={{ opacity: 0.3 }} />
          <h4>No Schedules Available</h4>
          <p>{error || "Try selecting a different option or check back later."}</p>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>

      <CourseGrid>
        {courseSlots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const startDate = new Date(slot.start_date);
          const monthName = startDate.toLocaleString('default', { month: 'short' });
          const dayNumber = startDate.getDate();

          return (
            <CardWrapper
              key={slot.id}
              $selected={isSelected}
              onClick={() => handleSlotSelect(slot)}
              disabled={slot.available_spots <= 0}
              layout
            >
              <MainContent>
                <DateSheet $selected={isSelected}>
                  <span className="month">{monthName}</span>
                  <span className="day">{dayNumber}</span>
                </DateSheet>

                <DetailsColumn>
                  <TimeRow>
                    <Clock />
                    {formatTimeRangeForDisplay(
                      slot.start_date,
                      slot.time,
                      slot.duration,
                      classData.business_timezone,
                      userTimeZone
                    )}
                  </TimeRow>
                  <MetaRow>
                    <Calendar size={14} />
                    <span>Every {slot.days.join(", ")}</span>
                  </MetaRow>
                  <MetaRow>
                    <Users size={14} />
                    <span>{getCourseDuration(slot.start_date, slot.end_date)} • {slot.available_spots} spots</span>
                  </MetaRow>
                </DetailsColumn>

                <PriceTag $selected={isSelected}>
                  ${parseFloat(slot.price).toFixed(0)}
                </PriceTag>
              </MainContent>

              <AnimatePresence>
                {isSelected && (
                  <ParticipantArea
                    $selected={isSelected}
                    initial={{ height: 0, opacity: 0, paddingBottom: 0 }}
                    animate={{ height: "auto", opacity: 1, paddingBottom: 16 }}
                    exit={{ height: 0, opacity: 0, paddingBottom: 0 }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '16px' }}>
                      Participants
                    </div>
                    <StepperWrapper onClick={(e) => e.stopPropagation()}>
                      <StepBtn
                        type="button"
                        disabled={bookingData.participants <= (slot.min_participants || 1)}
                        onClick={() => updateParticipants(-1, slot)}
                      >
                        <Minus size={16} />
                      </StepBtn>
                      <Count>{bookingData.participants}</Count>
                      <StepBtn
                        type="button"
                        disabled={bookingData.participants >= slot.available_spots}
                        onClick={() => updateParticipants(1, slot)}
                      >
                        <Plus size={16} />
                      </StepBtn>
                    </StepperWrapper>
                  </ParticipantArea>
                )}
              </AnimatePresence>
            </CardWrapper>
          );
        })}
      </CourseGrid>
    </Container>
  );
};

export default CourseCalendarStep;