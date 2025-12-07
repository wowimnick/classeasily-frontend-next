"use client";

import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Drawer } from "vaul";
import { Search, X, MapPin, ChevronLeft, ChevronRight, Minus, Plus, Calendar as CalendarIcon, Users, Map } from "lucide-react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";

// --- ANIMATIONS ---
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// --- STYLED COMPONENTS ---

const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  backdrop-filter: blur(2px);
`;

const DrawerContent = styled(Drawer.Content)`
  background: #F2F2F2;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  height: auto;
  max-height: 94vh; 
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  outline: none;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
  padding-bottom: env(safe-area-inset-bottom);
  -webkit-font-smoothing: antialiased;
`;

const HandleBar = styled.div`
  width: 40px;
  height: 4px;
  background: #D1D5DB;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px 16px;
`;

const CloseButton = styled.button`
  background: #E5E5E5;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  transition: background 0.2s;
  &:active { background: #d4d4d4; }
`;

const DrawerBody = styled.div`
  padding: 0 16px 24px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

const DrawerFooter = styled.div`
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  gap: 16px;
`;

const ClearBtn = styled.button`
  font-weight: 600;
  font-size: 15px;
  color: #717171;
  background: transparent;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  font-family: "ProximaSoft", sans-serif;
`;

const SearchButtonFull = styled.button`
  flex: 1;
  background: linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%);
  color: white;
  font-weight: 700;
  font-size: 16px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(230, 30, 77, 0.2);
  font-family: "ProximaSoft", sans-serif;
  &:active { opacity: 0.9; transform: scale(0.98); transition: transform 0.1s; }
`;

// --- FIELD CARD COMPONENTS ---

const FieldCard = styled.div`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
`;

const FieldHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  cursor: pointer;
  background: white;
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #f9f9f9; }
`;

const LabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FieldLabel = styled.span`
  font-size: 13px;
  color: #717171;
  font-weight: 700;
  font-family: "ProximaSoft", sans-serif;
`;

const FieldValue = styled.span`
  font-size: 16px;
  color: ${props => props.$active ? props.theme.token?.colorPrimary || '#e11d48' : '#222'};
  font-weight: 600;
  font-family: "ProximaSoft", sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
`;

// Animation wrapper: Padding must be inside for height animation to work without snapping
const AnimatedWrapper = styled(motion.div)`
  overflow: hidden;
`;

const ContentPadding = styled.div`
  padding: 0 20px 24px 20px;
`;

// --- LOCATION INPUT STYLES ---

const StyledInput = styled.input`
  width: 100%;
  font-size: 18px;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #f9fafb;
  color: #222;
  font-family: "ProximaSoft", sans-serif;
  font-weight: 600;
  outline: none;
  margin-bottom: 16px;
  
  &:focus {
    background: white;
    border-color: #222;
  }

  &::placeholder {
    color: #999;
    font-weight: 500;
  }
`;

const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.1s;
  
  &:active { background: #f3f4f6; }
`;

const IconBox = styled.div`
  width: 36px; height: 36px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #555;
  flex-shrink: 0;
`;

// --- SKELETON LOADER ---

const SkeletonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
`;

const SkeletonIcon = styled.div`
  width: 36px; height: 36px; border-radius: 10px;
  background: #f0f0f0;
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  flex-shrink: 0;
`;

const SkeletonTextWrapper = styled.div`
  display: flex; flex-direction: column; gap: 6px; flex: 1;
`;

const SkeletonLine = styled.div`
  height: ${props => props.height || '14px'};
  width: ${props => props.width || '60%'};
  border-radius: 4px;
  background: #f0f0f0;
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const LocationSkeleton = () => (
  <SuggestionList>
    {[1, 2, 3].map((i) => (
      <SkeletonItem key={i}>
        <SkeletonIcon />
        <SkeletonTextWrapper>
          <SkeletonLine width="50%" height="14px" />
          <SkeletonLine width="80%" height="12px" />
        </SkeletonTextWrapper>
      </SkeletonItem>
    ))}
  </SuggestionList>
);

// --- CALENDAR STYLES ---
const CalendarWrapper = styled.div`
  width: 100%;
`;
const CalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; font-weight: 700; font-size: 16px; color: #222;
  font-family: "ProximaSoft", sans-serif;
`;
const NavBtn = styled.button`
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #eee; background: white;
  display: flex; align-items: center; justify-content: center;
  &:active { background: #f5f5f5; }
`;
const WeekGrid = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 8px;
  text-align: center; font-size: 12px; color: #999; font-family: "ProximaSoft", sans-serif;
`;
const DayGrid = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 8px;
`;
const DayBtn = styled.button`
  width: 100%; aspect-ratio: 1; border-radius: 50%; border: none;
  background: ${props => props.$isSelected ? '#e11d48' : 'transparent'};
  color: ${props => props.$isSelected ? 'white' : props.$isDisabled ? '#ddd' : '#222'};
  font-weight: 600; font-size: 15px; display: flex; align-items: center; justify-content: center;
  font-family: "ProximaSoft", sans-serif;
  transition: background 0.1s;
  &:active { background: ${props => !props.$isSelected && !props.$isDisabled && '#f0f0f0'}; }
`;

// --- PARTICIPANT STYLES ---
const CounterRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0;
`;
const CountBtn = styled.button`
  width: 44px; height: 44px; border-radius: 50%; border: 1px solid #ddd; background: white;
  display: flex; align-items: center; justify-content: center; color: #444;
  &:disabled { opacity: 0.3; }
  &:active:not(:disabled) { border-color: #000; color: #000; }
`;
const CountVal = styled.span`
  width: 40px; text-align: center; font-weight: 600; font-size: 18px; font-family: "ProximaSoft", sans-serif;
`;

// --- HELPER COMPONENTS ---

const CustomCalendar = ({ value, onChange }) => {
  const [currentDate, setCurrentDate] = useState(value ? dayjs(value) : dayjs());

  const daysInMonth = currentDate.daysInMonth();
  const startDay = currentDate.startOf('month').day();
  const blanks = Array(startDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));

  const handleDayClick = (day) => {
    const selected = currentDate.date(day);
    onChange(selected);
  };

  return (
    <CalendarWrapper>
      <CalHeader>
        <NavBtn onClick={prevMonth} disabled={currentDate.isSame(dayjs(), 'month')}>
            <ChevronLeft size={18} />
        </NavBtn>
        <span>{currentDate.format("MMMM YYYY")}</span>
        <NavBtn onClick={nextMonth}><ChevronRight size={18} /></NavBtn>
      </CalHeader>
      <WeekGrid>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
      </WeekGrid>
      <DayGrid>
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
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
              onClick={() => handleDayClick(d)}
            >
              {d}
            </DayBtn>
          );
        })}
      </DayGrid>
    </CalendarWrapper>
  );
};

