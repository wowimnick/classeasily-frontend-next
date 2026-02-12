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
  message as antMessage,
} from "antd";
import { Plus, Edit, Trash2, BarChart3 } from "lucide-react";
import { globalDiscountAdminService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

const PageWrapper = styled.div`
  padding: 24px;
  background: #f8fafc;
  min-height: 100%;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222;
  margin: 0;
`;

const TableCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const message = antMessage;

export default function GlobalDiscountsManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [form] = Form.useForm();

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
        <Space>
          <Button
            type="link"
            size="small"
            icon={<BarChart3 size={16} />}
            onClick={() => openStats(record)}
          >
            Stats
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this global discount?"
            description="This cannot be undone. Existing applied discounts will remain in history."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<Trash2 size={16} />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Global Discounts</PageTitle>
        <Button type="primary" icon={<Plus size={18} />} onClick={openCreate}>
          Create global discount
        </Button>
      </PageHeader>
      <TableCard>
        {loading ? (
          <Skeleton active />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No global discounts" /> }}
          />
        )}
      </TableCard>

      <Modal
        title={editingId ? "Edit global discount" : "Create global discount"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? "Save" : "Create"}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
      >
        {statsLoading && <Skeleton />}
        {!statsLoading && statsData && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Statistic title="Times used" value={statsData.usage_count} />
            </Col>
            <Col span={12}>
              <Statistic
                title="Bookings"
                value={statsData.bookings_count}
              />
            </Col>
            <Col span={24}>
              <Statistic
                title="Total amount saved (platform cost)"
                value={statsData.total_amount_saved}
                prefix="$"
                precision={2}
              />
            </Col>
          </Row>
        )}
      </Modal>
    </PageWrapper>
  );
}
