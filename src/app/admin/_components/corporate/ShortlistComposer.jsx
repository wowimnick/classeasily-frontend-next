"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
  Space,
  Typography,
  message,
} from "antd";
import { corporateAdminService, classManagementService } from "@/services/adminDash";
import OptionEditCard from "./OptionEditCard";
import { dollarsToCents } from "./dollarsField";

const { Text } = Typography;

const STEP_LABEL = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "rgba(0,0,0,0.45)",
  display: "block",
  marginBottom: 10,
};

export default function ShortlistComposer({ shortlist, onRefresh }) {
  const [depPct, setDepPct] = useState(shortlist.deposit_percent ?? 25);
  const [notes, setNotes] = useState(shortlist.internal_notes || "");
  const [patching, setPatching] = useState(false);

  useEffect(() => {
    setDepPct(shortlist.deposit_percent ?? 25);
    setNotes(shortlist.internal_notes || "");
  }, [shortlist.id, shortlist.deposit_percent, shortlist.internal_notes]);

  const activeSorted = useMemo(
    () =>
      (shortlist.options || [])
        .filter((o) => !o.is_archived)
        .sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id))),
    [shortlist.options],
  );

  const patchMeta = async (payload) => {
    try {
      setPatching(true);
      await corporateAdminService.updateShortlist(shortlist.id, payload);
      await onRefresh();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not update shortlist");
    } finally {
      setPatching(false);
    }
  };

  const swapDown = async (sortIndex) => {
    const list = [...activeSorted];
    const a = list[sortIndex];
    const b = list[sortIndex + 1];
    if (!a || !b) return;
    const used = new Set(list.map((o) => o.position));
    const freeSlot = [1, 2, 3].find((p) => !used.has(p));
    try {
      if (freeSlot == null) {
        message.warning(
          "Can't swap while all three slots are filled. Archive one option temporarily to reorder.",
        );
        return;
      }
      await corporateAdminService.updateOption(b.id, { position: freeSlot });
      await corporateAdminService.updateOption(a.id, { position: b.position });
      await corporateAdminService.updateOption(b.id, { position: a.position });
      message.success("Order updated");
      await onRefresh();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not reorder");
      await onRefresh();
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={20}>
      <div>
        <Text style={STEP_LABEL}>Step 1 · Deposit & internal notes</Text>
        <Card size="small" styles={{ body: { paddingBottom: 12 } }}>
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45 }}>
              Customer-facing intro is standardized. Set deposit % here; internal notes stay admin-only.
            </Text>
            <div>
              <Text strong>Deposit {depPct}%</Text>
              <Slider
                min={5}
                max={50}
                value={depPct}
                onChange={setDepPct}
                onChangeComplete={(v) => patchMeta({ deposit_percent: v })}
                disabled={patching}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                Internal notes (team only)
              </Text>
              <Input.TextArea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => patchMeta({ internal_notes: notes })}
                placeholder="Handoff context, scheduling constraints…"
              />
            </div>
          </Space>
        </Card>
      </div>

      <div>
        <Text style={STEP_LABEL}>Step 2 · Options you&apos;ll send (1–3)</Text>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {activeSorted.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>
              No options yet — use Step 3 to add from the catalog or build a custom row.
            </Text>
          ) : null}
          {activeSorted.map((opt, idx) => (
            <OptionEditCard
              key={opt.id}
              option={opt}
              sortIndex={idx}
              activeOptionsSorted={activeSorted}
              onRefresh={onRefresh}
              onSwapDown={swapDown}
            />
          ))}
        </Space>
      </div>

      <div>
        <Text style={STEP_LABEL}>Step 3 · Add an option</Text>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <AddFromClassSection shortlistId={shortlist.id} onDone={onRefresh} />
          </Col>
          <Col xs={24} md={12}>
            <AddCustomSection shortlistId={shortlist.id} onDone={onRefresh} />
          </Col>
        </Row>
      </div>
    </Space>
  );
}

function mapClassesToSelectOptions(results) {
  return (Array.isArray(results) ? results : []).map((c) => ({
    value: c.classId,
    label: `${c.title} — ${c.location || ""}`,
  }));
}

