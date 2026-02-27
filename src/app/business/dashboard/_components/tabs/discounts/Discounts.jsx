"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Skeleton,
  Divider,
  Card,
  Grid,
  Switch,
} from "antd";
import message from "@/lib/message";
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Calendar,
  Hash,
  Activity,
  Percent,
} from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import NumberFlow from "@number-flow/react";
import { businessDiscountService } from "@/services/apiService";
import DiscountsDrawer from "./DiscountsDrawer";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// #region --- STYLED COMPONENTS ---
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
const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 4px 0;
`;
const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
`;
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
  margin-bottom: 0;
  min-height: 140px;

  .ant-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    @media (max-width: 768px) {
      padding: 16px;
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
`;
const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  display: flex;
  align-items: baseline;
`;
const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;
const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  line-height: 1.4;
`;
const ActionButton = styled(Button)`
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
`;
const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  position: relative;
  overflow: hidden;
`;
const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
`;
const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0;
`;
const TableDescription = styled(Text)`
  font-size: 14px;
  color: ${colors.textSecondary};
`;
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: ${colors.lightBg};
    color: ${colors.textPrimary};
  }
`;
const EmptyStateContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;
const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

// #region --- NEW MOBILE DISCOUNT CARD STYLES ---

const MobileDiscountCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: white;
  margin-bottom: 12px;

  .ant-card-body {
    padding: 16px;
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${colors.border};
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DiscountName = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  line-height: 1.3;
`;

const DiscountCode = styled(Text)`
  font-family: "monospace";
  font-size: 13px;
  color: ${colors.primary};
  font-weight: 500;
`;

const MobileCardContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 12px;
  margin-bottom: 16px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetaValue = styled(Text)`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px; /* For status switch */
`;

const MobileCardFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const MobileActionButton = styled(Button)`
  height: 38px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

// #endregion

// --- SKELETON COMPONENTS ---
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

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MobileDiscountSkeleton = () => (
  <MobileDiscountCard>
    <MobileCardHeader>
      <HeaderInfo>
        <SkeletonLine width="150px" height="18px" />
        <SkeletonLine width="100px" height="14px" />
      </HeaderInfo>
      <SkeletonLine width="60px" height="22px" />
    </MobileCardHeader>
    <MobileCardContent>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Percent size={14} /> Discount
        </MetaLabel>
        <SkeletonLine width="70px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Activity size={14} /> Status
        </MetaLabel>
        <SkeletonLine width="90px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <BarChart3 size={14} /> Usage
        </MetaLabel>
        <SkeletonLine width="80px" />
      </MetaItem>
      <MetaItem>
        <MetaLabel style={{ opacity: 0.5 }}>
          <Calendar size={14} /> Validity
        </MetaLabel>
        <SkeletonLine width="100px" />
      </MetaItem>
    </MobileCardContent>
    <MobileCardFooter>
      <SkeletonLine height="38px" />
      <SkeletonLine height="38px" />
    </MobileCardFooter>
  </MobileDiscountCard>
);
// #endregion

// #region --- MAIN COMPONENT ---
const Discounts = ({ businessId }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const refreshButtonRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await businessDiscountService.getDiscounts({
        business_id: businessId,
      });
      setDiscounts(response.data || []);
    } catch (error) {
      message.error("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const refreshData = async () => {
    await fetchDiscounts();
    if (refreshButtonRef.current) refreshButtonRef.current.blur();
  };

  const showDrawer = (discount = null) => {
    setEditingDiscount(discount);
    setDrawerVisible(true);
  };

  const onDrawerClose = () => {
    setDrawerVisible(false);
    setTimeout(() => {
      setEditingDiscount(null);
    }, 300);
  };

  const handleDelete = async (id) => {
    try {
      await businessDiscountService.deleteDiscount(id);
      message.success("Discount deleted successfully!");
      await fetchDiscounts();
    } catch (error) {
      message.error("Failed to delete discount");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await businessDiscountService.toggleDiscountActive(id);
      message.success(
        `Discount ${!currentStatus ? "activated" : "deactivated"}`
      );
      await fetchDiscounts();
    } catch (error) {
      message.error("Failed to update discount status");
    }
  };

  const statisticCards = [
    {
      key: "total",
      title: "Total Discounts",
      value: discounts.length,
      icon: <Ticket size={18} />,
      background: `rgba(59, 130, 246, 0.1)`, // info
      color: colors.info,
      footer: "All created discounts",
    },
    {
      key: "active",
      title: "Active Offers",
      value: discounts.filter((d) => d.is_active).length,
      icon: <TrendingUp size={18} />,
      background: `rgba(16, 185, 129, 0.1)`, // success
      color: colors.success,
      footer: "Currently valid",
    },
    {
      key: "usage",
      title: "Total Usage",
      value: discounts.reduce((sum, d) => sum + (d.usage_count || 0), 0),
      icon: <BarChart3 size={18} />,
      background: `rgba(139, 92, 246, 0.1)`, // purple
      color: "#8b5cf6",
      footer: "All-time redemptions",
    },
  ];

  const generateSkeletonData = (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      key: `skeleton-${i}`,
      code: <SkeletonLine width="120px" />,
      name: <SkeletonLine width="180px" />,
      discount_type: <SkeletonLine width="100px" height="24px" />,
      validity: (
        <SkeletonWrapper>
          <SkeletonLine width="110px" height="12px" />
          <SkeletonLine width="110px" height="12px" />
        </SkeletonWrapper>
      ),
      usage: (
        <SkeletonWrapper>
          <SkeletonLine width="70px" height="14px" />
          <SkeletonLine width="80px" height="12px" />
        </SkeletonWrapper>
      ),
      is_active: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <SkeletonLine width="70px" height="24px" />
          <SkeletonLine width="40px" height="22px" />
        </div>
      ),
      actions: (
        <div style={{ display: "flex", gap: "8px" }}>
          <SkeletonLine width="32px" height="32px" />
          <SkeletonLine width="32px" height="32px" />
        </div>
      ),
    }));
  };

  const columns = [
    {
      title: "CODE",
      dataIndex: "code",
      key: "code",
      render: (text) =>
        React.isValidElement(text) ? (
          text
        ) : text ? (
          <Text
            strong
            style={{ fontFamily: "monospace", color: colors.primary }}
          >
            {text}
          </Text>
        ) : (
          <Tag>Automatic</Tag>
        ),
    },
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      render: (text) =>
        React.isValidElement(text) ? text : <Text strong>{text}</Text>,
    },
    {
      title: "TYPE",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (type, record) =>
        React.isValidElement(type) ? (
          type
        ) : type === "percentage" ? (
          <Tag color="blue">{record.value}% OFF</Tag>
        ) : (
          <Tag color="green">${record.value} OFF</Tag>
        ),
    },
    {
      title: "VALIDITY",
      key: "validity",
      dataIndex: "validity",
      render: (text, record) =>
        React.isValidElement(text) ? (
          text
        ) : !record.valid_from && !record.valid_to ? (
          <Text type="secondary">No expiry</Text>
        ) : (
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              From: {dayjs(record.valid_from).format("MMM D, YYYY")}
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Until: {dayjs(record.valid_to).format("MMM D, YYYY")}
            </Text>
          </Space>
        ),
    },
    {
      title: "USAGE",
      key: "usage",
      dataIndex: "usage",
      render: (text, record) =>
        React.isValidElement(text) ? (
          text
        ) : (
          <Space direction="vertical" size={0}>
            <Text strong>{record.usage_count || 0} times</Text>
            {record.usage_limit && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Limit: {record.usage_limit}
              </Text>
            )}
          </Space>
        ),
    },
    {
      title: "STATUS",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive, record) =>
        React.isValidElement(isActive) ? (
          isActive
        ) : (
          <Space>
            <Tag color={isActive ? "success" : "default"}>
              {isActive ? "Active" : "Inactive"}
            </Tag>
            <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
              <Switch
                size="small"
                checked={record.is_active}
                onChange={() => handleToggleActive(record.id, record.is_active)}
              />
            </Tooltip>
          </Space>
        ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      dataIndex: "actions",
      render: (text, record) =>
        React.isValidElement(text) ? (
          text
        ) : (
          <Space>
            <Tooltip title="Edit discount">
              <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={() => showDrawer(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this discount?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete discount">
                <Button type="text" danger icon={<Trash2 size={16} />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  // --- NEW MOBILE DISCOUNT ITEM COMPONENT ---
  const MobileDiscountItem = ({ record }) => (
    <MobileDiscountCard>
      <MobileCardHeader>
        <HeaderInfo>
          <DiscountName>{record.name}</DiscountName>
          <DiscountCode>{record.code || "AUTOMATIC"}</DiscountCode>
        </HeaderInfo>
        <Tag color={record.is_active ? "success" : "default"}>
          {record.is_active ? "Active" : "Inactive"}
        </Tag>
      </MobileCardHeader>

      <MobileCardContent>
        <MetaItem>
          <MetaLabel>
            <Percent size={14} /> Discount
          </MetaLabel>
          <MetaValue>
            {record.discount_type === "percentage"
              ? `${record.value}% OFF`
              : `$${record.value} OFF`}
          </MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel>
            <Activity size={14} /> Status
          </MetaLabel>
          <MetaValue>
            <Switch
              size="small"
              checked={record.is_active}
              onChange={() => handleToggleActive(record.id, record.is_active)}
            />
          </MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel>
            <BarChart3 size={14} /> Usage
          </MetaLabel>
          <MetaValue>
            {record.usage_count || 0}
            {record.usage_limit ? ` / ${record.usage_limit}` : " times"}
          </MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel>
            <Calendar size={14} /> Validity
          </MetaLabel>
          <MetaValue>
            {!record.valid_from && !record.valid_to
              ? "No expiry"
              : `${dayjs(record.valid_to).format("MMM D, YYYY")}`}
          </MetaValue>
        </MetaItem>
      </MobileCardContent>

      <MobileCardFooter>
        <MobileActionButton
          icon={<Edit size={16} />}
          onClick={() => showDrawer(record)}
        >
          Edit
        </MobileActionButton>
        <Popconfirm
          title="Delete this discount?"
          okText="Yes, Delete"
          cancelText="No"
          onConfirm={() => handleDelete(record.id)}
          placement="topRight"
        >
          <MobileActionButton danger icon={<Trash2 size={16} />}>
            Delete
          </MobileActionButton>
        </Popconfirm>
      </MobileCardFooter>
    </MobileDiscountCard>
  );

  return (
    <DashboardWrapper>
        <DashboardBreadcrumb title="Discounts" />
        <DashboardHeader>
          <div>
            <PageTitle>Discounts & Coupons</PageTitle>
            <HeaderSubtitle>
              Create and manage promotions to attract more guests.
            </HeaderSubtitle>
          </div>
          <Space>
            <ActionButton
              ref={refreshButtonRef}
              icon={<RefreshCw size={16} />}
              onClick={refreshData}
              loading={loading}
            >
              Refresh
            </ActionButton>
            <ActionButton
              type="primary"
              onClick={() => showDrawer()}
              icon={<Plus size={16} />}
            >
              Create Discount
            </ActionButton>
          </Space>
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          {statisticCards.map((stat) => (
            <StatCard key={stat.key}>
              {loading ? (
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
                      <NumberFlow
                        value={isReady ? stat.value : 0}
                        duration={800}
                      />
                    </StatValue>
                    {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                  </div>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection>
          <TableHeader>
            <TableTitle>Discount Management</TableTitle>
            <TableDescription>
              Manage your promotional offers and track their performance.
            </TableDescription>
          </TableHeader>
          {isMobile ? (
            <div style={{ padding: "0 16px 16px" }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <MobileDiscountSkeleton key={index} />
                ))
              ) : discounts.length > 0 ? (
                discounts.map((item) => (
                  <MobileDiscountItem key={item.id} record={item} />
                ))
              ) : (
                <EmptyStateContainer>
                  <Text>No discounts found. Create one to get started.</Text>
                </EmptyStateContainer>
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={loading ? generateSkeletonData(5) : discounts}
              rowKey={(record) => record.id || record.key}
              pagination={
                loading ? false : { pageSize: 10, showSizeChanger: true }
              }
              loading={false}
              locale={{
                emptyText: (
                  <EmptyStateContainer>
                    <Text>No discounts have been made yet.</Text>
                  </EmptyStateContainer>
                ),
              }}
            />
          )}
        </TableSection>

        <DiscountsDrawer
          visible={drawerVisible}
          onClose={onDrawerClose}
          editingDiscount={editingDiscount}
          onSuccess={fetchDiscounts}
          businessId={businessId}
          placement={isMobile ? "bottom" : "right"}
          width={isMobile ? "100%" : 520}
          height={isMobile ? "90%" : undefined}
        />
      </DashboardWrapper>
  );
};

export default Discounts;
