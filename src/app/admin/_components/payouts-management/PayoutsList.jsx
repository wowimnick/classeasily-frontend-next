"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styled from "styled-components";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  ConfigProvider,
  Grid,
  Empty,
  DatePicker,
  Divider,
  Tooltip,
  Tag,
  Typography,
  Popconfirm,
  message,
  Space,
  List,
} from "antd";
import {
  DollarSign,
  RefreshCcw,
  Download,
  BarChart2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Repeat,
  Eye,
  Building,
  ExternalLink,
  X,
  Play,
} from "lucide-react";
import { adminPayoutService } from "@/services/adminDash";
import { useAuth } from "@/lib/auth-client";
import { theme as appTheme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";
import AdminMetricCards from "../shared/AdminMetricCards";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { AdminCompactTable } from "../shared/AdminCompactTable";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import {
  AdminTableSkeleton,
  AdminDrawerContentSkeleton,
  AdminMetricCardsSkeleton,
  SkeletonBlock,
} from "../shared/AdminSkeletons";
import { adminColors as colors } from "../shared/adminColors";
import {
  hexToRgba,
  formatCurrency,
  formatDate,
  formatDatetime as formatDateTime,
} from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBar,
  SearchFilterContainer,
} from "../shared/adminTableStyles";
import {
  ActionButtonsContainer,
  RefreshButton,
  ExportButton,
} from "../shared/AdminButtons";
import {
  MobileCard,
  MobileCardContent,
  MobileCardRow,
  MobileCardLabel,
} from "../shared/adminMobileStyles";

dayjs.extend(utc);
const { Option } = Select;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Text, Title: AntTitle, Paragraph } = Typography;

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

// --- TABLE SECTION ---
const DetailDrawerScroll = styled.div`
  padding: 16px;
`;

const PayoutHero = styled.div`
  border-radius: 14px;
  border: 1px solid ${colors.border};
  overflow: hidden;
  margin-bottom: 14px;
  background: white;
`;

const PayoutHeroAccent = styled.div`
  height: 4px;
  background: linear-gradient(
    90deg,
    ${colors.primary} 0%,
    ${hexToRgba(colors.info, 0.85)} 55%,
    ${colors.success} 100%
  );
`;

const PayoutHeroBody = styled.div`
  padding: 16px 18px;
  background: linear-gradient(
    165deg,
    ${hexToRgba(colors.primary, 0.06)} 0%,
    #ffffff 52%
  );
`;

const DetailCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  padding: 16px;
  margin-bottom: 12px;
`;

const DetailCardTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 9px 0;
  font-size: 13px;
  border-bottom: 1px solid ${colors.border};
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const MetaStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 12px;
  font-size: 12px;
  color: ${colors.textSecondary};
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 40px;
`;

const StatusTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
`;

const getPayoutStatusTag = (status) => {
  const statusMap = {
    paid: { color: "green", icon: <CheckCircle size={12} />, text: "Paid" },
    pending: { color: "gold", icon: <Clock size={12} />, text: "Pending" },
    in_transit: {
      color: "blue",
      icon: <RefreshCcw size={12} />,
      text: "In Transit",
    },
    failed: { color: "red", icon: <AlertCircle size={12} />, text: "Failed" },
    cancelled: {
      color: "default",
      icon: <XCircle size={12} />,
      text: "Cancelled",
    },
  };
  const config = statusMap[status?.toLowerCase()] || {
    color: "default",
    text: status || "Unknown",
  };
  return (
    <StatusTag color={config.color} icon={config.icon}>
      {config.text}
    </StatusTag>
  );
};

// --- DETAIL DRAWER ---
const PayoutDetailContent = ({ payout, isMobile }) => {
  if (!payout)
    return (
      <Empty description="No payout selected" style={{ paddingTop: 100 }} />
    );

  const bookingColumns = [
    {
      title: "Reference",
      dataIndex: "user_facing_reference",
      key: "ref",
      ellipsis: true,
    },
    {
      title: "Class",
      dataIndex: "class_name",
      key: "class",
      ellipsis: true,
    },
    {
      title: "Booker",
      dataIndex: "booker_name",
      key: "booker",
      ellipsis: true,
    },
    {
      title: "Date",
      key: "session_date",
      width: 120,
      render: (_, row) =>
        formatDate(row.session_date || row.booking_date),
    },
    {
      title: "Net",
      dataIndex: "net_amount",
      key: "net",
      width: 100,
      align: "right",
      render: (val) => formatCurrency(val),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, row) => (
        <Button
          type="link"
          size="small"
          href={`/admin/all-bookings?bookingId=${row.id}`}
          style={{ padding: 0 }}
        >
          View booking
        </Button>
      ),
    },
  ];

  const bookingCount = payout.bookings?.length ?? 0;
  const netRollup = Array.isArray(payout.bookings)
    ? payout.bookings.reduce((sum, b) => sum + Number(b?.net_amount ?? 0), 0)
    : 0;

  return (
    <>
      <PayoutHero>
        <PayoutHeroAccent />
        <PayoutHeroBody>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: hexToRgba(colors.primary, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Building size={24} color={colors.primary} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                Business payout
              </Text>
              <AntTitle level={4} style={{ margin: "4px 0 0", fontWeight: 700 }}>
                {payout.business_name || "—"}
              </AntTitle>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatCurrency(payout.amount)}
                </span>
                {getPayoutStatusTag(payout.status)}
              </div>
              <MetaStrip>
                <span>
                  <strong style={{ color: colors.textPrimary }}>Initiated</strong> ·{" "}
                  {formatDateTime(payout.created_at)}
                </span>
                <span>
                  <strong style={{ color: colors.textPrimary }}>Arrival</strong> ·{" "}
                  {payout.arrival_date ? formatDate(payout.arrival_date) : "—"}
                </span>
                <span>
                  <strong style={{ color: colors.textPrimary }}>Line items</strong> · {bookingCount}{" "}
                  booking{bookingCount !== 1 ? "s" : ""}
                </span>
              </MetaStrip>
            </div>
          </div>
        </PayoutHeroBody>
      </PayoutHero>

      <DetailCard>
        <DetailCardTitle>Transfer & timing</DetailCardTitle>
        <SummaryRow>
          <span style={{ color: colors.textSecondary }}>Stripe transfer ID</span>
          <Text
            copyable={
              payout.stripe_transfer_id ? { text: payout.stripe_transfer_id } : undefined
            }
            style={{ maxWidth: "62%", textAlign: "right", wordBreak: "break-all" }}
          >
            {payout.stripe_transfer_id || "—"}
          </Text>
        </SummaryRow>
        <SummaryRow>
          <span style={{ color: colors.textSecondary }}>Payout amount</span>
          <Text strong>{formatCurrency(payout.amount)}</Text>
        </SummaryRow>
        <SummaryRow>
          <span style={{ color: colors.textSecondary }}>Lifecycle status</span>
          <span>{getPayoutStatusTag(payout.status)}</span>
        </SummaryRow>
        {bookingCount > 0 && (
          <SummaryRow>
            <span style={{ color: colors.textSecondary }}>Sum of booking nets (table)</span>
            <Text>{formatCurrency(netRollup)}</Text>
          </SummaryRow>
        )}
      </DetailCard>

      <DetailCard style={{ padding: 12 }}>
        <DetailCardTitle style={{ paddingLeft: 4, marginBottom: 10 }}>
          Included bookings ({bookingCount})
        </DetailCardTitle>
        <Table
          columns={bookingColumns}
          dataSource={payout.bookings}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: isMobile ? 720 : "auto" }}
        />
      </DetailCard>
    </>
  );
};

const DetailDrawerModal = ({ open, onClose, payout, isLoading, isMobile, onRetry }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  const renderDrawerContent = () => (
    <DetailDrawerScroll>
      {isLoading ? (
        <AdminDrawerContentSkeleton />
      ) : (
        <PayoutDetailContent payout={payout} isMobile={isMobile} />
      )}
    </DetailDrawerScroll>
  );

  const hasPayout = payout && !isLoading;
  const drawerTitle = hasPayout
    ? `${formatCurrency(payout.amount)} · ${payout.business_name || "Payout"}`
    : `Payout${payout?.id ? ` #${payout.id}` : ""}`;

  const stripeTransferUrl =
    hasPayout && payout.stripe_transfer_id
      ? `https://dashboard.stripe.com/transfers/${payout.stripe_transfer_id}`
      : null;

  const drawerFooter =
    hasPayout && (stripeTransferUrl || payout.status === "failed") ? (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {stripeTransferUrl && (
          <Button
            icon={<ExternalLink size={14} />}
            href={stripeTransferUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Stripe
          </Button>
        )}
        {payout.status === "failed" && (
          <Popconfirm
            title="Retry this payout?"
            description="This will re-queue the payout for the next automatic run."
            onConfirm={() => onRetry(payout.id)}
            okText="Yes, Retry"
            cancelText="Cancel"
          >
            <Button danger icon={<Repeat size={14} />}>
              Retry payout
            </Button>
          </Popconfirm>
        )}
      </div>
    ) : null;

  return (
    <ConfigProvider theme={appTheme}>
      <AdminResponsiveDrawer
        open={open}
        onClose={onClose}
        title={drawerTitle}
        titleIcon={<DollarSign size={18} />}
        isMobile={isMobile}
        width="min(760px, 96vw)"
        dense
        footer={drawerFooter}
      >
        {renderDrawerContent()}
      </AdminResponsiveDrawer>
    </ConfigProvider>
  );
};

