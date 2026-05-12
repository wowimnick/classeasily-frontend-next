"use client";

import { useState } from "react";
import { Form, Input, Select, Button, Alert, Typography, Checkbox, Popover, Grid } from "antd";
import styled from "styled-components";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import { corporateService } from "@/services/apiService";
import CustomCalendar from "@/app/(homepage)/_components/CustomCalendar";
import { MobileDatePicker } from "@/components/common/mobile/MobilePickers";
import IMAGE_C_FILE from "../../../../public/RTW_class_2.webp";
import IMAGE_B_FILE from "../../../../public/IMG_0972.webp";
import IMAGE_A_FILE from "../../../../public/IMG_8431.webp";
const { TextArea } = Input;
const { Title, Text } = Typography;

const Wrap = styled.section`
  position: relative;
  padding: 72px 1.5rem 112px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 58%, #ffffff 100%);
  color: #0f172a;
  @media (max-width: 768px) {
    padding: 56px 1rem 76px;
  }
`;

const Inner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const SectionLead = styled.div`
  max-width: 760px;
  margin-bottom: 1.6rem;
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const LayoutCard = styled.div`
  background: #fbfbfb;
  border-radius: 24px;
  padding: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  gap: 8px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12);
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
  @media (max-width: 640px) {
    border-radius: 18px;
    padding: 6px;
    gap: 6px;
  }
`;

const FormPanel = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  @media (max-width: 1024px) {
    padding: 28px 24px;
  }
  @media (max-width: 640px) {
    padding: 20px 16px;
    border-radius: 14px;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 1.1rem;
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 14px;
  }

  .ant-form-item-label > label {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  .ant-input,
  .ant-select-selector,
  .ant-input-affix-wrapper,
  .ant-picker,
  .ant-checkbox-group {
    border-radius: 10px !important;
    min-height: 46px;
    border-color: #e5e7eb !important;
    box-shadow: none !important;
    background: #fff !important;
    font-size: 14px;
  }

  .ant-input::placeholder,
  .ant-input-textarea textarea::placeholder,
  .ant-select-selection-placeholder {
    color: rgb(220, 223, 228);
  }

  .ant-select-arrow {
    color: #111827;
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper-focused,
  .ant-select-focused .ant-select-selector,
  .ant-picker-focused {
    border-color: #111827 !important;
  }
`;

const DateTriggerButton = styled.button`
  width: 100%;
  min-height: 46px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: ${(p) => (p.$hasValue ? "#111827" : "#6b7280")};
  font-size: 14px;
  text-align: left;
  padding: 11px 12px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: #111827;
    outline: none;
  }
`;

const SplitFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const ActivityGroup = styled(Checkbox.Group)`
  width: 100%;
`;

const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  @media (max-width: 380px) {
    gap: 8px;
  }
`;

const ActivityOption = styled(Checkbox)`
  &.ant-checkbox-wrapper {
    margin-inline-start: 0 !important;
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    transition: border-color 0.2s ease;
    background: #fff;
  }

  &.ant-checkbox-wrapper-checked {
    border-color: #111827;
    background: #f9fafb;
  }

  .ant-checkbox + span {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25rem;
    padding-inline-end: 0;
  }
`;

const ActionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  @media (max-width: 480px) {
    flex-direction: column-reverse;
    align-items: stretch;
    .ant-btn {
      width: 100%;
    }
  }

  .ant-btn {
    border-radius: 10px;
    min-height: 44px;
    padding: 0 20px;
    font-weight: 600;
  }

  .ant-btn-primary {
    background: #111827;
    border-color: #111827;
  }

  .ant-btn-primary:hover,
  .ant-btn-primary:focus {
    background: #1f2937 !important;
    border-color: #1f2937 !important;
  }
`;

const FooterSpacer = styled.div`
  flex: 1;
`;

const VisualPanel = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 14px;
  display: flex;
  height: 620px;
  align-self: center;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const MosaicCanvas = styled.div`
  width: 100%;
  border-radius: 18px;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const MosaicRegion = styled.div`
  position: absolute;
  overflow: hidden;
  background-image: url("${(p) => p.$src}");
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 16px;
`;

const RegionA = styled(MosaicRegion)`
  left: 0;
  top: 0;
  width: calc(50% - 3px);
  height: calc(66.6667% - 3px);
  background-position: 26% 38%;
`;

const RegionB = styled(MosaicRegion)`
  left: calc(50% + 3px);
  right: 0;
  top: 0;
  height: calc(33.3333% - 3px);
  background-position: 66% 28%;
`;

const RegionCTop = styled(MosaicRegion)`
  left: calc(50% + 3px);
  right: 0;
  top: calc(33.3333% + 3px);
  height: calc(33.3334% - 3px);
  background-size: 200% 300%;
  background-position: 100% 50%;
  border-radius: 16px 16px 0 0;
