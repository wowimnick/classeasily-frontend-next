import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import styled, { css, keyframes } from "styled-components";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Drawer } from "vaul";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";

import { scheduleService } from "@/services/apiService";
import posthog from "posthog-js";
import { getDurationText } from "./utils";
import {
  formatTimeRangeForDisplay,
  formatNaiveDate,
  getLocalYYYYMMDD,
} from "@/services/utils";

// --- Theme & Constants ---
const theme = {
  primary: "#ff385c",
  primaryHover: "#d93250",
  primaryFade: "rgba(255, 56, 92, 0.04)",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textLight: "#9ca3af",
  bg: "#ffffff",
  bgSecondary: "#f3f4f6",
  border: "#e5e7eb",
  radius: "24px",
  radiusSm: "16px",
  shadow: "0 4px 20px rgba(0,0,0,0.05)",
};

// --- Animations ---
const fadeScale = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

// --- Styled Components ---

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 8px;
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;

  @media (min-width: 960px) {
    grid-template-columns: 1fr 1fr;
  }
`;

// --- Calendar Section ---

const CalendarCard = styled(motion.div)`
  background: ${theme.bg};
  border-radius: ${theme.radius};
  padding: 24px;
  box-shadow: ${theme.shadow};
  border: 1px solid ${theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
  padding: 0 4px;
`;

const MonthLabel = styled(motion.h2)`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin: 0;
  min-width: 140px;
  text-align: center;
`;

const IconButton = styled(motion.button)`
  background: transparent;
  border: 1px solid ${theme.border};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.textPrimary};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${theme.primary};
    color: ${theme.primary};
    background: ${theme.primaryFade};
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const GridContainer = styled.div`
  width: 100%;
`;

const DaysGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  justify-content: center;
  justify-items: center;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  justify-content: center;
  justify-items: center;
`;

const Weekday = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: ${theme.textLight};
  text-transform: uppercase;
`;

const DayButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  font-size: 14px;
  font-weight: 500;
  color: ${theme.textPrimary};
  transition: background-color 0.2s;

  ${(props) =>
    !props.$inMonth &&
    css`
      color: ${theme.textLight};
      opacity: 0.3;
    `}

  ${(props) =>
    props.disabled &&
    css`
      cursor: not-allowed;
      text-decoration: line-through;
      color: ${theme.border};
    `}

  ${(props) =>
    props.$hasSlots &&
    !props.$isSelected &&
    css`
      font-weight: 700;
      background: ${theme.bgSecondary};

      &:hover {
        background: ${theme.primaryFade};
        color: ${theme.primary};
      }
    `}

  ${(props) =>
    props.$isSelected &&
    css`
      background: ${theme.primary} !important;
      color: white !important;
      font-weight: 600;
    `}
`;

// --- Time Slots Section ---

const TimeSlotsContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
`;

const ColumnHeader = styled(motion.div)`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: ${theme.textPrimary};
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const DateBadge = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.primary};
  background: ${theme.primaryFade};
  padding: 4px 12px;
  border-radius: 20px;
`;

const ScrollableList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 6px;
  padding-bottom: 4px;
  padding-left: 2px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.border};
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${theme.textLight};
  }
`;

// --- Compact Slot Design ---

const CompactSlotContainer = styled(motion.div)`
  background: ${theme.bg};
  border: 1px solid ${theme.border};
  border-radius: ${theme.radiusSm};
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  flex-shrink: 0;

  ${(props) =>
    props.$selected
      ? css`
          border-color: ${theme.primary};
          background: ${theme.bg};
        `
      : css`
          &:hover {
            border-color: ${theme.textLight};
            background: ${theme.bg};
          }
        `}

  ${(props) =>
    props.$disabled &&
    css`
      opacity: 0.5;
      background: ${theme.bgSecondary};
      cursor: not-allowed;
      border-color: transparent;
      &:hover {
        border-color: transparent;
      }
    `}
`;

const SlotMainRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const TimeGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimeText = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 4px;
`;

const MetaText = styled.span`
  font-size: 12px;
  color: ${theme.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

const PricePill = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textPrimary};
  background: ${theme.bgSecondary};
  padding: 6px 12px;
  border-radius: 8px;
  min-width: 70px;
  text-align: center;

  ${(props) =>
    props.$highlight &&
    css`
      background: ${theme.primaryFade};
      color: ${theme.primary};
    `}
`;

// --- Expanded Content (Participants) ---

const ExpandedContentWrapper = styled(motion.div)`
  overflow: hidden;
`;

const ExpandedInner = styled.div`
  padding: 0 16px 16px 16px;
  border-top: 1px solid ${theme.border};
`;

const StepperRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-bottom: 16px;
`;

const StepperLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.textSecondary};
`;

const StepperControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${theme.bgSecondary};
  padding: 4px;
  border-radius: 10px;
`;

const StepBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: ${theme.bg};
  border-radius: 8px;
  cursor: pointer;
  color: ${theme.textPrimary};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    color: ${theme.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    background: transparent;
  }
`;

const ConfirmButton = styled(motion.button)`
  width: 100%;
  background: ${theme.primary};
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${theme.primaryHover};
  }
`;

// --- Animated Number Component ---

const AnimatedNumberContainer = styled.div`
  position: relative;
  width: 24px;
  height: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const numberVariants = {
  enter: (direction) => ({
    y: direction > 0 ? 20 : -20,
    opacity: 0,
    filter: "blur(2px)",
  }),
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (direction) => ({
    zIndex: 0,
    y: direction > 0 ? -20 : 20,
    opacity: 0,
    filter: "blur(2px)",
  }),
};

const AnimatedNumber = ({ value }) => {
  const prevValue = useRef(value);
  const direction = value > prevValue.current ? 1 : -1;

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  return (
    <AnimatedNumberContainer>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={numberVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            y: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          style={{
            position: "absolute",
            fontSize: "14px",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </AnimatedNumberContainer>
  );
};

// --- Skeleton Utils ---

const SkeletonBlock = styled.div`
  background: #f0f0f0;
  border-radius: ${(props) => props.$radius || "4px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "16px"};
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

const CalendarSkeleton = () => {
  return (
    <div style={{ width: "100%" }}>
      {/* Month Header Skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          padding: "0 4px",
        }}
      >
        <div style={{ width: 32, height: 32 }} />
        <SkeletonBlock $width="140px" $height="20px" $radius="6px" />
        <div style={{ width: 32, height: 32 }} />
      </div>

      <WeekdayRow>
        {[...Array(7)].map((_, i) => (
          <SkeletonBlock key={i} $width="24px" $height="10px" $radius="2px" />
        ))}
      </WeekdayRow>

      <DaysGrid>
        {[...Array(35)].map((_, i) => (
          <SkeletonBlock
            key={i}
            $width="40px"
            $height="40px"
            $radius="12px"
            style={{ marginBottom: 0 }}
          />
        ))}
      </DaysGrid>
    </div>
  );
};

// --- Drawer Styles (Vaul) ---

const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 3000;
`;

const DrawerContent = styled(Drawer.Content)`
  background: ${theme.bg};
  display: flex;
  flex-direction: column;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3001;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  outline: none;

  &:focus {
    outline: none;
  }
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background-color: ${theme.border};
  border-radius: 2px;
  margin: 12px auto;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: ${theme.textLight};
  text-align: center;
  background: transparent;
`;

const LoadingSpinner = styled(motion.div)`
  width: 24px;
  height: 24px;
  border: 3px solid ${theme.border};
  border-top-color: ${theme.primary};
  border-radius: 50%;
  margin: 40px auto;
`;

// --- Main Component ---

const CalendarStep = ({
  optionId,
  bookingData,
  onUpdate,
  selectedOption,
  businessTimeZone,
  userTimeZone,
  initialDate,
  onNext,
}) => {
  // --- State & Hooks ---
  const getInitialDateObj = useCallback(() => {
    if (initialDate) {
      const [year, month, day] = initialDate.split("-").map(Number);
      return year && month && day ? new Date(year, month - 1, day) : null;
    }
    return null;
  }, [initialDate]);

  const [currentDate, setCurrentDate] = useState(
    getInitialDateObj() || new Date()
  );
  const [selectedDate, setSelectedDate] = useState(getInitialDateObj());
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 960);
    handleResize();
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

  // Only show date/times >= 2 days out (not today, not tomorrow)
  const minSelectableDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }, [today]);

  // --- API Fetch ---
  const fetchMonthSlots = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const response = await scheduleService.getAvailabilityForOption(
        optionId,
        {
          start_date: getLocalYYYYMMDD(firstDay),
          end_date: getLocalYYYYMMDD(lastDay),
        }
      );

      if (!abortControllerRef.current.signal.aborted) {
        setAvailableSlots((prev) => ({ ...prev, ...(response || {}) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  }, [optionId, currentDate]);

  useEffect(() => {
    if (optionId) fetchMonthSlots();
    return () => abortControllerRef.current?.abort();
  }, [fetchMonthSlots, optionId]);

  // Sync state if selected slot exists
  useEffect(() => {
    if (currentSelectedSlot?.date) {
      const [y, m, d] = currentSelectedSlot.date.split("-").map(Number);
      const slotDate = new Date(y, m - 1, d);
      if (selectedDate?.getTime() !== slotDate.getTime()) {
        setSelectedDate(slotDate);
        if (slotDate.getMonth() !== currentDate.getMonth()) {
          setCurrentDate(new Date(slotDate));
        }
      }
    }
  }, [currentSelectedSlot, selectedDate, currentDate]);

  // Clear selection if it's today or tomorrow (must be >= 2 days out)
  useEffect(() => {
    if (selectedDate && selectedDate < minSelectableDate) {
      setSelectedDate(null);
      onUpdate({ selectedSlots: [] });
    }
  }, [minSelectableDate, selectedDate, onUpdate]);

  // --- Handlers ---
  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (currentSelectedSlot?.date !== getLocalYYYYMMDD(date)) {
      onUpdate({ selectedSlots: [] });
    }
    if (isMobile) setShowMobileSheet(true);
  };

  const handleMonthChange = (direction) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + direction, 1);
      return d;
    });
  };

  const handleSlotClick = (slot) => {
    if (currentSelectedSlot?.id === slot.instance_id) return;

    const naiveDate = getLocalYYYYMMDD(selectedDate);
    const parts = Math.max(
      bookingData.participants || 1,
      slot.min_participants
    );

    onUpdate({
      selectedSlots: [
        {
          id: slot.instance_id,
          date: naiveDate,
          time: slot.time,
          available_spots: slot.available_spots,
          price: slot.price,
          duration: slot.duration,
          minParticipants: slot.min_participants,
        },
      ],
      participants: Math.min(parts, slot.available_spots),
    });
  };

  const updateParticipants = (delta) => {
    if (!currentSelectedSlot) return;
    const newValue = (bookingData.participants || 1) + delta;
    if (
      newValue >= currentSelectedSlot.minParticipants &&
      newValue <= currentSelectedSlot.available_spots
    ) {
      onUpdate({ participants: newValue });
    }
  };

  const finalize = () => {
    // PostHog: Track date selection in booking funnel
    if (currentSelectedSlot) {
      posthog.capture("booking_date_selected", {
        date: currentSelectedSlot.date,
        time: currentSelectedSlot.time,
        participants: bookingData.participants,
      });
    }
    if (isMobile) setShowMobileSheet(false);
    onNext();
  };

  // --- Render Helpers ---
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ date: null });
    for (let i = 1; i <= daysCount; i++)
      days.push({ date: new Date(year, month, i) });
    return days;
  }, [currentDate]);

  const slotsForDate = useMemo(() => {
    if (!selectedDate || selectedDate < minSelectableDate) return [];
    return availableSlots[getLocalYYYYMMDD(selectedDate)] || [];
  }, [selectedDate, minSelectableDate, availableSlots]);

  const renderSlots = () => (
    <LayoutGroup>
      <AnimatePresence mode="wait">
        {!selectedDate ? (
          <EmptyState key="nodate">
            <lord-icon
              src="https://cdn.lordicon.com/uoljexdg.json"
              trigger="hover"
              key="nodate-icon"
              style={{ width: "32px", height: "32px", marginBottom: "12px" }}
            ></lord-icon>
            <span>Select a date to view times</span>
          </EmptyState>
        ) : loading && !availableSlots[getLocalYYYYMMDD(selectedDate)] ? (
          <LoadingSpinner
            key="loading"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        ) : slotsForDate.length === 0 ? (
          <EmptyState key="empty">
            <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <span>No availability on this day</span>
          </EmptyState>
        ) : (
          <ScrollableList
            key="list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {slotsForDate.map((slot) => {
              const isSelected = currentSelectedSlot?.id === slot.instance_id;
              const isDisabled =
                slot.available_spots < (bookingData.participants || 1);
              const price = parseFloat(slot.price);

              return (
                <CompactSlotContainer
                  layout
                  key={slot.instance_id}
                  $selected={isSelected}
                  $disabled={isDisabled}
                  onClick={() => !isDisabled && handleSlotClick(slot)}
                  variants={fadeScale}
                  transition={{ layout: { duration: 0.2, ease: "easeInOut" } }}
                >
                  <SlotMainRow>
                    <TimeGroup>
                      <TimeText>
                        {formatTimeRangeForDisplay(
                          getLocalYYYYMMDD(selectedDate),
                          slot.time,
                          slot.duration,
                          displayBusinessTimeZone,
                          displayUserTimeZone
                        )}
                      </TimeText>
                      <MetaText>
                        {getDurationText(slot.duration)} •{" "}
                        {slot.available_spots} spots left
                      </MetaText>
                    </TimeGroup>
                    <PricePill $highlight={isSelected}>
                      {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                    </PricePill>
                  </SlotMainRow>

                  <AnimatePresence>
                    {isSelected && (
                      <ExpandedContentWrapper
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <ExpandedInner>
                          <StepperRow>
                            <StepperLabel>Participants</StepperLabel>
                            <StepperControls>
                              <StepBtn
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateParticipants(-1);
                                }}
                                disabled={
                                  bookingData.participants <=
                                  slot.min_participants
                                }
                              >
                                <Minus size={14} />
                              </StepBtn>
                              {/* Replaced static number with Animated Number */}
                              <AnimatedNumber
                                value={bookingData.participants || 1}
                              />
                              <StepBtn
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateParticipants(1);
                                }}
                                disabled={
                                  bookingData.participants >=
                                  slot.available_spots
                                }
                              >
                                <Plus size={14} />
                              </StepBtn>
                            </StepperControls>
                          </StepperRow>
                          <ConfirmButton
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              finalize();
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Continue <ArrowRight size={16} />
                          </ConfirmButton>
                        </ExpandedInner>
                      </ExpandedContentWrapper>
                    )}
                  </AnimatePresence>
                </CompactSlotContainer>
              );
            })}
          </ScrollableList>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );

  return (
    <Container>
      <LayoutGrid>
        {/* Left: Calendar */}
        <CalendarCard>
          {loading ? (
            <CalendarSkeleton />
          ) : (
            <>
              <HeaderRow>
                <IconButton
                  onClick={() => handleMonthChange(-1)}
                  disabled={
                    loading ||
                    (currentDate <= today &&
                      currentDate.getMonth() === today.getMonth())
                  }
                >
                  <ChevronLeft size={20} />
                </IconButton>
                <AnimatePresence mode="wait">
                  <MonthLabel
                    key={currentDate.toString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {formatNaiveDate(
                      getLocalYYYYMMDD(currentDate),
                      "MMMM yyyy"
                    )}
                  </MonthLabel>
                </AnimatePresence>
                <IconButton
                  onClick={() => handleMonthChange(1)}
                  disabled={loading}
                >
                  <ChevronRight size={20} />
                </IconButton>
              </HeaderRow>

              <GridContainer>
                <WeekdayRow>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <Weekday key={d}>{d}</Weekday>
                    )
                  )}
                </WeekdayRow>

                <AnimatePresence mode="wait">
                  <DaysGrid
                    key={currentDate.toString()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {daysInMonth.map((item, idx) => {
                      if (!item.date) return <div key={`empty-${idx}`} />;
                      const naive = getLocalYYYYMMDD(item.date);
                      const isBeforeMin = item.date < minSelectableDate;
                      const hasSlots =
                        !isBeforeMin && (availableSlots[naive]?.length > 0);
                      const isSel =
                        selectedDate &&
                        getLocalYYYYMMDD(selectedDate) === naive;

                      return (
                        <DayButton
                          key={naive}
                          disabled={isBeforeMin || (!hasSlots && !loading)}
                          $inMonth={true}
                          $hasSlots={hasSlots}
                          $isSelected={isSel}
                          onClick={() => handleDateClick(item.date)}
                          whileTap={
                            !isBeforeMin && hasSlots ? { scale: 0.9 } : {}
                          }
                        >
                          {item.date.getDate()}
                        </DayButton>
                      );
                    })}
                  </DaysGrid>
                </AnimatePresence>
              </GridContainer>
            </>
          )}
        </CalendarCard>

        {/* Right: Slots (Desktop) - No longer a card */}
        {!isMobile && (
          <TimeSlotsContainer>
            <AnimatePresence mode="wait">
              {selectedDate && (
                <ColumnHeader
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3>
                    <lord-icon
                      src="https://cdn.lordicon.com/uoljexdg.json"
                      trigger="in"
                      key={selectedDate.toString()}
                      style={{ width: "24px", height: "24px" }}
                    ></lord-icon>
                    Available Times
                  </h3>
                  <DateBadge>
                    {formatNaiveDate(
                      getLocalYYYYMMDD(selectedDate),
                      "MMM d, yyyy"
                    )}
                  </DateBadge>
                </ColumnHeader>
              )}
            </AnimatePresence>
            {renderSlots()}
          </TimeSlotsContainer>
        )}

        {/* Mobile Drawer (Vaul) */}
        {isMobile && (
          <Drawer.Root
            open={showMobileSheet}
            onOpenChange={setShowMobileSheet}
            shouldScaleBackground
          >
            <Drawer.Portal>
              <DrawerOverlay />
              <DrawerContent>
                <div
                  style={{
                    padding: "0 20px 20px 20px",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <DrawerHandle />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      flexShrink: 0,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        color: theme.textPrimary,
                      }}
                    >
                      Select Time
                    </h3>
                  </div>
                  <div
                    style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}
                  >
                    {renderSlots()}
                  </div>
                </div>
              </DrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </LayoutGrid>
    </Container>
  );
};

export default CalendarStep;
