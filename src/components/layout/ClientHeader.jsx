// --- START OF FILE ClientHeader.jsx ---

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
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
  Sparkles,
} from "lucide-react";

import { useAuthUser } from "@/hooks/useAuthUser";
import {
  useSearch,
  SUGGESTED_AREAS,
  ICON_PALETTE,
  formatCollectionDisplayName,
} from "@/context/SearchContext";
import { collectionService } from "@/services/apiService";

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

// --- GLOBAL STYLES ---

const GlobalStyles = createGlobalStyle`
  .header-search-container {
    --primary: ${(props) => props.theme.token.colorPrimary || "#e11d48"};
  }
`;

// --- LAYOUT ---

const HeaderWrapper = styled(motion.header)`
  box-sizing: border-box;
  align-items: flex-start;
  padding: 18px 2rem 18px;
  background-color: ${({ $unifiedExploreChrome }) =>
    $unifiedExploreChrome ? "#fafafa" : "#fff"};
  border-bottom: ${({ $unifiedExploreChrome }) =>
    $unifiedExploreChrome ? "none" : "1px solid #f1f1f1"};
  position: ${({ $isFixed }) => ($isFixed ? "sticky" : "relative")};
  top: ${({ $isFixed }) => ($isFixed ? "0" : "auto")};
  transition: background-color 0.3s, border-bottom 0.3s;
  z-index: 100;
  overflow: visible;

  ${({ $unifiedExploreChrome }) =>
    $unifiedExploreChrome
      ? `
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: stretch;
    gap: 0.75rem;

    & > a {
      align-self: start;
    }
    & > form {
      align-self: center;
    }
  `
      : `
    display: flex;
    justify-content: space-between;
  `}

  @media (max-width: 768px) {
    padding: 12px 1rem 12px;
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
  ${(p) => (p.$pinTopInUnifiedGrid ? "align-self: start;" : "")}
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
  transition: box-shadow 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

// --- BACKDROP ---

const SearchBackdrop = styled(motion.div)`
  position: fixed;
  top: ${(p) => p.$top}px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.32);
  z-index: 99;
  cursor: pointer;
`;

// --- SEARCH FORM WRAPPER (the pill shell) ---

const SearchFormWrapper = styled(motion.form)`
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 100px;
  overflow: visible;
  /* z-index must beat the backdrop (99) and sit below any portal modals */
  z-index: 101;
  will-change: width, height, box-shadow;

  ${({ $unifiedExploreChrome }) =>
    $unifiedExploreChrome
      ? `
    position: relative;
    left: auto;
    right: auto;
    transform: none;
    justify-self: center;
    align-self: center;
  `
      : `
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  `}

  @media (max-width: 768px) {
    display: none;
  }
`;

/*
 * Clips the compact/expanded content layers without clipping the dropdown popup.
 * The popup is rendered as a sibling OUTSIDE this div.
 */
const PillContentArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 100px;
  overflow: hidden;
`;

const PillLayer = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
`;

// --- COMPACT PILL ---

const CompactRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 8px;
`;

const CompactMagnifier = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  color: #374151;
  margin-right: 9px;
  flex-shrink: 0;

  svg {
    display: block;
  }
`;

const CompactFieldZone = styled.button`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 6px;
  cursor: pointer;
  border: none;
  background: transparent;
  border-radius: 100px;
  transition: background 0.15s ease;
  flex-shrink: 0;
  font-family: inherit;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const CompactFieldText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #111111;
  white-space: nowrap;
  max-width: 108px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
`;

const CompactDot = styled.span`
  font-size: 16px;
  color: #d1d5db;
  margin: 0 1px;
  flex-shrink: 0;
  user-select: none;
  line-height: 1;
`;

const SmallSearchCircle = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 6px;
  box-shadow: 0 2px 8px rgba(255, 56, 92, 0.35);
  font-family: inherit;

  svg {
    display: block;
  }
`;

// --- EXPANDED PILL ---

const ExpandedRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 100px;
  overflow: hidden;
