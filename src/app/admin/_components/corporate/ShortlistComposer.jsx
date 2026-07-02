"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Switch,
  Typography,
  message,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { corporateAdminService } from "@/services/adminDash";
import { SHORTLIST_LEAD } from "@/components/corporate/shortlist/shortlistGuestGuideCopy";
import OptionEditCard from "./OptionEditCard";
import AddClassModal from "./AddClassModal";
import ProposedTimesEditor from "./ProposedTimesEditor";
import { dollarsToCents } from "./dollarsField";

const { Text } = Typography;

const PANEL_LABEL = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "rgba(0,0,0,0.45)",
  display: "block",
  marginBottom: 10,
};

const ACCENT_PRESETS = [
  { label: "Coral", value: "#E63151" },
  { label: "Slate", value: "#0f172a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Violet", value: "#7c3aed" },
];

const DEFAULT_PRESENTATION = {
  accent_color: "#E63151",
  hero_image_url: "",
  cta_label: "",
  use_standard_copy: true,
  show_sections: {
    comparison: true,
    whats_included: true,
    faq: true,
  },
};

function SortableOptionRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    position: "relative",
    zIndex: isDragging ? 2 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {typeof children === "function" ? children({ attributes, listeners }) : children}
    </div>
  );
}

function validateShortlistReady(sl) {
  const opts = (sl.options || []).filter((o) => !o.is_archived);
  const n = opts.length;
  if (n < 1 || n > 3) {
    return { ok: false, detail: "Add 1–3 options before sending." };
  }
  const missingDates = opts.some(
    (o) => !Array.isArray(o.proposed_date_options) || o.proposed_date_options.length < 1,
  );
  if (missingDates) {
    return { ok: false, detail: "Each option needs at least one proposed date." };
  }
  const sorted = [...opts].sort((a, b) => a.position - b.position);
  const positions = sorted.map((o) => o.position).sort((a, b) => a - b);
  const expected = Array.from({ length: n }, (_, i) => i + 1);
  const ok = positions.length === n && positions.every((p, i) => p === expected[i]);
  if (!ok) {
    return { ok: false, detail: "Options must have positions 1…N with no gaps." };
  }
  return {
    ok: true,
    detail: `Ready to send (${n} option${n === 1 ? "" : "s"}).`,
  };
}

