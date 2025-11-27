"use client";

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import {
  Form,
  Input,
  Select,
  TimePicker,
  DatePicker,
  Button,
  ConfigProvider,
  InputNumber,
  Typography,
  Tooltip,
  Empty,
  Popconfirm,
  Space,
  Modal,
  Steps,
} from "antd";
import message from "@/lib/message";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  X,
  Plus,
  Trash2,
  BookOpen,
  ArrowLeft,
  Info,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  TrendingUp,
  Repeat,
  Edit3,
  Hourglass,
} from "lucide-react";
import dayjs from "dayjs";
import styled, { keyframes } from "styled-components";
import { Drawer as VaulDrawer } from "vaul";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { motion, AnimatePresence } from "framer-motion";

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- HOOK AND COMPONENT FOR MODAL ANIMATION ---

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
        {/* Border to prevent margin collapse */}
        <div style={{ border: '1px solid transparent', margin: '-1px' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// --- HELPER FUNCTIONS ---
const formatDuration = (minutes) => {
  if (!minutes) return "Not set";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
};


// ============= STYLED COMPONENTS =============

const StyledDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(VaulDrawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  height: 96vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  
  .ant-picker-dropdown,
  .ant-select-dropdown,
  .ant-dropdown {
    z-index: 1055 !important;
  }
`;

const StyledNestedDrawerContent = styled(VaulDrawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  height: 94vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1051;
  outline: none;
  
  .ant-picker-dropdown,
  .ant-select-dropdown,
  .ant-dropdown {
    z-index: 1060 !important;
  }
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 24px;
  background: white;
  flex-shrink: 0;
`;

const DrawerTitle = styled(Title)`
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100% - 40px);
  
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  background: #ffffff;
  position: relative;
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  justify-content: space-between;
`;

const CloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    padding: 0 !important;
    flex-direction: column;
  }
  .ant-modal-header {
    padding: 20px 24px;
    flex-shrink: 0;
    background: white;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid #f0f0f0;
  }
  .ant-modal-body {
    padding: 0;
    background: #ffffff;
    position: relative;
  }
  .ant-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    background: white;
    flex-shrink: 0;
    margin: 0 !important;
    position: relative;
    z-index: 1;
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: ${(props) => props.theme.token.marginLG}px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .ant-form-item-explain-error {
    margin-top: ${(props) => props.theme.token.marginXS}px;
    font-size: 12px;
  }
`;

const StepHeader = styled.div`
  text-align: left;
  margin-bottom: 2rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
`;

const StepTitle = styled(Title)`
  margin-bottom: 8px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 20px !important;
  font-weight: 700 !important;
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: 14px;
  line-height: 1.5;
`;

const FormSection = styled(motion.div)`
  background: white;
  padding: 24px 32px;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 769px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: 8px;
`;

const HelpText = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

// --- INPUT STYLES WITH 14px DESKTOP / 16px MOBILE ---

const StyledInput = styled(Input)`
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }

  /* Prevent zoom on mobile */
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: 44px !important;
    padding: 0 11px !important;
    border-radius: 8px !important;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: 42px !important;
    font-size: 14px;
    
    /* Prevent zoom on mobile */
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }
`;

const StyledInputNumber = styled(InputNumber)`
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
  .ant-input-number-input-wrap,
  .ant-input-number-input {
    height: 100% !important;
    display: flex;
    align-items: center;
    font-size: 14px !important;

    /* Prevent zoom on mobile */
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const StyledTimePicker = styled(TimePicker)`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  .ant-picker-input > input {
    font-size: 14px;
    
    /* Prevent zoom on mobile */
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  .ant-picker-input > input {
    font-size: 14px;

    /* Prevent zoom on mobile */
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const DaySelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const DayButton = styled(Button)`
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  height: 44px;
  border-radius: 8px;
  font-weight: 500;
  padding: 0 8px;
  
  &.ant-btn-primary {
    background: ${(props) => props.theme.token.colorPrimary};
  }
  
  @media (max-width: 768px) {
    height: 40px;
    font-size: 14px; /* Increased from 13px for better touch/readability */
  }
`;

// --- NEW: Custom Duration Picker Components ---
const DurationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const PresetGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const PresetChip = styled.button`
  border: 1px solid ${props => props.$active ? props.theme.token.colorPrimary : '#e2e8f0'};
  background: ${props => props.$active ? `${props.theme.token.colorPrimary}10` : 'white'};
  color: ${props => props.$active ? props.theme.token.colorPrimary : '#475569'};
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  &:hover {
    border-color: ${props => props.theme.token.colorPrimary};
    color: ${props => props.theme.token.colorPrimary};
  }
`;

const CustomDurationInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  opacity: ${props => props.disabled ? 0.6 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  .input-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    
    label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
  }
`;

const DurationPicker = ({ value, onChange, disabled }) => {
  // value is in minutes (int)
  const safeValue = value || 0;
  const hours = Math.floor(safeValue / 60);
  const minutes = safeValue % 60;

  const presets = [
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hr", value: 60 },
    { label: "1.5 hr", value: 90 },
    { label: "2 hr", value: 120 },
    { label: "3 hr", value: 180 },
  ];

  const handleHoursChange = (newHours) => {
    const total = (newHours || 0) * 60 + minutes;
    onChange(total);
  };

  const handleMinutesChange = (newMinutes) => {
    // Ensure minutes stay between 0-59 conceptually
    const total = hours * 60 + (newMinutes || 0);
    onChange(total);
  };

  return (
    <DurationContainer>
      <PresetGrid>
        {presets.map(preset => (
          <PresetChip 
            key={preset.value}
            type="button"
            $active={safeValue === preset.value}
            onClick={() => !disabled && onChange(preset.value)}
            disabled={disabled}
          >
            {preset.label}
          </PresetChip>
        ))}
      </PresetGrid>
      
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 4, marginBottom: -4 }}>
          Or enter custom duration:
      </div>
      
      <CustomDurationInputs disabled={disabled}>
        <div className="input-group">
          <label>Hours</label>
          <StyledInputNumber 
            min={0} 
            max={23}
            value={hours}
            onChange={handleHoursChange}
            disabled={disabled}
            placeholder="0"
            inputMode="numeric"
          />
        </div>
        <div style={{ paddingTop: 18, fontWeight: 600, color: '#cbd5e1' }}>:</div>
        <div className="input-group">
          <label>Minutes</label>
          <StyledInputNumber 
            min={0}
            max={59}
            value={minutes}
            onChange={handleMinutesChange}
            disabled={disabled}
            placeholder="0"
            inputMode="numeric"
          />
        </div>
      </CustomDurationInputs>
    </DurationContainer>
  );
};

