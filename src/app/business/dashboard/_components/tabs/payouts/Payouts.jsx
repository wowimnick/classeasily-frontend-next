"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import {
  Card,
  Typography,
  Skeleton,
  Table,
  Tooltip,
  Button,
  Divider,
  Space,
  Grid,
  List,
  Tag,
  Alert,
} from "antd";
import message from "@/lib/message";
import {
  Landmark,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Box,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
  Info,
  Download,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import { businessService } from "@/services/apiService";
import { LordIcon } from "@/services/ReactUtils";
import { useDashboard } from "../../DashboardContext";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";

const { Title, Text, Paragraph, Link } = Typography;
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
};

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

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
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

const DrawerHandle = styled(Drawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: ${colors.lightBg};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: min(90vw, 800px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DesktopDrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const DesktopDrawerTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DesktopDrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: ${colors.lightBg};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
`;

const ExpandedRowWrapper = styled.div`
  background: white;
  padding: 16px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
  line-height: 1.25;
  letter-spacing: -0.3px;
  @media (max-width: 768px) {
    font-size: 21px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 14px;
  color: #6b7280;
  display: block;
  line-height: 1.5;
  margin: 0;
`;

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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 130px;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  .ant-card-body {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  @media (max-width: 768px) {
    min-height: 110px;
    .ant-card-body {
      padding: 14px 16px;
    }
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const IconContainer = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};
  flex-shrink: 0;
  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: baseline;
  line-height: 1.2;
  letter-spacing: -0.2px;

  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

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
  color: #111827;
  font-weight: 600;
  font-size: 14px !important;
  display: flex;
  align-items: center;
  gap: 7px;
  letter-spacing: -0.1px;

  svg {
    color: #d1d5db;
    width: 15px;
    height: 15px;
  }

  @media (max-width: 768px) {
    font-size: 14px !important;
  }
`;

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const formatPayoutStatusLabel = (status) => {
  if (!status || typeof status !== "string") return "Unknown";
  const s = status.toLowerCase();
  if (s === "scheduled") return "ESCROW";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 80px;
  justify-content: center;

  ${(props) => {
    switch (props.status?.toLowerCase()) {
      case "paid":
        return `
          background: rgba(16, 185, 129, 0.1);
          color: ${colors.success};
          border: 1px solid rgba(16, 185, 129, 0.2);
        `;
      case "pending":
        return `
          background: rgba(245, 158, 11, 0.1);
          color: ${colors.warning};
          border: 1px solid rgba(245, 158, 11, 0.2);
        `;
      case "scheduled":
        return `
          background: rgba(13, 148, 136, 0.1);
          color: #0d9488;
          border: 1px solid rgba(13, 148, 136, 0.25);
        `;
      case "in_transit":
        return `
          background: rgba(59, 130, 246, 0.1);
          color: ${colors.info};
          border: 1px solid rgba(59, 130, 246, 0.2);
        `;
      case "failed":
      case "canceled":
      case "cancelled":
        return `
          background: rgba(239, 68, 68, 0.1);
          color: ${colors.error};
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
      default:
        return `
          background: rgba(100, 116, 139, 0.1);
          color: ${colors.textSecondary};
          border: 1px solid rgba(100, 116, 139, 0.2);
        `;
    }
  }}
`;

const BookingCountTag = styled(StatusBadge)`
  background: rgba(59, 130, 246, 0.1);
  color: ${colors.info};
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);

    lord-icon {
      --lord-icon-primary: ${colors.primary};
      --lord-icon-secondary: ${colors.primary};
    }
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #f8fafc !important;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: #64748b;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 14px;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
  }

  .ant-table-expanded-row > td {
    padding: 0 !important;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 12px;
      font-size: 10px;
    }
    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }
`;

const ActionButtonStyled = styled(Button)`
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid ${colors.border};
  background: white;
  color: ${colors.textSecondary};
  font-size: 12px;
  font-weight: 500;

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    background: rgba(255, 56, 92, 0.05);
  }
`;

// Mobile Card Components
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
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

const MobileBookingItem = styled(List.Item)`
  padding: 12px 0 !important;
  .ant-list-item-meta-title {
    font-size: 14px !important;
    font-weight: 500;
    margin-bottom: 2px !important;
  }
  .ant-list-item-meta-description {
    font-size: 12px;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.$padding || "60px 20px"};
  text-align: center;
  gap: 16px;

  @media (max-width: 768px) {
    padding: ${(props) => props.$padding || "40px 16px"};
    gap: 12px;
  }

  @media (max-width: 480px) {
    padding: ${(props) => props.$padding || "30px 12px"};
    gap: 10px;
  }
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);

  lord-icon {
    width: 80px;
    height: 80px;
  }

  @media (max-width: 768px) {
    lord-icon {
      width: 64px;
      height: 64px;
    }
  }

  @media (max-width: 480px) {
    lord-icon {
      width: 48px;
      height: 48px;
    }
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;

  @media (max-width: 768px) {
    font-size: 12px;
    max-width: 250px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    max-width: 200px;
  }
`;

// --- SKELETONS ---

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 28px;
  border-radius: 20px;
  min-width: 80px;
`;

const MobilePayoutSkeleton = () => (
  <MobileCard>
    <Card.Meta
      description={
        <MobileCardHeader>
          <div>
            <SkeletonLine width="120px" height="20px" />
            <SkeletonLine
              width="150px"
              height="14px"
              style={{ marginTop: "8px" }}
            />
          </div>
          <SkeletonTag width="90px" />
        </MobileCardHeader>
      }
    />
    <MobileCardContent>
      <MobileCardRow>
        <SkeletonLine width="100px" height="14px" />
        <SkeletonLine width="30px" height="14px" />
      </MobileCardRow>
      <MobileCardRow>
        <SkeletonLine width="80px" height="14px" />
        <SkeletonLine width="130px" height="14px" />
      </MobileCardRow>
      <Space
        style={{
          width: "100%",
          justifyContent: "flex-end",
          marginTop: "8px",
        }}
      >
        <SkeletonLine width="90px" height="32px" />
        <SkeletonLine width="90px" height="32px" />
      </Space>
    </MobileCardContent>
  </MobileCard>
);

const BookingItemSkeleton = () => (
  <MobileBookingItem>
    <List.Item.Meta
      title={<SkeletonLine width="60%" />}
      description={<SkeletonLine width="40%" style={{ marginTop: "4px" }} />}
    />
    <SkeletonLine width="50px" />
  </MobileBookingItem>
);

// --- DRAWER COMPONENTS ---

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const DrawerSummary = styled.div`
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid ${colors.border};
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummaryLabel = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SummaryValue = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return <CheckCircle size={12} />;
    case "pending":
      return <Clock size={12} />;

    case "in_transit":
      return <Clock size={12} />;
    case "failed":
    case "canceled":
    case "cancelled":
      return <AlertCircle size={12} />;
    default:
      return null;

  }
};

const getStatusTag = (status) => {
  if (React.isValidElement(status)) return status;
  const label = formatPayoutStatusLabel(status);
  return (
    <StatusBadge status={status}>
      {getStatusIcon(status)}
      {label}
    </StatusBadge>
  );
};

const ExpandedPayoutDetails = ({ payout, isMobile }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: isMobile ? 8 : 10,
    total: 0,
  });

  const fetchBookingsForPayout = useCallback(
    async (page = 1, pageSize = isMobile ? 8 : 10) => {
      if (!payout?.id) return;
      setLoading(true);
      const result = await businessService.fetchPayoutBookings(payout.id, {
        page,
        page_size: pageSize,
      });
      if (result.success) {
        setBookings(result.data.results);
        setPagination((prev) => ({
          ...prev,
          total: result.data.count,
          current: page,
          pageSize,
        }));
      } else {
        message.error("Could not load bookings for this payout.");
      }
      setTimeout(() => setLoading(false), 300);
    },
    [payout?.id, isMobile]
  );

  useEffect(() => {
    fetchBookingsForPayout();
  }, [fetchBookingsForPayout]);

  const handleTableChange = (newPagination) => {
    fetchBookingsForPayout(newPagination.current, newPagination.pageSize);
  };

  const generateBookingSkeletonData = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      key: `skel-${i}`,
      user_facing_reference: <SkeletonLine width="80px" />,
      user_name: <SkeletonLine width="120px" />,
      class_name: <SkeletonLine width="150px" />,
      session_date: <SkeletonLine width="100px" />,
      net_amount_for_payout: <SkeletonLine width="60px" />,
    }));
  };

  const baseDesktopColumns = [
    {
      title: "BOOKING REFERENCE",
      dataIndex: "user_facing_reference",
      key: "ref",
      width: 120,
    },
    { title: "GUEST", dataIndex: "user_name", key: "user", ellipsis: true },
    {
      title: "EXPERIENCE",
      dataIndex: "class_name",
      key: "class",
      ellipsis: true,
    },
    {
      title: "SESSION DATE",
      dataIndex: "session_date",
      key: "date",
      width: 120,
      render: (text) => dayjs(text).format("MMM D, YYYY"),
    },
    {
      title: "NET PAYOUT",
      dataIndex: "net_amount_for_payout",
      key: "net",
      align: "right",
      width: 140,
      render: (val) => {
        const amount = Number(val).toFixed(2);
        return (
          <div style={{ textAlign: "right" }}>
            <Text strong style={{ color: colors.success }}>
              ${amount}
            </Text>
          </div>
        );
      },
    },
  ];

  const desktopColumns = baseDesktopColumns.map((col) => ({
    ...col,
    render: (text, record) => {
      if (React.isValidElement(record[col.dataIndex])) {
        return record[col.dataIndex];
      }
      return col.render ? col.render(text, record) : text;
    },
  }));

  const renderContent = () => {
    if (loading) {
      return isMobile ? (
        <List
          dataSource={Array.from({ length: 8 }, (_, i) => ({ key: i }))}
          renderItem={() => <BookingItemSkeleton />}
        />
      ) : (
        <StyledTable
          columns={desktopColumns}
          dataSource={generateBookingSkeletonData(10)}
          pagination={false}
          rowKey="key"
          size="small"
        />
      );
    }

    if (bookings.length === 0) {
      return (
        <EmptyStateContainer $padding="40px 20px">
          <EmptyStateIcon>
            <lord-icon
              src="https://cdn.lordicon.com/uoljexdg.json"
              trigger="in"
              colors="primary:#94a3b8"
            />
          </EmptyStateIcon>
          <EmptyStateText>No Bookings Found</EmptyStateText>
          <EmptyStateSubtext>
            This payout does not contain any bookings.
          </EmptyStateSubtext>
        </EmptyStateContainer>
      );
    }

    return isMobile ? (
      <List
        itemLayout="horizontal"
        dataSource={bookings}
        pagination={{ ...pagination, size: "small", align: "center" }}
        onChange={(page, pageSize) =>
          handleTableChange({ current: page, pageSize })
        }
        renderItem={(item) => (
          <MobileBookingItem>
            <List.Item.Meta
              title={item.class_name}
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.user_name} • {dayjs(item.session_date).format("MMM D")}
                </Text>
              }
            />
            <div style={{ textAlign: "right" }}>
              <Text
                strong
                style={{
                  color: colors.success,
                  fontSize: "14px",
                  display: "block",
                }}
              >
                ${Number(item.net_amount_for_payout).toFixed(2)}
              </Text>
            </div>
          </MobileBookingItem>
        )}
      />
    ) : (
      <StyledTable
        columns={desktopColumns}
        dataSource={bookings}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="user_facing_reference"
        size="small"
      />
    );
  };

  return (
    <DetailsContainer>
      <DrawerSummary>
        <SummaryItem>
          <SummaryLabel>
            <DollarSign size={14} /> Total Payout
          </SummaryLabel>
          <SummaryValue>{payout.amount_display}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>
            <Box size={14} /> Bookings Included
          </SummaryLabel>
          <SummaryValue>{payout.booking_count}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>
            <Clock size={14} /> Status
          </SummaryLabel>
          <SummaryValue>{getStatusTag(payout.status)}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>
            <Calendar size={14} /> Est. Arrival
          </SummaryLabel>
          <SummaryValue>
            {payout.arrival_date
              ? dayjs(payout.arrival_date).format("MMM D, YYYY")
              : "—"}
          </SummaryValue>
        </SummaryItem>
      </DrawerSummary>

      <ExpandedRowWrapper>{renderContent()}</ExpandedRowWrapper>
    </DetailsContainer>
  );
};

