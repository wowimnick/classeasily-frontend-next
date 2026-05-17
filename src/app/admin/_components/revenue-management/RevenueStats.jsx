"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Empty,
  Grid,
  Radio,
  Row,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell,
  Label,
} from "recharts";
import {
  DollarSign,
  Download,
  Layers,
  Percent,
  PiggyBank,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { revenueAnalyticsService } from "@/services/adminDash";
import AdminMetricCards from "../shared/AdminMetricCards";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import { theme as appTheme } from "@/components/theme";
import {
  AdminBusinessChartTooltip,
  BUSINESS_CHART_THEME,
  getChartTotal,
} from "../shared/AdminBusinessCharts";
import { adminColors as colors } from "../shared/adminColors";
import { formatCurrency } from "../shared/adminUtils";

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const ALL_SOURCES = ["marketplace", "widget", "corporate", "membership", "saas", "addon"];

const SOURCE_LABELS = {
  marketplace: "Platform bookings",
  widget: "Widget bookings",
  corporate: "Corporate",
  membership: "Memberships",
  saas: "Widget SaaS (accrual)",
  addon: "Addons (accrual)",
};

const SOURCE_COLORS = {
  marketplace: appTheme.token.colorChart1,
  widget: appTheme.token.colorChart2,
  corporate: appTheme.token.colorChart3,
  membership: appTheme.token.colorChart4,
  saas: appTheme.token.colorChart5,
  addon: appTheme.token.colorChart6,
};

function cadFmt(v) {
  return formatCurrency(v);
}

function cadFmtCompact(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 100000) {
    return new Intl.NumberFormat("en-CA", {
      notation: "compact",
      compactDisplay: "short",
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return cadFmt(n);
}

const DashboardWrapper = styled.div`
  padding: 0;
  background: #f8fafc;
  min-height: 100%;
`;

const ContentLayer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 20px 28px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 12px 14px 20px;
  }
`;

const TrendsCard = styled(Card)`
  border-radius: 16px !important;
  border: 1px solid ${colors.border} !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 16px 20px 18px !important;
  }
`;

const LeaderboardCard = styled(Card)`
  border-radius: 12px !important;
  border: 1px solid ${colors.border} !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  .ant-card-head {
    min-height: 46px;
    padding: 0 14px;
    margin-bottom: 0;
    border-bottom-color: ${colors.border};
    font-weight: 600;
    font-size: 14px;
    color: ${colors.textPrimary};
    background: #fafbfc;
  }

  .ant-card-body {
    padding: 0 !important;
  }

  .ant-table-small .ant-table-thead > tr > th {
    background: #f8fafc !important;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${colors.textTertiary};
    font-weight: 700;
    border-bottom: 1px solid ${colors.border};
  }

  .ant-table-small .ant-table-tbody > tr > td {
    border-bottom-color: #f1f5f9;
  }

  .ant-table-small .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-small .ant-table-tbody > tr:hover > td {
    background: #fafbfc !important;
  }
`;

const InsightCard = styled(Card)`
  border-radius: 12px !important;
  border: 1px solid ${colors.border} !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  .ant-card-head {
    font-weight: 600;
    font-size: 14px;
    border-bottom-color: ${colors.border};
    background: #fafbfc;
  }

  .ant-card-body {
    padding: 14px 16px !important;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`;

const TitleBlock = styled.div`
  flex: 1;
  min-width: 200px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 4px;
`;

const PageSubtitle = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  max-width: 720px;
`;

const FilterCard = styled(Card)`
  border-radius: 12px !important;
  border-color: ${colors.border} !important;
`;

const SectionLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: ${colors.textTertiary};
  text-transform: uppercase;
  margin-bottom: 8px;
`;

function SparklineMini({ values }) {
  const nums = Array.isArray(values) ? values : [];
  const max = Math.max(...nums.map((n) => Number(n) || 0), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        height: 28,
      }}
      aria-hidden
    >
      {nums.map((v, i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: `${Math.max(4, ((Number(v) || 0) / max) * 22)}px`,
            background: "#cbd5e1",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

function RevenueChartTooltip({ active, payload, label, chartSources = [] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row || !chartSources.length) return null;

  const stackItems = chartSources.map((key) => ({
    key,
    name: SOURCE_LABELS[key] || key,
    value: typeof row[key] === "number" ? row[key] : Number(row[key]) || 0,
    color: SOURCE_COLORS[key],
  }));

  const periodTotal =
    typeof row._periodTotal === "number" ? row._periodTotal : Number(row._periodTotal) || 0;
  const cumulative =
    typeof row._cumulative === "number" ? row._cumulative : Number(row._cumulative) || 0;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BUSINESS_CHART_THEME.border}`,
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 13,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: 300,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10, color: colors.textPrimary }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stackItems.map((p) => (
          <div
            key={p.key}
            style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
          >
            <span style={{ color: p.color || colors.textSecondary }}>{p.name}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(p.value)}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
        }}
      >
        <span>Bucket total</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(periodTotal)}</span>
      </div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          color: colors.textSecondary,
          fontSize: 11,
        }}
      >
        <span>Cumulative (running total · right axis)</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(cumulative)}</span>
      </div>
    </div>
  );
}

