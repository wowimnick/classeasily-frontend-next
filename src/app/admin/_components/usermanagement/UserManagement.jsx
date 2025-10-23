"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
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
  Drawer,
  Divider,
  DatePicker,
  Typography,
  Skeleton,
} from "antd";
import message from "@/lib/message";
import {
  Users,
  Shield,
  Download,
  MoreHorizontal,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  TrendingUp,
  Activity,
  UserPlus,
  BarChart2,
  PieChart as PieChartIcon,
  BookOpen,
  Briefcase,
  Hash,
  LogIn,
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
import { userAdminService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import dayjs from "dayjs";
import NumberFlow from "@number-flow/react";
import { impersonateUser, useAuthStore } from "@/lib/auth-client";

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

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE COMPONENTS ---
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
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
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

const ChartCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 20px !important;
  }
`;
const GridRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;
const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  margin-top: 24px;
`;
const CardTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 17px;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
const HelpText = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin: 4px 0 16px 0;
  display: block;
`;

// --- TABLE SECTION ---
const TableSection = styled(motion.div)`
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
    background: #fafbfc;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
`;

const UserRoleTag = styled(Tag)`
  font-weight: 500;
  border: none !important;
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

// --- DRAWER & DETAIL COMPONENTS ---
const DetailsDrawer = styled(Drawer)`
  .ant-drawer-body {
    padding: 0;
    background: ${colors.lightBg};
  }
`;
const DetailsHero = styled.div`
  padding: 32px;
  background: white;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 24px;
  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }
`;
const DetailsAvatar = styled(Avatar)`
  flex-shrink: 0;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;
const DetailsInfo = styled.div``;
const DetailsName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 8px 0;
`;
const DetailsSubtitle = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;
const DetailsContent = styled.div`
  padding: 24px 32px;
  .ant-tabs-nav {
    margin-bottom: 24px !important;
  }
  @media (max-width: 600px) {
    padding: 16px;
  }
`;
const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;
const ProfileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border};
`;
const ProfileIcon = styled.div`
  width: 36px;
  height: 36px;
  background: ${hexToRgba(colors.primary, 0.1)};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg {
    width: 16px;
    height: 16px;
    color: ${colors.primary};
  }
`;
const ProfileInfo = styled.div`
  min-width: 0;
