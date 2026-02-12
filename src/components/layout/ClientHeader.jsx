// --- START OF FILE ClientHeader.jsx ---

"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styled, { createGlobalStyle } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import {
  Menu,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useSearch, SUGGESTED_AREAS, ICON_PALETTE } from "@/context/SearchContext";

// Dynamic Imports
const CustomUserMenu = dynamic(
  () => import("@/components/header/CustomUserMenu.jsx"),
  { ssr: false, loading: () => null },
);

const UserAvatar = dynamic(() => import("@/components/common/UserAvatar"), {
  ssr: false,
  loading: () => (
    <img
      src="/icons/explore/user-circle.svg"
      alt="User"
      style={{ width: "28px", height: "28px", borderRadius: "50%" }}
    />
  ),
});

import LogoIcon from "@/components/common/logoIcon";

const SettingsModal = dynamic(
  () => import("@/components/header/SettingsDrawer"),
  { ssr: false },
);

// --- HELPER HOOKS ---

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// --- GLOBAL & LAYOUT STYLES ---

const GlobalStyles = createGlobalStyle`
  .header-search-container {
    --primary: ${(props) => props.theme.token.colorPrimary || "#e11d48"};
  }
`;

const HeaderWrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #f1f1f1;
  position: ${({ $isFixed }) => ($isFixed ? "sticky" : "relative")};
  top: ${({ $isFixed }) => ($isFixed ? "0" : "auto")};
  height: 80px;
  padding: 0 2rem;
  transition:
    background-color 0.3s,
    border-bottom 0.3s;
  z-index: 100;
  overflow: visible;

  @media (max-width: 768px) {
    height: 60px;
    padding: 0 1rem;
    gap: 0.5rem;
    z-index: 90;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding-right: 1rem;
  flex-shrink: 0;
  svg {
    width: 40px;
    height: 40px;
  }
  @media (max-width: 768px) {
    padding-right: 0.5rem;
    svg {
      width: 32px;
      height: 32px;
    }
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  flex-shrink: 0;
  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const UserMenuButton = styled(motion.button)`
  height: 48px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px 4px 14px;
  border-radius: 28px;
  background-color: transparent;
  cursor: pointer;
  overflow: hidden;
  color: #222;
  gap: 10px;
  padding-left: 14px;
  transition: box-shadow 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

// ------------------------------------------------------------------------
//  COMPACT SEARCH PILL COMPONENTS
// ------------------------------------------------------------------------

const SearchFormWrapper = styled(motion.form)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 100px;
  padding: 0;
  height: 56px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: auto;
  z-index: 50;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ActivePillBackground = styled(motion.div)`
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  right: 0;
  background: #f3f4f6;
  border-radius: 100px;
  z-index: 0;
`;

const SectionButton = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  height: 100%;
  padding: 0 20px;
  border-radius: 32px;
  cursor: pointer;
  background-color: transparent;
  isolation: isolate;
  min-width: 120px;

  &:hover {
    background-color: ${(props) =>
      props.$isActive ? "transparent" : "#f9fafb"};
    border-radius: 32px;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0;
  flex-shrink: 0;
  opacity: ${(props) => (props.$isHidden ? 0 : 1)};
  transition: opacity 0.2s;
`;

const FieldLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 2px;
  position: relative;
  z-index: 1;
`;

const ValueDisplay = styled.div`
  font-size: 14px;
  color: ${(props) => (props.$hasValue ? "#111" : "#6b7280")};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  position: relative;
  z-index: 1;
  line-height: 1.2;
`;

const SearchCircleButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.token.colorPrimary || "#ff385c"};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-right: 8px;
  margin-left: 8px;
  cursor: pointer;
  flex-shrink: 0;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(255, 56, 92, 0.2);
`;

const InlineInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: #111;
  padding: 0;
  position: relative;
  z-index: 2;
  &::placeholder {
    color: #6b7280;
  }
`;

// --- POPUP COMPONENTS ---

const UnifiedPopupContainer = styled(motion.div)`
  position: absolute;
  top: 70px;
  background: white;
  border-radius: 32px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 110;
`;

const PopupContentPadding = styled.div`
  padding: 24px;
`;

// --- CALENDAR CUSTOM COMPONENTS ---

const CalendarWrapper = styled.div`
  width: 100%;
  user-select: none;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-weight: 700;
  font-size: 16px;
  color: #111;
  position: relative;
`;

const MonthTitle = styled.div`
  flex: 1;
  text-align: center;
`;

const NavBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #f3f4f6;
  }
`;

const DoubleMonthGrid = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
`;

const MonthSection = styled.div`
  flex: 1;
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  text-align: center;
  font-size: 12px;
  color: #999;
  font-weight: 600;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
`;

const DayBtn = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  position: relative;
  background: transparent;
  color: ${(props) =>
    props.$isWhiteText ? "white" : props.$isDisabled ? "#e5e7eb" : "#374151"};
  cursor: ${(props) => (props.$isDisabled ? "not-allowed" : "pointer")};
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  width: 100%;
  isolation: isolate;

  &:hover {
    background: ${(props) =>
      !props.$hasSelection && !props.$isDisabled ? "#f3f4f6" : "transparent"};
    border-radius: 50%;
  }
`;

const DayBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  z-index: -1;
  background: ${(props) => props.$bgColor};
  border-radius: ${(props) => props.$radius};
  width: 100%;
  height: 100%;
`;

const QuickSelectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding-top: 20px;
  margin-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const QuickPill = styled.button`
  background: ${(props) => (props.$active ? "#f3f4f6" : "white")};
  border: 1px solid ${(props) => (props.$active ? "#111" : "#e5e7eb")};
  border-radius: 12px;
  padding: 8px 4px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;

  &:hover {
    border-color: #111;
    background: #f9fafb;
  }
`;

// --- CustomCalendar Component ---
const CustomCalendar = ({ value, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const selectedStart = value?.start
    ? dayjs(value.start)
    : value && value.isValid && value.isValid()
      ? dayjs(value)
      : null;
  const selectedEnd = value?.end ? dayjs(value.end) : null;

  const handleDateClick = (dateObj) => {
    onChange(dateObj);
    onClose();
  };

  const nextMonth = () => setCurrentDate(currentDate.add(1, "month"));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));

  const applyPreset = (type) => {
    let start, end;
    const today = dayjs();

    switch (type) {
      case "weekend":
        if (today.day() === 0) {
          start = today.subtract(1, "day");
          end = today;
        } else {
          start = today.day(6);
          end = today.day(6).add(1, "day");
        }
        break;
      case "next_weekend":
        start = today.day(6).add(1, "week");
        end = start.add(1, "day");
        break;
      case "this_week":
        start = today;
        end = today.endOf("week");
        break;
      case "next_week":
        start = today.add(1, "week").startOf("week");
        end = today.add(1, "week").endOf("week");
        break;
      default:
        start = today;
        end = null;
    }

    onChange({
      start: start.format("YYYY-MM-DD"),
      end: end ? end.format("YYYY-MM-DD") : null,
    });
  };

  const renderMonthGrid = (baseDate) => {
    const daysInMonth = baseDate.daysInMonth();
    const startDay = baseDate.startOf("month").day();
    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <DayGrid>
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const thisDate = baseDate.date(d);
          const isPast = thisDate.isBefore(dayjs().startOf("day"));

          let isRangeStart = false;
          let isRangeEnd = false;
          let isInRange = false;
          let isSingle = false;

          if (selectedStart && !selectedEnd) {
            isSingle = thisDate.isSame(selectedStart, "day");
          } else if (selectedStart && selectedEnd) {
            const s = selectedStart.startOf("day");
            const e = selectedEnd.startOf("day");
            const t = thisDate.startOf("day");

            isRangeStart = t.isSame(s);
            isRangeEnd = t.isSame(e);
            isInRange = t.isAfter(s) && t.isBefore(e);

            if (isRangeStart && isRangeEnd) {
              isSingle = true;
              isRangeStart = false;
              isRangeEnd = false;
            }
          }

          const hasSelection =
            isSingle || isRangeStart || isRangeEnd || isInRange;

          const primaryColor = "#ff385c";
          const faintColor = "#ff385c15";

          let bgRadius = "0";
          let bgColor = "transparent";

          if (isSingle) {
            bgRadius = "50%";
            bgColor = primaryColor;
          } else if (isRangeStart) {
            bgRadius = "50% 0 0 50%";
            bgColor = primaryColor;
          } else if (isRangeEnd) {
            bgRadius = "0 50% 50% 0";
            bgColor = primaryColor;
          } else if (isInRange) {
            bgRadius = "0";
            bgColor = faintColor;
          }

          return (
            <DayBtn
              key={d}
              type="button"
              $isDisabled={isPast}
              $hasSelection={hasSelection}
              $isWhiteText={isSingle || isRangeStart || isRangeEnd}
              disabled={isPast}
              onClick={() => handleDateClick(thisDate)}
            >
              <span style={{ position: "relative", zIndex: 2 }}>{d}</span>
              {hasSelection && (
                <DayBackground
                  $bgColor={bgColor}
                  $radius={bgRadius}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </DayBtn>
          );
        })}
      </DayGrid>
    );
  };

  const nextMonthDate = currentDate.add(1, "month");

  return (
    <CalendarWrapper>
      <CalendarHeader>
        <NavBtn onClick={prevMonth} type="button">
          <ChevronLeft size={20} />
        </NavBtn>
        <div style={{ display: "flex", flex: 1 }}>
          <MonthTitle>{currentDate.format("MMMM YYYY")}</MonthTitle>
          <MonthTitle>{nextMonthDate.format("MMMM YYYY")}</MonthTitle>
        </div>
        <NavBtn onClick={nextMonth} type="button">
          <ChevronRight size={20} />
        </NavBtn>
      </CalendarHeader>

      <DoubleMonthGrid>
        <MonthSection>
          <WeekGrid>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </WeekGrid>
          {renderMonthGrid(currentDate)}
        </MonthSection>

        <MonthSection>
          <WeekGrid>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </WeekGrid>
          {renderMonthGrid(nextMonthDate)}
        </MonthSection>
      </DoubleMonthGrid>

      <QuickSelectGrid>
        <QuickPill type="button" onClick={() => applyPreset("weekend")}>
          This Weekend
        </QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("next_weekend")}>
          Next Weekend
        </QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("this_week")}>
          This Week
        </QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("next_week")}>
          Next Week
        </QuickPill>
      </QuickSelectGrid>
    </CalendarWrapper>
  );
};

// 2. Participants
const ParticipantRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
`;
const CounterBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #374151;
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: #111;
    color: #111;
  }
`;

const CustomParticipant = ({ count, onChange }) => (
  <ParticipantRow>
    <div
      style={{ display: "flex", flexDirection: "column", textAlign: "left" }}
    >
      <span style={{ fontWeight: 600, color: "#111", fontSize: 16 }}>
        Participants
      </span>
      <span style={{ fontSize: 13, color: "#717171" }}>Join the class</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <CounterBtn
        type="button"
        disabled={count <= 1}
        onClick={() => onChange(Math.max(1, count - 1))}
      >
        <Minus size={16} />
      </CounterBtn>
      <span
        style={{
          width: 24,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        {count}
      </span>
      <CounterBtn
        type="button"
        disabled={count >= 20}
        onClick={() => onChange(count + 1)}
      >
        <Plus size={16} />
      </CounterBtn>
    </div>
  </ParticipantRow>
);

// 3. Location List
const LocationList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 250px;
  overflow-y: auto;
  width: 100%;
`;
const LocationOption = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #f3f4f6;
  }