`;

/* Matches BannerSearchClient ActivePill exactly */
const ActivePillBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 64px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  z-index: 0;
`;

const SectionButton = styled.div.attrs({
  role: "button",
  tabIndex: 0,
})`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  height: 100%;
  padding: 0 24px;
  border-radius: 64px;
  cursor: pointer;
  background-color: transparent;
  isolation: isolate;
  min-width: 120px;
  outline: none;

  &:hover {
    background-color: ${(props) =>
      props.$isActive ? "transparent" : "#f3f4f6"};
    border-radius: 64px;
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px #e11d48;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 28px;
  background-color: #e5e7eb;
  flex-shrink: 0;
  opacity: ${(props) => (props.$isHidden ? 0 : 1)};
  transition: opacity 0.2s;
`;

const FieldLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 3px;
  position: relative;
  z-index: 1;
`;

const ValueDisplay = styled.div`
  font-size: 15px;
  color: ${(props) => (props.$hasValue ? "#111" : "#9ca3af")};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  position: relative;
  z-index: 1;
  line-height: 1.2;
`;

const SearchCircleButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff385c 0%, #e11d48 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  margin-right: 10px;
  margin-left: 4px;
  cursor: pointer;
  flex-shrink: 0;
  align-self: center;
  z-index: 2;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);
`;

const InlineInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 500;
  background: transparent;
  color: #111;
  padding: 0;
  position: relative;
  z-index: 2;
  &::placeholder {
    color: #9ca3af;
  }
`;

// --- POPUP (position: fixed so it escapes all stacking contexts) ---

const UnifiedPopupContainer = styled(motion.div)`
  position: fixed;
  background: white;
  border-radius: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  /* above backdrop (99) and header (100) */
  z-index: 200;
`;

const PopupContentPadding = styled.div`
  padding: 24px;
`;

// --- CALENDAR ---

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

// --- CALENDAR COMPONENT ---

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

          const hasSelection = isSingle || isRangeStart || isRangeEnd || isInRange;
          const primaryColor = "#ff385c";
          const faintColor = "#ff385c15";
          let bgRadius = "0";
          let bgColor = "transparent";

          if (isSingle) { bgRadius = "50%"; bgColor = primaryColor; }
          else if (isRangeStart) { bgRadius = "50% 0 0 50%"; bgColor = primaryColor; }
          else if (isRangeEnd) { bgRadius = "0 50% 50% 0"; bgColor = primaryColor; }
          else if (isInRange) { bgRadius = "0"; bgColor = faintColor; }

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
        <QuickPill type="button" onClick={() => applyPreset("weekend")}>This Weekend</QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("next_weekend")}>Next Weekend</QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("this_week")}>This Week</QuickPill>
        <QuickPill type="button" onClick={() => applyPreset("next_week")}>Next Week</QuickPill>
      </QuickSelectGrid>
    </CalendarWrapper>
  );
};

// --- LOCATION / COLLECTION LISTS ---

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
  transition: background 0.2s, box-shadow 0.2s;
  background: ${(p) => (p.$isActive ? "#fff0f0" : "transparent")};
  box-shadow: ${(p) => (p.$isActive ? "inset 0 0 0 2px #f81e3e" : "none")};
  &:hover {
    background: ${(p) => (p.$isActive ? "#fff0f0" : "#f3f4f6")};
  }
`;

const ExploreCollectionSectionLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #999;
  margin-bottom: 8px;
  text-align: left;
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

// --- CONSTANTS ---

const POPUP_SIZES = {
  location: 380,
  date: 660,
  collection: 400,
};

// Compact pill: 360×44  |  Expanded pill: 660×68 (slightly smaller than homepage 720×76)
const COMPACT_W = 360;
const EXPANDED_W = 660;
const COMPACT_H = 44;
const EXPANDED_H = 68;

/** Total header height (must match backdrop `top` and spring `animate.height`). */
const HEADER_H_COMPACT = 80;
const HEADER_H_EXPANDED = 150;

const contentVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.1, duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// ------------------------------------------------------------------------
//  MAIN COMPONENT
// ------------------------------------------------------------------------

