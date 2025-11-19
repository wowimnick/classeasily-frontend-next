
import React, { useState, useEffect, useMemo, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ServerCrash,
  DollarSign,
  Minus,
  Plus,
} from "lucide-react";
import { getCourseDuration } from "./utils";
import { courseService } from "@/services/apiService";
import { motion, AnimatePresence } from "framer-motion";
import { formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";

// --- UI & Colors ---
const theme = {
  primary: "#ff385c",
  primaryLight: "rgba(255, 56, 92, 0.08)",
  textPrimary: "#222222",
  textSecondary: "#717171",
  success: "#00a96f",
  border: "#e0e0e0",
  borderLight: "#f0f0f0",
  background: "#f7f7f7",
  white: "#ffffff",
};

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

// --- Main Container ---
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

// --- Info Banner ---
const InfoBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f0f7ff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #bfdaff;

  svg {
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }

  h4 {
    margin: 0 0 4px 0;
    font-weight: 600;
    color: #1e40af;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #3b82f6;
    line-height: 1.5;
  }
`;

// --- Course Grid (Responsive 1-3 cols) ---
const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  /* Align items to start so neighbors don't stretch vertically when one expands */
  align-items: flex-start; 

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// --- Course Card ---
const CourseCard = styled(motion.button)`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: ${theme.white};
  border: 1px solid ${(props) => (props.$selected ? theme.primary : theme.border)};
  border-radius: 16px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  text-align: left;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden; /* Keeps layout clean during animation */

  &:hover:not(:disabled) {
    border-color: ${theme.primary};
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  }

  ${(props) =>
    props.$selected &&
    `
    background: ${theme.primaryLight};
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f9fafb;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
  width: 100%;
`;

const DateInfo = styled.div`
  h4 {
    margin: 0 0 2px 0;
    font-size: 18px;
    font-weight: 600;
    color: ${theme.textPrimary};
  }
  span {
    font-size: 14px;
    color: ${theme.textSecondary};
  }
`;

const Price = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 20px;
  font-weight: 700;
  color: ${theme.primary};
  flex-shrink: 0;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  width: 100%;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${theme.textPrimary};
  svg {
    color: ${theme.textSecondary};
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

// --- Skeleton Styles ---
const SkeletonCard = styled.div`
  padding: 20px;
  background: ${theme.white};
  border: 1px solid ${theme.border};
  border-radius: 16px;
  width: 100%;
  height: 190px;
`;

const SkeletonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SkeletonBlock = styled.div`
  height: ${(props) => props.height || "20px"};
  width: ${(props) => props.width || "100%"};
  background: #e0e0e0;
  border-radius: 4px;
  margin-bottom: ${(props) => props.mb || "0"};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const CourseCardSkeleton = () => (
  <SkeletonCard>
    <SkeletonHeader>
      <div style={{ width: "60%" }}>
        <SkeletonBlock width="80%" height="24px" mb="8px" />
        <SkeletonBlock width="50%" height="16px" />
      </div>
      <SkeletonBlock width="20%" height="28px" />
    </SkeletonHeader>
    <div style={{ marginTop: "auto" }}>
      <SkeletonRow>
        <SkeletonBlock width="20px" height="20px" style={{ borderRadius: "50%" }} />
        <SkeletonBlock width="40%" height="16px" />
      </SkeletonRow>
      <SkeletonRow>
        <SkeletonBlock width="20px" height="20px" style={{ borderRadius: "50%" }} />
        <SkeletonBlock width="60%" height="16px" />
      </SkeletonRow>
      <SkeletonRow>
        <SkeletonBlock width="20px" height="20px" style={{ borderRadius: "50%" }} />
        <SkeletonBlock width="50%" height="16px" />
      </SkeletonRow>
    </div>
  </SkeletonCard>
);

const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: ${theme.textSecondary};
`;

// --- Participant Stepper Styles ---
const ParticipantSelectionArea = styled(motion.div)`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ParticipantLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.textPrimary};
`;

const StepperContainer = styled.div`
  display: flex;
  align-items: stretch;
  border-radius: 999px;
  border: 1px solid ${theme.border};
  background: ${theme.white};
  transition: border-color 0.2s;
  height: 32px;

  &:focus-within {
    border-color: ${theme.primary};
  }
`;

const StepperButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${theme.textSecondary};
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: ${theme.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const NumberDisplay = styled.div`
  padding: 0 0.5rem;
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  text-align: center;
`;

const CourseCalendarStep = ({
  optionId,
  bookingData,
  onUpdate,
  onNext,
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
          setCourseSlots(relevantSlots);
        } else {
          setError(
            response.error || "Could not load available course schedules."
          );
        }
      } catch (err) {
        setError("An error occurred. Please try again later.");
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
    if (slot.min_participants && updatedParticipants < slot.min_participants) {
      updatedParticipants = slot.min_participants;
    }
    if (slot.available_spots && updatedParticipants > slot.available_spots) {
      updatedParticipants = slot.available_spots;
    }

    onUpdate({ 
      selectedSlots: [formattedSlot],
      participants: updatedParticipants
    });
  };

  const ParticipantStepper = ({ value = 1, min = 1, max = Infinity }) => {
    const handleUpdate = (newValue) => {
      if (newValue >= min && newValue <= max) {
        onUpdate({ participants: newValue });
      }
    };

    return (
      <StepperContainer onClick={(e) => e.stopPropagation()}>
        <StepperButton
          type="button"
          disabled={value <= min}
          onClick={(e) => { e.stopPropagation(); handleUpdate(value - 1); }}
        >
          <Minus size={14} strokeWidth={3} />
        </StepperButton>
        <NumberDisplay>{value}</NumberDisplay>
        <StepperButton
          type="button"
          disabled={value >= max}
          onClick={(e) => { e.stopPropagation(); handleUpdate(value + 1); }}
        >
          <Plus size={14} strokeWidth={3} />
        </StepperButton>
      </StepperContainer>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <CourseGrid>
          {/* Render 6 skeletons to show grid layout */}
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </CourseGrid>
      );
    }

    if (error) {
      return (
        <ErrorContainer>
          <ServerCrash size={40} />
          <h4>Could Not Load Schedules</h4>
          <p>{error}</p>
        </ErrorContainer>
      );
    }

    if (courseSlots.length === 0) {
      return (
        <ErrorContainer style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}>
          <Calendar size={40} style={{ color: "#9ca3af" }} />
          <h4>No Upcoming Courses</h4>
          <p>There are no upcoming schedules for this course at the moment.</p>
        </ErrorContainer>
      );
    }

    return (
      <CourseGrid>
        {courseSlots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            
            return (
              <CourseCard
                key={slot.id}
                $selected={isSelected}
                onClick={() => handleSlotSelect(slot)}
                disabled={slot.available_spots <= 0}
                layout // Framer motion layout prop for smooth resizing
              >
                <CardHeader>
                  <DateInfo>
                    <h4>{formatNaiveDate(slot.start_date, "MMMM d")}</h4>
                    <span>to {formatNaiveDate(slot.end_date, "MMMM d, yyyy")}</span>
                  </DateInfo>
                  <Price>
                    <DollarSign size={16} />
                    {parseFloat(slot.price).toFixed(2)}
                  </Price>
                </CardHeader>
                <CardBody>
                  <DetailRow>
                    <Calendar />
                    <span>
                      Every {slot.days.join(", ")}
                    </span>
                  </DetailRow>
                  <DetailRow>
                    <Clock />
                    <span>
                      {formatTimeRangeForDisplay(
                        slot.start_date,
                        slot.time,
                        slot.duration,
                        classData.business_timezone,
                        userTimeZone
                      )}
                    </span>
                  </DetailRow>
                  <DetailRow>
                     <Users />
                     <span>
                       Total duration:{" "}
                       <strong>
                         {getCourseDuration(slot.start_date, slot.end_date)}
                       </strong>
                       <span style={{ margin: '0 4px', color: theme.border }}>•</span>
                       {slot.available_spots > 0
                         ? `${slot.available_spots} spots left`
                         : "Sold Out"}
                     </span>
                   </DetailRow>
                   
                   <AnimatePresence>
                     {isSelected && (
                       <ParticipantSelectionArea
                         initial={{ opacity: 0, height: 0, marginTop: 0 }}
                         animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                         exit={{ opacity: 0, height: 0, marginTop: 0 }}
                       >
                         <ParticipantLabel>Participants:</ParticipantLabel>
                         <ParticipantStepper
                           value={bookingData.participants}
                           min={Math.max(1, slot.min_participants || 1)}
                           max={slot.available_spots}
                         />
                       </ParticipantSelectionArea>
                     )}
                   </AnimatePresence>
                </CardBody>
              </CourseCard>
            );
        })}
      </CourseGrid>
    );
  };

  return (
    <Container>
      <InfoBanner>
        <AlertCircle size={20} />
        <div>
          <h4>Select a Course Schedule</h4>
          <p>
            Choose your preferred start date. Each course includes multiple
            sessions as detailed on the card.
          </p>
        </div>
      </InfoBanner>

      {renderContent()}
    </Container>
  );
};

export default CourseCalendarStep;