"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
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

const { Text } = Typography;

const SenderList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SenderRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
`;

const FooterPreview = styled.div`
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 6px;
`;

const CompactCard = styled(Card)`
  &.ant-card {
    border-radius: 12px;
  }
  .ant-card-body {
    padding: 14px 16px !important;
  }
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
  const [footerDirty, setFooterDirty] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newSender, setNewSender] = useState({ display_name: "", from_email: "", reply_to: "" });
  const [loading, setLoading] = useState(true);
  const [savingFooter, setSavingFooter] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, s, st] = await Promise.all([
      businessService.listMarketingDomains(),
      businessService.listMarketingSenders(),
      businessService.getMarketingSettings(),
    ]);
    if (d.success) setDomains(Array.isArray(d.data) ? d.data : []);
    if (s.success) setSenders(Array.isArray(s.data) ? s.data : []);
    if (st.success && st.data) {
      setFooter(st.data.physical_address_footer || "");
      setFooterDirty(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveFooter = async () => {
    setSavingFooter(true);
    const r = await businessService.patchMarketingSettings({ physical_address_footer: footer });
    setSavingFooter(false);
    if (r.success) {
      message.success("Footer saved.");
      setFooterDirty(false);
    } else message.error(r.error);
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

  if (loading) {
    return (
      <Panel>
        <SendingPanelSkeleton />
      </Panel>
    );
  }

  return (
    <Panel>
      <MarketingSection
        title="Compliance footer"
        description="Physical address shown below the unsubscribe link on every marketing email."
      >
        <CompactCard size="small">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <Tooltip title="Every marketing email includes a one-click unsubscribe. Contacts who unsubscribe are excluded from future marketing sends.">
              <InfoCircleOutlined style={{ color: "#6366f1", marginTop: 2 }} />
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>
              Unsubscribe is automatic. Add your business address (required for compliance).
            </Text>
          </div>
          <Collapse
            ghost
            size="small"
            items={[
              {
                key: "more",
                label: <span style={{ fontSize: 12 }}>More about unsubscribe</span>,
                children: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    When a contact clicks unsubscribe, they are removed from marketing immediately. This
                    does not affect transactional emails such as booking confirmations.
                  </Text>
                ),
              },
            ]}
          />
          <Form layout="vertical" style={{ marginTop: 4 }}>
            <Form.Item
              label="Physical address"
              help={`${footer.length}/2000 characters`}
              style={{ marginBottom: 8 }}
            >
              <Input.TextArea
                rows={2}
                value={footer}
                onChange={(e) => {
                  setFooter(e.target.value);
                  setFooterDirty(true);
                }}
                placeholder="e.g. 123 Main St, Suite 4, New York, NY 10001"
                maxLength={2000}
              />
            </Form.Item>
          </Form>
          <FooterPreview>
            <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0 0 8px" }} />
            <div>
              <span style={{ color: "#6366f1", textDecoration: "underline" }}>Unsubscribe</span> from
              marketing emails.
            </div>
            {footer && <div style={{ marginTop: 4, color: "#9ca3af" }}>{footer}</div>}
            {!footer && (
              <div style={{ marginTop: 4, color: "#d1d5db", fontStyle: "italic" }}>
                Your business address will appear here.
              </div>
            )}
          </FooterPreview>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              size="small"
              onClick={saveFooter}
              disabled={!footerDirty}
              loading={savingFooter}
              key={`footer-save-${savingFooter}`}
            >
              Save address
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
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
                          <pre
                            style={{
                              fontSize: 11,
                              margin: 0,
                              overflow: "auto",
                              maxHeight: 180,
                              background: "#fff",
                              padding: 8,
                              borderRadius: 6,
                              border: "1px solid #eee",
                            }}
                          >
                            {JSON.stringify(dom.dns_records, null, 2)}
                          </pre>
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

      <MarketingSection
        title="Sender profiles"
        description="From name and email shown to recipients (from email must match a verified domain on Growth+)."
      >
        <CompactCard size="small">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "flex-end",
              marginBottom: senders.length ? 12 : 0,
            }}
          >
            <div style={{ minWidth: 140, flex: "1 1 140px" }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                Display name
              </Text>
              <Input
                size="small"
                placeholder="My Studio"
                value={newSender.display_name}
                onChange={(e) => setNewSender((s) => ({ ...s, display_name: e.target.value }))}
              />
            </div>
            <div style={{ minWidth: 180, flex: "1 1 180px" }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                From email
              </Text>
              <Input
                size="small"
                placeholder="hello@yourdomain.com"
                value={newSender.from_email}
                onChange={(e) => setNewSender((s) => ({ ...s, from_email: e.target.value }))}
              />
            </div>
            <div style={{ minWidth: 160, flex: "1 1 160px" }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                Reply-to
              </Text>
              <Input
                size="small"
                placeholder="Optional"
                value={newSender.reply_to}
                onChange={(e) => setNewSender((s) => ({ ...s, reply_to: e.target.value }))}
              />
            </div>
            <Button type="primary" size="small" onClick={addSender} style={{ marginBottom: 1 }}>
              Add
            </Button>
          </div>
          {senders.length > 0 && (
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
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={async () => {
                      const r = await businessService.deleteMarketingSender(s.id);
                      if (r.success) {
                        message.success("Removed.");
                        load();
                      } else message.error(r.error);
                    }}
                  >
                    Remove
                  </Button>
                </SenderRow>
              ))}
            </SenderList>
          )}
        </CompactCard>
      </MarketingSection>
    </Panel>
  );
}
