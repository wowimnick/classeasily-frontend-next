"use client";

import { useCallback, useMemo, useState } from "react";
import { CopyOutlined } from "@ant-design/icons";
import { Button, Divider, Drawer, Space, Typography, Tag, message } from "antd";
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
  return {
    ok: true,
    detail: `Ready to send (${n} option${n === 1 ? "" : "s"}, slots 1–${n} filled).`,
  };
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
  const [pendingAddSlot, setPendingAddSlot] = useState(null);
  const [sending, setSending] = useState(false);

  const consumePendingSlot = useCallback(() => setPendingAddSlot(null), []);

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
      message.success("Copied!", 1.5);
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

  const drawerExtra =
    shortlist && previewHref ? (
      <Button href={previewHref} target="_blank" rel="noopener noreferrer" onClick={handlePreviewClick}>
        Preview layout
      </Button>
    ) : null;

  return (
    <Drawer
      width="min(880px, 100vw)"
      open={open && !!inquiryRow}
      onClose={onClose}
      title={inquiryRow?.company_name || "Inquiry"}
      extra={drawerExtra}
      styles={{ body: { paddingTop: 12 } }}
      footer={null}
    >
      {inquiryRow ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Inquiry
            </Text>
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 15 }}>
                {inquiryRow.contact_name}
              </Text>{" "}
              <Text type="secondary">&lt;{inquiryRow.email}&gt;</Text>
            </div>
            {inquiryRow.phone ? (
              <div style={{ marginTop: 6 }}>
                <Text type="secondary">Phone · </Text>
                <Text>{inquiryRow.phone}</Text>
              </div>
            ) : null}
            {inquiryRow.company_size ? (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">Company size · </Text>
                <Text>{inquiryRow.company_size}</Text>
              </div>
            ) : null}
            <Paragraph style={{ whiteSpace: "pre-wrap", marginTop: 12, marginBottom: 8 }}>
              {inquiryRow.message || "—"}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Submitted{" "}
              {inquiryRow.created_at ? dayjs(inquiryRow.created_at).format("MMM D, YYYY h:mm A") : "—"}
            </Text>
          </div>

          {!shortlist && !slLoading ? (
            <Button type="primary" onClick={createShortlist}>
              Create shortlist for this inquiry
            </Button>
          ) : null}

          {shortlist ? (
            <>
              <Divider style={{ margin: "8px 0" }} />
              {shortlist.sent_at ? (
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                  Shortlist sent {dayjs(shortlist.sent_at).format("MMM D, YYYY h:mm A")}
                </Text>
              ) : null}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                  Customer link
                </Text>
                <Space wrap align="start">
                  <Text code style={{ wordBreak: "break-all", maxWidth: "100%" }}>
                    {publicShortlistUrl || "Set NEXT_PUBLIC_SITE_URL for accurate links"}
                  </Text>
                  <Button icon={<CopyOutlined />} onClick={copyLink}>
                    Copy link
                  </Button>
                </Space>
              </div>
              <Divider style={{ margin: "16px 0" }} />
              <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Slots
              </Text>
              <Space wrap style={{ marginTop: 8, marginBottom: 4 }}>
                {[1, 2, 3].map((p) => {
                  const opts = (shortlist.options || []).filter((o) => !o.is_archived);
                  const hit = opts.find((o) => o.position === p);
                  if (hit) {
                    return (
                      <Tag key={p} style={{ margin: 0 }}>
                        Slot {p}: {hit.title?.slice?.(0, 28) || "Filled"}
                      </Tag>
                    );
                  }
                  return (
                    <Button key={p} size="small" onClick={() => setPendingAddSlot(p)}>
                      Empty slot {p} — add class
                    </Button>
                  );
                })}
              </Space>
              <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginTop: 12 }}>
                Compose shortlist
              </Text>
              {slLoading ? (
                <Text type="secondary">Loading shortlist…</Text>
              ) : (
                <ShortlistComposer
                  shortlist={shortlist}
                  onRefresh={onRefreshShortlist}
                  pendingOpenSlot={pendingAddSlot}
                  onConsumedPendingSlot={consumePendingSlot}
                  publicShortlistUrl={publicShortlistUrl}
                  previewHref={previewHref}
                  onSend={handleSend}
                  sending={sending}
                />
              )}
            </>
          ) : slLoading ? (
            <Text type="secondary">Loading…</Text>
          ) : null}
        </Space>
      ) : null}
    </Drawer>
  );
}