const ScheduleList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ScheduleCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
`;

const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
`;

const ScheduleTitle = styled(Title)`
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a1a1a;
  letter-spacing: -0.3px;
`;

const ScheduleActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
`;

const StatItem = styled.div`
  text-align: center;
  flex: 1;
  padding: 0 8px;

  &:not(:last-child) {
    border-right: 1px solid #e2e8f0;
  }
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 2px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  letter-spacing: -0.3px;

  svg {
    opacity: 0.7;
  }
`;

const ReviewSection = styled.div`
  background: #f8fafc;
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
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-weight: 500;
`;

const InfoValue = styled(Text)`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// FLUSH STEPPER WRAPPER
const StepsWrapper = styled.div`
  width: 100%;
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  z-index: 10;
  
  .ant-steps-item-icon {
    width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 14px;
  }

  .ant-steps-item-title {
    font-size: 14px !important;
    line-height: 28px !important;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding: 16px 20px;
    .ant-steps-item-title {
      display: none; 
    }
  }
`;

// EDGE TO EDGE CONTENT WRAPPER
const ContentWrapper = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.1);
    border-radius: 3px;
  }
`;

const ContentPadding = styled.div`
  padding: 32px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const DetailedViewContainer = styled.div`
  padding: 32px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const DetailedHeader = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 8px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

const DetailedTitle = styled(Title)`
  margin: 0 !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1a1a1a;
  letter-spacing: -0.5px;
`;

const DetailedMetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  background: #ffffffff;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    gap: 8px;
    margin-bottom: 8px;
  }
`;

const MetricItem = styled.div`
  flex: 1;
  min-width: 150px;
  text-align: center;
  @media (max-width: 768px) {
    min-width: unset;
  }
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 8px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${(props) => props.theme.token.colorText};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.5px;

  svg {
    opacity: 0.7;
  }
  @media (max-width: 768px) {
    font-size: 20px;
    gap: 4px;
  }
`;

const SessionsBreakdown = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
  @media (max-width: 768px) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin-bottom: 8px;
    padding: 16px;
  }
`;

const SessionsTitle = styled(Title)`
  margin: 0 0 16px 0 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
`;

const SessionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: ${(props) =>
    props.$isPast
      ? "rgba(0, 0, 0, 0.02)"
      : props.$isToday
      ? "rgba(255, 56, 92, 0.05)"
      : "rgba(248, 250, 252, 0.6)"};
  border-radius: 12px;
  border: 1px solid
    ${(props) =>
  props.$isToday ? "rgba(255, 56, 92, 0.2)" : "rgba(226, 232, 240, 0.4)"};
  opacity: ${(props) => (props.$isPast ? 0.6 : 1)};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${(props) =>
  props.$isPast ? "none" : "0 2px 8px rgba(0, 0, 0, 0.05)"};
  }
`;

const SessionDate = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SessionBadge = styled.span`
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) =>
    props.$isPast
      ? "rgba(0, 0, 0, 0.1)"
      : props.$isToday
      ? "rgba(255, 56, 92, 0.15)"
      : "rgba(34, 197, 94, 0.15)"};
  color: ${(props) =>
    props.$isPast
      ? "rgba(0, 0, 0, 0.5)"
      : props.$isToday
      ? "#ff385c"
      : "#22c55e"};
`;

const StepContent = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 16px;
  }
