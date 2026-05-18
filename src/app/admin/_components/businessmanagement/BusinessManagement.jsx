"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Card, Button, ConfigProvider, Divider, Radio, Typography } from "antd";
import message from "@/lib/message";
import {
  Briefcase,
  Activity,
  Shield,
  Zap,
  RefreshCw,
  MapPin,
  Search,
} from "lucide-react";
import {
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import {
  AdminMetricCardsSkeleton,
  AdminAreaChartSkeleton,
  AdminPieChartSkeleton,
  AdminRankedListSkeleton,
  AdminTableSkeleton,
} from "../shared/AdminSkeletons";

import { businessManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme"; // Adjust path
import AdminMetricCards from "../shared/AdminMetricCards";
import {
  AdminBusinessChartTooltip,
  BUSINESS_CHART_THEME,
  getChartTotal,
} from "../shared/AdminBusinessCharts";
import { adminColors as colors } from "../shared/adminColors";
import { formatCurrency, hexToRgba } from "../shared/adminUtils";
import { ActionButtonsContainer } from "../shared/AdminButtons";
import { AdminCompactTable } from "../shared/AdminCompactTable";

const { Text } = Typography;

// --- MAIN PAGE STYLED COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  @media (max-width: 768px) {
    padding: 8px;
    gap: 0;
  }
`;

const ContentLayer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  padding: 20px 24px;
  @media (max-width: 768px) {
    padding: 14px 16px;
    border-radius: 12px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 0;
`;

const ChartCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 16px 20px !important;
  }
`;

const GeographyShell = styled.section`
  margin-top: 4px;
  padding: 22px 22px 24px;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  background: linear-gradient(165deg, ${hexToRgba(colors.primary, 0.04)} 0%, #ffffff 42%, #f8fafc 100%);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

const GeographyIntro = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
  max-width: 800px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const GeographyIconWrap = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${hexToRgba(colors.primary, 0.12)};
  color: ${colors.primary};
  flex-shrink: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
`;

const GeographyHeading = styled.div`
  min-width: 0;
`;

const GeographyKicker = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${colors.textTertiary};
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const GeographyTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  color: ${colors.textPrimary};
  letter-spacing: -0.02em;
`;

const GeographySubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: ${colors.textSecondary};
`;

const GeographyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: stretch;

  @media (min-width: 960px) {
    grid-template-columns: minmax(300px, 0.95fr) minmax(380px, 1.15fr);
  }
`;

const GeographyCard = styled.div`
  background: #ffffff;
  border: 1px solid ${colors.border};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const GeographyCardHead = styled.div`
  padding: 16px 18px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
`;

const GeographyCardHeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
`;

const GeographyCardTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const GeographyCardHint = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: ${colors.textSecondary};
`;

const GeographyCardBody = styled.div`
  padding: 14px 18px 18px;
  flex: 1;
  min-height: 0;
`;

const PresetChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 4px;
`;

const PresetChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textPrimary};
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  line-height: 1.2;
`;

const ChipCount = styled.span`
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${colors.primary};
  background: ${hexToRgba(colors.primary, 0.1)};
  padding: 2px 8px;
  border-radius: 8px;
`;

const DemandSubheading = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${colors.textTertiary};
  margin: 18px 0 10px;

  &:first-of-type {
    margin-top: 0;
  }
`;

const CustomSearchItem = styled.li`
  list-style: none;
  margin: 0 0 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${colors.border};
  background: #fafbfc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
`;

const CustomSearchRank = styled.span`
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${colors.textTertiary};
  min-width: 22px;
`;

const CustomSearchMeta = styled.span`
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${colors.textSecondary};
  background: #fff;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const CitiesTableWrap = styled.div`
  .ant-table {
    background: transparent;
  }
