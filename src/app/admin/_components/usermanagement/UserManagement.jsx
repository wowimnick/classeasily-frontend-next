"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";

import {
  Table,
  Card,
  Tabs,
  Badge,
  Tag,
  Space,
  Input,
  Select,
  Button,
  Modal,
  Form,
  ConfigProvider,
  Avatar,
  Dropdown,
  Menu,
  Grid,
  Empty,
  List,
  Divider,
  DatePicker,
  Typography,
  Radio,
  Popconfirm,
} from "antd";
import message from "@/lib/message";
import {
  Users,
  Shield,
  MoreHorizontal,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Clock,
  Activity,
  UserPlus,
  BarChart2,
  PieChart as PieChartIcon,
  Briefcase,
  LogIn,
  X,
  FileText,
  User,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Send,
  BookOpen,
  Search,
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
} from "recharts";
import { RefreshCw } from "lucide-react";
import { userAdminService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import dayjs from "dayjs";
import NumberFlow from "@number-flow/react";
import { useAuthStore } from "@/lib/auth-client";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import ShadowUserModal from "./ShadowUserModal";
import AdminMetricCards from "../shared/AdminMetricCards";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { AdminAreaChartSkeleton, AdminPieChartSkeleton, AdminMetricCardsSkeleton } from "../shared/AdminSkeletons";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;

// --- STYLING & THEME ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  pink: "#ec4899",
  purple: "#8b5cf6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const USER_ROLE_PIE_COLORS = [
  colors.info,
  colors.primary,
  colors.purple,
  colors.success,
  colors.warning,
  colors.error,
];

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- LAYOUT COMPONENTS ---
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

// --- SKELETON STYLES (MATCHING ACTIVE BOOKINGS) ---
const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: ${(props) => props.marginBottom || "0"};

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonCircle = styled(SkeletonLine)`
  border-radius: 50%;
  width: ${(props) => props.size || "36px"};
  height: ${(props) => props.size || "36px"};
  margin-bottom: 0;
  flex-shrink: 0;
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 24px;
  width: ${(props) => props.width || "80px"};
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 0;
`;

// --- VAUL DRAWER STYLES (MATCHING BOOKING DETAILS) ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0px); }
`;

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 90%;
  max-height: 90vh;
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

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 680px;
  display: flex;
`;

const DesktopDrawerInner = styled.div`
  background: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  will-change: transform;
  transform: translateZ(0);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

const DrawerHeader = styled.div`
  background: white;
  border-bottom: 1px solid ${colors.border};
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const RoleWarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: ${hexToRgba(colors.warning, 0.08)};
  border: 1px solid ${hexToRgba(colors.warning, 0.25)};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: ${colors.textSecondary};
  svg {
    color: ${colors.warning};
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const DrawerHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${colors.textPrimary};
  font-size: 20px;
  font-weight: 600;
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: ${colors.border};
  }
`;

const HeaderSection = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeIn} 0.3s ease-out;
  @media (max-width: 480px) {
    padding: 16px;
    gap: 12px;
  }
`;

const MergedUserDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.border};
  background: white;
  flex-shrink: 0;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    padding: 14px 16px;
  }
`;

const UserAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 24px;
  background: ${colors.primary};
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled(Title).attrs({ level: 4 })`
  margin: 0 0 2px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  font-size: 18px !important;
  @media (max-width: 480px) {
    font-size: 16px !important;
  }
`;

const UserEmailText = styled(Text)`
  color: ${colors.textSecondary};
  font-size: 14px;
  display: block;
  margin-bottom: 6px;
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ContentBody = styled.div`
  padding: 24px;
  background: #ffffff;
  flex: 1;
  overflow-y: auto;
  animation: ${fadeIn} 0.5s 0.1s ease-out both;

  /* Custom Tab Styling within Drawer */
  .ant-tabs-nav {
    margin-bottom: 24px !important;
    &::before {
      border-bottom: 1px solid ${colors.border};
    }
  }
  .ant-tabs-tab {
    padding: 8px 0 !important;
    margin: 0 16px 0 0 !important;
    font-size: 14px;
    color: ${colors.textSecondary};
    &:hover {
      color: ${colors.primary};
    }
    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: ${colors.primary};
      font-weight: 500;
    }
  }
  .ant-tabs-ink-bar {
    background: ${colors.primary};
  }

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 480px) {
    padding: 16px;
    margin-bottom: 16px;
  }
`;

const InfoGroupTitle = styled(Title).attrs({ level: 5 })`
  color: ${colors.textPrimary};
  margin-bottom: 16px !important;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px !important;
  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px 18px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  width: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  svg {
    width: 17px;
    height: 17px;
  }
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled(Text)`
  color: ${colors.textSecondary};
  display: block;
  font-size: 13px;
  margin-bottom: 3px;
`;

const InfoValue = styled(Text)`
  color: ${colors.textPrimary};
  font-weight: 500;
  display: block;
  word-break: break-word;
  font-size: 14px;
