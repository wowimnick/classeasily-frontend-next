"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Card, Spin, Typography, Timeline } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import NumberFlow from "@number-flow/react";
import DashboardBreadcrumb from "@/app/business/dashboard/_components/DashboardBreadcrumb";
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

const { Text } = Typography;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#1f2937",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DashboardWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const OverviewTopWrap = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -50vw;
  width: 100vw;
  height: 320px;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  @media (max-width: 640px) {
    height: 200px;
  }
`;

const OverviewGradientStrip = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 280px;
  top: 50%;
  transform: translateY(-50%) rotate(-12deg);
  overflow: visible;
  border-radius: 4px;
  pointer-events: none;
`;

const OverviewGradientStripInner = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const OverviewGradientCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  --gradient-color-1: #f9fafb;
  --gradient-color-2: #fc4056;
  --gradient-color-3: #f9fafc;
  --gradient-color-4: #fc4056;
`;

const OverviewContentLayer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
`;

const StatCardBase = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 130px;
  background: #ffffff;
  .ant-card-body {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }
  @media (max-width: 768px) {
    min-height: 110px;
    .ant-card-body {
      padding: 14px 16px;
    }
  }
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
    width: 16px;
    height: 16px;
  }
`;

const MetricValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  margin-top: 4px;
`;

const SectionTitle = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: #b0b7c3;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const SectionHeading = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
`;

const QuickActionCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  .ant-card-body {
    padding: 16px;
  }
`;

const QuickActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
`;

const ChartCard = styled(StatCardBase)`
  min-height: 340px;
`;

const ChartContainer = styled.div`
  height: 280px;
  width: 100%;
  margin-top: 12px;
`;

const ActivityCard = styled(StatCardBase)`
  min-height: 340px;
`;

const ScrollableList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding-right: 8px;
`;

