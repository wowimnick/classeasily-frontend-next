"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Grid, Button, Table, Tag, Space, Popconfirm, Switch, Tooltip } from "antd";
import { Plus, Edit, Trash2, RefreshCw, Users, Radio } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import { useUrlState } from "@/hooks/useUrlState";
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

function estimatePlanMrr(r) {
  const price = Number(r.price);
  const c = Number(r.active_members_count ?? 0);
  if (!Number.isFinite(price) || !c) return "—";
  const monthly = r.billing_interval === "year" ? price / 12 : price;
  return `$${(monthly * c).toFixed(2)}`;
}

function formatUpdatedAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

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
  const router = useRouter();
  const [productIdRaw, setProductIdParam] = useUrlState("membershipProductId");
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

  useEffect(() => {
    if (!productIdRaw || loading) return;
    const found = products.find((p) => String(p.id) === String(productIdRaw));
    if (found) {
      setEditingId(found.id);
      setDrawerOpen(true);
    } else if (products.length > 0) {
      setProductIdParam(null);
    }
  }, [productIdRaw, products, loading, setProductIdParam]);

  const closeDrawerOnly = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setProductIdParam(null);
  };

  const handleProductSaved = () => {
    load();
    setDrawerOpen(false);
    setEditingId(null);
    setProductIdParam(null);
  };

  const handleCreate = () => {
    setProductIdParam(null);
    setEditingId(null);
    setDrawerOpen(true);
  };
  const handleEdit = (record) => {
    setProductIdParam(record.id);
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

  const handleSyncStripe = async (record) => {
    const res = await businessMembershipService.syncStripe(record.id);
    if (res.success) {
      message.success("Synced with Stripe");
      load();
    } else message.error(res.error || "Stripe sync failed");
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
      title: "Est. MRR",
      key: "mrr",
      width: 100,
      render: (_, r) => estimatePlanMrr(r),
    },
    {
      title: "Churn (30d)",
      key: "churn",
      width: 110,
      render: () => (
        <Tooltip title="Canceled-member rate coming soon — use Stripe/exports for now.">
          <span style={{ color: "#94a3b8" }}>—</span>
        </Tooltip>
      ),
    },
    {
      title: "Stripe sync",
      key: "updated_at",
      width: 150,
      render: (_, r) => formatUpdatedAt(r.updated_at),
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
          <Button
            type="link"
            size="small"
            icon={<Users size={14} />}
            onClick={() =>
              router.push(
                `/business/dashboard/memberships/members?membershipProductId=${encodeURIComponent(record.id)}`,
              )
            }
          >
            Members
          </Button>
          <Button type="link" size="small" icon={<RefreshCw size={14} />} onClick={() => handleSyncStripe(record)}>
            Sync
          </Button>
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
        <div
          style={{
            padding: 36,
            textAlign: "center",
            background: "linear-gradient(180deg,#f8fafc 0%,#fff 100%)",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Memberships live here</div>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.55 }}>
            Create a plan to sell recurring access, credits, and member-only perks. You need a{" "}
            <strong>Growth</strong> or <strong>Advanced</strong> widget subscription.
          </p>
          <Space wrap size={[10, 10]} style={{ justifyContent: "center" }}>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Create membership plan
            </Button>
            <Link href="/booking-widget" style={{ display: "inline-flex" }}>
              <Button icon={<Radio size={16} />}>Widget & pricing</Button>
            </Link>
            <Link href="/business/dashboard/settings?tab=billing" style={{ display: "inline-flex" }}>
              <Button>Plan &amp; billing</Button>
            </Link>
          </Space>
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
