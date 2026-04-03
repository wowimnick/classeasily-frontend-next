"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Divider, Form, Input, Modal, Radio, Typography, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { businessService } from "@/services/apiService";
import EmailBuilderEditor from "./builder/EmailBuilderEditor";
import { createEmptyDocument } from "./builder/schema";
import { renderBuilderPreviewHtml } from "./builder/renderPreview";
import { MarketingEditorSkeleton } from "./marketingSkeletons";
import {
  buildMarketingFooterPreviewHtml,
  sanitizeFooterAlignment,
  sanitizeMarketingHexColor,
} from "./marketingPreviewFooter";
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
`;

function serializeState(parts) {
  return JSON.stringify({
    name: parts.name,
    subject: parts.subject,
    contentType: parts.contentType,
    htmlBody: parts.htmlBody,
    builderDoc: parts.builderDoc,
  });
}

export default function TemplateEditorScreen({ templateId, tier, onBack }) {
  const isNew = templateId === "new";
  const [name, setName] = useState("Untitled template");
  const [subject, setSubject] = useState("");
  const [contentType, setContentType] = useState("builder_json");
  const [htmlBody, setHtmlBody] = useState("<p>Hi {{first_name}},</p>");
  const [builderDoc, setBuilderDoc] = useState(() => createEmptyDocument());
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState("mobile");
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [init, setInit] = useState(true);
  const [footerAddress, setFooterAddress] = useState("");
  const [unsubPreview, setUnsubPreview] = useState({
    unsubscribe_text: "Unsubscribe",
    unsubscribe_style: "link",
    unsubscribe_color: "#6366f1",
    footer_alignment: "left",
  });

  const baselineRef = useRef(null);
  const deferredBuilder = useDeferredValue(builderDoc);

  const load = useCallback(async () => {
    setInit(true);
    const st = await businessService.getMarketingSettings();
    if (st.success && st.data) {
      setFooterAddress(st.data.physical_address_footer || "");
      setUnsubPreview({
        unsubscribe_text: st.data.unsubscribe_text || "Unsubscribe",
        unsubscribe_style: st.data.unsubscribe_style === "button" ? "button" : "link",
        unsubscribe_color: sanitizeMarketingHexColor(st.data.unsubscribe_color),
        footer_alignment: sanitizeFooterAlignment(st.data.footer_alignment),
      });
    }
    if (isNew) {
      setInit(false);
      return;
    }
    const r = await businessService.fetchMarketingTemplate(templateId);
    if (!r.success || !r.data) {
      message.error(r.error || "Failed to load template");
      setInit(false);
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
    setInit(false);
  }, [templateId, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (init) return;
    baselineRef.current = serializeState({ name, subject, contentType, htmlBody, builderDoc });
  }, [init, templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = () =>
    baselineRef.current !== serializeState({ name, subject, contentType, htmlBody, builderDoc });

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

  const buildPayload = () => ({
    name: name || "Template",
    subject,
    content_type: contentType,
    html_body: htmlBody,
    builder_json: contentType === "builder_json" ? builderDoc : {},
  });

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const cr = await businessService.createMarketingTemplate(buildPayload());
        if (!cr.success || !cr.data?.id) {
          message.error(cr.error || "Could not create template.");
          return;
        }
        message.success("Template saved.");
        onBack();
        return;
      }
      const up = await businessService.updateMarketingTemplate(templateId, buildPayload());
      if (!up.success) {
        message.error(up.error || "Save failed");
        return;
      }
      message.success("Saved.");
      baselineRef.current = serializeState({ name, subject, contentType, htmlBody, builderDoc });
    } catch (e) {
      message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
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
  }, [previewMode, srcDocInner, footerAddress, unsubPreview]);

  if (init) {
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
              placeholder="Template name…"
            />
          </TopBarTitle>
        </TopBarLeading>
        <TopBarActions>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewDrawerOpen(true)}>
            Preview
          </Button>
          <Button loading={saving} key={`tpl-save-${saving}`} type="primary" onClick={save}>
            Save template
          </Button>
        </TopBarActions>
      </TopBar>

      <EditorMain>
          <SettingsCard>
            <Form layout="vertical" style={{ gap: 0 }}>
              <Form.Item label="Default subject line" style={{ marginBottom: 16 }}>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Used when you start a campaign from this template…"
                />
              </Form.Item>
            </Form>
          </SettingsCard>

          <Divider style={{ margin: "0 0 4px" }} />

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
          <Text type="secondary" style={{ fontSize: 12 }}>
            Apply this template when creating a campaign. Use <strong>Preview</strong> to see footer and
            unsubscribe (from Sending settings).
          </Text>
      </EditorMain>

      <MarketingEmailPreviewDrawer
        open={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        srcDoc={srcDoc}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        title="Template preview"
      />
    </Shell>
  );
}
