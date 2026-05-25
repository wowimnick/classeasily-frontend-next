"use client";

import React from "react";
import Link from "next/link";

export default class CheckoutErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[CheckoutErrorBoundary]", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { slug, fallbackHref = "/explore" } = this.props;
    const classHref = slug ? `/classes/${slug}` : fallbackHref;

    return (
      <div
        style={{
          maxWidth: 440,
          margin: "48px auto",
          padding: "32px 24px",
          textAlign: "center",
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "1.25rem", color: "#111827" }}>
          Something went wrong
        </h2>
        <p style={{ margin: "0 0 20px", color: "#6b7280", lineHeight: 1.5 }}>
          We couldn&apos;t load checkout. Your card was not charged again — return
          to the class page and try booking once more.
        </p>
        <Link
          href={classHref}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#ff385c",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to class
        </Link>
      </div>
    );
  }
}
