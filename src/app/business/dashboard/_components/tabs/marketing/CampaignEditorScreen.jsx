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
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { CalendarOutlined, CopyOutlined, EyeOutlined, SendOutlined } from "@ant-design/icons";
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
import { campaignAudienceFromApi, campaignAudienceToApi } from "./marketingAudiencePayload";

const { Text } = Typography;

const DEFAULT_HTML_BODY = `<p>Hi {{first_name}},</p><p>Your message here.</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>`;

const MERGE_TAGS = [
  "{{first_name}}",
  "{{last_name}}",
  "{{business_name}}",
  "{{unsubscribe_url}}",
];

function bodyHasUnsubscribeMerge(contentType, htmlBody, builderDoc) {
  if (contentType === "html") {
    return String(htmlBody || "").includes("{{unsubscribe_url}}");
  }
  return renderBuilderPreviewHtml(builderDoc).includes("{{unsubscribe_url}}");
}

const Shell = styled.div`
  padding: 0 0 100px;
  max-width: 1320px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 767px) {
    padding-bottom: 120px;
  }
`;

const TopBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
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
  @media (max-width: 767px) {
    display: none;
  }
`;

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 380px;
  }
`;

const EditorMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
`;

const SideColumn = styled.aside`
  display: none;
  @media (min-width: 1024px) {
    display: block;
    position: sticky;
    top: 88px;
    align-self: start;
  }
`;

const SideCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  background: #fafafa;
`;

const PreviewFrame = styled.div`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
`;

const MobileDock = styled.div`
  display: none;
  @media (max-width: 767px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
    background: #fff;
    border-top: 1px solid #e5e7eb;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
    z-index: 100;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  }
`;

const SubSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
`;

const SettingsCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ContentCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
`;

