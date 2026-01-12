"use client";

import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { Drawer } from "vaul";
import { Button, Input } from "antd";
import {
  Search,
  MapPin,
  Minus,
  Plus,
  Calendar as CalendarIcon,
  Users,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import dayjs from "dayjs";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";
import { motion } from "framer-motion";

// --- ANIMATIONS ---
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// --- GLOBAL DRAWER STYLES ---

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9990;
  backdrop-filter: blur(2px);
`;

const ContentBase = css`
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  outline: none;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  padding-bottom: env(safe-area-inset-bottom);
  max-height: 96vh;
`;

const MainContent = styled(Drawer.Content)`
  ${ContentBase};
  z-index: 9991;
  height: auto;
`;

const NestedContent = styled(Drawer.Content)`
  ${ContentBase};
  z-index: 9995;
  height: auto;
  max-height: 85vh; /* Slightly shorter for nested feel */
`;

const Handle = styled.div`
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 10px auto 6px;
  flex-shrink: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 16px 12px;
  background: #f7f7f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 44px;
`;

const Title = styled.span`
  font-weight: 700;
  font-size: 16px;
  font-family: "ProximaSoft", sans-serif;
  color: #111;
`;

const Body = styled.div`
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Footer = styled.div`
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

// --- COMPONENT STYLES ---

const MenuRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: white;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:active {
    transform: scale(0.99);
    background: #fafafa;
  }
`;

const RowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  overflow: hidden;
`;

const RowIcon = styled.div`
  color: #717171;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 1px;
`;

const RowLabel = styled.span`
  font-size: 12px;
  color: #717171;
  font-weight: 600;
  font-family: "ProximaSoft", sans-serif;
`;

const RowValue = styled.span`
  font-size: 15px;
  color: ${(props) => (props.$hasValue ? "#111" : "#9ca3af")};
  font-weight: 600;
  font-family: "ProximaSoft", sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SearchBtn = styled(Button)`
  flex: 1;
  background: linear-gradient(
    to right,
    #e61e4d 0%,
    #e31c5f 50%,
    #d70466 100%
  ) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  height: 48px !important;
  border-radius: 12px !important;
  border: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(230, 30, 77, 0.2) !important;
  font-family: "ProximaSoft", sans-serif !important;

  &:active,
  &:hover,
  &:focus {
    opacity: 0.9;
    transform: scale(0.98);
    color: white !important;
    background: linear-gradient(
      to right,
      #e61e4d 0%,
      #e31c5f 50%,
      #d70466 100%
    ) !important;
  }
`;

const ClearBtn = styled(Button)`
  font-weight: 600 !important;
  font-size: 14px !important;
  color: #717171 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  text-decoration: underline;
  cursor: pointer;
  font-family: "ProximaSoft", sans-serif !important;
  padding: 0 8px !important;
  height: auto !important;

  &:hover {
    color: #111 !important;
    background: transparent !important;
  }
`;

// --- LOCATION SPECIFIC STYLES ---

const LocationInputWrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  border: 1px solid #e5e5e5;
  margin-bottom: 12px;
`;

const StyledInput = styled(Input)`
  width: 100%;
  font-size: 15px !important;
  padding: 8px 0 !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  font-family: "ProximaSoft", sans-serif !important;
  font-weight: 600 !important;
  color: #111 !important;
  box-shadow: none !important;

  &::placeholder {
    color: #9ca3af !important;
    font-weight: 500 !important;
  }
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  &:active {
    background: #f0f0f0;
  }
`;

const IconBox = styled.div`
  width: 28px;
  height: 28px;
  background: #f3f4f6;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  flex-shrink: 0;
`;

// --- CALENDAR STYLES ---

const CalendarWrapper = styled.div`
  background: white;
  border-radius: 14px;
  padding: 12px;
`;

const CalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 700;
  font-size: 15px;
  color: #222;
  font-family: "ProximaSoft", sans-serif;
`;

const NavBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #eee;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  &:active {
    background: #f5f5f5;
  }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
  text-align: center;
  font-size: 11px;
  color: #999;
  font-family: "ProximaSoft", sans-serif;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