`;

// --- MAIN COMPONENT ---
const BusinessManagement = () => {
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [growthTrendLoading, setGrowthTrendLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total_businesses: 0,
    total_business_growth: 0,
    active_businesses: 0,
    total_revenue: 0,
    total_platform_revenue: 0,
    featured_businesses: 0,
    category_distribution: [],
    collection_distribution: [],
    province_distribution: [],
    top_cities: [],
    search_location_top: [],
    search_preset_demand: [],
    search_custom_top: [],
    growth_trend: [],
  });
  const [timeframe, setTimeframe] = useState("month");

  const fetchDashboardData = useCallback(async () => {
    setMetricsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const r = await businessManagementService.getPlatformMetrics();
      if (r.success) {
        setMetrics((p) => ({ ...p, ...r.data }));
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else message.error(r.error || "Failed to fetch metrics");
    } catch (e) {
      message.error("Failed to load dashboard metrics");
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchGrowthTrends = useCallback(async () => {
    setGrowthTrendLoading(true);
    try {
      const r = await businessManagementService.getGrowthTrends(timeframe);
      setMetrics((p) => ({ ...p, growth_trend: r.success ? r.data : [] }));
    } catch (e) {
      message.error("Failed to fetch trends");
    } finally {
      setGrowthTrendLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchGrowthTrends();
  }, [fetchGrowthTrends]);

  const refreshAllData = () => {
    fetchDashboardData();
    fetchGrowthTrends();
  };

  const totalBiz = metrics.total_businesses ?? 0;
  const activeBiz =
    metrics.active_businesses ??
    metrics.active_businesses_in_period ??
    metrics.active_businesses_30d ??
    0;
  const statCardsData = [
    {
      title: "Total Businesses",
      icon: Briefcase,
      value: totalBiz,
      growth: metrics.total_business_growth ?? null,
      color: colors.info,
      footer: "All registered",
      periodBadge: "All-time",
    },
    {
      title: "Active (30d)",
      icon: Activity,
      value: activeBiz,
      tooltip:
        "Logged in within the last 30 days as owner or accepted staff, and has ever received at least one booking.",
      footer: "Engaged · 30d login & ever booked",
      color: colors.success,
      periodBadge: "30d",
    },
    {
      title: "Pending Verifications",
      icon: Shield,
      value: metrics.pending_verifications ?? 0,
      footer: (metrics.pending_verifications ?? 0) > 0 ? "Action required" : "All reviewed",
      color: (metrics.pending_verifications ?? 0) > 0 ? colors.error : colors.success,
      urgent: (metrics.pending_verifications ?? 0) > 0,
      periodBadge: "All-time",
    },
    {
      title: "Widget Subscribers",
      icon: Zap,
      value: metrics.widget_subscribers ?? 0,
      footer: "Paid embed plans",
      color: colors.purple,
      periodBadge: "Current",
    },
  ];

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
      <ContentLayer>
        <DashboardHeader style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <PageTitle>Business Management</PageTitle>
            <HeaderSubtitle>
              Platform metrics and trends. Manage listings under Business Listings.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={refreshAllData}
              loading={metricsLoading || growthTrendLoading}
            >
              Refresh
            </Button>
          </ActionButtonsContainer>
        </DashboardHeader>

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase", marginBottom: 10 }}>
          Business metrics
        </div>
        <div style={{ marginBottom: 20 }}>
          {metricsLoading ? (
            <AdminMetricCardsSkeleton count={4} />
          ) : (
            <AdminMetricCards
              cards={statCardsData.map((card) => ({
                ...card,
                minimumFractionDigits: card.isCurrency ? 0 : undefined,
                maximumFractionDigits: card.isCurrency ? 0 : undefined,
              }))}
              isReadyForAnimation={isReadyForAnimation}
            />
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <ChartGrid style={{ marginBottom: 20 }}>
          <ChartCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Trend</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Businesses &amp; Revenue</div>
              </div>
              <Radio.Group
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  { label: "Week", value: "week" },
                  { label: "Month", value: "month" },
                  { label: "Year", value: "year" },
                ]}
              />
            </div>
            <div style={{ height: 240, marginTop: 12 }}>
              {growthTrendLoading ? (
                <AdminAreaChartSkeleton height={240} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={metrics.growth_trend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={BUSINESS_CHART_THEME.border} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: colors.textSecondary }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: colors.textSecondary }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: colors.textSecondary }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      width={44}
                    />
                    <RechartsTooltip
                      content={
                        <AdminBusinessChartTooltip
                          formatItemValue={(entry) =>
                            String(entry.name || "").toLowerCase().includes("revenue")
                              ? formatCurrency(entry.value)
                              : new Intl.NumberFormat().format(entry.value)
                          }
                        />
                      }
                      cursor={{ stroke: BUSINESS_CHART_THEME.border }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
                    <Bar yAxisId="left" dataKey="businesses" name="Businesses" fill={colors.info} radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill={colors.success} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
          <ChartCard>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Breakdown</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Collection Distribution</div>
            </div>
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
              {metricsLoading ? (
                <AdminPieChartSkeleton size={168} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.collection_distribution || []}
                      nameKey="name"
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="85%"
                      paddingAngle={5}
                      stroke="none"
                      cornerRadius={5}
                    >
                      {(metrics.collection_distribution || []).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                      <Label
                        value={new Intl.NumberFormat().format(
                          getChartTotal(metrics.collection_distribution || []),
                        )}
                        position="center"
                        fill={colors.textPrimary}
                        style={{ fontSize: "18px", fontWeight: "bold" }}
                      />
                    </Pie>
                    <RechartsTooltip
                      content={
                        <AdminBusinessChartTooltip
                          formatItemValue={(entry) =>
                            `${new Intl.NumberFormat().format(entry.value ?? 0)} classes`
                          }
                        />
                      }
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </ChartGrid>

        <Divider style={{ margin: "16px 0" }} />

        <GeographyShell aria-labelledby="geography-heading">
          <GeographyIntro>
            <GeographyIconWrap aria-hidden>
              <MapPin size={22} strokeWidth={2.25} />
            </GeographyIconWrap>
            <GeographyHeading>
              <GeographyKicker>Geography</GeographyKicker>
              <GeographyTitle id="geography-heading">Provinces &amp; cities</GeographyTitle>
              <GeographySubtitle>
                Where discovery demand shows up in search, alongside the metros hosting the most
                businesses on the platform.
              </GeographySubtitle>
            </GeographyHeading>
          </GeographyIntro>

          <GeographyGrid>
            <GeographyCard>
              <GeographyCardHead>
                <GeographyCardHeadRow>
                  <Search size={17} color={colors.primary} strokeWidth={2.25} style={{ flexShrink: 0 }} />
                  <GeographyCardTitle>Explore search demand</GeographyCardTitle>
                </GeographyCardHeadRow>
                <GeographyCardHint>
                  Ontario preset areas (same as explore filters) plus free-text location searches.
                </GeographyCardHint>
              </GeographyCardHead>
              <GeographyCardBody>
                {metricsLoading ? (
                  <AdminRankedListSkeleton rows={14} />
                ) : (
                  <>
                    <DemandSubheading>Suggested areas</DemandSubheading>
                    {(metrics.search_preset_demand || []).length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        No preset demand logged in this window.
                      </Text>
                    ) : (
                      <PresetChipWrap>
                        {(metrics.search_preset_demand || []).map((row) => (
                          <PresetChip key={row.label}>
                            <span>{row.label}</span>
                            <ChipCount>{row.count}</ChipCount>
                          </PresetChip>
                        ))}
                      </PresetChipWrap>
                    )}
                    <DemandSubheading>Custom searches</DemandSubheading>
                    {(metrics.search_custom_top || []).length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        No custom locations yet.
                      </Text>
                    ) : (
                      <ol style={{ margin: 0, padding: 0 }}>
                        {(metrics.search_custom_top || []).map((row, i) => (
                          <CustomSearchItem key={`${row.label}-${i}`}>
                            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <CustomSearchRank>{i + 1}.</CustomSearchRank>
                              <Text strong style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.label || "—"}
                              </Text>
                            </span>
                            <CustomSearchMeta>{row.count}</CustomSearchMeta>
                          </CustomSearchItem>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </GeographyCardBody>
            </GeographyCard>

            <GeographyCard>
              <GeographyCardHead>
                <GeographyCardHeadRow>
                  <MapPin size={17} color={colors.primary} strokeWidth={2.25} style={{ flexShrink: 0 }} />
                  <GeographyCardTitle>Top cities</GeographyCardTitle>
                </GeographyCardHeadRow>
                <GeographyCardHint>
                  Ranked by business concentration: city, province, listings, classes, and revenue.
                </GeographyCardHint>
              </GeographyCardHead>
              <GeographyCardBody>
                {metricsLoading ? (
                  <AdminTableSkeleton rows={8} />
                ) : (
                  <CitiesTableWrap>
                    <AdminCompactTable
                      size="small"
                      showSizeChanger={false}
                      pagination={false}
                      dataSource={metrics.top_cities || []}
                      rowKey={(r) => `${r.city}-${r.state}`}
                      scroll={{ x: "max-content" }}
                      columns={[
                        {
                          title: "#",
                          key: "rank",
                          width: 44,
                          fixed: "left",
                          render: (_, __, index) => (
                            <Text type="secondary" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                              {index + 1}
                            </Text>
                          ),
                        },
                        { title: "City", dataIndex: "city", key: "city", ellipsis: true },
                        { title: "Province", dataIndex: "state", key: "state", width: 100 },
                        {
                          title: "Biz",
                          dataIndex: "count",
                          key: "count",
                          width: 72,
                          align: "right",
                          render: (v) => (
                            <Text style={{ fontVariantNumeric: "tabular-nums" }}>{v ?? 0}</Text>
                          ),
                        },
                        {
                          title: "Classes",
                          dataIndex: "classes_count",
                          key: "classes_count",
                          width: 84,
                          align: "right",
                          render: (v) => (
                            <Text style={{ fontVariantNumeric: "tabular-nums" }}>{v ?? 0}</Text>
                          ),
                        },
                        {
                          title: "Revenue",
                          dataIndex: "revenue",
                          key: "revenue",
                          width: 112,
                          align: "right",
                          render: (v) => (
                            <Text style={{ fontVariantNumeric: "tabular-nums" }}>
                              {formatCurrency(Number(v || 0))}
                            </Text>
                          ),
                        },
                      ]}
                    />
                  </CitiesTableWrap>
                )}
              </GeographyCardBody>
            </GeographyCard>
          </GeographyGrid>
        </GeographyShell>
      </ContentLayer>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BusinessManagement;
