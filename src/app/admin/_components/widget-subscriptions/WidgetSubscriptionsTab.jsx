"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Table,
  Card,
  Button,
  Tag,
  Typography,
  Skeleton,
  Empty,
  message,
  Space,
  Tooltip,
  Input,
  Select,
  ConfigProvider,
  Grid,
} from "antd";
import {
  RefreshCw,
  Building,
  ExternalLink,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Search,
  ChevronRight,
  Calendar,
  Hash,
} from "lucide-react";
import { Drawer } from "vaul";
import { adminWidgetSubscriptionService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import dayjs from "dayjs";
import AdminMetricCards from "../shared/AdminMetricCards";

const { Text, Title: AntTitle } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
};

const statusColors = {
  active: "green",
  trialing: "blue",
  past_due: "orange",
  canceled: "red",
  incomplete: "default",
  incomplete_expired: "default",
};

// --- Layout
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #fff;
  min-height: 100%;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px 0;
`;

// --- Table Section
const TableSection = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  overflow: hidden;
`;

const TableHeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.border};
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid ${colors.border};
  flex-wrap: wrap;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: ${colors.lightBg};
    color: ${colors.textSecondary};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 10px 14px;
  }

  .ant-table-tbody > tr > td {
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
  }

  .ant-table-tbody > tr:hover > td {
    background: ${colors.lightBg};
  }
`;

// --- Vaul Drawer
const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1050;
`;

const MobileShell = styled(Drawer.Content)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1051;
  background: #fff;
  border-radius: 20px 20px 0 0;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  outline: none;
`;

const DesktopShell = styled(Drawer.Content)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1051;
  width: 520px;
  background: #fff;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d5db;
  flex-shrink: 0;
`;

const ThumbArea = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  flex-shrink: 0;
`;

const DrawerHeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoCard = styled.div`
  background: ${colors.lightBg};
  border-radius: 12px;
  padding: 16px;
`;

const InfoCardTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.textSecondary};
  margin-bottom: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-of-type {
    padding-top: 0;
  }
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
`;

const InfoValue = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.textPrimary};
  text-align: right;
  max-width: 60%;
  word-break: break-all;
