"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  TimePicker,
  Select,
  Tooltip,
  Popconfirm,
  Tag,
  Modal,
  Button,
  Dropdown,
} from "antd";
import { Drawer as VaulDrawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isBetween from "dayjs/plugin/isBetween";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  RefreshCw,
  Calendar,
  BookOpen,
  CalendarDays,
  X,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Check,
  Users,
  DollarSign,
  Repeat,
  Copy,
  AlertTriangle,
  Info,
} from "lucide-react";
import { businessClassService, businessService, scheduleService } from "@/services/apiService";
import message from "@/lib/message";

dayjs.extend(weekOfYear);
dayjs.extend(isBetween);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
/** Fallback when profile hours are missing or unusable (same as previous hard-coded grid). */
const DEFAULT_CAL_START_HOUR = 6;
const DEFAULT_CAL_END_HOUR = 22;
const HOUR_HEIGHT = 64;

const CLASS_COLORS = [
  { bg: "#fff0f2", accent: "#ff385c", text: "#991b1b" },
  { bg: "#eff6ff", accent: "#3b82f6", text: "#1e40af" },
  { bg: "#f0fdf4", accent: "#22c55e", text: "#166534" },
  { bg: "#faf5ff", accent: "#a855f7", text: "#6b21a8" },
  { bg: "#fff7ed", accent: "#f97316", text: "#9a3412" },
  { bg: "#f0fdfa", accent: "#14b8a6", text: "#134e4a" },
  { bg: "#fefce8", accent: "#eab308", text: "#713f12" },
  { bg: "#eef2ff", accent: "#6366f1", text: "#3730a3" },
];

const MINI_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DURATION_PRESETS = [30, 45, 60, 90, 120, 180];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatHour(h) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${String(h).padStart(2, "0")} AM` : `${String(h - 12).padStart(2, "0")} PM`;
}

function getWeekStart(date) {
  const d = dayjs(date);
  const day = d.day();
  const diff = day === 0 ? -6 : 1 - day;
  return d.add(diff, "day").startOf("day");
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));
}

function hourFloatFromHHMM(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().slice(0, 5).split(":");
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1] ?? "0", 10);
  if (Number.isNaN(hh)) return null;
  return hh + (Number.isNaN(mm) ? 0 : mm) / 60;
}

/** Exclusive end hour for grid rows [startHour, endHour) so a close at 17:00 includes the 5–6 PM row. */
function exclusiveEndHourFromLatestMinute(latestHourFloat) {
  if (latestHourFloat == null || Number.isNaN(latestHourFloat)) return DEFAULT_CAL_END_HOUR;
  const c = Math.min(latestHourFloat, 24);
  return Math.min(24, Math.floor(c) + 1);
}

/** Union of business-hours windows (from settings) and loaded schedules; always fits sessions. */
function buildCalendarGrid(businessHours, schedules) {
  let bizMin = null;
  let bizMax = null;
  for (const day of businessHours || []) {
    if (day?.isOpen === false) continue;
    let openStr;
    let closeStr;
    if (day?.time && Array.isArray(day.time) && day.time.length >= 2) {
      const t0 = day.time[0];
      const t1 = day.time[1];
      openStr = typeof t0 === "string" ? t0.slice(0, 5) : (t0?.format ? t0.format("HH:mm") : null);
      closeStr = typeof t1 === "string" ? t1.slice(0, 5) : (t1?.format ? t1.format("HH:mm") : null);
    } else if (day?.open && day?.close) {
      openStr = String(day.open).slice(0, 5);
      closeStr = String(day.close).slice(0, 5);
    }
    if (!openStr || !closeStr) continue;
    const openH = hourFloatFromHHMM(openStr);
    const closeH = hourFloatFromHHMM(closeStr);
    if (openH == null || closeH == null) continue;
    let closeExtent = closeH;
    if (closeExtent <= openH) closeExtent += 24;
    bizMin = bizMin === null ? openH : Math.min(bizMin, openH);
    bizMax = bizMax === null ? closeExtent : Math.max(bizMax, closeExtent);
  }

  let schedMin = null;
  let schedMax = null;
  for (const s of schedules || []) {
    const t = String(s?.time ?? "09:00").slice(0, 5);
    const start = hourFloatFromHHMM(t);
    if (start == null) continue;
    const dur = Number(s?.duration) || 60;
    const end = start + dur / 60;
    schedMin = schedMin === null ? start : Math.min(schedMin, start);
    schedMax = schedMax === null ? end : Math.max(schedMax, end);
  }

  let startHour = DEFAULT_CAL_START_HOUR;
  let endHour = DEFAULT_CAL_END_HOUR;
  if (bizMin != null && bizMax != null) {
    startHour = Math.floor(bizMin);
    endHour = exclusiveEndHourFromLatestMinute(Math.min(bizMax, 24));
  }
  if (schedMin != null) {
    startHour = Math.min(startHour, Math.floor(schedMin));
  }
  if (schedMax != null) {
    endHour = Math.max(endHour, exclusiveEndHourFromLatestMinute(Math.min(schedMax, 24)));
  }
  startHour = Math.max(0, Math.min(startHour, 23));
  endHour = Math.max(startHour + 1, Math.min(endHour, 24));
  if (endHour - startHour < 4) {
    const deficit = 4 - (endHour - startHour);
    const shrinkStart = Math.min(deficit, startHour);
    startHour -= shrinkStart;
    endHour = Math.min(24, endHour + (deficit - shrinkStart));
    if (endHour - startHour < 4) endHour = Math.min(24, startHour + 4);
  }
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;
  return { startHour, endHour, hours, totalHeight };
}

function timeToTop(timeStr, startHour) {
  const [h, m] = String(timeStr || "09:00").split(":").map(Number);
  return Math.max(0, (h - startHour + m / 60) * HOUR_HEIGHT);
}

function durationToHeight(mins) {
  return Math.max(28, ((mins || 60) / 60) * HOUR_HEIGHT);
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Returns a Map of scheduleId -> { colIndex, colCount }
function computeEventColumns(schedules) {
  if (!schedules.length) return new Map();
  const events = schedules.map(s => ({
    id: s.id,
    start: timeToMinutes(s.time),
    end: timeToMinutes(s.time) + (s.duration || 60),
  }));
  const overlap = (a, b) => a.start < b.end && a.end > b.start;

  // Greedy column assignment
  const colOf = new Map();
  for (let i = 0; i < events.length; i++) {
    const taken = new Set(
      events.slice(0, i).filter(o => overlap(events[i], o)).map(o => colOf.get(o.id))
    );
    let col = 0;
    while (taken.has(col)) col++;
    colOf.set(events[i].id, col);
  }

  // For each event, find the maximum column index in its overlap group + 1 = colCount
  const colCountOf = new Map();
  for (const e of events) {
    let max = colOf.get(e.id);
    for (const o of events) {
      if (o.id !== e.id && overlap(e, o)) max = Math.max(max, colOf.get(o.id));
    }
    colCountOf.set(e.id, max + 1);
  }

  const result = new Map();
  for (const e of events) {
    result.set(e.id, { colIndex: colOf.get(e.id), colCount: colCountOf.get(e.id) });
  }
  return result;
}

function formatTimeRange(timeStr, durationMins) {
  const [h, m] = timeStr.split(":").map(Number);
  const endTotal = h * 60 + m + (durationMins || 60);
  const eh = Math.floor(endTotal / 60) % 24;
  const em = endTotal % 60;
  const fmt = (hh, mm) => {
    const p = hh < 12 ? "AM" : "PM";
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, "0")} ${p}`;
  };
  return `${fmt(h, m)} – ${fmt(eh, em)}`;
}

