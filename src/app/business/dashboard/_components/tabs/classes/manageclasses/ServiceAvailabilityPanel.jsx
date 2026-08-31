"use client";

import React, { useEffect, useState } from "react";
import { Button, Form, InputNumber, Switch, TimePicker } from "antd";
import dayjs from "dayjs";
import { businessClassService } from "@/services/apiService";
import message from "@/lib/message";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/**
 * Appointment availability controls on the service detail page.
 * Saves service-level slot settings plus optional custom hours.
 */
export default function ServiceAvailabilityPanel({ classId, classData, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [customHours, setCustomHours] = useState(false);
  const [windows, setWindows] = useState(
    WEEKDAYS.map((d) => ({
      weekday: d,
      is_closed: false,
      start: dayjs("09:00", "HH:mm"),
      end: dayjs("17:00", "HH:mm"),
    })),
  );

  useEffect(() => {
    if (!classData) return;
    form.setFieldsValue({
      slot_interval_minutes: classData.slot_interval_minutes ?? 30,
      buffer_before_minutes: classData.buffer_before_minutes ?? 0,
      buffer_after_minutes: classData.buffer_after_minutes ?? 0,
      max_concurrent: classData.max_concurrent ?? 1,
      min_notice_hours: classData.min_notice_hours ?? 2,
      max_advance_days: classData.max_advance_days ?? 60,
    });
  }, [classData, form]);

  useEffect(() => {
    if (!classId) return;
    businessClassService.getAvailabilityWindows(classId).then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) return;
      setCustomHours(true);
      const byDay = Object.fromEntries(rows.map((r) => [r.weekday, r]));
      setWindows(
        WEEKDAYS.map((d) => {
          const row = byDay[d];
          return {
            weekday: d,
            is_closed: row ? !!row.is_closed : true,
            start: row?.start_time ? dayjs(row.start_time, "HH:mm:ss") : dayjs("09:00", "HH:mm"),
            end: row?.end_time ? dayjs(row.end_time, "HH:mm:ss") : dayjs("17:00", "HH:mm"),
          };
        }),
      );
    });
  }, [classId]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const patch = await businessClassService.updateClass(classId, values);
      if (!patch.success) {
        message.error("Could not save availability settings");
        return;
      }
      if (customHours) {
        const payload = windows
          .filter((w) => !w.is_closed)
          .map((w) => ({
            weekday: w.weekday,
            start_time: w.start.format("HH:mm:ss"),
            end_time: w.end.format("HH:mm:ss"),
            is_closed: false,
          }));
        const winRes = await businessClassService.putAvailabilityWindows(classId, payload);
        if (!winRes.success) {
          message.error("Saved settings, but custom hours failed");
          return;
        }
      } else {
        await businessClassService.putAvailabilityWindows(classId, []);
      }
      message.success("Availability saved");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        Appointment slots are generated from your business hours unless you set custom hours
        here. Buffers, notice, and concurrency apply to every open slot.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item name="slot_interval_minutes" label="Slot interval (minutes)">
          <InputNumber min={5} max={240} step={5} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="buffer_before_minutes" label="Buffer before (minutes)">
          <InputNumber min={0} max={180} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="buffer_after_minutes" label="Buffer after (minutes)">
          <InputNumber min={0} max={180} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="max_concurrent" label="How many can be booked at the same time">
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="min_notice_hours" label="Minimum notice (hours)">
          <InputNumber min={0} max={168} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="max_advance_days" label="Book up to (days in advance)">
          <InputNumber min={1} max={365} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 12px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Custom hours</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Override business hours for this service only</div>
        </div>
        <Switch checked={customHours} onChange={setCustomHours} />
      </div>
      {customHours &&
        windows.map((w, i) => (
          <div
            key={w.weekday}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Switch
              size="small"
              checked={!w.is_closed}
              onChange={(open) =>
                setWindows((prev) =>
                  prev.map((row, idx) => (idx === i ? { ...row, is_closed: !open } : row)),
                )
              }
            />
            <span style={{ width: 88, fontSize: 13 }}>{LABELS[w.weekday]}</span>
            {!w.is_closed && (
              <TimePicker.RangePicker
                value={[w.start, w.end]}
                format="h:mm A"
                use12Hours
                onChange={(vals) => {
                  if (!vals?.[0] || !vals?.[1]) return;
                  setWindows((prev) =>
                    prev.map((row, idx) =>
                      idx === i ? { ...row, start: vals[0], end: vals[1] } : row,
                    ),
                  );
                }}
              />
            )}
          </div>
        ))}
      <Button type="primary" loading={saving} onClick={handleSave} style={{ marginTop: 12 }}>
        Save availability
      </Button>
    </div>
  );
}
