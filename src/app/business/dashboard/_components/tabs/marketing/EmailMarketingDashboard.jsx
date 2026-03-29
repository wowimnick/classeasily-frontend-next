"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input, Select, Table, Typography, message } from "antd";
import { businessService } from "@/services/apiService";

const { Title, Paragraph, Text } = Typography;

export default function EmailMarketingDashboard() {
  const [addons, setAddons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("<p>Hi {{first_name}},</p><p>...</p>");
  const [audienceType, setAudienceType] = useState("all_contacts");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const ad = await businessService.getAddons();
    if (ad.success) setAddons(ad.data);
    const emOn = ad.success && ad.data?.email_marketing?.active === true;
    if (emOn) {
      const list = await businessService.listMarketingCampaigns();
      if (list.success) setCampaigns(Array.isArray(list.data) ? list.data : []);
      else setCampaigns([]);
    } else {
      setCampaigns([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const em = addons?.email_marketing;
  const active = em?.active === true;
  const usage = em?.usage;
  const tiers = em?.tiers || [];

  const createAndOptionallySend = async (sendNow) => {
    setSaving(true);
    const cr = await businessService.createMarketingCampaign({ name: subject || "Campaign" });
    if (!cr.success || !cr.data?.id) {
      message.error(cr.error || "Could not create campaign.");
      setSaving(false);
      return;
    }
    const id = cr.data.id;
    const up = await businessService.updateMarketingCampaign(id, {
      subject,
      html_body: htmlBody,
      audience_type: audienceType,
      audience_filter: {},
      content_type: "html",
    });
    if (!up.success) {
      message.error(up.error || "Could not save content.");
      setSaving(false);
      return;
    }
    if (sendNow) {
      const sn = await businessService.sendMarketingCampaign(id);
      if (sn.success) message.success("Campaign queued for sending.");
      else message.error(sn.error || "Send failed.");
    } else {
      message.success("Campaign saved as draft.");
    }
    setSaving(false);
    load();
  };

  if (loading && !addons) {
    return (
      <div style={{ padding: 24 }}>
        <Text type="secondary">Loading…</Text>
      </div>
    );
  }

  if (!active) {
    return (
      <div style={{ maxWidth: 720, padding: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          Email campaigns
        </Title>
        <Paragraph type="secondary">
          Send marketing emails to your contacts.{" "}
          <strong>Transactional emails</strong> (bookings, receipts, etc.) are{" "}
          <strong>never</strong> counted toward this quota.
        </Paragraph>
        <Paragraph style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            href="/business/dashboard/settings?tab=plan-billing&email_marketing_modal=1"
          >
            Choose email marketing plan
          </Button>
        </Paragraph>
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          Opens the plan picker on{" "}
          <Link href="/business/dashboard/settings?tab=plan-billing">Plans &amp; billing</Link>
          {tiers.length === 0 ? " (set Stripe price IDs in the backend to enable checkout)." : "."}
        </Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, padding: 24 }}>
      <Title level={4} style={{ marginTop: 0 }}>
        Email campaigns
      </Title>
      {usage && (
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Marketing sends this period: {usage.used_this_period?.toLocaleString?.() ?? usage.used_this_period} /{" "}
          {usage.monthly_limit?.toLocaleString?.() ?? usage.monthly_limit} · Remaining:{" "}
          {usage.remaining?.toLocaleString?.() ?? usage.remaining}
        </Paragraph>
      )}
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <Input
          placeholder="Subject line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Input.TextArea
          rows={8}
          value={htmlBody}
          onChange={(e) => setHtmlBody(e.target.value)}
          placeholder="HTML body — use {{first_name}}, {{last_name}}, {{business_name}}"
        />
        <Select
          style={{ maxWidth: 280 }}
          value={audienceType}
          onChange={setAudienceType}
          options={[
            { value: "all_contacts", label: "All mailable contacts" },
            { value: "tags", label: "By tags (set audience in API for now)" },
          ]}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button loading={saving} onClick={() => createAndOptionallySend(false)}>
            Save draft
          </Button>
          <Button type="primary" loading={saving} onClick={() => createAndOptionallySend(true)}>
            Save &amp; send
          </Button>
        </div>
      </div>
      <Title level={5}>Recent campaigns</Title>
      <Table
        size="small"
        rowKey="id"
        dataSource={campaigns}
        pagination={false}
        columns={[
          { title: "Name", dataIndex: "name" },
          { title: "Status", dataIndex: "status" },
          { title: "Recipients", dataIndex: "recipient_count" },
          {
            title: "",
            key: "act",
            render: (_, row) =>
              row.status === "draft" || row.status === "failed" ? (
                <Button
                  size="small"
                  type="link"
                  onClick={async () => {
                    const r = await businessService.testMarketingCampaign(row.id);
                    if (r.success) message.success(`Test sent to you.`);
                    else message.error(r.error);
                  }}
                >
                  Test to me
                </Button>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