function pivotTimeseries(rows, metricKey, activeSources) {
  const filtered = rows.filter((r) => activeSources.has(r.source));
  const srcs = ALL_SOURCES.filter((s) => activeSources.has(s));
  const buckets = [...new Set(filtered.map((r) => r.bucket))].sort();
  const idx = {};
  filtered.forEach((r) => {
    idx[`${r.bucket}__${r.source}`] = r[metricKey] ?? 0;
  });

  let cumulative = 0;
  return buckets.map((b) => {
    const row = { bucket: b };
    let periodTotal = 0;
    srcs.forEach((s) => {
      const raw = idx[`${b}__${s}`] ?? 0;
      const v = typeof raw === "number" ? raw : Number(raw) || 0;
      row[s] = v;
      periodTotal += v;
    });
    cumulative += periodTotal;
    row._periodTotal = periodTotal;
    row._cumulative = cumulative;
    return row;
  });
}

function pieFromBySource(bySource, metricKey, activeSources) {
  if (!bySource) return [];
  return ALL_SOURCES.filter((s) => activeSources.has(s) && bySource[s]).map((s) => ({
    name: SOURCE_LABELS[s] || s,
    key: s,
    value: bySource[s]?.[metricKey] ?? 0,
  }));
}

function resolveDateRange(preset, customRange) {
  const end = dayjs();
  switch (preset) {
    case "7d":
      return [end.subtract(6, "day"), end];
    case "30d":
      return [end.subtract(29, "day"), end];
    case "90d":
      return [end.subtract(89, "day"), end];
    case "ytd":
      return [end.startOf("year"), end];
    case "1y":
      return [end.subtract(364, "day"), end];
    case "all":
      return [dayjs("2018-01-01"), end];
    case "custom":
      return customRange?.length === 2 ? customRange : [end.subtract(29, "day"), end];
    default:
      return [end.subtract(29, "day"), end];
  }
}

