"use client";

import { useCallback, useEffect, useState } from "react";
import { Select, Table } from "antd";
import dayjs from "dayjs";
import { corporateAdminService } from "@/services/adminDash";
import MoneyChip from "./MoneyChip";
import StatusPill from "./StatusPill";

function normList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  return d?.results || [];
}

export default function BookingsTable({ onOpenRow, reloadNonce = 0 }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await corporateAdminService.listBookings(params);
      setRows(normList(res));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reloadNonce]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { title: "Ref", dataIndex: "reference", key: "reference" },
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company_name",
      render: (v) => v || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <StatusPill kind="booking" value={s} />,
    },
    {
      title: "Total",
      dataIndex: "total_cents",
      key: "total_cents",
      render: (c, row) => <MoneyChip cents={c} currency={row.currency} />,
    },
    {
      title: "Deposit",
      dataIndex: "deposit_cents",
      key: "deposit_cents",
      render: (c, row) => <MoneyChip cents={c} currency={row.currency} />,
    },
    {
      title: "Balance",
      dataIndex: "balance_cents",
      key: "balance_cents",
      render: (c, row) => <MoneyChip cents={c} currency={row.currency} />,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (t) => (t ? dayjs(t).format("YYYY-MM-DD") : "—"),
    },
  ];

  return (
    <>
      <Select
        allowClear
        placeholder="Filter by status"
        style={{ width: 220, marginBottom: 16 }}
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: "pending_deposit", label: "Awaiting deposit" },
          { value: "deposit_paid", label: "Deposit paid" },
          { value: "invoiced", label: "Invoiced" },
          { value: "fully_paid", label: "Paid in full" },
          { value: "in_progress", label: "In progress" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
          { value: "refunded", label: "Refunded" },
        ]}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        onRow={(r) => ({
          onClick: () => onOpenRow(r.id),
          style: { cursor: "pointer" },
        })}
        pagination={{ pageSize: 20 }}
      />
    </>
  );
}
