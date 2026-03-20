"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Table, Button, Tag, Space, Input, Select, Skeleton, Popconfirm } from "antd";
import { Plus, Search, User } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import MemberDrawer from "./MemberDrawer";
import AddMemberModal from "./AddMemberModal";

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
const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
  { value: "paused", label: "Paused" },
  { value: "pending_approval", label: "Pending approval" },
];

export default function MembersTable({ noWrapperPadding, productId: propProductId }) {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState(propProductId || "");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [drawerMemberId, setDrawerMemberId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const pageSize = 20;

  const loadProducts = useCallback(async () => {
    const res = await businessMembershipService.getProducts();
    if (res.success && Array.isArray(res.data)) setProducts(res.data);
  }, []);

  const load = useCallback(async (pageOverride) => {
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
  }, [page, productFilter, statusFilter, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { load(); }, [load]);

  const openDrawer = (record) => setDrawerMemberId(record.id);
  const closeDrawer = () => {
    setDrawerMemberId(null);
    load();
  };
  const handleAddSaved = () => {
    setAddModalOpen(false);
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

  const columns = [
    {
      title: "Member",
      key: "name",
      render: (_, r) => (
        <Space>
          <span>{r.name || "—"}</span>
          <span style={{ color: "#666", fontSize: 12 }}>{r.email}</span>
        </Space>
      ),
    },
    { title: "Plan", dataIndex: "product_name", key: "product_name" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = { active: "green", trialing: "blue", past_due: "orange", canceled: "default", paused: "default", pending_approval: "gold" }[status] || "default";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Period end",
      dataIndex: "current_period_end",
      key: "current_period_end",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "—"),
    },
    {
      title: "Credits",
      key: "credits",
      render: (_, r) => (r.credits_remaining != null ? `${r.credits_remaining}` : "—"),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (s) => <Tag>{s || "—"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<User size={14} />} onClick={() => openDrawer(record)}>
            View
          </Button>
          {record.status === "pending_approval" && (
            <>
              <Button type="link" size="small" style={{ color: "green" }} onClick={() => handleApprove(record.id)}>
                Approve
              </Button>
              <Popconfirm title="Decline this application?" onConfirm={() => handleDecline(record.id)}>
                <Button type="link" size="small" danger>Decline</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Wrapper $noPadding={noWrapperPadding}>
      <HeaderRow>
        <PageTitle>Members</PageTitle>
        <Space wrap>
          <Filters>
            <Input
              placeholder="Search name or email"
              prefix={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => load(1)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="Plan"
              value={productFilter || undefined}
              onChange={(v) => { setProductFilter(v || ""); setPage(1); }}
              style={{ width: 180 }}
              allowClear
              options={[{ value: "", label: "All plans" }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <Select
              placeholder="Status"
              value={statusFilter || undefined}
              onChange={(v) => { setStatusFilter(v || ""); setPage(1); }}
              style={{ width: 140 }}
              options={STATUS_OPTIONS}
            />
            <Button onClick={() => load(1)}>Apply</Button>
          </Filters>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setAddModalOpen(true)}>
            Add member
          </Button>
        </Space>
      </HeaderRow>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
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
            locale={{ emptyText: "No members yet." }}
          />
          <MemberDrawer
            memberId={drawerMemberId}
            open={!!drawerMemberId}
            onClose={closeDrawer}
            onUpdated={load}
            products={products}
          />
          <AddMemberModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            products={products}
            onSaved={handleAddSaved}
          />
        </>
      )}
    </Wrapper>
  );
}
