import React, { useState, useMemo, useEffect, useRef } from "react";
import { Drawer } from "vaul";
import { Button } from "antd";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import dayjs from "dayjs";
import styled from "styled-components";

// --- STYLES ---

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1010;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1011;
  outline: none;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 10px;
  margin: 12px auto;
`;

const MobileInputTrigger = styled.div`
  height: 48px;
  border-radius: 10px;
  font-size: 16px;
  border: 1px solid ${(props) => (props.$error ? "#ff4d4f" : "#e2e8f0")};
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${(props) => (props.$hasValue ? "#1e293b" : "#94a3b8")};
  background: white;
  width: 100%;
  transition: all 0.2s;
  cursor: pointer;

  &:active {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
`;

const PickerContainer = styled.div`
  padding: 16px 20px 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: max(30px, env(safe-area-inset-bottom));
`;

// --- CALENDAR COMPONENTS ---

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;
  margin-top: 12px;

  .day-header {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  button {
    height: 40px;
    border-radius: 10px;
    border: none;
    background: transparent;
    font-size: 16px;
    font-weight: 500;
    color: #334155;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s;

    &.today {
      color: ${(props) => props.theme.token?.colorPrimary || "#1677ff"};
      font-weight: 700;
      background: ${(props) => props.theme.token?.colorPrimary || "#1677ff"}15;
    }

    &.selected {
      background: ${(props) => props.theme.token?.colorPrimary || "#1677ff"};
      color: white;
      box-shadow: 0 2px 8px
        ${(props) => props.theme.token?.colorPrimary || "#1677ff"}60;
    }

    &.disabled {
      color: #cbd5e1;
      pointer-events: none;
      text-decoration: line-through;
    }

    &:active {
      background: #f1f5f9;
    }
  }
`;

export const MobileDatePicker = ({
  value,
  onChange,
  disabledDate,
  placeholder = "Select Date",
  error,
}) => {
  const [currentMonth, setCurrentMonth] = useState(value || dayjs());
  const [open, setOpen] = useState(false);

  // Sync internal view when opening
  useEffect(() => {
    if (open && value) {
      setCurrentMonth(value);
    }
  }, [open, value]);

  const generateDays = () => {
    const start = currentMonth.startOf("month");
    const end = currentMonth.endOf("month");
    const startDay = start.day();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let i = 1; i <= end.date(); i++) {
      const date = start.date(i);
      const isSelected = value && date.isSame(value, "day");
      const isDisabled = disabledDate ? disabledDate(date) : false;
      const isToday = date.isSame(dayjs(), "day");

      days.push(
        <button
          key={i}
          type="button"
          className={`${isSelected ? "selected" : ""} ${
            isDisabled ? "disabled" : ""
          } ${isToday ? "today" : ""}`}
          onClick={() => {
            onChange(date);
            setOpen(false);
          }}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <Drawer.NestedRoot open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <MobileInputTrigger $hasValue={!!value} $error={error}>
          {value ? value.format("MMM D, YYYY") : placeholder}
          <Calendar size={18} color={value ? "#1e293b" : "#94a3b8"} />
        </MobileInputTrigger>
      </Drawer.Trigger>
      <Drawer.Portal>
        <StyledDrawerOverlay />
        <StyledDrawerContent>
          <DrawerHandle />
          <PickerContainer>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Button
                icon={<ChevronLeft size={20} />}
                onClick={() =>
                  setCurrentMonth(currentMonth.subtract(1, "month"))
                }
                type="text"
              />
              <span style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
                {currentMonth.format("MMMM YYYY")}
              </span>
              <Button
                icon={<ChevronRight size={20} />}
                onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                type="text"
              />
            </div>
            <CalendarGrid>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="day-header">
                  {d}
                </div>
              ))}
              {generateDays()}
            </CalendarGrid>
          </PickerContainer>
        </StyledDrawerContent>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
};

// --- MODERN IOS STYLE TIME PICKER ---

// Reduced height for more compact feel (standard is ~44, we use 40)
const ITEM_HEIGHT = 40;

const WheelContainer = styled.div`
  display: flex;
  justify-content: center;
  height: ${ITEM_HEIGHT * 5}px; // Show ~5 items
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
  background: white;
  user-select: none;
`;

const WheelColumn = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  padding: 0;
  margin: 0;
  text-align: center;

  /* FORCE HIDE SCROLLBARS STRONGER */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */

  &::-webkit-scrollbar {
    display: none !important; /* Chrome/Safari/Webkit */
    width: 0 !important;
    height: 0 !important;
    background: transparent;
  }
