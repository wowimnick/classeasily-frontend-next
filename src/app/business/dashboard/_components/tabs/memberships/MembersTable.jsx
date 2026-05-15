"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Grid, Avatar, Button, Table, Tag, Space, Popconfirm, Typography, Pagination } from "antd";
import { Plus, Search, User } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import { useUrlState } from "@/hooks/useUrlState";
import MemberDrawer from "./MemberDrawer";
import AddMemberDrawer from "./AddMemberDrawer";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import {
  MembershipDashboardWrapper,
  MembershipPageHeader,
  MembershipTitleBlock,
  MembershipPageTitle,
  MembershipPageSubtitle,
  MembershipToolbar,
  MembershipTableSection,
  MembershipTableViewWrapper,
  MembershipFiltersBar,
  MembershipSearchInput,
  MembershipFilterSelect,
  MembershipToolbarButton,
  MembershipPrimaryButton,
  MembershipTableContentArea,
  membershipColors,
} from "./membershipDashboardShared";
import { formatMemberStatusLabel, formatSourceLabel } from "./membershipFormatters";
import { MembershipMembersSkeleton, MembershipMembersTableSkeleton } from "./membershipSkeletons";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "canceled", label: "Canceled" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
];

const statusTagColor = {
  active: "success",
  trialing: "processing",
  past_due: "warning",
  canceled: "default",
  paused: "default",
  pending_approval: "gold",
};

const MobileCard = styled.article`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

const MobileCardTop = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const MobileCardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
`;

const MobileMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 13px;
  color: #64748b;
