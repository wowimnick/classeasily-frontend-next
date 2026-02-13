"use client";

import { Suspense } from "react";
import ExploreHeader from "@/components/explore/ExploreHeader";
import BookingStatusClient from "./BookingStatusClient";

function StatusFallback() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "120px 24px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          padding: "32px 24px",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ margin: "0 0 8px 0", fontSize: "1.35rem", fontWeight: 600, color: "#111827" }}>
          Confirming your booking
        </h1>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "#6b7280" }}>Please wait…</p>
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <Suspense fallback={<StatusFallback />}>
        <BookingStatusClient />
      </Suspense>
    </>
  );
}
