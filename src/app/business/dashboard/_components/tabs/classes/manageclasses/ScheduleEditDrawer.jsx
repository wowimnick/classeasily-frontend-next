"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, TimePicker, DatePicker, Switch, Button, ConfigProvider, InputNumber, Tabs, Typography, Tooltip,  } from 'antd';
import message from '@/lib/message';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Target,
  Edit3,
  Tag,
  ListChecks,
  ChevronsRight,
  PlusCircle,
  Copy,
  X,
  File,
  Type,
  Info,
  HelpCircle,
} from "lucide-react";
import dayjs from "dayjs";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";

const { Option } = Select;
const { Title } = Typography;

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

// Mobile Overlay Styles
const MobileOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1010;
  display: none;

  @media (max-width: 1024px) {
    display: block;
  }
`;

const MobileContainer = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: white;
  display: flex;
  flex-direction: column;
  z-index: 1011;

  @media (max-width: 1024px) {
    top: 8vh;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -20px 40px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 480px) {
    top: 10vh;
  }
`;

const DragHandle = styled(motion.div)`
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

  @media (min-width: 1025px) {
    display: none;
  }
`;

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
  height: 92vh;
  max-height: 92vh;
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

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const MobileTitle = styled(Title)`
  &.ant-typography {
    font-size: 18px;
    font-weight: 600;
    margin: 0 !important;
    color: #1f2937;

    @media (max-width: 768px) {
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

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
`;

const MobileFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

