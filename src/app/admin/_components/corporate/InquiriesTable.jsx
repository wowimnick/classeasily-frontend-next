"use client";

import { useCallback, useState } from "react";
import { Input, Tag } from "antd";
import { AdminCompactTable } from "../shared/AdminCompactTable";
import dayjs from "dayjs";
import StatusPill from "./StatusPill";

export default function InquiriesTable({ loading, inquiries, onOpenRow }) {
  const [q, setQ] = useState("");

  const filtered = useCallback(() => {
    if (!q.trim()) return inquiries;
    const s = q.toLowerCase();
    return inquiries.filter(
      (r) =>
        (r.company_name || "").toLowerCase().includes(s) ||
        (r.contact_name || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s),
    );
  }, [inquiries, q]);

  const columns = [
    { title: "Company", dataIndex: "company_name", key: "company_name" },
    { title: "Contact", dataIndex: "contact_name", key: "contact_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (t) => (t ? dayjs(t).format("YYYY-MM-DD") : "—"),
    },
    {
      title: "Shortlist",
      dataIndex: "shortlist_status",
      key: "shortlist_status",
      render: (s) => (s ? <StatusPill kind="shortlist" value={s} /> : "—"),
    },
    {
      title: "Booking",
      key: "has_booking",
      render: (_, row) => (row.has_booking ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>),
    },
  ];

  return (
    <>
      <Input.Search
        allowClear
        placeholder="Filter company, contact, email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 360, marginBottom: 16 }}
      />
      <AdminCompactTable
        rowKey="id"
        loading={loading}
        dataSource={filtered()}
        columns={columns}
        onRow={(r) => ({
          onClick: () => onOpenRow(r),
          style: { cursor: "pointer" },
        })}
        pagination={{ pageSize: 20 }}
      />
    </>
  );
}