const MobilePayoutItem = ({ payout, onViewDetails, onRetry, retryingId }) => (
  <MobileCard>
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
          <Text strong style={{ fontSize: "14px" }}>
            {payout.business_name}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {formatDateTime(payout.created_at)}
          </Text>
        </Space>
        {getPayoutStatusTag(payout.status)}
      </div>
      <MobileCardRow>
        <MobileCardLabel>Amount</MobileCardLabel>
        <Text strong style={{ fontSize: "16px", color: colors.success }}>
          {formatCurrency(payout.amount)}
        </Text>
      </MobileCardRow>
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {payout.status === "failed" && (
          <Popconfirm
            title="Retry this failed payout?"
            description="Re-queues the payout for the next automatic run."
            onConfirm={() => onRetry(payout.id)}
            okText="Yes, retry"
            cancelText="Cancel"
          >
            <Button
              danger
              icon={<Repeat size={14} />}
              loading={retryingId === payout.id}
              block
            >
              Retry payout
            </Button>
          </Popconfirm>
        )}
        <Button
          type="primary"
          size="middle"
          icon={<Eye size={14} />}
          onClick={() => onViewDetails(payout)}
          block
        >
          View Details
        </Button>
      </div>
    </MobileCardContent>
  </MobileCard>
);

const TRIGGER_MANUAL_PAYOUT_PERM = "quickstart.trigger_manual_payout";

