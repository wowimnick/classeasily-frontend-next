"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Divider, Form, Input, Modal, Radio, Typography, message } from "antd";
import { businessService } from "@/services/apiService";
import EmailBuilderEditor from "./builder/EmailBuilderEditor";
import { createEmptyDocument } from "./builder/schema";
import { renderBuilderPreviewHtml } from "./builder/renderPreview";
import { MarketingEditorSkeleton } from "./marketingSkeletons";

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

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPane = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPane = styled.div`
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingsCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 20px 4px;
`;

const PreviewCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
`;

const PreviewBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: ${(p) => (p.$mobile ? "667px" : "520px")};
  min-height: 400px;
  border: none;
  background: #fff;
  display: block;
`;

function buildPreviewFooter(footerAddress) {
  const addr =
    footerAddress || '<em style="color:#9ca3af">(Business address — set in Sending tab)</em>';
  return `
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="font-size:12px;color:#6b7280;font-family:system-ui,sans-serif;">
      <a href="#" style="color:#6b7280;" onclick="return false;">Unsubscribe</a>
      from marketing emails.
    </p>
    <p style="font-size:12px;color:#9ca3af;font-family:system-ui,sans-serif;">${addr}</p>
  `;
}

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
  const [previewMode, setPreviewMode] = useState("desktop");
  const [init, setInit] = useState(true);
  const [footerAddress, setFooterAddress] = useState("");

  const baselineRef = useRef(null);
  const deferredBuilder = useDeferredValue(builderDoc);

  const load = useCallback(async () => {
    setInit(true);
    const st = await businessService.getMarketingSettings();
    if (st.success && st.data) setFooterAddress(st.data.physical_address_footer || "");
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
    if (contentType === "builder_json") return renderBuilderPreviewHtml(deferredBuilder);
    return htmlBody || "<p>(empty)</p>";
  }, [contentType, deferredBuilder, htmlBody]);

  const srcDoc = useMemo(() => {
    const mobileStyle = previewMode === "mobile" ? "max-width:375px;margin:0 auto;" : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{margin:0;padding:16px;${mobileStyle}font-family:system-ui,sans-serif;}</style>
</head><body>${srcDocInner}${buildPreviewFooter(footerAddress)}</body></html>`;
  }, [previewMode, srcDocInner, footerAddress]);

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
          <Button loading={saving} key={`tpl-save-${saving}`} type="primary" onClick={save}>
            Save template
          </Button>
        </TopBarActions>
      </TopBar>

      <EditorGrid>
        <LeftPane>
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
            <Input.TextArea
              rows={18}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
          )}
        </LeftPane>

        <RightPane>
          <PreviewCard>
            <PreviewBar>
              <Text strong style={{ fontSize: 13 }}>
                Preview
              </Text>
              <Radio.Group
                value={previewMode}
                onChange={(e) => setPreviewMode(e.target.value)}
                size="small"
              >
                <Radio.Button value="desktop">Desktop</Radio.Button>
                <Radio.Button value="mobile">Mobile</Radio.Button>
              </Radio.Group>
            </PreviewBar>
            <PreviewFrame
              title="template preview"
              sandbox="allow-same-origin"
              srcDoc={srcDoc}
              $mobile={previewMode === "mobile"}
            />
          </PreviewCard>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Apply this template when creating a campaign (copy subject and body into the campaign editor).
          </Text>
        </RightPane>
      </EditorGrid>
    </Shell>
  );
}