function ExploreHeaderContent({
  showOptionsWrapper = true,
  isFixed = true,
  unifiedExploreChrome = false,
}) {
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const menuTriggerRef = useRef(null);

  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    datePickerValue,
    setDatePickerValue,
    selectedCollection,
    setSelectedCollection,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    performSearch,
    setIsDrawerOpen,
  } = useSearch();

  const [activeField, setActiveField] = useState(null);
  /** Dropdown mounts only after compact→expanded pill animation (or fallback timeout). */
  const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
  const [iWantCollections, setIWantCollections] = useState([]);
  const [popupConfig, setPopupConfig] = useState({ top: 96, left: 0, width: 360 });

  const formRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const collectionRef = useRef(null);
  const activeFieldRef = useRef(null);
  /** True only when opening a field from the compact pill; cleared when dropdown may show. */
  const deferSearchDropdownUntilExpandedRef = useRef(false);
  const dropdownRevealFallbackTimerRef = useRef(null);

  activeFieldRef.current = activeField;

  // Derived
  const isExpanded = activeField !== null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await collectionService.listByPlacement("i_want");
        if (!cancelled) setIWantCollections(rows);
      } catch {
        if (!cancelled) setIWantCollections([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Compute popup position using fixed coordinates from the button's screen rect
  const updatePopupPosition = useCallback(() => {
    if (!activeField) return;
    const refs = { location: locationRef, date: dateRef, collection: collectionRef };
    const targetRef = refs[activeField];
    const panelWidth = POPUP_SIZES[activeField] || 360;

    if (targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12));
      setPopupConfig({ top: rect.bottom + 10, left, width: panelWidth });
    }
  }, [activeField]);

  const revealSearchDropdown = useCallback(() => {
    if (dropdownRevealFallbackTimerRef.current) {
      clearTimeout(dropdownRevealFallbackTimerRef.current);
      dropdownRevealFallbackTimerRef.current = null;
    }
    deferSearchDropdownUntilExpandedRef.current = false;
    if (!activeFieldRef.current) return;
    setSearchDropdownVisible(true);
    requestAnimationFrame(() => {
      updatePopupPosition();
    });
  }, [updatePopupPosition]);

  const handlePillLayoutAnimationComplete = useCallback(() => {
    if (!activeFieldRef.current) return;
    if (!deferSearchDropdownUntilExpandedRef.current) return;
    revealSearchDropdown();
  }, [revealSearchDropdown]);

  useEffect(() => {
    if (!activeField) {
      if (dropdownRevealFallbackTimerRef.current) {
        clearTimeout(dropdownRevealFallbackTimerRef.current);
        dropdownRevealFallbackTimerRef.current = null;
      }
      deferSearchDropdownUntilExpandedRef.current = false;
      setSearchDropdownVisible(false);
      return;
    }
    if (!deferSearchDropdownUntilExpandedRef.current) {
      if (dropdownRevealFallbackTimerRef.current) {
        clearTimeout(dropdownRevealFallbackTimerRef.current);
        dropdownRevealFallbackTimerRef.current = null;
      }
      setSearchDropdownVisible(true);
      requestAnimationFrame(() => {
        updatePopupPosition();
      });
      return;
    }
    setSearchDropdownVisible(false);
    if (dropdownRevealFallbackTimerRef.current) {
      clearTimeout(dropdownRevealFallbackTimerRef.current);
    }
    dropdownRevealFallbackTimerRef.current = setTimeout(() => {
      dropdownRevealFallbackTimerRef.current = null;
      if (activeFieldRef.current && deferSearchDropdownUntilExpandedRef.current) {
        revealSearchDropdown();
      }
    }, 140);
    return () => {
      if (dropdownRevealFallbackTimerRef.current) {
        clearTimeout(dropdownRevealFallbackTimerRef.current);
        dropdownRevealFallbackTimerRef.current = null;
      }
    };
  }, [activeField, revealSearchDropdown, updatePopupPosition]);

  const closeActiveField = useCallback(() => {
    if (dropdownRevealFallbackTimerRef.current) {
      clearTimeout(dropdownRevealFallbackTimerRef.current);
      dropdownRevealFallbackTimerRef.current = null;
    }
    deferSearchDropdownUntilExpandedRef.current = false;
    setSearchDropdownVisible(false);
    setActiveField(null);
  }, []);

  useClickOutside(formRef, closeActiveField);

  // Run immediately after the expanded content mounts so refs are available
  useLayoutEffect(() => {
    if (!activeField || !searchDropdownVisible) return;
    const id = requestAnimationFrame(updatePopupPosition);
    return () => cancelAnimationFrame(id);
  }, [activeField, searchDropdownVisible, updatePopupPosition]);

  useEffect(() => {
    if (!activeField || !searchDropdownVisible) return;
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [activeField, searchDropdownVisible, updatePopupPosition]);

  const handleFieldClick = (field) => {
    setActiveField((prev) => {
      if (prev === field) {
        deferSearchDropdownUntilExpandedRef.current = false;
        return null;
      }
      if (prev === null) {
        deferSearchDropdownUntilExpandedRef.current = true;
      } else {
        deferSearchDropdownUntilExpandedRef.current = false;
      }
      return field;
    });
  };

  const handleSectionButtonKeyDown = (e, field) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFieldClick(field);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
    closeActiveField();
  };

  const getDateDisplay = () => {
    if (!datePickerValue) return "Anytime";
    if (datePickerValue.start && datePickerValue.end) {
      const s = dayjs(datePickerValue.start);
      const e = dayjs(datePickerValue.end);
      if (s.month() === e.month()) return `${s.format("MMM D")} – ${e.format("D")}`;
      return `${s.format("MMM D")} – ${e.format("MMM D")}`;
    }
    if (dayjs.isDayjs(datePickerValue)) return datePickerValue.format("MMM DD");
    return "Anytime";
  };

  const getCollectionDisplay = () => {
    if (!selectedCollection) return "Anything";
    return formatCollectionDisplayName(selectedCollection.name || selectedCollection.slug);
  };

  const renderLocationSuggestions = () => {
    const safeResults = Array.isArray(geocodedAddressResults) ? geocodedAddressResults : [];
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
              closeActiveField();
            }}
          >
            <IconBox $bgColor={colorTheme.bg} $iconColor={colorTheme.icon}>
              <MapPin size={18} strokeWidth={2.5} />
            </IconBox>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                {result.displayName.split(",")[0]}
              </span>
              <span style={{ fontSize: 12, color: "#717171" }}>{result.displayName}</span>
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
            handleLocationSelect(area.displayName || area.name, {
              coordinates: area.coords,
              citySlug: area.citySlug,
              provinceSlug: area.provinceSlug,
            });
            closeActiveField();
          }}
        >
          <IconBox
            $bgColor={isToronto ? ICON_PALETTE[0].bg : colorTheme?.bg}
            $iconColor={isToronto ? undefined : colorTheme?.icon}
          >
            {isToronto ? area.icon : <MapPin size={18} strokeWidth={2.5} />}
          </IconBox>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
              {area.displayName || area.name}
            </span>
            <span style={{ fontSize: 12, color: "#717171" }}>{area.description}</span>
          </div>
        </LocationOption>
      );
    });
  };

  return (
    <>
      <GlobalStyles />

      {/* Backdrop — renders below header (z-index 99 < header z-index 100) */}
      <AnimatePresence>
        {isExpanded && (
          <SearchBackdrop
            key="search-backdrop"
            $top={isExpanded ? HEADER_H_EXPANDED : HEADER_H_COMPACT}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={closeActiveField}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <HeaderWrapper
        $isFixed={isFixed}
        $unifiedExploreChrome={unifiedExploreChrome}
        animate={{ height: isExpanded ? HEADER_H_EXPANDED : HEADER_H_COMPACT }}
        initial={{ height: HEADER_H_COMPACT }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            ...(unifiedExploreChrome ? { alignSelf: "start" } : {}),
          }}
        >
          <LogoContainer>
            <LogoIcon size={"2.5rem"} restingColor="#ff385c" />
          </LogoContainer>
        </Link>

        {showOptionsWrapper && (
          <>
            {/* --- DESKTOP SEARCH PILL --- */}
            <SearchFormWrapper
              ref={formRef}
              onSubmit={handleSearchSubmit}
              $unifiedExploreChrome={unifiedExploreChrome}
              animate={{
                width: isExpanded ? EXPANDED_W : COMPACT_W,
                height: isExpanded ? EXPANDED_H : COMPACT_H,
                backgroundColor:
                  isExpanded && activeField ? "#ebebeb" : "#ffffff",
                boxShadow: isExpanded
                  ? "0 8px 32px rgba(0, 0, 0, 0.22)"
                  : "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
              initial={{
                width: COMPACT_W,
                height: COMPACT_H,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onAnimationComplete={handlePillLayoutAnimationComplete}
              style={{
                visibility: isMounted ? "visible" : "hidden",
                border: `1px solid ${isExpanded ? "#d1d5db" : "#e5e7eb"}`,
              }}
            >
              {/* Pill content — overflow:hidden here, not on the form itself */}
              <PillContentArea>
                <AnimatePresence initial={false} mode="sync">
                  {!isExpanded ? (
                    /* ── COMPACT STATE ── */
                    <PillLayer
                      key="compact"
                      variants={contentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <CompactRow>
                        <CompactMagnifier aria-hidden>
                          <Search size={14} strokeWidth={2.5} />
                        </CompactMagnifier>

                        <CompactFieldZone
                          type="button"
                          onClick={() => handleFieldClick("location")}
                          aria-label="Search location"
                        >
                          <CompactFieldText>{searchTerm || "Where"}</CompactFieldText>
                        </CompactFieldZone>

                        <CompactDot aria-hidden>·</CompactDot>

                        <CompactFieldZone
                          type="button"
                          onClick={() => handleFieldClick("date")}
                          aria-label="Search date"
                        >
                          <CompactFieldText>{getDateDisplay()}</CompactFieldText>
                        </CompactFieldZone>

                        <CompactDot aria-hidden>·</CompactDot>

                        <CompactFieldZone
                          type="button"
                          onClick={() => handleFieldClick("collection")}
                          aria-label="Search experience type"
                        >
                          <CompactFieldText>{getCollectionDisplay()}</CompactFieldText>
                        </CompactFieldZone>

                        <SmallSearchCircle
                          type="submit"
                          aria-label="Search"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Search size={13} strokeWidth={3} />
                        </SmallSearchCircle>
                      </CompactRow>
                    </PillLayer>
                  ) : (
                    /* ── EXPANDED STATE ── */
                    <PillLayer
                      key="expanded"
                      variants={contentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <ExpandedRow>
                        {/* 1. LOCATION */}
                        <SectionButton
                          ref={locationRef}
                          $isActive={activeField === "location"}
                          onClick={() => handleFieldClick("location")}
                          onKeyDown={(e) => handleSectionButtonKeyDown(e, "location")}
                          style={{ width: 240, paddingLeft: 28 }}
                        >
                          {activeField === "location" && (
                            <ActivePillBackground
                              layoutId="header-pill-bg"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
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

                        <Divider $isHidden={activeField === "location" || activeField === "date"} />

                        {/* 2. DATE */}
                        <SectionButton
                          ref={dateRef}
                          $isActive={activeField === "date"}
                          onClick={() => handleFieldClick("date")}
                          onKeyDown={(e) => handleSectionButtonKeyDown(e, "date")}
                          style={{ width: 160 }}
                        >
                          {activeField === "date" && (
                            <ActivePillBackground
                              layoutId="header-pill-bg"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <FieldLabel>Date</FieldLabel>
                          <ValueDisplay $hasValue={!!datePickerValue}>
                            {getDateDisplay()}
                          </ValueDisplay>
                        </SectionButton>

                        <Divider $isHidden={activeField === "date" || activeField === "collection"} />

                        {/* 3. I want… */}
                        <SectionButton
                          ref={collectionRef}
                          $isActive={activeField === "collection"}
                          onClick={() => handleFieldClick("collection")}
                          onKeyDown={(e) => handleSectionButtonKeyDown(e, "collection")}
                          style={{ flex: 1 }}
                        >
                          {activeField === "collection" && (
                            <ActivePillBackground
                              layoutId="header-pill-bg"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <FieldLabel>I want…</FieldLabel>
                          <ValueDisplay $hasValue={!!selectedCollection}>
                            {getCollectionDisplay()}
                          </ValueDisplay>
                        </SectionButton>

                        {/* SEARCH BUTTON */}
                        <SearchCircleButton
                          type="submit"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Search size={20} strokeWidth={2.5} />
                        </SearchCircleButton>
                      </ExpandedRow>
                    </PillLayer>
                  )}
                </AnimatePresence>
              </PillContentArea>

              {/* Dropdown popup — position: fixed, escapes all overflow/stacking contexts */}
              <AnimatePresence>
                {isExpanded && activeField && searchDropdownVisible && (
                  <UnifiedPopupContainer
                    key="header-popup"
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      left: popupConfig.left,
                      width: popupConfig.width,
                    }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{
                      layout: { duration: 0.4, ease: "easeInOut" },
                      left: { duration: 0.4, ease: "easeInOut" },
                      width: { duration: 0.4, ease: "easeInOut" },
                      opacity: { duration: 0.25 },
                      scale: { duration: 0.25 },
                      y: { duration: 0.25 },
                    }}
                    style={{ top: popupConfig.top }}
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
                          style={{ width: (POPUP_SIZES[activeField] || 360) - 48 }}
                        >
                          {activeField === "location" && (
                            <LocationList>{renderLocationSuggestions()}</LocationList>
                          )}
                          {activeField === "date" && (
                            <CustomCalendar
                              value={datePickerValue}
                              onChange={setDatePickerValue}
                              onClose={closeActiveField}
                            />
                          )}
                          {activeField === "collection" && (
                            <>
                              <ExploreCollectionSectionLabel>SUGGESTED</ExploreCollectionSectionLabel>
                              <LocationList>
                                <LocationOption
                                  $isActive={!selectedCollection}
                                  onClick={() => { setSelectedCollection(null); closeActiveField(); }}
                                >
                                  <IconBox $bgColor={ICON_PALETTE[0].bg} $iconColor={ICON_PALETTE[0].icon}>
                                    <Sparkles size={18} strokeWidth={2.5} />
                                  </IconBox>
                                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>Any experience</span>
                                    <span style={{ fontSize: 12, color: "#717171" }}>Show all categories</span>
                                  </div>
                                </LocationOption>
                                {iWantCollections.map((c, idx) => {
                                  const active = selectedCollection?.slug === c.slug;
                                  const title = formatCollectionDisplayName(c.name || c.slug);
                                  const theme = ICON_PALETTE[idx % ICON_PALETTE.length];
                                  const secondary = (c.description && String(c.description).trim()) || "Curated experiences";
                                  return (
                                    <LocationOption
                                      key={c.id ?? c.slug}
                                      $isActive={active}
                                      onClick={() => { setSelectedCollection({ slug: c.slug, name: c.name || title }); closeActiveField(); }}
                                    >
                                      <IconBox $bgColor={theme.bg} $iconColor={theme.icon}>
                                        <Sparkles size={18} strokeWidth={2.5} />
                                      </IconBox>
                                      <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                                        <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{title}</span>
                                        <span style={{ fontSize: 12, color: "#717171" }}>{secondary}</span>
                                      </div>
                                    </LocationOption>
                                  );
                                })}
                              </LocationList>
                            </>
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

        <RightSection $pinTopInUnifiedGrid={unifiedExploreChrome}>
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
              onNavigate={(path) => { setIsMenuOpen(false); router.push(path); }}
              onShowSettings={() => { setIsMenuOpen(false); setSettingsDrawerVisible(true); }}
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
