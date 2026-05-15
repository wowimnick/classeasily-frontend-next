"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Form,
  InputNumber,
  Select,
  Spin,
  message,
  Tag,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { corporateAdminService, classManagementService } from "@/services/adminDash";
import { dollarsToCents } from "./dollarsField";
import ProposedTimesEditor from "./ProposedTimesEditor";

const { Text } = Typography;

function coverThumb(c) {
  const imgs = c?.images || [];
  const cover = imgs.find((i) => i.isCover) || imgs[0];
  return cover?.image_thumb_url || cover?.image_medium_url || "";
}

function coverFromClass(c) {
  const imgs = c?.images || [];
  const cover = imgs.find((i) => i.isCover) || imgs[0];
  return cover?.image_medium_url || cover?.image_thumb_url || "";
}

function prefillFromClassDetail(classDetail) {
  const firstOpt = classDetail?.options?.[0];
  const firstSch = firstOpt?.schedules?.[0];
  return {
    title: classDetail?.title || "",
    host_name: classDetail?.business?.businessName || "",
    description: classDetail?.description || "",
    tagline: "",
    inclusions: [],
    cover_image_url: coverFromClass(classDetail),
    location_text: classDetail?.location || "",
    duration_minutes: firstSch?.duration ?? undefined,
    min_headcount: firstSch?.minParticipants ?? undefined,
    max_headcount: firstSch?.maxParticipants ?? undefined,
    price_total_dollars:
      firstSch?.price != null
        ? String(firstSch.price)
        : classDetail?.min_price != null
          ? String(classDetail.min_price)
          : "",
    price_per_person_dollars: "",
    proposed_date_options: [],
  };
}

export default function AddClassModal({
  open,
  onClose,
  shortlistId,
  activeOptionsSorted,
  onDone,
  initialPosition,
}) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState(1);
  const [q, setQ] = useState("");
  const [classResults, setClassResults] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [pickedClassId, setPickedClassId] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const occupied = useMemo(() => {
    const m = new Map();
    (activeOptionsSorted || []).forEach((o) => m.set(o.position, o));
    return m;
  }, [activeOptionsSorted]);

  const reset = useCallback(() => {
    setStep(0);
    setQ("");
    setClassResults([]);
    setPickedClassId(null);
    setClassDetail(null);
    form.resetFields();
    const used = new Set((activeOptionsSorted || []).map((o) => o.position));
    const free = [1, 2, 3].find((p) => !used.has(p));
    setPosition(initialPosition ?? free ?? 1);
  }, [activeOptionsSorted, form, initialPosition]);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  const loadClasses = async (search) => {
    setLoadingList(true);
    try {
      const trimmed = (search || "").trim();
      const params =
        trimmed.length < 2 ? { page_size: 24 } : { search: trimmed, page_size: 24 };
      const res = await classManagementService.getClasses(params);
      if (res.success) {
        setClassResults(res.data?.results ?? []);
      } else {
        message.error(res.error || "Could not load classes");
        setClassResults([]);
      }
    } catch {
      message.error("Could not load classes");
      setClassResults([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!open || step !== 0) return;
    loadClasses("");
  }, [open, step]);

  const pickClass = async (classId) => {
    setPickedClassId(classId);
    setLoadingDetail(true);
    try {
      const res = await classManagementService.getClass(classId);
      if (!res.success) {
        message.error(res.error || "Could not load class");
        setPickedClassId(null);
        return;
      }
      setClassDetail(res.data);
      form.setFieldsValue({
        ...prefillFromClassDetail(res.data),
        position,
      });
      setStep(1);
    } catch {
      message.error("Could not load class");
      setPickedClassId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const submit = async () => {
    const v = await form.validateFields();
    if (!pickedClassId) {
      message.error("No class selected");
      return;
    }
    setSubmitting(true);
    try {
      await corporateAdminService.addOptionFromClass(shortlistId, {
        position: v.position,
        class_id: pickedClassId,
        price_total_cents: dollarsToCents(v.price_total_dollars),
        price_per_person_cents: v.price_per_person_dollars
          ? dollarsToCents(v.price_per_person_dollars)
          : null,
        proposed_date_options: v.proposed_date_options || [],
        tagline: v.tagline || "",
        duration_minutes: v.duration_minutes ?? null,
        min_headcount: v.min_headcount ?? null,
        max_headcount: v.max_headcount ?? null,
        inclusions: (v.inclusions || []).filter(Boolean),
        title_override: v.title || "",
        description_override: v.description || "",
        host_name: v.host_name || "",
        cover_image_url_override: v.cover_image_url || "",
      });
      message.success("Option added from class");
      onClose();
      await onDone();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not add option");
    } finally {
      setSubmitting(false);
    }
  };

  const slotPicker = (
    <div style={{ marginBottom: 16 }}>
      <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
        Shortlist slot
      </Text>
      <Space wrap>
        {[1, 2, 3].map((p) => {
          const occ = occupied.get(p);
          return occ ? (
            <Tag key={p} style={{ margin: 0 }}>
              Slot {p}: {occ.title?.slice?.(0, 32) || "Filled"}
            </Tag>
          ) : (
            <Button key={p} type={position === p ? "primary" : "default"} onClick={() => setPosition(p)}>
              Slot {p}
            </Button>
          );
        })}
      </Space>
    </div>
  );

  return (
    <Modal
      title={step === 0 ? "Add from catalog" : "Review & publish option"}
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        step === 0 ? (
          <Button onClick={onClose}>Cancel</Button>
        ) : (
          <Space>
            <Button
              onClick={() => {
                setStep(0);
                setClassDetail(null);
                setPickedClassId(null);
              }}
            >
              Back
            </Button>
            <Button type="primary" loading={submitting} onClick={submit}>
              Add to shortlist
            </Button>
          </Space>
        )
      }
      destroyOnClose
    >
      {step === 0 ? (
        <div>
          {slotPicker}
          <Input
            allowClear
            placeholder="Search classes (type 2+ letters)"
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={() => loadClasses(q)}
            style={{ marginBottom: 12 }}
          />
          <Button type="link" onClick={() => loadClasses(q)} loading={loadingList} style={{ paddingLeft: 0 }}>
            Search / refresh
          </Button>
          <Spin spinning={loadingDetail || loadingList}>
            <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
              {classResults.map((c) => (
                <Col xs={24} sm={12} key={c.classId}>
                  <button
                    type="button"
                    onClick={() => pickClass(c.classId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "1px solid #f0f0f0",
                      borderRadius: 12,
                      padding: 12,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", gap: 12 }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          background: "#f5f5f5",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {coverThumb(c) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverThumb(c)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : null}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <Text strong style={{ display: "block" }}>
                          {c.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {c.location || c.business_name || ""}
                        </Text>
                        {c.slug ? (
                          <div style={{ marginTop: 6 }}>
                            <Tag>{c.slug}</Tag>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </Col>
              ))}
            </Row>
          </Spin>
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item name="position" hidden>
            <InputNumber />
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
          <Form.Item name="duration_minutes" label="Duration (minutes)">
            <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 90" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="min_headcount" label="Min guests">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_headcount" label="Max guests">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="price_total_dollars"
            label="Total price (USD)"
            rules={[{ required: true, message: "Enter price" }]}
          >
            <Input prefix="$" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="price_per_person_dollars" label="Price per person (USD, optional)">
            <Input prefix="$" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="proposed_date_options" label="Proposed date / times">
            <ProposedTimesEditor classDetail={classDetail} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
