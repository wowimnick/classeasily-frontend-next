"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  DatePicker,
  Button,
  InputNumber,
  Typography,
  Tooltip,
  Steps,
  Space,
  Popconfirm,
  Tag,
  Empty,
} from "antd";
import message from "@/lib/message";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Edit3,
  Plus,
  X,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Trash2,
  List,
  CalendarDays,
  Repeat,
  BookOpen,
  HelpCircle,
  Check,
  TrendingUp,
  PlayCircle,
  ArrowRight,
} from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import styled, { css, keyframes } from "styled-components";
import { motion } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { LordIcon } from "@/services/ReactUtils";

import {
  MobileTimePicker,
  MobileDateRangePicker,
} from "@/components/common/mobile/MobilePickers";

dayjs.extend(isBetween);

const { Option } = Select;
const { Title, Text } = Typography;

// --- HOOK AND COMPONENT FOR MODAL ANIMATION ---
const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
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
      style={{ overflow: "hidden", width: "100%" }} // Ensure full width
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        {/* Removed the 1px margin/border div that causes gaps */}
        {children}
      </div>
    </motion.div>
  );
};

// --- Helper Functions ---
const formatDuration = (minutes) => {
  if (!minutes) return "Not set";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
};

function flattenErrorValue(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const list = Object.values(value).flat();
    return list.map((v) => (Array.isArray(v) ? v.join(", ") : String(v))).filter(Boolean).join("; ");
  }
  return String(value ?? "");
}

const getErrorMessage = (error) => {
  if (error?.errorFields?.length) return error.errorFields[0]?.errors?.[0] || "Validation error";
  const data = error?.response?.data ?? (typeof error === "object" && error !== null ? error : null);
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    const parts = Object.entries(data).map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const text = flattenErrorValue(value);
      return label && text ? `${label}: ${text}` : text;
    });
    if (parts.filter(Boolean).length) return parts.filter(Boolean).join("; ");
  }
  if (typeof error?.message === "string") return error.message;
  return "An unexpected error occurred.";
};

// --- STYLES ---

// Mobile Drawer Styles
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1010;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  ${(props) =>
    props.$fixedHeight
      ? css`
          height: ${props.$fixedHeight};
        `
      : css`
          max-height: 96%;
        `}
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1011;
  outline: none;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 32px;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 8px auto;
  cursor: grab;
  flex-shrink: 0;
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
`;

const CloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
  color: #6b7280;
  border-radius: 12px;
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
  padding-bottom: max(16px, env(safe-area-inset-bottom));
`;

// Input Styles
const commonInputStyles = css`
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  @media (max-width: 768px) {
    font-size: 16px;
  }
  &:hover {
    border-color: #cbd5e1;
  }
  &:focus,
  &:focus-within {
    border-color: ${(props) => props.theme.token.colorPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}15;
  }
`;

const StyledInput = styled(Input)`
  ${commonInputStyles}
`;
const StyledTimePicker = styled(TimePicker)`
  width: 100%;
  ${commonInputStyles}
`;
const StyledRangePicker = styled(DatePicker.RangePicker)`
  width: 100%;
  ${commonInputStyles}
`;
const StyledInputNumber = styled(InputNumber)`
  width: 100%;
  ${commonInputStyles}
  .ant-input-number-input-wrap, .ant-input-number-input {
    height: 100%;
    display: flex;
    align-items: center;
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
`;

// Form Layout
const CompactFormItem = styled(Form.Item)`
  margin-bottom: 0;
  .ant-form-item-explain {
    font-size: 11px;
    color: ${(props) => props.theme.token.colorError};
    margin-top: 4px;
  }
`;

const ModernFormLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 8px 0;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionHeader = styled.div`
  margin-bottom: 4px;
  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #64748b;
  }
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  svg {
    color: #94a3b8;
    width: 14px;
    height: 14px;
  }
`;

