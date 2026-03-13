"use client";

import React, { useState, useEffect } from "react";
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
} from "antd";
import message from "@/lib/message";
import { businessMembershipService, businessClassService } from "@/services/apiService";

const { TextArea } = Input;
const { Option } = Select;

export default function ProductDrawer({ open, onClose, product, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);

  const isEdit = !!product?.id;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue({
        name: product.name,
        description: product.description || "",
        price: product.price,
        currency: product.currency || "CAD",
        billing_interval: product.billing_interval || "month",
        access_type: product.access_type || "unlimited",
        credit_allowance: product.credit_allowance ?? undefined,
        credit_unit: product.credit_unit || "",
        applicable_class_ids: product.applicable_class_ids || [],
        is_active: product.is_active !== false,
        requires_approval: product.requires_approval || false,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        currency: "CAD",
        billing_interval: "month",
        access_type: "unlimited",
        is_active: true,
        requires_approval: false,
        applicable_class_ids: [],
      });
    }
  }, [open, isEdit, product, form]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await businessClassService.fetchBusinessClasses({ status: "active" });
      if (res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      }
    })();
  }, [open]);

  const accessType = Form.useWatch("access_type", form) || "unlimited";

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description || "",
        price: values.price,
        currency: values.currency || "CAD",
        billing_interval: values.billing_interval || "month",
        access_type: values.access_type || "unlimited",
        credit_allowance: values.access_type === "credits" ? values.credit_allowance : null,
        credit_unit: values.access_type === "credits" ? (values.credit_unit || "").trim() : "",
        applicable_class_ids: values.applicable_class_ids || [],
        is_active: values.is_active !== false,
        requires_approval: values.requires_approval || false,
      };

      if (isEdit) {
        const updateRes = await businessMembershipService.updateProduct(product.id, payload);
        if (!updateRes.success) {
          message.error(updateRes.error || "Failed to update");
          setSaving(false);
          return;
        }
        const syncRes = await businessMembershipService.syncStripe(product.id);
        if (!syncRes.success) message.warning("Saved but Stripe sync failed: " + (syncRes.error || ""));
        else message.success("Plan updated");
      } else {
        const createRes = await businessMembershipService.createProduct(payload);
        if (!createRes.success) {
          message.error(createRes.error || "Failed to create");
          setSaving(false);
          return;
        }
        const newId = createRes.data?.id;
        if (newId) {
          const syncRes = await businessMembershipService.syncStripe(newId);
          if (!syncRes.success) message.warning("Created but Stripe sync failed: " + (syncRes.error || ""));
        }
        message.success("Plan created");
      }
      onSaved?.();
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map((c) => ({
    value: c.classId ?? c.id,
    label: c.title || `Class ${c.classId ?? c.id}`,
  }));

  return (
    <Drawer
      title={isEdit ? "Edit membership plan" : "Create membership plan"}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          currency: "CAD",
          billing_interval: "month",
          access_type: "unlimited",
          is_active: true,
          requires_approval: false,
          applicable_class_ids: [],
        }}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
          <Input placeholder="e.g. Potters Club" maxLength={200} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Short description" />
        </Form.Item>
        <Space style={{ width: "100%" }} size="middle">
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: 120 }} addonBefore="$" />
          </Form.Item>
          <Form.Item name="currency" label="Currency">
            <Select style={{ width: 80 }}>
              <Option value="CAD">CAD</Option>
              <Option value="USD">USD</Option>
            </Select>
          </Form.Item>
          <Form.Item name="billing_interval" label="Billing">
            <Select style={{ width: 120 }}>
              <Option value="month">Monthly</Option>
              <Option value="year">Yearly</Option>
            </Select>
          </Form.Item>
        </Space>
        <Form.Item name="access_type" label="Access type">
          <Select>
            <Option value="unlimited">Unlimited</Option>
            <Option value="credits">Credits</Option>
          </Select>
        </Form.Item>
        {accessType === "credits" && (
          <>
            <Form.Item
              name="credit_allowance"
              label="Credits per period"
              rules={[{ required: true, message: "Required for credits" }]}
            >
              <InputNumber min={1} integer style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="credit_unit" label="Credit unit (e.g. 2-hour sessions)">
              <Input placeholder="e.g. 2-hour sessions" maxLength={100} />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="applicable_class_ids"
          label="Applicable classes"
          extra="Leave empty for all classes"
        >
          <Select
            mode="multiple"
            placeholder="All classes"
            options={classOptions}
            allowClear
            showSearch
            filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item name="requires_approval" label="Requires approval" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="is_active" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
