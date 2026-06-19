"use client";

import styled from "styled-components";
import { Drawer } from "vaul";
import MiniCalendar from "./MiniCalendar";
import {
  MobileDrawerOverlay,
  MobileDrawerHandle,
  mobileDrawerTheme,
} from "./mobileBookingStyles";
import { DesktopModalShell, DesktopCloseButton } from "./bookingShellStyles";

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
  position: relative;
`;

const DesktopBody = styled.div`
  padding: 8px 1.5rem 1.75rem;
  overflow-y: auto;
  position: relative;
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

function CalendarPanel({ title, onClose, children, CloseBtn }) {
  return (
    <>
      <CloseBtn type="button" aria-label="Close" onClick={onClose}>
        ×
      </CloseBtn>
      <Title>{title}</Title>
      {children}
    </>
  );
}

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
  variant = "drawer",
}) {
  const handleClose = () => onOpenChange?.(false);

  const calendar = (
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
  );

  if (variant === "modal") {
    return (
      <DesktopModalShell
        open={open}
        onClose={handleClose}
        maxWidth={420}
        maxHeight="auto"
        ariaLabel="Pick a date"
      >
        <DesktopBody>
          <CalendarPanel title="Pick a date" onClose={handleClose} CloseBtn={DesktopCloseButton}>
            {calendar}
          </CalendarPanel>
        </DesktopBody>
      </DesktopModalShell>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <MobileDrawerOverlay style={{ zIndex: 3009 }} />
        <Sheet>
          <MobileDrawerHandle />
          <Body>
            <CalendarPanel title="Pick a date" onClose={handleClose} CloseBtn={DesktopCloseButton}>
              {calendar}
            </CalendarPanel>
          </Body>
        </Sheet>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
