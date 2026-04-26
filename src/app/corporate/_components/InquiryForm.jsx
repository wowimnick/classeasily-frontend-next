"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Form, Input, Select, Button, Alert, Typography } from "antd";
import styled from "styled-components";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { corporateService } from "@/services/apiService";

const { TextArea } = Input;
const { Title, Text } = Typography;

const Wrap = styled.section`
  position: relative;
  overflow: hidden;
  padding: 64px 1.5rem 112px;
  background: linear-gradient(180deg, #fff5f7 0%, #f8fafc 45%, #fff 100%);
  color: #0f172a;
`;

const Inner = styled.div`
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const InquiryGradientStrip = styled.div`
  position: absolute;
  left: -56%;
  width: 190%;
  height: 160px;
  top: 56%;
  transform: translateY(-50%) rotate(-22deg);
  z-index: 0;
  overflow: hidden;
  border-radius: 4px;
  pointer-events: none;
  @media (max-width: 900px) {
    top: 60%;
    width: 220%;
  }
`;

const InquiryGradientCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #ffffff;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #ffffff;
  --gradient-color-4: #f4f4f5;
`;

const Card = styled.div`
  background: #fff;
  color: #0f172a;
  border-radius: 22px;
  padding: 2rem 1rem 1rem;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.1);
`;

const Stepper = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const StepDot = styled.span`
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: ${(p) => (p.$on ? "#e11d48" : "#e2e8f0")};
  transition: background 0.25s ease;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const Chip = styled.button`
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$on ? "#e11d48" : "#e2e8f0")};
  background: ${(p) => (p.$on ? "#fff1f2" : "#fff")};
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
  &:focus-visible {
    outline: 2px solid #e11d48;
    outline-offset: 2px;
  }
`;

const ActionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const FooterSpacer = styled.div`
  min-width: 80px;
`;

const USE_CASES = [
  { id: "offsite", label: "Team offsite" },
  { id: "holiday_party", label: "Holiday / celebration" },
  { id: "client_event", label: "Client entertaining" },
  { id: "erg", label: "ERG / affinity group" },
  { id: "leadership", label: "Leadership retreat" },
  { id: "onboarding", label: "Onboarding week" },
];

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

export default function InquiryForm() {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);

  useEffect(() => {
    let gradient;
    import("stripe-gradient")
      .then(({ Gradient }) => {
        gradient = new Gradient();
        gradient.initGradient("#inquiry-gradient-canvas");
      })
      .catch(() => {});

    return () => {
      if (gradient && typeof gradient.disconnect === "function") {
        gradient.disconnect();
      }
    };
  }, []);

  const toggleCase = (id) => {
    setSelectedCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

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
          use_cases: selectedCases,
          preferred_date: values.preferred_date || "",
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
      setSelectedCases([]);
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

  return (
    <Wrap id="inquiry">
      <InquiryGradientStrip>
        <InquiryGradientCanvas id="inquiry-gradient-canvas" data-transition-in />
      </InquiryGradientStrip>
      <Inner>
        <div style={{ marginBottom: "1.5rem" }}>
          <Title level={3} style={{ color: "#0f172a", marginBottom: 6 }}>
            Plan something your team will remember
          </Title>
          <Text style={{ color: "#64748b", fontSize: "1rem", lineHeight: 1.55 }}>
            Two quick steps — then our team follows up within two business days. Prefer
            live alignment?{" "}
            <span style={{ color: "#be123c", fontWeight: 600 }}>
              Ask for a 20-minute consultation
            </span>{" "}
            in your message.
          </Text>
        </div>
        <Card>
          <Stepper aria-hidden>
            <StepDot $on={step >= 0} />
            <StepDot $on={step >= 1} />
          </Stepper>

          {status === "success" && (
            <Alert
              type="success"
              showIcon
              message="Thanks! We received your inquiry."
              description="Check your inbox for a confirmation—we’ll be in touch shortly."
              style={{ marginBottom: 20 }}
            />
          )}
          {status === "error" && (
            <Alert
              type="error"
              showIcon
              message="Something went wrong."
              description={errorMessage || "Please try again or email support@classeasily.com."}
              style={{ marginBottom: 20 }}
            />
          )}

          <Form
            layout="vertical"
            form={form}
            onFinish={handleFormSubmit}
            requiredMark="optional"
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
                    <Form.Item label="Ideal date (optional)" name="preferred_date">
                      <Input type="date" size="middle" />
                    </Form.Item>
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>What are you planning?</div>
                      <ChipRow>
                        {USE_CASES.map((u) => (
                          <Chip
                            key={u.id}
                            type="button"
                            $on={selectedCases.includes(u.id)}
                            onClick={() => toggleCase(u.id)}
                          >
                            {u.label}
                          </Chip>
                        ))}
                      </ChipRow>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Select any that apply.
                      </Text>
                    </div>
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
                      <Input size="middle" placeholder="+1 …" autoComplete="tel" />
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
              {step === 0 ? (
                <Button type="primary" htmlType="button" size="middle" onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" size="middle" loading={loading}>
                  Submit inquiry
                </Button>
              )}
            </ActionFooter>
          </Form>
        </Card>
      </Inner>
    </Wrap>
  );
}
