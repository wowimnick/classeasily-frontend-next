"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

/** Sliding highlight — matches business dashboard skeleton feel (admin-tuned grays). */
const shimmerSweep = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

export const SkeletonBlock = styled.div`
  background: linear-gradient(90deg, #eceff4 0%, #f8fafc 45%, #e2e8f0 55%, #eceff4 100%);
  background-size: 2000px 100%;
  animation: ${shimmerSweep} 2s infinite linear;
  border-radius: 8px;
`;

const CardSkeletonWrapper = styled.div`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  min-height: 120px;
  @media (max-width: 768px) {
    min-height: 104px;
    padding: 16px;
  }
`;

/** Same grid as AdminMetricCards StatsGrid — standalone skeleton row (no StatCard wrapper). */
const MetricCardsSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
`;

export function AdminMetricCardsSkeleton({ count = 6 }) {
  return (
    <MetricCardsSkeletonGrid>
      {Array.from({ length: count }).map((_, i) => (
        <AdminCardSkeleton key={i} />
      ))}
    </MetricCardsSkeletonGrid>
  );
}

export function AdminCardSkeleton() {
  return (
    <CardSkeletonWrapper>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 10 }} />
      </div>
      <SkeletonBlock style={{ height: 13, width: "70%", borderRadius: 4 }} />
      <SkeletonBlock style={{ height: 22, width: "50%", borderRadius: 4 }} />
      <SkeletonBlock style={{ height: 12, width: "40%", borderRadius: 4 }} />
    </CardSkeletonWrapper>
  );
}

const TableSkeletonWrapper = styled.div`
  padding: 16px 0;
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

export function AdminTableSkeleton({ rows = 5, columns = null }) {
  if (columns != null && columns > 0) {
    return (
      <TableSkeletonWrapper>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: columns }).map((__, j) => (
              <SkeletonBlock
                key={j}
                style={{
                  height: j === columns - 1 ? 28 : 16,
                  flex: j === 0 ? 2.2 : 1,
                  minWidth: j === 0 ? 120 : 56,
                  maxWidth: j === columns - 1 ? 100 : "none",
                  borderRadius: 6,
                }}
              />
            ))}
          </TableRow>
        ))}
      </TableSkeletonWrapper>
    );
  }
  return (
    <TableSkeletonWrapper>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <SkeletonBlock style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <SkeletonBlock style={{ height: 14, width: "60%", borderRadius: 4 }} />
            <SkeletonBlock style={{ height: 12, width: "40%", borderRadius: 4 }} />
          </div>
          <SkeletonBlock style={{ height: 24, width: 80, borderRadius: 6 }} />
          <SkeletonBlock style={{ height: 24, width: 70, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: 32, height: 32, borderRadius: 8 }} />
        </TableRow>
      ))}
    </TableSkeletonWrapper>
  );
}

const BAR_WAVE = [38, 62, 44, 78, 52, 68, 41, 85, 56, 48, 72, 55, 64, 42, 75];

