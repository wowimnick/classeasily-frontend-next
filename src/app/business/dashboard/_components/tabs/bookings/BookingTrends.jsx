"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Filter,
  Info,
  Lock,
  Globe,
  LayoutGrid,
  ChevronDown,
  Mail,
  Phone,
  X,
} from "lucide-react";
import {
  DatePicker,
  Typography,
  Card,
  Select,
  Empty,
  Row,
  Col,
  Divider,
  Grid,
  Tooltip as AntTooltip,
  Segmented,
  Tag,
} from "antd";
import message from "@/lib/message";
import { useSubscription } from "@/context/SubscriptionContext";
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
import { LordIcon } from "@/services/ReactUtils";
import { ResponsiveDateRangePicker } from "@/components/common/mobile/MobilePickers";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import {
  AdminMetricCardsSkeleton,
  AdminAreaChartSkeleton,
  AdminPieChartSkeleton,
  AdminTableSkeleton,
} from "@/app/admin/_components/shared/AdminSkeletons";
import {
  MetricPeriodBadge,
  formatDayjsRangeBadge,
} from "../../shared/MetricPeriodBadge";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";

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
  background: ${(props) => props.background};
  color: ${(props) => props.color};
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
  margin-bottom: 4px;
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
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
  }
  th {
    font-weight: 600;
    font-size: 11px;
    color: #64748b;
    background-color: ${colors.lightBg};
    position: sticky;
    top: 0;
    z-index: 10;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 10px 14px;
  }
  tbody tr:hover {
    background-color: ${colors.lightBg};
  }
  tr:last-child td {
    border-bottom: none;
  }
  @media (max-width: 768px) {
    th {
      padding: 8px 12px;
      font-size: 10px;
    }
    td {
      padding: 10px 12px;
      font-size: 12px;
    }
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

const FunnelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 4px;
`;

const FunnelEmptyNotice = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  line-height: 1.45;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: ${colors.lightBg};
  border-radius: 8px;
  border: 1px solid ${colors.border};
`;

const FunnelSummaryRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  @media (max-width: 400px) {
    flex-direction: column;
  }
`;

const FunnelSummaryPill = styled.div`
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${(props) => props.$bg || colors.lightBg};
  border: 1px solid ${colors.border};
`;

const FunnelSummaryLabel = styled.div`
  font-size: 11px;
  color: ${colors.textSecondary};
  font-weight: 600;
  margin-bottom: 2px;
`;

const FunnelSummaryValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.textPrimary};
`;

const FunnelStepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  padding: 2px 0 6px;
  gap: 0;
`;

const FunnelStepBlock = styled.div`
  width: 100%;
`;

const FunnelStepLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textPrimary};
  line-height: 1.35;
  margin-bottom: 5px;
  word-break: break-word;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const FunnelBarLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const FunnelBarTrack = styled.div`
  flex: 1;
  min-width: 0;
  height: 28px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
`;

const FunnelBarFill = styled.div`
  height: 100%;
  width: ${(props) => props.$widthPct}%;
  min-width: ${(props) => (props.$hasSessions ? "6px" : "0")};
  background: ${(props) => props.$color};
  border-radius: 8px;
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
`;

const FunnelBarCountLabel = styled.div`
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: ${colors.textPrimary};
  font-variant-numeric: tabular-nums;
  min-width: 1.5rem;
  text-align: right;
  line-height: 1;
`;

const FunnelDropOffIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 4px;
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
`;

const GuestDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const GuestDrawerMobile = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 88%;
  max-height: 92vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const GuestDrawerDesktop = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: min(92vw, 440px);
  background: #fff;
  border-radius: 16px;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const GuestDrawerHandle = styled(Drawer.Handle)`
  width: 40px;
  height: 5px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
  margin: 12px auto 6px;
  flex-shrink: 0;
`;

const GuestDrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 12px 20px 14px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const GuestDrawerTitleBlock = styled.div`
  min-width: 0;
`;

const GuestDrawerTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const GuestDrawerSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${colors.textSecondary};
  line-height: 1.45;
`;

const GuestDrawerClose = styled.button`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: ${colors.lightBg};
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background: #eef2f7;
    color: ${colors.textPrimary};
  }
