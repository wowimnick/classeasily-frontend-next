"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  Users,
  Building2,
  BookOpen,
  DollarSign,
  ShieldCheck,
  MessageSquare,
  Wallet,
  ArrowRight,
  UserPlus,
  Activity,
  BarChart2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, Typography, Radio } from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  defs,
  linearGradient,
  stop,
} from "recharts";
import NumberFlow from "@number-flow/react";
import AdminMetricCards from "../shared/AdminMetricCards";
import { AdminOverviewSkeleton } from "../shared/AdminSkeletons";
import {
  userAdminService,
  businessManagementService,
  adminBookingService,
  paymentService,
  auditService,
  verificationService,
  supportTicketService,
  adminPayoutService,
} from "@/services/adminDash";
import { useAuth } from "@/lib/auth-client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

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

const USER_ROLE_PIE_COLORS = [
  colors.info,
  colors.primary,
  colors.purple,
  colors.success,
  colors.warning,
  colors.error,
];

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value) {
  if (value == null || isNaN(value)) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

const DashboardWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  padding: 20px 24px;
  @media (max-width: 768px) {
    padding: 14px 16px;
    border-radius: 12px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${colors.border};
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 2px;
`;

const PageSubtitle = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
`;

const SectionLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: ${colors.textTertiary};
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${colors.border};
  margin: 20px 0;
`;

const IconContainer = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$bg || hexToRgba(colors.info, 0.1)};
  color: ${(p) => p.$color || colors.info};
  flex-shrink: 0;
  svg {
    width: 15px;
    height: 15px;
  }
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: ${colors.textTertiary};
  font-weight: 500;
  margin-bottom: 3px;
`;

const MetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  line-height: 1.15;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const FooterNote = styled.div`
  font-size: 11px;
  color: ${colors.textTertiary};
`;

/* ── Quick action cards ── */
const QuickActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const QuickActionCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  .ant-card-body {
    padding: 14px 16px;
  }
`;

/* ── Charts ── */
const ChartAndFeedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 12px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const ChartCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 16px 20px;
  }
`;

const ChartContainer = styled.div`
  height: 240px;
  width: 100%;
  margin-top: 14px;
`;

const CustomTooltipBox = styled.div`
  background: #ffffff;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 10px 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  font-size: 12px;
`;

/* ── Activity feed ── */
const ActivityFeedCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 16px 20px;
  }
`;

const FeedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 260px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${colors.border};
    border-radius: 4px;
  }
`;

const FeedItem = styled.div`
  display: flex;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid ${colors.border};
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  &:first-child {
    padding-top: 0;
  }
`;

const FeedDot = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${(p) => p.$bg || hexToRgba(colors.info, 0.1)};
  color: ${(p) => p.$color || colors.info};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  svg {
    width: 13px;
    height: 13px;
  }
`;

const FeedContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const FeedAction = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textPrimary};
  line-height: 1.3;
`;

const FeedMeta = styled.div`
  font-size: 11px;
  color: ${colors.textTertiary};
  margin-top: 1px;
`;

function getAuditIcon(action) {
  if (!action) return { icon: Activity, color: colors.info };
  const a = action.toLowerCase();
  if (a.includes("user") || a.includes("register") || a.includes("signup"))
    return { icon: UserPlus, color: colors.info };
  if (a.includes("business") || a.includes("verif"))
    return { icon: Building2, color: colors.primary };
  if (a.includes("booking") || a.includes("class"))
    return { icon: BookOpen, color: colors.success };
  if (a.includes("payment") || a.includes("revenue") || a.includes("payout"))
    return { icon: DollarSign, color: colors.success };
  if (a.includes("ticket") || a.includes("support"))
    return { icon: MessageSquare, color: colors.warning };
  return { icon: Activity, color: colors.info };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <CustomTooltipBox>
      <div style={{ fontWeight: 600, color: colors.textPrimary, marginBottom: 6, fontSize: 12 }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color, marginBottom: 2, fontSize: 12 }}>
          {entry.name}:{" "}
          <strong>
            {entry.dataKey === "revenue" ? formatCompact(entry.value) : entry.value}
          </strong>
        </div>
      ))}
    </CustomTooltipBox>
  );
}

const PERIOD_OPTIONS = [
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "1y", value: "1y" },
];

