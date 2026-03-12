"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
`;

export const SkeletonBlock = styled.div`
  background: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e2e8f0 50%,
    #f1f5f9 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
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

export function AdminTableSkeleton({ rows = 5 }) {
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

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
`;

const QuickActionSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSkeletonWrapper = styled.div`
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  padding: 16px 20px;
  height: 280px;
  display: flex;
  flex-direction: column;
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
      <OverviewGrid style={{ marginBottom: 20 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <AdminCardSkeleton key={i} />
        ))}
      </OverviewGrid>

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
          <ChartSkeletonWrapper>
            <SkeletonBlock style={{ flex: 1, width: "100%", borderRadius: 8 }} />
          </ChartSkeletonWrapper>
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
