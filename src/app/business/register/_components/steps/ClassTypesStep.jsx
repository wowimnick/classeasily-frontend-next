"use client";

import React, { useEffect } from "react";
import { Form, Typography, Select, Checkbox, ConfigProvider } from "antd";
import styled from "styled-components";
import { Users, Award, Shield, Info } from "lucide-react";
import { motion } from "framer-motion";
import { theme } from "@/components/theme";

const { Title, Text } = Typography;
const { Option } = Select;

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

// --- UPDATED MOBILE STYLES ---
const StyledSelect = styled(Select)`
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

  .ant-select-selection-search-input {
    height: auto !important;
    padding: 2px 0 !important;
    font-size: ${(props) => props.theme.token.fontSize}px !important;
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

  @media (max-width: 768px) {
    .ant-select-selection-search-input,
    .ant-select-selection-placeholder,
    .ant-select-selection-item {
      font-size: 16px !important;
    }
    input {
      font-size: 16px !important;
    }
  }
`;

const StyledCheckbox = styled(Checkbox)`
  &.ant-checkbox-wrapper {
    align-items: flex-start;
    gap: ${(props) => props.theme.token.marginSM || "12px"};
    margin-bottom: ${(props) => props.theme.token.margin}px !important;
    display: flex;

    .ant-checkbox {
      top: 2px;
      .ant-checkbox-inner {
        width: 18px;
        height: 18px;
        border: 1px solid ${(props) => props.theme.token.colorBorder};
        transition: all 0.3s ease;

        &:hover {
          border-color: ${(props) => props.theme.token.colorPrimary};
        }

        &:after {
          width: 5px;
          height: 9px;
          border-width: 2px;
        }
      }

      &.ant-checkbox-checked .ant-checkbox-inner {
        background-color: ${(props) => props.theme.token.colorPrimary};
        border-color: ${(props) => props.theme.token.colorPrimary};
      }

      &.ant-checkbox-input:focus + .ant-checkbox-inner {
        box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
      }
    }

    .ant-checkbox + span {
      padding: 0;
      font-size: ${(props) => props.theme.token.fontSizeSM || "13px"};
      color: ${(props) => props.theme.token.colorTextSecondary};
      line-height: 1.5;
      flex: 1;

      a {
        color: ${(props) => props.theme.token.colorPrimary};
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
          text-decoration: underline;
          color: ${(props) => props.theme.token.colorPrimaryHover};
        }
      }
    }
  }
`;

const AgreementsSection = styled(motion.div)`
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.token.colorBgLayout} 0%,
    ${(props) => props.theme.token.colorBgContainer} 100%
  );
  border-radius: 16px;
  padding: ${(props) => props.theme.token.paddingLG}px;
  margin-bottom: 2rem;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      ${(props) => props.theme.token.colorPrimary},
      ${(props) => props.theme.token.colorPrimaryBorder}
    );
  }
`;

const AgreementsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.token.marginXS}px;
  font-weight: 700;
  font-size: 16px;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginLG}px;

  svg {
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const ClassTypesStep = ({ onSubmit, initialData = {}, onFormSubmitFailed }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      classFormats: initialData?.classFormats || [],
      skillLevels: initialData?.skillLevels || [],
      ageGroups: initialData?.ageGroups || [],
      termsAccepted: initialData?.termsAccepted || false,
      privacyAccepted: initialData?.privacyAccepted || false,
    });
  }, [initialData, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  const handleFinishFailed = (errorInfo) => {
    if (onFormSubmitFailed) {
      onFormSubmitFailed(errorInfo);
    }
  };

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Experience Details & Agreements</StepTitle>
        <StepDescription>
          Define your experience format and your target audience. This helps
          guests find the right activity and sets clear expectations.
        </StepDescription>
      </StepHeader>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={handleFinishFailed}
        id="step-3-form"
      >
        <SectionDivider>
          <span>
            <Users size={16} />
            Experience Format
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGroup>
            <FormLabel>
              <Users size={16} />
              Experience Formats You Offer
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Select all the different ways you can deliver your experience
            </HelpText>
            <Form.Item
              name="classFormats"
              rules={[
                {
                  required: true,
                  message: "Please select at least one format",
                },
              ]}
            >
              <StyledSelect
                mode="multiple"
                allowClear
                placeholder="Select formats (e.g., Small Group, Private, Virtual)"
                size="large"
                maxTagCount="responsive"
              >
                <Option value="small-group">Small Group (2-5 guests)</Option>
                <Option value="group">Group Experience (6+ guests)</Option>
                <Option value="private">Private Booking</Option>
                <Option value="event">Large Event Friendly</Option>
                <Option value="course">Multi-Day Workshop</Option>
                <Option value="online">Virtual Experience</Option>
                <Option value="in-person">In-Person Only</Option>
                <Option value="hybrid">Hybrid</Option>
              </StyledSelect>
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <Award size={16} />
              Activity Level / Skill Requirement
            </FormLabel>
            <HelpText>
              <Info size={14} />
              What experience or physical ability level is required?
            </HelpText>
            <Form.Item
              name="skillLevels"
              rules={[
                {
                  required: true,
                  message: "Please select applicable levels",
                },
              ]}
            >
              <StyledSelect
                mode="multiple"
                allowClear
                placeholder="Select requirements"
                size="large"
                maxTagCount="responsive"
              >
                <Option value="no-experience">No Experience Needed</Option>
                <Option value="beginner">Beginner Friendly</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
                <Option value="active">Moderate Physical Activity</Option>
                <Option value="strenuous">Strenuous Activity</Option>
                <Option value="all">Open to All Levels</Option>
              </StyledSelect>
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <Users size={16} />
              Target Audience
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Select the age groups suitable for your experience
            </HelpText>
            <Form.Item
              name="ageGroups"
              rules={[
                {
                  required: true,
                  message: "Please select age groups",
                },
              ]}
            >
              <StyledSelect
                mode="multiple"
                allowClear
                placeholder="Select audience"
                size="large"
                maxTagCount="responsive"
              >
                <Option value="family">Family Friendly</Option>
                <Option value="children">Children (5-12 years)</Option>
                <Option value="teens">Teens (13-17 years)</Option>
                <Option value="young-adults">Adults (18+ years)</Option>
                <Option value="seniors">Seniors</Option>
                <Option value="all">All Ages</Option>
              </StyledSelect>
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <Shield size={16} />
            Legal Agreements
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AgreementsSection>
            <AgreementsTitle>
              <Shield size={20} />
              Platform Agreements
            </AgreementsTitle>

            <FormGroup>
              <Form.Item
                name="termsAccepted"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "You must accept the Terms of Service to continue"
                            )
                          ),
                  },
                ]}
              >
                <StyledCheckbox>
                  I have read and agree to the ClassEasily{" "}
                  <a
                    href="/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </a>{" "}
                  and Platform Guidelines. I understand my responsibilities as a
                  host on the platform.
                </StyledCheckbox>
              </Form.Item>

              <Form.Item
                name="privacyAccepted"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "You must accept the Privacy Policy to continue"
                            )
                          ),
                  },
                ]}
              >
                <StyledCheckbox>
                  I have read and understand the ClassEasily{" "}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>{" "}
                  and consent to the collection, use, and sharing of my
                  information as described.
                </StyledCheckbox>
              </Form.Item>
            </FormGroup>
          </AgreementsSection>
        </FormSection>
      </StyledForm>
    </ConfigProvider>
  );
};

export default ClassTypesStep;
