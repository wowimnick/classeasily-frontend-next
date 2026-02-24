"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
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
  RefreshCcw,
  Hash,
  User,
} from "lucide-react";
import { supportTicketService } from "@/services/adminDash";
import { theme as antdComponentTheme } from "@/components/theme";
import TicketDetailDrawer from "./TicketDetailDrawer";
import axios from "axios";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

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
  textPrimary: "#334155",
  textSecondary: "#64748b",
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
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 4px;
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

  const statCardsData = [
    {
      title: "Open Tickets",
      value: statistics?.open_tickets,
      icon: MessageSquare,
      footer: "Awaiting first response",
      color: colors.info,
    },
    {
      title: "In Progress",
      value: statistics?.in_progress_tickets,
      icon: Clock,
      footer: "Actively being handled",
      color: colors.success,
    },
    {
      title: "Avg. First Response",
      value: statistics?.avg_first_response_time,
      icon: Mail,
      footer: "Time to first agent reply",
      color: colors.pink,
    },
    {
      title: "Avg. Resolution Time",
      value: statistics?.avg_resolution_time,
      icon: BarChart2,
      footer: "From creation to resolution",
      color: colors.purple,
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
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
              }}
            />
            <Text>{text}</Text>
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

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  return (
    <ConfigProvider theme={antdComponentTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Support Inbox</PageTitle>
            <HeaderSubtitle>
              Manage and respond to all customer support tickets.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  trigger="hover"
                  size="20px"
                />
              }
              onClick={refreshData}
              loading={loading || statsLoading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
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
            <BarChart2 size={20} color={colors.primary} /> Support Overview
          </Text>
        </div>

        <StatsGrid>
          {statCardsData.map((stat) => (
            <StatCard key={stat.title}>
              {statsLoading ? (
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
                    {typeof stat.value === "number" ? (
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value : 0}
                        duration={800}
                      />
                    ) : (
                      stat.value || "N/A"
                    )}
                  </StatValue>
                  {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <MessageSquare /> All Tickets
            </TableTitle>
            <TableDescription>
              Complete list of tickets with filtering and search capabilities.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search subject, user, ID..."
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
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
            </SearchFilterContainer>
          </FilterBar>

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
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
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
