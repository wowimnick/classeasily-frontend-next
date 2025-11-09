"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import dayjs from "dayjs";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { theme as appTheme } from "@/components/theme";
import { scheduleService } from "@/services/apiService";
import { Drawer } from "vaul";

const { Option } = Select;
const { Title, Text } = Typography;

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
  background: #f8fafc;
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
`;

const MobileTitle = styled(Title)`
  &.ant-typography {
    font-size: 18px;
    font-weight: 600;
    margin: 0 !important;
    color: #1f2937;
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

const MobileFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

// --- Desktop Modal Styles ---
const DesktopModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    overflow: auto;
    padding: 0;
    height: 80vh;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 0;
    flex-shrink: 0;
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
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .ant-modal-footer {
    padding: 12px 24px;
    margin-top: 0;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
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
    background: #f8fafc;
  }

  .ant-tabs-tabpane {
    height: 100%;
    padding: 0;
    overflow-y: auto;
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
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: calc(100% - 48px);
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  padding-top: 100px;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isSingleSession = optionType === "Single Session";
  const bulkFormDays = Form.useWatch("days_of_week", bulkForm) || [];

  useEffect(() => {
    if (!open) {
      form.resetFields();
      bulkForm.resetFields();
      setCurrentStep(0);
      setFormData({});
      return;
    }

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
        time: dayjs(editingSchedule.time, "HH:mm"),
        date: dayjs(editingSchedule.date),
      };
      form.setFieldsValue(valuesToSet);
      setFormData(valuesToSet); // Also populate formData for review screen
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
  }, [editingSchedule, open, form, bulkForm]);

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

      await onSubmit(editingSchedule ? "edit" : "add", scheduleData);
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

  // --- Stepper Logic ---
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

  const NoMarginFormItem = (props) => (
    <Form.Item {...props} style={{ marginBottom: 0 }} />
  );

  const renderStepContent = () => {
    const stepVariants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    };
    switch (currentStep) {
      case 0:
        return (
          <FormSection
            key="step0"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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
          <FormSection
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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
          <FormSection
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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
            <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
          </Form>
        </StepContent>
      </ContentWrapper>
    </>
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
        <Form.Item name="commonDetails" noStyle>
          <FormGrid>
            {/* Form content remains the same, just wrapped */}
            <FormGroup>
              <FormLabel>
                <Edit3 /> Duration
              </FormLabel>
              <NoMarginFormItem name={["commonDetails", "duration"]}>
                <StyledSelect>
                  <Option value={60}>1 hour</Option>
                  <Option value={90}>1.5 hours</Option>
                  <Option value={120}>2 hours</Option>
                </StyledSelect>
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <DollarSign /> Price (CAD)
              </FormLabel>
              <NoMarginFormItem name={["commonDetails", "price"]}>
                <StyledInput prefix="$" type="number" />
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Users /> Maximum Capacity
              </FormLabel>
              <NoMarginFormItem name={["commonDetails", "maxParticipants"]}>
                <StyledInputNumber style={{ width: "100%" }} />
              </NoMarginFormItem>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Users /> Minimum Participants
              </FormLabel>
              <NoMarginFormItem name={["commonDetails", "minParticipants"]}>
                <StyledInputNumber style={{ width: "100%" }} />
              </NoMarginFormItem>
            </FormGroup>
          </FormGrid>
        </Form.Item>
      </Form>
    </FormContainer>
  );

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
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    );
  };

  const renderFooterButtons = (isMobileLayout = false) => {
    // ---- BULK TAB ----
    if (activeTab === "bulk" && !editingSchedule) {
      const button = (
        <Button
          key="submit-bulk"
          type="primary"
          block={isMobileLayout}
          onClick={handleBulkSubmit}
          loading={isBulkLoading}
          style={isMobileLayout ? { height: 44 } : {}}
        >
          Generate Schedules
        </Button>
      );
      if (isMobileLayout) return button;
      return [
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        button,
      ];
    }

    // ---- SINGLE / EDIT TAB (STEPPER) ----
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
          <div>{currentStep > 0 && backButton}</div>
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
        <div>{currentStep > 0 && backButton}</div>
        <div>
          {currentStep < 2 ? (
            nextButton
          ) : (
            <>
              <Button key="cancel" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              {submitButton}
            </>
          )}
        </div>
      </div>
    );
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
          width="50vw"
          destroyOnClose
          maskClosable={!isLoading && !isBulkLoading}
          closable={!isLoading && !isBulkLoading}
          footer={renderFooterButtons(false)}
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
              {renderFormContent()}
              <MobileFooter>{renderFooterButtons(true)}</MobileFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </ConfigProvider>
  );
};

export default ScheduleEditDrawer;
