"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
import {
  Calendar,
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Download,
  BookOpen,
  CreditCard,
  BarChart2 as RevenueBreakdownIcon,
  PieChart as BookingTypeIcon,
  Percent,
  DollarSign,
  TrendingDown,
  LineChart as LineChartIcon, // Renamed to avoid conflict
} from "lucide-react";
import {
  DatePicker,
  Typography,
  ConfigProvider,
  Card,
  Tooltip,
  Badge,
  Space,
  Select,
  Button,
  message,
  Empty,
  Statistic,
  Spin,
  Skeleton,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ResponsiveContainer,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dynamic from "next/dynamic";

const ComposedChart = dynamic(
  () => import("recharts").then((mod) => mod.ComposedChart),
  { ssr: false }
);
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import { revenueService, businessClassService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import { theme } from "@/components/theme";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  chart: {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    teal: "#14b8a6",
    yellow: "#eab308",
  },
};

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

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  @media (max-width: 1500px) {
    flex-direction: column;
    align-items: flex-start;
  }
  @media (max-width: 768px) {
    width: 100%;

    flex-wrap: wrap;
    margin-top: 0;
  }
`;
const StyledRangePicker = styled(RangePicker)`
  width: 320px;
  border-radius: 12px;
  height: 44px;
  border: 1px solid ${colors.border};
  &:hover,
  &:focus-within {
    border-color: ${colors.primary};
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;
const ClassFilterSelect = styled(Select)`
  width: 250px;
  .ant-select-selector {
    border-radius: 12px !important;
    border: 1px solid ${colors.border} !important;
    height: 44px !important;
    display: flex;
    align-items: center;
  }
  &:hover .ant-select-selector,
  &.ant-select-focused .ant-select-selector {
    border-color: ${colors.primary} !important;
  }
  @media (max-width: 768px) {
    width: 190px;
  }
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
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
  margin-bottom: 0;
  min-height: 140px;
  .ant-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    @media (max-width: 768px) {
      padding: 16px;
    }
  }
`;
const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 4px 0;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 6px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 4px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 14px;
  }
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;
const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
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
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;
const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  @media (max-width: 768px) {
    font-size: 17px;
  }
`;
const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;
const MetricTrend = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  gap: 4px;
  color: ${(props) => (props.positive ? colors.success : colors.error)};
  background-color: ${(props) =>
    props.positive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"};
  @media (max-width: 768px) {
    font-size: 11px;
  }
`;
const GridRow = styled(Row)`
  // Removed margin-bottom as Col handles gutter
`;
const ChartCard = styled(StatCard)`
  min-height: 400px;
  .chart-title {
    font-size: 16px;
    font-weight: 600;
    color: ${colors.textPrimary};
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    @media (max-width: 768px) {
      font-size: 15px;
    }
  }
  .chart-description {
    font-size: 13px;
    color: ${colors.textSecondary};
    margin-bottom: 16px;
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
`;
const ChartContainer = styled.div`
  height: 280px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    height: 250px;
  }
`;
const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  min-height: 250px;
`;
const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 0.7;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.$padding || "60px 20px"};
  text-align: center;
  gap: 16px;

  @media (max-width: 768px) {
    padding: ${(props) => props.$padding || "40px 16px"};
    gap: 12px;
  }

  @media (max-width: 480px) {
    padding: ${(props) => props.$padding || "30px 12px"};
    gap: 10px;
  }
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);

  lord-icon {
    width: 80px;
    height: 80px;
  }

  @media (max-width: 768px) {
    lord-icon {
      width: 64px;
      height: 64px;
    }
  }

  @media (max-width: 480px) {
    lord-icon {
      width: 48px;
      height: 48px;
    }
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;

  @media (max-width: 768px) {
    font-size: 12px;
    max-width: 250px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    max-width: 200px;
  }
`;

const CustomTooltip = ({ active, payload, label, type, isMobile }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          padding: "12px 16px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Text
          strong
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: isMobile ? "13px" : "14px",
          }}
        >
          {type === "class" ? label : dayjs(label).format("MMM D, YYYY")}
        </Text>
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{
              color: entry.color || colors.textPrimary,
              marginBottom: "4px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            <span style={{ marginRight: "8px", color: colors.textSecondary }}>
              {entry.name}:
            </span>
            <span style={{ fontWeight: 600 }}>
              $
              {entry.value?.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              }) ?? "0.00"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PIE_COLORS_EXTENDED = [
  colors.chart.blue,
  colors.chart.green,
  colors.chart.purple,
  colors.chart.orange,
  colors.chart.red,
  colors.chart.teal,
  colors.chart.yellow,
  "#a855f7",
  "#ec4899",
  "#f43f5e",
];