// Mobile Payout Item
const MobilePayoutItem = ({
  payout,
  onExport,
  onViewBookings,
  isScheduled = false,
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (isScheduled) return;
    setExporting(true);
    await onExport(payout.id);
    setExporting(false);
  };

  return (
    <MobileCard>
      <Card.Meta
        description={
          <MobileCardHeader>
            <div>
              <Text strong style={{ fontSize: "16px", display: "block" }}>
                {payout.amount_display}
              </Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Est. Arrival:{" "}
                {payout.arrival_date
                  ? dayjs(payout.arrival_date).format("MMM D, YYYY")
                  : "—"}
              </Text>
            </div>
            {getStatusTag(payout.status)}
          </MobileCardHeader>
        }
      />
      <MobileCardContent>
        <MobileCardRow>
          <MobileCardLabel>Bookings Included</MobileCardLabel>
          <Text strong>{payout.booking_count}</Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Transfer ID</MobileCardLabel>
          <Text
            style={{ fontSize: 12, maxWidth: 150 }}
            copyable={payout.stripe_transfer_id ? { text: payout.stripe_transfer_id } : false}
            ellipsis
          >
            {payout.stripe_transfer_id || "—"}
          </Text>
        </MobileCardRow>
        <Space
          style={{
            width: "100%",
            justifyContent: "flex-end",
            marginTop: "8px",
          }}
        >
          <ActionButtonStyled
            icon={<Download size={14} />}
            onClick={handleExport}
            loading={exporting}
            disabled={isScheduled}
          >
            Export
          </ActionButtonStyled>
          <ActionButtonStyled
            icon={<Box size={14} />}
            onClick={() => onViewBookings(payout)}
            disabled={payout.booking_count === 0}
          >
            Bookings
          </ActionButtonStyled>
        </Space>
      </MobileCardContent>
    </MobileCard>
  );
};

