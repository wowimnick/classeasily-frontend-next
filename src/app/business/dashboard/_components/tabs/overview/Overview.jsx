"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useDashboard } from "../../DashboardContext";
import styled, { css } from "styled-components";
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
  Edit3, // Import Edit icon
  Shield, // Import Shield icon for permission denied
  AlertTriangle,
} from "lucide-react";
import {
  Typography,
  Card,
  Tooltip,
  Space,
  ConfigProvider,
  Grid,
  Spin,
  Alert,
  Empty,
  List,
  Skeleton,
  Row,
  Col,
  Divider,
  Button, // Import Button
  message, // Import message
  Form, // Import Form
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

import AppGlobalStyles from "@/app/GlobalStyles";
import { formatUTCToUserDisplay, formatNaiveDate } from "@/services/utils";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { scheduleService } from "@/services/apiService";
import ScheduleEditDrawer from "../classes/manageclasses/ScheduleEditDrawer";
import { LordIcon } from "@/services/ReactUtils";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9", // Updated to match Discounts.jsx
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

const getErrorMessage = (error) => {
  // 1. Handle Axios-style error responses
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === "string") {
      return data.detail; // Handles { "detail": "Error message" }
    }
    if (typeof data.message === "string") {
      return data.message;
    }
    if (typeof data.error === "string") {
      return data.error;
    }
    // Handles DRF validation errors: { "field": ["error"], "field2": ["error"] }
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

  // 2. Handle custom service error formats
  if (typeof error?.error === "string") {
    return error.error;
  }
  if (typeof error?.detail === "string") {
    return error.detail;
  }

  // 3. Handle standard JavaScript Error objects
  if (error?.message) {
    return error.message;
  }

  // 4. Handle if the error is just a string
  if (typeof error === "string") {
    return error;
  }

  // 5. Fallback for any other unknown format
  return "An unexpected error occurred. Please try again.";
};

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

  @media (max-width: 480px) {
    padding: 12px;
    gap: 8px;
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

// Mobile-optimized grid for stats
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

// Mobile-optimized grid for snapshots (horizontal on mobile)
const SnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
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
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100%;
  }

  @media (max-width: 768px) {
    min-height: 120px;
    border-radius: 12px;

    .ant-card-body {
      padding: 16px;
    }
  }

  @media (max-width: 480px) {
    min-height: 110px;
    border-radius: 10px;

    .ant-card-body {
      padding: 14px;
    }
  }
`;

// Mobile snapshot card (horizontal scrollable)
const MobileSnapshotCard = styled(StatCardBase)`
  @media (max-width: 768px) {
    min-height: 120px;
    border-radius: 12px;

    .ant-card-body {
      padding: 16px;
    }
  }

  @media (max-width: 480px) {
    min-height: 110px;
    border-radius: 10px;

    .ant-card-body {
      padding: 14px;
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

  @media (max-width: 480px) {
    margin-bottom: 8px;
  }
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || hexToRgba(colors.info, 0.1)};
  color: ${(props) => props.iconcolor || colors.info};
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    border-radius: 8px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    border-radius: 6px;

    svg {
      width: 14px;
      height: 14px;
    }
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
    font-size: 18px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 2px;
  }
`;

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${(props) => (props.change >= 0 ? colors.success : colors.error)};
  background: ${(props) =>
    props.change >= 0
      ? hexToRgba(colors.success, 0.1)
      : hexToRgba(colors.error, 0.1)};
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    gap: 2px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
    padding: 1px 4px;
  }
`;

const StatLabel = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
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

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const ChartCard = styled(StatCardBase)`
  min-height: 400px;

  @media (max-width: 768px) {
    min-height: 350px;
  }

  @media (max-width: 480px) {
    min-height: 300px;
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  margin-top: 16px;
  position: relative;

  @media (max-width: 768px) {
    height: 250px;
    margin-top: 12px;
  }

  @media (max-width: 480px) {
    height: 200px;
    margin-top: 8px;
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
    margin-bottom: 12px !important;
    gap: 6px;
  }

  @media (max-width: 480px) {
    font-size: 15px;
    margin-bottom: 8px !important;
    gap: 4px;
  }
`;

