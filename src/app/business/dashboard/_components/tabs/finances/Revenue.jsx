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
  Lock,
  LayoutGrid,
  Receipt,
} from "lucide-react";
import {
  DatePicker,
  Typography,
  Card,
  Tooltip,
  Button,
  Select,
  Segmented,
  Skeleton,
  Row,
  Col,
  Divider,
  Grid,
  Table,
} from "antd";
import message from "@/lib/message";
import { useSubscription } from "@/context/SubscriptionContext";
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
import { ResponsiveDateRangePicker } from "@/components/common/mobile/MobilePickers";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import {
  MetricPeriodBadge,
  formatDayjsRangeBadge,
} from "../../shared/MetricPeriodBadge";
import ExportReportModal from "./ExportReportModal";
import { TAX_DISCLAIMER, TAX_TABLE_INTRO, TAX_TOOLTIPS } from "./revenueTaxCopy";

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
  flex-wrap: wrap;
  @media (max-width: 992px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SourceSegmentedWrapper = styled.div`
  width: fit-content;
  display: flex;
  align-items: center;
  .ant-segmented {
    font-size: 12px;
  }
  .ant-segmented-item-label {
    font-size: 12px;
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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 130px;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

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

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
  line-height: 1.25;
  letter-spacing: -0.3px;
  @media (max-width: 768px) {
    font-size: 21px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 14px;
  color: #6b7280;
  display: block;
  line-height: 1.5;
  margin: 0;
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const IconContainer = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};
  flex-shrink: 0;
  svg {
    width: 16px;
    height: 16px;
  }
  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: baseline;
  line-height: 1.2;
  letter-spacing: -0.2px;
  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
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

const PercentChange = styled.span`
  color: ${(props) => (props.$isPositive ? colors.success : colors.error)};
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
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
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const ChartTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  letter-spacing: -0.1px;
`;

const ChartDescription = styled.p`
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  font-weight: 400;
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
  @media (max-width: 768px) {
    lord-icon {
      width: 64px;
      height: 64px;
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
    source: "all",
  });
  const { loading: subscriptionLoading, hasWidgetAnalytics } = useSubscription();
  const [analytics, setAnalytics] = useState({
    metrics: {
      total_gross_revenue: 0,
      estimated_platform_fees: 0,
      platform_commission: 0,
      stripe_processing_fees: 0,
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
    monthly_tax_breakdown: [],
  });
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
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
        source: currentFilters.source || "all",
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
    if (subscriptionLoading) return;
    if (filterParams.source === "marketplace") {
      setFilterParams((prev) =>
        prev.source === "marketplace" ? { ...prev, source: "all" } : prev
      );
      return;
    }
    if (filterParams.source === "widget" && !hasWidgetAnalytics) {
      setFilterParams((prev) =>
        prev.source === "widget" ? { ...prev, source: "all" } : prev
      );
    }
  }, [subscriptionLoading, filterParams.source, hasWidgetAnalytics]);

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

  const handleSourceChange = (value) => {
    if (value === "widget" && !hasWidgetAnalytics) {
      message.info("Upgrade to the Growth plan to view widget-specific analytics.");
      return;
    }
    setFilterParams((prev) => ({ ...prev, source: value }));
  };

  const handleExportClick = () => {
    if (!filterParams.startDate || !filterParams.endDate) {
      message.warning("Please select date range.");
      return;
    }
    setExportModalOpen(true);
  };

  const handleConfirmExport = async ({
    reportType,
    format,
    startDate,
    endDate,
  }) => {
    setExporting(true);
    message.loading({
      content: "Generating report...",
      key: "exportRevenue",
    });
    try {
      const result = await revenueService.exportRevenueReport({
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        class_id: filterParams.classId || undefined,
        source: filterParams.source || "all",
        report_type: reportType,
        format,
      });
      if (result.success) {
        message.success({
          content: "Report downloaded!",
          key: "exportRevenue",
        });
        setExportModalOpen(false);
      } else {
        message.error({
          content: result.error || "Export failed.",
          key: "exportRevenue",
        });
      }
    } catch {
      message.error({
        content: "An error occurred.",
        key: "exportRevenue",
      });
    } finally {
      setExporting(false);
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
      key: "platform_commission",
      title: "ClassEasily plan fee",
      value:
        analytics.metrics.platform_commission ??
        analytics.metrics.estimated_platform_fees,
      prefix: "$",
      icon: <TrendingDown size={20} />,
      color: colors.chart.red,
      background: `rgba(239, 68, 68, 0.1)`,
      footer: "ClassEasily fee",
      tooltip: TAX_TOOLTIPS.platformCommissionStat,
    },
    {
      key: "stripe_processing_fees",
      title: "Card Processing",
      value: analytics.metrics.stripe_processing_fees ?? 0,
      prefix: "$",
      icon: <Receipt size={20} />,
      color: colors.textSecondary,
      background: `rgba(100, 116, 139, 0.12)`,
      footer: "Processing est. 2.9% + 30¢",
    },
    {
      key: "estimated_net_revenue",
      title: "Est. Net Revenue",
      value: analytics.metrics.estimated_net_revenue,
      prefix: "$",
      icon: <TrendingUp size={20} />,
      color: colors.chart.blue,
      background: `rgba(59, 130, 246, 0.1)`,
      footer: "After commission and card processing",
    },
    {
      key: "average_order_value",
      title: "Avg. Order Value",
      value: analytics.metrics.average_order_value,
      prefix: "$",
      icon: <CreditCard size={20} />,
      color: colors.chart.purple,
      background: `rgba(139, 92, 246, 0.1)`,
      footer: "Per booking",
    },
    {
      key: "revenue_per_booker",
      title: "Revenue Per Booker",
      value: analytics.metrics.revenue_per_booker,
      prefix: "$",
      icon: <Users size={20} />,
      color: colors.chart.orange,
      background: `rgba(249, 115, 22, 0.1)`,
      footer: "Per booker",
    },
    {
      key: "revenue_per_spot",
      title: "Revenue Per Spot",
      value: analytics.metrics.revenue_per_spot,
      prefix: "$",
      icon: <Percent size={20} />,
      color: colors.chart.teal,
      background: `rgba(20, 184, 166, 0.1)`,
      footer: "Per spot",
    },
  ];

  const metricsPeriodLabel = useMemo(
    () => formatDayjsRangeBadge(filterParams.startDate, filterParams.endDate),
    [filterParams.startDate, filterParams.endDate],
  );

  const monthlyTaxColumns = useMemo(
    () => [
      {
        title: "Month",
        dataIndex: "month",
        key: "month",
        render: (m) => dayjs(m + "-01").format("MMM YYYY"),
      },
      {
        title: (
          <span>
            Your sales (before tax){" "}
            <Tooltip title={TAX_TOOLTIPS.salesPreTax}>
              <Info
                size={12}
                style={{ color: "#9ca3af", cursor: "help", verticalAlign: "middle" }}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "subtotal",
        key: "subtotal",
        align: "right",
        render: (v) => `$${Number(v).toFixed(2)}`,
      },
      {
        title: (
          <span>
            HST on your sales{" "}
            <Tooltip title={TAX_TOOLTIPS.hstOnYourSales}>
              <Info
                size={12}
                style={{ color: "#9ca3af", cursor: "help", verticalAlign: "middle" }}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "hst_on_your_sales",
        key: "hst_on_your_sales",
        align: "right",
        render: (v, row) => {
          const amt =
            v != null
              ? v
              : (row.hst_collected ?? 0) - (row.hst_on_commission ?? 0);
          return `$${Number(amt).toFixed(2)}`;
        },
      },
      {
        title: (
          <span>
            ClassEasily fee{" "}
            <Tooltip title={TAX_TOOLTIPS.commission}>
              <Info
                size={12}
                style={{ color: "#9ca3af", cursor: "help", verticalAlign: "middle" }}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "commission",
        key: "commission",
        align: "right",
        render: (v) => `$${Number(v).toFixed(2)}`,
      },
      {
        title: (
          <span style={{ fontWeight: 600 }}>
            HST on ClassEasily fee (ITC){" "}
            <Tooltip title={TAX_TOOLTIPS.hstOnCommission}>
              <Info
                size={12}
                style={{ color: "#ff385c", cursor: "help", verticalAlign: "middle" }}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "hst_on_commission",
        key: "hst_on_commission",
        align: "right",
        render: (v) => (
          <span style={{ fontWeight: 600, color: colors.primary }}>
            ${Number(v).toFixed(2)}
          </span>
        ),
      },
      {
        title: (
          <span>
            Card processing{" "}
            <Tooltip title={TAX_TOOLTIPS.stripeFees}>
              <Info
                size={12}
                style={{ color: "#9ca3af", cursor: "help", verticalAlign: "middle" }}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "stripe_fees",
        key: "stripe_fees",
        align: "right",
        render: (v) => `$${Number(v).toFixed(2)}`,
      },
      {
        title: (
          <span>
            Net deposited to you{" "}
            <Tooltip title={TAX_TOOLTIPS.netPayout}>
              <Info
                size={12}
                style={{ color: "#9ca3af", cursor: "help", verticalAlign: "middle" }}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "net_payout",
        key: "net_payout",
        align: "right",
        render: (v) => `$${Number(v).toFixed(2)}`,
      },
    ],
    [],
  );

  return (
    <DashboardWrapper ref={mainContentRef}>
        <DashboardBreadcrumb title="Revenue" />
        <DashboardHeader>
          <div>
            <PageTitle>Revenue Analytics</PageTitle>
            <HeaderSubtitle>
              {filterParams.source === "widget"
                ? "Widget bookings only — revenue from your embedded booking widget."
                : filterParams.source === "membership"
                ? "Membership payments only — recurring revenue from member subscriptions."
                : "Track revenue performance and growth insights across all channels."}
            </HeaderSubtitle>
          </div>
          <Controls>
            <SourceSegmentedWrapper>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 8 }}>
                Channel
              </span>
              <Segmented
                value={filterParams.source}
                onChange={handleSourceChange}
                size="small"
                options={[
                  {
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <LayoutGrid size={13} />
                        All
                      </span>
                    ),
                    value: "all",
                  },
                  ...(hasWidgetAnalytics
                    ? [
                        {
                          label: (
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ fontSize: 12 }}>⚡</span>
                              Widget
                            </span>
                          ),
                          value: "widget",
                        },
                      ]
                    : []),
                  {
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Users size={13} />
                        Membership
                      </span>
                    ),
                    value: "membership",
                  },
                ]}
              />
            </SourceSegmentedWrapper>
            <ResponsiveDateRangePicker
              isMobile={isMobile}
              value={[filterParams.startDate, filterParams.endDate]}
              onChange={handleDateChange}
              format="MMM D, YYYY"
              allowClear={false}
              renderDesktop={(rp) => (
                <StyledRangePicker {...rp} format="MMM D, YYYY" allowClear={false} />
              )}
            />
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
            <Tooltip title="Download a tax summary or detailed revenue report.">
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={handleExportClick}
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
                      <MetricPeriodBadge>{metricsPeriodLabel}</MetricPeriodBadge>
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <div>
                    <StatValue>
                      {stat.tooltip ? (
                        <Tooltip title={stat.tooltip}>
                          <span style={{ cursor: "help" }}>
                            {stat.prefix}
                            <NumberFlow
                              value={isReadyForAnimation ? stat.value || 0 : 0}
                              duration={800}
                              numberFormatOptions={{
                                maximumFractionDigits:
                                  stat.key === "total_gross_revenue" ? 0 : 2,
                              }}
                            />
                          </span>
                        </Tooltip>
                      ) : (
                        <>
                          {stat.prefix}
                          <NumberFlow
                            value={isReadyForAnimation ? stat.value || 0 : 0}
                            duration={800}
                            numberFormatOptions={{
                              maximumFractionDigits:
                                stat.key === "total_gross_revenue" ? 0 : 2,
                            }}
                          />
                        </>
                      )}
                    </StatValue>
                    {stat.change !== undefined && stat.change !== null ? (
                      <StatFooter style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: 4 }}>
                        <PercentChange $isPositive={stat.change >= 0}>
                          {stat.change >= 0 ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}
                          {Math.abs(stat.change).toFixed(1)}%{stat.footer ? ` ${stat.footer}` : ""}
                        </PercentChange>
                      </StatFooter>
                    ) : (
                      stat.footer && <StatFooter>{stat.footer}</StatFooter>
                    )}
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
                <Receipt size={15} style={{ color: colors.textSecondary }} />
                Monthly tax breakdown (HST)
              </ChartTitle>
            </ChartTitleRow>
            <ChartDescription>
              {TAX_TABLE_INTRO} Use Export for a file to share with your accountant.
            </ChartDescription>
          </ChartHeader>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 12 }}
          >
            {TAX_DISCLAIMER}
          </Text>
          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : !analytics.monthly_tax_breakdown?.length ? (
            <EmptyStateContainer style={{ minHeight: 120 }}>
              <EmptyStateText>No tax data for this period</EmptyStateText>
            </EmptyStateContainer>
          ) : (
            <Table
              dataSource={analytics.monthly_tax_breakdown.map((row) => ({
                ...row,
                key: row.month,
              }))}
              columns={monthlyTaxColumns}
              pagination={false}
              size="small"
              scroll={{ x: 960 }}
            />
          )}
        </ChartCard>

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
                  colors="primary:#94a3b8"
                  size="15px"
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
                    colors="primary:#94a3b8"
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
                    dataKey="platform_commission"
                    name="Platform commission"
                    stroke={colors.chart.red}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="stripe_processing_fees"
                    name="Card processing"
                    stroke={colors.chart.orange}
                    strokeWidth={2}
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
                      colors="primary:#94a3b8"
                      size="15px"
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
                        name="Direct (non-widget)"
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
                      colors="primary:#94a3b8"
                      size="15px"
                    />
                    Revenue Source
                  </ChartTitle>
                  {!loading && topSourceInsight && (
                    <InsightBadge>
                      Top: <strong>{topSourceInsight.name}</strong>
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>Widget vs. direct bookings.</ChartDescription>
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

        <ExportReportModal
          open={exportModalOpen}
          onCancel={() => setExportModalOpen(false)}
          onExport={handleConfirmExport}
          exporting={exporting}
          dashboardStartDate={filterParams.startDate}
          dashboardEndDate={filterParams.endDate}
        />
      </DashboardWrapper>
  );
});

export default Revenue;
