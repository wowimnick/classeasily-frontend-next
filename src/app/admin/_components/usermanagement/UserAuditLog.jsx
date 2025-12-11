"use client";

import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import {
  Table,
  Card,
  DatePicker,
  Select,
  Input,
  Button,
  ConfigProvider,
  Tag,
  Space,
  Timeline,
  Tabs,
  Divider,
  Grid,
  Empty,
  Typography,
} from "antd";
import message from "@/lib/message";
import {
  Activity,
  User,
  Search,
  Download,
  Eye,
  FileText,
  Shield,
  Key,
  X,
  Clock,
} from "lucide-react";
import { auditService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";
import { Drawer } from "vaul";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;

// --- STYLING & THEME ---
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

// --- LAYOUT COMPONENTS ---
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

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }
`;

const ExportButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
`;

// --- SKELETON COMPONENTS ---
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

// --- VAUL DRAWER STYLES ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0px); }
`;

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
  width: 600px;
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

const DrawerBody = styled.div`
  padding: 0;
  flex: 1;
  overflow-y: auto;
  background-color: ${colors.lightBg};
  animation: ${fadeIn} 0.5s 0.1s ease-out both;
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
  background: white;
  @media (max-width: 768px) {
    padding: 16px;
  }
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
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textPrimary};
    font-size: 13px;
    padding: 16px 24px;
  }
  .ant-table-tbody > tr > td {
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
  /* Prevent table collapse */
  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: white;
  }
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

// --- DETAIL COMPONENTS ---
const ActionTag = styled(Tag)`
  font-weight: 500;
  border: none !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 3px 10px;
`;
const IpAddress = styled.span`
  font-family: monospace;
  background-color: ${colors.border};
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
  color: ${colors.textSecondary};
`;
const TimelineItemDot = styled.div`
  background: ${(props) => props.color};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 3px solid ${colors.lightBg};
`;
const TimelineItemContent = styled.div`
  .timestamp {
    font-size: 12px;
    color: ${colors.textSecondary};
  }
  .details {
    color: ${colors.textPrimary};
    margin-top: 4px;
  }
  .metadata-section {
    margin-top: 12px;
    padding: 12px;
    background: white;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    font-size: 13px;
  }
`;

const DetailsHero = styled.div`
  padding: 24px;
  background: white;
  border-bottom: 1px solid ${colors.border};
`;
const DetailsTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 12px 0;
`;
const DetailsContent = styled.div`
  padding: 24px;
  .ant-tabs-nav {
    margin-bottom: 24px !important;
  }
`;
const ProfileGrid = styled.div`
  display: grid;
  gap: 16px;
`;
const ProfileItem = styled.div`
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border};
`;
const ProfileLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-bottom: 4px;
`;
const ProfileValue = styled.div`
  font-size: 14px;
  color: ${colors.textPrimary};
  font-weight: 500;
  word-break: break-word;
`;

// --- EVENT CONFIG ---
const eventTypeConfig = {
  login: { icon: <User size={14} />, color: colors.success, label: "Login" },
  logout: {
    icon: <User size={14} />,
    color: colors.textSecondary,
    label: "Logout",
  },
  user_update: {
    icon: <User size={14} />,
    color: "#8b5cf6",
    label: "User Updated",
  },
  role_change: {
    icon: <Shield size={14} />,
    color: "#f97316",
    label: "Role Changed",
  },
  account_lock: {
    icon: <User size={14} />,
    color: colors.error,
    label: "Account Locked",
  },
  account_unlock: {
    icon: <User size={14} />,
    color: colors.success,
    label: "Account Unlocked",
  },
  password_reset: {
    icon: <Key size={14} />,
    color: colors.warning,
    label: "Password Reset",
  },
  failed_login: {
    icon: <User size={14} />,
    color: colors.error,
    label: "Failed Login",
  },
  data_export: {
    icon: <Download size={14} />,
    color: colors.info,
    label: "Data Exported",
  },
  default: {
    icon: <Activity size={14} />,
    color: colors.textSecondary,
    label: "Activity",
  },
};

// --- GENERATORS ---
const generateSkeletonData = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `skeleton-${i}`,
    user_name: (
      <Space>
        <SkeletonCircle size="36px" />
        <SkeletonWrapper>
          <SkeletonLine width="100px" height="14px" />
          <SkeletonLine width="140px" height="12px" />
        </SkeletonWrapper>
      </Space>
    ),
    action: <SkeletonTag width="90px" />,
    details: <SkeletonLine width="180px" />,
    ip_address: <SkeletonLine width="100px" />,
    timestamp: <SkeletonLine width="140px" />,
    actions: <SkeletonTag width="80px" />,
  }));
};

