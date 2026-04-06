"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  ConfigProvider,
  Avatar,
  Space,
  Grid,
  Empty,
  Badge,
  Divider,
  Typography,
  Skeleton,
  Tooltip,
  Tag,
  Modal,
  Form,
} from "antd";
import message from "@/lib/message";
import {
  Search,
  Eye,
  Download,
  MessageSquare,
  BarChart2,
  Clock,
  Mail,
  RefreshCw,
  Hash,
  User,
  AlertTriangle,
  CheckCircle2,
  Shield,
  UserCheck,
  Edit,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import { supportTicketService } from "@/services/adminDash";
import { theme as antdComponentTheme } from "@/components/theme";
import TicketDetailDrawer from "./TicketDetailDrawer";
import axios from "axios";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import AdminMetricCards from "../shared/AdminMetricCards";
import { AdminMetricCardsSkeleton } from "../shared/AdminSkeletons";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title: AntTitle, Paragraph } = Typography;

// --- THEME COLORS ---
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
  textPrimary: "#111827",
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
  background: white;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;
const TableTitle = styled(AntTitle).attrs({ level: 4 })`
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
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
    color: ${colors.textPrimary};
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc;
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

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

const getPriorityProps = (priority) => {
  const map = {
    low: { color: colors.success, text: "Low" },
    medium: { color: colors.info, text: "Medium" },
    high: { color: colors.warning, text: "High" },
    urgent: { color: colors.error, text: "Urgent" },
  };
  return map[priority] || map.medium;
};

const getCategoryColor = (category) => {
  const map = {
    account: colors.purple,
    booking: colors.pink,
    payment: colors.error,
    technical: colors.success,
    feature: colors.warning,
  };
  return map[category] || colors.textSecondary;
};

// --- MAIN COMPONENT ---
const SupportTicketTab = () => {
  const [tickets, setTickets] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    priority: "all",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const abortControllerRef = useRef(null);
  const searchParams = useSearchParams();

  // Open ticket drawer from URL ?ticket=<ticket_id> (e.g. from admin notification email)
  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setIsDetailDrawerVisible(true);
    }
  }, [searchParams]);

  const handleFilterChange = (updates) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const fetchTickets = useCallback(
    async (page = pagination.current, pageSize = pagination.pageSize) => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const params = {
          page,
          page_size: pageSize,
          category: filters.category !== "all" ? filters.category : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          priority: filters.priority !== "all" ? filters.priority : undefined,
          search: filters.search || undefined,
        };
        const response = await supportTicketService.getTickets(params, {
          signal: abortControllerRef.current.signal,
        });
        if (response.success && response.pagination) {
          setTickets(response.data);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: response.pagination.count,
          }));
        } else {
          if (!abortControllerRef.current.signal.aborted) {
            message.error(response.error || "Failed to load tickets");
          }
        }
      } catch (error) {
        if (!axios.isCancel(error)) message.error("Error fetching tickets");
      } finally {
        if (!abortControllerRef.current.signal.aborted) setLoading(false);
      }
    },
    [filters, pagination.current, pagination.pageSize]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTickets();
    }, 300); // Debounce search input
    return () => clearTimeout(handler);
  }, [filters, fetchTickets]);

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const response = await supportTicketService.getTicketStats();
      if (response.success) {
        setStatistics(response.data);
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else message.error(response.error || "Failed to load statistics");
    } catch (error) {
      message.error("Error fetching stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleTableChange = (newPagination) => {
    fetchTickets(newPagination.current, newPagination.pageSize);
  };

  const showTicketDetails = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsDetailDrawerVisible(true);
  };

  const refreshData = () => {
    fetchTickets(1);
    fetchStatistics();
  };

  const handleTicketUpdate = (updatedTicket) => {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.ticket_id === updatedTicket.ticket_id
          ? { ...ticket, ...updatedTicket }
          : ticket
      )
    );
    fetchStatistics();
  };

  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignForm] = Form.useForm();

  useEffect(() => {
    if (bulkAssignModalOpen) {
      supportTicketService.getAssignableAgents().then((r) => {
        if (r.success && r.data) setAssignableAgents(Array.isArray(r.data) ? r.data : r.data.results || []);
      });
    }
  }, [bulkAssignModalOpen]);

  const handleBulkAssignSubmit = async () => {
    const { agent_id } = await bulkAssignForm.validateFields();
    setBulkAssignLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRowKeys.map((id) => supportTicketService.assignTicket(id, { agent_id }))
      );
      const ok = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      message.success(`${ok} ticket(s) assigned.`);
      setBulkAssignModalOpen(false);
      bulkAssignForm.resetFields();
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchTickets(pagination.current, pagination.pageSize);
      fetchStatistics();
    } catch {
      message.error("Assignment failed.");
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const handleBulkChangePriority = () => {
    message.info("Change priority per ticket in the ticket detail drawer.");
  };

  const handleBulkCloseTickets = async () => {
    if (selectedRowKeys.length === 0) return;
    setBulkAssignLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRowKeys.map((id) => supportTicketService.resolveTicket(id, { resolution: "Closed in bulk" }))
      );
      const ok = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      message.success(`${ok} ticket(s) closed.`);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchTickets(pagination.current, pagination.pageSize);
      fetchStatistics();
    } catch {
      message.error("Some tickets could not be closed.");
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedRows.length === 0) {
      message.warning("No tickets selected.");
      return;
    }
    const headers = ["ID", "Subject", "Status", "Priority", "Category", "Requester", "Created"];
    const rows = selectedRows.map((t) => [
      t.ticket_id ?? "",
      t.subject ?? "",
      t.status ?? "",
      t.priority ?? "",
      t.category ?? "",
      t.requester_email ?? t.requester ?? "",
      t.created_at ?? "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("CSV downloaded.");
  };

  const statCardsData = [
    {
      title: "Open Tickets",
      value: statistics?.open_tickets,
      icon: MessageSquare,
      footer: "Awaiting first response",
      color: colors.info,
      isNumeric: true,
      periodBadge: "30d",
    },
    {
      title: "In Progress",
      value: statistics?.in_progress_tickets,
      icon: Clock,
      footer: "Actively being handled",
      color: colors.success,
      isNumeric: true,
      periodBadge: "30d",
    },
    {
      title: "Resolved Today",
      value: statistics?.resolved_today ?? 0,
      icon: CheckCircle2,
      footer: "Closed in last 24h",
      color: colors.success,
      isNumeric: true,
      periodBadge: "24h",
    },
  ];

  const ticketColumns = [
    {
      title: "Ticket ID",
      dataIndex: "user_facing_id",
      key: "id",
      width: 120,
      fixed: "left",
      render: (id) => <Text copyable={{ text: id }}>{id}</Text>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      width: 240,
      render: (s) => <Text strong>{s}</Text>,
    },
    {
      title: "User",
      key: "user",
      width: 220,
      render: (_, r) => (
        <Space>
          <Avatar src={r.user_details?.avatar_thumb_url}>
            {r.user_details?.full_name[0]}
          </Avatar>
          <div>
            <Text>{r.user_details?.full_name}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {r.user_details?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status_display",
      key: "status",
      width: 150,
      render: (s, r) => (
        <Badge
          status={
            {
              open: "warning",
              in_progress: "processing",
              resolved: "success",
              closed: "default",
            }[r.status] || "default"
          }
          text={s}
        />
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (p) => {
        const { color, text } = getPriorityProps(p);
        return (
          <Space>
            <Tag
              style={{
                background: hexToRgba(color, 0.1),
                color,
                border: "none",
                fontWeight: 600,
                fontSize: 11,
                margin: 0,
              }}
            >{text}</Tag>
          </Space>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category_display",
      key: "category",
      width: 180,
      render: (c, r) => (
        <Tag
          color={hexToRgba(getCategoryColor(r.category), 0.1)}
          style={{
            color: getCategoryColor(r.category),
            fontWeight: 500,
            border: "none",
          }}
        >
          {c}
        </Tag>
      ),
    },
    {
      title: "Assigned To",
      dataIndex: ["assigned_to_details", "full_name"],
      key: "assigned",
      width: 200,
      responsive: ["lg"],
      render: (name, r) =>
        name ? (
          <Space>
            <Avatar size="small" src={r.assigned_to_details?.avatar_thumb_url}>
              {name[0]}
            </Avatar>
            <Text>{name}</Text>
          </Space>
        ) : (
          <Text type="secondary">Unassigned</Text>
        ),
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated",
      width: 150,
      responsive: ["md"],
      render: formatDate,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      align: "center",
      render: (_, r) => (
        <Button
          size="middle"
          icon={<Eye size={14} />}
          onClick={() => showTicketDetails(r.ticket_id)}
        >
          Details
        </Button>
      ),
    },
  ];

  const renderMobileTicketCard = (ticket) => (
    <MobileCard key={ticket.ticket_id}>
      <MobileCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <Space>
            <Avatar src={ticket.user_details?.avatar_thumb_url}>
              {ticket.user_details?.full_name[0]}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: "14px", display: "block" }}>
                {ticket.subject}
              </Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {ticket.user_details?.full_name}
              </Text>
            </div>
          </Space>
          <Badge
            status={
              {
                open: "warning",
                in_progress: "processing",
                resolved: "success",
                closed: "default",
              }[ticket.status]
            }
            text={ticket.status_display}
          />
        </div>
        <MobileCardRow>
          <MobileCardLabel>Priority</MobileCardLabel>
          <Tag color={getPriorityProps(ticket.priority).color}>
            {ticket.priority_display}
          </Tag>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Category</MobileCardLabel>
          <Text>{ticket.category_display}</Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Updated</MobileCardLabel>
          <Text>{formatDate(ticket.updated_at)}</Text>
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
            onClick={() => showTicketDetails(ticket.ticket_id)}
            block
          >
            View Details
          </Button>
        </div>
      </MobileCardContent>
    </MobileCard>
  );

  return (
    <ConfigProvider theme={antdComponentTheme}>
      <DashboardWrapper>
      <ContentLayer>
        <DashboardHeader style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <PageTitle>Support Inbox</PageTitle>
            <HeaderSubtitle>
              Manage and respond to all customer support tickets.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={<RefreshCw size={16} />}
              onClick={refreshData}
              loading={loading || statsLoading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: colors.textTertiary, textTransform: "uppercase", marginBottom: 10 }}>
          Support overview
        </div>
        <div style={{ marginBottom: 20 }}>
          {statsLoading ? (
            <AdminMetricCardsSkeleton count={statCardsData.length} />
          ) : (
            <AdminMetricCards
              cards={statCardsData.map((card) => ({
                ...card,
                value: card.isNumeric ? card.value ?? 0 : card.value || "—",
              }))}
              isReadyForAnimation={isReadyForAnimation}
            />
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <TableSection>
          <TableHeader>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <TableTitle>
                  <MessageSquare /> All Tickets
                </TableTitle>
                <TableDescription>
                  Complete list of tickets with filtering and search capabilities.
                </TableDescription>
              </div>
            </div>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                prefix={<Search size={14} style={{ color: colors.textTertiary }} />}
                placeholder="Search subject, user, ID..."
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 240, borderRadius: 8 }}
              />
              <Select
                value={filters.status}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="open">Open</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="resolved">Resolved</Option>
                <Option value="closed">Closed</Option>
              </Select>
              <Select
                value={filters.priority}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(val) => handleFilterChange({ priority: val })}
              >
                <Option value="all">All Priorities</Option>
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
              <Select
                value={filters.category}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(val) => handleFilterChange({ category: val })}
              >
                <Option value="all">All Categories</Option>
                <Option value="account">Account</Option>
                <Option value="booking">Booking</Option>
                <Option value="payment">Payment</Option>
                <Option value="technical">Technical</Option>
                <Option value="feature">Feature Request</Option>
              </Select>
            </SearchFilterContainer>
          </FilterBar>
          {selectedRowKeys.length > 0 && (
            <BulkActionsBar>
              <strong>{selectedRowKeys.length} selected</strong>
              <Button size="small" icon={<UserCheck size={13} />} onClick={() => setBulkAssignModalOpen(true)}>Assign Agent</Button>
              <Button size="small" icon={<Edit size={13} />} onClick={handleBulkChangePriority}>Change Priority</Button>
              <Button size="small" icon={<CheckCircle2 size={13} />} onClick={handleBulkCloseTickets}>Close Tickets</Button>
              <Button size="small" icon={<FileText size={13} />} onClick={handleBulkExport}>Export</Button>
              <Button size="small" type="text" onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>Clear</Button>
            </BulkActionsBar>
          )}

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : tickets.length > 0 ? (
                tickets.map(renderMobileTicketCard)
              ) : (
                <Empty description="No tickets found with current filters." />
              )}
            </div>
          ) : (
            <StyledTable
              columns={ticketColumns}
              dataSource={tickets}
              rowKey="ticket_id"
              rowSelection={{
                selectedRowKeys,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys);
                  setSelectedRows(rows || []);
                },
              }}
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                size: "small",
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} tickets`,
              }}
              onChange={handleTableChange}
              scroll={{ x: 1400 }}
              locale={{
                emptyText: (
                  <Empty description="No tickets found with current filters." />
                ),
              }}
            />
          )}
        </TableSection>
      </ContentLayer>

        <Modal
          title={`Assign agent to ${selectedRowKeys.length} ticket(s)`}
          open={bulkAssignModalOpen}
          onCancel={() => { setBulkAssignModalOpen(false); bulkAssignForm.resetFields(); }}
          footer={[
            <Button key="cancel" onClick={() => { setBulkAssignModalOpen(false); bulkAssignForm.resetFields(); }}>Cancel</Button>,
            <Button key="submit" type="primary" loading={bulkAssignLoading} onClick={() => handleBulkAssignSubmit()}>Assign</Button>,
          ]}
          destroyOnClose
        >
          <Form form={bulkAssignForm} layout="vertical">
            <Form.Item name="agent_id" label="Agent" rules={[{ required: true, message: "Select an agent." }]}>
              <Select placeholder="Select agent" loading={assignableAgents.length === 0} showSearch optionFilterProp="label">
                {assignableAgents.map((agent) => (
                  <Option key={agent.id} value={agent.id} label={agent.email || agent.name || agent.id}>
                    {agent.name || agent.email || `Agent ${agent.id}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <TicketDetailDrawer
          ticketId={selectedTicketId}
          open={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
          onUpdate={handleTicketUpdate}
        />
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default SupportTicketTab;
