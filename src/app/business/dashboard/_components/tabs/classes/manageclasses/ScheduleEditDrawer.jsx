"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  DatePicker,
  Button,
  ConfigProvider,
  InputNumber,
  Tabs,
  Typography,
  Tooltip,
  Steps,
  Space,
  Checkbox,
  Popconfirm,
  Grid,
} from "antd";
import message from "@/lib/message";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Edit3,
  ListChecks,
  PlusCircle,
  Copy,
  X,
  File,
  Type,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Trash2,
  List,
  Plus,
  Filter
} from "lucide-react";
import dayjs from "dayjs";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";
import { LordIcon } from "@/services/ReactUtils";

const { Option } = Select;
const { Title, Text } = Typography;

// --- ADDED: HOOK AND COMPONENT FOR MODAL ANIMATION ---

const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};

const AnimatedModalContent = ({ children }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        <div style={{ border: '1px solid transparent', margin: '-1px' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// --- Error Handling ---
const getErrorMessage = (error) => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data === "object" && data !== null) {
      const messages = Object.entries(data).map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${formattedKey}: ${
          Array.isArray(value) ? value.join(", ") : value
        }`;
      });
      if (messages.length > 0) return messages.join("; ");
    }
  }
  if (typeof error?.error === "string") return error.error;
  if (typeof error?.detail === "string") return error.detail;
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
};

// --- Mobile Drawer Styles ---
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
  border-radius: 16px 16px 0 0;
  max-height: 96%;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1011;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 32px;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 8px auto;
  cursor: grab;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
`;

const MobileTitle = styled(Title)`
  &.ant-typography {
    font-size: 18px;
    font-weight: 600;
    margin: 0 !important;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: calc(100% - 40px);
  }
  
  @media (max-width: 768px) {
    &.ant-typography {
      font-size: 16px;
    }
  }
`;

const CloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
  color: #6b7280;
  border-radius: 8px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const MobileContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  position: relative;
`;

const MobileFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const StyledTabs = styled(Tabs)`
  display: flex;
  flex-direction: column;

  .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 24px;
    background: white;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .ant-tabs-tab {
    padding: 12px 16px !important;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ant-tabs-content-holder {
    flex: 1;
    background: #f8fafc;
  }

  .ant-tabs-tabpane {
    padding: 0;
    position: relative;
  }

  @media (max-width: 768px) {
    .ant-tabs-nav {
      padding: 0 20px;
    }
  }
`;

// --- MODIFIED: Desktop Modal Styles for Animation ---
const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    padding: 0;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 0;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .ant-modal-title {
    font-weight: 600;
    font-size: 18px;
  }

  .ant-modal-body {
    padding: 0;
    background: #f8fafc;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    position: relative;
  }
  .ant-modal-footer {
    padding: 12px 24px;
    margin-top: 0;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;

  svg {
    width: 16px;
    height: 16px;
    color: #ff385c;
  }

  .tooltip-icon {
    color: #9ca3af;
    cursor: help;
  }
`;

const HelpText = styled.div`
  font-size: 13px;
  color: #64748b;
  margin: -4px 0 8px 0;
  line-height: 1.4;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 769px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoBox = styled.div`
  background: #fef7ff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #ff385c;
    border-radius: 8px 0 0 8px;
  }

  svg {
    color: #ff385c;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
`;

// --- Stepper & Step Form Components ---
const StepsWrapper = styled.div`
  max-width: 500px;
  margin: 16px auto;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 16px;
  z-index: 100;
  width: 90%;

  .ant-steps-item-icon {
    margin-top: -2px;
  }

  .ant-steps-item-title {
    font-size: 13px !important;
    line-height: 1.2 !important;
    padding-top: 4px;
  }
  
  @media (max-width: 768px) {
    display: none; /* Removed on mobile */
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-height: 0;
  padding: 24px;
  padding-top: 0;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StepContent = styled.div`
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

const FormSection = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const StepTitle = styled(Title)`
  margin-bottom: 4px !important;
  font-size: 22px !important;
  font-weight: 700 !important;
`;

const StepDescription = styled(Text)`
  display: block;
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
`;

const ReviewSection = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled(Text)`
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled(Text)`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// --- Styled Antd Components ---
const StyledInput = styled(Input)`
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const StyledSelect = styled(Select)`
  @media (max-width: 768px) {
    .ant-select-selection-item,
    .ant-select-selection-placeholder {
      font-size: 16px !important;
    }
  }
`;

const StyledTimePicker = styled(TimePicker)`
  @media (max-width: 768px) {
    .ant-picker-input > input {
      font-size: 16px !important;
    }
  }
`;

const StyledDatePicker = styled(DatePicker)`
  @media (max-width: 768px) {
    .ant-picker-input > input {
      font-size: 16px !important;
    }
  }
`;

const StyledRangePicker = styled(DatePicker.RangePicker)`
  @media (max-width: 768px) {
    .ant-picker-input > input {
      font-size: 16px !important;
    }
  }
`;

const StyledInputNumber = styled(InputNumber)`
  @media (max-width: 768px) {
    .ant-input-number-input {
      font-size: 16px !important;
    }
  }
`;

// --- Bulk Form Components ---
const DaysContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
`;

const DayButton = styled(Button)`
  height: 40px;
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  padding: 0 8px;
  
  @media (max-width: 768px) {
    height: 38px;
    font-size: 13px;
  }
`;

const TimeListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TimeInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AddTimeButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
  background: #f9fafb;
  color: #64748b;
  font-weight: 500;
  &:hover {
    border-color: #ff385c;
    color: #ff385c;
    background: #fff8f9;
  }
`;

const dayLabels = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

// --- Schedule Management Components (Redesigned) ---
const colors = {
  primary: "#ff385c",
  textSecondary: "#64748b",
  warning: "#f59e0b",
};

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  .lucide-star {
    color: ${colors.warning};
  }
`;

const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

// --- NEW: Date Strip Components ---
const DateStripContainer = styled.div`
  background: white;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DateStripHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
`;

const DateStripWrapper = styled.div`
  position: relative;
  width: 100%;
  /* Ensure context for absolute positioning of fades/arrows */
`;

const ScrollFade = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 60px;
  z-index: 1;
  pointer-events: none; /* Allow clicks to pass through to scroll/dates if needed, though arrows are on top */
  
  &.left {
    left: 0;
    background: linear-gradient(to right, rgba(255,255,255,1) 30%, rgba(255,255,255,0));
    border-top-left-radius: 12px; /* Match container if needed */
  }
  
  &.right {
    right: 0;
    background: linear-gradient(to left, rgba(255,255,255,1) 30%, rgba(255,255,255,0));
  }
`;

const ScrollButton = styled(Button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10; /* Higher than fade */
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border: 1px solid #e2e8f0;
  padding: 0;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8fafc;
    color: ${colors.primary};
    border-color: ${colors.primary};
    transform: translateY(-50%) scale(1.05);
  }

  &.left { left: 12px; }
  &.right { right: 12px; }
  
  &:disabled {
    opacity: 0;
    pointer-events: none;
  }
`;

const DatesScrollArea = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  /* Added padding to prevent arrows from overlapping date cards */
  padding: 4px 54px 12px 54px; 
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  scroll-snap-type: x mandatory;
`;
const MonthNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MonthTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const NavBtn = styled(Button)`
  border: none;
  box-shadow: none;
  background: #f1f5f9;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  &:hover {
    background: #e2e8f0 !important;
  }
`;

const DateCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 70px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.$selected ? props.theme.token.colorPrimary : "#e2e8f0"};
  background: ${(props) => props.$selected ? props.theme.token.colorPrimary : "white"};
  color: ${(props) => props.$selected ? "white" : "#475569"};
  cursor: pointer;
  transition: all 0.2s ease;
  scroll-snap-align: start;
  position: relative;
  padding: 4px;

  &:hover {
    border-color: ${(props) => props.$selected ? props.theme.token.colorPrimary : "#cbd5e1"};
    background: ${(props) => props.$selected ? props.theme.token.colorPrimary : "#f8fafc"};
  }

  .day-name {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    opacity: 0.8;
    margin-bottom: 2px;
  }

  .day-number {
    font-size: 18px;
    font-weight: 700;
  }
`;

const MarkerDot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: ${(props) => props.$selected ? "white" : props.theme.token.colorPrimary};
  position: absolute;
  bottom: 6px;
  opacity: ${(props) => props.$visible ? 1 : 0};
`;

const ScheduleListArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  align-content: start;
`;

const ScheduleCard = styled(motion.div)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
  position: relative;
  height: 100%;
  
  &:hover {
    border-color: ${colors.primary};
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  
  ${(props) => props.$isPast && `opacity: 0.7; background: #f9fafb;`}
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  .time {
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .duration {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .group {
    font-size: 12px;
    color: ${colors.primary};
    font-weight: 600;
  }
`;

const CardActions = styled(Space)`
  flex-shrink: 0;
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #475569;
  margin-top: auto;
`;

const EmptyStateContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 16px;
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);

  lord-icon {
    width: 80px;
    height: 80px;
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const formatTime = (timeStr) =>
  timeStr ? dayjs(`2000-01-01T${timeStr}`).format("h:mm A") : "N/A";

// --- Skeleton Loader Components ---
const skeletonKeyframes = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const SkeletonPrimitive = styled.div`
  background-color: #f0f2f5;
  background-image: linear-gradient(90deg, #f0f2f5, #e6e8eb, #f0f2f5);
  background-size: 200px 100%;
  background-repeat: no-repeat;
  border-radius: 4px;
  animation: ${skeletonKeyframes} 1.3s ease-in-out infinite;
  display: inline-block;
  line-height: 1;
  width: 100%;
`;

const ScheduleCardSkeleton = () => (
  <div style={{ 
    background: 'white', 
    border: '1px solid #e5e7eb', 
    borderRadius: '12px', 
    padding: '12px',
    height: '100%',
    display: 'flex', 
    flexDirection: 'column',
    gap: '12px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ width: '60%' }}>
        <SkeletonPrimitive style={{ height: "18px", width: "80px", marginBottom: "6px" }} />
        <SkeletonPrimitive style={{ height: "14px", width: "100px" }} />
      </div>
      <SkeletonPrimitive style={{ height: "28px", width: "50px", borderRadius: "8px" }} />
    </div>
    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '10px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
      <SkeletonPrimitive style={{ height: "14px", width: "60px" }} />
      <SkeletonPrimitive style={{ height: "14px", width: "40px" }} />
    </div>
  </div>
);

// --- Internal Management View ---
const ScheduleManagementView = React.memo(({
  classData,
  onAdd,
  onEdit,
  onSchedulesUpdate,
}) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  // Default to null to show ALL schedules initially
  const [selectedDate, setSelectedDate] = useState(null); 
  const [groupFilter, setGroupFilter] = useState(undefined);
  
  const scrollRef = useRef(null);

  const optionId = classData?.option?.optionId;

  const refreshSchedules = useCallback(async () => {
    if (!optionId) return;
    setLoading((prev) => (prev === true ? true : false)); 
    try {
      const result = await scheduleService.fetchSchedules({
        option_id: optionId,
      });
      if (result.success) {
        setSchedules(result.data || []);
      } else {
        message.error(
          getErrorMessage(result.error || "Failed to refresh schedules.")
        );
      }
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [optionId]);

  useEffect(() => {
    if (optionId) {
        setLoading(true); 
        refreshSchedules();
    }
  }, [optionId, refreshSchedules]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 240; // Approximate width of 3-4 cards
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      await scheduleService.deleteSchedule(scheduleId);
      await refreshSchedules();
      onSchedulesUpdate();
      message.success("Schedule deleted successfully.");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const datesInMonth = useMemo(() => {
    const start = currentMonth.startOf('month');
    const end = currentMonth.endOf('month');
    const dates = [];
    let curr = start;
    while(curr.isBefore(end) || curr.isSame(end, 'day')) {
      dates.push(curr);
      curr = curr.add(1, 'day');
    }
    return dates;
  }, [currentMonth]);

  const scheduleDatesMap = useMemo(() => {
    const map = {};
    schedules.forEach(s => {
      const dateStr = s.date;
      if (!map[dateStr]) map[dateStr] = 0;
      map[dateStr]++;
    });
    return map;
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;

    if (selectedDate) {
        const targetDateStr = selectedDate.format('YYYY-MM-DD');
        filtered = filtered.filter(s => s.date === targetDateStr);
    }

    if (groupFilter) {
       filtered = groupFilter === "##__INDIVIDUAL__##"
          ? filtered.filter((s) => !s.name)
          : filtered.filter((s) => s.name === groupFilter);
    }

    return filtered.sort((a, b) => {
        const dateA = dayjs(`${a.date}T${a.time}`);
        const dateB = dayjs(`${b.date}T${b.time}`);
        return dateA.diff(dateB);
    });
  }, [schedules, selectedDate, groupFilter]);

  const uniqueGroups = useMemo(() => {
    const groups = [...new Set(schedules.map((s) => s.name).filter(Boolean))];
    return groups;
  }, [schedules]);

  const renderScheduleCard = (schedule) => {
    const isPast = dayjs(schedule.date).isBefore(dayjs(), "day");
    const hasConfirmedBookings = schedule.has_confirmed_bookings || false;
    const canDelete = !isPast && !hasConfirmedBookings;
    const dateObj = dayjs(schedule.date);

    return (
      <ScheduleCard key={schedule.id} $isPast={isPast} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTop>
          <CardInfo>
             {/* Show Date Header if viewing All */}
            {!selectedDate && (
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                    {dateObj.format('ddd, MMM D')}
                </div>
            )}
            <div className="time">
              {formatTime(schedule.time)}
              <span className="duration">{schedule.duration} min</span>
            </div>
            {schedule.name && <div className="group">{schedule.name}</div>}
          </CardInfo>
          <CardActions>
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => onEdit(schedule)}
                disabled={isPast}
              />
            </Tooltip>
            <Popconfirm
              title="Delete schedule?"
              description="Action cannot be undone."
              onConfirm={() => handleDelete(schedule.id)}
              disabled={!canDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                disabled={!canDelete}
              />
            </Popconfirm>
          </CardActions>
        </CardTop>
        <CardBottom>
          <StatItem>
            <Users size={14} />{" "}
            <b>{schedule.booked_participants}/{schedule.maxParticipants}</b>
            &nbsp;Booked
          </StatItem>
          <StatItem>
            <DollarSign size={14} />{" "}
            <b>{parseFloat(schedule.price).toFixed(2)}</b>
          </StatItem>
        </CardBottom>
      </ScheduleCard>
    );
  };

  if (!classData?.option) {
    return (
      <EmptyStateContainer>
        <EmptyStateIcon>
          <LordIcon
            src="https://cdn.lordicon.com/asyunleq.json"
            trigger="in"
            state="in-cog"
            colors="primary:#94a3b8"
            style={{ width: 40, height: 40 }}
          />
        </EmptyStateIcon>
        <EmptyStateText>Configuration Needed</EmptyStateText>
      </EmptyStateContainer>
    );
  }

  return (
    <ManagementContainer>
      <DateStripContainer>
        <DateStripHeader>
            <MonthNavigation>
                <NavBtn onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}><ChevronLeft size={16} /></NavBtn>
                <MonthTitle>{currentMonth.format('MMMM YYYY')}</MonthTitle>
                <NavBtn onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}><ChevronRight size={16} /></NavBtn>
            </MonthNavigation>

        </DateStripHeader>
        
        <DateStripWrapper>
            {/* FADE & ARROWS */}
            <ScrollFade className="left" />
            <ScrollButton className="left" onClick={() => handleScroll('left')}>
                <ChevronLeft size={16} />
            </ScrollButton>

            <DatesScrollArea ref={scrollRef}>
                {/* View All Card */}
                <DateCard 
                    $selected={selectedDate === null}
                    onClick={() => setSelectedDate(null)}
                    style={{ minWidth: 60 }}
                >
                    <span className="day-name" style={{ opacity: 0.6 }}>VIEW</span>
                    <span className="day-number" style={{ fontSize: 14 }}>ALL</span>
                </DateCard>

                {datesInMonth.map(date => {
                    const dateStr = date.format('YYYY-MM-DD');
                    const isSelected = selectedDate && selectedDate.isSame(date, 'day');
                    const hasSchedule = scheduleDatesMap[dateStr] > 0;
                    
                    return (
                        <DateCard 
                            key={dateStr} 
                            $selected={isSelected}
                            onClick={() => setSelectedDate(date)}
                        >
                            <span className="day-name">{date.format('ddd')}</span>
                            <span className="day-number">{date.format('D')}</span>
                            <MarkerDot $visible={hasSchedule} $selected={isSelected} />
                        </DateCard>
                    )
                })}
            </DatesScrollArea>

            <ScrollFade className="right" />
            <ScrollButton className="right" onClick={() => handleScroll('right')}>
                <ChevronRight size={16} />
            </ScrollButton>
        </DateStripWrapper>
      </DateStripContainer>

      <FilterBar>
        <Filter size={14} color="#64748b" />
        <Select 
            placeholder="Filter Group" 
            style={{ width: 160 }} 
            allowClear 
            size="small" 
            value={groupFilter}
            onChange={setGroupFilter}
            bordered={false}
        >
            <Option value="##__INDIVIDUAL__##">Individual</Option>
            {uniqueGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
        </Select>
        <div style={{ flex: 1 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
            {selectedDate 
                ? `${filteredSchedules.length} session${filteredSchedules.length !== 1 ? 's' : ''} on ${selectedDate.format('MMM D')}`
                : `Showing all ${filteredSchedules.length} session${filteredSchedules.length !== 1 ? 's' : ''}`
            }
        </Text>
      </FilterBar>

      <ScheduleListArea>
        {loading && schedules.length === 0 ? (
            <>
                <ScheduleCardSkeleton />
                <ScheduleCardSkeleton />
                <ScheduleCardSkeleton />
            </>
        ) : filteredSchedules.length > 0 ? (
            filteredSchedules.map(renderScheduleCard)
        ) : (
            <EmptyStateContainer>
                <EmptyStateIcon>
                    <LordIcon
                        src="https://cdn.lordicon.com/uoljexdg.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                        style={{ width: 64, height: 64 }}
                    />
                </EmptyStateIcon>
                <EmptyStateText>No Schedules Found</EmptyStateText>
                <EmptyStateSubtext>
                    {selectedDate 
                        ? `No sessions found on ${selectedDate.format('MMMM D')}.`
                        : "You haven't created any schedules yet."}
                </EmptyStateSubtext>
                
                <Button 
                    type="primary" 
                    icon={<Plus size={14} />} 
                    onClick={() => onAdd(selectedDate || dayjs())}
                    style={{ marginTop: 16 }}
                >
                    Add Session {selectedDate ? `for ${selectedDate.format('MMM D')}` : ''}
                </Button>
            </EmptyStateContainer>
        )}
      </ScheduleListArea>
    </ManagementContainer>
  );
});

const ScheduleEditDrawer = ({
  open,
  onClose,
  form,
  classData,
  onSchedulesUpdate,
  editingSchedule: directEditingSchedule,
  startInEditMode = false,
  hideBackButton = false,
}) => {
  const [bulkForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [bulkCurrentStep, setBulkCurrentStep] = useState(0);
  const [activeView, setActiveView] = useState("manage");
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [prefillDate, setPrefillDate] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Define props for Antd fields to handle mobile overlay positioning
  const mobilePopupProps = isMobile
    ? { getPopupContainer: (trigger) => trigger.parentNode }
    : {};

  useEffect(() => {
    if (open) {
      if (startInEditMode && directEditingSchedule) {
        setActiveView("form");
        setEditingSchedule(directEditingSchedule);
        setPrefillDate(null);
      } else if (classData) {
        setActiveView("manage");
        setEditingSchedule(null);
        setPrefillDate(null);
      }
    } else {
      form.resetFields();
      bulkForm.resetFields();
      setCurrentStep(0);
      setBulkCurrentStep(0);
      setFormData({});
      setEditingSchedule(null);
      setPrefillDate(null);
      setActiveView("manage");
    }
  }, [open, classData, startInEditMode, directEditingSchedule, form, bulkForm]);

  const optionType = classData?.option?.booking_type || "Single Session";
  const optionId = classData?.option?.optionId;
  const isSingleSession = optionType === "Single Session";
  const bulkFormDays = Form.useWatch("days_of_week", bulkForm) || [];

  // --- MODIFIED: Removed form and bulkForm from dependency array to prevent reset on re-render ---
  useEffect(() => {
    if (activeView !== "form") return;

    setActiveTab("single");
    form.resetFields();
    bulkForm.resetFields();
    setCurrentStep(0);

    const defaultValues = {
      price: "0.00",
      duration: 60,
      maxParticipants: 10,
      minParticipants: 1,
      time: dayjs("09:00", "HH:mm"),
      // Use the prefillDate if available, otherwise tomorrow
      date: prefillDate || dayjs().add(1, "day"),
    };

    if (editingSchedule) {
      const valuesToSet = {
        name: editingSchedule.name,
        price: editingSchedule.price?.toString(),
        maxParticipants: editingSchedule.maxParticipants,
        duration: editingSchedule.duration,
        minParticipants: editingSchedule.minParticipants || 1,
        time: dayjs(editingSchedule.time, "HH:mm:ss"),
        date: dayjs(editingSchedule.date),
      };
      form.setFieldsValue(valuesToSet);
      setFormData(valuesToSet);
    } else {
      form.setFieldsValue(defaultValues);
      setFormData(defaultValues);
      bulkForm.setFieldsValue({
        times: [dayjs("09:00", "HH:mm")],
        days_of_week: [],
        date_range: [dayjs(), dayjs().add(1, "month")],
        commonDetails: {
          duration: 60,
          maxParticipants: 10,
          price: "0.00",
          minParticipants: 1,
        },
      });
    }
  }, [activeView, editingSchedule, prefillDate]); // Removed form and bulkForm from here

  const handleFormSuccess = () => {
    onSchedulesUpdate();
    if (classData && !startInEditMode) {
      setActiveView("manage");
      setPrefillDate(null);
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      setIsLoading(true);

      const scheduleData = {
        name: values.name,
        option: optionId,
        time: values.time.format("HH:mm"),
        duration: values.duration,
        price: parseFloat(values.price).toFixed(2),
        maxParticipants: values.maxParticipants,
        minParticipants: values.minParticipants || 1,
        date: values.date.format("YYYY-MM-DD"),
      };

      if (editingSchedule) {
        await scheduleService.updateSchedule(
          editingSchedule.id,
          scheduleData
        );
        message.success("Schedule updated successfully.");
      } else {
        await scheduleService.createSchedule(scheduleData);
        message.success("Schedule created successfully.");
      }
      handleFormSuccess();
    } catch (errorInfo) {
      if (errorInfo?.errorFields) {
        message.error("Please review the form for errors.");
      } else {
        message.error(getErrorMessage(errorInfo));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    try {
      const values = await bulkForm.validateFields();
      setIsBulkLoading(true);

      const payload = {
        name: values.name,
        option: optionId,
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        days_of_week: values.days_of_week,
        times: values.times.map((t) => t.format("HH:mm")),
        duration: values.commonDetails.duration,
        price: parseFloat(values.commonDetails.price).toFixed(2),
        maxParticipants: values.commonDetails.maxParticipants,
        minParticipants: values.commonDetails.minParticipants || 1,
      };

      const result = await scheduleService.bulkCreateSchedules(payload);

      if (result && result.created_count > 0) {
        message.success(result.message);
        handleFormSuccess();
      } else {
        message.warning(result.message || "No new schedules were created.");
      }
    } catch (errorInfo) {
      console.error("Error during bulk creation:", errorInfo);
      message.error(getErrorMessage(errorInfo));
    } finally {
      setIsBulkLoading(false);
    }
  };
  
  const validateStep = async (step) => {
    try {
      switch (step) {
        case 0:
          await form.validateFields(["date", "time", "duration", "name"]);
          return true;
        case 1:
          await form.validateFields([
            "price",
            "maxParticipants",
            "minParticipants",
          ]);
          return true;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  };

  const handleNext = async () => {
    if (await validateStep(currentStep)) {
      setFormData({ ...formData, ...form.getFieldsValue() });
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleBulkNext = async () => {
    try {
      if (bulkCurrentStep === 0) {
        await bulkForm.validateFields([
          "name",
          "date_range",
          "days_of_week",
          "times",
        ]);
      } else if (bulkCurrentStep === 1) {
        await bulkForm.validateFields([
          ["commonDetails", "duration"],
          ["commonDetails", "price"],
          ["commonDetails", "maxParticipants"],
          ["commonDetails", "minParticipants"],
        ]);
      }
      setBulkCurrentStep(bulkCurrentStep + 1);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleBulkBack = () => {
    if (bulkCurrentStep > 0) setBulkCurrentStep(bulkCurrentStep - 1);
  };

  const NoMarginFormItem = (props) => (
    <Form.Item {...props} style={{ marginBottom: 0 }} />
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormSection key="step0">
            <StepHeader>
              <StepTitle>Session Details</StepTitle>
              <StepDescription>
                Set the core details for your schedule.
              </StepDescription>
            </StepHeader>

            <FormGroup>
              <FormLabel>
                <Type /> Schedule Name{" "}
                <span style={{ fontWeight: 400, color: "#6b7280" }}>
                  (Optional)
                </span>
                <Tooltip title="A name like 'Weekend Mornings' can help you group similar schedules.">
                  <HelpCircle size={14} className="tooltip-icon" />
                </Tooltip>
              </FormLabel>
              <HelpText>This name helps you organize your schedule.</HelpText>
              <Form.Item name="name" noStyle>
                <StyledInput
                  placeholder="e.g., Morning Pottery"
                  disabled={isLoading}
                />
              </Form.Item>
            </FormGroup>

            <FormGroup>
              <FormLabel>
                <Calendar /> Session Date
              </FormLabel>
              <HelpText>
                Pick the specific date this session will happen.
              </HelpText>
              <Form.Item
                name="date"
                rules={[{ required: true, message: "Please select a date." }]}
                noStyle
              >
                <StyledDatePicker
                  style={{ width: "100%" }}
                  disabled={isLoading}
                  inputReadOnly
                  disabledDate={(c) => c && c < dayjs().startOf("day")}
                  {...mobilePopupProps}
                />
              </Form.Item>
            </FormGroup>

            <FormGrid>
              <FormGroup>
                <FormLabel>
                  <Clock /> Start Time
                </FormLabel>
                <HelpText>Select the time this session will begin.</HelpText>
                <Form.Item
                  name="time"
                  rules={[{ required: true, message: "Select a start time." }]}
                  noStyle
                >
                  <StyledTimePicker
                    use12Hours
                    format="h:mm A"
                    minuteStep={15}
                    inputReadOnly
                    disabled={isLoading}
                    style={{ width: "100%" }}
                    {...mobilePopupProps}
                  />
                </Form.Item>
              </FormGroup>
              <FormGroup>
                <FormLabel>
                  <Edit3 /> Duration (minutes)
                </FormLabel>
                <HelpText>Specify how long this session will last.</HelpText>
                <Form.Item
                  name="duration"
                  rules={[{ required: true, message: "Set a duration." }]}
                  noStyle
                >
                  <StyledSelect
                    placeholder="Select duration"
                    disabled={isLoading}
                    {...mobilePopupProps}
                  >
                    <Option value={30}>30 minutes</Option>
                    <Option value={60}>1 hour</Option>
                    <Option value={90}>1.5 hours</Option>
                    <Option value={120}>2 hours</Option>
                    <Option value={180}>3 hours</Option>
                  </StyledSelect>
                </Form.Item>
              </FormGroup>
            </FormGrid>
          </FormSection>
        );
      case 1:
        return (
          <FormSection key="step1">
            <StepHeader>
              <StepTitle>Pricing & Capacity</StepTitle>
              <StepDescription>
                Define the price and participant limits for this session.
              </StepDescription>
            </StepHeader>

            <FormGrid>
              <FormGroup>
                <FormLabel>
                  <DollarSign /> Price (CAD)
                </FormLabel>
                <HelpText>Cost per person. Use 0 for a free session.</HelpText>
                <Form.Item
                  name="price"
                  rules={[{ required: true, message: "Set a price." }]}
                  noStyle
                >
                  <StyledInput
                    prefix="$"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </Form.Item>
              </FormGroup>
              <FormGroup>
                <FormLabel>
                  <Users /> Maximum Capacity
                </FormLabel>
                <HelpText>The total number of spots available.</HelpText>
                <Form.Item
                  name="maxParticipants"
                  rules={[{ required: true, message: "Set capacity." }]}
                  noStyle
                >
                  <StyledInputNumber
                    min={1}
                    placeholder="e.g., 10"
                    disabled={isLoading}
                    style={{ width: "100%" }}
                    inputMode="numeric"
                  />
                </Form.Item>
              </FormGroup>
            </FormGrid>

            <FormGroup>
              <FormLabel>
                <Users /> Minimum Participants
                <Tooltip title="The minimum number of participants required for a single booking.">
                  <HelpCircle size={14} className="tooltip-icon" />
                </Tooltip>
              </FormLabel>
              <HelpText>
                The minimum number of people required per booking.
              </HelpText>
              <Form.Item
                name="minParticipants"
                rules={[
                  { required: true, message: "Set min participants." },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value <= getFieldValue("maxParticipants")) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Min must not exceed Max Capacity!")
                      );
                    },
                  }),
                ]}
                dependencies={["maxParticipants"]}
                noStyle
              >
                <StyledInputNumber
                  min={1}
                  placeholder="e.g., 1"
                  disabled={isLoading}
                  style={{ width: "100%" }}
                  inputMode="numeric"
                />
              </Form.Item>
            </FormGroup>
          </FormSection>
        );
      case 2:
        return (
          <FormSection key="step2">
            <StepHeader>
              <StepTitle>Review & Confirm</StepTitle>
              <StepDescription>
                Please review the details below before creating the schedule.
              </StepDescription>
            </StepHeader>
            <ReviewSection>
              <InfoRow>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{formData.name || "Not Specified"}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Date</InfoLabel>
                <InfoValue>
                  <Calendar size={16} />
                  {formData.date?.format("MMMM D, YYYY")}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Time</InfoLabel>
                <InfoValue>
                  <Clock size={16} />
                  {formData.time?.format("h:mm A")}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Duration</InfoLabel>
                <InfoValue>{formData.duration} minutes</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Price</InfoLabel>
                <InfoValue>
                  <DollarSign size={16} />
                  {parseFloat(formData.price) === 0
                    ? "Free"
                    : `$${parseFloat(formData.price).toFixed(2)}`}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Capacity</InfoLabel>
                <InfoValue>
                  <Users size={16} />
                  {formData.minParticipants} - {formData.maxParticipants}
                </InfoValue>
              </InfoRow>
            </ReviewSection>
          </FormSection>
        );
      default:
        return null;
    }
  };

  const renderSingleSessionStepperForm = () => (
    <>
      {!isMobile && (
        <StepsWrapper>
          <Steps
            size="small"
            current={currentStep}
            items={[
              { title: "Details", icon: <Calendar size={16} /> },
              { title: "Pricing", icon: <DollarSign size={16} /> },
              { title: "Review", icon: <CheckCircle size={16} /> },
            ]}
          />
        </StepsWrapper>
      )}
      <ContentWrapper>
        <StepContent>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(changedValues) =>
              setFormData({ ...formData, ...changedValues })
            }
          >
            {renderStepContent()}
          </Form>
        </StepContent>
      </ContentWrapper>
    </>
  );

  const renderBulkForm = () => {
    const bulkFormData = bulkForm.getFieldsValue();

    const renderBulkStep0 = () => (
      <FormSection key="bulk-step0">
        <StepHeader>
          <StepTitle>Bulk Schedule Setup</StepTitle>
          <StepDescription>
            Define the time period and pattern for generating sessions
          </StepDescription>
        </StepHeader>

        <InfoBox>
          <Copy />
          <InfoContent>
            Quickly generate many individual sessions over a period of time.
            This is perfect for drop-in classes.
          </InfoContent>
        </InfoBox>

        <FormGroup>
          <FormLabel>
            <Type /> Group Name{" "}
            <span style={{ fontWeight: 400, color: "#6b7280" }}>
              (Optional)
            </span>
            <Tooltip title="Using a name like 'Fall Drop-ins' will group all schedules created here, making them easy to filter or delete together later.">
              <HelpCircle size={14} className="tooltip-icon" />
            </Tooltip>
          </FormLabel>
          <HelpText>
            This name helps organize all schedules generated in this batch.
          </HelpText>
          <NoMarginFormItem name="name">
            <StyledInput placeholder="e.g., Fall Series" />
          </NoMarginFormItem>
        </FormGroup>

        <FormGroup>
          <FormLabel>
            <Calendar /> Date Range to Create Schedules In
          </FormLabel>
          <HelpText>
            Schedules will be created on the selected days within this period.
          </HelpText>
          <NoMarginFormItem
            name="date_range"
            rules={[{ required: true, message: "Select a date range." }]}
          >
            <StyledRangePicker 
                inputReadOnly 
                style={{ width: "100%" }} 
                {...mobilePopupProps}
            />
          </NoMarginFormItem>
        </FormGroup>

        <FormGroup>
          <FormLabel>
            <ListChecks /> Days of the Week
          </FormLabel>
          <HelpText>
            Select which days you want to generate sessions on.
          </HelpText>
          <NoMarginFormItem
            name="days_of_week"
            rules={[{ required: true, message: "Select at least one day." }]}
          >
            <DaysContainer>
              {Object.entries(dayLabels).map(([key, label]) => (
                <DayButton
                  key={key}
                  type={bulkFormDays.includes(key) ? "primary" : "default"}
                  onClick={() => {
                    const newDays = bulkFormDays.includes(key)
                      ? bulkFormDays.filter((d) => d !== key)
                      : [...bulkFormDays, key];
                    bulkForm.setFieldsValue({ days_of_week: newDays });
                  }}
                >
                  {label}
                </DayButton>
              ))}
            </DaysContainer>
          </NoMarginFormItem>
        </FormGroup>

        <FormGroup>
          <FormLabel>
            <Clock /> Times to Create on Each Selected Day
          </FormLabel>
          <HelpText>
            A session will be created for each time listed below.
          </HelpText>
          <Form.List name="times">
            {(fields, { add, remove }) => (
              <TimeListContainer>
                {fields.map(({ key, name, ...restField }) => (
                  <TimeInputRow key={key}>
                    <Form.Item
                      {...restField}
                      name={name}
                      noStyle
                      rules={[{ required: true, message: "Time is required" }]}
                    >
                      <StyledTimePicker
                        use12Hours
                        inputReadOnly
                        format="h:mm A"
                        minuteStep={15}
                        style={{ flex: 1 }}
                        {...mobilePopupProps}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<X size={16} />}
                      />
                    )}
                  </TimeInputRow>
                ))}
                <AddTimeButton
                  onClick={() => add(dayjs("09:00", "HH:mm"))}
                  block
                  icon={<PlusCircle size={16} />}
                >
                  Add Another Time
                </AddTimeButton>
              </TimeListContainer>
            )}
          </Form.List>
        </FormGroup>
      </FormSection>
    );

    const renderBulkStep1 = () => (
      <FormSection key="bulk-step1">
        <StepHeader>
          <StepTitle>Pricing & Capacity</StepTitle>
          <StepDescription>
            Set common details that will apply to all generated sessions
          </StepDescription>
        </StepHeader>

          <FormGrid>
            <FormGroup>
              <FormLabel>
                <Edit3 /> Duration
              </FormLabel>
              <HelpText>Set the duration for all generated sessions.</HelpText>
              <NoMarginFormItem name={["commonDetails", "duration"]}>
                <StyledSelect {...mobilePopupProps}>
                  <Option value={30}>30 minutes</Option>
                  <Option value={60}>1 hour</Option>
                  <Option value={90}>1.5 hours</Option>
                  <Option value={120}>2 hours</Option>
                  <Option value={180}>3 hours</Option>
                </StyledSelect>
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <DollarSign /> Price (CAD)
              </FormLabel>
              <HelpText>Cost per person. Use 0 for a free session.</HelpText>
              <NoMarginFormItem name={["commonDetails", "price"]}>
                <StyledInput prefix="$" type="number" />
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Users /> Maximum Capacity
              </FormLabel>
              <HelpText>The total number of spots available.</HelpText>
              <NoMarginFormItem name={["commonDetails", "maxParticipants"]}>
                <StyledInputNumber style={{ width: "100%" }} inputMode="numeric" />
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Users /> Minimum Participants
                <Tooltip title="The minimum number of participants required for a single booking.">
                  <HelpCircle size={14} className="tooltip-icon" />
                </Tooltip>
              </FormLabel>
              <HelpText>
                The minimum number of people required per booking.
              </HelpText>
              <NoMarginFormItem name={["commonDetails", "minParticipants"]}>
                <StyledInputNumber style={{ width: "100%" }} inputMode="numeric" />
              </NoMarginFormItem>
            </FormGroup>
          </FormGrid>
      </FormSection>
    );

    const renderBulkStep2 = () => {
      const times = bulkFormData.times || [];
      const daysOfWeek = bulkFormData.days_of_week || [];
      const dateRange = bulkFormData.date_range || [];

      return (
        <FormSection key="bulk-step2">
          <StepHeader>
            <StepTitle>Review & Generate</StepTitle>
            <StepDescription>
              Please review the details below before generating schedules.
            </StepDescription>
          </StepHeader>
          <ReviewSection>
            <InfoRow>
              <InfoLabel>Group Name</InfoLabel>
              <InfoValue>{bulkFormData.name || "Not Specified"}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Date Range</InfoLabel>
              <InfoValue>
                <Calendar size={16} />
                {dateRange[0] && dateRange[1]
                  ? `${dateRange[0].format("MMM D")} - ${dateRange[1].format(
                      "MMM D, YYYY"
                    )}`
                  : "Not set"}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Days of Week</InfoLabel>
              <InfoValue>
                <ListChecks size={16} />
                {daysOfWeek.length > 0
                  ? daysOfWeek.map((d) => dayLabels[d]).join(", ")
                  : "None selected"}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Times</InfoLabel>
              <InfoValue>
                <Clock size={16} />
                {times.length > 0
                  ? times.map((t) => t.format("h:mm A")).join(", ")
                  : "None set"}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Duration</InfoLabel>
              <InfoValue>
                {bulkFormData.commonDetails?.duration
                  ? `${bulkFormData.commonDetails.duration} minutes`
                  : "Not set"}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Price</InfoLabel>
              <InfoValue>
                <DollarSign size={16} />
                {parseFloat(bulkFormData.commonDetails?.price) === 0
                  ? "Free"
                  : `$${parseFloat(
                      bulkFormData.commonDetails?.price || 0
                    ).toFixed(2)}`}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Max Capacity</InfoLabel>
              <InfoValue>
                <Users size={16} />
                {bulkFormData.commonDetails?.maxParticipants || 0} participants
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Min Participants</InfoLabel>
              <InfoValue>
                <Users size={16} />
                {bulkFormData.commonDetails?.minParticipants || 1} participants
              </InfoValue>
            </InfoRow>
          </ReviewSection>
        </FormSection>
      );
    };

    return (
      <>
        {!isMobile && (
          <StepsWrapper>
            <Steps
              size="small"
              current={bulkCurrentStep}
              items={[
                { title: "Setup", icon: <Calendar size={16} /> },
                { title: "Pricing", icon: <DollarSign size={16} /> },
                { title: "Review", icon: <CheckCircle size={16} /> },
              ]}
            />
          </StepsWrapper>
        )}
        <ContentWrapper>
          <StepContent>
            <Form
              form={bulkForm}
              layout="vertical"
              onValuesChange={(changedValues) =>
                setFormData({ ...formData, ...changedValues })
              }
            >
              {bulkCurrentStep === 0 && renderBulkStep0()}
              {bulkCurrentStep === 1 && renderBulkStep1()}
              {bulkCurrentStep === 2 && renderBulkStep2()}
            </Form>
          </StepContent>
        </ContentWrapper>
      </>
    );
  };

  const tabItems = [
    {
      label: (
        <Space>
          <File size={14} />
          <span>Single Session</span>
        </Space>
      ),
      key: "single",
      children: renderSingleSessionStepperForm(),
    },
    ...(!editingSchedule && isSingleSession
      ? [
          {
            label: (
              <Space>
                <Copy size={14} />
                <span>Bulk Create</span>
              </Space>
            ),
            key: "bulk",
            children: renderBulkForm(),
          },
        ]
      : []),
  ];

  const renderFormContent = () => {
    return editingSchedule ? (
      renderSingleSessionStepperForm()
    ) : (
      <StyledTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    );
  };

  const handleAddNew = useCallback((date) => {
    setEditingSchedule(null);
    // If a specific date was clicked, pass it to prefill, otherwise null
    setPrefillDate(date && dayjs.isDayjs(date) ? date : null); 
    setActiveView("form");
  }, []);

  const handleEdit = useCallback((schedule) => {
    setEditingSchedule(schedule);
    setActiveView("form");
  }, []);

  const renderContent = () => {
    if (activeView === "manage") {
      return (
        <ScheduleManagementView
          classData={classData}
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onSchedulesUpdate={onSchedulesUpdate}
        />
      );
    }
    if (activeView === "form") {
      return renderFormContent();
    }
    return null;
  };

  const renderFooterButtons = (isMobileLayout = false) => {
    if (activeView === "manage") {
      return (
        <Button
          key="add"
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => handleAddNew(null)}
          block={isMobileLayout}
          style={isMobileLayout ? { height: 44 } : {}}
        >
          Add New Schedule
        </Button>
      );
    }

    if (activeTab === "bulk" && !editingSchedule) {
      const backButton = (
        <Button
          key="back"
          icon={<ChevronLeft size={16} />}
          onClick={handleBulkBack}
          disabled={isBulkLoading}
        >
          Back
        </Button>
      );

      const nextButton = (
        <Button
          key="next"
          type="primary"
          icon={<ChevronRight size={16} />}
          iconPosition="end"
          onClick={handleBulkNext}
        >
          Next
        </Button>
      );

      const submitButton = (
        <Button
          key="submit-bulk"
          type="primary"
          icon={<CheckCircle size={16} />}
          block={isMobileLayout}
          onClick={handleBulkSubmit}
          loading={isBulkLoading}
          style={isMobileLayout ? { height: 44 } : {}}
        >
          Generate Schedules
        </Button>
      );

      if (isMobileLayout) {
        return (
          <>
            <div>
              {/* Fix: Just go back to 'manage' view, don't close drawer */}
              {classData && bulkCurrentStep === 0 && !hideBackButton && (
                 <Button icon={<List size={16} />} onClick={() => setActiveView("manage")}>
                   Back to List
                 </Button>
              )}
              {bulkCurrentStep > 0 && (
                <span style={{ marginLeft: classData && !hideBackButton ? 8 : 0 }}>{backButton}</span>
              )}
            </div>
            {bulkCurrentStep < 2 ? nextButton : submitButton}
          </>
        );
      }

      return (
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <div>
            {classData && bulkCurrentStep === 0 && !hideBackButton && (
              <Button onClick={() => setActiveView("manage")}>
                Back to List
              </Button>
            )}
            {bulkCurrentStep > 0 && (
              <span style={{ marginLeft: classData && bulkCurrentStep === 0 && !hideBackButton ? 8 : 0 }}>{backButton}</span>
            )}
          </div>
          <div>{bulkCurrentStep < 2 ? nextButton : <>{submitButton}</>}</div>
        </div>
      );
    }

    const backButton = (
      <Button
        key="back"
        icon={<ChevronLeft size={16} />}
        onClick={handleBack}
        disabled={isLoading}
      >
        Back
      </Button>
    );

    const nextButton = (
      <Button
        key="next"
        type="primary"
        icon={<ChevronRight size={16} />}
        iconPosition="end"
        onClick={handleNext}
      >
        Next
      </Button>
    );

    const submitButtonText = editingSchedule
      ? "Save Changes"
      : "Create Schedule";
    const submitButton = (
      <Button
        key="submit"
        type="primary"
        icon={<CheckCircle size={16} />}
        onClick={handleSubmit}
        loading={isLoading}
        block={isMobileLayout}
        style={isMobileLayout ? { height: 44 } : {}}
      >
        {submitButtonText}
      </Button>
    );

    if (isMobileLayout) {
      return (
        <>
          <div>
            {/* Fix: Just go back to 'manage' view, don't close drawer */}
            {classData && activeTab === "single" && currentStep === 0 && !hideBackButton && (
                <Button icon={<List size={16} />} onClick={() => setActiveView("manage")}>
                  Back to List
                </Button>
            )}
            {currentStep > 0 && (
              <span style={{ marginLeft: classData && activeTab === "single" && currentStep === 0 && !hideBackButton ? 8 : 0 }}>
                {backButton}
              </span>
            )}
          </div>
          {currentStep < 2 ? nextButton : submitButton}
        </>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div>
          {classData && activeTab === "single" && currentStep === 0 && !hideBackButton && (
            <Button onClick={() => setActiveView("manage")}>
              Back to List
            </Button>
          )}
          {currentStep > 0 && (
            <span style={{ marginLeft: classData && activeTab === "single" && currentStep === 0 && !hideBackButton ? 8 : 0 }}>
              {backButton}
            </span>
          )}
        </div>
        <div>{currentStep < 2 ? nextButton : <>{submitButton}</>}</div>
      </div>
    );
  };

  const getTitle = () => {
    if (activeView === "form") {
      return `${editingSchedule ? "Edit" : "Create"} Schedule`;
    }
    return `Manage Schedules - ${classData?.title}`;
  };

  return (
    <ConfigProvider theme={appTheme}>
      {!isMobile && (
        <DesktopModal
          centered
          title={getTitle()}
          open={open}
          onCancel={onClose}
          width={activeView === "manage" ? "800px" : "600px"}
          destroyOnClose
          maskClosable={!isLoading && !isBulkLoading}
          closable={!isLoading && !isBulkLoading}
          footer={renderFooterButtons(false)}
        >
          <AnimatedModalContent>
            {renderContent()}
          </AnimatedModalContent>
        </DesktopModal>
      )}

      {isMobile && (
        <Drawer.Root
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading && !isBulkLoading) {
              onClose();
            }
          }}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <MobileHeader>
                <MobileTitle>
                  {`Manage Schedules - ${classData?.title}`}
                </MobileTitle>
                <CloseButton
                  icon={<X size={20} />}
                  onClick={onClose}
                  disabled={isLoading || isBulkLoading}
                />
              </MobileHeader>
              <MobileContent>
                 <ScheduleManagementView
                    classData={classData}
                    onAdd={handleAddNew}
                    onEdit={handleEdit}
                    onSchedulesUpdate={onSchedulesUpdate}
                  />
              </MobileContent>
              <MobileFooter>
                 <Button
                  key="add"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => handleAddNew(null)}
                  block
                  style={{ height: 44 }}
                >
                  Add New Schedule
                </Button>
              </MobileFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
          
          <Drawer.NestedRoot open={activeView === "form"} onOpenChange={(o) => !o && setActiveView("manage")} repositionInputs={false}>
            <Drawer.Portal>
               <StyledDrawerOverlay />
               <StyledDrawerContent style={{ height: '96%' }}>
                  <DrawerHandle />
                  <MobileHeader>
                     <MobileTitle>{editingSchedule ? "Edit Schedule" : "New Schedule"}</MobileTitle>
                     <CloseButton icon={<X size={20} />} onClick={() => setActiveView("manage")} />
                  </MobileHeader>
                  <MobileContent>{renderFormContent()}</MobileContent>
                  <MobileFooter>{renderFooterButtons(true)}</MobileFooter>
               </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.NestedRoot>
        </Drawer.Root>
      )}
    </ConfigProvider>
  );
};

export default ScheduleEditDrawer;