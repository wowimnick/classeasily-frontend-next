// This is now a SERVER COMPONENT - no "use client" directive
import React, { Suspense } from "react";
import ClientHeader from "../layout/ClientHeader";

function ExploreHeaderFallback() {
  return (
    <div
      style={{
        height: "80px",
        width: "100%",
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    />
  );
}

export default function ExploreHeader(props) {
  return (
    <Suspense fallback={<ExploreHeaderFallback />}>
      <ClientHeader {...props} />
    </Suspense>
  );
}