`;

// --- DRAWER SKELETON ---
const DrawerSkeletonHeader = () => (
  <HeaderSection>
    <SkeletonCircle size="60px" />
    <UserInfo>
      <SkeletonLine width="60%" height="20px" marginBottom="8px" />
      <SkeletonLine width="40%" height="14px" marginBottom="8px" />
      <SkeletonTag width="90px" />
    </UserInfo>
  </HeaderSection>
);

const DrawerSkeletonInfoItem = () => (
  <InfoItem>
    <InfoIcon style={{ opacity: 0.2 }}>
      <SkeletonCircle size="20px" />
    </InfoIcon>
    <InfoContent>
      <SkeletonLine width="40%" height="12px" marginBottom="8px" />
      <SkeletonLine width="70%" height="14px" />
    </InfoContent>
  </InfoItem>
);

const UserDetailSkeleton = () => (
  <>
    <DrawerSkeletonHeader />
    <ContentBody>
      <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
        <SkeletonLine width="80px" height="24px" />
        <SkeletonLine width="80px" height="24px" />
        <SkeletonLine width="80px" height="24px" />
      </div>
      <InfoGroup>
        <InfoGroupTitle style={{ opacity: 0.5 }}>
          <User /> Personal Information
        </InfoGroupTitle>
        <InfoGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <DrawerSkeletonInfoItem key={i} />
          ))}
        </InfoGrid>
      </InfoGroup>
      <InfoGroup style={{ marginTop: 20 }}>
        <InfoGroupTitle style={{ opacity: 0.5 }}>
          <Activity /> Account Stats
        </InfoGroupTitle>
        <InfoGrid>
          {Array.from({ length: 2 }).map((_, i) => (
            <DrawerSkeletonInfoItem key={i} />
          ))}
        </InfoGrid>
      </InfoGroup>
    </ContentBody>
  </>
);

// --- TABLE GENERATORS ---

// Generate skeleton data for the main table (replaces the old TableSkeleton component)
const generateSkeletonData = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    userId: `skeleton-${i}`,
    first_name: (
      <Space>
        <SkeletonCircle size="40px" />
        <SkeletonWrapper>
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="160px" height="12px" />
        </SkeletonWrapper>
      </Space>
    ),
    role_name: <SkeletonTag width="80px" />,
    status: <SkeletonTag width="70px" />,
    owned_business_name: <SkeletonLine width="140px" />,
    last_login_date: <SkeletonLine width="100px" />,
    actions: <SkeletonCircle size="32px" />,
  }));
};

const ChartCard = styled(Card)`
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 16px 20px !important;
    background: #ffffff;
  }
`;
const GridRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 0;
`;
const ChartContainer = styled.div`
  height: 240px;
  width: 100%;
  margin-top: 12px;
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  @media (max-width: 768px) {
    height: 200px;
  }
`;
const ChartHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
`;
const CardTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 14px;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
const HelpText = styled(Text)`
  font-size: 12px;
  color: ${colors.textTertiary};
  margin: 2px 0 0 0;
  display: block;
`;

// --- TABLE SECTION ---
const TableSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;
const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
`;
const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }
`;
const TableDescription = styled(Paragraph)`
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
    color: ${colors.textPrimary};
    border-bottom: 1px solid ${colors.border};
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc;
  }
  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: white;
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

const UserRoleTag = styled(Tag)`
  font-weight: 500;
  border: none !important;
  border-radius: 6px;
  padding: 2px 10px;
`;

const StatusTag = styled(Tag)`
  border-radius: 6px;
  padding: 3px 10px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  margin: 0;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

// --- MOBILE COMPONENTS ---
const MobileCardList = styled.div`
  padding: 8px;
`;
const MobileUserCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;
const MobileCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;
const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
`;
const MobileCardLabel = styled(Text)`
  color: ${colors.textSecondary};
  font-size: 13px;
`;
const MobileCardFooter = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

// --- UTILITY FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return dayjs(dateString).format("MMM D, YYYY");
};
const getColorForRole = (roleName) =>
  ({
    Admin: "#ef4444",
    "Super Admin": "#b91c1c",
    "Business Owner": "#3b82f6",
    Manager: "#f97316",
    Instructor: "#8b5cf6",
    Student: "#10b981",
    "Content Creator": "#06b6d4",
  }[roleName] || "#64748b");
const PIE_COLORS = Object.values(colors).filter(
  (c) => typeof c === "string" && c.startsWith("#")
);

