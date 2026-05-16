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
  Tooltip,
  XAxis,
  YAxis,
  Cell,
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
  Landmark,
} from "lucide-react";
import { revenueAnalyticsService } from "@/services/adminDash";
import AdminMetricCards from "../shared/AdminMetricCards";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import { theme as appTheme } from "@/components/theme";

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const ALL_SOURCES = ["marketplace", "widget", "corporate", "membership", "saas", "addon"];

const SOURCE_LABELS = {
  marketplace: "Platform bookings",
  widget: "Widget bookings",
  corporate: "Corporate (USD)",
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

const colors = {
  primary: "#ff385c",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const DashboardWrapper = styled.div`
  padding: 24px;
  background: #fff;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ContentLayer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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

function pivotTimeseries(rows, metricKey, activeSources) {
  const filtered = rows.filter((r) => activeSources.has(r.source));
  const buckets = [...new Set(filtered.map((r) => r.bucket))].sort();
  const srcs = [...new Set(filtered.map((r) => r.source))];
  const idx = {};
  filtered.forEach((r) => {
    idx[`${r.bucket}__${r.source}`] = r[metricKey] ?? 0;
  });

  let cumulative = 0;
  return buckets.map((b) => {
    const row = { bucket: b };
    let periodTotal = 0;
    srcs.forEach((s) => {
      const v = idx[`${b}__${s}`] ?? 0;
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
  const corpKpis = overview?.kpis_corporate_usd || {};
  const deltasCad = overview?.deltas_vs_previous_period_cad || {};
  const deltasCorp = overview?.deltas_vs_previous_period_corporate_usd || {};
  const advanced = overview?.advanced || {};

  const metricCardsCad = [
    {
      key: "commission",
      label: "Commission (CAD)",
      tooltip:
        "Sum of booking & membership platform_fee_amount plus accrued SaaS/addon estimates — excludes USD corporate.",
      value: cadKpis.commission ?? 0,
      growth: deltasCad.commission_pct,
      icon: DollarSign,
      color: colors.primary,
      isCurrency: true,
    },
    {
      key: "commission_tax",
      label: "Commission + tax on fee (CAD)",
      tooltip: "platform_fee_amount + platform_fee_tax on card payments; memberships omit fee-tax split.",
      value: cadKpis.commission_plus_tax ?? 0,
      growth: deltasCad.commission_plus_tax_pct,
      icon: Receipt,
      color: "#6366f1",
      isCurrency: true,
    },
    {
      key: "net_stripe",
      label: "Net after Stripe (est.) CAD",
      tooltip:
        "Commission minus estimated Stripe processing (2.9% + $0.30 on charges). Membership uses formula on invoice totals.",
      value: cadKpis.net_after_stripe ?? 0,
      growth: deltasCad.net_after_stripe_pct,
      icon: PiggyBank,
      color: "#10b981",
      isCurrency: true,
    },
    {
      key: "gmv",
      label: "Gross GMV (CAD streams)",
      value: cadKpis.gross_gmv ?? 0,
      icon: Layers,
      color: "#0ea5e9",
      isCurrency: true,
    },
    {
      key: "avg_day",
      label: "Avg commission / day (CAD)",
      value: overview?.averages_cad?.per_day ?? 0,
      icon: TrendingUp,
      color: "#f59e0b",
      isCurrency: true,
    },
    {
      key: "avg_tx",
      label: "Avg commission / txn (CAD)",
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    footer:
      c.key === "commission" ? (
        <Text type="secondary" style={{ fontSize: 11 }}>
          Stripe fees are estimates — see backend meta.
        </Text>
      ) : null,
  }));

  const metricCardsUsd = [
    {
      key: "corp_commission",
      title: "Corporate commission (USD)",
      tooltip:
        "Deposit + balance legs × CORPORATE_PLATFORM_FEE_PERCENT with HST on fee — separate currency.",
      value: corpKpis.commission ?? 0,
      growth: deltasCorp.commission_pct,
      icon: Landmark,
      color: "#f97316",
      renderValue: (v, anim) =>
        anim ? (
          <span style={{ fontWeight: 700 }}>
            US$
            {(Number(v) || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ) : (
          "US$0"
        ),
    },
    {
      key: "corp_net",
      title: "Corporate net after Stripe (est. USD)",
      value: corpKpis.net_after_stripe ?? 0,
      growth: deltasCorp.net_after_stripe_pct,
      icon: PiggyBank,
      color: "#ea580c",
      renderValue: (v, anim) =>
        anim ? (
          <span style={{ fontWeight: 700 }}>
            US$
            {(Number(v) || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ) : (
          "US$0"
        ),
    },
  ].map((c) => ({
    ...c,
    growth: typeof c.growth === "number" ? c.growth : undefined,
    label: c.title,
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
              Platform revenue (not gross GMV) across marketplace, widget, corporate (USD),
              memberships, widget SaaS accrual, and addons. Tune SaaS/add-on amounts via backend env vars.
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

        {overview?.meta?.currency_note ? (
          <Alert type="info" showIcon message={overview.meta.currency_note} />
        ) : null}

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
                  { label: "Daily", value: "day" },
                  { label: "Weekly", value: "week" },
                  { label: "Monthly", value: "month" },
                ]}
                value={granularity}
                onChange={setGranularity}
              />
            </Col>
            <Col xs={24} lg={7}>
              <SectionLabel>Chart metric</SectionLabel>
              <Segmented
                options={[
                  { label: "Commission", value: "commission" },
                  { label: "+ Tax", value: "commission_plus_tax" },
                  { label: "Net − Stripe", value: "net_after_stripe" },
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
              <Space wrap>
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
          <SectionLabel>CAD headline KPIs</SectionLabel>
          <AdminMetricCards cards={metricCardsCad} loading={loading} isReadyForAnimation={readyAnim} />

          <div style={{ marginTop: 16 }}>
            <SectionLabel>Corporate (USD)</SectionLabel>
            <AdminMetricCards cards={metricCardsUsd} loading={loading} isReadyForAnimation={readyAnim} />
          </div>

          <Divider />

          <SectionLabel>Trends</SectionLabel>
          <Card styles={{ body: { padding: isMobile ? 8 : 16 } }} style={{ borderRadius: 12 }}>
            {chartData.length === 0 ? (
              <Empty description="No data for this range" />
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  <Legend />
                  {chartSources.map((s) => (
                    <Bar
                      key={s}
                      dataKey={s}
                      name={SOURCE_LABELS[s]}
                      stackId="rev"
                      fill={SOURCE_COLORS[s]}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="_cumulative"
                    name="Cumulative"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={10}>
              <Card title="Mix by source" style={{ borderRadius: 12 }}>
                {pieData.length === 0 ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie dataKey="value" data={pieData} outerRadius={100}>
                        {pieData.map((entry) => (
                          <Cell key={entry.key} fill={SOURCE_COLORS[entry.key] || "#ccc"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card title="Signals & cohorts" style={{ borderRadius: 12 }}>
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
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
                        ? `$${advanced.rolling_avg_commission_per_day_7d.toFixed(2)}`
                        : "—"}
                    </Tag>
                    <Tag style={{ marginLeft: 8 }}>
                      30d:{" "}
                      {advanced.rolling_avg_commission_per_day_30d != null
                        ? `$${advanced.rolling_avg_commission_per_day_30d.toFixed(2)}`
                        : "—"}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Best / worst day (booking streams) </Text>
                    <Tag color="green">
                      {advanced.best_day
                        ? `${advanced.best_day.day} · $${advanced.best_day.commission?.toFixed?.(2)}`
                        : "—"}
                    </Tag>
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      {advanced.worst_day
                        ? `${advanced.worst_day.day} · $${advanced.worst_day.commission?.toFixed?.(2)}`
                        : "—"}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>New vs established businesses (booking commission) </Text>
                    <Paragraph style={{ marginBottom: 0 }} type="secondary">
                      New (biz created in range): $
                      {(advanced.new_business_booking_commission ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      · Established: $
                      {(advanced.established_business_booking_commission ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      · Share new:{" "}
                      {advanced.new_business_booking_commission_pct_of_bookings != null
                        ? `${advanced.new_business_booking_commission_pct_of_bookings.toFixed(1)}%`
                        : "—"}
                    </Paragraph>
                  </div>
                  {overview?.meta?.saas_monthly_amounts_configured === false ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="Widget SaaS monthly amounts not configured"
                      description="Set REVENUE_REPORTING_WIDGET_*_MONTHLY_CAD in backend env for accruals."
                    />
                  ) : null}
                </Space>
              </Card>
            </Col>
          </Row>

          <Divider />

          <SectionLabel>Leaderboards</SectionLabel>
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card title="Top businesses (booking commission)" style={{ borderRadius: 12 }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="business_id"
                  dataSource={topPack?.top_businesses_by_booking_revenue || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Business", dataIndex: "name" },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      render: (v) => `$${Number(v).toFixed(2)}`,
                    },
                    { title: "Txns", dataIndex: "transactions", width: 72 },
                    {
                      title: "7d",
                      dataIndex: "sparkline_commission",
                      render: (vals) => <SparklineMini values={vals} />,
                      width: 120,
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title="Top classes" style={{ borderRadius: 12 }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="class_id"
                  dataSource={topPack?.top_classes || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Class", dataIndex: "title", ellipsis: true },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      render: (v) => `$${Number(v).toFixed(2)}`,
                    },
                    { title: "Txns", dataIndex: "transactions", width: 72 },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title="Corporate clients (USD commission)" style={{ borderRadius: 12 }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="name"
                  dataSource={topPack?.corporate_clients_usd || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Company", dataIndex: "name", ellipsis: true },
                    {
                      title: "Commission USD",
                      dataIndex: "total_usd",
                      render: (v) =>
                        `US$${Number(v).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title="Top membership businesses" style={{ borderRadius: 12 }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="business_id"
                  dataSource={topPack?.top_membership_businesses || []}
                  columns={[
                    { title: "#", render: (_, __, i) => i + 1, width: 44 },
                    { title: "Business", dataIndex: "name" },
                    {
                      title: "Commission",
                      dataIndex: "total",
                      render: (v) => `$${Number(v).toFixed(2)}`,
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </ContentLayer>
    </DashboardWrapper>
  );
}

function Divider() {
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