`;

const DayBtn = styled(motion.button)`
  width: 40px;
  height: 40px;
  border: none;
  position: relative;

  /* Dynamic Border Radius for Range Effect */
  border-radius: ${(props) => {
    if (props.$isRangeStart && props.$isRangeEnd) return "50%"; // Single day range
    if (props.$isRangeStart) return "50% 0 0 50%";
    if (props.$isRangeEnd) return "0 50% 50% 0";
    if (props.$isInRange) return "0";
    return "50%"; // Default single hover
  }};

  background: ${(props) =>
    props.$isRangeStart || props.$isRangeEnd
      ? "#e11d48"
      : props.$isInRange
      ? "#ffe4e6" // Very light pink
      : "transparent"};

  color: ${(props) =>
    props.$isRangeStart || props.$isRangeEnd
      ? "white"
      : props.$isDisabled
      ? "#e5e7eb"
      : "#374151"};

  cursor: ${(props) => (props.$isDisabled ? "not-allowed" : "pointer")};
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-family: "ProximaSoft", sans-serif;

  /* Ensure background spans full width for middle items */
  width: ${(props) => (props.$isInRange ? "100%" : "40px")};

  &:active {
    background: ${(props) =>
      !(props.$isRangeStart || props.$isRangeEnd || props.$isInRange) &&
      !props.$isDisabled &&
      "#f0f0f0"};
  }
`;

const QuickChipsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 12px;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
`;

const QuickChip = styled.button`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  font-family: "ProximaSoft", sans-serif;

  &:active {
    background: #f9fafb;
    border-color: #111;
    color: #111;
  }
`;

// --- PARTICIPANT STYLES ---

const ParticipantCard = styled.div`
  background: white;
  padding: 16px 20px;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CountBtn = styled(Button)`
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  border: 1px solid #ddd !important;
  background: white !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #444 !important;
  padding: 0 !important;
  min-width: unset !important;
  box-shadow: none !important;

  &:disabled {
    opacity: 0.3 !important;
    background: #f9f9f9 !important;
    border-color: #eee !important;
  }
  &:hover:not(:disabled) {
    border-color: #111 !important;
    color: #111 !important;
  }
`;

const CountVal = styled.span`
  width: 32px;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  font-family: "ProximaSoft", sans-serif;
`;

// --- HELPER COMPONENTS ---

const CustomCalendar = ({ value, onChange }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const selectedStart = value?.start
    ? dayjs(value.start)
    : value && value.isValid && value.isValid()
    ? dayjs(value)
    : null;
  const selectedEnd = value?.end ? dayjs(value.end) : null;

  const daysInMonth = currentDate.daysInMonth();
  const startDay = currentDate.startOf("month").day();
  const blanks = Array(startDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const applyPreset = (type) => {
    const today = dayjs();
    let start, end;

    switch (type) {
      case "weekend":
        start =
          today.day() === 0 ? today.day(6).subtract(1, "week") : today.day(6);
        // If today is Sunday(0), subtract to get past Saturday or logic depends on "This Weekend" meaning.
        // Better logic: If today is Sun, "This Weekend" usually means the one just ending or user wants next.
        // Standard convention: "This Weekend" = Upcoming Sat/Sun.
        if (today.day() === 0) {
          // It is Sunday today
          start = today.subtract(1, "day"); // Sat
          end = today; // Sun
        } else {
          start = today.day(6);
          end = today.day(6).add(1, "day");
        }
        // Actually, let's keep it simple: upcoming Saturday + Sunday
        start = today.day(6);
        end = today.day(6).add(1, "day");
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
    }
    onChange({
      start: start.format("YYYY-MM-DD"),
      end: end ? end.format("YYYY-MM-DD") : null,
    });
  };

  const handleDayClick = (day) => {
    // Basic single selection for tap
    const selected = currentDate.date(day);
    onChange(selected.format("YYYY-MM-DD"));
  };

  return (
    <CalendarWrapper>
      <CalHeader>
        <NavBtn
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
        >
          <ChevronLeft size={16} />
        </NavBtn>
        <span>{currentDate.format("MMMM YYYY")}</span>
        <NavBtn onClick={() => setCurrentDate(currentDate.add(1, "month"))}>
          <ChevronRight size={16} />
        </NavBtn>
      </CalHeader>
      <WeekGrid>
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </WeekGrid>
      <DayGrid>
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((d) => {
          const thisDate = currentDate.date(d);
          const isPast = thisDate.isBefore(dayjs().startOf("day"));

          let isRangeStart = false;
          let isRangeEnd = false;
          let isInRange = false;

          if (selectedStart && !selectedEnd) {
            isRangeStart = thisDate.isSame(selectedStart, "day");
            isRangeEnd = isRangeStart;
          } else if (selectedStart && selectedEnd) {
            const s = selectedStart.startOf("day");
            const e = selectedEnd.startOf("day");
            const t = thisDate.startOf("day");

            isRangeStart = t.isSame(s);
            isRangeEnd = t.isSame(e);
            isInRange = t.isAfter(s) && t.isBefore(e);
          }

          return (
            <DayBtn
              key={d}
              type="button"
              layout
              $isRangeStart={isRangeStart}
              $isRangeEnd={isRangeEnd}
              $isInRange={isInRange}
              $isDisabled={isPast}
              disabled={isPast}
              onClick={() => handleDayClick(d)}
            >
              {d}
            </DayBtn>
          );
        })}
      </DayGrid>

      <QuickChipsGrid>
        <QuickChip type="button" onClick={() => applyPreset("weekend")}>
          This Weekend
        </QuickChip>
        <QuickChip type="button" onClick={() => applyPreset("next_weekend")}>
          Next Weekend
        </QuickChip>
        <QuickChip type="button" onClick={() => applyPreset("this_week")}>
          This Week
        </QuickChip>
        <QuickChip type="button" onClick={() => applyPreset("next_week")}>
          Next Week
        </QuickChip>
      </QuickChipsGrid>
    </CalendarWrapper>
  );
};

// --- SKELETON ---

const SkeletonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 10px;
`;
const ShimmerBox = styled.div`
  background: #f0f0f0;
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${(props) => props.$radius || "4px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "14px"};
`;

