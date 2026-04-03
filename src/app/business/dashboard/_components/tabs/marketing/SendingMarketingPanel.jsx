"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  ColorPicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckCircleOutlined, GlobalOutlined, MailOutlined } from "@ant-design/icons";
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
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  transition: background 0.15s;
  &:hover {
    background: #f4f4f5;
  }
`;

const ModalBanner = styled.div`
  background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const FormCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fafbfc;
  padding: 14px 16px;
  margin-bottom: 16px;
`;

const SenderFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px 12px;
  align-items: end;
`;

const DnsScroll = styled.div`
  overflow-x: auto;
  margin-top: 8px;
  -webkit-overflow-scrolling: touch;
`;

const FooterPreviewChrome = styled.div`
  margin-top: 0;
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

const PreviewSticky = styled.div`
  position: sticky;
  top: 8px;
`;

const LivePreviewChip = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
`;

const SendingColumn = styled.div`
  display: flex;
  margin: 0 auto;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  width: 100%;
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
  const [sendersModalOpen, setSendersModalOpen] = useState(false);
  const [domainsModalOpen, setDomainsModalOpen] = useState(false);

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
        footer_alignment: footerAlignment,
      }),
    [footer, footerAlignment],
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

  const sendersModal = (
    <Modal
      title={
        <span>
          <MailOutlined style={{ marginRight: 8, color: "#6366f1" }} />
          Sender profiles
        </span>
      }
      open={sendersModalOpen}
      onCancel={() => setSendersModalOpen(false)}
      footer={null}
      width="min(560px, 92vw)"
      destroyOnClose
    >
      <ModalBanner>
        <div>
          <Text strong style={{ display: "block", color: "#312e81" }}>
            From name and email shown to recipients
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            On Growth+, the from address must match a verified domain.
          </Text>
        </div>
        <Badge count={senders.length} showZero color="#6366f1" style={{ fontWeight: 700 }} />
      </ModalBanner>
      <FormCard>
        <SenderFormGrid>
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
      </FormCard>
      {senders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 12px", color: "#6b7280" }}>
          <MailOutlined style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }} />
          <Text type="secondary" style={{ display: "block", fontSize: 13 }}>
            No sender profiles yet. Add one above to customize your from address.
          </Text>
        </div>
      ) : (
        <SenderList>
          {senders.map((s) => (
            <SenderRow key={s.id}>
              <div>
                <Text strong style={{ display: "block", fontSize: 14 }}>
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
    </Modal>
  );

  const domainsModal = (
    <Modal
      title={
        <span>
          <GlobalOutlined style={{ marginRight: 8, color: "#6366f1" }} />
          Sending domains
        </span>
      }
      open={domainsModalOpen}
      onCancel={() => setDomainsModalOpen(false)}
      footer={null}
      width="min(600px, 92vw)"
      destroyOnClose
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
        <>
          <ModalBanner>
            <div>
              <Text strong style={{ display: "block", color: "#312e81" }}>
                Verify your domain to send from your own address
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Add DNS records from your provider, then check verification.
              </Text>
            </div>
            <Badge count={domains.length} showZero color="#6366f1" style={{ fontWeight: 700 }} />
          </ModalBanner>
          <FormCard>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Input
                placeholder="yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
                onPressEnter={addDomain}
              />
              <Button type="primary" size="small" onClick={addDomain}>
                Add domain
              </Button>
            </div>
          </FormCard>
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
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 10,
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
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
        </>
      )}
    </Modal>
  );

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
        {sendersModal}
        {domainsModal}

        <MarketingSection
          title="Sender profiles"
          description="From name and email shown to recipients."
          action={
            <Button type="primary" size="small" onClick={() => setSendersModalOpen(true)}>
              Manage
            </Button>
          }
        >
          <Card size="small" styles={{ body: { padding: "14px 16px" } }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {senders.length === 0
                ? "No sender profiles configured."
                : `${senders.length} sender profile${senders.length === 1 ? "" : "s"} configured.`}
            </Text>
          </Card>
        </MarketingSection>

        <MarketingSection
          title="Unsubscribe & compliance"
          description="Mailing address is appended to every send. Place the unsubscribe link in your email body."
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message="Merge tag and Unsubscribe block"
            description={
              <span style={{ fontSize: 13 }}>
                Use the merge tag <Text code>{`{{unsubscribe_url}}`}</Text> as the{" "}
                <Text code>href</Text> of a link or button, or add the Unsubscribe block in the visual
                builder. The label, color, and style below apply to the Unsubscribe block. You must
                include the merge tag somewhere in the email before you can send.
              </span>
            }
          />
          <Row gutter={[24, 24]}>
            <Col xs={24} md={14}>
              <Form layout="vertical" style={{ marginTop: 0 }}>
                <Row gutter={[12, 0]}>
                  <Col xs={24} sm={14}>
                    <Form.Item
                      label={<span style={{ fontSize: 14 }}>Unsubscribe label</span>}
                      help={`${unsubText.length}/50`}
                      style={{ marginBottom: 14 }}
                    >
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
                    <Form.Item label={<span style={{ fontSize: 14 }}>Accent color</span>} style={{ marginBottom: 14 }}>
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
                    <Form.Item label={<span style={{ fontSize: 14 }}>Default style (Unsubscribe block)</span>} style={{ marginBottom: 14 }}>
                      <Radio.Group
                        value={unsubStyle}
                        onChange={(e) => {
                          setUnsubStyle(e.target.value);
                          setSettingsDirty(true);
                        }}
                        optionType="button"
                        buttonStyle="solid"
                        options={[
                          { value: "link", label: "Text link" },
                          { value: "button", label: "Button" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={<span style={{ fontSize: 14 }}>Mailing address alignment</span>} style={{ marginBottom: 14 }}>
                      <Radio.Group
                        value={footerAlignment}
                        onChange={(e) => {
                          setFooterAlignment(e.target.value);
                          setSettingsDirty(true);
                        }}
                        optionType="button"
                        buttonStyle="solid"
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
                      label={<span style={{ fontSize: 14 }}>Physical address</span>}
                      help={`${footer.length}/2000 characters`}
                      style={{ marginBottom: 8 }}
                    >
                      <Input.TextArea
                        rows={4}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                {settingsDirty && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#f59e0b",
                      flexShrink: 0,
                    }}
                    title="Unsaved changes"
                  />
                )}
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
            </Col>
            <Col xs={24} md={10}>
              <PreviewSticky>
                <LivePreviewChip>Live preview</LivePreviewChip>
                <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
                  Mailing address block appended to sends (unsubscribe is in your message body).
                </Text>
                <FooterPreviewChrome>
                  <FooterPreview dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </FooterPreviewChrome>
              </PreviewSticky>
            </Col>
          </Row>
        </MarketingSection>

        <MarketingSection
          title="Sending domains"
          description="Verify your domain to send from your own address (Growth+)."
          action={
            <Button type="primary" size="small" onClick={() => setDomainsModalOpen(true)}>
              Manage
            </Button>
          }
        >
          <Card size="small" styles={{ body: { padding: "14px 16px" } }}>
            {!tier?.custom_domain_allowed ? (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Available on Growth+. Open Manage to learn more.
              </Text>
            ) : domains.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>
                No domains added yet.
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {domains.length} domain{domains.length === 1 ? "" : "s"} on file.
              </Text>
            )}
          </Card>
        </MarketingSection>
      </SendingColumn>
    </Panel>
  );
}
