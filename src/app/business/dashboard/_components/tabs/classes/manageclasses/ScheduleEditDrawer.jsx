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
  Segmented,
  Grid,
} from "antd";
import message from "@/lib/message";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Target,
  Edit3,
  ListChecks,
  PlusCircle,
  Copy,
  X,
  File,
  Type,
  Info,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Edit,
  Trash2,
  List,
  Undo2,
  Plus,
} from "lucide-react";
import dayjs from "dayjs";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import { theme } from "@/components/theme";

const { Option } = Select;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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
  height: 100%;
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
    overflow-y: auto;
  }

  .ant-tabs-tabpane {
    height: 100%;
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
    flex: 1; /* ADDED: Allows the body to fill available space */
    min-height: 0; /* ADDED: Prevents flex items from overflowing */
    overflow-y: auto; /* ADDED: Makes the body scrollable if content is tall */
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

// --- Redesigned Form Components for clarity ---
const FormContainer = styled.div`
  padding: 24px;

  @media (min-width: 769px) {
    height: 100%;
    overflow-y: auto;
  }

  @media (max-width: 768px) {
    padding: 16px;
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

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 32px 0 28px 0;
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
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: calc(100% - 48px);

  .ant-steps-item-icon {
    margin-top: -2px;
  }

  .ant-steps-item-title {
    font-size: 13px !important;
    line-height: 1.2 !important;
    padding-top: 4px;
  }

  .ant-steps-item-content {
    margin-top: 0 !important;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-height: 0;
  padding: 24px;
  padding-top: 0;

  @media (max-width: 768px) {
    padding: 0;
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

  @media (max-width: 768px) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
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
const StyledInput = styled(Input)``;
const StyledSelect = styled(Select)``;
const StyledTimePicker = styled(TimePicker)``;
const StyledDatePicker = styled(DatePicker)``;
const StyledRangePicker = styled(DatePicker.RangePicker)``;
const StyledInputNumber = styled(InputNumber)``;

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

// --- Schedule Management Components (Moved from ClassManagement) ---
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

const ModalLayout = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex: 1;
  flex-direction: row-reverse;
  overflow: hidden;
`;

const CalendarPanel = styled.div`
  flex: 3;
  background: white;
  padding: 20px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
`;

const ScheduleListPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  background-color: #f8fafc;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const MonthTitle = styled.h4`
  font-weight: 600;
  font-size: 16px;
  margin: 0;
  text-align: center;
`;

const NavButton = styled.button`
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
  &:hover {
    background: #f1f5f9;
  }
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  gap: 4px;
  flex: 1;
`;

const WeekDay = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 12px;
  color: #94a3b8;
  padding-bottom: 8px;
`;

const DayCell = styled.div`
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  position: relative;
  transition: all 0.2s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  ${(props) =>
    !props.$isInMonth && `background-color: #f8fafc; pointer-events: none;`}
  ${(props) =>
    props.$isSelected &&
    `border-color: ${theme.token.colorPrimary}; background-color: #fff8f9; box-shadow: 0 0 0 2px ${theme.token.colorPrimary}40;`}
  &:hover {
    border-color: #e2e8f0;
  }
`;

const DayHeader = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: ${(props) => (props.$isPast ? "#94a3b8" : "#1f2937")};
  margin-bottom: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$isToday &&
    `background-color: ${theme.token.colorPrimary}; color: white; border-radius: 50%;`}
`;

const SchedulePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
`;

const CalendarSchedulePreview = styled.div`
  background-color: #eff6ff;
  color: #1d4ed8;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MoreSchedulesIndicator = styled.div`
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  margin-top: 4px;
`;

const ScheduleCard = styled(motion.div)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
  position: relative;
  ${(props) => props.$isPast && `opacity: 0.6;`}
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  .time {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }
  .date {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
  .group {
    font-size: 11px;
    color: #475569;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
    margin-top: 2px;
  }
`;

const CardActions = styled(Space)`
  flex-shrink: 0;
  .ant-btn {
    border-radius: 8px;
  }
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #475569;
`;

const DropdownHeader = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  &:hover {
    background: #fafafa;
  }
`;

const DropdownIcon = styled(motion.div)`
  display: inline-flex;
  margin-left: 8px;
`;

const DropdownContent = styled(motion.div)`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
`;

const ScheduleListContainer = styled(motion.div)`
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #f8fafc;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 0.7;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.$padding || "60px 20px"};
  text-align: center;
  gap: 16px;

  @media (max-width: 768px) {
    padding: ${(props) => props.$padding || "40px 16px"};
    gap: 12px;
  }

  @media (max-width: 480px) {
    padding: ${(props) => props.$padding || "30px 12px"};
    gap: 10px;
  }
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);

  lord-icon {
    width: 80px;
    height: 80px;
  }

  @media (max-width: 768px) {
    lord-icon {
      width: 64px;
      height: 64px;
    }
  }

  @media (max-width: 480px) {
    lord-icon {
      width: 48px;
      height: 48px;
    }
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;

  @media (max-width: 768px) {
    font-size: 12px;
    max-width: 250px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    max-width: 200px;
  }
`;

const ModalControls = styled.div`
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background-color: white;
`;

const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

const ScheduleCardSkeletonContainer = styled(ScheduleCard)`
  background: white;
  pointer-events: none;
  border-color: #e2e8f0;
`;

const ScheduleCardSkeleton = () => (
  <ScheduleCardSkeletonContainer as="div">
    <CardTop>
      <CardInfo>
        <SkeletonPrimitive style={{ height: "22px", width: "100px", marginBottom: "6px" }} />
        <SkeletonPrimitive style={{ height: "18px", width: "180px" }} />
      </CardInfo>
      <CardActions>
        <SkeletonPrimitive style={{ height: "32px", width: "32px", borderRadius: "8px" }} />
        <SkeletonPrimitive style={{ height: "32px", width: "32px", borderRadius: "8px" }} />
      </CardActions>
    </CardTop>
    <CardBottom>
      <StatItem>
        <SkeletonPrimitive style={{ height: "18px", width: "120px" }} />
      </StatItem>
      <StatItem style={{ justifyContent: "flex-end" }}>
        <SkeletonPrimitive style={{ height: "18px", width: "90px" }} />
      </StatItem>
    </CardBottom>
  </ScheduleCardSkeletonContainer>
);

const ScheduleManagementSkeleton = () => (
  <div style={{ padding: "0 8px" }}>
    {/* Skeleton for a Dropdown Group */}
    <div style={{ borderBottom: '1px solid #f0f0f0' }}>
      <DropdownHeader as="div" style={{ cursor: "default", background: 'white' }}>
        <SkeletonPrimitive style={{ height: "22px", width: "200px" }} />
        <SkeletonPrimitive style={{ height: "24px", width: "60px", borderRadius: "8px" }} />
      </DropdownHeader>
    </div>
    <DropdownContent as="div" style={{ background: "#f8fafc", padding: "12px" }}>
      <ScheduleCardSkeleton />
      <ScheduleCardSkeleton />
    </DropdownContent>

    {/* Skeleton for a second Dropdown Group */}
    <div style={{ borderBottom: '1px solid #f0f0f0' }}>
       <DropdownHeader as="div" style={{ cursor: "default", background: 'white' }}>
        <SkeletonPrimitive style={{ height: "22px", width: "180px" }} />
        <SkeletonPrimitive style={{ height: "24px", width: "60px", borderRadius: "8px" }} />
      </DropdownHeader>
    </div>
    <DropdownContent as="div" style={{ background: "#f8fafc", padding: "12px" }}>
      <ScheduleCardSkeleton />
    </DropdownContent>
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
  const [groupFilter, setGroupFilter] = useState(undefined);
  const [showPast, setShowPast] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(dayjs());
  const [view, setView] = useState("calendar");
  const screens = useBreakpoint();
  const isMobileView = !screens.md;

  // OPTIMIZATION: Depend on the primitive ID, not the entire object
  const optionId = classData?.option?.optionId;

  const refreshSchedules = useCallback(async () => {
    if (!optionId) return;
    
    // Don't set loading to true if we already have schedules (prevents flash)
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

  // Only fetch when the ID changes, not on every render of the parent
  useEffect(() => {
    if (optionId) {
        setLoading(true); // Initial load
        refreshSchedules();
    }
  }, [optionId, refreshSchedules]);

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

  const handleDeleteGroup = async (groupName) => {
    if (!optionId) return;
    try {
      await scheduleService.deleteScheduleGroup({
        option_id: optionId,
        name: groupName,
      });
      message.success(`Group "${groupName}" deleted successfully.`);
      await refreshSchedules();
      onSchedulesUpdate();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const filteredForList = useMemo(() => {
    let filtered = schedules;
    if (selectedDate) {
      filtered = schedules.filter((s) =>
        dayjs(s.date).isSame(selectedDate, "day")
      );
    } else if (!showPast) {
      filtered = schedules.filter(
        (s) => !dayjs(s.date).isBefore(dayjs(), "day")
      );
    }
    const INDIVIDUAL_KEY = "##__INDIVIDUAL__##";
    if (groupFilter) {
      filtered =
        groupFilter === INDIVIDUAL_KEY
          ? filtered.filter((s) => !s.name)
          : filtered.filter((s) => s.name === groupFilter);
    }
    return filtered;
  }, [schedules, selectedDate, showPast, groupFilter]);

  const { groupedSchedules, sortedGroupNames } = useMemo(() => {
    const acc = filteredForList.reduce((acc, schedule) => {
      const groupName = schedule.name || "Individual Schedules";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(schedule);
      return acc;
    }, {});

    Object.values(acc).forEach((group) =>
      group.sort(
        (a, b) =>
          dayjs(a.date).diff(dayjs(b.date)) ||
          dayjs(`T${a.time}`).diff(dayjs(`T${b.time}`))
      )
    );
    const sortedNames = Object.keys(acc).sort((a, b) =>
      a === "Individual Schedules" ? 1 : b === "Individual Schedules" ? -1 : a.localeCompare(b)
    );
    return { groupedSchedules: acc, sortedGroupNames: sortedNames };
  }, [filteredForList]);

  const { uniqueGroups, hasIndividual } = useMemo(() => {
    const groups = [...new Set(schedules.map((s) => s.name).filter(Boolean))];
    const individual = schedules.some((s) => !s.name);
    return { uniqueGroups: groups, hasIndividual: individual };
  }, [schedules]);

  // Replaced motion.div with div in styled components, effectively removing animation here
  const renderScheduleCard = (schedule) => {
    const isPast = dayjs(schedule.date).isBefore(dayjs(), "day");
    const hasConfirmedBookings = schedule.has_confirmed_bookings || false;
    const canDelete = !isPast && !hasConfirmedBookings;

    return (
      <ScheduleCard key={schedule.id} $isPast={isPast}>
        <CardTop>
          <CardInfo>
            <div className="time">{formatTime(schedule.time)}</div>
            <div className="date">
              {dayjs(schedule.date).format("dddd, MMMM D, YYYY")}
            </div>
            {schedule.name && <div className="group">{schedule.name}</div>}
          </CardInfo>
          <CardActions>
            <Tooltip title="Edit Schedule Details">
              <Button
                icon={<Edit3 size={14} />}
                onClick={() => onEdit(schedule)}
                disabled={isPast}
              />
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this schedule?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(schedule.id)}
              disabled={!canDelete}
              okText="Yes, delete"
              cancelText="No"
            >
              <Tooltip
                title={
                  canDelete
                    ? "Delete Schedule"
                    : "Cannot delete past schedules or schedules with confirmed bookings."
                }
              >
                <span>
                  <Button
                    danger
                    icon={<Trash2 size={14} />}
                    disabled={!canDelete}
                  />
                </span>
              </Tooltip>
            </Popconfirm>
          </CardActions>
        </CardTop>
        <CardBottom>
          <StatItem>
            <Users size={14} />{" "}
            <b>
              {schedule.booked_participants}/{schedule.maxParticipants}
            </b>
            &nbsp;Spots Booked
          </StatItem>
          <StatItem>
            <DollarSign size={14} />{" "}
            <b>{parseFloat(schedule.price).toFixed(2)}</b>
            &nbsp;CAD
          </StatItem>
        </CardBottom>
      </ScheduleCard>
    );
  };

  const CustomDropdown = ({ groupName, schedulesInGroup }) => {
    const [isOpen, setIsOpen] = useState(true);
    // Removed AnimatePresence and rotation animations
    return (
      <div>
        <DropdownHeader onClick={() => setIsOpen(!isOpen)}>
          <Space>
            <Text strong>{groupName}</Text>
          </Space>
          <Space>
            {groupName !== "Individual Schedules" && (
              <Popconfirm
                title={`Delete all schedules in the "${groupName}" group?`}
                description="This cannot be undone. Schedules with bookings will not be deleted."
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDeleteGroup(groupName);
                }}
                onCancel={(e) => e.stopPropagation()}
                okText="Yes, delete all"
              >
                <Tooltip title={`Delete entire '${groupName}' group`}>
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            <DropdownIcon style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <ChevronRight size={16} />
            </DropdownIcon>
          </Space>
        </DropdownHeader>
        {isOpen && (
            <DropdownContent>
              {schedulesInGroup.map(renderScheduleCard)}
            </DropdownContent>
        )}
      </div>
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
        <EmptyStateSubtext>
          This class must be configured before schedules can be added.
        </EmptyStateSubtext>
      </EmptyStateContainer>
    );
  }

  const INDIVIDUAL_KEY = "##__INDIVIDUAL__##";

  const ScheduleFilters = () => (
    <ModalControls>
      <ControlRow>
        {!isMobileView && (
          <Segmented
            options={[
              { label: "List", value: "list", icon: <List size={14} /> },
              {
                label: "Calendar",
                value: "calendar",
                icon: <Calendar size={14} />,
              },
            ]}
            value={view}
            onChange={setView}
          />
        )}
        <Select
          placeholder="Filter by group"
          allowClear
          value={groupFilter}
          onChange={setGroupFilter}
          style={{ minWidth: 200, flex: 1 }}
        >
          {hasIndividual && (
            <Option value={INDIVIDUAL_KEY}>Individual Schedules</Option>
          )}
          {uniqueGroups.map((group) => (
            <Option key={group} value={group}>
              {group}
            </Option>
          ))}
        </Select>
        <Tooltip title="Check this to see schedules that have already occurred.">
          <Checkbox
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
          >
            Show Past
          </Checkbox>
        </Tooltip>
      </ControlRow>
      {selectedDate && (
        <ControlRow>
          <Text>
            Showing schedules for: <b>{selectedDate.format("MMMM D, YYYY")}</b>
          </Text>
          <Button
            type="link"
            size="small"
            onClick={() => setSelectedDate(null)}
            icon={<Undo2 size={14} />}
          >
            Clear Selection
          </Button>
        </ControlRow>
      )}
    </ModalControls>
  );

  const CalendarView = () => {
    const schedulesByDate = schedules.reduce((acc, s) => {
      if (!acc[s.date]) acc[s.date] = [];
      acc[s.date].push(s);
      return acc;
    }, {});
    const today = dayjs().startOf("day");
    const firstDay = calendarMonth.startOf("month").day();
    const daysInMonth = calendarMonth.daysInMonth();
    const days = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
      i < firstDay ? null : calendarMonth.date(i - firstDay + 1)
    );

    return (
      <CalendarPanel>
        <CalendarHeader>
          <NavButton
            onClick={() => setCalendarMonth(calendarMonth.subtract(1, "month"))}
          >
            <ChevronLeft size={20} />
          </NavButton>
          <MonthTitle>{calendarMonth.format("MMMM YYYY")}</MonthTitle>
          <NavButton
            onClick={() => setCalendarMonth(calendarMonth.add(1, "month"))}
          >
            <ChevronRight size={20} />
          </NavButton>
        </CalendarHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <WeekDay key={day}>{day}</WeekDay>
          ))}
        </div>
        <DaysGrid>
          {days.map((day, index) => {
            if (!day) return <DayCell key={`empty-${index}`} />;
            const dateStr = day.format("YYYY-MM-DD");
            const daySchedules = schedulesByDate[dateStr] || [];
            return (
              <DayCell
                key={dateStr}
                $isInMonth
                $isSelected={selectedDate?.isSame(day, "day")}
                onClick={() => setSelectedDate(day)}
              >
                <DayHeader $isToday={day.isSame(today, "day")}>
                  {day.date()}
                </DayHeader>
                <SchedulePreviewContainer>
                  {daySchedules.slice(0, 1).map((s) => (
                    <CalendarSchedulePreview key={s.id}>
                      {formatTime(s.time)}
                    </CalendarSchedulePreview>
                  ))}
                  {daySchedules.length > 1 && (
                    <MoreSchedulesIndicator>
                      {daySchedules.length - 1} more
                    </MoreSchedulesIndicator>
                  )}
                </SchedulePreviewContainer>
              </DayCell>
            );
          })}
        </DaysGrid>
      </CalendarPanel>
    );
  };

  const ListView = () => (
    <ScheduleListContainer>
      {loading && schedules.length === 0 ? (
        <ScheduleManagementSkeleton />
      ) : sortedGroupNames.length === 0 ? (
        <EmptyStateContainer>
          <EmptyStateIcon>
            <LordIcon
              src="https://cdn.lordicon.com/uoljexdg.json"
              trigger="in"
              colors="primary:#94a3b8"
              style={{ width: 40, height: 40 }}
            />
          </EmptyStateIcon>
          <EmptyStateText>No Schedules Found</EmptyStateText>
          <EmptyStateSubtext>
            Try adjusting your filters or creating a new schedule.
          </EmptyStateSubtext>
        </EmptyStateContainer>
      ) : (
        sortedGroupNames.map((groupName) => (
          <CustomDropdown
            key={groupName}
            groupName={groupName}
            schedulesInGroup={groupedSchedules[groupName]}
          />
        ))
      )}
    </ScheduleListContainer>
  );

  const renderContent = () => {
    if (isMobileView || view === "list") return <ListView />;
    if (view === "calendar") {
      return (
        <ModalLayout>
          <CalendarView />
          <ScheduleListPanel>
            {loading && schedules.length === 0 ? (
              <ScheduleListContainer>
                <ScheduleManagementSkeleton />
              </ScheduleListContainer>
            ) : sortedGroupNames.length === 0 ? (
              <EmptyStateContainer $padding="40px 20px">
                <EmptyStateIcon>
                  <LordIcon
                    src="https://cdn.lordicon.com/uoljexdg.json"
                    trigger="in"
                    colors="primary:#94a3b8"
                    style={{ width: 40, height: 40 }}
                  />
                </EmptyStateIcon>
                <EmptyStateText>No Schedules Found</EmptyStateText>
                <EmptyStateSubtext>
                  Try adjusting your filters or creating a new schedule.
                </EmptyStateSubtext>
              </EmptyStateContainer>
            ) : (
              <ScheduleListContainer>
                {sortedGroupNames.map((groupName) => (
                  <CustomDropdown
                    key={groupName}
                    groupName={groupName}
                    schedulesInGroup={groupedSchedules[groupName]}
                  />
                ))}
              </ScheduleListContainer>
            )}
          </ScheduleListPanel>
        </ModalLayout>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ScheduleFilters />
      {renderContent()}
    </div>
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      if (startInEditMode && directEditingSchedule) {
        setActiveView("form");
        setEditingSchedule(directEditingSchedule);
      } else if (classData) {
        setActiveView("manage");
        setEditingSchedule(null);
      }
    } else {
      form.resetFields();
      bulkForm.resetFields();
      setCurrentStep(0);
      setBulkCurrentStep(0);
      setFormData({});
      setEditingSchedule(null);
    }
  }, [open, classData, startInEditMode, directEditingSchedule, form, bulkForm]);

  const optionType = classData?.option?.booking_type || "Single Session";
  const optionId = classData?.option?.optionId;
  const isSingleSession = optionType === "Single Session";
  const bulkFormDays = Form.useWatch("days_of_week", bulkForm) || [];

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
      date: dayjs().add(1, "day"),
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
  }, [activeView, editingSchedule, form, bulkForm]);

  const handleFormSuccess = () => {
    onSchedulesUpdate();
    if (classData && !startInEditMode) {
      setActiveView("manage");
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

  // Removed all framer motion wrappers here
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
                  disabledDate={(c) => c && c < dayjs().startOf("day")}
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
                    disabled={isLoading}
                    style={{ width: "100%" }}
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
            <StyledRangePicker style={{ width: "100%" }} />
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
                        format="h:mm A"
                        minuteStep={15}
                        style={{ flex: 1 }}
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

        <Form.Item name="commonDetails" noStyle>
          <FormGrid>
            <FormGroup>
              <FormLabel>
                <Edit3 /> Duration
              </FormLabel>
              <HelpText>Set the duration for all generated sessions.</HelpText>
              <NoMarginFormItem name={["commonDetails", "duration"]}>
                <StyledSelect>
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
                <StyledInputNumber style={{ width: "100%" }} />
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
                <StyledInputNumber style={{ width: "100%" }} />
              </NoMarginFormItem>
            </FormGroup>
          </FormGrid>
        </Form.Item>
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

  const handleAddNew = useCallback(() => {
    setEditingSchedule(null);
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
          onClick={handleAddNew}
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
              {classData && bulkCurrentStep === 0 && !hideBackButton && (
                <Drawer.Close asChild>
                  <Button
                    icon={<List size={16} />}
                  >
                    Back to List
                  </Button>
                </Drawer.Close>
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
            {classData && activeTab === "single" && currentStep === 0 && !hideBackButton && (
              <Drawer.Close asChild>
                <Button 
                  icon={<List size={16} />}
                >
                  Back to List
                </Button>
              </Drawer.Close>
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
    return `Manage Schedules for "${classData?.title}"`;
  };

  return (
    <ConfigProvider theme={appTheme}>
      {!isMobile && (
        <DesktopModal
          centered
          title={getTitle()}
          open={open}
          onCancel={onClose}
          width={activeView === "manage" ? "65vw" : "50vw"}
          destroyOnClose
          maskClosable={!isLoading && !isBulkLoading}
          closable={!isLoading && !isBulkLoading}
          footer={renderFooterButtons(false)}
        >
          {activeView === 'manage' && renderContent()}
          
          {activeView === 'form' && (
            <AnimatedModalContent>
              {renderContent()}
            </AnimatedModalContent>
          )}
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
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <MobileHeader>
                <MobileTitle>
                  {classData ? `Manage Schedules for "${classData?.title}"` : "Manage Schedules"}
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
                  onClick={handleAddNew}
                  block
                  style={{ height: 44 }}
                >
                  Add New Schedule
                </Button>
              </MobileFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
          
          <Drawer.NestedRoot
            open={activeView === "form"}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setActiveView("manage");
                setEditingSchedule(null);
              }
            }}
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent style={{ height: '94%', maxHeight: '94vh' }}>
                <DrawerHandle />
                <MobileHeader>
                  <MobileTitle>{getTitle()}</MobileTitle>
                  <Drawer.Close asChild>
                    <CloseButton
                      icon={<X size={20} />}
                      disabled={isLoading || isBulkLoading}
                    />
                  </Drawer.Close>
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