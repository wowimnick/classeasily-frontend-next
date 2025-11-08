"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import dayjs from "dayjs";
import styled from "styled-components";
import { Drawer as VaulDrawer } from "vaul";
import { theme as appTheme } from "@/components/theme";
import { courseService, scheduleService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { motion, AnimatePresence } from "framer-motion";

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
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
  height: 96%;
  max-height: 96vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
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
`;

const DrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  background: #f8fafc;
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
    height: 90vh;
    max-height: 90vh;
    display: flex;
    padding: 0 !important;
    flex-direction: column;
  }
  .ant-modal-header {
    padding: 20px 24px;
    flex-shrink: 0;
    background: white;
  }
  .ant-modal-body {
    padding: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .ant-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    background: white;
    flex-shrink: 0;
    margin: 0 !important;
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
    font-size: ${(props) => props.theme.token.fontSizeSM || "12px"};
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
`;

const StepTitle = styled(Title)`
  margin-bottom: ${(props) => props.theme.token.marginXS}px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 24px !important;
  font-weight: 700 !important;
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: 15px;
  line-height: 1.6;
`;

const FormSection = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 15px;
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

const StyledInput = styled(Input)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: ${(props) => props.theme.token.controlHeight}px !important;
    padding: 0 ${(props) => props.theme.token.controlPaddingHorizontal}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: ${(props) => props.theme.token.controlHeight - 2}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }
`;

const StyledInputNumber = styled(InputNumber)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  width: 100%;
  .ant-input-number-input-wrap,
  .ant-input-number-input {
    height: 100% !important;
    display: flex;
    align-items: center;
    font-size: ${(props) => props.theme.token.fontSize}px !important;
  }
  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const StyledTimePicker = styled(TimePicker)`
  width: 100%;
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  .ant-picker-input > input {
    font-size: ${(props) => props.theme.token.fontSize}px;
  }
  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  width: 100%;
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  .ant-picker-input > input {
    font-size: ${(props) => props.theme.token.fontSize}px;
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
  flex: 1;
  min-width: 80px;
  height: 44px;
  border-radius: 8px;
  font-weight: 500;
  &.ant-btn-primary {
    background: ${(props) => props.theme.token.colorPrimary};
  }
`;

const ScheduleList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
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
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-weight: 500;
`;

const InfoValue = styled(Text)`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  padding-top: 100px;
`;

const StepsWrapper = styled.div`
  max-width: 600px;
  margin: 16px auto;
  padding: 8px 16px;

  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  position: absolute;
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
`;

const ContentPadding = styled.div`
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const DetailedViewContainer = styled.div`
  padding: 24px;
`;

const DetailedHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
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
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
`;

const MetricItem = styled.div`
  flex: 1;
  min-width: 150px;
  text-align: center;
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 8px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
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
`;

const SessionsBreakdown = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
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
  max-width: 700px;
  margin: 0 auto;
`;

// ============= MAIN COMPONENT =============

const CourseScheduleDrawer = ({ open, onClose, classData }) => {
  const [form] = Form.useForm();
  const [view, setView] = useState("list");
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
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

  useEffect(() => {
    if (!open) {
      setView("list");
      setCurrentStep(0);
      setSelectedSchedule(null);
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
        // Group schedules by name, dates, time, etc., to combine multi-day courses
        const groupedSchedules = response.data.reduce((acc, schedule) => {
          const groupKey = `${schedule.name}-${schedule.start_date}-${schedule.end_date}-${schedule.time}-${schedule.duration}-${schedule.price}`;
          if (!acc[groupKey]) {
            acc[groupKey] = {
              ...schedule,
              ids: [schedule.id], // Store original IDs for deletion
              day: [schedule.day], // Start with an array of days
            };
          } else {
            acc[groupKey].ids.push(schedule.id);
            acc[groupKey].day.push(schedule.day);
            // Aggregate metrics
            acc[groupKey].booked_participants += schedule.booked_participants;
            acc[groupKey].total_revenue = (
              parseFloat(acc[groupKey].total_revenue) +
              parseFloat(schedule.total_revenue)
            ).toFixed(2);
            acc[groupKey].has_confirmed_bookings =
              acc[groupKey].has_confirmed_bookings ||
              schedule.has_confirmed_bookings;
          }
          return acc;
        }, {});

        // Convert grouped object back to an array and sort days
        const finalSchedules = Object.values(groupedSchedules).map(
          (schedule) => {
            const dayOrder = {
              Mon: 1,
              Tue: 2,
              Wed: 3,
              Thu: 4,
              Fri: 5,
              Sat: 6,
              Sun: 7,
            };
            // Sort days and join into a string like "Mon, Wed"
            schedule.day = schedule.day
              .sort((a, b) => dayOrder[a] - dayOrder[b])
              .join(", ");
            return schedule;
          }
        );
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
    const dayMap = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };
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
    const dayMap = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };
    // Ensure selectedDays is always an array of short day names ("Mon", "Tue", etc.)
    const shortSelectedDays = Array.isArray(selectedDays)
      ? selectedDays.map((d) => dayMap[d] || d)
      : [];

    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (shortSelectedDays.includes(current.format("ddd"))) {
        sessions.push(current.toDate());
      }
      current = current.add(1, "day");
    }
    return sessions;
  };

  const getCalendarDaysForSchedule = (startDate, endDate, selectedDays) => {
    const start = dayjs(startDate).startOf("month");
    const end = dayjs(endDate).endOf("month");
    const days = [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      days.push(current.toDate());
      current = current.add(1, "day");
    }

    return days;
  };

  const isSessionDate = (date, startDate, endDate, selectedDays) => {
    const d = dayjs(date);
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (d.isBefore(start) || d.isAfter(end)) return false;
    return selectedDays.includes(d.format("dddd"));
  };

  const handleDayToggle = (day) => {
    const newSelectedDays = formData.selectedDays?.includes(day)
      ? formData.selectedDays.filter((d) => d !== day)
      : [...(formData.selectedDays || []), day];
    const newSessionCount = calculateSessionCount(
      formData.startDate,
      formData.endDate,
      newSelectedDays
    );
    setFormData({
      ...formData,
      selectedDays: newSelectedDays,
      totalSessions: newSessionCount,
    });
    form.setFieldsValue({ selectedDays: newSelectedDays });
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const newSessionCount = calculateSessionCount(
        dates[0],
        dates[1],
        formData.selectedDays
      );
      setFormData({
        ...formData,
        startDate: dates[0],
        endDate: dates[1],
        totalSessions: newSessionCount,
      });
    } else {
      setFormData({
        ...formData,
        startDate: null,
        endDate: null,
        totalSessions: 0,
      });
    }
  };

  const validateStep = async (step) => {
    try {
      switch (step) {
        case 0:
          await form.validateFields([
            "name",
            "dateRange",
            "selectedDays",
            "time",
            "duration",
          ]);
          const [startDate, endDate] = form.getFieldValue("dateRange");
          const sessionCount = calculateSessionCount(
            startDate,
            endDate,
            form.getFieldValue("selectedDays")
          );
          setFormData({
            ...formData,
            name: form.getFieldValue("name"),
            startDate,
            endDate,
            selectedDays: form.getFieldValue("selectedDays"),
            time: form.getFieldValue("time"),
            duration: form.getFieldValue("duration"),
            totalSessions: sessionCount,
          });
          return true;
        case 1:
          await form.validateFields(["price", "maxParticipants"]);
          setFormData({
            ...formData,
            price: form.getFieldValue("price"),
            maxParticipants: form.getFieldValue("maxParticipants"),
          });
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
      if (!courseOption)
        throw new Error("Could not find a valid course option for this class.");

      const creationPromises = formData.selectedDays.map((day) => {
        const payload = {
          option: courseOption.optionId,
          name: formData.name,
          start_date: formData.startDate.format("YYYY-MM-DD"),
          end_date: formData.endDate.format("YYYY-MM-DD"),
          day: day.substring(0, 3),
          time: formData.time.format("HH:mm:ss"),
          duration: formData.duration,
          maxParticipants: formData.maxParticipants,
          price: parseFloat(formData.price),
          date: null,
        };
        return scheduleService.createSchedule(payload);
      });

      const results = await Promise.all(creationPromises);
      const successfulCreations = results.filter((res) => res.success).length;

      if (successfulCreations > 0) {
        message.success(
          `${successfulCreations} course schedule(s) created successfully!`
        );
        await fetchSchedules();
        setView("list");
      }
      if (successfulCreations < results.length)
        throw new Error("Some schedules could not be created.");
    } catch (error) {
      message.error(
        error.message || "Failed to create one or more course schedules"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (scheduleGroup) => {
    const scheduleIdsToDelete = scheduleGroup.ids;
    if (!scheduleIdsToDelete || scheduleIdsToDelete.length === 0) {
      message.error("No schedules to delete.");
      return;
    }

    try {
      const deletePromises = scheduleIdsToDelete.map((id) =>
        scheduleService.deleteSchedule(id)
      );
      const results = await Promise.all(deletePromises);

      const failedDeletions = results.filter((res) => !res?.success);
      if (failedDeletions.length > 0) {
        throw new Error(
          `Failed to delete ${failedDeletions.length} schedule(s).`
        );
      }

      message.success("Course schedule deleted successfully");
      await fetchSchedules();
    } catch (error) {
      message.error(error.message || "Failed to delete schedule");
    }
  };

  const renderStepContent = () => {
    const stepVariants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    };
    switch (currentStep) {
      case 0:
        const daysOfWeek = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        return (
          <FormSection
            key="step0"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <StepHeader>
              <StepTitle level={3}>Schedule Details</StepTitle>
              <StepDescription>
                Set up your course name and schedule
              </StepDescription>
            </StepHeader>
            <FormGroup>
              <FormLabel>
                <BookOpen size={16} />
                Course Schedule Name
              </FormLabel>
              <HelpText>
                <Info size={14} />
                e.g., "Spring 2025 Evening Sessions"
              </HelpText>
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: "Please enter a schedule name" },
                ]}
              >
                <StyledInput
                  placeholder="Enter course schedule name"
                  size="large"
                />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Calendar size={16} />
                Date Range
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Select the start and end dates
              </HelpText>
              <Form.Item
                name="dateRange"
                rules={[
                  { required: true, message: "Please select a date range" },
                ]}
              >
                <StyledRangePicker
                  format="MMMM D, YYYY"
                  size="large"
                  disabledDate={(c) => c && c < dayjs().startOf("day")}
                  onChange={handleDateRangeChange}
                />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <CalendarDays size={16} />
                Days of Week
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Select which days the course will meet
              </HelpText>
              <Form.Item
                name="selectedDays"
                rules={[
                  { required: true, message: "Please select at least one day" },
                ]}
              >
                <DaySelector>
                  {daysOfWeek.map((d) => (
                    <DayButton
                      key={d}
                      type={
                        formData.selectedDays?.includes(d)
                          ? "primary"
                          : "default"
                      }
                      onClick={() => handleDayToggle(d)}
                    >
                      {d.substring(0, 3)}
                    </DayButton>
                  ))}
                </DaySelector>
              </Form.Item>
            </FormGroup>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <FormGroup>
                <FormLabel>
                  <Clock size={16} />
                  Time
                </FormLabel>
                <Form.Item
                  name="time"
                  rules={[{ required: true, message: "Please select a time" }]}
                >
                  <StyledTimePicker
                    format="h:mm A"
                    use12Hours
                    size="large"
                    minuteStep={15}
                  />
                </Form.Item>
              </FormGroup>
              <FormGroup>
                <FormLabel>
                  <Clock size={16} />
                  Duration
                </FormLabel>
                <Form.Item
                  name="duration"
                  initialValue={60}
                  rules={[
                    { required: true, message: "Please select duration" },
                  ]}
                >
                  <StyledSelect size="large">
                    <Option value={15}>15 mins</Option>
                    <Option value={30}>30 mins</Option>
                    <Option value={45}>45 mins</Option>
                    <Option value={60}>1 hr</Option>
                    <Option value={90}>1.5 hrs</Option>
                    <Option value={120}>2 hrs</Option>
                    <Option value={180}>3 hrs</Option>
                    <Option value={240}>4 hrs</Option>
                  </StyledSelect>
                </Form.Item>
              </FormGroup>
            </div>
          </FormSection>
        );
      case 1:
        return (
          <FormSection
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <StepHeader>
              <StepTitle level={3}>Pricing & Capacity</StepTitle>
              <StepDescription>Set price and participants</StepDescription>
            </StepHeader>
            <FormGroup>
              <FormLabel>
                <DollarSign size={16} />
                Course Price
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Total price for all {formData.totalSessions} sessions
              </HelpText>
              <Form.Item
                name="price"
                rules={[
                  { required: true, message: "Please enter a price" },
                  {
                    validator: (_, v) =>
                      v && parseFloat(v) <= 0
                        ? Promise.reject("Price > 0")
                        : Promise.resolve(),
                  },
                ]}
              >
                <StyledInputNumber
                  min={0}
                  step={1}
                  precision={2}
                  prefix="$"
                  size="large"
                />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Users size={16} />
                Max Participants
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Max students per course
              </HelpText>
              <Form.Item
                name="maxParticipants"
                initialValue={10}
                rules={[
                  { required: true, message: "Please enter max participants" },
                  {
                    validator: (_, v) =>
                      v && v < 1 ? Promise.reject("Min 1") : Promise.resolve(),
                  },
                ]}
              >
                <StyledInputNumber min={1} max={100} size="large" />
              </Form.Item>
            </FormGroup>
          </FormSection>
        );
      case 2:
        return (
          <FormSection
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <StepHeader>
              <StepTitle level={3}>Review & Confirm</StepTitle>
              <StepDescription>Review details before creating</StepDescription>
            </StepHeader>
            <ReviewSection>
              <InfoRow>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{formData.name}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Date Range</InfoLabel>
                <InfoValue>
                  <Calendar size={16} />
                  {formData.startDate?.format("MMM D, YYYY")} -{" "}
                  {formData.endDate?.format("MMM D, YYYY")}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Days</InfoLabel>
                <InfoValue>
                  <CalendarDays size={16} />
                  {formData.selectedDays.join(", ")}
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
                <InfoValue>{formData.duration} mins</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Total Sessions</InfoLabel>
                <InfoValue>
                  <BookOpen size={16} />
                  {formData.totalSessions}
                </InfoValue>
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
                <InfoLabel>Max Participants</InfoLabel>
                <InfoValue>
                  <Users size={16} />
                  {formData.maxParticipants}
                </InfoValue>
              </InfoRow>
            </ReviewSection>
          </FormSection>
        );
      default:
        return null;
    }
  };

  const renderList = () => (
    <ContentPadding>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <GlobalLoaderWithoutInlineStyles />
        </div>
      ) : schedules.length > 0 ? (
        <ScheduleList>
          {schedules.map((scheduleGroup) => {
            const s = scheduleGroup;
            const selectedDays = s.day.split(", ");
            const startDate = dayjs(s.start_date);
            const endDate = dayjs(s.end_date);

            const sessionDates = generateSessionDates(
              s.start_date,
              s.end_date,
              selectedDays
            );
            const sessionPreview = sessionDates.slice(0, 4);

            return (
              <ScheduleCard
                key={s.name || s.ids.join("-")}
                onClick={() => setSelectedSchedule(s)}
                style={{ cursor: "pointer" }}
              >
                <ScheduleHeader>
                  <div>
                    <ScheduleTitle level={5}>
                      <CalendarDays size={16} />
                      {s.name || `Every ${s.day}`}
                    </ScheduleTitle>
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, letterSpacing: "0.2px" }}
                    >
                      {startDate.format("MMM D")} -{" "}
                      {endDate.format("MMM D, YYYY")}
                    </Text>
                  </div>
                  <ScheduleActions>
                    <Tooltip
                      title={
                        s.has_confirmed_bookings ? "Cannot delete" : "Delete"
                      }
                    >
                      <Popconfirm
                        title="Delete this course schedule?"
                        description="This will remove all recurring sessions for this course."
                        onConfirm={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(s);
                        }}
                        onCancel={(e) => e.stopPropagation()}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        disabled={s.has_confirmed_bookings}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 size={14} />}
                          disabled={s.has_confirmed_bookings}
                          onClick={(e) => e.stopPropagation()}
                          style={{ height: 32, width: 32 }}
                        />
                      </Popconfirm>
                    </Tooltip>
                  </ScheduleActions>
                </ScheduleHeader>

                <StatsRow>
                  <StatItem>
                    <StatValue>
                      <BookOpen size={16} />{" "}
                      {calculateSessionCount(
                        s.start_date,
                        s.end_date,
                        selectedDays.map((d) => dayjs().day(d).format("dddd"))
                      )}
                    </StatValue>
                    <StatLabel>Sessions</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>
                      <Users size={16} /> {s.booked_participants || 0}/
                      {s.maxParticipants}
                    </StatValue>
                    <StatLabel>Enrolled</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>
                      <TrendingUp size={16} /> $
                      {parseFloat(s.total_revenue || 0).toFixed(0)}
                    </StatValue>
                    <StatLabel>Revenue</StatLabel>
                  </StatItem>
                </StatsRow>

                <div style={{ padding: "12px 16px" }}>
                  <SessionsTitle
                    style={{ fontSize: "14px", margin: "0 0 8px 0" }}
                  >
                    Upcoming Sessions:
                  </SessionsTitle>
                  {sessionPreview.map((date, idx) => (
                    <SessionItem
                      key={idx}
                      $isPast={false}
                      $isToday={dayjs(date).isSame(dayjs(), "day")}
                      style={{
                        padding: "6px 8px",
                        marginBottom: "4px",
                        background: "transparent",
                        border: "none",
                      }}
                    >
                      <SessionDate style={{ fontSize: "13px" }}>
                        <Calendar size={14} />
                        {dayjs(date).format("ddd, MMM D, YYYY")}
                      </SessionDate>
                    </SessionItem>
                  ))}
                  {sessionDates.length > 4 && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        textAlign: "center",
                        marginTop: "8px",
                      }}
                    >
                      + {sessionDates.length - 4} more sessions
                    </Text>
                  )}
                </div>
              </ScheduleCard>
            );
          })}
        </ScheduleList>
      ) : (
        <Empty description={<span>No course schedules yet</span>} />
      )}
    </ContentPadding>
  );

  const renderDetailedView = () => {
    if (!selectedSchedule) return null;

    const selectedDays = selectedSchedule.day.split(", ");
    const sessionDates = generateSessionDates(
      selectedSchedule.start_date,
      selectedSchedule.end_date,
      selectedDays
    );
    const today = dayjs();

    return (
      <DetailedViewContainer>
        <DetailedHeader>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => setSelectedSchedule(null)}
              type="text"
            >
              Back to List
            </Button>
          </div>
          <DetailedTitle level={3}>
            <CalendarDays size={24} />
            {selectedSchedule.name || `Every ${selectedSchedule.day}`}
          </DetailedTitle>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {dayjs(selectedSchedule.start_date).format("MMMM D, YYYY")} -{" "}
            {dayjs(selectedSchedule.end_date).format("MMMM D, YYYY")}
          </Text>
        </DetailedHeader>

        <DetailedMetricsRow>
          <MetricItem>
            <MetricValue>
              <DollarSign size={22} />$
              {parseFloat(selectedSchedule.total_revenue || 0).toFixed(2)}
            </MetricValue>
            <MetricLabel>Total Revenue</MetricLabel>
          </MetricItem>
          <MetricItem>
            <MetricValue>
              <Users size={22} />
              {selectedSchedule.booked_participants || 0} /{" "}
              {selectedSchedule.maxParticipants}
            </MetricValue>
            <MetricLabel>Enrolled</MetricLabel>
          </MetricItem>
          <MetricItem>
            <MetricValue>
              <BookOpen size={22} />
              {sessionDates.length}
            </MetricValue>
            <MetricLabel>Total Sessions</MetricLabel>
          </MetricItem>
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
                    <Calendar size={16} />
                    {sessionDate.format("ddd, MMM D, YYYY")}
                    {selectedSchedule.time && (
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, marginLeft: 8 }}
                      >
                        at{" "}
                        {dayjs(selectedSchedule.time, "HH:mm:ss").format(
                          "h:mm A"
                        )}
                      </Text>
                    )}
                  </SessionDate>
                  <SessionBadge $isPast={isPast} $isToday={isToday}>
                    {isPast ? "Completed" : isToday ? "Today" : "Upcoming"}
                  </SessionBadge>
                </SessionItem>
              );
            })}
          </div>
        </SessionsBreakdown>

        <ReviewSection>
          <Title level={5} style={{ marginBottom: 16 }}>
            Course Details
          </Title>
          <InfoRow>
            <InfoLabel>Price per Participant</InfoLabel>
            <InfoValue>
              <DollarSign size={16} />$
              {parseFloat(selectedSchedule.price || 0).toFixed(2)}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Duration per Session</InfoLabel>
            <InfoValue>
              <Clock size={16} />
              {selectedSchedule.duration || 60} minutes
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Recurring Days</InfoLabel>
            <InfoValue>
              <Repeat size={16} />
              {selectedSchedule.day}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Capacity</InfoLabel>
            <InfoValue>
              <Users size={16} />
              {selectedSchedule.booked_participants || 0} /{" "}
              {selectedSchedule.maxParticipants}
            </InfoValue>
          </InfoRow>
        </ReviewSection>
      </DetailedViewContainer>
    );
  };

  const renderFooter = () => {
    if (view === "list" && !selectedSchedule) {
      if (isMobile) {
        return (
          <DrawerFooter>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setView("create")}
              style={{ width: "100%" }}
            >
              New Course Schedule
            </Button>
          </DrawerFooter>
        );
      }
      return [
        <Button
          key="new"
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setView("create")}
        >
          New Course Schedule
        </Button>,
      ];
    }

    if (view === "list" && selectedSchedule) {
      return null; // No footer in detailed view
    }

    if (view === "create") {
      const backButton = (
        <Button
          key="back"
          icon={<ChevronLeft size={16} />}
          onClick={handleBack}
          disabled={submitting}
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

      const createButton = (
        <Button
          key="create"
          type="primary"
          icon={<CheckCircle size={16} />}
          onClick={handleSubmit}
          loading={submitting}
        >
          Create Course
        </Button>
      );

      if (isMobile) {
        return (
          <DrawerFooter>
            <div>{currentStep > 0 && backButton}</div>
            {currentStep < 2 ? nextButton : createButton}
          </DrawerFooter>
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
          <div>{currentStep > 0 && backButton}</div>
          <div>{currentStep < 2 ? nextButton : createButton}</div>
        </div>
      );
    }

    return null;
  };

  const content = (
    <>
      {view === "list" && !selectedSchedule && renderList()}
      {view === "list" && selectedSchedule && renderDetailedView()}
      {view === "create" && (
        <>
          <StepsWrapper>
            <Steps
              size="small"
              current={currentStep}
              items={[
                { title: "Schedule", icon: <Calendar size={16} /> },
                { title: "Pricing", icon: <DollarSign size={16} /> },
                { title: "Review", icon: <CheckCircle size={16} /> },
              ]}
            />
          </StepsWrapper>
          <ContentWrapper>
            <StepContent>
              <ConfigProvider theme={appTheme}>
                <StyledForm
                  form={form}
                  layout="vertical"
                  onValuesChange={(c, v) => setFormData({ ...formData, ...v })}
                >
                  <AnimatePresence mode="wait">
                    {renderStepContent()}
                  </AnimatePresence>
                </StyledForm>
              </ConfigProvider>
            </StepContent>
          </ContentWrapper>
        </>
      )}
    </>
  );

  const title = (
    <Space>
      <BookOpen size={20} />
      <span>Course Schedules - {classData?.title}</span>
    </Space>
  );

  if (isMobile) {
    return (
      <ConfigProvider theme={appTheme}>
        <VaulDrawer.Root
          open={open}
          onOpenChange={(o) => !o && onClose()}
          dismissible={!loading && !submitting}
        >
          <VaulDrawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle level={4}>
                  {view === "list" && selectedSchedule
                    ? "Schedule Details"
                    : title}
                </DrawerTitle>
                <CloseButton
                  icon={<X size={20} />}
                  onClick={onClose}
                  disabled={submitting}
                />
              </DrawerHeader>
              <DrawerBody>{content}</DrawerBody>
              {renderFooter()}
            </StyledDrawerContent>
          </VaulDrawer.Portal>
        </VaulDrawer.Root>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={appTheme}>
      <StyledModal
        open={open}
        onCancel={onClose}
        closable={!submitting}
        width="80%"
        centered
        style={{ maxWidth: 800 }}
        title={view === "list" && selectedSchedule ? "Schedule Details" : title}
        footer={renderFooter()}
      >
        {content}
      </StyledModal>
    </ConfigProvider>
  );
};

export default CourseScheduleDrawer;
