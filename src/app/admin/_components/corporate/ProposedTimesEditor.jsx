"use client";

import { useMemo, useState } from "react";
import { Button, DatePicker, Modal, Space, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

function normalizeTime(t) {
  if (t == null) return "";
  if (typeof t === "string") return t.length >= 8 ? t.slice(0, 8) : t;
  return String(t);
}

/** Collect concrete date+time slots from admin class detail (`/admin/classes/:id/`). */
export function extractScheduleSlotSuggestions(classDetail) {
  if (!classDetail?.options) return [];
  const out = [];
  const seen = new Set();
  const pushIso = (dateRaw, timeRaw) => {
    if (!dateRaw || timeRaw == null) return;
    const d = typeof dateRaw === "string" ? dateRaw : "";
    const t = normalizeTime(timeRaw);
    if (!d || !t) return;
    const combined = dayjs(`${d}T${t}`);
    if (!combined.isValid()) return;
    const iso = combined.toISOString();
    if (seen.has(iso)) return;
    seen.add(iso);
    out.push({
      iso,
      label: combined.format("ddd, MMM D, YYYY h:mm A"),
    });
  };

  for (const opt of classDetail.options) {
    for (const sch of opt.schedules || []) {
      if (sch.date) pushIso(sch.date, sch.time);
      for (const inst of sch.instances || []) {
        if (inst.date) pushIso(inst.date, inst.time);
      }
    }
  }

  out.sort((a, b) => a.iso.localeCompare(b.iso));
  return out;
}

function TimeRow({ iso, onRemove, onEdit, disabled }) {
  const label = dayjs(iso).isValid() ? dayjs(iso).format("ddd, MMM D, YYYY h:mm A") : iso;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <Text style={{ fontSize: 14 }}>{label}</Text>
      <Space size={6}>
        <Button type="link" size="small" disabled={disabled} onClick={() => onEdit(iso)}>
          Edit
        </Button>
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          disabled={disabled}
          onClick={() => onRemove(iso)}
          aria-label="Remove time"
        />
      </Space>
    </div>
  );
}

/**
 * Controlled list of ISO datetimes for `proposed_date_options`.
 * @param {string[]} value
 * @param {(next: string[]) => void} onChange
 * @param {object | null} classDetail - optional `/admin/classes/:id/` payload for “pull from schedules”
 */
export default function ProposedTimesEditor({ value, onChange, classDetail, disabled }) {
  const list = Array.isArray(value) ? value : [];
  const [modalMode, setModalMode] = useState(null);
  const [pickerVal, setPickerVal] = useState(() => dayjs());
  const [editTarget, setEditTarget] = useState(null);
  const [pullOpen, setPullOpen] = useState(false);

  const suggestions = useMemo(() => extractScheduleSlotSuggestions(classDetail), [classDetail]);

  const suggestionsToAdd = useMemo(
    () => suggestions.filter((s) => !list.includes(s.iso)),
    [suggestions, list],
  );

  const openAdd = () => {
    setPickerVal(dayjs());
    setEditTarget(null);
    setModalMode("add");
  };

  const openEdit = (iso) => {
    setEditTarget(iso);
    setPickerVal(dayjs(iso).isValid() ? dayjs(iso) : dayjs());
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
  };

  const commitPicker = () => {
    if (!pickerVal || !pickerVal.isValid()) {
      closeModal();
      return;
    }
    const iso = pickerVal.toISOString();
    if (modalMode === "edit" && editTarget) {
      const next = list.map((x) => (x === editTarget ? iso : x));
      onChange([...new Set(next)].sort((a, b) => a.localeCompare(b)));
    } else if (modalMode === "add") {
      if (!list.includes(iso)) {
        onChange([...list, iso].sort((a, b) => a.localeCompare(b)));
      }
    }
    closeModal();
  };

  const remove = (iso) => {
    onChange(list.filter((x) => x !== iso));
  };

  const appendFromSuggestions = (isos) => {
    const set = new Set(list);
    isos.forEach((s) => set.add(s));
    onChange([...set].sort((a, b) => a.localeCompare(b)));
    setPullOpen(false);
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 10 }}>
        <Button type="default" icon={<PlusOutlined />} disabled={disabled} onClick={openAdd}>
          Add time
        </Button>
        <Button
          type="default"
          icon={<CalendarOutlined />}
          disabled={disabled || !classDetail || suggestions.length === 0}
          onClick={() => setPullOpen(true)}
        >
          Pull from class schedules
        </Button>
      </Space>
      {list.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 13 }}>
          No proposed times yet. Customers will see a warning until you add at least one.
        </Text>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          {list.map((iso) => (
            <TimeRow
              key={iso}
              iso={iso}
              disabled={disabled}
              onRemove={remove}
              onEdit={openEdit}
            />
          ))}
        </Space>
      )}

      <Modal
        title={modalMode === "edit" ? "Edit time" : "Add time"}
        open={modalMode != null}
        onOk={commitPicker}
        onCancel={closeModal}
        okText="Save"
        destroyOnClose
      >
        <DatePicker
          showTime
          style={{ width: "100%", marginTop: 8 }}
          value={pickerVal}
          onChange={(v) => setPickerVal(v)}
          format="MMM D, YYYY h:mm A"
        />
      </Modal>

      <Modal
        title="Add times from class schedules"
        open={pullOpen}
        onCancel={() => setPullOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        {suggestionsToAdd.length === 0 ? (
          <Text type="secondary">All suggested slots are already added, or none are available.</Text>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            {suggestionsToAdd.map((s) => (
              <div
                key={s.iso}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text>{s.label}</Text>
                <Button type="link" size="small" onClick={() => appendFromSuggestions([s.iso])}>
                  Add
                </Button>
              </div>
            ))}
            <Button
              type="primary"
              block
              style={{ marginTop: 8 }}
              onClick={() => appendFromSuggestions(suggestionsToAdd.map((s) => s.iso))}
            >
              Add all
            </Button>
          </Space>
        )}
      </Modal>
    </div>
  );
}
