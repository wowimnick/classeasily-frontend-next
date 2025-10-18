import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
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
} from "lucide-react";
import {
  DatePicker,
  Typography,
  ConfigProvider,
  Card,
  Select,
  message,
  Empty,
  Skeleton,
  Row,
  Col,
  Divider,
  Grid,
} from "antd";
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
} from "recharts";
import NumberFlow from "@number-flow/react";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import { bookingAnalyticsService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
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
  },
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  min-height: 160px;

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

const ChartCard = styled(Card)`
  height: 420px;
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

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartDescription = styled.p`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin: 0 0 16px 0;
`;

const ChartContainer = styled.div`
  flex-grow: 1;
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 250px;
`;

const TableWrapper = styled(Card)`
  height: 420px;
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
  padding: 16px 20px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 12px 20px;
    text-align: left;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
  }
  th {
    font-weight: 600;
    background-color: ${colors.lightBg};
  }
  tr:last-child td {
    border-bottom: none;
  }
`;

// --- Mobile Card for Top Classes ---
const MobileClassCard = styled(Card)`
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

const CustomTooltip = ({ active, payload, label, type }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
        }}
      >
        <Text strong style={{ display: "block", marginBottom: "4px" }}>
          {type === "time"
            ? dayjs().hour(label).minute(0).format("h A")
            : dayjs(label).format("MMM D, YYYY")}
        </Text>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color }}>
            <span style={{ color: colors.textSecondary }}>{entry.name}: </span>
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
    // Simplified fetch for demo; in production, you might have a dedicated endpoint
    try {
      const result = await bookingAnalyticsService.getBookingAnalytics(
        [dayjs().subtract(1, "year"), dayjs()],
        {}
      );
      if (result.success && result.data?.class_insights?.popular_classes) {
        const uniqueClasses = result.data.class_insights.popular_classes.map(
          (c) => ({ value: c.class_id, label: c.class_name })
        );
        setBusinessClasses([
          { value: undefined, label: "All Classes" },
          ...uniqueClasses,
        ]);
      }
    } catch (error) {
      /* Handle error silently for this helper function */
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
        }
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

  const statisticCards = [
    {
      key: "total_booking_transactions",
      title: "Total Bookings",
      value: analytics.summary.total_booking_transactions,
      icon: <Calendar size={20} />,
      color: colors.chart.blue,
    },
    {
      key: "booker_retention_rate",
      title: "Booker Retention",
      value: analytics.summary.booker_retention_rate,
      suffix: "%",
      icon: <Users size={20} />,
      color: colors.chart.purple,
    },
    {
      key: "cancellation_rate_by_transaction",
      title: "Cancellation Rate",
      value: analytics.summary.cancellation_rate_by_transaction,
      suffix: "%",
      icon: <AlertCircle size={20} />,
      color: colors.chart.red,
    },
    {
      key: "average_lead_time_days",
      title: "Avg. Lead Time",
      value: analytics.summary.average_lead_time_days,
      suffix: " days",
      icon: <Clock size={20} />,
      color: colors.chart.orange,
    },
    {
      key: "average_occupancy_rate",
      title: "Avg. Occupancy",
      value: analytics.summary.average_occupancy_rate,
      suffix: "%",
      icon: <Percent size={20} />,
      color: colors.chart.teal,
    },
  ];

  const studentTypeData = [
    {
      type: "New Students",
      value: analytics.summary.new_student_bookings || 0,
      color: colors.chart.green,
    },
    {
      type: "Returning Students",
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
              Analyze booking patterns and student engagement.
            </HeaderSubtitle>
          </div>
          <Controls>
            <StyledRangePicker
              value={[filterParams.startDate, filterParams.endDate]}
              onChange={handleDateChange}
            />
            <ClassFilterSelect
              placeholder="Filter by Class"
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
                        background={hexToRgba(stat.color, 0.1)}
                        color={stat.color}
                      >
                        {stat.icon}
                      </IconContainer>
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <StatValue>
                    <NumberFlow
                      value={isReadyForAnimation ? stat.value || 0 : 0}
                      duration={800}
                      suffix={stat.suffix}
                      numberFormatOptions={{ maximumFractionDigits: 1 }}
                    />
                  </StatValue>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <ResponsiveDivider />

        <ChartCard>
          <ChartTitle>
            <LordIcon
              src="https://cdn.lordicon.com/excswhey.json"
              trigger="in"
              delay="500"
              state="in-trend-up"
              colors="primary:#ff385c"
              playOnLoad={true}
            />{" "}
            Daily Booking Activity
          </ChartTitle>
          <ChartDescription>
            Participant spots booked, net, and cancellations over time.
          </ChartDescription>
          <ChartContainer>
            {loading ? (
              <LoaderWrapper>
                <GlobalLoaderWithoutInlineStyles />
              </LoaderWrapper>
            ) : !analytics.trends?.length ||
              analytics.trends.every(
                (day) =>
                  day.new_participant_spots === 0 &&
                  day.net_participant_spots === 0 &&
                  day.cancelled_participant_spots === 0
              ) ? (
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
                  You don't have any booking activity in this date range. When
                  you do, daily trends will be shown here.
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
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="new_participant_spots"
                    name="New Spots"
                    fill={colors.chart.blue}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={25}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="net_participant_spots"
                    name="Net Spots"
                    stroke={colors.chart.green}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cancellation_rate_by_transaction"
                    name="Cancel Rate"
                    stroke={colors.chart.red}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </ChartCard>

        <ResponsiveDivider />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <ChartCard>
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
              <ChartDescription>
                Distribution of bookings by time of day.
              </ChartDescription>
              <ChartContainer>
                {loading ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !analytics.booking_patterns?.time_distribution?.length ||
                  analytics.booking_patterns.time_distribution.every(
                    (hour) =>
                      hour.booking_transactions === 0 &&
                      hour.cancelled_transactions === 0
                  ) ? (
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
                    <EmptyStateText>No Time Data Found</EmptyStateText>
                    <EmptyStateSubtext>
                      You don't have any bookings yet. When you do, time
                      distribution will be shown here.
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.booking_patterns.time_distribution}
                      margin={{
                        top: 10,
                        right: isMobile ? 5 : 20,
                        left: isMobile ? -25 : 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(hour) =>
                          dayjs().hour(hour).format("hA")
                        }
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip
                        content={(props) => (
                          <CustomTooltip {...props} type="time" />
                        )}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar
                        dataKey="booking_transactions"
                        name="Confirmed"
                        fill={colors.chart.blue}
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={25}
                      />
                      <Bar
                        dataKey="cancelled_transactions"
                        name="Cancelled"
                        fill={colors.chart.red}
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={25}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard>
              <ChartTitle>
                <LordIcon
                  src="https://cdn.lordicon.com/meaqueth.json"
                  trigger="in"
                  delay="500"
                  state="in-compare"
                  colors="primary:#ff385c"
                />{" "}
                New vs. Returning Students
              </ChartTitle>
              <ChartDescription>
                Breakdown of bookings by student type.
              </ChartDescription>
              <ChartContainer>
                {loading ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !studentTypeData.some((d) => d.value > 0) ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/valwmkhs.json"
                        trigger="in"
                        delay="500"
                        state="in-autorenew"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Students Found</EmptyStateText>
                    <EmptyStateSubtext>
                      You dont have any bookings yet. When you do, a recurrence
                      breakdown can be found here.
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentTypeData}
                        dataKey="value"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="80%"
                        paddingAngle={2}
                      >
                        {studentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [`${value} bookings`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>

        <ResponsiveDivider />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <TableWrapper>
              <TableHeader>
                <ChartTitle>
                  <TrendingUp size={18} /> Top Performing Classes
                </ChartTitle>
                <ChartDescription>
                  Ranked by participant spots.
                </ChartDescription>
              </TableHeader>
              {loading ? (
                <LoaderWrapper>
                  <GlobalLoaderWithoutInlineStyles />
                </LoaderWrapper>
              ) : !analytics.class_insights?.popular_classes?.length ? (
                <EmptyStateContainer>
                  <EmptyStateIcon>
                    <lord-icon
                      src="https://cdn.lordicon.com/tctltdwj.json"
                      trigger="in"
                      delay="500"
                      state="in-label"
                      colors="primary:#94a3b8"
                      style={{ width: 40, height: 40 }}
                    />
                  </EmptyStateIcon>
                  <EmptyStateText>No Bookings Found</EmptyStateText>
                  <EmptyStateSubtext>
                    You dont have any bookings yet. When you do, you can see
                    your top performing classes here.
                  </EmptyStateSubtext>
                </EmptyStateContainer>
              ) : isMobile ? (
                <div style={{ padding: "0 16px 16px" }}>
                  {analytics.class_insights.popular_classes.map((c) => (
                    <MobileClassCard
                      key={c.class_name}
                      style={{ marginTop: 12 }}
                    >
                      <Text strong>{c.class_name}</Text>
                      <Row gutter={16} style={{ marginTop: 12 }}>
                        <Col span={8}>
                          <Text type="secondary">Spots</Text>
                          <div>{c.total_participant_spots}</div>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary">Revenue</Text>
                          <div>${c.total_revenue?.toLocaleString()}</div>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary">Bookers</Text>
                          <div>{c.unique_bookers}</div>
                        </Col>
                      </Row>
                    </MobileClassCard>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <StyledTable>
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Booked Spots</th>
                        <th>Revenue</th>
                        <th>Unique Bookers</th>
                        <th>Cancel %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.class_insights.popular_classes.map((c) => (
                        <tr key={c.class_name}>
                          <td>
                            <Text strong>{c.class_name}</Text>
                          </td>
                          <td>{c.total_participant_spots}</td>
                          <td>${c.total_revenue?.toLocaleString()}</td>
                          <td>{c.unique_bookers}</td>
                          <td>{c.cancellation_rate_by_spots?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </StyledTable>
                </div>
              )}
            </TableWrapper>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard>
              <ChartTitle>
                <PieIcon size={18} /> Booking Type Distribution
              </ChartTitle>
              <ChartDescription>
                Breakdown by single session vs. full course.
              </ChartDescription>
              <ChartContainer>
                {loading ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !analytics.booking_patterns?.booking_types?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/idcmwtrd.json"
                        trigger="in"
                        delay="500"
                        state="in-label"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Bookings Found</EmptyStateText>
                    <EmptyStateSubtext>
                      You don't currently have any bookings. When you do, you
                      can see booking distribution here.
                    </EmptyStateSubtext>
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
                        innerRadius="50%"
                        outerRadius="80%"
                        paddingAngle={2}
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
                          )
                        )}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [`${value} spots`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
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
