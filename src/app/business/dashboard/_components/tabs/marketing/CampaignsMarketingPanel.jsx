"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button, Dropdown, Input, Select, Table, Tag, Tooltip, Typography, message } from "antd";
import { MoreHorizontal } from "lucide-react";
import { businessService } from "@/services/apiService";
import dayjs from "dayjs";
import {
  Panel,
  MarketingTableSection,
  MarketingStyledTable,
  MarketingEmptyState,
} from "./marketingLayout";
import { Skel, generateMarketingTableSkeletonRows } from "./marketingSkeletons";

const { Text } = Typography;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
`;

const statusColor = (s) => {
  switch (s) {
    case "sent":
      return "green";
    case "scheduled":
      return "blue";
    case "sending":
      return "processing";
    case "failed":
      return "error";
    case "draft":
    default:
      return "default";
  }
};

function useDebouncedValue(value, ms) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

export default function CampaignsMarketingPanel({ onEditCampaign, usage }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const searchDebounced = useDebouncedValue(searchInput, 300);
  const [sendingRowId, setSendingRowId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await businessService.listMarketingCampaigns();
    if (r.success) setCampaigns(Array.isArray(r.data) ? r.data : []);
    else setCampaigns([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let rows = campaigns;
    if (statusFilter !== "all") rows = rows.filter((c) => c.status === statusFilter);
    if (searchDebounced.trim()) {
      const q = searchDebounced.trim().toLowerCase();
      rows = rows.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.subject || "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [campaigns, statusFilter, searchDebounced]);

  const duplicateCampaign = async (row) => {
    const det = await businessService.fetchMarketingCampaign(row.id);
    if (!det.success || !det.data) {
      message.error(det.error || "Could not load campaign.");
      return;
    }
    const d = det.data;
    const cr = await businessService.createMarketingCampaign({ name: `${d.name || "Campaign"} (copy)` });
    if (!cr.success || !cr.data?.id) {
      message.error(cr.error || "Could not duplicate.");
      return;
    }
    const up = await businessService.updateMarketingCampaign(cr.data.id, {
      subject: d.subject,
      html_body: d.html_body,
      builder_json: d.builder_json,
      content_type: d.content_type || "html",
      audience_type: d.audience_type,
      audience_filter: d.audience_filter || {},
      sender_profile: d.sender_profile || undefined,
    });
    if (!up.success) {
      message.error(up.error || "Could not copy content.");
      return;
    }
    message.success("Duplicate saved as draft.");
    load();
  };

  const deleteCampaign = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    const r = await businessService.deleteMarketingCampaign(row.id);
    if (r.success) {
      message.success("Deleted.");
      load();
    } else message.error(r.error);
  };

  const sendNow = async (row) => {
    setSendingRowId(row.id);
    try {
      const r = await businessService.sendMarketingCampaign(row.id);
      if (r.success) {
        message.success("Campaign queued for sending.");
        load();
      } else message.error(r.error || "Send failed. You may be out of quota.");
    } finally {
      setSendingRowId(null);
    }
  };

  const cancelSchedule = async (row) => {
    const r = await businessService.scheduleMarketingCampaign(row.id, { cancel: true });
    if (r.success) {
      message.success("Schedule cancelled.");
      load();
    } else message.error(r.error);
  };

  const quotaExhausted = usage && Number(usage.remaining) === 0;
  const quotaTooltip =
    "You have used all marketing sends for this billing period. Upgrade your plan on Plans & billing, or wait until your next billing cycle for the quota to reset.";

  const rowActions = (row) => {
    const isDraft = row.status === "draft";
    const isFailed = row.status === "failed";
    const isScheduled = row.status === "scheduled";
    const isSending = row.status === "sending";

    const primary = (
      <Button
        size="small"
        type="primary"
        ghost
        onClick={(e) => {
          e.stopPropagation();
          onEditCampaign(row.id);
        }}
      >
        Edit
      </Button>
    );

    const sendBtn =
      isDraft || isFailed ? (
        <Tooltip title={quotaExhausted ? quotaTooltip : null}>
          <span onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              type="primary"
              disabled={quotaExhausted}
              loading={sendingRowId === row.id}
              key={`send-${row.id}-${sendingRowId === row.id}`}
              onClick={() => sendNow(row)}
            >
              Send now
            </Button>
          </span>
        </Tooltip>
      ) : null;

    const moreItems = [];

    if (isDraft || isFailed || isScheduled) {
      moreItems.push({
        key: "schedule",
        label: "Schedule",
        onClick: () => onEditCampaign(row.id, { focusSchedule: true }),
      });
    }
    if (isScheduled) {
      moreItems.push({
        key: "cancel-schedule",
        label: "Cancel schedule",
        onClick: () => cancelSchedule(row),
      });
    }
    moreItems.push({
      key: "duplicate",
      label: "Duplicate",
      onClick: () => duplicateCampaign(row),
    });
    if (!isSending) {
      moreItems.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => deleteCampaign(row),
      });
    }

    return (
      <div
        style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap" }}
        onClick={(e) => e.stopPropagation()}
      >
        {primary}
        {sendBtn}
        {moreItems.length > 0 && (
          <Dropdown menu={{ items: moreItems }} trigger={["click"]}>
            <Button size="small" icon={<MoreHorizontal size={15} />} aria-label="More actions" />
          </Dropdown>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      ellipsis: true,
      render: (v, row) =>
        row.__skeleton ? (
          <div>
            <Skel $h="14px" $w="72%" $r="4px" />
            <Skel $h="10px" $w="55%" $r="4px" style={{ marginTop: 6 }} />
          </div>
        ) : (
          <div>
            <Text strong style={{ display: "block" }}>
              {v || "—"}
            </Text>
            {row.subject && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.subject}
              </Text>
            )}
          </div>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (v, row) =>
        row.__skeleton ? <Skel $h="22px" $w="52px" $r="10px" /> : <Tag color={statusColor(v)}>{v || "—"}</Tag>,
    },
    {
      title: "Scheduled",
      dataIndex: "scheduled_at",
      width: 150,
      render: (v, row) =>
        row.__skeleton ? (
          <Skel $h="14px" $w="85%" $r="4px" />
        ) : v ? (
          dayjs(v).format("MMM D, YYYY h:mm A")
        ) : (
          "—"
        ),
    },
    {
      title: "Sent",
      dataIndex: "sent_at",
      width: 110,
      render: (v, row) =>
        row.__skeleton ? <Skel $h="14px" $w="70%" $r="4px" /> : v ? dayjs(v).format("MMM D, YYYY") : "—",
    },
    {
      title: "Recipients",
      key: "rec",
      width: 90,
      align: "right",
      render: (_, row) =>
        row.__skeleton ? (
          <Skel $h="14px" $w="36px" $r="4px" style={{ marginLeft: "auto" }} />
        ) : row.status === "sent" ? (
          (row.recipient_count ?? "—")
        ) : (
          "—"
        ),
    },
    {
      title: "Stats",
      key: "stats",
      width: 90,
      align: "right",
      render: (_, row) =>
        row.__skeleton ? (
          <Skel $h="14px" $w="48px" $r="4px" style={{ marginLeft: "auto" }} />
        ) : row.sends_sent != null ? (
          `${row.sends_sent}✓  ${row.sends_failed || 0}✗`
        ) : (
          "—"
        ),
    },
    {
      title: "",
      key: "act",
      width: 160,
      render: (_, row) => (row.__skeleton ? <Skel $h="28px" $w="120px" $r="6px" /> : rowActions(row)),
    },
  ];

  const tableData = loading ? generateMarketingTableSkeletonRows(8) : filtered;
  const showEmpty = !loading && filtered.length === 0;

  return (
    <Panel>
      <MarketingTableSection initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Toolbar>
          <Button type="primary" onClick={() => onEditCampaign("new")}>
            New campaign
          </Button>
          <Select
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "draft", label: "Draft" },
              { value: "scheduled", label: "Scheduled" },
              { value: "sending", label: "Sending" },
              { value: "sent", label: "Sent" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Search name or subject…"
            style={{ maxWidth: 260 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Toolbar>

        {showEmpty ? (
          <MarketingEmptyState
            title={campaigns.length === 0 ? "No campaigns yet" : "No campaigns match your filters"}
            subtitle={
              campaigns.length === 0
                ? "Create a campaign to design your email and choose who receives it. Use New campaign above."
                : "Try clearing the search or choosing a different status."
            }
          />
        ) : (
          <MarketingStyledTable
            size="small"
            rowKey={(r) => r.id}
            loading={false}
            dataSource={tableData}
            pagination={loading ? false : { pageSize: 12, showSizeChanger: false }}
            columns={columns}
            onRow={(row) =>
              row.__skeleton
                ? {}
                : {
                    onClick: (e) => {
                      const t = e.target;
                      if (t.closest("button") || t.closest(".ant-dropdown")) return;
                      onEditCampaign(row.id);
                    },
                    style: { cursor: "pointer" },
                  }
            }
          />
        )}
      </MarketingTableSection>
    </Panel>
  );
}