function formatTimeShort(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const p = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${p}`;
}

function flattenErrorValue(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const list = Object.values(value).flat();
    return list.map((v) => (Array.isArray(v) ? v.join(", ") : String(v))).filter(Boolean).join("; ");
  }
  return String(value ?? "");
}

const getErrorMessage = (error) => {
  if (error?.errorFields?.length) return error.errorFields[0]?.errors?.[0] || "Validation error";
  const data = error?.response?.data ?? (typeof error === "object" && error !== null ? error : null);
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    const parts = Object.entries(data).map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const text = flattenErrorValue(value);
      return label && text ? `${label}: ${text}` : text;
    });
    if (parts.filter(Boolean).length) return parts.filter(Boolean).join("; ");
  }
  return error?.message || "An unexpected error occurred.";
};

// ─── ANIMATIONS ──────────────────────────────────────────────────────────────
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const spinAnim = keyframes`
  to { transform: rotate(360deg); }
`;

// ─── STYLED COMPONENTS ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  height: 100%;
  min-height: calc(100vh - 60px);
  background: #fff;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  position: relative;
`;

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = styled.div`
  width: 244px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: #fff;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
  @media (max-width: 1024px) { display: none; }
`;

const SidebarHeaderArea = styled.div`
  padding: 14px 14px 12px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SidebarHeaderIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff385c, #e11d48);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const SidebarHeaderText = styled.div`
  flex: 1;
  min-width: 0;
  .title { font-size: 13px; font-weight: 700; color: #111827; }
  .sub { font-size: 11px; color: #9ca3af; margin-top: 1px; }
`;

const SidebarSection = styled.div`
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
`;

const SidebarSectionTitle = styled.div`
  padding: 11px 14px 7px;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  &:hover { color: #374151; }
`;

const SidebarItem = styled.label`
  padding: 6px 14px 6px 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  &:hover { background: #f9fafb; }
  &:last-of-type { padding-bottom: 12px; }
`;

const ClassCheckbox = styled.input.attrs({ type: "checkbox" })`
  width: 14px;
  height: 14px;
  border-radius: 4px;
  cursor: pointer;
  accent-color: ${p => p.$accentColor};
  flex-shrink: 0;
`;

const ClassDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

const GroupTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin: 2px 6px;
  border: 1.5px solid ${p => p.$active ? "#3b82f6" : "#e5e7eb"};
  background: ${p => p.$active ? "#eff6ff" : "#f9fafb"};
  color: ${p => p.$active ? "#1d4ed8" : "#6b7280"};
  transition: all 0.15s;
  &:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
`;

// ── Mini Calendar ─────────────────────────────────────────────────────────────
const MiniCalWrapper = styled.div`
  padding: 10px 8px 14px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: #fff;
  margin: 8px;
`;

const MiniCalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 0 2px;
`;

const MiniCalTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #111827;
`;

const MiniNavBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 3px 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  &:hover { color: #111827; background: #f3f4f6; }
`;

const MiniDayLabelsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
`;

const MiniDayLabel = styled.div`
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: #c4c9d4;
  padding: 2px 0 4px;
`;

const MiniWeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-radius: 7px;
  background: ${p => p.$active ? "#eef4ff" : "transparent"};
  margin: 1px 0;
  ${p => p.$active ? `
    & > button:first-child { border-radius: 7px 0 0 7px; }
    & > button:last-child { border-radius: 0 7px 7px 0; }
  ` : ''}
`;

/* Each cell is just a circle container — the row handles the band */
const MiniDateCell = styled.button`
  aspect-ratio: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 7px;
  transition: background 0.1s;
  &:hover:not(:disabled) { background: rgba(0,0,0,0.05); }
`;

const MiniDateInner = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: ${p => p.$bold ? "700" : "400"};
  color: ${p =>
    p.$filled ? "#fff" :
    p.$ring ? "#2563eb" :
    p.$inactive ? "#d1d5db" :
    "#374151"};
  background: ${p => p.$filled ? "#3b82f6" : "transparent"};
  border: ${p => p.$ring ? "1px solid #3b82f6" : "none"};
`;

// ── Main Area ─────────────────────────────────────────────────────────────────
const MainArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.div`
  padding: 14px 20px 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #fff;
`;

const TopBarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CalendarBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 4px 6px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
  border: 1px solid #e5e7eb;
  @media (max-width: 640px) { display: none; }
`;

const CalendarBadgeMonth = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.1;
`;

const CalendarBadgeDay = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
`;

const NavGroup = styled.div`
  display: flex;
  align-items: stretch;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`;

const NavBtn = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 0;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #f9fafb; }
  &:last-of-type { border-right: none; }
`;

const StandaloneNavBtn = styled(NavBtn)`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  border-right: 1px solid #e5e7eb;
`;

const TodayBtn = styled.button`
  height: 30px;
  padding: 0 12px;
  border: none;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #f9fafb; }
`;

const ViewDropdownWrap = styled.div`
  height: 30px;
  display: flex;
  align-items: center;
  .ant-select {
    height: 30px !important;
  }
  .ant-select .ant-select-selector {
    height: 30px !important;
    min-height: 30px !important;
    padding: 0 24px 0 10px !important;
    border-radius: 8px !important;
    border: 1px solid #e5e7eb !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    align-items: center !important;
    display: flex !important;
  }
  .ant-select-single .ant-select-selector .ant-select-selection-item {
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
  }
  .ant-select-arrow { font-size: 10px !important; }
`;

const AddBtn = styled.button`
  height: 30px;
  padding: 0 14px;
  border-radius: 7px;
  border: none;
  background: linear-gradient(135deg, #ff385c, #e11d48);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255,56,92,0.3);
  transition: all 0.15s;
  &:hover { background: linear-gradient(135deg, #e11d48, #be123c); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const IconBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid ${p => p.$active ? "#3b82f6" : "#e5e7eb"};
  background: ${p => p.$active ? "#eff6ff" : "#fff"};
  color: ${p => p.$active ? "#3b82f6" : "#374151"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #93c5fd; background: #eff6ff; color: #3b82f6; }
`;

// ── Bulk Actions Bar (grid row animation avoids height:auto jank) ─────────────
const BulkBarGridWrap = styled.div`
  display: grid;
  grid-template-rows: ${(p) => (p.$open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.28s cubic-bezier(0.4, 0, 0.2, 1);
`;

const BulkBarGridInner = styled.div`
  overflow: hidden;
  min-height: 0;
`;

const BulkBar = styled.div`
  background: #1e293b;
  color: #fff;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
`;

const BulkCount = styled.span`
  font-size: 13px;
  font-weight: 600;
  flex: 1;
`;

const BulkBtn = styled.button`
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid ${p => p.$danger ? "#ef4444" : "rgba(255,255,255,0.2)"};
  background: ${p => p.$danger ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)"};
  color: ${p => p.$danger ? "#fca5a5" : "#fff"};
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: ${p => p.$danger ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.2)"};
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// ── Calendar Header Row ───────────────────────────────────────────────────────
const CalendarOuter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 0 16px 16px;
  background: #fff;
`;

const OFF_WHITE = "#fafbfc";

const CalHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 56px repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: ${OFF_WHITE};
  z-index: 5;
  padding-right: 5px;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
`;

const DayCalHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: ${OFF_WHITE};
  padding-right: 5px;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
`;

const TimezoneCell = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 6px 0 7px;
  font-size: 10px;
  color: #9ca3af;
  font-weight: 500;
  background: ${OFF_WHITE};
`;

const DayHeaderCell = styled.div`
  padding: 8px 6px;
  text-align: center;
  border-left: 1px solid #e8eaed;
  background: ${OFF_WHITE};
`;

const DayNum = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${p => p.$isToday ? "#fff" : "#111827"};
  background: ${p => p.$isToday ? "#3b82f6" : "transparent"};
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1px;
`;

const DayNameLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${p => p.$isToday ? "#3b82f6" : "#9ca3af"};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// ── Calendar Scroll / Body ────────────────────────────────────────────────────
const CalScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
`;

const CalBodyGrid = styled.div`
  display: grid;
  grid-template-columns: 56px repeat(7, minmax(0, 1fr));
  min-height: ${p => p.$minHeight}px;
  position: relative;
`;

const DayCalBodyGrid = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  min-height: ${p => p.$minHeight}px;
`;

const TimeCol = styled.div`
  background: ${OFF_WHITE};
  position: sticky;
  left: 0;
  z-index: 3;
`;

const TimeSlot = styled.div`
  height: ${HOUR_HEIGHT}px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 5px 7px 0 0;
  font-size: 10px;
  color: #9ca3af;
  font-weight: 500;
  box-sizing: border-box;
`;

const DayCol = styled.div`
  border-left: 1px solid #f3f4f6;
  position: relative;
`;

const HourLine = styled.div`
  position: absolute;
  top: ${p => p.$top}px;
  left: 0; right: 0;
  height: 1px;
  background: #f3f4f6;
  pointer-events: none;
  z-index: 1;
`;

const HalfHourLine = styled.div`
  position: absolute;
  top: ${p => p.$top}px;
  left: 0; right: 0;
  height: 1px;
  background: #fafafa;
  pointer-events: none;
  z-index: 1;
`;

const CurrentTimeLine = styled.div`
  position: absolute;
  top: ${p => p.$top}px;
  left: 0; right: 0;
  height: 2px;
  background: #ef4444;
  z-index: 4;
  pointer-events: none;
  &::before {
    content: "";
    position: absolute;
    left: -4px; top: -4px;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #ef4444;
  }
`;

const EventCardEl = styled(motion.div)`
  position: absolute;
  top: ${p => p.$top}px;
  left: ${p => p.$left ?? "3px"};
  right: ${p => p.$right ?? "3px"};
  height: ${p => Math.max(p.$height, 26)}px;
  border-radius: 7px;
  border: 1px solid ${p => p.$selected ? p.$accent : "rgba(0,0,0,0.07)"};
  background: ${p => p.$bg};
  padding: 4px 7px;
  cursor: pointer;
  overflow: hidden;
  z-index: ${p => p.$selected ? 4 : 2};
  box-sizing: border-box;
  box-shadow: ${p => p.$selected
    ? `0 0 0 2px ${p.$accent}33`
    : "0 1px 3px rgba(0,0,0,0.06)"};
  transition: box-shadow 0.12s, border-color 0.12s;
  &:hover {
    border-color: ${p => p.$accent};
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 5;
  }
`;

const EventTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${p => p.$accentText || "#111827"};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EventTimeLine = styled.div`
  font-size: 10px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 1px;
  white-space: nowrap;
`;

const EventCheckbox = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${p => p.$checked ? "#3b82f6" : "rgba(255,255,255,0.9)"};
  border: 1.5px solid ${p => p.$checked ? "#3b82f6" : "#d1d5db"};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  flex-shrink: 0;
`;

const AddHoverSlot = styled.div`
  position: absolute;
  left: 3px; right: 3px;
  height: ${HOUR_HEIGHT / 2}px;
  top: ${p => p.$top}px;
  border-radius: 6px;
  background: rgba(59,130,246,0.05);
  border: 1.5px dashed rgba(59,130,246,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  z-index: 1;
  transition: opacity 0.1s;
  &:hover { opacity: 1; }
`;

// ── Month View ────────────────────────────────────────────────────────────────
const MonthOuter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 16px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 0 16px 16px;
  background: #fff;
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-left: 1px solid #e5e7eb;
  border-top: 1px solid #e5e7eb;
`;

const MonthDayHeader = styled.div`
  border-right: 1px solid #e5e7eb;
  padding: 7px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f9fafb;
  min-width: 0;
`;

const MonthDayCell = styled.div`
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-height: 90px;
  min-width: 0;
  padding: 5px;
  background: ${p => p.$isCurrent ? "#fff" : "#fafafa"};
  cursor: pointer;
  overflow: hidden;
  &:hover { background: ${p => p.$isCurrent ? "#f9fbff" : "#f3f4f6"}; }
`;

const MonthDayNum = styled.div`
  font-size: 12px;
  font-weight: ${p => p.$isToday ? "700" : "500"};
  color: ${p => p.$isToday ? "#fff" : p.$isCurrent ? "#111827" : "#c4c9d0"};
  background: ${p => p.$isToday ? "#3b82f6" : "transparent"};
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3px;
`;

const MonthPill = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${p => p.$text};
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$accent};
  border-radius: 4px;
  padding: 2px 4px 2px 6px;
  margin-bottom: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
`;

const MonthPillContent = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MonthPillTime = styled.span`
  font-size: 9px;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
`;

const MonthPillCheck = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${p => p.$selected ? "#3b82f6" : "rgba(255,255,255,0.8)"};
  border: 1.5px solid ${p => p.$selected ? "#3b82f6" : "#d1d5db"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// ── Mobile Week (list) & Month (compact grid) ───────────────────────────────────
const WeekListOuter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  margin: 0 12px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: #fff;
  padding-bottom: 12px;
`;

const WeekListDay = styled.div`
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
`;

const WeekListDayHeader = styled.div`
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  background: #f9fafb;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WeekListDayNum = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${p => p.$isToday ? "#3b82f6" : "#e5e7eb"};
  color: ${p => p.$isToday ? "#fff" : "#374151"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
`;

const WeekListEvent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 0 8px 6px;
  border-radius: 8px;
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$accent};
  cursor: pointer;
  min-height: 44px;
  box-sizing: border-box;
`;

const WeekListEventTime = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
  min-width: 52px;
`;

const WeekListEventTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.$text};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MonthOuterMobile = styled(MonthOuter)`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const MonthGridMobile = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-width: 280px;
  border-left: 1px solid #e5e7eb;
  border-top: 1px solid #e5e7eb;
`;

const MonthDayHeaderMobile = styled(MonthDayHeader)`
  padding: 4px 2px;
  font-size: 9px;
  min-width: 0;
`;

const MonthDayCellMobile = styled(MonthDayCell)`
  min-height: 56px;
  padding: 3px;
  min-width: 0;
`;

const MonthDayNumMobile = styled(MonthDayNum)`
  width: 18px;
  height: 18px;
  font-size: 11px;
  margin-bottom: 2px;
`;

const MonthPillMobile = styled(MonthPill)`
  font-size: 9px;
  padding: 1px 3px 1px 4px;
  min-height: 16px;
  margin-bottom: 1px;
`;

// ── Schedule Form Panel ───────────────────────────────────────────────────────
const PanelOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.15);
  z-index: 1100;
  @media (max-width: 1024px) { display: none; }
`;

const FormPanel = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 1101;
  box-shadow: -6px 0 32px rgba(0,0,0,0.12);
  overflow: hidden;
  @media (max-width: 1024px) { display: none; }
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const PanelTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
`;

const PanelFooter = styled.div`
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
  background: #fff;
`;

const FieldLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const ModeToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
`;

const ModeBtn = styled.button`
  flex: 1;
  padding: 5px 0;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: ${p => p.$active ? "600" : "400"};
  color: ${p => p.$active ? "#111827" : "#6b7280"};
  background: ${p => p.$active ? "#fff" : "transparent"};
  box-shadow: ${p => p.$active ? "0 1px 3px rgba(0,0,0,0.08)" : "none"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.15s;
`;

const DurationPresets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const DurationChip = styled.button`
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid ${p => p.$active ? "#ff385c" : "#d1d5db"};
  background: ${p => p.$active ? "#fff0f2" : "#fff"};
  color: ${p => p.$active ? "#ff385c" : "#6b7280"};
  font-size: 12px;
  font-weight: ${p => p.$active ? "600" : "400"};
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1;
  &:hover { border-color: #ff385c; color: #ff385c; background: #fff5f7; }
`;

const DayPill = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid ${p => p.$active ? "#ff385c" : "#e5e7eb"};
  background: ${p => p.$active ? "#ff385c" : "#fff"};
  color: ${p => p.$active ? "#fff" : "#6b7280"};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &:hover { border-color: #ff385c; }
`;

const SaveBtn = styled.button`
  height: 34px;
  padding: 0 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #ff385c, #e11d48);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255,56,92,0.3);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: linear-gradient(135deg, #e11d48, #be123c); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const CancelBtn = styled.button`
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #f9fafb; }
`;

const DeletePanelBtn = styled.button`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  margin-right: auto;
  &:hover { background: #fee2e2; }
`;

// ── Vaul Drawer styles (mobile) ───────────────────────────────────────────────
const VaulOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1100;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const VaulContent = styled(VaulDrawer.Content)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 0;
  z-index: 1101;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  outline: none;
`;

const VaulHandle = styled(VaulDrawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0,0,0,0.15);
  border-radius: 2px;
  margin: 10px auto 0;
  flex-shrink: 0;
`;

const VaulBody = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const VaulHeader = styled.div`
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const SpinnerEl = styled.div`
  width: ${p => p.$size || 32}px;
  height: ${p => p.$size || 32}px;
  border-radius: 50%;
  border: 2.5px solid #f0f0f0;
  border-top-color: #ff385c;
  animation: ${spinAnim} 0.65s linear infinite;
  flex-shrink: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.72);
  z-index: 20;
  backdrop-filter: blur(1px);
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function InfoTip({ text }) {
  return (
    <Tooltip title={text} placement="top" mouseEnterDelay={0.3}>
      <Info size={12} style={{ color: "#9ca3af", cursor: "help", flexShrink: 0 }} />
    </Tooltip>
  );
}

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
function MiniCalendar({ viewMode, currentDate, onDateClick }) {
  const [miniMonth, setMiniMonth] = useState(() => dayjs());
  const today = dayjs();
  const startOfMonth = miniMonth.startOf("month");
  const firstWeekday = startOfMonth.day();
  const gridStart = startOfMonth.subtract(firstWeekday === 0 ? 6 : firstWeekday - 1, "day");
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));

  const selectedWeekStart = getWeekStart(currentDate);
  const selectedWeekEnd = selectedWeekStart.add(6, "day");

  // Group the 42 cells into 6 week rows
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <MiniCalWrapper>
      <MiniCalHeader>
        <MiniNavBtn onClick={() => setMiniMonth(m => m.subtract(1, "month"))}>
          <ChevronLeft size={13} />
        </MiniNavBtn>
        <MiniCalTitle>{miniMonth.format("MMMM YYYY")}</MiniCalTitle>
        <MiniNavBtn onClick={() => setMiniMonth(m => m.add(1, "month"))}>
          <ChevronRight size={13} />
        </MiniNavBtn>
      </MiniCalHeader>

      <MiniDayLabelsRow>
        {MINI_DAYS.map(d => <MiniDayLabel key={d}>{d}</MiniDayLabel>)}
      </MiniDayLabelsRow>

      {weeks.map((week, wi) => {
        const weekRowStart = getWeekStart(week[0]);
        const weekRowEnd = weekRowStart.add(6, "day");
        const isActiveWeek = viewMode === "week" && !currentDate.isBefore(weekRowStart, "day") && !currentDate.isAfter(weekRowEnd, "day");
        return (
          <MiniWeekRow key={wi} $active={isActiveWeek}>
            {week.map((date, di) => {
              const isInactive = !date.isSame(miniMonth, "month");
              const isToday = date.isSame(today, "day");
              const isFirstOfWeek = viewMode === "week" && date.isSame(selectedWeekStart, "day");
              const isLastOfWeek = viewMode === "week" && date.isSame(selectedWeekEnd, "day");
              const isSingleDaySelected = viewMode === "day" && date.isSame(currentDate, "day");
              const isSelected = isSingleDaySelected || isFirstOfWeek || isLastOfWeek;
              return (
                <MiniDateCell key={di} onClick={() => onDateClick(date)}>
                  <MiniDateInner
                    $filled={isSelected}
                    $ring={isToday && !isSelected}
                    $bold={isSelected || isToday}
                    $inactive={isInactive && !isSelected}
                  >
                    {date.date()}
                  </MiniDateInner>
                </MiniDateCell>
              );
            })}
          </MiniWeekRow>
        );
      })}
    </MiniCalWrapper>
  );
}

// ─── SIDEBAR CONTENT (reused for desktop sidebar + mobile drawer) ─────────────
function SidebarContent({
  classes, visibleClassIds, onToggleClass,
  allGroups, visibleGroups, onToggleGroup,
  myScheduleOpen, setMyScheduleOpen,
  groupsOpen, setGroupsOpen,
  viewMode, currentDate, onDateClick,
  onClose,
}) {
  const colorMap = useMemo(() => {
    const m = {};
    classes.forEach((c, i) => { m[c.classId] = CLASS_COLORS[i % CLASS_COLORS.length]; });
    return m;
  }, [classes]);

  return (
    <>
      {onClose && (
        <VaulHandle />
      )}
      {onClose && (
        <VaulHeader>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Filters</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex" }}>
            <X size={20} />
          </button>
        </VaulHeader>
      )}

      {!onClose && (
        <>
          <SidebarHeaderArea>
            <SidebarHeaderIcon><CalendarDays size={18} /></SidebarHeaderIcon>
            <SidebarHeaderText>
              <div className="title">All Schedules</div>
              <div className="sub">Calendar view</div>
            </SidebarHeaderText>
          </SidebarHeaderArea>

          <SidebarSection>
            <MiniCalendar viewMode={viewMode} currentDate={currentDate} onDateClick={onDateClick} />
          </SidebarSection>
        </>
      )}

      <SidebarSection>
        <SidebarSectionTitle onClick={() => setMyScheduleOpen(o => !o)}>
          My Experiences
          {myScheduleOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </SidebarSectionTitle>
        <AnimatePresence initial={false}>
          {myScheduleOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
              {classes.length === 0
                ? <div style={{ padding: "6px 14px 12px", fontSize: 12, color: "#9ca3af" }}>No experiences found</div>
                : classes.map((cls) => {
                  const color = colorMap[cls.classId] || CLASS_COLORS[0];
                  return (
                    <SidebarItem key={cls.classId}>
                      <ClassCheckbox
                        $accentColor={color.accent}
                        checked={visibleClassIds.has(cls.classId)}
                        onChange={() => onToggleClass(cls.classId)}
                      />
                      <ClassDot $color={color.accent} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>
                        {cls.title || "Untitled"}
                      </span>
                    </SidebarItem>
                  );
                })
              }
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarSection>

      <SidebarSection>
        <SidebarSectionTitle onClick={() => setGroupsOpen(o => !o)}>
          Groups
          {groupsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </SidebarSectionTitle>
        <AnimatePresence initial={false}>
          {groupsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden", paddingBottom: 8 }}
            >
              {allGroups.length === 0
                ? <div style={{ padding: "4px 14px 8px", fontSize: 12, color: "#9ca3af" }}>No groups yet</div>
                : (
                  <div style={{ padding: "4px 6px", display: "flex", flexWrap: "wrap" }}>
                    <GroupTag
                      $active={visibleGroups === null}
                      onClick={() => onToggleGroup(null)}
                    >
                      All
                    </GroupTag>
                    {allGroups.map(g => (
                      <GroupTag
                        key={g}
                        $active={visibleGroups !== null && visibleGroups.has(g)}
                        onClick={() => onToggleGroup(g)}
                      >
                        {g}
                      </GroupTag>
                    ))}
                  </div>
                )
              }
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarSection>
    </>
  );
}

// ─── SCHEDULE FORM PANEL ──────────────────────────────────────────────────────
function ScheduleFormPanel({ open, onClose, schedule, prefill, classes, onSuccess }) {
  const [form] = Form.useForm();
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duration, setDuration] = useState(60);
  const [selectedDays, setSelectedDays] = useState([]);
  const [times, setTimes] = useState([dayjs("09:00", "HH:mm")]);

  const isEdit = !!schedule;

  // Determine default classId
  const defaultClassId = useMemo(() => {
    if (schedule) return schedule.classId;
    if (prefill?.classId) return prefill.classId;
    if (prefill?.duplicateFrom?.classId) return prefill.duplicateFrom.classId;
    if (classes.length === 1) return classes[0].classId;
    return null;
  }, [schedule, prefill, classes]);

  const getOptionId = useCallback((classId) => {
    const cls = classes.find(c => c.classId === classId);
    return cls?.option?.optionId || cls?.options?.[0]?.optionId;
  }, [classes]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setMode("single");
      setDuration(60);
      setSelectedDays([]);
      setTimes([dayjs("09:00", "HH:mm")]);
      return;
    }

    if (isEdit && schedule) {
      setMode("single");
      setDuration(schedule.duration || 60);
      form.setFieldsValue({
        classId: schedule.classId,
        date: dayjs(schedule.date),
        time: dayjs(`${schedule.date}T${schedule.time}`),
        price: schedule.price ? parseFloat(schedule.price) : 0,
        maxParticipants: schedule.maxParticipants || 10,
        minParticipants: schedule.minParticipants || 1,
        name: schedule.name || "",
      });
    } else {
      setMode("single");
      const dup = prefill?.duplicateFrom;
      setDuration(dup ? dup.duration || 60 : 60);
      const prefillDate = prefill?.date
        ? dayjs(prefill.date)
        : dup
          ? dayjs().add(1, "day")
          : dayjs();
      const timeStr = dup?.time ? String(dup.time).slice(0, 5) : null;
      const prefillTime = prefill?.time
        ? dayjs(`2000-01-01T${String(prefill.time).slice(0, 5)}`)
        : timeStr
          ? dayjs(`2000-01-01T${timeStr}`)
          : dayjs("09:00", "HH:mm");
      form.setFieldsValue({
        classId: defaultClassId,
        date: prefillDate,
        time: prefillTime,
        price: dup ? parseFloat(dup.price) || 0 : 0,
        maxParticipants: dup?.maxParticipants ?? 10,
        minParticipants: dup?.minParticipants ?? 1,
        name: dup?.name || "",
      });
    }
  }, [open, schedule, prefill, isEdit, defaultClassId, form]);

  const handleSingle = async () => {
    try {
      const values = await form.validateFields(["classId", "date", "time", "price", "maxParticipants"]);
      setLoading(true);
      const optionId = getOptionId(values.classId);
      if (!optionId) { message.error("This experience has no option configured."); return; }
      const timeStr = values.time.format("HH:mm");
      const dateStr = values.date.format("YYYY-MM-DD");
      const priceStr = Math.max(0, parseFloat(values.price) || 0).toFixed(2);

      const payload = {
        option: optionId,
        date: dateStr,
        time: timeStr,
        duration,
        price: priceStr,
        maxParticipants: values.maxParticipants,
        minParticipants: form.getFieldValue("minParticipants") || 1,
        name: form.getFieldValue("name") || "",
      };

      if (isEdit) {
        const changed = {};
        if (payload.time !== schedule.time?.slice(0, 5)) changed.time = payload.time;
        if (payload.date !== schedule.date) changed.date = payload.date;
        if (payload.duration !== schedule.duration) changed.duration = payload.duration;
        if (payload.price !== parseFloat(schedule.price || 0).toFixed(2)) changed.price = payload.price;
        if (payload.maxParticipants !== schedule.maxParticipants) changed.maxParticipants = payload.maxParticipants;
        if (payload.minParticipants !== (schedule.minParticipants || 1)) changed.minParticipants = payload.minParticipants;
        if (payload.name !== (schedule.name || "")) changed.name = payload.name;
        if (Object.keys(changed).length === 0) { message.info("No changes to save."); return; }
        const res = await scheduleService.updateSchedule(schedule.id, changed);
        if (res.success) { message.success("Schedule updated."); onSuccess(); }
        else message.error(getErrorMessage(res.error));
      } else {
        const res = await scheduleService.createSchedule(payload);
        if (res.success) { message.success("Schedule created."); onSuccess(); }
        else message.error(getErrorMessage(res.error));
      }
    } catch (err) {
      if (err?.errorFields) return; // validation only
      message.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBulk = async () => {
    try {
      const values = await form.validateFields(["classId", "date_range", "name"]);
      if (selectedDays.length === 0) { message.error("Select at least one day."); return; }
      if (times.length === 0) { message.error("Add at least one time."); return; }
      const priceRaw = form.getFieldValue("price") || 0;
      const maxPart = form.getFieldValue("maxParticipants") || 10;
      if (!maxPart) { message.error("Set max guests."); return; }
      setLoading(true);
      const optionId = getOptionId(values.classId);
      if (!optionId) { message.error("This experience has no option configured."); return; }
      const payload = {
        option: optionId,
        name: values.name,
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        days_of_week: selectedDays.map((key) => DAYS_SHORT[DAY_KEYS.indexOf(key)]).filter(Boolean),
        times: times.map(t => t.format("HH:mm")),
        duration,
        price: Math.max(0, parseFloat(priceRaw) || 0).toFixed(2),
        maxParticipants: maxPart,
        minParticipants: form.getFieldValue("minParticipants") || 1,
      };
      const result = await scheduleService.bulkCreateSchedules(payload);
      if (result?.created_count > 0) {
        message.success(result.message || `Created ${result.created_count} schedules.`);
        onSuccess();
      } else {
        message.warning(result?.message || "No schedules created.");
      }
    } catch (err) {
      if (err?.errorFields) return;
      message.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) return;
    setDeleting(true);
    try {
      const res = await scheduleService.deleteSchedule(schedule.id);
      if (res.success) { message.success("Schedule deleted."); onSuccess(); }
      else message.error(getErrorMessage(res.error));
    } finally {
      setDeleting(false);
    }
  };

  const toggleDay = (key) => {
    setSelectedDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  };

  const handleSubmit = () => {
    if (mode === "single") handleSingle();
    else handleBulk();
  };

  const formContent = (
    <>
      {/* Class selector */}
      {classes.length > 1 && (
        <FieldGroup>
          <FieldLabel><Calendar size={13} />Experience</FieldLabel>
          <Form.Item name="classId" noStyle rules={[{ required: true, message: "Select an experience" }]}>
            <Select style={{ width: "100%" }} placeholder="Select experience" size="middle">
              {classes.map(cls => (
                <Select.Option key={cls.classId} value={cls.classId}>{cls.title || "Untitled"}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </FieldGroup>
      )}

      {/* Mode toggle (only for create) */}
      {!isEdit && (
        <ModeToggle>
          <ModeBtn $active={mode === "single"} onClick={() => setMode("single")} type="button">
            <Clock size={13} /> Single
          </ModeBtn>
          <ModeBtn $active={mode === "bulk"} onClick={() => setMode("bulk")} type="button">
            <Repeat size={13} /> Recurring
          </ModeBtn>
        </ModeToggle>
      )}

      {mode === "single" ? (
        <>
          <TwoCol>
            <FieldGroup>
              <FieldLabel>Date</FieldLabel>
              <Form.Item name="date" noStyle rules={[{ required: true, message: "Required" }]}>
                <DatePicker style={{ width: "100%" }} inputReadOnly disabledDate={d => d && d < dayjs().startOf("day")} />
              </Form.Item>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Time</FieldLabel>
              <Form.Item name="time" noStyle rules={[{ required: true, message: "Required" }]}>
                <TimePicker style={{ width: "100%" }} use12Hours format="h:mm A" minuteStep={15} inputReadOnly />
              </Form.Item>
            </FieldGroup>
          </TwoCol>
        </>
      ) : (
        <>
          <FieldGroup>
            <FieldLabel><Repeat size={13} />Group Name <span style={{ color: "#ef4444" }}>*</span><InfoTip text="Give this recurring series a name so you can find, filter, and bulk-edit all sessions together." /></FieldLabel>
            <Form.Item name="name" noStyle rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="e.g. Summer Drop-ins" />
            </Form.Item>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Date Range</FieldLabel>
            <Form.Item name="date_range" noStyle rules={[{ required: true, message: "Required" }]}>
              <DatePicker.RangePicker style={{ width: "100%" }} inputReadOnly disabledDate={d => d && d < dayjs().startOf("day")} />
            </Form.Item>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Repeat on Days<InfoTip text="Sessions will be created on every selected weekday within the date range." /></FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAY_KEYS.map((key, i) => (
                <DayPill key={key} $active={selectedDays.includes(key)} onClick={() => toggleDay(key)} type="button">
                  {DAY_LABELS_SHORT[i].slice(0, 2)}
                </DayPill>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Times<InfoTip text="Add multiple start times to create several sessions on the same days — e.g. a 9 AM and a 2 PM slot." /></FieldLabel>
            {times.map((t, idx) => (
              <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <TimePicker
                  value={t}
                  onChange={v => setTimes(prev => prev.map((x, i) => i === idx ? v : x))}
                  use12Hours format="h:mm A" minuteStep={15}
                  style={{ flex: 1 }}
                  inputReadOnly
                />
                {times.length > 1 && (
                  <button onClick={() => setTimes(p => p.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setTimes(p => [...p, dayjs("09:00", "HH:mm")])}
              style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}
              type="button"
            >
              <Plus size={13} /> Add time
            </button>
          </FieldGroup>
        </>
      )}

      {/* Duration */}
      <FieldGroup>
        <FieldLabel><Clock size={13} />Duration<InfoTip text="How long each session lasts. This affects booking slots and calendar display." /></FieldLabel>
        <DurationPresets>
          {DURATION_PRESETS.map(d => (
            <DurationChip key={d} $active={duration === d} onClick={() => setDuration(d)} type="button">
              {d < 60 ? `${d}m` : `${d / 60}h`}
            </DurationChip>
          ))}
        </DurationPresets>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <InputNumber
            min={15} max={480} step={15}
            value={duration}
            onChange={v => setDuration(v || 60)}
            style={{ width: 90 }}
            size="small"
          />
          <span style={{ fontSize: 12, color: "#6b7280" }}>minutes</span>
        </div>
      </FieldGroup>

      {/* Price & Capacity */}
      <TwoCol>
        <FieldGroup>
          <FieldLabel><DollarSign size={13} />Price<InfoTip text="Per-person booking price. Enter 0 for free sessions." /></FieldLabel>
          <Form.Item name="price" noStyle rules={[{ required: true, message: "Required" }]}>
            <InputNumber min={0} step={0.01} precision={2} prefix="$" style={{ width: "100%" }} />
          </Form.Item>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel><Users size={13} />Max Guests<InfoTip text="Maximum number of participants that can book this session." /></FieldLabel>
          <Form.Item name="maxParticipants" noStyle rules={[{ required: true, message: "Required" }]}>
            <InputNumber min={1} max={1000} style={{ width: "100%" }} />
          </Form.Item>
        </FieldGroup>
      </TwoCol>
      <TwoCol>
        <FieldGroup>
          <FieldLabel>Min Guests<InfoTip text="Minimum bookings required for the session to be confirmed. Leave blank for no minimum." /></FieldLabel>
          <Form.Item name="minParticipants" noStyle>
            <InputNumber min={1} max={1000} style={{ width: "100%" }} />
          </Form.Item>
        </FieldGroup>
        {mode === "single" && (
          <FieldGroup>
            <FieldLabel>Group Name<InfoTip text="Optionally assign this session to a group so you can filter and bulk-edit related sessions together." /></FieldLabel>
            <Form.Item name="name" noStyle>
              <Input placeholder="Optional" />
            </Form.Item>
          </FieldGroup>
        )}
      </TwoCol>
    </>
  );

  return (
    <Form form={form} layout="vertical">
      {formContent}
    </Form>
  );

  // This component renders differently based on context (desktop panel vs mobile drawer)
  // The parent handles the wrapper
}

// Shared form state hook
function useScheduleForm({ open, schedule, prefill, classes, onSuccess, onClose, moveOnly }) {
  const [form] = Form.useForm();
  const [mode, setMode] = useState("single");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duration, setDuration] = useState(60);
  const [selectedDays, setSelectedDays] = useState([]);
  const [times, setTimes] = useState([dayjs("09:00", "HH:mm")]);

  const isEdit = !!schedule;

  const getOptionId = useCallback((classId) => {
    const cls = classes.find(c => c.classId === classId);
    return cls?.option?.optionId || cls?.options?.[0]?.optionId;
  }, [classes]);

  const defaultClassId = useMemo(() => {
    if (schedule) return schedule.classId;
    if (prefill?.classId) return prefill.classId;
    if (prefill?.duplicateFrom?.classId) return prefill.duplicateFrom.classId;
    if (classes.length === 1) return classes[0].classId;
    return null;
  }, [schedule, prefill, classes]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setMode("single");
      setDuration(60);
      setSelectedDays([]);
      setTimes([dayjs("09:00", "HH:mm")]);
      return;
    }
    if (isEdit && schedule) {
      setMode("single");
      setDuration(schedule.duration || 60);
      form.setFieldsValue({
        classId: schedule.classId,
        date: dayjs(schedule.date),
        time: dayjs(`${schedule.date}T${schedule.time}`),
        price: parseFloat(schedule.price) || 0,
        maxParticipants: schedule.maxParticipants || 10,
        minParticipants: schedule.minParticipants || 1,
        name: schedule.name || "",
      });
    } else {
      setMode("single");
      const dup = prefill?.duplicateFrom;
      setDuration(dup ? dup.duration || 60 : 60);
      const timeStr = dup?.time ? String(dup.time).slice(0, 5) : null;
      form.setFieldsValue({
        classId: defaultClassId,
        date: prefill?.date
          ? dayjs(prefill.date)
          : dup
            ? dayjs().add(1, "day")
            : dayjs(),
        time: prefill?.time
          ? dayjs(`2000-01-01T${String(prefill.time).slice(0, 5)}`)
          : timeStr
            ? dayjs(`2000-01-01T${timeStr}`)
            : dayjs("09:00", "HH:mm"),
        price: dup ? parseFloat(dup.price) || 0 : 0,
        maxParticipants: dup?.maxParticipants ?? 10,
        minParticipants: dup?.minParticipants ?? 1,
        name: dup?.name || "",
      });
    }
  }, [open, schedule, prefill, isEdit, defaultClassId, form]);

  const handleSubmit = async () => {
    try {
      if (moveOnly && isEdit) {
        const values = await form.validateFields(["date", "time"]);
        setSubmitting(true);
        const timeStr = values.time.format("HH:mm");
        const dateStr = values.date.format("YYYY-MM-DD");
        const changed = {};
        if (dateStr !== schedule.date) changed.date = dateStr;
        if (timeStr !== schedule.time?.slice(0, 5)) changed.time = timeStr;
        if (Object.keys(changed).length === 0) {
          message.info("No changes.");
          return;
        }
        const res = await scheduleService.updateSchedule(schedule.id, changed);
        if (res.success) {
          message.success("Schedule moved.");
          onSuccess();
        } else message.error(getErrorMessage(res.error));
        return;
      }
      if (mode === "single") {
        const values = await form.validateFields(["classId", "date", "time", "maxParticipants", "price"]);
        setSubmitting(true);
        const optionId = getOptionId(values.classId || defaultClassId);
        if (!optionId) { message.error("This experience needs to be configured first."); return; }
        const timeStr = values.time.format("HH:mm");
        const dateStr = values.date.format("YYYY-MM-DD");
        const priceStr = Math.max(0, parseFloat(values.price) || 0).toFixed(2);
        const payload = {
          option: optionId,
          date: dateStr,
          time: timeStr,
          duration,
          price: priceStr,
          maxParticipants: values.maxParticipants,
          minParticipants: form.getFieldValue("minParticipants") || 1,
          name: form.getFieldValue("name") || "",
        };

        if (isEdit) {
          const changed = {};
          if (payload.time !== schedule.time?.slice(0, 5)) changed.time = payload.time;
          if (payload.date !== schedule.date) changed.date = payload.date;
          if (payload.duration !== schedule.duration) changed.duration = payload.duration;
          if (payload.price !== parseFloat(schedule.price || 0).toFixed(2)) changed.price = payload.price;
          if (payload.maxParticipants !== schedule.maxParticipants) changed.maxParticipants = payload.maxParticipants;
          if (payload.minParticipants !== (schedule.minParticipants || 1)) changed.minParticipants = payload.minParticipants;
          if (payload.name !== (schedule.name || "")) changed.name = payload.name;
          if (Object.keys(changed).length === 0) { message.info("No changes to save."); return; }
          const res = await scheduleService.updateSchedule(schedule.id, changed);
          if (res.success) { message.success("Schedule updated."); onSuccess(); }
          else message.error(getErrorMessage(res.error));
        } else {
          const res = await scheduleService.createSchedule(payload);
          if (res.success) { message.success("Schedule created."); onSuccess(); }
          else message.error(getErrorMessage(res.error));
        }
      } else {
        // Bulk
        const values = await form.validateFields(["classId", "date_range", "name", "maxParticipants", "price"]);
        if (selectedDays.length === 0) { message.error("Select at least one day."); return; }
        if (times.length === 0) { message.error("Add at least one time."); return; }
        setSubmitting(true);
        const optionId = getOptionId(values.classId || defaultClassId);
        if (!optionId) { message.error("This experience needs to be configured first."); return; }
        const payload = {
          option: optionId,
          name: values.name,
          start_date: values.date_range[0].format("YYYY-MM-DD"),
          end_date: values.date_range[1].format("YYYY-MM-DD"),
          days_of_week: selectedDays.map((key) => DAYS_SHORT[DAY_KEYS.indexOf(key)]).filter(Boolean),
          times: times.map(t => t.format("HH:mm")),
          duration,
          price: Math.max(0, parseFloat(values.price) || 0).toFixed(2),
          maxParticipants: values.maxParticipants,
          minParticipants: form.getFieldValue("minParticipants") || 1,
        };
        const result = await scheduleService.bulkCreateSchedules(payload);
        if (result?.created_count > 0) {
          message.success(result.message || `Created ${result.created_count} schedules.`);
          onSuccess();
        } else {
          message.warning(result?.message || "No schedules created.");
        }
      }
    } catch (err) {
      if (err?.errorFields) return;
      message.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) return;
    setDeleting(true);
    try {
      const res = await scheduleService.deleteSchedule(schedule.id);
      if (res.success) { message.success("Schedule deleted."); onSuccess(); }
      else message.error(getErrorMessage(res.error));
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const toggleDay = (key) => {
    setSelectedDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  };

  const addTime = () => setTimes(p => [...p, dayjs("09:00", "HH:mm")]);
  const removeTime = (idx) => setTimes(p => p.filter((_, i) => i !== idx));
  const updateTime = (idx, val) => setTimes(p => p.map((x, i) => i === idx ? val : x));

  const FormBody = (
    <Form form={form} layout="vertical">
      {classes.length > 1 && !moveOnly && (
        <FieldGroup>
          <FieldLabel><Calendar size={13} />Experience</FieldLabel>
          <Form.Item name="classId" noStyle rules={[{ required: true, message: "Select an experience" }]}>
            <Select style={{ width: "100%" }} placeholder="Select experience">
              {classes.map(cls => (
                <Select.Option key={cls.classId} value={cls.classId}>{cls.title || "Untitled"}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </FieldGroup>
      )}

      {!isEdit && !moveOnly && (
        <div style={{ marginTop: 8 }}>
          <ModeToggle>
            <ModeBtn $active={mode === "single"} onClick={() => setMode("single")} type="button">
              <Clock size={13} /> Single
            </ModeBtn>
            <ModeBtn $active={mode === "bulk"} onClick={() => setMode("bulk")} type="button">
              <Repeat size={13} /> Recurring
            </ModeBtn>
          </ModeToggle>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {mode === "single" ? (
          <TwoCol>
            <FieldGroup>
              <FieldLabel>Date</FieldLabel>
              <Form.Item name="date" noStyle rules={[{ required: true, message: "Required" }]}>
                <DatePicker
                  style={{ width: "100%" }}
                  inputReadOnly
                  disabledDate={d => (moveOnly ? d && d < dayjs().startOf("day") : !isEdit && d && d < dayjs().startOf("day"))}
                />
              </Form.Item>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Time</FieldLabel>
              <Form.Item name="time" noStyle rules={[{ required: true, message: "Required" }]}>
                <TimePicker style={{ width: "100%" }} use12Hours format="h:mm A" minuteStep={moveOnly ? 5 : 15} inputReadOnly />
              </Form.Item>
            </FieldGroup>
          </TwoCol>
        ) : (
          <>
            <FieldGroup>
              <FieldLabel><Repeat size={13} />Group Name *<InfoTip text="Give this recurring series a name so you can filter and bulk-edit all sessions together." /></FieldLabel>
              <Form.Item name="name" noStyle rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="e.g. Summer Drop-ins" />
              </Form.Item>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Date Range</FieldLabel>
              <Form.Item name="date_range" noStyle rules={[{ required: true, message: "Required" }]}>
                <DatePicker.RangePicker style={{ width: "100%" }} inputReadOnly disabledDate={d => d && d < dayjs().startOf("day")} />
              </Form.Item>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Repeat on Days<InfoTip text="Sessions will be created on every selected weekday within the date range." /></FieldLabel>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {DAY_KEYS.map((key, i) => (
                  <DayPill key={key} $active={selectedDays.includes(key)} onClick={() => toggleDay(key)} type="button">
                    {DAY_LABELS_SHORT[i].slice(0, 2)}
                  </DayPill>
                ))}
              </div>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Times<InfoTip text="Add multiple start times to create several sessions on the same days." /></FieldLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {times.map((t, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6 }}>
                    <TimePicker
                      value={t}
                      onChange={v => updateTime(idx, v)}
                      use12Hours format="h:mm A" minuteStep={15}
                      style={{ flex: 1 }} inputReadOnly
                    />
                    {times.length > 1 && (
                      <button onClick={() => removeTime(idx)} type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addTime} type="button"
                  style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={12} /> Add time
                </button>
              </div>
            </FieldGroup>
          </>
        )}

        {!moveOnly && (
          <>
            <FieldGroup>
              <FieldLabel><Clock size={13} />Duration<InfoTip text="How long each session lasts. This affects booking slots and calendar display." /></FieldLabel>
              <DurationPresets>
                {DURATION_PRESETS.map(d => (
                  <DurationChip key={d} $active={duration === d} onClick={() => setDuration(d)} type="button">
                    {d < 60 ? `${d}m` : d === 60 ? "1h" : d === 90 ? "1.5h" : `${d / 60}h`}
                  </DurationChip>
                ))}
              </DurationPresets>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <InputNumber min={15} max={480} step={15} value={duration} onChange={v => setDuration(v || 60)} style={{ width: 80 }} size="small" />
                <span style={{ fontSize: 12, color: "#6b7280" }}>min</span>
              </div>
            </FieldGroup>

            <TwoCol>
              <FieldGroup>
                <FieldLabel><DollarSign size={13} />Price<InfoTip text="Per-person booking price. Enter 0 for free sessions." /></FieldLabel>
                <Form.Item name="price" noStyle rules={[{ required: true, message: "Required" }]}>
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: "100%" }} addonBefore="$" />
                </Form.Item>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel><Users size={13} />Max Guests<InfoTip text="Maximum number of participants that can book this session." /></FieldLabel>
                <Form.Item name="maxParticipants" noStyle rules={[{ required: true, message: "Required" }]}>
                  <InputNumber min={1} max={9999} style={{ width: "100%" }} />
                </Form.Item>
              </FieldGroup>
            </TwoCol>
            <TwoCol>
              <FieldGroup>
                <FieldLabel>Min Guests<InfoTip text="Minimum bookings needed for the session to be confirmed. Leave blank for no minimum." /></FieldLabel>
                <Form.Item name="minParticipants" noStyle>
                  <InputNumber min={1} max={9999} style={{ width: "100%" }} />
                </Form.Item>
              </FieldGroup>
              {mode === "single" && (
                <FieldGroup>
                  <FieldLabel>Group<InfoTip text="Optionally assign this session to a group so you can filter and bulk-edit related sessions together." /></FieldLabel>
                  <Form.Item name="name" noStyle>
                    <Input placeholder="Optional" />
                  </Form.Item>
                </FieldGroup>
              )}
            </TwoCol>
          </>
        )}
      </div>
    </Form>
  );

  return { form, mode, submitting, deleting, duration, selectedDays, times, isEdit, FormBody, handleSubmit, handleDelete, toggleDay, addTime, removeTime, updateTime };
}

// ─── BULK EDIT PANEL ──────────────────────────────────────────────────────────
function BulkEditPanel({ selectedIds, allSchedules, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const count = selectedIds.size;

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const ids = [...selectedIds];
      await Promise.all(ids.map(id => scheduleService.deleteSchedule(id)));
      message.success(`Deleted ${ids.length} schedule${ids.length > 1 ? "s" : ""}.`);
      onSuccess();
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!groupName && !price && !maxParticipants) {
      message.error("Enter at least one field to update.");
      return;
    }
    setLoading(true);
    try {
      const ids = [...selectedIds];
      const updates = {};
      if (groupName) updates.name = groupName;
      if (price !== "") updates.price = Math.max(0, parseFloat(price) || 0).toFixed(2);
      if (maxParticipants !== "") updates.maxParticipants = parseInt(maxParticipants, 10);
      await Promise.all(ids.map(id => scheduleService.updateSchedule(id, updates)));
      message.success(`Updated ${ids.length} schedule${ids.length > 1 ? "s" : ""}.`);
      onSuccess();
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 8, fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
        {count} schedule{count > 1 ? "s" : ""} selected
      </div>

      <FieldGroup>
        <FieldLabel>Set Group Name</FieldLabel>
        <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Spring Sessions" />
      </FieldGroup>
      <TwoCol>
        <FieldGroup>
          <FieldLabel><DollarSign size={13} />Price</FieldLabel>
          <InputNumber min={0} step={0.01} precision={2} value={price || undefined} onChange={v => setPrice(v ?? "")} style={{ width: "100%" }} addonBefore="$" placeholder="—" />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel><Users size={13} />Max Guests</FieldLabel>
          <InputNumber min={1} value={maxParticipants || undefined} onChange={v => setMaxParticipants(v ?? "")} style={{ width: "100%" }} placeholder="—" />
        </FieldGroup>
      </TwoCol>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
        <SaveBtn onClick={handleBulkUpdate} disabled={loading} style={{ justifyContent: "center" }}>
          <Check size={14} />
          Update {count} Schedule{count > 1 ? "s" : ""}
        </SaveBtn>
        <Popconfirm
          title={`Delete ${count} schedule${count > 1 ? "s" : ""}?`}
          description="This cannot be undone."
          onConfirm={handleBulkDelete}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <DeletePanelBtn disabled={loading} style={{ justifyContent: "center", marginRight: 0, width: "100%" }}>
            <Trash2 size={14} />
            Delete {count} Schedule{count > 1 ? "s" : ""}
          </DeletePanelBtn>
        </Popconfirm>
      </div>
    </div>
  );
}

// ─── EVENT CARD ───────────────────────────────────────────────────────────────
function EventCardItem({
  schedule,
  color,
  selectMode,
  isSelected,
  onToggleSelect,
  onClick,
  colIndex = 0,
  colCount = 1,
  getContextMenuItems,
  gridStartHour,
}) {
  const top = timeToTop(schedule.time, gridStartHour);
  const height = durationToHeight(schedule.duration);
  const isShort = height < 44;

  // Column-aware positioning: divide column width evenly, with a 2px gap between columns
  const GAP = 2;
  const pctWidth = (100 - GAP * (colCount + 1)) / colCount;
  const leftPct = GAP + colIndex * (pctWidth + GAP);
  const rightPct = 100 - leftPct - pctWidth;

  const card = (
    <EventCardEl
      $top={top}
      $bg={color.bg}
      $accent={color.accent}
      $height={height}
      $selected={isSelected}
      $left={`${leftPct.toFixed(1)}%`}
      $right={`${Math.max(0, rightPct).toFixed(1)}%`}
      onClick={(e) => {
        e.stopPropagation();
        if (selectMode) onToggleSelect(schedule.id);
        else onClick(schedule);
      }}
    >
      {selectMode && (
        <EventCheckbox $checked={isSelected}>
          {isSelected && <Check size={10} color="#fff" />}
        </EventCheckbox>
      )}
      <EventTitle $accentText={color.text} style={{ fontSize: isShort ? "10px" : "11px", paddingRight: selectMode ? 20 : 0 }}>
        {schedule.className || schedule.name || "Session"}
      </EventTitle>
      {!isShort && (
        <EventTimeLine>
          <Clock size={9} />
          {formatTimeRange(schedule.time, schedule.duration)}
        </EventTimeLine>
      )}
    </EventCardEl>
  );

  if (selectMode || !getContextMenuItems) return card;
  const items = getContextMenuItems(schedule);
  if (!items?.length) return card;
  return (
    <Dropdown menu={{ items }} trigger={["contextMenu"]}>
      {card}
    </Dropdown>
  );
}

// ─── TIMEZONE LABEL ──────────────────────────────────────────────────────────
function getLocalTzAbbr() {
  try {
    return new Intl.DateTimeFormat("en", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find(p => p.type === "timeZoneName")?.value || "Local";
  } catch { return "Local"; }
}
const LOCAL_TZ = getLocalTzAbbr();

// ─── WEEK VIEW ────────────────────────────────────────────────────────────────
function WeekView({ weekDays, schedulesByDay, getClassColor, onEventClick, onSlotClick, loading, selectMode, selectedIds, onToggleSelect, isMobile, getContextMenuItems, grid }) {
  const scrollRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const today = dayjs();
  const { startHour, endHour, hours } = grid;

  useEffect(() => {
    if (!isMobile && scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (8 - startHour) * HOUR_HEIGHT);
    }
  }, [isMobile, startHour]);

  const currentTimeTop = useMemo(() => {
    const now = dayjs();
    const h = now.hour(), m = now.minute();
    if (h < startHour || h >= endHour) return null;
    return (h - startHour + m / 60) * HOUR_HEIGHT;
  }, [startHour, endHour]);

  // Mobile: simplified vertical list (one section per day, no grid)
  if (isMobile) {
    return (
      <WeekListOuter>
        {loading && <LoadingOverlay><SpinnerEl $size={36} /></LoadingOverlay>}
        {weekDays.map((day, i) => {
          const dayStr = day.format("YYYY-MM-DD");
          const daySchedules = (schedulesByDay[dayStr] || []).sort((a, b) => a.time.localeCompare(b.time));
          const isToday = day.isSame(today, "day");
          return (
            <WeekListDay key={i}>
              <WeekListDayHeader>
                <WeekListDayNum $isToday={isToday}>{day.date()}</WeekListDayNum>
                <span>{DAYS_SHORT[i]}, {day.format("MMM D")}</span>
              </WeekListDayHeader>
              {daySchedules.map((s) => {
                const color = getClassColor(s.optionId);
                const isSelected = selectedIds.has(s.id);
                const row = (
                  <WeekListEvent
                    $bg={color.bg}
                    $accent={color.accent}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectMode) onToggleSelect(s.id);
                      else onEventClick(s);
                    }}
                  >
                    {selectMode && (
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: isSelected ? "#3b82f6" : "rgba(255,255,255,0.9)",
                        border: `1.5px solid ${isSelected ? "#3b82f6" : "#d1d5db"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {isSelected && <Check size={10} color="#fff" />}
                      </div>
                    )}
                    <WeekListEventTime>{formatTimeShort(s.time)}</WeekListEventTime>
                    <WeekListEventTitle $text={color.text}>{s.className || s.name || "Session"}</WeekListEventTitle>
                  </WeekListEvent>
                );
                if (selectMode || !getContextMenuItems) {
                  return <React.Fragment key={s.id}>{row}</React.Fragment>;
                }
                const items = getContextMenuItems(s);
                if (!items?.length) {
                  return <React.Fragment key={s.id}>{row}</React.Fragment>;
                }
                return (
                  <Dropdown key={s.id} menu={{ items }} trigger={["contextMenu"]}>
                    {row}
                  </Dropdown>
                );
              })}
              {!selectMode && (
                <WeekListEvent
                  $bg="rgba(59,130,246,0.06)"
                  $accent="rgba(59,130,246,0.3)"
                  onClick={() => onSlotClick(day, "09:00")}
                  style={{ justifyContent: "center" }}
                >
                  <Plus size={16} color="#3b82f6" />
                  <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Add session</span>
                </WeekListEvent>
              )}
            </WeekListDay>
          );
        })}
      </WeekListOuter>
    );
  }

  return (
    <CalendarOuter>
      <CalHeaderRow>
        <TimezoneCell>{LOCAL_TZ}</TimezoneCell>
        {weekDays.map((day, i) => {
          const isToday = day.isSame(today, "day");
          return (
            <DayHeaderCell key={i}>
              <DayNum $isToday={isToday}>{day.date()}</DayNum>
              <DayNameLabel $isToday={isToday}>{DAYS_SHORT[i]}</DayNameLabel>
            </DayHeaderCell>
          );
        })}
      </CalHeaderRow>

      <CalScrollArea ref={scrollRef}>
        {loading && <LoadingOverlay><SpinnerEl $size={36} /></LoadingOverlay>}
        <CalBodyGrid $minHeight={grid.totalHeight}>
          <TimeCol>
            {hours.map(h => <TimeSlot key={h}>{formatHour(h)}</TimeSlot>)}
          </TimeCol>

          {weekDays.map((day, dayIdx) => {
            const dayStr = day.format("YYYY-MM-DD");
            const daySchedules = schedulesByDay[dayStr] || [];
            const isToday = day.isSame(today, "day");
            const colMap = computeEventColumns(daySchedules);

            return (
              <DayCol
                key={dayIdx}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const h = startHour + Math.floor(y / HOUR_HEIGHT);
                  onSlotClick(day, `${String(h).padStart(2, "0")}:00`);
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  setHoveredCell({ dayIdx, slotIdx: Math.floor(y / (HOUR_HEIGHT / 2)) });
                }}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {hours.map((_, hi) => (
                  <React.Fragment key={hi}>
                    <HourLine $top={hi * HOUR_HEIGHT} />
                    <HalfHourLine $top={hi * HOUR_HEIGHT + HOUR_HEIGHT / 2} />
                  </React.Fragment>
                ))}
                {isToday && currentTimeTop !== null && <CurrentTimeLine $top={currentTimeTop} />}

                {daySchedules.map((s, si) => {
                  const { colIndex = 0, colCount = 1 } = colMap.get(s.id) || {};
                  return (
                    <EventCardItem
                      key={s.id || si}
                      schedule={s}
                      color={getClassColor(s.optionId)}
                      selectMode={selectMode}
                      isSelected={selectedIds.has(s.id)}
                      onToggleSelect={onToggleSelect}
                      onClick={onEventClick}
                      colIndex={colIndex}
                      colCount={colCount}
                      getContextMenuItems={getContextMenuItems}
                      gridStartHour={startHour}
                    />
                  );
                })}

                {!selectMode && hoveredCell?.dayIdx === dayIdx && (
                  <AddHoverSlot
                    $top={hoveredCell.slotIdx * (HOUR_HEIGHT / 2)}
                    style={{ opacity: 1, pointerEvents: "auto" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const h = startHour + Math.floor(hoveredCell.slotIdx / 2);
                      const m = hoveredCell.slotIdx % 2 === 0 ? "00" : "30";
                      onSlotClick(day, `${String(h).padStart(2, "0")}:${m}`);
                    }}
                  >
                    <Plus size={13} color="#3b82f6" />
                  </AddHoverSlot>
                )}
              </DayCol>
            );
          })}
        </CalBodyGrid>
      </CalScrollArea>
    </CalendarOuter>
  );
}