const Payouts = () => {
  const { openSettingsDrawer } = useDashboard();
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [scheduledPayouts, setScheduledPayouts] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [exportingId, setExportingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isDev, setIsDev] = useState(false);
  const refreshButtonRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      setIsDev(hostname.includes("localhost") || hostname.includes("dev"));
    }
  }, []);

  const showBookingsDrawer = (payout) => {
    setSelectedPayout(payout);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleDrawerOpenChange = (open) => {
    if (!open) {
      handleDrawerClose();
    }
  };

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    setIsReadyForAnimation(false);
    const result = await businessService.fetchPayoutSummary();
    if (result.success) {
      setSummary(result.data);
      setTimeout(() => setIsReadyForAnimation(true), 50);
    } else {
      message.error(result.error || "Failed to load summary.");
    }
    setLoadingSummary(false);
  }, []);

  const fetchPayouts = useCallback(async (page = 1, pageSize = 10) => {
    setLoadingPayouts(true);
    const params = { page, page_size: pageSize };
    const result = await businessService.fetchBusinessPayouts(params);
    if (result.success) {
      setPayouts(result.data.results || []);
      setScheduledPayouts(result.data.scheduled_payouts || []);
      setPagination((prev) => ({
        ...prev,
        total: result.data.count,
        current: page,
      }));
    } else {
      message.error(result.error || "Failed to load payout history.");
    }
    setTimeout(() => setLoadingPayouts(false), 300);
  }, []);

  const refreshData = useCallback(() => {
    fetchSummary();
    fetchPayouts(1, pagination.pageSize);
  }, [fetchSummary, fetchPayouts, pagination.pageSize]);

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportPayout = async (payoutId) => {
    setExportingId(payoutId);
    message.loading({
      content: "Generating your export...",
      key: `export-${payoutId}`,
      duration: 0,
    });

    const result = await businessService.exportPayoutDetails(payoutId);

    if (result.success) {
      message.success({
        content: "Payout report downloaded!",
        key: `export-${payoutId}`,
      });
    } else {
      message.error({
        content: result.error || "Export failed.",
        key: `export-${payoutId}`,
      });
    }
    setExportingId(null);
  };

  const handleTableChange = (newPagination) => {
    fetchPayouts(newPagination.current, newPagination.pageSize);
  };

  const handleButtonHover = useCallback((isEntering) => {
    const buttonNode = refreshButtonRef.current;
    if (!buttonNode) return;
    const icon = buttonNode.querySelector("lord-icon");
    if (!icon) return;
    try {
      if (isEntering) icon.playerInstance?.play();
      else {
        icon.playerInstance?.pause();
        icon.playerInstance?.goToFirstFrame();
      }
    } catch (error) {
      console.error("Lordicon animation failed:", error);
    }
  }, []);

  const isScheduledPayout = (record) =>
    record?.status === "scheduled" ||
    (record?.id && String(record.id).startsWith("scheduled-"));

  const displayPayouts =
    pagination.current === 1
      ? [...scheduledPayouts, ...payouts]
      : payouts;

  const getStripeUrl = (record, isDevEnv) => {
    const id = record.stripe_transfer_id;
    if (!id) return null;

    const stripeAccountId =
      record.stripe_account_id || summary?.stripe_account_id;
    const isTestMode = id.includes("_test_") || isDevEnv;

    const testPrefix = isTestMode ? "test/" : "";
    const base = "https://dashboard.stripe.com/";

    if (stripeAccountId) {
      return `${base}${testPrefix}connect/accounts/${stripeAccountId}/transfers/${id}`;
    }
    return `${base}${testPrefix}transfers/${id}`;
  };

  const generateSkeletonData = (count = 10) => {
    return Array.from({ length: count }, (_, i) => ({
      key: `skeleton-${i}`,
      arrival_date: <SkeletonLine width="120px" />,
      stripe_transfer_id: <SkeletonLine width="200px" />,
      amount_display: <SkeletonLine width="80px" />,
      status: <SkeletonTag width="90px" />,
      booking_count: <SkeletonTag width="90px" />,
      id: <SkeletonLine width="120px" height="32px" />,
    }));
  };

  const columns = [
    {
      title: "DATE (ESTIMATED ARRIVAL)",
      dataIndex: "arrival_date",
      key: "arrival_date",
      width: 180,
      render: (text) =>
        React.isValidElement(text) ? (
          text
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text>{text ? dayjs(text).format("MMM D, YYYY") : "N/A"}</Text>
          </div>
        ),
    },
    {
      title: "STRIPE TRANSFER ID",
      dataIndex: "stripe_transfer_id",
      key: "stripe_transfer_id",
      ellipsis: true,
      responsive: ["lg"],
      render: (id, record) => {
        if (React.isValidElement(id)) return id;
        const stripeUrl = getStripeUrl(record, isDev);
        if (!id) return <Text type="secondary">N/A</Text>;
        return (
          <Tooltip title={id}>
            <Link href={stripeUrl} target="_blank" rel="noopener noreferrer">
              {id}{" "}
              <ExternalLink
                size={12}
                style={{ marginLeft: 4, color: colors.info }}
              />
            </Link>
          </Tooltip>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "amount_display",
      key: "amount",
      align: "right",
      width: 140,
      render: (text) =>
        React.isValidElement(text) ? (
          text
        ) : (
          <Text strong style={{ fontSize: "15px", color: colors.textPrimary }}>
            {text}
          </Text>
        ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 120,
      render: getStatusTag,
    },
    {
      title: "BOOKINGS",
      dataIndex: "booking_count",
      key: "booking_count",
      align: "center",
      width: 120,
      render: (count) =>
        React.isValidElement(count) ? (
          count
        ) : (
          <BookingCountTag>
            <Box size={12} />
            {count}
          </BookingCountTag>
        ),
    },
    {
      title: "ACTIONS",
      dataIndex: "id",
      key: "actions",
      width: screens.lg ? 240 : 140,
      align: "center",
      render: (id, record) => {
        if (React.isValidElement(id)) return id;
        const isSmallDesktop = !screens.lg;
        const scheduled = isScheduledPayout(record);
        return (
          <Space>
            <Tooltip
              title={
                scheduled
                  ? "Export available after payout is processed"
                  : isSmallDesktop
                    ? "Export"
                    : ""
              }
            >
              <span>
                <ActionButtonStyled
                  icon={<Download size={14} />}
                  onClick={() => !scheduled && handleExportPayout(id)}
                  loading={exportingId === id}
                  disabled={scheduled}
                >
                  {!isSmallDesktop && "Export"}
                </ActionButtonStyled>
              </span>
            </Tooltip>
            <Tooltip title={isSmallDesktop ? "Bookings" : ""}>
              <ActionButtonStyled
                icon={<Box size={14} />}
                onClick={() => showBookingsDrawer(record)}
                disabled={record.booking_count === 0}
              >
                {!isSmallDesktop && "Bookings"}
              </ActionButtonStyled>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  const statisticCards = [
    {
      key: "pending_payout",
      title: "Pending Balance",
      value: summary?.pending_payout_amount,
      icon: <Wallet size={20} />,
      color: colors.info,
      background: "rgba(59, 130, 246, 0.1)",
      suffix: summary?.currency,
      footer: "Funds held for all future experiences.",
    },
    {
      key: "next_payout",
      title: "Payout Schedule",
      value: "Daily",
      icon: <Clock size={20} />,
      color: colors.warning,
      background: "rgba(245, 158, 11, 0.1)",
      isText: true,
      tooltip:
        "Payouts for completed bookings are processed daily. Funds typically arrive in your bank account in 1-3 business days.",
      footer: "Payouts are processed daily.",
    },
    {
      key: "last_payout",
      title: "Last Payout",
      value: summary?.last_payout_amount,
      icon: <TrendingUp size={20} />,
      color: colors.success,
      background: "rgba(16, 185, 129, 0.1)",
      suffix: summary?.currency,
      footer: "Most recent successful payout.",
    },
    {
      key: "payout_status",
      title: "Payouts Status",
      value: summary?.stripe_account_status
        ? formatPayoutStatusLabel(summary.stripe_account_status)
        : "Not Connected",
      icon: summary?.payouts_enabled ? (
        <CheckCircle size={20} />
      ) : (
        <AlertCircle size={20} />
      ),
      color: summary?.payouts_enabled ? colors.success : colors.error,
      background: summary?.payouts_enabled
        ? "rgba(16, 185, 129, 0.1)"
        : "rgba(239, 68, 68, 0.1)",
      isText: true,
      footer: "Your account's payout eligibility.",
    },
  ];

  return (
    <DashboardWrapper>
        <DashboardBreadcrumb title="Payouts" />
        <DashboardHeader>
          <div>
            <PageTitle>Payouts</PageTitle>
            <HeaderSubtitle>
              Track your earnings and payout history.
            </HeaderSubtitle>
          </div>
          <RefreshButton
            ref={refreshButtonRef}
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            icon={
              <LordIcon
                src="https://cdn.lordicon.com/valwmkhs.json"
                colors="primary:#94a3b8,secondary:#94a3b8"
                size="15px"
                trigger="hover"
                playOnLoad={false}
              />
            }
            onClick={refreshData}
            loading={loadingSummary || loadingPayouts}
          >
            Refresh Data
          </RefreshButton>
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          {statisticCards.map((stat) => (
            <StatCard key={stat.key}>
              {loadingSummary ? (
                <StatSkeleton />
              ) : (
                <>
                  <div>
                    <StatCardHeader>
                      <IconContainer
                        background={stat.background}
                        color={stat.color}
                      >
                        {stat.icon}
                      </IconContainer>
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <div>
                    <StatValue>
                      <Tooltip title={stat.tooltip}>
                        <span
                          style={{
                            fontSize: isMobile ? "18px" : "22px",
                            textTransform: stat.isText ? "capitalize" : "none",
                          }}
                        >
                          {stat.isText ? (
                            stat.value
                          ) : (
                            <NumberFlow
                              value={
                                isReadyForAnimation
                                  ? parseFloat(stat.value) || 0
                                  : 0
                              }
                              duration={800}
                              prefix="$"
                              numberFormatOptions={{
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }}
                            />
                          )}
                        </span>
                      </Tooltip>
                    </StatValue>
                    {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                    {stat.key === "payout_status" &&
                      !loadingSummary &&
                      !summary?.payouts_enabled && (
                      <div style={{ marginTop: 12 }}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<Settings size={14} />}
                          onClick={() =>
                            openSettingsDrawer("preferences", "payout-setup-section")
                          }
                        >
                          Set up in Settings
                        </Button>
                      </div>
                    )}
                  </div>
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
              <Landmark size={15} color="#d1d5db" />
              Payout History
            </TableTitle>
            <TableDescription>
              A record of all past payouts to your connected account.
            </TableDescription>
          </TableHeader>
          {isMobile ? (
            <div style={{ padding: "16px" }}>
              {loadingPayouts ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <MobilePayoutSkeleton key={index} />
                ))
              ) : displayPayouts.length > 0 ? (
                displayPayouts.map((payout) => (
                  <MobilePayoutItem
                    key={payout.id}
                    payout={payout}
                    onExport={handleExportPayout}
                    onViewBookings={showBookingsDrawer}
                    isScheduled={isScheduledPayout(payout)}
                  />
                ))
              ) : (
                <EmptyStateContainer>
                  <EmptyStateIcon>
                    <lord-icon
                      src="https://cdn.lordicon.com/vmztfafm.json"
                      trigger="in"
                      colors="primary:#94a3b8"
                    />
                  </EmptyStateIcon>
                  <EmptyStateText>No Payouts Found</EmptyStateText>
                  <EmptyStateSubtext>
                    No payouts have been made yet. Payouts are made 24h after an
                    experience ends.
                  </EmptyStateSubtext>
                </EmptyStateContainer>
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={
                loadingPayouts
                  ? generateSkeletonData(pagination.pageSize)
                  : displayPayouts
              }
              loading={false}
              pagination={
                loadingPayouts
                  ? false
                  : {
                      ...pagination,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} payouts`,
                    }
              }
              onChange={handleTableChange}
              rowKey={(record) => record.key || record.id}
              locale={{
                emptyText: (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/vmztfafm.json"
                        trigger="in"
                        colors="primary:#94a3b8"
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Payouts Found</EmptyStateText>
                    <EmptyStateSubtext>
                      No payouts have been made yet. Payouts are made 24h after
                      an experience ends.
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                ),
              }}
            />
          )}
        </TableSection>
        <Drawer.Root
          open={isDrawerOpen}
          onOpenChange={handleDrawerOpenChange}
          direction={isMobile ? "bottom" : "right"}
          dismissible
          handleOnly={!isMobile}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            {isMobile ? (
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle>
                    <Box size={15} style={{ color: "#d1d5db" }} />
                    {selectedPayout &&
                      `Bookings in Payout (${dayjs(
                        selectedPayout?.arrival_date
                      ).format("MMM D, YYYY")})`}
                  </DrawerTitle>
                </DrawerHeader>
                <DrawerBody>
                  {selectedPayout && (
                    <ExpandedPayoutDetails
                      payout={selectedPayout}
                      isMobile={isMobile}
                    />
                  )}
                </DrawerBody>
              </StyledDrawerContent>
            ) : (
              <DesktopDrawerContent>
                <DrawerHandle />
                <DesktopDrawerHeader>
                  <DesktopDrawerTitle>
                    <Box size={15} style={{ color: "#d1d5db" }} />
                    {selectedPayout &&
                      `Bookings in Payout (${dayjs(
                        selectedPayout?.arrival_date
                      ).format("MMM D, YYYY")})`}
                  </DesktopDrawerTitle>
                </DesktopDrawerHeader>
                <DesktopDrawerBody>
                  {selectedPayout && (
                    <ExpandedPayoutDetails
                      payout={selectedPayout}
                      isMobile={isMobile}
                    />
                  )}
                </DesktopDrawerBody>
              </DesktopDrawerContent>
            )}
          </Drawer.Portal>
        </Drawer.Root>
      </DashboardWrapper>
  );
};

export default Payouts;
