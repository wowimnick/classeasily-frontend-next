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
  max-height: 420px;
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
  text-transform: uppercase;
`;

const DayCell = styled(motion.button)`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: ${theme.primaryLight};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
`;

const DayNumber = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: all 0.2s ease;

  ${(props) =>
    props.$isSelected &&
    css`
      background: ${theme.primary};
      color: ${theme.white};
      font-weight: 600;
    `}

  ${(props) =>
    !props.$isSelected &&
    props.$isToday &&
    css`
      border: 2px solid ${theme.primary};
      color: ${theme.primary};
      font-weight: 600;
    `}

  ${(props) =>
    !props.$isSelected &&
    !props.$isToday &&
    props.$hasSlots &&
    props.$isInMonth &&
    css`
      &::after {
        content: "";
        position: absolute;
        bottom: 4px;
        width: 4px;
        height: 4px;
        background: ${theme.primary};
        border-radius: 50%;
      }
    `}

  ${(props) =>
    !props.$isInMonth &&
    css`
      color: ${theme.textSecondary};
      opacity: 0.3;
    `}
`;

const TimeSlotsContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${theme.textSecondary};
  }
`;

const TimeSlotsHeader = styled.div`
  padding: 20px;
  font-size: 16px;
  font-weight: 600;
  color: ${theme.textPrimary};
  background: ${theme.white};
  border-bottom: 1px solid ${theme.borderLight};
  flex-shrink: 0;
`;

const TimeSlotsList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  flex: 1;
`;

const TimeSlotButton = styled(motion.button)`
  background: ${(props) =>
    props.$selected ? theme.successLight : theme.white};
  border: 2px solid
    ${(props) => (props.$selected ? theme.success : theme.borderLight)};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover:not(:disabled) {
    border-color: ${(props) =>
      props.$selected ? theme.success : theme.primary};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TimeSlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TimeText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.textPrimary};
`;

const PriceTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 700;
  color: ${theme.primary};
`;

const TimeSlotMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: ${theme.textSecondary};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const MessageContainer = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
  color: ${theme.textSecondary};

  svg {
    color: ${theme.border};
  }

  p {
    margin: 0;
    font-size: 15px;
  }
`;

const MobileBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
`;

const ParticipantSelectorContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${theme.primaryLight};
  border-top: 1px solid ${theme.borderLight};
  flex-shrink: 0;
`;

const ParticipantLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textPrimary};
`;

// --- Animation Variants ---
const dayGridVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.01,
    },
  },
};

const dayVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const mobileTimeSlotsVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 40 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const desktopTimeSlotsVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// --- Main Component ---
const CalendarStep = ({
  optionId,
  bookingData,
  onUpdate,
  selectedOption,
  businessTimeZone = "Etc/UTC",
  userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  initialDate = null,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timeSlotsRef = useRef(null);

  const displayBusinessTimeZone = businessTimeZone || "Etc/UTC";
  const displayUserTimeZone =
    userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 959);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (initialDate && !selectedDate) {
      const parsedDate = new Date(initialDate + "T00:00:00");
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setCurrentMonth(parsedDate);
      }
    }
  }, [initialDate, selectedDate]);

  const fetchAvailabilityForMonth = useCallback(
    async (date) => {
      if (!optionId) return;

      setLoading(true);
      setError(null);

      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const data = await scheduleService.getAvailability(
          optionId,
          year,
          month
        );

        if (data && data.availability) {
          setAvailableSlots(data.availability);
        } else {
          setAvailableSlots({});
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
        setError("Failed to load availability. Please try again.");
        setAvailableSlots({});
      } finally {
        setLoading(false);
      }
    },
    [optionId]
  );

  useEffect(() => {
    fetchAvailabilityForMonth(currentMonth);
  }, [currentMonth, fetchAvailabilityForMonth]);

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date, event) => {
    event.stopPropagation();
    setSelectedDate(date);
    if (isMobile) {
      setShowTimeSlots(true);
    }
  };

  const handleBackToCalendar = () => {
    setShowTimeSlots(false);
  };

  const handleSlotSelect = (slot) => {
    const naiveDateStr = getLocalYYYYMMDD(selectedDate);
    onUpdate({
      selectedSlots: [
        {
          id: slot.instance_id,
          date: naiveDateStr,
          time: slot.time,
          price: parseFloat(slot.price),
          duration: slot.duration,
          available_spots: slot.available_spots,
          minParticipants: slot.min_participants || 1,
        },
      ],
    });

    // FIX: Auto-close timeslot popup on mobile after selection
    if (isMobile) {
      setTimeout(() => {
        setShowTimeSlots(false);
      }, 300);
    }
  };

  const ParticipantStepper = ({ value, min, max }) => {
    const handleDecrement = () => {
      if (value > min) {
        onUpdate({ participants: value - 1 });
      }
    };

    const handleIncrement = () => {
      if (value < max) {
        onUpdate({ participants: value + 1 });
      }
    };

    return (
      <StepperContainer>
        <StepperButton onClick={handleDecrement} disabled={value <= min}>
          <Minus size={18} />
        </StepperButton>
        <NumberDisplay>{value}</NumberDisplay>
        <StepperButton onClick={handleIncrement} disabled={value >= max}>
          <Plus size={18} />
        </StepperButton>
      </StepperContainer>
    );
  };

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInCurrentMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({ date: prevMonthDay, inMonth: false });
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      days.push({ date: new Date(year, month, day), inMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), inMonth: false });
    }

    return days;
  }, [currentMonth]);

  const naiveKeyForSelectedDate = selectedDate
    ? getLocalYYYYMMDD(selectedDate)
    : null;

  const slotsForSelectedDate = useMemo(() => {
    if (!naiveKeyForSelectedDate) return [];
    return availableSlots[naiveKeyForSelectedDate] || [];
  }, [naiveKeyForSelectedDate, availableSlots]);

  const currentSelectedSlot = useMemo(() => {
    if (!bookingData?.selectedSlots?.[0]) return null;
    const {
      id,
      date,
      time,
      price,
      duration,
      available_spots,
      minParticipants,
    } = bookingData.selectedSlots[0];
    return {
      id,
      date,
      time,
      price,
      duration,
      available_spots,
      minParticipants: minParticipants || 1,
    };
  }, [bookingData]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <StepWrapper>
      <ContentGrid>
        <div>
          <CalendarWrapper>
            <CalendarHeader>
              <NavButton
                onClick={() => handleMonthChange(-1)}
                disabled={loading}
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </NavButton>
              <MonthTitle>
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
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
                    onClick={(e) => {
                      // FIX: Prevent backdrop click from closing the entire modal
                      e.stopPropagation();
                      handleBackToCalendar();
                    }}
                  />
                )}
                <TimeSlotsContainer
                  layout
                  variants={
                    isMobile
                      ? mobileTimeSlotsVariants
                      : desktopTimeSlotsVariants
                  }
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  onClick={(e) => {
                    // FIX: Prevent clicks inside the timeslot container from bubbling
                    e.stopPropagation();
                  }}
                >
                  <MobileTimeSlotsHeader
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: "linear" }}
                  >
                    <MobileBackButton onClick={handleBackToCalendar}>
                      <ArrowLeft size={18} />
                    </MobileBackButton>
                    {/* FIX: Removed confusing "Step 2" text */}
                    <span>Select Time</span>
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
