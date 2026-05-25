"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
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
  Popconfirm,
  message,
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
import { AdminCompactTable } from "../shared/AdminCompactTable";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import { adminColors as colors } from "../shared/adminColors";
import { hexToRgba, formatCurrency, formatAdminPaymentMethodDisplay, getAdminStripePaymentLinks } from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBarFlexStart,
} from "../shared/adminTableStyles";

const { RangePicker } = DatePicker;
const { Text, Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

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

const DrawerScrollInner = styled.div`
  padding: 20px;
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
  const [markPaidLoading, setMarkPaidLoading] = useState(false);

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

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;
    setMarkPaidLoading(true);
    try {
      const res = await paymentService.markAsPaid(selectedPayment.id);
      if (res.success) {
        message.success("Payment marked as paid");
        handleRefresh();
        openDrawer(selectedPayment);
      }
    } finally {
      setMarkPaidLoading(false);
    }
  };

  const copyPaymentIntentId = async (id) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      message.success("Copied!", 1.5);
    } catch {
      message.error("Could not copy");
    }
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
  const refundDisplayAmount = refundAmount ?? refundableAmount;
  const refundMethodLabel = payment ? (formatAdminPaymentMethodDisplay(payment) ?? "—") : "—";
  const refundCardLast4 =
    payment?.card_details?.last4 ??
    payment?.card_last4 ??
    payment?.payment_method_details?.card?.last4 ??
    null;

  const statCardsData = [
    { title: "Total Volume", value: stats.totalRevenue, icon: DollarSign, color: colors.info, isCurrency: true, footer: "All payments" },
    { title: "Successful", value: stats.successfulCount, icon: CheckCircle, color: colors.success, isCurrency: false, footer: "Transactions" },
    { title: "Pending", value: stats.pendingCount, icon: Clock, color: colors.warning, isCurrency: false, footer: "Awaiting" },
    { title: "Refunded", value: stats.totalRefunded, icon: RotateCcw, color: colors.error, isCurrency: true, footer: "Total refunds" },
    { title: "Platform Commission", value: stats.platformRevenue, icon: TrendingUp, color: "#8b5cf6", isCurrency: true, footer: "ClassEasily commission (your revenue)" },
    { title: "Stripe Fees", value: stats.stripeFees, icon: CreditCard, color: colors.textSecondary, isCurrency: true, footer: "Deducted from host payout" },
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
        <DrawerScrollInner>
          <AdminDrawerContentSkeleton />
        </DrawerScrollInner>
      );
    }
    if (!payment) return null;

    const gross = payment.amount ?? 0;
    const platformFee = payment.platform_fee_amount ?? 0;
    const platTax = Number(payment.platform_fee_tax ?? 0);
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
    return (
      <DrawerScrollInner>
        <InfoCard>
          <InfoCardTitle>Payment Info</InfoCardTitle>
          {(() => {
            const stripeLinks = getAdminStripePaymentLinks(payment);
            const methodLabel = formatAdminPaymentMethodDisplay(payment) ?? "—";
            return (
          <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Stripe Payment Intent</div>
            <CopyableId
              title="Click to copy"
              onClick={() => copyPaymentIntentId(payment.stripe_payment_intent_id ?? "")}
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
              <div style={{ fontWeight: 600, fontSize: 13 }}>{methodLabel}</div>
            </div>
          </div>
          {(stripeLinks.receiptUrl || stripeLinks.dashboardUrl) && (
            <div style={{ marginTop: 12 }}>
              {stripeLinks.receiptUrl ? (
                <Button type="link" icon={<ExternalLink size={14} />} href={stripeLinks.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ padding: 0 }}>
                  View customer receipt
                </Button>
              ) : (
                <Button type="link" icon={<ExternalLink size={14} />} href={stripeLinks.dashboardUrl} target="_blank" rel="noopener noreferrer" style={{ padding: 0 }}>
                  Open in Stripe Dashboard
                </Button>
              )}
            </div>
          )}
          </>
            );
          })()}
        </InfoCard>

        <InfoCard>
          <InfoCardTitle>Payout model</InfoCardTitle>
          <p style={{ margin: 0, fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
            Marketplace default: partner tier commission (e.g. 13%) is ClassEasily revenue.
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
            <span style={{ color: colors.textSecondary }}>Platform commission</span>
            <span style={{ color: colors.error }}>- {formatCurrency(platformFee)}</span>
          </FeeRow>
          {platTax > 0.009 && (
            <FeeRow>
              <span style={{ color: colors.textSecondary }}>Tax on platform fee (HST)</span>
              <span style={{ color: colors.error }}>- {formatCurrency(platTax)}</span>
            </FeeRow>
          )}
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

      </DrawerScrollInner>
    );
  };

  const paymentDrawerFooter =
    !detailLoading && payment ? (
      <>
        <Popconfirm
          title="Mark this payment as paid?"
          description="Use only when payment was received outside the normal flow."
          onConfirm={handleMarkPaid}
          okText="Mark as paid"
          cancelText="Cancel"
          disabled={!canMarkPaid}
        >
          <Button disabled={!canMarkPaid} loading={markPaidLoading}>
            Mark as paid
          </Button>
        </Popconfirm>
        <Button
          type="primary"
          danger
          disabled={!canRefund}
          onClick={() => setRefundModalOpen(true)}
          icon={<RotateCcw size={14} />}
        >
          Process Refund
        </Button>
      </>
    ) : null;

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
            <FilterBarFlexStart>
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
            </FilterBarFlexStart>
            {loading ? (
              <AdminTableSkeleton rows={8} />
            ) : (
            <AdminCompactTable
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
          dense
          footer={paymentDrawerFooter}
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
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div
              style={{
                background: colors.lightBg,
                borderRadius: 8,
                padding: "12px 14px",
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
                Refund summary
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: colors.textSecondary }}>Amount</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(refundDisplayAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: colors.textSecondary }}>Payment method</span>
                <span style={{ fontWeight: 500 }}>{refundMethodLabel}</span>
              </div>
              {refundCardLast4 ? (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: colors.textSecondary }}>Card</span>
                  <span style={{ fontWeight: 500 }}>•••• {refundCardLast4}</span>
                </div>
              ) : null}
            </div>
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