`;

const GuestDrawerSegmentRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 20px 12px;
  flex-shrink: 0;
`;

const GuestSegmentBtn = styled.button`
  flex: 1;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${colors.border};
  background: ${(p) => (p.$active ? "rgba(255, 56, 92, 0.08)" : "#fff")};
  color: ${(p) => (p.$active ? colors.primary : colors.textSecondary)};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  ${(p) =>
    p.$active &&
    `
    border-color: rgba(255, 56, 92, 0.35);
  `}
`;

const GuestDrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 20px;
  background: ${colors.lightBg};
  -webkit-overflow-scrolling: touch;
`;

const GuestCard = styled.div`
  background: #fff;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
`;

const GuestCardName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 8px;
  word-break: break-word;
`;

const GuestCardMeta = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  line-height: 1.55;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GuestCardRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const GuestCardIcon = styled.span`
  flex-shrink: 0;
  margin-top: 2px;
  color: #94a3b8;
  display: flex;
`;

const FunnelDeviceRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const FunnelDevicePill = styled.div`
  flex: 1;
  min-width: 90px;
  padding: 8px 10px;
  border-radius: 8px;
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  font-size: 11px;
  color: ${colors.textSecondary};
  line-height: 1.5;

  strong {
    color: ${colors.textPrimary};
  }
`;

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

