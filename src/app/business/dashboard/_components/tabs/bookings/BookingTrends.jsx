"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import styled, { keyframes } from "styled-components";
import {
  Calendar,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  Percent,
  GitCompareArrows,
  BarChart2,
  PieChart as PieIcon,
  Info,
} from "lucide-react";
import {
  DatePicker,
  Typography,
  ConfigProvider,
  Card,
  Select,
  Empty,
  Skeleton,
  Row,
  Col,
  Divider,
  Grid,
  Tooltip as AntTooltip,
} from "antd";
import message from "@/lib/message";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell,
  ComposedChart,
  Line,
  BarChart,
  PieChart,
  Area,
  Label,
} from "recharts";
import NumberFlow from "@number-flow/react";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import { bookingAnalyticsService } from "@/services/apiService";
import { theme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// --- Theme and Colors ---
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

// --- Styled Components ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
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

const ResponsiveDivider = styled(Divider)`
  margin: 24px 0;
  @media (max-width: 768px) {
    margin: 0;
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

const ClassFilterSelect = styled(Select)`
  width: 250px;
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 0;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
  min-height: 140px;

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
  background: ${(props) => props.background};
  color: ${(props) => props.color};
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

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 11px;
  }
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
  min-height: 0; /* Important for flex child */
`;

const TableWrapper = styled(Card)`
  height: 440px;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
`;

const TableHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.border};
  background-color: #fff;
  border-radius: 16px 16px 0 0;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 14px 24px;
    text-align: left;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
  }
  th {
    font-weight: 600;
    color: ${colors.textSecondary};
    background-color: ${colors.lightBg};
    position: sticky;
    top: 0;
    z-index: 10;
  }
  tbody tr:hover {
    background-color: ${colors.lightBg};
  }
  tr:last-child td {
    border-bottom: none;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: #f1f5f9;
  border-radius: 3px;
  margin-top: 6px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background-color: ${(props) => props.color || colors.primary};
  width: ${(props) => props.width}%;
  border-radius: 3px;
`;