const Revenue = forwardRef((props, ref) => {
  const [loading, setLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [filterParams, setFilterParams] = useState({
    startDate: dayjs().subtract(29, "days"),
    endDate: dayjs(),
    classId: null,
  });
  const [analytics, setAnalytics] = useState({
    metrics: {
      total_gross_revenue: 0,
      estimated_platform_fees: 0,
      estimated_net_revenue: 0,
      average_order_value: 0,
      revenue_per_booker: 0,
      revenue_growth: 0,
      revenue_per_spot: 0,
      recurring_revenue: 0,
    },
    revenue_trends: [],
    class_revenue: [],
    revenue_by_booking_type: [],
  });
  const [businessClasses, setBusinessClasses] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);

  const abortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const mainContentRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getTargetElement: () => mainContentRef.current,
  }));

  useEffect(() => {
    setIsMobileView(window.innerWidth <= 768);
    const checkMobile = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchBusinessClassesForFilter = useCallback(async () => {
    try {
      const result = await businessClassService.fetchBusinessClasses({
        page_size: 500,
        status: "active,inactive",
      });
      if (result.success && Array.isArray(result.data)) {
        const uniqueClasses = result.data.map((c) => ({
          value: c.classId,
          label: c.title,
        }));
        setBusinessClasses([
          { value: null, label: "All Classes" },
          ...uniqueClasses,
        ]);
      } else {
        setBusinessClasses([{ value: null, label: "All Classes" }]);
      }
    } catch (error) {
      setBusinessClasses([{ value: null, label: "All Classes" }]);
    }
  }, []);

  const fetchAnalytics = useCallback(async (currentFilters) => {
    if (!currentFilters.startDate || !currentFilters.endDate) {
      message.warning("Please select a valid date range.");
      return;
    }
    setIsReadyForAnimation(false);
    setLoading(true);
    if (abortControllerRef.current)
      abortControllerRef.current.abort("New request");
    abortControllerRef.current = new AbortController();

    try {
      const apiParams = {
        startDate: currentFilters.startDate.format("YYYY-MM-DD"),
        endDate: currentFilters.endDate.format("YYYY-MM-DD"),
        class_id: currentFilters.classId || undefined,
      };
      const result = await revenueService.getRevenueAnalytics(apiParams, {
        signal: abortControllerRef.current.signal,
      });
      console.log("Analytics result:", result);

      if (abortControllerRef.current.signal.aborted) return;
      if (result.success) {
        setAnalytics((prev) => ({ ...prev, ...result.data }));
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else {
        if (!abortControllerRef.current.signal.aborted)
          message.error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        message.error("An error occurred");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted)
        setTimeout(() => setLoading(false), 150);
    }
  }, []);

  useEffect(() => {
    fetchBusinessClassesForFilter();
  }, [fetchBusinessClassesForFilter]);

  useEffect(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchAnalytics(filterParams);
    }, 300);
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (abortControllerRef.current)
        abortControllerRef.current.abort("Cleanup");
    };
  }, [filterParams, fetchAnalytics]);

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2)
      setFilterParams((prev) => ({
        ...prev,
        startDate: dates[0],
        endDate: dates[1],
      }));
    else
      setFilterParams((prev) => ({ ...prev, startDate: null, endDate: null }));
  };

  const handleClassFilterChange = (value) => {
    setFilterParams((prev) => ({ ...prev, classId: value }));
  };

  const handleExport = async () => {
    if (!filterParams.startDate || !filterParams.endDate) {
      message.warning("Please select date range.");
      return;
    }
    message.loading({
      content: "Generating your report...",
      key: "exportRevenue",
      duration: 0,
    });
    try {
      const result = await revenueService.exportRevenueReport({
        startDate: filterParams.startDate.format("YYYY-MM-DD"),
        endDate: filterParams.endDate.format("YYYY-MM-DD"),
        class_id: filterParams.classId || undefined,
      });
      if (result.success) {
        message.success({
          content: "Report downloaded!",
          key: "exportRevenue",
        });
      } else {
        message.error({
          content: result.error || "Export failed. Please try again.",
          key: "exportRevenue",
        });
      }
    } catch (error) {
      message.error({
        content: "An error occurred during export.",
        key: "exportRevenue",
      });
    }
  };

  const statisticCards = [
    {
      key: "total_gross_revenue",
      title: "Total Gross Revenue",
      value: analytics.metrics.total_gross_revenue,
      prefix: "$",
      change: analytics.metrics.revenue_growth,
      icon: <DollarSign size={20} />,
      color: colors.chart.green,
      background: `rgba(16, 185, 129, 0.1)`,
    },
    {
      key: "estimated_platform_fees",
      title: "Est. Platform Fees",
      value: analytics.metrics.estimated_platform_fees,
      prefix: "$",
      icon: <TrendingDown size={20} />,
      color: colors.chart.red,
      background: `rgba(239, 68, 68, 0.1)`,
    },
    {
      key: "estimated_net_revenue",
      title: "Est. Net Revenue",
      value: analytics.metrics.estimated_net_revenue,
      prefix: "$",
      icon: <TrendingUp size={20} />,
      color: colors.chart.blue,
      background: `rgba(59, 130, 246, 0.1)`,
    },
    {
      key: "average_order_value",
      title: "Average Order Value",
      value: analytics.metrics.average_order_value,
      prefix: "$",
      icon: <CreditCard size={20} />,
      color: colors.chart.purple,
      background: `rgba(139, 92, 246, 0.1)`,
    },
    {
      key: "revenue_per_booker",
      title: "Revenue Per Booker",
      value: analytics.metrics.revenue_per_booker,
      prefix: "$",
      icon: <Users size={20} />,
      color: colors.chart.orange,
      background: `rgba(249, 115, 22, 0.1)`,
    },
    {
      key: "revenue_per_spot",
      title: "Revenue Per Spot Booked",
      value: analytics.metrics.revenue_per_spot,
      prefix: "$",
      icon: <Percent size={20} />,
      color: colors.chart.teal,
      background: `rgba(20, 184, 166, 0.1)`,
    },
  ];

  return (
    <ConfigProvider theme={theme}>
      <DashboardWrapper ref={mainContentRef}>
        <DashboardHeader>
          <div>
            <PageTitle>Revenue Analytics</PageTitle>
            <HeaderSubtitle>
              Track revenue performance and growth insights.
            </HeaderSubtitle>
          </div>
          <Controls>
            <StyledRangePicker
              value={[filterParams.startDate, filterParams.endDate]}
              onChange={handleDateChange}
              format="MMM D, YYYY"
              allowClear={false}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "nowrap",
                alignItems: "center",
              }}
            >
              <ClassFilterSelect
                placeholder="Filter by Class"
                value={filterParams.classId}
                onChange={handleClassFilterChange}
                options={businessClasses}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
              <Tooltip title="Export your report for a detailed HST breakdown for tax purposes.">
                <Button
                  type="primary"
                  icon={<Download size={16} />}
                  onClick={handleExport}
                  disabled={loading}
                >
                  Export Report
                </Button>
              </Tooltip>
            </div>
          </Controls>
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          {statisticCards.map((stat) => (
            <StatCard key={stat.key}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <>
                  <div>
                    <StatCardHeader>
                      <IconContainer
                        background={stat.background}
                        color={stat.color}
                      >
                        {stat.icon}
                      </IconContainer>
                      {stat.key === "total_gross_revenue" &&
                        stat.change !== undefined &&
                        stat.change !== null && (
                          <MetricTrend positive={stat.change >= 0}>
                            {stat.change >= 0 ? (
                              <LordIcon
                                src="https://cdn.lordicon.com/excswhey.json"
                                trigger="in"
                                delay="1500"
                                state="in-trend-up"
                                colors="primary:#30c702"
                              />
                            ) : (
                              <LordIcon
                                src="https://cdn.lordicon.com/zwtssiaj.json"
                                colors="primary:#f56231"
                                size={isMobileView ? "16px" : "20px"}
                                trigger="hover"
                                playOnLoad={true}
                              />
                            )}
                            {Math.abs(stat.change).toFixed(1)}%
                          </MetricTrend>
                        )}
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <StatValue>
                    {stat.prefix}
                    <NumberFlow
                      key={
                        loading ? `${stat.key}-loading` : `${stat.key}-loaded`
                      }
                      value={isReadyForAnimation ? stat.value || 0 : 0}
                      duration={800}
                      numberFormatOptions={{
                        maximumFractionDigits:
                          stat.key === "average_order_value" ||
                          stat.key === "revenue_per_booker" ||
                          stat.key === "revenue_per_spot"
                            ? 2
                            : 0,
                        minimumFractionDigits:
                          stat.key === "average_order_value" ||
                          stat.key === "revenue_per_booker" ||
                          stat.key === "revenue_per_spot"
                            ? 2
                            : 0,
                      }}
                    />
                    {stat.suffix}
                  </StatValue>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <ChartCard style={{ marginBottom: 24 }}>
          <div>
            <div className="chart-title">
              <LordIcon
                src="https://cdn.lordicon.com/excswhey.json"
                trigger="in"
                delay="1500"
                state="in-trend-up"
                colors="primary:#ff385c"
              />{" "}
              Revenue Trends (Local Business Time)
            </div>
            <div className="chart-description">
              Gross revenue, platform fees, and net revenue over the selected
              period.
            </div>
          </div>
          <ChartContainer>
            {loading ? (
              <LoaderWrapper>
                <GlobalLoaderWithoutInlineStyles />
              </LoaderWrapper>
            ) : !analytics.revenue_trends ||
              analytics.revenue_trends.length === 0 ||
              analytics.revenue_trends.every(
                (day) =>
                  day.gross_revenue === 0 &&
                  day.net_revenue === 0 &&
                  day.platform_fees === 0
              ) ? (
              <EmptyStateContainer>
                <EmptyStateIcon>
                  <lord-icon
                    src="https://cdn.lordicon.com/qfkpvtbg.json"
                    trigger="in"
                    delay="500"
                    state="in-coin"
                    colors="primary:#94a3b8"
                    style={{ width: 40, height: 40 }}
                  />
                </EmptyStateIcon>
                <EmptyStateText>No Revenue Activity Found</EmptyStateText>
                <EmptyStateSubtext>
                  You don't have any revenue in this date range. When you do,
                  daily revenue trends will be shown here.
                </EmptyStateSubtext>
              </EmptyStateContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.revenue_trends}
                  margin={{
                    top: 10,
                    right: isMobileView ? 15 : 30,
                    left: isMobileView ? -10 : 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      dayjs(value).format(isMobileView ? "D MMM" : "MMM D")
                    }
                    tick={{
                      fill: colors.textSecondary,
                      fontSize: isMobileView ? "10px" : "12px",
                    }}
                    axisLine={{ stroke: colors.border }}
                    tickLine={{ stroke: colors.border }}
                    interval={
                      isMobileView
                        ? Math.floor(analytics.revenue_trends.length / 5)
                        : Math.floor(analytics.revenue_trends.length / 10)
                    }
                  />
                  <YAxis
                    label={{
                      value: "Amount (CAD)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: colors.textSecondary,
                        fontSize: isMobileView ? "10px" : "12px",
                      },
                      dy: isMobileView ? 50 : 40,
                      dx: isMobileView ? 5 : 0,
                    }}
                    tickFormatter={(value) =>
                      `$${value.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`
                    }
                    tick={{
                      fill: colors.textSecondary,
                      fontSize: isMobileView ? "10px" : "12px",
                    }}
                    axisLine={{ stroke: colors.border }}
                    tickLine={{ stroke: colors.border }}
                    allowDecimals={false}
                    width={isMobileView ? 35 : 60}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: colors.primary, strokeDasharray: "3 3" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{
                      fontSize: isMobileView ? "10px" : "12px",
                      color: colors.textSecondary,
                      paddingBottom: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gross_revenue"
                    name="Gross Revenue"
                    fill={colors.chart.green}
                    stroke={colors.chart.green}
                    fillOpacity={0.1}
                    activeDot={{ r: isMobileView ? 3 : 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_revenue"
                    name="Net Revenue (Est.)"
                    stroke={colors.chart.blue}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: isMobileView ? 3 : 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="platform_fees"
                    name="Platform Fees (Est.)"
                    stroke={colors.chart.red}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={{ r: isMobileView ? 3 : 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </ChartCard>

        <GridRow gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <ChartCard>
              <div>
                <div className="chart-title">
                  <LordIcon
                    src="https://cdn.lordicon.com/mubdgyyw.json"
                    trigger="in"
                    delay="1500"
                    state="in-assessment"
                    colors="primary:#ff385c"
                    playOnLoad={true}
                  />{" "}
                  Revenue by Class
                </div>
                <div className="chart-description">
                  Top 10 revenue-generating classes (Gross Revenue).
                </div>
              </div>
              <ChartContainer>
                {loading ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !analytics.class_revenue ||
                  analytics.class_revenue.length === 0 ? (
                  <LoaderWrapper>
                    <EmptyStateContainer>
                      <EmptyStateIcon>
                        <LordIcon
                          src="https://cdn.lordicon.com/qfkpvtbg.json"
                          trigger="in"
                          delay="1500"
                          state="in-coin"
                          colors="primary:#94a3b8"
                          style={{ width: 40, height: 40 }}
                        />
                      </EmptyStateIcon>
                      <EmptyStateText>No Revenue Data</EmptyStateText>
                      <EmptyStateSubtext>
                        You don't currently have any revenue. When you do,
                        you'll see a breakdown by class here.
                      </EmptyStateSubtext>
                    </EmptyStateContainer>
                  </LoaderWrapper>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.class_revenue.slice(0, 10)}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: isMobileView ? 15 : 30,
                        left: isMobileView ? 5 : 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) =>
                          `$${value.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}`
                        }
                        tick={{
                          fill: colors.textSecondary,
                          fontSize: isMobileView ? "10px" : "12px",
                        }}
                        axisLine={{ stroke: colors.border }}
                        tickLine={{ stroke: colors.border }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{
                          fill: colors.textSecondary,
                          fontSize: isMobileView ? "10px" : "12px",
                          width: isMobileView ? 80 : 150,
                        }}
                        axisLine={{ stroke: colors.border }}
                        tickLine={false}
                        width={isMobileView ? 90 : 150}
                        interval={0}
                      />
                      <RechartsTooltip
                        content={(props) => (
                          <CustomTooltip {...props} type="class" />
                        )}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{
                          fontSize: isMobileView ? "10px" : "12px",
                          color: colors.textSecondary,
                          paddingBottom: "10px",
                          paddingTop: "5px",
                        }}
                      />
                      <Bar
                        dataKey="platform_revenue"
                        name="Platform Revenue"
                        stackId="a"
                        fill={colors.chart.purple}
                        maxBarSize={isMobileView ? 20 : 30}
                      />
                      <Bar
                        dataKey="widget_revenue"
                        name="Widget Revenue"
                        stackId="a"
                        fill={colors.chart.blue}
                        radius={[0, 4, 4, 0]}
                        maxBarSize={isMobileView ? 20 : 30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard>
              <div>
                <div className="chart-title">
                  <LordIcon
                    src="https://cdn.lordicon.com/btfbysou.json"
                    trigger="in"
                    delay="1500"
                    state="in-pie-chart"
                    colors="primary:#ff385c"
                  />{" "}
                  Revenue by Booking Type
                </div>
                <div className="chart-description">
                  Revenue distribution from the embeddable widget vs. the main
                  platform.
                </div>
              </div>
              <ChartContainer>
                {loading ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !analytics.revenue_by_booking_type ||
                  analytics.revenue_by_booking_type.length === 0 ? (
                  <LoaderWrapper>
                    <EmptyStateContainer>
                      <EmptyStateIcon>
                        <lord-icon
                          src="https://cdn.lordicon.com/idcmwtrd.json"
                          trigger="in"
                          colors="primary:#94a3b8"
                          style={{ width: 40, height: 40 }}
                        />
                      </EmptyStateIcon>
                      <EmptyStateText>No Revenue Data</EmptyStateText>
                      <EmptyStateSubtext>
                        You don't currently have any revenue. When you do,
                        you'll see the source of the revenue here.
                      </EmptyStateSubtext>
                    </EmptyStateContainer>
                  </LoaderWrapper>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.revenue_by_booking_type}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        outerRadius={isMobileView ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {analytics.revenue_by_booking_type.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                PIE_COLORS_EXTENDED[
                                  index % PIE_COLORS_EXTENDED.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>
                      <RechartsTooltip
                        content={(props) => (
                          <CustomTooltip {...props} isMobile={isMobileView} />
                        )}
                      />
                      <Legend
                        iconSize={10}
                        wrapperStyle={{
                          fontSize: isMobileView ? "11px" : "13px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </GridRow>
      </DashboardWrapper>
    </ConfigProvider>
  );
});

export default Revenue;