function formatDurationSeconds(sec) {
  if (sec == null || !Number.isFinite(Number(sec))) return "—";
  const n = Number(sec);
  if (n < 60) return `${Math.round(n)}s`;
  const m = Math.floor(n / 60);
  const s = Math.round(n % 60);
  return `${m}m ${s}s`;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FUNNEL_BAR_COLORS = [
  colors.chart.darkBlue,
  colors.chart.blue,
  colors.chart.teal,
  colors.chart.green,
  colors.chart.orange,
  colors.chart.purple,
  colors.chart.green,
];

const BookingTrends = () => {
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
    summary: {},
    trends: [],
    class_insights: { popular_classes: [] },
    booking_patterns: { time_distribution: [], booking_types: [] },
    widget_funnel: null,
    guest_type_bookings: { new: [], returning: [], max_per_segment: 300 },
  });
  const [guestTypeDrawerOpen, setGuestTypeDrawerOpen] = useState(false);
  const [guestTypeDrawerSegment, setGuestTypeDrawerSegment] = useState("new");
  const [businessClasses, setBusinessClasses] = useState([
    { value: "all", label: "All Experiences" },
  ]);
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
        const seen = new Set();
        const uniqueClasses = result.data.class_insights.popular_classes
          .map((c) => ({
            value: c.class_id ?? c.classId,
            label: c.class_name,
          }))
          .filter((row) => {
            if (row.value == null || row.label == null) return false;
            if (seen.has(row.value)) return false;
            seen.add(row.value);
            return true;
          });
        setBusinessClasses([
          { value: "all", label: "All Experiences" },
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
          source: currentFilters.source || "all",
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
    if (subscriptionLoading) return;
    if (filterParams.source === "widget" && !hasWidgetAnalytics) {
      setFilterParams((p) =>
        p.source === "widget" ? { ...p, source: "all" } : p,
      );
    }
  }, [subscriptionLoading, hasWidgetAnalytics, filterParams.source]);

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
      classId:
        value === undefined || value === null || value === "all"
          ? null
          : value,
    }));
  };

  const handleSourceChange = (value) => {
    if (value === "widget" && !hasWidgetAnalytics) {
      message.info("Upgrade to the Growth plan to view widget-specific analytics.");
      return;
    }
    setFilterParams((p) => ({ ...p, source: value }));
  };

  // --- Insight Helpers ---
  const peakHourInsight = useMemo(() => {
    const data = analytics.booking_patterns?.time_distribution || [];
    if (!data.length) return null;
    const hourTotal = (row) =>
      (row.active_participant_spots || 0) + (row.cancelled_participant_spots || 0);
    const peak = data.reduce((prev, current) =>
      hourTotal(prev) > hourTotal(current) ? prev : current,
    );
    return hourTotal(peak) > 0
      ? {
          time: dayjs().hour(peak.hour).format("h A"),
          count: hourTotal(peak),
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

  const bookingsByWeekday = useMemo(() => {
    const trends = analytics.trends || [];
    const byDow = [0, 0, 0, 0, 0, 0, 0];
    trends.forEach((t) => {
      const d = dayjs(t.date).day();
      byDow[d] += t.new_participant_spots || 0;
    });
    return WEEKDAY_LABELS.map((name, i) => ({
      name,
      spots: byDow[i],
    }));
  }, [analytics.trends]);

  const widgetFunnelStepsForChart = useMemo(() => {
    const steps = analytics.widget_funnel?.steps;
    if (!Array.isArray(steps)) return [];
    return steps.map((s, i) => ({
      ...s,
      fill: FUNNEL_BAR_COLORS[i % FUNNEL_BAR_COLORS.length],
    }));
  }, [analytics.widget_funnel]);

  // Funnel is returned only for Growth/Advanced on the API — trust the response,
  // not a duplicate subscription check (avoids missing chart when planId shape differs).
  const showWidgetFunnelPanel =
    filterParams.source !== "direct" &&
    analytics.widget_funnel != null &&
    Array.isArray(analytics.widget_funnel.steps) &&
    analytics.widget_funnel.steps.length > 0;

  const hasWidgetFunnelActivity = widgetFunnelStepsForChart.some(
    (s) => (s.session_count || 0) > 0,
  );

  const funnelChartMaxSessions = useMemo(() => {
    const m = Math.max(
      0,
      ...widgetFunnelStepsForChart.map((s) => s.session_count || 0),
    );
    return m < 1 ? 1 : m;
  }, [widgetFunnelStepsForChart]);

  const statisticCards = [
    {
      key: "total_participant_spots",
      title: "Total Client Spots",
      value: analytics.summary.total_participant_spots,
      icon: <Calendar size={20} />,
      color: colors.chart.blue,
      background: `rgba(59, 130, 246, 0.1)`,
      footer: "In this period",
    },
    {
      key: "booker_retention_rate",
      title: "Client Retention",
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
      value: analytics.summary.cancellation_rate_by_spots ?? analytics.summary.cancellation_rate_by_transaction,
      suffix: "%",
      icon: <AlertCircle size={20} />,
      color: colors.chart.red,
      background: `rgba(239, 68, 68, 0.1)`,
      footer: "% of spots cancelled",
    },
    {
      key: "no_show_rate",
      title: "No-show Rate",
      value: analytics.summary.no_show_rate,
      suffix: "%",
      icon: <Users size={20} />,
      color: colors.chart.orange,
      background: `rgba(249, 115, 22, 0.1)`,
      footer: "Of marked attendance",
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

  const guestTypeData = useMemo(
    () => [
      {
        type: "New Clients",
        segment: "new",
        value: analytics.summary.new_student_bookings || 0,
        color: colors.chart.teal,
      },
      {
        type: "Returning",
        segment: "returning",
        value: analytics.summary.returning_student_bookings || 0,
        color: colors.chart.blue,
      },
    ],
    [
      analytics.summary.new_student_bookings,
      analytics.summary.returning_student_bookings,
    ],
  );

  const guestTypeDrawerList = useMemo(() => {
    const raw = analytics.guest_type_bookings;
    if (!raw) return [];
    return guestTypeDrawerSegment === "new"
      ? raw.new || []
      : raw.returning || [];
  }, [analytics.guest_type_bookings, guestTypeDrawerSegment]);

  const guestTypeMaxCap =
    analytics.guest_type_bookings?.max_per_segment ?? 300;

  const openGuestTypeDrawer = useCallback((segment) => {
    setGuestTypeDrawerSegment(segment);
    setGuestTypeDrawerOpen(true);
  }, []);

  const handleGuestDrawerOpenChange = useCallback((open) => {
    if (!open) setGuestTypeDrawerOpen(false);
  }, []);

  const handlePieSectorClick = useCallback(
    (data) => {
      if (!data || !(data.value > 0)) return;
      let seg = data.segment;
      if (seg !== "new" && seg !== "returning") {
        if (data.type === "New Clients" || data.type === "New Guests") seg = "new";
        else if (data.type === "Returning") seg = "returning";
      }
      if (seg === "new" || seg === "returning") openGuestTypeDrawer(seg);
    },
    [openGuestTypeDrawer],
  );

  const metricsPeriodLabel = useMemo(
    () => formatDayjsRangeBadge(filterParams.startDate, filterParams.endDate),
    [filterParams.startDate, filterParams.endDate],
  );

  const guestTypeDrawerInner = (
    <>
      <GuestDrawerHeader style={isMobile ? undefined : { paddingTop: 20 }}>
        <GuestDrawerTitleBlock>
          <GuestDrawerTitle>Client details</GuestDrawerTitle>
          <GuestDrawerSubtitle>
            Bookings in this period (cancelled excluded). Use for follow-ups and
            campaigns.
          </GuestDrawerSubtitle>
        </GuestDrawerTitleBlock>
        <GuestDrawerClose
          type="button"
          aria-label="Close"
          onClick={() => setGuestTypeDrawerOpen(false)}
        >
          <X size={18} />
        </GuestDrawerClose>
      </GuestDrawerHeader>
      <GuestDrawerSegmentRow style={isMobile ? undefined : { paddingTop: 0 }}>
        <GuestSegmentBtn
          type="button"
          $active={guestTypeDrawerSegment === "new"}
          onClick={() => setGuestTypeDrawerSegment("new")}
        >
          New guests
        </GuestSegmentBtn>
        <GuestSegmentBtn
          type="button"
          $active={guestTypeDrawerSegment === "returning"}
          onClick={() => setGuestTypeDrawerSegment("returning")}
        >
          Returning
        </GuestSegmentBtn>
      </GuestDrawerSegmentRow>
      <GuestDrawerBody>
        {guestTypeDrawerList.length === 0 ? (
          <Text type="secondary" style={{ display: "block", padding: 8 }}>
            No matching bookings in this segment for the selected filters.
          </Text>
        ) : (
          <>
            {guestTypeDrawerList.length >= guestTypeMaxCap && (
              <Text
                type="secondary"
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 12,
                  lineHeight: 1.45,
                }}
              >
                Showing the {guestTypeMaxCap} most recent bookings in this
                segment.
              </Text>
            )}
            {guestTypeDrawerList.map((row) => (
              <GuestCard key={row.booking_id}>
                <GuestCardName>{row.guest_name || "Guest"}</GuestCardName>
                <GuestCardMeta>
                  {row.email ? (
                    <GuestCardRow>
                      <GuestCardIcon>
                        <Mail size={14} />
                      </GuestCardIcon>
                      <span>{row.email}</span>
                    </GuestCardRow>
                  ) : null}
                  {row.phone ? (
                    <GuestCardRow>
                      <GuestCardIcon>
                        <Phone size={14} />
                      </GuestCardIcon>
                      <span>{row.phone}</span>
                    </GuestCardRow>
                  ) : null}
                  <div>
                    <Text strong style={{ fontSize: 12 }}>
                      {row.class_name || "Experience"}
                    </Text>
                  </div>
                  <div>
                    Spots: {row.participants} · Paid: $
                    {Number(row.amount_paid || 0).toFixed(2)}
                  </div>
                  {row.booking_date ? (
                    <div>
                      Booked{" "}
                      {dayjs(row.booking_date).format("MMM D, YYYY h:mm A")}
                    </div>
                  ) : null}
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Tag>{row.status}</Tag>
                    <Tag color="blue">{row.payment_status}</Tag>
                  </div>
                </GuestCardMeta>
              </GuestCard>
            ))}
          </>
        )}
      </GuestDrawerBody>
    </>
  );

  return (
    <DashboardWrapper>
        <DashboardBreadcrumb title="Booking Trends" />
        <DashboardHeader>
          <div>
            <PageTitle>Booking Trends & Insights</PageTitle>
            <HeaderSubtitle>
              {filterParams.source === "widget"
                ? "Widget bookings only — from your embedded booking widget."
                : "Analyze booking patterns and client engagement across all sources."}
            </HeaderSubtitle>
          </div>
          <Controls>
            {hasWidgetAnalytics && (
              <Segmented
                value={filterParams.source}
                onChange={handleSourceChange}
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
                  {
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 12 }}>⚡</span>
                        Widget
                      </span>
                    ),
                    value: "widget",
                  },
                ]}
              />
            )}
            <ResponsiveDateRangePicker
              isMobile={isMobile}
              value={[filterParams.startDate, filterParams.endDate]}
              onChange={handleDateChange}
              format="MMM D, YYYY"
              renderDesktop={(rp) => <StyledRangePicker {...rp} />}
            />
            <ClassFilterSelect
              placeholder="Filter by Experience"
              value={
                filterParams.classId == null ? "all" : filterParams.classId
              }
              onChange={handleClassFilterChange}
              options={businessClasses}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Controls>
        </DashboardHeader>

        <ResponsiveDivider />

        {loading ? (
          <AdminMetricCardsSkeleton count={5} />
        ) : (
          <StatsGrid>
            {statisticCards.map((stat) => (
              <StatCard key={stat.key}>
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
              </StatCard>
            ))}
          </StatsGrid>
        )}

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
                  colors="primary:#94a3b8"
                  size="15px"
                  playOnLoad={true}
                />
                Daily Booking Activity
              </ChartTitle>
            </ChartTitleRow>
            <ChartDescription>
              New spots, net after cancels, cancel %.
            </ChartDescription>
          </ChartHeader>

          <ChartContainer>
            {loading ? (
              <div style={{ width: "100%", height: 380 }}>
                <AdminAreaChartSkeleton height={380} />
              </div>
            ) : !analytics.trends?.length ? (
              <EmptyStateContainer>
                <EmptyStateIcon>
                  <lord-icon
                    src="https://cdn.lordicon.com/uoljexdg.json"
                    trigger="in"
                    colors="primary:#94a3b8"
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
                    name="Cancel rate"
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

        <Row gutter={[24, 24]} align="top">
          {/* Left: Popular times + Top experiences stacked (fills space beside tall funnel) */}
          <Col
            xs={24}
            lg={16}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/okqjaags.json"
                      trigger="in"
                      delay="500"
                      state="in-clock"
                      colors="primary:#94a3b8"
                      size="15px"
                    />
                    Popular Booking Times
                  </ChartTitle>
                  {!loading && peakHourInsight && (
                    <InsightBadge>
                      Peak: <strong>{peakHourInsight.time}</strong> (
                      {peakHourInsight.count} spots)
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>
                  Spots by hour.
                </ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <div style={{ width: "100%", height: 300 }}>
                    <AdminAreaChartSkeleton height={300} />
                  </div>
                ) : !analytics.booking_patterns?.time_distribution?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/okqjaags.json"
                        trigger="in"
                        colors="primary:#94a3b8"
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
                        dataKey="active_participant_spots"
                        name="Booked"
                        fill={colors.chart.blue}
                        stackId="a"
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="cancelled_participant_spots"
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

            <TableWrapper>
              <TableHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <TrendingUp size={15} color="#d1d5db" />
                    Top Performing Experiences
                  </ChartTitle>
                </ChartTitleRow>
                <ChartDescription>
                  By guest spots.
                </ChartDescription>
              </TableHeader>
              {loading ? (
                <div style={{ padding: "0 16px 16px" }}>
                  <AdminTableSkeleton rows={5} columns={4} />
                </div>
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

          {/* Right: Widget funnel + Guest type stacked */}
          <Col
            xs={24}
            lg={8}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            <ChartCard style={{ height: "auto", minHeight: 440 }}>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    {showWidgetFunnelPanel ? (
                      <Filter size={15} color="#d1d5db" />
                    ) : (
                      <BarChart2 size={15} color="#d1d5db" />
                    )}
                    {showWidgetFunnelPanel
                      ? "Widget Booking Funnel"
                      : "Bookings by Weekday"}
                  </ChartTitle>
                  {showWidgetFunnelPanel && hasWidgetFunnelActivity && (
                    <InsightBadge>
                      Conv.:{" "}
                      <strong>
                        {analytics.widget_funnel?.summary?.conversion_pct ?? 0}%
                      </strong>
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>
                  {showWidgetFunnelPanel ? (
                    "Sessions at each step of your embedded widget."
                  ) : (
                    <>
                      Guest spots by weekday when bookings were made.
                      {!hasWidgetAnalytics && (
                        <span
                          style={{
                            display: "block",
                            marginTop: 6,
                            fontSize: 11,
                            color: colors.textSecondary,
                          }}
                        >
                          The widget booking funnel appears here on Growth and
                          Advanced plans.
                        </span>
                      )}
                    </>
                  )}
                </ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loading ? (
                  <div
                    style={{
                      width: "100%",
                      height: 320,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AdminAreaChartSkeleton height={280} />
                  </div>
                ) : showWidgetFunnelPanel ? (
                  <FunnelWrapper>
                    <FunnelSummaryRow>
                      <FunnelSummaryPill $bg="rgba(59, 130, 246, 0.06)">
                        <FunnelSummaryLabel>Checkout abandon</FunnelSummaryLabel>
                        <FunnelSummaryValue>
                          {analytics.widget_funnel?.summary
                            ?.checkout_abandonment_pct ?? 0}
                          %
                        </FunnelSummaryValue>
                      </FunnelSummaryPill>
                      <FunnelSummaryPill $bg="rgba(16, 185, 129, 0.06)">
                        <FunnelSummaryLabel>
                          Avg. time to book
                        </FunnelSummaryLabel>
                        <FunnelSummaryValue>
                          {formatDurationSeconds(
                            analytics.widget_funnel?.summary
                              ?.avg_time_to_book_seconds,
                          )}
                        </FunnelSummaryValue>
                      </FunnelSummaryPill>
                    </FunnelSummaryRow>
                    <FunnelStepsContainer>
                      {widgetFunnelStepsForChart.map((step, i) => {
                        const widthPct =
                          funnelChartMaxSessions > 0
                            ? (step.session_count / funnelChartMaxSessions) * 100
                            : 0;
                        const nextDrop =
                          widgetFunnelStepsForChart[i + 1]
                            ?.drop_off_from_prev_pct;
                        return (
                          <FunnelStepBlock key={step.event}>
                            <AntTooltip title={step.label}>
                              <FunnelStepLabel>{step.label}</FunnelStepLabel>
                            </AntTooltip>
                            <FunnelBarLine>
                              <FunnelBarTrack>
                                <FunnelBarFill
                                  $widthPct={widthPct}
                                  $hasSessions={(step.session_count || 0) > 0}
                                  $color={step.fill}
                                />
                              </FunnelBarTrack>
                              <FunnelBarCountLabel>
                                {step.session_count}
                              </FunnelBarCountLabel>
                            </FunnelBarLine>
                            {i < widgetFunnelStepsForChart.length - 1 && (
                              <FunnelDropOffIndicator>
                                <ChevronDown
                                  size={22}
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                                <span>
                                  {nextDrop != null
                                    ? `${nextDrop}% drop-off`
                                    : "Next step"}
                                </span>
                              </FunnelDropOffIndicator>
                            )}
                          </FunnelStepBlock>
                        );
                      })}
                    </FunnelStepsContainer>
                    {(analytics.widget_funnel?.device_breakdown || []).length >
                      0 && (
                      <FunnelDeviceRow>
                        {analytics.widget_funnel.device_breakdown.map((row) => (
                          <FunnelDevicePill key={row.device_type}>
                            <div
                              style={{
                                textTransform: "capitalize",
                                fontWeight: 600,
                                marginBottom: 1,
                              }}
                            >
                              {row.device_type || "unknown"}
                            </div>
                            <strong>{row.sessions_opened}</strong> opened ·{" "}
                            <strong>{row.conversion_pct ?? 0}%</strong> conv.
                          </FunnelDevicePill>
                        ))}
                      </FunnelDeviceRow>
                    )}
                  </FunnelWrapper>
                ) : !bookingsByWeekday.some((d) => d.spots > 0) ? (
                  <EmptyStateContainer $padding="20px">
                    <EmptyStateText>No Data</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={bookingsByWeekday}
                      margin={{ top: 10, right: 8, left: -20, bottom: 5 }}
                      barSize={22}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={colors.border}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar
                        dataKey="spots"
                        fill={colors.chart.blue}
                        radius={[4, 4, 0, 0]}
                        name="Guest spots"
                      />
                      <RechartsTooltip />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>

            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/meaqueth.json"
                      trigger="in"
                      delay="500"
                      state="in-compare"
                      colors="primary:#94a3b8"
                      size="15px"
                    />
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
                <ChartDescription>
                  New vs returning. Tap a slice to open guest details.
                </ChartDescription>
              </ChartHeader>
              <ChartContainer
                style={{
                  cursor: guestTypeData.some((d) => d.value > 0)
                    ? "pointer"
                    : undefined,
                }}
              >
                {loading ? (
                  <div
                    style={{
                      width: "100%",
                      height: 280,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AdminPieChartSkeleton size={168} />
                  </div>
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
                        onClick={handlePieSectorClick}
                        style={{ outline: "none" }}
                      >
                        {guestTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{
                              cursor: entry.value > 0 ? "pointer" : "default",
                            }}
                          />
                        ))}
                        <Label
                          value={getChartTotal(guestTypeData)}
                          position="center"
                          fill={colors.textPrimary}
                          style={{ fontSize: "24px", fontWeight: "bold" }}
                        />
                      </Pie>
                      <Legend
                        wrapperStyle={{ fontSize: "12px", cursor: "pointer" }}
                        onClick={(legendItem) => {
                          const row =
                            legendItem?.payload ??
                            guestTypeData.find(
                              (d) => d.type === legendItem?.value,
                            );
                          if (row?.value > 0) handlePieSectorClick(row);
                        }}
                      />
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>

        <Drawer.Root
          open={guestTypeDrawerOpen}
          onOpenChange={handleGuestDrawerOpenChange}
          direction={isMobile ? "bottom" : "right"}
          dismissible
          handleOnly={!isMobile}
        >
          <Drawer.Portal>
            <GuestDrawerOverlay />
            {isMobile ? (
              <GuestDrawerMobile>
                <GuestDrawerHandle />
                {guestTypeDrawerInner}
              </GuestDrawerMobile>
            ) : (
              <GuestDrawerDesktop>{guestTypeDrawerInner}</GuestDrawerDesktop>
            )}
          </Drawer.Portal>
        </Drawer.Root>
      </DashboardWrapper>
  );
};

export default BookingTrends;
