"use client";

import React, { useEffect } from "react";
import { Form, Input, Select, Typography, ConfigProvider, Radio } from "antd";
import styled from "styled-components";
import {
  Phone,
  Mail,
  MessageCircle,
  Info,
  Shield,
  MessageSquareText,
} from "lucide-react";
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

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const StepTitle = styled(Title)`
  margin-bottom: ${(props) => props.theme.token.marginXS}px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 28px !important;
  font-weight: 700 !important;

  @media (max-width: 768px) {
    font-size: 22px !important;
  }
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSizeLG || "16px"};
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 1rem;
  }
`;

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;

  @media (max-width: 768px) {
    margin: 1.5rem 0;
  }

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

    @media (max-width: 768px) {
      font-size: 13px;
      padding: 0.4rem 0.8rem;
    }
  }
`;

const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${(props) =>
    props.theme.token.marginLG || props.theme.token.margin}px;
  width: 100%;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
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

// --- UPDATED MOBILE STYLES ---
const StyledInput = styled(Input)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;

  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
    input {
      font-size: 16px !important;
    }
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

  @media (max-width: 768px) {
    .ant-select-selector {
      font-size: 16px !important;
    }
    .ant-select-selection-item,
    .ant-select-selection-placeholder {
      font-size: 16px !important;
    }
    input {
      font-size: 16px !important;
    }
  }
`;

const InfoSection = styled(motion.div)`
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.token.colorPrimaryBg}40 0%,
    ${(props) => props.theme.token.colorBgContainer} 100%
  );
  border-radius: 12px;
  padding: ${(props) =>
    props.theme.token.paddingLG || props.theme.token.padding}px;
  margin: ${(props) => props.theme.token.marginLG}px 0;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem 0;
  }

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

const InfoTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.token.marginXS}px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;

  svg {
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const InfoText = styled.p`
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSize}px;
  margin: 0;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const StyledRadioGroup = styled(Radio.Group)`
  display: flex;
  flex-direction: row;

  @media (max-width: 500px) {
    flex-direction: column;
    width: 100%;

    .ant-radio-button-wrapper {
      width: 100%;
      text-align: center;
      border-radius: 6px !important;
      margin-bottom: 4px;
      border-left-width: 1px !important;

      &:before {
        display: none !important;
      }
    }
  }
`;

const ContactDetailsStep = ({
  onSubmit,
  initialData = {},
  onFormSubmitFailed,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    const dataToSet = {
      ...initialData,
      contact_privacy: initialData.contact_privacy || "on_booking",
    };
    form.setFieldsValue(dataToSet);
  }, [initialData, form]);

  const handleSubmit = (values) => {
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
        <StepTitle level={2}>Contact Information</StepTitle>
        <StepDescription>
          Help students reach you by providing clear contact information. This
          builds trust and makes booking easier.
        </StepDescription>
      </StepHeader>

      <InfoSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <InfoTitle>
          <Shield size={20} />
          Privacy & Contact
        </InfoTitle>
        <InfoText>
          Your contact details will only be shared in accordance to the selected
          privacy options below. We never share your information with third
          parties or use it for marketing without your consent.
        </InfoText>
      </InfoSection>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={handleFinishFailed}
        id="step-1-form"
      >
        <SectionDivider>
          <span>
            <Phone size={16} />
            Primary Contact
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGroup>
            <FormLabel>
              <Phone size={16} />
              Student Contact Phone
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Primary phone number for students to reach you for bookings and
              questions
            </HelpText>
            <Form.Item
              name="studentContactPhone"
              rules={[
                {
                  required: true,
                  message: "Please enter a phone number for students",
                },
                {
                  pattern: /^[\d\s().+-xX]{7,25}$/,
                  message: "Please enter a valid phone number format",
                },
              ]}
            >
              <StyledInput
                placeholder="e.g., (555) 123-4567 or +15551234567"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <Mail size={16} />
              Student Contact Email
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Email address students can use to contact you directly
            </HelpText>
            <Form.Item
              name="studentContactEmail"
              rules={[
                {
                  required: true,
                  message: "Please enter an email for students",
                },
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <StyledInput
                type="email"
                placeholder="e.g., contact@yourschool.com or your.name@email.com"
                size="large"
              />
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <MessageCircle size={16} />
            Communication Preferences
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FormGroup>
            <FormLabel>
              <MessageCircle size={16} />
              Preferred Contact Method
            </FormLabel>
            <HelpText>
              <Info size={14} />
              How should students primarily reach you? This will be displayed on
              your profile.
            </HelpText>
            <Form.Item
              name="preferredContact"
              rules={[
                {
                  required: true,
                  message:
                    "Please select how students should primarily contact you",
                },
              ]}
            >
              <StyledSelect
                placeholder="Select your preferred contact method"
                size="large"
              >
                <Option value="email">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Mail size={16} />
                    Email
                  </div>
                </Option>
                <Option value="phone">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Phone size={16} />
                    Phone Call
                  </div>
                </Option>
                <Option value="text">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MessageSquareText size={16} />
                    Text Message
                  </div>
                </Option>
                <Option value="both">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MessageCircle size={16} />
                    Any Method
                  </div>
                </Option>
              </StyledSelect>
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <Shield size={16} />
            Contact Privacy
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <FormGroup>
            <FormLabel>
              <Shield size={16} />
              Contact Information Visibility
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Choose who can see your phone number and email. This helps you
              control your privacy and manage how students contact you.
            </HelpText>
            <Form.Item
              name="contact_privacy"
              rules={[
                {
                  required: true,
                  message: "Please select a privacy option",
                },
              ]}
            >
              <StyledRadioGroup>
                <Radio.Button
                  value="on_booking"
                  style={{
                    padding: "0 20px",
                    height: 40,
                    lineHeight: "38px",
                  }}
                >
                  Show After Booking Only
                </Radio.Button>
                <Radio.Button
                  value="public"
                  style={{
                    padding: "0 20px",
                    height: 40,
                    lineHeight: "38px",
                  }}
                >
                  Show Publicly
                </Radio.Button>
              </StyledRadioGroup>
            </Form.Item>
            <HelpText>
              "Show After Booking" is recommended for most individual teachers.
              "Show Publicly" is great for established schools that want to
              encourage direct inquiries.
            </HelpText>
          </FormGroup>
        </FormSection>
      </StyledForm>
    </ConfigProvider>
  );
};

export default ContactDetailsStep;
