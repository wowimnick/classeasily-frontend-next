"use client";

import React, { useId, useMemo, useState } from "react";
import { dash } from "../dashboardTokens";

function toNums(values) {
  return (Array.isArray(values) ? values : []).map((v) => Number(v) || 0);
}

function formatMoney(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return `$${Math.round(v).toLocaleString()}`;
  return `$${v.toFixed(v % 1 === 0 ? 0 : 2)}`;
}

export function Sparkline({
  values = [],
  width = 120,
  height = 36,
  color = dash.chart.primary,
  fill = true,
}) {
  const nums = toNums(values);
  const gid = useId().replace(/:/g, "");
  const path = useMemo(() => {
    if (nums.length === 0) return { line: "", area: "", last: null };
    const max = Math.max(...nums, 1);
    const min = Math.min(...nums, 0);
    const span = max - min || 1;
    const pad = 2;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const pts = nums.map((n, i) => {
      const x = pad + (nums.length === 1 ? w / 2 : (i / (nums.length - 1)) * w);
      const y = pad + h - ((n - min) / span) * h;
      return [x, y];
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const last = pts[pts.length - 1];
    const area = `${line} L${last[0].toFixed(1)} ${height - pad} L${pts[0][0].toFixed(1)} ${height - pad} Z`;
    return { line, area, last };
  }, [nums, width, height]);

  if (nums.length === 0) {
    return <svg width={width} height={height} aria-hidden />;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={`sp-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={path.area} fill={`url(#sp-${gid})`} />
        </>
      )}
      <path d={path.line} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      {path.last && <circle cx={path.last[0]} cy={path.last[1]} r="2.5" fill={color} />}
    </svg>
  );
}

export function RadialGauge({
  value = 0,
  size = 112,
  label,
  target,
  color = dash.chart.primary,
  suffix = "%",
}) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 42;
  const c = 2 * Math.PI * r;
  const start = 0.75; // 270deg sweep starting at 135deg
  const sweep = 0.75;
  const dashLen = c * sweep;
  const offset = dashLen * (1 - v / 100);
  const gid = useId().replace(/:/g, "");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 112 112" aria-hidden>
        <g transform="rotate(135 56 56)">
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke={dash.color.cloud}
            strokeWidth="10"
            strokeDasharray={`${dashLen} ${c}`}
            strokeLinecap="round"
          />
          {typeof target === "number" && (
            <circle
              cx="56"
              cy="56"
              r={r}
              fill="none"
              stroke={dash.color.hairline}
              strokeWidth="10"
              strokeDasharray={`${dashLen * 0.08} ${c}`}
              strokeDashoffset={-(dashLen * (Math.max(0, Math.min(100, target)) / 100) * 0.92)}
              strokeLinecap="butt"
              opacity="0.7"
            />
          )}
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke={`url(#g-${gid})`}
            strokeWidth="10"
            strokeDasharray={`${dashLen} ${c}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </g>
        <defs>
          <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={dash.color.rauschPressed} />
          </linearGradient>
        </defs>
        <text
          x="56"
          y="54"
          textAnchor="middle"
          fontSize="22"
          fontWeight="600"
          fill={dash.color.ink}
        >
          {Math.round(v)}
          <tspan fontSize="11" fontWeight="500" fill={dash.color.ash}>
            {suffix}
          </tspan>
        </text>
        {start ? null : null}
      </svg>
      {label ? (
        <div style={{ fontSize: 12, fontWeight: 500, color: dash.color.ash, textAlign: "center" }}>{label}</div>
      ) : null}
    </div>
  );
}

export function BarSeries({
  items = [],
  height,
  maxValue,
  valueFormatter = (n) => String(n),
  colors,
}) {
  const [hover, setHover] = useState(null);
  const max = maxValue || Math.max(...items.map((i) => Number(i.value) || 0), 1);
  const palette = colors || [dash.chart.primary, ...dash.chart.muted];

  if (!items.length) {
    return <div style={{ color: dash.color.ash, fontSize: 13 }}>No data yet</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const pct = Math.max(2, ((Number(item.value) || 0) / max) * 100);
        const color = item.color || palette[i % palette.length];
        const active = hover === i;
        return (
          <div
            key={item.id || item.label || i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ display: "grid", gridTemplateColumns: "minmax(72px, 28%) 1fr auto", gap: 10, alignItems: "center" }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: dash.color.ink,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={item.label}
            >
              {item.label}
            </div>
            <div style={{ height: 10, background: dash.color.cloud, borderRadius: dash.radius.pill, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: color,
                  borderRadius: dash.radius.pill,
                  opacity: active ? 1 : 0.88,
                  transition: "width 0.35s ease, opacity 0.15s",
                }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: dash.color.ink, minWidth: 44, textAlign: "right" }}>
              {active && item.share != null ? `${item.share}%` : valueFormatter(item.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CapacityMeter({ booked = 0, capacity = 0, segments = 8 }) {
  const cap = Number(capacity) || 0;
  const taken = Number(booked) || 0;
  const ratio = cap > 0 ? Math.min(1, taken / cap) : 0;
  const filled = Math.round(ratio * segments);
  const color =
    ratio >= 1 ? dash.color.danger : ratio >= 0.8 ? dash.color.warning : dash.color.success;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 72 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 2,
              background: i < filled ? color : dash.color.cloud,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: dash.color.ash }}>
        {taken}/{cap || "—"}
      </div>
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS_DEFAULT = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function HeatStrip({
  cells = [],
  hours = HOURS_DEFAULT,
  weekdays = WEEKDAYS,
}) {
  const [tip, setTip] = useState(null);
  const map = useMemo(() => {
    const m = new Map();
    cells.forEach((c) => m.set(`${c.weekday}-${c.hour}`, Number(c.count) || 0));
    return m;
  }, [cells]);
  const max = Math.max(...[...map.values()], 1);

  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `36px repeat(${hours.length}, minmax(18px, 1fr))`,
          gap: 3,
          minWidth: 280,
        }}
      >
        <div />
        {hours.map((h) => (
          <div
            key={h}
            style={{
              fontSize: 9,
              color: dash.color.light,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {h % 12 || 12}
            {h < 12 ? "a" : "p"}
          </div>
        ))}
        {weekdays.map((day, di) => (
          <React.Fragment key={day}>
            <div style={{ fontSize: 11, color: dash.color.ash, fontWeight: 500, lineHeight: "18px" }}>
              {day}
            </div>
            {hours.map((h) => {
              const count = map.get(`${di}-${h}`) ?? map.get(`${day}-${h}`) ?? 0;
              const t = count / max;
              const bg =
                count === 0
                  ? dash.color.cloud
                  : `rgba(255, 56, 92, ${0.12 + t * 0.78})`;
              return (
                <div
                  key={`${day}-${h}`}
                  onMouseEnter={(e) =>
                    setTip({
                      x: e.currentTarget.offsetLeft,
                      y: e.currentTarget.offsetTop,
                      label: `${day} ${h % 12 || 12}${h < 12 ? "am" : "pm"} · ${count}`,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                  style={{
                    height: 18,
                    borderRadius: 3,
                    background: bg,
                    cursor: "default",
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {tip ? (
        <div
          style={{
            position: "absolute",
            left: tip.x,
            top: Math.max(0, tip.y - 28),
            background: dash.color.ink,
            color: "#fff",
            fontSize: 11,
            fontWeight: 500,
            padding: "4px 8px",
            borderRadius: 6,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          {tip.label}
        </div>
      ) : null}
    </div>
  );
}

export function TrendArea({
  data = [],
  height = 220,
  showNet = true,
  onToggleNet,
  rangeLabel,
  delta,
}) {
  const [hover, setHover] = useState(null);
  const gid = useId().replace(/:/g, "");
  const width = 640;
  const pad = { t: 16, r: 12, b: 28, l: 44 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const series = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const key = showNet ? "net_revenue" : "gross_revenue";
    const vals = rows.map((r) => Number(r[key] ?? r.gross_revenue) || 0);
    const max = Math.max(...vals, 1);
    return { rows, vals, max, key };
  }, [data, showNet]);

  const points = series.vals.map((v, i) => {
    const x = pad.l + (series.vals.length <= 1 ? innerW / 2 : (i / (series.vals.length - 1)) * innerW);
    const y = pad.t + innerH - (v / series.max) * innerH;
    return { x, y, v, row: series.rows[i] };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area =
    points.length > 0
      ? `${line} L${points[points.length - 1].x.toFixed(1)} ${pad.t + innerH} L${points[0].x.toFixed(1)} ${pad.t + innerH} Z`
      : "";

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (series.max / ticks) * (ticks - i));

  const handleMove = (e) => {
    if (!points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = points[0];
    let best = Infinity;
    points.forEach((p) => {
      const d = Math.abs(p.x - x);
      if (d < best) {
        best = d;
        nearest = p;
      }
    });
    setHover(nearest);
  };

  const deltaNum = Number(delta);
  const deltaPositive = Number.isFinite(deltaNum) && deltaNum >= 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          {rangeLabel ? (
            <span style={{ fontSize: 12, fontWeight: 500, color: dash.color.ash }}>{rangeLabel}</span>
          ) : null}
          {Number.isFinite(deltaNum) ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: deltaPositive ? dash.color.success : dash.color.danger,
              }}
            >
              {deltaPositive ? "+" : ""}
              {deltaNum.toFixed(1)}% vs last month
            </span>
          ) : null}
        </div>
        {typeof onToggleNet === "function" ? (
          <div
            style={{
              display: "flex",
              border: `1px solid ${dash.color.hairline}`,
              borderRadius: dash.radius.pill,
              overflow: "hidden",
            }}
          >
            {[
              { key: false, label: "Gross" },
              { key: true, label: "Net" },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                type="button"
                onClick={() => onToggleNet(opt.key)}
                style={{
                  border: "none",
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: showNet === opt.key ? dash.color.ink : dash.color.surface,
                  color: showNet === opt.key ? "#fff" : dash.color.ash,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
      >
        {yTicks.map((t, i) => {
          const y = pad.t + (i / ticks) * innerH;
          return (
            <g key={i}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={dash.color.hairline} strokeWidth="1" />
              <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill={dash.color.light}>
                {formatMoney(t)}
              </text>
            </g>
          );
        })}
        {series.rows.length > 1 &&
          [0, Math.floor(series.rows.length / 2), series.rows.length - 1].map((idx) => {
            const p = points[idx];
            const label = series.rows[idx]?.date;
            if (!p || !label) return null;
            return (
              <text key={idx} x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill={dash.color.light}>
                {String(label).slice(5)}
              </text>
            );
          })}
        {area && (
          <>
            <defs>
              <linearGradient id={`ta-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dash.chart.primary} stopOpacity="0.28" />
                <stop offset="100%" stopColor={dash.chart.primary} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#ta-${gid})`} />
          </>
        )}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={dash.chart.primary}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {hover && (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke={dash.color.ink}
              strokeDasharray="3 3"
              opacity="0.35"
            />
            <circle cx={hover.x} cy={hover.y} r="4" fill={dash.chart.primary} stroke="#fff" strokeWidth="2" />
            <g transform={`translate(${Math.min(hover.x + 8, width - 120)}, ${Math.max(hover.y - 36, 8)})`}>
              <rect width="112" height="32" rx="8" fill={dash.color.ink} />
              <text x="8" y="13" fontSize="10" fill="#fff" opacity="0.7">
                {hover.row?.date || ""}
              </text>
              <text x="8" y="26" fontSize="12" fontWeight="600" fill="#fff">
                {formatMoney(hover.v)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export { formatMoney as formatChartMoney };