export default function PlatformOverview() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("30d");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalBookings: 0,
    platformRevenue: 0,
    newUsers30d: 0,
    newBusinesses30d: 0,
    openTickets: 0,
    pendingVerifications: 0,
    pendingPayoutsCount: 0,
    activeUsers30d: 0,
    activeBusinesses30d: 0,
    bookingsThisMonth: 0,
    avgRevenuePerBusiness: 0,
    // MoM growth
    userGrowth: null,
    businessGrowth: null,
    bookingGrowth: null,
    revenueGrowth: null,
    roleDistribution: [],
  });
  const [chartData, setChartData] = useState([]);
  const [auditItems, setAuditItems] = useState([]);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setIsReadyForAnimation(false);
      try {
        const [
          userMetricsRes,
          businessMetricsRes,
          bookingAnalyticsRes,
          paymentStatsRes,
          auditRes,
          verificationStatsRes,
          supportStatsRes,
          payoutsRes,
        ] = await Promise.all([
          userAdminService.getUserMetrics({}),
          businessManagementService.getPlatformMetrics(),
          adminBookingService.getBookingAnalytics({ all_time: true }),
          paymentService.getPaymentStats({ all_time: true }),
          auditService.getAuditLogs({ page_size: 12, page: 1 }),
          verificationService.getVerificationStats(),
          supportTicketService.getTicketStats(),
          adminPayoutService.getPayouts({ status: "pending", page_size: 1 }),
        ]);

        if (cancelled) return;

        const userData = userMetricsRes.success ? userMetricsRes.data : {};
        const bizData = businessMetricsRes.success ? businessMetricsRes.data : {};
        const bookingData = bookingAnalyticsRes.success ? bookingAnalyticsRes.data : {};
        const paymentData = paymentStatsRes.success ? paymentStatsRes.data : {};
        const auditData = auditRes.success ? auditRes.data : {};
        const verificationData = verificationStatsRes.success ? verificationStatsRes.data : {};
        const supportData = supportStatsRes.success ? supportStatsRes.data : {};
        const payoutsData = payoutsRes.success ? payoutsRes.data : {};

        const results = auditData.results || [];
        setAuditItems(Array.isArray(results) ? results.slice(0, 12) : []);

        const totalRev =
          paymentData.total_revenue ??
          paymentData.revenue ??
          bizData.total_revenue ??
          bizData.gross_sales ??
          0;
        const totalBiz =
          bizData.total_businesses ?? bizData.total ?? 0;
        const avgRevPerBiz =
          totalBiz > 0 ? Math.round(totalRev / totalBiz) : 0;

        setStats({
          totalUsers: userData.total_users ?? userData.total ?? 0,
          totalBusinesses: totalBiz,
          totalBookings: bookingData.total_bookings ?? bookingData.total ?? 0,
          platformRevenue: totalRev,
          newUsers30d: userData.new_users_30d ?? userData.new_registrations ?? userData.new_users_in_period ?? 0,
          newBusinesses30d: bizData.new_businesses_30d ?? bizData.new_in_period ?? 0,
          openTickets: supportData.open ?? supportData.open_count ?? 0,
          pendingVerifications:
            verificationData.pending ?? verificationData.pending_count ?? 0,
          pendingPayoutsCount:
            typeof payoutsData.count === "number"
              ? payoutsData.count
              : Array.isArray(payoutsData.results)
                ? payoutsData.results.length
                : 0,
          activeUsers30d: userData.active_users_30d ?? userData.active_30d ?? userData.active_users_in_period ?? 0,
          activeBusinesses30d:
            bizData.active_businesses ??
            bizData.active_businesses_30d ??
            bizData.active_30d ??
            bizData.active_businesses_in_period ??
            0,
          bookingsThisMonth: bookingData.bookings_this_month ?? bookingData.monthly ?? 0,
          avgRevenuePerBusiness: avgRevPerBiz,
          userGrowth: userData.growth_percent ?? userData.mom_growth ?? null,
          businessGrowth: bizData.growth_percent ?? bizData.mom_growth ?? null,
          bookingGrowth: bookingData.all_time ? null : bookingData.booking_growth ?? null,
          revenueGrowth: paymentData.all_time ? null : paymentData.revenue_growth ?? null,
          roleDistribution: Array.isArray(userData.role_distribution)
            ? userData.role_distribution
            : [],
        });
      } catch (e) {
        if (!cancelled) console.error("Platform overview fetch error:", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(() => setIsReadyForAnimation(true), 50);
        }
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeframeMap = { "30d": "month", "90d": "quarter", "1y": "year" };
    const timeframe = timeframeMap[chartPeriod] || "month";

    businessManagementService.getGrowthTrends(timeframe).then((res) => {
      if (cancelled || !res.success || !Array.isArray(res.data)) return;
      const combined = (res.data || []).map((d) => ({
        name: d.month ?? (d.period_start ? dayjs(d.period_start).format("MMM YY") : ""),
        businesses: d.businesses ?? 0,
        revenue: d.revenue ?? 0,
      }));
      setChartData(combined);
    });
    return () => { cancelled = true; };
  }, [chartPeriod]);

  const quickActions = [
    {
      label: "Pending Verifications",
      value: stats.pendingVerifications,
      path: "/admin/business-verification",
      icon: ShieldCheck,
      color: stats.pendingVerifications > 0 ? colors.error : colors.warning,
      note: stats.pendingVerifications > 0 ? "Requires attention" : "Up to date",
    },
    {
      label: "Open Support Tickets",
      value: stats.openTickets,
      path: "/admin/support",
      icon: MessageSquare,
      color: colors.info,
      note: "Awaiting response",
    },
    {
      label: "Pending Payouts",
      value: stats.pendingPayoutsCount,
      path: "/admin/payouts",
      icon: Wallet,
      color: colors.success,
      note: "Ready to process",
    },
  ];

  const userRolePopoverContent = useMemo(() => {
    const dist = stats.roleDistribution || [];
    if (!dist.length) {
      return (
        <div style={{ padding: 12, background: "#fff" }}>
          <Text type="secondary">No role breakdown</Text>
        </div>
      );
    }
    const pieData = dist.map((r, i) => {
      const raw = r.role__color;
      const fill =
        raw && String(raw).startsWith("#")
          ? raw
          : USER_ROLE_PIE_COLORS[i % USER_ROLE_PIE_COLORS.length];
      return {
        name: r.role__name || "Unknown",
        value: Number(r.count) || 0,
        fill,
      };
    });
    return (
      <div style={{ width: 280, height: 240, background: "#fff" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={72}
              paddingAngle={1}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }, [stats.roleDistribution]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Platform GMV",
        value: formatCompact(stats.platformRevenue),
        isText: true,
        icon: DollarSign,
        color: colors.success,
        growth: stats.revenueGrowth,
        periodBadge: "All-time",
        footer: "Succeeded payment volume",
      },
      {
        label: "Total Users",
        value: stats.totalUsers,
        icon: Users,
        color: colors.info,
        growth: stats.userGrowth,
        periodBadge: "All-time",
        popoverContent: userRolePopoverContent,
        footer: `${stats.activeUsers30d.toLocaleString()} logged in (last 30d)`,
      },
      {
        label: "Total Businesses",
        value: stats.totalBusinesses,
        icon: Building2,
        color: colors.primary,
        growth: stats.businessGrowth,
        periodBadge: "All-time",
        tooltip:
          "“Active” subtext counts businesses that logged in within the last 30 days as owner or accepted staff and have ever received at least one booking.",
        footer: `${stats.activeBusinesses30d.toLocaleString()} logged in last 30d AND ever booked`,
      },
      {
        label: "Bookings",
        value: stats.totalBookings,
        icon: BookOpen,
        color: colors.purple,
        growth: stats.bookingGrowth,
        periodBadge: "All-time",
        footer: "All statuses, by booking date",
      },
      {
        label: "New Users",
        value: stats.newUsers30d,
        icon: UserPlus,
        color: colors.info,
        growth: null,
        periodBadge: "30d",
        footer: "vs previous 30 days",
      },
      {
        label: "New Businesses",
        value: stats.newBusinesses30d,
        icon: Building2,
        color: colors.primary,
        growth: null,
        periodBadge: "30d",
        footer: "Created in period",
      },
      {
        label: "Avg Rev / Business",
        value: 0,
        isText: true,
        computedValue: formatCompact(stats.avgRevenuePerBusiness),
        icon: BarChart2,
        color: colors.warning,
        growth: null,
        periodBadge: "All-time",
        footer: "GMV ÷ total businesses",
      },
      {
        label: "Pending Verifications",
        value: stats.pendingVerifications,
        icon: ShieldCheck,
        color: stats.pendingVerifications > 0 ? colors.error : colors.success,
        growth: null,
        periodBadge: "Now",
        footer: stats.pendingVerifications > 0 ? "Action required" : "All reviewed",
        urgent: stats.pendingVerifications > 0,
      },
    ],
    [stats, userRolePopoverContent]
  );

  if (loading) {
    return (
      <DashboardWrapper>
        <ContentLayer>
          <AdminOverviewSkeleton />
        </ContentLayer>
      </DashboardWrapper>
    );
  }

  const userName = user?.first_name || user?.email?.split("@")[0] || "Admin";

  return (
    <DashboardWrapper>
      <ContentLayer>
        <PageHeader>
          <PageTitle>Welcome back, {userName}</PageTitle>
          <PageSubtitle>
            {dayjs().format("dddd, MMMM D")} · Platform overview
          </PageSubtitle>
        </PageHeader>

        {/* KPI Metric Cards */}
        <SectionLabel>Key metrics</SectionLabel>
        <div style={{ marginBottom: 20 }}>
          <AdminMetricCards
            cards={kpiCards.map((card) => ({
              ...card,
              title: card.label,
              value: card.computedValue ?? card.value,
            }))}
            isReadyForAnimation={isReadyForAnimation}
          />
        </div>

        <Divider />

        {/* Quick actions */}
        <SectionLabel>Needs attention</SectionLabel>
        <QuickActionGrid style={{ marginBottom: 20 }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <QuickActionCard key={action.path} onClick={() => router.push(action.path)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IconContainer $bg={hexToRgba(action.color, 0.1)} $color={action.color}>
                      <Icon />
                    </IconContainer>
                    <div>
                      <MetricLabel>{action.label}</MetricLabel>
                      <MetricValue style={{ fontSize: 18 }}>
                        <NumberFlow value={action.value} />
                      </MetricValue>
                      <FooterNote>{action.note}</FooterNote>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: colors.textTertiary }} />
                </div>
              </QuickActionCard>
            );
          })}
        </QuickActionGrid>

        <Divider />

        {/* Chart + Activity Feed side by side; stack on mobile */}
        <ChartAndFeedGrid>
          <div>
            <SectionRow>
              <div>
                <SectionLabel style={{ marginBottom: 0 }}>Trends</SectionLabel>
                <SectionTitle>Businesses &amp; Revenue</SectionTitle>
              </div>
              <Radio.Group
                size="small"
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                options={PERIOD_OPTIONS}
                style={{ fontSize: 11 }}
              />
            </SectionRow>
            <ChartCard>
              <ChartContainer>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.success} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: colors.textTertiary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: colors.textTertiary }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: colors.textTertiary }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        width={40}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={7}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="businesses"
                        name="Businesses"
                        stroke={colors.primary}
                        strokeWidth={2}
                        fill="url(#gradBookings)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke={colors.success}
                        strokeWidth={2}
                        fill="url(#gradRevenue)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: colors.textTertiary, fontSize: 13 }}>
                    No trend data available
                  </div>
                )}
              </ChartContainer>
            </ChartCard>
          </div>

          {/* Activity Feed */}
          <div>
            <SectionRow>
              <div>
                <SectionLabel style={{ marginBottom: 0 }}>Recent</SectionLabel>
                <SectionTitle>Activity Feed</SectionTitle>
              </div>
            </SectionRow>
            <ActivityFeedCard>
              <FeedList>
                {auditItems.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: colors.textTertiary, fontSize: 12 }}>
                    No recent activity
                  </div>
                ) : (
                  auditItems.map((item, i) => {
                    const actionStr = item.action ?? item.description ?? "Action";
                    const { icon: FeedIcon, color: feedColor } = getAuditIcon(actionStr);
                    const ts = item.timestamp ?? item.created_at;
                    return (
                      <FeedItem key={item.id ?? i}>
                        <FeedDot $bg={hexToRgba(feedColor, 0.1)} $color={feedColor}>
                          <FeedIcon />
                        </FeedDot>
                        <FeedContent>
                          <FeedAction>{actionStr}</FeedAction>
                          <FeedMeta>
                            {item.user_email && <span>{item.user_email} · </span>}
                            {ts ? dayjs(ts).fromNow() : ""}
                          </FeedMeta>
                        </FeedContent>
                      </FeedItem>
                    );
                  })
                )}
              </FeedList>
            </ActivityFeedCard>
          </div>
        </ChartAndFeedGrid>

      </ContentLayer>
    </DashboardWrapper>
  );
}
