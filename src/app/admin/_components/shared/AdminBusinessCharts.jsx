"use client";

import React from "react";
import styled, { css } from "styled-components";
import { Card, Typography } from "antd";

const { Text } = Typography;

/** Aligned with business dashboard → Revenue / Overview chart styling */
export const BUSINESS_CHART_THEME = {
  border: "#f1f5f9",
  lightBg: "#f8fafc",
  textPrimary: "#111827",
  textSecondary: "#64748b",
  textMuted: "#9ca3af",
  chart: {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    teal: "#14b8a6",
    yellow: "#eab308",
    darkBlue: "#1e3a8a",
  },
};

export const PIE_COLORS_EXTENDED = [
  BUSINESS_CHART_THEME.chart.blue,
  BUSINESS_CHART_THEME.chart.green,
  BUSINESS_CHART_THEME.chart.purple,
  BUSINESS_CHART_THEME.chart.orange,
  BUSINESS_CHART_THEME.chart.red,
  BUSINESS_CHART_THEME.chart.teal,
];

export function getChartTotal(data, valueKey = "value") {
  if (!Array.isArray(data)) return 0;
  return data.reduce((sum, row) => sum + (Number(row?.[valueKey]) || 0), 0);
}

/** Donut / composed chart tooltip shell (business Revenue-style) */
export function AdminBusinessChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  formatItemValue,
}) {
  if (!active || !payload?.length) return null;
  const header = formatLabel ? formatLabel(label, payload) : label;
  return (
    <div
      style={{
        background: "white",
        padding: "12px 16px",
        border: `1px solid ${BUSINESS_CHART_THEME.border}`,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      {header != null && header !== "" && (
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {header}
        </Text>
      )}
      {payload.map((entry, index) => (
        <div
          key={entry.dataKey ?? index}
          style={{
            color: entry.color || BUSINESS_CHART_THEME.textPrimary,
            marginBottom: 4,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span style={{ color: BUSINESS_CHART_THEME.textSecondary }}>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {formatItemValue ? formatItemValue(entry) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export const BusinessChartInsightBadge = styled.div`
  background: ${BUSINESS_CHART_THEME.lightBg};
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: ${BUSINESS_CHART_THEME.textPrimary};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${BUSINESS_CHART_THEME.border};
  strong {
    color: #ff385c;
  }
`;

export const BusinessChartCard = styled(Card)`
  border-radius: 16px;
  border: 1px solid ${BUSINESS_CHART_THEME.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  ${(p) =>
    p.$autoHeight
      ? css`
          height: auto;
        `
      : css`
          height: ${typeof p.$height === "number" ? `${p.$height}px` : p.$height || "440px"};
        `}

  .ant-card-body {
    padding: ${(p) => (p.$compactBody ? "16px 20px" : "24px")} !important;
    display: flex;
    flex-direction: column;
    ${(p) =>
      !p.$autoHeight &&
      css`
        height: 100% !important;
      `}
  }
`;

export const BusinessChartSectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${(p) => (p.$dense ? "12px" : "20px")};
`;

export const BusinessChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const BusinessChartTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  letter-spacing: -0.1px;
`;

export const BusinessChartDescription = styled.p`
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  font-weight: 400;
`;

export const BusinessChartPlot = styled.div`
  flex-grow: 1;
  position: relative;
  min-height: 0;
  ${(p) => (p.$height != null ? `height: ${p.$height}px;` : "")}
`;

export const BusinessChartEmpty = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 0.7;
  align-items: center;
  justify-content: center;
  padding: ${(p) => p.$padding || "60px 20px"};
  text-align: center;
  gap: 16px;
`;

export const BusinessChartEmptyTitle = styled.div`
  color: ${BUSINESS_CHART_THEME.textSecondary};
  font-size: 15px;
  font-weight: 500;
`;

export const BusinessChartEmptyHint = styled.div`
  color: ${BUSINESS_CHART_THEME.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;
`;
