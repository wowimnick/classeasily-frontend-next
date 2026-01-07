"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  Select,
  Typography,
  TimePicker,
  Checkbox,
  ConfigProvider,
  InputNumber,
  Upload,
  Spin,
  Row,
  Col,
} from "antd";
import message from "@/lib/message";
import styled from "styled-components";
import {
  Star,
  X,
  ImagePlus,
  Clock,
  Building2,
  FileText,
  Info,
  Shield,
  Globe,
  Link as LinkIcon,
  Hash,
} from "lucide-react";
import { motion } from "framer-motion";
import { theme } from "@/components/theme";
import dayjs from "dayjs";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";

const { Option } = Select;
const { Title, Text } = Typography;

const timezones = (() => {
  try {
    if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
      const allTimezones = Intl.supportedValuesOf("timeZone");
      const filteredTimezones = allTimezones.filter(
        (tz) => tz.includes("/") || tz === "UTC" || tz === "GMT"
      );
      const now = new Date();
      return filteredTimezones
        .map((tz) => {
          try {
            const offsetString = new Intl.DateTimeFormat("en", {
              timeZone: tz,
              timeZoneName: "longOffset",
            })
              .formatToParts(now)
              .find((part) => part.type === "timeZoneName")?.value;
            const displayName = tz.replace(/_/g, " ").split("/").pop();
            const region = tz.includes("/")
              ? tz.split("/")[0].replace(/_/g, " ")
              : "";
            return {
              value: tz,
              label: `${offsetString} - ${displayName}${
                region ? ` (${region})` : ""
              }`,
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
    } else {
      throw new Error("Intl API not supported");
    }
  } catch (e) {
    console.error("Error generating timezone list, using fallback:", e);
    return [
      { value: "UTC", label: "GMT+0:00 - UTC" },
      { value: "America/New_York", label: "GMT-4:00 - New York (America)" },
      { value: "America/Chicago", label: "GMT-5:00 - Chicago (America)" },
      { value: "America/Denver", label: "GMT-6:00 - Denver (America)" },
      {
        value: "America/Los_Angeles",
        label: "GMT-7:00 - Los Angeles (America)",
      },
      { value: "Europe/London", label: "GMT+1:00 - London (Europe)" },
      { value: "Europe/Paris", label: "GMT+2:00 - Paris (Europe)" },
      { value: "Asia/Tokyo", label: "GMT+9:00 - Tokyo (Asia)" },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }
})();

const defaultBusinessHours = [
  { day: "Mon", isOpen: true, open: "09:00", close: "17:00" },
  { day: "Tue", isOpen: true, open: "09:00", close: "17:00" },
  { day: "Wed", isOpen: true, open: "09:00", close: "17:00" },
  { day: "Thu", isOpen: true, open: "09:00", close: "17:00" },
  { day: "Fri", isOpen: true, open: "09:00", close: "17:00" },
  { day: "Sat", isOpen: false, open: "09:00", close: "17:00" },
  { day: "Sun", isOpen: false, open: "09:00", close: "17:00" },
];

// --- STYLED COMPONENTS ---
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

// --- INPUT STYLES UPDATED FOR MOBILE (16px) ---
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

const StyledTextArea = styled(Input.TextArea)`
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  border-radius: ${(props) => props.theme.token.borderRadius}px;

  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
    textarea {
      font-size: 16px !important;
    }
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

  @media (max-width: 768px) {
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
  margin-top: ${(props) => props.theme.token.marginLG}px;
  gap: ${(props) => props.theme.token.marginXS}px;

  .ant-checkbox + span {
    font-size: ${(props) => props.theme.token.fontSizeSM || "12px"};
    color: ${(props) => props.theme.token.colorTextSecondary};
    line-height: 1.5;
  }
`;

const StyledDragger = styled(Upload.Dragger)`
  .ant-upload {
    padding: 0 !important;
  }
  &.ant-upload.ant-upload-drag {
    border: none;
    background: transparent;
    padding: 0;
    height: auto;

    .ant-upload-btn {
      padding: 0;
      display: block;
      height: 100%;
    }

    .ant-upload-drag-container {
      display: block;
    }

    &:hover {
      border: none !important;
    }
  }
`;

const ImageCard = styled.div`
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  max-width: 200px;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  ${(props) =>
    props.$isUpload &&
    `
    cursor: pointer;
    gap: ${props.theme.token.marginXS}px;
    &:hover {
      border-color: ${props.theme.token.colorPrimary};
    }
  `}

  ${(props) =>
    props.$hasImage &&
    `
    border-style: solid;
    border-color: ${props.theme.token.colorBorderSecondary};
  `}
`;

const ImagePreview = styled.div`
  width: 100%;
  height: 100%;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
`;

const ImageActions = styled.div`
  position: absolute;
  top: ${(props) => props.theme.token.marginXS}px;
  right: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  gap: ${(props) => props.theme.token.marginXS}px;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: white;
    transform: scale(1.1);
  }
`;

const CoverBadge = styled.div`
  position: absolute;
  bottom: ${(props) => props.theme.token.marginXS}px;
  left: ${(props) => props.theme.token.marginXS}px;
  background: ${(props) => props.theme.token.colorPrimary};
  color: white;
  padding: 6px 12px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const HoursRow = styled(Row)`
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 8px;
  background: ${(props) => (props.$isClosed ? "#f8f9fa" : "transparent")};

  @media (max-width: 768px) {
    padding: 4px;
    margin-bottom: 8px;
  }

  .day-label {
    font-weight: 600;
    color: ${(props) => props.theme.token.colorTextSecondary};
  }
`;

const ApplyAllCheckbox = styled(Checkbox)`
  margin-top: 1rem;
  font-weight: 500;
`;

const BusinessInfoStep = ({
  onSubmit,
  initialData = {},
  onFormSubmitFailed,
}) => {
  const [form] = Form.useForm();
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const businessImageFile = Form.useWatch("businessImage", form);
  const businessHours = Form.useWatch("businessHours", form);
  const isMounted = useRef(false);
  const { location: ipLocation } = useIpGeolocation();

  useEffect(() => {
    if (isMounted.current) {
      return;
    }

    let dataToSet = {
      ...initialData,
      businessHours: (initialData.businessHours || []).length
        ? initialData.businessHours.map((d) => ({
            ...d,
            time: [
              d.open ? dayjs(d.open, "HH:mm") : null,
              d.close ? dayjs(d.close, "HH:mm") : null,
            ],
          }))
        : defaultBusinessHours.map((d) => ({
            ...d,
            time: [
              d.open ? dayjs(d.open, "HH:mm") : null,
              d.close ? dayjs(d.close, "HH:mm") : null,
            ],
          })),
    };

    form.setFieldsValue(dataToSet);
    isMounted.current = true;
  }, [form, initialData]);

  useEffect(() => {
    if (
      ipLocation?.timezone &&
      !initialData.business_timezone &&
      !form.getFieldValue("business_timezone") &&
      timezones.some((tz) => tz.value === ipLocation.timezone)
    ) {
      form.setFieldsValue({ business_timezone: ipLocation.timezone });
    }
  }, [ipLocation, form, initialData.business_timezone]);

  useEffect(() => {
    let objectUrl = null;
    if (businessImageFile instanceof File) {
      objectUrl = URL.createObjectURL(businessImageFile);
      setImagePreviewUrl(objectUrl);
    } else {
      setImagePreviewUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [businessImageFile]);

  const handleBeforeUpload = (file) => {
    const isValidSize = file.size <= 10 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const isValidType = validTypes.includes(file.type);

    if (!isValidSize) {
      message.error("File size too large. Max 10MB.");
      return Upload.LIST_IGNORE;
    }

    if (!isValidType) {
      message.error("Please upload JPG, PNG, or WEBP images only.");
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        message.error("Invalid or corrupted image file.");
        form.setFieldsValue({ businessImage: null });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    form.setFieldsValue({ businessImage: file });
    form.validateFields(["businessImage"]);

    return false;
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    form.setFieldsValue({ businessImage: null });
    form.validateFields(["businessImage"]);
  };

  const handleSubmit = (values) => {
    const formattedHours = (values.businessHours || []).map((day) => ({
      day: day.day,
      isOpen: day.isOpen,
      open:
        day.isOpen && day.time && day.time[0]
          ? day.time[0].format("HH:mm")
          : null,
      close:
        day.isOpen && day.time && day.time[1]
          ? day.time[1].format("HH:mm")
          : null,
    }));

    onSubmit({ ...values, businessHours: formattedHours });
  };

  const handleFinishFailed = (errorInfo) => {
    if (onFormSubmitFailed) {
      onFormSubmitFailed(errorInfo);
    }
  };

  const normalizeUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return trimmedUrl;
    if (trimmedUrl.match(/^https?:\/\//i)) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const validateUrl = (_, value) => {
    if (!value || !value.trim()) return Promise.resolve();
    const normalizedUrl = normalizeUrl(value);
    const urlPattern =
      /^(https?:\/\/)?((([a-zA-Z0-9\-_]+)\.)+[a-zA-Z]{2,})(\/[a-zA-Z0-9\-_.~:/?#\[\]@!$&'()*+,;=]*)?$/;
    if (!urlPattern.test(normalizedUrl)) {
      return Promise.reject(
        new Error("URL contains invalid characters or format.")
      );
    }
    try {
      new URL(normalizedUrl);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(
        new Error("Please enter a valid URL (e.g., example.com)")
      );
    }
  };

  const validateSocialUrl = (platform) => (_, value) => {
    if (!value || !value.trim()) return Promise.resolve();
    const normalizedUrl = normalizeUrl(value);
    try {
      const url = new URL(normalizedUrl);
      const hostname = url.hostname.toLowerCase();
      const platformDomains = {
        facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
        instagram: ["instagram.com", "www.instagram.com"],
        twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
        linkedin: ["linkedin.com", "www.linkedin.com"],
      };
      if (platform && platformDomains[platform]) {
        if (!platformDomains[platform].includes(hostname)) {
          return Promise.reject(
            new Error(`Please enter a valid ${platform} URL`)
          );
        }
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error("Please enter a valid URL."));
    }
  };

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Host Information</StepTitle>
        <StepDescription>
          Let's start by learning about your experience business. This
          information helps guests understand what you offer and builds trust in
          your services.
        </StepDescription>
      </StepHeader>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={handleFinishFailed}
        id="step-0-form"
      >
        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FormGroup>
            <FormLabel>
              <Building2 size={16} />
              Business / Host Name
            </FormLabel>
            <HelpText>
              <Info size={14} />
              How should you or your business be displayed on our platform?
            </HelpText>
            <Form.Item
              name="businessName"
              rules={[
                {
                  required: true,
                  message: "Please enter your business or host name",
                },
              ]}
            >
              <StyledInput
                placeholder="e.g., City Food Tours, Sunset Kayaking, Pottery by Sarah"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <Building2 size={16} />
              Business Type
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Select the type that best describes your experience business.
            </HelpText>
            <Form.Item
              name="businessType"
              rules={[
                { required: true, message: "Please select your business type" },
              ]}
            >
              <StyledSelect
                placeholder="Select your business type"
                size="large"
              >
                <Option value="individual">Individual Host</Option>
                <Option value="tour-operator">Tour Operator</Option>
                <Option value="experience-group">Experience Group</Option>
                <Option value="venue">Venue / Studio</Option>
                <Option value="event-organizer">Event Organizer</Option>
              </StyledSelect>
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>Founding Year (Optional)</FormLabel>
            <HelpText>
              <Info size={14} />
              What year did you start hosting experiences?
            </HelpText>
            <Form.Item
              name="founding_year"
              rules={[
                {
                  type: "integer",
                  min: 1800,
                  max: new Date().getFullYear(),
                  message: "Please enter a valid year",
                },
              ]}
            >
              <StyledInputNumber
                placeholder={`e.g., ${new Date().getFullYear() - 5}`}
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <Globe size={16} />
              Business Timezone
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Select the primary timezone for your operations.
            </HelpText>
            <Form.Item
              name="business_timezone"
              rules={[
                {
                  required: true,
                  message: "Please select your business timezone",
                },
              ]}
            >
              <StyledSelect
                placeholder="Select your business timezone"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
                options={timezones}
              />
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <ImagePlus size={16} />
            Visual Identity
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGroup>
            <FormLabel>
              <ImagePlus size={16} />
              Business Image
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Drag & drop or click to upload a photo that represents your
              business - this could be your logo, a photo of you, or an action
              shot of your experience.
            </HelpText>
            <div style={{ maxWidth: "200px" }}>
              <StyledDragger
                name="businessImageUpload"
                multiple={false}
                showUploadList={false}
                beforeUpload={handleBeforeUpload}
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploading}
              >
                <ImageCard $isUpload $hasImage={!!imagePreviewUrl}>
                  {isUploading ? (
                    <Spin />
                  ) : imagePreviewUrl ? (
                    <>
                      <ImagePreview src={imagePreviewUrl} />
                      <ImageActions>
                        <ActionButton
                          onClick={handleRemoveImage}
                          title="Remove image"
                          type="button"
                        >
                          <X size={16} />
                        </ActionButton>
                      </ImageActions>
                      <CoverBadge>
                        <Star size={12} />
                        Cover Photo
                      </CoverBadge>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={32} color="#94a3b8" />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#334155",
                        }}
                      >
                        Add Business Photo
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Drag & drop or click
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        JPG, PNG, WEBP up to 10MB
                      </span>
                    </>
                  )}
                </ImageCard>
              </StyledDragger>
            </div>
            <Form.Item
              name="businessImage"
              rules={[
                { required: true, message: "Please upload a business image" },
              ]}
            >
              <Input type="hidden" />
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <Building2 size={16} />
            About Your Experience
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FormGroup>
            <FormLabel>
              <FileText size={16} />
              Description
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Describe what you offer, your background, and what makes your
              experiences unique. (250-750 characters)
            </HelpText>
            <Form.Item
              name="businessDescription"
              rules={[
                {
                  required: true,
                  message: "Please enter a description",
                },
                {
                  min: 250,
                  message: "Description must be at least 250 characters.",
                },
                {
                  max: 750,
                  message: "Description cannot exceed 750 characters.",
                },
              ]}
            >
              <StyledTextArea
                placeholder="Tell guests about your passion, what they will do, and what to expect..."
                maxLength={750}
                showCount
                autoSize={{ minRows: 5, maxRows: 8 }}
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <Hash size={16} />
              Tags/Keywords (Optional)
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Add relevant tags or keywords to help guests find you (e.g.,
              walking tour, wine tasting, date-night fun, pottery workshop).
              Press Enter to add a tag.
            </HelpText>
            <Form.Item name="tags_keywords">
              <StyledTagsSelect
                mode="tags"
                style={{ width: "100%" }}
                placeholder="Type and press Enter to add tags"
                tokenSeparators={[","]}
                size="large"
              />
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <LinkIcon size={16} />
            Online Presence (Optional)
          </span>
        </SectionDivider>
        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <FormGroup>
            <FormLabel>
              <Globe size={16} />
              Website URL
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Your official business website, if you have one.
            </HelpText>
            <Form.Item
              name="website"
              rules={[{ validator: validateUrl }]}
              normalize={normalizeUrl}
            >
              <StyledInput
                placeholder="https://www.your-business.com"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>Facebook Profile URL</FormLabel>
            <Form.Item
              name="facebook_url"
              rules={[{ validator: validateSocialUrl("facebook") }]}
              normalize={normalizeUrl}
            >
              <StyledInput
                placeholder="https://facebook.com/yourbusiness"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>Instagram Profile URL</FormLabel>
            <Form.Item
              name="instagram_url"
              rules={[{ validator: validateSocialUrl("instagram") }]}
              normalize={normalizeUrl}
            >
              <StyledInput
                placeholder="https://instagram.com/yourbusiness"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>Twitter (X) Profile URL</FormLabel>
            <Form.Item
              name="twitter_url"
              rules={[{ validator: validateSocialUrl("twitter") }]}
              normalize={normalizeUrl}
            >
              <StyledInput
                placeholder="https://x.com/yourbusiness or twitter.com/yourbusiness"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <LinkIcon size={16} />
              LinkedIn Profile URL
            </FormLabel>
            <Form.Item
              name="linkedin_url"
              rules={[{ validator: validateSocialUrl("linkedin") }]}
              normalize={normalizeUrl}
            >
              <StyledInput
                placeholder="https://linkedin.com/company/yourbusiness"
                size="large"
              />
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <Clock size={16} />
            Operating Hours
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <FormGroup>
            <FormLabel>
              <Clock size={16} />
              Typical Availability
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Set your general operating hours for each day of the week.
            </HelpText>
            <Form.Item
              name="businessHours"
              rules={[
                {
                  validator: async (_, hours) => {
                    if (!hours || !hours.some((day) => day.isOpen)) {
                      return Promise.reject(
                        new Error("Please set hours for at least one open day.")
                      );
                    }
                    for (const day of hours) {
                      if (
                        day.isOpen &&
                        (!day.time || !day.time[0] || !day.time[1])
                      ) {
                        return Promise.reject(
                          new Error(
                            `Please set both opening and closing times for ${day.day}.`
                          )
                        );
                      }
                      if (
                        day.isOpen &&
                        day.time &&
                        day.time[0] &&
                        day.time[1]
                      ) {
                        // Use unix() or valueOf() for numeric comparison
                        if (day.time[0].valueOf() >= day.time[1].valueOf()) {
                          return Promise.reject(
                            new Error(
                              `Closing time must be after opening time for ${day.day}.`
                            )
                          );
                        }
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <>
                {(businessHours || []).map((day, index) => (
                  <HoursRow key={day.day} gutter={16} $isClosed={!day.isOpen}>
                    <Col xs={24} sm={4}>
                      <span className="day-label">{day.day}</span>
                    </Col>
                    <Col xs={12} sm={4}>
                      <Form.Item
                        name={["businessHours", index, "isOpen"]}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>{day.isOpen ? "Open" : "Closed"}</Checkbox>
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={16}>
                      <Form.Item
                        name={["businessHours", index, "time"]}
                        noStyle
                      >
                        <TimePicker.RangePicker
                          use12Hours
                          format="h:mm A"
                          minuteStep={15}
                          disabled={!day.isOpen}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </HoursRow>
                ))}
              </>
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          <span>
            <Shield size={16} />
            Liability Agreement
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <FormGroup>
            <FormLabel>
              <Shield size={16} />
              Liability Agreement
            </FormLabel>
            <Form.Item
              name="liabilityWaiver"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("You must agree to the liability waiver")
                        ),
                },
              ]}
            >
              <StyledCheckbox>
                I understand that ClassEasily acts as a platform connecting
                hosts and guests, and is not liable for any incidents, damages,
                or disputes that may arise between parties. I take full
                responsibility for my hosting services and interactions with
                guests.
              </StyledCheckbox>
            </Form.Item>
          </FormGroup>
        </FormSection>
      </StyledForm>
    </ConfigProvider>
  );
};

export default BusinessInfoStep;
