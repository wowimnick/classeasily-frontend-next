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
  UserCheck, // MODIFICATION: Added icon for minimum participants
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
  border: "#dddddd",
  borderLight: "#f0f0f0",
  background: "#f7f7f7",
  white: "#ffffff",
  success: "#00a96f",
  successLight: "#f0fdf9",
};

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

const SelectedSlotConfirmation = styled(motion.div)`
  margin-top: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, ${theme.successLight} 0%, #f8fffe 100%);
  border: 1px solid ${theme.success}22;
  border-radius: 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 169, 111, 0.08);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${theme.success};
    border-radius: 0 2px 2px 0;
  }

  @media (max-width: 959px) {
    margin: 16px;
    margin-top: 16px;
    padding: 16px 18px;
    border-radius: 12px;
  }
`;

const ConfirmationIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: ${theme.success};
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
`;

const ConfirmationIcon = styled(CheckCircle)`
  color: white;
  width: 14px;
  height: 14px;
`;

const ConfirmationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConfirmationTitle = styled.div`
  color: ${theme.success};
  font-weight: 600;
  font-size: 14px;
  line-height: 1.3;
  margin-bottom: 4px;
`;

const ConfirmationDetails = styled.div`
  color: #065f46;
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.9;
`;

const TimeSlotsWrapper = styled.div`
  align-self: flex-start;
  width: 100%;

  @media (min-width: 960px) {
    position: sticky;
  }
`;

const TimeSlotsContainer = styled(motion.div)`
  background: ${theme.white};
  border-radius: 16px;
  border: 1px solid ${theme.borderLight};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 16px;
  overflow-y: auto;

  max-height: 425px;

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

  @media (min-width: 768px) {
    padding: 24px;
  }

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
    padding: 0;
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
    `
    color: ${theme.textPrimary};
    font-weight: 600;

    &::after {
      content: '';
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
    `
    background-color: ${theme.primary};
    color: ${theme.white};
    font-weight: 700;
    &::after {
      background-color: ${theme.white};
    }
  `}

  ${(props) =>
    props.$isToday &&
    `
    border: 1px solid ${theme.primary};
  `}
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
  border-radius: 16px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  width: 100%;
  text-align: left;
  font-family: inherit;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${theme.primary};
  }

  ${(props) =>
    props.$selected &&
    css`
      border-color: ${theme.primary};
      background: ${theme.primaryLight};
    `}
`;

const TimeSlotHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
`;

const TimeText = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.textPrimary};
  line-height: 1.2;
`;

const PriceTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${theme.primary};
  font-weight: 700;
  font-size: 16px;
  background: ${theme.white};
  padding: 6px 12px;
  border-radius: 8px;
`;

const TimeSlotMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px; /* Added margin for spacing */
  position: relative;
  z-index: 2;
  flex-wrap: wrap; /* Allow wrapping on small screens */
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${theme.textSecondary};
  font-size: 13px;
  font-weight: 500;

  svg {
    width: 16px;
    height: 16px;
    opacity: 0.8;
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

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  padding: 8px;
  line-height: 1;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #ff4757;
    color: white;
  }
`;

const TimeSlotsContentArea = styled.div`
  padding: 0px;
  overflow-y: visible;
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

  @media (max-width: 959px) {
    padding: 20px;
  }
`;

const CalendarStep = ({
  optionId,
  bookingData,
  onUpdate,
  selectedOption,
  businessTimeZone,
  userTimeZone,
  initialDate,
}) => {
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

  // And keep the useEffect as is - it will update after hydration
  useEffect(() => {
    setIsMobile(window.innerWidth <= 959);
  }, []);

  // Handle window resize
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

      // FIX: Safe window access for mobile
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

      const updatePayload = {
        selectedSlots: [
          {
            id: slotFromApi.instance_id,
            date: naiveDateForSlot,
            time: slotFromApi.time,
            available_spots: slotFromApi.available_spots,
            price: slotFromApi.price,
            duration: slotFromApi.duration,
            isCourse: false,
            minParticipants: slotFromApi.min_participants,
          },
        ],
        participants:
          slotFromApi.min_participants > 1 ? slotFromApi.min_participants : 1,
      };

      onUpdate(updatePayload);

      if (isMobile) {
        setShowTimeSlots(false);
      }
    },
    [selectedDate, onUpdate, isMobile]
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

  // FIX: Safe window access for mobile animations
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
                  variants={
                    isMobile
                      ? mobileTimeSlotsVariants
                      : desktopTimeSlotsVariants
                  }
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {isMobile && showTimeSlots && (
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
                  )}

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
                            {slotsForSelectedDate.map((slot, index) => (
                              <TimeSlotButton
                                key={slot.instance_id}
                                $selected={
                                  currentSelectedSlot?.id === slot.instance_id
                                }
                                onClick={() => handleSlotSelect(slot)}
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
                                    <Clock size={16} />
                                    {getDurationText(slot.duration)}
                                  </MetaItem>
                                  <MetaItem>
                                    <Users size={16} />
                                    {slot.available_spots} spots left
                                  </MetaItem>
                                  {/* --- MODIFICATION START --- */}
                                  {slot.min_participants > 1 && (
                                    <MetaItem>
                                      <UserCheck size={16} />
                                      Minimum {slot.min_participants} people
                                    </MetaItem>
                                  )}
                                  {/* --- MODIFICATION END --- */}
                                </TimeSlotMeta>
                              </TimeSlotButton>
                            ))}
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
