"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Search, MapPin, ChevronLeft, ChevronRight, Star, Minus, Plus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import Image from "next/image";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";
import Link from "next/link";

// --- HELPER HOOK: CLICK OUTSIDE ---
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

const GlobalOverrides = createGlobalStyle`
  .banner-search-container {
    --primary: ${(props) => props.theme.token.colorPrimary || '#e11d48'};
    --text: #222222;
    --gray: #717171;
  }
`;

// --- LAYOUT COMPONENTS ---

const Banner = styled.section`
  display: flex;
  position: relative;
  min-height: 65vh;
  background-color: #000;
  overflow: visible; 
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 760px) {
    min-height: 45vh;
    padding-top: 5rem;
    justify-content: flex-start;
    padding-bottom: 2rem;
    overflow: hidden; 
  }
`;

const BackgroundMediaWrapper = styled.div`
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  overflow: hidden;
  z-index: 0;
`;

const FilteredBackgroundImage = styled.div`
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  filter: blur(2px) hue-rotate(350deg) saturate(1.5);
  scale: 1.05;
  z-index: 0;
  opacity: 0;
  animation: fadeIn 0.6s ease-in forwards;
  animation-delay: 0.1s;
  display: none;
  @media (max-width: 760px) { display: block; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  &::after {
    content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 100px;
    background: linear-gradient(to bottom, transparent, white); z-index: 1;
  }
`;

const Video = styled.video`
  position: absolute;
  width: 100%; height: 100%;
  object-fit: cover; object-position: top;
  transform: scale(1.1);
  filter: brightness(0.8) blur(5px);
  background-color: #000;
  z-index: 0;
  display: block;
  @media (max-width: 760px) { display: none; }
`;

const DesktopContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative; 
  z-index: 20;
  @media (max-width: 760px) { display: none; }
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  padding: 0 2rem;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  z-index: 1;
  padding: 5rem 0;
  width: 100%;
`;

const HeroText = styled.h1`
  font-weight: 900;
  letter-spacing: -1px;
  font-size: 4rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.1;
  color: inherit;
`;

const SubText = styled.p`
  margin: 0;
  margin-bottom: 2rem;
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: -1px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  color: inherit;
`;

const HowItWorksButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  padding: 0;
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.3s ease;
  text-decoration: underline;
  text-underline-offset: 5px;
  &:hover { opacity: 0.8; }
`;

// ------------------------------------------------------------------------
//  CUSTOM SEARCH COMPONENT STYLES
// ------------------------------------------------------------------------

const SearchFormWrapper = styled(motion.form)`
  position: relative;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 100px;
  /* Fix 1: Removed padding to allow edge-to-edge pill */
  padding: 0; 
  /* Fix 1: Fixed height to maintain pill size without padding */
  height: 76px; 
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  width: auto;
  z-index: 50;
`;

// New Active Pill Component
const ActivePill = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 64px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  z-index: 0; 
`;

const Divider = styled.div`
  width: 1px;
  height: 32px;
  background-color: #e5e7eb;
  margin: 0; /* Adjusted margin since parent has no padding */
  flex-shrink: 0;
  transition: opacity 0.2s;
  opacity: ${props => props.$isHidden ? 0 : 1};
`;

const SectionButton = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  height: 100%; 
  padding: 0 24px; 
  border-radius: 32px;
  cursor: pointer;
  background-color: transparent; 
  isolation: isolate;

  &:hover {
    background-color: ${props => props.$isActive ? 'transparent' : '#f3f4f6'}; 
    border-radius: 64px; 
  }
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 2px;
  position: relative;
  z-index: 1; 
`;

const ValueDisplay = styled.div`
  font-size: 15px;
  color: ${props => props.$hasValue ? '#111' : '#9ca3af'};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  position: relative;
  z-index: 1; 
`;

const SearchButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${(props) => props.theme.token.colorPrimary} 0%, ${(props) => props.theme.token.colorPrimaryHover} 100%);
  color: white;
  border: none;
  border-radius: 50px;
  width: 60px; 
  height: 60px;
  /* Fix 1: Adjusted margin since Wrapper padding is gone */
  margin-right: 8px; 
  margin-left: 8px;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
  overflow: hidden;
  z-index: 2;
`;

// --- UNIFIED POPUP CONTAINER ---
const UnifiedPopupContainer = styled(motion.div)`
  position: absolute;
  top: 115%; 
  background: white;
  border-radius: 32px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.05);
  overflow: hidden;
  z-index: 100;
`;

const PopupContentPadding = styled.div`
  padding: 24px;
`;

// --- LOCATION CUSTOM COMPONENTS ---

const LocationInput = styled.input`
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
  &::placeholder { color: #9ca3af; }
`;

const LocationList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
`;

const LocationOption = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #f3f4f6; }
`;

const IconBox = styled.div`
  width: 40px; height: 40px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 16px;
  color: #374151;
  flex-shrink: 0;
`;

// --- CALENDAR CUSTOM COMPONENTS ---

const CalendarWrapper = styled.div`
  width: 100%;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 700;
  font-size: 16px;
  color: #111;
`;

const NavBtn = styled.button`
  background: transparent; border: none; cursor: pointer;
  padding: 8px; border-radius: 50%;
  &:hover { background: #f3f4f6; }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
`;

const DayBtn = styled.button`
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$isSelected ? props.theme.token.colorPrimary : 'transparent'};
  color: ${props => props.$isSelected ? 'white' : props.$isDisabled ? '#e5e7eb' : '#374151'};
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;

  &:hover {
    background: ${props => !props.$isSelected && !props.$isDisabled && '#f3f4f6'};
  }
`;

// --- PARTICIPANT CUSTOM COMPONENTS ---

const ParticipantRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%; /* Fill container */
  padding: 8px 0;
`;

const CounterBtn = styled.button`
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #374151;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &:hover:not(:disabled) { border-color: #111; color: #111; }
`;

// ------------------------------------------------------------------------
//  SUB-COMPONENTS (Functionality)
// ------------------------------------------------------------------------

const CustomCalendar = ({ value, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(value ? dayjs(value) : dayjs());

  const daysInMonth = currentDate.daysInMonth();
  const startDay = currentDate.startOf('month').day();

  const blanks = Array(startDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateClick = (day) => {
    const newDate = currentDate.date(day);
    onChange(newDate);
    onClose();
  };

  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));

  return (
    <CalendarWrapper>
      <CalendarHeader>
        <NavBtn onClick={prevMonth} type="button"><ChevronLeft size={20} /></NavBtn>
        <span>{currentDate.format("MMMM YYYY")}</span>
        <NavBtn onClick={nextMonth} type="button"><ChevronRight size={20} /></NavBtn>
      </CalendarHeader>

      <WeekGrid>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
      </WeekGrid>

      <DayGrid>
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(d => {
          const thisDate = currentDate.date(d);
          const isSelected = value && dayjs(value).isSame(thisDate, 'day');
          const isPast = thisDate.isBefore(dayjs().startOf('day'));

          return (
            <DayBtn
              key={d}
              type="button"
              $isSelected={isSelected}
              $isDisabled={isPast}
              disabled={isPast}
              onClick={() => handleDateClick(d)}
            >
              {d}
            </DayBtn>
          );
        })}
      </DayGrid>
    </CalendarWrapper>
  );
};

const CustomParticipant = ({ count, onChange }) => {
  return (
    <ParticipantRow>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontWeight: 700, color: '#111', fontSize: 16 }}>Participants</span>
        <span style={{ fontSize: 13, color: '#717171' }}>Join the class</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CounterBtn
          type="button"
          disabled={count <= 1}
          onClick={() => onChange(Math.max(1, count - 1))}
        >
          <Minus size={16} />
        </CounterBtn>
        <span style={{ width: 24, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>{count}</span>
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
};

// Fix 2: Updated variants to start invisible and wait for container to settle
const contentVariants = {
  enter: {
    opacity: 0,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.1, // Wait for container to start resizing
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0 }
  }
};