`;

// ============= SKELETON COMPONENTS =============
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

const CourseScheduleCardSkeleton = () => (
  <ScheduleCard>
    <ScheduleHeader>
      <div style={{ flex: 1, paddingRight: "16px" }}>
        <SkeletonPrimitive style={{ height: "24px", width: "70%", marginBottom: "8px" }} />
        <SkeletonPrimitive style={{ height: "18px", width: "50%" }} />
      </div>
      <ScheduleActions>
        <SkeletonPrimitive style={{ height: "32px", width: "32px", borderRadius: "8px" }} />
        <SkeletonPrimitive style={{ height: "32px", width: "32px", borderRadius: "8px" }} />
      </ScheduleActions>
    </ScheduleHeader>
    <StatsRow>
      <StatItem>
        <SkeletonPrimitive style={{ height: "24px", width: "40px", margin: "0 auto 4px" }} />
        <SkeletonPrimitive style={{ height: "16px", width: "60px", margin: "0 auto" }} />
      </StatItem>
      <StatItem>
        <SkeletonPrimitive style={{ height: "24px", width: "50px", margin: "0 auto 4px" }} />
        <SkeletonPrimitive style={{ height: "16px", width: "70px", margin: "0 auto" }} />
      </StatItem>
      <StatItem>
        <SkeletonPrimitive style={{ height: "24px", width: "60px", margin: "0 auto 4px" }} />
        <SkeletonPrimitive style={{ height: "16px", width: "60px", margin: "0 auto" }} />
      </StatItem>
    </StatsRow>
    <div style={{ padding: "12px 16px" }}>
      <SkeletonPrimitive style={{ height: "21px", width: "150px", marginBottom: "12px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SkeletonPrimitive style={{ height: "20px", width: "80%" }} />
        <SkeletonPrimitive style={{ height: "20px", width: "75%" }} />
        <SkeletonPrimitive style={{ height: "20px", width: "85%" }} />
      </div>
    </div>
  </ScheduleCard>
);

const CourseScheduleListSkeleton = () => (
  <ScheduleList>
    <CourseScheduleCardSkeleton />
    <CourseScheduleCardSkeleton />
  </ScheduleList>
);

// ============= MAIN COMPONENT =============

const CourseScheduleDrawer = ({ open, onClose, classData }) => {
  const [form] = Form.useForm();
  const [view, setView] = useState("list"); // Used for desktop modal
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State for nested drawers on mobile
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    startDate: null,
    endDate: null,
    selectedDays: [],
    time: null,
    duration: 60,
    maxParticipants: 10,
    price: "",
    totalSessions: 0,
  });

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (open && classData?.classId) fetchSchedules();
  }, [open, classData?.classId]);

  // This effect ensures that every time the main drawer is closed, all state is reset to default.
  useEffect(() => {
    if (!open) {
      // Reset all states on close
      setView("list");
      setCurrentStep(0);
      setSelectedSchedule(null);
      setEditingSchedule(null);
      setSearchTerm("");
      setStatusFilter("all");
      setCreateOpen(false);
      setDetailOpen(false);
      form.resetFields();
      setFormData({
        name: "",
        startDate: null,
        endDate: null,
        selectedDays: [],
        time: null,
        duration: 60,
        maxParticipants: 10,
        price: "",
        totalSessions: 0,
      });
    }
  }, [open, form]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const courseOption = classData.options?.find(
        (opt) => opt.booking_type === "Full Course"
      );
      if (!courseOption) {
        setSchedules([]);
        return;
      }
      const response = await scheduleService.fetchSchedules({
        option_id: courseOption.optionId,
      });

      if (response?.success && Array.isArray(response.data)) {
        const groupedSchedules = response.data.reduce((acc, schedule) => {
          // Create a key based on common attributes (excluding ID and Day)
          const groupKey = `${schedule.name}-${schedule.start_date}-${schedule.end_date}-${schedule.time}-${schedule.duration}-${schedule.price}`;
          
          if (!acc[groupKey]) {
            acc[groupKey] = { 
                ...schedule, 
                // FIX: Store pairs of { id, day } so we never lose the link
                schedulePairs: [{ id: schedule.id, day: schedule.day }],
                // Keep these for display summaries
                booked_participants: schedule.booked_participants,
                total_revenue: parseFloat(schedule.total_revenue),
                has_confirmed_bookings: schedule.has_confirmed_bookings 
            };
          } else {
            acc[groupKey].schedulePairs.push({ id: schedule.id, day: schedule.day });
            acc[groupKey].booked_participants += schedule.booked_participants;
            acc[groupKey].total_revenue += parseFloat(schedule.total_revenue);
            acc[groupKey].has_confirmed_bookings = acc[groupKey].has_confirmed_bookings || schedule.has_confirmed_bookings;
          }
          return acc;
        }, {});

        const finalSchedules = Object.values(groupedSchedules).map((schedule) => {
          const dayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
          
          // Sort the pairs so the display text (Mon, Wed) matches the logical order
          schedule.schedulePairs.sort((a, b) => dayOrder[a.day] - dayOrder[b.day]);
          
          // Helper arrays for easier access later
          schedule.ids = schedule.schedulePairs.map(p => p.id);
          schedule.day = schedule.schedulePairs.map(p => p.day).join(", ");
          schedule.total_revenue = schedule.total_revenue.toFixed(2);
          
          return schedule;
        });
        setSchedules(finalSchedules);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      message.error("Failed to load course schedules");
    } finally {
      setLoading(false);
    }
  };
  const calculateSessionCount = (startDate, endDate, selectedDays) => {
    if (!startDate || !endDate || selectedDays.length === 0) return 0;
    let count = 0;
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    const dayMap = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
    const shortSelectedDays = selectedDays.map((d) => dayMap[d]);

    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (shortSelectedDays.includes(current.format("ddd"))) count++;
      current = current.add(1, "day");
    }
    return count;
  };

  const generateSessionDates = (startDate, endDate, selectedDays) => {
    const sessions = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    const dayMap = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
    const shortSelectedDays = Array.isArray(selectedDays) ? selectedDays.map((d) => dayMap[d] || d) : [];

    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (shortSelectedDays.includes(current.format("ddd"))) {
        sessions.push(current.toDate());
      }
      current = current.add(1, "day");
    }
    return sessions;
  };

  const handleDayToggle = (day) => {
    const newSelectedDays = formData.selectedDays?.includes(day)
      ? formData.selectedDays.filter((d) => d !== day)
      : [...(formData.selectedDays || []), day];
    const newSessionCount = calculateSessionCount(formData.startDate, formData.endDate, newSelectedDays);
    setFormData({ ...formData, selectedDays: newSelectedDays, totalSessions: newSessionCount });
    form.setFieldsValue({ selectedDays: newSelectedDays });
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const newSessionCount = calculateSessionCount(dates[0], dates[1], formData.selectedDays);
      setFormData({ ...formData, startDate: dates[0], endDate: dates[1], totalSessions: newSessionCount });
    } else {
      setFormData({ ...formData, startDate: null, endDate: null, totalSessions: 0 });
    }
  };

  const validateStep = async (step) => {
    try {
      switch (step) {
        case 0:
          await form.validateFields(["name", "dateRange", "selectedDays", "time", "duration"]);
          const [startDate, endDate] = form.getFieldValue("dateRange");
          const sessionCount = calculateSessionCount(startDate, endDate, form.getFieldValue("selectedDays"));
          setFormData({ ...formData, name: form.getFieldValue("name"), startDate, endDate, selectedDays: form.getFieldValue("selectedDays"), time: form.getFieldValue("time"), duration: form.getFieldValue("duration"), totalSessions: sessionCount });
          return true;
        case 1:
          await form.validateFields(["price", "maxParticipants"]);
          setFormData({ ...formData, price: form.getFieldValue("price"), maxParticipants: form.getFieldValue("maxParticipants") });
          return true;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  };

  const handleNext = async () => {
    if (await validateStep(currentStep)) setCurrentStep(currentStep + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const courseOption = classData.options?.find(
        (opt) => opt.booking_type === "Full Course"
      );
      
      if (!courseOption) throw new Error("Could not find a valid course option.");

      // --- Common Payload for Updates & Creation ---
      const commonPayload = {
        name: formData.name,
        start_date: formData.startDate.format("YYYY-MM-DD"),
        end_date: formData.endDate.format("YYYY-MM-DD"),
        time: formData.time.format("HH:mm:ss"),
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        price: parseFloat(formData.price),
      };

      if (editingSchedule) {
        // 1. Map existing schedules: { "Mon": 101, "Wed": 102 }
        const existingMap = {};
        editingSchedule.schedulePairs.forEach(pair => {
            existingMap[pair.day] = pair.id;
        });

        // 2. Calculate Deltas based on selected days (e.g., ["Mon", "Fri"])
        // Note: Form usually gives full names ("Monday"), convert to "Mon"
        const selectedDaysShort = formData.selectedDays.map(d => d.substring(0, 3));

        const daysToUpdate = []; // Exists in both -> Update ID
        const daysToAdd = [];    // New in form -> Create
        const daysToDelete = []; // Missing in form -> Delete ID

        // Find additions and updates
        selectedDaysShort.forEach(day => {
            if (existingMap[day]) {
                daysToUpdate.push({ id: existingMap[day], day });
            } else {
                daysToAdd.push(day);
            }
        });

        // Find deletions
        Object.keys(existingMap).forEach(existingDay => {
            if (!selectedDaysShort.includes(existingDay)) {
                daysToDelete.push(existingMap[existingDay]);
            }
        });

        // 3. Execute Operations
        const promises = [];

        // A. Update existing (Price, Time, etc)
        daysToUpdate.forEach(item => {
            promises.push(scheduleService.updateSchedule(item.id, commonPayload));
        });

        // B. Create new days
        daysToAdd.forEach(day => {
            promises.push(scheduleService.createSchedule({
                ...commonPayload,
                option: courseOption.optionId,
                day: day 
            }));
        });

        // C. Delete removed days
        daysToDelete.forEach(id => {
            promises.push(scheduleService.deleteSchedule(id));
        });

        const results = await Promise.all(promises);
        const failed = results.filter(res => res && !res.success);

        if (failed.length > 0) {
             throw new Error(`Action completed with ${failed.length} errors. Please check the schedule.`);
        }

        message.success("Course schedule updated successfully!");
        await fetchSchedules();
        
        if (isMobile) setCreateOpen(false); else setView("list");

      } else {
        // --- CREATE MODE (Simple loop) ---
        const creationPromises = formData.selectedDays.map((day) => {
          return scheduleService.createSchedule({
            ...commonPayload,
            option: courseOption.optionId,
            day: day.substring(0, 3),
          });
        });

        const results = await Promise.all(creationPromises);
        const successfulCreations = results.filter((res) => res.success).length;

        if (successfulCreations > 0) {
          message.success(`${successfulCreations} course schedule(s) created successfully!`);
          await fetchSchedules();
          if (isMobile) setCreateOpen(false); else setView("list");
        }
        
        if (successfulCreations < results.length) {
          throw new Error("Some schedules could not be created. Check for conflicts.");
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      message.error(error.message || "Failed to save course schedule");
    } finally {
      setSubmitting(false);
      setEditingSchedule(null);
    }
  };
  const handleDeleteGroup = async (scheduleGroup) => {
    const scheduleIdsToDelete = scheduleGroup.ids;
    if (!scheduleIdsToDelete || scheduleIdsToDelete.length === 0) {
      message.error("No schedules to delete.");
      return;
    }

    try {
      const deletePromises = scheduleIdsToDelete.map((id) => scheduleService.deleteSchedule(id));
      const results = await Promise.all(deletePromises);

      const failedDeletions = results.filter((res) => !res?.success);
      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} schedule(s).`);
      }

      message.success("Course schedule deleted successfully");
      await fetchSchedules();
    } catch (error) {
      message.error(error.message || "Failed to delete schedule");
    }
  };

  const handleEditClick = (e, schedule) => {
    e.stopPropagation();
    setEditingSchedule(schedule);
    const startDate = dayjs(schedule.start_date);
    const endDate = dayjs(schedule.end_date);
    const time = dayjs(schedule.time, "HH:mm:ss");

    const dayMapReverse = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
    const selectedDays = schedule.day.split(", ").map((d) => dayMapReverse[d]);

    const formDataForEdit = {
      name: schedule.name,
      startDate,
      endDate,
      selectedDays,
      time,
      duration: schedule.duration,
      maxParticipants: schedule.maxParticipants,
      price: schedule.price,
      totalSessions: calculateSessionCount(startDate, endDate, selectedDays),
    };

    setFormData(formDataForEdit);
    form.setFieldsValue({
      name: schedule.name,
      dateRange: [startDate, endDate],
      selectedDays: selectedDays,
      time,
      duration: schedule.duration,
      price: schedule.price,
      maxParticipants: schedule.maxParticipants,
    });

    if (isMobile) {
      setCreateOpen(true);
    } else {
      setView("create");
    }
  };

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    const now = dayjs();
    return schedules.filter((s) => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const startDate = dayjs(s.start_date);
      const endDate = dayjs(s.end_date);
      let statusMatch = true;
      if (statusFilter === "upcoming") {
        statusMatch = startDate.isAfter(now);
      } else if (statusFilter === "ongoing") {
        statusMatch = (now.isAfter(startDate) || now.isSame(startDate, "day")) && (now.isBefore(endDate) || now.isSame(endDate, "day"));
      } else if (statusFilter === "completed") {
        statusMatch = endDate.isBefore(now);
      }
      return nameMatch && statusMatch;
    });
  }, [schedules, searchTerm, statusFilter]);

  const schedulesWithSessions = useMemo(() => {
    return filteredSchedules.map((scheduleGroup) => {
      const s = scheduleGroup;
      const selectedDays = s.day.split(", ");
      const sessionDates = generateSessionDates(s.start_date, s.end_date, selectedDays);
      const sessionPreview = sessionDates.slice(0, 4);
      return { ...s, sessionDates, sessionPreview, selectedDays };
    });
  }, [filteredSchedules]);

  const renderStepContent = () => {
    const stepVariants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    };
    
    // Check if we are in "Lockdown Mode"
    const isLocked = editingSchedule && editingSchedule.has_confirmed_bookings;

    switch (currentStep) {
      case 0:
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return (
          <FormSection key="step0" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <StepHeader>
              <StepTitle level={3}>Schedule Details</StepTitle>
              <StepDescription>Set up your course name and schedule</StepDescription>
            </StepHeader>
            <FormGroup>
              <FormLabel><BookOpen size={16} /> Course Schedule Name</FormLabel>
              <HelpText><Info size={14} /> e.g., "Spring 2025 Evening Sessions"</HelpText>
              <Form.Item name="name" rules={[{ required: true, message: "Please enter a schedule name" }]}>
                <StyledInput placeholder="Enter course schedule name" size="large" />
              </Form.Item>
            </FormGroup>
            
            {isLocked && (
               <div style={{ marginBottom: 20, padding: 12, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, color: '#cf1322', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                 <Info size={16} />
                 <span>Dates and times are locked because this course has active students.</span>
               </div>
            )}

            <FormGroup>
              <FormLabel><Calendar size={16} /> Date Range</FormLabel>
              <HelpText><Info size={14} /> Select the start and end dates for the entire course.</HelpText>
              <Form.Item name="dateRange" rules={[{ required: true, message: "Please select a date range" }]}>
                <StyledRangePicker 
                  format="MMMM D, YYYY" 
                  size="large" 
                  inputReadOnly
                  disabledDate={(c) => c && c < dayjs().startOf("day")} 
                  onChange={handleDateRangeChange} 
                  disabled={isLocked} // DISABLED IF BOOKED
                  getPopupContainer={isMobile ? (trigger) => trigger.parentElement : undefined}
                />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel><CalendarDays size={16} /> Days of Week</FormLabel>
              <HelpText><Info size={14} /> Select which days of the week the course will meet.</HelpText>
              <Form.Item name="selectedDays" rules={[{ required: true, message: "Please select at least one day" }]}>
                <DaySelector>
                  {daysOfWeek.map((d) => (
                    <DayButton 
                        key={d} 
                        type={formData.selectedDays?.includes(d) ? "primary" : "default"} 
                        onClick={() => !isLocked && handleDayToggle(d)} // PREVENT TOGGLE IF BOOKED
                        disabled={isLocked} // VISUALLY DISABLED
                    >
                      {d.substring(0, 3)}
                    </DayButton>
                  ))}
                </DaySelector>
              </Form.Item>
            </FormGroup>
            <FormGrid>
              <FormGroup>
                <FormLabel><Clock size={16} /> Time</FormLabel>
                <Form.Item name="time" rules={[{ required: true, message: "Please select a time" }]}>
                  <StyledTimePicker 
                    format="h:mm A" 
                    use12Hours 
                    size="large" 
                    minuteStep={15} 
                    inputReadOnly
                    disabled={isLocked} // DISABLED IF BOOKED
                    getPopupContainer={isMobile ? (trigger) => trigger.parentElement : undefined}
                  />
                </Form.Item>
              </FormGroup>
              <FormGroup>
                <FormLabel><Hourglass size={16} /> Duration</FormLabel>
                <Form.Item name="duration" initialValue={60} rules={[{ required: true, message: "Please select duration" }]}>
                  {/* Pass disabled prop to custom component */}
                  <DurationPicker disabled={isLocked} /> 
                </Form.Item>
              </FormGroup>
            </FormGrid>
          </FormSection>
        );
      case 1:
        return (
          <FormSection key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <StepHeader>
              <StepTitle level={3}>Pricing & Capacity</StepTitle>
              <StepDescription>Set the total price for the course and the maximum number of participants.</StepDescription>
            </StepHeader>
            <FormGroup>
              <FormLabel><DollarSign size={16} /> Course Price</FormLabel>
              <HelpText><Info size={14} /> This is the total price per participant for all {formData.totalSessions} sessions.</HelpText>
              <Form.Item name="price" rules={[{ required: true, message: "Please enter a price" }, { validator: (_, v) => v && parseFloat(v) <= 0 ? Promise.reject("Price > 0") : Promise.resolve() }]}>
                <StyledInputNumber 
                  min={0} 
                  step={1} 
                  precision={2} 
                  prefix="$" 
                  size="large"
                  inputMode="decimal" 
                />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel><Users size={16} /> Max Participants</FormLabel>
              <HelpText><Info size={14} /> The maximum number of students that can enroll in this course.</HelpText>
              <Form.Item name="maxParticipants" initialValue={10} rules={[{ required: true, message: "Please enter max participants" }, { validator: (_, v) => v && v < 1 ? Promise.reject("Min 1") : Promise.resolve() }]}>
                <StyledInputNumber 
                  min={1} 
                  max={100} 
                  size="large"
                  inputMode="numeric"
                />
              </Form.Item>
            </FormGroup>
          </FormSection>
        );
      case 2:
        return (
          <FormSection key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <StepHeader>
              <StepTitle level={3}>Review & Confirm</StepTitle>
              <StepDescription>Please review the details below before creating the schedule.</StepDescription>
            </StepHeader>
            <ReviewSection>
              <InfoRow><InfoLabel>Name</InfoLabel><InfoValue>{formData.name}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Date Range</InfoLabel><InfoValue><Calendar size={16} />{formData.startDate?.format("MMM D, YYYY")} - {formData.endDate?.format("MMM D, YYYY")}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Days</InfoLabel><InfoValue><CalendarDays size={16} />{formData.selectedDays.join(", ")}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Time</InfoLabel><InfoValue><Clock size={16} />{formData.time?.format("h:mm A")}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Duration</InfoLabel><InfoValue>{formatDuration(formData.duration)}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Total Sessions</InfoLabel><InfoValue><BookOpen size={16} />{formData.totalSessions}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Price</InfoLabel><InfoValue><DollarSign size={16} />{parseFloat(formData.price) === 0 ? "Free" : `$${parseFloat(formData.price).toFixed(2)}`}</InfoValue></InfoRow>
              <InfoRow><InfoLabel>Max Participants</InfoLabel><InfoValue><Users size={16} />{formData.maxParticipants}</InfoValue></InfoRow>
            </ReviewSection>
          </FormSection>
        );
      default: return null;
    }
  };

  const renderList = () => (
    <ContentPadding>
      <FilterBar>
        <StyledInput placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 200 }} allowClear />
        <StyledSelect 
          value={statusFilter} 
          onChange={(value) => setStatusFilter(value)} 
          style={{ width: 150 }}
          getPopupContainer={isMobile ? (trigger) => trigger.parentElement : undefined}
        >
          <Option value="all">All Statuses</Option>
          <Option value="upcoming">Upcoming</Option>
          <Option value="ongoing">Ongoing</Option>
          <Option value="completed">Completed</Option>
        </StyledSelect>
      </FilterBar>
      {loading ? (
        <CourseScheduleListSkeleton />
      ) : schedulesWithSessions.length > 0 ? (
        <ScheduleList>
            {schedulesWithSessions.map((s) => (
              <ScheduleCard key={s.name || s.ids.join("-")} onClick={() => { setSelectedSchedule(s); if (isMobile) setDetailOpen(true); else setView("detail"); }} style={{ cursor: "pointer" }}>
                <ScheduleHeader>
                  <div>
                  <ScheduleTitle level={5}><CalendarDays size={16} />{s.name || `Every ${s.day}`}</ScheduleTitle>
                  <Text type="secondary" style={{ fontSize: 12, letterSpacing: "0.2px" }}>{dayjs(s.start_date).format("MMM D")} - {dayjs(s.end_date).format("MMM D, YYYY")}</Text>
                </div>
                <ScheduleActions>
                  {/* EDIT BUTTON ALWAYS ENABLED - LOCKING HAPPENS IN FORM */}
                  <Tooltip title="Edit"><Button type="text" icon={<Edit3 size={14} />} onClick={(e) => handleEditClick(e, s)} style={{ height: 32, width: 32 }} /></Tooltip>
                  <Tooltip title={s.has_confirmed_bookings ? "Cannot delete with active bookings" : "Delete"}>
                    <Popconfirm title="Delete this course schedule?" description="This will remove all recurring sessions for this course. This action cannot be undone." onConfirm={(e) => { e.stopPropagation(); handleDeleteGroup(s); }} onCancel={(e) => e.stopPropagation()} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }} disabled={s.has_confirmed_bookings}>
                      <Button type="text" danger icon={<Trash2 size={14} />} disabled={s.has_confirmed_bookings} onClick={(e) => e.stopPropagation()} style={{ height: 32, width: 32 }} />
                    </Popconfirm>
                  </Tooltip>
                </ScheduleActions>
              </ScheduleHeader>
              <StatsRow>
                <StatItem><StatValue><BookOpen size={16} /> {s.sessionDates.length}</StatValue><StatLabel>Sessions</StatLabel></StatItem>
                <StatItem><StatValue><Users size={16} /> {s.booked_participants || 0}/{s.maxParticipants}</StatValue><StatLabel>Enrolled</StatLabel></StatItem>
                <StatItem><StatValue><TrendingUp size={16} /> ${parseFloat(s.total_revenue || 0).toFixed(0)}</StatValue><StatLabel>Revenue</StatLabel></StatItem>
              </StatsRow>
              <div style={{ padding: "12px 16px" }}>
                <SessionsTitle style={{ fontSize: "14px", margin: "0 0 8px 0" }}>Upcoming Sessions:</SessionsTitle>
                {s.sessionPreview.map((date, idx) => (<SessionItem key={idx} $isPast={false} $isToday={dayjs(date).isSame(dayjs(), "day")} style={{ padding: "6px 8px", marginBottom: "4px", background: "transparent", border: "none" }}><SessionDate style={{ fontSize: "13px" }}><Calendar size={14} />{dayjs(date).format("ddd, MMM D, YYYY")}</SessionDate></SessionItem>))}
                {s.sessionDates.length > 4 && (<Text type="secondary" style={{ fontSize: 12, display: "block", textAlign: "center", marginTop: "8px" }}>+ {s.sessionDates.length - 4} more sessions</Text>)}
              </div>
            </ScheduleCard>
          ))}
        </ScheduleList>
      ) : schedules.length > 0 ? (
            <Empty description={<span>No course schedules match your filters.<br />Try adjusting your search.</span>} />
      ) : (
        <Empty description={<span>No course schedules yet</span>} />
      )}
    </ContentPadding>
  );

  const renderDetailedView = () => {
    if (!selectedSchedule) return null;
    const sessionDates = generateSessionDates(selectedSchedule.start_date, selectedSchedule.end_date, selectedSchedule.day.split(", "));
    const today = dayjs();
    return (
      <DetailedViewContainer>
        <DetailedHeader>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <Button icon={<ArrowLeft size={16} />} onClick={() => { if (isMobile) setDetailOpen(false); else { setView("list"); setSelectedSchedule(null); } }} type="text">Back to List</Button>
          </div>
          <DetailedTitle level={3}><CalendarDays size={24} />{selectedSchedule.name || `Every ${selectedSchedule.day}`}</DetailedTitle>
          <Text type="secondary" style={{ fontSize: 14 }}>{dayjs(selectedSchedule.start_date).format("MMMM D, YYYY")} - {dayjs(selectedSchedule.end_date).format("MMMM D, YYYY")}</Text>
        </DetailedHeader>
        <DetailedMetricsRow>
          <MetricItem><MetricValue><DollarSign size={22} />${parseFloat(selectedSchedule.total_revenue || 0).toFixed(2)}</MetricValue><MetricLabel>Total Revenue</MetricLabel></MetricItem>
          <MetricItem><MetricValue><Users size={22} />{selectedSchedule.booked_participants || 0} / {selectedSchedule.maxParticipants}</MetricValue><MetricLabel>Enrolled</MetricLabel></MetricItem>
          <MetricItem><MetricValue><BookOpen size={22} />{sessionDates.length}</MetricValue><MetricLabel>Total Sessions</MetricLabel></MetricItem>
        </DetailedMetricsRow>
        <SessionsBreakdown>
          <SessionsTitle level={4}>Session Schedule</SessionsTitle>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {sessionDates.map((date, idx) => {
              const sessionDate = dayjs(date);
              const isPast = sessionDate.isBefore(today, "day");
              const isToday = sessionDate.isSame(today, "day");
              return (
                <SessionItem key={idx} $isPast={isPast} $isToday={isToday}>
                  <SessionDate>
                    <Calendar size={16} />{sessionDate.format("ddd, MMM D, YYYY")}
                    {selectedSchedule.time && (<Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>at {dayjs(selectedSchedule.time, "HH:mm:ss").format("h:mm A")}</Text>)}
                  </SessionDate>
                  <SessionBadge $isPast={isPast} $isToday={isToday}>{isPast ? "Completed" : isToday ? "Today" : "Upcoming"}</SessionBadge>
                </SessionItem>
              );
            })}
          </div>
        </SessionsBreakdown>
        <ReviewSection>
          <Title level={5} style={{ marginBottom: 16 }}>Course Details</Title>
          <InfoRow><InfoLabel>Price per Participant</InfoLabel><InfoValue><DollarSign size={16} />${parseFloat(selectedSchedule.price || 0).toFixed(2)}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>Duration per Session</InfoLabel><InfoValue><Clock size={16} />{formatDuration(selectedSchedule.duration || 60)}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>Recurring Days</InfoLabel><InfoValue><Repeat size={16} />{selectedSchedule.day}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>Capacity</InfoLabel><InfoValue><Users size={16} />{selectedSchedule.booked_participants || 0} / {selectedSchedule.maxParticipants}</InfoValue></InfoRow>
        </ReviewSection>
      </DetailedViewContainer>
    );
  };

  if (isMobile) {
    const mainTitle = (
      <Space>
        <BookOpen size={20} />
        <span>Course Schedules - {classData?.title}</span>
      </Space>
    );

    const createEditTitle = editingSchedule ? (
      <Space><Edit3 size={20} /><span>Edit Course Schedule</span></Space>
    ) : (
      <Space><Plus size={20} /><span>New Course Schedule</span></Space>
    );

    const detailTitle = <Space><CalendarDays size={20} /><span>Schedule Details</span></Space>;

    return (
        <ConfigProvider theme={appTheme}>
          <VaulDrawer.Root open={open} onOpenChange={(o) => !o && onClose()} dismissible={!loading && !submitting}>
            <VaulDrawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle level={4}>{mainTitle}</DrawerTitle>
                  <CloseButton icon={<X size={20} />} onClick={onClose} disabled={submitting} />
                </DrawerHeader>
                <DrawerBody>{renderList()}</DrawerBody>
                <DrawerFooter>
                  <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingSchedule(null); form.resetFields(); setCreateOpen(true); }} style={{ width: "100%" }}>New Course Schedule</Button>
                </DrawerFooter>
              </StyledDrawerContent>
            </VaulDrawer.Portal>
        </VaulDrawer.Root>

        {/* Nested Drawer for Creating/Editing */}
        <VaulDrawer.NestedRoot open={createOpen} onOpenChange={setCreateOpen}>
          <VaulDrawer.Portal>
            <StyledDrawerOverlay />
            <StyledNestedDrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle level={4}>{createEditTitle}</DrawerTitle>
                <CloseButton icon={<X size={20} />} onClick={() => setCreateOpen(false)} />
              </DrawerHeader>
              <DrawerBody>
                <ContentWrapper>
                  <StepContent>
                    <StyledForm form={form} layout="vertical" onValuesChange={(c, v) => setFormData({ ...formData, ...v })}>
                      <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
                    </StyledForm>
                  </StepContent>
                </ContentWrapper>
              </DrawerBody>
              <DrawerFooter>
                <div>
                  {currentStep === 0 && (<Button key="list" onClick={() => setCreateOpen(false)}>Back to List</Button>)}
                  {currentStep > 0 && (<Button key="back" icon={<ChevronLeft size={16} />} onClick={handleBack} disabled={submitting}>Back</Button>)}
                </div>
                {currentStep < 2 ? (<Button key="next" type="primary" icon={<ChevronRight size={16} />} iconPosition="end" onClick={handleNext}>Next</Button>) : (<Button key="create" type="primary" icon={<CheckCircle size={16} />} onClick={handleSubmit} loading={submitting}>{editingSchedule ? "Update Course" : "Create Course"}</Button>)}
              </DrawerFooter>
            </StyledNestedDrawerContent>
          </VaulDrawer.Portal>
        </VaulDrawer.NestedRoot>

        {/* Nested Drawer for Details */}
        <VaulDrawer.NestedRoot open={detailOpen} onOpenChange={setDetailOpen}>
          <VaulDrawer.Portal>
            <StyledDrawerOverlay />
            <StyledNestedDrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle level={4}>{detailTitle}</DrawerTitle>
                <CloseButton icon={<X size={20} />} onClick={() => setDetailOpen(false)} />
              </DrawerHeader>
              <DrawerBody>{renderDetailedView()}</DrawerBody>
            </StyledNestedDrawerContent>
          </VaulDrawer.Portal>
        </VaulDrawer.NestedRoot>
      </ConfigProvider>
    );
  }

  const desktopTitle = view === 'list'
    ? <Space><BookOpen size={20} /><span>Course Schedules - {classData?.title}</span></Space>
    : view === 'create'
      ? <Space><Edit3 size={20} /><span>{editingSchedule ? 'Edit' : 'Create'} Course Schedule - {classData?.title}</span></Space>
      : <Space><CalendarDays size={20} /><span>Schedule Details</span></Space>;

  const desktopFooter = () => {
    if (view === 'list') return [<Button key="new" type="primary" icon={<Plus size={16} />} onClick={() => { setEditingSchedule(null); form.resetFields(); setView("create"); }}>New Course Schedule</Button>];
    if (view === 'detail') return [<Button key="close" onClick={() => { setView("list"); setSelectedSchedule(null); }}>Close</Button>];
    if (view === 'create') {
      const backToListButton = (<Button key="list" onClick={() => setView('list')}>Back to List</Button>);
      const backButton = (<Button key="back" icon={<ChevronLeft size={16} />} onClick={handleBack} disabled={submitting}>Back</Button>);
      const nextButton = (<Button key="next" type="primary" icon={<ChevronRight size={16} />} iconPosition="end" onClick={handleNext}>Next</Button>);
      const submitButtonText = editingSchedule ? "Update Course" : "Create Course";
      const createButton = (<Button key="create" type="primary" icon={<CheckCircle size={16} />} onClick={handleSubmit} loading={submitting}>{submitButtonText}</Button>);

      return (
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
          <div>
            {currentStep === 0 && backToListButton}
            {currentStep > 0 && backButton}
          </div>
          <div>{currentStep < 2 ? nextButton : createButton}</div>
        </div>
      );
    }
    return null;
  };

  return (
      <ConfigProvider theme={appTheme}>
        <StyledModal open={open} onCancel={onClose} closable={!submitting} width="80%" centered style={{ maxWidth: 800 }} title={desktopTitle} footer={desktopFooter()}>
          <AnimatedModalContent>
            {view === 'list' && renderList()}
            {view === 'detail' && renderDetailedView()}
            {view === 'create' && (
              <>
                <StepsWrapper><Steps size="small" current={currentStep} items={[{ title: "Schedule", icon: <Calendar size={16} /> }, { title: "Pricing", icon: <DollarSign size={16} /> }, { title: "Review", icon: <CheckCircle size={16} /> }]} /></StepsWrapper>
                <ContentWrapper>
                  <StepContent>
                    <StyledForm form={form} layout="vertical" onValuesChange={(c, v) => setFormData({ ...formData, ...v })}>
                      <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
                    </StyledForm>
                  </StepContent>
                </ContentWrapper>
              </>
            )}
          </AnimatedModalContent>
        </StyledModal>
      </ConfigProvider>
  );
};

export default CourseScheduleDrawer;