"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Table, Button, Tag, Space, Popconfirm, Skeleton, Switch } from "antd";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import ProductDrawer from "./ProductDrawer";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${(p) => (p.$noPadding ? 0 : "24px")};
  @media (max-width: 768px) {
    padding: ${(p) => (p.$noPadding ? 0 : "16px")};
  }
`;
const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;
const PageTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

export default function MembershipProducts({ noWrapperPadding }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await businessMembershipService.getProducts();
    setLoading(false);
    if (res.success && Array.isArray(res.data)) setProducts(res.data);
    else if (!res.success) message.error(res.error || "Failed to load plans");
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = () => {
    setEditingId(null);
    setDrawerOpen(true);
  };
  const handleEdit = (record) => {
    setEditingId(record.id);
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingId(null);
    load();
  };
  const handleDelete = async (id) => {
    const res = await businessMembershipService.deleteProduct(id);
    if (res.success) {
      message.success("Plan deleted");
      load();
    } else message.error(res.error || "Failed to delete");
  };
  const handleToggleActive = async (record) => {
    const res = await businessMembershipService.updateProduct(record.id, {
      is_active: !record.is_active,
    });
    if (res.success) {
      message.success(record.is_active ? "Plan deactivated" : "Plan activated");
      load();
    } else message.error(res.error || "Failed to update");
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, r) => (
        <Space>
          <span>{name}</span>
          {!r.is_active && <Tag color="default">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (_, r) =>
        `$${r.price} / ${r.billing_interval === "year" ? "year" : "month"}`,
    },
    {
      title: "Access",
      key: "access",
      render: (_, r) =>
        r.access_type === "credits"
          ? `${r.credit_allowance} ${r.credit_unit || "credits"}`
          : "Unlimited",
    },
    {
      title: "Active members",
      dataIndex: "active_members_count",
      key: "active_members_count",
      render: (n) => n ?? 0,
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => (
        <Switch
          checked={r.is_active}
          onChange={() => handleToggleActive(r)}
          size="small"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this plan?"
            description="You can only delete plans with no active members."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="link" danger size="small" icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const editingProduct = editingId ? products.find((p) => p.id === editingId) : null;

  return (
    <Wrapper $noPadding={noWrapperPadding}>
      {!noWrapperPadding && <DashboardBreadcrumb title="Memberships" />}
      <HeaderRow>
        <PageTitle>Membership plans</PageTitle>
        <Space>
          <Button icon={<RefreshCw size={16} />} onClick={load}>
            Refresh
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Create membership
          </Button>
        </Space>
      </HeaderRow>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={products}
          pagination={false}
          locale={{ emptyText: "No membership plans yet. Create one to get started." }}
        />
      )}
      <ProductDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        product={editingProduct}
        onSaved={handleDrawerClose}
      />
    </Wrapper>
  );
}