const PayoutsList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const payoutDeepLinkLastIdRef = useRef("");

  const { user } = useAuth();
  const canTriggerManualPayout = (user?.permissions || []).includes(
    TRIGGER_MANUAL_PAYOUT_PERM
  );

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [manualPayoutTriggering, setManualPayoutTriggering] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    total_paid_out: 0,
    payouts_pending: 0,
    payouts_failed: 0,
    businesses_paid_count: 0,
  });

  const [filterParams, setFilterParams] = useState({
    status: "all",
    search: "",
    startDate: dayjs().subtract(29, "day"),
    endDate: dayjs(),
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const abortControllerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (detailDrawerOpen && isMobile)
      document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [detailDrawerOpen, isMobile]);

  const handleFilterChange = (updates) => {
    setFilterParams((prev) => ({ ...prev, ...updates }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const fetchPayouts = useCallback(
    async (currentFilters, currentPagination) => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      try {
        const apiParams = {
          page: currentPagination.current,
          page_size: currentPagination.pageSize,
          search: currentFilters.search,
          status:
            currentFilters.status === "all" ? undefined : currentFilters.status,
          start_date: currentFilters.startDate?.format("YYYY-MM-DD"),
          end_date: currentFilters.endDate?.format("YYYY-MM-DD"),
        };
        const response = await adminPayoutService.getPayouts(apiParams, {
          signal,
        });
        if (response.success && response.data) {
          setPayouts(response.data.results || []);
          setPagination((prev) => ({ ...prev, total: response.data.count }));
        } else if (!signal.aborted) {
          message.error(response.error || "Failed to load payouts");
        }
      } catch (error) {
        if (error.name !== "AbortError")
          message.error("An error occurred while fetching payouts");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    []
  );

  const fetchDashboardStats = useCallback(async (currentFilters) => {
    setStatsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const params = {
        start_date: currentFilters.startDate?.format("YYYY-MM-DD"),
        end_date: currentFilters.endDate?.format("YYYY-MM-DD"),
      };
      const response = await adminPayoutService.getPayoutAnalytics(params);
      if (response.success && response.data) {
        setDashboardStats(response.data);
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else message.error(response.error || "Failed to load statistics");
    } catch (error) {
      message.error("An error occurred while fetching dashboard data");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPayouts(filterParams, pagination);
      fetchDashboardStats(filterParams);
    }, 300);
    return () => clearTimeout(handler);
  }, [
    filterParams,
    pagination.current,
    pagination.pageSize,
    fetchPayouts,
    fetchDashboardStats,
  ]);

  const handleTableChange = (p) => setPagination(p);

  const refreshData = () => {
    fetchPayouts(filterParams, { ...pagination, current: 1 });
    fetchDashboardStats(filterParams);
  };

  const showPayoutDetails = useCallback(async (payout) => {
    if (!payout?.id) return;
    setDetailDrawerOpen(true);
    setDetailsLoading(true);
    setSelectedPayout(payout);
    try {
      const response = await adminPayoutService.getPayoutDetails(payout.id);
      if (response.success) setSelectedPayout(response.data);
      else {
        message.error(response.error || "Failed to load payout details");
        setDetailDrawerOpen(false);
      }
    } catch (e) {
      message.error("Error fetching details");
      setDetailDrawerOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    const rawId = searchParams.get("payout");
    if (!rawId) {
      payoutDeepLinkLastIdRef.current = "";
      return;
    }
    if (payoutDeepLinkLastIdRef.current === rawId) return;
    const payoutId = parseInt(rawId, 10);
    if (Number.isNaN(payoutId)) return;
    payoutDeepLinkLastIdRef.current = rawId;
    showPayoutDetails({ id: payoutId });
    router.replace(pathname || "/admin/payouts", { scroll: false });
  }, [searchParams, router, pathname, showPayoutDetails]);

  const handleExportData = async () => {
    message.loading({ content: "Preparing export...", key: "export" });
    const response = await adminPayoutService.exportPayouts(filterParams);
    if (!response.success)
      message.error({
        content: response.error || "Export failed",
        key: "export",
        duration: 2,
      });
    else
      message.success({
        content: "Export started!",
        key: "export",
        duration: 2,
      });
  };

  const handleTriggerManualPayout = async () => {
    setManualPayoutTriggering(true);
    message.loading({ content: "Queueing payout run...", key: "manual_payout" });
    try {
      const response = await adminPayoutService.triggerManualPayout();
      if (response.success) {
        message.success({
          content:
            response.message ||
            response.data?.message ||
            "Payout run queued. Results appear after the worker processes the job.",
          key: "manual_payout",
          duration: 4,
        });
      } else {
        message.error({
          content: response.error || "Failed to trigger payout run.",
          key: "manual_payout",
          duration: 4,
        });
      }
    } catch {
      message.error({
        content: "Failed to trigger payout run.",
        key: "manual_payout",
        duration: 4,
      });
    } finally {
      setManualPayoutTriggering(false);
    }
  };

  const handleRetryPayout = async (payoutId) => {
    setRetryingId(payoutId);
    message.loading({ content: "Retrying payout...", key: "retry_payout" });
    const response = await adminPayoutService.retryFailedPayout(payoutId);
    if (response.success) {
      message.success({
        content:
          response.data?.message || response.message || "Payout re-queued successfully!",
        key: "retry_payout",
        duration: 3,
      });
      setDetailDrawerOpen(false);
      refreshData();
    } else {
      message.error({
        content: response.error || "Failed to retry payout.",
        key: "retry_payout",
        duration: 3,
      });
    }
    setRetryingId(null);
  };

  const statsPeriodBadge =
    filterParams.startDate && filterParams.endDate
      ? `${filterParams.startDate.format("MMM D")} – ${filterParams.endDate.format("MMM D, YYYY")}`
      : "Period";

  const statCardsData = [
    {
      title: "Total Paid Out",
      icon: DollarSign,
      value: dashboardStats.total_paid_out,
      color: colors.success,
      isCurrency: true,
      periodBadge: statsPeriodBadge,
    },
    {
      title: "Payouts Pending",
      icon: Clock,
      value: dashboardStats.payouts_pending,
      color: colors.warning,
      periodBadge: statsPeriodBadge,
    },
    {
      title: "Failed Payouts",
      icon: AlertCircle,
      value: dashboardStats.payouts_failed,
      color: colors.error,
      periodBadge: statsPeriodBadge,
    },
    {
      title: "Businesses Paid",
      icon: Building,
      value: dashboardStats.businesses_paid_count,
      color: colors.info,
      periodBadge: statsPeriodBadge,
    },
  ];

  const columns = [
    {
      title: "Business",
      dataIndex: "business_name",
      key: "business",
      fixed: "left",
      width: 250,
    },
    {
      title: "Stripe Transfer ID",
      dataIndex: "stripe_transfer_id",
      key: "stripe_id",
      width: 250,
      render: (id) => (
        <Space>
          <Text copyable={{ text: id }}>{id}</Text>
          <Tooltip title="View on Stripe">
            <a
              href={`https://dashboard.stripe.com/transfers/${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} style={{ color: colors.info }} />
            </a>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 120,
      render: (val) => formatCurrency(val),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: getPayoutStatusTag,
    },
    {
      title: "Date Initiated",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: formatDateTime,
    },
    {
      title: "Expected Arrival",
      dataIndex: "arrival_date",
      key: "arrival_date",
      width: 150,
      render: formatDate,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      align: "center",
      render: (_, r) => (
        <Space size={4}>
          {r.status === "failed" && (
            <Popconfirm
              title="Retry this failed payout?"
              description="Re-queues the payout for the next automatic run."
              onConfirm={() => handleRetryPayout(r.id)}
              okText="Yes, retry"
              cancelText="Cancel"
            >
              <Button
                size="small"
                danger
                icon={<Repeat size={14} />}
                loading={retryingId === r.id}
              >
                Retry
              </Button>
            </Popconfirm>
          )}
          <Button icon={<Eye size={14} />} onClick={() => showPayoutDetails(r)}>
            Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Payout Management</PageTitle>
            <HeaderSubtitle>
              Monitor, analyze, and manage all business payouts.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            {canTriggerManualPayout && (
              <Popconfirm
                title="Run payout job now?"
                description={
                  <span>
                    <strong>Warning:</strong> This immediately queues a live payout run for all eligible
                    businesses. Funds will be transferred via Stripe. Only proceed if you intend to
                    process payouts outside the nightly schedule.
                  </span>
                }
                okText="Yes, run now"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onConfirm={handleTriggerManualPayout}
              >
                <ExportButton
                  type="primary"
                  icon={<Play size={16} />}
                  loading={manualPayoutTriggering}
                >
                  {!isMobile && "Run payout job"}
                </ExportButton>
              </Popconfirm>
            )}
            <ExportButton
              icon={<Download size={16} />}
              onClick={handleExportData}
            >
              {!isMobile && "Export Data"}
            </ExportButton>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                />
              }
              onClick={refreshData}
              loading={statsLoading || loading}
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
              marginBottom: "8px",
            }}
          >
            <BarChart2 size={20} color={colors.primary} /> Period Overview
          </Text>
          <Text
            style={{
              fontSize: isMobile ? "13px" : "15px",
              color: colors.textSecondary,
              display: "block",
              marginBottom: "16px",
            }}
          >
            Key payout metrics for the selected date range.{" "}
            <Text strong>
              {filterParams.startDate?.format("MMM D, YYYY")} -{" "}
              {filterParams.endDate?.format("MMM D, YYYY")}
            </Text>
          </Text>
        </div>

        {statsLoading ? (
          <AdminMetricCardsSkeleton count={statCardsData.length} />
        ) : (
          <AdminMetricCards
            cards={statCardsData.map((card) => ({
              ...card,
              minimumFractionDigits: card.isCurrency ? 2 : undefined,
              maximumFractionDigits: card.isCurrency ? 2 : undefined,
            }))}
            isReadyForAnimation={isReadyForAnimation}
          />
        )}

        <Divider />

        <TableSection
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <DollarSign /> All Payouts
            </TableTitle>
            <TableDescription>
              Complete list of payouts with filtering and search capabilities.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                ref={searchInputRef}
                placeholder="Search business, transfer ID..."
                allowClear
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
              />
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 180 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="paid">Paid</Option>
                <Option value="pending">Pending</Option>
                <Option value="in_transit">In Transit</Option>
                <Option value="failed">Failed</Option>
              </Select>
              {isMobile ? (
                <MobileDateRangePicker
                  allowClear
                  value={
                    filterParams.startDate && filterParams.endDate
                      ? [filterParams.startDate, filterParams.endDate]
                      : null
                  }
                  onChange={(dates) =>
                    handleFilterChange({
                      startDate: dates?.[0] ?? null,
                      endDate: dates?.[1] ?? null,
                    })
                  }
                  format="MMM D, YYYY"
                />
              ) : (
                <RangePicker
                  value={[filterParams.startDate, filterParams.endDate]}
                  onChange={(dates) =>
                    handleFilterChange({
                      startDate: dates?.[0],
                      endDate: dates?.[1],
                    })
                  }
                  style={{ width: "auto" }}
                />
              )}
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <AdminTableSkeleton rows={5} />
              ) : payouts.length > 0 ? (
                payouts.map((payout) => (
                  <MobilePayoutItem
                    key={payout.id}
                    payout={payout}
                    onViewDetails={showPayoutDetails}
                    onRetry={handleRetryPayout}
                    retryingId={retryingId}
                  />
                ))
              ) : (
                <Empty description="No payouts found with current filters." />
              )}
            </div>
          ) : loading ? (
            <AdminTableSkeleton rows={8} columns={7} />
          ) : (
            <AdminCompactTable
              columns={columns}
              dataSource={payouts}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} payouts`,
              }}
              onChange={handleTableChange}
              scroll={{ x: 1400 }}
              locale={{
                emptyText: (
                  <Empty description="No payouts found with current filters." />
                ),
              }}
            />
          )}
        </TableSection>

        <DetailDrawerModal
          open={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          payout={selectedPayout}
          isLoading={detailsLoading}
          isMobile={isMobile}
          onRetry={handleRetryPayout}
        />
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default PayoutsList;
