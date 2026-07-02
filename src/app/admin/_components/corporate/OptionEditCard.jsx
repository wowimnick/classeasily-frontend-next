"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { HolderOutlined } from "@ant-design/icons";
import { corporateAdminService, classManagementService } from "@/services/adminDash";
import { dollarsToCents, centsToDollarsInput } from "./dollarsField";
import ProposedTimesEditor from "./ProposedTimesEditor";

const { Text } = Typography;

export default function OptionEditCard({
  option,
  sortIndex,
  activeOptionsSorted,
  onRefresh,
  onSwapDown,
  dragHandleProps,
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [classDetail, setClassDetail] = useState(null);

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
      duration_minutes: option.duration_minutes ?? undefined,
      min_headcount: option.min_headcount ?? undefined,
      max_headcount: option.max_headcount ?? undefined,
      price_total_dollars: centsToDollarsInput(option.price_total_cents),
      price_per_person_dollars: option.price_per_person_cents
        ? centsToDollarsInput(option.price_per_person_cents)
        : "",
      proposed_date_options: Array.isArray(option.proposed_date_options)
        ? option.proposed_date_options
        : [],
    });
  }, [option, form]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (option.source_type === "existing_class" && option.source_class) {
        const res = await classManagementService.getClass(option.source_class);
        if (!cancelled && res.success) setClassDetail(res.data);
      } else if (!cancelled) {
        setClassDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [option.source_type, option.source_class]);

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
        duration_minutes: v.duration_minutes ?? null,
        min_headcount: v.min_headcount ?? null,
        max_headcount: v.max_headcount ?? null,
        price_total_cents: dollarsToCents(v.price_total_dollars),
        price_per_person_cents: v.price_per_person_dollars
          ? dollarsToCents(v.price_per_person_dollars)
          : null,
        proposed_date_options: v.proposed_date_options || [],
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

  const srcLabel = option.source_type === "existing_class" ? "From class" : "Custom";

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          {dragHandleProps ? (
            <Button
              type="text"
              size="small"
              icon={<HolderOutlined />}
              style={{ cursor: "grab", padding: "0 4px" }}
              {...dragHandleProps}
            />
          ) : null}
          <span>Slot {option.position}</span>
          <Text type="secondary">{srcLabel}</Text>
        </Space>
      }
      extra={
        <Space>
          {!dragHandleProps && canMoveDown && onSwapDown ? (
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
        <Collapse
          defaultActiveKey={["display", "pricing"]}
          items={[
            {
              key: "display",
              label: "Display & content",
              children: (
                <>
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
                </>
              ),
            },
            {
              key: "pricing",
              label: "Pricing & event",
              children: (
                <>
                  <Form.Item name="duration_minutes" label="Duration (minutes)">
                    <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 90" />
                  </Form.Item>
                  <Space style={{ width: "100%" }} size={12} align="start" wrap>
                    <Form.Item name="min_headcount" label="Min guests" style={{ flex: 1, minWidth: 120 }}>
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="max_headcount" label="Max guests" style={{ flex: 1, minWidth: 120 }}>
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Space>
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
                  <Form.Item name="proposed_date_options" label="Proposed date / times">
                    <ProposedTimesEditor classDetail={classDetail} />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
        <Button type="primary" onClick={save} loading={saving} style={{ marginTop: 12 }}>
          Save option
        </Button>
      </Form>
    </Card>
  );
}
