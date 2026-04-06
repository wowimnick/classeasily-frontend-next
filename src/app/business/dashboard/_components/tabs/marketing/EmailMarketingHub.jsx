"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Alert, Button, Divider, Progress, Tabs, Tag, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import dayjs from "dayjs";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { businessService } from "@/services/apiService";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import CampaignsMarketingPanel from "./CampaignsMarketingPanel";
import CampaignEditorScreen from "./CampaignEditorScreen";
import AudiencesMarketingPanel from "./AudiencesMarketingPanel";
import TemplatesMarketingPanel from "./TemplatesMarketingPanel";
import SendingMarketingPanel from "./SendingMarketingPanel";
import { MarketingHubSkeleton, Skel } from "./marketingSkeletons";
import { resolveEffectiveMarketingTier } from "./resolveMarketingTier";
import { MarketingTabContent, MARKETING_BILLING_PATH } from "./marketingLayout";

const { Title, Paragraph, Text } = Typography;

const QUOTA_CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

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
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
`;

const UsageStat = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px;
`;

const UsageFlowRow = styled.span`
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
`;

const QuotaDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const QuotaDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  max-height: 70vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  width: min(800px, calc(100vw - 32px)) !important;
  max-width: calc(100vw - 32px) !important;
  box-sizing: border-box;
  box-shadow: 0 -8px 40px rgba(15, 23, 42, 0.12);
  z-index: 1050;
  outline: none;
`;

const QuotaDrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const QuotaDrawerBody = styled.div`
  overflow-y: auto;
  padding: 24px 24px 32px;
  min-height: 0;
`;

const QuotaDrawerHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
`;

const QuotaSummaryCard = styled.div`
  background: linear-gradient(145deg, #fafaff 0%, #f4f6ff 45%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 22px;
`;

const QuotaSummaryProgressTrack = styled.div`
  margin-top: 14px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
`;

const QuotaSummaryProgressFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: ${(p) =>
    p.$exhausted ? "#ef4444" : "linear-gradient(90deg, #4f46e5, #818cf8)"};
  width: ${(p) => p.$pct}%;
  transition: width 0.35s ease;
`;

const CampaignSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
`;

const CampaignBarRow = styled.div`
  padding: 12px 14px;
  background: #fafafa;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  margin-bottom: 10px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const CampaignBarHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
`;

const CampaignBarName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const CampaignBarSends = styled.span`
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #4338ca;
  flex-shrink: 0;
`;

const CampaignBarTrack = styled.div`
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
`;

const CampaignBarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: ${(p) => p.$color};
  width: ${(p) => p.$widthPct}%;
  min-width: ${(p) => (p.$widthPct > 0 ? "3px" : "0")};
  transition: width 0.35s ease;