// ─── DAY VIEW ─────────────────────────────────────────────────────────────────
function DayView({ day, schedules, getClassColor, onEventClick, onSlotClick, loading, selectMode, selectedIds, onToggleSelect, getContextMenuItems, grid }) {
  const scrollRef = useRef(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const today = dayjs();
  const { startHour, endHour, hours } = grid;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, (8 - startHour) * HOUR_HEIGHT);
  }, [day, startHour]);

  const currentTimeTop = useMemo(() => {
    if (!day.isSame(today, "day")) return null;
    const now = dayjs();
    const h = now.hour(), m = now.minute();
    if (h < startHour || h >= endHour) return null;
    return (h - startHour + m / 60) * HOUR_HEIGHT;
  }, [day, today, startHour, endHour]);

  return (
    <CalendarOuter>
      <DayCalHeaderRow>
        <TimezoneCell>{LOCAL_TZ}</TimezoneCell>
        <DayHeaderCell>
          <DayNum $isToday={day.isSame(today, "day")}>{day.date()}</DayNum>
          <DayNameLabel $isToday={day.isSame(today, "day")}>{day.format("dddd")}</DayNameLabel>
        </DayHeaderCell>
      </DayCalHeaderRow>

      <CalScrollArea ref={scrollRef}>
        {loading && <LoadingOverlay><SpinnerEl $size={36} /></LoadingOverlay>}
        <DayCalBodyGrid $minHeight={grid.totalHeight}>
          <TimeCol>
            {hours.map(h => <TimeSlot key={h}>{formatHour(h)}</TimeSlot>)}
          </TimeCol>
          <DayCol
            style={{ borderLeft: "1px solid #f3f4f6" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const h = startHour + Math.floor((e.clientY - rect.top) / HOUR_HEIGHT);
              onSlotClick(day, `${String(h).padStart(2, "0")}:00`);
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredSlot(Math.floor((e.clientY - rect.top) / (HOUR_HEIGHT / 2)));
            }}
            onMouseLeave={() => setHoveredSlot(null)}
          >
            {hours.map((_, hi) => (
              <React.Fragment key={hi}>
                <HourLine $top={hi * HOUR_HEIGHT} />
                <HalfHourLine $top={hi * HOUR_HEIGHT + HOUR_HEIGHT / 2} />
              </React.Fragment>
            ))}
            {currentTimeTop !== null && <CurrentTimeLine $top={currentTimeTop} />}
            {(() => {
              const colMap = computeEventColumns(schedules);
              return schedules.map((s, si) => {
                const { colIndex = 0, colCount = 1 } = colMap.get(s.id) || {};
                return (
                  <EventCardItem
                    key={s.id || si}
                    schedule={s}
                    color={getClassColor(s.optionId)}
                    selectMode={selectMode}
                    isSelected={selectedIds.has(s.id)}
                    onToggleSelect={onToggleSelect}
                    onClick={onEventClick}
                    colIndex={colIndex}
                    colCount={colCount}
                    getContextMenuItems={getContextMenuItems}
                    gridStartHour={startHour}
                  />
                );
              });
            })()}
            {!selectMode && hoveredSlot !== null && (
              <AddHoverSlot
                $top={hoveredSlot * (HOUR_HEIGHT / 2)}
                style={{ opacity: 1, pointerEvents: "auto" }}
                onClick={(e) => {
                  e.stopPropagation();
                  const h = startHour + Math.floor(hoveredSlot / 2);
                  const m = hoveredSlot % 2 === 0 ? "00" : "30";
                  onSlotClick(day, `${String(h).padStart(2, "0")}:${m}`);
                }}
              >
                <Plus size={13} color="#3b82f6" />
              </AddHoverSlot>
            )}
          </DayCol>
        </DayCalBodyGrid>
      </CalScrollArea>
    </CalendarOuter>
  );
}