`;
const IconBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  background: ${(p) => p.$bgColor ?? "#f3f4f6"};
  color: ${(p) => p.$iconColor ?? "#374151"};
`;

// --- CONSTANTS ---
const POPUP_SIZES = {
  location: 380,
  date: 660,
  participants: 340,
};

const contentVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1, transition: { delay: 0.1, duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// ------------------------------------------------------------------------
//  MAIN COMPONENT
// ------------------------------------------------------------------------

function ExploreHeaderContent({ showOptionsWrapper = true, isFixed = true }) {
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const menuTriggerRef = useRef(null);

  // State
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Search Context
  const {
    searchTerm,
    setSearchTerm,
    datePickerValue,
    setDatePickerValue,
    participantCount,
    setParticipantCount,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    performSearch,
    setIsDrawerOpen,
  } = useSearch();

  // Search Interaction State
  const [activeField, setActiveField] = useState(null);
  const [popupConfig, setPopupConfig] = useState({ left: 0, width: 360 });
  const containerRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const participantsRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useClickOutside(containerRef, () => {
    setActiveField(null);
  });

  // Position Logic
  useLayoutEffect(() => {
    if (!activeField || !containerRef.current) return;

    const updatePosition = () => {
      const refs = {
        location: locationRef,
        date: dateRef,
        participants: participantsRef,
      };
      const targetRef = refs[activeField];

      if (targetRef?.current && containerRef.current) {
        const buttonRect = targetRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        const width = POPUP_SIZES[activeField] || 360;

        let left =
          buttonRect.left -
          containerRect.left +
          buttonRect.width / 2 -
          width / 2;

        const absoluteLeft = containerRect.left + left;
        const windowWidth = window.innerWidth;

        if (absoluteLeft + width > windowWidth - 20) {
          left -= absoluteLeft + width - (windowWidth - 20);
        }
        if (absoluteLeft < 20) {
          left += 20 - absoluteLeft;
        }

        setPopupConfig({ left, width });
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [activeField]);

  const handleFieldClick = (field) => {
    setActiveField(activeField === field ? null : field);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
    setActiveField(null);
  };

  const getDateDisplay = () => {
    if (!datePickerValue) return "Any week";

    if (datePickerValue.start && datePickerValue.end) {
      const s = dayjs(datePickerValue.start);
      const e = dayjs(datePickerValue.end);
      if (s.month() === e.month()) {
        return `${s.format("MMM D")} - ${e.format("D")}`;
      }
      return `${s.format("MMM D")} - ${e.format("MMM D")}`;
    }

    if (dayjs.isDayjs(datePickerValue)) {
      return datePickerValue.format("MMM DD");
    }

    return "Any week";
  };

  const renderLocationSuggestions = () => {
    const safeResults = Array.isArray(geocodedAddressResults)
      ? geocodedAddressResults
      : [];
    if (searchTerm && safeResults.length > 0) {
      return safeResults.map((result, idx) => {
        const colorTheme = ICON_PALETTE[idx % ICON_PALETTE.length];
        return (
          <LocationOption
            key={idx}
            onClick={() => {
              handleLocationSelect(result.displayName, {
                coordinates: result.coordinates,
                citySlug: result.citySlug,
                provinceSlug: result.provinceSlug,
              });
              setActiveField(null);
            }}
          >
            <IconBox $bgColor={colorTheme.bg} $iconColor={colorTheme.icon}>
              <MapPin size={18} strokeWidth={2.5} />
            </IconBox>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
              {result.displayName.split(",")[0]}
            </span>
            <span style={{ fontSize: 12, color: "#717171" }}>
              {result.displayName}
            </span>
          </div>
        </LocationOption>
        );
      });
    }
    return SUGGESTED_AREAS.map((area, idx) => {
      const isToronto = idx === 0;
      const colorTheme = area.lucideColorTheme;
      return (
        <LocationOption
          key={idx}
          onClick={() => {
            handleLocationSelect(area.name, {
              coordinates: area.coords,
              citySlug: area.citySlug,
              provinceSlug: area.provinceSlug,
            });
            setActiveField(null);
          }}
        >
          <IconBox
            $bgColor={isToronto ? ICON_PALETTE[0].bg : colorTheme?.bg}
            $iconColor={isToronto ? undefined : colorTheme?.icon}
          >
            {isToronto ? area.icon : <MapPin size={18} strokeWidth={2.5} />}
          </IconBox>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
            {area.name}
          </span>
          <span style={{ fontSize: 12, color: "#717171" }}>
            {area.description}
          </span>
        </div>
      </LocationOption>
      );
    });
  };

  // Mobile Trigger (Visible < 768px)
  const MobileSearchTrigger = styled.div`
    display: none;
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      flex: 1;
      min-width: 0;
      p {
        margin: 0;
        font-size: 14px;
        color: #595959;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
    }
  `;

  return (
    <>
      <GlobalStyles />
      <HeaderWrapper $isFixed={isFixed}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <LogoContainer>
            <LogoIcon size={"2.5rem"} restingColor="#ff385c" />
          </LogoContainer>
        </Link>

        {showOptionsWrapper && (
          <>
            {/* --- DESKTOP SEARCH PILL --- */}
            <SearchFormWrapper
              ref={containerRef}
              onSubmit={handleSearchSubmit}
              layout
              style={{ visibility: isMounted ? "visible" : "hidden" }}
            >
              {/* 1. LOCATION */}
              <SectionButton
                ref={locationRef}
                $isActive={activeField === "location"}
                onClick={() => handleFieldClick("location")}
                style={{ width: 220, paddingLeft: 24 }}
              >
                {activeField === "location" && (
                  <ActivePillBackground
                    layoutId="header-pill"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <FieldLabel>Where</FieldLabel>
                {activeField === "location" ? (
                  <InlineInput
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder="Search destination"
                  />
                ) : (
                  <ValueDisplay $hasValue={!!searchTerm}>
                    {searchTerm || "Search destination"}
                  </ValueDisplay>
                )}
              </SectionButton>

              <Divider
                $isHidden={activeField === "location" || activeField === "date"}
              />

              {/* 2. DATE */}
              <SectionButton
                ref={dateRef}
                $isActive={activeField === "date"}
                onClick={() => handleFieldClick("date")}
                style={{ width: 150 }}
              >
                {activeField === "date" && (
                  <ActivePillBackground
                    layoutId="header-pill"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <FieldLabel>Date</FieldLabel>
                <ValueDisplay $hasValue={!!datePickerValue}>
                  {getDateDisplay()}
                </ValueDisplay>
              </SectionButton>

              <Divider
                $isHidden={
                  activeField === "date" || activeField === "participants"
                }
              />

              {/* 3. WHO */}
              <SectionButton
                ref={participantsRef}
                $isActive={activeField === "participants"}
                onClick={() => handleFieldClick("participants")}
                style={{ width: 130 }}
              >
                {activeField === "participants" && (
                  <ActivePillBackground
                    layoutId="header-pill"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <FieldLabel>Who</FieldLabel>
                <ValueDisplay $hasValue={true}>
                  {participantCount === 1
                    ? "1 Person"
                    : `${participantCount} People`}
                </ValueDisplay>
              </SectionButton>

              {/* SEARCH BUTTON */}
              <SearchCircleButton
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                <Search size={18} strokeWidth={3} />
              </SearchCircleButton>

              {/* --- POPUP CONTAINER --- */}
              <AnimatePresence>
                {activeField && (
                  <UnifiedPopupContainer
                    key="popup"
                    initial={{
                      opacity: 0,
                      y: 10,
                      left: popupConfig.left,
                      width: popupConfig.width,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      left: popupConfig.left,
                      width: popupConfig.width,
                    }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      left: { duration: 0.2 },
                      width: { duration: 0.2 },
                    }}
                  >
                    <PopupContentPadding>
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activeField}
                          layout="position"
                          variants={contentVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={{
                            width: (POPUP_SIZES[activeField] || 360) - 48,
                          }}
                        >
                          {activeField === "location" && (
                            <LocationList>
                              {renderLocationSuggestions()}
                            </LocationList>
                          )}
                          {activeField === "date" && (
                            <CustomCalendar
                              value={datePickerValue}
                              onChange={setDatePickerValue}
                              onClose={() => handleFieldClick("participants")}
                            />
                          )}
                          {activeField === "participants" && (
                            <CustomParticipant
                              count={Math.max(1, participantCount)}
                              onChange={setParticipantCount}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </PopupContentPadding>
                  </UnifiedPopupContainer>
                )}
              </AnimatePresence>
            </SearchFormWrapper>

            {/* --- MOBILE SEARCH TRIGGER --- */}
            <MobileSearchTrigger
              onClick={() => setIsDrawerOpen(true)}
              style={{ visibility: isMounted ? "visible" : "hidden" }}
            >
              <Search size={20} color="#ff385c" />
              <p>{searchTerm || "Start your search"}</p>
            </MobileSearchTrigger>
          </>
        )}

        {/* --- RIGHT USER MENU --- */}
        <RightSection>
          <div style={{ position: "relative" }}>
            <UserMenuButton
              ref={menuTriggerRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu strokeWidth={2.5} size={18} style={{ color: "inherit" }} />
              {currentUser?.avatar_url ? (
                <UserAvatar size={28} />
              ) : (
                <img
                  src="/icons/explore/user-circle.svg"
                  alt="User"
                  width={28}
                  height={28}
                />
              )}
            </UserMenuButton>
            <CustomUserMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onNavigate={(path) => {
                setIsMenuOpen(false);
                router.push(path);
              }}
              onShowSettings={() => {
                setIsMenuOpen(false);
                setSettingsDrawerVisible(true);
              }}
              triggerRef={menuTriggerRef}
            />
          </div>
        </RightSection>
      </HeaderWrapper>

      <SettingsModal
        open={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
        loading={false}
      />
    </>
  );
}

export default ExploreHeaderContent;
