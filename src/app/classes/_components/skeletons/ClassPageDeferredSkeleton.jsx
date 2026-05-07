"use client";

import React from "react";

/**
 * Suspense fallback for map + offers + reviews + host (matches section rhythm).
 */
export default function ClassPageDeferredSkeleton() {
  const card = {
    border: "1px solid #eaeaea",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  };
  return (
    <>
      <div
        style={{
          background: "white",
          borderRadius: 14,
          overflow: "hidden",
          height: 400,
          marginBottom: 8,
        }}
      >
        <div className="ce-skel" style={{ width: "100%", height: "100%", borderRadius: 14 }} />
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: "1rem", marginBottom: 8 }}>
        <div className="ce-skel" style={{ height: 32, width: 300, marginBottom: "1.5rem", borderRadius: 8 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ce-skel" style={{ height: 56, borderRadius: 12 }} />
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: "1rem", marginBottom: 8 }}>
        <div className="ce-skel" style={{ height: 32, width: 200, marginBottom: "1.5rem", borderRadius: 8 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={card}>
            <div style={{ display: "flex", gap: "0.875rem", marginBottom: "0.75rem" }}>
              <div className="ce-skel" style={{ width: 40, height: 40, borderRadius: "50%" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="ce-skel" style={{ height: 18, width: 150, borderRadius: 4 }} />
                <div className="ce-skel" style={{ height: 14, width: 100, borderRadius: 4 }} />
              </div>
            </div>
            <div className="ce-skel" style={{ height: 60, borderRadius: 6 }} />
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: "1rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", paddingBottom: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #eaeaea" }}>
          <div className="ce-skel" style={{ width: 80, height: 80, borderRadius: "50%" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ce-skel" style={{ height: 24, width: 200, borderRadius: 6 }} />
            <div className="ce-skel" style={{ height: 16, width: 150, borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
          <div className="ce-skel" style={{ height: 80, borderRadius: 12 }} />
          <div className="ce-skel" style={{ height: 80, borderRadius: 12 }} />
          <div className="ce-skel" style={{ height: 80, borderRadius: 12 }} />
        </div>
      </div>
    </>
  );
}

export function ClassSidebarBookingSkeleton() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: "18px 20px 20px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="ce-skel" style={{ height: 44, width: "55%", borderRadius: 9999, marginBottom: 4 }} />
      <div className="ce-skel" style={{ height: 20, width: 80, marginBottom: "1rem", borderRadius: 6 }} />
      <div className="ce-skel" style={{ height: 40, marginBottom: "1rem", borderRadius: 8 }} />
      <div className="ce-skel" style={{ height: 120, borderRadius: 8, marginBottom: "1rem" }} />
      <div className="ce-skel" style={{ height: 48, borderRadius: 14 }} />
    </div>
  );
}

export function MobileBookingFooterSkeletonBlocks() {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="ce-skel" style={{ height: 18, width: 100, borderRadius: 4, marginBottom: 4 }} />
        <div className="ce-skel" style={{ height: 12, width: 70, borderRadius: 4 }} />
      </div>
      <div className="ce-skel" style={{ height: 44, width: 96, borderRadius: 8 }} />
    </>
  );
}
