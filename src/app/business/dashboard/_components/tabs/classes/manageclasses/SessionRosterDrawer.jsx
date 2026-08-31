"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Empty, Modal, Select, Tag } from "antd";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import dayjs from "dayjs";
import {
  bookingService,
  businessStaffService,
  scheduleService,
} from "@/services/apiService";
import message from "@/lib/message";
import styled from "styled-components";

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(${VAUL_OVERLAY_BACKDROP_BLUR});
  z-index: 1048;
`;

const Content = styled(Drawer.Content)`
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(420px, 100vw);
  background: #fff;
  z-index: 1049;
  display: flex;
  flex-direction: column;
  outline: none;
  box-shadow: -8px 0 32px rgba(15, 23, 42, 0.12);
`;

const Header = styled.div`
  padding: 20px 20px 12px;
  border-bottom: 1px solid #f1f5f9;
`;

const Title = styled.h2`
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 650;
`;

const Meta = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 13px;
`;

const Body = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px 20px 24px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
`;

function attendanceColor(value) {
  if (value === "attended") return "green";
  if (value === "no_show") return "red";
  return "default";
}

export default function SessionRosterDrawer({
  open,
  session,
  onClose,
  onEdit,
  onChanged,
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState(null);

  const load = useCallback(async () => {
    if (!session?.id) return;
    setLoading(true);
    const res = await bookingService.fetchBusinessBookings({
      instance_id: session.id,
      page_size: 100,
    });
    const rows = res.data?.results || res.data || [];
    setBookings(Array.isArray(rows) ? rows : []);
    setLoading(false);
  }, [session?.id]);

  useEffect(() => {
    if (!open) return;
    load();
    setStaffId(session?.assigned_staff_id || null);
    businessStaffService.getStaff().then((res) => {
      const rows = res.data || [];
      setStaff(Array.isArray(rows) ? rows.filter((s) => s.status === "accepted" || !s.status) : []);
    });
  }, [open, load, session?.assigned_staff_id]);

  const mark = async (bookingId, attendance) => {
    const res = await bookingService.markAttendance(bookingId, attendance);
    if (res.success) {
      message.success(attendance === "attended" ? "Marked attended" : "Marked no-show");
      load();
      onChanged?.();
    } else {
      message.error("Could not update attendance");
    }
  };

  const handleAssign = async (id) => {
    setStaffId(id);
    const res = await scheduleService.assignStaff(session.id, id || null);
    if (res.success) {
      message.success(id ? "Staff assigned" : "Staff cleared");
      onChanged?.();
    }
  };

  const confirmCancel = () => {
    const recurring = !!session?.recurrence_rule_id;
    Modal.confirm({
      title: "Cancel this session?",
      content: recurring
        ? "This session is part of a series. Choose whether to cancel only this one or this and all following."
        : "Confirmed bookings will be cancelled.",
      okText: recurring ? "This session only" : "Cancel session",
      okButtonProps: { danger: true },
      cancelText: recurring ? "This and following" : "Keep",
      onOk: async () => {
        const res = await scheduleService.editSessionScope(session.id, {
          action: "delete",
          scope: "this",
          reason: "Cancelled by business",
        });
        if (res.success) {
          message.success("Session cancelled");
          onChanged?.();
          onClose?.();
        }
      },
      onCancel: recurring
        ? async () => {
            const res = await scheduleService.editSessionScope(session.id, {
              action: "delete",
              scope: "following",
              reason: "Cancelled by business",
            });
            if (res.success) {
              message.success("This and following sessions cancelled");
              onChanged?.();
              onClose?.();
            }
          }
        : undefined,
    });
  };

  if (!session) return null;

  const when = `${dayjs(session.date).format("ddd, MMM D")} · ${dayjs(
    `${session.date}T${String(session.time || "00:00").slice(0, 5)}`,
  ).format("h:mm A")}`;
  const spots = `${session.current_bookings_count || 0} / ${session.maxParticipants || session.max_participants || "—"}`;

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose?.()} direction="right">
      <Drawer.Portal>
        <Overlay />
        <Content>
          <Header>
            <Title>{session.className || session.class_name || "Session"}</Title>
            <Meta>
              {when} · {spots} booked
            </Meta>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Assigned staff</div>
              <Select
                allowClear
                placeholder="Unassigned"
                style={{ width: "100%" }}
                value={staffId || undefined}
                onChange={handleAssign}
                options={staff.map((s) => ({
                  value: s.id,
                  label: s.user_name || s.full_name || s.name || s.user_email || "Staff",
                }))}
              />
            </div>
          </Header>
          <Body>
            {loading ? (
              <p style={{ color: "#64748b" }}>Loading roster…</p>
            ) : bookings.length === 0 ? (
              <Empty description="No bookings yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              bookings.map((b) => (
                <Row key={b.id}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {b.user_name || "Client"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{b.user_email}</div>
                    <Tag color={attendanceColor(b.attendance)} style={{ marginTop: 6 }}>
                      {(b.attendance || "pending").replace("_", " ")}
                    </Tag>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Button size="small" onClick={() => mark(b.id, "attended")}>
                      Attended
                    </Button>
                    <Button size="small" danger onClick={() => mark(b.id, "no_show")}>
                      No-show
                    </Button>
                  </div>
                </Row>
              ))
            )}
          </Body>
          <div style={{ padding: 16, borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
            <Button onClick={() => onEdit?.(session)} style={{ flex: 1 }}>
              Edit session
            </Button>
            <Button danger onClick={confirmCancel} style={{ flex: 1 }}>
              Cancel
            </Button>
          </div>
        </Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
