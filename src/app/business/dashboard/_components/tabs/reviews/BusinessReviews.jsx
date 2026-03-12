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
  Card,
  Avatar,
  Rate,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  Empty,
  Pagination,
  Tooltip,
  Alert,
  Row,
  Col,
  Image as AntImage,
  Skeleton,
  Table,
  Dropdown,
  Menu,
  Divider,
  Grid,
  Space,
} from "antd";
import message from "@/lib/message";
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  Percent,
  MoreVertical,
  Globe,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell as RechartsCell,
  LineChart,
  Line,
  Area,
  ComposedChart,
} from "recharts";
import NumberFlow from "@number-flow/react";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Drawer } from "vaul";

import { reviewService } from "@/services/apiService";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import { LordIcon } from "@/services/ReactUtils";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// --- Vaul Drawer Styles ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: auto;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

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

import { theme } from "@/components/theme";

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
  margin-bottom: 8px;
  @media (max-width: 992px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }
`;

const StyledTitle = styled.h1`
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
    margin: 16px 0;
  }
`;

const ControlsBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  width: 280px;
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const SearchFilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    margin-top: 8px;
  }
`;

const StyledSelect = styled(Select)`
  width: 180px;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ActionButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  @media (max-width: 768px) {
    width: 100%;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const StatCard = styled(StatCardBase)``;

const StatHeader = styled.div`
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
  color: ${(props) => props.iconcolor};
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

const MetricValue = styled.div`
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

const StatLabel = styled(Text)`
  font-size: 12px;
  color: #9ca3af;
  display: block;
  line-height: 1.3;
  margin-bottom: auto;
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
  opacity: 0.8;
  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

// --- New Header / Chart Styles ---

const ChartCard = styled(StatCardBase)`
  min-height: 440px;
  .ant-card-body {
    padding: 24px !important;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  @media (max-width: 768px) {
    min-height: 350px;
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
  width: 100%;
  position: relative;
  min-height: 0;
`;

const ReviewTableContainer = styled(StatCardBase)`
  .ant-card-body {
    padding: 0 !important;
  }
`;

const StyledTable = styled(Table)`
  .ant-table {
    border-radius: 12px;
    overflow: hidden;
  }
  .ant-table-thead > tr > th {
    background-color: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ant-table-tbody > tr > td {
    vertical-align: top;
    padding: 12px 14px;
    font-size: 13px;
    color: #1e293b;
    border-bottom: 1px solid ${colors.border};
  }
  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 12px;
      font-size: 10px;
    }
    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid ${colors.border};
`;

const ReviewerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ExperienceInfo = styled.div`
  .exp-title {
    font-weight: 500;
  }
  .exp-details {
    font-size: 13px;
    color: ${colors.textSecondary};
  }
`;

const ReviewContent = styled.div`
  max-width: 350px;
`;

const BusinessResponseSection = styled.div`
  max-width: 300px;
`;

const StatusTag = styled(Tag)`
  text-transform: capitalize;
  font-weight: 600;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
`;