`;

function formatMemberBillingPeriod(r) {
  const a = r.current_period_start;
  const b = r.current_period_end;
  if (!a && !b) return "—";
  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");
  if (a && b) return `${fmt(a)} – ${fmt(b)}`;
  return fmt(a || b);
}

export default function MembersTable({ noWrapperPadding, productId: propProductId }) {
  const [memberIdRaw, setMemberIdParam] = useUrlState("memberId");
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState(propProductId || "");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const pageSize = 20;

  const loadProducts = useCallback(async () => {
    const res = await businessMembershipService.getProducts();
    if (res.success && Array.isArray(res.data)) setProducts(res.data);
  }, []);

  const load = useCallback(
    async (pageOverride) => {
      setLoading(true);
      const p = pageOverride ?? page;
      const params = { page: p, page_size: pageSize };
      if (productFilter) params.product_id = productFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await businessMembershipService.getMembers(params);
      setLoading(false);
      if (res.success && res.data) {
        setMembers(res.data.results || []);
        setTotal(res.data.count ?? 0);
        if (pageOverride != null) setPage(pageOverride);
      } else if (!res.success) message.error(res.error || "Failed to load members");
    },
    [page, productFilter, statusFilter, search]
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (propProductId) {
      setProductFilter(propProductId);
      setPage(1);
    }
  }, [propProductId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!memberIdRaw || loading) return;
    const found = members.find((m) => String(m.id) === String(memberIdRaw));
    if (!found && members.length > 0) {
      setMemberIdParam(null);
    }
  }, [memberIdRaw, members, loading, setMemberIdParam]);

  const openDrawer = (record) => setMemberIdParam(record.id);
  const closeDrawer = () => setMemberIdParam(null);

  const handleAddSaved = () => {
    setAddDrawerOpen(false);
    load();
  };

  const handleApprove = async (id) => {
    const res = await businessMembershipService.approveMember(id);
    if (res.success) {
      message.success("Member approved; they will receive an email to complete payment.");
      load();
    } else message.error(res.error || "Failed to approve");
  };
  const handleDecline = async (id) => {
    const res = await businessMembershipService.declineMember(id);
    if (res.success) {
      message.success("Application declined.");
      load();
    } else message.error(res.error || "Failed to decline");
  };

  const applyFilters = () => load(1);

  const columns = [
    {
      title: "Member",
      key: "member",
      render: (_, r) => (
        <Space align="center" size={12}>
          <Avatar
            size={40}
            style={{
              background: `linear-gradient(135deg, ${membershipColors.primary} 0%, #ff6b8a 100%)`,
              flexShrink: 0,
            }}
          >
            {(r.name || r.email || "?").charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#1e293b", lineHeight: 1.3 }}>
              {r.name || "—"}
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {r.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Plan",
      dataIndex: "product_name",
      key: "product_name",
      render: (name) => <span style={{ fontWeight: 500 }}>{name || "—"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const label = formatMemberStatusLabel(status);
        if (!label || label === "—") return "—";
        return (
          <Tag color={statusTagColor[status] || "default"} style={{ borderRadius: 6, margin: 0 }}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Billing period",
      key: "billing_period",
      render: (_, r) => formatMemberBillingPeriod(r),
    },
    {
      title: "Credits",
      key: "credits",
      align: "center",
      render: (_, r) => {
        if (r.credits_remaining == null) return "—";
        const unit = (r.credit_unit || "").trim();
        const cap = r.credit_allowance != null ? ` / ${r.credit_allowance}` : "";
        const suffix = unit ? ` ${unit}` : "";
        return `${r.credits_remaining}${cap}${suffix}`;
      },
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (s) =>
        s ? (
          <Tag style={{ borderRadius: 6, margin: 0 }}>{formatSourceLabel(s)}</Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "",
      key: "actions",
      width: 200,
      align: "right",
      render: (_, record) => (
        <Space size={4} wrap={false}>
          <Button type="link" size="small" icon={<User size={14} />} onClick={() => openDrawer(record)}>
            View
          </Button>
          {record.status === "pending_approval" && (
            <>
              <Button type="link" size="small" style={{ color: "#10b981" }} onClick={() => handleApprove(record.id)}>
                Approve
              </Button>
              <Popconfirm title="Decline this application?" onConfirm={() => handleDecline(record.id)}>
                <Button type="link" size="small" danger>
                  Decline
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const renderMobileCards = () => {
    if (members.length === 0) {
      return (
        <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 14 }}>
          No members match your filters. When someone subscribes to a plan, they will appear here.
        </div>
      );
    }
    return members.map((r) => {
      const label = formatMemberStatusLabel(r.status);
      return (
        <MobileCard key={r.id}>
          <MobileCardTop>
            <Avatar
              size={44}
              style={{
                background: `linear-gradient(135deg, ${membershipColors.primary} 0%, #ff6b8a 100%)`,
                flexShrink: 0,
              }}
            >
              {(r.name || r.email || "?").charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>{r.name || "—"}</div>
              <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                {r.email}
              </Text>
              <MobileMetaRow style={{ marginTop: 10 }}>
                <span>
                  <strong style={{ color: "#475569" }}>Plan:</strong> {r.product_name || "—"}
                </span>
                <span>
                  <strong style={{ color: "#475569" }}>Period:</strong> {formatMemberBillingPeriod(r)}
                </span>
              </MobileMetaRow>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {label && label !== "—" && (
                  <Tag color={statusTagColor[r.status] || "default"} style={{ margin: 0, borderRadius: 6 }}>
                    {label}
                  </Tag>
                )}
                {r.source ? <Tag style={{ margin: 0, borderRadius: 6 }}>{formatSourceLabel(r.source)}</Tag> : null}
                {r.credits_remaining != null && (
                  <Tag style={{ margin: 0, borderRadius: 6 }}>
                    {r.credits_remaining}
                    {r.credit_allowance != null ? ` / ${r.credit_allowance}` : ""}
                    {(r.credit_unit || "").trim() ? ` ${(r.credit_unit || "").trim()}` : " credits"}
                  </Tag>
                )}
              </div>
            </div>
          </MobileCardTop>
          <MobileCardActions>
            <Button type="primary" size="small" icon={<User size={14} />} onClick={() => openDrawer(r)}>
              View details
            </Button>
            {r.status === "pending_approval" && (
              <>
                <Button size="small" style={{ color: "#10b981", borderColor: "#a7f3d0" }} onClick={() => handleApprove(r.id)}>
                  Approve
                </Button>
                <Popconfirm title="Decline this application?" onConfirm={() => handleDecline(r.id)}>
                  <Button size="small" danger>
                    Decline
                  </Button>
                </Popconfirm>
              </>
            )}
          </MobileCardActions>
        </MobileCard>
      );
    });
  };

  const inner = (
    <>
      {!noWrapperPadding && <DashboardBreadcrumb title="Memberships" />}
      <MembershipPageHeader>
        <MembershipTitleBlock>
          <MembershipPageTitle>Members</MembershipPageTitle>
          <MembershipPageSubtitle>
            Everyone subscribed to your plans. Search, filter, and open a member to manage billing and credits.
          </MembershipPageSubtitle>
        </MembershipTitleBlock>
        <MembershipToolbar>
          <MembershipPrimaryButton type="primary" icon={<Plus size={16} />} onClick={() => setAddDrawerOpen(true)}>
            Add member
          </MembershipPrimaryButton>
        </MembershipToolbar>
      </MembershipPageHeader>

      <MembershipTableSection initial={false}>
        <MembershipFiltersBar>
          <MembershipSearchInput
            placeholder="Search name or email"
            prefix={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={applyFilters}
            allowClear
            onClear={() => {
              setSearch("");
              setTimeout(applyFilters, 0);
            }}
          />
          <MembershipFilterSelect
            placeholder="All plans"
            value={productFilter || undefined}
            onChange={(v) => {
              setProductFilter(v || "");
              setPage(1);
            }}
            allowClear
            options={products.map((p) => ({ value: p.id, label: p.name }))}
          />
          <MembershipFilterSelect
            placeholder="Status"
            value={statusFilter || undefined}
            onChange={(v) => {
              setStatusFilter(v || "");
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <MembershipToolbarButton onClick={applyFilters}>Apply</MembershipToolbarButton>
        </MembershipFiltersBar>
        <MembershipTableContentArea>
          {loading ? (
            isMobile ? (
              <MembershipMembersSkeleton cards={6} />
            ) : (
              <MembershipMembersTableSkeleton rows={8} />
            )
          ) : isMobile ? (
            <>
              {renderMobileCards()}
              {total > pageSize && (
                <div style={{ padding: "16px", display: "flex", justifyContent: "center" }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={setPage}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}
            </>
          ) : (
            <MembershipTableViewWrapper>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={members}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: false,
                  onChange: setPage,
                }}
                locale={{ emptyText: "No members yet. When someone subscribes to a plan, they will appear here." }}
              />
            </MembershipTableViewWrapper>
          )}
        </MembershipTableContentArea>
      </MembershipTableSection>

      <MemberDrawer
        memberId={memberIdRaw}
        open={!!memberIdRaw}
        onClose={closeDrawer}
        onUpdated={load}
        products={products}
      />
      <AddMemberDrawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} products={products} onSaved={handleAddSaved} />
    </>
  );

  if (noWrapperPadding) {
    return inner;
  }

  return <MembershipDashboardWrapper>{inner}</MembershipDashboardWrapper>;
}