const DrawerSkeleton = () => (
  <>
    <DetailsHero>
      <SkeletonLine width="120px" height="24px" marginBottom="12px" />
      <SkeletonWrapper>
        <SkeletonLine width="180px" height="14px" />
        <SkeletonLine width="140px" height="14px" />
      </SkeletonWrapper>
    </DetailsHero>
    <DetailsContent>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <SkeletonLine width="80px" height="20px" />
        <SkeletonLine width="80px" height="20px" />
      </div>
      <ProfileGrid>
        <ProfileItem>
          <SkeletonLine width="80px" height="12px" marginBottom="8px" />
          <SkeletonLine width="100%" height="16px" />
        </ProfileItem>
        <ProfileItem>
          <SkeletonLine width="60px" height="12px" marginBottom="8px" />
          <SkeletonLine width="120px" height="16px" />
        </ProfileItem>
      </ProfileGrid>
    </DetailsContent>
  </>
);

// --- UTILITY FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("MMM D, YYYY, h:mm A");
};

const formatChanges = (changes) => {
  if (!changes || typeof changes !== "object") return null;
  return (
    <pre
      style={{
        margin: 0,
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        fontSize: 12,
      }}
    >
      {JSON.stringify(changes, null, 2)}
    </pre>
  );
};

const UserAuditLog = () => {
  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    dateRange: null,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const fetchAuditLogs = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        ...(filters.action !== "all" && { action: filters.action }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange?.[0] && {
          start_date: filters.dateRange[0].format("YYYY-MM-DD"),
        }),
        ...(filters.dateRange?.[1] && {
          end_date: filters.dateRange[1].format("YYYY-MM-DD"),
        }),
      };
      try {
        const response = await auditService.getAuditLogs(params);
        if (response.success) {
          setAuditLogs(response.data.results || []);
          setPagination({
            current: page,
            pageSize,
            total: response.data.count || 0,
          });
        } else message.error("Failed to fetch audit logs");
      } catch (error) {
        message.error("Error fetching audit logs");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAuditLogs(1, pagination.pageSize);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters, pagination.pageSize, fetchAuditLogs]);

  const handleTableChange = (newPagination) => {
    setPagination((p) => ({ ...p, ...newPagination }));
    fetchAuditLogs(newPagination.current, newPagination.pageSize);
  };

  const fetchUserActivity = async (userId) => {
    if (!userId) return;
    setActivityLoading(true);
    setUserActivity([]);
    try {
      const response = await auditService.getAuditLogs({
        user_id: userId,
        page_size: 50,
        ordering: "-timestamp",
      });
      setUserActivity(response.success ? response.data.results || [] : []);
    } catch (error) {
      message.error("Error fetching user activity");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setIsDrawerVisible(true);
    if (log.user_id) fetchUserActivity(log.user_id);
    else setUserActivity([]);
  };

  const handleExport = async () => {
    setExporting(true);
    message.loading({ content: "Preparing export...", key: "export" });
    try {
      const response = await auditService.exportAuditLogs({
        ...(filters.action !== "all" && { action: filters.action }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange?.[0] && {
          start_date: filters.dateRange[0].format("YYYY-MM-DD"),
        }),
        ...(filters.dateRange?.[1] && {
          end_date: filters.dateRange[1].format("YYYY-MM-DD"),
        }),
      });
      if (!response.success) {
        message.error({
          content: response.error || "Export failed.",
          key: "export",
        });
      } else {
        message.success({ content: "Export started!", key: "export" });
      }
    } catch (error) {
      message.error({ content: "Export failed.", key: "export" });
    } finally {
      setExporting(false);
    }
  };

  const refreshData = () => {
    fetchAuditLogs(1, pagination.pageSize);
  };

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 220,
      render: (_, log) => {
        if (React.isValidElement(log.user_name)) return log.user_name;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{log.user_name || "System"}</Text>
            {log.user_email && <Text type="secondary">{log.user_email}</Text>}
          </Space>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_, log) => {
        if (React.isValidElement(log.action)) return log.action;
        const config = eventTypeConfig[log.action] || eventTypeConfig.default;
        return (
          <ActionTag color={config.color}>
            {config.icon} {log.action_display || config.label}
          </ActionTag>
        );
      },
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      ellipsis: true,
      render: (details) => {
        if (React.isValidElement(details)) return details;
        return <Text type="secondary">{details}</Text>;
      },
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      responsive: ["lg"],
      render: (ip) => {
        if (React.isValidElement(ip)) return ip;
        return ip ? <IpAddress>{ip}</IpAddress> : "N/A";
      },
      width: 130,
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (ts) => {
        if (React.isValidElement(ts)) return ts;
        return formatDate(ts);
      },
      width: 220,
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      align: "center",
      render: (_, log) => {
        if (React.isValidElement(log.actions)) return log.actions;
        return (
          <Button
            icon={<Eye size={14} />}
            onClick={() => handleViewDetails(log)}
            size="middle"
          >
            Details
          </Button>
        );
      },
    },
  ];

  const renderMobileCard = (log) => {
    if (React.isValidElement(log.user_name)) {
      return (
        <MobileCard key={log.id}>
          <MobileCardContent>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {log.user_name}
              {log.action}
            </div>
            <MobileCardRow>
              <SkeletonLine width="100%" />
            </MobileCardRow>
            <MobileCardRow>
              <SkeletonLine width="50%" />
            </MobileCardRow>
            <div style={{ marginTop: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
                 <SkeletonTag width="100%" />
            </div>
          </MobileCardContent>
        </MobileCard>
      );
    }

    const config = eventTypeConfig[log.action] || eventTypeConfig.default;
    return (
      <MobileCard key={log.id}>
        <MobileCardContent>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "12px",
            }}
          >
            <Space direction="vertical" size={0}>
              <Text strong>{log.user_name || "System"}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {log.user_email || "No email"}
              </Text>
            </Space>
            <ActionTag color={config.color}>
              {config.icon} {log.action_display || config.label}
            </ActionTag>
          </div>
          <MobileCardRow>
            <MobileCardLabel>Details</MobileCardLabel>
            <Text style={{ textAlign: "right", maxWidth: "70%" }} ellipsis>
              {log.details}
            </Text>
          </MobileCardRow>
          <MobileCardRow>
            <MobileCardLabel>IP Address</MobileCardLabel>
            <IpAddress>{log.ip_address || "N/A"}</IpAddress>
          </MobileCardRow>
          <MobileCardRow>
            <MobileCardLabel>Timestamp</MobileCardLabel>
            <Text>{formatDate(log.timestamp)}</Text>
          </MobileCardRow>
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <Button
              type="primary"
              size="middle"
              icon={<Eye size={14} />}
              onClick={() => handleViewDetails(log)}
              block
            >
              View Details
            </Button>
          </div>
        </MobileCardContent>
      </MobileCard>
    );
  };

  const renderUserDetailsContent = () => {
    if (!selectedLog) return <DrawerSkeleton />;
    const config =
      eventTypeConfig[selectedLog.action] || eventTypeConfig.default;
    return (
      <>
        <DetailsHero>
          <DetailsTitle>{config.label}</DetailsTitle>
          <Space direction="vertical" size="small">
            <Text>
              By: <Text strong>{selectedLog.user_name || "System Action"}</Text>
            </Text>
            <Text type="secondary">{formatDate(selectedLog.timestamp)}</Text>
          </Space>
        </DetailsHero>
        <DetailsContent>
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <>
                  <FileText size={14} /> Details
                </>
              }
              key="1"
            >
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Core information about the recorded event.
              </Paragraph>
              <ProfileGrid>
                <ProfileItem>
                  <ProfileLabel>Description</ProfileLabel>
                  <ProfileValue>
                    {selectedLog.details || "No details provided."}
                  </ProfileValue>
                </ProfileItem>
                <ProfileItem>
                  <ProfileLabel>IP Address</ProfileLabel>
                  <ProfileValue>
                    <IpAddress>{selectedLog.ip_address || "N/A"}</IpAddress>
                  </ProfileValue>
                </ProfileItem>
                <ProfileItem>
                  <ProfileLabel>User Agent</ProfileLabel>
                  <ProfileValue
                    style={{ fontSize: 12, fontFamily: "monospace" }}
                  >
                    {selectedLog.user_agent || "N/A"}
                  </ProfileValue>
                </ProfileItem>
                {selectedLog.metadata?.changes && (
                  <ProfileItem>
                    <ProfileLabel>Data Changes</ProfileLabel>
                    <ProfileValue>
                      {formatChanges(selectedLog.metadata.changes)}
                    </ProfileValue>
                  </ProfileItem>
                )}
              </ProfileGrid>
            </TabPane>
            {selectedLog.user_id && (
              <TabPane
                tab={
                  <>
                    <Clock size={14} /> User History
                  </>
                }
                key="2"
              >
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  A timeline of recent activities performed by this user.
                </Paragraph>
                {activityLoading ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                     <SkeletonWrapper>
                        <SkeletonLine width="60%" height="20px" marginBottom="12px" />
                        <SkeletonLine width="80%" height="16px" marginBottom="24px" />
                        <SkeletonLine width="50%" height="20px" marginBottom="12px" />
                        <SkeletonLine width="70%" height="16px" />
                     </SkeletonWrapper>
                  </div>
                ) : !userActivity.length ? (
                  <Empty description="No recent activity found for this user." />
                ) : (
                  <Timeline>
                    {userActivity.map((log) => {
                      const itemConfig =
                        eventTypeConfig[log.action] || eventTypeConfig.default;
                      return (
                        <Timeline.Item
                          key={log.id}
                          dot={
                            <TimelineItemDot color={itemConfig.color}>
                              {itemConfig.icon}
                            </TimelineItemDot>
                          }
                        >
                          <TimelineItemContent>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 4,
                              }}
                            >
                              <Text strong>{itemConfig.label}</Text>
                              <span className="timestamp">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            <div className="details">{log.details}</div>
                            {log.metadata?.changes && (
                              <div className="metadata-section">
                                {formatChanges(log.metadata.changes)}
                              </div>
                            )}
                          </TimelineItemContent>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>
                )}
              </TabPane>
            )}
          </Tabs>
        </DetailsContent>
      </>
    );
  };

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>User Activity & Audit Log</PageTitle>
            <HeaderSubtitle>
              Track and review all significant actions performed by users and
              the system.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <ExportButton
              icon={<Download size={16} />}
              onClick={handleExport}
              loading={exporting}
            >
              {!isMobile && "Export Logs"}
            </ExportButton>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  trigger="hover"
                  size="20px"
                />
              }
              onClick={refreshData}
              loading={loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <Activity /> Audit Trail
            </TableTitle>
            <TableDescription>
              Search and filter logs to investigate specific events or user
              actions.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search user, email, or details"
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
              />
              <Select
                value={filters.action}
                onChange={(val) => handleFilterChange({ action: val })}
                style={{ width: isMobile ? "100%" : 200 }}
              >
                <Option value="all">All Actions</Option>
                {Object.entries(eventTypeConfig)
                  .filter(([key]) => key !== "default")
                  .map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Option>
                  ))}
              </Select>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange({ dateRange: dates })}
                style={{ width: isMobile ? "100%" : 280 }}
              />
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading
                ? generateSkeletonData(5).map(renderMobileCard)
                : auditLogs.length > 0
                ? (
                  <>
                    {auditLogs.map(renderMobileCard)}
                    {pagination.total > pagination.pageSize && (
                      <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <Button
                          onClick={() =>
                            handleTableChange({
                              ...pagination,
                              current: pagination.current + 1,
                            })
                          }
                          disabled={
                            pagination.current * pagination.pageSize >=
                            pagination.total
                          }
                        >
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Empty description="No logs found." />
                )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={loading ? generateSkeletonData(pagination.pageSize) : auditLogs}
              rowKey="id"
              loading={false}
              pagination={loading ? false : {
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} logs`,
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty description="No audit logs found with the current filters." />
                ),
              }}
            />
          )}
        </TableSection>

        {/* VAUL DRAWER IMPLEMENTATION */}
        {isMobile ? (
          <Drawer.Root open={isDrawerVisible} onOpenChange={setIsDrawerVisible}>
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                   <DrawerHeaderTitle><Activity size={20} /> Event Details</DrawerHeaderTitle>
                   <CloseButton onClick={() => setIsDrawerVisible(false)} icon={<X size={20} />} />
                </DrawerHeader>
                <DrawerBody>
                   {renderUserDetailsContent()}
                </DrawerBody>
              </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <Drawer.Root open={isDrawerVisible} onOpenChange={setIsDrawerVisible} direction="right" dismissible>
            <Drawer.Portal>
               <StyledDrawerOverlay />
               <DesktopDrawerContent style={{ "--initial-transform": "calc(100% + 8px)" }}>
                 <DesktopDrawerInner>
                    <DrawerHeader>
                        <DrawerHeaderTitle><Activity size={20} /> Event Details</DrawerHeaderTitle>
                        <CloseButton onClick={() => setIsDrawerVisible(false)} icon={<X size={20} />} />
                    </DrawerHeader>
                    <DrawerBody>
                       {renderUserDetailsContent()}
                    </DrawerBody>
                 </DesktopDrawerInner>
               </DesktopDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default UserAuditLog;