/** Line / area chart placeholder (shimmer bars + soft area). */
export function AdminAreaChartSkeleton({ height, fillParent }) {
  const boxStyle = fillParent
    ? { width: "100%", height: "100%", minHeight: 160, display: "flex", flexDirection: "column" }
    : {
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height || 240,
        display: "flex",
        flexDirection: "column",
      };
  return (
    <div style={boxStyle}>
      <div style={{ flex: 1, position: "relative", minHeight: 0, marginTop: 4 }}>
        <SkeletonBlock
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10,
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 6,
            right: 6,
            height: "58%",
            display: "flex",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          {BAR_WAVE.map((pct, i) => (
            <SkeletonBlock
              key={i}
              style={{
                flex: 1,
                height: `${pct}%`,
                borderRadius: 4,
                minHeight: 8,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Donut / pie chart placeholder. */
export function AdminPieChartSkeleton({ size = 168, fillParent }) {
  const wrapStyle = fillParent
    ? {
        width: "100%",
        height: "100%",
        minHeight: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    : { display: "flex", alignItems: "center", justifyContent: "center", padding: 12 };
  const s = size;
  return (
    <div style={wrapStyle}>
      <div style={{ position: "relative", width: s, height: s, flexShrink: 0 }}>
        <SkeletonBlock style={{ width: s, height: s, borderRadius: "50%" }} />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: s * 0.5,
            height: s * 0.5,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "inset 0 0 0 1px #f1f5f9",
          }}
        />
      </div>
    </div>
  );
}

/** Horizontal bar chart (e.g. provinces). */
export function AdminHorizontalBarChartSkeleton({ rows = 13, height = 360 }) {
  return (
    <div
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        flexDirection: "column",
        gap: 7,
        padding: "4px 4px 8px",
        justifyContent: "space-between",
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 20 }}>
          <SkeletonBlock style={{ width: 32, height: 12, flexShrink: 0, borderRadius: 4 }} />
          <SkeletonBlock
            style={{
              flex: 1,
              height: 16,
              borderRadius: 4,
              maxWidth: `${28 + ((i * 17) % 62)}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Ranked list (search demand, legend rows). */
export function AdminRankedListSkeleton({ rows = 12 }) {
  return (
    <div style={{ padding: "4px 2px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            gap: 12,
          }}
        >
          <SkeletonBlock style={{ height: 13, flex: 1, maxWidth: `${62 - (i % 4) * 6}%` }} />
          <SkeletonBlock style={{ height: 13, width: 36, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

const QuickActionSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FeedSkeletonWrapper = styled.div`
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  padding: 16px 20px;
  max-height: 260px;
`;

const ChartFeedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 12px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export function AdminOverviewSkeleton() {
  return (
    <>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
        <SkeletonBlock style={{ height: 24, width: 280, borderRadius: 6, marginBottom: 8 }} />
        <SkeletonBlock style={{ height: 14, width: 180, borderRadius: 4 }} />
      </div>

      <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 10 }}>
        Key metrics
      </div>
      <div style={{ marginBottom: 20 }}>
        <AdminMetricCardsSkeleton count={8} />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "20px 0" }} />

      <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 10 }}>
        Needs attention
      </div>
      <QuickActionSkeletonGrid style={{ marginBottom: 20 }}>
        {[1, 2, 3].map((i) => (
          <CardSkeletonWrapper key={i}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SkeletonBlock style={{ width: 34, height: 34, borderRadius: 9 }} />
                <div>
                  <SkeletonBlock style={{ height: 11, width: 100, borderRadius: 4, marginBottom: 6 }} />
                  <SkeletonBlock style={{ height: 18, width: 60, borderRadius: 4 }} />
                </div>
              </div>
              <SkeletonBlock style={{ width: 16, height: 16, borderRadius: 4 }} />
            </div>
          </CardSkeletonWrapper>
        ))}
      </QuickActionSkeletonGrid>

      <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "20px 0" }} />

      <ChartFeedGrid>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <SkeletonBlock style={{ height: 10, width: 50, borderRadius: 4, marginBottom: 4 }} />
              <SkeletonBlock style={{ height: 14, width: 140, borderRadius: 4 }} />
            </div>
            <SkeletonBlock style={{ height: 28, width: 160, borderRadius: 6 }} />
          </div>
          <div style={{ height: 280, minHeight: 280 }}>
            <AdminAreaChartSkeleton fillParent />
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 10 }}>
            <SkeletonBlock style={{ height: 10, width: 50, borderRadius: 4, marginBottom: 4 }} />
            <SkeletonBlock style={{ height: 14, width: 100, borderRadius: 4 }} />
          </div>
          <FeedSkeletonWrapper>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: i < 5 ? "1px solid #f1f5f9" : "none" }}>
                <SkeletonBlock style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock style={{ height: 12, width: "80%", borderRadius: 4, marginBottom: 4 }} />
                  <SkeletonBlock style={{ height: 11, width: "50%", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </FeedSkeletonWrapper>
        </div>
      </ChartFeedGrid>
    </>
  );
}

const FormSkeletonSection = styled.div`
  margin-bottom: 2rem;
`;

export function AdminFormSkeleton() {
  return (
    <div style={{ padding: "0 4px" }}>
      <FormSkeletonSection>
        <SkeletonBlock style={{ height: 20, width: 120, borderRadius: 4, marginBottom: 12 }} />
        <SkeletonBlock style={{ height: 40, width: "100%", borderRadius: 8, marginBottom: 16 }} />
        <SkeletonBlock style={{ height: 80, width: "100%", borderRadius: 8 }} />
      </FormSkeletonSection>
      <FormSkeletonSection>
        <SkeletonBlock style={{ height: 20, width: 140, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SkeletonBlock style={{ height: 40, borderRadius: 8 }} />
          <SkeletonBlock style={{ height: 40, borderRadius: 8 }} />
        </div>
      </FormSkeletonSection>
      <FormSkeletonSection>
        <SkeletonBlock style={{ height: 20, width: 100, borderRadius: 4, marginBottom: 12 }} />
        <SkeletonBlock style={{ height: 32, width: "60%", borderRadius: 8 }} />
      </FormSkeletonSection>
    </div>
  );
}

const DrawerContentSkeletonWrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export function AdminDrawerContentSkeleton() {
  return (
    <DrawerContentSkeletonWrapper>
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
        <SkeletonBlock style={{ width: 56, height: 56, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock style={{ height: 18, width: "70%", borderRadius: 4, marginBottom: 8 }} />
          <SkeletonBlock style={{ height: 14, width: "50%", borderRadius: 4 }} />
        </div>
      </div>
      <AdminTableSkeleton rows={4} />
    </DrawerContentSkeletonWrapper>
  );
}