`;

export default function WidgetSubscriptionsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminWidgetSubscriptionService.list();
      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        message.error(result.error || "Failed to load widget subscriptions");
      }
    } catch {
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openDrawer = (record) => {
    setSelected(record);
    setDrawerOpen(true);
  };

  // KPI stats
  const activeCount = data.filter((d) => d.status === "active").length;
  const trialingCount = data.filter((d) => d.status === "trialing").length;
  const pastDueCount = data.filter((d) => d.status === "past_due").length;
  const canceledCount = data.filter((d) => d.status === "canceled").length;

  const statCards = [
    {
      key: "total",
      title: "Total",
      value: data.length,
      icon: CreditCard,
      bg: "rgba(59, 130, 246, 0.1)",
      color: colors.info,
      footer: "Widget subscriptions",
    },
    {
      key: "active",
      title: "Active",
      value: activeCount,
      icon: CheckCircle,
      bg: "rgba(16, 185, 129, 0.1)",
      color: colors.success,
      footer: "Paying businesses",
    },
    {
      key: "trialing",
      title: "Trialing",
      value: trialingCount,
      icon: Clock,
      bg: "rgba(139, 92, 246, 0.1)",
      color: colors.purple,
      footer: "Trial period",
    },
    {
      key: "past_due",
      title: "Past Due",
      value: pastDueCount,
      icon: AlertCircle,
      bg: "rgba(245, 158, 11, 0.1)",
      color: colors.warning,
      footer: "Need attention",
    },
    {
      key: "canceled",
      title: "Canceled",
      value: canceledCount,
      icon: XCircle,
      bg: "rgba(239, 68, 68, 0.1)",
      color: colors.error,
      footer: "Churned",
    },
  ];

  const filtered = data.filter((d) => {
    const searchMatch =
      !filterSearch ||
      d.business_name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      d.business_slug?.toLowerCase().includes(filterSearch.toLowerCase());
    const statusMatch = !filterStatus || d.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const columns = [
    {
      title: "Business",
      dataIndex: "business_name",
      key: "business_name",
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {name || `Business #${record.business_id}`}
          </Text>
          {record.business_slug && (
            <div style={{ fontSize: 11, color: colors.textSecondary }}>
              /{record.business_slug}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan_id",
      key: "plan_id",
      render: (planId) => (
        <Tag color="blue" style={{ textTransform: "capitalize", fontSize: 11 }}>
          {planId || "—"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"} style={{ fontSize: 11 }}>
          {status ? String(status).replace(/_/g, " ") : "—"}
        </Tag>
      ),
    },
    {
      title: "Period End",
      dataIndex: "current_period_end",
      key: "current_period_end",
      render: (end) =>
        end ? dayjs(end).format("MMM D, YYYY") : "—",
    },
    {
      title: "Cancel at End",
      dataIndex: "cancel_at_period_end",
      key: "cancel_at_period_end",
      render: (v) => (v ? <Tag color="orange" style={{ fontSize: 11 }}>Yes</Tag> : <Text style={{ fontSize: 12, color: colors.textSecondary }}>—</Text>),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Space size={4}>
          {record.business_slug && (
            <Tooltip title="View business page">
              <Button
                type="text"
                size="small"
                icon={<ExternalLink size={14} />}
                href={`/business/${record.business_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          )}
          <Button
            type="text"
            size="small"
            icon={<ChevronRight size={14} />}
            onClick={() => openDrawer(record)}
          />
        </Space>
      ),
    },
  ];

  const drawerContent = selected && (
    <>
      <DrawerHeaderBar>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: colors.textPrimary }}>
            {selected.business_name || `Business #${selected.business_id}`}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Widget Subscription Details
          </div>
        </div>
        <Tag color={statusColors[selected.status] || "default"} style={{ fontSize: 12 }}>
          {selected.status ? String(selected.status).replace(/_/g, " ") : "—"}
        </Tag>
      </DrawerHeaderBar>
      <DrawerBody>
        <InfoCard>
          <InfoCardTitle>Subscription Info</InfoCardTitle>
          <InfoRow>
            <InfoLabel>Business</InfoLabel>
            <InfoValue>{selected.business_name || `#${selected.business_id}`}</InfoValue>
          </InfoRow>
          {selected.business_slug && (
            <InfoRow>
              <InfoLabel>Slug</InfoLabel>
              <InfoValue>
                <a
                  href={`/business/${selected.business_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.info }}
                >
                  /{selected.business_slug}
                </a>
              </InfoValue>
            </InfoRow>
          )}
          <InfoRow>
            <InfoLabel>Plan</InfoLabel>
            <InfoValue>
              <Tag color="blue" style={{ fontSize: 11, textTransform: "capitalize" }}>
                {selected.plan_id || "—"}
              </Tag>
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Status</InfoLabel>
            <InfoValue>
              <Tag color={statusColors[selected.status] || "default"} style={{ fontSize: 11 }}>
                {selected.status ? String(selected.status).replace(/_/g, " ") : "—"}
              </Tag>
            </InfoValue>
          </InfoRow>
          {selected.cancel_at_period_end && (
            <InfoRow>
              <InfoLabel>Cancel at Period End</InfoLabel>
              <InfoValue><Tag color="orange" style={{ fontSize: 11 }}>Yes</Tag></InfoValue>
            </InfoRow>
          )}
        </InfoCard>

        <InfoCard>
          <InfoCardTitle>Billing Period</InfoCardTitle>
          <InfoRow>
            <InfoLabel>Current Period End</InfoLabel>
            <InfoValue>
              {selected.current_period_end
                ? dayjs(selected.current_period_end).format("MMM D, YYYY")
                : "—"}
            </InfoValue>
          </InfoRow>
          {selected.trial_end && (
            <InfoRow>
              <InfoLabel>Trial Ends</InfoLabel>
              <InfoValue>{dayjs(selected.trial_end).format("MMM D, YYYY")}</InfoValue>
            </InfoRow>
          )}
          {selected.canceled_at && (
            <InfoRow>
              <InfoLabel>Canceled At</InfoLabel>
              <InfoValue>{dayjs(selected.canceled_at).format("MMM D, YYYY")}</InfoValue>
            </InfoRow>
          )}
        </InfoCard>

        {selected.stripe_subscription_id && (
          <InfoCard>
            <InfoCardTitle>Stripe Reference</InfoCardTitle>
            <InfoRow>
              <InfoLabel>Subscription ID</InfoLabel>
              <InfoValue style={{ fontFamily: "monospace", fontSize: 11 }}>
                {selected.stripe_subscription_id}
              </InfoValue>
            </InfoRow>
          </InfoCard>
        )}

        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          {selected.business_slug && (
            <Button
              icon={<ExternalLink size={14} />}
              href={`/business/${selected.business_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderRadius: 8, flex: 1, fontSize: 13 }}
            >
              View Business Page
            </Button>
          )}
        </div>

        <div style={{ fontSize: 11, color: colors.textSecondary, textAlign: "center", paddingBottom: 8 }}>
          Billing history and refunds are managed via Stripe or through support.
        </div>
      </DrawerBody>
    </>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Widget Subscriptions</PageTitle>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              View and manage booking widget plans per business.
            </div>
          </div>
          <Button
            icon={<RefreshCw size={14} />}
            onClick={fetchSubscriptions}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            {!isMobile && "Refresh"}
          </Button>
        </DashboardHeader>

        <AdminMetricCards cards={statCards} loading={loading} />

        <TableSection>
          <TableHeaderBar>
            <AntTitle level={5} style={{ margin: 0, fontSize: 14, color: colors.textPrimary }}>
              All Subscriptions
            </AntTitle>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {filtered.length} of {data.length} records
            </Text>
          </TableHeaderBar>
          <FilterRow>
            <Input
              prefix={<Search size={13} style={{ color: colors.textSecondary }} />}
              placeholder="Search business..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              allowClear
              style={{ width: 200, borderRadius: 8, fontSize: 13 }}
            />
            <Select
              placeholder="Status"
              allowClear
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
              style={{ width: 140 }}
            >
              <Option value="active">Active</Option>
              <Option value="trialing">Trialing</Option>
              <Option value="past_due">Past Due</Option>
              <Option value="canceled">Canceled</Option>
              <Option value="incomplete">Incomplete</Option>
            </Select>
          </FilterRow>
          <StyledTable
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            onRow={(record) => ({ onClick: () => openDrawer(record) })}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              size: "small",
              showTotal: (total) => `${total} subscription(s)`,
            }}
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <Empty
                  description="No widget subscriptions found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: "40px 0" }}
                />
              ),
            }}
          />
        </TableSection>

        {/* SUBSCRIPTION DETAIL DRAWER */}
        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(open) => { if (!open) setDrawerOpen(false); }}
          direction={isMobile ? undefined : "right"}
          dismissible
          handleOnly={!isMobile}
        >
          <Drawer.Portal>
            <DrawerOverlay />
            {isMobile ? (
              <MobileShell>
                <ThumbArea><DrawerHandle /></ThumbArea>
                {drawerContent}
              </MobileShell>
            ) : (
              <DesktopShell style={{ "--initial-transform": "calc(100% + 8px)" }}>
                {drawerContent}
              </DesktopShell>
            )}
          </Drawer.Portal>
        </Drawer.Root>
      </DashboardWrapper>
    </ConfigProvider>
  );
}
