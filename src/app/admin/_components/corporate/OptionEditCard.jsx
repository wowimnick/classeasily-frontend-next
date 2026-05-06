"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { corporateAdminService } from "@/services/adminDash";
import { dollarsToCents, centsToDollarsInput } from "./dollarsField";

const { Text } = Typography;

export default function OptionEditCard({
  option,
  sortIndex,
  activeOptionsSorted,
  onRefresh,
  onSwapDown,
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const canMoveDown = sortIndex < activeOptionsSorted.length - 1;

  useEffect(() => {
    form.setFieldsValue({
      position: option.position,
      title: option.title,
      host_name: option.host_name,
      tagline: option.tagline || "",
      description: option.description || "",
      inclusions: option.inclusions || [],
      cover_image_url: option.cover_image_url || "",
      location_text: option.location_text || "",
      price_total_dollars: centsToDollarsInput(option.price_total_cents),
      price_per_person_dollars: option.price_per_person_cents
        ? centsToDollarsInput(option.price_per_person_cents)
        : "",
      dates: (option.proposed_date_options || []).join("\n"),
    });
  }, [option, form]);

  const save = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await corporateAdminService.updateOption(option.id, {
        title: v.title,
        host_name: v.host_name || "",
        tagline: v.tagline || "",
        description: v.description || "",
        inclusions: (v.inclusions || []).filter(Boolean),
        cover_image_url: v.cover_image_url || "",
        location_text: v.location_text || "",
        price_total_cents: dollarsToCents(v.price_total_dollars),
        price_per_person_cents: v.price_per_person_dollars
          ? dollarsToCents(v.price_per_person_dollars)
          : null,
        proposed_date_options: (v.dates || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        position: v.position,
      });
      message.success("Option saved");
      onRefresh();
    } catch (e) {
      message.error(e?.response?.data?.detail || e?.message || "Could not save option");
    } finally {
      setSaving(false);
    }
  };

  const archive = () => {
    Modal.confirm({
      title: "Archive this option?",
      content: "It will be hidden from the customer shortlist.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await corporateAdminService.deleteOption(option.id);
          message.success("Option archived");
          onRefresh();
        } catch (e) {
          message.error(e?.response?.data?.detail || "Could not archive");
        }
      },
    });
  };

  const srcLabel =
    option.source_type === "existing_class" ? "From class" : "Custom";

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <span>Slot {option.position}</span>
          <Text type="secondary">{srcLabel}</Text>
        </Space>
      }
      extra={
        <Space>
          {canMoveDown ? (
            <Button size="small" onClick={() => onSwapDown(sortIndex)}>
              Move down
            </Button>
          ) : null}
          <Button size="small" danger onClick={archive}>
            Archive
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="position" label="Position (1–3)" rules={[{ required: true }]}>
          <InputNumber min={1} max={3} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="host_name" label="Host / studio">
          <Input />
        </Form.Item>
        <Form.Item name="tagline" label="Tagline">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="inclusions" label="Inclusions">
          <Select mode="tags" placeholder="Type and press Enter" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="cover_image_url" label="Cover image URL">
          <Input />
        </Form.Item>
        <Form.Item name="location_text" label="Location">
          <Input />
        </Form.Item>
        <Form.Item
          name="price_total_dollars"
          label="Total price (USD)"
          rules={[{ required: true, message: "Enter total price" }]}
        >
          <Input prefix="$" placeholder="0.00" />
        </Form.Item>
        <Form.Item name="price_per_person_dollars" label="Price per person (USD, optional)">
          <Input prefix="$" placeholder="0.00" />
        </Form.Item>
        <Form.Item name="dates" label="Proposed date/times (ISO, one per line)">
          <Input.TextArea rows={3} placeholder="2026-05-01T18:00:00Z" />
        </Form.Item>
        <Button type="primary" onClick={save} loading={saving}>
          Save option
        </Button>
      </Form>
    </Card>
  );
}
