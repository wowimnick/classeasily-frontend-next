"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Grid, Button, Table, Tag, Space, Popconfirm, Switch } from "antd";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import ProductDrawer from "./ProductDrawer";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import { formatPlanAccess } from "./membershipFormatters";
import { MembershipPlansSkeleton } from "./membershipSkeletons";
import {
  MembershipDashboardWrapper,
  MembershipPageHeader,
  MembershipTitleBlock,
  MembershipPageTitle,
  MembershipPageSubtitle,
  MembershipToolbar,
  MembershipTableSection,
  MembershipTableViewWrapper,
  MembershipToolbarButton,
  MembershipPrimaryButton,
} from "./membershipDashboardShared";

const { useBreakpoint } = Grid;

const PlanCard = styled.article`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

const PlanCardTitle = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const PlanCardMeta = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  display: grid;
  gap: 4px;
`;

const PlanCardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
`;

export default function MembershipProducts({ noWrapperPadding }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await businessMembershipService.getProducts();
    setLoading(false);
    if (res.success && Array.isArray(res.data)) setProducts(res.data);
    else if (!res.success) message.error(res.error || "Failed to load plans");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeDrawerOnly = () => {
    setDrawerOpen(false);
    setEditingId(null);
  };

  const handleProductSaved = () => {
    load();
    setDrawerOpen(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    setEditingId(null);
    setDrawerOpen(true);
  };
  const handleEdit = (record) => {
    setEditingId(record.id);
    setDrawerOpen(true);
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
          <span style={{ fontWeight: 500 }}>{name}</span>
          {!r.is_active && <Tag color="default">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (_, r) => `$${r.price} / ${r.billing_interval === "year" ? "year" : "month"}`,
    },
    {
      title: "Access",
      key: "access",
      render: (_, r) => formatPlanAccess(r),
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
        <Switch checked={r.is_active} onChange={() => handleToggleActive(r)} size="small" />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size={4}>
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
            <Button type="link" size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const editingProduct = editingId ? products.find((p) => p.id === editingId) : null;

  const renderMobilePlans = () => {
    if (products.length === 0) {
      return (
        <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 14 }}>
          No membership plans yet. Create one to get started.
        </div>
      );
    }
    return products.map((r) => (
      <PlanCard key={r.id}>
        <PlanCardTitle>
          {r.name}
          {!r.is_active && <Tag color="default">Inactive</Tag>}
        </PlanCardTitle>
        <PlanCardMeta>
          <div>
            <strong style={{ color: "#475569" }}>Price:</strong> ${r.price} / {r.billing_interval === "year" ? "year" : "month"}
          </div>
          <div>
            <strong style={{ color: "#475569" }}>Access:</strong> {formatPlanAccess(r)}
          </div>
          <div>
            <strong style={{ color: "#475569" }}>Active members:</strong> {r.active_members_count ?? 0}
          </div>
        </PlanCardMeta>
        <PlanCardActions>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Active</span>
            <Switch checked={r.is_active} onChange={() => handleToggleActive(r)} size="small" />
          </span>
          <Button type="primary" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this plan?"
            description="You can only delete plans with no active members."
            onConfirm={() => handleDelete(r.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<Trash2 size={14} />}>
              Delete
            </Button>
          </Popconfirm>
        </PlanCardActions>
      </PlanCard>
    ));
  };

  const inner = (
    <>
      {!noWrapperPadding && <DashboardBreadcrumb title="Memberships" />}
      <MembershipPageHeader>
        <MembershipTitleBlock>
          <MembershipPageTitle>My Plans</MembershipPageTitle>
          <MembershipPageSubtitle>
            Create and manage subscription plans, pricing, and access for your community.
          </MembershipPageSubtitle>
        </MembershipTitleBlock>
        <MembershipToolbar>
          <MembershipToolbarButton icon={<RefreshCw size={16} />} onClick={load}>
            Refresh
          </MembershipToolbarButton>
          <MembershipPrimaryButton type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Create membership
          </MembershipPrimaryButton>
        </MembershipToolbar>
      </MembershipPageHeader>
      <MembershipTableSection initial={false}>
        {loading ? (
          <div style={{ padding: isMobile ? 0 : 24 }}>
            <MembershipPlansSkeleton rows={isMobile ? 4 : 6} />
          </div>
        ) : isMobile ? (
          renderMobilePlans()
        ) : (
          <MembershipTableViewWrapper>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={products}
              pagination={false}
              locale={{ emptyText: "No membership plans yet. Create one to get started." }}
            />
          </MembershipTableViewWrapper>
        )}
      </MembershipTableSection>
      <ProductDrawer open={drawerOpen} onClose={closeDrawerOnly} product={editingProduct} onSaved={handleProductSaved} />
    </>
  );

  if (noWrapperPadding) {
    return inner;
  }

  return <MembershipDashboardWrapper>{inner}</MembershipDashboardWrapper>;
}
