"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUrlState } from "@/hooks/useUrlState";
import styled from "styled-components";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import NumberFlow from "@number-flow/react";
import {
  Table,
  Card,
  Select,
  Button,
  Form,
  Input,
  ConfigProvider,
  Avatar,
  Tag,
  Space,
  Grid,
  Empty,
  Divider,
  Radio,
  Checkbox,
  Typography,
  Dropdown,
  Popconfirm,
} from "antd";
import message from "@/lib/message";
import {
  Briefcase,
  MapPin,
  Star,
  BarChart2,
  DollarSign,
  Calendar,
  Activity,
  Eye,
  Award,
  Search,
  X,
  Check,
  Clock,
  Trash2,
  Zap,
  MoreHorizontal,
  Building,
  CheckCircle,
  Globe,
  Phone,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Shield,
  UserCheck,
  Users,
  Mail,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Percent,
  FileText,
  AlertTriangle,
  ExternalLink,
  LogIn,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  AdminCardSkeleton,
  AdminTableSkeleton,
  AdminDrawerContentSkeleton,
  AdminMetricCardsSkeleton,
  AdminAreaChartSkeleton,
  AdminPieChartSkeleton,
  AdminHorizontalBarChartSkeleton,
  AdminRankedListSkeleton,
} from "../shared/AdminSkeletons";

import {
  businessManagementService,
  verificationService,
  classManagementService,
  userAdminService,
} from "@/services/adminDash";
import { useAuthStore } from "@/lib/auth-client";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { theme as appTheme } from "@/components/theme"; // Adjust path
import { businessClassService } from "@/services/apiService";
import AdminMetricCards from "../shared/AdminMetricCards";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph, Link } = Typography;

// --- THEME COLORS ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#111827",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const categoryColors = {
  academic: "#3b82f6",
  music: "#8b5cf6",
  dance: "#ec4899",
  fitness: "#10b981",
  art: "#f97316",
  technology: "#0ea5e9",
  sports: "#ef4444",
  default: "#64748b",
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE STYLED COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  @media (max-width: 768px) {
    padding: 8px;
    gap: 0;
  }
`;

const ContentLayer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  padding: 20px 24px;
  @media (max-width: 768px) {
    padding: 14px 16px;
    border-radius: 12px;
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

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

// --- CONTENT SECTION WRAPPER ---
const ContentSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const ContentHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;
`;

const ContentTitle = styled(Title).attrs({ level: 5 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    color: ${colors.primary};
    height: 18px;
    width: 18px;
  }
`;

const ContentDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;
`;

const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid ${colors.border};
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #f8fafc !important;
    color: ${colors.textSecondary};
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid ${colors.border};
    &::before { display: none; }
  }
  .ant-table-tbody > tr > td {
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid ${colors.border};
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 0;
`;

const ChartCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 16px 20px !important;
  }
`;

const BulkActionsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: ${hexToRgba(colors.primary, 0.04)};
  border-bottom: 1px solid ${colors.border};
  font-size: 13px;
  color: ${colors.textPrimary};
`;

// --- MOBILE COMPONENTS ---
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;
const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;

// --- VERIFICATION REVIEW DRAWER ---
const VerifOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1060;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const VerifDrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const VerifMobileShell = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 1061;
  outline: none;
  max-height: 90vh;
`;

const VerifDesktopShell = styled(Drawer.Content)`
  right: 8px; top: 8px; bottom: 8px;
  position: fixed;
  z-index: 1061;
  outline: none;
  width: 560px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0,0,0,0.14), 0 4px 24px rgba(0,0,0,0.10);
  background: white;
  display: flex;
  flex-direction: column;
`;

const VerifDrawerInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const VerifDrawerHeader = styled.div`
  padding: 18px 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const VerifDrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: ${colors.lightBg};
`;

const VerifStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => p.$color || colors.info}18;
  color: ${(p) => p.$color || colors.info};
  border: 1px solid ${(p) => p.$color || colors.info}30;
`;

const VerifDrawerFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${colors.border};
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-shrink: 0;
  background: white;
`;
const BusinessAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 28px;
  background-color: ${colors.primary};
  color: white;
  border-radius: 12px;
`;
const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin: 20px;
`;
const InfoGroupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  svg {
    color: ${colors.primary};
  }
`;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;
const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;
const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  margin-top: 2px;
`;
const InfoContent = styled.div``;
const InfoLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-bottom: 2px;
`;
const InfoValue = styled(Paragraph)`
  &.ant-typography {
    font-weight: 500;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
  }
