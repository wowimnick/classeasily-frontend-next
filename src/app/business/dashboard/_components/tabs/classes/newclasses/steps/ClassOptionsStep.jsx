"use client";

import React, { useEffect, useRef } from "react";
import {
  Form,
  Select,
  InputNumber,
  Typography,
  ConfigProvider,
  Button,
  Switch,
  Tooltip,
} from "antd";
import styled from "styled-components";
import {
  Backpack,
  Activity,
  Info,
  FileText,
  Percent,
  Tag,
  Settings,
  Clock,
  Ticket,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";

const { Option } = Select;
const { Title, Text } = Typography;

const BookingTypeToggle = styled(Button.Group)`
  display: flex;
  width: 100%;

  .ant-btn {
    flex: 1;
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;

    &:not(.ant-btn-primary) {
      color: ${(props) => props.theme.token.colorText};

      &:hover {
        background: #f1f5f9;
        border-color: ${(props) => props.theme.token.colorPrimary};
        color: ${(props) => props.theme.token.colorPrimary};
      }
    }

    &.ant-btn-primary {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  }
`;

const StyledInputNumber = styled(InputNumber)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  width: 100%;
  .ant-input-number-input-wrap,
  .ant-input-number-input {
    height: 100% !important;
    display: flex;
    align-items: center;
  }
`;

// ANIMATION VARIANTS
// Using transitionEnd: { transform: "none" } ensures text renders crisply after animation
const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
    transitionEnd: { transform: "none" },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

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

      // Load all previous data if it exists
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
      isFormInitialized.current = true;
    }
  }, [isLoaded, state.options, form]);

  useEffect(() => {
    if (watchedPolicy === "strict") {
      if (form.getFieldValue("cancellationRefundPercentage") !== 0) {
        form.setFieldsValue({ cancellationRefundPercentage: 0 });
      }
    }
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
        <StepTitle level={2}>Configuration</StepTitle>
        <StepDescription>
          Structure your experience and set key policies.
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
        <FormSection
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <FormGroup>
            <FormLabel>Experience Structure</FormLabel>
            <HelpText>
              <IconWrapper>
                <Info size={14} />
              </IconWrapper>
              Choose how guests will book and attend.
            </HelpText>
            <Form.Item
              name="booking_type"
              initialValue="Single Session"
              rules={[
                {
                  required: true,
                  message: "Please select a structure",
                },
              ]}
            >
              <BookingTypeToggle>
                <Tooltip title="Guests book a specific date for a one-off event.">
                  <Button
                    type={
                      bookingType === "Single Session" ? "primary" : "default"
                    }
                    onClick={() =>
                      form.setFieldsValue({ booking_type: "Single Session" })
                    }
                  >
                    <Ticket size={16} /> One-Time Experience
                  </Button>
                </Tooltip>
                <Tooltip title="Guests enroll in a multi-day series (e.g. a 4-week boot camp).">
                  <Button
                    type={bookingType === "Full Course" ? "primary" : "default"}
                    onClick={() =>
                      form.setFieldsValue({ booking_type: "Full Course" })
                    }
                  >
                    <CalendarRange size={16} /> Multi-Day Series
                  </Button>
                </Tooltip>
              </BookingTypeToggle>
            </Form.Item>
          </FormGroup>
        </FormSection>

        {bookingType && (
          <>
            <FormSection
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <FormGroup>
                <FormLabel>
                  <Activity size={16} />
                  Activity / Skill Level
                </FormLabel>
                <HelpText>
                  <IconWrapper>
                    <Info size={14} />
                  </IconWrapper>
                  How intense or difficult is this experience?
                </HelpText>
                <Form.Item
                  name="level"
                  initialValue="all"
                  rules={[
                    {
                      required: true,
                      message: "Please select a level",
                    },
                  ]}
                >
                  <StyledSelect placeholder="Select level" size="middle">
                    <Option value="all">Open to Everyone</Option>
                    <Option value="no-experience">No Experience Needed</Option>
                    <Option value="intermediate">Intermediate Skill</Option>
                    <Option value="advanced">Advanced Skill</Option>
                    <Option value="strenuous">
                      High Intensity / Strenuous
                    </Option>
                  </StyledSelect>
                </Form.Item>
              </FormGroup>
            </FormSection>

            <SectionDivider>
              <span>
                <FileText size={16} />
                Cancellation Policy
              </span>
            </SectionDivider>

            <AnimatePresence mode="wait">
              <motion.div
                key={bookingType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transitionEnd: { transform: "none" } }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  style={{
                    marginBottom: "2rem",
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <IconWrapper style={{ marginTop: "4px" }}>
                    <Info size={16} />
                  </IconWrapper>
                  <div
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.6",
                      color: theme.token.colorTextSecondary,
                    }}
                  >
                    {bookingType === "Full Course" ? (
                      <>
                        <strong
                          style={{
                            color: theme.token.colorText,
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          How Refunds Work for Series:
                        </strong>
                        <ul
                          style={{
                            paddingLeft: "20px",
                            margin: 0,
                            listStyle: "disc",
                          }}
                        >
                          <li style={{ marginBottom: "6px" }}>
                            <strong>Pre-Start Cancellations:</strong> If a guest
                            cancels <em>before the series begins</em>, your
                            "Notice Required" policy applies based on the start
                            time of the very first session.
                          </li>
                          <li>
                            <strong>Mid-Series Drops:</strong> If you allow
                            drops after the start, a separate policy applies.
                            Guests receive a pro-rated refund for remaining
                            sessions based on the specific notice you set for
                            upcoming sessions.
                          </li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <strong style={{ color: theme.token.colorText }}>
                          How Refunds Work:
                        </strong>{" "}
                        This policy applies to every individual booking. If a
                        guest cancels within the notice period you select below
                        (relative to the experience start time), they will be
                        automatically refunded according to the percentage you
                        set.
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <FormSection
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <FormGrid>
                <FormGroup>
                  <FormLabel>
                    <FileText size={16} />
                    Notice Required
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    Minimum time before start for a refund.
                  </HelpText>
                  <Form.Item
                    name="cancellationPolicy"
                    initialValue="flexible"
                    rules={[{ required: true }]}
                  >
                    <StyledSelect placeholder="Select notice" size="middle">
                      <Option value="flexible">Flexible (1 hour before)</Option>
                      <Option value="24h">24 Hours Notice</Option>
                      <Option value="48h">48 Hours Notice</Option>
                      <Option value="72h">72 Hours Notice</Option>
                      <Option value="strict">Strict (Non-refundable)</Option>
                      <Option value="custom">Custom</Option>
                    </StyledSelect>
                  </Form.Item>
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    <Percent size={16} />
                    Refund %
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    Percentage refunded if cancelled on time.
                  </HelpText>
                  <Form.Item
                    name="cancellationRefundPercentage"
                    initialValue={100}
                    rules={[
                      { required: true },
                      {
                        type: "number",
                        min: 0,
                        max: 100,
                        message: "0-100",
                      },
                    ]}
                  >
                    <StyledInputNumber
                      min={0}
                      max={100}
                      formatter={(value) => `${value}%`}
                      parser={(value) => String(value).replace("%", "")}
                      size="middle"
                      disabled={watchedPolicy === "strict"}
                      inputMode="decimal"
                      placeholder="100"
                    />
                  </Form.Item>
                </FormGroup>
              </FormGrid>

              {watchedPolicy === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    marginTop: "16px",
                    transitionEnd: { transform: "none" },
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <FormGroup>
                    <FormLabel>
                      <Clock size={16} /> Custom Notice (Hours)
                    </FormLabel>
                    <HelpText>
                      <IconWrapper>
                        <Info size={14} />
                      </IconWrapper>
                      Specific hours before start required for a refund.
                    </HelpText>
                    <Form.Item
                      name="cancellationCustomHours"
                      rules={[{ required: true, type: "number", min: 1 }]}
                    >
                      <StyledInputNumber
                        min={1}
                        placeholder="Hours"
                        size="middle"
                      />
                    </Form.Item>
                  </FormGroup>
                </motion.div>
              )}
            </FormSection>

            {bookingType === "Full Course" && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="mid-course-policy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transitionEnd: { transform: "none" },
                  }}
                >
                  <FormSection>
                    <FormGroup>
                      <FormLabel>
                        <AlertCircle size={16} /> Allow Mid-Series Drops?
                      </FormLabel>
                      <HelpText>
                        <IconWrapper>
                          <Info size={14} />
                        </IconWrapper>
                        Can guests drop out after the series has started for a
                        partial refund?
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
                        animate={{
                          opacity: 1,
                          height: "auto",
                          transitionEnd: { transform: "none" },
                        }}
                      >
                        <FormGrid>
                          <FormGroup>
                            <FormLabel>Notice for Next Session</FormLabel>
                            <HelpText>
                              <IconWrapper>
                                <Info size={14} />
                              </IconWrapper>
                              Notice required before the specific session
                              starts.
                            </HelpText>
                            <Form.Item
                              name="midCourseCancellationPolicy"
                              initialValue="24h"
                              rules={[{ required: true }]}
                            >
                              <StyledSelect
                                size="middle"
                                placeholder="Select notice"
                              >
                                <Option value="flexible">Flexible</Option>
                                <Option value="24h">24 Hours</Option>
                                <Option value="48h">48 Hours</Option>
                                <Option value="72h">72 Hours</Option>
                                <Option value="strict">Strict</Option>
                              </StyledSelect>
                            </Form.Item>
                          </FormGroup>
                          <FormGroup>
                            <FormLabel>Refund % (Remaining)</FormLabel>
                            <HelpText>
                              <IconWrapper>
                                <Info size={14} />
                              </IconWrapper>
                              Percentage of unused sessions to be refunded.
                            </HelpText>
                            <Form.Item
                              name="midCourseCancellationRefundPercentage"
                              initialValue={100}
                              rules={[{ required: true }]}
                            >
                              <StyledInputNumber
                                min={0}
                                max={100}
                                formatter={(value) => `${value}%`}
                                size="middle"
                                placeholder="100"
                              />
                            </Form.Item>
                          </FormGroup>
                        </FormGrid>
                      </motion.div>
                    )}
                  </FormSection>
                </motion.div>
              </AnimatePresence>
            )}

            <SectionDivider>
              <span>
                <Settings size={16} />
                Details (Optional)
              </span>
            </SectionDivider>

            <FormSection
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <FormGrid>
                <FormGroup>
                  <FormLabel>
                    <Backpack size={16} />
                    What to Bring / Packing List
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    Items guests need (e.g. "Comfortable shoes", "ID").
                  </HelpText>
                  <Form.Item name="equipment">
                    <StyledTagsSelect
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Type and press Enter..."
                      size="middle"
                    />
                  </Form.Item>
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    <Tag size={16} />
                    Search Tags
                  </FormLabel>
                  <HelpText>
                    <IconWrapper>
                      <Info size={14} />
                    </IconWrapper>
                    Keywords to help guests find this.
                  </HelpText>
                  <Form.Item name="tags">
                    <StyledTagsSelect
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Type and press Enter..."
                      size="middle"
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