`;
const ProfileLabel = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-bottom: 2px;
`;
const ProfileValue = styled.div`
  font-size: 14px;
  color: ${colors.textPrimary};
  font-weight: 500;
  word-break: break-word;
`;
const BusinessListItem = styled(List.Item)`
  background: white;
  border-radius: 12px;
  padding: 12px 16px !important;
  border: 1px solid ${colors.border} !important;
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
  const router = useRouter(); // Next.js router

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "days"),
    dayjs(),
  ]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedUserBookings, setSelectedUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingPagination, setBookingPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [metrics, setMetrics] = useState({
    total_users: 0,
    active_users: 0,
    new_users_in_period: 0,
    active_users_in_period: 0,
    role_distribution: [],
    registration_trend: [],
    business_accounts: 0,
  });
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
  };

  useEffect(() => {
    fetchUsers();
  }, [
    roleFilter,
    statusFilter,
    searchText,
    pagination.current,
    pagination.pageSize,
  ]);

  useEffect(() => {
    fetchMetrics(dateRange);
  }, [dateRange]);

  useEffect(() => {
    if (!metricsLoading) {
      const timer = setTimeout(() => setIsReadyForAnimation(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsReadyForAnimation(false);
    }
  }, [metricsLoading]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await userAdminService.getRoles();
      setRoles(
        response.success && Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      message.error("Error fetching roles");
      setRoles([]);
    }
  }, []);

  const handleImpersonateUser = async (userId) => {
    try {
      setLoading(true);
      const result = await userAdminService.impersonateUser(userId);

      if (result.success && result.data?.user) {
        // Update auth store with impersonated user
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      ...(roleFilter !== "all" && { role_id: roleFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(searchText && { search: searchText }),
    };
    try {
      const response = await userAdminService.getUsers(params);
      if (response.success && response.data) {
        setUsers(response.data.results || []);
        setPagination((prev) => ({ ...prev, total: response.data.count || 0 }));
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
  }, [
    roleFilter,
    statusFilter,
    searchText,
    pagination.current,
    pagination.pageSize,
  ]);

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
    fetchRoles();
    fetchUsers();
    fetchMetrics(dateRange);
  }, []);

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

  const showEditModal = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({ role: user.role_id });
    setIsEditModalVisible(true);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const showUserDetails = async (user) => {
    setIsDetailsDrawerVisible(true);
    setDetailLoading(true);
    setSelectedUser(null);

    try {
      const response = await userAdminService.getUserDetails(user.userId);
      if (response.success && response.data) {
        setSelectedUser(response.data);
        setBookingPagination((prev) => ({ ...prev, current: 1 }));
        fetchUserBookings(response.data.userId, 1, 5);
      } else {
        message.error(
          response.error?.detail || "Failed to fetch user details."
        );
        setIsDetailsDrawerVisible(false);
      }
    } catch (error) {
      message.error("An error occurred while fetching user details.");
      setIsDetailsDrawerVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBookingTableChange = (pagination) => {
    if (selectedUser)
      fetchUserBookings(
        selectedUser.userId,
        pagination.current,
        pagination.pageSize
      );
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
        fetchUsers();
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
        fetchUsers();
        if (action === userAdminService.deleteUser) fetchMetrics(dateRange);
        if (isDetailsDrawerVisible) {
          setIsDetailsDrawerVisible(false);
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

  const handleExportData = () => {
    if (!users || users.length === 0)
      return message.warning("No data to export.");
    try {
      const headers = [
        "User ID",
        "First Name",
        "Last Name",
        "Email",
        "Role",
        "Status",
        "Registration Date",
        "Last Login",
      ];
      const rows = users.map((user) => [
        user.userId,
        user.first_name,
        user.last_name,
        user.email,
        user.role_name,
        user.status,
        formatDate(user.createdAt),
        formatDate(user.last_login_date),
      ]);
      let csvContent =
        "data:text/csv;charset=utf-8," +
        headers.join(",") +
        "\n" +
        rows
          .map((e) =>
            e
              .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
              .join(",")
          )
          .join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "user_data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      message.error("Export failed.");
    }
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
        render: (_, user) => (
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
        ),
      },
      {
        title: "Role",
        dataIndex: "role_name",
        key: "role",
        width: 150,
        render: (roleName, user) => (
          <UserRoleTag color={user.role_color || getColorForRole(roleName)}>
            {roleName || "N/A"}
          </UserRoleTag>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => (
          <Badge
            status={
              { active: "success", inactive: "error", pending: "warning" }[
                status
              ]
            }
            text={status.charAt(0).toUpperCase() + status.slice(1)}
          />
        ),
      },
      {
        title: "Owned Business",
        dataIndex: "owned_business_name",
        key: "owned_business_name",
        width: 200,
        render: (name) =>
          name ? <Text>{name}</Text> : <Text type="secondary">None</Text>,
      },
      {
        title: "Last Login",
        dataIndex: "last_login_date",
        key: "last_login",
        render: formatDate,
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
        render: (_, user) => (
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
                  {
                    key: "5", // Use a new unique key
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
        ),
      },
    ],
    [roles, loading]
  );

  const renderMobileUserCard = (user) => (
    <MobileUserCard key={user.userId}>
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
        <UserRoleTag color={user.role_color || getColorForRole(user.role_name)}>
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
    </MobileUserCard>
  );

  const daysInPeriod = dateRange
    ? dayjs(dateRange[1]).diff(dayjs(dateRange[0]), "day") + 1
    : 30;

  const statsData = [
    {
      key: "total_users",
      title: "Total Users",
      value: metrics.total_users,
      icon: Users,
      color: colors.info,
    },
    {
      key: "active_users",
      title: `Active Users (${daysInPeriod}d)`,
      value: metrics.active_users_in_period,
      icon: Activity,
      color: colors.success,
    },
    {
      key: "new_users",
      title: `New Users (${daysInPeriod}d)`,
      value: metrics.new_users_in_period,
      icon: UserPlus,
      color: colors.warning,
    },
    {
      key: "business_accounts",
      title: "Business Accounts",
      value: metrics.business_accounts,
      icon: Shield,
      color: colors.primary,
    },
  ];

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
          <p
            style={{
              margin: 0,
              color: colors.textPrimary,
              fontWeight: 500,
            }}
          >
            Registrations: <strong>{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderUserDetailsContent = () => {
    if (detailLoading || !selectedUser) {
      return (
        <div>
          <DetailsHero>
            <Skeleton.Avatar active size={80} shape="circle" />
            <div style={{ flex: 1 }}>
              <Skeleton
                active
                paragraph={{ rows: 1, width: "40%" }}
                title={{ width: "60%" }}
              />
            </div>
          </DetailsHero>
          <DetailsContent>
            <Skeleton active paragraph={{ rows: 5 }} />
          </DetailsContent>
        </div>
      );
    }

    return (
      <div>
        <DetailsHero>
          <DetailsAvatar
            src={selectedUser.avatar_medium_url}
            size={80}
            style={{ backgroundColor: colors.primary, color: "white" }}
          >
            {(selectedUser.first_name?.[0] || "U").toUpperCase()}
          </DetailsAvatar>
          <DetailsInfo>
            <DetailsName>
              {selectedUser.first_name} {selectedUser.last_name}
            </DetailsName>
            <DetailsSubtitle>
              <UserRoleTag
                color={
                  selectedUser.role_color ||
                  getColorForRole(selectedUser.role_name)
                }
              >
                {selectedUser.role_name || "N/A"}
              </UserRoleTag>
              <Badge
                status={
                  { active: "success", inactive: "error", pending: "warning" }[
                    selectedUser.status
                  ]
                }
                text={
                  selectedUser.status.charAt(0).toUpperCase() +
                  selectedUser.status.slice(1)
                }
              />
            </DetailsSubtitle>
          </DetailsInfo>
        </DetailsHero>
        <DetailsContent>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Profile Information" key="1">
              <ProfileGrid>
                <ProfileItem>
                  <ProfileIcon>
                    <Mail />
                  </ProfileIcon>
                  <ProfileInfo>
                    <ProfileLabel>Email</ProfileLabel>
                    <ProfileValue>{selectedUser.email || "N/A"}</ProfileValue>
                  </ProfileInfo>
                </ProfileItem>
                <ProfileItem>
                  <ProfileIcon>
                    <Phone />
                  </ProfileIcon>
                  <ProfileInfo>
                    <ProfileLabel>Phone</ProfileLabel>
                    <ProfileValue>
                      {selectedUser.phone_number || "Not Provided"}
                    </ProfileValue>
                  </ProfileInfo>
                </ProfileItem>
                <ProfileItem>
                  <ProfileIcon>
                    <Briefcase />
                  </ProfileIcon>
                  <ProfileInfo>
                    <ProfileLabel>Owned Business</ProfileLabel>
                    <ProfileValue>
                      {selectedUser.owned_businesses_info?.[0]?.businessName ||
                        "None"}
                    </ProfileValue>
                  </ProfileInfo>
                </ProfileItem>
                <ProfileItem>
                  <ProfileIcon>
                    <Calendar />
                  </ProfileIcon>
                  <ProfileInfo>
                    <ProfileLabel>Joined</ProfileLabel>
                    <ProfileValue>
                      {formatDate(selectedUser.createdAt)}
                    </ProfileValue>
                  </ProfileInfo>
                </ProfileItem>
                <ProfileItem>
                  <ProfileIcon>
                    <Clock />
                  </ProfileIcon>
                  <ProfileInfo>
                    <ProfileLabel>Last Login</ProfileLabel>
                    <ProfileValue>
                      {formatDate(selectedUser.last_login)}
                    </ProfileValue>
                  </ProfileInfo>
                </ProfileItem>
              </ProfileGrid>
            </TabPane>
            <TabPane tab={`Bookings (${bookingPagination.total})`} key="2">
              <Table
                columns={bookingColumns}
                dataSource={selectedUserBookings}
                rowKey="booking_id"
                loading={{
                  spinning: bookingsLoading,
                  indicator: <GlobalLoaderWithInlineStyles />,
                }}
                pagination={{
                  ...bookingPagination,
                  onChange: (page, pageSize) =>
                    handleBookingTableChange({ current: page, pageSize }),
                }}
                scroll={{ x: 400, y: 300 }}
                size="small"
                locale={{
                  emptyText: <Empty description="No bookings for this user" />,
                }}
              />
            </TabPane>
            <TabPane tab="Business Ownership" key="3">
              {selectedUser.owned_businesses_info?.length > 0 ? (
                <List
                  dataSource={selectedUser.owned_businesses_info}
                  renderItem={(item) => (
                    <BusinessListItem>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<Briefcase />}
                            style={{ backgroundColor: colors.info }}
                          />
                        }
                        title={<Text strong>{item.businessName}</Text>}
                        description={`Business ID: ${item.businessId}`}
                      />
                    </BusinessListItem>
                  )}
                />
              ) : (
                <Empty description="This user does not own any businesses." />
              )}
            </TabPane>
          </Tabs>
        </DetailsContent>
      </div>
    );
  };

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>User Management</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and analyze all platform users.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Button
              icon={<Download size={16} />}
              onClick={handleExportData}
              disabled={users.length === 0}
            >
              Export
            </Button>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />
        <div style={{ marginBottom: "20px" }}>
          <Text
            style={{
              fontSize: isMobile ? "16px" : "17px",
              fontWeight: 600,
              color: colors.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <BarChart2 size={20} color={colors.primary} /> Period Overview
          </Text>
        </div>

        <StatsGrid>
          {statsData.map((stat) => (
            <StatCard key={stat.key}>
              {metricsLoading ? (
                <StatSkeleton />
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
                    />
                  </StatValue>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <GridRow>
          <ChartCard>
            <CardTitle>
              <BarChart2 size={20} color={colors.primary} />
              User Registrations Trend
            </CardTitle>
            <HelpText>
              Daily count of new user registrations over the selected period.
            </HelpText>
            <ChartContainer>
              {metricsLoading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GlobalLoaderWithInlineStyles />
                </div>
              ) : metrics.registration_trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.registration_trend}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.border}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      stroke={colors.textTertiary}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(tick) => dayjs(tick).format("MMM D")}
                    />
                    <YAxis
                      stroke={colors.textTertiary}
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      content={renderLineChartTooltip}
                      cursor={{
                        stroke: colors.primary,
                        strokeDasharray: "3 3",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="registrations"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No registration data available" />
              )}
            </ChartContainer>
          </ChartCard>
          <ChartCard>
            <CardTitle>
              <PieChartIcon size={20} color={colors.primary} />
              User Role Distribution
            </CardTitle>
            <HelpText>
              The breakdown of all users by their assigned role.
            </HelpText>
            <ChartContainer>
              {metricsLoading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GlobalLoaderWithInlineStyles />
                </div>
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

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <Users /> All Platform Users
            </TableTitle>
            <TableDescription>
              Search, filter, and manage all users on the platform.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input.Search
                placeholder="Search by name or email"
                allowClear
                value={searchText}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
              />
              <Select
                value={roleFilter}
                style={{ width: isMobile ? "100%" : 180 }}
                onChange={(value) => handleFilterChange({ role: value })}
                loading={!roles.length}
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
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(value) => handleFilterChange({ status: value })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <MobileCardList>
              {loading ? (
                <Skeleton active />
              ) : users.length > 0 ? (
                users.map(renderMobileUserCard)
              ) : (
                <Empty />
              )}
            </MobileCardList>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={users}
              rowKey="userId"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
              }}
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

        <Modal
          title="Edit User Role"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          onOk={handleEditSubmit}
          confirmLoading={loading}
          destroyOnClose
          afterClose={() => form.resetFields()}
          width={isMobile ? "95%" : 520}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="role"
              label="User Role"
              rules={[{ required: true, message: "Please select a role." }]}
            >
              <Select placeholder="Select a new role" loading={!roles.length}>
                {roles.map((r) => (
                  <Option key={r.id} value={r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <HelpText>
              Changing a user's role will alter their permissions and access
              across the platform.
            </HelpText>
          </Form>
        </Modal>

        <DetailsDrawer
          title="User Details"
          open={isDetailsDrawerVisible}
          onClose={() => setIsDetailsDrawerVisible(false)}
          width={isMobile ? "100%" : 500}
          destroyOnClose
        >
          {renderUserDetailsContent()}
        </DetailsDrawer>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default UserManagementDashboard;
