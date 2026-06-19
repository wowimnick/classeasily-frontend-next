"use client";

import styled from "styled-components";
import { Drawer } from "vaul";
import MiniCalendar from "./MiniCalendar";
import {
  MobileDrawerOverlay,
  MobileDrawerHandle,
  mobileDrawerTheme,
} from "./mobileBookingStyles";

const Sheet = styled(Drawer.Content)`
  background: ${mobileDrawerTheme.bg};
  display: flex;
  flex-direction: column;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3010;
  box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.18);
  outline: none;
`;

const Body = styled.div`
  padding: 0 1.25rem 1.5rem;
  overflow-y: auto;
`;

const Title = styled.h3`
  margin: 0 0 1.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111111;
  text-align: center;
`;

const CalendarWrap = styled.div`
  display: flex;
  justify-content: center;
`;

export default function SelectCalendarDrawer({
  open,
  onOpenChange,
  availableSlots,
  loading,
  selectedDate,
  onDateSelect,
  currentDate,
  onMonthChange,
  minSelectableDate,
  today,
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <MobileDrawerOverlay style={{ zIndex: 3009 }} />
        <Sheet>
          <MobileDrawerHandle />
          <Body>
            <Title>Pick a date</Title>
            <CalendarWrap>
              <MiniCalendar
                availableSlots={availableSlots}
                loading={loading}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                currentDate={currentDate}
                onMonthChange={onMonthChange}
                minSelectableDate={minSelectableDate}
                today={today}
              />
            </CalendarWrap>
          </Body>
        </Sheet>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
