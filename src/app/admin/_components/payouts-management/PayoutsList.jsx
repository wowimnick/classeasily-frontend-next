"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import NumberFlow from "@number-flow/react";
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
  Skeleton,
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
  TrendingUp,
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
} from "lucide-react";
import { adminPayoutService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

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

// --- STATS CARDS (UPDATED TO MATCH BOOKINGSLIST) ---
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
    padding: 20px !important;
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

// --- VAUL DRAWER COMPONENTS ---
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
  width: 680px;
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
  background-color: ${colors.lightBg};
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
const PayoutDetailContent = ({ payout, isMobile, onRetry }) => {
  if (!payout)
    return (
      <Empty description="No payout selected" style={{ paddingTop: 100 }} />
    );

  const stripeTransferUrl = payout.stripe_transfer_id
    ? `https://dashboard.stripe.com/transfers/${payout.stripe_transfer_id}`
    : null;
  const bookingColumns = [
    { title: "Booking Ref", dataIndex: "user_facing_reference", key: "ref" },
    { title: "Class", dataIndex: "class_name", key: "class" },
    {
      title: "Net Amount",
      dataIndex: "net_amount",
      key: "net",
      render: (val) => formatCurrency(val),
    },
  ];

  return (
    <>
      <InfoGroup>
        <InfoGroupTitle>
          <Hash /> Payout Summary
        </InfoGroupTitle>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Business">
            {payout.business_name}
          </Descriptions.Item>
          <Descriptions.Item label="Payout Amount">
            {formatCurrency(payout.amount)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getPayoutStatusTag(payout.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Date Initiated">
            {formatDateTime(payout.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Arrival">
            {formatDate(payout.arrival_date)}
          </Descriptions.Item>
          <Descriptions.Item label="Stripe Transfer ID">
            <Text copyable>{payout.stripe_transfer_id}</Text>
          </Descriptions.Item>
        </Descriptions>
      </InfoGroup>

      <InfoGroup>
        <InfoGroupTitle>
          <BookOpen /> Included Bookings ({payout.bookings?.length || 0})
        </InfoGroupTitle>
        <Table
          columns={bookingColumns}
          dataSource={payout.bookings}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
          scroll={{ x: isMobile ? 350 : "auto" }}
        />
      </InfoGroup>

      <Space>
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
              Retry Payout
            </Button>
          </Popconfirm>
        )}
      </Space>
    </>
  );
};

const DetailDrawerModal = ({
  isVisible,
  onClose,
  payout,
  isLoading,
  isMobile,
  onRetry,
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerHeaderTitle>
          <Hash size={20} />
          <span>Payout: {payout?.id || "Details"}</span>
        </DrawerHeaderTitle>
        <CloseButton icon={<X size={20} />} onClick={onClose} />
      </DrawerHeader>
      <DrawerContentContainer>
        <DrawerContent>
          {isLoading ? (
            <LoaderWrapper>
              <GlobalLoaderWithoutInlineStyles />
            </LoaderWrapper>
          ) : (
            <PayoutDetailContent
              payout={payout}
              isMobile={isMobile}
              onRetry={onRetry}
            />
          )}
        </DrawerContent>
      </DrawerContentContainer>
    </>
  );

  return (
    <ConfigProvider theme={appTheme}>
      {isMobile ? (
        <Drawer.Root
          open={isVisible}
          onOpenChange={(open) => !open && onClose()}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              {renderDrawerContent()}
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Drawer.Root
          open={isVisible}
          onOpenChange={(open) => !open && onClose()}
          direction="right"
          dismissible
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <DesktopDrawerContent>
              <DesktopDrawerInner>{renderDrawerContent()}</DesktopDrawerInner>
            </DesktopDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      )}
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

const PayoutsList = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    total_paid_out: 0,
    payouts_pending: 0,
    payouts_failed: 0,
    businesses_paid_count: 0,
    average_payout_amount: 0,
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
    if (isDetailDrawerVisible && isMobile)
      document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDetailDrawerVisible, isMobile]);

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

  const showPayoutDetails = async (payout) => {
    if (isDetailDrawerVisible) return;
    setIsDetailDrawerVisible(true);
    setDetailsLoading(true);
    setSelectedPayout(payout);
    try {
      const response = await adminPayoutService.getPayoutDetails(payout.id);
      if (response.success) setSelectedPayout(response.data);
      else {
        message.error(response.error || "Failed to load payout details");
        setIsDetailDrawerVisible(false);
      }
    } catch (e) {
      message.error("Error fetching details");
      setIsDetailDrawerVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

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

  const handleRetryPayout = async (payoutId) => {
    message.loading({ content: "Retrying payout...", key: "retry_payout" });
    const response = await adminPayoutService.retryPayout(payoutId);
    if (response.success) {
      message.success({
        content: response.message || "Payout re-queued successfully!",
        key: "retry_payout",
        duration: 3,
      });
      setIsDetailDrawerVisible(false);
      refreshData();
    } else {
      message.error({
        content: response.error || "Failed to retry payout.",
        key: "retry_payout",
        duration: 3,
      });
    }
  };

  const statCardsData = [
    {
      title: "Total Paid Out",
      icon: DollarSign,
      value: dashboardStats.total_paid_out,
      color: colors.success,
      isCurrency: true,
    },
    {
      title: "Payouts Pending",
      icon: Clock,
      value: dashboardStats.payouts_pending,
      color: colors.warning,
    },
    {
      title: "Failed Payouts",
      icon: AlertCircle,
      value: dashboardStats.payouts_failed,
      color: colors.error,
    },
    {
      title: "Businesses Paid",
      icon: Building,
      value: dashboardStats.businesses_paid_count,
      color: colors.info,
    },
    {
      title: "Avg. Payout Amount",
      icon: TrendingUp,
      value: dashboardStats.average_payout_amount,
      color: "#8b5cf6",
      isCurrency: true,
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

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

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
                    {stat.isCurrency ? (
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value : 0}
                        duration={800}
                        prefix="$"
                        numberFormatOptions={{
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }}
                      />
                    ) : (
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value : 0}
                        duration={800}
                      />
                    )}
                  </StatValue>
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
              <RangePicker
                value={[filterParams.startDate, filterParams.endDate]}
                onChange={(dates) =>
                  handleFilterChange({
                    startDate: dates?.[0],
                    endDate: dates?.[1],
                  })
                }
                style={{ width: isMobile ? "100%" : "auto" }}
              />
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
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
          ) : (
            <StyledTable
              columns={columns}
              dataSource={payouts}
              rowKey="id"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
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
          isVisible={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
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