function AddFromClassSection({ shortlistId, onDone }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [classOpts, setClassOpts] = useState([]);
  const [classSearchLoading, setClassSearchLoading] = useState(false);

  const fetchClasses = async (params) => {
    setClassSearchLoading(true);
    try {
      const response = await classManagementService.getClasses(params);
      if (response.success) {
        const raw = response.data?.results ?? [];
        setClassOpts(mapClassesToSelectOptions(raw));
      } else {
        message.error(response.error || "Could not load classes");
        setClassOpts([]);
      }
    } catch {
      message.error("Could not load classes");
      setClassOpts([]);
    } finally {
      setClassSearchLoading(false);
    }
  };

  const searchClasses = async (q) => {
    const trimmed = (q || "").trim();
    if (trimmed.length === 0) {
      await fetchClasses({ page_size: 30 });
      return;
    }
    if (trimmed.length < 2) {
      return;
    }
    await fetchClasses({ search: trimmed, page_size: 20 });
  };

  const onClassDropdownVisibleChange = async (open) => {
    if (!open) return;
    await fetchClasses({ page_size: 30 });
  };

  const submit = async () => {
    const v = await form.validateFields();
    try {
      await corporateAdminService.addOptionFromClass(shortlistId, {
        position: v.position,
        class_id: v.class_id,
        price_total_cents: dollarsToCents(v.price_total_dollars),
      });
      message.success("Option added from class");
      form.resetFields();
      setOpen(false);
      await onDone();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not add option");
    }
  };

  return (
    <Card
      size="small"
      variant="borderless"
      style={{
        background: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: 10,
      }}
    >
      {!open ? (
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Text strong>From class catalog</Text>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45 }}>
            Pull title, host, and imagery from an existing Classeasily class. Choose slot 1–3 and set the price for this quote.
          </Text>
          <Button type="primary" onClick={() => setOpen(true)} block>
            Add from catalog
          </Button>
        </Space>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item name="position" label="Position (1–3)" rules={[{ required: true }]}>
            <InputNumber min={1} max={3} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="class_id" label="Class" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={false}
              loading={classSearchLoading}
              onSearch={searchClasses}
              onDropdownVisibleChange={onClassDropdownVisibleChange}
              options={classOpts}
              placeholder="Search classes (type 2+ characters)"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="price_total_dollars"
            label="Total price (USD)"
            rules={[{ required: true, message: "Enter price" }]}
          >
            <Input prefix="$" placeholder="0.00" />
          </Form.Item>
          <Space wrap>
            <Button type="primary" onClick={submit}>
              Add option
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}

function AddCustomSection({ shortlistId, onDone }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const submit = async () => {
    const v = await form.validateFields();
    try {
      await corporateAdminService.addOption(shortlistId, {
        position: v.position,
        source_type: "custom",
        title: v.title,
        host_name: v.host_name || "",
        description: v.description || "",
        inclusions: (v.inclusions || "").split("\n").map((s) => s.trim()).filter(Boolean),
        cover_image_url: v.cover_image_url || "",
        gallery_urls: [],
        location_text: v.location_text || "",
        price_total_cents: dollarsToCents(v.price_total_dollars),
        price_per_person_cents: v.price_per_person_dollars
          ? dollarsToCents(v.price_per_person_dollars)
          : null,
        proposed_date_options: (v.dates || "").split("\n").map((s) => s.trim()).filter(Boolean),
      });
      message.success("Custom option added");
      form.resetFields();
      setOpen(false);
      await onDone();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not add option");
    }
  };

  return (
    <Card
      size="small"
      variant="borderless"
      style={{
        background: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: 10,
      }}
    >
      {!open ? (
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Text strong>Custom offering</Text>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45 }}>
            For venues not on the platform yet — add copy, pricing, optional dates, and image URLs manually.
          </Text>
          <Button type="primary" onClick={() => setOpen(true)} block>
            Build custom option
          </Button>
        </Space>
      ) : (
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
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="inclusions" label="Inclusions (one per line)">
            <Input.TextArea rows={3} />
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
            rules={[{ required: true }]}
          >
            <Input prefix="$" />
          </Form.Item>
          <Form.Item name="price_per_person_dollars" label="Price per person (USD, optional)">
            <Input prefix="$" />
          </Form.Item>
          <Form.Item name="dates" label="Proposed date/times (ISO, one per line)">
            <Input.TextArea rows={3} placeholder="2026-05-01T18:00:00Z" />
          </Form.Item>
          <Space wrap>
            <Button type="primary" onClick={submit}>
              Add option
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}
