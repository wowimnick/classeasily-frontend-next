"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";

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
  Descriptions,
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
  Hash,
  BookOpen,
  Building,
  ExternalLink,
  Users,
  X,
  Play,
} from "lucide-react";
import { adminPayoutService } from "@/services/adminDash";
import { useAuth } from "@/lib/auth-client";
import { theme as appTheme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";
import AdminMetricCards from "../shared/AdminMetricCards";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import {
  AdminTableSkeleton,
  AdminDrawerContentSkeleton,
  AdminMetricCardsSkeleton,
  SkeletonBlock,
} from "../shared/AdminSkeletons";

dayjs.extend(utc);
const { Option } = Select;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Text, Title: AntTitle, Paragraph } = Typography;

// --- STYLING (MATCHING BOOKINGSLIST) ---
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
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0px); }
`;

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
  @media (max-width: 768px) {
    width: 100%;
  }
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
  @media (max-width: 768px) {
    flex: 1;
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
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const ManualPayoutButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  @media (max-width: 768px) {
    flex: 1;
  }
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

const DrawerHeader = styled.div`
  background: white;
  border-bottom: 1px solid ${colors.border};
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const DrawerHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${colors.textPrimary};
  font-size: 20px;
  font-weight: 600;
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

const DrawerContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
  padding: 24px;
  animation: ${fadeIn} 0.5s 0.1s ease-out both;
  border-radius: 0 0 16px 16px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;
const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 20px;
`;
const InfoGroupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  svg {
    width: 18px;
    height: 18px;
    color: ${colors.primary};
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 40px;
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

const StatusTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
`;

// --- UTILITY FUNCTIONS ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value ?? 0);
const formatDate = (dateString) =>
  dateString ? dayjs(dateString).format("MMM D, YYYY") : "N/A";
const formatDateTime = (dateString) =>
  dateString
    ? dayjs.utc(dateString).local().format("MMM D, YYYY h:mm A")
    : "N/A";

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

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          background: "white",
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Space align="start" size={16} wrap>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: hexToRgba(colors.info, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building size={28} color={colors.info} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <AntTitle level={4} style={{ margin: 0 }}>
              {payout.business_name}
            </AntTitle>
            <div style={{ marginTop: 6 }}>
              <Text strong style={{ fontSize: 22 }}>
                {formatCurrency(payout.amount)}
              </Text>
            </div>
            <div style={{ marginTop: 8 }}>{getPayoutStatusTag(payout.status)}</div>
            <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 13 }}>
              Initiated {formatDateTime(payout.created_at)}
              {payout.arrival_date
                ? ` · Expected arrival ${formatDate(payout.arrival_date)}`
                : ""}
            </Text>
          </div>
        </Space>
      </div>

      <InfoGroup>
        <InfoGroupTitle>
          <Hash /> Payout summary
        </InfoGroupTitle>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Stripe transfer ID">
            <Text copyable={{ text: payout.stripe_transfer_id }}>
              {payout.stripe_transfer_id || "—"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            {formatCurrency(payout.amount)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getPayoutStatusTag(payout.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Initiated">
            {formatDateTime(payout.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Expected arrival">
            {payout.arrival_date ? formatDate(payout.arrival_date) : "—"}
          </Descriptions.Item>
        </Descriptions>
      </InfoGroup>

      <InfoGroup>
        <InfoGroupTitle>
          <BookOpen /> Included bookings ({payout.bookings?.length || 0})
        </InfoGroupTitle>
        <Table
          columns={bookingColumns}
          dataSource={payout.bookings}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: isMobile ? 720 : "auto" }}
        />
      </InfoGroup>
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
    <DrawerContentContainer>
      <DrawerContent>
        {isLoading ? (
          <AdminDrawerContentSkeleton />
        ) : (
          <PayoutDetailContent payout={payout} isMobile={isMobile} />
        )}
      </DrawerContent>
    </DrawerContentContainer>
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
        footer={drawerFooter}
      >
        {renderDrawerContent()}
      </AdminResponsiveDrawer>
    </ConfigProvider>
  );
};

const MobilePayoutItem = ({ payout, onViewDetails }) => (
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
        }}
      >
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
          setPayouts(response.data.results);
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
        <Button icon={<Eye size={14} />} onClick={() => showPayoutDetails(r)}>
          Details
        </Button>
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
                description="Queues the same automated payout task as the nightly schedule. Workers process it in the background—refresh shortly to see updates."
                okText="Run now"
                cancelText="Cancel"
                onConfirm={handleTriggerManualPayout}
              >
                <ManualPayoutButton
                  type="primary"
                  icon={<Play size={16} />}
                  loading={manualPayoutTriggering}
                >
                  {!isMobile && "Run payout job"}
                </ManualPayoutButton>
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
                  />
                ))
              ) : (
                <Empty description="No payouts found with current filters." />
              )}
            </div>
          ) : loading ? (
            <AdminTableSkeleton rows={8} columns={7} />
          ) : (
            <StyledTable
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
