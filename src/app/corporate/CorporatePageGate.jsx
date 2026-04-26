"use client";

import dynamic from "next/dynamic";

/**
 * Load the corporate shell client-only so prerender never runs Ant Design / motion
 * (they touch `Date.now()` and break Next.js 16 static generation without this).
 */
const CorporatePageClient = dynamic(() => import("./CorporatePageClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: 15,
      }}
      aria-busy="true"
    >
      Loading…
    </div>
  ),
});

export default function CorporatePageGate() {
  return <CorporatePageClient />;
}
