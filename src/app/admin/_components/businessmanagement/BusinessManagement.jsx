"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Table, Card, Select, Button, Form, Input, ConfigProvider, Avatar, Tag, Space, Grid, Empty, Divider, Radio, Checkbox, Typography, Dropdown, Skeleton, Popconfirm,  } from 'antd';
import message from '@/lib/message';
import {
  Briefcase,
  MapPin,
  Star,
  TrendingUp,
  TrendingDown,
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
  Download,
  Mail,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Percent,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
const CanadianDistribution = dynamic(() => import("./CanadianDistribution"), {
  ssr: false,
  loading: () => <GlobalLoaderWithInlineStyles />,
});

import { businessManagementService } from "@/services/adminDash"; // Adjust path
import { theme as appTheme } from "@/components/theme"; // Adjust path
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { businessClassService } from "@/services/apiService";

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
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
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
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 8px;
    gap: 0;
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

// --- STATS CARDS ---
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
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
    padding: 12px !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    @media (max-width: 768px) {
      padding: 16px !important;
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
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PercentChange = styled.span`
  color: ${(props) => (props.isPositive ? colors.success : colors.error)};
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
`;

// --- CONTENT SECTION WRAPPER ---
const ContentSection = styled(motion.div)`
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
    background: #fafbfc;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
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

// --- DETAIL DRAWER --- (Copied from BookingsList)
const DrawerOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1050;
  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;
const DrawerContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  @media (max-width: 768px) {
    max-height: 85vh;
    border-radius: 24px 24px 0 0;
  }
`;
const DragHandle = styled(motion.div)`
  display: none;
  width: 40px;
  height: 5px;
  background: #d1d1d1;
  border-radius: 2.5px;
  margin: 12px auto 0;
  cursor: grab;
  @media (max-width: 768px) {
    display: block;
  }
`;
const DrawerCloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  &:hover {
    background: #e0e0e0;
  }
`;
const DrawerHeaderSection = styled.header`
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`;
const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${colors.lightBg};
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

// --- DRAWER COMPONENT ---
const DetailDrawerContent = ({ business, onAction, actionLoading }) => {
  if (!business)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <GlobalLoaderWithInlineStyles />
      </div>
    );

  const {
    businessName,
    businessType,
    businessCity,
    businessState,
    verificationStatus,
    average_rating,
    review_count,
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
    business_image_medium_url,
  } = business;

  const formattedHours = formatBusinessHours(businessHours || []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          style={{
            background: "white",
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <BusinessAvatar src={business_image_medium_url}>
            {businessName?.[0]}
          </BusinessAvatar>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {businessName}
            </Title>
            <Text type="secondary">
              {[businessCity, businessState].filter(Boolean).join(", ")}
            </Text>
          </div>
        </div>
        <div style={{ padding: "0" }}>
          <InfoGroup>
            <InfoGroupTitle>
              <Shield />
              Admin Actions
            </InfoGroupTitle>
            <Space wrap>
              <Popconfirm
                title={`Permanently delete ${businessName}? This cannot be undone.`}
                onConfirm={() => onAction("delete", business.businessId)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: actionLoading }}
              >
                <Button
                  danger
                  icon={<Trash2 size={16} />}
                  loading={actionLoading}
                >
                  Delete
                </Button>
              </Popconfirm>
              <Button
                icon={
                  isActive ? (
                    <ToggleLeft size={16} />
                  ) : (
                    <ToggleRight size={16} />
                  )
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
            </Space>
          </InfoGroup>
        </div>
        <InfoGroup>
          <InfoGroupTitle>
            <InfoGrid />
            Business Overview
          </InfoGroupTitle>
          <InfoGrid>
            <InfoItem>
              <InfoIcon>
                <Star />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Avg. Rating</InfoLabel>
                <InfoValue>
                  {parseFloat(average_rating || 0).toFixed(1)} (
                  {review_count || 0} reviews)
                </InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <UserCheck />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Owner</InfoLabel>
                <InfoValue copyable={{ text: owner_email }}>
                  {owner_email || "N/A"}
                </InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Calendar />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Member Since</InfoLabel>
                <InfoValue>{formatDate(createdAt)}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Building />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Type</InfoLabel>
                <InfoValue>{businessType?.replace(/_/g, " ")}</InfoValue>
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
            <InfoItem>
              <InfoIcon>
                <CheckCircle />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Verification</InfoLabel>
                <InfoValue>
                  {verificationStatus === "verified" ? (
                    <Tag color="success">Verified</Tag>
                  ) : (
                    <Tag>Not Verified</Tag>
                  )}
                </InfoValue>
              </InfoContent>
            </InfoItem>
          </InfoGrid>
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
            <Phone />
            Contact
          </InfoGroupTitle>
          <InfoGrid>
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
                  <InfoLabel>Email</InfoLabel>
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
      </motion.div>
    </AnimatePresence>
  );
};

const DetailDrawerModal = ({
  isVisible,
  onClose,
  business,
  onAction,
  actionLoading,
}) => {
  const isMobile = !useBreakpoint().md;
  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100) onClose();
  };

  const variants = isMobile
    ? {
        hidden: { y: "100%" },
        visible: {
          y: 0,
          transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: { y: "100%", transition: { duration: 0.2 } },
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
      };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isVisible && (
        <DrawerOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <DrawerContainer
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 500 }}
            onDragEnd={handleDragEnd}
            dragSnapToOrigin
          >
            <DragHandle />
            <DrawerHeaderSection>
              <Space align="center">
                <Briefcase size={20} style={{ color: colors.primary }} />
                <span style={{ fontWeight: 600, fontSize: "16px" }}>
                  Business Details
                </span>
              </Space>
              <DrawerCloseButton whileTap={{ scale: 0.9 }} onClick={onClose}>
                <X size={20} />
              </DrawerCloseButton>
            </DrawerHeaderSection>
            <DrawerContent>
              <DetailDrawerContent
                business={business}
                onAction={onAction}
                actionLoading={actionLoading}
              />
            </DrawerContent>
          </DrawerContainer>
        </DrawerOverlay>
      )}
    </AnimatePresence>,
    document.body
  );
};

// --- MAIN COMPONENT ---
const BusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [growthTrendLoading, setGrowthTrendLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
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
    growth_trend: [],
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    featured: false,
  });
  const [timeframe, setTimeframe] = useState("month");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [geographicalData, setGeographicalData] = useState([]);
  const [mapDataType, setMapDataType] = useState("count");
  const [sortedInfo, setSortedInfo] = useState({});
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

  const fetchGeographicalData = useCallback(async () => {
    setMapLoading(true);
    try {
      const r = await businessManagementService.getGeographicalData(
        mapDataType
      );
      if (r.success) setGeographicalData(r.data);
      else message.error(r.error || "Failed geographical data");
    } catch (e) {
      message.error("Failed to load map data.");
    } finally {
      setMapLoading(false);
    }
  }, [mapDataType]);

  useEffect(() => {
    fetchDashboardData();
    fetchGeographicalData();
    fetchCategories();
  }, [fetchDashboardData, fetchGeographicalData, fetchCategories]);

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
    fetchGeographicalData();
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
          setIsDetailModalVisible(false);
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

  const showBusinessDetails = async (business) => {
    setIsDetailModalVisible(true);
    setDetailsLoading(true);
    setSelectedBusiness(null);
    try {
      const response = await businessManagementService.getBusinessDetails(
        business.businessId
      );
      if (response.success) setSelectedBusiness(response.data);
      else message.error(response.error || "Failed to fetch details");
    } catch (e) {
      message.error("Error fetching details");
    } finally {
      setDetailsLoading(false);
    }
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
      render: (r, b) => (
        <Space>
          <Star size={15} fill="#f59e0b" color="#f59e0b" />
          <span>{r || 0}</span>
          <Text type="secondary">({b.review_count || 0})</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "isActive",
      width: 150,
      render: (_, b) => (
        <Space direction="vertical" size={2}>
          <Tag color={b.isActive ? "success" : "error"}>
            {b.isActive ? "Active" : "Inactive"}
          </Tag>
          {b.featured && (
            <Tag color="gold" icon={<Award size={12} />}>
              Featured
            </Tag>
          )}
          {b.verificationStatus === "verified" && (
            <Tag color="blue" icon={<CheckCircle size={12} />}>
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
          <Tag color={business.isActive ? "success" : "error"}>
            {business.isActive ? "Active" : "Inactive"}
          </Tag>
        </div>
        <MobileCardRow>
          <MobileCardLabel>Owner</MobileCardLabel>
          <Text copyable={{ text: business.owner_email }}>
            {business.owner_email || "N/A"}
          </Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Rating</MobileCardLabel>
          <Space>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            {business.rating || 0} ({business.review_count || 0})
          </Space>
        </MobileCardRow>
      </MobileCardContent>
    </MobileCard>
  );

  const statCardsData = [
    {
      title: "Total Businesses",
      icon: Briefcase,
      value: metrics.total_businesses,
      growth: metrics.total_business_growth,
      color: colors.info,
      footer: "vs last period",
    },
    {
      title: "Active Businesses",
      icon: Activity,
      value: metrics.active_businesses,
      footer: `${
        metrics.total_businesses > 0
          ? (
              (metrics.active_businesses / metrics.total_businesses) *
              100
            ).toFixed(0)
          : 0
      }% of total`,
      color: colors.success,
    },
    {
      title: "Gross Sales (GMV)",
      icon: DollarSign,
      value: metrics.total_revenue,
      isCurrency: true,
      footer: "All-time bookings value",
      color: "#8b5cf6",
    },
    {
      title: "Featured",
      icon: Award,
      value: metrics.featured_businesses,
      footer: "Highlighted businesses",
      color: colors.warning,
    },
  ];

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Business Management</PageTitle>
            <HeaderSubtitle>
              Monitor key metrics, manage listings, and analyze platform
              performance.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <Button
              icon={<Download size={16} />}
              onClick={() => message.info("Export coming soon!")}
            >
              Export
            </Button>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={refreshAllData}
              loading={loading || metricsLoading}
            >
              Refresh
            </Button>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <div style={{ marginBottom: "20px" }}>
          <Text
            style={{
              fontSize: "17px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <BarChart2 size={20} color={colors.primary} /> Platform Metrics
          </Text>
          <StatsGrid>
            {statCardsData.map((stat) => (
              <StatCard key={stat.title}>
                {metricsLoading ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <div>
                      <StatCardHeader>
                        <IconContainer
                          background={hexToRgba(stat.color, 0.1)}
                          color={stat.color}
                        >
                          <stat.icon size={18} />
                        </IconContainer>
                      </StatCardHeader>
                      <StatLabel>{stat.title}</StatLabel>
                    </div>
                    <StatValue>
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value : 0}
                        duration={800}
                        {...(stat.isCurrency && {
                          numberFormatOptions: {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        })}
                      />
                    </StatValue>
                    <StatFooter>
                      {stat.growth !== undefined && (
                        <PercentChange isPositive={stat.growth >= 0}>
                          {stat.growth >= 0 ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}
                          {`${stat.growth.toFixed(1)}%`}
                        </PercentChange>
                      )}
                      {stat.footer}
                    </StatFooter>
                  </>
                )}
              </StatCard>
            ))}
          </StatsGrid>
        </div>

        <ChartGrid>
          <ContentSection>
            <ContentHeader>
              <ContentTitle>
                <TrendingUp /> Business Growth
              </ContentTitle>
              <ContentDescription>
                Track new registrations and gross sales over time.
              </ContentDescription>
            </ContentHeader>
            <div style={{ padding: 24 }}>
              <Radio.Group
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Radio.Button value="week">Week</Radio.Button>
                <Radio.Button value="month">Month</Radio.Button>
                <Radio.Button value="year">Year</Radio.Button>
              </Radio.Group>
              <div style={{ height: 280 }}>
                {growthTrendLoading ? (
                  <GlobalLoaderWithInlineStyles />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.growth_trend}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.border}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        stroke={colors.textTertiary}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke={colors.textTertiary}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={colors.textTertiary}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatCurrency}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="businesses"
                        name="Businesses"
                        stroke={colors.info}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke={colors.success}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </ContentSection>
          <ContentSection>
            <ContentHeader>
              <ContentTitle>
                <Users /> Category Distribution
              </ContentTitle>
              <ContentDescription>
                Business distribution across class categories.
              </ContentDescription>
            </ContentHeader>
            <div
              style={{
                height: 350,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {metricsLoading ? (
                <GlobalLoaderWithInlineStyles />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.category_distribution}
                      nameKey="name"
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {metrics.category_distribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => [`${v} businesses`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ContentSection>
        </ChartGrid>

        <ContentSection style={{ marginBottom: 24 }}>
          <ContentHeader>
            <ContentTitle>
              <MapPin /> Geographical Distribution
            </ContentTitle>
            <ContentDescription>
              Visualize business presence and revenue across Canada.
            </ContentDescription>
          </ContentHeader>
          <div style={{ height: isMobile ? 350 : 500 }}>
            {mapLoading ? (
              <GlobalLoaderWithInlineStyles />
            ) : (
              <CanadianDistribution
                data={geographicalData}
                dataType={mapDataType}
                onDataTypeChange={setMapDataType}
              />
            )}
          </div>
        </ContentSection>

        <ContentSection>
          <ContentHeader>
            <ContentTitle>
              <Briefcase /> All Business Listings
            </ContentTitle>
            <ContentDescription>
              Search, filter, and manage all registered businesses.
            </ContentDescription>
          </ContentHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search by name or location"
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                style={{ width: 280 }}
              />
              <Select
                value={filters.category}
                style={{ width: 180 }}
                onChange={(v) => handleFilterChange("category", v)}
                loading={categoriesLoading}
                disabled={categoriesLoading}
              >
                <Option value="all">All Categories</Option>
                {categoriesList.map((cat) => (
                  <Option key={cat.key} value={cat.key}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={filters.status}
                style={{ width: 150 }}
                onChange={(v) => handleFilterChange("status", v)}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Checkbox
                onChange={(e) =>
                  handleFilterChange("featured", e.target.checked)
                }
                checked={filters.featured}
              >
                Featured Only
              </Checkbox>
            </SearchFilterContainer>
          </FilterBar>
          {isMobile ? (
            <div style={{ padding: 16 }}>
              {loading ? (
                <Skeleton active />
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
          ) : (
            <StyledTable
              columns={columns}
              dataSource={businesses}
              rowKey="businessId"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          )}
        </ContentSection>

        <DetailDrawerModal
          isVisible={isDetailModalVisible}
          onClose={() => setIsDetailModalVisible(false)}
          business={detailsLoading ? null : selectedBusiness}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BusinessManagement;