`;

// --- UTILITY & HELPER FUNCTIONS ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
const formatDate = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "N/A";
const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  const [h, m] = timeString.split(":");
  return new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};
const socialIcons = {
  facebook: <Facebook />,
  twitter: <Twitter />,
  instagram: <Instagram />,
  linkedin: <Linkedin />,
  youtube: <Youtube />,
};

const formatBusinessHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return [];
  }
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const groupedByTime = hours.reduce((acc, day) => {
    const timeRange = day.isOpen
      ? `${formatTime(day.open)} - ${formatTime(day.close)}`
      : "Closed";
    if (!acc[timeRange]) {
      acc[timeRange] = [];
    }
    acc[timeRange].push(day.day);
    return acc;
  }, {});
  const formattedLines = [];
  for (const timeRange in groupedByTime) {
    const days = groupedByTime[timeRange].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );
    if (days.length === 0) continue;
    let currentGroup = [days[0]];
    const dayGroups = [];
    for (let i = 1; i < days.length; i++) {
      const currentDayIndex = dayOrder.indexOf(days[i]);
      const prevDayIndex = dayOrder.indexOf(days[i - 1]);
      if (currentDayIndex === prevDayIndex + 1) {
        currentGroup.push(days[i]);
      } else {
        dayGroups.push(currentGroup);
        currentGroup = [days[i]];
      }
    }
    dayGroups.push(currentGroup);
    const dayString = dayGroups
      .map((group) => {
        if (group.length > 2) {
          return `${group[0]} - ${group[group.length - 1]}`;
        }
        return group.join(", ");
      })
      .join(", ");
    formattedLines.push({ days: dayString, times: timeRange });
  }
  return formattedLines;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: "6px 0 0 0", color: entry.color }}>
            {`${entry.name}: `}
            <strong>
              {entry.name.toLowerCase().includes("revenue")
                ? formatCurrency(entry.value)
                : new Intl.NumberFormat().format(entry.value)}
            </strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- BUSINESS DETAIL DRAWER (AdminResponsiveDrawer) ---
const BusinessDetailDrawerInner = ({
  business,
  onAction,
  actionLoading,
  onViewOwnerProfile,
  onImpersonate,
  onOpenVerif,
}) => {
  const [classRows, setClassRows] = useState([]);
  const [reviewRows, setReviewRows] = useState([]);
  const [extrasLoading, setExtrasLoading] = useState(true);

  useEffect(() => {
    const bid = business?.businessId;
    if (!bid) {
      setClassRows([]);
      setReviewRows([]);
      setExtrasLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setExtrasLoading(true);
      const [cRes, rRes] = await Promise.all([
        classManagementService.getClasses({ business_id: bid, page_size: 50 }),
        classManagementService.getReviews({ business_id: bid, page_size: 5 }),
      ]);
      if (cancelled) return;
      const unpack = (res) => {
        if (!res?.success) return [];
        const d = res.data;
        if (Array.isArray(d?.results)) return d.results;
        if (Array.isArray(d)) return d;
        return [];
      };
      setClassRows(unpack(cRes));
      setReviewRows(unpack(rRes));
      setExtrasLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [business?.businessId]);

  const {
    businessName,
    businessType,
    businessCity,
    businessState,
    businessAddress,
    businessZipCode,
    verificationStatus,
    average_rating,
    review_count,
    google_review_count,
    createdAt,
    businessHours,
    businessDescription,
    studentContactPhone,
    studentContactEmail,
    website,
    social_media_links,
    isActive,
    featured,
    owner_email,
    owner_id,
    business_image_medium_url,
    has_active_schedules,
    revenue,
    classes_count,
    bookings_count,
  } = business;

  const formattedHours = formatBusinessHours(businessHours || []);
  const totalReviews = (review_count || 0) + (google_review_count || 0);
  const operationalTag = !isActive ? (
    <Tag color="error">Closed</Tag>
  ) : has_active_schedules ? (
    <Tag color="success">Open</Tag>
  ) : (
    <Tag color="warning">No Schedules</Tag>
  );

  const classColumns = [
    { title: "Class", dataIndex: "title", key: "title", ellipsis: true },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s) => <Tag>{s || "—"}</Tag>,
    },
  ];

  return (
    <div style={{ background: colors.lightBg, minHeight: "100%" }}>
      <div
        style={{
          margin: 16,
          padding: 16,
          background: "white",
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Space align="start" size={16} style={{ width: "100%" }}>
          <Avatar
            src={business_image_medium_url}
            shape="square"
            size={72}
            style={{ borderRadius: 10 }}
          >
            {businessName?.[0]}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Title level={4} style={{ margin: 0 }} ellipsis>
                {businessName}
              </Title>
              {operationalTag}
              {verificationStatus === "pending" && (
                <Tag color="blue">Pending Review</Tag>
              )}
              {verificationStatus === "verified" && (
                <Tag
                  color="processing"
                  icon={<CheckCircle size={12} />}
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  Verified
                </Tag>
              )}
            </div>
            <div style={{ marginTop: 6 }}>
              <Star
                size={16}
                fill="#f59e0b"
                color="#f59e0b"
                style={{ verticalAlign: "middle", marginRight: 4 }}
              />
              <Text strong>{parseFloat(average_rating || 0).toFixed(1)}</Text>
              <Text type="secondary" style={{ marginLeft: 4 }}>
                ({totalReviews})
              </Text>
            </div>
            {(google_review_count || 0) > 0 && (
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginTop: 2 }}
              >
                {review_count || 0} platform, {google_review_count} Google
              </Text>
            )}
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {owner_email || "—"}
            </Text>
          </div>
        </Space>
      </div>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          background: colors.lightBg,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Space wrap>
          <Button
            icon={
              isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />
            }
            onClick={() =>
              onAction("toggleActive", business.businessId, !isActive)
            }
            loading={actionLoading}
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            type="primary"
            ghost={featured}
            icon={<Award size={16} />}
            onClick={() =>
              onAction("toggleFeature", business.businessId, !featured)
            }
            loading={actionLoading}
          >
            {featured ? "Unfeature" : "Feature"}
          </Button>
          {owner_id != null && (
            <Button
              icon={<LogIn size={16} />}
              onClick={() => onImpersonate(owner_id)}
            >
              Impersonate owner
            </Button>
          )}
          {owner_email && (
            <Button
              type="default"
              icon={<ExternalLink size={16} />}
              onClick={() => onViewOwnerProfile(owner_email)}
            >
              View owner profile
            </Button>
          )}
          <Popconfirm
            title={`Permanently delete ${businessName}? This cannot be undone.`}
            onConfirm={() => onAction("delete", business.businessId)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: actionLoading }}
          >
            <Button danger icon={<Trash2 size={16} />} loading={actionLoading}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <InfoGroup>
          <InfoGroupTitle>
            <MapPin />
            Overview
          </InfoGroupTitle>
          <InfoGrid>
            {[businessAddress, businessCity, businessState, businessZipCode].some(
              Boolean
            ) && (
              <InfoItem style={{ gridColumn: "1 / -1" }}>
                <InfoIcon>
                  <MapPin />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Address</InfoLabel>
                  <InfoValue>
                    {[businessAddress, businessCity, businessState, businessZipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {studentContactPhone && (
              <InfoItem>
                <InfoIcon>
                  <Phone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Phone</InfoLabel>
                  <InfoValue>{studentContactPhone}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {studentContactEmail && (
              <InfoItem>
                <InfoIcon>
                  <Mail />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Public email</InfoLabel>
                  <InfoValue as="a" href={`mailto:${studentContactEmail}`}>
                    {studentContactEmail}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {website && (
              <InfoItem>
                <InfoIcon>
                  <Globe />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Website</InfoLabel>
                  <InfoValue as="a" href={website} target="_blank">
                    {website}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            <InfoItem>
              <InfoIcon>
                <Building />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Type</InfoLabel>
                <InfoValue>{businessType?.replace(/_/g, " ")}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Calendar />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Member since</InfoLabel>
                <InfoValue>{formatDate(createdAt)}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem
              style={{ gridColumn: "1 / -1", alignItems: "flex-start" }}
            >
              <InfoIcon>
                <Clock />
              </InfoIcon>
              <InfoContent style={{ width: "100%" }}>
                <InfoLabel>Hours</InfoLabel>
                {formattedHours.length > 0 ? (
                  <div>
                    {formattedHours.map((line, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          maxWidth: "350px",
                          fontSize: "14px",
                          lineHeight: 1.6,
                        }}
                      >
                        <Text strong style={{ color: colors.textPrimary }}>
                          {line.days}
                        </Text>
                        <Text style={{ color: colors.textSecondary }}>
                          {line.times}
                        </Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <InfoValue>Not specified</InfoValue>
                )}
              </InfoContent>
            </InfoItem>
            <InfoItem style={{ gridColumn: "1 / -1" }}>
              <InfoIcon>
                <Shield />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Verification</InfoLabel>
                <InfoValue>
                  <Space wrap align="center">
                    {verificationStatus === "verified" ? (
                      <Tag
                        color="success"
                        icon={<CheckCircle size={12} />}
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        Verified
                      </Tag>
                    ) : (
                      <Tag icon={<AlertTriangle size={12} />}>Not verified</Tag>
                    )}
                    {owner_email &&
                      verificationStatus !== "verified" &&
                      onOpenVerif && (
                        <Button
                          size="small"
                          type="link"
                          icon={<ExternalLink size={13} />}
                          onClick={() => onOpenVerif(owner_email)}
                          style={{ padding: "0 4px", height: "auto", fontSize: 12 }}
                        >
                          Review request
                        </Button>
                      )}
                  </Space>
                </InfoValue>
              </InfoContent>
            </InfoItem>
          </InfoGrid>
          {social_media_links &&
            Object.values(social_media_links).some((v) => v) && (
              <>
                <Divider />
                <Space wrap>
                  {Object.entries(social_media_links).map(
                    ([p, u]) =>
                      u &&
                      socialIcons[p] && (
                        <Button
                          key={p}
                          icon={socialIcons[p]}
                          href={u}
                          target="_blank"
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                      )
                  )}
                </Space>
              </>
            )}
        </InfoGroup>

        {businessDescription && (
          <InfoGroup>
            <InfoGroupTitle>
              <Briefcase />
              About
            </InfoGroupTitle>
            <Paragraph type="secondary">{businessDescription}</Paragraph>
          </InfoGroup>
        )}

        <InfoGroup>
          <InfoGroupTitle>
            <BarChart2 />
            Performance
          </InfoGroupTitle>
          <InfoGrid>
            <InfoItem>
              <InfoIcon>
                <DollarSign />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Revenue</InfoLabel>
                <InfoValue>{formatCurrency(Number(revenue || 0))}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Calendar />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Bookings</InfoLabel>
                <InfoValue>{bookings_count ?? 0}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Briefcase />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Classes</InfoLabel>
                <InfoValue>{classes_count ?? 0}</InfoValue>
              </InfoContent>
            </InfoItem>
          </InfoGrid>
        </InfoGroup>

        <InfoGroup>
          <InfoGroupTitle>
            <Briefcase />
            Classes
          </InfoGroupTitle>
          {extrasLoading ? (
            <AdminTableSkeleton rows={4} />
          ) : (
            <Table
              size="small"
              columns={classColumns}
              dataSource={classRows}
              rowKey={(r) => r.classId}
              pagination={false}
              locale={{ emptyText: "No classes" }}
            />
          )}
        </InfoGroup>

        <InfoGroup>
          <InfoGroupTitle>
            <Star />
            Recent reviews
          </InfoGroupTitle>
          {extrasLoading ? (
            <AdminCardSkeleton />
          ) : reviewRows.length === 0 ? (
            <Text type="secondary">No reviews yet.</Text>
          ) : (
            reviewRows.map((rev) => (
              <div
                key={rev.reviewId}
                style={{
                  padding: "10px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Space>
                  <Text strong>
                    {rev.rating != null ? `${rev.rating}★` : "—"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(rev.createdAt)}
                  </Text>
                </Space>
                {rev.comment && (
                  <Paragraph
                    style={{ marginBottom: 0, marginTop: 6, fontSize: 13 }}
                    ellipsis={{ rows: 3 }}
                  >
                    {rev.comment}
                  </Paragraph>
                )}
              </div>
            ))
          )}
        </InfoGroup>
      </div>
    </div>
  );
};

const BusinessDetailDrawer = ({
  open,
  onClose,
  business,
  detailsLoading,
  onAction,
  actionLoading,
  onViewOwnerProfile,
  onImpersonate,
  onOpenVerif,
}) => {
  const isMobile = !useBreakpoint().md;
  const title = business?.businessName || "Business details";
  return (
    <AdminResponsiveDrawer
      open={open}
      onClose={onClose}
      title={title}
      titleIcon={<Briefcase size={20} style={{ color: colors.primary }} />}
      isMobile={isMobile}
      width="min(920px, 96vw)"
      showCopyLink
    >
      {detailsLoading || !business ? (
        <div style={{ padding: 24 }}>
          <AdminDrawerContentSkeleton />
        </div>
      ) : (
        <BusinessDetailDrawerInner
          business={business}
          onAction={onAction}
          actionLoading={actionLoading}
          onViewOwnerProfile={onViewOwnerProfile}
          onImpersonate={onImpersonate}
          onOpenVerif={onOpenVerif}
        />
      )}
    </AdminResponsiveDrawer>
  );
};

// --- MAIN COMPONENT ---
const BusinessManagement = () => {
  const router = useRouter();
  const [businessIdRaw, setBusinessIdParam] = useUrlState("businessId");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [growthTrendLoading, setGrowthTrendLoading] = useState(true);

  const handleViewOwnerProfile = useCallback(
    (ownerEmail) => {
      if (!ownerEmail) return;
      setDetailDrawerOpen(false);
      setBusinessIdParam(null);
      router.push(`/admin/users?openUserByEmail=${encodeURIComponent(ownerEmail)}`);
    },
    [router, setBusinessIdParam]
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total_businesses: 0,
    total_business_growth: 0,
    active_businesses: 0,
    total_revenue: 0,
    total_platform_revenue: 0,
    featured_businesses: 0,
    category_distribution: [],
    collection_distribution: [],
    province_distribution: [],
    top_cities: [],
    search_location_top: [],
    search_preset_demand: [],
    search_custom_top: [],
    growth_trend: [],
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    featured: false,
    province: undefined,
    revenue_tier: undefined,
    verification_status: undefined,
  });
  const [timeframe, setTimeframe] = useState("month");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const closeBusinessDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setBusinessIdParam(null);
  }, [setBusinessIdParam]);
  const [verifDrawerOpen, setVerifDrawerOpen] = useState(false);
  const [verifRequest, setVerifRequest] = useState(null);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifActionLoading, setVerifActionLoading] = useState(false);
  const [verifDecision, setVerifDecision] = useState(null);
  const [verifNotes, setVerifNotes] = useState("");
  const [verifForm] = Form.useForm();
  const [sortedInfo, setSortedInfo] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const isMobile = !useBreakpoint().md;

  const fetchData = useCallback(
    async (currentPagination, currentSorter) => {
      setLoading(true);
      const params = {
        page: currentPagination.current,
        page_size: currentPagination.pageSize,
        search: filters.search,
        category: filters.category !== "all" ? filters.category : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        featured: filters.featured ? true : undefined,
        ...(filters.province && { province: filters.province }),
        ...(filters.verification_status && {
          verification_status: filters.verification_status,
        }),
        ...(filters.revenue_tier && { revenue_tier: filters.revenue_tier }),
        ordering:
          currentSorter.columnKey && currentSorter.order
            ? `${currentSorter.order === "descend" ? "-" : ""}${
                currentSorter.columnKey
              }`
            : undefined,
      };
      try {
        const r = await businessManagementService.getBusinesses(params);
        if (r.success) {
          setBusinesses(r.data.results || []);
          setPagination((p) => ({ ...p, total: r.data.count || 0 }));
        } else {
          message.error(r.error || "Failed to fetch businesses");
        }
      } catch (e) {
        message.error("Error fetching businesses");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchDashboardData = useCallback(async () => {
    setMetricsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const r = await businessManagementService.getPlatformMetrics();
      if (r.success) {
        setMetrics((p) => ({ ...p, ...r.data }));
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else message.error(r.error || "Failed to fetch metrics");
    } catch (e) {
      message.error("Failed to load dashboard metrics");
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const r = await businessClassService.getCategories();
      if (r.success) {
        setCategoriesList(r.data || []);
      } else {
        message.error(r.error || "Failed to fetch categories");
      }
    } catch (e) {
      message.error("Error fetching categories list");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchGrowthTrends = useCallback(async () => {
    setGrowthTrendLoading(true);
    try {
      const r = await businessManagementService.getGrowthTrends(timeframe);
      setMetrics((p) => ({ ...p, growth_trend: r.success ? r.data : [] }));
    } catch (e) {
      message.error("Failed to fetch trends");
    } finally {
      setGrowthTrendLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchDashboardData();
    fetchCategories();
  }, [fetchDashboardData, fetchCategories]);

  useEffect(() => {
    fetchData(pagination, sortedInfo);
  }, [fetchData, pagination.current, pagination.pageSize, sortedInfo]);

  useEffect(() => {
    fetchGrowthTrends();
  }, [fetchGrowthTrends]);

  const handleTableChange = (p, f, sorter) => {
    setPagination(p);
    setSortedInfo(sorter);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const refreshAllData = () => {
    fetchDashboardData();
    fetchGrowthTrends();
    fetchCategories();
    fetchData({ ...pagination, current: 1 }, sortedInfo);
  };

  const handleAction = async (actionType, businessId, value) => {
    setActionLoading(true);
    let response;
    let successMessage = "";

    try {
      switch (actionType) {
        case "toggleFeature":
          response = await businessManagementService.toggleFeatureStatus(
            businessId,
            value
          );
          successMessage = `Business ${value ? "featured" : "unfeatured"}.`;
          break;
        case "toggleActive":
          response = await businessManagementService.updateBusiness(
            businessId,
            { isActive: value }
          );
          successMessage = `Business ${value ? "activated" : "deactivated"}.`;
          break;
        case "delete":
          response = await businessManagementService.deleteBusiness(businessId);
          successMessage = "Business deleted successfully.";
          break;
        default:
          throw new Error("Invalid action type");
      }

      if (response.success) {
        message.success(successMessage);
        if (actionType === "delete") {
          closeBusinessDetailDrawer();
        }
        refreshAllData(); // Refresh all data to ensure consistency
      } else {
        message.error(response.error || "Action failed.");
      }
    } catch (e) {
      message.error("An unexpected error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkFeature = async () => {
    if (selectedRowKeys.length === 0) return;
    setActionLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRowKeys.map((id) => businessManagementService.toggleFeatureStatus(id, true))
      );
      const ok = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      message.success(`${ok} business(es) featured.`);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      refreshAllData();
    } catch {
      message.error("Some actions failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkToggleActive = async () => {
    if (selectedRows.length === 0) return;
    setActionLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRows.map((b) =>
          businessManagementService.updateBusiness(b.businessId, { isActive: !b.isActive })
        )
      );
      const ok = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      message.success(`${ok} business(es) updated.`);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      refreshAllData();
    } catch {
      message.error("Some actions failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkNotify = () => {
    message.info("Bulk notify: use the notification campaigns or email tools for now.");
  };

  const handleBulkExport = async () => {
    try {
      const params = {
        ...(filters.search && { search: filters.search }),
        ...(filters.category !== "all" && { category: filters.category }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.featured && { featured: true }),
        ...(filters.province && { province: filters.province }),
        ...(filters.verification_status && {
          verification_status: filters.verification_status,
        }),
        ...(filters.revenue_tier && { revenue_tier: filters.revenue_tier }),
      };
      const res = await businessManagementService.exportBusinessesData(params);
      if (res.success) message.success("Export started.");
      else message.error(res.error || "Export failed.");
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch {
      message.error("Export failed.");
    }
  };

  const openVerifDrawer = async (ownerEmail) => {
    setVerifDrawerOpen(true);
    setVerifRequest(null);
    setVerifDecision(null);
    setVerifNotes("");
    setVerifLoading(true);
    try {
      const r = await verificationService.getVerificationRequests({ search: ownerEmail, status: "pending" });
      if (r.success && r.data?.results?.length > 0) {
        setVerifRequest(r.data.results[0]);
      } else if (r.success) {
        setVerifRequest({ notFound: true });
      }
    } catch {
      message.error("Failed to load verification request");
    } finally {
      setVerifLoading(false);
    }
  };

  const handleProcessVerif = async (action) => {
    if (!verifRequest?.id) return;
    setVerifActionLoading(true);
    try {
      const r = await verificationService.processVerification(verifRequest.id, {
        action,
        notes: verifNotes,
        rejection_reason: action === "reject" ? verifNotes : undefined,
      });
      if (r.success) {
        message.success(`Verification ${action === "approve" ? "approved" : "rejected"} successfully.`);
        setVerifDrawerOpen(false);
        refreshAllData();
      } else {
        message.error(r.error?.detail || "Failed to process verification");
      }
    } catch {
      message.error("An error occurred");
    } finally {
      setVerifActionLoading(false);
    }
  };

  const showBusinessDetails = useCallback(
    async (business) => {
      if (!business?.businessId) return;
      setBusinessIdParam(business.businessId);
      setDetailDrawerOpen(true);
      setDetailsLoading(true);
      setSelectedBusiness(null);
      try {
        const response = await businessManagementService.getBusinessDetails(
          business.businessId
        );
        if (response.success && response.data) {
          setSelectedBusiness(response.data);
          setBusinessIdParam(response.data.businessId);
        } else message.error(response.error || "Failed to fetch details");
      } catch (e) {
        message.error("Error fetching details");
      } finally {
        setDetailsLoading(false);
      }
    },
    [setBusinessIdParam]
  );

  const handleImpersonateOwner = useCallback(
    async (userId) => {
      if (userId == null) return;
      try {
        setActionLoading(true);
        const result = await userAdminService.impersonateUser(userId);
        if (result.success && result.data?.user) {
          useAuthStore.setState({
            user: result.data.user,
            isAuthenticated: true,
            isImpersonating: true,
            isLoading: false,
          });
          message.success("Now impersonating owner.");
          router.push("/");
        } else {
          message.error(result.error || "Could not start impersonation.");
        }
      } catch (e) {
        console.error(e);
        message.error("An unexpected error occurred.");
      } finally {
        setActionLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!businessIdRaw) return;
    const id = Number(businessIdRaw);
    if (!Number.isFinite(id)) return;
    if (selectedBusiness?.businessId === id && detailDrawerOpen) return;
    void showBusinessDetails({ businessId: id });
  }, [businessIdRaw, selectedBusiness?.businessId, detailDrawerOpen, showBusinessDetails]);

  const renderVerifDrawerBody = () => {
    if (verifLoading) {
      return (
        <VerifDrawerBody>
          <AdminDrawerContentSkeleton />
        </VerifDrawerBody>
      );
    }
    if (!verifRequest || verifRequest.notFound) {
      return (
        <VerifDrawerBody>
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.textSecondary }}>
            <Shield size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No Pending Verification Request</div>
            <div style={{ fontSize: 13 }}>This business does not have an active verification request.</div>
          </div>
        </VerifDrawerBody>
      );
    }
    const req = verifRequest;
    const statusColor = req.status === "verified" ? colors.success : req.status === "rejected" ? colors.error : colors.warning;
    return (
      <>
        <VerifDrawerBody>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Avatar size={48} src={req.user?.avatar_thumb_url} icon={<UserCheck size={20} />} />
            <div>
              <div style={{ fontWeight: 600, color: colors.textPrimary }}>{req.user?.name || "—"}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>{req.user?.email || "—"}</div>
            </div>
            <VerifStatusBadge $color={statusColor} style={{ marginLeft: "auto" }}>
              {req.status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Pending"}
            </VerifStatusBadge>
          </div>

          {req.business_name && (
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${colors.border}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Business Details</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: colors.textPrimary }}>{req.business_name}</div>
              {req.business_description && <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{req.business_description}</div>}
              {req.business_address && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>{[req.business_address, req.business_city, req.business_state].filter(Boolean).join(", ")}</div>}
            </div>
          )}

          {req.documents?.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${colors.border}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Submitted Documents</div>
              {req.documents.map((doc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < req.documents.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                  <FileText size={16} color={colors.info} />
                  <span style={{ fontSize: 13, flex: 1, color: colors.textPrimary }}>{doc.document_type_display || doc.document_type}</span>
                  <Button type="link" size="small" href={doc.file_url} target="_blank" icon={<ExternalLink size={12} />} style={{ padding: 0 }}>View</Button>
                </div>
              ))}
            </div>
          )}

          {req.status === "pending" && (
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${colors.border}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Decision</div>
              <Radio.Group
                value={verifDecision}
                onChange={(e) => setVerifDecision(e.target.value)}
                style={{ display: "flex", gap: 12, marginBottom: 14 }}
              >
                <Radio.Button value="approve" style={{ flex: 1, textAlign: "center", borderColor: verifDecision === "approve" ? colors.success : undefined, color: verifDecision === "approve" ? colors.success : undefined }}>
                  Approve
                </Radio.Button>
                <Radio.Button value="reject" style={{ flex: 1, textAlign: "center", borderColor: verifDecision === "reject" ? colors.error : undefined, color: verifDecision === "reject" ? colors.error : undefined }}>
                  Reject
                </Radio.Button>
              </Radio.Group>
              {verifDecision && (
                <Input.TextArea
                  rows={3}
                  placeholder={verifDecision === "approve" ? "Optional notes..." : "Reason for rejection (required)..."}
                  value={verifNotes}
                  onChange={(e) => setVerifNotes(e.target.value)}
                  style={{ borderRadius: 8 }}
                />
              )}
            </div>
          )}

          {req.status !== "pending" && (req.notes || req.rejection_reason) && (
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</div>
              <div style={{ fontSize: 13, color: colors.textPrimary }}>{req.notes || req.rejection_reason}</div>
            </div>
          )}
        </VerifDrawerBody>

        {req.status === "pending" && verifDecision && (
          <VerifDrawerFooter>
            <Button onClick={() => setVerifDecision(null)}>Cancel</Button>
            <Button
              type="primary"
              danger={verifDecision === "reject"}
              loading={verifActionLoading}
              disabled={verifDecision === "reject" && !verifNotes.trim()}
              onClick={() => handleProcessVerif(verifDecision)}
              icon={verifDecision === "approve" ? <CheckCircle size={15} /> : <X size={15} />}
            >
              {verifDecision === "approve" ? "Approve Verification" : "Reject Verification"}
            </Button>
          </VerifDrawerFooter>
        )}
      </>
    );
  };

  const columns = [
    {
      title: "Business",
      dataIndex: "businessName",
      key: "businessName",
      sorter: true,
      sortOrder: sortedInfo.columnKey === "businessName" && sortedInfo.order,
      width: 280,
      fixed: "left",
      render: (_, b) => (
        <Space>
          <Avatar
            src={b.business_image_thumb_url}
            shape="square"
            size={40}
            style={{ borderRadius: 6 }}
          >
            {b.businessName?.[0]}
          </Avatar>
          <div>
            <Text strong>{b.businessName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MapPin size={12} style={{ marginRight: 4 }} />
              {b.businessCity}, {b.businessState}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Owner",
      dataIndex: "owner_email",
      key: "owner_email",
      width: 220,
      render: (email) => <Link href={`mailto:${email}`}>{email}</Link>,
    },
    {
      title: "Rating",
      key: "rating",
      dataIndex: "rating",
      sorter: true,
      sortOrder: sortedInfo.columnKey === "rating" && sortedInfo.order,
      width: 130,
      render: (r, b) => {
        const platform = b.review_count || 0;
        const google = b.google_review_count || 0;
        const total = platform + google;
        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={15} fill="#f59e0b" color="#f59e0b" />
              <Text strong>{r || 0}</Text>
              <Text type="secondary">({total})</Text>
            </div>
            {google > 0 && (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                {platform} platform, {google} Google
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "isActive",
      width: 170,
      render: (_, b) => (
        <Space direction="vertical" size={2}>
          {b.verificationStatus === "pending" && (
            <Tag color="blue">Pending Review</Tag>
          )}
          {!b.isActive ? (
            <Tag color="error">Closed</Tag>
          ) : b.has_active_schedules ? (
            <Tag color="success">Open</Tag>
          ) : (
            <Tag color="warning">No Schedules</Tag>
          )}
          {b.featured && (
            <Tag color="gold" icon={<Award size={12} />}>
              Featured
            </Tag>
          )}
          {b.verificationStatus === "verified" && (
            <Tag
              color="blue"
              icon={<CheckCircle size={12} />}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              Verified
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, b) => (
        <Dropdown
          overlay={
            <Space
              direction="vertical"
              style={{
                padding: 8,
                background: "white",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Button
                type="text"
                icon={<Eye size={14} />}
                onClick={() => showBusinessDetails(b)}
              >
                View Details
              </Button>
              <Button
                type="text"
                icon={<Zap size={14} />}
                onClick={() =>
                  handleAction("toggleFeature", b.businessId, !b.featured)
                }
              >
                {b.featured ? "Unfeature" : "Feature"}
              </Button>
              {b.owner_id != null && (
                <Button
                  type="text"
                  icon={<LogIn size={14} />}
                  onClick={() => handleImpersonateOwner(b.owner_id)}
                >
                  Impersonate owner
                </Button>
              )}
            </Space>
          }
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreHorizontal size={18} />} />
        </Dropdown>
      ),
    },
  ];

  const MobileBusinessItem = ({ business, onViewDetails }) => (
    <MobileCard onClick={() => onViewDetails(business)}>
      <MobileCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Space>
            <Avatar
              src={business.business_image_thumb_url}
              shape="square"
              size={48}
              style={{ borderRadius: 8 }}
            >
              {business.businessName?.[0]}
            </Avatar>
            <div>
              <Text strong>{business.businessName}</Text>
              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                <MapPin size={12} style={{ marginRight: 4 }} />
                {business.businessCity}, {business.businessState}
              </Text>
            </div>
          </Space>
          <Space direction="vertical" size={4} align="end">
            {business.verificationStatus === "pending" && (
              <Tag color="blue">Pending</Tag>
            )}
            {!business.isActive ? (
              <Tag color="error">Closed</Tag>
            ) : business.has_active_schedules ? (
              <Tag color="success">Open</Tag>
            ) : (
              <Tag color="warning">No Schedules</Tag>
            )}
          </Space>
        </div>
        <MobileCardRow>
          <MobileCardLabel>Owner</MobileCardLabel>
          <Text copyable={{ text: business.owner_email }}>
            {business.owner_email || "N/A"}
          </Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Rating</MobileCardLabel>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <Text strong>{business.rating || 0}</Text>
              <Text type="secondary">
                ({(business.review_count || 0) + (business.google_review_count || 0)})
              </Text>
            </div>
            {(business.google_review_count || 0) > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {business.review_count || 0} platform, {business.google_review_count} Google
              </Text>
            )}
          </div>
        </MobileCardRow>
      </MobileCardContent>
    </MobileCard>
  );

  const totalRevenue = metrics.total_revenue ?? metrics.gross_sales ?? 0;
  const totalBiz = metrics.total_businesses ?? 0;
  const activeBiz =
    metrics.active_businesses ??
    metrics.active_businesses_in_period ??
    metrics.active_businesses_30d ??
    0;
  const statCardsData = [
    {
      title: "Total Businesses",
      icon: Briefcase,
      value: totalBiz,
      growth: metrics.total_business_growth ?? null,
      color: colors.info,
      footer: "All registered",
      periodBadge: "All-time",
    },
    {
      title: "Active (30d)",
      icon: Activity,
      value: activeBiz,
      tooltip:
        "Logged in within the last 30 days as owner or accepted staff, and has ever received at least one booking.",
      footer: "Logged in last 30d AND ever booked",
      color: colors.success,
      periodBadge: "30d",
    },
    {
      title: "Pending Verifications",
      icon: Shield,
      value: metrics.pending_verifications ?? 0,
      footer: (metrics.pending_verifications ?? 0) > 0 ? "Action required" : "All reviewed",
      color: (metrics.pending_verifications ?? 0) > 0 ? colors.error : colors.success,
      urgent: (metrics.pending_verifications ?? 0) > 0,
      periodBadge: "All-time",
    },
    {
      title: "Platform GMV",
      icon: DollarSign,
      value: totalRevenue,
      isCurrency: true,
      footer: "All-time bookings value",
      color: colors.purple,
      periodBadge: "All-time",
    },
    {
      title: "Widget Subscribers",
      icon: Zap,
      value: metrics.widget_subscribers ?? 0,
      footer: "Paid embed plans",
      color: colors.purple,
      periodBadge: "Current",
    },
  ];

  const provinceBarData = useMemo(() => {
    const rows = [...(metrics.province_distribution || [])];
    return rows.sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [metrics.province_distribution]);

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
      <ContentLayer>
        <DashboardHeader style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <PageTitle>Business Management</PageTitle>
            <HeaderSubtitle>
              Monitor key metrics, manage listings, and analyze platform performance.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={refreshAllData}
              loading={loading || metricsLoading}
            >
              Refresh
            </Button>
          </ActionButtonsContainer>
        </DashboardHeader>

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase", marginBottom: 10 }}>
          Business metrics
        </div>
        <div style={{ marginBottom: 20 }}>
          {metricsLoading ? (
            <AdminMetricCardsSkeleton count={5} />
          ) : (
            <AdminMetricCards
              cards={statCardsData.map((card) => ({
                ...card,
                minimumFractionDigits: card.isCurrency ? 0 : undefined,
                maximumFractionDigits: card.isCurrency ? 0 : undefined,
              }))}
              isReadyForAnimation={isReadyForAnimation}
            />
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <ChartGrid style={{ marginBottom: 20 }}>
          <ChartCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Trend</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Business Growth</div>
              </div>
              <Radio.Group
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                size="small"
                optionType="button"
                buttonStyle="solid"
                options={[
                  { label: "Week", value: "week" },
                  { label: "Month", value: "month" },
                  { label: "Year", value: "year" },
                ]}
              />
            </div>
            <div style={{ height: 240, marginTop: 12 }}>
              {growthTrendLoading ? (
                <AdminAreaChartSkeleton height={240} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={metrics.growth_trend}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradBiz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.info} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={colors.info} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.success} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textTertiary }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: colors.textTertiary }} axisLine={false} tickLine={false} width={28} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: colors.textTertiary }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={40} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconSize={7} iconType="circle" />
                    <Area yAxisId="left" type="monotone" dataKey="businesses" name="Businesses" stroke={colors.info} strokeWidth={2} fill="url(#gradBiz)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke={colors.success} strokeWidth={2} fill="url(#gradRev)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
          <ChartCard>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Breakdown</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Collection Distribution</div>
            </div>
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
              {metricsLoading ? (
                <AdminPieChartSkeleton size={168} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.collection_distribution || []}
                      nameKey="name"
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {(metrics.collection_distribution || []).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => [`${v} classes`]} contentStyle={{ borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 12 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </ChartGrid>

        <Divider style={{ margin: "16px 0" }} />

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Geography</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Provinces & cities</div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.4fr) minmax(260px, 0.75fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <ContentSection>
              <div style={{ padding: "12px 16px 8px" }}>
                <Text strong style={{ fontSize: 13 }}>Businesses by province</Text>
                <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                  Ranked by count. Zero counts use a muted tone to highlight gaps.
                </Text>
              </div>
              <div style={{ height: isMobile ? 300 : 360, padding: "0 8px 12px" }}>
                {metricsLoading ? (
                  <AdminHorizontalBarChartSkeleton rows={13} height={isMobile ? 300 : 360} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={provinceBarData}
                      margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal />
                      <XAxis type="number" tick={{ fontSize: 10, fill: colors.textTertiary }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="province"
                        width={36}
                        tick={{ fontSize: 10, fill: colors.textTertiary }}
                      />
                      <RechartsTooltip
                        formatter={(v) => [`${v} businesses`, "Count"]}
                        contentStyle={{ borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 12 }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {provinceBarData.map((p) => (
                          <Cell key={p.province} fill={p.count === 0 ? "#fecaca" : colors.info} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ContentSection>
            <ContentSection>
              <div style={{ padding: "12px 16px" }}>
                <Text strong style={{ fontSize: 13 }}>Explore search demand</Text>
                <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                  Suggested Ontario areas (same presets as explore) and custom location searches.
                </Text>
              </div>
              <div style={{ padding: "0 16px 16px", maxHeight: 420, overflowY: "auto" }}>
                {metricsLoading ? (
                  <AdminRankedListSkeleton rows={16} />
                ) : (
                  <>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
                      Suggested areas
                    </Text>
                    <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13, listStyle: "disc" }}>
                      {(metrics.search_preset_demand || []).map((row) => (
                        <li key={row.label} style={{ marginBottom: 6 }}>
                          <Text strong>{row.label}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>({row.count})</Text>
                        </li>
                      ))}
                    </ul>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
                      Custom searches
                    </Text>
                    {(metrics.search_custom_top || []).length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 13 }}>No custom locations yet.</Text>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                        {(metrics.search_custom_top || []).map((row, i) => (
                          <li key={`${row.label}-${i}`} style={{ marginBottom: 8 }}>
                            <Text strong>{row.label || "—"}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              ({row.count})
                            </Text>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            </ContentSection>
          </div>
          <ContentSection>
            <div style={{ padding: "12px 16px" }}>
              <Text strong style={{ fontSize: 13 }}>Top cities</Text>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              {metricsLoading ? (
                <AdminTableSkeleton rows={6} />
              ) : (
                <Table
                  size="small"
                  showSizeChanger={false}
                  pagination={false}
                  dataSource={metrics.top_cities || []}
                  rowKey={(r) => `${r.city}-${r.state}`}
                  columns={[
                    { title: "City", dataIndex: "city", key: "city" },
                    { title: "Province", dataIndex: "state", key: "state", width: 100 },
                    { title: "Businesses", dataIndex: "count", key: "count", width: 110 },
                    { title: "Classes", dataIndex: "classes_count", key: "classes_count", width: 100 },
                    {
                      title: "Revenue",
                      dataIndex: "revenue",
                      key: "revenue",
                      width: 120,
                      render: (v) => formatCurrency(Number(v || 0)),
                    },
                  ]}
                />
              )}
            </div>
          </ContentSection>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <ContentSection>
          <ContentHeader>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <ContentTitle><Briefcase /> All Business Listings</ContentTitle>
                <ContentDescription>Search, filter, and manage all registered businesses.</ContentDescription>
              </div>
            </div>
          </ContentHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                prefix={<Search size={14} style={{ color: colors.textTertiary }} />}
                placeholder="Search by name or location"
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                style={{ width: isMobile ? "100%" : 240, borderRadius: 8 }}
              />
              <Select
                value={filters.category}
                style={{ width: isMobile ? "100%" : 160 }}
                onChange={(v) => handleFilterChange("category", v)}
                loading={categoriesLoading}
                disabled={categoriesLoading}
              >
                <Option value="all">All Categories</Option>
                {categoriesList.map((cat) => (
                  <Option key={cat.key} value={cat.key}>{cat.name}</Option>
                ))}
              </Select>
              <Select
                value={filters.status}
                style={{ width: isMobile ? "100%" : 140 }}
                onChange={(v) => handleFilterChange("status", v)}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Select
                placeholder="Province"
                allowClear
                value={filters.province}
                style={{ width: isMobile ? "100%" : 140 }}
                onChange={(v) => handleFilterChange("province", v)}
              >
                {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
              <Select
                placeholder="Revenue Tier"
                allowClear
                value={filters.revenue_tier}
                style={{ width: isMobile ? "100%" : 160 }}
                onChange={(v) => handleFilterChange("revenue_tier", v)}
              >
                <Option value="under_1k">&lt; $1,000</Option>
                <Option value="1k_10k">$1k – $10k</Option>
                <Option value="10k_plus">$10k+</Option>
              </Select>
              <Select
                placeholder="Verification"
                allowClear
                value={filters.verification_status}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(v) => handleFilterChange("verification_status", v)}
              >
                <Option value="verified">Verified</Option>
                <Option value="pending">Pending</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
              <Checkbox
                onChange={(e) => handleFilterChange("featured", e.target.checked)}
                checked={filters.featured}
              >
                Featured Only
              </Checkbox>
            </SearchFilterContainer>
          </FilterBar>
          {selectedRowKeys.length > 0 && (
            <BulkActionsBar>
              <strong>{selectedRowKeys.length} selected</strong>
              <Button size="small" icon={<Award size={13} />} onClick={handleBulkFeature}>Feature</Button>
              <Button size="small" icon={<ToggleRight size={13} />} onClick={handleBulkToggleActive}>Toggle Active</Button>
              <Button size="small" icon={<Mail size={13} />} onClick={handleBulkNotify}>Notify</Button>
              <Button size="small" icon={<FileText size={13} />} onClick={handleBulkExport}>Export</Button>
              <Button size="small" type="text" onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>Clear</Button>
            </BulkActionsBar>
          )}
          {isMobile ? (
            <div style={{ padding: 16 }}>
              {loading ? (
                <AdminTableSkeleton rows={5} />
              ) : businesses.length > 0 ? (
                businesses.map((b) => (
                  <MobileBusinessItem
                    key={b.businessId}
                    business={b}
                    onViewDetails={showBusinessDetails}
                  />
                ))
              ) : (
                <Empty />
              )}
            </div>
          ) : loading ? (
            <AdminTableSkeleton rows={8} />
          ) : (
            <StyledTable
              columns={columns}
              dataSource={businesses}
              rowKey="businessId"
              rowSelection={{
                selectedRowKeys,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys);
                  setSelectedRows(rows || []);
                },
              }}
              pagination={{ ...pagination, size: "small", showSizeChanger: true, pageSizeOptions: ["10", "20", "50"] }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          )}
        </ContentSection>
      </ContentLayer>

        <BusinessDetailDrawer
          open={detailDrawerOpen}
          onClose={closeBusinessDetailDrawer}
          business={detailsLoading ? null : selectedBusiness}
          detailsLoading={detailsLoading}
          onAction={handleAction}
          actionLoading={actionLoading}
          onViewOwnerProfile={handleViewOwnerProfile}
          onImpersonate={handleImpersonateOwner}
          onOpenVerif={openVerifDrawer}
        />

        {/* VERIFICATION REVIEW DRAWER */}
        <Drawer.Root
          open={verifDrawerOpen}
          onOpenChange={(open) => { if (!open) setVerifDrawerOpen(false); }}
          direction={isMobile ? undefined : "right"}
          dismissible
        >
          <Drawer.Portal>
            <VerifOverlay />
            {isMobile ? (
              <VerifMobileShell>
                <VerifDrawerHandle />
                <VerifDrawerInner>
                  <VerifDrawerHeader>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 16, color: colors.textPrimary }}>
                      <Shield size={18} color={colors.primary} />
                      Review Verification
                    </div>
                    <Button type="text" icon={<X size={18} />} onClick={() => setVerifDrawerOpen(false)} />
                  </VerifDrawerHeader>
                  {renderVerifDrawerBody()}
                </VerifDrawerInner>
              </VerifMobileShell>
            ) : (
              <VerifDesktopShell style={{ "--initial-transform": "calc(100% + 8px)" }}>
                <VerifDrawerInner>
                  <VerifDrawerHeader>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 16, color: colors.textPrimary }}>
                      <Shield size={18} color={colors.primary} />
                      Review Verification
                    </div>
                    <Button type="text" icon={<X size={18} />} onClick={() => setVerifDrawerOpen(false)} />
                  </VerifDrawerHeader>
                  {renderVerifDrawerBody()}
                </VerifDrawerInner>
              </VerifDesktopShell>
            )}
          </Drawer.Portal>
        </Drawer.Root>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BusinessManagement;
