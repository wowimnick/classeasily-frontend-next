"use client";

import { useEffect } from "react";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { ACCENT_DARK, BRAND_RED, HERO_MUTED } from "@/components/corporate/tokens";

export default function ShortlistSegmentError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <ExploreHeader showOptionsWrapper={false} />
      <div
        style={{
          width: "min(560px, 100% - 2rem)",
          margin: "0 auto",
          padding: "3rem 0 4rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: ACCENT_DARK, fontSize: "1.5rem", marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: HERO_MUTED, marginBottom: 24, lineHeight: 1.6 }}>
          We couldn&apos;t load this page. Please try again or use the link from your email.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            background: BRAND_RED,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "0.65rem 1.25rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
      <Footer />
    </div>
  );
}
