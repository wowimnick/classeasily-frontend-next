"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Form, Input, Select, Button, Alert, Typography, Checkbox, Popover, Grid } from "antd";
import styled from "styled-components";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
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
  padding: 28px;
  @media (max-width: 1024px) {
    padding: 34px 28px;
  }
  @media (max-width: 640px) {
    padding: 26px 16px;
    border-radius: 14px;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 1.1rem;
`;

const FormStepper = styled.div`
  display: flex;
  gap: 0.55rem;
  margin-top: 1rem;
`;

const StepDot = styled.span`
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: ${(p) => (p.$on ? "#111827" : "#e5e7eb")};
  transition: background 0.25s ease;
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 20px;
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
    color:rgb(220, 223, 228);
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

const UseCaseGroup = styled(Checkbox.Group)`
  width: 100%;
`;

const UseCaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  @media (max-width: 380px) {
    gap: 8px;
  }
`;

const UseCaseOption = styled(Checkbox)`
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
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.45rem;
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
  min-width: 80px;
  @media (max-width: 480px) {
    display: none;
  }
`;

const VisualPanel = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 14px;
  display: flex;
  height: 750px;
  align-self: start;
  @media (max-width: 1200px) {
    height: 680px;
  }
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

const USE_CASES = [
  { id: "offsite", label: "Team offsite" },
  { id: "holiday_party", label: "Holiday / celebration" },
  { id: "client_event", label: "Client entertaining" },
  { id: "erg", label: "ERG / affinity group" },
  { id: "leadership", label: "Leadership retreat" },
  { id: "onboarding", label: "Onboarding week" },
];

const IMAGE_A_SRC = IMAGE_A_FILE.src;
const IMAGE_B_SRC = IMAGE_B_FILE.src;
const IMAGE_C_SRC = IMAGE_C_FILE.src;

const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};

const AnimatedStepContent = ({ children }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        <div style={{ border: "1px solid transparent", margin: "-1px" }}>{children}</div>
      </div>
    </motion.div>
  );
};

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
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitInquiry = async (values) => {
    setLoading(true);
    setStatus(null);
    setErrorMessage("");
    try {
      await corporateService.submitInquiry({
        company_name: values.company_name,
        contact_name: values.contact_name,
        email: values.email,
        phone: values.phone || "",
        company_size: values.company_size || "",
        message: values.message || "",
        meta: {
          source: "corporate_page",
          use_cases: values.use_cases || [],
          preferred_date: values.preferred_date?.format?.("YYYY-MM-DD") || "",
          city: values.city || "",
        },
      });
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
      setStep(0);
    } catch (e) {
      const apiDetail = e?.response?.data?.detail;
      if (typeof apiDetail === "string" && apiDetail.length > 0) {
        if (apiDetail.toLowerCase().includes("throttled")) {
          setErrorMessage("You have submitted too quickly. Please wait a moment and try again.");
        } else {
          setErrorMessage(apiDetail);
        }
      } else {
        setErrorMessage("Please try again or email support@classeasily.com.");
      }
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    try {
      await form.validateFields([
        "company_name",
        "company_size",
        "city",
        "preferred_date",
      ]);
      setStep(1);
    } catch {
      /* validation messages shown by antd */
    }
  };

  const handleFormSubmit = async (values) => {
    if (step === 0) {
      await next();
      return;
    }
    await submitInquiry(values);
  };

  const handlePrimaryAction = async () => {
    if (step === 0) {
      await next();
      return;
    }
    form.submit();
  };

  return (
    <Wrap id="inquiry">
      <Inner>
        <SectionLead>
          <Title level={3} style={{ color: "#0f172a", marginBottom: 8 }}>
            Plan something your team will remember
          </Title>
          <Text style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.55 }}>
            Two quick steps — then our team follows up within two business days. Prefer
            live alignment?{" "}
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
              <FormStepper aria-hidden>
                <StepDot $on={step >= 0} />
                <StepDot $on={step >= 1} />
              </FormStepper>
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
              onFinish={handleFormSubmit}
              requiredMark="optional"
              initialValues={{ use_cases: [] }}
            >
              <AnimatedStepContent>
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div
                      key="s0"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Form.Item
                        label="Company"
                        name="company_name"
                        rules={[{ required: true, message: "Please enter your company name" }]}
                      >
                        <Input size="middle" placeholder="Acme Co." autoComplete="organization" />
                      </Form.Item>
                      <SplitFields>
                        <Form.Item label="City / metro" name="city">
                          <Input size="middle" placeholder="e.g. Austin" />
                        </Form.Item>
                        <Form.Item label="Company size" name="company_size">
                          <Select
                            size="middle"
                            allowClear
                            placeholder="Select a range"
                            options={[
                              { value: "1-10", label: "1–10" },
                              { value: "11-50", label: "11–50" },
                              { value: "51-200", label: "51–200" },
                              { value: "201-500", label: "201–500" },
                              { value: "501+", label: "501+" },
                            ]}
                          />
                        </Form.Item>
                      </SplitFields>
                      <Form.Item label="Ideal date (optional)" name="preferred_date">
                        <CorporateDateField />
                      </Form.Item>
                      <Form.Item label="What are you planning?" name="use_cases">
                        <UseCaseGroup>
                          <UseCaseGrid>
                            {USE_CASES.map((u) => (
                              <UseCaseOption key={u.id} value={u.id}>
                                {u.label}
                              </UseCaseOption>
                            ))}
                          </UseCaseGrid>
                        </UseCaseGroup>
                      </Form.Item>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>Select any that apply.</Text>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Form.Item
                        label="Your name"
                        name="contact_name"
                        rules={[{ required: true, message: "Please enter your name" }]}
                      >
                        <Input size="middle" placeholder="Jordan Lee" autoComplete="name" />
                      </Form.Item>
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
                      <Form.Item label="Details & goals" name="message">
                        <TextArea
                          rows={5}
                          maxLength={5000}
                          showCount
                          placeholder="Budget, accessibility, procurement, or a 20-min consult request…"
                        />
                      </Form.Item>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AnimatedStepContent>

              <ActionFooter>
                {step === 0 ? (
                  <FooterSpacer aria-hidden />
                ) : (
                  <Button htmlType="button" size="middle" onClick={() => setStep(0)}>
                    Back
                  </Button>
                )}
                <Button type="primary" htmlType="button" size="middle" loading={loading} onClick={handlePrimaryAction}>
                  {step === 0 ? "Continue" : "Submit inquiry"}
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