const SectionTitle = styled(CardTitle)`
  margin-bottom: 12px !important;

  @media (max-width: 768px) {
    margin-bottom: 8px !important;
  }

  @media (max-width: 480px) {
    margin-bottom: 6px !important;
  }
`;

const ContentListCard = styled(StatCardBase)`
  min-height: 400px;

  @media (max-width: 768px) {
    min-height: 350px;
  }

  @media (max-width: 480px) {
    min-height: 300px;
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
    padding-right: 4px;
    margin-right: -4px;
  }

  @media (max-width: 480px) {
    max-height: 240px;
    padding-right: 2px;
    margin-right: -2px;
  }
`;

const ClassItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background-color: #fff;
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;

  &:hover {
    background-color: #f9fafb;
    border-color: ${colors.primary}60;
  }

  @media (max-width: 768px) {
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 6px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 4px;
  }
`;

const ClassInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const ClassName = styled.span`
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 2px;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
  }
`;

const ClassMeta = styled.span`
  color: ${colors.textSecondary};
  font-size: 13px;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const OccupancyBar = styled.div`
  width: 80px;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 60px;
    height: 5px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 4px;
    margin-top: 4px;
  }
`;

const OccupancyFill = styled.div`
  height: 100%;
  background-color: ${(props) => props.color};
  width: ${(props) => props.percentage}%;
  transition: width 0.3s ease;
`;

// Mobile-optimized class controls
const MobileClassControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px;

  @media (min-width: 481px) {
    display: none;
  }
`;

const DesktopClassControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    display: none;
  }
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

  @media (max-width: 768px) {
    padding: 10px 0 !important;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 8px 0 !important;
  }
`;

const ActivityContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 10px;
  }

  @media (max-width: 480px) {
    gap: 8px;
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
  background: ${(props) => props.background};
  color: white;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    border-radius: 6px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    border-radius: 4px;

    svg {
      width: 14px;
      height: 14px;
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

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const TimeStamp = styled.span`
  color: ${colors.textSecondary};
  font-size: 12px;
  white-space: nowrap;
  margin-left: 12px;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-left: 8px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
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

  @media (max-width: 480px) {
    padding: 8px;
    border-radius: 6px;

    p {
      font-size: 11px;
    }

    strong {
      font-size: 13px;
    }
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;

  @media (max-width: 768px) {
    min-height: 150px;
  }

  @media (max-width: 480px) {
    min-height: 120px;
  }
`;

// New styled component for permission denied message
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

  @media (max-width: 480px) {
    gap: 8px;
    margin-top: 8px;
  }
`;

const PermissionDeniedText = styled(Text)`
  font-weight: 600;
  font-size: 15px;
  color: ${colors.error} !important;
  margin: 0 !important;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const PermissionDeniedSubtext = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary} !important;
  margin: 0 !important;
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

// Mobile-optimized divider
const ResponsiveDivider = styled(Divider)`
  margin: 24px 0;

  @media (max-width: 768px) {
    margin: 16px 0;
  }

  @media (max-width: 480px) {
    margin: 12px 0;
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

const ActionPromptCard = styled(Card)`
  background-color: ${hexToRgba(colors.warning, 0.08)};
  border: 1px solid ${hexToRgba(colors.warning, 0.3)};
  margin-bottom: 24px;

  .ant-card-body {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
  }

  @media (max-width: 768px) {
    margin-bottom: 20px;
    border-radius: 12px;
    border-width: 1.5px;

    &::before {
      width: 4px;
    }

    .ant-card-body {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px 20px 20px 24px;
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    margin-bottom: 16px;
    border-radius: 10px;

    .ant-card-body {
      padding: 16px;
      gap: 12px;
    }
  }
`;

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
    title: "Students This Month",
    icon: Users,
    color: colors.chart.blue,
    link: "/business/dashboard/students",
  },
  active_classes: {
    title: "Active Classes",
    icon: BookOpen,
    color: colors.chart.green,
    link: "/business/dashboard/classes",
  },
  monthly_revenue: {
    title: "Gross Revenue (Month)",
    icon: DollarSign,
    color: colors.chart.purple,
    prefix: "$",
    link: "/business/dashboard/revenue",
  },
  average_rating: {
    title: "Average Rating",
    icon: Star,
    color: colors.chart.orange,
    suffix: "/5 stars",
    link: "/business/dashboard/reviews",
  },
};

// --- START: FIXED COMPONENT ---
// This component now correctly handles the animation after the skeleton disappears.
const AnimatedNumberFlow = ({
  value,
  prefix = "",
  suffix = "",
  loading,
  numberFormatOptions = {},
}) => {
  // State to hold the value that will be animated.
  // We initialize it to 0, which is our animation starting point.
  const [displayValue, setDisplayValue] = useState(0);

  const targetValue = useMemo(() => {
    if (value == null || isNaN(value)) return 0;
    return Number(value);
  }, [value]);

  useEffect(() => {
    // When the loading from the parent is finished, we trigger the animation.
    if (!loading) {
      // This timer ensures that the skeleton has been removed and the component
      // has rendered once with its initial value (0) before starting the animation.
      const timer = setTimeout(() => {
        setDisplayValue(targetValue);
      }, 50); // A brief delay is enough to ensure a smooth visual transition.

      return () => clearTimeout(timer);
    }
  }, [loading, targetValue]); // Re-run if loading state changes or the target value itself changes.

  // The parent component (`Overview.jsx`) is responsible for rendering the <Skeleton>.
  // This component is only rendered when loading is false.
  // Therefore, we don't return null or a skeleton here, preventing the flicker.
  return (
    <>
      {prefix}
      <NumberFlow
        value={displayValue} // This value transitions from 0 to targetValue
        format={numberFormatOptions}
        animated={true} // Animation is always enabled
      />
      {suffix}
    </>
  );
};
// --- END: FIXED COMPONENT ---

const Overview = forwardRef((props, ref) => {
  const {
    overviewData,
    overviewLoading: loading,
    overviewError: error,
    fetchOverviewData: onDataRefresh,
  } = useDashboard();
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
    scheduleData: null,
    optionType: null,
    optionId: null,
  });

  const overviewTitleRef = useRef(null);
  useImperativeHandle(ref, () => ({
    getTargetElement: () => overviewTitleRef.current,
  }));

  // Prepare animated values with better defaults
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

  const handleOpenEditDrawer = async (scheduleInstanceId) => {
    if (editingScheduleId) return;
    setEditingScheduleId(scheduleInstanceId);
    try {
      const result = await scheduleService.fetchInstance(scheduleInstanceId);
      if (result.success && result.data) {
        const apiData = result.data;
        if (!apiData.booking_type) {
          message.error(
            "This schedule lacks key details (like booking type) and cannot be edited from here."
          );
          return;
        }

        // Correctly transform the fetched data to match the drawer's expected props
        const transformedData = {
          id: apiData.schedule, // The actual schedule ID
          name: apiData.name,
          price: apiData.price,
          maxParticipants: apiData.max_participants,
          duration: apiData.duration,
          time: apiData.time, // Already in HH:mm format
          // Fields for "Single Session"
          date: apiData.date, // Already in YYYY-MM-DD format
          // Fields for "Full Course"
          day: apiData.day,
          start_date: apiData.start_date,
          end_date: apiData.end_date,
          allow_late_enrollment: apiData.allow_late_enrollment,
        };

        setScheduleEditDrawer({
          visible: true,
          scheduleData: transformedData,
          optionType: apiData.booking_type,
          optionId: apiData.option,
        });
      } else {
        message.error(
          getErrorMessage(result.error) ||
            "Failed to load schedule details for editing."
        );
      }
    } catch (err) {
      message.error(getErrorMessage(err));
      console.error(err);
    } finally {
      setEditingScheduleId(null);
    }
  };

  const handleScheduleSave = async (action, data) => {
    if (action !== "edit" || !scheduleEditDrawer.scheduleData) {
      message.error("Invalid save operation from this view.");
      return;
    }

    const idToUpdate = scheduleEditDrawer.scheduleData.id;
    if (!idToUpdate) {
      message.error("Cannot update: Parent schedule ID is missing.");
      return;
    }

    // Construct the full payload required by the backend serializer
    let payload = {
      name: data.name,
      time: data.time,
      duration: data.duration,
      price: data.price,
      maxParticipants: data.maxParticipants,
    };

    if (scheduleEditDrawer.optionType === "Single Session") {
      payload.date = data.date;
    } else if (scheduleEditDrawer.optionType === "Full Course") {
      payload.day = data.day;
      payload.start_date = data.start_date;
      payload.end_date = data.end_date;
      payload.allow_late_enrollment = data.allow_late_enrollment;
    }

    try {
      const result = await scheduleService.updateSchedule(idToUpdate, payload);
      if (result.success) {
        message.success("Schedule updated successfully.");
        handleCloseEditDrawer();
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        message.error(
          getErrorMessage(result.error) || "Failed to update the schedule."
        );
      }
    } catch (error) {
      console.error("Error updating schedule from overview:", error);
      message.error(getErrorMessage(error));
    }
  };

  const handleCloseEditDrawer = () => {
    setScheduleEditDrawer({
      visible: false,
      scheduleData: null,
      optionType: null,
      optionId: null,
    });
  };

  const revenueChartData = useMemo(() => {
    if (loading || error || !overviewData?.revenue_trend) return [];
    return overviewData.revenue_trend.map((item) => ({
      ...item,
      gross_revenue: item.gross_revenue || item.revenue || 0,
    }));
  }, [overviewData, loading, error]);

  // Check if revenue data access is denied
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

  const mainStats = useMemo(() => {
    // Always include monthly_revenue in the layout order.
    // The rendering logic below will handle the permission check.
    return [
      "total_students",
      "active_classes",
      "monthly_revenue",
      "average_rating",
    ];
  }, []);

  const todaySnap = overviewData?.today_snapshot || {};
  const todaySnapshotMetrics = [
    {
      key: "today_classes_running",
      title: "Classes Today",
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
      title: "Participants Today",
      value: todaySnap.today_total_participants || 0,
      icon: UserPlus,
      color: colors.chart.orange,
    },
  ];

  if (error && !loading)
    return (
      <ConfigProvider theme={localAntDTheme}>
        <AppGlobalStyles />
        <DashboardWrapper>
          <Alert
            message="Error Loading Dashboard"
            description={error}
            type="error"
            showIcon
          />
        </DashboardWrapper>
      </ConfigProvider>
    );
  if (!loading && !error && !overviewData)
    return (
      <ConfigProvider theme={localAntDTheme}>
        <AppGlobalStyles />
        <DashboardWrapper>
          <Empty description="No overview data available." />
        </DashboardWrapper>
      </ConfigProvider>
    );

  return (
    <ConfigProvider theme={localAntDTheme}>
      <AppGlobalStyles />
      <DashboardWrapper>
        <DashboardHeader ref={overviewTitleRef}>
          <div>
            <StyledTitle>Dashboard Overview</StyledTitle>
            <HeaderSubtitle>
              Welcome back! Here's a summary of your business activity.
            </HeaderSubtitle>
          </div>
        </DashboardHeader>

        {!loading &&
          overviewData?.actionable_prompts?.classes_needing_schedules_count >
            0 && (
            <ActionPromptCard>
              <IconContainer
                background={hexToRgba(colors.warning, 0.15)}
                iconcolor={colors.warning}
              >
                <AlertTriangle />
              </IconContainer>
              <div style={{ flex: 1 }}>
                <Text strong>Action Required</Text>
                <Paragraph style={{ marginBottom: 0, color: "#4a5568" }}>
                  You have{" "}
                  <b>
                    {
                      overviewData.actionable_prompts
                        .classes_needing_schedules_count
                    }
                  </b>{" "}
                  {overviewData.actionable_prompts
                    .classes_needing_schedules_count === 1
                    ? "class that is"
                    : "classes that are"}{" "}
                  running out of schedules. Add more to keep them visible to
                  students.
                </Paragraph>
              </div>
              <Link href="/business/dashboard/classes">
                <Button type="primary" ghost>
                  Manage Classes
                </Button>
              </Link>
            </ActionPromptCard>
          )}

        <ResponsiveDivider />

        <div>
          <SectionTitle>
            <BarChart size={isMobile ? 18 : 20} color={colors.primary} />
            Monthly Overview
          </SectionTitle>
        </div>

        <StatsGrid>
          {mainStats.map((key) => {
            const displayInfo = metricDisplayInfo[key];

            // Handle loading state first for all cards
            if (loading) {
              return (
                <MetricStatCard key={key}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </MetricStatCard>
              );
            }

            // Handle permission denied state for the revenue card
            if (
              key === "monthly_revenue" &&
              !overviewData?.metrics?.monthly_revenue
            ) {
              return (
                <MetricStatCard key={key} $isClickable={false}>
                  <div>
                    <StatHeader>
                      <IconContainer
                        background={hexToRgba(colors.error, 0.1)}
                        iconcolor={colors.error}
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

            // Default rendering for all other cards with data
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
                      background={iconBackground}
                      iconcolor={iconcolor}
                    >
                      <MetricIconComponent />
                    </IconContainer>
                    {changeValue != null && (
                      <MetricChange change={changeValue}>
                        {changeValue >= 0 ? (
                          <LordIcon
                            src="https://cdn.lordicon.com/excswhey.json"
                            colors="primary:#30c702"
                            size={isMobile ? "16px" : "20px"}
                            trigger="hover"
                            playOnLoad={true}
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
                        {formatChange(changeValue, isPercentageChange)}
                      </MetricChange>
                    )}
                  </StatHeader>
                  <StatLabel>
                    {displayInfo?.title || key.replace(/_/g, " ")}
                  </StatLabel>
                </div>
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
                      uniqueKey={`main-${key}`}
                    />
                  )}
                </MetricValue>
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
        </div>

        <SnapshotGrid>
          {todaySnapshotMetrics.map((stat) => {
            const IconComponent = stat.icon || Activity;
            const iconcolor = stat.color || colors.info;
            const iconBackground = hexToRgba(iconcolor, 0.15);

            const CardComponent = isSmallMobile
              ? MobileSnapshotCard
              : SnapshotStatCard;

            return (
              <CardComponent key={stat.key}>
                {loading ? (
                  <Skeleton
                    active
                    paragraph={{ rows: isSmallMobile ? 1 : 2 }}
                  />
                ) : (
                  <>
                    <div>
                      <StatHeader>
                        <IconContainer
                          background={iconBackground}
                          iconcolor={iconcolor}
                        >
                          <IconComponent />
                        </IconContainer>
                      </StatHeader>
                      <StatLabel>{stat.title}</StatLabel>
                    </div>
                    <MetricValue>
                      <AnimatedNumberFlow
                        value={stat.value}
                        loading={loading}
                        numberFormatOptions={{ maximumFractionDigits: 0 }}
                        uniqueKey={`snapshot-${stat.key}`}
                      />
                    </MetricValue>
                  </>
                )}
              </CardComponent>
            );
          })}
        </SnapshotGrid>

        <ResponsiveDivider />

        {/* Asymmetric Layout: Revenue Chart (Large - 16 cols) + Upcoming Classes (Smaller - 8 cols) */}
        <GridSection gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
          <Col xs={24} lg={16}>
            <ChartCard>
              <CardTitle>
                <LordIcon
                  src="https://cdn.lordicon.com/excswhey.json"
                  colors="primary:#f56231"
                  size={isMobile ? "18px" : "20px"}
                  trigger="hover"
                  playOnLoad={true}
                />
                Revenue Trend (Last 30 days)
              </CardTitle>
              <ChartContainer>
                {loading ? (
                  <LoaderWrapper>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoaderWrapper>
                ) : revenueAccessDenied ? (
                  <PermissionDeniedContainer
                    style={{ marginTop: 0, height: "100%" }}
                  >
                    <lord-icon
                      src="https://cdn.lordicon.com/ebyacdql.json"
                      trigger="in"
                      state="in-cross"
                      colors="primary:#c45759"
                      style={{
                        width: isMobile ? "32px" : "40px",
                        height: isMobile ? "32px" : "40px",
                      }}
                    ></lord-icon>
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
                        left: isMobile ? 5 : 20,
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
                        style={{ fontSize: isMobile ? "10px" : "12px" }}
                      />
                      <YAxis
                        stroke={colors.textSecondary}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          value == null || isNaN(value)
                            ? "$0"
                            : `${Math.round(value)}`
                        }
                        width={isMobile ? 35 : 60}
                        domain={["auto", "auto"]}
                        allowDecimals={false}
                        style={{ fontSize: isMobile ? "10px" : "12px" }}
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
                        strokeWidth={isMobile ? 1.5 : 2}
                        dot={
                          revenueChartData.length <= 30
                            ? {
                                r: isMobile ? 3 : 4,
                                fill: colors.primary,
                                strokeWidth: 2,
                                stroke: "white",
                              }
                            : false
                        }
                        activeDot={{
                          r: isMobile ? 4 : 6,
                          fill: colors.primary,
                          strokeWidth: 2,
                          stroke: "white",
                        }}
                        connectNulls={false}
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
                Upcoming Classes (Next 7 Days)
              </CardTitle>
              {loading ? (
                <LoaderWrapper>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </LoaderWrapper>
              ) : overviewData?.upcoming_classes &&
                overviewData.upcoming_classes.length > 0 ? (
                <ScrollableList>
                  {overviewData.upcoming_classes.map((cls, index) => {
                    const occupancyPercentage =
                      cls.max_occupancy > 0
                        ? Math.min(
                            100,
                            (cls.current_occupancy / cls.max_occupancy) * 100
                          )
                        : 0;
                    const occupancyColor =
                      getOccupancyColor(occupancyPercentage);
                    return (
                      <ClassItemContainer
                        key={cls.schedule_instance_id || index}
                      >
                        <ClassInfo>
                          <ClassName>{cls.name}</ClassName>
                          <ClassMeta>{cls.time}</ClassMeta>
                        </ClassInfo>

                        <DesktopClassControls>
                          <Tooltip
                            title={`Occupancy: ${cls.current_occupancy}/${cls.max_occupancy}`}
                          >
                            <Space>
                              <Users size={16} color={colors.textSecondary} />
                              <span
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: "14px",
                                  minWidth: "40px",
                                  textAlign: "right",
                                }}
                              >
                                {cls.current_occupancy}/{cls.max_occupancy}
                              </span>
                              <OccupancyBar>
                                <OccupancyFill
                                  color={occupancyColor}
                                  percentage={occupancyPercentage}
                                />
                              </OccupancyBar>
                            </Space>
                          </Tooltip>
                          <Tooltip title="Edit Schedule">
                            <Button
                              type="text"
                              shape="circle"
                              icon={<Edit3 size={16} />}
                              onClick={() =>
                                handleOpenEditDrawer(cls.schedule_instance_id)
                              }
                              loading={
                                editingScheduleId === cls.schedule_instance_id
                              }
                            />
                          </Tooltip>
                        </DesktopClassControls>

                        <MobileClassControls>
                          <Space>
                            <Users size={14} color={colors.textSecondary} />
                            <span
                              style={{
                                color: colors.textSecondary,
                                fontSize: "12px",
                              }}
                            >
                              {cls.current_occupancy}/{cls.max_occupancy}
                            </span>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            shape="circle"
                            icon={<Edit3 size={14} />}
                            onClick={() =>
                              handleOpenEditDrawer(cls.schedule_instance_id)
                            }
                            loading={
                              editingScheduleId === cls.schedule_instance_id
                            }
                          />
                          <OccupancyBar>
                            <OccupancyFill
                              color={occupancyColor}
                              percentage={occupancyPercentage}
                            />
                          </OccupancyBar>
                        </MobileClassControls>
                      </ClassItemContainer>
                    );
                  })}
                </ScrollableList>
              ) : (
                <LoaderWrapper>
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/fhtaantg.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                        style={{ height: 40, width: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No upcoming classes</EmptyStateText>
                    <EmptyStateSubtext>
                      Classes scheduled in the next 7 days will appear here
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                </LoaderWrapper>
              )}
            </ContentListCard>
          </Col>
        </GridSection>

        {/* Asymmetric Layout: Popular Classes (Smaller - 8 cols) + Recent Activity (Large - 16 cols) */}
        <GridSection gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
          <Col xs={24} lg={8}>
            <ContentListCard>
              <CardTitle>
                <Users size={isMobile ? 18 : 20} color={colors.primary} />
                Most Popular Classes
              </CardTitle>
              {loading ? (
                <LoaderWrapper>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </LoaderWrapper>
              ) : overviewData?.popular_classes &&
                overviewData.popular_classes.length > 0 ? (
                <ScrollableList>
                  {overviewData.popular_classes.map((cls, index) => (
                    <Link
                      href={`/business/dashboard/classes`}
                      key={index}
                      style={{ textDecoration: "none" }}
                    >
                      <ClassItemContainer>
                        <ClassName style={{ flexGrow: 1 }}>
                          {cls.name}
                        </ClassName>
                        <Space align="center">
                          <Users
                            size={isMobile ? 14 : 16}
                            color={colors.chart.blue}
                          />
                          <span
                            style={{
                              color: colors.chart.blue,
                              fontWeight: 500,
                              fontSize: isMobile ? "12px" : "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <AnimatedNumberFlow
                              value={cls.enrollment || 0}
                              loading={loading}
                              numberFormatOptions={{
                                maximumFractionDigits: 0,
                              }}
                              uniqueKey={`popular-${index}`}
                            />
                            student
                            {(cls.enrollment || 0) !== 1 ? "s" : ""}
                          </span>
                        </Space>
                      </ClassItemContainer>
                    </Link>
                  ))}
                </ScrollableList>
              ) : (
                <LoaderWrapper>
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/fhtaantg.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                        style={{ height: 40, width: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No enrollment data yet</EmptyStateText>
                    <EmptyStateSubtext>
                      Popular classes will be displayed once students start
                      enrolling
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                </LoaderWrapper>
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
                <LoaderWrapper>
                  <Skeleton active avatar paragraph={{ rows: 4 }} />
                </LoaderWrapper>
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
                                style={{ height: 40, width: 40 }}
                              />
                            </EmptyStateIcon>
                            <EmptyStateText>No recent activity</EmptyStateText>
                            <EmptyStateSubtext>
                              Activity from the past 30 days will appear here
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
                            { dateTimeFormat: isMobile ? "p" : "p, MMM d" }
                          )
                        : "N/A";
                      return (
                        <ActivityItem key={index}>
                          <ActivityContent>
                            <ActivityIcon
                              background={activity.color || colors.info}
                            >
                              <IconComponent size={isMobile ? 14 : 18} />
                            </ActivityIcon>
                            <ActivityText>{activity.message}</ActivityText>
                          </ActivityContent>
                          <Tooltip
                            title={
                              activity.timestamp
                                ? formatUTCToUserDisplay(
                                    activity.timestamp,
                                    userTimeZone,
                                    { dateTimeFormat: "PP p (zzz)" }
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
          onCancel={handleCloseEditDrawer}
          onSubmit={handleScheduleSave}
          editingSchedule={scheduleEditDrawer.scheduleData}
          optionType={scheduleEditDrawer.optionType}
          optionId={scheduleEditDrawer.optionId}
          form={scheduleForm}
        />
      </DashboardWrapper>
    </ConfigProvider>
  );
});

export default Overview;
