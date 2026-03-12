"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import {
  Table,
  Card,
  Button,
  Select,
  Input,
  Tag,
  Typography,
  Spin,
  message,
  Progress,
  Form,
  DatePicker,
} from "antd";
import { Plus, RefreshCcw, X } from "lucide-react";
import { Drawer } from "vaul";
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import DashboardBreadcrumb from "@/app/business/dashboard/_components/DashboardBreadcrumb";
import { notificationService, userSegmentService } from "@/services/adminDash";

const { TextArea } = Input;
const { Text } = Typography;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  border: "#f1f5f9",
  textPrimary: "#1f2937",
  textSecondary: "#64748b",
};

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 18px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`;

const TableCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
`;

const AUDIENCE_TYPES = [
  { value: "all_users", label: "All Users" },
  { value: "business_owners", label: "Business Owners" },
  { value: "students", label: "Students" },
  { value: "segment", label: "Custom Segment" },
];

const NOTIFICATION_TYPES = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "in_app", label: "In-App" },
  { value: "sms", label: "SMS" },
];

export default function NotificationCampaigns() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    avgSuccessRate: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [sendProgress, setSendProgress] = useState(null);
  const progressIntervalRef = useRef(null);

  const fetchMetrics = useCallback(async () => {
    const res = await notificationService.getNotificationMetrics();
    if (res.success && res.data) {
      const d = res.data;
      setStats({
        total: d.total ?? d.total_campaigns ?? 0,
        sent: d.sent ?? 0,
        pending: d.pending ?? 0,
        avgSuccessRate: d.avg_success_rate ?? d.success_rate ?? 0,
      });
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({});
      if (res.success && res.data) {
        const list = res.data.results ?? (Array.isArray(res.data) ? res.data : []);
        setCampaigns(list);
      } else {
        setCampaigns([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSegments = useCallback(async () => {
    const res = await userSegmentService.getUserSegments({});
    if (res.success && res.data) {
      const list = res.data.results ?? (Array.isArray(res.data) ? res.data : []);
      setSegments(list);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchCampaigns();
    fetchSegments();
  }, [fetchMetrics, fetchCampaigns, fetchSegments]);

  useEffect(() => {
    if (!sendingId) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setSendProgress(null);
      return;
    }
    const poll = async () => {
      const res = await notificationService.getSendProgress(sendingId);
      if (res.success && res.data) {
        setSendProgress(res.data);
        if (res.data.status === "complete" || res.data.status === "error") {
          setSendingId(null);
          fetchMetrics();
          fetchCampaigns();
        }
      }
    };
    poll();
    progressIntervalRef.current = setInterval(poll, 2000);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [sendingId, fetchMetrics, fetchCampaigns]);

  const handleRefresh = () => {
    fetchMetrics();
    fetchCampaigns();
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = async (record) => {
    setEditingId(record.id);
    const res = await notificationService.getNotificationDetails(record.id);
    if (res.success && res.data) {
      const d = res.data;
      form.setFieldsValue({
        title: d.title,
        subject: d.subject,
        notification_type: d.notification_type ?? "email",
        audience_type: d.audience_type ?? "all_users",
        segment: d.segment_id ?? d.user_segment ?? undefined,
        content: d.content ?? d.body,
        scheduled_at: d.scheduled_at ? dayjs(d.scheduled_at) : undefined,
      });
    }
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        title: values.title,
        subject: values.subject,
        notification_type: values.notification_type,
        audience_type: values.audience_type,
        content: values.content,
        ...(values.segment && { user_segment: values.segment }),
        ...(values.scheduled_at && {
          scheduled_at: values.scheduled_at.toISOString?.() ?? values.scheduled_at,
        }),
      };
      if (editingId) {
        const res = await notificationService.updateNotification(editingId, payload);
        if (res.success) {
          message.success("Campaign updated");
          setDrawerOpen(false);
          fetchCampaigns();
        } else {
          message.error(res.error?.error || res.error || "Update failed");
        }
      } else {
        const res = await notificationService.createNotification(payload);
        if (res.success) {
          message.success("Campaign created");
          setDrawerOpen(false);
          fetchCampaigns();
        } else {
          message.error(res.error?.error || res.error || "Create failed");
        }
      }
    } catch (e) {
      if (e.errorFields) return;
      message.error("Validation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (record) => {
    const res = await notificationService.sendNotification(record.id);
    if (res.success) {
      message.success("Send started");
      setSendingId(record.id);
    } else {
      message.error(res.error?.error || res.error || "Send failed");
    }
  };

  const handleDuplicate = async (record) => {
    const res = await notificationService.duplicateNotification(record.id);
    if (res.success) {
      message.success("Campaign duplicated");
      fetchCampaigns();
    } else {
      message.error(res.error || "Duplicate failed");
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "notification_type",
      key: "notification_type",
      render: (t) => <Tag>{t || "email"}</Tag>,
    },
    {
      title: "Audience",
      dataIndex: "audience_type",
      key: "audience_type",
      render: (t) => AUDIENCE_TYPES.find((a) => a.value === t)?.label ?? t,
    },
    {
      title: "Recipients",
      dataIndex: "recipient_count",
      key: "recipient_count",
      render: (v) => (v != null ? v : "—"),
    },
    {
      title: "Delivered",
      dataIndex: "delivered_count",
      key: "delivered_count",
      render: (v) => (v != null ? v : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag
          color={
            s === "sent"
              ? "green"
              : s === "sending"
                ? "blue"
                : s === "failed"
                  ? "red"
                  : "default"
          }
        >
          {s || "draft"}
        </Tag>
      ),
    },
    {
      title: "Sent",
      dataIndex: "sent_at",
      key: "sent_at",
      render: (v) => (v ? dayjs(v).format("MMM D, YYYY HH:mm") : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          {record.status === "draft" && (
            <Button type="link" size="small" onClick={() => handleSend(record)}>
              Send
            </Button>
          )}
          <Button type="link" size="small" onClick={() => handleDuplicate(record)}>
            Duplicate
          </Button>
        </>
      ),
    },
  ];

  return (
    <DashboardWrapper>
      <DashboardBreadcrumb title="Campaigns" />
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            Notification Campaigns
          </h1>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Create and send email and push campaigns.
          </Text>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<RefreshCcw size={14} />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
            New campaign
          </Button>
        </div>
      </div>

      <StatsGrid>
        <StatCard>
          <StatLabel>Total Campaigns</StatLabel>
          <StatValue><NumberFlow value={stats.total} /></StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Sent</StatLabel>
          <StatValue><NumberFlow value={stats.sent} /></StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Pending</StatLabel>
          <StatValue><NumberFlow value={stats.pending} /></StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Avg success rate</StatLabel>
          <StatValue>
            {typeof stats.avgSuccessRate === "number"
              ? `${(stats.avgSuccessRate * 100).toFixed(1)}%`
              : "—"}
          </StatValue>
        </StatCard>
      </StatsGrid>

      {sendingId && sendProgress && (
        <Card style={{ marginBottom: 16 }}>
          <Text strong>Sending campaign…</Text>
          {sendProgress.total > 0 && (
            <Progress
              percent={Math.round((sendProgress.processed / sendProgress.total) * 100)}
              status={sendProgress.status === "error" ? "exception" : "active"}
              style={{ marginTop: 8 }}
            />
          )}
          {sendProgress.message && (
            <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
              {sendProgress.message}
            </Text>
          )}
        </Card>
      )}

      <TableCard>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={campaigns}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </TableCard>

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <Drawer.Content
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 560,
              right: 0,
              top: 0,
              bottom: 0,
              height: "100%",
            }}
          >
            <Drawer.Title style={{ padding: 20, borderBottom: `1px solid ${colors.border}` }}>
              {editingId ? "Edit campaign" : "New campaign"}
            </Drawer.Title>
            <Drawer.Close asChild>
              <button type="button" aria-label="Close" style={{ position: "absolute", right: 16, top: 20 }}>
                <X size={20} />
              </button>
            </Drawer.Close>
            <div style={{ padding: 0, overflowY: "auto" }}>
              <Form form={form} layout="vertical">
                <Form.Item name="title" label="Campaign name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Weekly digest" />
                </Form.Item>
                <Form.Item name="subject" label="Subject (email)">
                  <Input placeholder="Email subject line" />
                </Form.Item>
                <Form.Item name="notification_type" label="Type" initialValue="email">
                  <Select options={NOTIFICATION_TYPES} />
                </Form.Item>
                <Form.Item name="audience_type" label="Audience" initialValue="all_users">
                  <Select options={AUDIENCE_TYPES} />
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.audience_type !== curr.audience_type}>
                  {({ getFieldValue }) =>
                    getFieldValue("audience_type") === "segment" ? (
                      <Form.Item name="segment" label="Segment">
                        <Select
                          placeholder="Select segment"
                          options={segments.map((s) => ({
                            value: s.id,
                            label: `${s.name ?? s.id} (${s.user_count ?? 0} users)`,
                          }))}
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
                <Form.Item name="content" label="Content">
                  <TextArea rows={6} placeholder="Email or message body" />
                </Form.Item>
                <Form.Item name="scheduled_at" label="Schedule (optional)">
                  <DatePicker showTime style={{ width: "100%" }} />
                </Form.Item>
              </Form>
              <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                <Button type="primary" loading={saving} onClick={handleSubmit}>
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </DashboardWrapper>
  );
}
