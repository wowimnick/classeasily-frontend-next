"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyOutlined } from "@ant-design/icons";
import { Button, Drawer, Space, Tabs, Typography, message } from "antd";
import dayjs from "dayjs";
import { corporateAdminService } from "@/services/adminDash";
import ShortlistComposer from "./ShortlistComposer";

const { Text, Paragraph } = Typography;

function validateShortlistReady(sl) {
  const opts = (sl.options || []).filter((o) => !o.is_archived);
  const n = opts.length;
  if (n < 1 || n > 3) {
    return { ok: false, detail: "Add 1–3 options before sending." };
  }
  const sorted = [...opts].sort((a, b) => a.position - b.position);
  const positions = sorted.map((o) => o.position).sort((a, b) => a - b);
  const expected = Array.from({ length: n }, (_, i) => i + 1);
  const ok = positions.length === n && positions.every((p, i) => p === expected[i]);
  if (!ok) {
    return { ok: false, detail: "Options must have positions 1…N with no gaps." };
  }
  return { ok: true, detail: "Ready to send." };
}

export default function InquiryDetailDrawer({
  open,
  inquiryRow,
  shortlist,
  slLoading,
  onClose,
  onRefreshShortlist,
  onShortlistCreated,
}) {
  const [tab, setTab] = useState("inquiry");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setTab("inquiry");
  }, [open, inquiryRow?.id]);

  const siteBase = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || "";
    return raw.replace(/\/$/, "");
  }, []);

  const publicShortlistUrl = shortlist
    ? `${siteBase || (typeof window !== "undefined" ? window.location.origin : "")}/corporate/shortlist/${shortlist.token}`
    : "";

  const validation = shortlist ? validateShortlistReady(shortlist) : { ok: false, detail: "Create a shortlist first." };

  const sendBlockedStatuses = ["sent", "viewed", "accepted"];
  const sendDisabled =
    !shortlist || sending || !validation.ok || sendBlockedStatuses.includes(shortlist.status);

  const sendTooltip = !shortlist
    ? "Create a shortlist first"
    : !validation.ok
      ? validation.detail
      : sendBlockedStatuses.includes(shortlist.status)
        ? "Already sent to customer"
        : "";

  const handleSend = async () => {
    if (!shortlist) return;
    setSending(true);
    try {
      await corporateAdminService.sendShortlist(shortlist.id);
      message.success("Shortlist sent — customer email queued.");
      await onRefreshShortlist();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not send shortlist");
    } finally {
      setSending(false);
    }
  };

  const copyLink = useCallback(async () => {
    if (!publicShortlistUrl) return;
    try {
      await navigator.clipboard.writeText(publicShortlistUrl);
      message.success("Link copied");
    } catch {
      message.error("Could not copy");
    }
  }, [publicShortlistUrl]);

  const createShortlist = async () => {
    if (!inquiryRow) return;
    try {
      const res = await corporateAdminService.createShortlistForInquiry(inquiryRow.id, {
        intro_message: "",
        deposit_percent: 25,
      });
      message.success("Shortlist created");
      if (onShortlistCreated) await onShortlistCreated(res.data);
      else await onRefreshShortlist();
      setTab("compose");
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not create shortlist");
    }
  };

  const previewHref =
    shortlist?.id != null
      ? `/admin/corporate-inquiries/preview/${shortlist.id}`
      : undefined;

  const handlePreviewClick = (e) => {
    if (!shortlist?.id) return;
    const opts = (shortlist.options || []).filter((o) => !o.is_archived);
    if (opts.length < 1) {
      e.preventDefault();
      message.warning("Add at least one option before preview.");
    }
  };

  return (
    <Drawer
      width={760}
      open={open && !!inquiryRow}
      onClose={onClose}
      title={inquiryRow?.company_name || "Inquiry"}
      footer={
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text type={validation.ok ? "success" : "secondary"}>{validation.detail}</Text>
          <Button
            type="primary"
            loading={sending}
            disabled={sendDisabled}
            onClick={handleSend}
            title={sendTooltip}
            block
          >
            Send shortlist email
          </Button>
        </Space>
      }
    >
      {inquiryRow ? (
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: "inquiry",
              label: "Inquiry",
              children: (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <div>
                    <Text strong>{inquiryRow.contact_name}</Text>{" "}
                    <Text type="secondary">&lt;{inquiryRow.email}&gt;</Text>
                  </div>
                  {inquiryRow.phone ? (
                    <Text>
                      Phone: {inquiryRow.phone}
                    </Text>
                  ) : null}
                  {inquiryRow.company_size ? (
                    <Text>Company size: {inquiryRow.company_size}</Text>
                  ) : null}
                  <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                    {inquiryRow.message || "—"}
                  </Paragraph>
                  <Text type="secondary">
                    Created {inquiryRow.created_at ? dayjs(inquiryRow.created_at).format("MMM D, YYYY h:mm A") : "—"}
                  </Text>
                  {!shortlist && !slLoading ? (
                    <Button type="primary" onClick={createShortlist}>
                      Create shortlist
                    </Button>
                  ) : null}
                  {shortlist ? (
                    <Space wrap align="start">
                      <div>
                        <Text type="secondary">Customer link</Text>
                        <div>
                          <Text code style={{ wordBreak: "break-all" }}>
                            {publicShortlistUrl || "Set NEXT_PUBLIC_SITE_URL for accurate links"}
                          </Text>
                        </div>
                      </div>
                      <Button icon={<CopyOutlined />} onClick={copyLink}>
                        Copy link
                      </Button>
                    </Space>
                  ) : null}
                </Space>
              ),
            },
            {
              key: "compose",
              label: "Compose",
              disabled: !shortlist,
              children: slLoading ? (
                <Text type="secondary">Loading shortlist…</Text>
              ) : shortlist ? (
                <ShortlistComposer shortlist={shortlist} onRefresh={onRefreshShortlist} />
              ) : (
                <Text type="secondary">Create a shortlist first.</Text>
              ),
            },
            {
              key: "preview",
              label: "Preview",
              disabled: !shortlist,
              children: (
                <Space direction="vertical">
                  <Text>Open the exact customer layout (no emails sent).</Text>
                  <Button
                    type="primary"
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!shortlist}
                    onClick={handlePreviewClick}
                  >
                    Open business view in new tab
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      ) : null}
    </Drawer>
  );
}