// --- MAIN DRAWER COMPONENT ---

const SearchDrawer = () => {
  const {
    isDrawerOpen, setIsDrawerOpen,
    searchTerm, setSearchTerm,
    datePickerValue, setDatePickerValue,
    participantCount, setParticipantCount,
    geocoding, geocodedAddressResults,
    handleLocationChange, handleLocationSelect,
    clearAll, performSearch
  } = useSearch();

  const [activeStep, setActiveStep] = useState('location'); // location | date | guests
  const inputRef = useRef(null);

  // Focus input when location step activates
  useEffect(() => {
    if (activeStep === 'location' && isDrawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeStep, isDrawerOpen]);

  // Reset step logic on open
  useEffect(() => {
    if (isDrawerOpen) {
      if (!searchTerm) setActiveStep('location');
      else setActiveStep(null); 
    }
  }, [isDrawerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchClick = () => {
    performSearch();
    setIsDrawerOpen(false);
  };

  // Helper to safely select and advance
  const onLocationSelect = (value) => {
    handleLocationSelect(value);
    
    // 1. Blur input to close keyboard on mobile
    if (inputRef.current) inputRef.current.blur();

    // 2. Immediately switch step to collapse the location field
    setActiveStep('date');
  };

  const renderSuggestions = () => {
    if (geocoding) return <LocationSkeleton />;

    const hasTerm = searchTerm && searchTerm.length > 0;
    
    // Logic: If term exists, show API results. If empty, show suggested.
    let displayResults = hasTerm ? geocodedAddressResults : SUGGESTED_AREAS;

    // Handle Empty Results:
    // Only show "No results" if the user is typing something new.
    // If they just clicked a valid result (term matches selection), don't show error.
    if (hasTerm && displayResults.length === 0) {
        return (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#717171', fontSize: 14 }}>
                No results found
            </div>
        );
    }

    return (
      <SuggestionList>
        {displayResults.map((item, idx) => {
          const label = hasTerm ? item.displayName.split(',')[0] : item.name;
          const subLabel = hasTerm ? item.displayName : item.description;
          const icon = hasTerm ? <MapPin size={18} /> : item.icon;
          const valueToSelect = hasTerm ? item.displayName : item.name;

          return (
            <SuggestionItem 
              key={idx} 
              onClick={() => onLocationSelect(valueToSelect)}
            >
              <IconBox>{icon}</IconBox>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'ProximaSoft, sans-serif' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#717171', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontFamily: 'ProximaSoft, sans-serif' }}>{subLabel}</span>
              </div>
            </SuggestionItem>
          );
        })}
      </SuggestionList>
    );
  };

  return (
    <Drawer.Root 
      open={isDrawerOpen} 
      onOpenChange={setIsDrawerOpen}
      preventScrollRestoration={false} 
      shouldScaleBackground
    >
      <Drawer.Portal>
        <DrawerOverlay />
        <DrawerContent>
          <HandleBar />
          
          <DrawerHeader>
            <CloseButton onClick={() => setIsDrawerOpen(false)}><X size={18} /></CloseButton>
            <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'ProximaSoft, sans-serif' }}>Search</span>
            <div style={{ width: 32 }} />
          </DrawerHeader>

          <DrawerBody>
            
            {/* 1. LOCATION CARD */}
            <FieldCard>
              <FieldHeader onClick={() => setActiveStep(activeStep === 'location' ? null : 'location')}>
                <LabelGroup>
                  <FieldLabel>Location</FieldLabel>
                  {activeStep !== 'location' && (
                    <FieldValue $active={!!searchTerm}>
                      {searchTerm || "Where are you looking?"}
                    </FieldValue>
                  )}
                </LabelGroup>
                {activeStep !== 'location' && <Map size={20} color="#999" />}
              </FieldHeader>
              
              <AnimatePresence initial={false}>
                {activeStep === 'location' && (
                  <AnimatedWrapper
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  >
                    <ContentPadding>
                        <StyledInput 
                          ref={inputRef}
                          placeholder="Search destinations" 
                          value={searchTerm}
                          onChange={(e) => handleLocationChange(e.target.value)}
                        />
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#999', marginBottom: 8, letterSpacing: 0.5 }}>
                          {searchTerm ? 'SEARCH RESULTS' : 'SUGGESTED'}
                        </div>
                        {renderSuggestions()}
                    </ContentPadding>
                  </AnimatedWrapper>
                )}
              </AnimatePresence>
            </FieldCard>

            {/* 2. DATE CARD */}
            <FieldCard>
              <FieldHeader onClick={() => setActiveStep(activeStep === 'date' ? null : 'date')}>
                <LabelGroup>
                  <FieldLabel>Date</FieldLabel>
                  {activeStep !== 'date' && (
                    <FieldValue $active={!!datePickerValue}>
                      {datePickerValue ? dayjs(datePickerValue).format("MMM DD, YYYY") : "Any date"}
                    </FieldValue>
                  )}
                </LabelGroup>
                {activeStep !== 'date' && <CalendarIcon size={20} color="#999" />}
              </FieldHeader>

              <AnimatePresence initial={false}>
                {activeStep === 'date' && (
                  <AnimatedWrapper
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  >
                    <ContentPadding>
                        <CustomCalendar 
                          value={datePickerValue} 
                          onChange={(d) => { setDatePickerValue(d); setActiveStep('guests'); }} 
                        />
                    </ContentPadding>
                  </AnimatedWrapper>
                )}
              </AnimatePresence>
            </FieldCard>

            {/* 3. GUESTS CARD */}
            <FieldCard>
              <FieldHeader onClick={() => setActiveStep(activeStep === 'guests' ? null : 'guests')}>
                <LabelGroup>
                  <FieldLabel>Who</FieldLabel>
                  {activeStep !== 'guests' && (
                    <FieldValue $active={true}>
                      {participantCount === 1 ? '1 participant' : `${participantCount} participants`}
                    </FieldValue>
                  )}
                </LabelGroup>
                {activeStep !== 'guests' && <Users size={20} color="#999" />}
              </FieldHeader>

              <AnimatePresence initial={false}>
                {activeStep === 'guests' && (
                  <AnimatedWrapper
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  >
                     <ContentPadding>
                        <CounterRow>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <span style={{ fontWeight: 600, fontSize: 16, fontFamily: "ProximaSoft, sans-serif" }}>Participants</span>
                             <span style={{ fontSize: 13, color: '#717171' }}>Join the class</span>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                             <CountBtn 
                               type="button"
                               onClick={() => setParticipantCount(Math.max(1, participantCount - 1))}
                               disabled={participantCount <= 1}
                             >
                               <Minus size={18} />
                             </CountBtn>
                             <CountVal>{participantCount}</CountVal>
                             <CountBtn 
                               type="button"
                               onClick={() => setParticipantCount(participantCount + 1)}
                             >
                               <Plus size={18} />
                             </CountBtn>
                           </div>
                        </CounterRow>
                     </ContentPadding>
                  </AnimatedWrapper>
                )}
              </AnimatePresence>
            </FieldCard>

          </DrawerBody>

          <DrawerFooter>
            <ClearBtn onClick={clearAll}>Clear all</ClearBtn>
            <SearchButtonFull onClick={handleSearchClick}>
              <Search size={18} /> Search
            </SearchButtonFull>
          </DrawerFooter>

        </DrawerContent>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SearchDrawer;