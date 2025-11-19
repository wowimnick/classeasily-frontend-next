import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "antd";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  AlertCircle,
  DollarSign,
  Calendar as CalendarIcon,
  ServerCrash,
  ArrowLeft,
  CheckCircle,
  UserCheck,
  Minus,
  Plus,
} from "lucide-react";

import { scheduleService } from "@/services/apiService";
import { getDurationText } from "./utils";
import {
  formatTimeRangeForDisplay,
  formatNaiveDate,
  getLocalYYYYMMDD,
} from "@/services/utils";

// --- UI & Colors ---
const theme = {
  primary: "#ff385c",
  primaryLight: "#fff8f9",
  textPrimary: "#222222",
  textSecondary: "#717171",
  textOnPrimary: "#ffffff",
  border: "#dddddd",
  borderLight: "#f0f0f0",
  background: "#f7f7f7",
  white: "#ffffff",
  success: "#00a96f",
  successLight: "#f0fdf9",
};

// --- Participant Stepper ---
const StepperContainer = styled.div`
  display: flex;
  align-items: stretch;
  border-radius: 999px;
  border: 1px solid ${theme.border};
  background: ${theme.white};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: ${theme.primary};
  }
`;

const StepperButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
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
  font-size: 16px;
  font-weight: 600;
  color: ${theme.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  text-align: center;
`;
// --- End Participant Stepper ---

// --- Popup Footer ---
const PopupFooter = styled(motion.div)`
  padding: 16px 20px;
  border-top: 1px solid ${theme.borderLight};
  background: ${theme.white};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
`;

const PopupButton = styled(motion.button)`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  ${(props) =>
    props.$primary
      ? `
    background: ${theme.primary};
    color: ${theme.white};
    
    &:hover:not(:disabled) {
      background: #e31c5f;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `
      : `
    background: transparent;
    color: ${theme.textSecondary};
    
    &:hover:not(:disabled) {
      background: ${theme.background};
    }
  `}
`;
// --- End Popup Footer ---

// --- Styled Components ---

const StepWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 960px) {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: flex-start;
  }
`;

const MobileTimeSlotsHeader = styled(motion.div)`
  display: none;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.borderLight};
  color: ${theme.textSecondary};
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;

  @media (max-width: 959px) {
    display: flex;
  }
`;

const MobileBackButton = styled(motion.button)`
  background: transparent;
  border: none;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.textSecondary};
  transition: color 0.2s ease;
  border-radius: 6px;

  &:hover {
    color: ${theme.primary};
  }
`;

const CalendarWrapper = styled(motion.div)`
  background: ${theme.white};
  border-radius: 16px;
  border: 1px solid ${theme.borderLight};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
`;

const TimeSlotsWrapper = styled.div`
  align-self: flex-start;
  width: 100%;

  @media (min-width: 960px) {
    position: sticky;
    top: 1px;
  }
`;

const TimeSlotsContainer = styled(motion.div)`
  background: ${theme.white};
  border-radius: 16px;
  border: 1px solid ${theme.borderLight};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-height: 420px; /* MODIFICATION: Adjusted max-height for better balance */
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 959px) {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 20px;
    z-index: 1000;
    border-radius: 20px;
    max-height: none;
    height: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }
`;

const CalendarHeader = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${theme.borderLight};
`;

const MonthTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${theme.textPrimary};
  text-align: center;
  flex-grow: 1;
`;

const NavButton = styled(motion.button)`
  background: ${theme.white};
  border: 1px solid ${theme.border};
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.textSecondary};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${theme.primary};
    color: ${theme.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DaysGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const WeekDay = styled.div`
  padding: 12px 0;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: ${theme.textSecondary};
`;

const DayCell = styled(motion.button)`
  padding: 8px 0;
  border: none;
  background: transparent;
  text-align: center;
  cursor: pointer;
  position: relative;
  font-family: inherit;

  &:disabled {
    cursor: not-allowed;
  }
`;

const DayNumber = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin: 0 auto;
  font-weight: 500;
  color: ${theme.textSecondary};
  transition: all 0.2s ease;
  position: relative;

  ${(props) => !props.$isInMonth && `opacity: 0.4;`}
  ${(props) =>
    props.$isDisabled &&
    `color: ${theme.border}; text-decoration: line-through;`}

  ${(props) =>
    props.$hasSlots &&
    !props.$isDisabled &&
    css`
      color: ${theme.textPrimary};
      font-weight: 600;

      &::after {
        content: "";
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: ${theme.primary};
      }
    `}

  ${DayCell}:hover:not(:disabled) & {
    ${(props) =>
      !props.$isSelected && `background-color: ${theme.primaryLight};`}
  }

  ${(props) =>
    props.$isSelected &&
    css`
      background-color: ${theme.primary};
      color: ${theme.textOnPrimary};
      font-weight: 700;
      &::after {
        background-color: ${theme.textOnPrimary};
      }
    `}

  ${(props) => props.$isToday && `border: 1px solid ${theme.primary};`}
`;

const TimeSlotsList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TimeSlotButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  padding: 14px;
  background: ${theme.white};
  border: 1px solid ${theme.borderLight};
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  width: 100%;
  text-align: left;
  font-family: inherit;
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    border-color: ${theme.primary};
  }

  &:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
    opacity: 0.7;
    &:hover {
      border-color: ${theme.borderLight};
    }
  }

  ${(props) =>
    props.$selected &&
    css`
      border-color: ${theme.primary};
      background: #ff385c1a; /* Match widget subtle pink */
    `}
