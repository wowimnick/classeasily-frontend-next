"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
  Typography,
  message,
} from "antd";
import { businessService } from "@/services/apiService";
import MarketingFeatureUpsell from "./MarketingFeatureUpsell";
import {
  Panel,
  MarketingSection,
  MarketingTableSection,
  MarketingStyledTable,
  MarketingEmptyState,
} from "./marketingLayout";
import { Skel, generateMarketingTableSkeletonRows } from "./marketingSkeletons";

const { Text, Title } = Typography;

const statusColor = (s) => {
  switch ((s || "").toLowerCase()) {
    case "active":  return "green";
    case "paused":  return "orange";
    case "draft":   return "default";
    default:        return "blue";
  }
};

export default function AutomationsMarketingPanel({ tier }) {
  const [rows, setRows]               = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [open, setOpen]               = useState(false);
  const [name, setName]               = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [delayHours, setDelayHours]   = useState(24);
  const [emailSubject, setEmailSubject] = useState("Thanks for visiting!");
  const [emailHtml, setEmailHtml]     = useState(
    "<p>Hi {{first_name}},</p><p>We hope to see you again.</p>",
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [w, e] = await Promise.all([
      businessService.listMarketingWorkflows(),
      businessService.listMarketingWorkflowEnrollments(),
    ]);
    if (w.success) setRows(Array.isArray(w.data) ? w.data : []);
    if (e.success) setEnrollments(Array.isArray(e.data) ? e.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tier?.automation_enabled) load();
  }, [load, tier?.automation_enabled]);

  const createWorkflow = async () => {
    if (!name.trim()) { message.error("Give this automation a name."); return; }
    const cr = await businessService.createMarketingWorkflow({
      name: name.trim(),
      trigger_type: triggerType,
    });
    if (!cr.success || !cr.data?.id) {
      message.error(cr.error || "Could not create automation. Check your plan limits.");
      return;
    }
    const id = cr.data.id;
    const steps = [
      { order: 0, step_type: "delay", config: { hours: delayHours } },
      {
        order: 1,
        step_type: "send_email",
        config: { subject: emailSubject, html_body: emailHtml, content_type: "html" },
      },
    ];
    const up = await businessService.updateMarketingWorkflow(id, { steps, status: "paused" });
    if (!up.success) {
      message.error(up.error || "Could not save automation steps.");
    } else {
      message.success("Automation created (paused). Activate when ready.");
      setOpen(false);
      setName("");
      load();
    }
  };

  if (!tier?.automation_enabled) {
    return (
      <Panel>
        <MarketingFeatureUpsell
          title="Automations and follow-up sequences"
          minPlanLabel="Business"
          bullets={[
            "Available on Business and Scale email marketing plans (Growth is broadcast-only)",
            "Linear workflows: delay steps plus marketing emails",
            "Triggers such as manual enroll and after booking completed",
            "Pause, resume, and delete automations from one place",
          ]}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      {/* ── Workflows ─────────────────────────────────────────────── */}
      <MarketingSection
        title="Workflows"
        description="Automated email sequences triggered by events or manually."
        action={
          <Button type="primary" onClick={() => setOpen(true)}>
            New automation
          </Button>
        }
      >
        <MarketingTableSection
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: !loading && rows.length === 0 ? 0 : 0 }}
        >
          {!loading && rows.length === 0 ? (
            <MarketingEmptyState
              title="No automations yet"
              subtitle="Build a simple delay + email sequence. Use New automation above to get started."
            />
          ) : (
            <MarketingStyledTable
              size="small"
              rowKey="id"
              loading={false}
              dataSource={loading ? generateMarketingTableSkeletonRows(5) : rows}
              pagination={false}
              columns={[
                {
                  title: "Name",
                  dataIndex: "name",
                  render: (v, row) =>
                    row.__skeleton ? (
                      <div>
                        <Skel $h="14px" $w="70%" $r="4px" />
                        <Skel $h="10px" $w="40%" $r="4px" style={{ marginTop: 6 }} />
                      </div>
                    ) : (
                      <div>
                        <Text strong style={{ display: "block" }}>
                          {v}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {row.trigger_type}
                        </Text>
                      </div>
                    ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  width: 100,
                  render: (v, row) =>
                    row.__skeleton ? (
                      <Skel $h="22px" $w="56px" $r="10px" />
                    ) : (
                      <Tag color={statusColor(v)}>{v}</Tag>
                    ),
                },
                {
                  title: "",
                  key: "act",
                  width: 160,
                  render: (_, row) =>
                    row.__skeleton ? (
                      <Skel $h="28px" $w="140px" $r="6px" />
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button
                          size="small"
                          onClick={async () => {
                            const next = row.status === "active" ? "paused" : "active";
                            const r = await businessService.updateMarketingWorkflow(row.id, { status: next });
                            if (r.success) {
                              message.success(next === "active" ? "Activated." : "Paused.");
                              load();
                            } else message.error(r.error);
                          }}
                        >
                          {row.status === "active" ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            Modal.confirm({
                              title: "Delete automation?",
                              content: "This cannot be undone.",
                              okText: "Delete",
                              okButtonProps: { danger: true },
                              onOk: async () => {
                                const r = await businessService.deleteMarketingWorkflow(row.id);
                                if (r.success) {
                                  message.success("Deleted.");
                                  load();
                                } else message.error(r.error);
                              },
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ),
                },
              ]}
            />
          )}
        </MarketingTableSection>
      </MarketingSection>

      <Divider />

      {/* ── Enrollments ─────────────────────────────────────────── */}
      <MarketingSection
        title="Recent enrollments"
        description="Contacts currently or recently moving through an automation."
      >
        <MarketingTableSection
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: enrollments.length === 0 && !loading ? 0 : 0 }}
        >
          {!loading && enrollments.length === 0 ? (
            <MarketingEmptyState
              title="No enrollments yet"
              subtitle="When contacts enter an automation, they will appear here."
            />
          ) : (
            <MarketingStyledTable
              size="small"
              rowKey="id"
              loading={false}
              dataSource={
                loading
                  ? generateMarketingTableSkeletonRows(4)
                  : enrollments.slice(0, 30)
              }
              pagination={false}
              columns={[
                {
                  title: "Email",
                  dataIndex: "email",
                  ellipsis: true,
                  render: (v, row) =>
                    row.__skeleton ? <Skel $h="14px" $w="85%" $r="4px" /> : v,
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  width: 100,
                  render: (v, row) =>
                    row.__skeleton ? (
                      <Skel $h="22px" $w="52px" $r="10px" />
                    ) : (
                      <Tag color={statusColor(v)}>{v}</Tag>
                    ),
                },
                {
                  title: "Step",
                  dataIndex: "current_step_index",
                  width: 60,
                  align: "center",
                  render: (v, row) =>
                    row.__skeleton ? <Skel $h="14px" $w="24px" $r="4px" style={{ margin: "0 auto" }} /> : v,
                },
              ]}
            />
          )}
        </MarketingTableSection>
      </MarketingSection>

      {/* ── Create modal ─────────────────────────────────────────── */}
      <Modal
        title="New automation (delay + email)"
        open={open}
        onCancel={() => { setOpen(false); setName(""); }}
        onOk={createWorkflow}
        okText="Create"
        width={560}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Automation name" required style={{ marginBottom: 14 }}>
            <Input
              placeholder="e.g. After-booking follow-up"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Trigger" style={{ marginBottom: 14 }}>
            <Select
              style={{ width: "100%" }}
              value={triggerType}
              onChange={setTriggerType}
              options={[
                { value: "manual",            label: "Manual enroll only" },
                { value: "booking_completed", label: "After booking completed" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Delay before email sends"
            help="Minimum 1 hour"
            style={{ marginBottom: 14 }}
          >
            <InputNumber
              min={1}
              addonAfter="hours"
              value={delayHours}
              onChange={(v) => setDelayHours(v || 24)}
              style={{ width: 160 }}
            />
          </Form.Item>

          <Divider style={{ margin: "4px 0 16px" }} />

          <Title level={5} style={{ margin: "0 0 12px", fontSize: 13, color: "#374151" }}>
            Email step
          </Title>

          <Form.Item label="Subject" style={{ marginBottom: 14 }}>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Email body (HTML)" style={{ marginBottom: 0 }}>
            <Input.TextArea
              rows={5}
              value={emailHtml}
              onChange={(e) => setEmailHtml(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Panel>
  );
}
