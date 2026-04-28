"use client";

import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select, Button, Steps } from "antd";
import dayjs from "dayjs";

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
  const [step, setStep] = useState(0);
  const total = option?.price_total_cents || 0;
  const { deposit, balance } = computeDeposit(total, depositPercent);

  const dateChoices = (option?.proposed_date_options || []).map((iso) => ({
    value: iso,
    label: dayjs(iso).isValid() ? dayjs(iso).format("ddd, MMM D, YYYY h:mm A") : iso,
  }));

  useEffect(() => {
    const raw = option?.proposed_date_options || [];
    if (raw.length === 1) {
      form.setFieldsValue({ confirmed_datetime: raw[0] });
    }
  }, [option?.id, option?.proposed_date_options, form]);

  const next = async () => {
    if (step === 0) {
      await form.validateFields(["headcount", "confirmed_datetime"]);
      setStep(1);
      return;
    }
    if (step === 1) {
      await form.validateFields([
        "billing_company_name",
        "billing_contact_name",
        "billing_email",
      ]);
      setStep(2);
    }
  };

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
    <div
      style={{
        border: "1px solid #0f172a",
        borderRadius: 20,
        padding: "1.25rem",
        background: "#fff",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <Steps
        size="small"
        current={step}
        items={[{ title: "Event" }, { title: "Billing" }, { title: "Review" }]}
        style={{ marginBottom: 20 }}
      />
      <h3 style={{ marginTop: 0, color: "#0f172a" }}>{option?.title}</h3>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          headcount: option?.min_headcount || 8,
          billing_email: defaultEmail,
          billing_contact_name: defaultName,
          billing_company_name: defaultCompany,
        }}
      >
        {step === 0 ? (
          <>
            <Form.Item
              name="headcount"
              label="Headcount"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="confirmed_datetime"
              label="Date & time"
              rules={[{ required: true, message: "Pick a time" }]}
            >
              <Select
                options={dateChoices}
                placeholder="Select from proposed times"
                showSearch={false}
              />
            </Form.Item>
            <Form.Item name="special_requests" label="Notes (optional)">
              <Input.TextArea rows={3} maxLength={2000} showCount />
            </Form.Item>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Form.Item
              name="billing_company_name"
              label="Company"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="billing_contact_name"
              label="Contact name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="billing_email"
              label="Work email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="po_number" label="PO # (optional)">
              <Input />
            </Form.Item>
          </>
        ) : null}
        {step === 2 ? (
          <div style={{ color: "#334155", lineHeight: 1.6 }}>
            <p>
              <strong>Total:</strong> {(total / 100).toLocaleString(undefined, {
                style: "currency",
                currency: (currency || "usd").toUpperCase(),
              })}
            </p>
            <p>
              <strong>Deposit ({depositPercent}%):</strong>{" "}
              {(deposit / 100).toLocaleString(undefined, {
                style: "currency",
                currency: (currency || "usd").toUpperCase(),
              })}
            </p>
            <p>
              <strong>Balance (invoiced):</strong>{" "}
              {(balance / 100).toLocaleString(undefined, {
                style: "currency",
                currency: (currency || "usd").toUpperCase(),
              })}
            </p>
          </div>
        ) : null}
      </Form>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <Button onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 0 ? "Back" : "Previous"}
        </Button>
        <div style={{ flex: 1 }} />
        {step < 2 ? (
          <Button type="primary" onClick={next} style={{ background: "#0f172a" }}>
            Continue
          </Button>
        ) : (
          <Button
            type="primary"
            loading={submitting}
            onClick={finish}
            style={{ background: "#0f172a" }}
          >
            Confirm &amp; pay deposit
          </Button>
        )}
      </div>
    </div>
  );
}