// ─── MONTH VIEW ───────────────────────────────────────────────────────────────
function MonthView({ currentMonth, schedulesByDay, getClassColor, onEventClick, onDayClick, selectMode, selectedIds, isMobile, getContextMenuItems }) {
  const startOfMonth = currentMonth.startOf("month");
  const firstWeekday = startOfMonth.day();
  const gridStart = startOfMonth.subtract(firstWeekday === 0 ? 6 : firstWeekday - 1, "day");
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
  const today = dayjs();
  const maxVis = isMobile ? 2 : 5;

  const DayHeader = isMobile ? MonthDayHeaderMobile : MonthDayHeader;
  const DayCell = isMobile ? MonthDayCellMobile : MonthDayCell;
  const DayNumEl = isMobile ? MonthDayNumMobile : MonthDayNum;
  const PillEl = isMobile ? MonthPillMobile : MonthPill;
  const GridEl = isMobile ? MonthGridMobile : MonthGrid;
  const OuterEl = isMobile ? MonthOuterMobile : MonthOuter;

  return (
    <OuterEl>
      <div style={{ paddingTop: isMobile ? 10 : 14 }}>
        <GridEl>
          {DAYS_SHORT.map(d => <DayHeader key={d}>{d}</DayHeader>)}
        </GridEl>
        <GridEl>
          {cells.map((date, i) => {
            const dateStr = date.format("YYYY-MM-DD");
            const daySchedules = schedulesByDay[dateStr] || [];
            const isCurrent = date.isSame(currentMonth, "month");
            const isToday = date.isSame(today, "day");
            return (
              <DayCell key={i} $isCurrent={isCurrent} onClick={() => onDayClick(date)}>
                <DayNumEl $isToday={isToday} $isCurrent={isCurrent}>{date.date()}</DayNumEl>
                {daySchedules.slice(0, maxVis).map((s) => {
                  const color = getClassColor(s.optionId);
                  const isSelected = selectedIds?.has(s.id);
                  const pill = (
                    <PillEl $bg={color.bg} $accent={color.accent} $text={color.text}
                      onClick={(e) => { e.stopPropagation(); onEventClick(s); }}>
                      {selectMode && (
                        <MonthPillCheck $selected={isSelected}>
                          {isSelected && <Check size={9} color="#fff" strokeWidth={3} />}
                        </MonthPillCheck>
                      )}
                      <MonthPillContent>{s.className || s.name || "Session"}</MonthPillContent>
                      {!isMobile && <MonthPillTime>{formatTimeShort(s.time)}</MonthPillTime>}
                    </PillEl>
                  );
                  if (selectMode || !getContextMenuItems) {
                    return <React.Fragment key={s.id}>{pill}</React.Fragment>;
                  }
                  const items = getContextMenuItems(s);
                  if (!items?.length) {
                    return <React.Fragment key={s.id}>{pill}</React.Fragment>;
                  }
                  return (
                    <Dropdown key={s.id} menu={{ items }} trigger={["contextMenu"]}>
                      {pill}
                    </Dropdown>
                  );
                })}
                {daySchedules.length > maxVis && (
                  <div style={{ fontSize: isMobile ? 8 : 10, color: "#6b7280", padding: "1px 2px" }}>
                    +{daySchedules.length - maxVis}
                  </div>
                )}
              </DayCell>
            );
          })}
        </GridEl>
      </div>
    </OuterEl>
  );
}

