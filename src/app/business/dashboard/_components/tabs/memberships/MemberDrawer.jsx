"use client";

import React, { useState, useEffect } from "react";
import {
  Drawer,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  Skeleton,
  Typography,
} from "antd";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";

const { Text } = Typography;

export default function MemberDrawer({ memberId, open, onClose, onUpdated, products = [] }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!open || !memberId) {
      setMember(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    businessMembershipService.getMember(memberId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success) setMember(res.data);
      else message.error(res.error || "Failed to load member");
    });
    return () => { cancelled = true; };
  }, [open, memberId]);

  const handleCancel = async (immediate) => {
    setActioning(true);
    const res = await businessMembershipService.cancelMember(memberId, immediate);
    setActioning(false);
    if (res.success) {
      message.success(immediate ? "Membership canceled" : "Set to cancel at period end");
      onUpdated?.();
      if (res.data) setMember(res.data);
    } else message.error(res.error || "Failed to cancel");
  };

  const handlePause = async () => {
    setActioning(true);
    const res = await businessMembershipService.pauseMember(memberId);
    setActioning(false);
    if (res.success) {
      message.success("Membership paused");
      onUpdated?.();
      if (res.data) setMember(res.data);
    } else message.error(res.error || "Failed to pause");
  };

  const canCancel = member && !["canceled", "paused"].includes(member.status);
  const canPause = member && member.status === "active";

  const ledgerColumns = [
    { title: "Period start", dataIndex: "period_start", key: "period_start", render: (d) => d ? new Date(d).toLocaleDateString() : "—" },
    { title: "Credits used", dataIndex: "credits_used", key: "credits_used" },
    { title: "Action", dataIndex: "action", key: "action" },
    { title: "Date", dataIndex: "created_at", key: "created_at", render: (d) => d ? new Date(d).toLocaleString() : "—" },
  ];
  const paymentColumns = [
    { title: "Amount", dataIndex: "amount", key: "amount", render: (a) => a != null ? `$${a}` : "—" },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag>{s}</Tag> },
    { title: "Period", key: "period", render: (_, r) => (r.period_start && r.period_end) ? `${new Date(r.period_start).toLocaleDateString()} – ${new Date(r.period_end).toLocaleDateString()}` : "—" },
    { title: "Date", dataIndex: "created_at", key: "created_at", render: (d) => d ? new Date(d).toLocaleString() : "—" },
  ];

  return (
    <Drawer
      title="Member details"
      open={open}
      onClose={onClose}
      width={560}
      footer={
        (canCancel || canPause) && (
          <Space>
            {canCancel && (
              <>
                <Popconfirm
                  title="Cancel at period end?"
                  description="The member will keep access until the current period ends."
                  onConfirm={() => handleCancel(false)}
                  okText="Cancel at period end"
                  cancelText="No"
                >
                  <Button loading={actioning}>Cancel at period end</Button>
                </Popconfirm>
                <Popconfirm
                  title="Cancel immediately?"
                  onConfirm={() => handleCancel(true)}
                  okText="Cancel now"
                  cancelText="No"
                >
                  <Button danger loading={actioning}>Cancel now</Button>
                </Popconfirm>
              </>
            )}
            {canPause && (
              <Button onClick={handlePause} loading={actioning}>Pause</Button>
            )}
          </Space>
        )
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : member ? (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Name">{member.name || "—"}</Descriptions.Item>
            <Descriptions.Item label="Email">{member.email || "—"}</Descriptions.Item>
            <Descriptions.Item label="Plan">{member.product_name}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={member.status === "active" ? "green" : "default"}>{member.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Period start">
              {member.current_period_start ? new Date(member.current_period_start).toLocaleDateString() : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Period end">
              {member.current_period_end ? new Date(member.current_period_end).toLocaleDateString() : "—"}
            </Descriptions.Item>
            {member.credits_remaining != null && (
              <Descriptions.Item label="Credits remaining">{member.credits_remaining}</Descriptions.Item>
            )}
            <Descriptions.Item label="Source">{member.source || "—"}</Descriptions.Item>
            {member.notes && <Descriptions.Item label="Notes">{member.notes}</Descriptions.Item>}
          </Descriptions>

          {member.custom_data && typeof member.custom_data === "object" && Object.keys(member.custom_data).length > 0 && (
            <>
              <Text strong style={{ display: "block", marginTop: 24, marginBottom: 8 }}>Signup responses</Text>
              <Descriptions column={1} size="small" bordered>
                {(() => {
                  const product = products.find((p) => p.id === member.product_id);
                  const signupFields = Array.isArray(product?.signup_fields) ? product.signup_fields : [];
                  const labelForKey = (key) => signupFields.find((f) => f.key === key)?.label || key;
                  return Object.entries(member.custom_data).map(([key, value]) => (
                    <Descriptions.Item key={key} label={labelForKey(key)}>
                      {value === true || value === false ? String(value) : (value ?? "—")}
                    </Descriptions.Item>
                  ));
                })()}
              </Descriptions>
            </>
          )}

          {Array.isArray(member.ledger) && member.ledger.length > 0 && (
            <>
              <Text strong style={{ display: "block", marginTop: 24, marginBottom: 8 }}>Credit history</Text>
              <Table
                size="small"
                rowKey="id"
                columns={ledgerColumns}
                dataSource={member.ledger}
                pagination={false}
              />
            </>
          )}

          {Array.isArray(member.payments) && member.payments.length > 0 && (
            <>
              <Text strong style={{ display: "block", marginTop: 24, marginBottom: 8 }}>Payment history</Text>
              <Table
                size="small"
                rowKey="id"
                columns={paymentColumns}
                dataSource={member.payments}
                pagination={false}
              />
            </>
          )}
        </>
      ) : null}
    </Drawer>
  );
}