`;

const WheelItem = styled.div`
  height: ${ITEM_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: 17px; /* Reduced from 19px */
  letter-spacing: 0.3px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  color: ${(props) => (props.$active ? "#0f172a" : "#94a3b8")};
  font-weight: ${(props) =>
    props.$active ? "500" : "400"}; /* Reduced from 600 */
  transform: ${(props) =>
    props.$active ? "scale(1.05)" : "scale(0.98)"}; /* Less scaling */
  opacity: ${(props) => (props.$active ? "1" : "0.4")};
  transition: all 0.15s ease-out;
  cursor: pointer;
`;

const HighlightBar = styled.div`
  position: absolute;
  top: 50%;
  left: 10px;
  right: 10px;
  height: ${ITEM_HEIGHT}px;
  transform: translateY(-50%);
  background: #f1f5f9;
  border-radius: 8px;
  pointer-events: none;
  z-index: -1;
`;

const Spacer = styled.div`
  height: ${ITEM_HEIGHT * 2}px;
`;

const InfiniteScrollColumn = ({ items, value, onChange, loopCount = 0 }) => {
  const ref = useRef(null);
  const scrollTimeout = useRef(null);
  const isLooping = loopCount > 0;

  const multiplier = isLooping
    ? loopCount % 2 === 0
      ? loopCount + 1
      : loopCount
    : 1;

  const extendedItems = useMemo(() => {
    if (!isLooping) return items;
    let arr = [];
    for (let i = 0; i < multiplier; i++) {
      arr = [...arr, ...items];
    }
    return arr;
  }, [items, multiplier, isLooping]);

  useEffect(() => {
    if (ref.current) {
      let targetIndex = -1;

      if (isLooping) {
        const middleSet = Math.floor(multiplier / 2);
        const offset = middleSet * items.length;
        const localIndex = items.findIndex((i) => i.value === value);
        if (localIndex !== -1) {
          targetIndex = offset + localIndex;
        }
      } else {
        targetIndex = items.findIndex((i) => i.value === value);
      }

      if (targetIndex >= 0) {
        ref.current.scrollTop = targetIndex * ITEM_HEIGHT;
      }
    }
  }, [open]);

  const handleScroll = (e) => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      if (!ref.current) return;
      const scrollTop = ref.current.scrollTop;
      const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);

      if (rawIndex < 0 || rawIndex >= extendedItems.length) return;

      const selectedItem = extendedItems[rawIndex];

      if (selectedItem && selectedItem.value !== value) {
        onChange(selectedItem.value);
      }
    }, 50);
  };

  return (
    <WheelColumn ref={ref} onScroll={handleScroll}>
      <Spacer />
      {extendedItems.map((item, index) => {
        const isActive = item.value === value;
        return (
          <WheelItem
            key={`${item.value}-${index}`}
            $active={isActive}
            onClick={() => {
              if (ref.current) {
                ref.current.scrollTo({
                  top: index * ITEM_HEIGHT,
                  behavior: "smooth",
                });
              }
            }}
          >
            {item.label}
          </WheelItem>
        );
      })}
      <Spacer />
    </WheelColumn>
  );
};

export const MobileTimePicker = ({
  value,
  onChange,
  placeholder = "Select Time",
  error,
}) => {
  const [open, setOpen] = useState(false);

  const safeTime = value || dayjs().hour(9).minute(0);

  const hours = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString(),
  }));

  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: i.toString().padStart(2, "0"),
  }));

  const periods = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  const currentHour12 = safeTime.hour() % 12 || 12;
  const currentMinute = safeTime.minute();
  const currentPeriod = safeTime.hour() >= 12 ? "PM" : "AM";

  const updateTime = (type, val) => {
    let newTime = safeTime.clone();
    if (type === "hour") {
      const isPM = newTime.hour() >= 12;
      let h = val === 12 ? 0 : val;
      if (isPM) h += 12;
      newTime = newTime.hour(h);
    } else if (type === "minute") {
      newTime = newTime.minute(val);
    } else if (type === "period") {
      let h = newTime.hour();
      if (val === "AM" && h >= 12) newTime = newTime.hour(h - 12);
      if (val === "PM" && h < 12) newTime = newTime.hour(h + 12);
    }
    onChange(newTime);
  };

  return (
    <Drawer.NestedRoot open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <MobileInputTrigger $hasValue={!!value} $error={error}>
          {value ? value.format("h:mm A") : placeholder}
          <Clock size={18} color={value ? "#1e293b" : "#94a3b8"} />
        </MobileInputTrigger>
      </Drawer.Trigger>
      <Drawer.Portal>
        <StyledDrawerOverlay />
        <StyledDrawerContent>
          <DrawerHandle />
          <PickerContainer>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  color: "#0f172a",
                }}
              >
                Select Time
              </h3>
            </div>

            <WheelContainer>
              <HighlightBar />

              <InfiniteScrollColumn
                items={hours}
                value={currentHour12}
                onChange={(v) => updateTime("hour", v)}
                loopCount={21}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "500",
                  fontSize: 18,
                  color: "#64748b",
                  zIndex: 2,
                  paddingBottom: 2,
                }}
              >
                :
              </div>

              <InfiniteScrollColumn
                items={minutes}
                value={currentMinute}
                onChange={(v) => updateTime("minute", v)}
                loopCount={7}
              />

              <div style={{ width: 12 }}></div>

              <InfiniteScrollColumn
                items={periods}
                value={currentPeriod}
                onChange={(v) => updateTime("period", v)}
                loopCount={0}
              />
            </WheelContainer>
          </PickerContainer>
        </StyledDrawerContent>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
};

export const MobileRangePicker = ({ value = [], onChange, error }) => {
  const [start, end] = value || [null, null];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#64748b",
            display: "block",
            marginBottom: 6,
          }}
        >
          Start Date
        </label>
        <MobileDatePicker
          value={start}
          onChange={(date) => onChange([date, end])}
          placeholder="Start Date"
          error={error}
        />
      </div>
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#64748b",
            display: "block",
            marginBottom: 6,
          }}
        >
          End Date
        </label>
        <MobileDatePicker
          value={end}
          onChange={(date) => onChange([start, date])}
          placeholder="End Date"
          disabledDate={(d) => start && d.isBefore(start)}
          error={error}
        />
      </div>
    </div>
  );
};