// Duration Picker
const DurationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const DurationPresets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
const PresetChip = styled.button`
  border: 1px solid
    ${(props) => (props.$active ? props.theme.token.colorPrimary : "#e2e8f0")};
  background: ${(props) =>
    props.$active ? `${props.theme.token.colorPrimary}10` : "white"};
  color: ${(props) =>
    props.$active ? props.theme.token.colorPrimary : "#64748b"};
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
    color: ${(props) => props.theme.token.colorPrimary};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const CustomDurationInput = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  .unit {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
`;

const DurationPicker = ({ value, onChange, disabled }) => {
  const safeValue = value || 0;
  const presets = [60, 90, 120, 180];
  return (
    <DurationWrapper>
      <DurationPresets>
        {presets.map((min) => (
          <PresetChip
            key={min}
            type="button"
            $active={safeValue === min}
            onClick={() => !disabled && onChange(min)}
            disabled={disabled}
          >
            {formatDuration(min)}
          </PresetChip>
        ))}
        <PresetChip
          type="button"
          $active={!presets.includes(safeValue) && safeValue > 0}
          style={{ cursor: "default", borderStyle: "dashed" }}
        >
          Custom
        </PresetChip>
      </DurationPresets>
      <CustomDurationInput>
        <div style={{ flex: 1 }}>
          <StyledInputNumber
            min={0}
            value={safeValue}
            onChange={onChange}
            disabled={disabled}
            style={{ height: 40 }}
          />
        </div>
        <span className="unit">Total Minutes</span>
      </CustomDurationInput>
    </DurationWrapper>
  );
};

// Days Selector
const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
`;
const DayChip = styled.button`
  height: 44px;
  border-radius: 12px;
  background: ${(props) =>
    props.$selected ? props.theme.token.colorPrimary : "white"};
  color: ${(props) => (props.$selected ? "white" : "#64748b")};
  border: 1px solid
    ${(props) => (props.$selected ? props.theme.token.colorPrimary : "#e2e8f0")};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
    color: ${(props) =>
      props.$selected ? "white" : props.theme.token.colorPrimary};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Desktop Modal
