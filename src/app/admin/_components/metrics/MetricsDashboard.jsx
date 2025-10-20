"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { ThemeProvider } from "styled-components";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Server,
  Database,
  Activity,
  HardDrive,
  Clock,
  AlertTriangle,
  ListTodo,
  BarChart2,
  Cpu,
  Network,
  Eye,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";
import { Tabs, Card, Progress, Radio, ConfigProvider, Grid, Button, Divider, Typography, Skeleton,  } from 'antd';
import message from '@/lib/message';
import NumberFlow from "@number-flow/react";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import RequestAnalysisTab from "./RequestAnalytics";
import { adminService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";

const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;

// --- STYLING & THEME (ADAPTED FROM BOOKINGSLIST) ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
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

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

// --- STATS CARDS ---
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
  min-height: 160px;
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 20px !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    @media (max-width: 768px) {
      padding: 16px !important;
    }
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  span.unit {
    font-size: 16px;
    font-weight: 500;
    color: ${colors.textSecondary};
  }

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textTertiary};
  margin-top: 4px;
`;

// --- TABLE SECTION ---
const TableSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const ChartHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;
const ChartContent = styled.div`
  padding: 16px;
  height: 350px;
  @media (min-width: 768px) {
    padding: 24px;
    height: 400px;
  }
`;
const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0px !important;
    padding: 0 24px;
  }
`;
const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 24px;
  background-color: #f8fafc;
  border-top: 1px solid ${colors.border};
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;
const StatusCard = styled(Card)`
  &.ant-card .ant-card-body {
    padding: 24px !important;
  }
`;
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  gap: 16px;
`;
const MetricProgressContainer = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const MetricProgressLabel = styled.span`
  font-size: 13px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;
const MetricProgressValue = styled.span`
  font-size: 13px;
  color: ${colors.textPrimary};
  font-weight: 600;
  color: ${(props) =>
    props.error && props.value > 1 ? colors.error : "inherit"};
`;
const MetricStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
`;
const MetricStatCardSmall = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid ${colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;
const MetricStatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textPrimary};
  display: flex;
  align-items: baseline;
  gap: 4px;
`;
const MetricStatLabel = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  text-align: center;
`;

const StyledTooltip = styled.div`
  background: #fff;
  padding: 12px;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;
const TooltipTitle = styled.p`
  margin: 0 0 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${colors.textPrimary};
`;
const TooltipEntry = styled.p`
  margin: 4px 0;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
`;
const TooltipDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.color};
`;
const TooltipLabel = styled.span`
  color: ${colors.textSecondary};
`;
const TooltipValue = styled.span`
  font-weight: 500;
  color: ${colors.textPrimary};
