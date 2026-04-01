"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  Alert,
  Button,
  DatePicker,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Tooltip,
  Typography,
  message,
} from "antd";
import { CalendarOutlined, EyeOutlined, SendOutlined } from "@ant-design/icons";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { businessService } from "@/services/apiService";
import dayjs from "dayjs";
import EmailBuilderEditor from "./builder/EmailBuilderEditor";
import { createEmptyDocument } from "./builder/schema";
import { renderBuilderPreviewHtml } from "./builder/renderPreview";
import { MarketingEditorSkeleton } from "./marketingSkeletons";
import { getAudienceOptions, getAudienceOption, AUDIENCE_TYPES } from "./marketingAudienceConfig";
import AudienceFields from "./AudienceFields";
import { buildMarketingFooterPreviewHtml, sanitizeFooterAlignment } from "./marketingPreviewFooter";
import MarketingEmailPreviewDrawer from "./MarketingEmailPreviewDrawer";
import MarketingHtmlCodeEditor from "./MarketingHtmlCodeEditor";

const { Text } = Typography;

const Shell = styled.div`
  padding: 0 0 40px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
`;

const TopBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const TopBarLeading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const TopBarTitle = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopBarActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  @media (max-width: 768px) {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
`;

const EditorMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
`;

const SettingsCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 20px 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

function serializeEditorState(parts) {
  return JSON.stringify({
    name: parts.name,
    subject: parts.subject,
    contentType: parts.contentType,
    htmlBody: parts.htmlBody,
    builderDoc: parts.builderDoc,
    audienceType: parts.audienceType,
    audienceFilter: parts.audienceFilter,
    senderProfile: parts.senderProfile,
  });
}

export default function CampaignEditorScreen({
  campaignId,
  onBack,
  tier,
  usage,
  segments = [],
  openScheduleFocus,
}) {
  const isNew = campaignId === "new";
  const [name, setName] = useState("Untitled campaign");
  const [subject, setSubject] = useState("");
  const [contentType, setContentType] = useState("builder_json");
  const [htmlBody, setHtmlBody] = useState("<p>Hi {{first_name}},</p>");
  const [builderDoc, setBuilderDoc] = useState(() => createEmptyDocument());
  const [audienceType, setAudienceType] = useState(AUDIENCE_TYPES.ALL_CONTACTS);
  const [audienceFilter, setAudienceFilter] = useState({});
  const [senderProfile, setSenderProfile] = useState(undefined);
  const [senders, setSenders] = useState([]);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState("mobile");
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(null);
  const [scheduleFieldError, setScheduleFieldError] = useState("");
  const [editorInitializing, setEditorInitializing] = useState(true);
  const [footerAddress, setFooterAddress] = useState("");
  const [unsubPreview, setUnsubPreview] = useState({
    unsubscribe_text: "Unsubscribe",
    unsubscribe_style: "link",
    unsubscribe_color: "#6366f1",
    footer_alignment: "left",
  });
  const [facets, setFacets] = useState(null);

  const baselineRef = useRef(null);
  const deferredBuilder = useDeferredValue(builderDoc);

  const audienceOptions = useMemo(
    () => getAudienceOptions(tier, { includeSavedSegment: true }),
    [tier],
  );

  const load = useCallback(async () => {
    setEditorInitializing(true);
    try {
    const [sr, st, fct] = await Promise.all([
      businessService.listMarketingSenders(),
      businessService.getMarketingSettings(),
      businessService.getMarketingAudienceFacets(),
    ]);
    if (sr.success && Array.isArray(sr.data)) {
      setSenders(sr.data);
      const def = sr.data.find((s) => s.is_default);
      if (def) setSenderProfile(def.id);
    }
    if (st.success && st.data) {
      setFooterAddress(st.data.physical_address_footer || "");
      setUnsubPreview({
        unsubscribe_text: st.data.unsubscribe_text || "Unsubscribe",
        unsubscribe_style: st.data.unsubscribe_style === "button" ? "button" : "link",
        unsubscribe_color: st.data.unsubscribe_color || "#6366f1",
        footer_alignment: sanitizeFooterAlignment(st.data.footer_alignment),
      });
    }
    if (fct.success) setFacets(fct.data);
    if (isNew) {
      setEditorInitializing(false);
      return;
    }
    const r = await businessService.fetchMarketingCampaign(campaignId);
    if (!r.success || !r.data) {
      message.error(r.error || "Failed to load campaign.");
      setEditorInitializing(false);
      return;
    }
    const d = r.data;
    setName(d.name || "");
    setSubject(d.subject || "");
    setContentType(d.content_type === "html" ? "html" : "builder_json");
    setHtmlBody(d.html_body || "");
    setBuilderDoc(
      d.builder_json && typeof d.builder_json === "object" && d.builder_json.blocks
        ? d.builder_json
        : createEmptyDocument(),
    );
    setAudienceType(d.audience_type || AUDIENCE_TYPES.ALL_CONTACTS);
    setAudienceFilter(
      d.audience_filter && typeof d.audience_filter === "object" ? d.audience_filter : {},
    );
    if (d.sender_profile) setSenderProfile(d.sender_profile);
    setEditorInitializing(false);
    } catch (e) {
      message.error(e?.message || "Could not load the editor.");
      setEditorInitializing(false);
    }
  }, [campaignId, isNew]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (openScheduleFocus && tier?.scheduling_enabled) setScheduleOpen(true);
  }, [openScheduleFocus, tier?.scheduling_enabled]);

  useEffect(() => {
    if (editorInitializing) return;
    baselineRef.current = serializeEditorState({
      name, subject, contentType, htmlBody, builderDoc, audienceType, audienceFilter, senderProfile,
    });
  }, [editorInitializing, campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = () =>
    baselineRef.current !==
    serializeEditorState({ name, subject, contentType, htmlBody, builderDoc, audienceType, audienceFilter, senderProfile });

  const requestBack = () => {
    if (isDirty()) {
      Modal.confirm({
        title: "Discard changes?",
        content: "You have unsaved changes. Leave without saving?",
        okText: "Discard",
        okButtonProps: { danger: true },
        onOk: () => onBack(),
      });
    } else {
      onBack();
    }
  };

  // Ensure campaign exists; return its id.
  const persistId = async () => {
    if (!isNew) return campaignId;
    const cr = await businessService.createMarketingCampaign({ name: name || "Campaign" });
    if (!cr.success || !cr.data?.id) throw new Error(cr.error || "create failed");
    return cr.data.id;
  };

  // Shared payload builder
  const buildPayload = () => ({
    name,
    subject,
    content_type: contentType,
    html_body: htmlBody,
    builder_json: builderDoc,
    audience_type: audienceType,
    audience_filter: audienceFilter,
    sender_profile: senderProfile,
  });

  // Ensure persisted and saved; returns id or throws
  const ensureSaved = async () => {
    const id = await persistId();
    const up = await businessService.updateMarketingCampaign(id, buildPayload());
    if (!up.success) throw new Error(up.error || "Save failed");
    return id;
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const id = await ensureSaved();
      message.success("Saved.");
      baselineRef.current = serializeEditorState({
        name, subject, contentType, htmlBody, builderDoc, audienceType, audienceFilter, senderProfile,
      });
      if (isNew) onBack(id);
    } catch (e) {
      message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    setPreviewLoading(true);
    const r = await businessService.previewMarketingAudience({
      audience_type: audienceType,
      audience_filter: audienceFilter,
    });
    setPreviewLoading(false);
    if (r.success) setPreviewCount(r.data);
    else {
      setPreviewCount(null);
      message.error(r.error || "Could not estimate audience size.");
    }
  };

  const sendTest = async () => {
    try {
      const id = await ensureSaved();
      const r = await businessService.testMarketingCampaign(id);
      if (r.success) message.success("Test email sent to your account.");
      else message.error(r.error);
    } catch (e) {
      message.error(e.message || "Send test failed");
    }
  };

  const sendNow = async () => {
    try {
      const id = await ensureSaved();
      const r = await businessService.sendMarketingCampaign(id);
      if (r.success) { message.success("Queued for sending."); onBack(); }
      else message.error(r.error);
    } catch (e) {
      message.error(e.message || "Send failed");
    }
  };

  const scheduleSubmit = async () => {
    setScheduleFieldError("");
    if (!tier?.scheduling_enabled) { message.error("Upgrade to Growth+ to schedule sends."); return; }
    if (!scheduleAt || !scheduleAt.isValid()) { setScheduleFieldError("Choose a valid date and time."); return; }
    if (!scheduleAt.isAfter(dayjs())) { setScheduleFieldError("Schedule a time in the future."); return; }
    try {
      const id = await ensureSaved();
      const r = await businessService.scheduleMarketingCampaign(id, { scheduled_at: scheduleAt.toISOString() });
      if (r.success) { message.success("Scheduled."); setScheduleOpen(false); onBack(); }
      else message.error(r.error);
    } catch (e) {
      message.error(e.message || "Scheduling failed");
    }
  };

  // Build srcDoc preview
  const srcDocInner = useMemo(() => {
    if (contentType === "builder_json") return renderBuilderPreviewHtml(deferredBuilder);
    return htmlBody || "<p>(empty)</p>";
  }, [contentType, deferredBuilder, htmlBody]);

  const srcDoc = useMemo(() => {
    const mobileStyle = previewMode === "mobile" ? "max-width:375px;margin:0 auto;" : "";
    const footer = buildMarketingFooterPreviewHtml({
      physical_address_footer: footerAddress,
      ...unsubPreview,
    });
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{margin:0;padding:16px;${mobileStyle}font-family:system-ui,sans-serif;}</style>
</head><body>${srcDocInner}${footer}</body></html>`;
  }, [previewMode, srcDocInner, footerAddress, unsubPreview]);

  const quotaExhausted = usage && Number(usage.remaining) === 0;
  const quotaTooltip =
    "You have used all marketing sends for this billing period. Upgrade your plan on Plans & billing, or wait until your next billing cycle for the quota to reset.";

  const sendMenuItems = [
    {
      key: "test",
      label: "Send test to me",
      onClick: sendTest,
    },
    ...(tier?.scheduling_enabled
      ? [{ key: "schedule", label: "Schedule send…", onClick: () => { setScheduleFieldError(""); setScheduleOpen(true); } }]
      : []),
  ];

  if (editorInitializing) {
    return (
      <Shell>
        <MarketingEditorSkeleton />
      </Shell>
    );
  }

  const selectedAudienceOption = getAudienceOption(audienceType);

  return (
    <Shell>
      <TopBar>
        <TopBarLeading>
          <Button onClick={requestBack}>← Back</Button>
          <TopBarTitle>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="borderless"
              style={{ fontSize: 16, fontWeight: 600, padding: "0 4px" }}
              placeholder="Campaign name…"
            />
          </TopBarTitle>
        </TopBarLeading>
        <TopBarActions>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewDrawerOpen(true)}>
            Preview
          </Button>
          <Button loading={saving} key={`save-draft-${saving}`} onClick={saveDraft}>
            Save draft
          </Button>
          <Dropdown.Button
            key={`send-menu-${quotaExhausted}`}
            menu={{ items: sendMenuItems }}
            type="primary"
            disabled={quotaExhausted}
            onClick={quotaExhausted ? undefined : sendNow}
            icon={<ChevronDown size={14} />}
            trigger={["click"]}
            buttonsRender={([left, right]) => [
              <Tooltip key="send" title={quotaExhausted ? quotaTooltip : null}>
                {left}
              </Tooltip>,
              right,
            ]}
          >
            <SendOutlined style={{ marginRight: 6 }} />
            Send now
          </Dropdown.Button>
        </TopBarActions>
      </TopBar>

      <EditorMain>
          <SettingsCard>
            <Form layout="vertical" style={{ gap: 0 }}>
              <Form.Item label="Subject line" style={{ marginBottom: 16 }}>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value.slice(0, 255))}
                  placeholder="Your subject line…"
                  maxLength={255}
                  showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                />
              </Form.Item>

              <Form.Item label="From / reply-to" style={{ marginBottom: 16 }}>
                <Select
                  style={{ width: "100%" }}
                  allowClear
                  placeholder="Default platform sender"
                  value={senderProfile}
                  onChange={setSenderProfile}
                  options={senders.map((s) => ({
                    value: s.id,
                    label: `${s.display_name} <${s.from_email}>`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Audience{" "}
                    {selectedAudienceOption && (
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                        — {selectedAudienceOption.label}
                      </Text>
                    )}
                  </span>
                }
                style={{ marginBottom: 8 }}
              >
                <Select
                  style={{ width: "100%" }}
                  value={audienceType}
                  onChange={(v) => { setAudienceType(v); setAudienceFilter({}); setPreviewCount(null); }}
                  options={audienceOptions}
                />
              </Form.Item>

              {audienceType !== AUDIENCE_TYPES.ALL_CONTACTS && (
                <div style={{ marginBottom: 12 }}>
                  <AudienceFields
                    audienceType={audienceType}
                    audienceFilter={audienceFilter}
                    onFilterChange={(patch) => {
                      setAudienceFilter((prev) => ({ ...prev, ...patch }));
                      setPreviewCount(null);
                    }}
                    facets={facets}
                    segments={segments}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                <motion.span whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
                  <Button
                    size="small"
                    onClick={runPreview}
                    loading={previewLoading}
                    key={`est-${previewLoading}`}
                  >
                    Estimate recipients
                  </Button>
                </motion.span>
                {previewCount != null && (
                  <motion.div
                    key={previewCount.count}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "baseline",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                      <NumberFlow value={Number(previewCount.count) || 0} />
                    </span>
                    <span style={{ fontSize: 12, color: "#047857" }}>contacts</span>
                  </motion.div>
                )}
              </div>
            </Form>
          </SettingsCard>

          <Divider style={{ margin: "0 0 4px" }} />

          {/* Content type selector */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Radio.Group
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              disabled={tier && tier.raw_html_allowed === false}
            >
              <Radio.Button value="builder_json">Visual builder</Radio.Button>
              <Radio.Button value="html" disabled={tier && !tier.raw_html_allowed}>
                HTML
              </Radio.Button>
            </Radio.Group>
          </div>

          {contentType === "builder_json" ? (
            <EmailBuilderEditor document={builderDoc} onChange={setBuilderDoc} />
          ) : (
            <MarketingHtmlCodeEditor value={htmlBody} onChange={setHtmlBody} minRows={20} />
          )}

          <Alert
            type="info"
            showIcon={false}
            style={{ borderRadius: 10, fontSize: 12 }}
            message={
              <Text style={{ fontSize: 12 }}>
                Open <strong>Preview</strong> to see the email with footer and unsubscribe. Configure
                them in the <strong>Sending</strong> tab.
              </Text>
            }
          />
      </EditorMain>

      <MarketingEmailPreviewDrawer
        open={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        srcDoc={srcDoc}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        footer={
          <Alert
            type="info"
            showIcon={false}
            style={{ borderRadius: 10, fontSize: 12 }}
            message={
              <Text style={{ fontSize: 12 }}>
                Footer and unsubscribe match your Sending tab. Mobile uses a 375px-wide frame; Desktop
                uses a wider layout.
              </Text>
            }
          />
        }
      />

      {/* Schedule modal */}
      <Modal
        title={<span><CalendarOutlined style={{ marginRight: 8 }} />Schedule send</span>}
        open={scheduleOpen}
        onCancel={() => { setScheduleOpen(false); setScheduleFieldError(""); }}
        onOk={scheduleSubmit}
        okText="Schedule"
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            label="Date and time"
            validateStatus={scheduleFieldError ? "error" : undefined}
            help={scheduleFieldError || "Scheduled in your browser's local time zone."}
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="MMM D, YYYY HH:mm"
              style={{ width: "100%" }}
              value={scheduleAt}
              onChange={setScheduleAt}
              disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Shell>
  );
}
