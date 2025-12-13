"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";

// Dynamic Imports
const CustomUserMenu = dynamic(
  () => import("@/components/header/CustomUserMenu.jsx"),
  { ssr: false, loading: () => null }
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

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});

const SettingsModal = dynamic(
  () => import("@/components/header/SettingsDrawer"),
  { ssr: false }
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
  transition: background-color 0.3s, border-bottom 0.3s;
  /* Ensure Header is above other page content like maps/heros */
  z-index: 1001;
  /* Allow popups to flow outside the header bounds */
  overflow: visible;

  @media (max-width: 768px) {
    height: 60px;
    padding: 0 1rem;
    gap: 0.5rem;
    z-index: 999;
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

// Updated User Pill to be larger/consistent with search pill
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
//  COMPACT SEARCH PILL COMPONENTS (Redesigned)
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
  height: 56px; /* Primary Search Pill Height */
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
  top: 70px; /* Below the header */
  background: white;
  border-radius: 24px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  /* Very high Z-index to ensure it sits on top of everything */
  z-index: 2000;
`;

const PopupContentPadding = styled.div`
  padding: 20px;
`;

// --- REUSED SUB-COMPONENTS (Calendar, Location List, etc) ---

// 1. Calendar
const CalendarWrapper = styled.div`
  width: 100%;
`;
const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 15px;
  color: #111;
`;
const NavBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  &:hover {
    background: #f3f4f6;
  }
`;
const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
`;
const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 2px;
`;
const DayBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${(props) =>
    props.$isSelected ? props.theme.token.colorPrimary : "transparent"};
  color: ${(props) =>
    props.$isSelected ? "white" : props.$isDisabled ? "#e5e7eb" : "#374151"};
  cursor: ${(props) => (props.$isDisabled ? "not-allowed" : "pointer")};
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  &:hover {
    background: ${(props) =>
    !props.$isSelected && !props.$isDisabled && "#f3f4f6"};
  }
`;

const CustomCalendar = ({ value, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(
    value ? dayjs(value) : dayjs()
  );
  const daysInMonth = currentDate.daysInMonth();
  const startDay = currentDate.startOf("month").day();
  const blanks = Array(startDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <CalendarWrapper>
      <CalendarHeader>
        <NavBtn
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
          type="button"
        >
          <ChevronLeft size={18} />
        </NavBtn>
        <span>{currentDate.format("MMMM YYYY")}</span>
        <NavBtn
          onClick={() => setCurrentDate(currentDate.add(1, "month"))}
          type="button"
        >
          <ChevronRight size={18} />
        </NavBtn>
      </CalendarHeader>
      <WeekGrid>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </WeekGrid>
      <DayGrid>
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const thisDate = currentDate.date(d);
          const isSelected = value && dayjs(value).isSame(thisDate, "day");
          const isPast = thisDate.isBefore(dayjs().startOf("day"));
          return (
            <DayBtn
              key={d}
              type="button"
              $isSelected={isSelected}
              $isDisabled={isPast}
              disabled={isPast}
              onClick={() => {
                onChange(thisDate);
                onClose();
              }}
            >
              {d}
            </DayBtn>
          );
        })}
      </DayGrid>
    </CalendarWrapper>
  );
};

// 2. Participants
const ParticipantRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
`;
const CounterBtn = styled.button`
  width: 30px;
  height: 30px;
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
      <span style={{ fontWeight: 600, color: "#111", fontSize: 15 }}>
        Participants
      </span>
      <span style={{ fontSize: 12, color: "#717171" }}>Join the class</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <CounterBtn
        type="button"
        disabled={count <= 1}
        onClick={() => onChange(Math.max(1, count - 1))}
      >
        <Minus size={14} />
      </CounterBtn>
      <span
        style={{
          width: 20,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {count}
      </span>
      <CounterBtn
        type="button"
        disabled={count >= 20}
        onClick={() => onChange(count + 1)}
      >
        <Plus size={14} />
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
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #374151;
  flex-shrink: 0;
`;

// --- CONSTANTS ---
const POPUP_SIZES = {
  location: 360,
  date: 340,
  participants: 320,
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
  const searchParams = useSearchParams();
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
    setSelectedLocation,
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

  // Sync Params
  useEffect(() => {
    const locParam = searchParams.get("location");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const dateParam = searchParams.get("date");
    const participantsParam = searchParams.get("participants");

    if (locParam) {
      setSearchTerm(locParam);
      if (latParam && lngParam) {
        setSelectedLocation({
          displayName: locParam,
          coordinates: { lat: parseFloat(latParam), lng: parseFloat(lngParam) },
          citySlug: null,
          provinceSlug: null,
        });
      }
    }
    if (dateParam) {
      const parsedDate = dayjs(dateParam);
      setDatePickerValue(parsedDate.isValid() ? parsedDate : null);
    }
    if (participantsParam) {
      const numParticipants = parseInt(participantsParam, 10);
      setParticipantCount(
        !isNaN(numParticipants) && numParticipants > 0 ? numParticipants : 1
      );
    }
  }, [
    searchParams,
    setSearchTerm,
    setDatePickerValue,
    setParticipantCount,
    setSelectedLocation,
  ]);

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

        // Calculate center relative to the button
        let left =
          buttonRect.left -
          containerRect.left +
          buttonRect.width / 2 -
          width / 2;

        // Boundaries
        if (left < 0) left = 0;
        if (left + width > containerRect.width)
          left = containerRect.width - width;

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

  const renderLocationSuggestions = () => {
    const safeResults = Array.isArray(geocodedAddressResults)
      ? geocodedAddressResults
      : [];
    if (searchTerm && safeResults.length > 0) {
      return safeResults.map((result, idx) => (
        <LocationOption
          key={idx}
          onClick={() => {
            handleLocationSelect(result.displayName);
            setActiveField(null);
          }}
        >
          <IconBox>
            <MapPin size={18} />
          </IconBox>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>
              {result.displayName.split(",")[0]}
            </span>
            <span style={{ fontSize: 11, color: "#717171" }}>
              {result.displayName}
            </span>
          </div>
        </LocationOption>
      ));
    }
    return SUGGESTED_AREAS.map((area, idx) => (
      <LocationOption
        key={idx}
        onClick={() => {
          handleLocationSelect(area.name);
          setActiveField(null);
        }}
      >
        <IconBox>{area.icon}</IconBox>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>
            {area.name}
          </span>
          <span style={{ fontSize: 11, color: "#717171" }}>
            {area.description}
          </span>
        </div>
      </LocationOption>
    ));
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
                style={{ width: 140 }}
              >
                {activeField === "date" && (
                  <ActivePillBackground
                    layoutId="header-pill"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <FieldLabel>Date</FieldLabel>
                <ValueDisplay $hasValue={!!datePickerValue}>
                  {datePickerValue
                    ? dayjs(datePickerValue).format("MMM DD")
                    : "Any date"}
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
                    ? "1 Guest"
                    : `${participantCount} Guests`}
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
                            width: (POPUP_SIZES[activeField] || 360) - 40,
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