export default function ShortlistComposer({
  shortlist,
  onRefresh,
  pendingOpenSlot,
  onConsumedPendingSlot,
  publicShortlistUrl = "",
  previewHref,
  onSend,
  sending = false,
}) {
  const presentation = { ...DEFAULT_PRESENTATION, ...(shortlist.presentation || {}) };
  const showSections = { ...DEFAULT_PRESENTATION.show_sections, ...(presentation.show_sections || {}) };

  const [depPct, setDepPct] = useState(shortlist.deposit_percent ?? 25);
  const [notes, setNotes] = useState(shortlist.internal_notes || "");
  const [introMessage, setIntroMessage] = useState(shortlist.intro_message || "");
  const [useStandardCopy, setUseStandardCopy] = useState(
    presentation.use_standard_copy !== false && !shortlist.intro_message,
  );
  const [accentColor, setAccentColor] = useState(presentation.accent_color || "#E63151");
  const [heroImageUrl, setHeroImageUrl] = useState(presentation.hero_image_url || "");
  const [ctaLabel, setCtaLabel] = useState(presentation.cta_label || "");
  const [showComparison, setShowComparison] = useState(showSections.comparison !== false);
  const [showWhatsIncluded, setShowWhatsIncluded] = useState(showSections.whats_included !== false);
  const [showFaq, setShowFaq] = useState(showSections.faq !== false);
  const [patching, setPatching] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addClassInitialSlot, setAddClassInitialSlot] = useState(undefined);

  useEffect(() => {
    if (pendingOpenSlot != null && pendingOpenSlot >= 1 && pendingOpenSlot <= 3) {
      setAddClassInitialSlot(pendingOpenSlot);
      setAddClassOpen(true);
      onConsumedPendingSlot?.();
    }
  }, [pendingOpenSlot, onConsumedPendingSlot]);

  useEffect(() => {
    const p = { ...DEFAULT_PRESENTATION, ...(shortlist.presentation || {}) };
    setDepPct(shortlist.deposit_percent ?? 25);
    setNotes(shortlist.internal_notes || "");
    setIntroMessage(shortlist.intro_message || "");
    setUseStandardCopy(p.use_standard_copy !== false && !shortlist.intro_message);
    setAccentColor(p.accent_color || "#E63151");
    setHeroImageUrl(p.hero_image_url || "");
    setCtaLabel(p.cta_label || "");
    const ss = { ...DEFAULT_PRESENTATION.show_sections, ...(p.show_sections || {}) };
    setShowComparison(ss.comparison !== false);
    setShowWhatsIncluded(ss.whats_included !== false);
    setShowFaq(ss.faq !== false);
  }, [shortlist.id, shortlist.deposit_percent, shortlist.internal_notes, shortlist.intro_message, shortlist.presentation]);

  const activeSorted = useMemo(
    () =>
      (shortlist.options || [])
        .filter((o) => !o.is_archived)
        .sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id))),
    [shortlist.options],
  );

  const validation = validateShortlistReady(shortlist);
  const sendBlockedStatuses = ["sent", "viewed", "accepted"];
  const sendDisabled =
    sending || !validation.ok || sendBlockedStatuses.includes(shortlist.status);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const buildPresentationPayload = useCallback(
    (overrides = {}) => {
      const { show_sections: sectionOverrides, ...restOverrides } = overrides;
      return {
        presentation: {
          accent_color: accentColor,
          hero_image_url: heroImageUrl,
          cta_label: ctaLabel,
          use_standard_copy: useStandardCopy,
          show_sections: {
            comparison: showComparison,
            whats_included: showWhatsIncluded,
            faq: showFaq,
            ...(sectionOverrides || {}),
          },
          ...restOverrides,
        },
      };
    },
    [accentColor, heroImageUrl, ctaLabel, useStandardCopy, showComparison, showWhatsIncluded, showFaq],
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

  const patchPresentation = () => patchMeta(buildPresentationPayload());

  const patchIntro = async (nextIntro, nextUseStandard) => {
    await patchMeta({
      intro_message: nextUseStandard ? "" : nextIntro,
      ...buildPresentationPayload({ use_standard_copy: nextUseStandard }),
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeSorted.findIndex((o) => String(o.id) === String(active.id));
    const newIndex = activeSorted.findIndex((o) => String(o.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(activeSorted, oldIndex, newIndex);
    try {
      setPatching(true);
      const used = new Set(reordered.map((o) => o.position));
      const freeSlot = [1, 2, 3].find((p) => !used.has(p)) ?? 3;
      const moving = reordered[newIndex];
      const displaced = activeSorted[newIndex];
      if (moving && displaced && moving.id !== displaced.id) {
        await corporateAdminService.updateOption(displaced.id, { position: freeSlot });
        await corporateAdminService.updateOption(moving.id, { position: displaced.position });
        await corporateAdminService.updateOption(displaced.id, { position: moving.position });
      }
      message.success("Order updated");
      await onRefresh();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not reorder");
      await onRefresh();
    } finally {
      setPatching(false);
    }
  };

  const copyLink = async () => {
    if (!publicShortlistUrl) return;
    try {
      await navigator.clipboard.writeText(publicShortlistUrl);
      message.success("Copied!", 1.5);
    } catch {
      message.error("Could not copy");
    }
  };

  const introPreview = useStandardCopy ? SHORTLIST_LEAD : introMessage.trim() || SHORTLIST_LEAD;

  return (
    <Space direction="vertical" style={{ width: "100%", paddingBottom: 88 }} size={20}>
      <div>
        <Text style={PANEL_LABEL}>Panel A · Proposal content</Text>
        <Card size="small" styles={{ body: { paddingBottom: 12 } }}>
          <Space direction="vertical" style={{ width: "100%" }} size={14}>
            <div>
              <Space align="center" style={{ marginBottom: 8 }}>
                <Switch
                  checked={useStandardCopy}
                  onChange={(checked) => {
                    setUseStandardCopy(checked);
                    if (checked) setIntroMessage("");
                    patchIntro(checked ? "" : introMessage, checked);
                  }}
                  disabled={patching}
                />
                <Text>Use standard copy</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                Intro message (shown in customer hero)
              </Text>
              <Input.TextArea
                rows={3}
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                onBlur={() => !useStandardCopy && patchIntro(introMessage, false)}
                placeholder={SHORTLIST_LEAD}
                disabled={useStandardCopy || patching}
              />
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                Preview: {introPreview.slice(0, 120)}
                {introPreview.length > 120 ? "…" : ""}
              </Text>
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                Accent color
              </Text>
              <Space wrap>
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => {
                      setAccentColor(preset.value);
                      patchMeta(buildPresentationPayload({ accent_color: preset.value }));
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      border: accentColor === preset.value ? "2px solid #111" : "2px solid #e5e7eb",
                      background: preset.value,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                ))}
              </Space>
            </div>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                  Hero image URL
                </Text>
                <Input
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  onBlur={patchPresentation}
                  placeholder="https://…"
                  disabled={patching}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                  CTA label
                </Text>
                <Input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  onBlur={patchPresentation}
                  placeholder="Select this experience"
                  disabled={patching}
                />
              </Col>
            </Row>

            <Space wrap size="middle">
              <Space align="center">
                <Switch
                  checked={showComparison}
                  onChange={(v) => {
                    setShowComparison(v);
                    patchMeta(
                      buildPresentationPayload({
                        show_sections: {
                          comparison: v,
                          whats_included: showWhatsIncluded,
                          faq: showFaq,
                        },
                      }),
                    );
                  }}
                  disabled={patching}
                />
                <Text style={{ fontSize: 13 }}>Show comparison cards</Text>
              </Space>
              <Space align="center">
                <Switch
                  checked={showWhatsIncluded}
                  onChange={(v) => {
                    setShowWhatsIncluded(v);
                    patchMeta(
                      buildPresentationPayload({
                        show_sections: {
                          comparison: showComparison,
                          whats_included: v,
                          faq: showFaq,
                        },
                      }),
                    );
                  }}
                  disabled={patching}
                />
                <Text style={{ fontSize: 13 }}>Show what&apos;s included</Text>
              </Space>
              <Space align="center">
                <Switch
                  checked={showFaq}
                  onChange={(v) => {
                    setShowFaq(v);
                    patchMeta(
                      buildPresentationPayload({
                        show_sections: {
                          comparison: showComparison,
                          whats_included: showWhatsIncluded,
                          faq: v,
                        },
                      }),
                    );
                  }}
                  disabled={patching}
                />
                <Text style={{ fontSize: 13 }}>Show FAQ blurb</Text>
              </Space>
            </Space>

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
        <Text style={PANEL_LABEL}>Panel B · Options</Text>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {activeSorted.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>
              No options yet — add from the catalog or build a custom row below.
            </Text>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeSorted.map((o) => String(o.id))}
                strategy={verticalListSortingStrategy}
              >
                {activeSorted.map((opt, idx) => (
                  <SortableOptionRow key={opt.id} id={String(opt.id)}>
                    {({ attributes, listeners }) => (
                      <OptionEditCard
                        option={opt}
                        sortIndex={idx}
                        activeOptionsSorted={activeSorted}
                        onRefresh={onRefresh}
                        dragHandleProps={{ ...attributes, ...listeners }}
                      />
                    )}
                  </SortableOptionRow>
                ))}
              </SortableContext>
            </DndContext>
          )}

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Button
                type="primary"
                size="large"
                block
                disabled={activeSorted.length >= 3}
                onClick={() => {
                  setAddClassInitialSlot(undefined);
                  setAddClassOpen(true);
                }}
              >
                + Add from catalog
              </Button>
              <AddClassModal
                open={addClassOpen}
                onClose={() => setAddClassOpen(false)}
                shortlistId={shortlist.id}
                activeOptionsSorted={activeSorted}
                onDone={onRefresh}
                initialPosition={addClassInitialSlot}
              />
            </Col>
            <Col xs={24} md={12}>
              <AddCustomSection shortlistId={shortlist.id} onDone={onRefresh} />
            </Col>
          </Row>
        </Space>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          margin: "0 -12px -12px",
          padding: "12px 12px max(12px, env(safe-area-inset-bottom))",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Text type={validation.ok ? "success" : "secondary"} style={{ display: "block", marginBottom: 8 }}>
          {validation.detail}
        </Text>
        <Space wrap style={{ width: "100%" }}>
          {previewHref ? (
            <Button href={previewHref} target="_blank" rel="noopener noreferrer">
              Preview
            </Button>
          ) : null}
          <Button
            type="primary"
            loading={sending}
            disabled={sendDisabled}
            onClick={onSend}
          >
            Send
          </Button>
          <Button icon={<CopyOutlined />} onClick={copyLink} disabled={!publicShortlistUrl}>
            Copy link
          </Button>
        </Space>
      </div>
    </Space>
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
        inclusions: Array.isArray(v.inclusions) ? v.inclusions.filter(Boolean) : [],
        cover_image_url: v.cover_image_url || "",
        gallery_urls: [],
        location_text: v.location_text || "",
        price_total_cents: dollarsToCents(v.price_total_dollars),
        price_per_person_cents: v.price_per_person_dollars
          ? dollarsToCents(v.price_per_person_dollars)
          : null,
        proposed_date_options: v.proposed_date_options || [],
      });
      message.success("Custom option added");
      form.resetFields();
      setOpen(false);
      await onDone();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not add option");
    }
  };

  if (!open) {
    return (
      <Button type="default" size="large" block onClick={() => setOpen(true)}>
        + Build custom
      </Button>
    );
  }

  return (
    <Card size="small" style={{ borderRadius: 10 }}>
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
        <Form.Item name="inclusions" label="Inclusions">
          <Select mode="tags" placeholder="Type and press Enter" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="cover_image_url" label="Cover image URL">
          <Input />
        </Form.Item>
        <Form.Item name="location_text" label="Location">
          <Input />
        </Form.Item>
        <Form.Item name="price_total_dollars" label="Total price (USD)" rules={[{ required: true }]}>
          <Input prefix="$" />
        </Form.Item>
        <Form.Item name="price_per_person_dollars" label="Price per person (USD, optional)">
          <Input prefix="$" />
        </Form.Item>
        <Form.Item name="proposed_date_options" label="Proposed date / times">
          <ProposedTimesEditor />
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
    </Card>
  );
}
