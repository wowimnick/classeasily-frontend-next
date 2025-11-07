"use client";

import React, { useEffect, useRef } from "react";
import {
  Form,
  Select,
  InputNumber,
  Typography,
  ConfigProvider,
  Segmented,
  Button,
  Switch,
  Tooltip,
} from "antd";
import styled from "styled-components";
import {
  Package,
  UserCheck,
  Info,
  FileText,
  Percent,
  Tag,
  Settings,
  Clock,
  Book,
  Calendar,
  AlertCircle,
  Ban,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // ADDED: AnimatePresence
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";

const { Option } = Select;
const { Title, Text } = Typography;

const BookingTypeToggle = styled(Button.Group)`
  display: flex;
  width: 100%;

  .ant-btn {
    flex: 1;
    height: 40px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:not(.ant-btn-primary) {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: ${(props) => props.theme.token.colorText};

      &:hover {
        background: #f1f5f9;
        border-color: ${(props) => props.theme.token.colorPrimary};
        color: ${(props) => props.theme.token.colorPrimary};
      }
    }

    &.ant-btn-primary {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: ${(props) => props.theme.token.marginLG}px;

    &:first-child {
      margin-bottom: 0;
    }

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
  font-size: 28px !important;
  font-weight: 700 !important;
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSizeLG || "16px"};
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  line-height: 1.6;
`;

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${(props) => props.theme.token.colorBorder} 20%,
      ${(props) => props.theme.token.colorBorder} 80%,
      transparent 100%
    );
  }

  span {
    padding: 0 1rem;
    color: ${(props) => props.theme.token.colorTextSecondary};
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: ${(props) => props.theme.token.colorBgContainer};
    border-radius: 20px;
    padding: 0.5rem 1rem;
    border: 1px solid ${(props) => props.theme.token.colorBorder};
  }
`;

const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;
`;

