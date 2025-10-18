"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
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
  message,
  ConfigProvider,
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
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  BarChart2,
  Percent,
  TrendingUp,
  MoreVertical,
  Globe,
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
} from "recharts";
import NumberFlow from "@number-flow/react";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Drawer } from "vaul";

import { reviewService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

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

const DrawerHandle = styled.div`
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
  padding: 24px;

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

const localAntDTheme = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    borderRadius: 16,
  },
  components: {
    Card: { borderRadiusLG: 16, paddingLG: 20 },
    Button: { borderRadius: 12, controlHeight: 40 },
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
    gap: 0;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }
`;

const StyledTitle = styled.h1`
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
    margin: 16px 0;
  }
`;

const ControlsBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  width: 280px;

  @media (max-width: 768px) {
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
  border-radius: ${localAntDTheme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 140px;
  transition: all 0.2s ease;

  .ant-card-body {
    padding: 20px !important;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100%;
  }

  @media (max-width: 768px) {
    min-height: 120px;
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

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background};
  color: ${(props) => props.iconcolor};

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const MetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-top: auto;
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.3;
  margin-top: 10px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const ChartCard = styled(StatCardBase)`
  min-height: 400px;

  @media (max-width: 768px) {
    min-height: 350px;
  }
`;

const CardTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 17px;
    color: ${colors.textPrimary};
    margin-bottom: 16px !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const ChartContainer = styled.div`
  flex-grow: 1;
  height: 300px;
  margin-top: 16px;

  @media (max-width: 768px) {
    height: 250px;
  }
`;

const ReviewTableContainer = styled(StatCardBase)`
  .ant-card-body {
    padding: 0 !important;
  }
`;

const StyledTable = styled(Table)`
  .ant-table {
    border-radius: 16px;
    overflow: hidden;
  }

  .ant-table-thead > tr > th {
    background-color: #f8fafc !important;
    color: #475569;
    font-weight: 600;
    font-size: 13px;
    padding: 16px 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ant-table-tbody > tr > td {
    vertical-align: top;
    padding: 16px 20px;
    font-size: 14px;
    color: #1e293b;
    border-bottom: 1px solid ${colors.border};
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
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

const ClassInfo = styled.div`
  .class-title {
    font-weight: 500;
  }
  .class-details {
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

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 250px;
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

// --- Tooltip Components ---
const CustomRechartsTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: "white",
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>
          {data.name}: {data.count} reviews
        </p>
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
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: 12 }}>
          {dayjs(label).format(dateFormat)}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            color: payload[0].stroke,
            fontWeight: 500,
          }}
        >
          New Reviews: {payload[0].value}
        </p>
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
    [filters.rating, filters.status, filters.search, filters.source]
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
    []
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
            values.business_response
          ),
        "Response submitted successfully!",
        "respondReview"
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
            values.report_reason
          ),
        "Review reported successfully!",
        "reportReview"
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

  const summaryMetrics = analyticsData?.summary_metrics || {};
  const statisticCardsData = [
    {
      key: "total_reviews_in_period",
      title: "Total Reviews (Period)",
      value: summaryMetrics.total_reviews_in_period,
      icon: <MessageSquare size={20} />,
      color: colors.chart.blue,
    },
    {
      key: "platform_reviews_in_period",
      title: "Platform Reviews",
      value: summaryMetrics.platform_reviews_in_period,
      icon: <Star size={20} />,
      color: colors.chart.purple,
    },
    {
      key: "google_reviews_in_period",
      title: "Google Reviews",
      value: summaryMetrics.google_reviews_in_period,
      icon: <Globe size={20} />,
      color: colors.chart.teal,
    },
    {
      key: "average_rating_in_period",
      title: "Avg. Rating (Period)",
      value: summaryMetrics.average_rating_in_period,
      suffix: (
        <LordIcon
          src="https://cdn.lordicon.com/wbvqtfif.json"
          trigger="in"
          delay="1500"
          state="in-reveal"
          colors="primary:#e8b730"
          style={{ marginLeft: 4, paddingTop: 2 }}
        />
      ),
      icon: <Star size={20} />,
      color: colors.chart.orange,
    },
    {
      key: "response_rate_in_period",
      title: "Response Rate (Period)",
      value: summaryMetrics.response_rate_in_period,
      suffix: "%",
      icon: <Percent size={20} />,
      color: colors.chart.green,
    },
    {
      key: "reviews_reported",
      title: "Reported Reviews (Period)",
      value: summaryMetrics.reviews_reported,
      icon: <AlertTriangle size={20} />,
      color: colors.chart.red,
    },
  ];

  const isGoogleReview = (review) => review.source === "google";
  const isPlatformReview = (review) => review.source === "platform";

  const tableColumns = [
    {
      title: "Reviewer",
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
      title: "Class",
      dataIndex: "class_info",
      key: "class",
      width: 190,
      render: (classInfo, record) => {
        if (isGoogleReview(record)) {
          return (
            <ClassInfo>
              <div className="class-title">Business-wide</div>
              <div className="class-details">Google Review</div>
            </ClassInfo>
          );
        }
        return (
          <ClassInfo>
            <div className="class-title">{classInfo?.title || "N/A"}</div>
            <div className="class-details">
              {classInfo?.date
                ? dayjs(classInfo.date).format("MMM D, YYYY")
                : "Date N/A"}
            </div>
          </ClassInfo>
        );
      },
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 160,
      align: "center",
      render: (rating) => (
        <Rate disabled value={rating} style={{ fontSize: 16 }} />
      ),
    },
    {
      title: "Review",
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
      title: "Business Response",
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
      title: "Status",
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
      title: "Actions",
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
    <ConfigProvider theme={localAntDTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <StyledTitle>Manage Reviews</StyledTitle>
            <HeaderSubtitle>
              Analyze, view, and respond to reviews for your classes.
            </HeaderSubtitle>
          </div>
          <ControlsBar>
            <StyledRangePicker
              value={analyticsDateRange}
              onChange={handleAnalyticsDateChange}
              placeholder={["All Time (Start)", "All Time (End)"]}
              allowClear
            />
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
                    <IconContainer
                      background={hexToRgba(stat.color, 0.1)}
                      iconcolor={stat.color}
                    >
                      {stat.icon}
                    </IconContainer>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <MetricValue>
                    <NumberFlow
                      value={isAnalyticsReady ? stat.value || 0 : 0}
                      duration={800}
                      numberFormatOptions={{ maximumFractionDigits: 1 }}
                    />
                    {stat.suffix}
                  </MetricValue>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <ResponsiveDivider />

        <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]}>
          <Col xs={24} lg={12}>
            <ChartCard>
              <CardTitle>
                <LordIcon
                  src="https://cdn.lordicon.com/mubdgyyw.json"
                  trigger="in"
                  colors="primary:#f56231"
                  playOnLoad={true}
                />{" "}
                Rating Distribution
              </CardTitle>
              <ChartContainer>
                {loadingAnalytics ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !analyticsData?.rating_distribution?.length ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.rating_distribution}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                      />
                      <RechartsTooltip
                        content={<CustomRechartsTooltip />}
                        cursor={{ fill: "#f5f5f5" }}
                      />
                      <Bar dataKey="count" name="Reviews" radius={[4, 4, 0, 0]}>
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
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard>
              <CardTitle>
                <LordIcon
                  src="https://cdn.lordicon.com/excswhey.json"
                  colors="primary:#f56231"
                  size={isMobile ? "18px" : "20px"}
                  trigger="in"
                  playOnLoad={true}
                />{" "}
                New Reviews Over Time
              </CardTitle>
              <ChartContainer>
                {loadingAnalytics ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : !analyticsData?.reviews_over_time?.length ? (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <LordIcon
                        src="https://cdn.lordicon.com/zezznfug.json"
                        trigger="in"
                        delay="1500"
                        state="in-chat"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Reviews Yet</EmptyStateText>
                    <EmptyStateSubtext>
                      You don't currently have any reviews.
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analyticsData.reviews_over_time}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(tick) => dayjs(tick).format("MMM D")}
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: colors.textSecondary }}
                      />
                      <RechartsTooltip
                        content={(props) => (
                          <CustomLineChartTooltip
                            {...props}
                            analyticsData={analyticsData}
                          />
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="new_reviews"
                        name="New Reviews"
                        stroke={colors.chart.red}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
        </Row>

        <ResponsiveDivider />

        <SearchFilterBar>
          <Input
            placeholder="Search reviews, users, classes..."
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
          <LoaderWrapper>
            <GlobalLoaderWithoutInlineStyles />
          </LoaderWrapper>
        ) : !loadingReviews && reviews.length === 0 ? (
          <EmptyStateContainer>
            <EmptyStateIcon>
              <LordIcon
                src="https://cdn.lordicon.com/zezznfug.json"
                trigger="in"
                delay="1500"
                state="in-chat"
                colors="primary:#94a3b8"
                style={{ width: 40, height: 40 }}
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
    </ConfigProvider>
  );
};

export default BusinessReviews;