// ─── DESKTOP FORM PANEL WRAPPER ───────────────────────────────────────────────
function DesktopFormPanel({ open, onClose, schedule, prefill, classes, onSuccess, isBulkEdit, selectedIds, allSchedules, moveOnly }) {
  const formState = useScheduleForm({ open, schedule, prefill, classes, onSuccess: () => { onSuccess(); onClose(); }, onClose, moveOnly });

  return (
    <AnimatePresence>
      {open && (
        <>
          <PanelOverlay
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <FormPanel
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <PanelHeader>
              <PanelTitle>
                {isBulkEdit ? `Edit ${selectedIds?.size || 0} Schedules` : moveOnly ? "Move schedule" : formState.isEdit ? "Edit Schedule" : "Add Schedule"}
              </PanelTitle>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex" }}>
                <X size={20} />
              </button>
            </PanelHeader>

            <PanelBody>
              {isBulkEdit
                ? <BulkEditPanel selectedIds={selectedIds} allSchedules={allSchedules} onSuccess={() => { onSuccess(); onClose(); }} onClose={onClose} />
                : formState.FormBody
              }
            </PanelBody>

            {!isBulkEdit && (
              <PanelFooter>
                {formState.isEdit && !moveOnly && (
                  <Popconfirm
                    title="Delete this schedule?"
                    description="This cannot be undone."
                    onConfirm={formState.handleDelete}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <DeletePanelBtn disabled={formState.deleting}>
                      <Trash2 size={14} />
                      {formState.deleting ? "Deleting..." : "Delete"}
                    </DeletePanelBtn>
                  </Popconfirm>
                )}
                <CancelBtn onClick={onClose}>Cancel</CancelBtn>
                <SaveBtn onClick={formState.handleSubmit} disabled={formState.submitting}>
                  {formState.submitting ? "Saving..." : moveOnly ? "Move" : formState.isEdit ? "Save" : formState.mode === "bulk" ? "Generate" : "Create"}
                </SaveBtn>
              </PanelFooter>
            )}
          </FormPanel>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── MOBILE FORM DRAWER ───────────────────────────────────────────────────────
function MobileFormDrawer({ open, onClose, schedule, prefill, classes, onSuccess, isBulkEdit, selectedIds, allSchedules, moveOnly }) {
  const formState = useScheduleForm({ open, schedule, prefill, classes, onSuccess: () => { onSuccess(); onClose(); }, onClose, moveOnly });

  return (
    <VaulDrawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }} dismissible>
      <VaulDrawer.Portal>
        <VaulOverlay />
        <VaulContent>
          <VaulHandle />
          <VaulHeader>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              {isBulkEdit ? `Edit ${selectedIds?.size || 0} Schedules` : moveOnly ? "Move schedule" : formState.isEdit ? "Edit Schedule" : "Add Schedule"}
            </span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
              <X size={20} />
            </button>
          </VaulHeader>
          <VaulBody>
            {isBulkEdit
              ? <BulkEditPanel selectedIds={selectedIds} allSchedules={allSchedules} onSuccess={() => { onSuccess(); onClose(); }} onClose={onClose} />
              : (
                <>
                  {formState.FormBody}
                  <div style={{ display: "flex", gap: 8, paddingTop: 8, flexWrap: "wrap" }}>
                    {formState.isEdit && !moveOnly && (
                      <Popconfirm
                        title="Delete this schedule?"
                        onConfirm={formState.handleDelete}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                      >
                        <DeletePanelBtn disabled={formState.deleting} style={{ flex: 1, justifyContent: "center" }}>
                          <Trash2 size={14} />
                          Delete
                        </DeletePanelBtn>
                      </Popconfirm>
                    )}
                    <SaveBtn onClick={formState.handleSubmit} disabled={formState.submitting} style={{ flex: 1, justifyContent: "center" }}>
                      {formState.submitting ? "Saving..." : moveOnly ? "Move" : formState.isEdit ? "Save" : formState.mode === "bulk" ? "Generate" : "Create"}
                    </SaveBtn>
                  </div>
                </>
              )}
          </VaulBody>
        </VaulContent>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

// ─── MOBILE FILTERS DRAWER ────────────────────────────────────────────────────
function MobileFiltersDrawer({ open, onClose, ...sidebarProps }) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }} dismissible>
      <VaulDrawer.Portal>
        <VaulOverlay />
        <VaulContent>
          <SidebarContent {...sidebarProps} onClose={onClose} />
        </VaulContent>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ScheduleCalendarView({ initialClassId }) {
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [classes, setClasses] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [visibleClassIds, setVisibleClassIds] = useState(new Set());
  const [visibleGroups, setVisibleGroups] = useState(null); // null = all
  const [myScheduleOpen, setMyScheduleOpen] = useState(true);
  const [groupsOpen, setGroupsOpen] = useState(true);

  // Bulk select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Form panel state
  const [formState, setFormState] = useState({ open: false, schedule: null, prefill: null, isBulk: false, moveOnly: false });

  // Group bulk-edit (dropdown + modal)
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [groupEditModalOpen, setGroupEditModalOpen] = useState(false);
  const [groupEditLoading, setGroupEditLoading] = useState(false);
  const [groupEditForm] = Form.useForm();

  // Mobile
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [businessHours, setBusinessHours] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await businessService.getMyBusinessProfile();
        if (!cancelled && res.success && Array.isArray(res.data?.businessHours)) {
          setBusinessHours(res.data.businessHours);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // ── Color map ───────────────────────────────────────────────────────────────
  const colorMap = useMemo(() => {
    const map = {};
    classes.forEach((cls, i) => {
      const optId = cls.option?.optionId || cls.options?.[0]?.optionId;
      if (optId) map[optId] = CLASS_COLORS[i % CLASS_COLORS.length];
    });
    return map;
  }, [classes]);

  const getClassColor = useCallback((optionId) => colorMap[optionId] || CLASS_COLORS[0], [colorMap]);

  // ── Load classes ─────────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      const result = await businessClassService.fetchBusinessClasses();
      if (result.success && Array.isArray(result.data)) {
        const processed = result.data.map(cls => ({
          ...cls,
          option: cls.options?.[0] || null,
        }));
        setClasses(processed);
        const ids = new Set(processed.map(c => c.classId));
        setVisibleClassIds(prev => {
          // keep existing selection if already set, but add new classes
          if (prev.size === 0) return ids;
          const merged = new Set(prev);
          ids.forEach(id => { if (!merged.has(id)) merged.add(id); });
          return merged;
        });
        // If initialClassId, filter to just that class
        if (initialClassId) {
          setVisibleClassIds(new Set([initialClassId]));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [initialClassId]);

  // ── Load schedules ────────────────────────────────────────────────────────
  const loadSchedules = useCallback(async (classList) => {
    if (!classList.length) { setAllSchedules([]); setLoading(false); return; }
    setLoading(true);
    try {
      const promises = classList.map(async (cls) => {
        const optionId = cls.option?.optionId || cls.options?.[0]?.optionId;
        if (!optionId) return [];
        const result = await scheduleService.fetchSchedules({ option_id: optionId });
        if (!result.success) return [];
        return (result.data || []).map(s => ({
          ...s,
          optionId,
          classId: cls.classId,
          className: cls.title,
        }));
      });
      const results = await Promise.all(promises);
      setAllSchedules(results.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (classes.length > 0) {
      const visible = classes.filter(c => visibleClassIds.has(c.classId));
      loadSchedules(visible);
    }
  }, [classes, visibleClassIds, refreshKey, loadSchedules]);

  // ── All groups ────────────────────────────────────────────────────────────
  const allGroups = useMemo(() => {
    const names = allSchedules.map(s => s.name).filter(n => n && n.trim());
    return [...new Set(names)].sort();
  }, [allSchedules]);

  // ── Filtered schedules ─────────────────────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    let list = allSchedules.filter(s => visibleClassIds.has(s.classId));
    if (visibleGroups !== null) {
      list = list.filter(s => visibleGroups.has(s.name));
    }
    return list;
  }, [allSchedules, visibleClassIds, visibleGroups]);

  const calendarGrid = useMemo(
    () => buildCalendarGrid(businessHours, filteredSchedules),
    [businessHours, filteredSchedules]
  );

  const schedulesByDay = useMemo(() => {
    const map = {};
    filteredSchedules.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    Object.keys(map).forEach(d => map[d].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [filteredSchedules]);

  // ── Event count for current view ──────────────────────────────────────────
  const visibleEventCount = useMemo(() => {
    if (viewMode === "week") {
      const end = weekStart.add(6, "day");
      return filteredSchedules.filter(s => {
        const d = dayjs(s.date);
        return !d.isBefore(weekStart, "day") && !d.isAfter(end, "day");
      }).length;
    }
    if (viewMode === "day") return filteredSchedules.filter(s => s.date === currentDate.format("YYYY-MM-DD")).length;
    return filteredSchedules.filter(s => dayjs(s.date).isSame(currentDate, "month")).length;
  }, [filteredSchedules, viewMode, weekStart, currentDate]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (dir) => {
    if (viewMode === "week") setCurrentDate(d => d.add(dir, "week"));
    else if (viewMode === "day") setCurrentDate(d => d.add(dir, "day"));
    else setCurrentDate(d => d.add(dir, "month"));
  };

  const dateRangeLabel = useMemo(() => {
    if (viewMode === "week") {
      const end = weekStart.add(6, "day");
      return weekStart.isSame(end, "month")
        ? `${weekStart.format("MMM D")} – ${end.format("D, YYYY")}`
        : `${weekStart.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
    }
    if (viewMode === "day") return currentDate.format("MMMM D, YYYY");
    return currentDate.format("MMMM YYYY");
  }, [viewMode, weekStart, currentDate]);

  // ── Group filter toggle ────────────────────────────────────────────────────
  const handleToggleGroup = (groupName) => {
    if (groupName === null) { setVisibleGroups(null); return; }
    setVisibleGroups(prev => {
      if (prev === null) return new Set([groupName]);
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
        return next.size === 0 ? null : next;
      }
      next.add(groupName);
      return next;
    });
  };

  // ── Select mode ────────────────────────────────────────────────────────────
  const handleToggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  // ── Event & slot clicks ────────────────────────────────────────────────────
  const handleEventClick = useCallback((schedule) => {
    if (selectMode) { handleToggleSelect(schedule.id); return; }
    setFormState({ open: true, schedule, prefill: null, isBulk: false, moveOnly: false });
  }, [selectMode, handleToggleSelect]);

  const handleSlotClick = useCallback((day, timeStr) => {
    if (selectMode) return;
    const prefill = { date: day, time: timeStr, classId: classes.length === 1 ? classes[0].classId : null };
    setFormState({ open: true, schedule: null, prefill, isBulk: false, moveOnly: false });
  }, [selectMode, classes]);

  const handleSuccess = useCallback(() => {
    setRefreshKey(k => k + 1);
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDuplicateSchedule = useCallback((schedule) => {
    setFormState({
      open: true,
      schedule: null,
      prefill: { classId: schedule.classId, duplicateFrom: schedule },
      isBulk: false,
      moveOnly: false,
    });
  }, []);

  const openMoveInDrawer = useCallback((schedule) => {
    setFormState({ open: true, schedule, prefill: null, isBulk: false, moveOnly: true });
  }, []);

  const getScheduleContextMenuItems = useCallback(
    (schedule) => [
      {
        key: "edit",
        label: "Edit",
        icon: <Edit3 size={14} />,
        onClick: ({ domEvent }) => {
          domEvent?.preventDefault?.();
          domEvent?.stopPropagation?.();
          handleEventClick(schedule);
        },
      },
      {
        key: "duplicate",
        label: "Duplicate to new time",
        icon: <Copy size={14} />,
        onClick: ({ domEvent }) => {
          domEvent?.preventDefault?.();
          domEvent?.stopPropagation?.();
          handleDuplicateSchedule(schedule);
        },
      },
      {
        key: "move",
        label: "Move to…",
        icon: <Calendar size={14} />,
        onClick: ({ domEvent }) => {
          domEvent?.preventDefault?.();
          domEvent?.stopPropagation?.();
          openMoveInDrawer(schedule);
        },
      },
      { type: "divider" },
      {
        key: "delete",
        label: "Delete",
        danger: true,
        icon: <Trash2 size={14} />,
        onClick: ({ domEvent }) => {
          domEvent?.preventDefault?.();
          domEvent?.stopPropagation?.();
          Modal.confirm({
            title: "Delete this schedule?",
            content: "This cannot be undone.",
            okText: "Delete",
            okButtonProps: { danger: true },
            onOk: async () => {
              const res = await scheduleService.deleteSchedule(schedule.id);
              if (res.success) {
                message.success("Schedule deleted.");
                handleSuccess();
              }
            },
          });
        },
      },
    ],
    [handleEventClick, handleDuplicateSchedule, openMoveInDrawer, handleSuccess]
  );

  const closeForm = () => setFormState(s => ({ ...s, open: false, moveOnly: false }));

  const sidebarProps = {
    classes, visibleClassIds,
    onToggleClass: (id) => setVisibleClassIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    }),
    allGroups, visibleGroups, onToggleGroup: handleToggleGroup,
    myScheduleOpen, setMyScheduleOpen,
    groupsOpen, setGroupsOpen,
    viewMode, currentDate,
    onDateClick: (date) => {
      setCurrentDate(date);
      if (viewMode === "month") setViewMode("week");
    },
  };

  const daySchedules = useMemo(() =>
    filteredSchedules.filter(s => s.date === currentDate.format("YYYY-MM-DD")),
    [filteredSchedules, currentDate]
  );

  return (
    <Wrapper>
      {/* Desktop Sidebar */}
      <Sidebar>
        <SidebarContent {...sidebarProps} onClose={null} />
      </Sidebar>

      {/* Main */}
      <MainArea style={{ position: "relative" }}>
        {/* Top Bar */}
        <TopBar>
          <TopBarRow>
            <TopBarLeft>
            <CalendarBadge title={dateRangeLabel}>
                <CalendarBadgeMonth>{currentDate.format("MMM")}</CalendarBadgeMonth>
                <CalendarBadgeDay>{currentDate.date()}</CalendarBadgeDay>
              </CalendarBadge>
              <PageTitle>Schedules</PageTitle>

              {visibleEventCount > 0 && (
                <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                  <Calendar size={13} /> {visibleEventCount}
                </span>
              )}
            </TopBarLeft>

            <TopBarRight>
              {/* Mobile filter button */}
              <IconBtn onClick={() => setMobileFiltersOpen(true)} style={{ display: "none" }}
                className="mobile-filter-btn">
                <SlidersHorizontal size={15} />
              </IconBtn>

              <Tooltip title="Refresh">
                <StandaloneNavBtn onClick={() => setRefreshKey(k => k + 1)} disabled={loading} style={{ marginRight: 6 }}>
                  <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                </StandaloneNavBtn>
              </Tooltip>

              <NavGroup>
                <NavBtn onClick={() => navigate(-1)}><ChevronLeft size={15} /></NavBtn>
                <TodayBtn onClick={() => setCurrentDate(dayjs())}>Today</TodayBtn>
                <NavBtn onClick={() => navigate(1)}><ChevronRight size={15} /></NavBtn>
              </NavGroup>

              <ViewDropdownWrap>
                <Select
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: "day", label: "Day" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                  ]}
                  style={{ width: 90 }}
                  size="small"
                  suffixIcon={<ChevronDown size={12} />}
                />
              </ViewDropdownWrap>

              {allGroups.length > 0 && (
                <>
                  <Select
                    value={selectedGroup}
                    onChange={setSelectedGroup}
                    options={[
                      { label: "All groups", value: "all" },
                      ...allGroups.map((g) => ({ label: g, value: g })),
                    ]}
                    style={{ width: 140 }}
                    size="small"
                    suffixIcon={<ChevronDown size={12} />}
                  />
                  {selectedGroup !== "all" && (
                    <Tooltip title="Bulk edit all sessions in this group">
                      <Button
                        size="small"
                        icon={<Edit3 size={14} />}
                        onClick={() => {
                          const sample = allSchedules.find((s) => s.name === selectedGroup);
                          if (sample) {
                            groupEditForm.setFieldsValue({
                              price: parseFloat(sample.price ?? 0),
                              duration: sample.duration ?? 60,
                              maxParticipants: sample.maxParticipants ?? 10,
                              minParticipants: sample.minParticipants ?? 1,
                            });
                            setGroupEditModalOpen(true);
                          }
                        }}
                      >
                        Edit group
                      </Button>
                    </Tooltip>
                  )}
                </>
              )}

              <Tooltip title={selectMode ? "Exit select mode" : "Select schedules for bulk actions"}>
                <IconBtn
                  $active={selectMode}
                  onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()); }}
                >
                  <CheckSquare size={15} />
                </IconBtn>
              </Tooltip>

              <AddBtn
                onClick={() => {
                  const prefill = { classId: classes.length === 1 ? classes[0].classId : null };
                  setFormState({ open: true, schedule: null, prefill, isBulk: false, moveOnly: false });
                }}
                disabled={classes.length === 0}
              >
                <Plus size={14} /> Add
              </AddBtn>
            </TopBarRight>
          </TopBarRow>
        </TopBar>

        {/* Bulk actions bar */}
        <BulkBarGridWrap $open={selectMode}>
          <BulkBarGridInner>
            {selectMode && (
              <BulkBar>
                <BulkCount>
                  {selectedIds.size === 0 ? "Click events to select" : `${selectedIds.size} selected`}
                </BulkCount>
                {selectedIds.size > 0 && (
                  <>
                    <BulkBtn onClick={() => setFormState({ open: true, schedule: null, prefill: null, isBulk: true, moveOnly: false })}>
                      <Edit3 size={13} /> Edit
                    </BulkBtn>
                    <Popconfirm
                      title={`Delete ${selectedIds.size} schedule${selectedIds.size > 1 ? "s" : ""}?`}
                      description="This cannot be undone."
                      onConfirm={async () => {
                        try {
                          await Promise.all([...selectedIds].map(id => scheduleService.deleteSchedule(id)));
                          message.success(`Deleted ${selectedIds.size} schedule${selectedIds.size > 1 ? "s" : ""}.`);
                          handleSuccess();
                        } catch (e) {
                          message.error(getErrorMessage(e));
                        }
                      }}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <BulkBtn $danger>
                        <Trash2 size={13} /> Delete
                      </BulkBtn>
                    </Popconfirm>
                  </>
                )}
                <BulkBtn onClick={exitSelectMode}>
                  <X size={13} /> Cancel
                </BulkBtn>
              </BulkBar>
            )}
          </BulkBarGridInner>
        </BulkBarGridWrap>

        {/* Calendar views */}
        {viewMode === "week" && (
          <WeekView
            weekDays={weekDays}
            schedulesByDay={schedulesByDay}
            getClassColor={getClassColor}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            loading={loading}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            isMobile={isMobile}
            getContextMenuItems={getScheduleContextMenuItems}
            grid={calendarGrid}
          />
        )}
        {viewMode === "day" && (
          <DayView
            day={currentDate}
            schedules={daySchedules}
            getClassColor={getClassColor}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            loading={loading}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            getContextMenuItems={getScheduleContextMenuItems}
            grid={calendarGrid}
          />
        )}
        {viewMode === "month" && (
          <MonthView
            currentMonth={currentDate}
            schedulesByDay={schedulesByDay}
            getClassColor={getClassColor}
            onEventClick={handleEventClick}
            onDayClick={(date) => { setCurrentDate(date); setViewMode("day"); }}
            selectMode={selectMode}
            selectedIds={selectedIds}
            isMobile={isMobile}
            getContextMenuItems={getScheduleContextMenuItems}
          />
        )}

        {/* Form Panel — desktop or mobile */}
        {!isMobile ? (
          <DesktopFormPanel
            open={formState.open}
            onClose={closeForm}
            schedule={formState.schedule}
            prefill={formState.prefill}
            classes={classes}
            onSuccess={handleSuccess}
            isBulkEdit={formState.isBulk}
            selectedIds={selectedIds}
            allSchedules={allSchedules}
            moveOnly={formState.moveOnly}
          />
        ) : (
          <MobileFormDrawer
            open={formState.open}
            onClose={closeForm}
            schedule={formState.schedule}
            prefill={formState.prefill}
            classes={classes}
            onSuccess={handleSuccess}
            isBulkEdit={formState.isBulk}
            selectedIds={selectedIds}
            allSchedules={allSchedules}
            moveOnly={formState.moveOnly}
          />
        )}
      </MainArea>

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        {...sidebarProps}
      />

      {/* Group bulk-edit modal */}
      <Modal
        title={`Edit group: ${selectedGroup !== "all" ? selectedGroup : ""}`}
        open={groupEditModalOpen}
        onCancel={() => { setGroupEditModalOpen(false); groupEditForm.resetFields(); }}
        onOk={() => groupEditForm.submit()}
        confirmLoading={groupEditLoading}
        okText="Update group"
        width={400}
        destroyOnClose
      >
        <Form
          form={groupEditForm}
          layout="vertical"
          onFinish={async (values) => {
            if (selectedGroup === "all") return;
            const optionIds = [...new Set(
              allSchedules.filter((s) => s.name === selectedGroup).map((s) => s.optionId)
            )];
            if (!optionIds.length) {
              message.warning("No schedules found for this group.");
              return;
            }
            setGroupEditLoading(true);
            try {
              const updates = {
                price: Math.max(0, parseFloat(values.price) || 0).toFixed(2),
                duration: values.duration ?? 60,
                maxParticipants: values.maxParticipants ?? 10,
                minParticipants: values.minParticipants ?? 1,
              };
              await Promise.all(
                optionIds.map((optionId) =>
                  scheduleService.groupUpdate({
                    option_id: optionId,
                    name: selectedGroup,
                    updates,
                  })
                )
              );
              message.success(`Group "${selectedGroup}" updated.`);
              setGroupEditModalOpen(false);
              groupEditForm.resetFields();
              handleSuccess();
            } catch (e) {
              message.error(getErrorMessage(e));
            } finally {
              setGroupEditLoading(false);
            }
          }}
        >
          <Form.Item label="Price" name="price" rules={[{ required: true }]}>
            <Input type="number" step="0.01" prefix="$" />
          </Form.Item>
          <Form.Item label="Duration (min)" name="duration" rules={[{ required: true }]}>
            <InputNumber min={15} step={15} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Max participants" name="maxParticipants" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Min participants" name="minParticipants" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </Wrapper>
  );
}