export default function RevenueStats() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [preset, setPreset] = useState("30d");
  const [customRange, setCustomRange] = useState(null);
  const [granularity, setGranularity] = useState("month");
  const [sources, setSources] = useState(() => new Set(ALL_SOURCES));
  const [metric, setMetric] = useState("commission");

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [seriesPack, setSeriesPack] = useState(null);
  const [topPack, setTopPack] = useState(null);
  const [error, setError] = useState(null);
  const [readyAnim, setReadyAnim] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [rangeStart, rangeEnd] = useMemo(
    () => resolveDateRange(preset, customRange),
    [preset, customRange],
  );

  const queryParams = useMemo(() => {
    const start_date = rangeStart.format("YYYY-MM-DD");
    const end_date = rangeEnd.format("YYYY-MM-DD");
    const sourcesParam = ALL_SOURCES.filter((s) => sources.has(s)).join(",");
    return { start_date, end_date, granularity, sources: sourcesParam };
  }, [rangeStart, rangeEnd, granularity, sources]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setReadyAnim(false);
      try {
        const [ov, ts, tp] = await Promise.all([
          revenueAnalyticsService.getOverview(queryParams),
          revenueAnalyticsService.getTimeseries(queryParams),
          revenueAnalyticsService.getTop({
            start_date: queryParams.start_date,
            end_date: queryParams.end_date,
            limit: 10,
          }),
        ]);
        if (cancelled) return;
        if (!ov.success) throw new Error(ov.error || "Overview failed");
        if (!ts.success) throw new Error(ts.error || "Timeseries failed");
        if (!tp.success) throw new Error(tp.error || "Top lists failed");
        setOverview(ov.data);
        setSeriesPack(ts.data);
        setTopPack(tp.data);
        setTimeout(() => {
          if (!cancelled) setReadyAnim(true);
        }, 50);
      } catch (e) {
        if (!cancelled) {
          const msgText = e.message || "Failed to load revenue data";
          setError(msgText);
          message.error(msgText);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [queryParams, refreshTick]);

  const handleRefresh = () => setRefreshTick((t) => t + 1);

  const chartRows = seriesPack?.rows || [];
  const chartData = useMemo(
    () => pivotTimeseries(chartRows, metric, sources),
    [chartRows, metric, sources],
  );

  const pieData = useMemo(
    () => pieFromBySource(overview?.by_source, metric, sources),
    [overview, metric, sources],
  );

  const cadKpis = overview?.kpis_cad || {};
  const deltasCad = overview?.deltas_vs_previous_period_cad || {};
  const advanced = overview?.advanced || {};

  const metricCardsCad = [
    {
      key: "commission",
      label: "Platform Commission",
      tooltip:
        "Booking & widget platform fees, memberships, corporate platform fees, plus widget SaaS and marketplace-email addon revenue accrued from Stripe Prices.",
      value: cadKpis.commission ?? 0,
      growth: deltasCad.commission_pct,
      icon: DollarSign,
      color: colors.primary,
      isCurrency: true,
    },
    {
      key: "commission_tax",
      label: "Commission + tax on fee",
      tooltip:
        "Adds GST/HST on the platform fee where we track it (card bookings and corporate legs). Membership rows typically omit fee-tax split.",
      value: cadKpis.commission_plus_tax ?? 0,
      growth: deltasCad.commission_plus_tax_pct,
      icon: Receipt,
      color: "#6366f1",
      isCurrency: true,
    },
    {
      key: "net_stripe",
      label: "Net after Stripe (est.)",
      tooltip:
        "Commission minus an estimated Stripe processing fee (2.9% + $0.30 pattern). Membership uses the same formula on charge totals.",
      value: cadKpis.net_after_stripe ?? 0,
      growth: deltasCad.net_after_stripe_pct,
      icon: PiggyBank,
      color: "#10b981",
      isCurrency: true,
    },
    {
      key: "gmv",
      label: "Gross GMV (booking streams)",
      tooltip:
        "Payment totals for marketplace/widget flows plus corporate gross on deposit/balance legs; SaaS/add-on subscription GMV is counted separately in commission.",
      value: cadKpis.gross_gmv ?? 0,
      icon: Layers,
      color: "#0ea5e9",
      isCurrency: true,
    },
    {
      key: "avg_day",
      label: "Avg commission / day",
      value: overview?.averages_cad?.per_day ?? 0,
      icon: TrendingUp,
      color: "#f59e0b",
      isCurrency: true,
    },
    {
      key: "avg_tx",
      label: "Avg commission / txn",
      value: overview?.averages_cad?.per_transaction ?? 0,
      icon: Percent,
      color: "#64748b",
      isCurrency: true,
    },
    {
      key: "refunds",
      label: "Refunds volume (range)",
      tooltip: "Sum of refunded_amount on payments whose refund_date falls in range.",
      value: overview?.refunds_volume ?? 0,
      icon: TrendingDown,
      color: "#ef4444",
      isCurrency: true,
    },
  ].map((c) => ({
    key: c.key,
    title: c.label,
    label: c.label,
    tooltip: c.tooltip,
    value: typeof c.value === "number" ? c.value : 0,
    growth: typeof c.growth === "number" ? c.growth : undefined,
    icon: c.icon,
    color: c.color,
    isCurrency: c.isCurrency,
    currencyPrefix: c.isCurrency ? "CA$" : undefined,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }));

  const onExport = async () => {
    const res = await revenueAnalyticsService.exportCsv({
      start_date: queryParams.start_date,
      end_date: queryParams.end_date,
      granularity,
      sources: queryParams.sources,
    });
    if (!res.success) message.error(res.error || "Export failed");
    else message.success("CSV downloaded");
  };

  const chartSources = ALL_SOURCES.filter((s) => sources.has(s));

  return (
    <DashboardWrapper>
      <ContentLayer>
        <HeaderRow>
          <TitleBlock>
            <PageTitle>Revenue stats</PageTitle>
            <PageSubtitle>
              Platform revenue (not GMV) across marketplace, widget, corporate, memberships, widget SaaS,
              and addons. SaaS and addon accruals use each subscription&apos;s Stripe Price (monthly
              equivalent).
            </PageSubtitle>
          </TitleBlock>
          <Space wrap>
            <Button icon={<RefreshCw size={16} />} onClick={handleRefresh} loading={loading}>
              Refresh
            </Button>
            <Button icon={<Download size={16} />} onClick={onExport}>
              Export CSV
            </Button>
          </Space>
        </HeaderRow>

        <FilterCard size="small" title="Filters">
          <Row gutter={[12, 12]}>
            <Col xs={24} lg={10}>
              <SectionLabel>Period</SectionLabel>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
              >
                <Radio.Button value="7d">7d</Radio.Button>
                <Radio.Button value="30d">30d</Radio.Button>
                <Radio.Button value="90d">90d</Radio.Button>
                <Radio.Button value="ytd">YTD</Radio.Button>
                <Radio.Button value="1y">1y</Radio.Button>
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="custom">Custom</Radio.Button>
              </Radio.Group>
              <div style={{ marginTop: 10 }}>
                {preset === "custom" ? (
                  isMobile ? (
                    <MobileDateRangePicker
                      allowClear={false}
                      value={
                        customRange?.length === 2
                          ? customRange
                          : [rangeStart, rangeEnd]
                      }
                      onChange={(dates) => setCustomRange(dates)}
                      format="MMM D, YYYY"
                    />
                  ) : (
                    <RangePicker
                      value={
                        customRange?.length === 2
                          ? customRange
                          : [rangeStart, rangeEnd]
                      }
                      onChange={(dates) => setCustomRange(dates)}
                      style={{ width: "100%", maxWidth: 360 }}
                    />
                  )
                ) : (
                  <Text type="secondary">
                    {rangeStart.format("MMM D, YYYY")} — {rangeEnd.format("MMM D, YYYY")}
                  </Text>
                )}
              </div>
            </Col>
            <Col xs={24} lg={7}>
              <SectionLabel>Granularity</SectionLabel>
              <Segmented
                options={[
                  {
                    label: "Daily",
                    value: "day",
                    title: "Each column is one calendar day.",
                  },
                  {
                    label: "Weekly",
                    value: "week",
                    title: "Buckets follow ISO weeks (year-Www).",
                  },
                  {
                    label: "Monthly",
                    value: "month",
                    title: "Buckets are calendar months (YYYY-MM).",
                  },
                ]}
                value={granularity}
                onChange={setGranularity}
              />
            </Col>
            <Col xs={24} lg={7}>
              <SectionLabel>Chart metric</SectionLabel>
              <Segmented
                options={[
                  {
                    label: "Commission",
                    value: "commission",
                    title:
                      "Platform fee amounts before GST/HST on the fee where that tax is tracked separately.",
                  },
                  {
                    label: "+ Tax",
                    value: "commission_plus_tax",
                    title: "Adds GST/HST on platform fees for bookings and corporate legs.",
                  },
                  {
                    label: "Net − Stripe",
                    value: "net_after_stripe",
                    title:
                      "After an estimated Stripe processing fee (2.9% + $0.30 — memberships use the same pattern).",
                  },
                ]}
                value={metric}
                onChange={setMetric}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 14 }}>
            <SectionLabel>Sources</SectionLabel>
            <Checkbox.Group
              value={Array.from(sources)}
              style={{ width: "100%" }}
              onChange={(vals) =>
                setSources(new Set(vals.length ? vals : ALL_SOURCES))
              }
            >
              <Space
                wrap
                split={<Divider type="vertical" style={{ margin: 0, height: 14 }} />}
                size={[10, 10]}
              >
                {ALL_SOURCES.map((s) => (
                  <Checkbox key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
        </FilterCard>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        <Spin spinning={loading}>
          <SectionLabel>Platform KPIs (CAD)</SectionLabel>
          <AdminMetricCards cards={metricCardsCad} loading={loading} isReadyForAnimation={readyAnim} />

          <SectionDivider />

          <SectionLabel>Trends</SectionLabel>
          <Text type="secondary" style={{ fontSize: 12, marginTop: -4, marginBottom: 12, display: "block", maxWidth: 900 }}>
            Includes marketplace bookings (&quot;Platform bookings&quot;), widget, corporate, memberships, SaaS, and
            addons—toggle each under Sources. Bars use the{" "}
            <span style={{ fontWeight: 600, color: colors.textSecondary }}>left axis</span> (per bucket); the cumulative
            line uses the{" "}
            <span style={{ fontWeight: 600, color: colors.textSecondary }}>right axis</span> so it doesn&apos;t shrink the
            bars.
          </Text>
          <TrendsCard>
            {chartData.length === 0 ? (
              <Empty description="No data for this range" />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData} margin={{ top: 12, right: 44, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BUSINESS_CHART_THEME.border} vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 12, fill: colors.textSecondary }}
                    tickMargin={8}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="period"
                    tick={{ fontSize: 12, fill: colors.textSecondary }}
                    tickFormatter={(v) => cadFmtCompact(v)}
                    width={isMobile ? 56 : 72}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="cumulative"
                    orientation="right"
                    tick={{ fontSize: 12, fill: colors.textSecondary }}
                    tickFormatter={(v) => cadFmtCompact(v)}
                    width={isMobile ? 44 : 56}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={(props) => <RevenueChartTooltip {...props} chartSources={chartSources} />} />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} iconType="circle" />
                  {chartSources.map((s) => (
                    <Bar
                      key={s}
                      yAxisId="period"
                      dataKey={s}
                      name={SOURCE_LABELS[s]}
                      stackId="rev"
                      fill={SOURCE_COLORS[s]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={56}
                    />
                  ))}
                  <Line
                    yAxisId="cumulative"
                    type="monotone"
                    dataKey="_cumulative"
                    name="Cumulative (CAD)"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </TrendsCard>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={10}>
              <InsightCard title="Mix by source">
                {pieData.length === 0 ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={5}
                        stroke="none"
                        cornerRadius={5}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.key} fill={SOURCE_COLORS[entry.key] || "#cbd5e1"} />
                        ))}
                        <Label
                          value={cadFmt(getChartTotal(pieData))}
                          position="center"
                          fill={colors.textPrimary}
                          style={{ fontSize: "17px", fontWeight: "bold" }}
                        />
                      </Pie>
                      <RechartsTooltip
                        content={<AdminBusinessChartTooltip formatItemValue={(entry) => cadFmt(entry.value)} />}
                      />
                      <Legend layout="horizontal" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </InsightCard>
            </Col>
            <Col xs={24} lg={14}>
              <InsightCard title="Signals & cohorts">
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div>
                    <Text strong>Booking take rate </Text>
                    <Tag color="blue">
                      {advanced.booking_take_rate_percent != null
                        ? `${advanced.booking_take_rate_percent.toFixed(2)}%`
                        : "—"}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Rolling avg commission / day </Text>
                    <Tag>
                      7d:{" "}
                      {advanced.rolling_avg_commission_per_day_7d != null
                        ? cadFmt(advanced.rolling_avg_commission_per_day_7d)
                        : "—"}
                    </Tag>
                    <Tag style={{ marginLeft: 8 }}>
                      30d:{" "}
                      {advanced.rolling_avg_commission_per_day_30d != null
                        ? cadFmt(advanced.rolling_avg_commission_per_day_30d)
                        : "—"}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Best / worst day (booking streams) </Text>
                    <Tag color="green">
                      {advanced.best_day
                        ? `${advanced.best_day.day} · ${cadFmt(advanced.best_day.commission)}`
                        : "—"}
                    </Tag>
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      {advanced.worst_day
                        ? `${advanced.worst_day.day} · ${cadFmt(advanced.worst_day.commission)}`
                        : "—"}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>New vs established businesses (booking commission) </Text>
                    <Paragraph style={{ marginBottom: 0 }} type="secondary">
                      New (biz created in range): {cadFmt(advanced.new_business_booking_commission ?? 0)}{" "}
                      · Established: {cadFmt(advanced.established_business_booking_commission ?? 0)} · Share
                      new:{" "}
                      {advanced.new_business_booking_commission_pct_of_bookings != null
                        ? `${advanced.new_business_booking_commission_pct_of_bookings.toFixed(1)}%`
                        : "—"}
                    </Paragraph>
                  </div>
                </Space>
              </InsightCard>
            </Col>
          </Row>

          <SectionDivider />

          <SectionLabel>Leaderboards</SectionLabel>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <LeaderboardCard title="Top businesses (booking commission)">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="business_id"
                  showHeader
                  dataSource={topPack?.top_businesses_by_booking_revenue || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Business", dataIndex: "name", ellipsis: true },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      align: "right",
                      render: (v) => (
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(v)}</span>
                      ),
                    },
                    { title: "Txns", dataIndex: "transactions", width: 72, align: "right" },
                    {
                      title: "7d",
                      dataIndex: "sparkline_commission",
                      render: (vals) => <SparklineMini values={vals} />,
                      width: 120,
                    },
                  ]}
                />
              </LeaderboardCard>
            </Col>
            <Col xs={24} xl={12}>
              <LeaderboardCard title="Top classes">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="class_id"
                  showHeader
                  dataSource={topPack?.top_classes || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Class", dataIndex: "title", ellipsis: true },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      align: "right",
                      render: (v) => (
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(v)}</span>
                      ),
                    },
                    { title: "Txns", dataIndex: "transactions", width: 72, align: "right" },
                  ]}
                />
              </LeaderboardCard>
            </Col>
            <Col xs={24} xl={12}>
              <LeaderboardCard title="Corporate clients">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="name"
                  showHeader
                  dataSource={topPack?.corporate_clients || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Company", dataIndex: "name", ellipsis: true },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      align: "right",
                      render: (v) => (
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(v)}</span>
                      ),
                    },
                  ]}
                />
              </LeaderboardCard>
            </Col>
            <Col xs={24} xl={12}>
              <LeaderboardCard title="Top membership businesses">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="business_id"
                  showHeader
                  dataSource={topPack?.top_membership_businesses || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Business", dataIndex: "name", ellipsis: true },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      align: "right",
                      render: (v) => (
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{cadFmt(v)}</span>
                      ),
                    },
                  ]}
                />
              </LeaderboardCard>
            </Col>
          </Row>
        </Spin>
      </ContentLayer>
    </DashboardWrapper>
  );
}

function SectionDivider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${colors.border}`,
        margin: "20px 0",
      }}
    />
  );
}