const FormGroup = styled.div`
  margin-bottom: ${(props) =>
    props.theme.token.marginLG || props.theme.token.margin}px;
  width: 100%;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns || "1fr 1fr"};
  gap: ${(props) => props.theme.token.marginLG}px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: ${(props) => props.theme.token.controlHeight}px !important;
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

const StyledTagsSelect = styled(Select)`
  .ant-select-selector {
    min-height: ${(props) => props.theme.token.controlHeight}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    transition: all 0.3s ease;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
  }

  .ant-select-selection-overflow {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 4px;
    align-items: center;
  }

  .ant-select-selection-item {
    margin: 2px 2px 2px 0 !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    background: ${(props) => props.theme.token.colorPrimary}15 !important;
    border: 1px solid ${(props) => props.theme.token.colorPrimary}30 !important;
    font-size: ${(props) => props.theme.token.fontSize}px !important;
    padding: 2px 8px !important;
    height: auto !important;
    display: flex;
    align-items: center;
  }

  .ant-select-selection-item-content {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    font-weight: 500;
  }

  .ant-select-selection-item-remove {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    margin-left: 4px !important;
    font-size: 12px !important;
  }

  .ant-select-selection-search {
    margin: 2px 0 !important;
    min-width: 80px;
  }

  .ant-select-selection-placeholder {
    line-height: ${(props) =>
      props.theme.token.controlHeight - 12}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
    color: ${(props) => props.theme.token.colorTextPlaceholder};
  }

  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }

  &:hover .ant-select-selector {
    border-color: ${(props) => props.theme.token.colorPrimary} !important;
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
  }

  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const InfoBox = styled(motion.div)`
  margin-bottom: 1.5rem;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 12.5px;
  color: ${(props) => props.theme.token.colorTextSecondary};

  strong {
    color: ${(props) => props.theme.token.colorText};
  }

  ul {
    padding-left: 20px;
    margin: 5px 0 0 0;
    list-style: disc;

    li {
      margin: 4px 0;
    }
  }
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ClassOptionsStep = ({ onValidatedNext }) => {
  const [form] = Form.useForm();
  const { state, updateOptions, debouncedUpdateOptions, isLoaded } = useClass();
  const isFormInitialized = useRef(false);
  const watchedPolicy = Form.useWatch("cancellationPolicy", form);
  const watchedMidCoursePolicy = Form.useWatch(
    "midCourseCancellationPolicy",
    form
  );
  const midCourseDropsAllowed = Form.useWatch("allowMidCourseDrops", form);
  const bookingType = Form.useWatch("booking_type", form);

  useEffect(() => {
    if (isLoaded && !isFormInitialized.current) {
      const contextOption = state.options?.[0];

      const formValues = {};
      if (contextOption) {
        if (contextOption.booking_type !== undefined)
          formValues.booking_type = contextOption.booking_type;
        if (contextOption.level !== undefined)
          formValues.level = contextOption.level;
        if (contextOption.equipment !== undefined)
          formValues.equipment = contextOption.equipment;
        if (contextOption.tags !== undefined)
          formValues.tags = contextOption.tags;
        if (contextOption.cancellationPolicy !== undefined)
          formValues.cancellationPolicy = contextOption.cancellationPolicy;
        if (contextOption.cancellationCustomHours !== undefined)
          formValues.cancellationCustomHours =
            contextOption.cancellationCustomHours;
        if (contextOption.cancellationRefundPercentage !== undefined)
          formValues.cancellationRefundPercentage =
            contextOption.cancellationRefundPercentage;
        // Mid-course fields
        if (contextOption.allowMidCourseDrops !== undefined)
          formValues.allowMidCourseDrops = contextOption.allowMidCourseDrops;
        if (contextOption.midCourseCancellationPolicy !== undefined)
          formValues.midCourseCancellationPolicy =
            contextOption.midCourseCancellationPolicy;
        if (contextOption.midCourseCancellationCustomHours !== undefined)
          formValues.midCourseCancellationCustomHours =
            contextOption.midCourseCancellationCustomHours;
        if (contextOption.midCourseCancellationRefundPercentage !== undefined)
          formValues.midCourseCancellationRefundPercentage =
            contextOption.midCourseCancellationRefundPercentage;
      }

      if (Object.keys(formValues).length > 0) {
        form.setFieldsValue(formValues);
      }
      // Don't set a default booking_type - force user to select

      isFormInitialized.current = true;
    }
  }, [isLoaded, state.options, form]);

  useEffect(() => {
    // Handle pre-course strict policy
    if (watchedPolicy === "strict") {
      if (form.getFieldValue("cancellationRefundPercentage") !== 0) {
        form.setFieldsValue({ cancellationRefundPercentage: 0 });
      }
    }
    // Handle mid-course strict policy
    if (watchedMidCoursePolicy === "strict") {
      if (form.getFieldValue("midCourseCancellationRefundPercentage") !== 0) {
        form.setFieldsValue({ midCourseCancellationRefundPercentage: 0 });
      }
    }
  }, [watchedPolicy, watchedMidCoursePolicy, form]);

  const handleFormValuesChange = (changedValues, allValues) => {
    if (isFormInitialized.current) {
      let updatedValues = { ...allValues };

      if (changedValues.hasOwnProperty("booking_type")) {
        updatedValues.price_type =
          changedValues.booking_type === "Full Course"
            ? "full_course"
            : "per_session";
      }

      // Handle pre-course cancellation policy
      if (changedValues.hasOwnProperty("cancellationPolicy")) {
        if (changedValues.cancellationPolicy === "strict") {
          updatedValues.cancellationRefundPercentage = 0;
          form.setFieldsValue({ cancellationRefundPercentage: 0 });
        }
        if (changedValues.cancellationPolicy !== "custom") {
          updatedValues.cancellationCustomHours = null;
          form.setFieldsValue({ cancellationCustomHours: null });
        }
      }

      // Handle mid-course cancellation policy
      if (changedValues.hasOwnProperty("midCourseCancellationPolicy")) {
        if (changedValues.midCourseCancellationPolicy === "strict") {
          updatedValues.midCourseCancellationRefundPercentage = 0;
          form.setFieldsValue({ midCourseCancellationRefundPercentage: 0 });
        }
        if (changedValues.midCourseCancellationPolicy !== "custom") {
          updatedValues.midCourseCancellationCustomHours = null;
          form.setFieldsValue({ midCourseCancellationCustomHours: null });
        }
      }

      // Clear mid-course fields if drops are disabled
      if (
        changedValues.hasOwnProperty("allowMidCourseDrops") &&
        !changedValues.allowMidCourseDrops
      ) {
        updatedValues.midCourseCancellationPolicy = null;
        updatedValues.midCourseCancellationCustomHours = null;
        updatedValues.midCourseCancellationRefundPercentage = null;
      }

      debouncedUpdateOptions([updatedValues]);
    }
  };

  const handleSubmit = (values) => {
    const finalValues = {
      ...values,
      price_type:
        values.booking_type === "Full Course" ? "full_course" : "per_session",
      cancellationCustomHours:
        values.cancellationPolicy === "custom"
          ? values.cancellationCustomHours
          : null,
      cancellationRefundPercentage:
        values.cancellationRefundPercentage ??
        (values.cancellationPolicy === "strict" ? 0 : 100),
      // Mid-course fields
      midCourseCancellationCustomHours:
        values.midCourseCancellationPolicy === "custom"
          ? values.midCourseCancellationCustomHours
          : null,
      midCourseCancellationRefundPercentage: values.allowMidCourseDrops
        ? values.midCourseCancellationRefundPercentage ??
          (values.midCourseCancellationPolicy === "strict" ? 0 : 100)
        : null,
      midCourseCancellationPolicy: values.allowMidCourseDrops
        ? values.midCourseCancellationPolicy
        : null,
    };
    updateOptions([finalValues]);
    onValidatedNext();
  };

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Class Configuration</StepTitle>
        <StepDescription>
          Define how your class is structured and set key policies. This is a
          critical step to ensure students know what they are booking.
        </StepDescription>
      </StepHeader>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFormValuesChange}
        id="step-2-form"
        preserve={true}
      >
        <FormSection>
          <FormGroup>
            <FormLabel>Class Structure</FormLabel>
            <Form.Item
              name="booking_type"
              initialValue="Single Session"
              rules={[
                {
                  required: true,
                  message: "Please select a class structure",
                },
              ]}
            >
              <BookingTypeToggle>
                <Tooltip title="Students can book individual drop-in dates. You'll add specific dates and times after creating the class.">
                  <Button
                    type={
                      bookingType === "Single Session" ? "primary" : "default"
                    }
                    onClick={() =>
                      form.setFieldsValue({ booking_type: "Single Session" })
                    }
                  >
                    <Calendar size={16} /> Single Session
                  </Button>
                </Tooltip>
                <Tooltip title="Students will enroll for all sessions at once. You'll set up the course schedule after creating the class.">
                  <Button
                    type={bookingType === "Full Course" ? "primary" : "default"}
                    onClick={() =>
                      form.setFieldsValue({ booking_type: "Full Course" })
                    }
                  >
                    <Book size={16} /> Full Course
                  </Button>
                </Tooltip>
              </BookingTypeToggle>
            </Form.Item>
          </FormGroup>
        </FormSection>

        {/* Only show rest of form if booking type is selected */}
        {bookingType && (
          <>
            <FormSection>
              <FormGroup>
                <FormLabel>
                  <UserCheck size={16} />
                  Experience Level Required
                </FormLabel>
                <HelpText>
                  <IconWrapper>
                    <Info size={14} />
                  </IconWrapper>
                  What skill level should students have to get the most from
                  your class?
                </HelpText>
                <Form.Item
                  name="level"
                  initialValue="all"
                  rules={[
                    {
                      required: true,
                      message: "Please select an experience level",
                    },
                  ]}
                >
                  <StyledSelect
                    placeholder="Select the required experience level"
                    size="large"
                  >
                    <Option value="beginner">
                      Beginner - No prior experience needed
                    </Option>
                    <Option value="intermediate">
                      Intermediate - Some experience required
                    </Option>
                    <Option value="advanced">
                      Advanced - Significant experience required
                    </Option>
                    <Option value="all">All Levels Welcome</Option>
                  </StyledSelect>
                </Form.Item>
              </FormGroup>
            </FormSection>

            <SectionDivider>
              <span>
                <FileText size={16} />
                Policies & Cancellation
              </span>
            </SectionDivider>

            {/* ADDED: Dynamic help text for refund policy explanation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={bookingType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HelpText
                  style={{
                    marginBottom: "2rem",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {bookingType === "Full Course" ? (
                    <>
                      <IconWrapper>
                        <Info size={14} />
                      </IconWrapper>
                      <div>
                        <strong style={{ color: theme.token.colorText }}>
                          How Refunds Work for Courses:
                        </strong>
                        <ul
                          style={{
                            paddingLeft: "20px",
                            margin: "5px 0 0 0",
                            listStyle: "disc",
                          }}
                        >
                          <li>
                            <strong>Pre-Course Cancellations:</strong> If a
                            student cancels{" "}
                            <strong>before the course begins</strong>, your
                            "Pre-Course Cancellation Policy" applies based on
                            the start time of the very first session.
                          </li>
                          <li>
                            <strong>Mid-Course Drops:</strong> If you allow
                            mid-course drops and a student drops out{" "}
                            <strong>after the course has started</strong>, your
                            separate "Mid-Course Drop Policy" applies. Students
                            receive a pro-rated refund for remaining sessions
                            based on your mid-course policy.
                          </li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <IconWrapper>
                        <Info size={14} />
                      </IconWrapper>
                      <div>
                        <strong style={{ color: theme.token.colorText }}>
                          How Refunds Work for Single Sessions:
                        </strong>{" "}
                        This policy applies to each individual booking.
                        Cancellations are refunded based on the notice period
                        you set before the scheduled session starts.
                      </div>
                    </>
                  )}
                </HelpText>
              </motion.div>
            </AnimatePresence>

            <FormSection
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FormGrid>
                <FormGroup>
                  <FormLabel>
                    <FileText size={16} />
                    {bookingType === "Full Course"
                      ? "Pre-Course Cancellation Notice"
                      : "Cancellation Notice Required"}
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    {bookingType === "Full Course"
                      ? "How much notice do students need to give to cancel BEFORE the course starts?"
                      : "How much advance notice do you require for cancellations?"}
                  </HelpText>
                  <Form.Item
                    name="cancellationPolicy"
                    initialValue="flexible"
                    rules={[
                      {
                        required: true,
                        message: "Please select a cancellation policy",
                      },
                    ]}
                  >
                    <StyledSelect
                      placeholder="Select cancellation notice period"
                      size="large"
                    >
                      <Option value="flexible">
                        Flexible (up to 1 hour before)
                      </Option>
                      <Option value="24h">24 Hours Notice</Option>
                      <Option value="48h">48 Hours Notice</Option>
                      <Option value="72h">72 Hours Notice</Option>
                      <Option value="strict">Strict (Non-refundable)</Option>
                      <Option value="custom">Custom Notice Period</Option>
                    </StyledSelect>
                  </Form.Item>
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    <Percent size={16} />
                    {bookingType === "Full Course"
                      ? "Pre-Course Refund Percentage"
                      : "Refund Percentage"}
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    {bookingType === "Full Course"
                      ? "What percentage refund for cancellations BEFORE the course starts?"
                      : "What percentage do you refund for cancellations within your notice period?"}
                  </HelpText>
                  <Form.Item
                    name="cancellationRefundPercentage"
                    initialValue={100}
                    rules={[
                      {
                        required: true,
                        message: "Please enter a refund percentage",
                      },
                      {
                        type: "number",
                        min: 0,
                        max: 100,
                        message: "Percentage must be between 0 and 100",
                      },
                    ]}
                  >
                    <StyledInputNumber
                      min={0}
                      max={100}
                      formatter={(value) => `${value}%`}
                      parser={(value) => String(value).replace("%", "")}
                      placeholder="e.g., 100 for full refund"
                      size="large"
                      disabled={watchedPolicy === "strict"}
                    />
                  </Form.Item>
                </FormGroup>
              </FormGrid>

              {watchedPolicy === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: "16px" }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormGroup>
                    <FormLabel>
                      <Clock size={16} />
                      Custom Notice (in hours)
                    </FormLabel>
                    <HelpText>
                      <IconWrapper>
                        <Info size={14} />
                      </IconWrapper>
                      Enter how many hours of advance notice are required for a
                      cancellation.
                    </HelpText>
                    <Form.Item
                      name="cancellationCustomHours"
                      rules={[
                        {
                          required: true,
                          message:
                            "Please enter a custom notice period in hours",
                        },
                        {
                          type: "number",
                          min: 1,
                          message: "Notice period must be at least 1 hour",
                        },
                      ]}
                    >
                      <StyledInputNumber
                        min={1}
                        placeholder="e.g., 36 for 36 hours"
                        size="large"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </FormGroup>
                </motion.div>
              )}
            </FormSection>

            {/* Mid-Course Drop Policy - Only for Full Course */}
            {bookingType === "Full Course" && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="mid-course-policy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormSection>
                    <FormGroup>
                      <FormLabel>
                        <AlertCircle size={16} />
                        Allow Mid-Course Drops?
                      </FormLabel>
                      <HelpText>
                        <IconWrapper>
                          <Info size={14} />
                        </IconWrapper>
                        Can students drop out after the course has started and
                        get a refund for remaining sessions?
                      </HelpText>
                      <Form.Item
                        name="allowMidCourseDrops"
                        initialValue={false}
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                      </Form.Item>
                    </FormGroup>

                    {midCourseDropsAllowed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <HelpText
                          style={{
                            marginBottom: "1.5rem",
                            padding: "12px 16px",
                            background: "#fff7ed",
                            borderRadius: "8px",
                            border: "1px solid #fed7aa",
                          }}
                        >
                          <AlertCircle
                            size={14}
                            style={{
                              flexShrink: 0,
                              marginTop: "2px",
                              color: "#ea580c",
                            }}
                          />
                          <div>
                            <strong style={{ color: "#9a3412" }}>
                              Mid-Course Drop Policy:
                            </strong>{" "}
                            This policy applies when students drop out AFTER the
                            first session has occurred. They will receive a
                            pro-rated refund for remaining sessions based on
                            these settings.
                          </div>
                        </HelpText>

                        <FormGrid>
                          <FormGroup>
                            <FormLabel>
                              <FileText size={16} />
                              Mid-Course Drop Notice
                            </FormLabel>
                            <HelpText>
                              <IconWrapper>
                                <Info size={14} />
                              </IconWrapper>
                              How much notice before their NEXT session must
                              students give to drop mid-course?
                            </HelpText>
                            <Form.Item
                              name="midCourseCancellationPolicy"
                              initialValue="24h"
                              rules={[
                                {
                                  required: midCourseDropsAllowed,
                                  message:
                                    "Please select a mid-course drop policy",
                                },
                              ]}
                            >
                              <StyledSelect
                                placeholder="Select notice period for mid-course drops"
                                size="large"
                              >
                                <Option value="flexible">
                                  Flexible (up to 1 hour before next session)
                                </Option>
                                <Option value="24h">24 Hours Notice</Option>
                                <Option value="48h">48 Hours Notice</Option>
                                <Option value="72h">72 Hours Notice</Option>
                                <Option value="strict">
                                  Strict (Non-refundable)
                                </Option>
                                <Option value="custom">
                                  Custom Notice Period
                                </Option>
                              </StyledSelect>
                            </Form.Item>
                          </FormGroup>

                          <FormGroup>
                            <FormLabel>
                              <Percent size={16} />
                              Mid-Course Refund Percentage
                            </FormLabel>
                            <HelpText>
                              <IconWrapper>
                                <Info size={14} />
                              </IconWrapper>
                              What percentage of remaining sessions value will
                              you refund?
                            </HelpText>
                            <Form.Item
                              name="midCourseCancellationRefundPercentage"
                              initialValue={100}
                              rules={[
                                {
                                  required: midCourseDropsAllowed,
                                  message: "Please enter a refund percentage",
                                },
                                {
                                  type: "number",
                                  min: 0,
                                  max: 100,
                                  message:
                                    "Percentage must be between 0 and 100",
                                },
                              ]}
                            >
                              <StyledInputNumber
                                min={0}
                                max={100}
                                formatter={(value) => `${value}%`}
                                parser={(value) =>
                                  String(value).replace("%", "")
                                }
                                placeholder="e.g., 100 for full refund"
                                size="large"
                                disabled={watchedMidCoursePolicy === "strict"}
                              />
                            </Form.Item>
                          </FormGroup>
                        </FormGrid>

                        {watchedMidCoursePolicy === "custom" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                              marginTop: "16px",
                            }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <FormGroup>
                              <FormLabel>
                                <Clock size={16} />
                                Custom Mid-Course Notice (in hours)
                              </FormLabel>
                              <HelpText>
                                <IconWrapper>
                                  <Info size={14} />
                                </IconWrapper>
                                Enter how many hours notice before the next
                                session is required to drop mid-course.
                              </HelpText>
                              <Form.Item
                                name="midCourseCancellationCustomHours"
                                rules={[
                                  {
                                    required:
                                      watchedMidCoursePolicy === "custom",
                                    message:
                                      "Please enter a custom notice period in hours",
                                  },
                                  {
                                    type: "number",
                                    min: 1,
                                    message:
                                      "Notice period must be at least 1 hour",
                                  },
                                ]}
                              >
                                <StyledInputNumber
                                  min={1}
                                  placeholder="e.g., 36 for 36 hours"
                                  size="large"
                                  style={{ width: "100%" }}
                                />
                              </Form.Item>
                            </FormGroup>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </FormSection>
                </motion.div>
              </AnimatePresence>
            )}

            <SectionDivider>
              <span>
                <Settings size={16} />
                Optional Details
              </span>
            </SectionDivider>

            <FormSection
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FormGrid>
                <FormGroup>
                  <FormLabel>
                    <Package size={16} />
                    Equipment Students Should Bring
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    List any equipment, materials, or supplies students need to
                    bring. Press Enter to add items.
                  </HelpText>
                  <Form.Item name="equipment">
                    <StyledTagsSelect
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Type equipment and press Enter (e.g., Yoga Mat, Notebook)"
                      tokenSeparators={[","]}
                      size="large"
                      maxTagCount="responsive"
                    />
                  </Form.Item>
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    <Tag size={16} />
                    Additional Tags
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    Add keywords to help students find this class. Press Enter
                    to add tags.
                  </HelpText>
                  <Form.Item name="tags">
                    <StyledTagsSelect
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Type tags and press Enter (e.g., Relaxing, Intensive)"
                      tokenSeparators={[","]}
                      size="large"
                      maxTagCount="responsive"
                    />
                  </Form.Item>
                </FormGroup>
              </FormGrid>
            </FormSection>
          </>
        )}
      </StyledForm>
    </ConfigProvider>
  );
};

export default ClassOptionsStep;
