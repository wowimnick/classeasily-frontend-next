"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Statistic,
  Row,
  Col,
  Empty,
  Skeleton,
  Divider,
  Grid,
  Tooltip,
  message as antMessage,
} from "antd";
import { Plus, Edit, Trash2, BarChart3, Ticket, TrendingUp, Percent, Calendar, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { globalDiscountAdminService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { ConfigProvider } from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const message = antMessage;

// --- Colors (match business dashboard)
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

// --- Styled components (match business dashboard tabs)
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  min-height: 100%;

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

  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
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
  background: ${(p) => p.background || "#f1f5f9"};
  color: ${(p) => p.color || colors.textSecondary};

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

  @media (max-width: 768px) {
    padding: 16px;
  }
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
    font-weight: 600;
  }
  .ant-table-cell {
    padding: 12px 16px;
  }
`;

const EmptyStateContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

// --- Mobile card styles
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
  min-width: 0;
`;

const DiscountName = styled(Text)`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  line-height: 1.3;
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
`;

const MobileCardFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
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

// Stats modal styling
const StatsModalContent = styled.div`
  padding: 8px 0;
`;

const StatsCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 12px;

  .ant-card-body {
    padding: 16px;
  }
`;

export default function GlobalDiscountsManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const res = await globalDiscountAdminService.list();
    setLoading(false);
    if (res.success) {
      const data = res.data?.results ?? res.data;
      setList(Array.isArray(data) ? data : []);
    } else {
      message.error(res.error || "Failed to load global discounts");
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      discount_type: record.discount_type,
      value: record.value,
      is_active: record.is_active,
      valid_from: record.valid_from ? dayjs(record.valid_from) : null,
      valid_to: record.valid_to ? dayjs(record.valid_to) : null,
      usage_limit: record.usage_limit ?? undefined,
      min_purchase_amount: record.min_purchase_amount ?? undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        discount_type: values.discount_type,
        value: Number(values.value),
        is_active: values.is_active ?? true,
        valid_from: values.valid_from ? values.valid_from.toISOString() : null,
        valid_to: values.valid_to ? values.valid_to.toISOString() : null,
        usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
        min_purchase_amount: values.min_purchase_amount
          ? Number(values.min_purchase_amount)
          : null,
      };
      if (editingId) {
        const res = await globalDiscountAdminService.update(editingId, payload);
        if (res.success) {
          message.success("Global discount updated.");
          setModalOpen(false);
          fetchList();
        } else {
          message.error(res.error?.name?.[0] || res.error || "Update failed");
        }
      } else {
        const res = await globalDiscountAdminService.create(payload);
        if (res.success) {
          message.success("Global discount created.");
          setModalOpen(false);
          fetchList();
        } else {
          message.error(res.error?.name?.[0] || res.error || "Create failed");
        }
      }
    } catch (e) {
      if (e.errorFields) return;
      message.error("Please fix the form errors.");
    }
  };

  const handleDelete = async (id) => {
    const res = await globalDiscountAdminService.delete(id);
    if (res.success) {
      message.success("Global discount deleted.");
      fetchList();
    } else {
      message.error(res.error || "Delete failed");
    }
  };

  const openStats = async (record) => {
    setStatsModalOpen(true);
    setStatsData(null);
    setStatsLoading(true);
    const res = await globalDiscountAdminService.getStats(record.id);
    setStatsLoading(false);
    if (res.success) {
      setStatsData({ ...res.data, name: record.name });
    } else {
      message.error(res.error || "Failed to load stats");
    }
  };

  // Stats for header
  const totalDiscounts = list.length;
  const activeCount = list.filter((d) => d.is_active).length;
  const totalUsage = list.reduce((sum, d) => sum + (d.usage_count || 0), 0);

  const statisticCards = [
    {
      key: "total",
      title: "Total discounts",
      value: totalDiscounts,
      icon: <Ticket size={18} />,
      background: "rgba(59, 130, 246, 0.1)",
      color: colors.info,
      footer: "Platform-wide offers",
    },
    {
      key: "active",
      title: "Active",
      value: activeCount,
      icon: <TrendingUp size={18} />,
      background: "rgba(16, 185, 129, 0.1)",
      color: colors.success,
      footer: "Currently valid",
    },
    {
      key: "usage",
      title: "Total redemptions",
      value: totalUsage,
      icon: <BarChart3 size={18} />,
      background: "rgba(139, 92, 246, 0.1)",
      color: "#8b5cf6",
      footer: "All-time usage",
    },
  ];

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, r) => (
        <Space>
          <Text strong>{name}</Text>
          {r.is_active && <Tag color="green">Active</Tag>}
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (t) => (t === "percentage" ? "Percentage" : "Fixed amount"),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (val, r) =>
        r.discount_type === "percentage" ? `${Number(val)}%` : `$${Number(val)}`,
    },
    {
      title: "Valid",
      key: "valid",
      render: (_, r) => {
        const from = r.valid_from ? dayjs(r.valid_from).format("MMM D, YYYY") : "—";
        const to = r.valid_to ? dayjs(r.valid_to).format("MMM D, YYYY") : "—";
        return (
          <Text type="secondary">
            {from} → {to}
          </Text>
        );
      },
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, r) => (
        <Text>
          {r.usage_count}
          {r.usage_limit != null ? ` / ${r.usage_limit}` : ""}
        </Text>
      ),
    },
    {
      title: "Min purchase",
      dataIndex: "min_purchase_amount",
      key: "min_purchase_amount",
      render: (v) => (v != null ? `$${Number(v)}` : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="View stats">
            <Button
              type="text"
              size="small"
              icon={<BarChart3 size={16} />}
              onClick={() => openStats(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<Edit size={16} />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this global discount?"
            description="This cannot be undone. Existing applied discounts will remain in history."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<Trash2 size={16} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const formatValidRange = (r) => {
    const from = r.valid_from ? dayjs(r.valid_from).format("MMM D, YYYY") : "—";
    const to = r.valid_to ? dayjs(r.valid_to).format("MMM D, YYYY") : "—";
    return `${from} → ${to}`;
  };

  const MobileDiscountItem = ({ record }) => (
    <MobileDiscountCard>
      <MobileCardHeader>
        <HeaderInfo>
          <DiscountName>{record.name}</DiscountName>
          <Tag color={record.is_active ? "success" : "default"}>
            {record.is_active ? "Active" : "Inactive"}
          </Tag>
        </HeaderInfo>
      </MobileCardHeader>
      <MobileCardContent>
        <MetaItem>
          <MetaLabel><Percent size={14} /> Type</MetaLabel>
          <MetaValue>
            {record.discount_type === "percentage" ? "Percentage" : "Fixed amount"}
          </MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel><DollarSign size={14} /> Value</MetaLabel>
          <MetaValue>
            {record.discount_type === "percentage"
              ? `${Number(record.value)}%`
              : `$${Number(record.value)}`}
          </MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel><Calendar size={14} /> Valid</MetaLabel>
          <MetaValue>{formatValidRange(record)}</MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel><BarChart3 size={14} /> Usage</MetaLabel>
          <MetaValue>
            {record.usage_count}
            {record.usage_limit != null ? ` / ${record.usage_limit}` : ""}
          </MetaValue>
        </MetaItem>
      </MobileCardContent>
      <MobileCardFooter>
        <MobileActionButton
          icon={<BarChart3 size={16} />}
          onClick={() => openStats(record)}
        >
          Stats
        </MobileActionButton>
        <MobileActionButton
          icon={<Edit size={16} />}
          onClick={() => openEdit(record)}
        >
          Edit
        </MobileActionButton>
        <Popconfirm
          title="Delete this global discount?"
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          placement="top"
        >
          <MobileActionButton danger icon={<Trash2 size={16} />}>
            Delete
          </MobileActionButton>
        </Popconfirm>
      </MobileCardFooter>
    </MobileDiscountCard>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Global Discounts</PageTitle>
            <HeaderSubtitle>
              Create and manage platform-wide discounts applied at checkout.
            </HeaderSubtitle>
          </div>
          <ActionButton type="primary" icon={<Plus size={18} />} onClick={openCreate}>
            Create global discount
          </ActionButton>
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
                      <IconContainer background={stat.background} color={stat.color}>
                        {stat.icon}
                      </IconContainer>
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <div>
                    <StatValue>
                      <NumberFlow value={isReady ? stat.value : 0} duration={800} />
                    </StatValue>
                    {stat.footer && <StatFooter>{stat.footer}</StatFooter>}
                  </div>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TableHeader>
            <TableTitle>Discount management</TableTitle>
            <TableDescription>
              Edit, view stats, or remove global discounts. These apply across the platform when conditions are met.
            </TableDescription>
          </TableHeader>
          {isMobile ? (
            <div style={{ padding: "0 16px 16px" }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <MobileDiscountCard key={i}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </MobileDiscountCard>
                ))
              ) : list.length > 0 ? (
                list.map((item) => <MobileDiscountItem key={item.id} record={item} />)
              ) : (
                <EmptyStateContainer>
                  <Empty description="No global discounts" />
                </EmptyStateContainer>
              )}
            </div>
          ) : (
            <StyledTable
              rowKey="id"
              columns={columns}
              dataSource={list}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              loading={loading}
              locale={{ emptyText: <EmptyStateContainer><Empty description="No global discounts" /></EmptyStateContainer> }}
            />
          )}
        </TableSection>

        <Modal
          title={editingId ? "Edit global discount" : "Create global discount"}
          open={modalOpen}
          onOk={handleSubmit}
          onCancel={() => setModalOpen(false)}
          okText={editingId ? "Save" : "Create"}
          width={520}
          destroyOnClose
          styles={{ body: { paddingTop: 16 } }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Name (internal)"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Summer Sale 2025" />
            </Form.Item>
            <Form.Item
              name="discount_type"
              label="Discount type"
              rules={[{ required: true }]}
              initialValue="percentage"
            >
              <Select>
                <Option value="percentage">Percentage</Option>
                <Option value="fixed_amount">Fixed amount</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="value"
              label="Value (e.g. 20 for 20%, or 10 for $10)"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input type="number" min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="is_active" label="Active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            <Form.Item name="valid_from" label="Valid from (optional)">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="valid_to" label="Valid to (optional)">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="usage_limit" label="Usage limit (optional)">
              <Input type="number" min={1} placeholder="Leave empty for unlimited" />
            </Form.Item>
            <Form.Item name="min_purchase_amount" label="Min purchase amount $ (optional)">
              <Input type="number" min={0} step={0.01} placeholder="Leave empty for no minimum" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={statsData ? `Stats: ${statsData.name}` : "Stats"}
          open={statsModalOpen}
          onCancel={() => setStatsModalOpen(false)}
          footer={null}
          width={400}
          destroyOnClose
        >
          {statsLoading && <Skeleton active />}
          {!statsLoading && statsData && (
            <StatsModalContent>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <StatsCard>
                    <Statistic title="Times used" value={statsData.usage_count} />
                  </StatsCard>
                </Col>
                <Col span={12}>
                  <StatsCard>
                    <Statistic title="Bookings" value={statsData.bookings_count} />
                  </StatsCard>
                </Col>
                <Col span={24}>
                  <StatsCard>
                    <Statistic
                      title="Total amount saved (platform cost)"
                      value={statsData.total_amount_saved}
                      prefix="$"
                      precision={2}
                    />
                  </StatsCard>
                </Col>
              </Row>
            </StatsModalContent>
          )}
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
}
