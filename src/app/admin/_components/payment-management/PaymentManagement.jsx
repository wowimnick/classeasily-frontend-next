"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  DatePicker,
  Tag,
  Typography,
  Spin,
  InputNumber,
  Modal,
  message,
  Space,
  Descriptions,
} from "antd";
import { DollarSign, RefreshCcw, Download, Eye, ExternalLink, X } from "lucide-react";
import { Drawer } from "vaul";
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import DashboardBreadcrumb from "@/app/business/dashboard/_components/DashboardBreadcrumb";
import { paymentService } from "@/services/adminDash";

const { RangePicker } = DatePicker;
const { Text } = Typography;

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
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 18px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
`;

const TableCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
`;

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const statusColors = {
  succeeded: "green",
  pending: "gold",
  failed: "red",
  refunded: "default",
  partially_refunded: "orange",
};

export default function PaymentManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingCount: 0,
    totalRefunded: 0,
    successfulCount: 0,
  });
  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    status: undefined,
    start_date: undefined,
    end_date: undefined,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    const res = await paymentService.getPaymentStats();
    if (res.success && res.data) {
      const d = res.data;
      setStats({
        totalRevenue: d.total_revenue ?? d.revenue ?? 0,
        pendingCount: d.pending_count ?? d.pending ?? 0,
        totalRefunded: d.total_refunded ?? d.refunded_amount ?? 0,
        successfulCount: d.successful_transactions ?? d.successful_count ?? 0,
      });
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      };
      const res = await paymentService.getPayments(params);
      if (res.success && res.data) {
        const data = res.data;
        const list = data.results ?? (Array.isArray(data) ? data : []);
        setPayments(list);
        setTotalCount(data.count ?? list.length);
      } else {
        setPayments([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefresh = () => {
    fetchStats();
    fetchPayments();
    if (selectedPayment) {
      paymentService.getPaymentDetails(selectedPayment.id).then((r) => {
        if (r.success && r.data) setSelectedPayment(r.data);
      });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      };
      await paymentService.exportPaymentsData(params);
      message.success("Export started");
    } catch {
      message.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const openDrawer = async (record) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setSelectedPayment(record);
    try {
      const res = await paymentService.getPaymentDetails(record.id);
      if (res.success && res.data) setSelectedPayment(res.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefund = () => {
    if (!selectedPayment) return;
    setRefundSubmitting(true);
    paymentService
      .processRefund(selectedPayment.id, {
        amount: refundAmount ?? undefined,
        reason: refundReason || "Admin refund",
      })
      .then((res) => {
        if (res.success) {
          message.success("Refund processed");
          setRefundModalOpen(false);
          setRefundAmount(null);
          setRefundReason("");
          handleRefresh();
        } else {
          message.error(res.error || "Refund failed");
        }
      })
      .finally(() => setRefundSubmitting(false));
  };

  const handleMarkPaid = () => {
    if (!selectedPayment) return;
    paymentService.markAsPaid(selectedPayment.id).then((res) => {
      if (res.success) {
        message.success("Payment marked as paid");
        handleRefresh();
      } else {
        message.error(res.error || "Failed");
      }
    });
  };

  const payment = selectedPayment;
  const canRefund =
    payment?.status === "succeeded" &&
    (payment?.refunded_amount == null || payment.refunded_amount < (payment.amount ?? 0));
  const canMarkPaid = payment?.status === "pending";

  const columns = [
    {
      title: "Payment ID",
      dataIndex: "id",
      key: "id",
      render: (id, record) => (
        <a onClick={() => openDrawer(record)} style={{ color: colors.primary }}>
          {String(id).slice(0, 12)}…
        </a>
      ),
    },
    {
      title: "Business",
      key: "business",
      render: (_, r) => r.business_name ?? r.booking?.business_name ?? "—",
    },
    {
      title: "User",
      key: "user",
      render: (_, r) => r.user_email ?? r.booking?.user_email ?? "—",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Platform Fee",
      dataIndex: "platform_fee_amount",
      key: "platform_fee_amount",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={statusColors[s] || "default"}>{String(s || "").replace(/_/g, " ")}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (v ? dayjs(v).format("MMM D, YYYY HH:mm") : "—"),
    },
  ];

  return (
    <DashboardWrapper>
      <DashboardBreadcrumb title="Payments" />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          Payment Management
        </h1>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          View and manage all platform payments.
        </Text>
      </div>

      <StatsGrid>
        <StatCard>
          <StatLabel>Total Revenue</StatLabel>
          <StatValue>{formatCurrency(stats.totalRevenue)}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Pending Payments</StatLabel>
          <StatValue><NumberFlow value={stats.pendingCount} /></StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Total Refunded</StatLabel>
          <StatValue>{formatCurrency(stats.totalRefunded)}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Successful Transactions</StatLabel>
          <StatValue><NumberFlow value={stats.successfulCount} /></StatValue>
        </StatCard>
      </StatsGrid>

      <FiltersRow>
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onPressEnter={fetchPayments}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Status"
          allowClear
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          style={{ width: 140 }}
        >
          <Select.Option value="succeeded">Succeeded</Select.Option>
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="failed">Failed</Select.Option>
          <Select.Option value="refunded">Refunded</Select.Option>
        </Select>
        <RangePicker
          onChange={(dates) => {
            setFilters((f) => ({
              ...f,
              start_date: dates?.[0] ? dates[0].format("YYYY-MM-DD") : undefined,
              end_date: dates?.[1] ? dates[1].format("YYYY-MM-DD") : undefined,
            }));
          }}
        />
        <Button type="primary" onClick={fetchPayments}>
          Apply
        </Button>
        <Button icon={<RefreshCcw size={14} />} onClick={handleRefresh}>
          Refresh
        </Button>
        <Button icon={<Download size={14} />} onClick={handleExport} loading={exporting}>
          Export CSV
        </Button>
      </FiltersRow>

      <TableCard>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={payments}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps || 10);
            },
          }}
          scroll={{ x: 900 }}
        />
      </TableCard>

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <Drawer.Content
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 520,
              right: 0,
              top: 0,
              bottom: 0,
              height: "100%",
            }}
          >
            <Drawer.Title style={{ padding: 20, borderBottom: `1px solid ${colors.border}` }}>
              Payment details
            </Drawer.Title>
            <Drawer.Close asChild>
              <button type="button" aria-label="Close" style={{ position: "absolute", right: 16, top: 20 }}>
                <X size={20} />
              </button>
            </Drawer.Close>
            <div style={{ padding: 20, overflowY: "auto" }}>
              {detailLoading ? (
                <Spin />
              ) : payment ? (
                <>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Payment ID">{payment.id}</Descriptions.Item>
                    <Descriptions.Item label="Stripe PI">
                      <code style={{ fontSize: 12 }}>{payment.stripe_payment_intent_id ?? "—"}</code>
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">{formatCurrency(payment.amount)}</Descriptions.Item>
                    <Descriptions.Item label="Platform Fee">
                      {formatCurrency(payment.platform_fee_amount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Net Payout">
                      {formatCurrency(payment.net_payout_amount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={statusColors[payment.status]}>{payment.status}</Tag>
                    </Descriptions.Item>
                    {payment.refunded_amount != null && (
                      <Descriptions.Item label="Refunded">
                        {formatCurrency(payment.refunded_amount)}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                  {payment.booking_id && (
                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="link"
                        icon={<ExternalLink size={14} />}
                        onClick={() => router.push(`/admin/all-bookings?id=${payment.booking_id}`)}
                      >
                        View booking
                      </Button>
                    </div>
                  )}
                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                    {canRefund && (
                      <Button type="primary" danger onClick={() => setRefundModalOpen(true)}>
                        Process refund
                      </Button>
                    )}
                    {canMarkPaid && (
                      <Button onClick={handleMarkPaid}>Mark as paid</Button>
                    )}
                  </div>
                </>
              ) : (
                <Text type="secondary">No payment selected</Text>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Modal
        title="Process refund"
        open={refundModalOpen}
        onCancel={() => setRefundModalOpen(false)}
        onOk={handleRefund}
        confirmLoading={refundSubmitting}
        okText="Refund"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <label>Amount (optional, leave empty for full refund)</label>
            <InputNumber
              style={{ width: "100%", marginTop: 4 }}
              min={0}
              step={0.01}
              value={refundAmount}
              onChange={setRefundAmount}
              placeholder="Full refund if empty"
            />
          </div>
          <div>
            <label>Reason</label>
            <Input.TextArea
              rows={2}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Refund reason"
            />
          </div>
        </Space>
      </Modal>
    </DashboardWrapper>
  );
}