`;

const TimeSlotHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TimeText = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.textPrimary};
`;

const PriceTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${theme.textPrimary};
  font-weight: 700;
  font-size: 16px;
`;

const TimeSlotMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${theme.textSecondary};
  font-size: 13px;
  font-weight: 500;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Overlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const TimeSlotsHeader = styled.h4`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${theme.textPrimary};
`;

const MessageContainer = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${theme.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1; /* Grow to fill space */
  justify-content: center;

  svg {
    color: ${theme.border};
  }
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const MobileBackdrop = styled(motion.div)`
  display: none;

  @media (max-width: 959px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    z-index: 999;
  }
`;

const TimeSlotsContentArea = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.border};
    border-radius: 3px;
  }
`;

const ParticipantSelectorContainer = styled(motion.div)`
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid ${theme.borderLight};
  background-color: #fcfcfc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden; /* MODIFICATION: Clip content during animation */
`;

const ParticipantLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.textSecondary};
`;

const CalendarStep = ({
  optionId,
  bookingData,
  onUpdate,
  selectedOption,
  businessTimeZone,
  userTimeZone,
  initialDate,
  onNext, // Added for Continue button functionality
}) => {
  console.log("📅 [CalendarStep] RENDER START", {
    optionId,
    hasBookingData: !!bookingData,
    participants: bookingData?.participants,
    selectedSlotsCount: bookingData?.selectedSlots?.length || 0,
    hasSelectedOption: !!selectedOption,
    businessTimeZone,
    userTimeZone,
    initialDate,
    timestamp: new Date().toISOString()
  });

  // --- Participant Stepper Component (React version) ---
  const ParticipantStepper = ({ value = 1, min = 1, max = Infinity }) => {
    const handleUpdate = (newValue) => {
      if (newValue >= min && newValue <= max) {
        onUpdate({ participants: newValue });
      }
    };

    return (
      <StepperContainer>
        <StepperButton
          disabled={value <= min}
          onClick={() => handleUpdate(value - 1)}
        >
          <Minus size={16} strokeWidth={3} />
        </StepperButton>
        <NumberDisplay>{value}</NumberDisplay>
        <StepperButton
          disabled={value >= max}
          onClick={() => handleUpdate(value + 1)}
        >
          <Plus size={16} strokeWidth={3} />
        </StepperButton>
      </StepperContainer>
    );
  };
  // --- End Participant Stepper ---

  const getInitialDateObj = useCallback(() => {
    if (initialDate) {
      const [year, month, day] = initialDate.split("-").map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    return null;
  }, [initialDate]);

  const [currentDate, setCurrentDate] = useState(
    getInitialDateObj() || new Date()
  );
  const [selectedDate, setSelectedDate] = useState(getInitialDateObj());
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [clickedDayPosition, setClickedDayPosition] = useState({ x: 0, y: 0 });
  const abortControllerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 959);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 959;
      setIsMobile(newIsMobile);
      if (!newIsMobile) {
        setShowTimeSlots(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentSelectedSlot = useMemo(
    () => bookingData.selectedSlots[0] || null,
    [bookingData.selectedSlots]
  );

  const displayUserTimeZone = useMemo(
    () => userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    [userTimeZone]
  );

  const displayBusinessTimeZone = useMemo(
    () => businessTimeZone || selectedOption?.business_timezone || "Etc/UTC",
    [businessTimeZone, selectedOption]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const fetchMonthSlots = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const startDateStr = getLocalYYYYMMDD(firstDayOfMonth);
      const endDateStr = getLocalYYYYMMDD(lastDayOfMonth);

      if (!startDateStr || !endDateStr) {
        throw new Error("Could not generate valid dates for fetching slots.");
      }

      const response = await scheduleService.getAvailabilityForOption(
        optionId,
        {
          start_date: startDateStr,
          end_date: endDateStr,
        }
      );

      if (signal.aborted) return;
      setAvailableSlots((prevSlots) => ({ ...prevSlots, ...(response || {}) }));
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching slots:", err);
        setError("Could not load available times. Please try again later.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [optionId, currentDate]);

  useEffect(() => {
    if (optionId) {
      fetchMonthSlots();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMonthSlots, optionId]);

  useEffect(() => {
    if (currentSelectedSlot && currentSelectedSlot.date) {
      const [year, month, day] = currentSelectedSlot.date
        .split("-")
        .map(Number);
      const slotDateObj = new Date(year, month - 1, day);
      if (selectedDate?.getTime() !== slotDateObj.getTime()) {
        setSelectedDate(slotDateObj);
        if (
          slotDateObj.getFullYear() !== currentDate.getFullYear() ||
          slotDateObj.getMonth() !== currentDate.getMonth()
        ) {
          setCurrentDate(new Date(slotDateObj));
        }
      }
    }
  }, [currentSelectedSlot, selectedDate, currentDate]);

  const handleDateClick = useCallback(
    (dateFromCell, event) => {
      setSelectedDate(dateFromCell);
      const naiveDateClicked = getLocalYYYYMMDD(dateFromCell);
      if (
        !currentSelectedSlot ||
        currentSelectedSlot.date !== naiveDateClicked
      ) {
        onUpdate({ selectedSlots: [] });
      }

      if (isMobile && event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setClickedDayPosition({ x: centerX, y: centerY });
        setShowTimeSlots(true);
      }
    },
    [currentSelectedSlot, onUpdate, isMobile]
  );

  const handleSlotSelect = useCallback(
    (slotFromApi) => {
      if (!selectedDate) return;

      const naiveDateForSlot = getLocalYYYYMMDD(selectedDate);
      const currentParticipants = bookingData.participants || 1;

      // Clamp current participants between the selected slot's min requirement and available spots
      let updatedParticipants = Math.max(
        currentParticipants,
        slotFromApi.min_participants
      );
      updatedParticipants = Math.min(
        updatedParticipants,
        slotFromApi.available_spots
      );

      const slotData = {
        id: slotFromApi.instance_id,
        date: naiveDateForSlot,
        time: slotFromApi.time,
        available_spots: slotFromApi.available_spots,
        price: slotFromApi.price,
        duration: slotFromApi.duration,
        isCourse: false,
        minParticipants: slotFromApi.min_participants,
      };

      const updatePayload = {
        selectedSlots: [slotData],
        participants: updatedParticipants,
      };

      onUpdate(updatePayload);

      if (isMobile) {
        // On mobile, we keep the timeslot view open to allow participant changes
      }
    },
    [selectedDate, onUpdate, isMobile, bookingData.participants]
  );

  const handleMonthChange = useCallback((direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction, 1);
      return newDate;
    });
  }, []);

  const handleBackToCalendar = () => {
    setShowTimeSlots(false);
  };

  const handleContinue = () => {
    if (currentSelectedSlot && bookingData.participants) {
      // Close the popup
      if (isMobile) {
        setShowTimeSlots(false);
        // Wait for exit animation to complete before advancing step (250ms + buffer)
        setTimeout(() => {
          onNext();
        }, 300);
      } else {
        // On desktop, advance immediately (no modal animation)
        onNext();
      }
    }
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonthCount = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(year, month, i - firstDay + 1),
        inMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonthCount; i++) {
      days.push({ date: new Date(year, month, i), inMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
    return days;
  }, [currentDate]);

  const naiveKeyForSelectedDate = useMemo(
    () => (selectedDate ? getLocalYYYYMMDD(selectedDate) : null),
    [selectedDate]
  );

  const slotsForSelectedDate = useMemo(
    () => availableSlots[naiveKeyForSelectedDate] || [],
    [availableSlots, naiveKeyForSelectedDate]
  );

  const mobileTimeSlotsVariants = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        initial: { scale: 0.2, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.2, opacity: 0 },
      };
    }

    return {
      initial: {
        scale: 0.2,
        opacity: 0,
        x: clickedDayPosition.x - window.innerWidth / 2,
        y: clickedDayPosition.y - window.innerHeight / 2,
        borderRadius: "50px",
      },
      animate: {
        scale: 1,
        opacity: 1,
        x: 0,
        y: 0,
        borderRadius: "20px",
        transition: {
          type: "spring",
          damping: 25,
          stiffness: 300,
          duration: 0.4,
        },
      },
      exit: {
        scale: 0.2,
        opacity: 0,
        x: clickedDayPosition.x - window.innerWidth / 2,
        y: clickedDayPosition.y - window.innerHeight / 2,
        borderRadius: "50px",
        transition: {
          duration: 0.25,
          ease: "easeIn",
        },
      },
    };
  }, [clickedDayPosition]);

  // Simplified animation variants
  const calendarVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "linear",
      },
    },
  };

  const dayGridVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.01,
        delayChildren: 0.1,
        ease: "linear",
      },
    },
  };

  const dayVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "linear",
      },
    },
  };

  const desktopTimeSlotsVariants = {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "linear",
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
        ease: "linear",
      },
    },
  };

  return (
    <StepWrapper>
      <ContentGrid>
        <div>
          <CalendarWrapper
            variants={calendarVariants}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence>
              {loading && (
                <Overlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 0.2,
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      border: `3px solid ${theme.primaryLight}`,
                      borderTopColor: theme.primary,
                      borderRadius: "50%",
                    }}
                  />
                </Overlay>
              )}
            </AnimatePresence>
            <CalendarHeader
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: "linear" }}
            >
              <NavButton
                onClick={() => handleMonthChange(-1)}
                disabled={
                  loading ||
                  (currentDate.getFullYear() === today.getFullYear() &&
                    currentDate.getMonth() === today.getMonth())
                }
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </NavButton>
              <MonthTitle>
                {formatNaiveDate(getLocalYYYYMMDD(currentDate), "MMMM yyyy")}
              </MonthTitle>
              <NavButton
                onClick={() => handleMonthChange(1)}
                disabled={loading}
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </NavButton>
            </CalendarHeader>
            <DaysGrid>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <WeekDay key={day}>{day}</WeekDay>
              ))}
            </DaysGrid>
            <DaysGrid
              variants={dayGridVariants}
              initial="initial"
              animate="animate"
            >
              {daysInMonth.map(({ date, inMonth }, index) => {
                const naiveDateStr = getLocalYYYYMMDD(date);
                const isPast = date < today;
                const isDisabled = !inMonth || isPast;
                const hasSlots = availableSlots[naiveDateStr]?.length > 0;
                const isSelected = naiveKeyForSelectedDate === naiveDateStr;
                const isToday = date.getTime() === today.getTime();

                return (
                  <DayCell
                    key={index}
                    disabled={isDisabled || (!hasSlots && inMonth)}
                    onClick={(e) => handleDateClick(date, e)}
                    aria-label={`${formatNaiveDate(
                      naiveDateStr,
                      "MMMM d, yyyy"
                    )}${hasSlots ? ", available" : ""}${
                      isSelected ? ", selected" : ""
                    }`}
                    variants={dayVariants}
                  >
                    <DayNumber
                      $isInMonth={inMonth}
                      $isDisabled={isDisabled}
                      $isSelected={isSelected}
                      $isToday={isToday}
                      $hasSlots={hasSlots}
                    >
                      {date.getDate()}
                    </DayNumber>
                  </DayCell>
                );
              })}
            </DaysGrid>
          </CalendarWrapper>
        </div>

        <TimeSlotsWrapper>
          <AnimatePresence>
            {(!isMobile || showTimeSlots) && (
              <>
                {isMobile && showTimeSlots && (
                  <MobileBackdrop
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleBackToCalendar}
                  />
                )}
                <TimeSlotsContainer
                  key="timeslots-container"
                  variants={
                    isMobile
                      ? mobileTimeSlotsVariants
                      : desktopTimeSlotsVariants
                  }
                  initial={isMobile ? "initial" : false}
                  animate={isMobile ? "animate" : false}
                  exit={isMobile ? "exit" : undefined}
                  transition={
                    isMobile
                      ? { type: "spring", stiffness: 400, damping: 40 }
                      : undefined
                  }
                >
                  <MobileTimeSlotsHeader
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: "linear" }}
                  >
                    <MobileBackButton onClick={handleBackToCalendar}>
                      <ArrowLeft size={18} />
                    </MobileBackButton>
                    <span>Step 2: Select Time</span>
                  </MobileTimeSlotsHeader>

                  <TimeSlotsContentArea>
                    <TimeSlotsHeader>
                      {selectedDate
                        ? `Available on ${formatNaiveDate(
                            naiveKeyForSelectedDate,
                            "EEEE, MMMM d"
                          )}`
                        : "Select a date"}
                    </TimeSlotsHeader>
                    <AnimatePresence mode="wait">
                      {loading && !error && (
                        <TimeSlotsList key="loading">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton.Input
                              key={i}
                              active
                              style={{
                                height: "80px",
                                width: "100%",
                                borderRadius: "12px",
                              }}
                            />
                          ))}
                        </TimeSlotsList>
                      )}
                      {!loading && error && (
                        <MessageContainer key="error">
                          <ServerCrash size={40} />
                          <p>{error}</p>
                        </MessageContainer>
                      )}
                      {!loading &&
                        !error &&
                        selectedDate &&
                        (slotsForSelectedDate.length > 0 ? (
                          <TimeSlotsList
                            key="slots"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ ease: "linear" }}
                          >
                            {slotsForSelectedDate.map((slot, index) => {
                              const isSelected =
                                currentSelectedSlot?.id === slot.instance_id;
                              const isDisabled =
                                slot.available_spots < bookingData.participants;

                              return (
                                <TimeSlotButton
                                  key={slot.instance_id}
                                  $selected={isSelected}
                                  onClick={() => handleSlotSelect(slot)}
                                  disabled={isDisabled}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                      delay: index * 0.03,
                                      ease: "linear",
                                      duration: 0.2,
                                    },
                                  }}
                                >
                                  <TimeSlotHeader>
                                    <TimeText>
                                      {formatTimeRangeForDisplay(
                                        naiveKeyForSelectedDate,
                                        slot.time,
                                        slot.duration,
                                        displayBusinessTimeZone,
                                        displayUserTimeZone
                                      )}
                                    </TimeText>
                                    <PriceTag>
                                      <DollarSign size={14} />
                                      {parseFloat(slot.price).toFixed(2)}
                                    </PriceTag>
                                  </TimeSlotHeader>
                                  <TimeSlotMeta>
                                    <MetaItem>
                                      <Clock />
                                      {getDurationText(slot.duration)}
                                    </MetaItem>
                                    <MetaItem>
                                      <Users />
                                      {slot.available_spots} spots left
                                    </MetaItem>
                                    {slot.min_participants > 1 && (
                                      <MetaItem>
                                        <UserCheck />
                                        Min {slot.min_participants} people
                                      </MetaItem>
                                    )}
                                  </TimeSlotMeta>
                                  {isDisabled && !isSelected && (
                                    <MetaItem
                                      style={{
                                        color: theme.primary,
                                        marginTop: "8px",
                                      }}
                                    >
                                      <AlertCircle size={16} />
                                      Not enough spots available
                                    </MetaItem>
                                  )}
                                </TimeSlotButton>
                              );
                            })}
                          </TimeSlotsList>
                        ) : (
                          <MessageContainer key="no-slots">
                            <CalendarIcon size={40} />
                            <p>No available times for this day.</p>
                          </MessageContainer>
                        ))}
                      {!loading && !error && !selectedDate && (
                        <MessageContainer key="no-date">
                          <CalendarIcon size={40} />
                          <p>
                            Select an available date on the calendar to see
                            times.
                          </p>
                        </MessageContainer>
                      )}
                    </AnimatePresence>
                  </TimeSlotsContentArea>
                  <AnimatePresence>
                    {currentSelectedSlot && (
                      <ParticipantSelectorContainer
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ParticipantLabel>Participants</ParticipantLabel>
                        <ParticipantStepper
                          value={bookingData.participants}
                          min={Math.max(1, currentSelectedSlot.minParticipants)}
                          max={currentSelectedSlot.available_spots}
                        />
                      </ParticipantSelectorContainer>
                    )}
                  </AnimatePresence>

                  {/* Popup Footer with Continue Button */}
                  <AnimatePresence>
                    {currentSelectedSlot && (
                      <PopupFooter
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PopupButton
                          $primary
                          onClick={handleContinue}
                          disabled={
                            !currentSelectedSlot || !bookingData.participants
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Continue
                          <ChevronRight size={18} />
                        </PopupButton>
                      </PopupFooter>
                    )}
                  </AnimatePresence>
                </TimeSlotsContainer>
              </>
            )}
          </AnimatePresence>
        </TimeSlotsWrapper>
      </ContentGrid>
    </StepWrapper>
  );
};

export default CalendarStep;