const StyledButton = styled(Button)`
  border-radius: 8px;
  border: 1px solid ${colors.border};
  background: white;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MobileReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MobileReviewCard = styled(StatCardBase)`
  min-height: auto;
  .ant-card-body {
    padding: 16px !important;
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const MobileCardFooter = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`;

const SourceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${(props) => (props.source === "google" ? "#f0f9ff" : "#fef3f2")};
  color: ${(props) => (props.source === "google" ? "#0369a1" : colors.primary)};
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
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
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

// Generic Chart Skeleton
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

const GeneralChartSkeleton = () => (
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
          bottom: "30px",
          left: "20px",
          right: "10px",
          height: "60%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          opacity: 0.5,
        }}
      >
        {[...Array(7)].map((_, i) => (
          <SkeletonBase
            key={i}
            $width="8%"
            $height={`${Math.random() * 60 + 20}%`}
            $borderRadius="4px 4px 0 0"
          />
        ))}
      </div>
    </ChartGridArea>
  </ChartSkeletonContainer>
);

// Desktop Table Skeleton
const TableRowSkeletonWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${colors.border};
  gap: 16px;
`;

const DesktopTableSkeleton = () => (
  <div>
    <div
      style={{
        display: "flex",
        background: "#f8fafc",
        padding: "16px 20px",
        marginBottom: "0",
        gap: "16px",
      }}
    >
      {[...Array(6)].map((_, i) => (
        <SkeletonBase
          key={i}
          $width={i === 3 ? "200px" : "80px"}
          $height="12px"
        />
      ))}
    </div>
    {[...Array(5)].map((_, i) => (
      <TableRowSkeletonWrapper key={i}>
        <div style={{ display: "flex", gap: "12px", width: "240px" }}>
          <SkeletonBase $width="40px" $height="40px" $borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <SkeletonBase $width="70%" $height="14px" $marginBottom="4px" />
            <SkeletonBase $width="40%" $height="12px" />
          </div>
        </div>
        <div style={{ width: "190px" }}>
          <SkeletonBase $width="80%" $height="14px" $marginBottom="4px" />
          <SkeletonBase $width="50%" $height="12px" />
        </div>
        <div style={{ width: "160px" }}>
          <SkeletonBase $width="80px" $height="16px" />
        </div>
        <div style={{ width: "350px" }}>
          <SkeletonBase $width="90%" $height="12px" $marginBottom="6px" />
          <SkeletonBase $width="80%" $height="12px" $marginBottom="6px" />
        </div>
        <div style={{ width: "300px" }}>
          <SkeletonBase $width="60%" $height="12px" />
        </div>
        <div style={{ width: "130px" }}>
          <SkeletonBase $width="70px" $height="22px" $borderRadius="12px" />
        </div>
      </TableRowSkeletonWrapper>
    ))}
  </div>
);

// Mobile List Skeleton
const MobileCardSkeletonWrapper = styled(StatCardBase)`
  min-height: auto;
  margin-bottom: 12px;
  .ant-card-body {
    padding: 16px !important;
  }
`;

const MobileReviewSkeletonList = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    {[...Array(3)].map((_, i) => (
      <MobileCardSkeletonWrapper key={i}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "12px", flex: 1 }}>
            <SkeletonBase $width="40px" $height="40px" $borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <SkeletonBase $width="60%" $height="14px" $marginBottom="4px" />
              <SkeletonBase $width="40%" $height="12px" />
            </div>
          </div>
          <SkeletonBase $width="60px" $height="14px" />
        </div>
        <SkeletonBase $width="100px" $height="12px" $marginBottom="12px" />
        <SkeletonBase $width="100%" $height="12px" $marginBottom="6px" />
      </MobileCardSkeletonWrapper>
    ))}
  </div>
);