// Desktop Modal
const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    overflow: auto;
    padding: 0;
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 0;
  }

  .ant-modal-title {
    font-weight: 600;
    font-size: 18px;
  }

  .ant-modal-body {
    padding: 0;
    background: #fafbfc;
    max-height: 70vh;
    overflow: auto;
  }

  .ant-modal-footer {
    padding: 12px 24px;
    margin-top: 0;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  }

  .ant-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 24px;
    background: white;
    flex-shrink: 0;
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
    overflow: hidden;
    background: white;
  }

  .ant-tabs-tabpane {
    height: 100%;
    padding: 0;
    overflow-y: auto;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

// --- Redesigned Form Components for clarity ---
const FormContainer = styled.div`
  padding: 24px;
  height: 100%;
  overflow-y: auto;

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

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  span {
    padding: 0 16px;
    color: #475569;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      width: 18px;
      height: 18px;
      color: #ff385c;
    }
  }
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

// Form styling
const StyledInput = styled(Input)``;
const StyledSelect = styled(Select)``;
const StyledTimePicker = styled(TimePicker)``;
const StyledDatePicker = styled(DatePicker)``;
const StyledRangePicker = styled(DatePicker.RangePicker)``;
const StyledInputNumber = styled(InputNumber)``;

const StyledSwitch = styled(Switch)`
  &.ant-switch-checked {
    background: #ff385c;
  }
`;

const DaysContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
`;

const DayButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 8px;
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
`;

const SwitchLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
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

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(4px)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const mobileVariants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};

const ScheduleEditDrawer = ({
  open,
  onCancel,
  onSubmit,
  editingSchedule,
  optionId,
  optionType,
  form,
}) => {
  const [bulkForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isCourse = optionType === "Full Course";
  const isSingleSession = optionType === "Single Session";

  const singleFormDay = Form.useWatch("day", form);
  const bulkFormDays = Form.useWatch("days_of_week", bulkForm) || [];

  useEffect(() => {
    if (!open) {
      form.resetFields();
      bulkForm.resetFields();
      return;
    }

    setActiveTab(editingSchedule ? "single" : "single");
    form.resetFields();
    bulkForm.resetFields();

    if (editingSchedule) {
      const valuesToSet = {
        name: editingSchedule.name,
        price: editingSchedule.price?.toString(),
        maxParticipants: editingSchedule.maxParticipants,
        duration: editingSchedule.duration,
        minParticipants: editingSchedule.minParticipants || 1,
        day: editingSchedule.day || null,
      };
      if (editingSchedule.time)
        valuesToSet.time = dayjs(editingSchedule.time, "HH:mm");
      if (isSingleSession) {
        if (editingSchedule.date)
          valuesToSet.date = dayjs(editingSchedule.date);
      } else if (isCourse) {
        if (editingSchedule.start_date && editingSchedule.end_date) {
          valuesToSet.course_dates = [
            dayjs(editingSchedule.start_date),
            dayjs(editingSchedule.end_date),
          ];
        }
        valuesToSet.allow_late_enrollment =
          !!editingSchedule.allow_late_enrollment;
      }
      form.setFieldsValue(valuesToSet);
    } else {
      const defaultValues = {
        price: "0.00",
        duration: 60,
        maxParticipants: 10,
        minParticipants: 1,
        time: dayjs("09:00", "HH:mm"),
      };
      form.setFieldsValue(
        isCourse
          ? {
              ...defaultValues,
              course_dates: [dayjs(), dayjs().add(4, "week")],
              allow_late_enrollment: false,
              day: null,
            }
          : { ...defaultValues, date: dayjs() }
      );
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
  }, [editingSchedule, open, isCourse, isSingleSession, form, bulkForm]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);

      let scheduleData = {
        name: values.name,
        option: optionId,
        time: values.time.format("HH:mm"),
        duration: values.duration,
        price: parseFloat(values.price).toFixed(2),
        maxParticipants: values.maxParticipants,
        minParticipants: values.minParticipants || 1,
      };

      if (isSingleSession) {
        scheduleData.date = values.date.format("YYYY-MM-DD");
      } else if (isCourse) {
        scheduleData.day = values.day;
        scheduleData.start_date = values.course_dates[0].format("YYYY-MM-DD");
        scheduleData.end_date = values.course_dates[1].format("YYYY-MM-DD");
        scheduleData.allow_late_enrollment =
          values.allow_late_enrollment || false;
      } else {
        message.error("Invalid class type configuration.");
        setIsLoading(false);
        return;
      }
      await onSubmit(editingSchedule ? "edit" : "add", scheduleData);
    } catch (errorInfo) {
      if (errorInfo?.errorFields)
        message.error("Please review the form for errors.");
      else message.error(getErrorMessage(errorInfo));
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
        onSubmit("add-bulk", result.data);
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

  const NoMarginFormItem = (props) => (
    <Form.Item {...props} style={{ marginBottom: 0 }} />
  );

  const renderSingleForm = () => (
    <FormContainer>
      <Form form={form} layout="vertical" requiredMark="optional">
        <InfoBox>
          <Info />
          <InfoContent>
            {editingSchedule
              ? "You are editing an existing schedule. Changes will affect this schedule only."
              : isCourse
              ? "Create a recurring course that takes place on the same day each week for a set period."
              : "Create a single, one-time session for a specific date."}
          </InfoContent>
        </InfoBox>

        <FormGroup>
          <FormLabel>
            <Type /> Schedule Name{" "}
            <span style={{ fontWeight: 400, color: "#6b7280" }}>
              (Optional)
            </span>
            <Tooltip title="Use a name like 'Weekend Mornings' to group similar schedules together for easier management.">
              <HelpCircle size={14} className="tooltip-icon" />
            </Tooltip>
          </FormLabel>
          <HelpText>This name helps you organize your schedule list.</HelpText>
          <NoMarginFormItem name="name">
            <StyledInput
              placeholder="e.g., Morning Pottery"
              disabled={isLoading}
            />
          </NoMarginFormItem>
        </FormGroup>

        <SectionDivider>
          <span>
            <Calendar />
            {isCourse ? "Course Details" : "Session Details"}
          </span>
        </SectionDivider>

        {isCourse ? (
          <>
            <FormGroup>
              <FormLabel>
                <ListChecks /> Weekly Class Day
              </FormLabel>
              <HelpText>
                Select the day of the week this class will occur.
              </HelpText>
              <NoMarginFormItem
                name="day"
                rules={[{ required: true, message: "Please select a day." }]}
              >
                <DaysContainer>
                  {Object.entries(dayLabels).map(([key, label]) => (
                    <DayButton
                      key={key}
                      type={singleFormDay === key ? "primary" : "default"}
                      onClick={() =>
                        form.setFieldsValue({
                          day: singleFormDay === key ? null : key,
                        })
                      }
                      disabled={isLoading}
                    >
                      {label}
                    </DayButton>
                  ))}
                </DaysContainer>
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <ChevronsRight /> Course Start & End Dates
              </FormLabel>
              <HelpText>
                Pick the entire date range for the course. Sessions will only be
                created on the selected 'Weekly Class Day' within this range.
              </HelpText>
              <NoMarginFormItem
                name="course_dates"
                rules={[{ required: true, message: "Select a date range." }]}
              >
                <StyledRangePicker
                  style={{ width: "100%" }}
                  disabled={isLoading}
                  disabledDate={(c) => c && c < dayjs().startOf("day")}
                />
              </NoMarginFormItem>
            </FormGroup>
          </>
        ) : (
          <FormGroup>
            <FormLabel>
              <Calendar /> Session Date
            </FormLabel>
            <HelpText>
              Pick the specific date this single session will happen.
            </HelpText>
            <NoMarginFormItem
              name="date"
              rules={[{ required: true, message: "Please select a date." }]}
            >
              <StyledDatePicker
                style={{ width: "100%" }}
                disabled={isLoading}
                disabledDate={(c) => c && c < dayjs().startOf("day")}
              />
            </NoMarginFormItem>
          </FormGroup>
        )}

        <FormGrid>
          <FormGroup>
            <FormLabel>
              <Clock /> Start Time
            </FormLabel>
            <NoMarginFormItem
              name="time"
              rules={[{ required: true, message: "Select a start time." }]}
            >
              <StyledTimePicker
                use12Hours
                format="h:mm A"
                minuteStep={15}
                disabled={isLoading}
                style={{ width: "100%" }}
              />
            </NoMarginFormItem>
          </FormGroup>
          <FormGroup>
            <FormLabel>
              <Edit3 /> Duration
            </FormLabel>
            <NoMarginFormItem
              name="duration"
              rules={[{ required: true, message: "Set a duration." }]}
            >
              <StyledSelect
                placeholder="Select duration"
                disabled={isLoading}
                style={{ width: "100%" }}
              >
                <Option value={15}>15 minutes</Option>
                <Option value={30}>30 minutes</Option>
                <Option value={45}>45 minutes</Option>
                <Option value={60}>1 hour</Option>
                <Option value={75}>1 hour 15 minutes</Option>
                <Option value={90}>1.5 hours</Option>
                <Option value={105}>1 hour 45 minutes</Option>
                <Option value={120}>2 hours</Option>
                <Option value={135}>2 hours 15 minutes</Option>
                <Option value={150}>2.5 hours</Option>
                <Option value={180}>3 hours</Option>
                <Option value={240}>4 hours</Option>
                <Option value={300}>5 hours</Option>
                <Option value={360}>6 hours</Option>
                <Option value={480}>8 hours</Option>
              </StyledSelect>
            </NoMarginFormItem>
          </FormGroup>
        </FormGrid>

        <SectionDivider>
          <span>
            <Target />
            Pricing & Capacity
          </span>
        </SectionDivider>

        <FormGrid>
          <FormGroup>
            <FormLabel>
              <DollarSign /> Price (CAD)
            </FormLabel>
            <HelpText>Cost per student. Use 0 for a free class.</HelpText>
            <NoMarginFormItem
              name="price"
              rules={[{ required: true, message: "Set a price." }]}
            >
              <StyledInput
                prefix="$"
                type="number"
                step="0.01"
                min="0"
                disabled={isLoading}
              />
            </NoMarginFormItem>
          </FormGroup>
          <FormGroup>
            <FormLabel>
              <Users /> Maximum Capacity
            </FormLabel>
            <HelpText>The total number of spots available.</HelpText>
            <NoMarginFormItem
              name="maxParticipants"
              rules={[{ required: true, message: "Set capacity." }]}
            >
              <StyledInputNumber
                min={1}
                placeholder="e.g., 10"
                disabled={isLoading}
                style={{ width: "100%" }}
              />
            </NoMarginFormItem>
          </FormGroup>
        </FormGrid>

        <FormGroup>
          <FormLabel>
            <Users /> Minimum Participants
            <Tooltip title="The minimum number of participants required for a single booking. For example, if set to 2, a person must book for at least 2 people.">
              <HelpCircle size={14} className="tooltip-icon" />
            </Tooltip>
          </FormLabel>
          <HelpText>
            The minimum number of people required per booking.
          </HelpText>
          <NoMarginFormItem
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
          >
            <StyledInputNumber
              min={1}
              placeholder="e.g., 1"
              disabled={isLoading}
              style={{ width: "100%" }}
            />
          </NoMarginFormItem>
        </FormGroup>

        {isCourse && (
          <FormGroup>
            <SwitchContainer>
              <SwitchLabel>
                <FormLabel style={{ marginBottom: 0 }}>
                  <Tag /> Allow Late Enrollment
                  <Tooltip title="If enabled, students can join this course even after it has already started. Their price may be prorated depending on your business settings.">
                    <HelpCircle size={14} className="tooltip-icon" />
                  </Tooltip>
                </FormLabel>
                <HelpText style={{ margin: 0, paddingLeft: "24px" }}>
                  Let students join after the course start date.
                </HelpText>
              </SwitchLabel>
              <NoMarginFormItem
                name="allow_late_enrollment"
                valuePropName="checked"
                noStyle
              >
                <StyledSwitch disabled={isLoading} />
              </NoMarginFormItem>
            </SwitchContainer>
          </FormGroup>
        )}
      </Form>
    </FormContainer>
  );

  const renderBulkForm = () => (
    <FormContainer>
      <Form form={bulkForm} layout="vertical" requiredMark="optional">
        <InfoBox>
          <Copy />
          <InfoContent>
            Quickly generate many individual sessions over a period of time.
            This is perfect for drop-in classes.
          </InfoContent>
        </InfoBox>

        <SectionDivider>
          <span>Step 1: Set the Foundation</span>
        </SectionDivider>

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

        <SectionDivider>
          <span>Step 2: Define the Schedule Pattern</span>
        </SectionDivider>

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
                        style={{
                          height: 40,
                          width: 40,
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
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

        <SectionDivider>
          <span>Step 3: Set Common Details</span>
        </SectionDivider>

        <FormGrid>
          <FormGroup>
            <FormLabel>
              <Edit3 /> Duration
            </FormLabel>
            <NoMarginFormItem
              name={["commonDetails", "duration"]}
              rules={[{ required: true, message: "Set duration." }]}
            >
              <StyledSelect>
                <Option value={15}>15 minutes</Option>
                <Option value={30}>30 minutes</Option>
                <Option value={45}>45 minutes</Option>
                <Option value={60}>1 hour</Option>
                <Option value={75}>1 hour 15 minutes</Option>
                <Option value={90}>1.5 hours</Option>
                <Option value={105}>1 hour 45 minutes</Option>
                <Option value={120}>2 hours</Option>
                <Option value={135}>2 hours 15 minutes</Option>
                <Option value={150}>2.5 hours</Option>
                <Option value={180}>3 hours</Option>
                <Option value={240}>4 hours</Option>
                <Option value={300}>5 hours</Option>
                <Option value={360}>6 hours</Option>
                <Option value={480}>8 hours</Option>
              </StyledSelect>
            </NoMarginFormItem>
          </FormGroup>
          <FormGroup>
            <FormLabel>
              <DollarSign /> Price (CAD)
              <Tooltip title="Cost per student. Use 0 for a free class.">
                <HelpCircle size={14} className="tooltip-icon" />
              </Tooltip>
            </FormLabel>
            <NoMarginFormItem
              name={["commonDetails", "price"]}
              rules={[{ required: true, message: "Set price." }]}
            >
              <StyledInput prefix="$" type="number" step="0.01" min="0" />
            </NoMarginFormItem>
          </FormGroup>
          <FormGroup>
            <FormLabel>
              <Users /> Maximum Capacity
              <Tooltip title="The total number of spots available for each session.">
                <HelpCircle size={14} className="tooltip-icon" />
              </Tooltip>
            </FormLabel>
            <NoMarginFormItem
              name={["commonDetails", "maxParticipants"]}
              rules={[{ required: true, message: "Set capacity." }]}
            >
              <StyledInputNumber
                min={1}
                placeholder="e.g., 10"
                style={{ width: "100%" }}
              />
            </NoMarginFormItem>
          </FormGroup>
          <FormGroup>
            <FormLabel>
              <Users /> Minimum Participants
              <Tooltip title="The minimum number of participants required for a single booking. For example, if set to 2, a person must book for at least 2 people.">
                <HelpCircle size={14} className="tooltip-icon" />
              </Tooltip>
            </FormLabel>
            <NoMarginFormItem
              name={["commonDetails", "minParticipants"]}
              rules={[
                { required: true, message: "Set min participants." },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      value <=
                        getFieldValue(["commonDetails", "maxParticipants"])
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Min cannot exceed Max Capacity.")
                    );
                  },
                }),
              ]}
              dependencies={[["commonDetails", "maxParticipants"]]}
            >
              <StyledInputNumber
                min={1}
                placeholder="e.g., 1"
                style={{ width: "100%" }}
              />
            </NoMarginFormItem>
          </FormGroup>
        </FormGrid>
      </Form>
    </FormContainer>
  );

  const tabItems = [
    {
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <File size={14} />
          <span>Single</span>
        </div>
      ),
      key: "single",
      children: renderSingleForm(),
      disabled: !!editingSchedule,
    },
    ...(!editingSchedule && isSingleSession
      ? [
          {
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Copy size={14} />
                <span>Bulk Create</span>
              </div>
            ),
            key: "bulk",
            children: renderBulkForm(),
          },
        ]
      : []),
  ];

  const renderFormContent = () => {
    if (editingSchedule) {
      return renderSingleForm();
    } else {
      return (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      );
    }
  };

  const renderMobileFooterButton = () => {
    if (editingSchedule || activeTab === "single") {
      return (
        <Button
          type="primary"
          block
          onClick={handleSubmit}
          loading={isLoading}
          style={{
            height: 44,
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
          }}
        >
          {editingSchedule ? "Save Changes" : "Create Schedule"}
        </Button>
      );
    } else if (activeTab === "bulk") {
      return (
        <Button
          type="primary"
          block
          onClick={handleBulkSubmit}
          loading={isBulkLoading}
          style={{
            height: 44,
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
          }}
        >
          Generate Schedules
        </Button>
      );
    }
    return null;
  };

  const renderDesktopFooterButtons = () => {
    if (editingSchedule || activeTab === "single") {
      return [
        <Button key="cancel" onClick={onCancel} style={{ borderRadius: 8 }}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={isLoading}
          style={{ borderRadius: 8 }}
        >
          {editingSchedule ? "Save Changes" : "Create Schedule"}
        </Button>,
      ];
    } else if (activeTab === "bulk") {
      return [
        <Button key="cancel" onClick={onCancel} style={{ borderRadius: 8 }}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleBulkSubmit}
          loading={isBulkLoading}
          style={{ borderRadius: 8 }}
        >
          Generate Schedules
        </Button>,
      ];
    }
    return [
      <Button key="cancel" onClick={onCancel} style={{ borderRadius: 8 }}>
        Cancel
      </Button>,
    ];
  };

  return (
    <ConfigProvider theme={appTheme}>
      {/* Desktop Modal */}
      {!isMobile && (
        <DesktopModal
          centered
          title={`${editingSchedule ? "Edit" : "Create"} Schedule`}
          open={open}
          onCancel={onCancel}
          width="30vw"
          destroyOnClose
          maskClosable={!isLoading && !isBulkLoading}
          closable={!isLoading && !isBulkLoading}
          footer={renderDesktopFooterButtons()}
        >
          {renderFormContent()}
        </DesktopModal>
      )}

      {/* Mobile Vaul Drawer */}
      {isMobile && (
        <Drawer.Root
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading && !isBulkLoading) {
              onCancel();
            }
          }}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />

              <MobileHeader>
                <MobileTitle>
                  {editingSchedule ? "Edit" : "Create"} Schedule
                </MobileTitle>
                <CloseButton
                  icon={<X size={20} />}
                  onClick={onCancel}
                  disabled={isLoading || isBulkLoading}
                />
              </MobileHeader>

              <ScrollableContent>{renderFormContent()}</ScrollableContent>

              <MobileFooter>{renderMobileFooterButton()}</MobileFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </ConfigProvider>
  );
};

export default ScheduleEditDrawer;
