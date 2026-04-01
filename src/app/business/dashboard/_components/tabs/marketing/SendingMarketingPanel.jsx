"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Card,
  Col,
  Collapse,
  ColorPicker,
  Form,
  Input,
  Popconfirm,
  Radio,
  Row,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { businessService } from "@/services/apiService";
import MarketingFeatureUpsell from "./MarketingFeatureUpsell";
import { Panel, MarketingSection } from "./marketingLayout";
import { SendingPanelSkeleton } from "./marketingSkeletons";
import {
  buildMarketingFooterPreviewHtml,
  sanitizeFooterAlignment,
  sanitizeMarketingHexColor,
} from "./marketingPreviewFooter";

const { Text } = Typography;

const COLOR_PRESETS = [
  { label: "Suggested", colors: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#374151"] },
];

const SenderList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SenderRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
`;

const CompactCard = styled(Card)`
  &.ant-card {
    border-radius: 12px;
  }
  .ant-card-body {
    padding: 14px 16px !important;
  }
`;

const SendingColumn = styled.div`
  display: flex;
  margin: 0 auto;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  width: 100%;
`;

const FooterPreviewChrome = styled.div`
  margin-top: 14px;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  background: #fff;
`;

const FooterPreview = styled.div`
  line-height: 0;
  & * {
    line-height: normal;
  }
`;

const SenderFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px 12px;
  align-items: end;
  margin-bottom: ${(p) => (p.$hasList ? "14px" : "0")};
`;

const DnsScroll = styled.div`
  overflow-x: auto;
  margin-top: 8px;
  -webkit-overflow-scrolling: touch;
`;

function domainStatusTag(status) {
  const s = (status || "").toLowerCase();
  if (s === "verified") return <Tag color="success" icon={<CheckCircleOutlined />}>Verified</Tag>;
  if (s === "pending") return <Tag color="processing">Pending</Tag>;
  return <Tag>{status || "Unknown"}</Tag>;
}

export default function SendingMarketingPanel({ tier }) {
  const [domains, setDomains] = useState([]);
  const [senders, setSenders] = useState([]);
  const [footer, setFooter] = useState("");
  const [unsubText, setUnsubText] = useState("Unsubscribe");
  const [unsubStyle, setUnsubStyle] = useState("link");
  const [unsubColor, setUnsubColor] = useState("#6366f1");
  const [footerAlignment, setFooterAlignment] = useState("left");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newSender, setNewSender] = useState({ display_name: "", from_email: "", reply_to: "" });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s, st] = await Promise.all([
        businessService.listMarketingDomains(),
        businessService.listMarketingSenders(),
        businessService.getMarketingSettings(),
      ]);
      if (d.success) setDomains(Array.isArray(d.data) ? d.data : []);
      if (s.success) setSenders(Array.isArray(s.data) ? s.data : []);
      if (st.success && st.data) {
        setFooter(st.data.physical_address_footer || "");
        setUnsubText(st.data.unsubscribe_text || "Unsubscribe");
        setUnsubStyle(st.data.unsubscribe_style === "button" ? "button" : "link");
        setUnsubColor(sanitizeMarketingHexColor(st.data.unsubscribe_color));
        setFooterAlignment(sanitizeFooterAlignment(st.data.footer_alignment));
        setSettingsDirty(false);
      }
    } catch (e) {
      message.error(e?.message || "Could not load sending settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const previewHtml = useMemo(
    () =>
      buildMarketingFooterPreviewHtml({
        physical_address_footer: footer,
        unsubscribe_text: unsubText,
        unsubscribe_style: unsubStyle,
        unsubscribe_color: unsubColor,
        footer_alignment: footerAlignment,
      }),
    [footer, unsubText, unsubStyle, unsubColor, footerAlignment],
  );

  const saveSettings = async () => {
    setSavingSettings(true);
    const r = await businessService.patchMarketingSettings({
      physical_address_footer: footer,
      unsubscribe_text: unsubText.trim().slice(0, 50) || "Unsubscribe",
      unsubscribe_style: unsubStyle,
      unsubscribe_color: sanitizeMarketingHexColor(unsubColor),
      footer_alignment: sanitizeFooterAlignment(footerAlignment),
    });
    setSavingSettings(false);
    if (r.success) {
      message.success("Footer settings saved.");
      setSettingsDirty(false);
    } else message.error(r.error || "Save failed.");
  };

  const addDomain = async () => {
    if (!tier?.custom_domain_allowed) {
      message.error("Custom domains require Growth or higher.");
      return;
    }
    const r = await businessService.createMarketingDomain({ domain: newDomain });
    if (r.success) {
      message.success("Domain added — add DNS records below, then verify.");
      setNewDomain("");
      load();
    } else message.error(r.error);
  };

  const verifyDomain = async (id) => {
    const r = await businessService.verifyMarketingDomain(id);
    if (r.success) message.success(`Status: ${r.data?.status || "ok"}`);
    else message.error(r.error);
    load();
  };

  const addSender = async () => {
    const r = await businessService.createMarketingSender({
      display_name: newSender.display_name,
      from_email: newSender.from_email,
      reply_to: newSender.reply_to || undefined,
    });
    if (r.success) {
      message.success("Sender added.");
      setNewSender({ display_name: "", from_email: "", reply_to: "" });
      load();
    } else message.error(r.error);
  };

  const dnsColumns = [
    { title: "Type", dataIndex: "type", key: "type", width: 72, ellipsis: true },
    { title: "Name / host", dataIndex: "name", key: "name", ellipsis: true },
    { title: "Value", dataIndex: "value", key: "value", ellipsis: true },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 80,
      render: (v) => (v != null && v !== "" ? v : "—"),
    },
  ];

  if (loading) {
    return (
      <Panel>
        <SendingPanelSkeleton />
      </Panel>
    );
  }

  return (
    <Panel>
      <SendingColumn>
      <MarketingSection
        title="Sender profiles"
        description="From name and email shown to recipients. On Growth+, the from address must match a verified domain."
      >
        <CompactCard size="small">
          <SenderFormGrid $hasList={senders.length > 0}>
            <Form.Item label="Display name" style={{ marginBottom: 0 }}>
              <Input
                size="small"
                placeholder="My Studio"
                value={newSender.display_name}
                onChange={(e) => setNewSender((s) => ({ ...s, display_name: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="From email" style={{ marginBottom: 0 }}>
              <Input
                size="small"
                placeholder="hello@yourdomain.com"
                value={newSender.from_email}
                onChange={(e) => setNewSender((s) => ({ ...s, from_email: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="Reply-to" style={{ marginBottom: 0 }}>
              <Input
                size="small"
                placeholder="Optional"
                value={newSender.reply_to}
                onChange={(e) => setNewSender((s) => ({ ...s, reply_to: e.target.value }))}
              />
            </Form.Item>
            <Button type="primary" size="small" onClick={addSender} style={{ height: 32 }}>
              Add sender
            </Button>
          </SenderFormGrid>
          {senders.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>
              No sender profiles yet. Add at least one if you use custom from addresses.
            </Text>
          ) : (
            <SenderList>
              {senders.map((s) => (
                <SenderRow key={s.id}>
                  <div>
                    <Text strong style={{ display: "block", fontSize: 13 }}>
                      {s.display_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.from_email}
                      {s.reply_to ? ` · reply: ${s.reply_to}` : ""}
                    </Text>
                  </div>
                  <Popconfirm
                    title="Remove this sender?"
                    description="You can add it again later."
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      const r = await businessService.deleteMarketingSender(s.id);
                      if (r.success) {
                        message.success("Removed.");
                        load();
                      } else message.error(r.error);
                    }}
                  >
                    <Button type="link" danger size="small">
                      Remove
                    </Button>
                  </Popconfirm>
                </SenderRow>
              ))}
            </SenderList>
          )}
        </CompactCard>
      </MarketingSection>

      <MarketingSection
        title="Unsubscribe & compliance footer"
        description="Customize how the unsubscribe control looks. Physical address is required for CAN-SPAM."
      >
        <CompactCard size="small">

            <Form layout="vertical" style={{ marginTop: 0 }}>
              <Row gutter={[12, 0]}>
                <Col xs={24} sm={14}>
                  <Form.Item label="Unsubscribe label" help={`${unsubText.length}/50`} style={{ marginBottom: 12 }}>
                    <Input
                      value={unsubText}
                      maxLength={50}
                      placeholder="Unsubscribe"
                      onChange={(e) => {
                        setUnsubText(e.target.value);
                        setSettingsDirty(true);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={10}>
                  <Form.Item label="Link color" style={{ marginBottom: 12 }}>
                    <ColorPicker
                      value={sanitizeMarketingHexColor(unsubColor)}
                      onChange={(c, hex) => {
                        const next =
                          hex ||
                          (typeof c?.toHexString === "function" ? c.toHexString() : null) ||
                          "#6366f1";
                        setUnsubColor(sanitizeMarketingHexColor(next));
                        setSettingsDirty(true);
                      }}
                      presets={COLOR_PRESETS}
                      showText
                      format="hex"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Style" style={{ marginBottom: 12 }}>
                    <Radio.Group
                      value={unsubStyle}
                      onChange={(e) => {
                        setUnsubStyle(e.target.value);
                        setSettingsDirty(true);
                      }}
                      options={[
                        { value: "link", label: "Text link" },
                        { value: "button", label: "Button" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Footer alignment" style={{ marginBottom: 12 }}>
                    <Radio.Group
                      value={footerAlignment}
                      onChange={(e) => {
                        setFooterAlignment(e.target.value);
                        setSettingsDirty(true);
                      }}
                      options={[
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Physical address"
                    help={`${footer.length}/2000 characters`}
                    style={{ marginBottom: 8 }}
                  >
                    <Input.TextArea
                      rows={3}
                      value={footer}
                      onChange={(e) => {
                        setFooter(e.target.value);
                        setSettingsDirty(true);
                      }}
                      placeholder="e.g. 123 Main St, Suite 4, New York, NY 10001"
                      maxLength={2000}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2, marginBottom: 0 }}>
            Preview — how the footer appears after your message
          </Text>
          <FooterPreviewChrome>
            <FooterPreview dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </FooterPreviewChrome>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: "block", maxWidth: 400 }}>
            Recipients get a working one-click link; this mockup is static.
          </Text>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              size="small"
              onClick={saveSettings}
              disabled={!settingsDirty}
              loading={savingSettings}
            >
              Save footer settings
            </Button>
          </div>
        </CompactCard>
      </MarketingSection>

      <MarketingSection
        title="Sending domains"
        description="Verify your domain to send from your own address (Growth+)."
      >
        {!tier?.custom_domain_allowed ? (
          <MarketingFeatureUpsell
            title="Send from your own domain"
            minPlanLabel="Growth"
            bullets={[
              "Add and verify your domain with DNS records",
              "Improved deliverability and brand recognition",
              "Required for custom from-addresses",
            ]}
          />
        ) : (
          <CompactCard size="small">
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Input
                placeholder="yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
                onPressEnter={addDomain}
              />
              <Button type="primary" size="small" onClick={addDomain}>
                Add domain
              </Button>
            </div>
            {domains.length === 0 && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                No domains added yet.
              </Text>
            )}
            {domains.map((dom) => (
              <div
                key={dom.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 8,
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  <Text strong>{dom.domain}</Text>
                  {domainStatusTag(dom.status)}
                  <Button size="small" type="link" onClick={() => verifyDomain(dom.id)}>
                    Check verification
                  </Button>
                </div>
                {dom.dns_records?.length > 0 && (
                  <Collapse
                    size="small"
                    style={{ marginTop: 8 }}
                    items={[
                      {
                        key: "dns",
                        label: "DNS records",
                        children: (
                          <DnsScroll>
                            <Table
                              size="small"
                              pagination={false}
                              rowKey={(_, i) => `${dom.id}-dns-${i}`}
                              dataSource={dom.dns_records.map((rec, i) => ({
                                key: i,
                                type: rec.type ?? rec.record_type ?? "—",
                                name: rec.name ?? rec.host ?? "—",
                                value: rec.value ?? rec.content ?? "—",
                                priority: rec.priority,
                              }))}
                              columns={dnsColumns}
                              locale={{ emptyText: "No records" }}
                            />
                          </DnsScroll>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ))}
          </CompactCard>
        )}
      </MarketingSection>
      </SendingColumn>
    </Panel>
  );
}