// --- Mobile Card for Top Classes ---
const MobileExperienceCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 16px !important;
  }
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
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;
`;

/* --- Custom Skeletons (Kept same as original for brevity) --- */
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

const DailyActivitySkeleton = () => (
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
          position: "absolute",
          bottom: 30,
          left: 10,
          right: 0,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-end",
          height: "60%",
        }}
      >
        {[...Array(10)].map((_, i) => (
          <SkeletonBase
            key={i}
            $width="5%"
            $height={`${Math.random() * 80 + 10}%`}
            $borderRadius="4px 4px 0 0"
          />
        ))}
      </div>
    </ChartGridArea>
  </ChartSkeletonContainer>
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

const TableSkeleton = () => (
  <div>
    <div
      style={{
        display: "flex",
        background: colors.lightBg,
        padding: "16px 20px",
        gap: "10px",
      }}
    >
      <SkeletonBase $width="30%" $height="14px" />
      <SkeletonBase $width="70%" $height="14px" />
    </div>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          padding: "16px 20px",
          gap: "10px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <SkeletonBase $width="30%" $height="12px" />
        <SkeletonBase $width="70%" $height="12px" />
      </div>
    ))}
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
          {type === "time"
            ? dayjs().hour(label).minute(0).format("h A")
            : dayjs(label).format("ddd, MMM D")}
        </Text>
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{
              color: entry.color,
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "4px",
              fontSize: "13px",
            }}
          >
            <span style={{ color: colors.textSecondary }}>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>
              {entry.dataKey?.includes("rate")
                ? `${entry.value?.toFixed(1)}%`
                : entry.value?.toLocaleString()}
              {entry.dataKey === "average_lead_time_days" ? " days" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PIE_COLORS_EXTENDED = Object.values(colors.chart);

// Helper to calculate total for donut center
const getChartTotal = (data) => {
  return data.reduce(
    (acc, curr) => acc + (curr.value || curr.spot_count || 0),
    0,
  );
};

const BookingTrends = () => {
  const [loading, setLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [filterParams, setFilterParams] = useState({
    startDate: dayjs().subtract(29, "days"),
    endDate: dayjs(),
    classId: null,
  });
  const [analytics, setAnalytics] = useState({
    summary: {},
    trends: [],
    class_insights: { popular_classes: [] },
    booking_patterns: { time_distribution: [], booking_types: [] },
  });
  const [businessClasses, setBusinessClasses] = useState([]);
  const abortControllerRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const fetchBusinessClassesForFilter = useCallback(async () => {
    try {
      const result = await bookingAnalyticsService.getBookingAnalytics(
        [dayjs().subtract(1, "year"), dayjs()],
        {},
      );
      if (result.success && result.data?.class_insights?.popular_classes) {
        const uniqueClasses = result.data.class_insights.popular_classes.map(
          (c) => ({ value: c.class_id, label: c.class_name }),
        );
        setBusinessClasses([
          { value: undefined, label: "All Experiences" },
          ...uniqueClasses,
        ]);
      }
    } catch (error) {
      // Handle error silently
    }
  }, []);

  const fetchAnalytics = useCallback(async (currentFilters) => {
    if (!currentFilters.startDate || !currentFilters.endDate) return;
    setLoading(true);
    setIsReadyForAnimation(false);
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const result = await bookingAnalyticsService.getBookingAnalytics(
        [currentFilters.startDate, currentFilters.endDate],
        {
          signal: abortControllerRef.current.signal,
          classId: currentFilters.classId || undefined,
        },
      );
      if (!abortControllerRef.current.signal.aborted) {
        if (result.success) {
          setAnalytics((prev) => ({ ...prev, ...result.data }));
          setTimeout(() => setIsReadyForAnimation(true), 50);
        } else {
          message.error(result.error || "Failed to fetch analytics");
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") message.error("An error occurred");
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinessClassesForFilter();
    const debouncedFetch = debounce(() => fetchAnalytics(filterParams), 300);
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [filterParams, fetchAnalytics, fetchBusinessClassesForFilter]);

  const handleDateChange = (dates) => {
    if (dates?.length === 2)
      setFilterParams((p) => ({
        ...p,
        startDate: dates[0],
        endDate: dates[1],
      }));
  };

  const handleClassFilterChange = (value) => {
    setFilterParams((p) => ({
      ...p,
      classId: value === undefined ? null : value,
    }));
  };

  // --- Insight Helpers ---
  const peakHourInsight = useMemo(() => {
    const data = analytics.booking_patterns?.time_distribution || [];
    if (!data.length) return null;
    const peak = data.reduce((prev, current) =>
      prev.booking_transactions > current.booking_transactions ? prev : current,
    );
    return peak.booking_transactions > 0
      ? {
          time: dayjs().hour(peak.hour).format("h A"),
          count: peak.booking_transactions,
        }
      : null;
  }, [analytics.booking_patterns]);

  const guestRetentionInsight = useMemo(() => {
    const newG = analytics.summary.new_student_bookings || 0;
    const retG = analytics.summary.returning_student_bookings || 0;
    const total = newG + retG;
    if (total === 0) return 0;
    return Math.round((retG / total) * 100);
  }, [analytics.summary]);

  const maxSpots = useMemo(() => {
    return Math.max(
      ...(analytics.class_insights?.popular_classes || []).map(
        (c) => c.total_participant_spots,
      ),
      0,
    );
  }, [analytics.class_insights]);

  const statisticCards = [
    {
      key: "total_booking_transactions",
      title: "Total Bookings",
      value: analytics.summary.total_booking_transactions,
      icon: <Calendar size={20} />,
      color: colors.chart.blue,
      background: `rgba(59, 130, 246, 0.1)`,
      footer: "Total confirmed bookings",
    },
    {
      key: "booker_retention_rate",
      title: "Guest Retention",
      value: analytics.summary.booker_retention_rate,
      suffix: "%",
      icon: <Users size={20} />,
      color: colors.chart.purple,
      background: `rgba(139, 92, 246, 0.1)`,
      footer: "Returning vs new guests",
    },
    {
      key: "cancellation_rate_by_transaction",
      title: "Cancellation Rate",
      value: analytics.summary.cancellation_rate_by_transaction,
      suffix: "%",
      icon: <AlertCircle size={20} />,
      color: colors.chart.red,
      background: `rgba(239, 68, 68, 0.1)`,
      footer: "Percentage of bookings cancelled",
    },
    {
      key: "average_lead_time_days",
      title: "Avg. Lead Time",
      value: analytics.summary.average_lead_time_days,
      suffix: " days",
      icon: <Clock size={20} />,
      color: colors.chart.orange,
      background: `rgba(249, 115, 22, 0.1)`,
      footer: "Days in advance",
    },
    {
      key: "average_occupancy_rate",
      title: "Avg. Occupancy",
      value: analytics.summary.average_occupancy_rate,
      suffix: "%",
      icon: <Percent size={20} />,
      color: colors.chart.teal,
      background: `rgba(20, 184, 166, 0.1)`,
      footer: "Seats filled per session",
    },
  ];

  const guestTypeData = [
    {
      type: "New Guests",
      value: analytics.summary.new_student_bookings || 0,
      color: colors.chart.teal,
    },
    {
      type: "Returning",
      value: analytics.summary.returning_student_bookings || 0,
      color: colors.chart.blue,
    },
  ];

  return (
    <ConfigProvider theme={theme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Booking Trends & Insights</PageTitle>
            <HeaderSubtitle>
              Analyze booking patterns and guest engagement.
            </HeaderSubtitle>
          </div>
          <Controls>
            <StyledRangePicker
              value={[filterParams.startDate, filterParams.endDate]}
              onChange={handleDateChange}
            />
            <ClassFilterSelect
              placeholder="Filter by Experience"
              value={filterParams.classId}
              onChange={handleClassFilterChange}
              options={businessClasses}
              allowClear
              showSearch
            />
          </Controls>
        </DashboardHeader>

        <ResponsiveDivider />

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
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <div>
                    <StatValue>
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value || 0 : 0}
                        duration={800}
                        suffix={stat.suffix}
                        numberFormatOptions={{ maximumFractionDigits: 1 }}
                      />
                    </StatValue>
                    {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                  </div>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <ResponsiveDivider />

        <ChartCard style={{ height: 480 }}>
          <ChartHeader>
            <ChartTitleRow>
              <ChartTitle>
                <LordIcon
                  src="https://cdn.lordicon.com/excswhey.json"
                  trigger="in"
                  delay="500"
                  state="in-trend-up"
                  colors="primary:#ff385c"
                  playOnLoad={true}
                />
                Daily Booking Activity
              </ChartTitle>
              {!loading && analytics.trends?.length > 0 && (
                <InsightBadge>
                  Total Spots:{" "}
                  <strong>{analytics.summary.total_participant_spots}</strong>
                </InsightBadge>
              )}
            </ChartTitleRow>
            <ChartDescription>
              Comparison of new bookings vs net volume (after cancellations).
            </ChartDescription>
          </ChartHeader>

          <ChartContainer>
            {loading ? (
              <DailyActivitySkeleton />
            ) : !analytics.trends?.length ? (
              <EmptyStateContainer>
                <EmptyStateIcon>
                  <lord-icon
                    src="https://cdn.lordicon.com/uoljexdg.json"
                    trigger="in"
                    delay="500"
                    state="in-label"
                    colors="primary:#94a3b8"
                    style={{ width: 40, height: 40 }}
                  />
                </EmptyStateIcon>
                <EmptyStateText>No Booking Activity Found</EmptyStateText>
                <EmptyStateSubtext>
                  You don't have any booking activity in this date range.
                </EmptyStateSubtext>
              </EmptyStateContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.trends}
                  margin={{
                    top: 10,
                    right: isMobile ? 5 : 20,
                    left: isMobile ? -25 : 0,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={colors.chart.blue}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={colors.chart.blue}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={colors.chart.purple}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.chart.purple}
                        stopOpacity={0.4}
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
                    tickFormatter={(value) => dayjs(value).format("MMM D")}
                    tick={{ fontSize: 12, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: colors.textSecondary }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                  {/* Visuals */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="net_participant_spots"
                    name="Net Spots"
                    stroke={colors.chart.blue}
                    fillOpacity={1}
                    fill="url(#colorNet)"
                    strokeWidth={3}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="new_participant_spots"
                    name="New Spots"
                    fill="url(#colorBar)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cancellation_rate_by_transaction"
                    name="Cancel Rate"
                    stroke={colors.chart.red}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </ChartCard>

        <ResponsiveDivider />

        <Row gutter={[24, 24]}>
          {/* BAR CHART - WIDER (66%) */}
          <Col xs={24} lg={16}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/okqjaags.json"
                      trigger="in"
                      delay="500"
                      state="in-clock"
                      colors="primary:#ff385c"
                    />{" "}
                    Popular Booking Times
                  </ChartTitle>
                  {!loading && peakHourInsight && (
                    <InsightBadge>
                      Peak: <strong>{peakHourInsight.time}</strong> (
                      {peakHourInsight.count} bkgs)
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>
                  Distribution of confirmed and cancelled bookings by hour.
                </ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <DailyActivitySkeleton />
                ) : !analytics.booking_patterns?.time_distribution?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/okqjaags.json"
                        trigger="in"
                        delay="500"
                        state="in-clock"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Time Data</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.booking_patterns.time_distribution}
                      margin={{ top: 10, right: 0, left: -25, bottom: 5 }}
                      barSize={20}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={colors.border}
                      />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(hour) =>
                          dayjs().hour(hour).format("hA")
                        }
                        tick={{ fontSize: 11, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={(props) => (
                          <CustomTooltip {...props} type="time" />
                        )}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                      />
                      <Bar
                        dataKey="booking_transactions"
                        name="Confirmed"
                        fill={colors.chart.blue}
                        stackId="a"
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="cancelled_transactions"
                        name="Cancelled"
                        fill={colors.chart.red}
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>

          {/* PIE CHART - NARROWER (33%) */}
          <Col xs={24} lg={8}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/meaqueth.json"
                      trigger="in"
                      delay="500"
                      state="in-compare"
                      colors="primary:#ff385c"
                    />{" "}
                    Guest Type
                  </ChartTitle>
                  {!loading && (
                    <AntTooltip title="Percent of returning guests">
                      <InsightBadge>
                        Return Rate: <strong>{guestRetentionInsight}%</strong>
                      </InsightBadge>
                    </AntTooltip>
                  )}
                </ChartTitleRow>
                <ChartDescription>New vs Returning.</ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <PieSkeleton />
                ) : !guestTypeData.some((d) => d.value > 0) ? (
                  <EmptyStateContainer $padding="20px">
                    <EmptyStateText>No Data</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={guestTypeData}
                        dataKey="value"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={5}
                        cornerRadius={5}
                        stroke="none"
                      >
                        {guestTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <Label
                          value={getChartTotal(guestTypeData)}
                          position="center"
                          fill={colors.textPrimary}
                          style={{ fontSize: "24px", fontWeight: "bold" }}
                        />
                      </Pie>
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconType="circle"
                      />
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>

        <ResponsiveDivider />

        <Row gutter={[24, 24]}>
          {/* TABLE - WIDER (66%) */}
          <Col xs={24} lg={16}>
            <TableWrapper>
              <TableHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <TrendingUp size={18} color={colors.primary} /> Top
                    Performing Experiences
                  </ChartTitle>
                </ChartTitleRow>
                <ChartDescription>
                  Ranked by participant spots.
                </ChartDescription>
              </TableHeader>
              {loading ? (
                <TableSkeleton />
              ) : !analytics.class_insights?.popular_classes?.length ? (
                <EmptyStateContainer>
                  <EmptyStateText>No Bookings Found</EmptyStateText>
                </EmptyStateContainer>
              ) : (
                <div style={{ overflowX: "auto", flex: 1, overflowY: "auto" }}>
                  <StyledTable>
                    <thead>
                      <tr>
                        <th style={{ width: "40%" }}>Experience</th>
                        <th style={{ width: "25%" }}>Booked Spots</th>
                        <th>Revenue</th>
                        <th>Cancel %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.class_insights.popular_classes
                        .slice(0, 5)
                        .map((c) => (
                          <tr key={c.class_name}>
                            <td>
                              <Text strong style={{ fontSize: 13 }}>
                                {c.class_name}
                              </Text>
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span style={{ fontWeight: 600, fontSize: 13 }}>
                                  {c.total_participant_spots}
                                </span>
                                <ProgressBarContainer>
                                  <ProgressBarFill
                                    width={
                                      (c.total_participant_spots / maxSpots) *
                                      100
                                    }
                                    color={colors.chart.blue}
                                  />
                                </ProgressBarContainer>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>
                              ${c.total_revenue?.toLocaleString()}
                            </td>
                            <td>
                              <span
                                style={{
                                  color:
                                    c.cancellation_rate_by_spots > 20
                                      ? colors.error
                                      : colors.success,
                                }}
                              >
                                {c.cancellation_rate_by_spots?.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </StyledTable>
                </div>
              )}
            </TableWrapper>
          </Col>

          {/* PIE CHART - NARROWER (33%) */}
          <Col xs={24} lg={8}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <PieIcon size={18} color={colors.primary} /> Booking Types
                  </ChartTitle>
                </ChartTitleRow>
                <ChartDescription>Single vs. Course.</ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <PieSkeleton />
                ) : !analytics.booking_patterns?.booking_types?.length ? (
                  <EmptyStateContainer $padding="20px">
                    <EmptyStateText>No Data</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.booking_patterns.booking_types}
                        dataKey="spot_count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={5}
                        cornerRadius={5}
                        stroke="none"
                      >
                        {analytics.booking_patterns.booking_types.map(
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
                          value={getChartTotal(
                            analytics.booking_patterns.booking_types,
                          )}
                          position="center"
                          fill={colors.textPrimary}
                          style={{ fontSize: "24px", fontWeight: "bold" }}
                        />
                      </Pie>
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        iconType="circle"
                      />
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BookingTrends;
