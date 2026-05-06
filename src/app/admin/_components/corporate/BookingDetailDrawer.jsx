"use client";

import { useEffect, useState } from "react";
import { Button, Drawer, InputNumber, Space, Timeline, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { corporateAdminService } from "@/services/adminDash";
import MoneyChip from "./MoneyChip";
import StatusPill from "./StatusPill";

const { Text, Title } = Typography;

export default function BookingDetailDrawer({ open, bookingId, onClose, onInvoiceIssued }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dueDays, setDueDays] = useState(15);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!open || !bookingId) {
      setBooking(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await corporateAdminService.getBooking(bookingId);
        if (!cancelled) setBooking(res.data);
      } catch (e) {
        message.error(e?.response?.data?.detail || "Could not load booking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, bookingId]);

  const issueInvoice = async () => {
    if (!bookingId) return;
    setIssuing(true);
    try {
      await corporateAdminService.issueInvoice(bookingId, { due_in_days: dueDays });
      message.success("Balance invoice issued");
      const res = await corporateAdminService.getBooking(bookingId);
      setBooking(res.data);
      onInvoiceIssued?.();
    } catch (e) {
      message.error(e?.response?.data?.detail || "Could not issue invoice");
    } finally {
      setIssuing(false);
    }
  };

  const copyText = async (label, val) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      message.success(`${label} copied`);
    } catch {
      message.error("Could not copy");
    }
  };

  return (
    <Drawer
      width={640}
      open={open && !!bookingId}
      onClose={onClose}
      title={booking ? booking.reference : "Booking"}
    >
      {loading ? (
        <Text type="secondary">Loading…</Text>
      ) : booking ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={5} style={{ marginTop: 0 }}>
              {booking.company_name || "—"}
            </Title>
            <Space wrap>
              <StatusPill kind="booking" value={booking.status} />
              <Text type="secondary">Ref {booking.reference}</Text>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Text>Total </Text>
              <MoneyChip cents={booking.total_cents} currency={booking.currency} />
            </div>
          </div>

          <div>
            <Title level={5}>Money</Title>
            <Space direction="vertical">
              <Text>
                Deposit: <MoneyChip cents={booking.deposit_cents} currency={booking.currency} />
                {booking.deposit_paid_at
                  ? ` · ${dayjs(booking.deposit_paid_at).format("MMM D, YYYY h:mm A")}`
                  : ""}
              </Text>
              <Text>
                Balance: <MoneyChip cents={booking.balance_cents} currency={booking.currency} />
              </Text>
              <Text type="secondary">Invoice status: {booking.invoice_status || "—"}</Text>
              {booking.invoice_url ? (
                <a href={booking.invoice_url} target="_blank" rel="noreferrer">
                  Open Stripe invoice
                </a>
              ) : null}
              {booking.invoice_due_at ? (
                <Text type="secondary">
                  Due {dayjs(booking.invoice_due_at).format("MMM D, YYYY")}
                </Text>
              ) : null}
              {booking.balance_paid_at ? (
                <Text type="secondary">
                  Balance paid {dayjs(booking.balance_paid_at).format("MMM D, YYYY h:mm A")}
                </Text>
              ) : null}
            </Space>
          </div>

          <div>
            <Title level={5}>Stripe references</Title>
            <Space direction="vertical">
              {booking.deposit_payment_intent_id ? (
                <Space>
                  <Text code style={{ fontSize: 12 }}>
                    PI {booking.deposit_payment_intent_id}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyText("Payment intent", booking.deposit_payment_intent_id)}
                  />
                </Space>
              ) : null}
              {booking.stripe_invoice_id ? (
                <Space>
                  <Text code style={{ fontSize: 12 }}>
                    {booking.stripe_invoice_id}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyText("Invoice id", booking.stripe_invoice_id)}
                  />
                </Space>
              ) : null}
            </Space>
          </div>

          <div>
            <Title level={5}>Timeline</Title>
            {(booking.events || []).length ? (
              <Timeline
                items={(booking.events || []).map((ev) => ({
                  children: (
                    <div>
                      <Text strong>{ev.event_type}</Text>
                      <div style={{ color: "#64748b", fontSize: 13 }}>{ev.message}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {ev.created_at ? dayjs(ev.created_at).format("MMM D, YYYY h:mm A") : ""}
                        {ev.created_by_email ? ` · ${ev.created_by_email}` : ""}
                      </Text>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Text type="secondary">No events yet.</Text>
            )}
          </div>

          <div>
            <Title level={5}>Actions</Title>
            <Space wrap align="center">
              <Text>Due in</Text>
              <InputNumber min={1} max={90} value={dueDays} onChange={(v) => setDueDays(v || 15)} />
              <Text>days</Text>
              <Button
                type="primary"
                loading={issuing}
                disabled={booking.status !== "deposit_paid" || !!booking.stripe_invoice_id}
                onClick={issueInvoice}
              >
                Issue balance invoice
              </Button>
            </Space>
            {booking.status !== "deposit_paid" ? (
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Available once deposit is paid and no invoice exists yet.
              </Text>
            ) : null}
          </div>
        </Space>
      ) : (
        <Text type="secondary">No data.</Text>
      )}
    </Drawer>
  );
}
