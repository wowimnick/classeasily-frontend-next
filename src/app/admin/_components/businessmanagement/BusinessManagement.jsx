"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { Table, Card, Button, ConfigProvider, Divider, Radio, Typography, Grid } from "antd";
import message from "@/lib/message";
import {
  Briefcase,
  DollarSign,
  Activity,
  Shield,
  Zap,
  RefreshCw,
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
  BarChart,
} from "recharts";
import {
  AdminMetricCardsSkeleton,
  AdminAreaChartSkeleton,
  AdminPieChartSkeleton,
  AdminHorizontalBarChartSkeleton,
  AdminRankedListSkeleton,
  AdminTableSkeleton,
} from "../shared/AdminSkeletons";

import { businessManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme"; // Adjust path
import AdminMetricCards from "../shared/AdminMetricCards";

const { useBreakpoint } = Grid;
const { Text } = Typography;

// --- THEME COLORS ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#111827",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

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

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

// --- CONTENT SECTION WRAPPER ---
const ContentSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 0;
`;

const ChartCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 16px 20px !important;
  }
`;

// --- UTILITY & HELPER FUNCTIONS ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: "6px 0 0 0", color: entry.color }}>
            {`${entry.name}: `}
            <strong>
              {entry.name.toLowerCase().includes("revenue")
                ? formatCurrency(entry.value)
                : new Intl.NumberFormat().format(entry.value)}
            </strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const isMobile = !useBreakpoint().md;

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

  const totalRevenue = metrics.total_revenue ?? metrics.gross_sales ?? 0;
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
      title: "Platform GMV",
      icon: DollarSign,
      value: totalRevenue,
      isCurrency: true,
      footer: "All-time bookings value",
      color: colors.purple,
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

  const provinceBarData = useMemo(() => {
    const rows = [...(metrics.province_distribution || [])];
    return rows.sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [metrics.province_distribution]);

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
            <AdminMetricCardsSkeleton count={5} />
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
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textTertiary }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: colors.textTertiary }} axisLine={false} tickLine={false} width={28} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: colors.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={40} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconSize={7} iconType="square" />
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
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {(metrics.collection_distribution || []).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => [`${v} classes`]} contentStyle={{ borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 12 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </ChartGrid>

        <Divider style={{ margin: "16px 0" }} />

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Geography</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Provinces & cities</div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.4fr) minmax(260px, 0.75fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <ContentSection>
              <div style={{ padding: "12px 16px 8px" }}>
                <Text strong style={{ fontSize: 13 }}>Businesses by province</Text>
                <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                  Ranked by count. Zero counts use a muted tone to highlight gaps.
                </Text>
              </div>
              <div style={{ height: isMobile ? 300 : 360, padding: "0 8px 12px" }}>
                {metricsLoading ? (
                  <AdminHorizontalBarChartSkeleton rows={13} height={isMobile ? 300 : 360} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={provinceBarData}
                      margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal />
                      <XAxis type="number" tick={{ fontSize: 10, fill: colors.textTertiary }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="province"
                        width={36}
                        tick={{ fontSize: 10, fill: colors.textTertiary }}
                      />
                      <RechartsTooltip
                        formatter={(v) => [`${v} businesses`, "Count"]}
                        contentStyle={{ borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 12 }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {provinceBarData.map((p) => (
                          <Cell key={p.province} fill={p.count === 0 ? "#fecaca" : colors.info} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ContentSection>
            <ContentSection>
              <div style={{ padding: "12px 16px" }}>
                <Text strong style={{ fontSize: 13 }}>Explore search demand</Text>
                <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                  Suggested Ontario areas (same presets as explore) and custom location searches.
                </Text>
              </div>
              <div style={{ padding: "0 16px 16px", maxHeight: 420, overflowY: "auto" }}>
                {metricsLoading ? (
                  <AdminRankedListSkeleton rows={16} />
                ) : (
                  <>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
                      Suggested areas
                    </Text>
                    <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13, listStyle: "disc" }}>
                      {(metrics.search_preset_demand || []).map((row) => (
                        <li key={row.label} style={{ marginBottom: 6 }}>
                          <Text strong>{row.label}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>({row.count})</Text>
                        </li>
                      ))}
                    </ul>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
                      Custom searches
                    </Text>
                    {(metrics.search_custom_top || []).length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 13 }}>No custom locations yet.</Text>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                        {(metrics.search_custom_top || []).map((row, i) => (
                          <li key={`${row.label}-${i}`} style={{ marginBottom: 8 }}>
                            <Text strong>{row.label || "—"}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              ({row.count})
                            </Text>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            </ContentSection>
          </div>
          <ContentSection>
            <div style={{ padding: "12px 16px" }}>
              <Text strong style={{ fontSize: 13 }}>Top cities</Text>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              {metricsLoading ? (
                <AdminTableSkeleton rows={6} />
              ) : (
                <Table
                  size="small"
                  showSizeChanger={false}
                  pagination={false}
                  dataSource={metrics.top_cities || []}
                  rowKey={(r) => `${r.city}-${r.state}`}
                  columns={[
                    { title: "City", dataIndex: "city", key: "city" },
                    { title: "Province", dataIndex: "state", key: "state", width: 100 },
                    { title: "Businesses", dataIndex: "count", key: "count", width: 110 },
                    { title: "Classes", dataIndex: "classes_count", key: "classes_count", width: 100 },
                    {
                      title: "Revenue",
                      dataIndex: "revenue",
                      key: "revenue",
                      width: 120,
                      render: (v) => formatCurrency(Number(v || 0)),
                    },
                  ]}
                />
              )}
            </div>
          </ContentSection>
        </div>

      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BusinessManagement;
