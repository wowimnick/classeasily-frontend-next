"use client";

import { useEffect, useState } from "react";
import { Alert, Button, ConfigProvider, Form, Input, InputNumber, Select } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import { motion } from "framer-motion";

const Layout = styled.div`
  display: flex;
  gap: 4rem;
  align-items: flex-start;

  @media (max-width: 992px) {
    flex-direction: column-reverse;
    gap: 2rem;
  }
`;

const FormColumn = styled.div`
  flex: 1;
  max-width: 540px;
`;

const SummaryColumn = styled.div`
  flex: 0 0 380px;
  position: sticky;
  top: 6rem;
  border: 1px solid #ebebeb;
  border-radius: 16px;
  padding: 1.5rem;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);

  @media (max-width: 992px) {
    position: static;
    flex: none;
    width: 100%;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 500;
  color: #000000;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #000000;
  font-size: 1rem;
  margin: 0 0 2rem 0;
  font-weight: 400;
`;

const SummaryTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  color: #000000;
  margin: 0 0 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ebebeb;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #000000;
  font-weight: 400;

  &:last-of-type {
    margin-bottom: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #ebebeb;
    font-weight: 500;
  }
`;

const DepositNote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #000000;
  background: #ffffff;
  border: 1px solid #ebebeb;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 400;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  color: #000000;
  margin: 0 0 1.5rem 0;
`;

function computeDeposit(totalCents, pct) {
  const t = Number(totalCents) || 0;
  const p = Math.min(100, Math.max(1, Number(pct) || 25));
  const d = Math.max(1, Math.round((t * p) / 100));
  return { deposit: d, balance: Math.max(0, t - d) };
}

export default function ChooseFlow({
  option,
  depositPercent,
  currency,
  defaultEmail,
  defaultName,
  defaultCompany,
  onCancel,
  onSubmit,
  submitting,
}) {
  const [form] = Form.useForm();
  const total = option?.price_total_cents || 0;
  const { deposit, balance } = computeDeposit(total, depositPercent);

  const rawDates = option?.proposed_date_options || [];
  const dateChoices = rawDates.map((iso) => ({
    value: iso,
    label: dayjs(iso).isValid() ? dayjs(iso).format("ddd, MMM D, YYYY h:mm A") : iso,
  }));
  const hasDates = dateChoices.length > 0;

  useEffect(() => {
    if (rawDates.length === 1) {
      form.setFieldsValue({ confirmed_datetime: rawDates[0] });
    }
  }, [option?.id, rawDates, form]);

  const finish = async () => {
    const v = await form.validateFields();
    await onSubmit({
      option_id: option.id,
      headcount: v.headcount,
      confirmed_datetime: v.confirmed_datetime,
      special_requests: v.special_requests || "",
      billing_company_name: v.billing_company_name,
      billing_contact_name: v.billing_contact_name,
      billing_email: v.billing_email,
      po_number: v.po_number || "",
      billing_address: {},
    });
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#e51d53",
          borderRadius: 8,
          fontFamily: "inherit",
          controlHeight: 48,
          colorText: "#000000",
          colorTextHeading: "#000000",
          colorTextLabel: "#000000",
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <Layout>
          <FormColumn>
            <Title>Confirm your reservation</Title>
            <Subtitle>{option?.title}</Subtitle>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                headcount: option?.min_headcount || 8,
                billing_email: defaultEmail || "",
                billing_contact_name: defaultName,
                billing_company_name: defaultCompany,
              }}
              requiredMark={false}
            >
              <SectionTitle>Event Details</SectionTitle>
              <Form.Item
                name="headcount"
                label={<span style={{ fontWeight: 400 }}>Number of guests</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} size="large" />
              </Form.Item>
              
              {!hasDates ? (
                <Alert
                  type="warning"
                  showIcon
                  message="No proposed times yet"
                  description="Please contact your representative to confirm availability."
                  style={{ marginBottom: 24, borderRadius: 8 }}
                />
              ) : (
                <Form.Item
                  name="confirmed_datetime"
                  label={<span style={{ fontWeight: 400 }}>Date & time</span>}
                  rules={[{ required: true, message: "Pick a time" }]}
                >
                  <Select
                    options={dateChoices}
                    placeholder="Select a proposed time"
                    size="large"
                  />
                </Form.Item>
              )}
              
              <Form.Item 
                name="special_requests" 
                label={<span style={{ fontWeight: 400 }}>Special requests (optional)</span>}
              >
                <Input.TextArea rows={4} placeholder="Any dietary restrictions or special needs?" />
              </Form.Item>

              <div style={{ height: "2rem" }} />
              <SectionTitle>Billing Information</SectionTitle>

              <Form.Item
                name="billing_company_name"
                label={<span style={{ fontWeight: 400 }}>Company name</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                name="billing_contact_name"
                label={<span style={{ fontWeight: 400 }}>Contact name</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                name="billing_email"
                label={<span style={{ fontWeight: 400 }}>Work email</span>}
                rules={[{ required: true, type: "email", message: "Valid email required" }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item 
                name="po_number" 
                label={<span style={{ fontWeight: 400 }}>PO Number (optional)</span>}
              >
                <Input size="large" />
              </Form.Item>
            </Form>
          </FormColumn>

          <SummaryColumn>
            <SummaryTitle>Pricing Summary</SummaryTitle>
            
            <DepositNote>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Secure with {depositPercent}% deposit
            </DepositNote>

            <SummaryRow>
              <span>Total (estimate)</span>
              <span>
                {(total / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: (currency || "usd").toUpperCase(),
                })}
              </span>
            </SummaryRow>
            <SummaryRow>
              <span>Balance (invoiced later)</span>
              <span>
                {(balance / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: (currency || "usd").toUpperCase(),
                })}
              </span>
            </SummaryRow>
            <SummaryRow>
              <span>Due now</span>
              <span>
                {(deposit / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: (currency || "usd").toUpperCase(),
                })}
              </span>
            </SummaryRow>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
              <Button 
                type="primary" 
                size="large" 
                loading={submitting} 
                onClick={finish}
                disabled={!hasDates}
                style={{ background: "#e51d53", width: "100%", height: "48px", fontWeight: 500 }}
              >
                Confirm & Pay
              </Button>
              <Button 
                size="large" 
                onClick={onCancel}
                style={{ width: "100%", height: "48px", fontWeight: 400 }}
              >
                Back to options
              </Button>
            </div>
            <p style={{ color: "#000000", fontSize: "0.875rem", textAlign: "center", marginTop: 16, fontWeight: 400 }}>
              You will be redirected to securely pay the deposit.
            </p>
          </SummaryColumn>
        </Layout>
      </motion.div>
    </ConfigProvider>
  );
}
