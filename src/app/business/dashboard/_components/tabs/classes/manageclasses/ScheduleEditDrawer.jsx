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
  Tooltip,
  Steps,
  Space,
  Popconfirm,
  Tag,
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
  Filter,
  Hourglass,
} from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import styled, { css } from "styled-components";
import { motion } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";
import { LordIcon } from "@/services/ReactUtils";

import { MobileDatePicker, MobileTimePicker, MobileRangePicker } from "@/components/common/mobile/MobilePickers";

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
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        <div style={{ border: "1px solid transparent", margin: "-1px" }}>
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
        return `${formattedKey}: ${Array.isArray(value) ? value.join(", ") : value}`;
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

// --- Helper Functions ---
const formatDuration = (minutes) => {
  if (!minutes) return "Not set";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
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
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
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
  padding-bottom: max(16px, env(safe-area-inset-bottom));
`;

// --- Styled Inputs (Modernized) ---
const commonInputStyles = css`
  height: 48px;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  @media (max-width: 768px) {
    font-size: 16px; /* Prevent Zoom on Mobile */
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
  .ant-picker-input > input {
    font-size: 14px;
  }
`;

const StyledDatePicker = styled(DatePicker)`
  width: 100%;
  ${commonInputStyles}
  .ant-picker-input > input {
    font-size: 14px;
  }
`;

const StyledRangePicker = styled(DatePicker.RangePicker)`
  width: 100%;
  ${commonInputStyles}
  .ant-picker-input > input {
    font-size: 14px;
  }
`;

const StyledInputNumber = styled(InputNumber)`
  width: 100%;
  ${commonInputStyles}
  .ant-input-number-input-wrap, .ant-input-number-input {
    height: 100%;
    display: flex;
    align-items: center;
    @media (max-width: 768px) { font-size: 16px; }
  }
`;

// --- Modern Form Layout Components ---

// COMPACT VALIDATION WRAPPER
// This replaces 'noStyle' to provide a tight layout but WITH error messages
const CompactFormItem = styled(Form.Item)`
  margin-bottom: 0; /* Remove default large margin */
  
  .ant-form-item-explain {
    font-size: 11px;
    color: ${props => props.theme.token.colorError};
    line-height: 1.2;
    margin-top: 4px;
    min-height: 0;
  }
  
  .ant-form-item-row {
    flex-direction: column;
    align-items: stretch;
  }

  /* Make error input borders red by default via Antd, but ensure custom inputs respect it */
  &.ant-form-item-has-error {
    input, .ant-input-number, .ant-picker, div[class*="MobileInputTrigger"] {
      border-color: ${props => props.theme.token.colorError} !important;
    }
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

const HelpLabel = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: auto;
`;

// --- Custom Duration Picker ---
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
          onClick={() => { }} // Just visual
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

// --- Bulk Days Selector ---
const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
`;

const DayChip = styled.button`
  height: 44px;
  border-radius: 8px;
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
`;

// --- Desktop Modal Styles ---
const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
  }

  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 20px 24px;
    margin: 0;
  }

  .ant-modal-title {
    font-size: 18px;
    font-weight: 700;
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
  }
`;

// --- Stepper Styles ---
const ModernSteps = styled(Steps)`
  padding: 24px 32px;
  border-bottom: 1px solid #f0f0f0;
  background: white;

  .ant-steps-item-process .ant-steps-item-icon {
    background: ${(props) => props.theme.token.colorPrimary};
    border-color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const ContentPadding = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

// --- Review Section Styles ---
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
  }
  span.value {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

// --- Tabs Styling ---
const ModernTabs = styled(Tabs)`
  .ant-tabs-nav {
    padding: 0 32px;
    margin: 0 !important;
    border-bottom: 1px solid #f0f0f0;
  }
  .ant-tabs-tab {
    padding: 16px 0 !important;
    margin: 0 24px 0 0 !important;
    font-size: 14px;
    font-weight: 500;
  }
`;

// --- Management View Styles ---
const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const DateStripContainer = styled.div`
  background: white;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  &:hover {
    border-color: #ff385c;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  ${(props) => props.$isPast && `opacity: 0.7; background: #f9fafb;`}
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

// --- Helper for Day Labels ---
const dayLabels = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

// --- Schedule Management View Component ---
const ScheduleManagementView = React.memo(
  ({
    classData,
    onAdd,
    onEdit,
    onEditGroup,
    onSchedulesUpdate,
    currentMonth,
    selectedDate,
    groupFilter,
    onViewStateChange,
  }) => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const optionId = classData?.option?.optionId;

    const refreshSchedules = useCallback(async () => {
      if (!optionId) return;
      setLoading((prev) => (prev === true ? true : false));
      try {
        const result = await scheduleService.fetchSchedules({
          option_id: optionId,
        });
        if (result.success) setSchedules(result.data || []);
        else
          message.error(
            getErrorMessage(result.error || "Failed to refresh schedules.")
          );
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

    const setCurrentMonth = (val) => onViewStateChange({ currentMonth: val });
    const setSelectedDate = (val) => onViewStateChange({ selectedDate: val });
    const setGroupFilter = (val) => onViewStateChange({ groupFilter: val });

    const datesInMonth = useMemo(() => {
      const start = currentMonth.startOf("month");
      const end = currentMonth.endOf("month");
      const dates = [];
      let curr = start;
      while (curr.isBefore(end) || curr.isSame(end, "day")) {
        dates.push(curr);
        curr = curr.add(1, "day");
      }
      return dates;
    }, [currentMonth]);

    const filteredSchedules = useMemo(() => {
      let filtered = schedules;

      // Apply Date Filter
      if (selectedDate) {
        filtered = filtered.filter(
          (s) => s.date === selectedDate.format("YYYY-MM-DD")
        );
        // If specific date selected, usually sort by time ascending
        return filtered.sort((a, b) =>
          dayjs(`${a.date}T${a.time}`).diff(dayjs(`${b.date}T${b.time}`))
        );
      }

      // Apply Group Filter
      if (groupFilter)
        filtered =
          groupFilter === "##__INDIVIDUAL__##"
            ? filtered.filter((s) => !s.name)
            : filtered.filter((s) => s.name === groupFilter);

      // Default Sort: Furthest away first (Descending) for "View All"
      return filtered.sort((a, b) =>
        dayjs(`${b.date}T${b.time}`).diff(dayjs(`${a.date}T${a.time}`))
      );
    }, [schedules, selectedDate, groupFilter]);

    const uniqueGroups = useMemo(
      () => [...new Set(schedules.map((s) => s.name).filter(Boolean))],
      [schedules]
    );

    const handleDelete = async (id) => {
      try {
        await scheduleService.deleteSchedule(id);
        await refreshSchedules();
        onSchedulesUpdate();
        message.success("Deleted");
      } catch (e) {
        message.error(getErrorMessage(e));
      }
    };

    if (!classData?.option)
      return (
        <EmptyStateContainer>
          <Text>Configuration Needed</Text>
        </EmptyStateContainer>
      );

    return (
      <ManagementContainer>
        <DateStripContainer>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 20px",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="small"
                onClick={() =>
                  setCurrentMonth(currentMonth.subtract(1, "month"))
                }
                icon={<ChevronLeft size={14} />}
              />
              <span style={{ fontWeight: 600 }}>
                {currentMonth.format("MMMM YYYY")}
              </span>
              <Button
                size="small"
                onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                icon={<ChevronRight size={14} />}
              />
            </div>
            <Button
              size="small"
              type="link"
              onClick={() => setSelectedDate(null)}
            >
              View All
            </Button>
          </div>
          <div
            style={{
              overflowX: "auto",
              display: "flex",
              gap: 8,
              padding: "0 20px",
              paddingBottom: 8,
            }}
          >
            {datesInMonth.map((date) => {
              const isSel = selectedDate && selectedDate.isSame(date, "day");
              const hasSch = schedules.some(
                (s) => s.date === date.format("YYYY-MM-DD")
              );
              return (
                <Button
                  key={date.toString()}
                  type={isSel ? "primary" : "default"}
                  style={{
                    height: 56,
                    minWidth: 50,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    borderColor: hasSch && !isSel ? "#ff385c" : undefined,
                  }}
                  onClick={() => setSelectedDate(date)}
                >
                  <span style={{ fontSize: 10, opacity: 0.8 }}>
                    {date.format("ddd")}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>
                    {date.format("D")}
                  </span>
                </Button>
              );
            })}
          </div>
        </DateStripContainer>

        <div
          style={{
            padding: "12px 20px",
            background: "white",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Filter size={14} color="#64748b" />
          <Select
            placeholder="Filter Group"
            style={{ width: 180 }}
            allowClear
            size="small"
            bordered={false}
            value={groupFilter}
            onChange={setGroupFilter}
          >
            <Option value="##__INDIVIDUAL__##">Individual</Option>
            {uniqueGroups.map((g) => (
              <Option key={g} value={g}>
                {g}
              </Option>
            ))}
          </Select>
          {groupFilter && groupFilter !== "##__INDIVIDUAL__##" && (
            <Button
              size="small"
              type="link"
              icon={<Edit3 size={14} />}
              onClick={() =>
                onEditGroup(
                  groupFilter,
                  schedules.find((s) => s.name === groupFilter)
                )
              }
            >
              Edit Group
            </Button>
          )}
        </div>

        <ScheduleListArea>
          {loading ? (
            <Text style={{ padding: 20 }}>Loading...</Text>
          ) : filteredSchedules.length > 0 ? (
            filteredSchedules.map((s) => (
              <ScheduleCard
                key={s.id}
                $isPast={dayjs(s.date).isBefore(dayjs(), "day")}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {dayjs(s.date).format("MMM D")} •{" "}
                      {dayjs(`2000-01-01T${s.time}`).format("h:mm A")}
                    </div>
                    {s.name && (
                      <Tag color="blue" style={{ marginTop: 4 }}>
                        {s.name}
                      </Tag>
                    )}
                  </div>
                  <Space>
                    <Button
                      size="small"
                      icon={<Edit3 size={14} />}
                      onClick={() => onEdit(s)}
                    />
                    <Popconfirm
                      title="Delete?"
                      onConfirm={() => handleDelete(s.id)}
                    >
                      <Button size="small" danger icon={<Trash2 size={14} />} />
                    </Popconfirm>
                  </Space>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#64748b",
                    marginTop: 8,
                  }}
                >
                  <span>
                    <Users size={12} style={{ marginRight: 4 }} />
                    {s.booked_participants}/{s.maxParticipants}
                  </span>
                  <span>${parseFloat(s.price).toFixed(2)}</span>
                </div>
              </ScheduleCard>
            ))
          ) : (
            <EmptyStateContainer>
              <LordIcon
                src="https://cdn.lordicon.com/uoljexdg.json"
                trigger="in"
                colors="primary:#94a3b8"
                style={{ width: 64, height: 64 }}
              />
              <Text type="secondary">No schedules found.</Text>
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => onAdd(selectedDate || dayjs())}
                style={{ marginTop: 16 }}
              >
                Add Session
              </Button>
            </EmptyStateContainer>
          )}
        </ScheduleListArea>
      </ManagementContainer>
    );
  }
);

// --- MAIN DRAWER COMPONENT ---

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
  const [editingGroup, setEditingGroup] = useState(null);

  const [viewState, setViewState] = useState({
    currentMonth: dayjs(),
    selectedDate: null,
    groupFilter: undefined,
  });

  const updateViewState = useCallback(
    (updates) => setViewState((prev) => ({ ...prev, ...updates })),
    []
  );

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
      setEditingGroup(null);
      setPrefillDate(null);
      setActiveView("manage");
      setViewState({
        currentMonth: dayjs(),
        selectedDate: null,
        groupFilter: undefined,
      });
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
  }, [activeView, editingSchedule, prefillDate]);

  const handleFormSuccess = () => {
    onSchedulesUpdate();
    if (classData && !startInEditMode) {
      setActiveView("manage");
      setPrefillDate(null);
    } else {
      onClose();
    }
  };

  const handleEditGroup = useCallback(
    (groupName, sampleSchedule = null) => {
      setEditingGroup(groupName);
      setActiveView("group-form");
      form.resetFields();
      if (sampleSchedule) {
        form.setFieldsValue({
          duration: sampleSchedule.duration,
          price: sampleSchedule.price,
          maxParticipants: sampleSchedule.maxParticipants,
          minParticipants: sampleSchedule.minParticipants || 1,
        });
      } else {
        form.setFieldsValue({
          duration: 60,
          price: "0.00",
          maxParticipants: 10,
          minParticipants: 1,
        });
      }
    },
    [form]
  );

  const handleGroupSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      setIsLoading(true);
      const updates = {
        price: parseFloat(values.price).toFixed(2),
        maxParticipants: values.maxParticipants,
        minParticipants: values.minParticipants || 1,
        duration: values.duration,
      };
      await scheduleService.groupUpdate({
        option_id: optionId,
        name: editingGroup,
        updates: updates,
      });
      message.success(`Group '${editingGroup}' updated successfully.`);
      onSchedulesUpdate();
      setActiveView("manage");
      setEditingGroup(null);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
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
        await scheduleService.updateSchedule(editingSchedule.id, scheduleData);
        message.success("Schedule updated successfully.");
      } else {
        await scheduleService.createSchedule(scheduleData);
        message.success("Schedule created successfully.");
      }
      handleFormSuccess();
    } catch (errorInfo) {
      message.error(getErrorMessage(errorInfo));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    try {
      const values = { ...formData, ...bulkForm.getFieldsValue(true) };
      if (!values.date_range || !values.date_range[0]) {
        message.error("Date range is missing.");
        return;
      }
      setIsBulkLoading(true);
      const payload = {
        name: values.name,
        option: optionId,
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        days_of_week: values.days_of_week,
        times: values.times.map((t) => t.format("HH:mm")),
        duration: values.commonDetails?.duration,
        price: parseFloat(values.commonDetails?.price || 0).toFixed(2),
        maxParticipants: values.commonDetails?.maxParticipants,
        minParticipants: values.commonDetails?.minParticipants || 1,
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
      if (bulkCurrentStep === 0)
        await bulkForm.validateFields([
          "name",
          "date_range",
          "days_of_week",
          "times",
        ]);
      else if (bulkCurrentStep === 1)
        await bulkForm.validateFields([
          ["commonDetails", "duration"],
          ["commonDetails", "price"],
          ["commonDetails", "maxParticipants"],
        ]);
      setFormData((prev) => ({ ...prev, ...bulkForm.getFieldsValue(true) }));
      setBulkCurrentStep(bulkCurrentStep + 1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkBack = () => {
    if (bulkCurrentStep > 0) setBulkCurrentStep(bulkCurrentStep - 1);
  };

  // --- REDESIGNED FORM RENDERERS ---

  const renderGroupEditForm = () => (
    <ContentPadding>
      <Form form={form} layout="vertical">
        <ModernFormLayout>
          <FormSection>
            <SectionHeader>
              <h4>
                <Edit3 size={16} /> Edit Group Settings: {editingGroup}
              </h4>
              <p>
                Updating these settings will affect all future sessions in this
                group.
              </p>
            </SectionHeader>

            <TwoColGrid>
              <FieldContainer>
                <Label>
                  <DollarSign /> Price (CAD)
                  <Tooltip title="The cost per person to attend.">
                    <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                  </Tooltip>
                </Label>
                <CompactFormItem name="price" rules={[{ required: true }]}>
                  <StyledInput prefix="$" type="number" step="0.01" />
                </CompactFormItem>
              </FieldContainer>
              <FieldContainer>
                <Label>
                  <Users /> Max Capacity
                  <Tooltip title="Maximum number of attendees allowed.">
                    <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                  </Tooltip>
                </Label>
                <CompactFormItem
                  name="maxParticipants"
                  rules={[{ required: true }]}
                >
                  <StyledInputNumber inputMode="numeric" />
                </CompactFormItem>
              </FieldContainer>
            </TwoColGrid>

            <FieldContainer>
              <Label>
                <Hourglass size={14} /> Duration
                <Tooltip title="How long the session lasts.">
                  <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                </Tooltip>
              </Label>
              <CompactFormItem name="duration" rules={[{ required: true }]}>
                <DurationPicker />
              </CompactFormItem>
            </FieldContainer>
          </FormSection>
        </ModernFormLayout>
      </Form>
    </ContentPadding>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModernFormLayout>
            <FormSection>
              <SectionHeader>
                <h4>
                  <Calendar size={18} /> Schedule & Timing
                </h4>
                <p>When is this session taking place?</p>
              </SectionHeader>

              <TwoColGrid>
                <FieldContainer>
                  <Label>Date</Label>
                  <CompactFormItem name="date" rules={[{ required: true }]}>
                    {isMobile ? (
                      <MobileDatePicker disabledDate={(c) => c && c < dayjs().startOf("day")} />
                    ) : (
                      <StyledDatePicker
                        disabledDate={(c) => c && c < dayjs().startOf("day")}
                        inputReadOnly
                      />
                    )}
                  </CompactFormItem>
                </FieldContainer>
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
                        inputReadOnly
                      />
                    )}
                  </CompactFormItem>
                </FieldContainer>
              </TwoColGrid>

              <FieldContainer>
                <Label>
                  Duration
                  <Tooltip title="The total length of the session in minutes.">
                    <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                  </Tooltip>
                </Label>
                <CompactFormItem name="duration" rules={[{ required: true }]}>
                  <DurationPicker disabled={isLoading} />
                </CompactFormItem>
              </FieldContainer>
            </FormSection>

            <FormSection>
              <SectionHeader>
                <h4>
                  <Type size={18} /> Identification
                </h4>
                <p>Helpful for grouping similar sessions together.</p>
              </SectionHeader>
              <FieldContainer>
                <Label>
                  Session Name <HelpLabel>(Optional)</HelpLabel>
                </Label>
                <CompactFormItem name="name">
                  <StyledInput placeholder="e.g., Morning Pottery Class" />
                </CompactFormItem>
              </FieldContainer>
            </FormSection>
          </ModernFormLayout>
        );
      case 1:
        return (
          <ModernFormLayout>
            <FormSection>
              <SectionHeader>
                <h4>
                  <DollarSign size={18} /> Pricing & Capacity
                </h4>
                <p>Set the financials and limits for this session.</p>
              </SectionHeader>

              <TwoColGrid>
                <FieldContainer>
                  <Label>
                    Price (CAD) <HelpLabel>0 for free</HelpLabel>
                  </Label>
                  <CompactFormItem name="price" rules={[{ required: true }]}>
                    <StyledInput prefix="$" type="number" step="0.01" min="0" />
                  </CompactFormItem>
                </FieldContainer>
                <FieldContainer>
                  <Label>
                    Total Capacity
                    <Tooltip title="The maximum number of people who can book this session.">
                      <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                    </Tooltip>
                  </Label>
                  <CompactFormItem
                    name="maxParticipants"
                    rules={[{ required: true }]}
                  >
                    <StyledInputNumber min={1} inputMode="numeric" />
                  </CompactFormItem>
                </FieldContainer>
              </TwoColGrid>

              <FieldContainer>
                <Label>
                  Minimum Participants{" "}
                  <Tooltip title="The minimum number of participants required for a person to book this session.">
                    <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                  </Tooltip>
                </Label>
                <CompactFormItem
                  name="minParticipants"
                  rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                      validator(_, val) {
                        return !val || val <= getFieldValue("maxParticipants")
                          ? Promise.resolve()
                          : Promise.reject(new Error("Min > Max"));
                      },
                    }),
                  ]}
                >
                  <StyledInputNumber min={1} />
                </CompactFormItem>
              </FieldContainer>
            </FormSection>
          </ModernFormLayout>
        );
      case 2:
        return (
          <ModernFormLayout>
            <FormSection>
              <SectionHeader>
                <h4>
                  <CheckCircle size={18} /> Review Details
                </h4>
                <p>Verify everything is correct before saving.</p>
              </SectionHeader>
              <ReviewCard>
                <ReviewRow>
                  <span className="label">Name</span>
                  <span className="value">{formData.name || "N/A"}</span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">Date</span>
                  <span className="value">
                    <Calendar size={14} />
                    {formData.date?.format("MMM D, YYYY")}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">Time</span>
                  <span className="value">
                    <Clock size={14} />
                    {formData.time?.format("h:mm A")}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">Duration</span>
                  <span className="value">
                    {formatDuration(formData.duration)}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">Price</span>
                  <span className="value">
                    <DollarSign size={14} />
                    {formData.price}
                  </span>
                </ReviewRow>
                <ReviewRow>
                  <span className="label">Capacity</span>
                  <span className="value">
                    <Users size={14} />
                    {formData.maxParticipants} spots
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

  const renderSingleSessionStepperForm = () => (
    <>
      {!isMobile && (
        <ModernSteps
          size="small"
          current={currentStep}
          items={[
            { title: "Time & Date", icon: <Calendar size={16} /> },
            { title: "Pricing", icon: <DollarSign size={16} /> },
            { title: "Review", icon: <CheckCircle size={16} /> },
          ]}
        />
      )}
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

  const renderBulkForm = () => {
    const commonDetails = formData.commonDetails || {};

    return (
      <>
        {!isMobile && (
          <ModernSteps
            size="small"
            current={bulkCurrentStep}
            items={[
              { title: "Setup", icon: <Calendar size={16} /> },
              { title: "Details", icon: <DollarSign size={16} /> },
              { title: "Review", icon: <CheckCircle size={16} /> },
            ]}
          />
        )}
        <ContentPadding>
          <Form
            form={bulkForm}
            layout="vertical"
            onValuesChange={(c) => setFormData({ ...formData, ...c })}
          >
            {bulkCurrentStep === 0 && (
              <ModernFormLayout>
                <FormSection>
                  <SectionHeader>
                    <h4>
                      <Copy size={18} /> Bulk Generation
                    </h4>
                    <p>
                      Create multiple sessions at once based on a repeating
                      pattern.
                    </p>
                  </SectionHeader>
                  <FieldContainer>
                    <Label>
                      Group Name <HelpLabel>Required for bulk</HelpLabel>
                      <Tooltip title="A unique name to identify this batch of schedules (e.g. 'Summer Bootcamp').">
                        <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                      </Tooltip>
                    </Label>
                    <CompactFormItem
                      name="name"
                      rules={[
                        { required: true, message: "Group name is required" },
                      ]}
                    >
                      <StyledInput placeholder="e.g. Summer Drop-ins" />
                    </CompactFormItem>
                  </FieldContainer>
                  <FieldContainer>
                    <Label>Date Range</Label>
                    <CompactFormItem
                      name="date_range"
                      rules={[{ required: true }]}
                    >
                      {isMobile ? (
                        <MobileRangePicker />
                      ) : (
                        <StyledRangePicker inputReadOnly />
                      )}
                    </CompactFormItem>
                  </FieldContainer>
                </FormSection>

                <FormSection>
                  <SectionHeader>
                    <h4>
                      <ListChecks size={18} /> Pattern
                    </h4>
                  </SectionHeader>
                  <FieldContainer>
                    <Label>Repeat on Days</Label>
                    <CompactFormItem
                      name="days_of_week"
                      rules={[{ required: true }]}
                    >
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
                                rules={[{ required: true }]}
                                style={{ flex: 1 }}
                              >
                                {isMobile ? (
                                  <MobileTimePicker />
                                ) : (
                                  <StyledTimePicker
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
              </ModernFormLayout>
            )}

            {bulkCurrentStep === 1 && (
              <ModernFormLayout>
                <FormSection>
                  <SectionHeader>
                    <h4>
                      <DollarSign size={18} /> Common Details
                    </h4>
                    <p>These settings apply to every generated session.</p>
                  </SectionHeader>

                  <TwoColGrid>
                    <FieldContainer>
                      <Label>
                        Price (CAD)
                        <Tooltip title="Price per attendee.">
                          <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                        </Tooltip>
                      </Label>
                      <CompactFormItem
                        name={["commonDetails", "price"]}
                        rules={[{ required: true }]}
                      >
                        <StyledInput prefix="$" type="number" step="0.01" />
                      </CompactFormItem>
                    </FieldContainer>
                    <FieldContainer>
                      <Label>
                        Max Capacity
                        <Tooltip title="Maximum attendees allowed per session.">
                          <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                        </Tooltip>
                      </Label>
                      <CompactFormItem
                        name={["commonDetails", "maxParticipants"]}
                        rules={[{ required: true }]}
                      >
                        <StyledInputNumber min={1} inputMode="numeric" />
                      </CompactFormItem>
                    </FieldContainer>
                  </TwoColGrid>
                  <FieldContainer>
                    <Label>Duration</Label>
                    <CompactFormItem
                      name={["commonDetails", "duration"]}
                      rules={[{ required: true }]}
                    >
                      <DurationPicker disabled={isBulkLoading} />
                    </CompactFormItem>
                  </FieldContainer>
                  <FieldContainer>
                    <Label>
                      Min Participants
                      <Tooltip title="The minimum number of bookings required for this session to go ahead. If not met, you might need to cancel.">
                        <HelpCircle size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                      </Tooltip>
                    </Label>
                    <CompactFormItem
                      name={["commonDetails", "minParticipants"]}
                    >
                      <StyledInputNumber min={1} />
                    </CompactFormItem>
                  </FieldContainer>
                </FormSection>
              </ModernFormLayout>
            )}

            {bulkCurrentStep === 2 && (
              <ModernFormLayout>
                <FormSection>
                  <SectionHeader>
                    <h4>
                      <CheckCircle size={18} /> Summary
                    </h4>
                    <p>Ready to generate these schedules?</p>
                  </SectionHeader>
                  <ReviewCard>
                    <ReviewRow>
                      <span className="label">Pattern</span>
                      <span className="value">
                        {formData.days_of_week
                          ?.map((d) => dayLabels[d])
                          .join(", ")}
                      </span>
                    </ReviewRow>
                    <ReviewRow>
                      <span className="label">Times</span>
                      <span className="value">
                        {(formData.times || [])
                          .map((t) => t.format("h:mm A"))
                          .join(", ")}
                      </span>
                    </ReviewRow>
                    <ReviewRow>
                      <span className="label">Date Range</span>
                      <span className="value">
                        {formData.date_range?.[0]?.format("MMM D")} -{" "}
                        {formData.date_range?.[1]?.format("MMM D, YYYY")}
                      </span>
                    </ReviewRow>
                    <ReviewRow>
                      <span className="label">Price</span>
                      <span className="value">${commonDetails.price}</span>
                    </ReviewRow>
                    <ReviewRow>
                      <span className="label">Capacity</span>
                      <span className="value">
                        {commonDetails.maxParticipants} spots
                      </span>
                    </ReviewRow>
                  </ReviewCard>
                </FormSection>
              </ModernFormLayout>
            )}
          </Form>
        </ContentPadding>
      </>
    );
  };

  const renderFormContent = () => {
    return editingSchedule ? (
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
    );
  };

  const handleAddNew = useCallback(
    (date) => {
      setEditingSchedule(null);
      setPrefillDate(
        date && dayjs.isDayjs(date) ? date : viewState.selectedDate
      );
      setActiveView("form");
    },
    [viewState.selectedDate]
  );

  const handleEdit = useCallback((schedule) => {
    setEditingSchedule(schedule);
    setActiveView("form");
  }, []);

  const renderContent = () => {
    if (activeView === "manage")
      return (
        <ScheduleManagementView
          classData={classData}
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onEditGroup={handleEditGroup}
          onSchedulesUpdate={onSchedulesUpdate}
          currentMonth={viewState.currentMonth}
          selectedDate={viewState.selectedDate}
          groupFilter={viewState.groupFilter}
          onViewStateChange={updateViewState}
        />
      );
    if (activeView === "form") return renderFormContent();
    if (activeView === "group-form") return renderGroupEditForm();
    return null;
  };

  const renderFooterButtons = (isMobileLayout = false) => {
    const btnStyle = isMobileLayout ? { height: 44 } : { height: 40 };

    if (activeView === "manage") {
      return (
        <Button
          key="add"
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => handleAddNew(null)}
          block={isMobileLayout}
          style={btnStyle}
        >
          Add New Schedule
        </Button>
      );
    }
    if (activeView === "group-form") {
      return (
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <Button
            onClick={() => setActiveView("manage")}
            disabled={isLoading}
            block={isMobileLayout}
            style={btnStyle}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleGroupSubmit}
            loading={isLoading}
            block={isMobileLayout}
            style={{ ...btnStyle, flex: 1 }}
          >
            Update Group
          </Button>
        </div>
      );
    }
    // Bulk Form Footer
    if (activeTab === "bulk" && !editingSchedule) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            gap: 12,
          }}
        >
          {bulkCurrentStep === 0 ? (
            <Button
              onClick={() => setActiveView("manage")}
              style={btnStyle}
              icon={<List size={16} />}
            >
              {isMobileLayout ? "List" : "Back to List"}
            </Button>
          ) : (
            <Button
              onClick={handleBulkBack}
              disabled={isBulkLoading}
              style={btnStyle}
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
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleBulkSubmit}
              loading={isBulkLoading}
              style={btnStyle}
            >
              Generate
            </Button>
          )}
        </div>
      );
    }
    // Single Form Footer
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
          >
            {editingSchedule ? "Save Changes" : "Create"}
          </Button>
        )}
      </div>
    );
  };

  const getTitle = () => {
    if (activeView === "form")
      return `${editingSchedule ? "Edit" : "New"} Schedule`;
    if (activeView === "group-form") return "Edit Group";
    return `Manage Schedules`;
  };

  return (
    <ConfigProvider theme={appTheme}>
      {!isMobile && (
        <DesktopModal
          centered
          title={getTitle()}
          open={open}
          onCancel={onClose}
          width={activeView === "manage" ? "800px" : "720px"}
          destroyOnClose
          maskClosable={!isLoading && !isBulkLoading}
          closable={!isLoading && !isBulkLoading}
          footer={renderFooterButtons(false)}
        >
          <AnimatedModalContent>{renderContent()}</AnimatedModalContent>
        </DesktopModal>
      )}
      {isMobile && (
        <Drawer.Root
          open={open}
          onOpenChange={(o) => {
            if (!o) onClose();
          }}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <MobileHeader>
                <MobileTitle>{`Manage Schedules`}</MobileTitle>
                <CloseButton icon={<X size={20} />} onClick={onClose} />
              </MobileHeader>
              <MobileContent>
                <ScheduleManagementView
                  classData={classData}
                  onAdd={handleAddNew}
                  onEdit={handleEdit}
                  onEditGroup={handleEditGroup}
                  onSchedulesUpdate={onSchedulesUpdate}
                  currentMonth={viewState.currentMonth}
                  selectedDate={viewState.selectedDate}
                  groupFilter={viewState.groupFilter}
                  onViewStateChange={updateViewState}
                />
              </MobileContent>
              <MobileFooter>
                <Button
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
          <Drawer.NestedRoot
            open={activeView === "form" || activeView === "group-form"}
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
                  {activeView === "group-form"
                    ? renderGroupEditForm()
                    : renderFormContent()}
                </MobileContent>
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