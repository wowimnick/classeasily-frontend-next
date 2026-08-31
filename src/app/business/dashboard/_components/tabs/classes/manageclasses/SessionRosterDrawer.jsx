"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Empty, Select, Tag } from "antd";
import dayjs from "dayjs";
import {
  bookingService,
  businessStaffService,
  scheduleService,
} from "@/services/apiService";
import message from "@/lib/message";
import styled from "styled-components";
import DashboardDrawer from "../../../shared/DashboardDrawer";
import { confirmDestructive } from "../../../shared/confirmDestructive";
import { dash } from "../../../shared/dashboardTokens";

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid ${dash.color.hairline};
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
    confirmDestructive({
      title: "Cancel this session?",
      content: recurring
        ? "This session is part of a series. Choose whether to cancel only this one or this and all following."
        : "Confirmed bookings will be cancelled.",
      okText: "Cancel session",
      recurring,
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
      onThis: async () => {
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
      onFollowing: async () => {
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
      },
    });
  };

  if (!session) return null;

  const when = `${dayjs(session.date).format("ddd, MMM D")} · ${dayjs(
    `${session.date}T${String(session.time || "00:00").slice(0, 5)}`,
  ).format("h:mm A")}`;
  const spots = `${session.current_bookings_count || 0} / ${session.maxParticipants || session.max_participants || "—"}`;

  return (
    <DashboardDrawer
      open={open}
      onClose={onClose}
      title={session.className || session.class_name || "Session"}
      subtitle={`${when} · ${spots} booked`}
      footer={(
        <>
          <Button onClick={() => onEdit?.(session)} style={{ flex: 1 }}>
            Edit session
          </Button>
          <Button danger onClick={confirmCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
        </>
      )}
    >
      <div style={{ fontSize: 12, color: dash.color.ash, marginBottom: 4 }}>Assigned staff</div>
      <Select
        allowClear
        placeholder="Unassigned"
        style={{ width: "100%", marginBottom: 16 }}
        value={staffId || undefined}
        onChange={handleAssign}
        options={staff.map((s) => ({
          value: s.id,
          label: s.user_name || s.full_name || s.name || s.user_email || "Staff",
        }))}
      />
      {loading ? (
        <p style={{ color: dash.color.ash }}>Loading roster…</p>
      ) : bookings.length === 0 ? (
        <Empty description="No bookings yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        bookings.map((b) => (
          <Row key={b.id}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: dash.color.ink }}>
                {b.user_name || "Client"}
              </div>
              <div style={{ fontSize: 12, color: dash.color.ash }}>{b.user_email}</div>
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
    </DashboardDrawer>
  );
}