// --- Tooltip Components ---
const CustomRechartsTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: "white",
          padding: "12px 16px",
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Text strong>{data.name}</Text>
        <div style={{ marginTop: 4 }}>
          <span style={{ color: colors.textSecondary }}>Count: </span>
          <span style={{ fontWeight: 600 }}>{data.count} reviews</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLineChartTooltip = ({ active, payload, label, analyticsData }) => {
  if (active && payload && payload.length) {
    const aggregation = analyticsData?.date_range?.aggregation || "date";
    let dateFormat;

    if (aggregation === "month") {
      dateFormat = "MMM YYYY";
    } else if (aggregation === "week") {
      dateFormat = "[Week of] MMM D, YYYY";
    } else {
      dateFormat = "MMM D, YYYY";
    }

    return (
      <div
        style={{
          background: "white",
          padding: "12px 16px",
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Text strong style={{ display: "block", marginBottom: 4 }}>
          {dayjs(label).format(dateFormat)}
        </Text>
        <div style={{ color: payload[0].color, fontWeight: 500 }}>
          New Reviews: {payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

const PIE_COLORS_RATINGS = [
  colors.chart.red,
  colors.chart.orange,
  colors.chart.yellow,
  colors.chart.teal,
  colors.chart.green,
];

// Main Component
const BusinessReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [filters, setFilters] = useState({
    rating: null,
    status: null,
    search: "",
    source: null,
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [isRespondModalVisible, setIsRespondModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [respondForm] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsDateRange, setAnalyticsDateRange] = useState(null);
  const [isAnalyticsReady, setIsAnalyticsReady] = useState(false);
  const refreshButtonRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const fetchReviews = useCallback(
    async (page = pagination.current, pageSize = pagination.pageSize) => {
      setLoadingReviews(true);
      setReviewError(null);
      try {
        const params = {
          page,
          page_size: pageSize,
          ordering: "-createdAt",
          ...(filters.rating && { rating: filters.rating }),
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        };
        const result = await reviewService.getBusinessReviews(params);
        if (result.success) {
          let reviewData = result.data || [];

          if (filters.source) {
            reviewData = reviewData.filter((r) => r.source === filters.source);
          }

          setReviews(reviewData);
          setPagination((prev) => ({
            ...prev,
            total: result.count || 0,
            current: page,
            pageSize,
          }));
        } else {
          message.error(result.error || "Failed to load reviews.");
        }
      } catch (err) {
        message.error("An unexpected error occurred while fetching reviews.");
      } finally {
        setLoadingReviews(false);
      }
    },
    [filters.rating, filters.status, filters.search, filters.source],
  );

  const fetchAnalytics = useCallback(async (dateRange) => {
    setLoadingAnalytics(true);
    setIsAnalyticsReady(false);
    try {
      const params =
        dateRange && dateRange.length === 2
          ? {
              startDate: dateRange[0].format("YYYY-MM-DD"),
              endDate: dateRange[1].format("YYYY-MM-DD"),
            }
          : {};
      const result = await reviewService.getBusinessReviewAnalytics(params);
      if (result.success) {
        setAnalyticsData(result.data);
        setTimeout(() => setIsAnalyticsReady(true), 50);
      } else {
        message.error(result.error || "Failed to load review analytics.");
      }
    } catch (err) {
      message.error("An error occurred fetching review analytics.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(pagination.current, pagination.pageSize);
  }, [fetchReviews, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchAnalytics(analyticsDateRange);
  }, [analyticsDateRange, fetchAnalytics]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const debouncedSearchChange = useCallback(
    debounce((value) => handleFilterChange("search", value), 500),
    [],
  );

  const resetFilters = () => {
    setFilters({ rating: null, status: null, search: "", source: null });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAnalyticsDateChange = (dates) => {
    setAnalyticsDateRange(dates);
  };

  const openRespondModal = (review) => {
    setSelectedReview(review);
    respondForm.setFieldsValue({
      business_response: review.business_response || "",
    });
    setIsRespondModalVisible(true);
  };

  const openReportModal = (review) => {
    setSelectedReview(review);
    setIsReportModalVisible(true);
  };

  const handleModalAction = async (serviceCall, successMessage, modalKey) => {
    message.loading({ content: "Processing...", key: modalKey, duration: 0 });
    try {
      const result = await serviceCall();
      if (result.success) {
        message.success({ content: successMessage, key: modalKey });
        return true;
      } else {
        message.error({
          content: result.error || "Action failed.",
          key: modalKey,
        });
        return false;
      }
    } catch (error) {
      message.error({
        content: "An unexpected error occurred.",
        key: modalKey,
      });
      return false;
    }
  };

  const handleRespondSubmit = async () => {
    try {
      const values = await respondForm.validateFields();
      const success = await handleModalAction(
        () =>
          reviewService.respondToReview(
            selectedReview.reviewId,
            values.business_response,
          ),
        "Response submitted successfully!",
        "respondReview",
      );
      if (success) {
        setIsRespondModalVisible(false);
        fetchReviews(pagination.current, pagination.pageSize);
      }
    } catch (e) {
      /* Validation handled by Ant Form */
    }
  };

  const handleReportSubmit = async () => {
    try {
      const values = await reportForm.validateFields();
      const success = await handleModalAction(
        () =>
          reviewService.reportReview(
            selectedReview.reviewId,
            values.report_reason,
          ),
        "Review reported successfully!",
        "reportReview",
      );
      if (success) {
        setIsReportModalVisible(false);
        fetchReviews(pagination.current, pagination.pageSize);
      }
    } catch (e) {
      /* Validation handled by Ant Form */
    }
  };

  const getStatusTagColor = (status) => {
    switch (status) {
      case "approved":
        return {
          bg: hexToRgba(colors.success, 0.1),
          text: colors.success,
          icon: <CheckCircle size={14} />,
        };
      case "under_review":
        return {
          bg: hexToRgba(colors.warning, 0.1),
          text: colors.warning,
          icon: <Eye size={14} />,
        };
      case "hidden":
        return {
          bg: hexToRgba(colors.textSecondary, 0.1),
          text: colors.textSecondary,
          icon: <EyeOff size={14} />,
        };
      default:
        return {
          bg: colors.border,
          text: colors.textSecondary,
          icon: <Star size={14} />,
        };
    }
  };

  // --- Insight Computations ---
  const peakDayInsight = useMemo(() => {
    if (!analyticsData?.reviews_over_time?.length) return null;
    const peak = analyticsData.reviews_over_time.reduce((p, c) =>
      p.new_reviews > c.new_reviews ? p : c,
    );
    return peak.new_reviews > 0
      ? { date: dayjs(peak.date).format("MMM D"), count: peak.new_reviews }
      : null;
  }, [analyticsData]);

  const dominantRatingInsight = useMemo(() => {
    if (!analyticsData?.rating_distribution?.length) return null;
    const dominant = analyticsData.rating_distribution.reduce((p, c) =>
      p.count > c.count ? p : c,
    );
    return dominant.count > 0
      ? { stars: dominant.name, count: dominant.count }
      : null;
  }, [analyticsData]);

  const summaryMetrics = analyticsData?.summary_metrics || {};
  const statisticCardsData = [
    {
      key: "total_reviews_in_period",
      title: "Total Reviews",
      value: summaryMetrics.total_reviews_in_period,
      icon: <MessageSquare size={20} />,
      color: colors.chart.blue,
      footer: "Confirmed reviews in period",
    },
    {
      key: "platform_reviews_in_period",
      title: "Platform Reviews",
      value: summaryMetrics.platform_reviews_in_period,
      icon: <Star size={20} />,
      color: colors.chart.purple,
      footer: "Direct booking reviews",
    },
    {
      key: "google_reviews_in_period",
      title: "Google Reviews",
      value: summaryMetrics.google_reviews_in_period,
      icon: <Globe size={20} />,
      color: colors.chart.teal,
      footer: "Imported from Google",
    },
    {
      key: "average_rating_in_period",
      title: "Avg. Rating",
      value: summaryMetrics.average_rating_in_period,
      suffix: (
        <LordIcon
          src="https://cdn.lordicon.com/wbvqtfif.json"
          trigger="in"
          delay="1500"
          state="in-reveal"
          colors="primary:#94a3b8"
          style={{ marginLeft: 4, paddingTop: 2 }}
        />
      ),
      icon: <Star size={20} />,
      color: colors.chart.orange,
      footer: "Weighted average score",
    },
    {
      key: "response_rate_in_period",
      title: "Response Rate",
      value: summaryMetrics.response_rate_in_period,
      suffix: "%",
      icon: <Percent size={20} />,
      color: colors.chart.green,
      footer: "Reviews replied to",
    },
    {
      key: "reviews_reported",
      title: "Reported Reviews",
      value: summaryMetrics.reviews_reported,
      icon: <AlertTriangle size={20} />,
      color: colors.chart.red,
      footer: "Flagged for moderation",
    },
  ];

  const isGoogleReview = (review) => review.source === "google";
  const isPlatformReview = (review) => review.source === "platform";

  const tableColumns = [
    {
      title: "GUEST",
      dataIndex: "user",
      key: "reviewer",
      width: 240,
      render: (user, record) => {
        const isGoogle = isGoogleReview(record);
        const name = isGoogle
          ? record.reviewer_name
          : `${user?.first_name || "Anonymous"} ${user?.last_name || ""}`;
        const avatar = isGoogle ? record.reviewer_avatar_url : user?.avatar;
        const date = isGoogle ? record.review_date : record.createdAt;

        return (
          <ReviewerInfo>
            <Avatar src={avatar} size={40}>
              {name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <div>
              <div className="name">{name}</div>
              <div className="date">{dayjs(date).format("MMM D, YYYY")}</div>
            </div>
          </ReviewerInfo>
        );
      },
    },
    {
      title: "EXPERIENCE",
      dataIndex: "class_info",
      key: "class",
      width: 190,
      render: (classInfo, record) => {
        if (isGoogleReview(record)) {
          return (
            <ExperienceInfo>
              <div className="exp-title">Business-wide</div>
              <div className="exp-details">Google Review</div>
            </ExperienceInfo>
          );
        }
        return (
          <ExperienceInfo>
            <div className="exp-title">{classInfo?.title || "N/A"}</div>
            <div className="exp-details">
              {classInfo?.date
                ? dayjs(classInfo.date).format("MMM D, YYYY")
                : "Date N/A"}
            </div>
          </ExperienceInfo>
        );
      },
    },
    {
      title: "RATING",
      dataIndex: "rating",
      key: "rating",
      width: 160,
      align: "center",
      render: (rating) => (
        <Rate disabled value={rating} style={{ fontSize: 16 }} />
      ),
    },
    {
      title: "REVIEW",
      dataIndex: "comment",
      key: "review",
      width: 350,
      render: (comment, record) => {
        const images = isGoogleReview(record)
          ? record.image_urls
          : record.image_url
            ? [record.image_url]
            : [];

        return (
          <ReviewContent>
            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
              {comment}
            </Paragraph>
            {images && images.length > 0 && (
              <AntImage.PreviewGroup>
                {images.map((img, idx) => (
                  <AntImage
                    key={idx}
                    src={img}
                    alt="Review image"
                    style={{
                      maxHeight: 60,
                      borderRadius: 6,
                      cursor: "pointer",
                      marginRight: 4,
                    }}
                    preview={{ mask: <Eye size={16} /> }}
                  />
                ))}
              </AntImage.PreviewGroup>
            )}
          </ReviewContent>
        );
      },
    },
    {
      title: "BUSINESS RESPONSE",
      dataIndex: "business_response",
      key: "response",
      width: 300,
      render: (response, record) => {
        const responseText = isGoogleReview(record)
          ? record.owner_response
          : response;

        return (
          <BusinessResponseSection>
            {responseText ? (
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              >
                {responseText}
              </Paragraph>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                No response yet
              </Text>
            )}
            {isGoogleReview(record) && responseText && (
              <Text
                type="secondary"
                style={{ fontSize: 11, display: "block", marginTop: 4 }}
              >
                Response from Google
              </Text>
            )}
          </BusinessResponseSection>
        );
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      render: (status, record) => {
        if (isGoogleReview(record)) {
          return (
            <StatusTag
              style={{
                backgroundColor: hexToRgba(colors.info, 0.1),
                color: colors.info,
              }}
              icon={<Globe size={14} />}
            >
              External
            </StatusTag>
          );
        }
        const s = getStatusTagColor(status);
        return (
          <StatusTag
            style={{ backgroundColor: s.bg, color: s.text }}
            icon={s.icon}
          >
            {status?.replace("_", " ") || "N/A"}
          </StatusTag>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        if (isGoogleReview(record)) {
          return (
            <Tooltip title="Google reviews cannot be managed here">
              <StyledButton icon={<MoreVertical size={16} />} disabled />
            </Tooltip>
          );
        }

        return (
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="respond"
                  icon={<MessageSquare size={16} />}
                  onClick={() => openRespondModal(record)}
                >
                  {record.business_response ? "Edit Response" : "Respond"}
                </Menu.Item>
                {!record.reported && record.status !== "hidden" && (
                  <Menu.Item
                    key="report"
                    danger
                    icon={<AlertTriangle size={16} />}
                    onClick={() => openReportModal(record)}
                  >
                    Report
                  </Menu.Item>
                )}
              </Menu>
            }
            trigger={["click"]}
          >
            <StyledButton icon={<MoreVertical size={16} />} />
          </Dropdown>
        );
      },
    },
  ];

  const renderMobileReviewCard = (review) => {
    const isGoogle = isGoogleReview(review);
    const statusInfo = isGoogle
      ? {
          bg: hexToRgba(colors.info, 0.1),
          text: colors.info,
          icon: <Globe size={14} />,
        }
      : getStatusTagColor(review.status);

    const userName = isGoogle
      ? review.reviewer_name
      : `${review.user?.first_name || "Anonymous"} ${
          review.user?.last_name || ""
        }`;
    const userAvatar = isGoogle
      ? review.reviewer_avatar_url
      : review.user?.avatar;
    const reviewDate = isGoogle ? review.review_date : review.createdAt;
    const businessResponse = isGoogle
      ? review.owner_response
      : review.business_response;
    const images = isGoogle
      ? review.image_urls
      : review.image_url
        ? [review.image_url]
        : [];

    return (
      <MobileReviewCard key={isGoogle ? review.id : review.reviewId}>
        <MobileCardHeader>
          <ReviewerInfo>
            <Avatar src={userAvatar} size={40}>
              {userName?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <div>
              <Text strong>{userName}</Text>
              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {dayjs(reviewDate).format("MMM D, YYYY")}
              </Text>
            </div>
          </ReviewerInfo>
          <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
        </MobileCardHeader>

        <Space style={{ marginBottom: 8 }}>
          <SourceBadge source={review.source}>
            {isGoogle ? <Globe size={12} /> : <Star size={12} />}
            {isGoogle ? "Google" : "Platform"}
          </SourceBadge>
        </Space>

        <div style={{ marginBottom: 12 }}>
          {!isGoogle && <Text strong>{review.class_info?.title || "N/A"}</Text>}
          {isGoogle && (
            <Text strong style={{ color: colors.textSecondary }}>
              Business-wide Review
            </Text>
          )}
          <Paragraph
            ellipsis={{ rows: 4, expandable: true, symbol: "more" }}
            style={{ marginTop: 4 }}
          >
            {review.comment}
          </Paragraph>
          {images && images.length > 0 && (
            <AntImage.PreviewGroup>
              {images.map((img, idx) => (
                <AntImage
                  key={idx}
                  src={img}
                  alt="Review image"
                  style={{
                    maxHeight: 100,
                    borderRadius: 8,
                    marginTop: 8,
                    marginRight: 4,
                  }}
                />
              ))}
            </AntImage.PreviewGroup>
          )}
        </div>

        {businessResponse && (
          <Alert
            message={isGoogle ? "Response from Google" : "Your Response"}
            description={
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                style={{ margin: 0 }}
              >
                {businessResponse}
              </Paragraph>
            }
            type="info"
            showIcon
            style={{ marginBottom: 12, borderRadius: 8 }}
          />
        )}

        <Space wrap>
          <StatusTag
            style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
            icon={statusInfo.icon}
          >
            {isGoogle ? "External" : review.status?.replace("_", " ")}
          </StatusTag>
          {!isGoogle && review.reported && (
            <StatusTag color="warning" icon={<AlertTriangle size={12} />}>
              Reported
            </StatusTag>
          )}
        </Space>

        {!isGoogle && (
          <MobileCardFooter>
            <Button
              block
              icon={<MessageSquare size={14} />}
              onClick={() => openRespondModal(review)}
            >
              {review.business_response ? "Edit Response" : "Respond"}
            </Button>
            {!review.reported && review.status !== "hidden" && (
              <Button
                block
                danger
                icon={<AlertTriangle size={14} />}
                onClick={() => openReportModal(review)}
              >
                Report
              </Button>
            )}
          </MobileCardFooter>
        )}

        {isGoogle && (
          <Text
            type="secondary"
            style={{ fontSize: 11, display: "block", marginTop: 12 }}
          >
            Google reviews cannot be managed from this interface
          </Text>
        )}
      </MobileReviewCard>
    );
  };

  // Respond Modal/Drawer Content
  const renderRespondContent = () => (
    <Form form={respondForm} layout="vertical">
      <Form.Item name="business_response" label="Your Response">
        <TextArea rows={5} placeholder="Type your response..." />
      </Form.Item>
    </Form>
  );

  // Report Modal/Drawer Content
  const renderReportContent = () => (
    <Form form={reportForm} layout="vertical">
      <Form.Item
        name="report_reason"
        label="Reason for Reporting"
        rules={[{ required: true, message: "Please provide a reason." }]}
      >
        <TextArea
          rows={4}
          placeholder="Explain why you're reporting this review..."
        />
      </Form.Item>
    </Form>
  );

  return (
    <DashboardWrapper>
        <DashboardBreadcrumb title="Reviews" />
        <DashboardHeader>
          <div>
            <StyledTitle>Manage Reviews</StyledTitle>
            <HeaderSubtitle>
              Analyze, view, and respond to reviews for your experiences.
            </HeaderSubtitle>
          </div>
          <ControlsBar>
            {isMobile ? (
              <MobileDateRangePicker
                value={analyticsDateRange}
                onChange={handleAnalyticsDateChange}
                placeholder="All Time (Start – End)"
                format="MMM D, YYYY"
                allowClear
              />
            ) : (
              <StyledRangePicker
                value={analyticsDateRange}
                onChange={handleAnalyticsDateChange}
                placeholder={["All Time (Start)", "All Time (End)"]}
                allowClear
              />
            )}
          </ControlsBar>
        </DashboardHeader>

        <ResponsiveDivider />

        <StatsGrid>
          {statisticCardsData.map((stat) => (
            <StatCard key={stat.key}>
              {loadingAnalytics ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <>
                  <div>
                    <StatHeader>
                      <IconContainer
                        background={hexToRgba(stat.color, 0.1)}
                        iconcolor={stat.color}
                      >
                        {stat.icon}
                      </IconContainer>
                    </StatHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <div>
                    <MetricValue>
                      <NumberFlow
                        value={isAnalyticsReady ? stat.value || 0 : 0}
                        duration={800}
                        numberFormatOptions={{ maximumFractionDigits: 1 }}
                      />
                      {stat.suffix}
                    </MetricValue>
                    {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                  </div>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <ResponsiveDivider />

        <Row gutter={[24, 24]}>
          {/* REVIEWS OVER TIME - WIDER (16) */}
          <Col xs={24} lg={16}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/excswhey.json"
                      colors="primary:#94a3b8"
                      size="15px"
                      trigger="in"
                      playOnLoad={true}
                    />
                    New Reviews Trend
                  </ChartTitle>
                  {!loadingAnalytics && peakDayInsight && (
                    <InsightBadge>
                      Peak: <strong>{peakDayInsight.date}</strong> (
                      {peakDayInsight.count})
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>
                  Volume of new reviews over time.
                </ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loadingAnalytics ? (
                  <GeneralChartSkeleton />
                ) : !analyticsData?.reviews_over_time?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/zezznfug.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Reviews Yet</EmptyStateText>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={analyticsData.reviews_over_time}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorReviews"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={colors.chart.red}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={colors.chart.red}
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
                        tickFormatter={(tick) => dayjs(tick).format("MMM D")}
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={(props) => (
                          <CustomLineChartTooltip
                            {...props}
                            analyticsData={analyticsData}
                          />
                        )}
                        cursor={{ stroke: colors.border }}
                      />
                      <Area
                        type="monotone"
                        dataKey="new_reviews"
                        name="New Reviews"
                        stroke={colors.chart.red}
                        fill="url(#colorReviews)"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>

          {/* RATING DISTRIBUTION - NARROWER (8) */}
          <Col xs={24} lg={8}>
            <ChartCard>
              <ChartHeader>
                <ChartTitleRow>
                  <ChartTitle>
                    <LordIcon
                      src="https://cdn.lordicon.com/mubdgyyw.json"
                      trigger="in"
                      colors="primary:#94a3b8"
                      size="15px"
                      playOnLoad={true}
                    />
                    Ratings
                  </ChartTitle>
                  {!loadingAnalytics && dominantRatingInsight && (
                    <InsightBadge>
                      Most: <strong>{dominantRatingInsight.stars}</strong>
                    </InsightBadge>
                  )}
                </ChartTitleRow>
                <ChartDescription>Breakdown by star rating.</ChartDescription>
              </ChartHeader>
              <ChartContainer>
                {loadingAnalytics ? (
                  <GeneralChartSkeleton />
                ) : !analyticsData?.rating_distribution?.length ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.rating_distribution}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      barSize={40}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={<CustomRechartsTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar dataKey="count" name="Reviews" radius={[6, 6, 0, 0]}>
                        {analyticsData.rating_distribution.map(
                          (entry, index) => (
                            <RechartsCell
                              key={`cell-${index}`}
                              fill={
                                PIE_COLORS_RATINGS[
                                  index % PIE_COLORS_RATINGS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>

        <ResponsiveDivider />

        <SearchFilterBar>
          <Input
            placeholder="Search reviews, guests, experiences..."
            prefix={<Search size={16} />}
            allowClear
            onChange={(e) => debouncedSearchChange(e.target.value)}
            style={{ flexGrow: 1, maxWidth: 400 }}
          />
          <StyledSelect
            placeholder="Filter by Source"
            allowClear
            value={filters.source}
            onChange={(value) => handleFilterChange("source", value)}
          >
            <Option value="platform">Platform Reviews</Option>
            <Option value="google">Google Reviews</Option>
          </StyledSelect>
          <StyledSelect
            placeholder="Filter by Rating"
            allowClear
            value={filters.rating}
            onChange={(value) => handleFilterChange("rating", value)}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <Option key={r} value={r}>
                {r} Star{r > 1 ? "s" : ""}
              </Option>
            ))}
          </StyledSelect>
          <StyledSelect
            placeholder="Filter by Status"
            allowClear
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
          >
            <Option value="approved">Approved</Option>
            <Option value="under_review">Under Review</Option>
            <Option value="hidden">Hidden</Option>
          </StyledSelect>
          <ActionButton
            ref={refreshButtonRef}
            icon={<RotateCcw size={16} />}
            onClick={resetFilters}
          >
            Reset
          </ActionButton>
        </SearchFilterBar>

        {reviewError && (
          <Alert
            message="Error"
            description={reviewError}
            type="error"
            showIcon
            style={{ marginBottom: 16, marginTop: 16 }}
          />
        )}

        {loadingReviews && reviews.length === 0 ? (
          isMobile ? (
            <MobileReviewList style={{ marginTop: 24 }}>
              <MobileReviewSkeletonList />
            </MobileReviewList>
          ) : (
            <ReviewTableContainer style={{ marginTop: 24 }}>
              <DesktopTableSkeleton />
            </ReviewTableContainer>
          )
        ) : !loadingReviews && reviews.length === 0 ? (
          <EmptyStateContainer>
            <EmptyStateIcon>
              <lord-icon
                src="https://cdn.lordicon.com/zezznfug.json"
                trigger="in"
                colors="primary:#94a3b8"
              />
            </EmptyStateIcon>
            <EmptyStateText>No Reviews Found</EmptyStateText>
            <EmptyStateSubtext>
              You don't currently have any reviews. When you receive them, they
              will appear here.
            </EmptyStateSubtext>
          </EmptyStateContainer>
        ) : isMobile ? (
          <MobileReviewList>
            {reviews.map(renderMobileReviewCard)}
          </MobileReviewList>
        ) : (
          <ReviewTableContainer style={{ marginTop: 24 }}>
            <StyledTable
              columns={tableColumns}
              dataSource={reviews}
              rowKey={(record) =>
                isGoogleReview(record) ? record.id : record.reviewId
              }
              pagination={false}
              scroll={{ x: 1600 }}
            />
          </ReviewTableContainer>
        )}

        {pagination.total > pagination.pageSize &&
          !loadingReviews &&
          reviews.length > 0 && (
            <PaginationContainer>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) =>
                  setPagination((p) => ({ ...p, current: page, pageSize }))
                }
                showSizeChanger={false}
              />
            </PaginationContainer>
          )}

        {/* Respond Modal/Drawer */}
        {isMobile ? (
          <Drawer.Root
            open={isRespondModalVisible}
            onOpenChange={(open) => !open && setIsRespondModalVisible(false)}
            repositionInputs={false}
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle>Respond to Review</DrawerTitle>
                </DrawerHeader>
                <DrawerBody>{renderRespondContent()}</DrawerBody>
                <DrawerFooter>
                  <Button onClick={() => setIsRespondModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleRespondSubmit}
                    loading={loadingReviews}
                    key={`btn-${loadingReviews}`}
                  >
                    Submit Response
                  </Button>
                </DrawerFooter>
              </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <Modal
            title="Respond to Review"
            open={isRespondModalVisible}
            onCancel={() => setIsRespondModalVisible(false)}
            onOk={handleRespondSubmit}
            confirmLoading={loadingReviews}
            destroyOnClose
          >
            {renderRespondContent()}
          </Modal>
        )}

        {/* Report Modal/Drawer */}
        {isMobile ? (
          <Drawer.Root
            open={isReportModalVisible}
            onOpenChange={(open) => !open && setIsReportModalVisible(false)}
            repositionInputs={false}
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle>Report Review</DrawerTitle>
                </DrawerHeader>
                <DrawerBody>{renderReportContent()}</DrawerBody>
                <DrawerFooter>
                  <Button onClick={() => setIsReportModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={handleReportSubmit}
                    loading={loadingReviews}
                    key={`btn-${loadingReviews}`}
                  >
                    Submit Report
                  </Button>
                </DrawerFooter>
              </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <Modal
            title="Report Review"
            open={isReportModalVisible}
            onCancel={() => setIsReportModalVisible(false)}
            onOk={handleReportSubmit}
            confirmLoading={loadingReviews}
            destroyOnClose
          >
            {renderReportContent()}
          </Modal>
        )}
    </DashboardWrapper>
  );
};

export default BusinessReviews;
