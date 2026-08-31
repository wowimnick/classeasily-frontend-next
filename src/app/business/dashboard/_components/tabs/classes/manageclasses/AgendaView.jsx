"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { Plus, CalendarDays } from "lucide-react";
import { CapacityMeter } from "../../shared/charts";
import { dash } from "../../shared/dashboardTokens";

const PERIODS = [
  { key: "morning", label: "Morning", start: 0, end: 12 },
  { key: "afternoon", label: "Afternoon", start: 12, end: 17 },
  { key: "evening", label: "Evening", start: 17, end: 24 },
];

const Wrap = styled.div`
  flex: 1;
  overflow: auto;
  padding: 8px 20px 40px;
`;

const DayBlock = styled.section`
  margin-bottom: 28px;
`;

const DayHead = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  background: ${dash.color.surface};
  padding: 12px 0 8px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  border-bottom: 1px solid ${dash.color.hairline};
  margin-bottom: 12px;
`;

const DayTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${dash.color.ink};
`;

const DayMeta = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${dash.color.ash};
`;

const PeriodLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${dash.color.ash};
  margin: 14px 0 8px;
`;

const Card = styled.button`
  display: grid;
  grid-template-columns: 4px 88px 1fr auto;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  margin-bottom: 8px;
  border: 1px solid ${dash.color.hairline};
  border-radius: ${dash.radius.card}px;
  background: ${dash.color.surface};
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  &:hover {
    box-shadow: ${dash.elevation.raised};
  }
`;

const ColorBar = styled.div`
  border-radius: 4px;
  background: ${(p) => p.$accent};
`;

const TimeCol = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${dash.color.ink};
  line-height: 1.35;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${dash.color.ink};
`;

const Sub = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${dash.color.ash};
  margin-top: 2px;
`;

const StaffDot = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${dash.color.cloud};
  color: ${dash.color.ink};
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Empty = styled.div`
  border: 1px dashed ${dash.color.hairline};
  border-radius: ${dash.radius.card}px;
  padding: 28px 16px;
  text-align: center;
  color: ${dash.color.ash};
`;

const AddLink = styled.button`
  margin-top: 10px;
  border: none;
  background: none;
  color: ${dash.color.rausch};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

function hourOf(s) {
  const t = String(s.time || "00:00").slice(0, 5);
  return Number(t.split(":")[0]) || 0;
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export default function AgendaView({
  day,
  days = 7,
  schedules,
  getClassColor,
  onEventClick,
  onAddSession,
  loading,
  staffList = [],
}) {
  const staffMap = useMemo(() => {
    const m = {};
    (staffList || []).forEach((s) => {
      m[s.id] = s.user_name || s.full_name || s.name || s.user_email || "Staff";
    });
    return m;
  }, [staffList]);

  const dayList = useMemo(
    () => Array.from({ length: days }, (_, i) => day.add(i, "day")),
    [day, days],
  );

  const byDay = useMemo(() => {
    const map = {};
    (schedules || []).forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    Object.keys(map).forEach((d) =>
      map[d].sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))),
    );
    return map;
  }, [schedules]);

  return (
    <Wrap>
      {loading && (
        <div style={{ color: dash.color.ash, fontSize: 13, marginBottom: 12 }}>Loading…</div>
      )}
      {dayList.map((d) => {
        const key = d.format("YYYY-MM-DD");
        const rows = byDay[key] || [];
        const isToday = d.isSame(dayjs(), "day");
        return (
          <DayBlock key={key}>
            <DayHead>
              <CalendarDays size={16} color={dash.color.ash} />
              <DayTitle>
                {isToday ? "Today" : d.format("dddd")}
              </DayTitle>
              <DayMeta>
                {d.format("MMMM D")} · {rows.length} session{rows.length === 1 ? "" : "s"}
              </DayMeta>
            </DayHead>

            {rows.length === 0 ? (
              <Empty>
                Quiet day — no sessions scheduled.
                {onAddSession ? (
                  <div>
                    <AddLink type="button" onClick={() => onAddSession(d)}>
                      <Plus size={14} /> Add session
                    </AddLink>
                  </div>
                ) : null}
              </Empty>
            ) : (
              PERIODS.map((period) => {
                const slice = rows.filter((s) => {
                  const h = hourOf(s);
                  return h >= period.start && h < period.end;
                });
                if (!slice.length) return null;
                return (
                  <div key={period.key}>
                    <PeriodLabel>{period.label}</PeriodLabel>
                    {slice.map((s) => {
                      const color = getClassColor(s.optionId);
                      const booked = s.current_bookings_count ?? 0;
                      const cap = s.maxParticipants ?? s.max_participants ?? 0;
                      const start = dayjs(`${s.date}T${String(s.time || "00:00").slice(0, 5)}`);
                      const end = start.add(Number(s.duration) || 0, "minute");
                      const staffName = staffMap[s.assigned_staff_id];
                      const past = end.isBefore(dayjs());
                      return (
                        <Card key={s.id} type="button" onClick={() => onEventClick(s)}>
                          <ColorBar $accent={color.accent} />
                          <TimeCol>
                            {start.format("h:mm A")}
                            <div style={{ fontWeight: 500, color: dash.color.ash, fontSize: 11 }}>
                              {end.format("h:mm A")}
                            </div>
                          </TimeCol>
                          <div>
                            <Title>{s.className || "Session"}</Title>
                            <Sub>
                              {s.duration} min
                              {s.name ? ` · ${s.name}` : ""}
                              {staffName ? ` · ${staffName}` : ""}
                            </Sub>
                            {past ? (
                              <Sub style={{ color: dash.color.ink }}>Review attendance</Sub>
                            ) : null}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {staffName ? <StaffDot title={staffName}>{initials(staffName)}</StaffDot> : null}
                            <CapacityMeter booked={booked} capacity={cap} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })
            )}
          </DayBlock>
        );
      })}
    </Wrap>
  );
}
