"use client";

import { useState } from "react";
import { Modal, Form, Input, Button, ConfigProvider, message } from "antd";
import styled from "styled-components";
import { corporateBookingService } from "@/services/apiService";
import { theme as appTheme } from "@/components/theme";

const HelpLink = styled.button`
  display: inline-block;
  margin-top: 1.25rem;
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #334155;
  }
`;

export default function SupportContactModal({
  token,
  defaultName = "",
  defaultEmail = "",
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const openModal = () => {
    form.setFieldsValue({
      name: defaultName || "",
      email: defaultEmail || "",
      message: "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await corporateBookingService.submitSupport(token, {
        name: values.name,
        email: values.email,
        message: values.message,
      });
      message.success("Message sent — we'll be in touch soon.");
      setOpen(false);
      form.resetFields();
    } catch (e) {
      form.setFields([
        {
          name: "message",
          errors: [e?.response?.data?.detail || "Could not send message. Please try again."],
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <HelpLink type="button" onClick={openModal}>
        Need help?
      </HelpLink>
      <ConfigProvider theme={appTheme}>
        <Modal
          title="Contact us"
          open={open}
          onCancel={() => setOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setOpen(false)}>
              Cancel
            </Button>,
            <Button key="send" type="primary" loading={submitting} onClick={handleSubmit}>
              Send message
            </Button>,
          ]}
          destroyOnClose
        >
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            We&apos;ll email your ClassEasily representative and send you a confirmation.
          </p>
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item name="name" label="Your name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: "email", message: "Valid email required" }]}
            >
              <Input placeholder="name@company.com" />
            </Form.Item>
            <Form.Item
              name="message"
              label="How can we help?"
              rules={[{ required: true, message: "Please enter a message" }]}
            >
              <Input.TextArea rows={4} placeholder="Questions about dates, pricing, or logistics…" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </>
  );
}