const DividerLine = styled.hr`
  border: none;
  border-top: 1px solid ${colors.border};
  margin: 24px 0;
`;

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PlatformOverview() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
  });
  const [chartData, setChartData] = useState([]);
  const [auditItems, setAuditItems] = useState([]);
  const canvasId = "platform-overview-gradient-canvas";
  const canvasInitialized = useRef(false);

  useEffect(() => {
    const id = canvasId;
    if (canvasInitialized.current) return;
    const run = () => {
      import("stripe-gradient")
        .then(({ Gradient }) => {
          const canvas = document.getElementById(id);
          if (!canvas || !canvas.getContext) return;
          canvasInitialized.current = true;
          const gradient = new Gradient();
          gradient.initGradient(`#${id}`);
        })
        .catch(() => {});
    };
    const t = setTimeout(run, 100);
    return () => clearTimeout(t);
  }, [canvasId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
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
          userAdminService.getUserMetrics({ start_date: null, end_date: null }),
          businessManagementService.getPlatformMetrics(),
          adminBookingService.getBookingAnalytics({}),
          paymentService.getPaymentStats(),
          auditService.getAuditLogs({ page_size: 10, page: 1 }),
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
        setAuditItems(Array.isArray(results) ? results.slice(0, 10) : []);

        setStats({
          totalUsers: userData.total_users ?? userData.total ?? 0,
          totalBusinesses: bizData.total_businesses ?? bizData.total ?? 0,
          totalBookings: bookingData.total_bookings ?? bookingData.total ?? 0,
          platformRevenue:
            paymentData.total_revenue ??
            paymentData.revenue ??
            bizData.total_revenue ??
            bizData.gross_sales ??
            0,
          newUsers30d: userData.new_users_30d ?? userData.new_registrations ?? 0,
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
        });

        const trend =
          bookingData.registration_trend ??
          bookingData.trend ??
          bizData.growth_trend ??
          [];
        const growth =
          bizData.growth_trend ?? bizData.growth ?? [];
        const revTrend = paymentData.revenue_trend ?? paymentData.trend ?? [];
        const combined = trend.length
          ? trend.map((d, i) => ({
              name: d.date ?? d.period ?? d.name ?? `Period ${i + 1}`,
              bookings: d.count ?? d.bookings ?? d.total ?? 0,
              revenue: (revTrend[i]?.amount ?? revTrend[i]?.revenue ?? growth[i]?.revenue) ?? 0,
            }))
          : revTrend.length
            ? revTrend.map((d, i) => ({
                name: d.date ?? d.period ?? `Period ${i + 1}`,
                bookings: 0,
                revenue: d.amount ?? d.revenue ?? 0,
              }))
            : [];
        setChartData(combined);
      } catch (e) {
        if (!cancelled) console.error("Platform overview fetch error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickActions = [
    {
      label: "Pending Verifications",
      value: stats.pendingVerifications,
      path: "/admin/business-verification",
      icon: ShieldCheck,
      color: colors.warning,
    },
    {
      label: "Open Support Tickets",
      value: stats.openTickets,
      path: "/admin/support",
      icon: MessageSquare,
      color: colors.info,
    },
    {
      label: "Pending Payouts",
      value: stats.pendingPayoutsCount,
      path: "/admin/payouts",
      icon: Wallet,
      color: colors.success,
    },
  ];

  if (loading) {
    return (
      <DashboardWrapper>
        <OverviewContentLayer style={{ minHeight: 400 }}>
          <DashboardBreadcrumb title="Platform Overview" />
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        </OverviewContentLayer>
      </DashboardWrapper>
    );
  }

  const userName = user?.first_name || user?.email?.split("@")[0] || "Admin";

  return (
    <DashboardWrapper>
      <OverviewTopWrap>
        <OverviewGradientStrip>
          <OverviewGradientStripInner>
            <OverviewGradientCanvas id={canvasId} data-transition-in />
          </OverviewGradientStripInner>
        </OverviewGradientStrip>
      </OverviewTopWrap>

      <OverviewContentLayer>
        <DashboardBreadcrumb title="Platform Overview" />
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            Welcome back, {userName}
          </h1>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Here’s what’s happening across the platform.
          </Text>
        </div>

        <SectionTitle>Key metrics</SectionTitle>
        <StatsGrid style={{ marginBottom: 24 }}>
          <StatCardBase>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <StatLabel>Total Users</StatLabel>
                <MetricValue>
                  <NumberFlow value={stats.totalUsers} />
                </MetricValue>
              </div>
              <IconContainer $bg={hexToRgba(colors.info, 0.1)} $color={colors.info}>
                <Users />
              </IconContainer>
            </div>
          </StatCardBase>
          <StatCardBase>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <StatLabel>Total Businesses</StatLabel>
                <MetricValue>
                  <NumberFlow value={stats.totalBusinesses} />
                </MetricValue>
              </div>
              <IconContainer $bg={hexToRgba(colors.primary, 0.1)} $color={colors.primary}>
                <Building2 />
              </IconContainer>
            </div>
          </StatCardBase>
          <StatCardBase>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <StatLabel>Total Bookings</StatLabel>
                <MetricValue>
                  <NumberFlow value={stats.totalBookings} />
                </MetricValue>
              </div>
              <IconContainer $bg={hexToRgba(colors.success, 0.1)} $color={colors.success}>
                <BookOpen />
              </IconContainer>
            </div>
          </StatCardBase>
          <StatCardBase>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <StatLabel>Platform Revenue</StatLabel>
                <MetricValue>{formatCurrency(stats.platformRevenue)}</MetricValue>
              </div>
              <IconContainer $bg={hexToRgba(colors.success, 0.1)} $color={colors.success}>
                <DollarSign />
              </IconContainer>
            </div>
          </StatCardBase>
        </StatsGrid>

        <SectionTitle>Quick actions</SectionTitle>
        <QuickActionGrid>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <QuickActionCard
                key={action.path}
                onClick={() => router.push(action.path)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <IconContainer $bg={hexToRgba(action.color, 0.1)} $color={action.color}>
                      <Icon />
                    </IconContainer>
                    <div>
                      <StatLabel>{action.label}</StatLabel>
                      <MetricValue>
                        <NumberFlow value={action.value} />
                      </MetricValue>
                    </div>
                  </div>
                  <ArrowRight size={18} style={{ color: colors.textTertiary }} />
                </div>
              </QuickActionCard>
            );
          })}
        </QuickActionGrid>

        <DividerLine />

        <SectionTitle>Secondary metrics</SectionTitle>
        <StatsGrid style={{ marginBottom: 24 }}>
          <StatCardBase>
            <StatLabel>New Users (30d)</StatLabel>
            <MetricValue><NumberFlow value={stats.newUsers30d} /></MetricValue>
          </StatCardBase>
          <StatCardBase>
            <StatLabel>New Businesses (30d)</StatLabel>
            <MetricValue><NumberFlow value={stats.newBusinesses30d} /></MetricValue>
          </StatCardBase>
        </StatsGrid>

        {chartData.length > 0 && (
          <>
            <SectionTitle>Trends</SectionTitle>
            <SectionHeading>Bookings & Revenue</SectionHeading>
            <ChartCard style={{ marginBottom: 24 }}>
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={colors.textTertiary} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke={colors.textTertiary} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke={colors.textTertiary} />
                    <RechartsTooltip
                      formatter={(value, name) =>
                        name === "revenue" ? formatCurrency(value) : value
                      }
                      labelStyle={{ color: colors.textPrimary }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={{ fill: colors.primary, strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={colors.success}
                      strokeWidth={2}
                      dot={{ fill: colors.success, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>
          </>
        )}

        <SectionTitle>Recent activity</SectionTitle>
        <SectionHeading>Audit log</SectionHeading>
        <ActivityCard>
          <ScrollableList>
            {auditItems.length === 0 ? (
              <Text type="secondary">No recent activity</Text>
            ) : (
              <Timeline
                items={auditItems.map((item) => ({
                  color: colors.primary,
                  children: (
                    <div key={item.id || item.timestamp}>
                      <Text strong style={{ fontSize: 13 }}>
                        {item.action ?? item.description ?? "Action"}
                      </Text>
                      {item.user_email && (
                        <div style={{ fontSize: 12, color: colors.textSecondary }}>
                          {item.user_email}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString()
                          : item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : ""}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </ScrollableList>
        </ActivityCard>
      </OverviewContentLayer>
    </DashboardWrapper>
  );
}