const DesktopSearchForm = () => {
  const {
    searchTerm,
    datePickerValue, setDatePickerValue,
    participantCount, setParticipantCount,
    geocodedAddressResults,
    handleLocationChange, handleLocationSelect,
    performSearch
  } = useSearch();

  const [activeField, setActiveField] = useState(null);
  const [popupConfig, setPopupConfig] = useState({ left: 0, width: 400 });
  const [isSwitching, setIsSwitching] = useState(false);

  const containerRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const participantsRef = useRef(null);

  useClickOutside(containerRef, () => {
    setActiveField(null);
    setIsSwitching(false);
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
    setActiveField(null);
    setIsSwitching(false);
  };

  const handleFieldClick = (field) => {
    if (activeField && activeField !== field) {
      setIsSwitching(true);
    } else {
      setIsSwitching(false);
    }
    setActiveField(field);
  };

  const participantDisplay = participantCount === 1
    ? '1 participant'
    : `${participantCount} participants`;

  // --- POSITION & VIEWPORT CHECK LOGIC ---
  useLayoutEffect(() => {
    if (!activeField || !containerRef.current) return;

    const updatePosition = () => {
      const refs = { location: locationRef, date: dateRef, participants: participantsRef };
      const targetRef = refs[activeField];

      if (targetRef?.current && containerRef.current) {
        const buttonRect = targetRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        let width = 400;
        if (activeField === 'date') width = 360;
        if (activeField === 'participants') width = 340;

        let left = 0;
        if (activeField === 'location') {
          left = buttonRect.left - containerRect.left;
        } else if (activeField === 'date') {
          left = (buttonRect.left - containerRect.left) + (buttonRect.width / 2) - (width / 2);
        } else if (activeField === 'participants') {
          left = (buttonRect.right - containerRect.left) - width;
        }

        const absoluteLeft = containerRect.left + left;
        const viewportPadding = 24;
        const windowWidth = window.innerWidth;

        if (absoluteLeft + width > windowWidth - viewportPadding) {
          const overflow = (absoluteLeft + width) - (windowWidth - viewportPadding);
          left -= overflow;
        }

        if (absoluteLeft < viewportPadding) {
          const underflow = viewportPadding - absoluteLeft;
          left += underflow;
        }

        setPopupConfig({ left, width });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [activeField, searchTerm, datePickerValue, participantCount]);

  const renderLocationSuggestions = () => {
    const safeResults = Array.isArray(geocodedAddressResults) ? geocodedAddressResults : [];

    if (searchTerm && safeResults.length > 0) {
      return safeResults.map((result, idx) => (
        <LocationOption key={idx} onClick={() => { handleLocationSelect(result.displayName); setActiveField(null); setIsSwitching(false); }}>
          <IconBox><MapPin size={20} /></IconBox>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: 600, color: '#111' }}>{result.displayName.split(',')[0]}</span>
            <span style={{ fontSize: 13, color: '#717171' }}>{result.displayName}</span>
          </div>
        </LocationOption>
      ));
    }
    return SUGGESTED_AREAS.map((area, idx) => (
      <LocationOption key={idx} onClick={() => { handleLocationSelect(area.name); setActiveField(null); setIsSwitching(false); }}>
        <IconBox>{area.icon}</IconBox>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontWeight: 600, color: '#111' }}>{area.name}</span>
          <span style={{ fontSize: 13, color: '#717171' }}>{area.description}</span>
        </div>
      </LocationOption>
    ));
  };

  return (
    <SearchFormWrapper
      ref={containerRef}
      onSubmit={handleSearchSubmit}
      layout
      animate={{
        backgroundColor: activeField ? "#ebebeb" : "#ffffff"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* 1. LOCATION SECTION */}
      <SectionButton
        ref={locationRef}
        $isActive={activeField === 'location'}
        onClick={() => handleFieldClick('location')}
        style={{ width: '280px', flexShrink: 0 }}
      >
        {activeField === 'location' && (
          <ActivePill layoutId="search-pill" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
        )}

        <Label>Location</Label>
        {activeField === 'location' ? (
          <LocationInput
            autoFocus
            value={searchTerm}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="Where are you looking?"
          />
        ) : (
          <ValueDisplay $hasValue={!!searchTerm}>
            {searchTerm || "Where are you looking?"}
          </ValueDisplay>
        )}
      </SectionButton>

      <Divider $isHidden={activeField === 'location' || activeField === 'date'} />

      {/* 2. DATE SECTION */}
      <SectionButton
        ref={dateRef}
        $isActive={activeField === 'date'}
        onClick={() => handleFieldClick('date')}
        style={{ minWidth: '150px' }}
      >
        {activeField === 'date' && (
          <ActivePill layoutId="search-pill" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
        )}
        <Label>Date</Label>
        <ValueDisplay $hasValue={!!datePickerValue}>
          {datePickerValue ? dayjs(datePickerValue).format("MMM DD, YYYY") : "Any date"}
        </ValueDisplay>
      </SectionButton>

      <Divider $isHidden={activeField === 'date' || activeField === 'participants'} />

      {/* 3. PARTICIPANTS SECTION */}
      <SectionButton
        ref={participantsRef}
        $isActive={activeField === 'participants'}
        onClick={() => handleFieldClick('participants')}
        style={{ minWidth: '150px' }}
      >
        {activeField === 'participants' && (
          <ActivePill layoutId="search-pill" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
        )}
        <Label>Who</Label>
        <ValueDisplay $hasValue={true}>
          {participantDisplay}
        </ValueDisplay>
      </SectionButton>

      {/* SEARCH BUTTON */}
      <SearchButton
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        layout
      >
        <Search size={22} strokeWidth={2.5} />
      </SearchButton>

      {/* UNIFIED POPUP CONTAINER */}
      <AnimatePresence>
        {activeField && (
          <UnifiedPopupContainer
            key="popup-container"
            layout // Enables automatic layout animation
            initial={{ opacity: 0, y: 10, scale: 0.95, left: popupConfig.left, width: popupConfig.width }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              left: popupConfig.left,
              width: popupConfig.width
            }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{
              layout: { duration: 0.4, ease: "easeInOut" },
              left: { duration: isSwitching ? 0.4 : 0, ease: "easeInOut" },
              width: { duration: isSwitching ? 0.4 : 0, ease: "easeInOut" },
              opacity: { duration: 0.25 },
              scale: { duration: 0.25 }
            }}
          >
            <PopupContentPadding>
              <AnimatePresence mode="popLayout">
                {/* Fix 2: Wrap content in a div with fixed width to prevent squashing during transition */}
                <motion.div
                  key={activeField}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ width: popupConfig.width - 48 }} // Subtract padding (24*2) from width
                >
                  {activeField === 'location' && (
                    <>
                      <Label style={{ paddingBottom: 8, color: '#999', textAlign: 'left' }}>SUGGESTED</Label>
                      <LocationList>{renderLocationSuggestions()}</LocationList>
                    </>
                  )}
                  {activeField === 'date' && (
                    <CustomCalendar
                      value={datePickerValue}
                      onChange={setDatePickerValue}
                      onClose={() => handleFieldClick('participants')}
                    />
                  )}
                  {activeField === 'participants' && (
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
  );
};

// ------------------------------------------------------------------------
//  MOBILE / SHARED COMPONENTS
// ------------------------------------------------------------------------

const MobileContainer = styled.div`
  width: 100%;
  padding: 1rem 1.5rem;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 2;
  margin-top: 1rem;
  
  @media (max-width: 760px) {
    display: flex;
    padding-bottom: 4rem;
  }
`;

const HeroTextMobile = styled.h1`
  font-weight: 900;
  font-size: 2.2rem;
  text-align: center;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  margin: 0;
  line-height: 1.1;
`;

const SubTextMobile = styled.p`
  font-size: 0.95rem;
  color: rgba(255,255,255,0.95);
  text-align: center;
  margin: 0;
  max-width: 90%;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
`;

const StaticSearchPill = styled(motion.button)`
  background: #ffffff;
  border: none;
  border-radius: 100px;
  padding: 10px 16px 10px 20px;
  width: 100%;
  max-width: 360px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  
  .content {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    flex: 1;
    min-width: 0;
  }
  
  .icon-circle {
    width: 36px;
    height: 36px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #222;
  }
`;

const PillText = styled.div`
  font-family: 'ProximaSoft', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PillSubtext = styled.div`
  font-family: 'ProximaSoft', sans-serif;
  font-size: 13px;
  color: #717171;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BLACK_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ------------------------------------------------------------------------
//  BANNER WRAPPER & EXPORT
// ------------------------------------------------------------------------

const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  background-color: rgb(85 13 25);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 10px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-height: 56px;
  @media (max-width: 768px) { display: none; }
`;
const BannerContainer = styled.div`
  display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1200px; gap: 16px;
  @media (max-width: 768px) { display: none; }
`;
const LeftContent = styled.div`
  display: flex; align-items: center; gap: 12px; flex: 1; font-family: "ProximaSoft", sans-serif; font-size: 15px; line-height: 1.4;
  @media (max-width: 900px) { font-size: 13px; }
  @media (max-width: 768px) { display: none; }
`;
const IconBoxBanner = styled.div`
  display: flex; align-items: center; justify-content: center; min-width: 24px; margin-top: 2px;
`;
const TextContent = styled.div`
  display: flex; flex-wrap: wrap; gap: 4px;
  strong { font-weight: 700; }
  span { opacity: 0.95; }
`;
const DesktopDescription = styled.span`
  display: inline;
  @media (max-width: 600px) { display: none; }
`;
const ActionGroup = styled.div`
  display: flex; align-items: center; gap: 16px; flex-shrink: 0;
  @media (max-width: 768px) { display: none; }
`;
const PillButton = styled(Link)`
  display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 100px; padding: 6px 20px; font-family: "ProximaSoft", sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; background: transparent; transition: all 0.2s ease; white-space: nowrap;
  &:hover { background: #ffffff; color: #7a1f2e; border-color: #ffffff; }
`;
const SecondaryLink = styled(Link)`
  display: flex; align-items: center; gap: 6px; font-family: "ProximaSoft", sans-serif; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.9); text-decoration: none; transition: opacity 0.2s; white-space: nowrap;
  &:hover { opacity: 1; color: #ffffff; text-decoration: underline; }
  svg { transition: transform 0.2s ease; }
  &:hover svg { transform: translateX(3px); }
`;

export const AnnouncementBanner = () => {
  return (
    <BannerWrapper>
      <BannerContainer>
        <LeftContent>
          <IconBoxBanner>
            <lord-icon src="https://cdn.lordicon.com/yxsbonud.json" trigger="in" state="in-reveal" style={{ width: "24px", height: "24px" }}></lord-icon>
          </IconBoxBanner>
          <TextContent>
            <strong>Introducing Courses</strong><span>&mdash;</span>
            <DesktopDescription>Book courses with multiple sessions at once. Perfect for learning new skills. 🔥</DesktopDescription>
          </TextContent>
        </LeftContent>
        <ActionGroup>
          <PillButton href="/explore?type=course">Find a Course</PillButton>
          <SecondaryLink href="/business">Business? <ArrowRight size={14} /></SecondaryLink>
        </ActionGroup>
      </BannerContainer>
    </BannerWrapper>
  );
};

// --- TRUST BANNER ---

const TrustStripWrapper = styled.div`
  position: absolute; bottom: 0; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;
  background: rgba(0, 0, 0, 0.27); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 1.25rem 1.5rem;
  @media (max-width: 600px) { padding: 1rem; }
`;
const WaveContainer = styled.div`
  position: absolute; top: -25px; left: 0; width: 100%; height: 25px; overflow: hidden; z-index: 11; pointer-events: none;
  svg { display: block; width: 100%; height: 100%; fill: rgba(0, 0, 0, 0.27); }
`;
const TrustContent = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 32px; max-width: 1200px; width: 100%; position: relative;
  @media (max-width: 800px) { gap: 16px; flex-wrap: wrap; justify-content: center; }
`;
const AvatarPile = styled.div`
  display: flex; align-items: center; padding: 10px 0;
  @media (max-width: 600px) { display: none; }
`;
const AvatarItem = styled.div`
  position: relative; width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.3s ease;
  &:hover { z-index: 50 !important; transform: scale(1.1) translateY(-2px) !important; }
`;
const CenterInfo = styled.div`
  display: flex; align-items: center; gap: 16px;
  @media (max-width: 600px) { flex-direction: column; gap: 4px; text-align: center; }
`;
const StarCluster = styled.div`
  display: flex; align-items: center; gap: 2px;
  svg { fill: #FFD700; color: #FFD700; filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.5)); }
`;
const TrustText = styled.div`
  display: flex; flex-direction: column; line-height: 1.2;
  .title { color: #fff; font-family: 'ProximaSoft', sans-serif; font-size: 16px; font-weight: 700; }
  .subtitle { color: rgba(255, 255, 255, 0.8); font-family: 'ProximaSoft', sans-serif; font-size: 13px; font-weight: 500; }
`;

const BottomTrustBanner = () => {
  const leftSideAvatars = [
    { src: "https://randomuser.me/api/portraits/women/44.jpg", x: 0, y: 0, z: 1 },
    { src: "https://randomuser.me/api/portraits/men/32.jpg", x: -8, y: -6, z: 3 },
    { src: "https://randomuser.me/api/portraits/women/68.jpg", x: -12, y: 5, z: 2 },
    { src: "https://randomuser.me/api/portraits/men/11.jpg", x: -16, y: -3, z: 4 },
  ];
  const rightSideAvatars = [
    { src: "https://randomuser.me/api/portraits/men/85.jpg", x: 0, y: 4, z: 2 },
    { src: "https://randomuser.me/api/portraits/women/12.jpg", x: -10, y: -5, z: 4 },
    { src: "https://randomuser.me/api/portraits/men/22.jpg", x: -14, y: 2, z: 1 },
    { src: "https://randomuser.me/api/portraits/women/90.jpg", x: -20, y: -2, z: 3 },
  ];

  return (
    <TrustStripWrapper>
      <WaveContainer>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,100 C150,200 350,0 500,100 C650,200 800,0 1000,100 C1100,150 1200,100 1200,100 V120 H0 V100 Z"></path>
        </svg>
      </WaveContainer>
      <TrustContent>
        <AvatarPile>
          {leftSideAvatars.map((person, i) => (
            <AvatarItem key={i} style={{ zIndex: person.z, marginLeft: i === 0 ? 0 : `${person.x}px`, transform: `translateY(${person.y}px)` }}>
              <Image src={person.src} alt="User" width={36} height={36} style={{ objectFit: 'cover' }} />
            </AvatarItem>
          ))}
        </AvatarPile>
        <CenterInfo>
          <StarCluster>{[...Array(5)].map((_, i) => <Star key={i} size={20} strokeWidth={0} />)}</StarCluster>
          <TrustText>
            <span className="title">Thousands of 5-star experiences</span>
            <span className="subtitle">A growing community of learners & hosts</span>
          </TrustText>
        </CenterInfo>
        <AvatarPile>
          {rightSideAvatars.map((person, i) => (
            <AvatarItem key={i} style={{ zIndex: person.z, marginLeft: i === 0 ? 0 : `${person.x}px`, transform: `translateY(${person.y}px)` }}>
              <Image src={person.src} alt="User" width={36} height={36} style={{ objectFit: 'cover' }} />
            </AvatarItem>
          ))}
        </AvatarPile>
      </TrustContent>
    </TrustStripWrapper>
  );
};

// ------------------------------------------------------------------------
//  MOBILE SEARCH PILL LOGIC
// ------------------------------------------------------------------------

const MobileSearchPill = () => {
  const { searchTerm, datePickerValue, participantCount, setIsDrawerOpen } = useSearch();

  const getPillLabel = () => searchTerm || "Find a class?";
  const getPillSubLabel = () => {
    let parts = [];
    if (datePickerValue) parts.push(dayjs(datePickerValue).format("MMM D"));
    else parts.push("Any week");

    const pCount = Math.max(1, participantCount);
    if (pCount > 1) parts.push(`${pCount} people`);
    else parts.push("1 person");

    return parts.join(" • ");
  };

  return (
    <StaticSearchPill onClick={() => setIsDrawerOpen(true)} whileTap={{ scale: 0.95 }}>
      <div className="icon-circle"><Search size={22} strokeWidth={2.5} /></div>
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <PillText>{getPillLabel()}</PillText>
          <PillSubtext>{getPillSubLabel()}</PillSubtext>
        </div>
      </div>
    </StaticSearchPill>
  );
};

// ------------------------------------------------------------------------
//  MAIN COMPONENT
// ------------------------------------------------------------------------

const BannerSearch = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // SSR Fallbacks
  const DesktopFallback = () => (
    <SearchFormWrapper as="div">
      <SectionButton><Label>Location</Label><ValueDisplay>Where are you looking?</ValueDisplay></SectionButton>
      <Divider />
      <SectionButton><Label>Date</Label><ValueDisplay>Any date</ValueDisplay></SectionButton>
      <Divider />
      <SectionButton><Label>Who</Label><ValueDisplay>1 participant</ValueDisplay></SectionButton>
      <SearchButton><Search size={22} /></SearchButton>
    </SearchFormWrapper>
  );

  const MobileFallback = () => (
    <StaticSearchPill>
      <div className="icon-circle"><Search size={22} strokeWidth={2.5} /></div>
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <PillText>Find a class?</PillText>
          <PillSubtext>Any Date • 1 person</PillSubtext>
        </div>
      </div>
    </StaticSearchPill>
  );

  return (
    <Banner aria-labelledby="banner-heading">
      <GlobalOverrides />

      <BackgroundMediaWrapper>
        <FilteredBackgroundImage>
          <Image
            src="/homepageMobile.webp"
            alt="Background"
            fill
            priority
            fetchPriority="high"
            quality={85}
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLACK_PIXEL}
            style={{ objectFit: "cover" }}
          />
        </FilteredBackgroundImage>
        <Video autoPlay loop muted playsInline poster="/videos/1.png" preload="none">
          <source src="/videos/Classes.mp4" type="video/mp4" />
        </Video>
      </BackgroundMediaWrapper>

      <DesktopContainer>
        <MainWrapper>
          <MainContent>
            <HeroText id="banner-heading">Learn locally</HeroText>
            <SubText>Book unique classes & workshops near you. Instantly.</SubText>

            {isMounted ? <DesktopSearchForm /> : <DesktopFallback />}

            <HowItWorksButton onClick={scrollToHowItWorks}>
              How ClassEasily works <ChevronRight size={16} />
            </HowItWorksButton>
          </MainContent>
        </MainWrapper>
      </DesktopContainer>

      <MobileContainer>
        <HeroTextMobile>Learn locally</HeroTextMobile>
        <SubTextMobile>Discover unique classes & workshops near you.</SubTextMobile>
        {isMounted ? <MobileSearchPill /> : <MobileFallback />}
      </MobileContainer>

      <BottomTrustBanner />
    </Banner>
  );
};

export default BannerSearch;