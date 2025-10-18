"use client";

import React, { useEffect, useRef } from "react";
import { Form, Select, InputNumber, Typography, ConfigProvider } from "antd";
import styled from "styled-components";
import {
  Package,
  UserCheck,
  Info,
  FileText,
  Percent,
  Tag,
  Settings,
  Clock, // Added for clarity
} from "lucide-react";
import { motion } from "framer-motion";
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";

const { Option } = Select;
const { Title, Text } = Typography;

const StyledForm = styled(Form)`
  .ant-form-item {
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

const ClassOptionsStep = ({ onValidatedNext }) => {
  const [form] = Form.useForm();
  const { state, updateOptions, debouncedUpdateOptions, isLoaded } = useClass();
  const isFormInitialized = useRef(false);
  const watchedPolicy = Form.useWatch("cancellationPolicy", form);

  useEffect(() => {
    if (isLoaded && !isFormInitialized.current) {
      const contextOption = state.options?.[0];

      // Only set form values if we have actual context data
      // Don't fall back to defaults here - let the form handle its own defaults
      const formValues = {};

      if (contextOption) {
        // Only set values that actually exist in context
        if (contextOption.level !== undefined)
          formValues.level = contextOption.level;
        if (contextOption.equipment !== undefined)
          formValues.equipment = contextOption.equipment;
        if (contextOption.tags !== undefined)
          formValues.tags = contextOption.tags;
        if (contextOption.cancellationPolicy !== undefined) {
          formValues.cancellationPolicy = contextOption.cancellationPolicy;
        }
        if (contextOption.cancellationCustomHours !== undefined) {
          formValues.cancellationCustomHours =
            contextOption.cancellationCustomHours;
        }
        if (contextOption.cancellationRefundPercentage !== undefined) {
          formValues.cancellationRefundPercentage =
            contextOption.cancellationRefundPercentage;
        }
      }

      // Only set form values if we have something to set
      if (Object.keys(formValues).length > 0) {
        form.setFieldsValue(formValues);
      }

      isFormInitialized.current = true;
    }
  }, [isLoaded, state.options, form]);

  useEffect(() => {
    if (watchedPolicy === "strict") {
      const currentRefundPercentage = form.getFieldValue(
        "cancellationRefundPercentage"
      );
      if (currentRefundPercentage !== 0) {
        form.setFieldsValue({ cancellationRefundPercentage: 0 });
      }
    }
  }, [watchedPolicy, form]);

  const handleFormValuesChange = (changedValues, allValues) => {
    console.log("🔧 Form values changed:", { changedValues, allValues });
    console.log("🔧 Current context options:", state.options);

    if (isFormInitialized.current) {
      let updatedValues = { ...allValues };

      if (
        updatedValues.cancellationRefundPercentage === null ||
        updatedValues.cancellationRefundPercentage === undefined ||
        updatedValues.cancellationRefundPercentage === ""
      ) {
        updatedValues.cancellationRefundPercentage =
          updatedValues.cancellationPolicy === "strict" ? 0 : 100;
      }

      if (changedValues.hasOwnProperty("cancellationPolicy")) {
        console.log(
          "📋 Cancellation policy changed to:",
          changedValues.cancellationPolicy
        );

        if (changedValues.cancellationPolicy === "strict") {
          updatedValues.cancellationRefundPercentage = 0;
          form.setFieldsValue({ cancellationRefundPercentage: 0 });
        }
        // If policy is changed away from custom, clear the custom hours field
        if (changedValues.cancellationPolicy !== "custom") {
          updatedValues.cancellationCustomHours = null;
          form.setFieldsValue({ cancellationCustomHours: null });
        }
      }

      if (
        changedValues.hasOwnProperty("cancellationRefundPercentage") &&
        updatedValues.cancellationPolicy === "strict"
      ) {
        updatedValues.cancellationRefundPercentage = 0;
        form.setFieldsValue({ cancellationRefundPercentage: 0 });
      }

      console.log("💾 Updating context with:", updatedValues);
      debouncedUpdateOptions([updatedValues]);
    } else {
      console.log("⚠️ Form not initialized yet, skipping context update");
    }
  };

  const handleSubmit = (values) => {
    console.log("📤 Form submitted with values:", values);

    const finalValues = {
      ...values,
      cancellationCustomHours:
        values.cancellationPolicy === "custom"
          ? values.cancellationCustomHours
          : null,
      cancellationRefundPercentage:
        values.cancellationRefundPercentage !== null &&
        values.cancellationRefundPercentage !== undefined &&
        values.cancellationRefundPercentage !== ""
          ? values.cancellationRefundPercentage
          : values.cancellationPolicy === "strict"
          ? 0
          : 100,
    };

    console.log("📤 Final processed values:", finalValues);

    // Use the non-debounced version to ensure immediate update
    updateOptions([finalValues]);
    onValidatedNext();
  };

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Class Configuration</StepTitle>
        <StepDescription>
          Configure the specific details for your class offering. Set the
          experience level, policies, and optional details that help students
          understand what to expect.
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FormGroup>
            <FormLabel>
              <UserCheck size={16} />
              Experience Level Required
            </FormLabel>
            <HelpText>
              <Info size={14} />
              What skill level should students have to get the most from your
              class?
            </HelpText>
            <Form.Item
              name="level"
              initialValue="all" // Set default here
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

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGrid>
            <FormGroup>
              <FormLabel>
                <FileText size={16} />
                Cancellation Notice Required
              </FormLabel>
              <HelpText>
                <Info size={14} />
                How much advance notice do you require for cancellations?
              </HelpText>
              <Form.Item
                name="cancellationPolicy"
                initialValue="flexible" // Set default here
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
                Refund Percentage
              </FormLabel>
              <HelpText>
                <Info size={14} />
                What percentage do you refund for cancellations within your
                notice period?
              </HelpText>
              <Form.Item
                name="cancellationRefundPercentage"
                initialValue={100} // Set default here
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
                  parser={(value) => value.replace("%", "")}
                  placeholder="e.g., 100 for full refund"
                  size="large"
                  disabled={watchedPolicy === "strict"}
                />
              </Form.Item>
            </FormGroup>
          </FormGrid>

          {/* Conditionally render the custom hours input BELOW the grid */}
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
                  <Info size={14} />
                  Enter how many hours of advance notice are required for a
                  cancellation.
                </HelpText>
                <Form.Item
                  name="cancellationCustomHours"
                  rules={[
                    {
                      required: true,
                      message: "Please enter a custom notice period in hours",
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
                <Info size={14} />
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
                <Info size={14} />
                Add keywords to help students find this class. Press Enter to
                add tags.
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
      </StyledForm>
    </ConfigProvider>
  );
};

export default ClassOptionsStep;