// --- MAIN COMPONENT ---
const UserManagementDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [isShadowModalVisible, setIsShadowModalVisible] = useState(false);
  const [shadowLoading, setShadowLoading] = useState(false);

  // Filters & Search
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookingActivityFilter, setBookingActivityFilter] = useState(undefined);
  const [lastActiveFilter, setLastActiveFilter] = useState(undefined);

  // Drawer & Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // Tab Data States
  const [selectedUserBookings, setSelectedUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingPagination, setBookingPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [userEmails, setUserEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  const [metrics, setMetrics] = useState({
    total_users: 0,
    active_users: 0,
    new_users_in_period: 0,
    active_users_in_period: 0,
    role_distribution: [],
    registration_trend: [],
    business_accounts: 0,
    churned_users: 0,
    users_with_bookings: 0,
    user_growth_percent: null,
    active_growth_percent: null,
  });
  const [chartPeriod, setChartPeriod] = useState("30d");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const handleFilterChange = (updates) => {
    setPagination((p) => ({ ...p, current: 1 }));
    if ("search" in updates) setSearchText(updates.search);
    if ("role" in updates) setRoleFilter(updates.role);
    if ("status" in updates) setStatusFilter(updates.status);
    if ("booking_count" in updates) setBookingActivityFilter(updates.booking_count);
    if ("last_active" in updates) setLastActiveFilter(updates.last_active);
  };

  const fetchUsers = useCallback(
    async (page, pageSize) => {
      setLoading(true);
      const params = {
        page: page || pagination.current,
        page_size: pageSize || pagination.pageSize,
        ...(roleFilter !== "all" && { role_id: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchText && { search: searchText }),
        ...(bookingActivityFilter && { booking_count: bookingActivityFilter }),
        ...(lastActiveFilter && { last_active: lastActiveFilter }),
      };
      try {
        const response = await userAdminService.getUsers(params);
        if (response.success && response.data) {
          setUsers(response.data.results || []);
          setPagination((prev) => ({
            ...prev,
            current: page || prev.current,
            pageSize: pageSize || prev.pageSize,
            total: response.data.count || 0,
          }));
        } else {
          setUsers([]);
          message.error(response.error?.detail || "Failed to fetch users");
        }
      } catch (error) {
        message.error("Failed to fetch users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [
      roleFilter,
      statusFilter,
      searchText,
      bookingActivityFilter,
      lastActiveFilter,
      pagination.current,
      pagination.pageSize,
    ]
  );

  useEffect(() => {
    fetchUsers(1, pagination.pageSize);
  }, [roleFilter, statusFilter, searchText, bookingActivityFilter, lastActiveFilter]);

  const handleTableChange = (newPagination) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  const getMetricsDateRange = useCallback(() => {
    const days =
      chartPeriod === "7d" ? 7 : chartPeriod === "90d" ? 90 : 30;
    const end = dayjs();
    return [end.subtract(days - 1, "day"), end];
  }, [chartPeriod]);

  const fetchMetrics = useCallback(async (currentDateRange) => {
    setMetricsLoading(true);
    const params = {};
    if (currentDateRange?.[0] && currentDateRange?.[1]) {
      params.start_date = currentDateRange[0].format("YYYY-MM-DD");
      params.end_date = currentDateRange[1].format("YYYY-MM-DD");
    }
    try {
      const response = await userAdminService.getUserMetrics(params);
      if (response.success && response.data) setMetrics(response.data);
    } catch (error) {
      message.error("Error fetching metrics");
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await userAdminService.getRoles();
        setRoles(
          response.success && Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        setRoles([]);
      }
    };
    fetchRoles();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchMetrics(getMetricsDateRange());
  }, [chartPeriod, fetchMetrics, getMetricsDateRange]);

  useEffect(() => {
    if (!metricsLoading) {
      const timer = setTimeout(() => setIsReadyForAnimation(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsReadyForAnimation(false);
    }
  }, [metricsLoading]);

  // --- DRAWER DATA FETCHERS ---
  const fetchUserBookings = useCallback(
    async (userId, page = 1, pageSize = 5) => {
      if (!userId) return;
      setBookingsLoading(true);
      try {
        const response = await userAdminService.getUserBookings(userId, {
          page,
          page_size: pageSize,
        });
        if (response.success && response.data) {
          setSelectedUserBookings(response.data.results || []);
          setBookingPagination((prev) => ({
            ...prev,
            current: page,
            pageSize,
            total: response.data.count || 0,
          }));
        }
      } catch (error) {
        message.error("Error fetching user bookings.");
      } finally {
        setBookingsLoading(false);
      }
    },
    []
  );

  const fetchUserHistory = async (userId) => {
    setHistoryLoading(true);
    try {
      const response = await userAdminService.getUserHistory(userId);
      if (response.success) {
        setUserHistory(response.data || []);
      } else {
        setUserHistory([]);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load user history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchUserEmails = async (userId) => {
    setEmailsLoading(true);
    try {
      const response = await userAdminService.getUserCommunications(userId);
      if (response.success) {
        setUserEmails(response.data.results || response.data || []);
      } else {
        setUserEmails([]);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load communication history");
    } finally {
      setEmailsLoading(false);
    }
  };

  const showUserDetails = async (user) => {
    setIsDetailsDrawerOpen(true);
    setDetailLoading(true);
    setSelectedUser(null);

    try {
      const response = await userAdminService.getUserDetails(user.userId);
      if (response.success && response.data) {
        const fullUser = response.data;
        setSelectedUser(fullUser);

        // Initial Fetch for Tabs
        fetchUserBookings(fullUser.userId, 1, 5);
        fetchUserHistory(fullUser.userId);
        fetchUserEmails(fullUser.userId);
      } else {
        message.error(
          response.error?.detail || "Failed to fetch user details."
        );
        setIsDetailsDrawerOpen(false);
      }
    } catch (error) {
      message.error("An error occurred while fetching user details.");
      setIsDetailsDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open user drawer when navigated from business "View owner profile"
  useEffect(() => {
    const openUserByEmail = searchParams.get("openUserByEmail");
    if (!openUserByEmail) return;

    const openByEmail = async () => {
      try {
        const res = await userAdminService.getUsers({
          search: openUserByEmail,
          page: 1,
          page_size: 5,
        });
        router.replace("/admin/users", { scroll: false });
        if (res.success && res.data?.results?.length > 0) {
          const first = res.data.results[0];
          await showUserDetails(first);
        } else {
          message.warning("No user found with that email. Try searching in the table.");
        }
      } catch {
        router.replace("/admin/users", { scroll: false });
        message.error("Could not look up owner profile.");
      }
    };
    openByEmail();
  }, [searchParams]);

  const handleBookingTableChange = (pagination) => {
    if (selectedUser)
      fetchUserBookings(
        selectedUser.userId,
        pagination.current,
        pagination.pageSize
      );
  };

  // --- ACTIONS ---
  const handleImpersonateUser = async (userId) => {
    try {
      setLoading(true);
      const result = await userAdminService.impersonateUser(userId);

      if (result.success && result.data?.user) {
        useAuthStore.setState({
          user: result.data.user,
          isAuthenticated: true,
          isImpersonating: true,
          isLoading: false,
        });

        message.success("Now impersonating user.");
        router.push("/");
      } else {
        message.error(result.error || "Could not start impersonation.");
      }
    } catch (e) {
      console.error("Impersonation error:", e);
      message.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShadowUser = async (values) => {
    setShadowLoading(true);
    try {
      const response = await userAdminService.createShadowUser(values);
      if (response.success) {
        message.success("Shadow account created.");
        fetchUsers(pagination.current, pagination.pageSize); // Refresh the list
        return response.data;
      } else {
        message.error(response.error);
        return null;
      }
    } finally {
      setShadowLoading(false);
    }
  };

  const handleSendHandover = async (userId) => {
    setLoading(true);
    try {
      const response = await userAdminService.sendHandoverEmail(userId);
      if (response.success) {
        message.success("Handover email sent successfully!");
      } else {
        message.error(response.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({ role: user.role_id });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      const values = await form.validateFields();
      setLoading(true);
      const response = await userAdminService.updateUser(selectedUser.userId, {
        role: values.role,
      });
      if (response.success) {
        message.success("User role updated");
        fetchUsers(pagination.current, pagination.pageSize);
        setIsEditModalVisible(false);
      } else {
        message.error(
          `Update failed: ${response.error?.detail || "Unknown error"}`
        );
      }
    } catch (errorInfo) {
      message.error("Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const userAction = async (action, userId, successMsg, errorMsg) => {
    setLoading(true);
    try {
      const response = await action(userId);
      if (response.success) {
        message.success(successMsg);
        fetchUsers(pagination.current, pagination.pageSize);
        if (action === userAdminService.deleteUser)
          fetchMetrics(getMetricsDateRange());
        if (isDetailsDrawerOpen) {
          setIsDetailsDrawerOpen(false);
        }
      } else {
        message.error(`Failed: ${response.error?.detail || "Unknown error"}`);
      }
    } catch (error) {
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLockAccount = (userId) =>
    userAction(
      userAdminService.lockAccount,
      userId,
      "Account disabled",
      "Error disabling account."
    );
  const handleUnlockAccount = (userId) =>
    userAction(
      userAdminService.unlockAccount,
      userId,
      "Account enabled",
      "Error enabling account."
    );
  const handleDeleteUser = (userId) =>
    userAction(
      userAdminService.deleteUser,
      userId,
      "User deleted",
      "Error deleting user."
    );

  const handleBulkEmail = () => {
    const emails = selectedRows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      message.warning("No email addresses in selected users.");
      return;
    }
    window.location.href = `mailto:${emails.join(",")}`;
  };

  const handleBulkDeactivate = () => {
    if (selectedRowKeys.length === 0) return;
    setLoading(true);
    Promise.all(selectedRowKeys.map((id) => userAdminService.lockAccount(id)))
      .then(() => {
        message.success(`${selectedRowKeys.length} account(s) deactivated.`);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        fetchUsers(pagination.current, pagination.pageSize);
      })
      .catch(() => message.error("Some accounts could not be deactivated."))
      .finally(() => setLoading(false));
  };

  const [bulkRoleModalOpen, setBulkRoleModalOpen] = useState(false);
  const [bulkRoleLoading, setBulkRoleLoading] = useState(false);
  const [bulkRoleForm] = Form.useForm();
  const handleBulkAssignRole = () => setBulkRoleModalOpen(true);
  const handleBulkAssignRoleSubmit = async () => {
    const { role } = await bulkRoleForm.validateFields();
    setBulkRoleLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRowKeys.map((id) => userAdminService.updateUser(id, { role_id: role }))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0) {
        message.success(`Role updated for ${selectedRowKeys.length} user(s).`);
      } else {
        message.warning(`Updated ${results.length - failed}; ${failed} failed.`);
      }
      setBulkRoleModalOpen(false);
      bulkRoleForm.resetFields();
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch {
      message.error("Could not update roles.");
    } finally {
      setBulkRoleLoading(false);
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedRows.length === 0) {
      message.warning("No users selected.");
      return;
    }
    const headers = ["User ID", "Email", "First Name", "Last Name", "Role", "Status", "Created"];
    const rows = selectedRows.map((r) => [
      r.userId ?? "",
      r.email ?? "",
      (typeof r.first_name === "string" ? r.first_name : "") ?? "",
      (typeof r.last_name === "string" ? r.last_name : "") ?? "",
      r.roleName ?? r.role_name ?? "",
      r.status ?? "",
      r.createdAt ?? "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("CSV downloaded.");
  };

  const handlePieClick = useCallback(
    (data) => {
      if (data && data.role__name) {
        const role = roles.find((r) => r.name === data.role__name);
        if (role) {
          setRoleFilter(role.id);
          message.info(`Filtering by role: ${role.name}`);
        }
      }
    },
    [roles]
  );

  const bookingColumns = [
    { title: "ID", dataIndex: "booking_id", key: "booking_id", width: 80 },
    {
      title: "Class",
      dataIndex: "class_name",
      key: "class_name",
      ellipsis: true,
    },
    {
      title: "Date",
      dataIndex: "instance_date",
      key: "instance_date",
      render: formatDate,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status_display",
      key: "status",
      width: 120,
      render: (statusText, record) => (
        <Tag
          color={
            {
              confirmed: "blue",
              completed: "green",
              cancelled: "red",
              pending: "orange",
            }[record.status] || "default"
          }
        >
          {statusText || record.status}
        </Tag>
      ),
    },
  ];

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "first_name",
        key: "name",
        fixed: "left",
        width: 250,
        render: (_, user) => {
          if (React.isValidElement(user.first_name)) return user.first_name;
          return (
            <Space>
              <Avatar
                src={user.avatar_thumb_url}
                style={{ backgroundColor: colors.primary, color: "white" }}
              >
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 500 }}>
                  {user.first_name} {user.last_name}
                </div>
                <Text type="secondary">{user.email}</Text>
              </div>
            </Space>
          );
        },
      },
      {
        title: "Role",
        dataIndex: "role_name",
        key: "role",
        width: 150,
        render: (roleName, user) => {
          if (React.isValidElement(roleName)) return roleName;
          return (
            <UserRoleTag color={user.role_color || getColorForRole(roleName)}>
              {roleName || "N/A"}
            </UserRoleTag>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          if (React.isValidElement(status)) return status;
          return (
            <Badge
              status={
                { active: "success", inactive: "error", pending: "warning" }[
                  status
                ]
              }
              text={status.charAt(0).toUpperCase() + status.slice(1)}
            />
          );
        },
      },
      {
        title: "Owned Business",
        dataIndex: "owned_business_name",
        key: "owned_business_name",
        width: 200,
        render: (name) => {
          if (React.isValidElement(name)) return name;
          return name ? (
            <Text>{name}</Text>
          ) : (
            <Text type="secondary">None</Text>
          );
        },
      },
      {
        title: "Last Login",
        dataIndex: "last_login_date",
        key: "last_login",
        render: (date) => {
          if (React.isValidElement(date)) return date;
          return formatDate(date);
        },
        responsive: ["lg"],
        width: 150,
        sorter: (a, b) =>
          dayjs(a.last_login_date || 0).unix() -
          dayjs(b.last_login_date || 0).unix(),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_, user) => {
          if (React.isValidElement(user.actions)) return user.actions;
          return (
            <Dropdown
              overlay={
                <Menu
                  items={[
                    {
                      key: "1",
                      icon: <Eye size={14} />,
                      label: "View Details",
                      onClick: () => showUserDetails(user),
                    },
                    {
                      key: "2",
                      icon: <Edit size={14} />,
                      label: "Edit Role",
                      onClick: () => showEditModal(user),
                    },
                    ...(user.roleName === "Business Owner" ||
                    user.role_name === "Business Owner"
                      ? [
                          {
                            key: "handover",
                            icon: <Send size={14} />,
                            label: "Send Invite/Handover",
                            onClick: () => handleSendHandover(user.userId),
                          },
                        ]
                      : []),
                    {
                      key: "5",
                      icon: <LogIn size={14} />,
                      label: "Login as User",
                      onClick: () => handleImpersonateUser(user.userId),
                    },
                    { type: "divider" },
                    user.status === "active"
                      ? {
                          key: "3",
                          icon: <Lock size={14} />,
                          label: "Disable Account",
                          danger: true,
                          onClick: () => handleLockAccount(user.userId),
                        }
                      : {
                          key: "3",
                          icon: <Unlock size={14} />,
                          label: "Enable Account",
                          onClick: () => handleUnlockAccount(user.userId),
                        },
                    {
                      key: "4",
                      icon: <Trash2 size={14} />,
                      label: "Delete User",
                      danger: true,
                      onClick: () => handleDeleteUser(user.userId),
                    },
                  ]}
                />
              }
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreHorizontal size={18} />} />
            </Dropdown>
          );
        },
      },
    ],
    [roles, loading]
  );

  const renderMobileUserCard = (user) => (
    <MobileUserCard key={user.userId}>
      {React.isValidElement(user.first_name) ? (
        // SKELETON CARD FOR MOBILE
        <>
          <MobileCardHeader>
            <SkeletonCircle size="48px" />
            <SkeletonWrapper>
              <SkeletonLine width="100px" height="16px" />
              <SkeletonLine width="140px" height="14px" />
            </SkeletonWrapper>
          </MobileCardHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonLine width="100%" height="20px" />
            <SkeletonLine width="100%" height="20px" />
          </div>
        </>
      ) : (
        <>
          <MobileCardHeader>
            <Avatar
              src={user.avatar_thumb_url}
              size={48}
              style={{ backgroundColor: colors.primary, color: "white" }}
            >
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </Avatar>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {user.first_name} {user.last_name}
              </Title>
              <Text type="secondary">{user.email}</Text>
            </div>
          </MobileCardHeader>
          <MobileCardRow>
            <MobileCardLabel>Role</MobileCardLabel>
            <UserRoleTag
              color={user.role_color || getColorForRole(user.role_name)}
            >
              {user.role_name || "N/A"}
            </UserRoleTag>
          </MobileCardRow>
          <MobileCardRow>
            <MobileCardLabel>Status</MobileCardLabel>
            <Badge
              status={
                { active: "success", inactive: "error", pending: "warning" }[
                  user.status
                ]
              }
              text={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            />
          </MobileCardRow>
          <MobileCardRow>
            <MobileCardLabel>Business</MobileCardLabel>
            <Text>{user.owned_business_name || "None"}</Text>
          </MobileCardRow>
          <MobileCardFooter>
            <Button
              size="middle"
              icon={<Eye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                showUserDetails(user);
              }}
            >
              View
            </Button>
            <Button
              size="middle"
              icon={<Edit size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                showEditModal(user);
              }}
            >
              Edit Role
            </Button>
          </MobileCardFooter>
        </>
      )}
    </MobileUserCard>
  );

  const daysInPeriod =
    chartPeriod === "7d" ? 7 : chartPeriod === "90d" ? 90 : 30;

  const userRolePopoverContent = useMemo(() => {
    const dist = metrics.role_distribution || [];
    if (!dist.length) {
      return (
        <div style={{ padding: 12, background: "#fff" }}>
          <Text type="secondary">No role breakdown</Text>
        </div>
      );
    }
    const pieData = dist.map((r, i) => {
      const raw = r.role__color;
      const fill =
        raw && String(raw).startsWith("#")
          ? raw
          : USER_ROLE_PIE_COLORS[i % USER_ROLE_PIE_COLORS.length];
      return {
        name: r.role__name || "Unknown",
        value: Number(r.count) || 0,
        fill,
      };
    });
    return (
      <div style={{ width: 260, height: 220, background: "#fff" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={72}
              paddingAngle={1}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                background: "#fff",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }, [metrics.role_distribution]);

  const statsData = useMemo(
    () => [
      {
        key: "total_users",
        title: "Total Users",
        value: metrics.total_users,
        icon: Users,
        color: colors.info,
        growth: metrics.user_growth_percent ?? null,
        periodBadge: "Snapshot",
        popoverContent: userRolePopoverContent,
        footer: "Hover for breakdown by role",
      },
      {
        key: "active_users",
        title: `Active (${daysInPeriod}d)`,
        value: metrics.active_users_in_period,
        icon: Activity,
        color: colors.success,
        growth: metrics.active_growth_percent ?? null,
        periodBadge: `${daysInPeriod}d`,
        popoverContent: userRolePopoverContent,
        footer: "Distinct logins in period",
      },
      {
        key: "new_users",
        title: `New Signups (${daysInPeriod}d)`,
        value: metrics.new_users_in_period,
        icon: UserPlus,
        color: colors.warning,
        growth: null,
        periodBadge: `${daysInPeriod}d`,
        popoverContent: userRolePopoverContent,
        footer: "vs previous period",
      },
      {
        key: "business_accounts",
        title: "Business Accounts",
        value: metrics.business_accounts || 0,
        icon: Shield,
        color: colors.primary,
        growth: null,
        periodBadge: "Snapshot",
        footer: "Total business records",
      },
    ],
    [metrics, daysInPeriod, userRolePopoverContent]
  );

  // --- RENDER USER DETAILS (INSIDE DRAWER) ---
  const renderUserDetailsContent = () => {
    if (detailLoading || !selectedUser) {
      return <UserDetailSkeleton />;
    }

    return (
      <ContentBody>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Profile" key="1">
              <InfoGroup>
                <InfoGroupTitle>
                  <User /> Personal Details
                </InfoGroupTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoIcon>
                      <Mail />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Email</InfoLabel>
                      <InfoValue>{selectedUser.email || "N/A"}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Phone />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Phone</InfoLabel>
                      <InfoValue>
                        {selectedUser.phone_number || "Not Provided"}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Briefcase />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Business</InfoLabel>
                      <InfoValue>
                        {selectedUser.owned_businesses_info?.[0]
                          ?.businessName || "None"}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <MapPin />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Location</InfoLabel>
                      <InfoValue>
                        {selectedUser.city
                          ? `${selectedUser.city}, ${selectedUser.country}`
                          : "Unknown"}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                </InfoGrid>
              </InfoGroup>

              <InfoGroup>
                <InfoGroupTitle>
                  <Activity /> Activity
                </InfoGroupTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoIcon>
                      <Calendar />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Joined On</InfoLabel>
                      <InfoValue>
                        {formatDate(selectedUser.createdAt)}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Clock />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Last Login</InfoLabel>
                      <InfoValue>
                        {formatDate(selectedUser.last_login)}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                </InfoGrid>
              </InfoGroup>
            </TabPane>

            <TabPane tab="Security" key="security">
              <InfoGroup>
                <InfoGroupTitle>
                  <Shield /> Recent Login Activity
                </InfoGroupTitle>
                <div style={{ overflowX: "auto" }}>
                  <Table
                    dataSource={userHistory}
                    loading={historyLoading}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: "Date",
                        dataIndex: "timestamp",
                        render: (t) => (
                          <Text style={{ fontSize: 13 }}>
                            {dayjs(t).format("MMM D, h:mm A")}
                          </Text>
                        ),
                        width: 140,
                      },
                      {
                        title: "Action",
                        dataIndex: "action_display",
                        render: (t) => <Tag style={{ fontSize: 11 }}>{t}</Tag>,
                      },
                      {
                        title: "IP",
                        dataIndex: "ip_address",
                        render: (t) => (
                          <Text style={{ fontSize: 13 }}>{t}</Text>
                        ),
                      },
                      {
                        title: "Device",
                        dataIndex: "user_agent",
                        ellipsis: true,
                        render: (agent) => (
                          <span
                            title={agent}
                            style={{
                              fontSize: 12,
                              fontFamily: "monospace",
                              color: colors.textSecondary,
                            }}
                          >
                            {agent ? agent.substring(0, 20) + "..." : "Unknown"}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              </InfoGroup>
            </TabPane>

            <TabPane tab="Communications" key="comms">
              <InfoGroup>
                <InfoGroupTitle>
                  <Mail /> Email History
                </InfoGroupTitle>
                <Table
                  dataSource={userEmails}
                  loading={emailsLoading}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: "Sent At",
                      dataIndex: "timestamp",
                      render: (t) => (
                        <Text style={{ fontSize: 13 }}>
                          {dayjs(t).format("MMM D, h:mm A")}
                        </Text>
                      ),
                      width: 140,
                    },
                    {
                      title: "Subject",
                      dataIndex: "details",
                      ellipsis: true,
                      render: (t) => (
                        <Text style={{ fontSize: 13 }}>
                          {t ? t.replace("Email: ", "") : "Notification"}
                        </Text>
                      ),
                    },
                    {
                      title: "Status",
                      key: "status",
                      render: () => (
                        <Tag color="green" style={{ fontSize: 11 }}>
                          Sent
                        </Tag>
                      ),
                    },
                  ]}
                />
              </InfoGroup>
            </TabPane>

            <TabPane tab={`Bookings (${bookingPagination.total})`} key="2">
              <InfoGroup>
                <InfoGroupTitle>
                  <FileText /> Booking History
                </InfoGroupTitle>
                <Table
                  columns={bookingColumns}
                  dataSource={selectedUserBookings}
                  rowKey="booking_id"
                  loading={{ spinning: bookingsLoading }}
                  pagination={{
                    ...bookingPagination,
                    onChange: (page, pageSize) =>
                      handleBookingTableChange({ current: page, pageSize }),
                  }}
                  scroll={{ x: 400 }}
                  size="small"
                  locale={{
                    emptyText: (
                      <Empty description="No bookings for this user" />
                    ),
                  }}
                />
              </InfoGroup>
            </TabPane>

            <TabPane tab="Business Ownership" key="3">
              <InfoGroup>
                <InfoGroupTitle>
                  <Briefcase /> Owned Businesses
                </InfoGroupTitle>
                {selectedUser.owned_businesses_info?.length > 0 ? (
                  <List
                    dataSource={selectedUser.owned_businesses_info}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          padding: "12px 0",
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              icon={<Briefcase size={16} />}
                              style={{ backgroundColor: colors.info }}
                            />
                          }
                          title={
                            <Text strong style={{ fontSize: 14 }}>
                              {item.businessName}
                            </Text>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ID: {item.businessId}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    description="No businesses owned"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </InfoGroup>
            </TabPane>
          </Tabs>
        </ContentBody>
    );
  };

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
      <ContentLayer>
        <DashboardHeader style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <PageTitle>User Management</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and analyze all platform users.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => fetchMetrics(getMetricsDateRange())}
              loading={metricsLoading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<UserPlus size={14} />}
              onClick={() => setIsShadowModalVisible(true)}
              style={{ backgroundColor: colors.purple, borderColor: colors.purple }}
            >
              Concierge Onboard
            </Button>
          </ActionButtonsContainer>
        </DashboardHeader>

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase", marginBottom: 10 }}>
          User metrics
        </div>
        <div style={{ marginBottom: 20 }}>
          {metricsLoading ? (
            <AdminMetricCardsSkeleton count={Math.max(statsData.length, 4)} />
          ) : (
            <AdminMetricCards cards={statsData} isReadyForAnimation={isReadyForAnimation} />
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <GridRow style={{ marginBottom: 20 }}>
          <ChartCard>
            <ChartHeaderRow>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Trend</div>
                <CardTitle>User Registrations</CardTitle>
              </div>
              <Radio.Group
                size="small"
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                options={[{ label: "7d", value: "7d" }, { label: "30d", value: "30d" }, { label: "90d", value: "90d" }]}
              />
            </ChartHeaderRow>
            <HelpText>Daily new user registrations</HelpText>
            <ChartContainer>
              {metricsLoading ? (
                <AdminAreaChartSkeleton fillParent />
              ) : metrics.registration_trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={metrics.registration_trend}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.border}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: colors.textTertiary }}
                      tickFormatter={(tick) => dayjs(tick).format("MMM D")}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: colors.textTertiary }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={28}
                    />
                    <RechartsTooltip
                      content={renderLineChartTooltip}
                      cursor={{ stroke: colors.primary, strokeDasharray: "3 3" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke={colors.primary}
                      strokeWidth={2}
                      fill="url(#gradReg)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No registration data available" />
              )}
            </ChartContainer>
          </ChartCard>
          <ChartCard>
            <ChartHeaderRow>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase" }}>Breakdown</div>
                <CardTitle>Role Distribution</CardTitle>
              </div>
            </ChartHeaderRow>
            <HelpText>Click a slice to filter the table by role</HelpText>
            <ChartContainer>
              {metricsLoading ? (
                <AdminPieChartSkeleton size={isMobile ? 140 : 168} fillParent />
              ) : metrics.role_distribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.role_distribution}
                      nameKey="role__name"
                      dataKey="count"
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 50 : 60}
                      outerRadius={isMobile ? 70 : 85}
                      paddingAngle={2}
                      onClick={handlePieClick}
                    >
                      {metrics.role_distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.role__color ||
                            PIE_COLORS[index % PIE_COLORS.length]
                          }
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "#fff",
                        borderRadius: "12px",
                        border: `1px solid ${colors.border}`,
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No role data available" />
              )}
            </ChartContainer>
          </ChartCard>
        </GridRow>

        <Divider style={{ margin: "16px 0" }} />

        <TableSection
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <TableTitle>
                  <Users /> All Platform Users
                </TableTitle>
                <TableDescription>
                  Search, filter, and manage all users on the platform.
                </TableDescription>
              </div>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                prefix={<Search size={14} style={{ color: colors.textTertiary }} />}
                placeholder="Search by name or email"
                allowClear
                value={searchText}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 260, borderRadius: 8 }}
              />
              <Select
                value={roleFilter}
                style={{ width: isMobile ? "100%" : 160 }}
                onChange={(value) => handleFilterChange({ role: value })}
                loading={!roles.length}
                placeholder="All Roles"
              >
                <Option value="all">All Roles</Option>
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                style={{ width: isMobile ? "100%" : 140 }}
                onChange={(value) => handleFilterChange({ status: value })}
                placeholder="All Statuses"
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="pending">Pending</Option>
              </Select>
              <Select
                placeholder="Booking Activity"
                style={{ width: isMobile ? "100%" : 160 }}
                allowClear
                value={bookingActivityFilter}
                onChange={(value) => handleFilterChange({ booking_count: value })}
              >
                <Option value="none">No Bookings</Option>
                <Option value="1_5">1–5 Bookings</Option>
                <Option value="5_plus">5+ Bookings</Option>
                <Option value="10_plus">10+ Bookings (Power)</Option>
              </Select>
              <Select
                placeholder="Last Active"
                style={{ width: isMobile ? "100%" : 150 }}
                allowClear
                value={lastActiveFilter}
                onChange={(value) => handleFilterChange({ last_active: value })}
              >
                <Option value="7d">Active last 7d</Option>
                <Option value="30d">Active last 30d</Option>
                <Option value="90d_inactive">Inactive 90d+</Option>
                <Option value="never">Never Logged In</Option>
              </Select>
            </SearchFilterContainer>
          </FilterBar>
          {selectedRowKeys.length > 0 && (
            <BulkActionsBar>
              <strong>{selectedRowKeys.length} selected</strong>
              <Button size="small" icon={<Mail size={13} />} onClick={handleBulkEmail}>Email</Button>
              <Popconfirm
                title={`Deactivate ${selectedRowKeys.length} account(s)? They will not be able to log in.`}
                onConfirm={handleBulkDeactivate}
                okText="Deactivate"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" icon={<Lock size={13} />} danger>Deactivate</Button>
              </Popconfirm>
              <Button size="small" icon={<Edit size={13} />} onClick={handleBulkAssignRole}>Assign Role</Button>
              <Button size="small" icon={<FileText size={13} />} onClick={handleBulkExportCSV}>Export CSV</Button>
              <Button size="small" type="text" onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>Clear</Button>
            </BulkActionsBar>
          )}

          {isMobile ? (
            <MobileCardList>
              {loading ? (
                generateSkeletonData(5).map(renderMobileUserCard)
              ) : users.length > 0 ? (
                users.map(renderMobileUserCard)
              ) : (
                <Empty />
              )}
            </MobileCardList>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={
                loading ? generateSkeletonData(pagination.pageSize) : users
              }
              rowKey="userId"
              loading={false}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys);
                  setSelectedRows(rows || []);
                },
                getCheckboxProps: (record) => ({
                  disabled: React.isValidElement(record.first_name),
                }),
              }}
              pagination={
                loading
                  ? false
                  : {
                      ...pagination,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                      size: "small",
                    }
              }
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty description="No users found with the current filters." />
                ),
              }}
            />
          )}
        </TableSection>

      </ContentLayer>

        <Modal
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={18} color={colors.primary} />
              Change user role
            </span>
          }
          open={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            form.resetFields();
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setIsEditModalVisible(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>,
            <Button
              key="apply"
              type="primary"
              loading={loading}
              onClick={handleEditSubmit}
              icon={<Shield size={15} />}
            >
              Apply role change
            </Button>,
          ]}
          width={480}
          destroyOnClose
          styles={{ content: { background: "#fff" }, body: {  background: "#fff" } }}
        >
          {selectedUser && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Avatar
                size={44}
                src={selectedUser.avatarUrl}
                icon={<User size={20} />}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                  {selectedUser.name}
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>
                  {selectedUser.email}
                </div>
              </div>
              {selectedUser.roleName && <Tag>{selectedUser.roleName}</Tag>}
            </div>
          )}
          <RoleWarningBanner>
            <AlertTriangle size={16} />
            <span>
              Changing this user&apos;s role will immediately alter their
              permissions and platform access.
            </span>
          </RoleWarningBanner>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="role"
              label="New role"
              rules={[{ required: true, message: "Please select a role." }]}
            >
              <Select
                placeholder="Select a role"
                size="large"
                loading={!roles.length}
              >
                {roles.map((r) => (
                  <Option key={r.id} value={r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`Assign role to ${selectedRowKeys.length} user(s)`}
          open={bulkRoleModalOpen}
          onCancel={() => { setBulkRoleModalOpen(false); bulkRoleForm.resetFields(); }}
          footer={[
            <Button key="cancel" onClick={() => { setBulkRoleModalOpen(false); bulkRoleForm.resetFields(); }}>Cancel</Button>,
            <Button key="submit" type="primary" loading={bulkRoleLoading} onClick={() => handleBulkAssignRoleSubmit()} icon={<Shield size={14} />}>Apply to selected</Button>,
          ]}
          destroyOnClose
          styles={{ content: { background: "#fff" }, body: { padding: "20px 24px", background: "#fff" } }}
        >
          <Form form={bulkRoleForm} layout="vertical">
            <Form.Item name="role" label="New role" rules={[{ required: true, message: "Select a role." }]}>
              <Select placeholder="Select role" loading={!roles.length}>
                {roles.map((r) => (
                  <Option key={r.id} value={r.id}>{r.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* User Details Drawer - single merged header, Vaul on mobile via AdminResponsiveDrawer */}
        <AdminResponsiveDrawer
          open={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          title="User Details"
          titleIcon={<FileText size={18} />}
          isMobile={isMobile}
          width="860px"
          hideHeader={!!selectedUser && !detailLoading}
        >
          {detailLoading || !selectedUser ? (
            renderUserDetailsContent()
          ) : (
            <>
              <MergedUserDrawerHeader>
                <UserAvatar src={selectedUser.avatar_medium_url} size={56}>
                  {(selectedUser.first_name?.[0] || "U").toUpperCase()}
                </UserAvatar>
                <UserInfo style={{ flex: 1, minWidth: 0 }}>
                  <UserName style={{ marginBottom: 2 }}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </UserName>
                  <UserEmailText style={{ fontSize: 13, marginBottom: 8 }}>{selectedUser.email}</UserEmailText>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <UserRoleTag color={selectedUser.role_color || getColorForRole(selectedUser.role_name)}>
                      {selectedUser.role_name || "N/A"}
                    </UserRoleTag>
                    {selectedUser.status === "active" ? (
                      <StatusTag style={{ backgroundColor: "#d1fae5", color: "#047857" }} icon={<CheckCircle size={12} />}>
                        ACTIVE
                      </StatusTag>
                    ) : (
                      <StatusTag style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }} icon={<AlertTriangle size={12} />}>
                        {selectedUser.status?.toUpperCase()}
                      </StatusTag>
                    )}
                  </div>
                </UserInfo>
                <Space size="small" wrap>
                  <Button size="small" icon={<LogIn size={14} />} onClick={() => handleImpersonateUser(selectedUser.userId)}>
                    Impersonate
                  </Button>
                  {selectedUser.status === "active" ? (
                    <Button size="small" danger icon={<Lock size={14} />} onClick={() => handleLockAccount(selectedUser.userId)}>
                      Lock
                    </Button>
                  ) : (
                    <Button size="small" icon={<Unlock size={14} />} onClick={() => handleUnlockAccount(selectedUser.userId)}>
                      Unlock
                    </Button>
                  )}
                  <CloseButton icon={<X size={20} />} onClick={() => setIsDetailsDrawerOpen(false)} />
                </Space>
              </MergedUserDrawerHeader>
              {renderUserDetailsContent()}
            </>
          )}
        </AdminResponsiveDrawer>
      </DashboardWrapper>
      <ShadowUserModal
        open={isShadowModalVisible}
        onCancel={() => setIsShadowModalVisible(false)}
        onCreate={handleCreateShadowUser}
        onImpersonate={handleImpersonateUser}
        loading={shadowLoading}
      />
    </ConfigProvider>
  );
};

// Recharts tooltip component
const renderLineChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: 12 }}>
          {dayjs(label).format("MMM D, YYYY")}
        </p>
        <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 500 }}>
          Registrations: <strong>{payload[0].value}</strong>
        </p>
      </div>
    );
  }
  return null;
};

export default UserManagementDashboard;
