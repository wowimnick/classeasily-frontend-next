"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Alert, Button, Divider, Modal, Progress, Table, Tabs, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { businessService } from "@/services/apiService";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import CampaignsMarketingPanel from "./CampaignsMarketingPanel";
import CampaignEditorScreen from "./CampaignEditorScreen";
import AudiencesMarketingPanel from "./AudiencesMarketingPanel";
import TemplatesMarketingPanel from "./TemplatesMarketingPanel";
import SendingMarketingPanel from "./SendingMarketingPanel";
import AutomationsMarketingPanel from "./AutomationsMarketingPanel";
import { MarketingHubSkeleton } from "./marketingSkeletons";
import { resolveEffectiveMarketingTier } from "./resolveMarketingTier";
import { MarketingTabContent, MARKETING_BILLING_PATH } from "./marketingLayout";

const { Title, Paragraph, Text } = Typography;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 28px 48px;
  background: #fff;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 14px 14px 36px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const UsageRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 8px;
  margin-inline: -6px;
  padding: 6px 8px;
  transition: background 0.15s;
  &:hover {
    background: #f8fafc;
  }
`;

const UsageStat = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px;
`;

export default function EmailMarketingHub() {
  const router = useRouter();
  const goBilling = useCallback(() => {
    router.push(MARKETING_BILLING_PATH);
  }, [router]);

  const [loading, setLoading] = useState(true);
  const [addons, setAddons] = useState(null);
  const [account, setAccount] = useState(null);
  const [addonsLoadFailed, setAddonsLoadFailed] = useState(false);
  const [accountLoadFailed, setAccountLoadFailed] = useState(false);
  const [tab, setTab] = useState("campaigns");
  const [editingId, setEditingId] = useState(null);
  const [scheduleFocus, setScheduleFocus] = useState(false);
  const [segments, setSegments] = useState([]);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaModalLoading, setQuotaModalLoading] = useState(false);
  const [quotaCampaigns, setQuotaCampaigns] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setAddonsLoadFailed(false);
    setAccountLoadFailed(false);
    const [ad, ac] = await Promise.all([
      businessService.getAddons(),
      businessService.getMarketingAccount(),
    ]);
    if (ad.success) {
      setAddons(ad.data);
    } else {
      setAddonsLoadFailed(true);
      setAddons(null);
    }
    if (ac.success) {
      setAccount(ac.data);
    } else {
      setAccountLoadFailed(true);
      setAccount(null);
    }

    const emOn = ad.success && ad.data?.email_marketing?.active === true;
    const accountTier = ac.success ? ac.data?.tier : null;
    const em = ad.success ? ad.data?.email_marketing : null;
    const effTier = resolveEffectiveMarketingTier(accountTier, em?.current_price_id, em?.tiers);

    if (emOn && effTier?.saved_segments_enabled) {
      const sg = await businessService.listMarketingSegments();
      if (sg.success) setSegments(Array.isArray(sg.data) ? sg.data : []);
      else setSegments([]);
    } else {
      setSegments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openQuotaModal = async () => {
    setQuotaModalOpen(true);
    setQuotaModalLoading(true);
    const r = await businessService.listMarketingCampaigns();
    if (r.success && Array.isArray(r.data)) {
      const withSends = r.data
        .filter((c) => Number(c.sends_sent) > 0)
        .sort((a, b) => Number(b.sends_sent) - Number(a.sends_sent));
      setQuotaCampaigns(withSends);
    } else setQuotaCampaigns([]);
    setQuotaModalLoading(false);
  };

  const em = addons?.email_marketing;
  const active = em?.active === true;
  const effectiveTier = useMemo(
    () => resolveEffectiveMarketingTier(account?.tier, em?.current_price_id, em?.tiers || []),
    [account?.tier, em?.current_price_id, em?.tiers],
  );
  const usage = account?.usage ?? em?.usage ?? null;
  const tiers = em?.tiers || [];

  const onEditCampaign = (id, opts) => {
    setEditingId(id);
    setScheduleFocus(!!opts?.focusSchedule);
  };

  const onBackFromEditor = (newId) => {
    if (newId) setEditingId(newId);
    else {
      setEditingId(null);
      setScheduleFocus(false);
    }
    load();
  };

  if (loading && !addons) {
    return (
      <Shell>
        <MarketingHubSkeleton />
      </Shell>
    );
  }

  if (addonsLoadFailed && !active) {
    return (
      <Shell>
        <Alert
          type="error"
          showIcon
          message="Could not load email marketing"
          description={
            accountLoadFailed
              ? "Subscription and usage could not be loaded. Check your connection and try again."
              : "Check your connection and try again."
          }
          action={
            <Button size="small" onClick={() => load()}>
              Retry
            </Button>
          }
        />
      </Shell>
    );
  }

  if (!active) {
    return (
      <Shell>
        <Title level={4} style={{ marginTop: 0 }}>
          Email campaigns
        </Title>
        <Paragraph type="secondary">
          Send marketing emails to your contacts. Transactional emails (bookings, receipts) are never
          counted toward this quota.
        </Paragraph>
        <Paragraph style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={goBilling}>
            Choose email marketing plan
          </Button>
        </Paragraph>
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          Opens the plan picker on{" "}
          <Link href="/business/dashboard/settings?tab=plan-billing">Plans &amp; billing</Link>
          {tiers.length === 0
            ? " (set Stripe price IDs in the backend to enable checkout)."
            : "."}
        </Paragraph>
      </Shell>
    );
  }

  if (editingId) {
    return (
      <Shell>
        <CampaignEditorScreen
          campaignId={editingId}
          onBack={onBackFromEditor}
          tier={effectiveTier}
          usage={usage}
          segments={segments}
          openScheduleFocus={scheduleFocus}
        />
      </Shell>
    );
  }

  const tierUnresolved = active && !effectiveTier && !loading;

  const usedNum = usage?.used_this_period ?? 0;
  const limitNum = usage?.monthly_limit ?? 0;
  const remainNum = usage?.remaining ?? 0;
  const usagePct = limitNum > 0 ? Math.min(100, Math.round((usedNum / limitNum) * 100)) : 0;
  const quotaExhausted = usage && Number(remainNum) === 0;

  const periodStart = usage?.period_start;
  const periodEnd = usage?.period_end;
  const periodLabel =
    periodStart && periodEnd
      ? `${dayjs(periodStart).format("MMM D, YYYY")} – ${dayjs(periodEnd).format("MMM D, YYYY")}`
      : null;

  const attributedSum = quotaCampaigns.reduce((acc, c) => acc + Number(c.sends_sent || 0), 0);

  return (
    <Shell>
      <DashboardBreadcrumb title="Email marketing" />

      {tierUnresolved && (
        <Alert
          type="warning"
          showIcon
          closable={false}
          style={{ marginBottom: 20 }}
          message="We could not match your email marketing subscription to a plan tier"
          description={
            <>
              Your subscription is active, but the price on file does not match the configured
              marketing plans in this environment. Open Plans &amp; billing to re-select a tier, or
              contact support if this persists.
              <div style={{ marginTop: 12 }}>
                <Button type="primary" size="small" onClick={goBilling}>
                  Open Plans &amp; billing
                </Button>
              </div>
            </>
          }
        />
      )}

      {accountLoadFailed && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          message="Usage details could not be refreshed"
          description="Some limits may be shown from your last known subscription snapshot. Try refreshing the page."
          action={
            <Button size="small" onClick={() => load()}>
              Retry
            </Button>
          }
        />
      )}

      <Header>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Email marketing
          </Title>
          {effectiveTier?.plan_label && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Plan: {effectiveTier.plan_label}
            </Text>
          )}
        </div>
        <Button size="small" onClick={goBilling}>
          Change plan
        </Button>
      </Header>

      {usage && (
        <UsageRow
          role="button"
          tabIndex={0}
          onClick={openQuotaModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openQuotaModal();
            }
          }}
          aria-label="Open send quota details"
        >
          <UsageStat>
            <Text style={{ fontSize: 13, fontWeight: 500 }}>
              {usedNum.toLocaleString()} / {limitNum.toLocaleString()}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              sends this period · click for breakdown
            </Text>
          </UsageStat>
          <UsageStat>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: quotaExhausted ? "#ef4444" : "#10b981",
              }}
            >
              {remainNum.toLocaleString()}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              remaining
            </Text>
          </UsageStat>
          <div style={{ flex: 1, minWidth: 140, maxWidth: 280 }}>
            <Progress
              percent={usagePct}
              size="small"
              showInfo={false}
              strokeColor={quotaExhausted ? "#ef4444" : "#6366f1"}
              trailColor="#e5e7eb"
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            View details →
          </Text>
        </UsageRow>
      )}

      <Modal
        title="Send quota"
        open={quotaModalOpen}
        onCancel={() => setQuotaModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {usage && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>
              {usedNum.toLocaleString()} / {limitNum.toLocaleString()} sends used
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {remainNum.toLocaleString()} remaining this period
                {periodLabel ? ` · ${periodLabel}` : ""}
              </Text>
            </div>
          </div>
        )}
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
          Your plan counts every marketing email delivered toward this total. Below are campaigns with
          recorded sends (lifetime on the campaign); use this as a guide for where volume went.
        </Text>
        <Table
          size="small"
          rowKey="id"
          loading={quotaModalLoading}
          dataSource={quotaCampaigns}
          pagination={false}
          locale={{ emptyText: "No campaign send totals on record yet." }}
          columns={[
            { title: "Campaign", dataIndex: "name", ellipsis: true },
            {
              title: "Sends recorded",
              dataIndex: "sends_sent",
              width: 130,
              align: "right",
              render: (v) => Number(v || 0).toLocaleString(),
            },
            {
              title: "Failed",
              dataIndex: "sends_failed",
              width: 80,
              align: "right",
              render: (v) => Number(v || 0).toLocaleString(),
            },
          ]}
        />
        {quotaCampaigns.length > 0 && (
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 12 }}>
            Sum of sends shown: {attributedSum.toLocaleString()} (may exceed period total if campaigns
            span multiple periods).
          </Text>
        )}
      </Modal>

      <Divider style={{ margin: "12px 0 4px" }} />

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "campaigns",
            label: "Campaigns",
            children: (
              <MarketingTabContent key="tab-campaigns">
                <CampaignsMarketingPanel onEditCampaign={onEditCampaign} usage={usage} />
              </MarketingTabContent>
            ),
          },
          {
            key: "automations",
            label: (
              <span>
                Automations{" "}
                {!effectiveTier?.automation_enabled && (
                  <Tag style={{ marginInlineStart: 6 }}>Business+</Tag>
                )}
              </span>
            ),
            children: (
              <MarketingTabContent key="tab-automations">
                <AutomationsMarketingPanel tier={effectiveTier} />
              </MarketingTabContent>
            ),
          },
          {
            key: "audiences",
            label: (
              <span>
                Audiences{" "}
                {!effectiveTier?.saved_segments_enabled && (
                  <Tag style={{ marginInlineStart: 6 }}>Growth+</Tag>
                )}
              </span>
            ),
            children: (
              <MarketingTabContent key="tab-audiences">
                <AudiencesMarketingPanel tier={effectiveTier} onSegmentsChanged={load} />
              </MarketingTabContent>
            ),
          },
          {
            key: "templates",
            label: "Templates",
            children: (
              <MarketingTabContent key="tab-templates">
                <TemplatesMarketingPanel tier={effectiveTier} />
              </MarketingTabContent>
            ),
          },
          {
            key: "sending",
            label: "Sending",
            children: (
              <MarketingTabContent key="tab-sending">
                <SendingMarketingPanel tier={effectiveTier} />
              </MarketingTabContent>
            ),
          },
        ]}
      />
    </Shell>
  );
}
