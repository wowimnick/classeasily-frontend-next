"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import styled, { css, keyframes } from "styled-components";
import {
  Users,
  BookOpen,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  UserPlus,
  CheckCircle,
  Briefcase,
  BarChartHorizontalBig,
  BarChart,
  Clock,
  Tag as TagIcon,
  Link as LinkIcon,
  Edit3,
  Shield,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  Typography,
  Card,
  Tooltip,
  Space,
  Grid,
  Spin,
  Alert,
  Empty,
  List,
  Skeleton,
  Row,
  Col,
  Divider,
  Button,
  message,
  Form,
  Progress,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import NumberFlow from "@number-flow/react";
import Link from "next/link";

import { formatUTCToUserDisplay, formatNaiveDate } from "@/services/utils";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { businessService, scheduleService } from "@/services/apiService";
import ScheduleEditDrawer from "../classes/manageclasses/ScheduleEditDrawer";
import { LordIcon } from "@/services/ReactUtils";
import { theme } from "@/components/theme";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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
  },
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getErrorMessage = (error) => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data === "object" && data !== null) {
      const messages = Object.entries(data).map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${formattedKey}: ${
          Array.isArray(value) ? value.join(", ") : value
        }`;
      });
      if (messages.length > 0) return messages.join("; ");
    }
  }
  if (typeof error?.error === "string") return error.error;
  if (typeof error?.detail === "string") return error.detail;
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
};

/* --- Styled Components --- */

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;

  @media (max-width: 768px) {
    padding: 12px;
    gap: 12px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  width: fit-content;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
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
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const SnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const StatCardBase = styled(Card)`
  border-radius: ${theme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 140px;
  transition: all 0.2s ease;

  .ant-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  @media (max-width: 768px) {
    min-height: 120px;
    border-radius: 12px;
    .ant-card-body {
      padding: 16px;
    }
  }
`;

const MetricStatCardLink = styled(Link)`
  text-decoration: none;
  display: block;
  height: 100%;
  &:hover {
    text-decoration: none;
  }
`;

const MetricStatCard = styled(StatCardBase)`
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
  ${(props) =>
    props.$isClickable &&
    css`
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
    `}
`;

const SnapshotStatCard = styled(StatCardBase)``;

const StatHeader = styled.div`
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
  background: ${(props) => props.$background || hexToRgba(colors.info, 0.1)};
  color: ${(props) => props.$iconcolor || colors.info};
  flex-shrink: 0;

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

const MetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  display: flex;
  align-items: baseline;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 18px;
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

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatLabel = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.3;
  margin-bottom: auto;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const GridSection = styled(Row)`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

const ChartCard = styled(StatCardBase)`
  min-height: 400px;
  @media (max-width: 768px) {
    min-height: 350px;
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  margin-top: 16px;
  position: relative;
  @media (max-width: 768px) {
    height: 250px;
  }
`;

const CardTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 17px;
    color: ${colors.textPrimary};
    display: flex;
    align-items: center;
    gap: 8px;
  }
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const SectionTitle = styled(CardTitle)`
  margin-bottom: 4px !important;
`;

const SectionDescription = styled(Text)`
  font-size: 14px;
  color: ${colors.textSecondary};
  display: block;
  margin-bottom: 12px;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ContentListCard = styled(StatCardBase)`
  min-height: 400px;
  @media (max-width: 768px) {
    min-height: 350px;
  }
`;

const ScrollableList = styled.div`
  flex-grow: 1;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;
  @media (max-width: 768px) {
    max-height: 280px;
  }
`;

const StyledListItem = styled(List.Item)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 8px !important;
  border-radius: 12px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${colors.lightBg};
  }

  .ant-list-item-main {
    min-width: 0;
  }
  .ant-list-item-extra {
    @media (max-width: 576px) {
      margin-left: 0;
    }
  }
`;

const ListItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-grow: 1;
  min-width: 0;
`;

const ClassInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
`;

const ClassName = styled(Text)`
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  font-size: 15px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ClassMeta = styled(Text)`
  color: ${colors.textSecondary};
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const OccupancyText = styled.div`
  font-size: 14px;
  color: ${colors.textSecondary};
  font-weight: 500;
  white-space: nowrap;
`;

const ActivityItem = styled(List.Item)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 !important;
  border-bottom: 1px solid ${colors.border} !important;

  &:last-child {
    border-bottom: none !important;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
`;

const ActivityContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const ActivityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$background};
  color: white;
  flex-shrink: 0;

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

const ActivityText = styled(Text)`
  color: ${colors.textPrimary};
  font-size: 14px;
  flex-grow: 1;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const TimeStamp = styled.span`
  color: ${colors.textSecondary};
  font-size: 12px;
  white-space: nowrap;
  margin-left: 12px;

  @media (max-width: 480px) {
    margin-left: 0;
    align-self: flex-end;
  }
`;

const CustomRechartsTooltip = styled.div`
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid ${colors.border};

  p {
    margin: 0;
    color: ${colors.textSecondary};
    font-size: 13px;
  }
  strong {
    color: ${colors.textPrimary};
    font-size: 15px;
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
`;

const PermissionDeniedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: ${colors.error};
  margin-top: 10px;
  text-align: center;
  gap: 12px;
`;

const PermissionDeniedText = styled(Text)`
  font-weight: 600;
  font-size: 15px;
  color: ${colors.error} !important;
  margin: 0 !important;
`;

const PermissionDeniedSubtext = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary} !important;
  margin: 0 !important;
  opacity: 0.8;
`;

const ResponsiveDivider = styled(Divider)`
  margin: 24px 0;
  @media (max-width: 768px) {
    margin: 16px 0;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
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

/* Thin action banner — sits right under the black header, full-width */
const ActionRequiredThinBanner = styled.div`
  margin: -24px -24px 16px -24px;
  padding: 10px 24px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%);
  border-bottom: 1px solid rgba(245, 158, 11, 0.25);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    margin: -12px -12px 12px -12px;
    padding: 10px 16px;
    min-height: auto;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ActionRequiredThinBannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const ActionRequiredThinBannerText = styled.div`
  font-size: 14px;
  color: ${colors.textPrimary};
  line-height: 1.4;
  strong { color: ${colors.warning}; }
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const RankNumber = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${colors.textSecondary};
  width: 32px;
  text-align: center;
  flex-shrink: 0;
`;

const MinimalRankBadge = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textSecondary};
  background-color: ${hexToRgba(colors.textSecondary, 0.08)};
  border-radius: 6px;
  padding: 2px 6px;
  flex-shrink: 0;
  line-height: 1.4;
`;

const EnrollmentMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.chart.blue};
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

// Chart Skeleton
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

const ChartLinePath = styled.div`
  position: absolute;
  top: 30%;
  left: 10px;
  right: 0;
  height: 40%;
  background: linear-gradient(
    90deg,
    rgba(255, 56, 92, 0) 0%,
    rgba(255, 56, 92, 0.1) 50%,
    rgba(255, 56, 92, 0) 100%
  );
  clip-path: polygon(
    0 100%,
    10% 80%,
    20% 85%,
    30% 60%,
    40% 70%,
    50% 40%,
    60% 50%,
    70% 30%,
    80% 45%,
    90% 20%,
    100% 30%,
    100% 100%
  );
  opacity: 0.5;
`;

const RevenueChartSkeleton = () => (
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
      <ChartLinePath />
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

// List Item Skeletons
const ListItemSkeletonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 8px;
  gap: 16px;
  width: 100%;
`;

const LeftContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RightContent = styled.div`
  flex-shrink: 0;
`;

const UpcomingClassesSkeletonList = () => (
  <div style={{ paddingRight: "8px" }}>
    {[...Array(4)].map((_, i) => (
      <React.Fragment key={i}>
        <ListItemSkeletonWrapper>
          <LeftContent>
            <SkeletonBase $width="60%" $height="14px" />
            <div style={{ display: "flex", gap: "8px" }}>
              <SkeletonBase $width="16px" $height="12px" />
              <SkeletonBase $width="80px" $height="12px" />
            </div>
          </LeftContent>
          <RightContent>
            <SkeletonBase
              $width="40px"
              $height="40px"
              $borderRadius="50%"
              style={{ border: `2px solid ${colors.border}` }}
            />
          </RightContent>
        </ListItemSkeletonWrapper>
        {i < 3 && <Divider style={{ margin: "0" }} />}
      </React.Fragment>
    ))}
  </div>
);

const PopularClassesSkeletonList = () => (
  <div style={{ paddingRight: "8px" }}>
    {[...Array(5)].map((_, i) => (
      <React.Fragment key={i}>
        <ListItemSkeletonWrapper>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
            }}
          >
            <SkeletonBase $width="24px" $height="18px" $borderRadius="6px" />
            <SkeletonBase $width="70%" $height="14px" />
          </div>
          <RightContent>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <SkeletonBase $width="14px" $height="14px" $borderRadius="4px" />
              <SkeletonBase $width="20px" $height="14px" />
            </div>
          </RightContent>
        </ListItemSkeletonWrapper>
        {i < 4 && <Divider style={{ margin: "0" }} />}
      </React.Fragment>
    ))}
  </div>
);

const RecentActivitySkeletonList = () => (
  <div style={{ paddingRight: "8px" }}>
    {[...Array(4)].map((_, i) => (
      <React.Fragment key={i}>
        <ListItemSkeletonWrapper style={{ padding: "16px 0" }}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flex: 1,
              alignItems: "center",
            }}
          >
            <SkeletonBase $width="36px" $height="36px" $borderRadius="8px" />
            <SkeletonBase $width="75%" $height="14px" />
          </div>
          <SkeletonBase $width="40px" $height="12px" />
        </ListItemSkeletonWrapper>
        {i < 3 && <Divider style={{ margin: "0" }} />}
      </React.Fragment>
    ))}
  </div>
);

const getOccupancyColor = (percentage) => {
  if (percentage < 50) return colors.success;
  if (percentage < 80) return colors.warning;
  return colors.error;
};

const formatCurrency = (value) => {
  if (value == null || isNaN(value)) value = 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatChange = (value, isPercentage = true) => {
  if (value == null || isNaN(value)) return "N/A";
  const sign = value >= 0 ? "+" : "";
  const suffix = isPercentage ? "%" : "";
  const displayValue =
    Math.abs(value) < 0.01 && Math.abs(value) > 0 ? 0 : value;
  return `${sign}${displayValue.toFixed(1)}${suffix}`;
};

const iconMap = {
  Users,
  BookOpen,
  DollarSign,
  Star,
  UserPlus,
  CheckCircle,
  Activity,
  Briefcase,
  BarChartHorizontalBig,
  Calendar,
};

const metricDisplayInfo = {
  total_students: {
    title: "Guests This Month",
    icon: Users,
    color: colors.chart.blue,
    link: "/business/dashboard/bookings",
    footer: "vs last month",
  },
  active_classes: {
    title: "Active Experiences",
    icon: BookOpen,
    color: colors.chart.green,
    link: "/business/dashboard/listings",
    footer: "Total published experiences",
  },
  monthly_revenue: {
    title: "Gross Revenue (Month)",
    icon: DollarSign,
    color: colors.chart.purple,
    prefix: "$",
    link: "/business/dashboard/revenue",
    footer: "vs last month",
  },
  average_rating: {
    title: "Average Rating",
    icon: Star,
    color: colors.chart.orange,
    suffix: "/5 stars",
    link: "/business/dashboard/reviews",
    footer: "Based on all reviews",
  },
};

const AnimatedNumberFlow = ({
  value,
  prefix = "",
  suffix = "",
  loading,
  numberFormatOptions = {},
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = useMemo(
    () => (value == null || isNaN(value) ? 0 : Number(value)),
    [value],
  );
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDisplayValue(targetValue), 50);
      return () => clearTimeout(timer);
    }
  }, [loading, targetValue]);
  return (
    <>
      {prefix}
      <NumberFlow
        value={displayValue}
        format={numberFormatOptions}
        animated={true}
      />
      {suffix}
    </>
  );
};

const Overview = forwardRef((props, ref) => {
  // Fetch overview data locally in this component
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessService.fetchMyBusinessOverview();

      if (response.success && response.data) {
        setOverviewData(response.data);
      } else {
        setError(response.error || "Failed to fetch overview data.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fix for: "onDataRefresh is not defined"
  // This callback wraps the fetch function to be passed down to children
  const onDataRefresh = useCallback(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Fetch data on mount
  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isSmallMobile = !screens.sm;

  const [userTimeZone, setUserTimeZone] = useState("UTC");
  useEffect(() => {
    setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const [scheduleForm] = Form.useForm();
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleEditDrawer, setScheduleEditDrawer] = useState({
    visible: false,
    classData: null,
    editingSchedule: null,
    startInEditMode: false,
    hideBackButton: false,
  });

  const overviewTitleRef = useRef(null);
  useImperativeHandle(ref, () => ({
    getTargetElement: () => overviewTitleRef.current,
  }));

  const animatedValues = useMemo(() => {
    if (!overviewData?.metrics) {
      return {
        total_students: 0,
        active_classes: 0,
        monthly_revenue: 0,
        average_rating: 0,
      };
    }
    return {
      total_students: Number(overviewData.metrics.total_students?.value) || 0,
      active_classes: Number(overviewData.metrics.active_classes?.value) || 0,
      monthly_revenue: Number(overviewData.metrics.monthly_revenue?.value) || 0,
      average_rating: Number(overviewData.metrics.average_rating?.value) || 0,
    };
  }, [overviewData]);

  const handleOpenEditDrawer = async (cls) => {
    if (editingScheduleId) return;
    setEditingScheduleId(cls.schedule_instance_id);
    try {
      const result = await scheduleService.fetchInstance(
        cls.schedule_instance_id,
      );
      if (result.success && result.data) {
        const apiData = result.data;
        if (!apiData.booking_type) {
          message.error("Cannot edit: schedule is missing key details.");
          return;
        }

        const classDataForDrawer = {
          title: cls.name,
          option: {
            optionId: apiData.option,
            booking_type: apiData.booking_type,
          },
        };

        const scheduleToEdit = {
          id: apiData.schedule,
          name: apiData.name,
          price: apiData.price,
          maxParticipants: apiData.max_participants,
          minParticipants: apiData.min_participants || 1,
          duration: apiData.duration,
          time: apiData.time,
          date: apiData.date,
        };

        setScheduleEditDrawer({
          visible: true,
          classData: classDataForDrawer,
          editingSchedule: scheduleToEdit,
          startInEditMode: true,
          hideBackButton: true,
        });
      } else {
        message.error(
          getErrorMessage(result.error) || "Failed to load schedule details.",
        );
      }
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setEditingScheduleId(null);
    }
  };

  const handleCloseEditDrawer = () => {
    setScheduleEditDrawer({
      visible: false,
      classData: null,
      editingSchedule: null,
      startInEditMode: false,
      hideBackButton: false,
    });
  };

  const revenueChartData = useMemo(() => {
    if (loading || error || !overviewData?.revenue_trend) return [];
    return overviewData.revenue_trend.map((item) => ({
      ...item,
      gross_revenue: item.gross_revenue || item.revenue || 0,
    }));
  }, [overviewData, loading, error]);

  const revenueAccessDenied = !overviewData?.metrics?.monthly_revenue;

  const renderRechartsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const formattedDate = formatNaiveDate(label, "MMM d, yyyy");
      return (
        <CustomRechartsTooltip>
          <p>{formattedDate}</p>
          {payload.map((pld) => (
            <div key={pld.dataKey}>
              <span style={{ color: pld.stroke || pld.fill }}>
                ▪ {pld.name}:{" "}
              </span>
              <strong>{formatCurrency(pld.value)}</strong>
            </div>
          ))}
        </CustomRechartsTooltip>
      );
    }
    return null;
  };

  const mainStats = useMemo(
    () => [
      "total_students",
      "active_classes",
      "monthly_revenue",
      "average_rating",
    ],
    [],
  );

  const todaySnap = overviewData?.today_snapshot || {};
  const todaySnapshotMetrics = [
    {
      key: "today_classes_running",
      title: "Experiences Today",
      value: todaySnap.today_classes_running || 0,
      icon: Briefcase,
      color: colors.info,
    },
    {
      key: "today_total_bookings",
      title: "Bookings Today",
      value: todaySnap.today_total_bookings || 0,
      icon: Calendar,
      color: colors.chart.teal,
    },
    {
      key: "today_total_participants",
      title: "Guests Today",
      value: todaySnap.today_total_participants || 0,
      icon: UserPlus,
      color: colors.chart.orange,
    },
  ];

  if (error && !loading)
    return (
      <DashboardWrapper>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
        />
      </DashboardWrapper>
    );
  if (!loading && !error && !overviewData)
    return (
      <DashboardWrapper>
        <Empty description="No overview data available." />
      </DashboardWrapper>
    );

  const showActionBanner =
    !loading &&
    overviewData?.actionable_prompts?.classes_needing_schedules_count > 0;
  const actionCount =
    overviewData?.actionable_prompts?.classes_needing_schedules_count ?? 0;

  return (
    <DashboardWrapper>
        {showActionBanner && (
          <ActionRequiredThinBanner>
            <ActionRequiredThinBannerContent>
              <IconContainer
                $background={hexToRgba(colors.warning, 0.15)}
                $iconcolor={colors.warning}
              >
                <AlertTriangle size={18} />
              </IconContainer>
              <ActionRequiredThinBannerText>
                <strong>Action required:</strong>{" "}
                {actionCount === 1
                  ? "1 experience is"
                  : `${actionCount} experiences are`}{" "}
                running out of available schedules.
              </ActionRequiredThinBannerText>
            </ActionRequiredThinBannerContent>
            <Link href="/business/dashboard/listings">
              <Button
                type="primary"
                size="small"
                icon={<ArrowRight size={14} />}
                style={{ flexShrink: 0 }}
              >
                Manage Experiences
              </Button>
            </Link>
          </ActionRequiredThinBanner>
        )}

        <DashboardHeader ref={overviewTitleRef}>
          <div>
            <StyledTitle>Dashboard Overview</StyledTitle>
            <HeaderSubtitle>
              Welcome back! Here's a summary of your business activity.
            </HeaderSubtitle>
          </div>
        </DashboardHeader>

        <ResponsiveDivider />

        <div>
          <SectionTitle>
            <BarChart size={isMobile ? 18 : 20} color={colors.primary} />
            Monthly Overview
          </SectionTitle>
          <SectionDescription>
            A high-level summary of your key performance indicators for the
            current month.
          </SectionDescription>
        </div>

        <StatsGrid>
          {mainStats.map((key) => {
            if (loading) {
              return (
                <MetricStatCard key={key}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </MetricStatCard>
              );
            }
            if (
              key === "monthly_revenue" &&
              !overviewData?.metrics?.monthly_revenue
            ) {
              return (
                <MetricStatCard key={key} $isClickable={false}>
                  <div>
                    <StatHeader>
                      <IconContainer
                        $background={hexToRgba(colors.error, 0.1)}
                        $iconcolor={colors.error}
                      >
                        <Shield />
                      </IconContainer>
                    </StatHeader>
                    <StatLabel style={{ opacity: 0.6 }}>Revenue Data</StatLabel>
                  </div>
                  <MetricValue
                    style={{
                      color: colors.error,
                      fontSize: isMobile ? "14px" : "16px",
                    }}
                  >
                    Access Restricted
                  </MetricValue>
                </MetricStatCard>
              );
            }
            const displayInfo = metricDisplayInfo[key];
            const metric = overviewData?.metrics?.[key];
            const MetricIconComponent = displayInfo?.icon || Activity;
            const changeValue = metric?.change;
            const isPercentageChange =
              key === "monthly_revenue" || key === "total_students";
            const isRating = key === "average_rating";
            const iconcolor = displayInfo?.color || colors.info;
            const iconBackground = hexToRgba(iconcolor, 0.1);
            const cardContent = (
              <>
                <div>
                  <StatHeader>
                    <IconContainer
                      $background={iconBackground}
                      $iconcolor={iconcolor}
                    >
                      <MetricIconComponent />
                    </IconContainer>
                  </StatHeader>
                  <StatLabel>
                    {displayInfo?.title || key.replace(/_/g, " ")}
                  </StatLabel>
                </div>
                <div>
                  <MetricValue>
                    {isRating &&
                    (metric?.value == null || metric?.value === 0) ? (
                      "N/A"
                    ) : (
                      <AnimatedNumberFlow
                        value={animatedValues[key]}
                        prefix={displayInfo?.prefix || ""}
                        suffix={displayInfo?.suffix || ""}
                        loading={loading}
                        numberFormatOptions={
                          isRating
                            ? { maximumFractionDigits: 1 }
                            : { maximumFractionDigits: 0 }
                        }
                      />
                    )}
                  </MetricValue>
                  {changeValue != null &&
                  key !== "active_classes" &&
                  key !== "average_rating" ? (
                    <StatFooter>
                      <PercentChange $isPositive={changeValue >= 0}>
                        {changeValue >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {formatChange(changeValue, isPercentageChange)}
                      </PercentChange>
                      {!isSmallMobile && displayInfo?.footer}
                    </StatFooter>
                  ) : (
                    displayInfo?.footer && (
                      <StatFooter>{displayInfo.footer}</StatFooter>
                    )
                  )}
                </div>
              </>
            );
            return displayInfo?.link ? (
              <MetricStatCardLink href={displayInfo.link} key={key}>
                <MetricStatCard $isClickable={!!displayInfo.link}>
                  {cardContent}
                </MetricStatCard>
              </MetricStatCardLink>
            ) : (
              <MetricStatCard key={key} $isClickable={false}>
                {cardContent}
              </MetricStatCard>
            );
          })}
        </StatsGrid>

        <ResponsiveDivider />

        <div>
          <SectionTitle>
            <BarChartHorizontalBig
              size={isMobile ? 18 : 20}
              color={colors.primary}
            />
            Today's Snapshot
          </SectionTitle>
          <SectionDescription>
            A real-time overview of your operational activities for today.
          </SectionDescription>
        </div>

        <SnapshotGrid>
          {todaySnapshotMetrics.map((stat) => (
            <SnapshotStatCard key={stat.key}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <>
                  <div>
                    <StatHeader>
                      <IconContainer
                        $background={hexToRgba(stat.color, 0.15)}
                        $iconcolor={stat.color}
                      >
                        {React.createElement(stat.icon)}
                      </IconContainer>
                    </StatHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <MetricValue>
                    <AnimatedNumberFlow
                      value={stat.value}
                      loading={loading}
                      numberFormatOptions={{ maximumFractionDigits: 0 }}
                    />
                  </MetricValue>
                </>
              )}
            </SnapshotStatCard>
          ))}
        </SnapshotGrid>

        <ResponsiveDivider />

        <GridSection gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
          <Col xs={24} lg={16}>
            <ChartCard>
              <CardTitle>
                <TrendingUp size={isMobile ? 18 : 20} color={colors.primary} />
                Revenue Trend (Last 30 days)
              </CardTitle>
              <ChartContainer>
                {loading ? (
                  <RevenueChartSkeleton />
                ) : revenueAccessDenied ? (
                  <PermissionDeniedContainer
                    style={{ marginTop: 0, height: "100%" }}
                  >
                    <Shield size={isMobile ? 32 : 40} />
                    <PermissionDeniedText>
                      Access Restricted
                    </PermissionDeniedText>
                    <PermissionDeniedSubtext>
                      Insufficient permissions to view revenue data
                    </PermissionDeniedSubtext>
                  </PermissionDeniedContainer>
                ) : !revenueChartData || revenueChartData.length === 0 ? (
                  <LoaderWrapper>
                    <EmptyStateContainer>
                      <EmptyStateIcon>
                        <lord-icon
                          src="https://cdn.lordicon.com/uecgmesg.json"
                          trigger="in"
                          colors="primary:#94a3b8"
                        />
                      </EmptyStateIcon>
                      <EmptyStateText>No revenue data</EmptyStateText>
                      <EmptyStateSubtext>
                        Revenue trends will appear once transactions are
                        recorded
                      </EmptyStateSubtext>
                    </EmptyStateContainer>
                  </LoaderWrapper>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueChartData}
                      margin={{
                        top: 5,
                        right: isMobile ? 10 : 20,
                        bottom: 5,
                        left: isMobile ? -10 : 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={colors.textSecondary}
                        axisLine={false}
                        tickLine={false}
                        padding={{ left: 10, right: 10 }}
                        tickFormatter={(tick) =>
                          formatNaiveDate(tick, isMobile ? "M/d" : "MMM d")
                        }
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis
                        stroke={colors.textSecondary}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value}`}
                        width={isMobile ? 45 : 50}
                        domain={["auto", "auto"]}
                        allowDecimals={false}
                        style={{ fontSize: "12px" }}
                      />
                      <RechartsTooltip
                        content={renderRechartsTooltip}
                        cursor={{
                          stroke: colors.primary,
                          strokeDasharray: "3 3",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="gross_revenue"
                        name="Gross Revenue"
                        stroke={colors.primary}
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          fill: colors.primary,
                          strokeWidth: 2,
                          stroke: "white",
                        }}
                        activeDot={{
                          r: 6,
                          fill: colors.primary,
                          strokeWidth: 2,
                          stroke: "white",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </ChartCard>
          </Col>
          <Col xs={24} lg={8}>
            <ContentListCard>
              <CardTitle>
                <Calendar size={isMobile ? 18 : 20} color={colors.primary} />
                Upcoming Experiences
              </CardTitle>
              {loading ? (
                <ScrollableList>
                  <UpcomingClassesSkeletonList />
                </ScrollableList>
              ) : (
                <ScrollableList>
                  <List
                    itemLayout={isSmallMobile ? "vertical" : "horizontal"}
                    dataSource={overviewData?.upcoming_classes ?? []}
                    locale={{
                      emptyText: (
                        <EmptyStateContainer $padding="50px 20px">
                          <EmptyStateIcon>
                            <lord-icon
                              src="https://cdn.lordicon.com/fhtaantg.json"
                              trigger="in"
                              colors="primary:#94a3b8"
                            />
                          </EmptyStateIcon>
                          <EmptyStateText>
                            No upcoming experiences
                          </EmptyStateText>
                          <EmptyStateSubtext>
                            Experiences scheduled in the next 7 days will appear
                            here
                          </EmptyStateSubtext>
                        </EmptyStateContainer>
                      ),
                    }}
                    renderItem={(cls, index) => {
                      const isCourseSession =
                        cls.booking_type === "Full Course";
                      const occupancyPercentage =
                        cls.max_occupancy > 0
                          ? Math.min(
                              100,
                              (cls.current_occupancy / cls.max_occupancy) * 100,
                            )
                          : 0;
                      const occupancyColor =
                        getOccupancyColor(occupancyPercentage);

                      const EditButtonComponent = () => {
                        const button = (
                          <Button
                            type="text"
                            shape="circle"
                            icon={<Edit3 size={16} />}
                            onClick={() => handleOpenEditDrawer(cls)}
                            loading={
                              editingScheduleId === cls.schedule_instance_id
                            }
                            disabled={isCourseSession}
                            key={`btn-${
                              editingScheduleId === cls.schedule_instance_id
                            }`}
                          />
                        );
                        if (isCourseSession) {
                          return (
                            <Tooltip title="Course schedules are edited from the 'My Experiences' page, not individually.">
                              <span
                                style={{
                                  display: "inline-block",
                                  cursor: "not-allowed",
                                }}
                              >
                                {button}
                              </span>
                            </Tooltip>
                          );
                        }
                        return (
                          <Tooltip title="Edit Schedule">{button}</Tooltip>
                        );
                      };

                      return (
                        <StyledListItem
                          key={cls.schedule_instance_id || index}
                          extra={
                            !isSmallMobile && (
                              <Space size="middle">
                                <Tooltip
                                  title={`Occupancy: ${cls.current_occupancy}/${cls.max_occupancy}`}
                                >
                                  <Progress
                                    type="circle"
                                    percent={occupancyPercentage}
                                    size={40}
                                    strokeColor={occupancyColor}
                                    format={() => (
                                      <OccupancyText>
                                        {`${cls.current_occupancy}/${cls.max_occupancy}`}
                                      </OccupancyText>
                                    )}
                                  />
                                </Tooltip>
                                <EditButtonComponent />
                              </Space>
                            )
                          }
                        >
                          <ListItemContent>
                            <ClassInfo>
                              <Tooltip title={cls.name}>
                                <ClassName>{cls.name}</ClassName>
                              </Tooltip>
                              <ClassMeta>
                                {isCourseSession && (
                                  <Tooltip title="This is a session within a multi-day course.">
                                    <TagIcon
                                      size={12}
                                      style={{ color: colors.chart.purple }}
                                    />
                                  </Tooltip>
                                )}
                                <Clock size={12} />
                                <span>{cls.time}</span>
                              </ClassMeta>
                            </ClassInfo>
                          </ListItemContent>
                          {isSmallMobile && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                                marginTop: "12px",
                              }}
                            >
                              <Tooltip
                                title={`Occupancy: ${cls.current_occupancy}/${cls.max_occupancy}`}
                              >
                                <Progress
                                  type="circle"
                                  percent={occupancyPercentage}
                                  size={40}
                                  strokeColor={occupancyColor}
                                  format={() => (
                                    <OccupancyText>
                                      {`${cls.current_occupancy}/${cls.max_occupancy}`}
                                    </OccupancyText>
                                  )}
                                />
                              </Tooltip>
                              <EditButtonComponent />
                            </div>
                          )}
                        </StyledListItem>
                      );
                    }}
                  />
                </ScrollableList>
              )}
            </ContentListCard>
          </Col>
        </GridSection>

        <GridSection gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
          <Col xs={24} lg={8}>
            <ContentListCard>
              <CardTitle>
                <Users size={isMobile ? 18 : 20} color={colors.primary} />
                Most Popular Experiences
              </CardTitle>
              {loading ? (
                <ScrollableList>
                  <PopularClassesSkeletonList />
                </ScrollableList>
              ) : (
                <ScrollableList>
                  <List
                    itemLayout="horizontal"
                    dataSource={overviewData?.popular_classes ?? []}
                    locale={{
                      emptyText: (
                        <EmptyStateContainer $padding="50px 20px">
                          <EmptyStateIcon>
                            <lord-icon
                              src="https://cdn.lordicon.com/fhtaantg.json"
                              trigger="in"
                              colors="primary:#94a3b8"
                            />
                          </EmptyStateIcon>
                          <EmptyStateText>
                            No enrollment data yet
                          </EmptyStateText>
                          <EmptyStateSubtext>
                            Popular experiences will be displayed once guests
                            start enrolling
                          </EmptyStateSubtext>
                        </EmptyStateContainer>
                      ),
                    }}
                    renderItem={(cls, index) => {
                      const EditButtonComponent = () => (
                        <Link href={`/business/dashboard/listings`}>
                          <Button
                            type="text"
                            size="small"
                            icon={<Edit3 size={14} />}
                            style={{
                              color: colors.textSecondary,
                              padding: "4px 8px",
                              height: "auto",
                            }}
                          />
                        </Link>
                      );

                      return (
                        <StyledListItem
                          key={index}
                          extra={
                            !isSmallMobile && (
                              <Space size={12} align="center">
                                <EnrollmentMetric>
                                  <Users size={16} />
                                  <AnimatedNumberFlow
                                    value={cls.enrollment || 0}
                                    loading={loading}
                                    numberFormatOptions={{
                                      maximumFractionDigits: 0,
                                    }}
                                  />
                                </EnrollmentMetric>
                                <EditButtonComponent />
                              </Space>
                            )
                          }
                        >
                          <ListItemContent>
                            <ClassInfo>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <MinimalRankBadge>
                                  #{index + 1}
                                </MinimalRankBadge>
                                <Tooltip title={cls.name}>
                                  <ClassName>{cls.name}</ClassName>
                                </Tooltip>
                              </div>
                            </ClassInfo>
                          </ListItemContent>
                          {isSmallMobile && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                                marginTop: "12px",
                              }}
                            >
                              <EnrollmentMetric>
                                <Users size={16} />
                                <AnimatedNumberFlow
                                  value={cls.enrollment || 0}
                                  loading={loading}
                                  numberFormatOptions={{
                                    maximumFractionDigits: 0,
                                  }}
                                />
                              </EnrollmentMetric>
                              <EditButtonComponent />
                            </div>
                          )}
                        </StyledListItem>
                      );
                    }}
                  />
                </ScrollableList>
              )}
            </ContentListCard>
          </Col>
          <Col xs={24} lg={16}>
            <ContentListCard>
              <CardTitle>
                <Activity size={isMobile ? 18 : 20} color={colors.primary} />
                Recent Activity
              </CardTitle>
              {loading ? (
                <ScrollableList>
                  <RecentActivitySkeletonList />
                </ScrollableList>
              ) : (
                <ScrollableList>
                  <List
                    itemLayout="horizontal"
                    dataSource={overviewData?.recent_activity ?? []}
                    locale={{
                      emptyText: (
                        <div>
                          <EmptyStateContainer $padding="50px 20px">
                            <EmptyStateIcon>
                              <lord-icon
                                src="https://cdn.lordicon.com/bgebyztw.json"
                                trigger="in"
                                colors="primary:#94a3b8"
                              />
                            </EmptyStateIcon>
                            <EmptyStateText>No recent activity</EmptyStateText>
                            <EmptyStateSubtext>
                              Activity from the past 3 days will appear here
                            </EmptyStateSubtext>
                          </EmptyStateContainer>
                        </div>
                      ),
                    }}
                    renderItem={(activity, index) => {
                      const IconComponent = iconMap[activity.icon] || Activity;
                      const displayTime = activity.timestamp
                        ? formatUTCToUserDisplay(
                            activity.timestamp,
                            userTimeZone,
                            { dateTimeFormat: "p, MMM d" },
                          )
                        : "N/A";
                      return (
                        <ActivityItem key={index}>
                          <ActivityContent>
                            <ActivityIcon
                              $background={activity.color || colors.info}
                            >
                              <IconComponent size={18} />
                            </ActivityIcon>
                            <ActivityText>{activity.message}</ActivityText>
                          </ActivityContent>
                          <Tooltip
                            title={
                              activity.timestamp
                                ? formatUTCToUserDisplay(
                                    activity.timestamp,
                                    userTimeZone,
                                    { dateTimeFormat: "PP p (zzz)" },
                                  )
                                : ""
                            }
                          >
                            <TimeStamp>{displayTime}</TimeStamp>
                          </Tooltip>
                        </ActivityItem>
                      );
                    }}
                  />
                </ScrollableList>
              )}
            </ContentListCard>
          </Col>
        </GridSection>

        <ScheduleEditDrawer
          open={scheduleEditDrawer.visible}
          onClose={handleCloseEditDrawer}
          onSchedulesUpdate={onDataRefresh}
          classData={scheduleEditDrawer.classData}
          editingSchedule={scheduleEditDrawer.editingSchedule}
          startInEditMode={scheduleEditDrawer.startInEditMode}
          hideBackButton={scheduleEditDrawer.hideBackButton}
          form={scheduleForm}
        />
    </DashboardWrapper>
  );
});

export default Overview;
