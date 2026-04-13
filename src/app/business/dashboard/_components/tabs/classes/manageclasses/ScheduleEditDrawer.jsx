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
  ConfigProvider,
  InputNumber,
  Tabs,
  Typography,
  Space,
  Popconfirm,
  Tag,
  Segmented,
  Empty,
  Divider,
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
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Hourglass,
  Layers,
  ArrowLeft,
  Undo2,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import {
  MobileDatePicker,
  MobileTimePicker,
  MobileDateRangePicker,
} from "@/components/common/mobile/MobilePickers";

dayjs.extend(isBetween);

const { Title } = Typography;

// --- UTILS ---

function flattenErrorValue(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const list = Object.values(value).flat();
    return list.map((v) => (Array.isArray(v) ? v.join(", ") : String(v))).filter(Boolean).join("; ");
  }
  return String(value ?? "");
}

const getErrorMessage = (error) => {
  // Ant Design validateFields rejection
  if (error?.errorFields?.length) {
    const first = error.errorFields[0];
    const msg = first?.errors?.[0];
    if (typeof msg === "string") return msg;
  }
  // API response (error.response.data) or scheduleService return shape { error: data }
  const data = error?.response?.data ?? (typeof error === "object" && error !== null ? error : null);
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    const messages = Object.entries(data).map(([key, value]) => {
      const formattedKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${formattedKey}: ${flattenErrorValue(value)}`;
    });
    if (messages.length > 0) return messages.join("; ");
  }
  if (typeof error?.message === "string") return error.message;
  return "An unexpected error occurred.";
};

const formatDuration = (minutes) => {
  if (!minutes) return "Not set";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
};

const getPeriod = (timeStr) => {
  const hour = parseInt(timeStr.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

// --- ANIMATION HOOKS (From BookingModal) ---
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

const AnimatedHeightWrapper = ({ children }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      initial={false}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        {/* The border/margin hack prevents margin collapse issues */}
        <div style={{ border: "1px solid transparent", margin: "-1px" }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// --- STYLED COMPONENTS (SKELETONS) ---

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const SkeletonBase = styled.div`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear forwards;
  border-radius: ${(props) => props.$radius || "8px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "20px"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

const SkeletonContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const GridSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
`;

const CellSkeleton = styled.div`
  background: white;
  height: 100%;
  min-height: 80px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

// --- STYLED COMPONENTS (LAYOUT & CALENDAR) ---

const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 20px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
    transition: width 0.3s ease-in-out;
  }
  .ant-modal-header {
    display: none;
  }
  .ant-modal-close {
    display: none;
  }
  .ant-modal-body {
    padding: 0;
    height: 700px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }
  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
    padding: 12px 24px;
    background: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const TopNav = styled.div`
  padding: 14px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  flex-shrink: 0;
  background: white;
  z-index: 10;
  gap: 16px;
  flex-wrap: wrap;
`;

const ZoomContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8fafc;
`;

const ViewWrapper = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
`;

// --- Calendar Month View (Airbnb-style: clean, even grid) ---
const CalendarGridContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  background: #fff;
  overflow: hidden;
  min-height: 0;
`;

const CalendarControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;

  .month-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #222;
    min-width: 180px;
    text-align: center;
  }

  .nav-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-group .ant-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    color: #222;
    background: #fff;
  }
  .nav-group .ant-btn:hover {
    border-color: #222;
    color: #222;
  }
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0;
  flex-shrink: 0;

  span {
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: #717171;
  }
`;

const MonthGrid = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, minmax(0, 1fr));
  gap: 0;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  overflow: hidden;
`;

const DateCell = styled.div`
  background: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  cursor: pointer;
  border-right: 1px solid #ebebeb;
  border-bottom: 1px solid #ebebeb;
  min-height: 0;

  &:nth-child(7n) {
    border-right: none;
  }
  &:nth-child(n+36) {
    border-bottom: none;
  }

  &:hover {
    background: #f7f7f7;
  }

  ${(props) =>
    props.$isOtherMonth &&
    `
    background: #fff;
    pointer-events: none;
  `}
  ${(props) =>
    props.$isToday &&
    `
    background: #fff;
  `}
`;

const DateNumber = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.$isOtherMonth ? "#b0b0b0" : "#222")};
  margin-bottom: 4px;
  flex-shrink: 0;
  line-height: 1.2;

  ${(props) =>
    props.$isToday &&
    `
    font-weight: 700;
    color: ${props.theme?.token?.colorPrimary || "#ff385c"};
  `}
`;

const DateCellDot = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(props) => props.theme?.token?.colorPrimary || "#ff385c"};
`;

const DotContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-height: 0;
  justify-content: flex-start;
`;

const EventPill = styled.div`
  font-size: 10px;
  background: #f7f7f7;
  color: #222;
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  line-height: 1.25;
  flex-shrink: 0;
`;

// --- DESKTOP DAY VIEW (Airbnb-style: minimal, clean) ---

const DayViewHeader = styled.div`
  padding: 14px 24px;
  background: #fff;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  gap: 16px;

  .back-wrap {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .date-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #222;
    flex-shrink: 0;
  }
  .header-spacer {
    flex: 1;
    min-width: 0;
  }
  .ant-btn-text {
    color: #222;
    font-weight: 500;
  }
  .ant-btn-text:hover {
    color: #222;
    background: #f7f7f7;
  }
`;

const DayViewFooter = styled.div`
  padding: 12px 24px;
  background: #fff;
  border-top: 1px solid #ebebeb;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const DayViewBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: #fff;
`;

const DayPeriodSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DayPeriodLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #717171;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 10px;

  lord-icon {
    width: 18px;
    height: 18px;
  }
`;

const DayCard = styled.div`
  background: #fff;
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #ebebeb;
  min-height: 48px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fafafa;
  }

  .time-col {
    min-width: 56px;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    color: #222;
  }

  .info-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;

    .name {
      font-size: 14px;
      font-weight: 600;
      color: #222;
      line-height: 1.3;
    }

    .meta {
      display: flex;
      gap: 12px;
      color: #717171;
      font-size: 12px;
      font-weight: 500;
      align-items: center;
      flex-wrap: wrap;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .action-col {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .action-col .ant-btn {
    color: #717171;
  }
  .action-col .ant-btn:hover {
    color: #222;
  }
`;

const DayEmptyState = styled.div`
  padding: 32px 24px;
  text-align: center;
  color: #717171;
  font-size: 13px;

  .ant-empty-description {
    font-size: 13px;
  }
`;

// --- MOBILE DRAWER STYLES (VAUL) ---

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
  border-radius: 20px 20px 0 0;
  max-height: 96%;
  height: fit-content;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1011;
  outline: none;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 40px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 10px;
  margin: 12px auto;
  flex-shrink: 0;
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  min-height: 60px;
`;

const MobileBody = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;
`;

const MobileCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 0 16px 16px;
  margin-top: 8px;

  .header {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  button {
    aspect-ratio: 1;
    border-radius: 50%;
    border: none;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    color: #334155;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s;

    &.today {
      color: ${(props) => props.theme.token.colorPrimary};
      font-weight: 700;
      background: ${(props) => props.theme.token.colorPrimary}10;
    }

    &.has-events .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: ${(props) => props.theme.token.colorPrimary};
      position: absolute;
      bottom: 6px;
    }

    &:active {
      background: #f1f5f9;
    }
  }
`;

const MobileScheduleCard = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  background: white;

  &:last-child {
    border-bottom: none;
  }

  .time-badge {
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    display: inline-block;
    margin-bottom: 8px;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .details {
    display: flex;
    gap: 12px;
    font-size: 13px;
    color: #64748b;
    align-items: center;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
`;

// --- FORM STYLES (width only; rest from theme) ---
const FullWidthInput = styled(Input)`width: 100%;`;
const FullWidthTimePicker = styled(TimePicker)`width: 100%;`;
const FullWidthDatePicker = styled(DatePicker)`width: 100%;`;
const FullWidthRangePicker = styled(DatePicker.RangePicker)`width: 100%;`;
const FullWidthInputNumber = styled(InputNumber)`width: 100%;`;

const CompactFormItem = styled(Form.Item)`
  margin-bottom: 0;
  .ant-form-item-explain {
    font-size: 11px;
    margin-top: 4px;
    margin-bottom: 0;
  }
  .ant-form-item-control-input {
    min-height: auto;
  }
  .ant-form-item-row {
    flex-direction: column;
    align-items: stretch;
  }
`;
const ModernFormLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
`;

/* Section block with border (ClassEditDrawer-style) */
const FormSectionBlock = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const SectionHeader = styled.div`
  margin-bottom: 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
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

const SectionDivider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 0;
  flex-shrink: 0;
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
`;
const HelpLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: auto;
`;

// Duration Picker Component
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
  const presets = [30, 45, 60, 90, 120];
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
            {min} min
          </PresetChip>
        ))}
        <PresetChip
          type="button"
          $active={!presets.includes(safeValue) && safeValue > 0}
          onClick={() => {}}
          style={{ cursor: "default", borderStyle: "dashed" }}
        >
          Custom
        </PresetChip>
      </DurationPresets>
      <CustomDurationInput>
        <div style={{ flex: 1 }}>
          <FullWidthInputNumber
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

// Bulk Days Grid
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
  }
`;

// Summary / Review (clean list, no heavy card)
const SummaryList = styled.dl`
  margin: 0;
  display: grid;
  gap: 0;
`;
const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
  &:last-child {
    border-bottom: none;
  }
  dt, .summary-label {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: #717171;
  }
  dd, .summary-value {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #222;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const ModernTabs = styled(Tabs)`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .ant-tabs-nav {
    padding: 0 32px;
    margin: 0 !important;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  .ant-tabs-tab {
    padding: 16px 0 !important;
    margin: 0 24px 0 0 !important;
    font-size: 14px;
    font-weight: 500;
  }

  .ant-tabs-content-holder {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ant-tabs-content {
    flex: 1;
    height: 100%;
  }

  /* FIXED: Apply flex layout only to the ACTIVE pane */
  .ant-tabs-tabpane {
    height: 100%;
  }

  /* This specific selector ensures we don't accidentally show hidden tabs */
  .ant-tabs-tabpane-active {
    display: flex;
    flex-direction: column;
  }
`;
const ContentPadding = styled.div`
  padding: 32px;
  overflow-y: auto;
  flex: 1;
  @media (max-width: 768px) {
    padding: 20px;
  }
`;
// Helper for Day Labels
const dayLabels = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

// --- Validation rules (aligned with backend) ---
const RULES = {
  date: [
    { required: true, message: "Please select a date." },
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        const today = dayjs().startOf("day");
        if (value.isBefore(today)) {
          return Promise.reject(new Error("Session date cannot be in the past."));
        }
        return Promise.resolve();
      },
    },
  ],
  time: [{ required: true, message: "Please select a start time." }],
  duration: [
    { required: true, message: "Please set a duration." },
    { type: "number", min: 15, message: "Duration must be at least 15 minutes." },
  ],
  price: [
    { required: true, message: "Please enter a price." },
    {
      validator: (_, value) => {
        const num = parseFloat(value);
        if (value === "" || value === null || value === undefined) {
          return Promise.reject(new Error("Please enter a price."));
        }
        if (Number.isNaN(num) || num < 0) {
          return Promise.reject(new Error("Price must be 0 or greater."));
        }
        return Promise.resolve();
      },
    },
  ],
  maxParticipants: [
    { required: true, message: "Please enter maximum capacity." },
    { type: "number", min: 1, message: "Maximum guests must be at least 1." },
  ],
  minParticipants: [
    { type: "number", min: 1, message: "Minimum guests must be at least 1." },
  ],
  name: [{ required: true, message: "Please enter a group name." }],
  date_range: [
    { required: true, message: "Please select a date range." },
    {
      validator: (_, value) => {
        if (!value || !value[0] || !value[1]) return Promise.resolve();
        if (value[0].isAfter(value[1])) {
          return Promise.reject(new Error("End date must be on or after start date."));
        }
        if (value[0].isBefore(dayjs().startOf("day"))) {
          return Promise.reject(new Error("Start date cannot be in the past."));
        }
        return Promise.resolve();
      },
    },
  ],
  days_of_week: [
    {
      required: true,
      type: "array",
      min: 1,
      message: "Select at least one day of the week.",
    },
  ],
  times: [
    {
      validator: (_, value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return Promise.reject(new Error("Add at least one time."));
        }
        return Promise.resolve();
      },
    },
  ],
};

// --- MAIN DRAWER COMPONENT ---

const ScheduleEditDrawer = ({
  open,
  onClose,
  form: externalForm,
  classData,
  onSchedulesUpdate,
  editingSchedule: directEditingSchedule,
  startInEditMode = false,
}) => {
  // Original Form State – use external form if provided, otherwise own internal instance
  const [internalForm] = Form.useForm();
  const form = externalForm ?? internalForm;
  const [bulkForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [bulkCurrentStep, setBulkCurrentStep] = useState(0);
  const [prefillDate, setPrefillDate] = useState(null);

  // Navigation / View State
  const [activeView, setActiveView] = useState("manage"); // 'manage' | 'form' | 'group-form'
  const [calendarViewMode, setCalendarViewMode] = useState("month"); // 'month' | 'day'
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Filtering
  const [selectedGroup, setSelectedGroup] = useState("all");

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Animation Direction
  const [zoomDirection, setZoomDirection] = useState("in"); // 'in' (Month->Day) or 'out' (Day->Month)

  // --- INIT & EFFECT ---
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
        setPrefillDate(null);
        setSelectedOptionId(directEditingSchedule.option);
      } else if (classData) {
        setActiveView("manage");
        setCalendarViewMode("month");
        setEditingSchedule(null);
        setPrefillDate(null);
        setSelectedGroup("all");
        const primary =
          classData.options?.find((o) => o.schedule_mode === "primary") ||
          classData.options?.[0];
        setSelectedOptionId(primary?.optionId || classData.option?.optionId);
      }
    } else {
      // Full Reset
      form.resetFields();
      bulkForm.resetFields();
      setCurrentStep(0);
      setBulkCurrentStep(0);
      setFormData({});
      setEditingSchedule(null);
      setEditingGroup(null);
      setPrefillDate(null);
      setActiveView("manage");
      setCalendarViewMode("month");
      setSelectedDate(null);
      setSelectedOptionId(null);
      setSelectedGroup("all");
    }
  }, [open, classData, startInEditMode, directEditingSchedule, form, bulkForm]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedOptionId) return;
    setLoadingSchedules(true);
    try {
      const result = await scheduleService.fetchSchedules({
        option_id: selectedOptionId,
      });
      if (result.success) setSchedules(result.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSchedules(false);
    }
  }, [selectedOptionId]);

  useEffect(() => {
    if (selectedOptionId) fetchSchedules();
    else setSchedules([]);
  }, [selectedOptionId, fetchSchedules]);

  // Unique Groups
  const uniqueGroups = useMemo(() => {
    const names = schedules.map((s) => s.name).filter(Boolean);
    return [...new Set(names)];
  }, [schedules]);

  // Filtered Schedules
  const visibleSchedules = useMemo(() => {
    if (selectedGroup === "all") return schedules;
    return schedules.filter((s) => s.name === selectedGroup);
  }, [schedules, selectedGroup]);

  // --- FORM LOGIC ---
  const optionType = classData?.option?.booking_type || "Single Session";
  const isSingleSession = optionType === "Single Session";
  const bulkFormDays = Form.useWatch("days_of_week", bulkForm) || [];

  useEffect(() => {
    // 1. Group Edit Pre-fill Logic
    if (activeView === "group-form" && editingGroup) {
      const sample = schedules.find((s) => s.name === editingGroup);
      if (sample) {
        form.setFieldsValue({
          price: sample.price,
          maxParticipants: sample.maxParticipants,
          minParticipants: sample.minParticipants ?? 1,
          duration: sample.duration,
        });
      }
      return;
    }

    // 2. Regular Form Logic
    if (activeView !== "form") return;
    setActiveTab("single");
    form.resetFields();
    bulkForm.resetFields();
    setCurrentStep(0);
    setBulkCurrentStep(0);

    const defaultValues = {
      price: "0.00",
      duration: 60,
      maxParticipants: 10,
      minParticipants: 1,
      time: dayjs("09:00", "HH:mm"),
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
  }, [
    activeView,
    editingSchedule,
    prefillDate,
    form,
    bulkForm,
    editingGroup,
    schedules,
  ]);

  const handleFormSuccess = () => {
    onSchedulesUpdate();
    fetchSchedules();
    if (classData && !startInEditMode) {
      setActiveView("manage");
      if (prefillDate) {
        setCalendarViewMode("day");
        setSelectedDate(prefillDate);
      }
      setPrefillDate(null);
    } else {
      onClose();
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
        await bulkForm.validateFields(["name", "date_range", "days_of_week"]);
        const times = bulkForm.getFieldValue("times");
        if (!times?.length) {
          message.error("Add at least one time.");
          return;
        }
      } else if (bulkCurrentStep === 1) {
        await bulkForm.validateFields([
          ["commonDetails", "duration"],
          ["commonDetails", "price"],
          ["commonDetails", "maxParticipants"],
          ["commonDetails", "minParticipants"],
        ]);
      }
      setFormData((prev) => ({ ...prev, ...bulkForm.getFieldsValue(true) }));
      setBulkCurrentStep(bulkCurrentStep + 1);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleBulkBack = () => {
    if (bulkCurrentStep > 0) setBulkCurrentStep(bulkCurrentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      setIsLoading(true);
      const timeStr = values.time.format("HH:mm");
      const dateStr = values.date.format("YYYY-MM-DD");
      const priceNum = Number.isFinite(parseFloat(values.price)) ? parseFloat(values.price) : 0;
      const priceStr = Math.max(0, priceNum).toFixed(2);
      const minPart = values.minParticipants ?? 1;

      if (editingSchedule) {
        const initial = editingSchedule;
        const current = {
          name: values.name,
          time: timeStr,
          duration: values.duration,
          price: priceStr,
          maxParticipants: values.maxParticipants,
          minParticipants: minPart,
          date: dateStr,
        };
        const initialNorm = {
          name: initial.name ?? "",
          time: typeof initial.time === "string" ? initial.time.slice(0, 5) : "",
          duration: initial.duration,
          price:
            initial.price != null
              ? parseFloat(initial.price).toFixed(2)
              : "0.00",
          maxParticipants: initial.maxParticipants,
          minParticipants: initial.minParticipants ?? 1,
          date:
            initial.date && typeof initial.date === "string"
              ? initial.date
              : initial.date?.format?.("YYYY-MM-DD") ?? "",
        };
        const scheduleData = {};
        if (current.name !== initialNorm.name) scheduleData.name = current.name;
        if (current.time !== initialNorm.time) scheduleData.time = current.time;
        if (current.duration !== initialNorm.duration)
          scheduleData.duration = current.duration;
        if (current.price !== initialNorm.price)
          scheduleData.price = current.price;
        if (current.maxParticipants !== initialNorm.maxParticipants)
          scheduleData.maxParticipants = current.maxParticipants;
        if (current.minParticipants !== initialNorm.minParticipants)
          scheduleData.minParticipants = current.minParticipants;
        if (current.date !== initialNorm.date) scheduleData.date = current.date;

        if (Object.keys(scheduleData).length === 0) {
          message.info("No changes to save.");
          return;
        }
        const result = await scheduleService.updateSchedule(editingSchedule.id, scheduleData);
        if (!result.success) {
          const errMsg = getErrorMessage(result.error);
          message.error(errMsg, 5);
          return;
        }
        message.success("Schedule updated.");
      } else {
        const scheduleData = {
          name: values.name ?? "",
          option: selectedOptionId,
          time: timeStr,
          duration: values.duration,
          price: priceStr,
          maxParticipants: values.maxParticipants,
          minParticipants: minPart,
          date: dateStr,
        };
        const result = await scheduleService.createSchedule(scheduleData);
        if (!result.success) {
          const errMsg = getErrorMessage(result.error);
          message.error(errMsg, 5);
          return;
        }
        message.success("Schedule created.");
      }
      handleFormSuccess();
    } catch (errorInfo) {
      message.error(getErrorMessage(errorInfo), 5);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    try {
      const times = bulkForm.getFieldValue("times");
      if (!times?.length) {
        message.error("Add at least one time.");
        return;
      }
      await bulkForm.validateFields([
        ["commonDetails", "duration"],
        ["commonDetails", "price"],
        ["commonDetails", "maxParticipants"],
        ["commonDetails", "minParticipants"],
      ]);
      const values = { ...formData, ...bulkForm.getFieldsValue(true) };
      setIsBulkLoading(true);
      const priceNum = Number.isFinite(parseFloat(values.commonDetails?.price))
        ? parseFloat(values.commonDetails.price)
        : 0;
      const payload = {
        name: values.name,
        option: selectedOptionId,
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        days_of_week: values.days_of_week,
        times: values.times.map((t) => t.format("HH:mm")),
        duration: values.commonDetails?.duration,
        price: Math.max(0, priceNum).toFixed(2),
        maxParticipants: values.commonDetails?.maxParticipants,
        minParticipants: values.commonDetails?.minParticipants ?? 1,
      };
      const result = await scheduleService.bulkCreateSchedules(payload);
      if (result && result.created_count > 0) {
        message.success(result.message);
        handleFormSuccess();
      } else {
        message.warning(result.message || "No schedules created.");
      }
    } catch (errorInfo) {
      message.error(getErrorMessage(errorInfo));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleGroupSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      setIsLoading(true);
      const priceNum = Number.isFinite(parseFloat(values.price)) ? parseFloat(values.price) : 0;
      const updates = {
        price: Math.max(0, priceNum).toFixed(2),
        maxParticipants: values.maxParticipants,
        minParticipants: values.minParticipants ?? 1,
        duration: values.duration,
      };
      await scheduleService.groupUpdate({
        option_id: selectedOptionId,
        name: editingGroup,
        updates: updates,
      });
      message.success(`Group '${editingGroup}' updated.`);
      handleFormSuccess();
      setEditingGroup(null);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER FORM CONTENTS ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModernFormLayout>
            <FormSectionBlock>
              <SectionHeader>
                <h4>
                  <Calendar size={18} /> Schedule & Timing
                </h4>
                <p>When is this session taking place?</p>
              </SectionHeader>
              <FormSection>
                <TwoColGrid>
                  <FieldContainer>
                    <Label>Date</Label>
                    <CompactFormItem name="date" rules={RULES.date}>
                      {isMobile ? (
                        <MobileDatePicker />
                      ) : (
                        <FullWidthDatePicker
                          inputReadOnly
                          disabledDate={(c) => c && c < dayjs().startOf("day")}
                        />
                      )}
                    </CompactFormItem>
                  </FieldContainer>
                  <FieldContainer>
                    <Label>Start Time</Label>
                    <CompactFormItem name="time" rules={RULES.time}>
                      {isMobile ? (
                        <MobileTimePicker />
                      ) : (
                        <FullWidthTimePicker
                          use12Hours
                          format="h:mm A"
                          minuteStep={15}
                          inputReadOnly
                        />
                      )}
                    </CompactFormItem>
                  </FieldContainer>
                </TwoColGrid>
                <FieldContainer>
                  <Label>Duration</Label>
                  <CompactFormItem name="duration" rules={RULES.duration}>
                    <DurationPicker disabled={isLoading} />
                  </CompactFormItem>
                </FieldContainer>
              </FormSection>
            </FormSectionBlock>
            <FormSectionBlock>
              <SectionHeader>
                <h4>
                  <Type size={18} /> Identification
                </h4>
                <p>Helpful for grouping similar sessions.</p>
              </SectionHeader>
              <FormSection>
                <FieldContainer>
                  <Label>
                    Session Name <HelpLabel>(Optional)</HelpLabel>
                  </Label>
                  <CompactFormItem name="name">
                    <FullWidthInput placeholder="e.g., Morning Pottery Workshop" />
                  </CompactFormItem>
                </FieldContainer>
              </FormSection>
            </FormSectionBlock>
          </ModernFormLayout>
        );
      case 1:
        return (
          <ModernFormLayout>
            <FormSectionBlock>
              <SectionHeader>
                <h4>
                  <DollarSign size={18} /> Pricing & Guests
                </h4>
              </SectionHeader>
              <FormSection>
                <TwoColGrid>
                  <FieldContainer>
                    <Label>Price (CAD)</Label>
                    <CompactFormItem name="price" rules={RULES.price}>
                      <FullWidthInput prefix="$" type="number" step="0.01" min="0" />
                    </CompactFormItem>
                  </FieldContainer>
                  <FieldContainer>
                    <Label>Total Guests</Label>
                    <CompactFormItem
                      name="maxParticipants"
                      rules={RULES.maxParticipants}
                    >
                      <FullWidthInputNumber min={1} inputMode="numeric" />
                    </CompactFormItem>
                  </FieldContainer>
                </TwoColGrid>
                <FieldContainer>
                  <Label>Minimum Guests</Label>
                  <CompactFormItem
                    name="minParticipants"
                    rules={[
                      ...RULES.minParticipants,
                      {
                        validator: (_, value) => {
                          const min = value ?? 1;
                          const max = form.getFieldValue("maxParticipants");
                          if (max != null && min > max) {
                            return Promise.reject(new Error("Minimum guests cannot exceed maximum capacity."));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <FullWidthInputNumber min={1} />
                  </CompactFormItem>
                </FieldContainer>
              </FormSection>
            </FormSectionBlock>
          </ModernFormLayout>
        );
      case 2:
        return (
          <ModernFormLayout>
            <FormSectionBlock>
              <SectionHeader>
                <h4>
                  <CheckCircle size={18} /> Review
                </h4>
                <p>Confirm your session details before creating.</p>
              </SectionHeader>
              <FormSection>
                <SummaryList>
                  <SummaryItem>
                    <span className="summary-label">Session name</span>
                    <span className="summary-value">{formData.name || "—"}</span>
                  </SummaryItem>
                  <SummaryItem>
                    <span className="summary-label">Date</span>
                    <span className="summary-value">
                      <Calendar size={14} />
                      {formData.date?.format("MMM D, YYYY")}
                    </span>
                  </SummaryItem>
                  <SummaryItem>
                    <span className="summary-label">Time</span>
                    <span className="summary-value">
                      <Clock size={14} />
                      {formData.time?.format("h:mm A")}
                    </span>
                  </SummaryItem>
                  <SummaryItem>
                    <span className="summary-label">Duration</span>
                    <span className="summary-value">
                      {formatDuration(formData.duration)}
                    </span>
                  </SummaryItem>
                  <SummaryItem>
                    <span className="summary-label">Price</span>
                    <span className="summary-value">
                      <DollarSign size={14} />
                      {formData.price}
                    </span>
                  </SummaryItem>
                  <SummaryItem>
                    <span className="summary-label">Max guests</span>
                    <span className="summary-value">{formData.maxParticipants}</span>
                  </SummaryItem>
                </SummaryList>
              </FormSection>
            </FormSectionBlock>
          </ModernFormLayout>
        );
      default:
        return null;
    }
  };

  const renderBulkForm = () => {
    const commonDetails = formData.commonDetails || {};
    return (
      <>
        <ContentPadding>
          <Form
            form={bulkForm}
            layout="vertical"
            onValuesChange={(c) => setFormData({ ...formData, ...c })}
          >
            {bulkCurrentStep === 0 && (
              <ModernFormLayout>
                <FormSectionBlock>
                  <SectionHeader>
                    <h4>
                      <Copy size={18} /> Bulk Generation
                    </h4>
                    <p>Create multiple sessions at once.</p>
                  </SectionHeader>
                  <FormSection>
                    <FieldContainer>
                      <Label>
                        Group Name <HelpLabel>Required</HelpLabel>
                      </Label>
                      <CompactFormItem name="name" rules={RULES.name}>
                        <FullWidthInput placeholder="e.g. Summer Drop-ins" />
                      </CompactFormItem>
                    </FieldContainer>
                    <FieldContainer>
                      <Label>Date Range</Label>
                      <CompactFormItem name="date_range" rules={RULES.date_range}>
                        {isMobile ? (
                          <MobileDateRangePicker format="MMM D, YYYY" />
                        ) : (
                          <FullWidthRangePicker inputReadOnly />
                        )}
                      </CompactFormItem>
                    </FieldContainer>
                  </FormSection>
                </FormSectionBlock>
                <FormSectionBlock>
                  <SectionHeader>
                    <h4>
                      <ListChecks size={18} /> Pattern
                    </h4>
                  </SectionHeader>
                  <FormSection>
                    <FieldContainer>
                      <Label>Repeat on Days</Label>
                      <CompactFormItem name="days_of_week" rules={RULES.days_of_week}>
                        <DaysGrid>
                          {Object.entries(dayLabels).map(([key, label]) => (
                            <DayChip
                              key={key}
                              type="button"
                              $selected={bulkFormDays.includes(key)}
                              onClick={() => {
                                const newDays = bulkFormDays.includes(key)
                                  ? bulkFormDays.filter((d) => d !== key)
                                  : [...bulkFormDays, key];
                                bulkForm.setFieldsValue({
                                  days_of_week: newDays,
                                });
                              }}
                            >
                              {label}
                            </DayChip>
                          ))}
                        </DaysGrid>
                      </CompactFormItem>
                    </FieldContainer>
                    <FieldContainer>
                      <Label>At Times</Label>
                      <Form.List name="times">
                        {(fields, { add, remove }) => (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            {fields.map(({ key, name, ...restField }) => (
                              <div key={key} style={{ display: "flex", gap: 8 }}>
                                <CompactFormItem
                                  {...restField}
                                  name={name}
                                  rules={RULES.time}
                                  style={{ flex: 1 }}
                                >
                                  {isMobile ? (
                                    <MobileTimePicker />
                                  ) : (
                                    <FullWidthTimePicker
                                      use12Hours
                                      format="h:mm A"
                                      minuteStep={15}
                                    />
                                  )}
                                </CompactFormItem>
                                <Button
                                  danger
                                  icon={<X size={16} />}
                                  onClick={() => remove(name)}
                                />
                              </div>
                            ))}
                            <Button
                              type="dashed"
                              onClick={() => add(dayjs("09:00", "HH:mm"))}
                              icon={<PlusCircle size={14} />}
                            >
                              Add Time
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </FieldContainer>
                  </FormSection>
                </FormSectionBlock>
              </ModernFormLayout>
            )}
            {bulkCurrentStep === 1 && (
              <ModernFormLayout>
                <FormSectionBlock>
                  <SectionHeader>
                    <h4>
                      <DollarSign size={18} /> Common Details
                    </h4>
                  </SectionHeader>
                  <FormSection>
                    <TwoColGrid>
                      <FieldContainer>
                        <Label>Price</Label>
                        <CompactFormItem
                          name={["commonDetails", "price"]}
                          rules={RULES.price}
                        >
                          <FullWidthInput prefix="$" type="number" step="0.01" />
                        </CompactFormItem>
                      </FieldContainer>
                      <FieldContainer>
                        <Label>Max Guests</Label>
                        <CompactFormItem
                          name={["commonDetails", "maxParticipants"]}
                          rules={RULES.maxParticipants}
                        >
                          <FullWidthInputNumber min={1} />
                        </CompactFormItem>
                      </FieldContainer>
                    </TwoColGrid>
                    <FieldContainer>
                      <Label>Duration</Label>
                      <CompactFormItem
                        name={["commonDetails", "duration"]}
                        rules={RULES.duration}
                      >
                        <DurationPicker disabled={isBulkLoading} />
                      </CompactFormItem>
                    </FieldContainer>
                    <FieldContainer>
                      <Label>Min Guests</Label>
                      <CompactFormItem
                        name={["commonDetails", "minParticipants"]}
                        rules={[
                          ...RULES.minParticipants,
                          {
                            validator: (_, value) => {
                              const min = value ?? 1;
                              const max = bulkForm.getFieldValue(["commonDetails", "maxParticipants"]);
                              if (max != null && min > max) {
                                return Promise.reject(new Error("Minimum guests cannot exceed maximum capacity."));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <FullWidthInputNumber min={1} />
                      </CompactFormItem>
                    </FieldContainer>
                  </FormSection>
                </FormSectionBlock>
              </ModernFormLayout>
            )}
            {bulkCurrentStep === 2 && (
              <ModernFormLayout>
                <FormSectionBlock>
                  <SectionHeader>
                    <h4>
                      <CheckCircle size={18} /> Summary
                    </h4>
                    <p>Review before generating sessions.</p>
                  </SectionHeader>
                  <FormSection>
                    <SummaryList>
                      <SummaryItem>
                        <span className="summary-label">Group name</span>
                        <span className="summary-value">{formData.name || "—"}</span>
                      </SummaryItem>
                      <SummaryItem>
                        <span className="summary-label">Date range</span>
                        <span className="summary-value">
                          {formData.date_range?.[0]?.format("MMM D")} – {formData.date_range?.[1]?.format("MMM D")}
                        </span>
                      </SummaryItem>
                      <SummaryItem>
                        <span className="summary-label">Days</span>
                        <span className="summary-value">
                          {formData.days_of_week?.map((d) => dayLabels[d]).join(", ") || "—"}
                        </span>
                      </SummaryItem>
                      <SummaryItem>
                        <span className="summary-label">Times</span>
                        <span className="summary-value">
                          {(formData.times || []).map((t) => t.format("h:mm A")).join(", ") || "—"}
                        </span>
                      </SummaryItem>
                      <SummaryItem>
                        <span className="summary-label">Price</span>
                        <span className="summary-value">${commonDetails.price}</span>
                      </SummaryItem>
                      <SummaryItem>
                        <span className="summary-label">Duration</span>
                        <span className="summary-value">{formatDuration(commonDetails.duration)}</span>
                      </SummaryItem>
                      <SummaryItem>
                        <span className="summary-label">Max guests</span>
                        <span className="summary-value">{commonDetails.maxParticipants}</span>
                      </SummaryItem>
                    </SummaryList>
                  </FormSection>
                </FormSectionBlock>
              </ModernFormLayout>
            )}
          </Form>
        </ContentPadding>
      </>
    );
  };

  const renderSingleSessionStepperForm = () => (
    <>
      <ContentPadding>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(c) => setFormData({ ...formData, ...c })}
        >
          {renderStepContent()}
        </Form>
      </ContentPadding>
    </>
  );

  const renderGroupEditForm = () => (
    <ContentPadding>
      <Form form={form} layout="vertical">
        <ModernFormLayout>
          <FormSectionBlock>
            <SectionHeader>
              <h4>
                <Edit3 size={16} /> Edit Group: {editingGroup}
              </h4>
              <p>
                Updating these settings will affect all future sessions in this
                group.
              </p>
            </SectionHeader>
            <FormSection>
              <TwoColGrid>
                <FieldContainer>
                  <Label>Price</Label>
                  <CompactFormItem name="price" rules={RULES.price}>
                    <FullWidthInput prefix="$" type="number" step="0.01" />
                  </CompactFormItem>
                </FieldContainer>
                <FieldContainer>
                  <Label>Capacity</Label>
                  <CompactFormItem
                    name="maxParticipants"
                    rules={RULES.maxParticipants}
                  >
                    <FullWidthInputNumber min={1} />
                  </CompactFormItem>
                </FieldContainer>
              </TwoColGrid>
              <FieldContainer>
                <Label>Duration</Label>
                <CompactFormItem name="duration" rules={RULES.duration}>
                  <DurationPicker />
                </CompactFormItem>
              </FieldContainer>
              <FieldContainer>
                <Label>Minimum Guests</Label>
                <CompactFormItem
                  name="minParticipants"
                  rules={[
                    ...RULES.minParticipants,
                    {
                      validator: (_, value) => {
                        const min = value ?? 1;
                        const max = form.getFieldValue("maxParticipants");
                        if (max != null && min > max) {
                          return Promise.reject(new Error("Minimum guests cannot exceed maximum capacity."));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <FullWidthInputNumber min={1} />
                </CompactFormItem>
              </FieldContainer>
            </FormSection>
          </FormSectionBlock>
        </ModernFormLayout>
      </Form>
    </ContentPadding>
  );

  const renderFooterButtons = (isMobileLayout = false) => {
    const btnStyle = { height: 40 };
    if (activeView === "manage") return null;

    const commonProps = isMobileLayout ? { block: true } : {};

    if (activeView === "group-form") {
      return (
        <>
          <Button
            onClick={() => setActiveView("manage")}
            style={btnStyle}
            {...commonProps}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleGroupSubmit}
            loading={isLoading}
            key={`btn-${isLoading}`}
            style={btnStyle}
            {...commonProps}
          >
            Update Group
          </Button>
        </>
      );
    }

    if (activeTab === "bulk" && !editingSchedule) {
      return (
        <>
          {bulkCurrentStep === 0 ? (
            <Button
              onClick={() => setActiveView("manage")}
              style={btnStyle}
              {...commonProps}
            >
              Cancel
            </Button>
          ) : (
            <Button
              onClick={handleBulkBack}
              disabled={isBulkLoading}
              style={btnStyle}
              {...commonProps}
            >
              Back
            </Button>
          )}
          {bulkCurrentStep < 2 ? (
            <Button
              type="primary"
              onClick={handleBulkNext}
              style={btnStyle}
              icon={<ChevronRight size={16} />}
              iconPosition="end"
              {...commonProps}
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleBulkSubmit}
              loading={isBulkLoading}
              style={btnStyle}
              {...commonProps}
            >
              Generate
            </Button>
          )}
        </>
      );
    }

    return (
      <>
        {currentStep === 0 ? (
          <Button
            onClick={() => setActiveView("manage")}
            style={btnStyle}
            {...commonProps}
          >
            Cancel
          </Button>
        ) : (
          <Button
            onClick={handleBack}
            disabled={isLoading}
            style={btnStyle}
            {...commonProps}
          >
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
            {...commonProps}
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
            {...commonProps}
          >
            {editingSchedule ? "Save Changes" : "Create"}
          </Button>
        )}
      </>
    );
  };

  const handleDayClick = (dateObj) => {
    setZoomDirection("in");
    setSelectedDate(dateObj);
    setCalendarViewMode("day");
  };

  const handleBackToCalendar = () => {
    setZoomDirection("out");
    setCalendarViewMode("month");
    setTimeout(() => setSelectedDate(null), 300); // clear after anim
  };

  const handleDelete = async (id) => {
    await scheduleService.deleteSchedule(id);
    message.success("Deleted");
    fetchSchedules();
    onSchedulesUpdate();
  };

  // --- SHARED CALENDAR LOGIC ---
  const calendarDays = useMemo(() => {
    const start = currentMonth.startOf("month").startOf("week");
    const end = start.add(41, "day"); // Fixed rows
    const days = [];
    let curr = start;
    while (curr.isBefore(end)) {
      const dateStr = curr.format("YYYY-MM-DD");
      // Use visibleSchedules here to reflect filtering
      const daySchedules = visibleSchedules.filter((s) => s.date === dateStr);
      days.push({
        date: curr,
        isCurrentMonth: curr.isSame(currentMonth, "month"),
        isToday: curr.isSame(dayjs(), "day"),
        schedules: daySchedules,
      });
      curr = curr.add(1, "day");
    }
    return days;
  }, [currentMonth, visibleSchedules]);

  const filteredDaySchedules = useMemo(() => {
    if (!selectedDate) return [];
    // Use visibleSchedules here as well
    return visibleSchedules
      .filter((s) => s.date === selectedDate.format("YYYY-MM-DD"))
      .sort((a, b) =>
        dayjs(`${a.date}T${a.time}`).diff(dayjs(`${b.date}T${b.time}`)),
      );
  }, [selectedDate, visibleSchedules]);

  // Grouping for Day View
  const groupedDaySchedules = useMemo(() => {
    const groups = { morning: [], afternoon: [], evening: [] };
    filteredDaySchedules.forEach((s) => {
      const p = getPeriod(s.time);
      if (groups[p]) groups[p].push(s);
    });
    return groups;
  }, [filteredDaySchedules]);

  // --- ANIMATION VARIANTS (ZOOM/FADE) ---
  const zoomVariants = {
    enter: (direction) => ({
      scale: direction === "in" ? 0.95 : 1.05,
      opacity: 0,
      filter: "blur(2px)",
    }),
    center: {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: (direction) => ({
      scale: direction === "in" ? 1.05 : 0.95,
      opacity: 0,
      filter: "blur(2px)",
      transition: { duration: 0.2, ease: "easeIn" },
    }),
  };

  // --- RENDER CONTENT ---

  // 1. MOBILE RENDERER (VAUL DRAWER)
  if (isMobile) {
    const renderMobileView = () => {
      // Form View
      if (activeView === "form" || activeView === "group-form") {
        return (
          <>
            <MobileHeader>
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={() => setActiveView("manage")}
                type="text"
              />
              <Title level={5} style={{ margin: 0 }}>
                {activeView === "group-form"
                  ? "Edit Group"
                  : editingSchedule
                    ? "Edit Session"
                    : "Create Schedule"}
              </Title>
              <div style={{ width: 32 }} />
            </MobileHeader>
            <MobileBody>
              <AnimatedHeightWrapper>
                {activeView === "group-form" ? (
                  renderGroupEditForm()
                ) : editingSchedule ? (
                  renderSingleSessionStepperForm()
                ) : (
                  <ModernTabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    centered
                    items={[
                      {
                        label: "Single",
                        key: "single",
                        children: renderSingleSessionStepperForm(),
                      },
                      ...(!editingSchedule && isSingleSession
                        ? [
                            {
                              label: "Bulk",
                              key: "bulk",
                              children: renderBulkForm(),
                            },
                          ]
                        : []),
                    ]}
                  />
                )}
              </AnimatedHeightWrapper>
            </MobileBody>
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                gap: 12,
              }}
            >
              {renderFooterButtons(true)}
            </div>
          </>
        );
      }

      // Day List View
      if (calendarViewMode === "day") {
        return (
          <>
            <MobileHeader>
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={handleBackToCalendar}
                type="text"
              />
              <Title level={5} style={{ margin: 0 }}>
                {selectedDate?.format("ddd, MMM D")}
              </Title>
              <Button
                type="primary"
                size="small"
                icon={<PlusCircle size={16} />}
                onClick={() => {
                  setEditingSchedule(null);
                  setPrefillDate(selectedDate);
                  setActiveView("form");
                }}
              />
            </MobileHeader>
            <MobileBody>
              <AnimatedHeightWrapper>
                {loadingSchedules ? (
                  <div style={{ padding: 16 }}>
                    {[1, 2, 3].map((i) => (
                      <SkeletonBase
                        key={i}
                        $height="100px"
                        $mb="12px"
                        $radius="12px"
                      />
                    ))}
                  </div>
                ) : filteredDaySchedules.length > 0 ? (
                  filteredDaySchedules.map((s) => (
                    <MobileScheduleCard key={s.id}>
                      <div className="time-badge">
                        {dayjs(`2000-01-01T${s.time}`).format("h:mm A")}
                      </div>
                      <div className="title">{s.name || "Regular Session"}</div>
                      <div className="details">
                        <span>
                          <Users size={12} /> {s.booked_participants}/
                          {s.maxParticipants}
                        </span>
                        <span>
                          <DollarSign size={12} /> {s.price}
                        </span>
                        <span>
                          <Hourglass size={12} /> {formatDuration(s.duration)}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px dashed #f1f5f9",
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        <Button
                          size="small"
                          icon={<Edit3 size={14} />}
                          onClick={() => {
                            setEditingSchedule(s);
                            setActiveView("form");
                          }}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete?"
                          onConfirm={() => handleDelete(s.id)}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<Trash2 size={14} />}
                          />
                        </Popconfirm>
                      </div>
                    </MobileScheduleCard>
                  ))
                ) : (
                  <div style={{ marginTop: 60 }}>
                    <Empty description="No sessions scheduled" />
                  </div>
                )}
              </AnimatedHeightWrapper>
            </MobileBody>
          </>
        );
      }

      // Calendar Grid View (Mobile)
      return (
        <>
          <MobileHeader>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "100%",
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                Manage Schedule
              </Title>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: classData?.options?.length > 1 ? "1fr 1fr" : "1fr",
                  gap: 8,
                }}
              >
                {classData?.options?.length > 1 && (
                  <Segmented
                    size="small"
                    block
                    options={
                      classData?.options?.map((o) => ({
                        label: o.title,
                        value: o.optionId,
                      })) || []
                    }
                    value={selectedOptionId}
                    onChange={setSelectedOptionId}
                  />
                )}
                <Select
                  size="small"
                  value={selectedGroup}
                  onChange={setSelectedGroup}
                  options={[
                    { label: "All Groups", value: "all" },
                    ...uniqueGroups.map((g) => ({ label: g, value: g })),
                  ]}
                />
              </div>
            </div>
          </MobileHeader>
          <MobileBody>
            <AnimatedHeightWrapper>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px 0",
                }}
              >
                <Button
                  icon={<ChevronLeft size={20} />}
                  onClick={() =>
                    setCurrentMonth(currentMonth.subtract(1, "month"))
                  }
                  type="text"
                />
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {currentMonth.format("MMMM YYYY")}
                </span>
                <Button
                  icon={<ChevronRight size={20} />}
                  onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                  type="text"
                />
              </div>

              {loadingSchedules ? (
                <div style={{ padding: 20 }}>
                  <GridSkeleton style={{ height: 350, border: "none" }}>
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div
                        key={i}
                        style={{ background: "white", borderRadius: 4 }}
                      />
                    ))}
                  </GridSkeleton>
                </div>
              ) : (
                <MobileCalendarGrid>
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="header">
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((day, i) => (
                    <button
                      key={i}
                      className={`${day.isToday ? "today" : ""} ${day.schedules.length > 0 ? "has-events" : ""}`}
                      style={{ opacity: day.isCurrentMonth ? 1 : 0.3 }}
                      onClick={() => handleDayClick(day.date)}
                    >
                      {day.date.date()}
                      {day.schedules.length > 0 && <div className="dot" />}
                    </button>
                  ))}
                </MobileCalendarGrid>
              )}
            </AnimatedHeightWrapper>
          </MobileBody>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
            {selectedGroup !== "all" ? (
              <Button
                block
                size="large"
                icon={<Edit3 size={18} />}
                onClick={() => {
                  setEditingGroup(selectedGroup);
                  setActiveView("group-form");
                }}
              >
                Edit Group: {selectedGroup}
              </Button>
            ) : (
              <Button
                type="primary"
                block
                size="large"
                icon={<PlusCircle size={18} />}
                onClick={() => {
                  setEditingSchedule(null);
                  setPrefillDate(dayjs());
                  setActiveView("form");
                }}
                disabled={
                  classData?.options?.find(
                    (o) => o.optionId === selectedOptionId,
                  )?.schedule_mode === "synced"
                }
              >
                Add Schedule
              </Button>
            )}
          </div>
        </>
      );
    };

    return (
      <Drawer.Root
        open={open}
        onOpenChange={(o) => !o && onClose()}
        repositionInputs={false}
        dismissible
      >
        <Drawer.Portal>
          <StyledDrawerOverlay />
          <StyledDrawerContent>
            <DrawerHandle />
            {renderMobileView()}
          </StyledDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // 2. DESKTOP RENDERER (MODAL)

  // Skeleton Renderers for Desktop
  const renderDesktopSkeleton = () => {
    if (calendarViewMode === "month") {
      return (
        <SkeletonContainer>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <SkeletonBase $width="200px" $height="32px" />
            <SkeletonBase $width="100px" $height="32px" />
          </div>
          <GridSkeleton>
            {Array.from({ length: 35 }).map((_, i) => (
              <CellSkeleton key={i}>
                <SkeletonBase $width="20px" $height="14px" />
                <SkeletonBase $width="80%" $height="10px" $radius="4px" />
                <SkeletonBase $width="60%" $height="10px" $radius="4px" />
              </CellSkeleton>
            ))}
          </GridSkeleton>
        </SkeletonContainer>
      );
    }
    return (
      <SkeletonContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <SkeletonBase $width="250px" $height="32px" />
          <SkeletonBase $width="120px" $height="32px" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBase
            key={i}
            $width="100%"
            $height="60px"
            $radius="10px"
            $mb="10px"
          />
        ))}
      </SkeletonContainer>
    );
  };

  const renderDesktopContent = () => {
    // FORM VIEW OVERLAY
    if (activeView === "form" || activeView === "group-form") {
      return (
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <TopNav>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={() => setActiveView("manage")}
                type="text"
              />
              <Title level={4} style={{ margin: 0 }}>
                {activeView === "group-form"
                  ? "Edit Group"
                  : editingSchedule
                    ? "Edit Session"
                    : "Create Schedule"}
              </Title>
            </div>
            <Button icon={<X size={20} />} onClick={onClose} type="text" />
          </TopNav>
          {activeView === "group-form" ? (
            renderGroupEditForm()
          ) : editingSchedule ? (
            renderSingleSessionStepperForm()
          ) : (
            <ModernTabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  label: (
                    <Space>
                      <File size={16} />
                      Single Session
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
                            <Copy size={16} />
                            Bulk Create
                          </Space>
                        ),
                        key: "bulk",
                        children: renderBulkForm(),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      );
    }

    // MANAGE VIEW (CALENDAR / DAY LIST)
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Top Bar - Tier (if multiple), Group, New Schedule, Close */}
        <TopNav>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {classData?.options?.length > 1 && (
              <>
                <Layers size={18} color="#64748b" />
                <span style={{ fontWeight: 600, color: "#334155" }}>Tier</span>
                {classData.options.length > 4 ? (
                  <Select
                    value={selectedOptionId}
                    onChange={setSelectedOptionId}
                    style={{ width: 160 }}
                    options={classData.options.map((o) => ({
                      label: o.title,
                      value: o.optionId,
                    }))}
                  />
                ) : (
                  <Segmented
                    size="small"
                    options={classData.options.map((o) => ({
                      label: o.title,
                      value: o.optionId,
                    }))}
                    value={selectedOptionId}
                    onChange={setSelectedOptionId}
                  />
                )}
                <div
                  style={{
                    width: 1,
                    height: 22,
                    background: "#e2e8f0",
                    margin: "0 4px",
                  }}
                />
              </>
            )}
            <Filter size={16} color="#64748b" />
            <span style={{ fontWeight: 600, color: "#334155" }}>Group</span>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              style={{ width: 160 }}
              options={[
                { label: "All Groups", value: "all" },
                ...uniqueGroups.map((g) => ({ label: g, value: g })),
              ]}
            />
            {selectedGroup !== "all" && (
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => {
                  setEditingGroup(selectedGroup);
                  setActiveView("group-form");
                }}
              >
                Edit group
              </Button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {activeView === "manage" && calendarViewMode !== "day" && (
              <Button
                type="primary"
                icon={<PlusCircle size={16} />}
                onClick={() => {
                  setEditingSchedule(null);
                  setPrefillDate(dayjs());
                  setActiveView("form");
                }}
                disabled={
                  classData?.options?.find(
                    (o) => o.optionId === selectedOptionId,
                  )?.schedule_mode === "synced"
                }
              >
                New schedule
              </Button>
            )}
            <Button
              icon={<X size={20} />}
              onClick={onClose}
              type="text"
              style={{ color: "#94a3b8" }}
            />
          </div>
        </TopNav>

        {/* Zoom Container with AnimatePresence */}
        <ZoomContainer>
          <AnimatePresence
            mode="popLayout"
            initial={false}
            custom={zoomDirection}
          >
            {loadingSchedules ? (
              <ViewWrapper
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderDesktopSkeleton()}
              </ViewWrapper>
            ) : calendarViewMode === "month" ? (
              <ViewWrapper
                key="month"
                custom={zoomDirection}
                variants={zoomVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <CalendarGridContainer>
                  <CalendarControls>
                    <div className="nav-group">
                      <Button
                        type="text"
                        size="small"
                        icon={<ChevronLeft size={18} />}
                        onClick={() =>
                          setCurrentMonth(currentMonth.subtract(1, "month"))
                        }
                        style={{ color: "#64748b" }}
                      />
                      <span className="month-title">
                        {currentMonth.format("MMMM YYYY")}
                      </span>
                      <Button
                        type="text"
                        size="small"
                        icon={<ChevronRight size={18} />}
                        onClick={() =>
                          setCurrentMonth(currentMonth.add(1, "month"))
                        }
                        style={{ color: "#64748b" }}
                      />
                    </div>
                  </CalendarControls>
                  <WeekdayRow>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <span key={d} className={d === "Sun" || d === "Sat" ? "weekend" : ""}>
                          {d}
                        </span>
                      ),
                    )}
                  </WeekdayRow>
                  <MonthGrid>
                    {calendarDays.map((day, i) => (
                      <DateCell
                        key={i}
                        $isOtherMonth={!day.isCurrentMonth}
                        $isToday={day.isToday}
                        onClick={() => handleDayClick(day.date)}
                      >
                        <DateNumber $isToday={day.isToday} $isOtherMonth={!day.isCurrentMonth}>
                          {day.date.date()}
                        </DateNumber>
                        {day.schedules.length > 0 && <DateCellDot />}
                        <DotContainer>
                          {day.schedules.slice(0, 2).map((s, idx) => (
                            <EventPill key={idx}>
                              {dayjs(`2000-01-01T${s.time}`).format("h:mm A")}{" "}
                              {s.name || "Session"}
                            </EventPill>
                          ))}
                          {day.schedules.length > 2 && (
                            <EventPill style={{ background: "#ebebeb", color: "#717171" }}>
                              +{day.schedules.length - 2} more
                            </EventPill>
                          )}
                        </DotContainer>
                      </DateCell>
                    ))}
                  </MonthGrid>
                </CalendarGridContainer>
              </ViewWrapper>
            ) : (
              <ViewWrapper
                key="day"
                custom={zoomDirection}
                variants={zoomVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <DayViewHeader>
                  <div className="back-wrap">
                    <Button
                      type="text"
                      icon={<Undo2 size={18} />}
                      onClick={handleBackToCalendar}
                    >
                      Back to calendar
                    </Button>
                  </div>
                  <h2 className="date-title">
                    {selectedDate?.format("dddd, MMMM D")}
                  </h2>
                  <div className="header-spacer" />
                </DayViewHeader>

                <DayViewBody>
                  {filteredDaySchedules.length > 0 ? (
                    <>
                      {["morning", "afternoon", "evening"].map((period) => {
                        const items = groupedDaySchedules[period];
                        if (!items.length) return null;

                        return (
                          <DayPeriodSection key={period}>
                            <DayPeriodLabel>
                              <lord-icon
                                src="https://cdn.lordicon.com/okqjaags.json"
                                trigger="in"
                                state="in-clock"
                              />
                              {period.charAt(0).toUpperCase() + period.slice(1)}
                            </DayPeriodLabel>
                            <div>
                              {items.map((s) => {
                                const start = dayjs(`2000-01-01T${s.time}`);
                                return (
                                  <DayCard key={s.id}>
                                    <div className="time-col">
                                      {start.format("h:mm A")}
                                    </div>
                                    <div className="info-col">
                                      <span className="name">
                                        {s.name || "Regular Session"}
                                      </span>
                                      <div className="meta">
                                        <span>
                                          <Users size={14} />{" "}
                                          {s.booked_participants}/
                                          {s.maxParticipants} guests
                                        </span>
                                        <span>
                                          <DollarSign size={14} /> ${s.price}
                                        </span>
                                        <span>
                                          <Hourglass size={14} />{" "}
                                          {formatDuration(s.duration)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="action-col">
                                      <Button
                                        size="small"
                                        type="text"
                                        icon={<Edit3 size={14} />}
                                        onClick={() => {
                                          setEditingSchedule(s);
                                          setActiveView("form");
                                        }}
                                      />
                                      <Popconfirm
                                        title="Delete this session?"
                                        onConfirm={() => handleDelete(s.id)}
                                      >
                                        <Button
                                          size="small"
                                          type="text"
                                          danger
                                          icon={<Trash2 size={14} />}
                                        />
                                      </Popconfirm>
                                    </div>
                                  </DayCard>
                                );
                              })}
                            </div>
                          </DayPeriodSection>
                        );
                      })}
                    </>
                  ) : (
                    <DayEmptyState>
                      <Empty description="No sessions this day. Add one to get started." />
                    </DayEmptyState>
                  )}
                </DayViewBody>

                <DayViewFooter>
                  <Button
                    type="primary"
                    size="middle"
                    icon={<PlusCircle size={16} />}
                    onClick={() => {
                      setEditingSchedule(null);
                      setPrefillDate(selectedDate);
                      setActiveView("form");
                    }}
                  >
                    Add schedule
                  </Button>
                </DayViewFooter>
              </ViewWrapper>
            )}
          </AnimatePresence>
        </ZoomContainer>
      </div>
    );
  };

  return (
    <>
      {isMobile ? renderMobileView() : null}

      {!isMobile && (
        <DesktopModal
          centered
          open={open}
          onCancel={onClose}
          width={activeView === "manage" ? 1000 : 600}
          destroyOnClose
          maskClosable={!isLoading && !isBulkLoading}
          footer={activeView !== "manage" ? renderFooterButtons(false) : null}
          closeIcon={null}
        >
          {renderDesktopContent()}
        </DesktopModal>
      )}
    </>
  );
};

export default ScheduleEditDrawer;