const LocationSkeleton = () => (
  <div>
    {[1, 2, 3].map((i) => (
      <SkeletonItem key={i}>
        <ShimmerBox $width="28px" $height="28px" $radius="7px" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
          }}
        >
          <ShimmerBox $width="50%" $height="12px" />
          <ShimmerBox $width="70%" $height="10px" />
        </div>
      </SkeletonItem>
    ))}
  </div>
);

// --- MAIN SEARCH DRAWER COMPONENT ---

const SearchDrawer = () => {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    searchTerm,
    setSearchTerm,
    datePickerValue,
    setDatePickerValue,
    participantCount,
    setParticipantCount,
    geocoding,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    clearAll,
    performSearch,
  } = useSearch();

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isWhoOpen, setIsWhoOpen] = useState(false);

  const inputRef = useRef(null);

  // Auto focus input when location drawer opens
  useEffect(() => {
    if (isLocationOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isLocationOpen]);

  const onSelectLocation = (result) => {
    if (typeof result === "string") {
      handleLocationSelect(result);
    } else {
      handleLocationSelect(result.displayName, {
        coordinates: result.coordinates,
        citySlug: result.citySlug,
        provinceSlug: result.provinceSlug,
      });
    }
    setIsLocationOpen(false);
  };

  const handleSearchClick = () => {
    performSearch();
    setIsDrawerOpen(false);
    setIsLocationOpen(false);
    setIsDateOpen(false);
    setIsWhoOpen(false);
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
    return dayjs(datePickerValue).format("MMM DD, YYYY");
  };

  const renderLocationList = () => {
    if (geocoding) return <LocationSkeleton />;

    const hasTerm = searchTerm && searchTerm.length > 0;
    const list = hasTerm ? geocodedAddressResults : SUGGESTED_AREAS;

    if (hasTerm && list.length === 0) {
      return (
        <div style={{ textAlign: "center", color: "#717171", marginTop: 20 }}>
          No results found
        </div>
      );
    }

    return list.map((item, idx) => {
      const name = hasTerm ? item.displayName.split(",")[0] : item.name;
      const desc = hasTerm ? item.displayName : item.description;
      const icon = hasTerm ? <MapPin size={18} /> : item.icon;

      return (
        <SuggestionItem
          key={idx}
          onClick={() => onSelectLocation(hasTerm ? item : item.name)}
        >
          <IconBox>{icon}</IconBox>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: "#111",
                fontFamily: "ProximaSoft, sans-serif",
                fontSize: 14,
              }}
            >
              {name}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#717171",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "ProximaSoft, sans-serif",
              }}
            >
              {desc}
            </span>
          </div>
        </SuggestionItem>
      );
    });
  };

  return (
    <Drawer.Root
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      shouldScaleBackground
      preventScrollRestoration={false}
    >
      <Drawer.Portal>
        <Overlay />
        <MainContent>
          <Handle />
          <Header>
            <Title>Search</Title>
          </Header>

          <Body>
            {/* ROW 1: LOCATION */}
            <Drawer.NestedRoot
              open={isLocationOpen}
              onOpenChange={setIsLocationOpen}
            >
              <Drawer.Trigger asChild>
                <MenuRow onClick={() => setIsLocationOpen(true)}>
                  <RowLeft>
                    <RowIcon>
                      <Search size={20} />
                    </RowIcon>
                    <RowText>
                      <RowLabel>Location</RowLabel>
                      <RowValue $hasValue={!!searchTerm}>
                        {searchTerm || "Where to?"}
                      </RowValue>
                    </RowText>
                  </RowLeft>
                </MenuRow>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Overlay style={{ zIndex: 9994 }} />
                <NestedContent style={{ height: "55vh" }}>
                  <Handle />
                  <Header>
                    <Title>Location</Title>
                  </Header>
                  <Body>
                    <LocationInputWrapper>
                      <Search
                        size={18}
                        color="#111"
                        style={{ marginRight: 10 }}
                      />
                      <StyledInput
                        ref={inputRef}
                        placeholder="Search destinations"
                        value={searchTerm}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        bordered={false}
                      />
                    </LocationInputWrapper>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#999",
                        letterSpacing: 0.5,
                        marginBottom: 4,
                        paddingLeft: 4,
                      }}
                    >
                      {searchTerm ? "SEARCH RESULTS" : "SUGGESTED"}
                    </div>
                    {renderLocationList()}
                  </Body>
                </NestedContent>
              </Drawer.Portal>
            </Drawer.NestedRoot>

            {/* ROW 2: DATE */}
            <Drawer.NestedRoot open={isDateOpen} onOpenChange={setIsDateOpen}>
              <Drawer.Trigger asChild>
                <MenuRow onClick={() => setIsDateOpen(true)}>
                  <RowLeft>
                    <RowIcon>
                      <CalendarIcon size={20} />
                    </RowIcon>
                    <RowText>
                      <RowLabel>Date</RowLabel>
                      <RowValue $hasValue={!!datePickerValue}>
                        {getDateDisplay()}
                      </RowValue>
                    </RowText>
                  </RowLeft>
                </MenuRow>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Overlay style={{ zIndex: 9994 }} />
                <NestedContent style={{ height: "auto" }}>
                  <Handle />
                  <Header>
                    <Title>When</Title>
                  </Header>
                  <Body>
                    <CustomCalendar
                      value={datePickerValue}
                      onChange={(d) => {
                        setDatePickerValue(d);
                        setIsDateOpen(false); // Auto close on select
                      }}
                    />
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: 4,
                        paddingBottom: 10,
                      }}
                    >
                      <ClearBtn
                        type="text"
                        onClick={() => {
                          setDatePickerValue(null);
                          setIsDateOpen(false);
                        }}
                      >
                        Clear date
                      </ClearBtn>
                    </div>
                  </Body>
                </NestedContent>
              </Drawer.Portal>
            </Drawer.NestedRoot>

            {/* ROW 3: PARTICIPANTS */}
            <Drawer.NestedRoot open={isWhoOpen} onOpenChange={setIsWhoOpen}>
              <Drawer.Trigger asChild>
                <MenuRow onClick={() => setIsWhoOpen(true)}>
                  <RowLeft>
                    <RowIcon>
                      <Users size={20} />
                    </RowIcon>
                    <RowText>
                      <RowLabel>Who</RowLabel>
                      <RowValue $hasValue={true}>
                        {participantCount === 1
                          ? "1 participant"
                          : `${participantCount} participants`}
                      </RowValue>
                    </RowText>
                  </RowLeft>
                </MenuRow>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Overlay style={{ zIndex: 9994 }} />
                <NestedContent style={{ height: "auto" }}>
                  <Handle />
                  <Header>
                    <Title>Participants</Title>
                  </Header>
                  <Body>
                    <ParticipantCard>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#222",
                            fontSize: 15,
                          }}
                        >
                          Participants
                        </span>
                        <span style={{ fontSize: 13, color: "#717171" }}>
                          Join the class
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <CountBtn
                          type="default"
                          disabled={participantCount <= 1}
                          onClick={() =>
                            setParticipantCount(
                              Math.max(1, participantCount - 1)
                            )
                          }
                          icon={<Minus size={18} />}
                        />
                        <CountVal>{participantCount}</CountVal>
                        <CountBtn
                          type="default"
                          onClick={() =>
                            setParticipantCount(participantCount + 1)
                          }
                          icon={<Plus size={18} />}
                        />
                      </div>
                    </ParticipantCard>
                  </Body>
                  <Footer>
                    <SearchBtn onClick={() => setIsWhoOpen(false)}>
                      Done
                    </SearchBtn>
                  </Footer>
                </NestedContent>
              </Drawer.Portal>
            </Drawer.NestedRoot>
          </Body>

          <Footer>
            <ClearBtn type="text" onClick={clearAll}>
              Clear all
            </ClearBtn>
            <SearchBtn onClick={handleSearchClick}>
              <Search size={18} /> Search
            </SearchBtn>
          </Footer>
        </MainContent>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default SearchDrawer;
