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
  InputNumber,
  Modal,
  Space,
  Descriptions,
  ConfigProvider,
  Grid,
  Empty,
} from "antd";
import { AdminTableSkeleton, AdminDrawerContentSkeleton } from "../shared/AdminSkeletons";
import {
  DollarSign,
  RefreshCw,
  Download,
  Eye,
  ExternalLink,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Percent,
  CheckCircle,
  Clock,
  RotateCcw,
  Hash,
  Search,
  AlertTriangle,
} from "lucide-react";
import dayjs from "dayjs";
import { paymentService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import AdminMetricCards from "../shared/AdminMetricCards";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";

const { RangePicker } = DatePicker;
const { Text, Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

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

const hexToRgba = (hex, alpha = 1) => {
  if (!hex?.slice) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
  succeeded: "success",
  pending: "warning",
  failed: "error",
  refunded: "default",
  partially_refunded: "orange",
};

// --- LAYOUT ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: white;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ContentLayer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

// --- TABLE ---
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
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid ${colors.border};
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textSecondary};
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ant-table-tbody > tr > td {
    padding: 10px 14px;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${colors.lightBg};
`;

const DrawerBodyInner = styled.div`
  padding: 20px;
`;

const DrawerFooter = styled.div`
  padding: 14px 20px;
  border-top: 1px solid ${colors.border};
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-shrink: 0;
  background: white;
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  padding: 16px;
  margin-bottom: 12px;
`;

const InfoCardTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`;

const FeeBreakdownBar = styled.div`
  display: flex;
  height: 28px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: ${colors.border};
`;
const FeeSegment = styled.div`
  height: 100%;
  min-width: 2px;
  background: ${(p) => p.$color || colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
`;

const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid ${colors.border};
  &:last-child {
    border-bottom: none;
    font-weight: 700;
    color: ${colors.textPrimary};
    font-size: 14px;
    padding-top: 8px;
  }
`;

const CopyableId = styled.code`
  font-size: 11px;
  background: ${colors.lightBg};
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: ${colors.info};
  border: 1px solid ${colors.border};
  word-break: break-all;
  &:hover {
    background: ${hexToRgba(colors.info, 0.08)};
  }
`;

export default function PaymentManagement() {
  const router = useRouter();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingCount: 0,
    totalRefunded: 0,
    successfulCount: 0,
    platformRevenue: 0,
    stripeFees: 0,
    netPlatformProfit: 0,
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
    setStatsLoading(true);
    try {
      const statsParams =
        filters.start_date && filters.end_date
          ? { start_date: filters.start_date, end_date: filters.end_date }
          : { all_time: true };
      const res = await paymentService.getPaymentStats(statsParams);
      if (res.success && res.data) {
        const d = res.data;
        setStats({
          totalRevenue: d.total_revenue ?? d.revenue ?? 0,
          pendingCount: d.pending_count ?? d.pending_payments ?? d.pending ?? 0,
          totalRefunded: d.total_refunded ?? d.refunded_amount ?? 0,
          successfulCount: d.successful_transactions ?? d.successful_count ?? 0,
          platformRevenue: d.platform_revenue ?? d.platform_fees ?? 0,
          stripeFees: d.stripe_fees ?? 0,
          netPlatformProfit: d.net_platform_profit ?? d.platform_fees ?? 0,
        });
      }
    } finally {
      setStatsLoading(false);
    }
  }, [filters.start_date, filters.end_date]);

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

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleRefresh = () => {
    fetchStats();
    fetchPayments();
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
    } catch {
      // silently fail
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
    paymentService.processRefund(selectedPayment.id, {
      amount: refundAmount ?? undefined,
      reason: refundReason || "Admin refund",
    }).then((res) => {
      if (res.success) {
        setRefundModalOpen(false);
        setRefundAmount(null);
        setRefundReason("");
        handleRefresh();
        openDrawer(selectedPayment);
      } else {
        // Error handled silently
      }
    }).finally(() => setRefundSubmitting(false));
  };

  const handleMarkPaid = () => {
    if (!selectedPayment) return;
    paymentService.markAsPaid(selectedPayment.id).then((res) => {
      if (res.success) handleRefresh();
    });
  };

  const payment = selectedPayment;
  const refundableAmount =
    payment == null
      ? 0
      : Number(
          payment.available_refund_amount ??
            Math.max(
              0,
              Number(payment.amount ?? 0) - Number(payment.refunded_amount ?? 0)
            )
        );
  const canRefund =
    payment &&
    ["succeeded", "partially_refunded"].includes(payment.status) &&
    refundableAmount > 0.009;
  const canMarkPaid = payment?.status === "pending";

  const statCardsData = [
    { title: "Total Volume", value: stats.totalRevenue, icon: DollarSign, color: colors.info, isCurrency: true, footer: "All payments" },
    { title: "Successful", value: stats.successfulCount, icon: CheckCircle, color: colors.success, isCurrency: false, footer: "Transactions" },
    { title: "Pending", value: stats.pendingCount, icon: Clock, color: colors.warning, isCurrency: false, footer: "Awaiting" },
    { title: "Refunded", value: stats.totalRefunded, icon: RotateCcw, color: colors.error, isCurrency: true, footer: "Total refunds" },
    { title: "Platform Revenue", value: stats.platformRevenue, icon: TrendingUp, color: "#8b5cf6", isCurrency: true, footer: "ClassEasily commission (your revenue)" },
    { title: "Stripe Fees", value: stats.stripeFees, icon: CreditCard, color: colors.textSecondary, isCurrency: true, footer: "Passthrough — deducted from host payout, not platform revenue" },
    { title: "Net Platform Profit", value: stats.netPlatformProfit, icon: DollarSign, color: colors.success, isCurrency: true, footer: "Same as platform commission (Stripe is not our income)" },
  ];

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 110,
      render: (id, record) => (
        <a onClick={() => openDrawer(record)} style={{ color: colors.primary, fontWeight: 500 }}>
          #{String(id).slice(0, 8)}
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
      align: "right",
      render: (v) => <span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>,
    },
    {
      title: "Platform Fee",
      dataIndex: "platform_fee_amount",
      key: "platform_fee_amount",
      align: "right",
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
      render: (v) => (v ? dayjs(v).format("MMM D, YYYY") : "—"),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 80,
      render: (_, record) => (
        <Button size="small" icon={<Eye size={13} />} onClick={() => openDrawer(record)}>
          View
        </Button>
      ),
    },
  ];

  const renderDrawerContent = () => {
    if (detailLoading) {
      return (
        <DrawerBody>
          <DrawerBodyInner>
            <AdminDrawerContentSkeleton />
          </DrawerBodyInner>
        </DrawerBody>
      );
    }
    if (!payment) return null;

    const gross = payment.amount ?? 0;
    const platformFee = payment.platform_fee_amount ?? 0;
    const taxAmt = payment.tax_amount ?? 0;
    const storedStripe =
      payment.stripe_processing_fee != null && payment.stripe_processing_fee !== ""
        ? Number(payment.stripe_processing_fee)
        : null;
    const stripeFee =
      storedStripe != null && !Number.isNaN(storedStripe)
        ? storedStripe
        : Math.max(0, gross * 0.029 + 0.3);
    const netRaw =
      payment.net_payout_amount != null && payment.net_payout_amount !== ""
        ? Number(payment.net_payout_amount)
        : NaN;
    const net = !Number.isNaN(netRaw)
      ? netRaw
      : Math.max(0, gross - platformFee - stripeFee);
    const subtotalApprox = Math.max(0, gross - taxAmt);
    const feePctLabel =
      subtotalApprox > 0 && platformFee > 0
        ? ((platformFee / subtotalApprox) * 100).toFixed(1)
        : null;

    return (
      <>
        <DrawerBody>
          <DrawerBodyInner>
            <InfoCard>
              <InfoCardTitle>Payment Info</InfoCardTitle>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Stripe Payment Intent</div>
                <CopyableId
                  title="Click to copy"
                  onClick={() => { navigator.clipboard.writeText(payment.stripe_payment_intent_id ?? ""); }}
                >
                  {payment.stripe_payment_intent_id ?? "—"}
                </CopyableId>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>Status</div>
                  <Tag color={statusColors[payment.status] || "default"} style={{ marginTop: 4 }}>{payment.status}</Tag>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>Date</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{payment.created_at ? dayjs(payment.created_at).format("MMM D, YYYY HH:mm") : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>Method</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{payment.card_details?.display_name ?? "Card"}</div>
                </div>
              </div>
            </InfoCard>

            <InfoCard>
              <InfoCardTitle>Payout model</InfoCardTitle>
              <p style={{ margin: 0, fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                Marketplace default: partner tier commission (e.g. 12%) is ClassEasily revenue.
                Stripe card fees (~2.9% + 30¢ per charge) are estimated and deducted from the
                host&apos;s net payout — they are not taken from the platform commission.
              </p>
            </InfoCard>

            <InfoCard>
              <InfoCardTitle>Fee Breakdown</InfoCardTitle>
              {gross > 0 && (
                <FeeBreakdownBar>
                  <FeeSegment $color={colors.success} style={{ width: `${(net / gross) * 100}%` }} title={`Net: ${formatCurrency(net)}`}>
                    {((net / gross) * 100).toFixed(0)}%
                  </FeeSegment>
                  <FeeSegment $color={colors.warning} style={{ width: `${(platformFee / gross) * 100}%` }} title={`Platform: ${formatCurrency(platformFee)}`}>
                    {((platformFee / gross) * 100).toFixed(0)}%
                  </FeeSegment>
                  <FeeSegment $color={colors.error} style={{ width: `${(stripeFee / gross) * 100}%` }} title={`Stripe: ${formatCurrency(stripeFee)}`}>
                    {((stripeFee / gross) * 100).toFixed(0)}%
                  </FeeSegment>
                </FeeBreakdownBar>
              )}
              <FeeRow>
                <span style={{ color: colors.textSecondary }}>Gross Amount</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(gross)}</span>
              </FeeRow>
              <FeeRow>
                <span style={{ color: colors.textSecondary }}>
                  Platform commission{feePctLabel != null ? ` (~${feePctLabel}% of pre-tax)` : ""}
                </span>
                <span style={{ color: colors.error }}>- {formatCurrency(platformFee)}</span>
              </FeeRow>
              <FeeRow>
                <span style={{ color: colors.textSecondary }}>Stripe Processing</span>
                <span style={{ color: colors.error }}>- {formatCurrency(stripeFee)}</span>
              </FeeRow>
              <FeeRow>
                <span>Net Payout to Business</span>
                <span style={{ color: colors.success }}>{formatCurrency(net)}</span>
              </FeeRow>
            </InfoCard>

            {payment.refunded_amount != null && payment.refunded_amount > 0 && (
              <InfoCard>
                <InfoCardTitle>Refund History</InfoCardTitle>
                <FeeRow>
                  <span style={{ color: colors.textSecondary }}>Total Refunded</span>
                  <span style={{ color: colors.error, fontWeight: 600 }}>{formatCurrency(payment.refunded_amount)}</span>
                </FeeRow>
                {payment.available_refund_amount != null && (
                  <FeeRow>
                    <span style={{ color: colors.textSecondary }}>Remaining Refundable</span>
                    <span>{formatCurrency(payment.available_refund_amount)}</span>
                  </FeeRow>
                )}
              </InfoCard>
            )}

            {(payment.business_name || payment.user_email) && (
              <InfoCard>
                <InfoCardTitle>Linked Entities</InfoCardTitle>
                {payment.business_name && (
                  <FeeRow>
                    <span style={{ color: colors.textSecondary }}>Business</span>
                    <span style={{ fontWeight: 500 }}>{payment.business_name}</span>
                  </FeeRow>
                )}
                {payment.user_email && (
                  <FeeRow>
                    <span style={{ color: colors.textSecondary }}>User</span>
                    <span style={{ fontWeight: 500 }}>{payment.user_email}</span>
                  </FeeRow>
                )}
                {payment.booking_id && (
                  <div style={{ marginTop: 10 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<ExternalLink size={13} />}
                      onClick={() => router.push(`/admin/all-bookings?bookingId=${payment.booking_id}`)}
                      style={{ padding: 0 }}
                    >
                      View linked booking
                    </Button>
                  </div>
                )}
              </InfoCard>
            )}

            {payment.receipt_url && (
              <Button type="link" icon={<ExternalLink size={14} />} href={payment.receipt_url} target="_blank" style={{ padding: 0 }}>
                View Stripe receipt
              </Button>
            )}
          </DrawerBodyInner>
        </DrawerBody>

        {!detailLoading && payment && (
          <DrawerFooter>
            <Button onClick={handleMarkPaid} disabled={!canMarkPaid}>
              Mark as paid
            </Button>
            <Button
              type="primary"
              danger
              disabled={!canRefund}
              onClick={() => setRefundModalOpen(true)}
              icon={<RotateCcw size={14} />}
            >
              Process Refund
            </Button>
          </DrawerFooter>
        )}
      </>
    );
  };

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <ContentLayer>
          <DashboardHeader>
            <div>
              <PageTitle>Payment Management</PageTitle>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                Monitor and manage all platform payment transactions.
              </div>
            </div>
            <ActionRow>
              <Button icon={<RefreshCw size={14} />} onClick={handleRefresh} loading={statsLoading || loading} style={{ borderRadius: 8 }}>
                {!isMobile && "Refresh"}
              </Button>
              <Button icon={<Download size={14} />} onClick={handleExport} loading={exporting} style={{ borderRadius: 8 }}>
                {!isMobile && "Export"}
              </Button>
            </ActionRow>
          </DashboardHeader>

          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {filters.start_date && filters.end_date
                ? `Stats for ${filters.start_date} – ${filters.end_date} (apply filters to align list).`
                : "Stats are all-time. Use the date range below and Apply to filter the table."}
            </Text>
          </div>
          <AdminMetricCards
            cards={statCardsData.map((card) => ({
              ...card,
              minimumFractionDigits: card.isCurrency ? 0 : undefined,
              maximumFractionDigits: card.isCurrency ? 0 : undefined,
            }))}
            loading={statsLoading}
          />

          <TableSection>
            <TableHeader>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <TableTitle>
                    <CreditCard size={18} />
                    All Payments
                  </TableTitle>
                  <TableDescription>
                    Complete list of payments with filtering and search.
                  </TableDescription>
                </div>
                <Text style={{ fontSize: 12, color: colors.textSecondary, whiteSpace: "nowrap" }}>
                  {totalCount.toLocaleString()} records
                </Text>
              </div>
            </TableHeader>
            <FilterBar>
              <Input
                prefix={<Search size={13} />}
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                onPressEnter={fetchPayments}
                style={{ width: 200, borderRadius: 8 }}
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
              {isMobile ? (
                <MobileDateRangePicker
                  allowClear
                  value={
                    filters.start_date && filters.end_date
                      ? [dayjs(filters.start_date), dayjs(filters.end_date)]
                      : null
                  }
                  onChange={(dates) => {
                    setFilters((f) => ({
                      ...f,
                      start_date: dates?.[0]
                        ? dates[0].format("YYYY-MM-DD")
                        : undefined,
                      end_date: dates?.[1]
                        ? dates[1].format("YYYY-MM-DD")
                        : undefined,
                    }));
                  }}
                  format="MMM D, YYYY"
                />
              ) : (
                <RangePicker
                  value={
                    filters.start_date && filters.end_date
                      ? [dayjs(filters.start_date), dayjs(filters.end_date)]
                      : null
                  }
                  onChange={(dates) => {
                    setFilters((f) => ({
                      ...f,
                      start_date: dates?.[0]
                        ? dates[0].format("YYYY-MM-DD")
                        : undefined,
                      end_date: dates?.[1]
                        ? dates[1].format("YYYY-MM-DD")
                        : undefined,
                    }));
                  }}
                  style={{ borderRadius: 8 }}
                />
              )}
              <Button
                type="primary"
                onClick={() => {
                  fetchPayments();
                  fetchStats();
                }}
                style={{ borderRadius: 8 }}
              >
                Apply
              </Button>
            </FilterBar>
            {loading ? (
              <AdminTableSkeleton rows={8} />
            ) : (
            <StyledTable
              rowKey="id"
              columns={columns}
              dataSource={payments}
              pagination={{
                current: page,
                pageSize,
                total: totalCount,
                showSizeChanger: false,
                size: "small",
                onChange: (p, ps) => { setPage(p); setPageSize(ps || 10); },
              }}
              scroll={{ x: 900 }}
              locale={{ emptyText: <Empty description="No payments found." /> }}
            />
            )}
          </TableSection>
        </ContentLayer>

        <AdminResponsiveDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={`Payment Details${payment?.id ? ` #${String(payment.id).slice(0, 8)}` : ""}`}
          titleIcon={<CreditCard size={16} color={colors.primary} />}
          isMobile={isMobile}
          width="560px"
        >
          {renderDrawerContent()}
        </AdminResponsiveDrawer>

        <Modal
          title="Process Refund"
          open={refundModalOpen}
          onCancel={() => setRefundModalOpen(false)}
          onOk={handleRefund}
          confirmLoading={refundSubmitting}
          okText="Process Refund"
          okButtonProps={{ danger: true }}
          width={420}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Amount (leave empty for full refund)</label>
              <InputNumber
                style={{ width: "100%", marginTop: 4 }}
                min={0}
                step={0.01}
                value={refundAmount}
                onChange={setRefundAmount}
                placeholder={`Max: ${formatCurrency(payment?.available_refund_amount ?? payment?.amount)}`}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Reason</label>
              <Input.TextArea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund..."
                style={{ marginTop: 4 }}
              />
            </div>
          </Space>
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
}
