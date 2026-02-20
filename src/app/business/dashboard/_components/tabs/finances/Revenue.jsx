"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import styled, { keyframes } from "styled-components";
import {
  TrendingUp,
  Users,
  Download,
  CreditCard,
  PieChart as BookingTypeIcon,
  Percent,
  DollarSign,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  DatePicker,
  Typography,
  Card,
  Tooltip,
  Button,
  Select,
  Skeleton,
  Row,
  Col,
  Divider,
  Grid,
} from "antd";
import message from "@/lib/message";
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
  ComposedChart,
  Label,
} from "recharts";
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import { revenueService, businessClassService } from "@/services/apiService";
import { LordIcon } from "@/services/ReactUtils";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

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
    darkBlue: "#1e3a8a",
  },
};

/* --- Styled Components --- */

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
  @media (max-width: 992px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  @media (max-width: 992px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const ExperienceFilterSelect = styled(Select)`
  width: 250px;
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  min-height: 140px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

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

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 11px;
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
`;

const ChartCard = styled(Card)`
  height: 440px;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 24px !important;
    display: flex;
    flex-direction: column;
    height: 100% !important;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartDescription = styled.p`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin: 0;
`;

const InsightBadge = styled.div`
  background: ${colors.lightBg};
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: ${colors.textPrimary};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${colors.border};

  strong {
    color: ${colors.primary};
  }
`;

const ChartContainer = styled.div`
  flex-grow: 1;
  position: relative;
  min-height: 0;
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
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);
  lord-icon {
    width: 80px;
    height: 80px;
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;
`;

/* --- Custom Skeletons --- */

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    ${colors.lightBg} 25%,
    #eef1f5 50%,
    ${colors.lightBg} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${(props) => props.$borderRadius || "6px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "16px"};
  margin-bottom: ${(props) => props.$marginBottom || "0"};
`;

// Chart Skeleton Containers
const ChartSkeletonContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  padding: 10px 0;
`;

const ChartYAxis = styled.div`
  width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding-right: 10px;
  border-right: 1px solid ${colors.border};
`;

const ChartGridArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-left: 10px;
  position: relative;
`;

const ChartGridLine = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${colors.border};
`;

const RevenueTrendsSkeleton = () => (
  <ChartSkeletonContainer>
    <ChartYAxis>
      {[...Array(5)].map((_, i) => (
        <SkeletonBase key={i} $width="20px" $height="8px" />
      ))}
    </ChartYAxis>
    <ChartGridArea>
      {[...Array(5)].map((_, i) => (
        <ChartGridLine key={i} />
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <SkeletonBase key={i} $width="30px" $height="8px" />
        ))}
      </div>
    </ChartGridArea>
  </ChartSkeletonContainer>
);

const ExperienceRevenueSkeleton = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "10px 0",
    }}
  >
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}
      >
        <SkeletonBase $width="25%" $height="12px" style={{ marginRight: 15 }} />
        <SkeletonBase
          $width={`${Math.floor(Math.random() * (90 - 30) + 30)}%`}
          $height="24px"
          $borderRadius="0 4px 4px 0"
        />
      </div>
    ))}
  </div>
);

const PieSkeleton = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div style={{ position: "relative", width: "160px", height: "160px" }}>
      <SkeletonBase
        $width="160px"
        $height="160px"
        $borderRadius="50%"
        style={{ border: `4px solid white` }}
      />
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, type }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          padding: "12px 16px",
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Text strong style={{ display: "block", marginBottom: "8px" }}>
          {type === "experience" ? label : dayjs(label).format("MMM D, YYYY")}
        </Text>
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{
              color: entry.color || colors.textPrimary,
              marginBottom: "4px",
              fontSize: "13px",
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <span style={{ color: colors.textSecondary }}>{entry.name}:</span>
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
];

// Helper to calculate total for donut center
const getChartTotal = (data) => {
  return data.reduce((acc, curr) => acc + (curr.value || 0), 0);
};

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
  const [businessExperiences, setBusinessExperiences] = useState([]);
  const abortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const mainContentRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  useImperativeHandle(ref, () => ({
    getTargetElement: () => mainContentRef.current,
  }));

  const fetchBusinessExperiencesForFilter = useCallback(async () => {
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
        setBusinessExperiences([
          { value: null, label: "All Experiences" },
          ...uniqueClasses,
        ]);
      }
    } catch (error) {
      setBusinessExperiences([{ value: null, label: "All Experiences" }]);
    }
  }, []);

  const fetchAnalytics = useCallback(async (currentFilters) => {
    if (!currentFilters.startDate || !currentFilters.endDate) {
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
    fetchBusinessExperiencesForFilter();
  }, [fetchBusinessExperiencesForFilter]);

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
      content: "Generating report...",
      key: "exportRevenue",
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
          content: result.error || "Export failed.",
          key: "exportRevenue",
        });
      }
    } catch (error) {
      message.error({
        content: "An error occurred.",
        key: "exportRevenue",
      });
    }
  };

  // --- Insight Helpers ---
  const topSourceInsight = useMemo(() => {
    const data = analytics.revenue_by_booking_type || [];
    if (!data.length) return null;
    return data.reduce((prev, current) =>
      prev.value > current.value ? prev : current,
    );
  }, [analytics.revenue_by_booking_type]);

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
      footer: "vs. previous period",
    },
    {
      key: "estimated_platform_fees",
      title: "Est. Platform Fees",
      value: analytics.metrics.estimated_platform_fees,
      prefix: "$",
      icon: <TrendingDown size={20} />,
      color: colors.chart.red,
      background: `rgba(239, 68, 68, 0.1)`,
      footer: "Total estimated platform fees",
    },
    {
      key: "estimated_net_revenue",
      title: "Est. Net Revenue",
      value: analytics.metrics.estimated_net_revenue,
      prefix: "$",
      icon: <TrendingUp size={20} />,
      color: colors.chart.blue,
      background: `rgba(59, 130, 246, 0.1)`,
      footer: "Gross revenue minus platform fees",
    },
    {
      key: "average_order_value",
      title: "Avg. Order Value",
      value: analytics.metrics.average_order_value,
      prefix: "$",
      icon: <CreditCard size={20} />,
      color: colors.chart.purple,
      background: `rgba(139, 92, 246, 0.1)`,
      footer: "Average per transaction",
    },
    {
      key: "revenue_per_booker",
      title: "Revenue Per Booker",
      value: analytics.metrics.revenue_per_booker,
      prefix: "$",
      icon: <Users size={20} />,
      color: colors.chart.orange,
      background: `rgba(249, 115, 22, 0.1)`,
      footer: "Average per unique guest",
    },
    {
      key: "revenue_per_spot",
      title: "Revenue Per Spot",
      value: analytics.metrics.revenue_per_spot,
      prefix: "$",
      icon: <Percent size={20} />,
      color: colors.chart.teal,
      background: `rgba(20, 184, 166, 0.1)`,
      footer: "Average revenue per seat",
    },
  ];

  return (
    <DashboardWrapper ref={mainContentRef}>
        <DashboardHeader>
          <div>
            <PageTitle>Revenue Analytics</PageTitle>
            <HeaderSubtitle>
              Track revenue performance and growth insights.
            </HeaderSubtitle>
          </div>
          <Controls>
            {isMobile ? (
              <MobileDateRangePicker
                value={[filterParams.startDate, filterParams.endDate]}
                onChange={handleDateChange}
                format="MMM D, YYYY"
              />
            ) : (
              <StyledRangePicker
                value={[filterParams.startDate, filterParams.endDate]}
                onChange={handleDateChange}
                format="MMM D, YYYY"
                allowClear={false}
              />
            )}
            <ExperienceFilterSelect
              placeholder="Filter by Experience"
              value={filterParams.classId}
              onChange={handleClassFilterChange}
              options={businessExperiences}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <Tooltip title="Export your report for a detailed breakdown.">
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={handleExport}
                disabled={loading}
              >
                Export
              </Button>
            </Tooltip>
          </Controls>
        </DashboardHeader>

        <Divider style={{ margin: "24px 0" }} />

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
                                size={isMobile ? "16px" : "20px"}
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
                  <div>
                    <StatValue>
                      {stat.prefix}
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value || 0 : 0}
                        duration={800}
                        numberFormatOptions={{
                          maximumFractionDigits:
                            stat.key === "total_gross_revenue" ? 0 : 2,
                        }}
                      />
                    </StatValue>
                    {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                  </div>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider style={{ margin: "24px 0" }} />

        <ChartCard>
          <ChartHeader>
            <ChartTitleRow>
              <ChartTitle>
                <LordIcon
                  src="https://cdn.lordicon.com/excswhey.json"
                  trigger="in"
                  delay="1500"
                  state="in-trend-up"
                  colors="primary:#ff385c"
                />
                Revenue Trends
              </ChartTitle>
              {!loading && analytics.metrics.total_gross_revenue > 0 && (
                <InsightBadge>
                  Total Net:{" "}
                  <strong>
                    ${analytics.metrics.estimated_net_revenue?.toLocaleString()}
                  </strong>
                </InsightBadge>
              )}
            </ChartTitleRow>
            <ChartDescription>
              Gross vs. Net Revenue over time.
            </ChartDescription>
          </ChartHeader>

          <ChartContainer>
            {loading ? (
              <RevenueTrendsSkeleton />
            ) : !analytics.revenue_trends?.length ||
              analytics.revenue_trends.every(
                (day) => day.gross_revenue === 0,
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
                <EmptyStateText>No Revenue Activity</EmptyStateText>
                <EmptyStateSubtext>
                  No revenue recorded for this period.
                </EmptyStateSubtext>
              </EmptyStateContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.revenue_trends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={colors.chart.green}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={colors.chart.green}
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
                    dataKey="date"
                    tickFormatter={(value) =>
                      dayjs(value).format(isMobile ? "D MMM" : "MMM D")
                    }
                    tick={{ fill: colors.textSecondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                    tick={{ fill: colors.textSecondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: colors.border }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="gross_revenue"
                    name="Gross Revenue"
                    stroke={colors.chart.green}
                    fill="url(#colorGross)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_revenue"
                    name="Net Revenue"
                    stroke={colors.chart.blue}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="platform_fees"
                    name="Fees"
                    stroke={colors.chart.red}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </ChartCard>

        <Divider style={{ margin: "24px 0" }} />

        <Row gutter={[24, 24]}>
          {/* BAR CHART - WIDER (66%) */}
          <Col xs={24} lg={16}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/mubdgyyw.json"
                      trigger="in"
                      delay="1500"
                      state="in-assessment"
                      colors="primary:#ff385c"
                    />
                    Revenue by Experience
                  </ChartTitle>
                </ChartTitleRow>
                <ChartDescription>
                  Top revenue-generating experiences.
                </ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <ExperienceRevenueSkeleton />
                ) : !analytics.class_revenue?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/qfkpvtbg.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Revenue Data</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.class_revenue.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                      barSize={20}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke={colors.border}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => `$${value}`}
                        tick={{ fill: colors.textSecondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{
                          fill: colors.textSecondary,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                        width={isMobile ? 80 : 150}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={(props) => (
                          <CustomTooltip {...props} type="experience" />
                        )}
                        cursor={{ fill: colors.lightBg }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="widget_revenue"
                        name="Widget Revenue"
                        stackId="a"
                        fill={colors.chart.blue}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="platform_revenue"
                        name="Platform Revenue"
                        stackId="a"
                        fill={colors.chart.purple}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>

          {/* DONUT CHART - NARROWER (33%) */}
          <Col xs={24} lg={8}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/btfbysou.json"
                      trigger="in"
                      delay="1500"
                      state="in-pie-chart"
                      colors="primary:#ff385c"
                    />
                    Revenue Source
                  </ChartTitle>
                  {!loading && topSourceInsight && (
                    <InsightBadge>
                      Top: <strong>{topSourceInsight.name}</strong>
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>Widget vs. Platform.</ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <PieSkeleton />
                ) : !analytics.revenue_by_booking_type?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/idcmwtrd.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Data</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.revenue_by_booking_type}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        cornerRadius={5}
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
                          ),
                        )}
                        <Label
                          value={`$${getChartTotal(analytics.revenue_by_booking_type).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          position="center"
                          fill={colors.textPrimary}
                          style={{ fontSize: "20px", fontWeight: "bold" }}
                        />
                      </Pie>
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <RechartsTooltip
                        content={(props) => <CustomTooltip {...props} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>
      </DashboardWrapper>
  );
});

export default Revenue;