`;

const QuotaDrawerFootnote = styled.p`
  margin: 16px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: #94a3b8;
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
    try {
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
    } catch {
      setAddonsLoadFailed(true);
      setAccountLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openQuotaModal = async () => {
    setQuotaModalOpen(true);
    setQuotaModalLoading(true);
    try {
      const r = await businessService.listMarketingCampaigns();
      if (r.success && Array.isArray(r.data)) {
        const withSends = r.data
          .filter((c) => Number(c.sends_sent) > 0)
          .sort((a, b) => Number(b.sends_sent) - Number(a.sends_sent));
        setQuotaCampaigns(withSends);
      } else setQuotaCampaigns([]);
    } catch {
      setQuotaCampaigns([]);
    } finally {
      setQuotaModalLoading(false);
    }
  };

  const em = addons?.email_marketing;
  const active = em?.active === true;
  const effectiveTier = useMemo(
    () => resolveEffectiveMarketingTier(account?.tier, em?.current_price_id, em?.tiers || []),
    [account?.tier, em?.current_price_id, em?.tiers],
  );
  const usage = account?.usage ?? em?.usage ?? null;
  const tiers = em?.tiers || [];

  const maxCampaignSends = useMemo(() => {
    const m = Math.max(0, ...quotaCampaigns.map((c) => Number(c.sends_sent) || 0));
    return m > 0 ? m : 1;
  }, [quotaCampaigns]);

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
          <Link href="/business/dashboard/settings?tab=billing&email_marketing=1">Plans &amp; billing</Link>
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
          aria-label="Open send quota breakdown"
        >
          <UsageStat>
            <UsageFlowRow>
              <NumberFlowGroup>
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                  <NumberFlow value={usedNum} />
                  <span>/</span>
                  <NumberFlow value={limitNum} />
                </span>
              </NumberFlowGroup>
            </UsageFlowRow>
            <Text type="secondary" style={{ fontSize: 12 }}>
              sends this period · breakdown
            </Text>
          </UsageStat>
          <UsageStat>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: quotaExhausted ? "#ef4444" : "#10b981",
              }}
            >
              <NumberFlow value={remainNum} />
            </span>
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
            Breakdown →
          </Text>
        </UsageRow>
      )}

      <Drawer.Root open={quotaModalOpen} onOpenChange={setQuotaModalOpen}>
        <Drawer.Portal>
          <QuotaDrawerOverlay />
          <QuotaDrawerContent>
            <QuotaDrawerHandle />
            <QuotaDrawerBody>
              <QuotaDrawerHeaderRow>
                <Title level={5} style={{ margin: 0 }}>
                  Send quota
                </Title>

              </QuotaDrawerHeaderRow>
              {usage && (
                <QuotaSummaryCard>
                  <Text strong style={{ fontSize: 15, display: "block", color: "#312e81" }}>
                    <NumberFlowGroup>
                      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                        <NumberFlow value={usedNum} />
                        <span>/</span>
                        <NumberFlow value={limitNum} />
                      </span>
                    </NumberFlowGroup>{" "}
                    sends this period
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 6 }}>
                    <NumberFlow value={remainNum} /> remaining
                    {periodLabel ? ` · ${periodLabel}` : ""}
                  </Text>
                  <QuotaSummaryProgressTrack>
                    <QuotaSummaryProgressFill $pct={usagePct} $exhausted={quotaExhausted} />
                  </QuotaSummaryProgressTrack>
                </QuotaSummaryCard>
              )}
              <CampaignSectionLabel>Recorded sends by campaign</CampaignSectionLabel>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 14 }}>
                Lifetime totals per campaign. Bars scale to the largest campaign in the list so you can
                compare volume at a glance.
              </Text>
              {quotaModalLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ padding: "4px 0" }}>
                      <Skel $h="14px" $w="55%" $r="4px" style={{ marginBottom: 10 }} />
                      <Skel $h="8px" $w="100%" $r="999px" />
                    </div>
                  ))}
                </div>
              ) : quotaCampaigns.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 12px",
                    color: "#94a3b8",
                    fontSize: 13,
                    background: "#fafafa",
                    borderRadius: 12,
                    border: "1px dashed #e2e8f0",
                  }}
                >
                  No campaign send totals on record yet.
                </div>
              ) : (
                <div>
                  {quotaCampaigns.map((c, i) => {
                    const sends = Number(c.sends_sent) || 0;
                    const widthPct = Math.round((sends / maxCampaignSends) * 1000) / 10;
                    const color = QUOTA_CHART_COLORS[i % QUOTA_CHART_COLORS.length];
                    const label = (c.name || "Untitled campaign").trim() || "Untitled campaign";
                    return (
                      <CampaignBarRow key={c.id ?? `${label}-${i}`}>
                        <CampaignBarHead>
                          <CampaignBarName title={label}>{label}</CampaignBarName>
                          <CampaignBarSends>
                            <NumberFlow value={sends} /> sends
                          </CampaignBarSends>
                        </CampaignBarHead>
                        <CampaignBarTrack>
                          <CampaignBarFill $color={color} $widthPct={widthPct} />
                        </CampaignBarTrack>
                      </CampaignBarRow>
                    );
                  })}
                </div>
              )}
              {quotaCampaigns.length > 0 && (
                <QuotaDrawerFootnote>
                  Sum of recorded sends: {attributedSum.toLocaleString()}. This can exceed your period
                  total when campaigns span multiple billing periods.
                </QuotaDrawerFootnote>
              )}
            </QuotaDrawerBody>
          </QuotaDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>

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