`;

const RegionCBottom = styled(MosaicRegion)`
  left: 0;
  right: 0;
  top: 66.6667%;
  bottom: 0;
  background-size: 100% 300%;
  background-position: 0 100%;
  border-radius: 16px 0 16px 16px;
`;

const GutterVertical = styled.span`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 33.3333%;
  width: 6px;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 999px;
`;

const GutterHorizontalTopRight = styled.span`
  position: absolute;
  left: 50%;
  right: 0;
  top: 33.3333%;
  height: 6px;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 999px;
`;

const GutterHorizontalBottomLeft = styled.span`
  position: absolute;
  left: 0;
  right: 50%;
  top: 66.6667%;
  height: 6px;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 999px;
`;

const ACTIVITY_INTERESTS = [
  { id: "food_drink", label: "Food & drink" },
  { id: "arts_crafts", label: "Arts & crafts" },
  { id: "wellness", label: "Wellness & mindfulness" },
  { id: "active_outdoor", label: "Active & outdoor" },
  { id: "music_performance", label: "Music & performance" },
  { id: "games", label: "Games & competitions" },
  { id: "learning", label: "Learning & skill-building" },
  { id: "open", label: "Open to suggestions" },
];

const GROUP_SIZE_OPTIONS = [
  { value: "1-10", label: "1–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51-100", label: "51–100" },
  { value: "101-250", label: "101–250" },
  { value: "250+", label: "250+" },
];

const IMAGE_A_SRC = IMAGE_A_FILE.src;
const IMAGE_B_SRC = IMAGE_B_FILE.src;
const IMAGE_C_SRC = IMAGE_C_FILE.src;

const CorporateDateField = ({ value, onChange }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <MobileDatePicker
        value={value}
        onChange={onChange}
        placeholder="Select date"
      />
    );
  }

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      content={
        <div style={{ width: "min(640px, 92vw)" }}>
          <CustomCalendar
            value={value}
            showQuickSelect={false}
            onChange={(dateValue) => {
              onChange?.(dayjs(dateValue));
              setOpen(false);
            }}
          />
        </div>
      }
    >
      <DateTriggerButton type="button" $hasValue={!!value}>
        {value ? dayjs(value).format("MMM D, YYYY") : "Select date"}
      </DateTriggerButton>
    </Popover>
  );
};

export default function InquiryForm() {
  const [form] = Form.useForm();
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const buildInquiryPayload = (values) => {
    const v = values || {};
    const company = typeof v.company_name === "string" ? v.company_name.trim() : v.company_name;
    const contact = typeof v.contact_name === "string" ? v.contact_name.trim() : v.contact_name;
    const email = typeof v.email === "string" ? v.email.trim() : v.email;
    return {
      company_name: company || "",
      contact_name: contact || "",
      email: email || "",
      phone: typeof v.phone === "string" ? v.phone.trim() : v.phone || "",
      company_size: v.company_size || "",
      message: typeof v.message === "string" ? v.message.trim() : v.message || "",
      meta: {
        source: "corporate_page",
        activity_interests: Array.isArray(v.activity_interests) ? v.activity_interests : [],
        preferred_date: v.preferred_date?.format?.("YYYY-MM-DD") || "",
        city: typeof v.city === "string" ? v.city.trim() : v.city || "",
      },
    };
  };

  const formatApiErrors = (data) => {
    if (!data || typeof data !== "object") return "";
    if (typeof data.detail === "string" && data.detail) return data.detail;
    const label = (key) =>
      ({
        company_name: "Company",
        contact_name: "Name",
        email: "Email",
        phone: "Phone",
        company_size: "Group size",
        message: "Message",
        meta: "Details",
        non_field_errors: "",
      }[key] || key.replace(/_/g, " "));
    const parts = [];
    for (const [key, val] of Object.entries(data)) {
      if (key === "detail" && typeof val === "string") {
        parts.push(val);
        continue;
      }
      const text = Array.isArray(val) ? val.join(" ") : String(val);
      if (!text) continue;
      const prefix = label(key);
      parts.push(prefix ? `${prefix}: ${text}` : text);
    }
    return parts.join(" ") || "Please check your input.";
  };

  const submitInquiry = async (values) => {
    setLoading(true);
    setStatus(null);
    setErrorMessage("");
    try {
      await corporateService.submitInquiry(buildInquiryPayload(values));
      setStatus("success");
      try {
        confetti({
          particleCount: 100,
          spread: 72,
          origin: { y: 0.72 },
          colors: ["#e11d48", "#fda4af", "#f8fafc", "#fb7185"],
        });
      } catch {
        /* optional */
      }
      form.resetFields();
    } catch (e) {
      const data = e?.response?.data;
      const apiDetail = typeof data?.detail === "string" ? data.detail : "";
      if (apiDetail && apiDetail.toLowerCase().includes("throttled")) {
        setErrorMessage("You have submitted too quickly. Please wait a moment and try again.");
      } else {
        const fromFields = formatApiErrors(data);
        if (fromFields) {
          setErrorMessage(fromFields);
        } else if (apiDetail) {
          setErrorMessage(apiDetail);
        } else {
          setErrorMessage("Please try again or email support@classeasily.com.");
        }
      }
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap id="inquiry">
      <Inner>
        <SectionLead>
          <Title level={3} style={{ color: "#0f172a", marginBottom: 8 }}>
            Plan something your team will remember
          </Title>
          <Text style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.55 }}>
            Tell us about your event — we&apos;ll respond within two business days. Prefer live alignment?{" "}
            <span style={{ color: "#111827", fontWeight: 700 }}>
              Ask for a 20-minute consultation
            </span>{" "}
            in your message.
          </Text>
        </SectionLead>
        <LayoutCard>
          <FormPanel>
            <FormHeader>
              <Title level={3} style={{ color: "#111827", margin: 0, fontSize: "1.5rem" }}>
                Corporate inquiry form
              </Title>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>
                Share a few details and we will build options your team will love.
              </Text>
            </FormHeader>

            {status === "success" && (
              <Alert
                type="success"
                showIcon
                message="Thanks! We received your inquiry."
                description="Check your inbox for a confirmation—we’ll be in touch shortly."
                style={{ marginBottom: 20, borderRadius: 10 }}
              />
            )}
            {status === "error" && (
              <Alert
                type="error"
                showIcon
                message="Something went wrong."
                description={errorMessage || "Please try again or email support@classeasily.com."}
                style={{ marginBottom: 20, borderRadius: 10 }}
              />
            )}

            <StyledForm
              layout="vertical"
              form={form}
              onFinish={submitInquiry}
              requiredMark="optional"
              initialValues={{ activity_interests: [] }}
            >
              <SplitFields>
                <Form.Item
                  label="Company"
                  name="company_name"
                  rules={[{ required: true, message: "Please enter your company name" }]}
                >
                  <Input size="middle" placeholder="Acme Co." autoComplete="organization" />
                </Form.Item>
                <Form.Item
                  label="Your name"
                  name="contact_name"
                  rules={[{ required: true, message: "Please enter your name" }]}
                >
                  <Input size="middle" placeholder="Jordan Lee" autoComplete="name" />
                </Form.Item>
              </SplitFields>
              <SplitFields>
                <Form.Item
                  label="Work email"
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Enter a valid email" },
                  ]}
                >
                  <Input size="middle" placeholder="you@company.com" autoComplete="email" />
                </Form.Item>
                <Form.Item label="Phone (optional)" name="phone">
                  <Input size="middle" placeholder="+1 (555) 000-0000" autoComplete="tel" />
                </Form.Item>
              </SplitFields>
              <SplitFields>
                <Form.Item label="City / metro" name="city">
                  <Input size="middle" placeholder="e.g. Austin" />
                </Form.Item>
                <Form.Item label="Group size" name="company_size" extra={<Text type="secondary">Roughly how many people will attend?</Text>}>
                  <Select
                    size="middle"
                    allowClear
                    placeholder="Select a range"
                    options={GROUP_SIZE_OPTIONS}
                  />
                </Form.Item>
              </SplitFields>
              <Form.Item label="Ideal date (optional)" name="preferred_date">
                <CorporateDateField />
              </Form.Item>
              <Form.Item label="What kind of experiences interest your team?" name="activity_interests">
                <ActivityGroup>
                  <ActivityGrid>
                    {ACTIVITY_INTERESTS.map((u) => (
                      <ActivityOption key={u.id} value={u.id}>
                        {u.label}
                      </ActivityOption>
                    ))}
                  </ActivityGrid>
                </ActivityGroup>
              </Form.Item>
              <Text style={{ fontSize: 12, color: "#6b7280", display: "block", marginTop: -8, marginBottom: 8 }}>
                Select any that apply.
              </Text>
              <Form.Item label="Tell us more (optional)" name="message">
                <TextArea
                  rows={3}
                  maxLength={5000}
                  showCount
                  placeholder="Budget, accessibility, procurement, or a 20-min consult request…"
                />
              </Form.Item>

              <ActionFooter>
                <FooterSpacer aria-hidden />
                <Button type="primary" htmlType="submit" size="middle" loading={loading}>
                  Submit inquiry
                </Button>
              </ActionFooter>
            </StyledForm>
          </FormPanel>

          <VisualPanel aria-hidden>
            <MosaicCanvas>
              <RegionA $src={IMAGE_A_SRC} />
              <RegionB $src={IMAGE_B_SRC} />
              <RegionCTop $src={IMAGE_C_SRC} />
              <RegionCBottom $src={IMAGE_C_SRC} />
              <GutterVertical />
              <GutterHorizontalTopRight />
              <GutterHorizontalBottomLeft />
            </MosaicCanvas>
          </VisualPanel>
        </LayoutCard>
      </Inner>
    </Wrap>
  );
}
