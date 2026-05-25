"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Button, Result, Typography } from "antd";
import { UserPlus, LogIn } from "lucide-react";

const { Paragraph } = Typography;

const ShadowUserModal = ({
  open,
  onCancel,
  onCreate,
  onImpersonate,
  loading,
  impersonateLoading = false,
}) => {
  const [form] = Form.useForm();
  const [createdUser, setCreatedUser] = useState(null);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = await onCreate(values);
      if (result && result.userId) {
        setCreatedUser(result);
      }
    } catch (e) {
      // Validation failed
    }
  };

  const handleClose = () => {
    form.resetFields();
    setCreatedUser(null);
    onCancel();
  };

  // 1. SUCCESS STATE: User created, prompt to impersonate
  if (createdUser) {
    return (
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        centered
      >
        <Result
          status="success"
          title="Shadow Account Ready"
          subTitle={`Account for ${createdUser.email} is created and verified. You can now impersonate them to set up their business.`}
          extra={[
            <Button
              type="primary"
              key="impersonate"
              icon={<LogIn size={16} />}
              loading={impersonateLoading}
              disabled={impersonateLoading}
              onClick={() => {
                onImpersonate(createdUser.userId);
                handleClose();
              }}
              style={{ backgroundColor: "#10b981" }}
            >
              Impersonate & Setup Now
            </Button>,
            <Button key="close" onClick={handleClose}>
              Close & Do Later
            </Button>,
          ]}
        />
      </Modal>
    );
  }

  // 2. FORM STATE: Input details
  return (
    <Modal
      title="Concierge Onboarding"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Create a "Shadow Account" to set up a business on behalf of a user.
          The user will <b>not</b> receive an email until you explicitly send
          the Handover Invite later.
        </Paragraph>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Jane" />
          </Form.Item>
          <Form.Item
            name="last_name"
            label="Last Name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Doe" />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: "Required" },
            { type: "email", message: "Invalid email" },
          ]}
        >
          <Input
            prefix={<UserPlus size={16} />}
            placeholder="client@business.com"
          />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            key={loading ? "loading" : "idle"}
            type="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            Create Shadow Account
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ShadowUserModal;