const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    padding: 0 !important; /* Ensure no internal padding */
    overflow: hidden; /* This clips the footer and header to the border-radius */
  }

  .ant-modal-container {
    padding: 0 !important;
  }

  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 20px 24px;
    margin: 0;
  }

  .ant-modal-body {
    padding: 0;
    max-height: 75vh;
    overflow-y: auto;
  }

  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
    padding: 16px 24px;
    margin: 0;
    background: #ffffff;
    /* Ensure footer doesn't have its own independent radius issues */
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
`;

// Steps
const ModernSteps = styled(Steps)`
  padding: 24px 32px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  .ant-steps-item-process .ant-steps-item-icon {
    border-color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const ContentPadding = styled.div`
  padding: 32px;
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

// Review Card
const ReviewCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 8px;
`;
const ReviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  &:last-child {
    border-bottom: none;
  }
  span.label {
    color: #64748b;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  span.value {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: right;
  }
`;

// List View Styles
const ScheduleListArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px; /* Internal padding for cards is fine */
  background: #f8fafc; /* This will now touch the modal edges */
  width: 100%;

  columns: 300px;
  column-gap: 16px;
  align-content: start;
`;

const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%; /* Ensure it fills the modal width */
`;
const CourseCard = styled(motion.div)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;

  break-inside: avoid;
  margin-bottom: 16px;

  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;
const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;
const CardStats = styled.div`
  display: flex;
  background: #f8fafc;
`;
const StatBox = styled.div`
  flex: 1;
  padding: 12px;
  text-align: center;
  border-right: 1px solid #e2e8f0;
  &:last-child {
    border-right: none;
  }
  .val {
    font-weight: 600;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lbl {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
    margin-top: 2px;
  }

  &.primary {
    background: ${(props) => props.theme.token.colorPrimary}08;
    .val {
      color: ${(props) => props.theme.token.colorPrimary};
    }
  }
`;
const PreviewSection = styled.div`
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;
const PreviewDateTag = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
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

// --- Skeleton ---
const shimmer = keyframes`0% { background-position: -200% 0; } 100% { background-position: 200% 0; }`;
const SkeletonBase = styled.div`
  background: #f1f5f9;
  background-image: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e2e8f0 50%,
    #f1f5f9 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 6px;
`;
const SkeletonCardWrapper = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  break-inside: avoid;
`;
const SkeletonHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
`;
const SkeletonPreview = styled.div`
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
`;
const SkeletonStats = styled.div`
  display: flex;
`;
const SkeletonStatBox = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border-right: 1px solid #f0f0f0;
  &:last-child {
    border-right: none;
  }
`;

const CourseCardSkeleton = () => (
  <SkeletonCardWrapper>
    <SkeletonHeader>
      <div style={{ flex: 1 }}>
        <SkeletonBase style={{ width: "60%", height: 20, marginBottom: 8 }} />
        <SkeletonBase style={{ width: "40%", height: 14, marginBottom: 4 }} />
        <SkeletonBase style={{ width: "30%", height: 14 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <SkeletonBase style={{ width: 28, height: 28, borderRadius: 6 }} />
        <SkeletonBase style={{ width: 28, height: 28, borderRadius: 6 }} />
      </div>
    </SkeletonHeader>
    {/* Preview Skeleton */}
    <SkeletonPreview>
      <SkeletonBase style={{ width: 70, height: 24 }} />
      <SkeletonBase style={{ width: 70, height: 24 }} />
      <SkeletonBase style={{ width: 70, height: 24 }} />
    </SkeletonPreview>
    <SkeletonStats>
      <SkeletonStatBox>
        <SkeletonBase style={{ width: "60%", height: 14 }} />
        <SkeletonBase style={{ width: "40%", height: 10 }} />
      </SkeletonStatBox>
      <SkeletonStatBox>
        <SkeletonBase style={{ width: "60%", height: 14 }} />
        <SkeletonBase style={{ width: "40%", height: 10 }} />
      </SkeletonStatBox>
      <SkeletonStatBox>
        <SkeletonBase style={{ width: "60%", height: 14 }} />
        <SkeletonBase style={{ width: "40%", height: 10 }} />
      </SkeletonStatBox>
    </SkeletonStats>
  </SkeletonCardWrapper>
);

// --- MAIN COMPONENT ---

const dayMap = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const dayMapVals = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const CourseScheduleDrawer = ({ open, onClose, classData }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // State for Management View
  const [schedules, setSchedules] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // State for Form View
  const [activeView, setActiveView] = useState("manage"); // 'manage' | 'form'
  const [currentStep, setCurrentStep] = useState(0);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Computed form data for review step
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchSchedules = useCallback(async () => {
    if (!classData?.options) return;
    const courseOption = classData.options.find(
      (o) => o.booking_type === "Full Course"
    );
    if (!courseOption) return;

    setLoadingList(true);
    try {
      const result = await scheduleService.fetchSchedules({
        option_id: courseOption.optionId,
      });
      if (result.success) {
        // Group raw schedules into "Course" objects
        const grouped = result.data.reduce((acc, s) => {
          const key = `${s.name}-${s.start_date}-${s.end_date}-${s.time}-${s.price}`;
          if (!acc[key]) {
            acc[key] = {
              ...s,
              schedulePairs: [{ id: s.id, day: s.day }],
              revenue: parseFloat(s.total_revenue || 0),
              booked: s.booked_participants || 0,
            };
          } else {
            acc[key].schedulePairs.push({ id: s.id, day: s.day });
            acc[key].booked = Math.max(acc[key].booked, s.booked_participants);
          }
          return acc;
        }, {});

        // Sort pairs for display (Mon, Wed, Fri)
        const dayOrder = {
          Mon: 1,
          Tue: 2,
          Wed: 3,
          Thu: 4,
          Fri: 5,
          Sat: 6,
          Sun: 7,
        };
        const list = Object.values(grouped).map((g) => {
          g.schedulePairs.sort((a, b) => dayOrder[a.day] - dayOrder[b.day]);
          g.daysLabel = g.schedulePairs.map((p) => p.day).join(", ");
          g.ids = g.schedulePairs.map((p) => p.id);
          return g;
        });
        setSchedules(list);
      }
    } catch (e) {
      message.error("Failed to load schedules");
    } finally {
      setLoadingList(false);
    }
  }, [classData]);

  useEffect(() => {
    if (open) {
      setActiveView("manage");
      fetchSchedules();
    } else {
      // Reset everything on close
      setEditingSchedule(null);
      setFormData({});
      setCurrentStep(0);
      form.resetFields();
    }
  }, [open, fetchSchedules, form]);

  // --- Logic for Form ---

  const calculateSessionCount = (start, end, selectedDays) => {
    if (!start || !end || !selectedDays || selectedDays.length === 0) return 0;
    let count = 0;
    let curr = dayjs(start);
    const endDay = dayjs(end);

    // selectedDays are ["Mon", "Wed"]
    while (curr.isBefore(endDay) || curr.isSame(endDay, "day")) {
      if (selectedDays.includes(curr.format("ddd"))) count++;
      curr = curr.add(1, "day");
    }
    return count;
  };

  const handleAddNew = () => {
    setEditingSchedule(null);
    form.resetFields();
    setFormData({
      duration: 60,
      maxParticipants: 10,
      price: 0,
      selectedDays: [],
    });
    form.setFieldsValue({
      duration: 60,
      maxParticipants: 10,
      price: 0,
      time: dayjs("09:00", "HH:mm"),
    });
    setCurrentStep(0);
    setActiveView("form");
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    const selectedDays = schedule.schedulePairs.map((p) => p.day);
    const start = dayjs(schedule.start_date);
    const end = dayjs(schedule.end_date);

    const values = {
      name: schedule.name,
      dateRange: [start, end],
      time: dayjs(schedule.time, "HH:mm:ss"),
      duration: schedule.duration,
      price: schedule.price,
      maxParticipants: schedule.maxParticipants,
      selectedDays: selectedDays,
    };

    form.setFieldsValue(values);
    setFormData({
      ...values,
      totalSessions: calculateSessionCount(start, end, selectedDays),
    });
    setCurrentStep(0);
    setActiveView("form");
  };

  const handleDelete = async (schedule) => {
    try {
      await Promise.all(
        schedule.ids.map((id) => scheduleService.deleteSchedule(id))
      );
      message.success("Series deleted");
      fetchSchedules();
    } catch (e) {
      message.error("Failed to delete");
    }
  };

  const handleValuesChange = (_, allValues) => {
    const { dateRange, selectedDays } = allValues;
    const updates = { ...allValues };

    if (dateRange && dateRange[0] && dateRange[1] && selectedDays) {
      updates.totalSessions = calculateSessionCount(
        dateRange[0],
        dateRange[1],
        selectedDays
      );
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields([
          "name",
          "dateRange",
          "selectedDays",
          "time",
          "duration",
        ]);
      } else if (currentStep === 1) {
        await form.validateFields(["price", "maxParticipants"]);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    if (await validateStep()) setCurrentStep((c) => c + 1);
  };

  const handleBack = () => {
    setCurrentStep((c) => c - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const values = form.getFieldsValue(true);
      const courseOption = classData.options.find(
        (o) => o.booking_type === "Full Course"
      );

      const commonPayload = {
        name: values.name,
        start_date: values.dateRange[0].format("YYYY-MM-DD"),
        end_date: values.dateRange[1].format("YYYY-MM-DD"),
        time: values.time.format("HH:mm:ss"),
        duration: values.duration,
        maxParticipants: values.maxParticipants,
        price: parseFloat(values.price),
      };

      if (editingSchedule) {
        // Complex Edit Logic (Delta)
        const oldPairs = editingSchedule.schedulePairs; // [{id: 1, day: 'Mon'}]
        const newDays = values.selectedDays; // ['Mon', 'Wed']

        const toUpdate = [];
        const toCreate = [];
        const toDelete = [];

        // Find updates and creations
        newDays.forEach((day) => {
          const existing = oldPairs.find((p) => p.day === day);
          if (existing) toUpdate.push(existing.id);
          else toCreate.push(day);
        });

        // Find deletions
        oldPairs.forEach((p) => {
          if (!newDays.includes(p.day)) toDelete.push(p.id);
        });

        const updateResults = await Promise.all([
          ...toUpdate.map((id) =>
            scheduleService.updateSchedule(id, commonPayload)
          ),
          ...toCreate.map((day) =>
            scheduleService.createSchedule({
              ...commonPayload,
              option: courseOption.optionId,
              day,
            })
          ),
          ...toDelete.map((id) => scheduleService.deleteSchedule(id)),
        ]);
        const failed = updateResults.find((r) => r && r.success === false);
        if (failed) {
          message.error(getErrorMessage(failed.error), 5);
          return;
        }
        message.success("Series updated");
      } else {
        // Create Logic
        const createResults = await Promise.all(
          values.selectedDays.map((day) =>
            scheduleService.createSchedule({
              ...commonPayload,
              option: courseOption.optionId,
              day,
            })
          )
        );
        const failed = createResults.find((r) => r && r.success === false);
        if (failed) {
          message.error(getErrorMessage(failed.error), 5);
          return;
        }
        message.success("Series created");
      }

      setActiveView("manage");
      fetchSchedules();
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renderers ---

  const getDisplayDateForCourse = (course) => {
    const now = dayjs();
    const start = dayjs(course.start_date);
    const end = dayjs(course.end_date);

    if (now.isBefore(start, "day")) {
      return { label: "Starts", value: start.format("MMM D") };
    }

    if (now.isAfter(end, "day")) {
      return { label: "Ended", value: end.format("MMM D") };
    }

    // Ongoing: find next day
    const targetDays = course.schedulePairs.map((p) => dayMapVals[p.day]);
    for (let i = 0; i <= 7; i++) {
      const candidate = now.add(i, "day");
      if (candidate.isAfter(end, "day")) break;
      if (targetDays.includes(candidate.day())) {
        return {
          label: i === 0 ? "Today" : "Next Session",
          value: i === 0 ? "Today" : candidate.format("ddd, MMM D"),
        };
      }
    }
    return { label: "Status", value: "Ongoing" };
  };

  const getPreviewDates = (course) => {
    const start = dayjs(course.start_date);
    const end = dayjs(course.end_date);
    const now = dayjs();
    const targetDays = course.schedulePairs.map((p) => dayMapVals[p.day]);

    // Determine start point: max(now, start)
    // If course is over, return empty (or handle if you want to show past dates, but request was 'preview')
    if (now.isAfter(end, "day")) return [];

    let current = now.isBefore(start, "day") ? start : now;
    const dates = [];
    let safety = 0;

    while (
      dates.length < 3 &&
      current.isBefore(end.add(1, "day")) &&
      safety < 100
    ) {
      if (targetDays.includes(current.day())) {
        // Ensure we don't show "past" dates if we started mid-course, unless it is literally today
        if (current.isSame(now, "day") || current.isAfter(now, "day")) {
          dates.push(current);
        }
      }
      current = current.add(1, "day");
      safety++;
    }
    return dates;
  };

  const renderStepContent = () => {
    const isLocked = editingSchedule?.has_confirmed_bookings;

    switch (currentStep) {
      case 0:
        return (
          <ModernFormLayout>
            <FormSection>
              <SectionHeader>
                <h4>
                  <Calendar size={18} /> Series Basics
                </h4>
                <p>Define the schedule pattern for this series.</p>
              </SectionHeader>

              {isLocked && (
                <div
                  style={{
                    padding: 12,
                    background: "#fff1f0",
                    border: "1px solid #ffa39e",
                    borderRadius: 8,
                    color: "#cf1322",
                    fontSize: 13,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <HelpCircle size={16} />
                  <span>
                    Dates and times are locked because this series has active
                    bookings.
                  </span>
                </div>
              )}

              <FieldContainer>
                <Label>Series Name</Label>
                <CompactFormItem name="name" rules={[{ required: true }]}>
                  <StyledInput placeholder="e.g. Summer Pottery Series" />
                </CompactFormItem>
              </FieldContainer>

              <FieldContainer>
                <Label>Date Range</Label>
                <CompactFormItem name="dateRange" rules={[{ required: true }]}>
                  {isMobile ? (
                    <MobileDateRangePicker
                      disabled={isLocked}
                      error={false}
                      format="MMM D, YYYY"
                    />
                  ) : (
                    <StyledRangePicker disabled={isLocked} />
                  )}
                </CompactFormItem>
              </FieldContainer>

              <FieldContainer>
                <Label>Days of Week</Label>
                <CompactFormItem
                  name="selectedDays"
                  rules={[{ required: true }]}
                >
                  <DaysGrid>
                    {Object.keys(dayMap).map((key) => (
                      <DayChip
                        key={key}
                        type="button"
                        disabled={isLocked}
                        $selected={formData.selectedDays?.includes(key)}
                        onClick={() => {
                          const current = formData.selectedDays || [];
                          const next = current.includes(key)
                            ? current.filter((d) => d !== key)
                            : [...current, key];
                          form.setFieldValue("selectedDays", next);
                          handleValuesChange(null, {
                            ...form.getFieldsValue(),
                            selectedDays: next,
                          });
                        }}
                      >
                        {key}
                      </DayChip>
                    ))}
                  </DaysGrid>
                </CompactFormItem>
              </FieldContainer>

              <TwoColGrid>
                <FieldContainer>
                  <Label>Start Time</Label>
                  <CompactFormItem name="time" rules={[{ required: true }]}>
                    {isMobile ? (
                      <MobileTimePicker />
                    ) : (
                      <StyledTimePicker
                        use12Hours
                        format="h:mm A"
                        minuteStep={15}
                        disabled={isLocked}
                      />
                    )}
                  </CompactFormItem>
                </FieldContainer>
                <FieldContainer>
                  <Label>Duration</Label>
                  <CompactFormItem name="duration" rules={[{ required: true }]}>
                    <DurationPicker disabled={isLocked} />
                  </CompactFormItem>
                </FieldContainer>
              </TwoColGrid>
            </FormSection>
          </ModernFormLayout>
        );
      case 1:
        return (
          <ModernFormLayout>
            <FormSection>
              <SectionHeader>
                <h4>
                  <DollarSign size={18} /> Pricing & Size
                </h4>
                <p>Set the cost for the entire series and experience limits.</p>
              </SectionHeader>
              <TwoColGrid>
                <FieldContainer>
                  <Label>Total Price (CAD)</Label>
                  <CompactFormItem name="price" rules={[{ required: true }]}>
                    <StyledInput prefix="$" type="number" step="0.01" />
                  </CompactFormItem>
                </FieldContainer>
                <FieldContainer>
                  <Label>Max Guests</Label>
                  <CompactFormItem
                    name="maxParticipants"
                    rules={[{ required: true }]}
                  >
                    <StyledInputNumber min={1} />
                  </CompactFormItem>
                </FieldContainer>
              </TwoColGrid>
            </FormSection>
          </ModernFormLayout>
        );
      case 2:
        return (
          <ModernFormLayout>
            <FormSection>
              <SectionHeader>
                <h4>
                  <CheckCircle size={18} /> Review Series
                </h4>
              </SectionHeader>
              <ReviewCard>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Name
                  </span>
                  <span className="value">{formData.name}</span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Schedule
                  </span>
                  <span className="value">
                    <CalendarDays size={14} />
                    {formData.dateRange?.[0]?.format("MMM D")} -{" "}
                    {formData.dateRange?.[1]?.format("MMM D")}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Pattern
                  </span>
                  <span className="value">
                    <Repeat size={14} /> {formData.selectedDays?.join(", ")}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Time
                  </span>
                  <span className="value">
                    <Clock size={14} /> {formData.time?.format("h:mm A")} (
                    {formatDuration(formData.duration)})
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Est. Sessions
                  </span>
                  <span className="value">
                    <BookOpen size={14} /> {formData.totalSessions} sessions
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Price
                  </span>
                  <span className="value">
                    <DollarSign size={14} /> {formData.price}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">
                    <Check size={14} color="#22c55e" /> Capacity
                  </span>
                  <span className="value">
                    <Users size={14} /> {formData.maxParticipants} guests
                  </span>
                </ReviewRow>
              </ReviewCard>
            </FormSection>
          </ModernFormLayout>
        );
      default:
        return null;
    }
  };

  const renderManagementList = () => {
    return (
      <ManagementContainer>
        <ScheduleListArea>
          {loadingList ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          ) : schedules.length > 0 ? (
            schedules.map((item) => {
              const statusObj = getDisplayDateForCourse(item);
              const previewDates = getPreviewDates(item);
              return (
                <CourseCard key={item.ids[0]} layout>
                  <CardHeader>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#1e293b",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: 13,
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Calendar size={13} />
                        {dayjs(item.start_date).format("MMM D")} -{" "}
                        {dayjs(item.end_date).format("MMM D")}
                      </div>
                      <div
                        style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}
                      >
                        <Repeat size={13} style={{ marginRight: 6 }} />
                        {item.daysLabel}
                      </div>
                    </div>
                    <Space>
                      <Button
                        size="small"
                        icon={<Edit3 size={14} />}
                        onClick={() => handleEdit(item)}
                      />
                      <Popconfirm
                        title="Delete Series?"
                        description="This deletes all sessions."
                        onConfirm={() => handleDelete(item)}
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<Trash2 size={14} />}
                          disabled={item.has_confirmed_bookings}
                        />
                      </Popconfirm>
                    </Space>
                  </CardHeader>

                  {previewDates.length > 0 && (
                    <PreviewSection>
                      <ArrowRight size={14} color="#94a3b8" />
                      {previewDates.map((d) => (
                        <PreviewDateTag key={d.toString()}>
                          {d.format("ddd, MMM D")}
                        </PreviewDateTag>
                      ))}
                    </PreviewSection>
                  )}

                  <CardStats>
                    <StatBox className="primary">
                      <div className="val">{statusObj.value}</div>
                      <div className="lbl">{statusObj.label}</div>
                    </StatBox>
                    <StatBox>
                      <div className="val">
                        ${parseFloat(item.price).toFixed(0)}
                      </div>
                      <div className="lbl">Price</div>
                    </StatBox>
                    <StatBox>
                      <div className="val">
                        {item.booked}/{item.maxParticipants}
                      </div>
                      <div className="lbl">Enrolled</div>
                    </StatBox>
                  </CardStats>
                </CourseCard>
              );
            })
          ) : (
            <EmptyStateContainer>
              <LordIcon
                src="https://cdn.lordicon.com/uoljexdg.json"
                trigger="in"
                colors="primary:#94a3b8"
                style={{ width: 64, height: 64 }}
              />
              <Text type="secondary">No series found.</Text>
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleAddNew}
                style={{ marginTop: 16 }}
              >
                Create Series
              </Button>
            </EmptyStateContainer>
          )}
        </ScheduleListArea>
      </ManagementContainer>
    );
  };

  const renderFooterButtons = (isMobileLayout) => {
    const btnStyle = isMobileLayout ? { height: 44 } : { height: 40 };

    if (activeView === "manage") {
      return (
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleAddNew}
          block={isMobileLayout}
          style={btnStyle}
        >
          Create Series
        </Button>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          gap: 12,
        }}
      >
        {currentStep === 0 ? (
          <Button
            onClick={() => setActiveView("manage")}
            style={btnStyle}
            icon={<List size={16} />}
          >
            {isMobileLayout ? "List" : "Back to List"}
          </Button>
        ) : (
          <Button onClick={handleBack} disabled={isLoading} style={btnStyle}>
            Back
          </Button>
        )}
        {currentStep < 2 ? (
          <Button
            type="primary"
            onClick={handleNext}
            style={btnStyle}
            icon={<ChevronRight size={16} />}
            iconPosition="end"
          >
            Next
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            style={btnStyle}
            key={`btn-${isLoading}`}
          >
            {editingSchedule ? "Update Series" : "Create Series"}
          </Button>
        )}
      </div>
    );
  };

  const getTitle = () => {
    if (activeView === "form")
      return editingSchedule ? "Edit Series" : "New Series";
    return `Series Schedules`;
  };

  return (
    <>
      {!isMobile && (
        <DesktopModal
          centered
          title={getTitle()}
          open={open}
          onCancel={onClose}
          width={activeView === "manage" ? "800px" : "720px"}
          destroyOnClose
          maskClosable={!isLoading}
          closable={!isLoading}
          footer={renderFooterButtons(false)}
        >
          <AnimatedModalContent>
            {activeView === "form" && (
              <ModernSteps
                size="small"
                current={currentStep}
                items={[
                  { title: "Basics", icon: <Calendar size={16} /> },
                  { title: "Details", icon: <DollarSign size={16} /> },
                  { title: "Review", icon: <CheckCircle size={16} /> },
                ]}
              />
            )}
            {activeView === "manage" ? (
              renderManagementList()
            ) : (
              <ContentPadding>
                <Form
                  form={form}
                  layout="vertical"
                  onValuesChange={handleValuesChange}
                >
                  {renderStepContent()}
                </Form>
              </ContentPadding>
            )}
          </AnimatedModalContent>
        </DesktopModal>
      )}

      {isMobile && (
        <Drawer.Root
          open={open}
          onOpenChange={(o) => !o && onClose()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent $fixedHeight="85vh">
              <DrawerHandle />
              <MobileHeader>
                <MobileTitle>{`Series Schedules`}</MobileTitle>
                <CloseButton icon={<X size={20} />} onClick={onClose} />
              </MobileHeader>
              <MobileContent>{renderManagementList()}</MobileContent>
              <MobileFooter>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={handleAddNew}
                  block
                  style={{ height: 44 }}
                >
                  Create Series
                </Button>
              </MobileFooter>
            </StyledDrawerContent>
          </Drawer.Portal>

          {/* Nested Drawer for Form */}
          <Drawer.NestedRoot
            open={activeView === "form"}
            onOpenChange={(o) => !o && setActiveView("manage")}
            repositionInputs={false}
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent style={{ height: "96%" }}>
                <DrawerHandle />
                <MobileHeader>
                  <MobileTitle>{getTitle()}</MobileTitle>
                  <CloseButton
                    icon={<X size={20} />}
                    onClick={() => setActiveView("manage")}
                  />
                </MobileHeader>
                <MobileContent>
                  <ContentPadding>
                    <Form
                      form={form}
                      layout="vertical"
                      onValuesChange={handleValuesChange}
                    >
                      {renderStepContent()}
                    </Form>
                  </ContentPadding>
                </MobileContent>
                <MobileFooter>{renderFooterButtons(true)}</MobileFooter>
              </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.NestedRoot>
        </Drawer.Root>
      )}
    </>
  );
};

export default CourseScheduleDrawer;