`;
const StatCardTitle = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;
const CardTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 17px;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

// --- DEFAULT DATA & CONFIG ---
const defaultMetrics = {
  system: {
    cpu_usage: 0,
    cpu_detailed: { user: 0, system: 0, idle: 100 },
    memory: { total: 1, available: 1, percent: 0, used: 0 },
    disk: { total: 1, used: 0, free: 1, percent: 0 },
    network: {
      bytes_sent_rate: 0,
      bytes_recv_rate: 0,
      packets_sent: 0,
      packets_recv: 0,
    },
  },
  database: {
    active_connections: 0,
    slow_queries: 0,
    connection_pool: "0/0",
    pool_usage_percent: 0,
  },
  application: {
    active_users: 0,
    error_rate: 0,
    requests_per_minute: 0,
    uptime_seconds: 0,
  },
  profiling: {
    requests: [],
    avg_response_time: 0,
    avg_queries_per_request: 0,
    error_analysis: { top_error_paths: [], status_distribution: {} },
    sql_analysis: { slow_queries: [], query_types: {} },
    recent_errors: [],
  },
  endpoint_analysis: {
    top_by_count: [],
    top_by_time: [],
    top_by_queries: [],
    total_requests: 0,
    time_window_hours: 1,
  },
  celery: {
    active_workers: 0,
    queue_length: 0,
    failed_tasks_count: 0,
    workers: [],
    failed_tasks: [],
  },
  cache: { hits: 0, misses: 0 },
  api_response_time_ms: 0,
};
const POLLING_INTERVAL_MS = 5000;
const MAX_HISTORICAL_POINTS = 240;
const generateInitialHistoricalData = (spanInSeconds) => {
  const intervalInSeconds = POLLING_INTERVAL_MS / 1000;
  const points = Math.floor(spanInSeconds / intervalInSeconds);
  const now = Date.now();
  const initialData = [];
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - 1 - i) * intervalInSeconds * 1000;
    initialData.push({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cpu: null,
      memory: null,
      network_in: null,
      network_out: null,
    });
  }
  return initialData.slice(-MAX_HISTORICAL_POINTS);
};

// --- MAIN COMPONENT ---
const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [timeSpan, setTimeSpan] = useState(300); // Default to 5m
  const [historicalData, setHistoricalData] = useState(() =>
    generateInitialHistoricalData(timeSpan)
  );
  const [loadingStatus, setLoadingStatus] = useState("loading");
  const [activeTabKey, setActiveTabKey] = useState("1");
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const intervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const loadingStatusRef = useRef(loadingStatus);
  useEffect(() => {
    loadingStatusRef.current = loadingStatus;
  }, [loadingStatus]);

  useEffect(() => {
    if (loadingStatus === "connected") {
      const timer = setTimeout(() => setIsReadyForAnimation(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsReadyForAnimation(false);
    }
  }, [loadingStatus]);

  const fetchMetrics = useCallback(
    async (isInitialLoad = false) => {
      if (isFetchingRef.current && !isInitialLoad) return;
      isFetchingRef.current = true;
      if (isInitialLoad) setLoadingStatus("loading");
      try {
        const result = await adminService.getAdminMetrics();
        if (result.success && result.data) {
          setMetrics(result.data);
          if (loadingStatusRef.current !== "connected")
            setLoadingStatus("connected");
          const { system } = result.data;
          const bytesToMB = (bytes) => (bytes > 0 ? bytes / (1024 * 1024) : 0);
          const timestamp = Date.now();
          setHistoricalData((prev) => {
            const newPoint = {
              timestamp,
              time: new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              cpu: system?.cpu_usage ?? 0,
              memory: system?.memory?.percent ?? 0,
              network_in: bytesToMB(system?.network?.bytes_recv_rate ?? 0),
              network_out: bytesToMB(system?.network?.bytes_sent_rate ?? 0),
            };
            const cutoffTime = Date.now() - timeSpan * 1000;
            return [...prev, newPoint]
              .filter((item) => item.timestamp >= cutoffTime)
              .slice(-MAX_HISTORICAL_POINTS);
          });
        } else {
          if (loadingStatusRef.current !== "connected")
            setLoadingStatus("error");
          message.error(
            `Failed to load metrics: ${result.error || "Unknown error"}`,
            5
          );
          if (result.status === 403 || result.status === 401) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        if (loadingStatusRef.current !== "connected") setLoadingStatus("error");
        message.error(
          `Failed to load metrics: ${error.message || "Network error"}`,
          5
        );
      } finally {
        isFetchingRef.current = false;
      }
    },
    [timeSpan]
  );

  useEffect(() => {
    fetchMetrics(true);
    const id = setInterval(() => fetchMetrics(false), POLLING_INTERVAL_MS);
    intervalRef.current = id;
    return () => clearInterval(id);
  }, [fetchMetrics]);

  useEffect(() => {
    const now = Date.now();
    const cutoffTime = now - timeSpan * 1000;
    setHistoricalData((prev) => {
      const filteredRealData = prev.filter(
        (item) => item.timestamp >= cutoffTime && item.cpu !== null
      );
      const newPlaceholders = generateInitialHistoricalData(timeSpan);
      const realDataMap = new Map(filteredRealData.map((p) => [p.time, p]));
      return newPlaceholders.map((p) => realDataMap.get(p.time) || p);
    });
  }, [timeSpan]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(k)),
      sizes.length - 1
    );
    const value = bytes / Math.pow(k, i);
    const precision = value >= 1 ? 1 : value >= 0.1 ? 2 : 3;
    return `${value.toFixed(precision)} ${sizes[i]}`;
  };

  const formatUptime = (totalSeconds) => {
    if (totalSeconds < 0 || totalSeconds === undefined) return "N/A";
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    let uptime = "";
    if (days > 0) uptime += `${days}d `;
    if (hours > 0 || days > 0) uptime += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) uptime += `${minutes}m `;
    uptime += `${seconds}s`;
    return uptime.trim();
  };

  const metricCards = React.useMemo(
    () => [
      {
        key: "cpu",
        title: "CPU Usage",
        Icon: Cpu,
        value: metrics.system?.cpu_usage ?? 0,
        unit: "%",
        format: (v) => v.toFixed(1),
        footer: `${
          metrics.system?.cpu_detailed?.user?.toFixed(1) ?? "0.0"
        }% User`,
        color: colors.primary,
      },
      {
        key: "memory",
        title: "Memory Usage",
        Icon: HardDrive,
        value: metrics.system?.memory?.percent ?? 0,
        unit: "%",
        format: (v) => v.toFixed(1),
        footer: `${formatBytes(
          metrics.system?.memory?.used ?? 0
        )} / ${formatBytes(metrics.system?.memory?.total ?? 0)}`,
        color: colors.info,
      },
      {
        key: "network",
        title: "Network In Rate",
        Icon: Network,
        value: metrics.system?.network?.bytes_recv_rate ?? 0,
        unit: "/s",
        isBytes: true,
        footer: `${formatBytes(
          metrics.system?.network?.bytes_sent_rate ?? 0
        )}/s Out`,
        color: colors.success,
      },
      {
        key: "response",
        title: "Avg Response",
        Icon: Clock,
        value: metrics.profiling?.avg_response_time ?? 0,
        unit: "ms",
        format: (v) => Math.round(v),
        footer: `${
          metrics.profiling?.avg_queries_per_request?.toFixed(1) ?? "0.0"
        } queries/req`,
        color: colors.pink,
        onClick: () => setActiveTabKey("2"),
      },
      {
        key: "error",
        title: "Error Rate",
        Icon: AlertTriangle,
        value: metrics.application?.error_rate ?? 0,
        unit: "%",
        format: (v) => v.toFixed(2),
        footer: `Uptime: ${formatUptime(metrics.application?.uptime_seconds)}`,
        color: colors.warning,
        onClick: () => setActiveTabKey("2"),
      },
    ],
    [metrics]
  );

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (
      active &&
      payload &&
      payload.length &&
      payload.some((p) => p.value !== null)
    ) {
      return (
        <StyledTooltip>
          <TooltipTitle>{label}</TooltipTitle>
          {payload.map(
            (entry, index) =>
              entry.value !== null && (
                <TooltipEntry key={index}>
                  <TooltipDot color={entry.color} />
                  <TooltipLabel>{entry.name}:</TooltipLabel>
                  <TooltipValue>
                    {entry.name.includes("Network")
                      ? `${entry.value.toFixed(2)} MB/s`
                      : `${entry.value.toFixed(1)}%`}
                  </TooltipValue>
                </TooltipEntry>
              )
          )}
        </StyledTooltip>
      );
    }
    return null;
  }, []);

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  if (loadingStatus === "loading") {
    return (
      <LoadingContainer>
        <GlobalLoaderWithoutInlineStyles />
        <Text type="secondary">Loading system metrics...</Text>
      </LoadingContainer>
    );
  }

  if (loadingStatus === "error") {
    return (
      <LoadingContainer>
        <AlertTriangle size={40} color={colors.error} />
        <Text type="danger">
          Failed to load metrics. Check connection or server logs.
        </Text>
        <Button onClick={() => fetchMetrics(true)}>Retry</Button>
      </LoadingContainer>
    );
  }

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>System Performance</PageTitle>
            <HeaderSubtitle>
              Monitor real-time server health, resource usage, and application
              metrics.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                />
              }
              onClick={() => fetchMetrics(true)}
              loading={isFetchingRef.current}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <div style={{ marginBottom: "20px" }}>
          <Text
            style={{
              fontSize: isMobile ? "16px" : "17px",
              fontWeight: 600,
              color: colors.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <Activity size={20} color={colors.primary} /> Key Metrics Overview
          </Text>
        </div>

        <StatsGrid>
          {metricCards.map((card) => (
            <StatCard
              key={card.key}
              $isClickable={!!card.onClick}
              onClick={card.onClick}
            >
              <>
                <div>
                  <StatCardHeader>
                    <IconContainer
                      background={hexToRgba(card.color, 0.1)}
                      color={card.color}
                    >
                      <card.Icon size={18} />
                    </IconContainer>
                  </StatCardHeader>
                  <StatLabel>{card.title}</StatLabel>
                </div>
                <div>
                  <StatValue>
                    <NumberFlow
                      value={isReadyForAnimation ? card.value : 0}
                      duration={1200}
                      format={(v) =>
                        card.isBytes
                          ? formatBytes(v).split(" ")[0]
                          : card.format
                          ? card.format(v)
                          : v
                      }
                    />
                    <span className="unit">
                      {card.isBytes
                        ? formatBytes(card.value).split(" ")[1] + card.unit
                        : card.unit}
                    </span>
                  </StatValue>
                  <StatFooter>{card.footer}</StatFooter>
                </div>
              </>
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection>
          <TableHeader>
            <TableTitle>
              <BarChart2 />
              Resource Monitoring
            </TableTitle>
            <TableDescription>
              Live tracking of system resources and application performance.
            </TableDescription>
          </TableHeader>

          <StyledTabs activeKey={activeTabKey} onChange={setActiveTabKey}>
            <Tabs.TabPane tab={<>System Overview</>} key="1">
              <ChartHeader>
                <CardTitle>
                  <Cpu size={20} color={colors.primary} />
                  Resource Utilization Trend
                </CardTitle>
                <Radio.Group
                  value={timeSpan}
                  onChange={(e) => setTimeSpan(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value={60}>1m</Radio.Button>
                  <Radio.Button value={180}>3m</Radio.Button>
                  <Radio.Button value={300}>5m</Radio.Button>
                  <Radio.Button value={900}>15m</Radio.Button>
                </Radio.Group>
              </ChartHeader>
              <ChartContent>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={historicalData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={colors.primary}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={colors.primary}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorMemory"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={colors.info}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={colors.info}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorNetwork"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={colors.success}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={colors.success}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.border}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      stroke={colors.textSecondary}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={colors.textSecondary}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      width={40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={colors.textSecondary}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(1)}`}
                      width={45}
                      label={{
                        value: "MB/s",
                        angle: -90,
                        position: "insideRight",
                        dy: 40,
                        style: {
                          fontSize: 10,
                          fill: colors.textSecondary,
                        },
                      }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: "12px",
                        color: colors.textSecondary,
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cpu"
                      name="CPU Usage"
                      stroke={colors.primary}
                      strokeWidth={2}
                      fill="url(#colorCpu)"
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="memory"
                      name="Memory Usage"
                      stroke={colors.info}
                      strokeWidth={2}
                      fill="url(#colorMemory)"
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="network_in"
                      name="Network In"
                      stroke={colors.success}
                      strokeWidth={2}
                      fill="url(#colorNetwork)"
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="network_out"
                      name="Network Out"
                      stroke={colors.warning}
                      strokeWidth={1.5}
                      fillOpacity={0}
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContent>
              <StatusGrid>
                <StatusCard>
                  <CardTitle>
                    <Server size={18} color={colors.textSecondary} />
                    System Health
                  </CardTitle>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      marginTop: "16px",
                    }}
                  >
                    <div>
                      <MetricProgressContainer>
                        <MetricProgressLabel>CPU Usage</MetricProgressLabel>
                        <MetricProgressValue>
                          <NumberFlow
                            value={metrics.system?.cpu_usage ?? 0}
                            duration={800}
                            format={(v) => `${v.toFixed(1)}%`}
                          />
                        </MetricProgressValue>
                      </MetricProgressContainer>
                      <Progress
                        percent={metrics.system?.cpu_usage ?? 0}
                        showInfo={false}
                        strokeColor={colors.primary}
                        trailColor={hexToRgba(colors.primary, 0.15)}
                        size="small"
                      />
                    </div>
                    <div>
                      <MetricProgressContainer>
                        <MetricProgressLabel>Memory</MetricProgressLabel>
                        <MetricProgressValue>
                          <NumberFlow
                            value={metrics.system?.memory?.percent ?? 0}
                            duration={800}
                            format={(v) => `${v.toFixed(1)}%`}
                          />
                        </MetricProgressValue>
                      </MetricProgressContainer>
                      <Progress
                        percent={metrics.system?.memory?.percent ?? 0}
                        showInfo={false}
                        strokeColor={colors.info}
                        trailColor={hexToRgba(colors.info, 0.15)}
                        size="small"
                      />
                    </div>
                    <div>
                      <MetricProgressContainer>
                        <MetricProgressLabel>Disk</MetricProgressLabel>
                        <MetricProgressValue>
                          <NumberFlow
                            value={metrics.system?.disk?.percent ?? 0}
                            duration={800}
                            format={(v) => `${v}%`}
                          />
                        </MetricProgressValue>
                      </MetricProgressContainer>
                      <Progress
                        percent={metrics.system?.disk?.percent ?? 0}
                        showInfo={false}
                        strokeColor={colors.success}
                        trailColor={hexToRgba(colors.success, 0.15)}
                        size="small"
                      />
                    </div>
                  </div>
                </StatusCard>
                <StatusCard>
                  <CardTitle>
                    <Database size={18} color={colors.textSecondary} />
                    Database
                  </CardTitle>
                  <div style={{ marginTop: "16px" }}>
                    <MetricProgressContainer>
                      <MetricProgressLabel>Connection Pool</MetricProgressLabel>
                      <MetricProgressValue>
                        {metrics.database?.connection_pool || "0/0"} (
                        <NumberFlow
                          value={metrics.database?.pool_usage_percent ?? 0}
                          duration={800}
                          format={(v) => `${v}%`}
                        />
                        )
                      </MetricProgressValue>
                    </MetricProgressContainer>
                    <Progress
                      percent={metrics.database?.pool_usage_percent ?? 0}
                      showInfo={false}
                      strokeColor={colors.purple}
                      trailColor={hexToRgba(colors.purple, 0.15)}
                      size="small"
                    />
                  </div>
                  <MetricStatsGrid>
                    <MetricStatCardSmall>
                      <MetricStatValue>
                        <NumberFlow
                          value={metrics.database?.active_connections ?? 0}
                          duration={800}
                        />
                      </MetricStatValue>
                      <MetricStatLabel>Active</MetricStatLabel>
                    </MetricStatCardSmall>
                    <MetricStatCardSmall>
                      <MetricStatValue>
                        <NumberFlow
                          value={metrics.database?.slow_queries ?? 0}
                          duration={800}
                        />
                      </MetricStatValue>
                      <MetricStatLabel>Slow Queries</MetricStatLabel>
                    </MetricStatCardSmall>
                  </MetricStatsGrid>
                </StatusCard>
                <StatusCard>
                  <CardTitle>
                    <Activity size={18} color={colors.textSecondary} />
                    Application
                  </CardTitle>
                  <div style={{ marginTop: "16px" }}>
                    <MetricProgressContainer>
                      <MetricProgressLabel>Error Rate</MetricProgressLabel>
                      <MetricProgressValue
                        error
                        value={metrics.application?.error_rate ?? 0}
                      >
                        <NumberFlow
                          value={metrics.application?.error_rate ?? 0}
                          duration={800}
                          format={(v) => `${v.toFixed(2)}%`}
                        />
                      </MetricProgressValue>
                    </MetricProgressContainer>
                    <Progress
                      percent={Math.min(
                        (metrics.application?.error_rate ?? 0) * 10,
                        100
                      )}
                      showInfo={false}
                      strokeColor={
                        (metrics.application?.error_rate ?? 0) > 1
                          ? colors.error
                          : colors.success
                      }
                      trailColor={hexToRgba(
                        (metrics.application?.error_rate ?? 0) > 1
                          ? colors.error
                          : colors.success,
                        0.15
                      )}
                      size="small"
                    />
                  </div>
                  <MetricStatsGrid>
                    <MetricStatCardSmall>
                      <MetricStatValue>
                        <NumberFlow
                          value={metrics.application?.requests_per_minute ?? 0}
                          duration={800}
                          format={(v) => Math.round(v)}
                        />
                      </MetricStatValue>
                      <MetricStatLabel>Requests/min</MetricStatLabel>
                    </MetricStatCardSmall>
                    <MetricStatCardSmall>
                      <MetricStatValue>
                        <NumberFlow
                          value={metrics.profiling?.avg_response_time ?? 0}
                          duration={800}
                          format={(v) => `${Math.round(v)}`}
                        />
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "500",
                            color: colors.textSecondary,
                          }}
                        >
                          ms
                        </span>
                      </MetricStatValue>
                      <MetricStatLabel>Avg Response</MetricStatLabel>
                    </MetricStatCardSmall>
                  </MetricStatsGrid>
                </StatusCard>
                <StatusCard>
                  <CardTitle>
                    <ListTodo size={18} color={colors.textSecondary} />
                    Task Queue
                  </CardTitle>
                  <div style={{ marginTop: "16px" }}>
                    <MetricProgressContainer>
                      <MetricProgressLabel>Tasks in Queue</MetricProgressLabel>
                      <MetricProgressValue
                        error={metrics.celery?.queue_length > 10}
                        value={metrics.celery?.queue_length ?? 0}
                      >
                        <NumberFlow
                          value={metrics.celery?.queue_length ?? 0}
                          duration={800}
                        />
                      </MetricProgressValue>
                    </MetricProgressContainer>
                    <Progress
                      percent={Math.min(100, metrics.celery?.queue_length ?? 0)}
                      showInfo={false}
                      strokeColor={
                        (metrics.celery?.queue_length ?? 0) > 50
                          ? colors.warning
                          : colors.purple
                      }
                      trailColor={hexToRgba(
                        (metrics.celery?.queue_length ?? 0) > 50
                          ? colors.warning
                          : colors.purple,
                        0.15
                      )}
                      size="small"
                    />
                  </div>
                  <MetricStatsGrid>
                    <MetricStatCardSmall>
                      <MetricStatValue>
                        <NumberFlow
                          value={metrics.celery?.active_workers ?? 0}
                          duration={800}
                        />
                      </MetricStatValue>
                      <MetricStatLabel>Active Workers</MetricStatLabel>
                    </MetricStatCardSmall>
                    <MetricStatCardSmall>
                      <MetricStatValue
                        style={{
                          color:
                            (metrics.celery?.failed_tasks_count ?? 0) > 0
                              ? colors.error
                              : "inherit",
                        }}
                      >
                        <NumberFlow
                          value={metrics.celery?.failed_tasks_count ?? 0}
                          duration={800}
                        />
                      </MetricStatValue>
                      <MetricStatLabel>Failed Tasks</MetricStatLabel>
                    </MetricStatCardSmall>
                  </MetricStatsGrid>
                </StatusCard>
              </StatusGrid>
            </Tabs.TabPane>
            <Tabs.TabPane tab={<>Request Analysis</>} key="2">
              <RequestAnalysisTab metrics={metrics} />
            </Tabs.TabPane>
          </StyledTabs>
        </TableSection>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

MetricsDashboard.propTypes = {};

export default MetricsDashboard;