function serializeEditorState(parts) {
  return JSON.stringify({
    name: parts.name,
    subject: parts.subject,
    contentType: parts.contentType,
    htmlBody: parts.htmlBody,
    builderDoc: parts.builderDoc,
    audienceTypes: parts.audienceTypes,
    audienceFilterByType: parts.audienceFilterByType,
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
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML_BODY);
  const [builderDoc, setBuilderDoc] = useState(() => createEmptyDocument());
  const [audienceTypes, setAudienceTypes] = useState([AUDIENCE_TYPES.ALL_CONTACTS]);
  const [audienceFilterByType, setAudienceFilterByType] = useState({});
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

  const unsubDefaults = useMemo(
    () => ({
      unsubscribe_text: unsubPreview.unsubscribe_text,
      unsubscribe_style: unsubPreview.unsubscribe_style,
      unsubscribe_color: unsubPreview.unsubscribe_color,
      footer_alignment: unsubPreview.footer_alignment,
    }),
    [unsubPreview],
  );

  const load = useCallback(async () => {
    setEditorInitializing(true);
    try {
      const [sr, st, fct] = await Promise.all([
        businessService.listMarketingSenders(),
        businessService.getMarketingSettings(),
        businessService.getMarketingAudienceFacets(),
      ]);

      let snapshot = {
        name: "Untitled campaign",
        subject: "",
        contentType: "builder_json",
        htmlBody: DEFAULT_HTML_BODY,
        builderDoc: createEmptyDocument(),
        audienceTypes: [AUDIENCE_TYPES.ALL_CONTACTS],
        audienceFilterByType: {},
        senderProfile: undefined,
      };

      if (sr.success && Array.isArray(sr.data)) {
        setSenders(sr.data);
        const def = sr.data.find((s) => s.is_default);
        if (def) snapshot.senderProfile = def.id;
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
        setName(snapshot.name);
        setSubject(snapshot.subject);
        setContentType(snapshot.contentType);
        setHtmlBody(snapshot.htmlBody);
        setBuilderDoc(snapshot.builderDoc);
        setAudienceTypes(snapshot.audienceTypes);
        setAudienceFilterByType(snapshot.audienceFilterByType);
        setSenderProfile(snapshot.senderProfile);
        baselineRef.current = serializeEditorState(snapshot);
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
      const fromApi = campaignAudienceFromApi(d.audience_type, d.audience_filter);
      snapshot = {
        name: d.name || "",
        subject: d.subject || "",
        contentType: d.content_type === "html" ? "html" : "builder_json",
        htmlBody: d.html_body || DEFAULT_HTML_BODY,
        builderDoc:
          d.builder_json && typeof d.builder_json === "object" && d.builder_json.blocks
            ? d.builder_json
            : createEmptyDocument(),
        audienceTypes: fromApi.audienceTypes,
        audienceFilterByType: fromApi.audienceFilterByType,
        senderProfile: d.sender_profile ?? snapshot.senderProfile,
      };

      setName(snapshot.name);
      setSubject(snapshot.subject);
      setContentType(snapshot.contentType);
      setHtmlBody(snapshot.htmlBody);
      setBuilderDoc(snapshot.builderDoc);
      setAudienceTypes(snapshot.audienceTypes);
      setAudienceFilterByType(snapshot.audienceFilterByType);
      setSenderProfile(snapshot.senderProfile);
      baselineRef.current = serializeEditorState(snapshot);
      setEditorInitializing(false);
    } catch (e) {
      message.error(e?.message || "Could not load the editor.");
      setEditorInitializing(false);
    }
  }, [campaignId, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (openScheduleFocus && tier?.scheduling_enabled) setScheduleOpen(true);
  }, [openScheduleFocus, tier?.scheduling_enabled]);

  const isDirty = () =>
    baselineRef.current !==
    serializeEditorState({
      name,
      subject,
      contentType,
      htmlBody,
      builderDoc,
      audienceTypes,
      audienceFilterByType,
      senderProfile,
    });

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

  const persistId = async () => {
    if (!isNew) return campaignId;
    const cr = await businessService.createMarketingCampaign({ name: name || "Campaign" });
    if (!cr.success || !cr.data?.id) throw new Error(cr.error || "create failed");
    return cr.data.id;
  };

  const { audience_type: apiAudienceType, audience_filter: apiAudienceFilter } = useMemo(
    () => campaignAudienceToApi(audienceTypes, audienceFilterByType),
    [audienceTypes, audienceFilterByType],
  );

  const buildPayload = () => ({
    name,
    subject,
    content_type: contentType,
    html_body: htmlBody,
    builder_json: builderDoc,
    audience_type: apiAudienceType,
    audience_filter: apiAudienceFilter,
    sender_profile: senderProfile,
  });

  const ensureUnsubscribeOrThrow = () => {
    if (!bodyHasUnsubscribeMerge(contentType, htmlBody, builderDoc)) {
      message.error(
        "Your email must include {{unsubscribe_url}} (e.g. in a link or the Unsubscribe block).",
      );
      throw new Error("missing_unsub");
    }
  };

  const ensureSaved = async () => {
    ensureUnsubscribeOrThrow();
    const id = await persistId();
    const up = await businessService.updateMarketingCampaign(id, buildPayload());
    if (!up.success) throw new Error(up.error || "Save failed");
    return id;
  };

  const captureBaseline = () => {
    baselineRef.current = serializeEditorState({
      name,
      subject,
      contentType,
      htmlBody,
      builderDoc,
      audienceTypes,
      audienceFilterByType,
      senderProfile,
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      ensureUnsubscribeOrThrow();
      const id = await persistId();
      const up = await businessService.updateMarketingCampaign(id, buildPayload());
      if (!up.success) throw new Error(up.error || "Save failed");
      message.success("Saved.");
      captureBaseline();
      if (isNew) onBack(id);
    } catch (e) {
      if (e.message !== "missing_unsub") message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    setPreviewLoading(true);
    const r = await businessService.previewMarketingAudience({
      audience_type: apiAudienceType,
      audience_filter: apiAudienceFilter,
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
      ensureUnsubscribeOrThrow();
      const id = await ensureSaved();
      const r = await businessService.testMarketingCampaign(id);
      if (r.success) message.success("Test email sent to your account.");
      else message.error(r.error);
    } catch (e) {
      if (e.message !== "missing_unsub") message.error(e.message || "Send test failed");
    }
  };

  const sendNow = async () => {
    try {
      const id = await ensureSaved();
      const r = await businessService.sendMarketingCampaign(id);
      if (r.success) {
        message.success("Queued for sending.");
        onBack();
      } else message.error(r.error);
    } catch (e) {
      if (e.message !== "missing_unsub") message.error(e.message || "Send failed");
    }
  };

  const scheduleSubmit = async () => {
    setScheduleFieldError("");
    if (!tier?.scheduling_enabled) {
      message.error("Upgrade to Growth+ to schedule sends.");
      return;
    }
    if (!scheduleAt || !scheduleAt.isValid()) {
      setScheduleFieldError("Choose a valid date and time.");
      return;
    }
    if (!scheduleAt.isAfter(dayjs())) {
      setScheduleFieldError("Schedule a time in the future.");
      return;
    }
    try {
      const id = await ensureSaved();
      const r = await businessService.scheduleMarketingCampaign(id, {
        scheduled_at: scheduleAt.toISOString(),
      });
      if (r.success) {
        message.success("Scheduled.");
        setScheduleOpen(false);
        onBack();
      } else message.error(r.error);
    } catch (e) {
      if (e.message !== "missing_unsub") message.error(e.message || "Scheduling failed");
    }
  };

  const copyTag = async (tag) => {
    try {
      await navigator.clipboard.writeText(tag);
      message.success("Copied");
    } catch {
      message.error("Could not copy");
    }
  };

  const srcDocInner = useMemo(() => {
    let inner =
      contentType === "builder_json" ? renderBuilderPreviewHtml(deferredBuilder) : htmlBody || "<p>(empty)</p>";
    inner = inner.replace(/\{\{unsubscribe_url\}\}/g, "#unsub-preview");
    return inner;
  }, [contentType, deferredBuilder, htmlBody]);

  const srcDoc = useMemo(() => {
    const mobileStyle = previewMode === "mobile" ? "max-width:375px;margin:0 auto;" : "";
    const footer = buildMarketingFooterPreviewHtml({
      physical_address_footer: footerAddress,
      footer_alignment: unsubPreview.footer_alignment,
    });
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{margin:0;padding:16px;${mobileStyle}font-family:system-ui,sans-serif;}</style>
</head><body>${srcDocInner}${footer}</body></html>`;
  }, [previewMode, srcDocInner, footerAddress, unsubPreview.footer_alignment]);

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
      ? [
          {
            key: "schedule",
            label: "Schedule send…",
            onClick: () => {
              setScheduleFieldError("");
              setScheduleOpen(true);
            },
          },
        ]
      : []),
  ];

  const onAudienceTypesChange = (next) => {
    const uniq = [...new Set(next.filter(Boolean))];
    const cleaned = uniq.length ? uniq : [AUDIENCE_TYPES.ALL_CONTACTS];
    if (cleaned.includes(AUDIENCE_TYPES.ALL_CONTACTS) && cleaned.length > 1) {
      setAudienceTypes(cleaned.filter((t) => t !== AUDIENCE_TYPES.ALL_CONTACTS));
    } else if (cleaned.length === 0) {
      setAudienceTypes([AUDIENCE_TYPES.ALL_CONTACTS]);
    } else {
      setAudienceTypes(cleaned);
    }
    setAudienceFilterByType((prev) => {
      const nextMap = {};
      const keys = cleaned.includes(AUDIENCE_TYPES.ALL_CONTACTS)
        ? [AUDIENCE_TYPES.ALL_CONTACTS]
        : cleaned;
      for (const k of keys) {
        if (prev[k]) nextMap[k] = prev[k];
      }
      return nextMap;
    });
    setPreviewCount(null);
  };

  const typesForFields = audienceTypes.filter((t) => t !== AUDIENCE_TYPES.ALL_CONTACTS);

  if (editorInitializing) {
    return (
      <Shell>
        <MarketingEditorSkeleton />
      </Shell>
    );
  }

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
          <Button
            icon={<EyeOutlined />}
            onClick={() => setPreviewDrawerOpen(true)}
            styles={{ icon: { marginInlineEnd: 6 } }}
          >
            Preview
          </Button>
          <Button loading={saving} onClick={saveDraft} styles={{ icon: { marginInlineEnd: 0 } }}>
            Save draft
          </Button>
          <Dropdown.Button
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

      <EditorGrid>
        <EditorMain>
          <SettingsCard>
            <SubSectionTitle>Message</SubSectionTitle>
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
            </Form>

            <Divider style={{ margin: "8px 0 16px" }} />

            <SubSectionTitle>Audience</SubSectionTitle>
            <Form layout="vertical">
              <Form.Item
                label={
                  <span>
                    Audience rules{" "}
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                      (combined with OR)
                    </Text>
                  </span>
                }
                style={{ marginBottom: 8 }}
              >
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Select one or more audience types…"
                  value={
                    audienceTypes.includes(AUDIENCE_TYPES.ALL_CONTACTS) &&
                    audienceTypes.length === 1
                      ? []
                      : audienceTypes.filter((t) => t !== AUDIENCE_TYPES.ALL_CONTACTS)
                  }
                  onChange={(vals) => {
                    if (!vals || vals.length === 0) {
                      onAudienceTypesChange([AUDIENCE_TYPES.ALL_CONTACTS]);
                    } else {
                      onAudienceTypesChange(vals);
                    }
                  }}
                  options={audienceOptions.filter((o) => o.value !== AUDIENCE_TYPES.ALL_CONTACTS)}
                />
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                  Leave empty for <strong>all mailable contacts</strong>. Add types to narrow or combine
                  segments (OR).
                </Text>
              </Form.Item>

              {typesForFields.map((t) => (
                <div key={t} style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                    {getAudienceOption(t)?.label || t}
                  </Text>
                  <AudienceFields
                    audienceType={t}
                    audienceFilter={audienceFilterByType[t] || {}}
                    onFilterChange={(patch) => {
                      setAudienceFilterByType((prev) => ({
                        ...prev,
                        [t]: { ...(prev[t] || {}), ...patch },
                      }));
                      setPreviewCount(null);
                    }}
                    facets={facets}
                    segments={segments}
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <motion.span whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
                  <Button size="small" onClick={runPreview} loading={previewLoading}>
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
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#059669",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <NumberFlow value={Number(previewCount.count) || 0} />
                    </span>
                    <span style={{ fontSize: 12, color: "#047857" }}>contacts</span>
                  </motion.div>
                )}
              </div>
            </Form>
          </SettingsCard>

          <ContentCard>
            <SubSectionTitle style={{ marginTop: 0 }}>Email body</SubSectionTitle>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              {MERGE_TAGS.map((tag) => (
                <Tag key={tag} style={{ margin: 0 }}>
                  <Text code style={{ fontSize: 12 }}>
                    {tag}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    aria-label={`Copy ${tag}`}
                    onClick={() => copyTag(tag)}
                  />
                </Tag>
              ))}
            </Space>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 14, borderRadius: 10, fontSize: 12 }}
              message="Unsubscribe required to send"
              description="Include {{unsubscribe_url}} in your HTML or add the Unsubscribe block in the visual builder."
            />

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
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
              <EmailBuilderEditor
                document={builderDoc}
                onChange={setBuilderDoc}
                unsubDefaults={unsubDefaults}
              />
            ) : (
              <MarketingHtmlCodeEditor value={htmlBody} onChange={setHtmlBody} minRows={20} />
            )}
          </ContentCard>

          <Alert
            type="info"
            showIcon={false}
            style={{ borderRadius: 10, fontSize: 12 }}
            message={
              <Text style={{ fontSize: 12 }}>
                Mailing address is appended from your <strong>Sending</strong> tab. Open{" "}
                <strong>Preview</strong> for the full frame.
              </Text>
            }
          />
        </EditorMain>

        <SideColumn>
          <SideCard>
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
              Quick preview
            </Text>
            <PreviewFrame>
              <iframe
                title="campaign-side-preview"
                srcDoc={srcDoc}
                style={{
                  width: "100%",
                  height: 420,
                  border: "none",
                  display: "block",
                }}
                sandbox="allow-same-origin"
              />
            </PreviewFrame>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewDrawerOpen(true)}
              style={{ paddingLeft: 0, marginTop: 8 }}
            >
              Open full preview
            </Button>
            <Divider style={{ margin: "12px 0" }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Recipients
            </Text>
            <div style={{ marginTop: 8 }}>
              <Button size="small" onClick={runPreview} loading={previewLoading}>
                Refresh count
              </Button>
              {previewCount != null && (
                <Text strong style={{ marginLeft: 10, fontVariantNumeric: "tabular-nums" }}>
                  {Number(previewCount.count).toLocaleString()} contacts
                </Text>
              )}
            </div>
          </SideCard>
        </SideColumn>
      </EditorGrid>

      <MobileDock>
        <Button loading={saving} onClick={saveDraft}>
          Save draft
        </Button>
        <Dropdown.Button
          type="primary"
          disabled={quotaExhausted}
          onClick={quotaExhausted ? undefined : sendNow}
          menu={{ items: sendMenuItems }}
          icon={<ChevronDown size={14} />}
        >
          Send now
        </Dropdown.Button>
      </MobileDock>

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
                Mailing address matches your Sending tab. Unsubscribe uses{" "}
                <Text code>{`{{unsubscribe_url}}`}</Text> in your content.
              </Text>
            }
          />
        }
      />

      <Modal
        title={
          <span>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Schedule send
          </span>
        }
        open={scheduleOpen}
        onCancel={() => {
          setScheduleOpen(false);
          setScheduleFieldError("");
        }}
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
